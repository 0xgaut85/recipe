/**
 * Token MCP Tools
 * Search tokens, get info, trending, new launches, OHLCV, indicators
 * Matches main app's claude-tools.ts functionality
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  searchTokens,
  getTokenInfo,
  getTrending,
  getNewLaunches,
  getOHLCV,
  getNewPairs,
  getPairDetails,
  advancedSearchTokens,
  TimeFrame,
} from "../lib/api.js";
import { getTokenPrice, resolveToken, isSolanaAddress } from "../lib/jupiter.js";

export const tokenTools: Tool[] = [
  {
    name: "recipe_token_search",
    description:
      "Search for tokens by name, symbol, or apply advanced filters. Can filter by first letter, market cap range, liquidity, volume, holders, and more.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Search keyword (token name or symbol)",
        },
        symbolStartsWith: {
          type: "string",
          description: "Filter tokens where symbol starts with this letter/string (e.g., 'A' for all tokens starting with A)",
        },
        nameContains: {
          type: "string",
          description: "Filter tokens where name contains this string",
        },
        minMarketCap: {
          type: "number",
          description: "Minimum market cap in USD",
        },
        maxMarketCap: {
          type: "number",
          description: "Maximum market cap in USD",
        },
        minLiquidity: {
          type: "number",
          description: "Minimum liquidity in USD",
        },
        maxLiquidity: {
          type: "number",
          description: "Maximum liquidity in USD",
        },
        minVolume24h: {
          type: "number",
          description: "Minimum 24h volume in USD",
        },
        minHolders: {
          type: "number",
          description: "Minimum number of holders",
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 20)",
        },
      },
    },
  },
  {
    name: "recipe_token_info",
    description:
      "Get price, volume, liquidity, and other info for a token by its mint address or symbol.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token mint address or symbol (e.g., 'SOL', 'BONK', or a mint address)",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "recipe_get_ohlcv",
    description:
      "Get OHLCV (Open, High, Low, Close, Volume) candle data for technical analysis.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token mint address",
        },
        timeframe: {
          type: "string",
          enum: ["1m", "5m", "15m", "1H", "4H", "1D"],
          description: "Candle timeframe",
        },
        limit: {
          type: "number",
          description: "Number of candles to fetch (default: 100)",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "recipe_calculate_ema",
    description:
      "Calculate EMA (Exponential Moving Average) for a token and check if price is above/below it.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token mint address",
        },
        period: {
          type: "number",
          description: "EMA period (e.g., 20, 50, 100, 200)",
        },
        timeframe: {
          type: "string",
          enum: ["1m", "5m", "15m", "1H", "4H", "1D"],
          description: "Candle timeframe",
        },
      },
      required: ["token", "period"],
    },
  },
  {
    name: "recipe_get_new_pairs",
    description:
      "Get newly launched token pairs on Solana (Pump.fun, Raydium, Meteora, etc). Use this for sniping new launches. Supports filtering by age, liquidity, volume, and market cap.",
    inputSchema: {
      type: "object",
      properties: {
        maxAgeMinutes: {
          type: "number",
          description: "Maximum age of pair in minutes (default: 30). Use 15 for very fresh pairs.",
        },
        minLiquidity: {
          type: "number",
          description: "Minimum liquidity in USD (e.g., 10000 for $10k min liquidity)",
        },
        maxLiquidity: {
          type: "number",
          description: "Maximum liquidity in USD (optional, for filtering out whales)",
        },
        minVolume: {
          type: "number",
          description: "Minimum 24h volume in USD",
        },
        minMarketCap: {
          type: "number",
          description: "Minimum market cap in USD (e.g., 100000 for $100k min mcap)",
        },
        maxMarketCap: {
          type: "number",
          description: "Maximum market cap in USD (optional, for microcap plays)",
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 20)",
        },
      },
    },
  },
  {
    name: "recipe_get_pair_details",
    description:
      "Get detailed metrics for a specific trading pair including 30min/1h volume, trades, and price changes.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Token or pair address to get details for",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "recipe_token_trending",
    description:
      "Get trending tokens on Solana by volume.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of tokens to return (default: 10)",
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

/**
 * Calculate EMA from price data
 */
function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period && i < prices.length; i++) {
    sum += prices[i];
  }
  ema.push(sum / Math.min(period, prices.length));

  // Calculate EMA
  for (let i = 1; i < prices.length; i++) {
    ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }

  return ema;
}

export async function handleTokenTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "recipe_token_search": {
      const hasAdvancedFilters =
        args?.symbolStartsWith ||
        args?.nameContains ||
        args?.minMarketCap ||
        args?.maxMarketCap ||
        args?.minLiquidity ||
        args?.maxLiquidity ||
        args?.minVolume24h ||
        args?.minHolders;

      if (hasAdvancedFilters || args?.keyword) {
        // Use advanced search
        const tokens = await advancedSearchTokens({
          keyword: args?.keyword as string | undefined,
          symbolStartsWith: args?.symbolStartsWith as string | undefined,
          nameContains: args?.nameContains as string | undefined,
          minMarketCap: args?.minMarketCap as number | undefined,
          maxMarketCap: args?.maxMarketCap as number | undefined,
          minLiquidity: args?.minLiquidity as number | undefined,
          maxLiquidity: args?.maxLiquidity as number | undefined,
          minVolume24h: args?.minVolume24h as number | undefined,
          minHolders: args?.minHolders as number | undefined,
          limit: (args?.limit as number) || 20,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  tokens: tokens.map((t) => ({
                    symbol: t.symbol,
                    name: t.name,
                    address: t.address,
                    price: t.price,
                    priceFormatted: `$${t.price.toFixed(t.price < 0.01 ? 8 : 4)}`,
                    priceChange24h: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
                    volume24h: `$${(t.volume24h / 1000000).toFixed(2)}M`,
                    liquidity: `$${(t.liquidity / 1000).toFixed(0)}K`,
                    marketCap: `$${(t.marketCap / 1000000).toFixed(2)}M`,
                    holders: t.holder,
                  })),
                  count: tokens.length,
                  filters: {
                    keyword: args?.keyword,
                    symbolStartsWith: args?.symbolStartsWith,
                    nameContains: args?.nameContains,
                    minMarketCap: args?.minMarketCap,
                    maxMarketCap: args?.maxMarketCap,
                    minLiquidity: args?.minLiquidity,
                    maxLiquidity: args?.maxLiquidity,
                    minVolume24h: args?.minVolume24h,
                    minHolders: args?.minHolders,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Fallback to basic DexScreener search
      const query = (args?.keyword || args?.query) as string;
      if (!query) {
        return {
          content: [{ type: "text", text: "Missing keyword or query parameter" }],
          isError: true,
        };
      }

      const results = await searchTokens(query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
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
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "recipe_token_info": {
      const tokenArg = args?.token as string;
      if (!tokenArg) {
        return {
          content: [{ type: "text", text: "Missing token parameter" }],
          isError: true,
        };
      }

      // Resolve token (symbol or address)
      const address = isSolanaAddress(tokenArg) ? tokenArg : resolveToken(tokenArg);
      const token = await getTokenInfo(address);

      if (!token) {
        return {
          content: [{ type: "text", text: `Token not found: ${tokenArg}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
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
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "recipe_get_ohlcv": {
      const tokenArg = args?.token as string;
      if (!tokenArg) {
        return {
          content: [{ type: "text", text: "Missing token parameter" }],
          isError: true,
        };
      }

      const address = isSolanaAddress(tokenArg) ? tokenArg : resolveToken(tokenArg);
      const timeframe = (args?.timeframe as TimeFrame) || "1H";
      const limit = (args?.limit as number) || 100;

      try {
        const candles = await getOHLCV(address, timeframe, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  token: address,
                  timeframe,
                  candles: candles.slice(-20).map((c) => ({
                    timestamp: new Date(c.timestamp).toISOString(),
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume,
                  })),
                  count: candles.length,
                  note: "Showing last 20 candles. Full data available for analysis.",
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
              text: `Failed to get OHLCV data: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "recipe_calculate_ema": {
      const tokenArg = args?.token as string;
      const period = args?.period as number;

      if (!tokenArg) {
        return {
          content: [{ type: "text", text: "Missing token parameter" }],
          isError: true,
        };
      }

      if (!period || period < 2) {
        return {
          content: [{ type: "text", text: "Missing or invalid period parameter (must be >= 2)" }],
          isError: true,
        };
      }

      const address = isSolanaAddress(tokenArg) ? tokenArg : resolveToken(tokenArg);
      const timeframe = (args?.timeframe as TimeFrame) || "4H";

      try {
        const candles = await getOHLCV(address, timeframe, period + 50);
        const closes = candles.map((c) => c.close);

        if (closes.length < period) {
          return {
            content: [
              {
                type: "text",
                text: `Not enough data: got ${closes.length} candles, need at least ${period} for EMA(${period})`,
              },
            ],
            isError: true,
          };
        }

        const ema = calculateEMA(closes, period);
        const currentEMA = ema[ema.length - 1];
        const currentPrice = closes[closes.length - 1];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  token: address,
                  period,
                  timeframe,
                  currentEMA,
                  currentPrice,
                  priceAboveEMA: currentPrice > currentEMA,
                  percentFromEMA: ((currentPrice - currentEMA) / currentEMA) * 100,
                  signal:
                    currentPrice > currentEMA
                      ? "BULLISH - Price is above EMA"
                      : "BEARISH - Price is below EMA",
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
              text: `Failed to calculate EMA: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "recipe_get_new_pairs": {
      const options = {
        maxAgeMinutes: (args?.maxAgeMinutes as number) || 30,
        minLiquidity: args?.minLiquidity as number | undefined,
        maxLiquidity: args?.maxLiquidity as number | undefined,
        minVolume: args?.minVolume as number | undefined,
        minMarketCap: args?.minMarketCap as number | undefined,
        maxMarketCap: args?.maxMarketCap as number | undefined,
        limit: (args?.limit as number) || 20,
      };

      try {
        const pairs = await getNewPairs(options);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  pairs: pairs.map((pair) => ({
                    address: pair.address,
                    symbol: pair.symbol,
                    name: pair.name,
                    logoURI: pair.logoURI,
                    price: pair.price,
                    priceFormatted: `$${pair.price.toFixed(pair.price < 0.01 ? 8 : 4)}`,
                    liquidity: `$${(pair.liquidity / 1000).toFixed(0)}K`,
                    volume24h: `$${(pair.volume24h / 1000).toFixed(0)}K`,
                    marketCap: `$${(pair.marketCap / 1000).toFixed(0)}K`,
                    ageMinutes: pair.ageMinutes,
                    dex: pair.dex || "unknown",
                  })),
                  count: pairs.length,
                  filters: {
                    maxAgeMinutes: options.maxAgeMinutes,
                    minLiquidity: options.minLiquidity || "any",
                    maxLiquidity: options.maxLiquidity || "any",
                    minVolume: options.minVolume || "any",
                    minMarketCap: options.minMarketCap || "any",
                    maxMarketCap: options.maxMarketCap || "any",
                  },
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
              text: `Failed to get new pairs: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "recipe_get_pair_details": {
      const address = args?.address as string;
      if (!address) {
        return {
          content: [{ type: "text", text: "Missing address parameter" }],
          isError: true,
        };
      }

      const overview = await getPairDetails(address);

      if (!overview) {
        // Try token info as fallback
        const tokenInfo = await getTokenInfo(address);
        if (tokenInfo) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    address,
                    symbol: tokenInfo.symbol,
                    name: tokenInfo.name,
                    price: tokenInfo.price,
                    priceFormatted: `$${tokenInfo.price.toFixed(tokenInfo.price < 0.01 ? 8 : 4)}`,
                    volume24h: `$${(tokenInfo.volume24h / 1000).toFixed(0)}K`,
                    liquidity: `$${(tokenInfo.liquidity / 1000).toFixed(0)}K`,
                    marketCap: `$${(tokenInfo.marketCap / 1000).toFixed(0)}K`,
                    note: "Detailed metrics unavailable, showing basic info",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
        return {
          content: [{ type: "text", text: `Pair not found: ${address}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                address,
                price: overview.price,
                priceFormatted: `$${overview.price.toFixed(overview.price < 0.01 ? 8 : 4)}`,
                volume30m: `$${(overview.volume30m / 1000).toFixed(0)}K`,
                volume1h: `$${(overview.volume1h / 1000).toFixed(0)}K`,
                volume24h: `$${(overview.volume24h / 1000).toFixed(0)}K`,
                liquidity: `$${(overview.liquidity / 1000).toFixed(0)}K`,
                trades30m: overview.trades30m,
                trades1h: overview.trades1h,
                priceChange30m: `${overview.priceChange30m >= 0 ? "+" : ""}${overview.priceChange30m.toFixed(2)}%`,
                priceChange1h: `${overview.priceChange1h >= 0 ? "+" : ""}${overview.priceChange1h.toFixed(2)}%`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "recipe_token_trending": {
      const limit = (args?.limit as number) || 10;

      try {
        const data = await getTrending();

        // Use volumeTokens (high volume) or fallback to trendingPairs
        const volumeData = data.volumeTokens || data.trendingPairs || [];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                volumeData.slice(0, limit).map((token) => ({
                  symbol: token.symbol,
                  name: token.name,
                  address: token.address,
                  logoURI: token.logoURI,
                  price: token.price,
                  priceFormatted: `$${token.price.toFixed(token.price < 0.01 ? 8 : 4)}`,
                  priceChange24h: `${token.priceChange24h >= 0 ? "+" : ""}${token.priceChange24h.toFixed(2)}%`,
                  volume24h: `$${(token.volume24h / 1000000).toFixed(2)}M`,
                  liquidity: `$${(token.liquidity / 1000).toFixed(0)}K`,
                  marketCap: `$${(token.marketCap / 1000000).toFixed(2)}M`,
                  rank: token.rank,
                })),
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        // Fallback to DexScreener
        const pairs = await searchTokens("solana");
        const sorted = pairs
          .sort((a, b) => b.volume24h - a.volume24h)
          .slice(0, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                sorted.map((pair) => ({
                  symbol: pair.symbol,
                  name: pair.name,
                  address: pair.address,
                  price: `$${pair.price.toFixed(pair.price < 0.01 ? 8 : 4)}`,
                  priceChange24h: `${pair.priceChange24h >= 0 ? "+" : ""}${pair.priceChange24h.toFixed(2)}%`,
                  volume24h: `$${(pair.volume24h / 1000000).toFixed(2)}M`,
                  liquidity: `$${(pair.liquidity / 1000).toFixed(0)}K`,
                })),
                null,
                2
              ),
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
            text: JSON.stringify(
              {
                token: token.toUpperCase(),
                priceUSD: price,
                priceFormatted: `$${price.toFixed(price < 0.01 ? 8 : 4)}`,
              },
              null,
              2
            ),
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
            text: JSON.stringify(
              {
                count: tokens.length,
                source: "pump.fun",
                launches: tokens.map((t) => ({
                  symbol: t.symbol,
                  name: t.name,
                  mint: t.mint,
                  description:
                    t.description?.slice(0, 100) +
                    (t.description && t.description.length > 100 ? "..." : ""),
                  marketCap: `$${(t.marketCap / 1000).toFixed(0)}K`,
                  isComplete: t.isComplete,
                  createdAt: t.createdAt,
                  socials: {
                    twitter: t.twitter,
                    telegram: t.telegram,
                    website: t.website,
                  },
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
        content: [{ type: "text", text: `Unknown token tool: ${name}` }],
        isError: true,
      };
  }
}
