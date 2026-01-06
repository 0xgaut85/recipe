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
            
