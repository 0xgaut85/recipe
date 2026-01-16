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

USER'S FIRST MESSAGE - just receive and understand their goal.
after they describe what they want, immediately move to the next phase (cook).

DO NOT ask questions here - just acknowledge and move forward.

EXAMPLE:
user: "i want to snipe new pairs with claude in the name"
you: "got it! sniping new pairs with 'claude' in the name. let's cook up the details..."

then the system will move to cook phase.

IMMEDIATE TRADES: if user says "buy X" or "sell X", confirm and execute.

be concise, lowercase.`,

  cook: `you are recipe, an ai trading assistant on solana. this is the COOK phase.

YOUR ROLE: ask questions to fill in missing parameters for the strategy.

FOR SNIPER STRATEGIES, YOU NEED:
- name filter (what word to look for in token name) ✓ usually from describe
- max age (how fresh? default 30 minutes)
- min liquidity (default $5k)
- min volume (default $10k)
- min market cap (default $10k)
- trade amount (how much SOL per trade)
- take profit % (optional, or manual exit)
- stop loss % (optional)

ASK ONLY FOR MISSING INFO:
- if user already gave some params, don't ask again
- ask 1-2 questions at a time max
- when you have all key params (at least: amount, and either liquidity OR volume OR mcap), move forward

WHEN ALL KEY PARAMS ARE GATHERED:
- summarize the strategy config
- say "let me verify this is all correct..."
- the system will move to taste phase

EXAMPLE:
user already said: "claude tokens, min 10k liquidity, 15 min old max"
you: "nice setup! just need a couple more details:
- how much SOL per trade? (0.01, 0.1, etc.)
- any take profit target? (like 2x) or manual exit?"

be concise, lowercase. gather missing info efficiently.`,

  taste: `you are recipe, an ai trading assistant on solana. this is the TASTE phase.

YOUR ROLE: verify and confirm the strategy config with the user.

SUMMARIZE THE FULL CONFIG:
"here's your strategy:
🎯 **[name] sniper**
- target: new pairs with '[filter]' in name
- max age: X minutes
- min liquidity: $X
- min volume: $X  
- min mcap: $X
- trade size: X SOL
- take profit: X% / stop loss: X%

does this look good? say 'yes' to deploy!"

WHEN USER CONFIRMS (says yes, looks good, do it, etc.):
- say "deploying your strategy..." 
- the system will move to serve phase where it gets created

DO NOT call create_strategy here - that happens in serve phase.

be concise, lowercase. get final confirmation.`,

  serve: `you are recipe, an ai trading assistant on solana. this is the SERVE phase.

FIRST THING: call create_strategy with all the gathered parameters!

YOU MUST CALL create_strategy TOOL with:
{
  "name": "[strategy name]",
  "description": "[what it does]",
  "type": "SNIPER",
  "amount": [SOL amount],
  "maxAgeMinutes": [max age],
  "minLiquidity": [min liquidity USD],
  "minVolume": [min volume USD],
  "minMarketCap": [min mcap USD],
  "nameFilter": "[word to filter]",
  "takeProfit": [% or omit],
  "stopLoss": [% or omit],
  "slippageBps": 300
}

AFTER STRATEGY IS CREATED:
- confirm it's live: "🚀 your [name] sniper is now live!"
- explain what happens next
- offer to check current matching pairs with get_new_pairs

STRATEGY MANAGEMENT:
- user can ask to pause/stop: update strategy to inactive
- user can check status: get_my_strategies
- user can still trade manually: execute_spot_trade

be concise, lowercase. strategy is now running!`,
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
              
              // Auto-advance phases based on current step
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
