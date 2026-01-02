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
    name: "claude_trade_token_search",
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
    name: "claude_trade_token_info",
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
    name: "claude_trade_get_ohlcv",
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
    name: "claude_trade_calculate_ema",
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
    name: "claude_trade_get_new_pairs",
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
    name: "claude_trade_get_pair_details",
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
    name: "claude_trade_token_trending",
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
    name: "claude_trade_token_price",
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
    name: "claude_trade_token_new_launches",
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
    case "claude_trade_token_search": {
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
          key
