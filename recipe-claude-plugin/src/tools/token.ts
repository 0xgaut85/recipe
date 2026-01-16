/**
 * Token MCP Tools
 * Search tokens, get info, trending, new launches
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  searchTokens,
  getTokenInfo,
  getTrending,
  getNewLaunches,
} from "../lib/api.js";
import { getTokenPrice } from "../lib/jupiter.js";

export const tokenTools: Tool[] = [
  {
    name: "recipe_token_search",
    description:
      "Search for Solana tokens by name or symbol. Returns price, volume, liquidity, and market cap data.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Token name or symbol to search (e.g., 'BONK', 'Jupiter', 'WIF')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "recipe_token_info",
    description:
      "Get detailed information about a specific token by its mint address.",
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
    name: "recipe_token_trending",
    description:
      "Get trending tokens - hot movers, volume leaders, and new launches. Great for finding trading opportunities.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["hot", "volume", "new", "all"],
          description: "Category: 'hot' (gainers), 'volume' (high volume), 'new' (launches), 'all'",
        },
      },
    },
  },
  {
    name: "recipe_token_price",
    description:
      "Get the current USD price of a token. Supports symbols (SOL, BONK) or mint addresses.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token symbol (SOL, BONK, WIF) or mint address",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "recipe_token_new_launches",
    description:
      "Get the latest token launches on Pump.fun. Shows new memecoins with socials and market data.",
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
];

export async function handleTokenTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "recipe_token_search": {
      const query = args?.query as string;
      if (!query) {
        return {
          content: [{ type: "text", text: "Missing query parameter" }],
          isError: true,
        };
      }

      const results = await searchTokens(query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query,
              count: results.length,
              tokens: results.map((t) => ({
                symbol: t.symbol,
                name: t.name,
                address: t.address,
                price: `$${t.price.toFixed(t.price < 0.01 ? 8 : 4)}`,
                priceChange24h: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
                volume24h: `$${(t.volume24h / 1000000).toFixed(2)}M`,
                liquidity: `$${(t.liquidity / 1000).toFixed(0)}K`,
                marketCap: `$${(t.marketCap / 1000000).toFixed(2)}M`,
                dex: t.dex,
              })),
            }, null, 2),
          },
        ],
      };
    }

    case "recipe_token_info": {
      const address = args?.address as string;
      if (!address) {
        return {
          content: [{ type: "text", text: "Missing address parameter" }],
          isError: true,
        };
      }

      const token = await getTokenInfo(address);

      if (!token) {
        return {
          content: [{ type: "text", text: `Token not found: ${address}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              symbol: token.symbol,
              name: token.name,
              address: token.address,
              price: token.price,
              priceFormatted: `$${token.price.toFixed(token.price < 0.01 ? 8 : 4)}`,
              priceChange24h: `${token.priceChange24h >= 0 ? "+" : ""}${token.priceChange24h.toFixed(2)}%`,
              volume24h: token.volume24h,
              volume24hFormatted: `$${(token.volume24h / 1000000).toFixed(2)}M`,
              liquidity: token.liquidity,
              liquidityFormatted: `$${(token.liquidity / 1000).toFixed(0)}K`,
              marketCap: token.marketCap,
              marketCapFormatted: `$${(token.marketCap / 1000000).toFixed(2)}M`,
              dex: token.dex,
              chart: token.url,
            }, null, 2),
          },
        ],
      };
    }

    case "recipe_token_trending": {
      const category = (args?.category as string) || "all";

      try {
        const data = await getTrending();

        const result: Record<string, unknown> = { timestamp: data.timestamp };

        const formatToken = (t: { symbol: string; name: string; address: string; price: number; priceChange24h: number; volume24h: number }) => ({
          symbol: t.symbol,
          name: t.name,
          address: t.address,
          price: `$${t.price.toFixed(t.price < 0.01 ? 8 : 4)}`,
          change24h: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
          volume24h: `$${(t.volume24h / 1000000).toFixed(2)}M`,
        });

        if (category === "hot" || category === "all") {
          result.hotTokens = data.hotTokens.slice(0, 10).map(formatToken);
        }

        if (category === "volume" || category === "all") {
          result.volumeLeaders = data.volumeTokens.slice(0, 10).map(formatToken);
        }

        if (category === "new" || category === "all") {
          result.newLaunches = data.newLaunches.slice(0, 10).map((t) => ({
            symbol: t.symbol,
            name: t.name,
            address: t.address,
            price: `$${t.price.toFixed(t.price < 0.01 ? 8 : 4)}`,
            marketCap: `$${(t.marketCap / 1000).toFixed(0)}K`,
            age: t.ageMinutes ? `${t.ageMinutes} min` : "new",
          }));
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        // Fallback to pump.fun new launches
        const newTokens = await getNewLaunches(10);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                note: "Trending API unavailable, showing Pump.fun launches",
                newLaunches: newTokens.map((t) => ({
                  symbol: t.symbol,
                  name: t.name,
                  mint: t.mint,
                  marketCap: `$${(t.marketCap / 1000).toFixed(0)}K`,
                  twitter: t.twitter,
                  telegram: t.telegram,
                })),
              }, null, 2),
            },
          ],
        };
      }
    }

    case "recipe_token_price": {
      const token = args?.token as string;
      if (!token) {
        return {
          content: [{ type: "text", text: "Missing token parameter" }],
          isError: true,
        };
      }

      const price = await getTokenPrice(token);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              token: token.toUpperCase(),
              priceUSD: price,
              priceFormatted: `$${price.toFixed(price < 0.01 ? 8 : 4)}`,
            }, null, 2),
          },
        ],
      };
    }

    case "recipe_token_new_launches": {
      const limit = Math.min((args?.limit as number) || 10, 50);
      const tokens = await getNewLaunches(limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: tokens.length,
              source: "pump.fun",
              launches: tokens.map((t) => ({
                symbol: t.symbol,
                name: t.name,
                mint: t.mint,
                description: t.description?.slice(0, 100) + (t.description?.length > 100 ? "..." : ""),
                marketCap: `$${(t.marketCap / 1000).toFixed(0)}K`,
                isComplete: t.isComplete,
                createdAt: t.createdAt,
                socials: {
                  twitter: t.twitter,
                  telegram: t.telegram,
                  website: t.website,
                },
              })),
            }, null, 2),
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
