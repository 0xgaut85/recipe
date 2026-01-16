import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { toolDefinitions, executeTool } from "@/lib/claude-tools";
import { applyRateLimit, rateLimiters } from "@/lib/rate-limit";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TOOL_ITERATIONS = 10;

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
}

// Single unified system prompt - no more phase switching
const SYSTEM_PROMPT = `you are recipe, an ai trading assistant on solana.

CAPABILITIES:
- create trading strategies (snipers, spot trades, conditional triggers)
- execute immediate trades (buy/sell tokens)
- check token prices, market data, wallet balances
- manage existing strategies

STRATEGY CREATION FLOW:
1. user describes what they want
2. if anything is unclear, ask 1-2 questions (amount, filters, etc)
3. show the complete config summary
4. when user confirms (yes, yeah, do it, go, deploy, ok), call create_strategy tool
5. after tool succeeds, confirm strategy is live

IMMEDIATE TRADES:
if user says "buy X" or "sell X" directly, use execute_spot_trade tool immediately.

STRATEGY PARAMETERS (for snipers):
- amount (SOL) - REQUIRED
- maxAgeMinutes (default 30)
- minLiquidity (default $5k)
- minVolume (default $10k)
- minMarketCap (default $10k)
- nameFilter (optional - filter by token name)
- takeProfit % (optional)
- stopLoss % (optional)

WHEN SHOWING CONFIG:
"🎯 [strategy name]
- amount: X SOL
- max age: X min
- min liquidity: $Xk
- min volume: $Xk
- min mcap: $Xk
- name filter: [if any]
- take profit: X% / stop loss: X%

ready to deploy? say yes!"

WHEN USER CONFIRMS:
call create_strategy with all params. example:
{
  "name": "claude sniper",
  "description": "snipes new pairs with claude in name",
  "type": "SNIPER",
  "amount": 0.1,
  "maxAgeMinutes": 15,
  "minLiquidity": 5000,
  "minVolume": 20000,
  "minMarketCap": 15000,
  "nameFilter": "claude",
  "takeProfit": 100,
  "stopLoss": 30,
  "slippageBps": 300
}

AFTER STRATEGY CREATED:
"🚀 your [name] is now live! check the strategies panel (📊) to monitor it."

STYLE: be concise, lowercase, helpful, use emojis sparingly.`;

async function makeClaudeRequest(
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
      system: SYSTEM_PROMPT,
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
    const { messages: inputMessages } = body;

    if (!inputMessages) {
      return new Response(
        JSON.stringify({ error: "missing messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = await getCurrentUserId();

    // Filter out empty messages
    let conversationMessages: Message[] = inputMessages
      .filter((m) => {
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

            const response = await makeClaudeRequest(conversationMessages);

            const toolUses: ContentBlock[] = [];
            let aiResponseText = "";

            for (const block of response.content) {
              if (block.type === "text" && block.text) {
                aiResponseText += block.text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content: block.text })}\n\n`
                  )
                );
              } else if (block.type === "tool_use") {
                toolUses.push(block);
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

            // Detect progress based on conversation content
            const lowerText = aiResponseText.toLowerCase();
            
            // Progress: "cook" - AI showed strategy config
            if (lowerText.includes("🎯") || lowerText.includes("here's your strategy") || lowerText.includes("strategy config")) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ progress: "cook" })}\n\n`)
              );
            }
            
            // Progress: "taste" - AI asked for confirmation
            if (lowerText.includes("ready to deploy") || lowerText.includes("say yes") || lowerText.includes("ready to launch")) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ progress: "taste" })}\n\n`)
              );
            }

            if (toolUses.length > 0) {
              conversationMessages.push({
                role: "assistant",
                content: response.content,
              });

              const toolResults: ContentBlock[] = [];

              for (const toolUse of toolUses) {
                try {
                  const result = await executeTool(
                    toolUse.name!,
                    toolUse.input || {},
                    userId || undefined
                  );

                  // Progress: "serve" - strategy was created
                  if (toolUse.name === "create_strategy" && result && typeof result === "object" && "success" in result && (result as { success: boolean }).success) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ progress: "serve" })}\n\n`)
                    );
                  }

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_result",
                        tool: toolUse.name,
                        result,
                      })}\n\n`
                    )
                  );

                  const resultContent = result ? JSON.stringify(result) : JSON.stringify({ success: true });
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: resultContent,
                  });
                } catch (toolError) {
                  console.error(`Tool ${toolUse.name} error:`, toolError);

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_error",
                        tool: toolUse.name,
                        error: toolError instanceof Error ? toolError.message : "Tool execution failed",
                      })}\n\n`
                    )
                  );

                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: JSON.stringify({
                      error: toolError instanceof Error ? toolError.message : "Tool execution failed",
                    }),
                  });
                }
              }

              conversationMessages.push({
                role: "user",
                content: toolResults,
              });

              continueLoop = true;
            } else {
              continueLoop = false;
            }

            if (response.stop_reason === "end_turn") {
              continueLoop = false;
              
              // Progress: "describe" - AI responded to user's first message
              if (conversationMessages.length <= 2) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ progress: "describe" })}\n\n`)
                );
              }
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (error) {
          console.error("Chat stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "An error occurred",
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
