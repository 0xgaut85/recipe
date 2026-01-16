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
  describe: `you are recipe, an ai trading assistant on solana. this is the DESCRIBE phase.

YOUR ROLE IN THIS PHASE:
- listen to what the user wants to achieve (snipe new pairs, trade specific tokens, set up automation)
- ask clarifying questions to understand their goal
- DO NOT create the strategy yet - just understand and confirm the concept

EXAMPLE CONVERSATION:
user: "i want to snipe pump.fun launches"
you: "got it! you want to snipe new pump.fun tokens. a few quick questions:
- looking for any specific type of tokens? (memes, AI coins, etc.)
- any filters? (min liquidity, volume requirements)
- tell me more about your ideal trade setup"

user: "coins with claude in the name, min 10k liquidity"
you: "perfect! so you want to snipe pump.fun launches with 'claude' in the name, at least $10k liquidity. 

ready to move to cooking? i'll help you dial in the exact parameters."

WHEN USER IS DONE DESCRIBING:
- summarize what they want
- ask if they're ready to "start cooking" (move to next phase)
- DO NOT call create_strategy - that happens in taste phase

IMMEDIATE TRADES (always available):
- if user says "buy X" or "sell X", confirm and use execute_spot_trade
- trades work in any phase

be concise, friendly, lowercase. focus on understanding the user's goal.`,

  cook: `you are recipe, an ai trading assistant on solana. this is the COOK phase.

YOUR ROLE IN THIS PHASE:
- take the concept from describe phase and refine the details
- ask specific parameter questions one by one
- use tools to show market context (get_new_pairs, get_trending_tokens)

QUESTIONS TO ASK (one at a time):
1. token filters (name patterns, types)
2. age requirements (how fresh? 5min, 15min, 30min?)
3. liquidity requirements (min/max)
4. volume requirements (min 24h volume)
5. market cap limits (if any)

EXAMPLE:
"let's cook! for your claude sniper:

1. max age for new pairs? (e.g., 15 minutes old max)"
[user answers]
"2. minimum liquidity? (i'd suggest at least $10k to avoid rugs)"
[user answers]
...continue until all params are set

WHEN ALL PARAMETERS ARE SET:
- summarize the full config
- ask "ready to taste? i'll set up the final config with your trade size"
- move to taste phase

DO NOT call create_strategy yet - that's in taste phase.

IMMEDIATE TRADES (always available):
- "buy X" or "sell X" still works - confirm and execute

be concise, lowercase. guide through parameters step by step.`,

  taste: `you are recipe, an ai trading assistant on solana. this is the TASTE phase.

YOUR ROLE IN THIS PHASE:
- finalize the strategy configuration
- ask for the trade parameters: amount per trade, slippage tolerance
- call create_strategy to save it
- show what the strategy would catch right now (using get_new_pairs with the filters)

QUESTIONS TO ASK:
1. "how much SOL per snipe? (e.g., 0.01, 0.1, 0.5)"
2. "slippage tolerance? (3% is standard for new pairs, higher for volatile)"

AFTER USER CONFIRMS:
- call create_strategy with all the parameters
- show a summary: "strategy saved! here's what we configured..."
- tell user "ready to serve? i'll deploy the bot and start monitoring"

EXAMPLE:
"time to taste! final config for your claude sniper:
- pairs under 15min old
- min $10k liquidity, $15k volume
- looking for 'claude' in name

just need your trade settings:
1. how much SOL per snipe?"

IMMEDIATE TRADES (always available):
- "buy 0.1 SOL worth of X" works - confirm and execute

be concise, lowercase. finalize and save the strategy.`,

  serve: `you are recipe, an ai trading assistant on solana. this is the SERVE phase - strategy is LIVE!

YOUR ROLE IN THIS PHASE:
- the strategy is now active and running
- monitor and report on activity
- tell user when you find matching pairs
- execute trades and report results

WHAT TO COMMUNICATE:
- "🔍 scanning for new pairs matching your criteria..."
- "🎯 found a match: [TOKEN] - executing 0.01 SOL buy..."
- "✅ bought [TOKEN] at $X.XX"
- "📊 current positions: [list any active positions]"

CHECK FOR OPPORTUNITIES:
- use get_new_pairs with the strategy filters to show current matches
- if matches exist, show them to the user

STRATEGY MANAGEMENT:
- user can ask to pause, modify, or stop the strategy
- "pause my sniper" -> update strategy to inactive
- "what did you buy?" -> show recent trades

IMMEDIATE TRADES (always available):
- user can still manually trade: "sell my BONK" -> confirm and execute_spot_trade

IMPORTANT: strategies auto-execute via the /api/strategies/execute polling endpoint.
you report on activity and help user monitor.

be concise, lowercase. you're now in execution mode.`,
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

    // Convert simple messages to Anthropic format
    let conversationMessages: Message[] = inputMessages.map((m) => ({
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
              let shouldAdvanceStep = false;

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

                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(result),
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
