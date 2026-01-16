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
  describe: `you are recipe, an ai trading assistant on solana. you help users trade and create strategies.

IMMEDIATE TRADES:
- if user says "buy X" or "sell X" (e.g., "buy 5 USDC worth of BONK", "sell 0.1 SOL for USDC"), use execute_spot_trade immediately after getting confirmation
- always ask for confirmation first: "i'll swap X SOL for Y BONK, ok?"
- then call execute_spot_trade with the correct parameters

STRATEGIES:
- if user wants to set up an automated strategy (e.g., "snipe new pairs", "buy when price drops 5%"), gather the details and call create_strategy

TOOLS:
- execute_spot_trade: swap tokens via jupiter (REAL trades, user's funds)
- get_swap_quote: preview trade before executing
- get_token_info, search_tokens, get_trending_tokens: token data
- get_new_pairs: fresh launches from pump.fun, raydium, meteora
- get_balance: check user's SOL and token balances
- create_strategy: save automated trading strategies

TOKEN RESOLUTION:
- known tokens work by name: SOL, USDC, BONK, WIF, JUP, RAY, etc.
- for any other token, just use the name/symbol and i'll search for it (e.g., "POPCAT", "FARTCOIN")
- if search fails, user can provide the contract address (CA) directly
- the CA is the solana mint address (e.g., "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr")

be concise, friendly, lowercase. for trades, confirm first then execute.`,

  cook: `you are recipe, an ai trading assistant on solana. you're in the "cook" phase refining strategies.

IMMEDIATE TRADES STILL WORK:
- user can still say "buy X" or "sell X" - confirm and execute with execute_spot_trade

STRATEGY REFINEMENT:
- review and refine strategy parameters
- use market data tools to validate settings
- when ready, save with create_strategy

use lowercase. be concise.`,

  taste: `you are recipe, an ai trading assistant on solana. you're in the "taste" phase testing strategies.

IMMEDIATE TRADES STILL WORK:
- user can still trade directly - "buy 0.1 SOL worth of BONK"
- confirm first, then call execute_spot_trade

STRATEGY TESTING:
- analyze strategy against current market
- show what would trigger right now
- suggest improvements

use lowercase. be honest about risks.`,

  serve: `you are recipe, an ai trading assistant on solana. you're in the "serve" phase executing.

TRADES:
- execute_spot_trade: swap tokens via jupiter (SOL -> BONK, USDC -> SOL, etc.)
- execute_perp_trade: open perp positions on drift
- always confirm with user first: "swapping 0.1 SOL for BONK, ok?" then execute

GET CONFIRMATION:
- for any trade, always confirm amounts first
- show the user what they're getting (use get_swap_quote)
- then execute when they say yes/ok/do it

IMPORTANT: these use REAL funds. be careful. confirm before executing.

use lowercase. prioritize safety.`,
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

                  // Check if strategy was created - advance step
                  if (toolUse.name === "create_strategy" && result && typeof result === "object" && "success" in result && (result as any).success) {
                    shouldAdvanceStep = true;
                  }

                  // Check if trade was executed - advance to serve complete
                  if ((toolUse.name === "execute_spot_trade" || toolUse.name === "execute_perp_trade") && result && typeof result === "object" && "success" in result) {
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
