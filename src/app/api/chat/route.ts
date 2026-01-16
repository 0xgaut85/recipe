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

YOUR ROLE: receive and understand what the user wants to build.

AFTER RECEIVING THEIR REQUEST:
1. Acknowledge what they want
2. If they gave ALL the key params (amount, filters, tp/sl), say "perfect, let me verify everything..."
3. If they're missing key info, say "got it! let me gather a few more details..."

KEY PARAMS TO CHECK FOR:
- trade amount (how much SOL)
- at least one filter (liquidity, volume, mcap, or name)
- optionally: take profit, stop loss

IMMEDIATE TRADES: if user says "buy X" or "sell X" (not a strategy), confirm and execute the trade directly.

be concise, lowercase.`,

  cook: `you are recipe, an ai trading assistant on solana. this is the COOK phase.

YOUR ROLE: gather any missing parameters for the strategy.

CHECK WHAT'S ALREADY PROVIDED and only ask for what's missing:
- trade amount (how much SOL per trade) - REQUIRED
- max age (how fresh? default 30 min)
- min liquidity (default $5k)
- min volume (default $10k)
- min market cap (default $10k)
- name filter (optional - word to look for)
- take profit % (optional)
- stop loss % (optional)

RULES:
- don't repeat info the user already gave
- ask 1-2 questions max at a time
- use sensible defaults for unspecified params

WHEN YOU HAVE ENOUGH INFO (at least amount + one filter):
say "got everything! here's your strategy config..." and summarize it.

be concise, lowercase.`,

  taste: `you are recipe, an ai trading assistant on solana. this is the TASTE phase.

YOUR ROLE: present the final strategy config and get confirmation.

SHOW THE FULL CONFIG:
"🎯 **[strategy name]**
- target: [what it's looking for]
- amount: [X] SOL per trade
- filters: [list all filters]
- take profit: [X%] / stop loss: [X%]

ready to deploy? say 'yes' to launch it!"

WHEN USER CONFIRMS:
say "deploying..." and the system will create it.

be concise, lowercase.`,

  serve: `you are recipe, an ai trading assistant on solana. this is the SERVE phase.

CRITICAL INSTRUCTION: YOU MUST CALL create_strategy TOOL FIRST.
Before saying ANYTHING about the strategy being live or deployed, you MUST call create_strategy.
DO NOT say "strategy is live" or "deployed" until AFTER the tool returns success.

Look at the conversation history and extract ALL parameters the user specified:
- strategy type (SPOT, SNIPER, or CONDITIONAL)
- trade amount
- tokens involved
- conditions/filters
- take profit / stop loss

Then call create_strategy with those parameters.

STRATEGY TYPES:
1. SNIPER - for new pair sniping with filters (name, age, liquidity, mcap)
2. SPOT - for token swaps (buy/sell specific tokens)
3. CONDITIONAL - for indicator-based triggers (buy when EMA crosses, RSI levels, price targets)

Example SNIPER call:
{
  "name": "claude sniper",
  "description": "Snipe new pairs with claude in name",
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

Example CONDITIONAL call:
{
  "name": "SOL EMA buy",
  "description": "Buy SOL when price touches 20 EMA on 1H",
  "type": "CONDITIONAL",
  "inputToken": "SOL",
  "amount": 1,
  "condition": {
    "indicator": "EMA",
    "period": 20,
    "timeframe": "1H",
    "trigger": "price_touches"
  }
}

Example SPOT call:
{
  "name": "Buy BONK",
  "description": "Buy 0.5 SOL worth of BONK",
  "type": "SPOT",
  "inputToken": "SOL",
  "outputToken": "BONK",
  "amount": 0.5,
  "direction": "buy"
}

ONLY after create_strategy returns success, tell user the strategy is live.
If it fails, tell user the error and offer to fix it.

be concise, lowercase.`,
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

    // Get the last user message to detect confirmations
    const lastUserMessage = inputMessages
      .filter((m) => m.role === "user")
      .pop();
    const lastUserText = typeof lastUserMessage?.content === "string" 
      ? lastUserMessage.content.toLowerCase() 
      : "";
    
    // Check if user is confirming (for phase advancement)
    const isConfirmation = /^(y|yes|yup|yeah|yep|yh|ok|okay|k|sure|do it|let'?s go|sounds good|perfect|confirmed?|deploy|go ahead|start|launch|ready|ship it|lfg)/i.test(lastUserText.trim());

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
            if (response.stop_reason === "end_turn" && !shouldAdvanceStep) {
              continueLoop = false;
              
              // Auto-advance phases based on current step
              // Only if we haven't already advanced due to tool execution
              if (step === "describe") {
                // describe -> cook: after first AI response
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ advanceToStep: "cook" })}\n\n`
                  )
                );
              } else if (step === "cook" && isConfirmation) {
                // cook -> taste: when user confirms params are complete
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ advanceToStep: "taste" })}\n\n`
                  )
                );
              } else if (step === "taste" && isConfirmation) {
                // taste -> serve: when user confirms final config
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ advanceToStep: "serve" })}\n\n`
                  )
                );
              }
            } else if (response.stop_reason === "end_turn") {
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
