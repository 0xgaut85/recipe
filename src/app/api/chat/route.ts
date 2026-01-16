import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { toolDefinitions, executeTool } from "@/lib/claude-tools";
import { applyRateLimit, rateLimiters } from "@/lib/rate-limit";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TOOL_ITERATIONS = 10; // Prevent infinite tool loops

interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

interface ChatRequest {
  messages: Message[];
  step: "describe" | "cook" | "taste" | "serve";
}

const systemPrompts: Record<string, string> = {
  describe: `you are recipe, an ai trading assistant on solana.

USER IS DESCRIBING THEIR STRATEGY. your job:
1. acknowledge what they want
2. summarize the key details you understood  
3. end with: "let's set up the details..."

EXAMPLE RESPONSE:
"got it! you want to snipe new pairs with 'claude' in the name, 0.1 SOL per trade, with 2x take profit and -30% stop loss. let's set up the details..."

IMMEDIATE TRADES: if user says "buy X" or "sell X" directly (not a strategy), use execute_spot_trade tool immediately.

always be concise, lowercase, helpful.`,

  cook: `you are recipe, an ai trading assistant on solana.

GATHERING STRATEGY PARAMETERS. check what's already provided:
- trade amount (SOL) - REQUIRED
- max age (default: 30 min)
- min liquidity (default: $5k)
- min volume (default: $10k)
- min mcap (default: $10k)
- name filter (optional)
- take profit % (optional)
- stop loss % (optional)

IF ALL KEY PARAMS ARE PROVIDED (at least: amount + one filter):
summarize the complete config and end with: "ready to deploy? just say yes!"

IF MISSING KEY INFO:
ask 1-2 specific questions to fill the gaps.

EXAMPLE (all params ready):
"perfect! here's your strategy:
🎯 claude sniper
- amount: 0.1 SOL per trade
- max age: 15 min
- min liquidity: $5k
- min volume: $20k
- min mcap: $15k
- take profit: 100% (2x)
- stop loss: -30%

ready to deploy? just say yes!"

always be concise, lowercase, helpful.`,

  taste: `you are recipe, an ai trading assistant on solana.

FINAL CONFIRMATION PHASE. your job:
1. if this is first message in taste phase, show the full strategy config
2. when user confirms (yes, do it, deploy, go, etc), IMMEDIATELY call create_strategy tool

SHOWING CONFIG (if not shown yet):
"🎯 [strategy name]
- amount: X SOL
- [list all filters]
- take profit: X% / stop loss: X%

ready to launch? say yes to deploy!"

WHEN USER CONFIRMS:
call create_strategy with all params:
{
  "name": "[descriptive name]",
  "description": "[what it does]",
  "type": "SNIPER",
  "amount": [number],
  "maxAgeMinutes": [number],
  "minLiquidity": [number],
  "minVolume": [number],
  "minMarketCap": [number],
  "nameFilter": "[string if any]",
  "takeProfit": [number if any],
  "stopLoss": [number if any],
  "slippageBps": 300
}

always be concise, lowercase.`,

  serve: `you are recipe, an ai trading assistant on solana.

STRATEGY IS NOW LIVE! your job:
1. confirm the strategy was created successfully
2. explain what it will do
3. tell user next steps

EXAMPLE:
"🚀 your claude sniper is now live!

it will automatically:
- scan for new pairs with 'claude' in the name
- buy 0.1 SOL when filters match
- sell at 2x profit or -30% loss

you can:
- view it in the strategies panel (📊 icon)
- pause or stop it anytime
- ask me about its status

happy trading! 🍳"

always be concise, lowercase, celebratory.`,
};

/**
 * Make a non-streaming request to Claude API
 * Used for tool result continuation
 */
async function makeClaudeRequest(
  systemPrompt: string,
  messages: Message[]
): Promise<{
  content: ContentBlock[];
  stop_reason: string;
}> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: toolDefinitions,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  // Apply rate limiting for chat (30 per minute)
  const rateLimitResult = applyRateLimit(request, rateLimiters.chat);
  if (rateLimitResult) {
    return rateLimitResult.response;
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "anthropic api key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const { messages: inputMessages, step } = body;

    if (!inputMessages || !step) {
      return new Response(
        JSON.stringify({ error: "missing messages or step" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = await getCurrentUserId();
    const systemPrompt = systemPrompts[step] || systemPrompts.describe;

    // Convert simple messages to Anthropic format, filtering out empty messages
    let conversationMessages: Message[] = inputMessages
      .filter((m) => {
        // Filter out messages with empty content
        if (!m.content) return false;
        if (typeof m.content === "string" && m.content.trim() === "") return false;
        if (Array.isArray(m.content) && m.content.length === 0) return false;
        return true;
      })
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let iterations = 0;
        let continueLoop = true;

        try {
          while (continueLoop && iterations < MAX_TOOL_ITERATIONS) {
            iterations++;

            // Make request to Claude
            const response = await makeClaudeRequest(
              systemPrompt,
              conversationMessages
            );

            // Process response content
            const toolUses: ContentBlock[] = [];
            let hasText = false;
            let shouldAdvanceStep = false;

            for (const block of response.content) {
              if (block.type === "text" && block.text) {
                hasText = true;
                // Stream text content to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content: block.text })}\n\n`
                  )
                );
              } else if (block.type === "tool_use") {
                toolUses.push(block);
                // Notify client about tool use
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_start",
                      tool: block.name,
                    })}\n\n`
                  )
                );
              }
            }

            // If there are tool uses, execute them and continue
            if (toolUses.length > 0) {
              // Add assistant message with tool uses
              conversationMessages.push({
                role: "assistant",
                content: response.content,
              });

              // Execute tools and collect results
              const toolResults: ContentBlock[] = [];

              for (const toolUse of toolUses) {
                try {
                  const result = await executeTool(
                    toolUse.name!,
                    toolUse.input || {},
                    userId || undefined
                  );

                  // Check if strategy was created - advance to serve
                  if (toolUse.name === "create_strategy" && result && typeof result === "object" && "success" in result && (result as any).success) {
                    // Strategy created - always advance to serve phase
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ advanceToStep: "serve" })}\n\n`
                      )
                    );
                    shouldAdvanceStep = true;
                  }

                  // Send tool result to client
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_result",
                        tool: toolUse.name,
                        result,
                      })}\n\n`
                    )
                  );

                  // Ensure tool result content is never empty
                  const resultContent = result ? JSON.stringify(result) : JSON.stringify({ success: true });
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: resultContent,
                  });
                } catch (toolError) {
                  console.error(`Tool ${toolUse.name} error:`, toolError);

                  // Send error to client
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_error",
                        tool: toolUse.name,
                        error:
                          toolError instanceof Error
                            ? toolError.message
                            : "Tool execution failed",
                      })}\n\n`
                    )
                  );

                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: JSON.stringify({
                      error:
                        toolError instanceof Error
                          ? toolError.message
                          : "Tool execution failed",
                    }),
                  });
                }
              }
              
              // Send step complete signal if strategy was created or trade executed
              if (shouldAdvanceStep) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ stepComplete: true })}\n\n`
                  )
                );
              }

              // Add user message with tool results
              conversationMessages.push({
                role: "user",
                content: toolResults,
              });

              // Continue loop to get Claude's response to tool results
              continueLoop = true;
            } else {
              // No tool uses, we're done
              continueLoop = false;
            }

            // Check stop reason
            if (response.stop_reason === "end_turn") {
              continueLoop = false;
              
              // Auto-advance phases (only if not already advanced via tool)
              if (!shouldAdvanceStep) {
                if (step === "describe") {
                  // describe -> cook: always advance after AI responds
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ advanceToStep: "cook" })}\n\n`
                    )
                  );
                } else if (step === "cook") {
                  // cook -> taste: check if AI's response indicates config is complete
                  // Look for phrases like "ready to deploy", "say yes", "confirm"
                  const aiText = response.content
                    .filter((b): b is { type: "text"; text: string } => b.type === "text" && !!b.text)
                    .map((b) => b.text)
                    .join(" ")
                    .toLowerCase();
                  
                  const configComplete = 
                    aiText.includes("ready to deploy") ||
                    aiText.includes("say yes") ||
                    aiText.includes("confirm to") ||
                    aiText.includes("ready to launch") ||
                    aiText.includes("just say yes");
                  
                  if (configComplete) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ advanceToStep: "taste" })}\n\n`
                      )
                    );
                  }
                }
                // taste -> serve happens via create_strategy tool call
                // serve is the final phase, no more advances
              }
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (error) {
          console.error("Chat stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "An error occurred",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
