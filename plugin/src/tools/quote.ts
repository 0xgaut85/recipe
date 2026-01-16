import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getQuote, formatQuote, TOKENS, resolveTokenSymbol } from "../lib/jupiter.js";

export const quoteTools: Tool[] = [
  {
    name: "recipe_quote_swap",
    description: "Get a swap quote from Jupiter aggregator. Shows expected output, price impact, and route. Supports token symbols (SOL, USDC, BONK, etc.) or mint addresses.",
    inputSchema: {
      type: "object",
      properties: {
        inputToken: {
          type: "string",
          description: "Input token symbol (e.g., 'SOL', 'USDC') or mint address",
        },
        outputToken: {
          type: "string",
          description: "Output token symbol (e.g., 'BONK', 'JUP') or mint address",
        },
        amount: {
          type: "number",
          description: "Amount of input token to swap",
        },
        slippage: {
          type: "number",
          description: "Slippage tolerance in percentage (default: 0.5)",
        },
      },
      required: ["inputToken", "outputToken", "amount"],
    },
  },
  {
    name: "recipe_quote_price",
    description: "Get the current price of a token in USD (via USDC quote).",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token symbol (e.g., 'SOL', 'BONK') or mint address",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "recipe_quote_tokens",
    description: "List common token addresses supported by the quote tool.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

function resolveToken(input: string): string {
  // Check if it's a known symbol
  const resolved = resolveTokenSymbol(input);
  if (resolved) return resolved;

  // Assume it's a mint address
  return input;
}

function getDecimals(token: string): number {
  // Common decimals for known tokens
  const decimalsMap: Record<string, number> = {
    [TOKENS.SOL]: 9,
    [TOKENS.USDC]: 6,
    [TOKENS.USDT]: 6,
    [TOKENS.BONK]: 5,
    [TOKENS.WIF]: 6,
    [TOKENS.JUP]: 6,
  };
  return decimalsMap[token] || 9;
}

export async function handleQuoteTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "recipe_quote_swap": {
      const inputToken = args?.inputToken as string;
      const outputToken = args?.outputToken as string;
      const amount = args?.amount as number;
      const slippage = (args?.slippage as number) || 0.5;

      if (!inputToken || !outputToken || !amount) {
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

      const inputMint = resolveToken(inputToken);
      const outputMint = resolveToken(outputToken);
      const inputDecimals = getDecimals(inputMint);
      const outputDecimals = getDecimals(outputMint);

      // Convert to smallest units
      const amountInSmallestUnits = Math.floor(
        amount * Math.pow(10, inputDecimals)
      );

      const quote = await getQuote(
        inputMint,
        outputMint,
        amountInSmallestUnits,
        Math.floor(slippage * 100)
      );

      if (!quote) {
        return {
          content: [{ type: "text", text: "Failed to get quote from Jupiter" }],
          isError: true,
        };
      }

      const formatted = formatQuote(quote, inputDecimals, outputDecimals);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                inputToken: inputToken.toUpperCase(),
                outputToken: outputToken.toUpperCase(),
                inputAmount: formatted.inputAmount,
                outputAmount: formatted.outputAmount,
                exchangeRate: formatted.exchangeRate,
                priceImpact: `${formatted.priceImpact.toFixed(4)}%`,
                slippage: `${formatted.slippage}%`,
                route: formatted.route,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "recipe_quote_price": {
      const token = args?.token as string;

      if (!token) {
        return {
          content: [{ type: "text", text: "Missing token parameter" }],
          isError: true,
        };
      }

      const tokenMint = resolveToken(token);
      const tokenDecimals = getDecimals(tokenMint);

      // Get price by quoting 1 token → USDC
      const oneToken = Math.pow(10, tokenDecimals);
      const quote = await getQuote(tokenMint, TOKENS.USDC, oneToken);

      if (!quote) {
        return {
          content: [{ type: "text", text: "Failed to get price quote" }],
          isError: true,
        };
      }

      const usdcAmount = parseInt(quote.outAmount) / 1e6; // USDC has 6 decimals

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                token: token.toUpperCase(),
                priceUSD: usdcAmount,
                priceFormatted: `$${usdcAmount.toFixed(6)}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "recipe_quote_tokens": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                description: "Common tokens supported by symbol",
                tokens: Object.entries(TOKENS).map(([symbol, address]) => ({
                  symbol,
                  address,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown quote tool: ${name}` }],
        isError: true,
      };
  }
}
