import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { searchTokens, getTokenByAddress, formatPairData } from "../lib/dexscreener.js";
import { getNewLaunches, getTokenByMint, formatTokenData, searchTokens as searchPumpfun } from "../lib/pumpfun.js";

export const tokenTools: Tool[] = [
  {
    name: "claude_trade_token_search",
    description: "Search for tokens on Solana by name or symbol. Returns price, volume, and market data from DexScreener.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Token name or symbol to search for (e.g., 'BONK', 'Jupiter')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "claude_trade_token_info",
    description: "Get detailed information about a specific token by its mint address.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Token mint address on Solana",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "claude_trade_token_new_launches",
    description: "Get the latest token launches on Pump.fun. Returns new meme coins and their market data.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of tokens to return (default: 10, max: 50)",
        },
      },
    },
  },
  {
    name: "claude_trade_token_pumpfun",
    description: "Get information about a Pump.fun token by its mint address.",
    inputSchema: {
      type: "object",
      properties: {
        mint: {
          type: "string",
          description: "Token mint address",
        },
      },
      required: ["mint"],
    },
  },
];

export async function handleTokenTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "claude_trade_token_search": {
      const query = args?.query as string;
      if (!query) {
        return {
          content: [{ type: "text", text: "Missing query parameter" }],
          isError: true,
        };
      }

      const [dexResults, pumpResults] = await Promise.all([
        searchTokens(query).catch(() => []),
        searchPumpfun(query).catch(() => []),
      ]);

      const formatted = [
        ...dexResults.slice(0, 5).map((p) => ({
          source: "dexscreener",
          ...formatPairData(p),
        })),
        ...pumpResults.slice(0, 5).map((t) => ({
          source: "pump.fun",
          ...formatTokenData(t),
        })),
      ];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    }

    case "claude_trade_token_info": {
      const address = args?.address as string;
      if (!address) {
        return {
          content: [{ type: "text", text: "Missing address parameter" }],
          isError: true,
        };
      }

      const [dexResults, pumpResult] = await Promise.all([
        getTokenByAddress(address).catch(() => []),
        getTokenByMint(address).catch(() => null),
      ]);

      const result: Record<string, unknown> = {};

      if (dexResults.length > 0) {
        result.dexscreener = formatPairData(dexResults[0]);
      }

      if (pumpResult) {
        result.pumpfun = formatTokenData(pumpResult);
      }

      if (Object.keys(result).length === 0) {
        return {
          content: [{ type: "text", text: "Token not found" }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "claude_trade_token_new_launches": {
      const limit = Math.min((args?.limit as number) || 10, 50);
      const tokens = await getNewLaunches(limit);

      const formatted = tokens.map(formatTokenData);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    }

    case "claude_trade_token_pumpfun": {
      const mint = args?.mint as string;
      if (!mint) {
        return {
          content: [{ type: "text", text: "Missing mint parameter" }],
          isError: true,
        };
      }

      const token = await getTokenByMint(mint);

      if (!token) {
        return {
          content: [{ type: "text", text: "Token not found on Pump.fun" }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formatTokenData(token), null, 2),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown token tool: ${name}` }],
        isError: true,
      };
  }
}
