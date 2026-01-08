/**
 * Trade MCP Tools
 * Get quotes and execute swaps - matches main app's trading functionality
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  getQuote,
  executeSwap,
  listTokens,
  resolveTokenMintWithSearch,
} from "../lib/jupiter.js";
import { loadWallet, getSolBalance } from "../lib/wallet.js";

export const tradeTools: Tool[] = [
  {
    name: "claude_trade_swap_quote",
    description:
      "Get a swap quote from Jupiter aggregator. Shows expected output, price impact, and route. Use this before executing a swap to preview the trade.",
    inputSchema: {
      type: "object",
      properties: {
        inputToken: {
          type: "string",
          description: "Input token symbol (SOL, USDC, BONK), name, or mint address",
        },
        outputToken: {
          type: "string",
          description: "Output token symbol, name, or mint address",
        },
        amount: {
          type: "number",
          description: "Amount of input token to swap",
        },
        slippageBps: {
          type: "number",
          description: "Slippage tolerance in basis points (default: 50 = 0.5%)",
        },
      },
      required: ["inputToken", "outputToken", "amount"],
    },
  },
  {
    name: "claude_trade_swap_execute",
    description:
      "Execute a token swap using your local wallet. WARNING: This uses real funds! Make sure your wallet has enough balance.",
    inputSchema: {
      type: "object",
      properties: {
        inputToken: {
          type: "string",
          description: "Input token symbol (SOL, USDC, BONK), name, or mint address",
        },
        outputToken: {
          type: "string",
          description: "Output token symbol, name, or mint address",
        },
        amount: {
          type: "number",
          description: "Amount of input token to swap",
        },
        slippageBps: {
          type: "number",
          description: "Slippage tolerance in basis points (default: 100 = 1%)",
        },
      },
      required: ["inputToken", "outputToken", "amount"],
    },
  },
  {
    name: "claude_trade_quick_buy",
    description:
      "Quick buy a token using SOL. Simplified version of swap - just specify the token and SOL amount. WARNING: Uses real funds!",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token to buy - symbol, name, or mint address",
        },
        solAmount: {
          type: "number",
          description: "Amount of SOL to spend",
        },
        slippageBps: {
          type: "number",
          description: "Slippage tolerance in basis points (default: 100 = 1%)",
        },
      },
      required: ["token", "solAmount"],
    },
  },
  {
    name: "claude_trade_quick_sell",
    description:
      "Quick sell a token for SOL. Simplified version of swap - just specify the token and amount to sell. WARNING: Uses real funds!",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token to sell - symbol, name, or mint address",
        },
        amount: {
          type: "number",
          description: "Amount of the token to sell",
        },
        slippageBps: {
          type: "number",
          description: "Slippage tolerance in basis points (default: 100 = 1%)",
        },
      },
      required: ["token", "amount"],
    },
  },
  {
    name: "claude_trade_tokens_list",
    description:
      "List common token symbols and their mint addresses. Useful for finding tokens to trade.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function handleTradeTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "claude_trade_swap_quote": {
      const inputTokenArg = args?.inputToken as string;
      const outputTokenArg = args?.outputToken as string;
      const amount = args?.amount as number;
      const slippageBps = args?.slippageBps as number | undefined;
      const slippage = (args?.slippage as number) || 0.5;

      if (!inputTokenArg || !outputTokenArg || !amount) {
        return {
          content: [
            {
              type: "text",
              text: "Missing required parameters: inputToken, outputToken, amount",
            },
          ],
          isError: true,
        };
      }

      try {
        // Use smart token resolution
        const inputToken = await resolveTokenMintWithSearch(inputTokenArg);
        const outputToken = await resolveTokenMintWithSearch(outputTokenArg);

        if (!inputToken) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find token: ${inputTokenArg}. Try using the contract address (CA).`,
              },
            ],
            isError: true,
          };
        }

        if (!outputToken) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find token: ${outputTokenArg}. Try using the contract address (CA).`,
              },
            ],
            isError: true,
          };
        }

        const slippageValue = slippageBps || Math.floor(slippage * 100);
        const quote = await getQuote(
          inputToken.address,
          outputToken.address,
          amount,
          slippageValue
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  inputToken: inputToken.symbol,
                  outputToken: outputToken.symbol,
                  inputAmount: quote.inputAmount,
                  outputAmount: quote.outputAmount,
                  exchangeRate: quote.exchangeRate.toFixed(6),
                  priceImpact: `${quote.priceImpact.toFixed(4)}%`,
                  slippage: `${slippageValue / 100}%`,
                  route: quote.route,
                  ready: "Use claude_trade_swap_execute with same parameters to trade",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Failed to get quote",
                  message: error instanceof Error ? error.message : "Unknown error",
                  suggestion: "Check that both tokens exist and have liquidity",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "claude_trade_swap_execute": {
      const inputTokenArg = args?.inputToken as string;
      const outputTokenArg = args?.outputToken as string;
      const amount = args?.amount as number;
      const slippageBps = args?.slippageBps as number | undefined;
      const slippage = (args?.slippage as number) || 1; // Default 1% for memecoins

      if (!inputTokenArg || !outputTokenArg || !amount) {
        return {
          content: [
            {
              type: "text",
              text: "Missing required parameters: inputToken, outputToken, amount",
            },
          ],
          isError: true,
        };
      }

      // Check wallet exists
      const wallet = loadWallet();
      if (!wallet) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "No wallet found",
                  solution: "Use claude_trade_wallet_create to generate a wallet first",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      try {
        // Use smart token resolution
        const inputToken = await resolveTokenMintWithSearch(inputTokenArg);
        const outputToken = await resolveTokenMintWithSearch(outputTokenArg);

        if (!inputToken) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find token: ${inputTokenArg}. Please provide the contract address (CA).`,
              },
            ],
            isError: true,
          };
        }

        if (!outputToken) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find token: ${outputTokenArg}. Please provide the contract address (CA).`,
              },
            ],
            isError: true,
          };
        }

        // Check balance for SOL swaps
        if (inputToken.symbol.toUpperCase() === "SOL" || inputToken.symbol.toUpperCase() === "WSOL") {
          const balance = await getSolBalance(wallet.publicKey);
          if (balance < amount + 0.01) {
            // Leave some for fees
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Insufficient SOL balance",
                      required: amount + 0.01,
                      available: balance,
                      solution: `Send at least ${(amount + 0.01 - balance).toFixed(4)} more SOL to ${wallet.publicKey}`,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }
        }

        const slippageValue = slippageBps || Math.floor(slippage * 100);
        const result = await executeSwap(
          inputToken.address,
          outputToken.address,
          amount,
          slippageValue
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  signature: result.signature,
                  inputToken: inputToken.symbol,
                  outputToken: outputToken.symbol,
                  inputAmount: result.inputAmount,
                  outputAmount: result.outputAmount,
                  priceImpact: `${result.priceImpact.toFixed(4)}%`,
                  explorerUrl: result.explorerUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Swap failed",
                  message: error instanceof Error ? error.message : "Unknown error",
                  suggestion: "Check your balance, slippage settings, and try again",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "claude_trade_quick_buy": {
      const tokenArg = args?.token as string;
      const solAmount = args?.solAmount as number;
      const slippageBps = (args?.slippageBps as number) || 100;

      if (!tokenArg || !solAmount) {
        return {
          content: [
            {
              type: "text",
              text: "Missing required parameters: token, solAmount",
            },
          ],
          isError: true,
        };
      }

      // Check wallet exists
      const wallet = loadWallet();
      if (!wallet) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "No wallet found",
                  solution: "Use claude_trade_wallet_create to generate a wallet first",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      try {
        // Check SOL balance
        const balance = await getSolBalance(wallet.publicKey);
        if (balance < solAmount + 0.01) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Insufficient SOL balance",
                    required: solAmount + 0.01,
                    available: balance,
                    solution: `Send at least ${(solAmount + 0.01 - balance).toFixed(4)} more SOL to ${wallet.publicKey}`,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        // Resolve the token
        const outputToken = await resolveTokenMintWithSearch(tokenArg);
        if (!outputToken) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find token: ${tokenArg}. Please provide the contract address (CA).`,
              },
            ],
            isError: true,
          };
        }

        // Execute buy (SOL -> Token)
        const result = await executeSwap(
          "SOL",
          outputToken.address,
          solAmount,
          slippageBps
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  action: "BUY",
                  signature: result.signature,
                  spent: `${result.inputAmount} SOL`,
                  received: `${result.outputAmount} ${outputToken.symbol}`,
                  priceImpact: `${result.priceImpact.toFixed(4)}%`,
                  explorerUrl: result.explorerUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Buy failed",
                  message: error instanceof Error ? error.message : "Unknown error",
                  suggestion: "Check your balance, slippage settings, and try again",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "claude_trade_quick_sell": {
      const tokenArg = args?.token as string;
      const amount = args?.amount as number;
      const slippageBps = (args?.slippageBps as number) || 100;

      if (!tokenArg || !amount) {
        return {
          content: [
            {
              type: "text",
              text: "Missing required parameters: token, amount",
            },
          ],
          isError: true,
        };
      }

      // Check wallet exists
      const wallet = loadWallet();
      if (!wallet) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "No wallet found",
                  solution: "Use claude_trade_wallet_create to generate a wallet first",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      try {
        // Resolve the token
        const inputToken = await resolveTokenMintWithSearch(tokenArg);
        if (!inputToken) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find token: ${tokenArg}. Please provide the contract address (CA).`,
              },
            ],
            isError: true,
          };
        }

        // Execute sell (Token -> SOL)
        const result = await executeSwap(
          inputToken.address,
          "SOL",
          amount,
          slippageBps
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  action: "SELL",
                  signature: result.signature,
                  sold: `${result.inputAmount} ${inputToken.symbol}`,
                  received: `${result.outputAmount} SOL`,
                  priceImpact: `${result.priceImpact.toFixed(4)}%`,
                  explorerUrl: result.explorerUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Sell failed",
                  message: error instanceof Error ? error.message : "Unknown error",
                  suggestion: "Check your token balance, slippage settings, and try again",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "claude_trade_tokens_list": {
      const tokens = listTokens();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              description: "Common tokens you can trade by symbol",
              tokens,
              note: "You can also use any valid Solana mint address",
            }, null, 2),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown trade tool: ${name}` }],
        isError: true,
      };
  }
}
