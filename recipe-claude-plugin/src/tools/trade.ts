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
    name: "recipe_swap_quote",
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
    name: "recipe_swap_execute",
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
    name: "recipe_tokens_list",
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
    case "recipe_swap_quote": {
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
                  ready: "Use recipe_swap_execute with same parameters to trade",
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

    case "recipe_swap_execute": {
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
                  solution: "Use recipe_wallet_create to generate a wallet first",
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

    case "recipe_tokens_list": {
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
