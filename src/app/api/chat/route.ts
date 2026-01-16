import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { toolDefinitions, executeTool } from "@/lib/claude-tools";
import { applyRateLimit, rateLimiters } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

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

interface ParsedStrategyConfig {
  name: string;
  description: string;
  amount: number;
  maxAgeMinutes: number;
  minLiquidity: number;
  minVolume: number;
  minMarketCap: number;
  nameFilter?: string;
  takeProfit?: number;
  stopLoss?: number;
}

// Single unified system prompt
const SYSTEM_PROMPT = `you are recipe, an ai trading assistant on solana.

CAPABILITIES:
- create trading strategies (snipers, spot trades, conditional triggers)
- execute immediate trades (buy/sell tokens)
- check token prices, market data, wallet balances
- manage existing strategies

STRATEGY CREATION FLOW:
1. user describes what they want
2. if anything is unclear, ask 1-2 questions (amount, filters, etc)
3. show the complete config summary with this EXACT format:

🎯 [strategy name]
- amount: X SOL
- max age: X min
- min liquidity: $Xk
- min volume: $Xk
- min mcap: $Xk
- name filter: [filter text]
- take profit: X% / stop loss: X%

ready to deploy? say yes!

4. when user confirms, the system will automatically create the strategy
5. confirm strategy is live after user says yes

IMMEDIATE TRADES:
if user says "buy X" or "sell X" directly, use execute_spot_trade tool immediately.

IMPORTANT: Always use the exact config format above so the system can parse it.

STYLE: be concise, lowercase, helpful, use emojis sparingly.`;

// Check if user message is a confirmation to deploy strategy
// Must be strict - only exact matches or clear confirmations
function isConfirmation(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  // Exact single-word matches
  const exactMatches = ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "go", "deploy", "confirm", "launch"];
  if (exactMatches.includes(lower)) return true;
  
  // Exact phrase matches
  const phraseMatches = [
    "do it", "let's go", "lets go", "yes please", "yes deploy",
    "ship it", "send it", "execute", "start it", "run it", "make it",
    "yes create it", "create it", "deploy it", "launch it"
  ];
  if (phraseMatches.includes(lower)) return true;
  
  return false;
}

// Check if strategy was already created in this conversation
function alreadyHasStrategy(messages: Message[]): boolean {
  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    const content = typeof msg.content === "string" 
      ? msg.content 
      : msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    
    // Check for strategy ID patterns that indicate it was already created
    if (content.includes("strategy id:") || 
        content.includes("strategyId:") ||
        content.includes("strategy ID:") ||
        content.match(/cmk[a-z0-9]{20,}/i)) { // Prisma CUID pattern
      return true;
    }
  }
  return false;
}

// Helper to parse money values like "$5k", "$20", "$15k"
function parseMoneyValue(text: string, fieldName: string, defaultValue: number): number {
  // Match patterns like "min liquidity: $5k" or "min volume: $20"
  const regex = new RegExp(`${fieldName}:\\s*\\$?([\\d.]+)(k)?`, 'i');
  const match = text.match(regex);
  if (!match) return defaultValue;
  const value = parseFloat(match[1]);
  const hasK = match[2]?.toLowerCase() === 'k';
  return hasK ? value * 1000 : value;
}

// Parse strategy config from AI message
function parseStrategyConfig(messages: Message[]): ParsedStrategyConfig | null {
  // Find the last assistant message with strategy config
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    
    const content = typeof msg.content === "string" 
      ? msg.content 
      : msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    
    // Check if this message contains a strategy config
    if (!content.includes("🎯") && !content.toLowerCase().includes("ready to deploy")) continue;
    
    try {
      // Extract strategy name (after 🎯)
      const nameMatch = content.match(/🎯\s*([^\n]+)/);
      const name = nameMatch ? nameMatch[1].trim() : "unnamed strategy";
      
      // Extract amount (number before SOL)
      const amountMatch = content.match(/amount:\s*([\d.]+)\s*sol/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0.1;
      
      // Extract max age (number before min)
      const ageMatch = content.match(/max age:\s*(\d+)\s*min/i);
      const maxAgeMinutes = ageMatch ? parseInt(ageMatch[1]) : 30;
      
      // Extract money values with proper k handling
      const minLiquidity = parseMoneyValue(content, "min liquidity", 5000);
      const minVolume = parseMoneyValue(content, "min volume", 10000);
      const minMarketCap = parseMoneyValue(content, "min mcap", 10000);
      const maxMarketCap = parseMoneyValue(content, "max mcap", 0);
      
      // Extract name filter (handle quoted and unquoted)
      const filterMatch = content.match(/name filter:\s*"?([^"\n-]+)"?/i);
      let nameFilter = filterMatch ? filterMatch[1].trim() : undefined;
      if (nameFilter === "none" || nameFilter === "N/A") nameFilter = undefined;
      
      // Extract take profit (X% or "none")
      const tpMatch = content.match(/take profit:\s*(\d+)%/i);
      const takeProfit = tpMatch ? parseInt(tpMatch[1]) : undefined;
      
      // Extract stop loss (X% or "none")  
      const slMatch = content.match(/stop loss:?\s*-?(\d+)%/i);
      const stopLoss = slMatch ? parseInt(slMatch[1]) : undefined;
      
      console.log("Parsed strategy config:", {
        name, amount, maxAgeMinutes, minLiquidity, minVolume, minMarketCap, maxMarketCap, nameFilter, takeProfit, stopLoss
      });
      
      // Validate we have minimum required fields
      if (amount > 0) {
        return {
          name,
          description: `Sniper strategy: ${name}`,
          amount,
          maxAgeMinutes,
          minLiquidity,
          minVolume,
          minMarketCap,
          nameFilter,
          takeProfit,
          stopLoss,
        };
      }
    } catch (e) {
      console.error("Error parsing strategy config:", e);
    }
  }
  
  return null;
}

// Create strategy directly in database
async function createStrategyDirectly(userId: string, config: ParsedStrategyConfig): Promise<{ success: boolean; strategyId?: string; error?: string }> {
  try {
    const strategy = await prisma.strategy.create({
      data: {
        userId,
        name: config.name,
        description: config.description,
        isActive: true,
        config: {
          type: "SNIPER",
          amount: config.amount,
          maxAgeMinutes: config.maxAgeMinutes,
          minLiquidity: config.minLiquidity,
          minVolume: config.minVolume,
          minMarketCap: config.minMarketCap,
          nameFilter: config.nameFilter,
          takeProfit: config.takeProfit,
          stopLoss: config.stopLoss,
          slippageBps: 300,
        },
      },
    });
    
    return { success: true, strategyId: strategy.id };
  } catch (error) {
    console.error("Error creating strategy:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create strategy" };
  }
}

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

    // Check if user just confirmed a strategy deployment
    const lastUserMsg = conversationMessages.filter(m => m.role === "user").pop();
    let strategyCreated = false;
    let strategyResult: { success: boolean; strategyId?: string; error?: string } | null = null;

    if (lastUserMsg && typeof lastUserMsg.content === "string" && isConfirmation(lastUserMsg.content)) {
      // Check if strategy was already created in this conversation
      if (alreadyHasStrategy(conversationMessages)) {
        console.log("Strategy already exists in conversation, skipping creation");
      } else {
        // Try to parse and create strategy directly
        const config = parseStrategyConfig(conversationMessages);
        if (config && userId) {
          console.log("Creating strategy with config:", config);
          strategyResult = await createStrategyDirectly(userId, config);
          strategyCreated = strategyResult.success;
          console.log("Strategy creation result:", strategyResult);
        } else {
          console.log("Could not parse strategy config or no userId", { hasConfig: !!config, hasUserId: !!userId });
        }
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        let iterations = 0;
        let continueLoop = true;

        try {
          // If strategy was just created, modify the conversation to tell Claude
          if (strategyCreated && strategyResult) {
            // Generate tool ID once and reuse it
            const toolId = "auto_create_" + Date.now();
            
            // Add a system message telling Claude the strategy was created
            const modifiedMessages: Message[] = [
              ...conversationMessages,
              {
                role: "assistant" as const,
                content: [
                  {
                    type: "tool_use" as const,
                    id: toolId,
                    name: "create_strategy",
                    input: {},
                  }
                ],
              },
              {
                role: "user" as const,
                content: [
                  {
                    type: "tool_result" as const,
                    tool_use_id: toolId,
                    content: JSON.stringify({
                      success: true,
                      strategyId: strategyResult.strategyId,
                      message: "Strategy created successfully! Tell the user it's now live and show the strategy ID.",
                    }),
                  }
                ],
              },
            ];
            conversationMessages = modifiedMessages;
            
            // Send progress signal
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ progress: "serve" })}\n\n`)
            );
          }

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

                  // Progress: "serve" - strategy was created via tool
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
