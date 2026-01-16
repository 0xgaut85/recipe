/**
 * Claude API Tool Definitions and Implementations
 * These tools are available for Claude to call during conversations
 */

import { getTokenInfo, searchPairs } from "./dexscreener";
import { 
  getOHLCV, 
  getTokenOverview, 
  TimeFrame, 
  getTrendingTokens as getBirdeyeTrending,
  getHotTokens,
  getNewListings,
  getNewPairsFiltered,
  getPairOverview,
  advancedTokenSearch,
  searchTokens,
  NewPairData
} from "./birdeye";
import { calculateEMA, calculateRSI, getLatestIndicators } from "./indicators";
import { getBalance, getTokenAccounts, isValidPublicKey } from "./wallet";
import { getSwapQuote, executeSwap, TOKEN_MINTS, getTokenDecimals, toSmallestUnit, fromSmallestUnit } from "./jupiter";
import { getDriftMarketData, getAllDriftMarkets, placeDriftOrder, DriftMarket, DRIFT_MARKETS } from "./drift";
import prisma from "./prisma";

/**
 * Tool definitions for Claude API
 */
export const toolDefinitions = [
  // Data Tools
  {
    name: "get_token_info",
    description: "Get price, volume, liquidity, and other info for a token by its mint address or symbol",
    input_schema: {
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
    name: "get_ohlcv",
    description: "Get OHLCV (Open, High, Low, Close, Volume) candle data for technical analysis",
    input_schema: {
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
    name: "calculate_ema",
    description: "Calculate EMA (Exponential Moving Average) for a token and check if price is above/below it",
    input_schema: {
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
    name: "get_new_pairs",
    description: "Get newly launched token pairs on Solana (Pump.fun, Raydium, Meteora, etc). Use this for sniping new launches. Supports filtering by age, liquidity, volume, and market cap.",
    input_schema: {
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
    name: "get_pair_details",
    description: "Get detailed metrics for a specific trading pair including 30min/1h volume, trades, and price changes.",
    input_schema: {
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
    name: "search_tokens",
    description: "Search for tokens by name, symbol, or apply advanced filters. Can filter by first letter, market cap range, liquidity, volume, holders, and more.",
    input_schema: {
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
    name: "get_trending_tokens",
    description: "Get trending tokens on Solana by volume",
    input_schema: {
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
    name: "analyze_wallet",
    description: "Analyze a wallet's holdings and recent activity",
    input_schema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Solana wallet address to analyze",
        },
      },
      required: ["address"],
    },
  },

  // Trading Tools
  {
    name: "get_swap_quote",
    description: "Get a quote for swapping tokens via Jupiter",
    input_schema: {
      type: "object",
      properties: {
        inputToken: {
          type: "string",
          description: "Input token mint address (use 'SOL' for native SOL)",
        },
        outputToken: {
          type: "string",
          description: "Output token mint address",
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
    name: "execute_spot_trade",
    description: "Execute a spot swap via Jupiter. This will use real funds from the user's wallet.",
    input_schema: {
      type: "object",
      properties: {
        inputToken: {
          type: "string",
          description: "Input token mint address (use 'SOL' for native SOL)",
        },
        outputToken: {
          type: "string",
          description: "Output token mint address",
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
    name: "get_perp_markets",
    description: "Get available perpetual markets on Drift",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "execute_perp_trade",
    description: "Open a perpetual position on Drift. Note: Full execution requires SDK on compatible platform.",
    input_schema: {
      type: "object",
      properties: {
        market: {
          type: "string",
          description: "Market symbol (e.g., 'SOL-PERP', 'BTC-PERP')",
        },
        direction: {
          type: "string",
          enum: ["long", "short"],
          description: "Trade direction",
        },
        size: {
          type: "number",
          description: "Position size in base asset",
        },
        leverage: {
          type: "number",
          description: "Leverage (1-20x)",
        },
      },
      required: ["market", "direction", "size", "leverage"],
    },
  },

  // Wallet Tools
  {
    name: "get_balance",
    description: "Get the user's SOL and token balances",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "withdraw_sol",
    description: "Withdraw SOL from the user's wallet to an external address",
    input_schema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Amount of SOL to withdraw",
        },
        destination: {
          type: "string",
          description: "Destination Solana wallet address",
        },
      },
      required: ["amount", "destination"],
    },
  },
  {
    name: "create_strategy",
    description: "Create and save a trading strategy for the user. Supports spot trades, perp trades, new pair sniping, and conditional/indicator-based strategies. Call this when the user confirms they want to save/deploy a strategy.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Short name for the strategy",
        },
        description: {
          type: "string",
          description: "Detailed description of what the strategy does",
        },
        type: {
          type: "string",
          enum: ["SPOT", "PERP", "SNIPER", "CONDITIONAL"],
          description: "Type of strategy: SPOT for swaps, PERP for perpetuals, SNIPER for new pair sniping, CONDITIONAL for indicator-based triggers",
        },
        inputToken: {
          type: "string",
          description: "Input token symbol or address (e.g., 'SOL', 'BONK')",
        },
        outputToken: {
          type: "string",
          description: "Output token symbol or address (for SPOT trades)",
        },
        amount: {
          type: "number",
          description: "Amount to trade (in input token units, e.g., SOL amount)",
        },
        direction: {
          type: "string",
          enum: ["buy", "sell", "long", "short"],
          description: "Trade direction",
        },
        leverage: {
          type: "number",
          description: "Leverage for perp trades (1-20)",
        },
        stopLoss: {
          type: "number",
          description: "Stop loss percentage (optional, omit for no stop loss)",
        },
        takeProfit: {
          type: "number",
          description: "Take profit percentage (optional, omit for manual exit)",
        },
        maxAgeMinutes: {
          type: "number",
          description: "For SNIPER: Maximum pair age in minutes (e.g., 15 for very fresh)",
        },
        minLiquidity: {
          type: "number",
          description: "For SNIPER: Minimum liquidity in USD (e.g., 10000)",
        },
        maxLiquidity: {
          type: "number",
          description: "For SNIPER: Maximum liquidity in USD (optional)",
        },
        minVolume: {
          type: "number",
          description: "For SNIPER: Minimum 24h volume in USD",
        },
        minMarketCap: {
          type: "number",
          description: "For SNIPER: Minimum market cap in USD (e.g., 100000 for $100k)",
        },
        maxMarketCap: {
          type: "number",
          description: "For SNIPER: Maximum market cap in USD (optional, for microcap plays)",
        },
        nameFilter: {
          type: "string",
          description: "For SNIPER: Filter tokens by name containing this string (e.g., 'claude', 'ai')",
        },
        slippageBps: {
          type: "number",
          description: "Slippage tolerance in basis points (default: 300 for 3%)",
        },
        condition: {
          type: "object",
          description: "For CONDITIONAL: Indicator-based trigger conditions",
          properties: {
            indicator: {
              type: "string",
              enum: ["EMA", "RSI", "SMA", "PRICE"],
              description: "Indicator to use (EMA, RSI, SMA, or PRICE for specific price level)",
            },
            period: {
              type: "number",
              description: "Indicator period (e.g., 20, 50, 200 for EMA/SMA)",
            },
            timeframe: {
              type: "string",
              enum: ["1m", "5m", "15m", "1H", "4H", "1D"],
              description: "Candle timeframe for the indicator",
            },
            trigger: {
              type: "string",
              enum: ["price_above", "price_below", "price_touches", "crosses_above", "crosses_below"],
              description: "When to trigger the trade",
            },
            value: {
              type: "number",
              description: "For PRICE indicator: specific price level to trigger at",
            },
          },
        },
      },
      required: ["name", "description", "type"],
    },
  },
  {
    name: "get_my_strategies",
    description: "Get the user's saved trading strategies",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Check if a string is a valid Solana address (base58, 32-44 chars)
 */
function isSolanaAddress(str: string): boolean {
  // Solana addresses are base58 encoded, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(str);
}

/**
 * Resolve token symbol to mint address
 * Checks known tokens first, then validates if it's already an address
 */
function resolveTokenMint(token: string): string {
  const upperToken = token.toUpperCase();
  if (upperToken in TOKEN_MINTS) {
    return TOKEN_MINTS[upperToken as keyof typeof TOKEN_MINTS];
  }
  // If it looks like a Solana address, return as-is
  if (isSolanaAddress(token)) {
    return token;
  }
  // Otherwise return as-is (will be handled by search or fail gracefully)
  return token;
}

/**
 * Resolve token to mint address, with Birdeye search fallback
 * Use this for execute_spot_trade to handle any token name/symbol
 */
async function resolveTokenMintWithSearch(token: string): Promise<{ address: string; symbol: string; decimals: number } | null> {
  const upperToken = token.toUpperCase();
  
  // Check known tokens first
  if (upperToken in TOKEN_MINTS) {
    const address = TOKEN_MINTS[upperToken as keyof typeof TOKEN_MINTS];
    const decimals = getTokenDecimals(address);
    return { address, symbol: upperToken, decimals };
  }
  
  // If it's already a valid Solana address, use it directly
  if (isSolanaAddress(token)) {
    try {
      const overview = await getTokenOverview(token);
      if (overview) {
        return { 
          address: token, 
          symbol: overview.symbol, 
          decimals: overview.decimals 
        };
      }
    } catch {
      // Continue with the address anyway
    }
    const decimals = getTokenDecimals(token);
    return { address: token, symbol: "???", decimals };
  }
  
  // Search for the token by name/symbol using Birdeye
  try {
    const results = await searchTokens(token, 5);
    if (results.length > 0) {
      // Find exact match first, then best match
      const exactMatch = results.find(
        r => r.symbol.toUpperCase() === upperToken || r.name.toUpperCase() === upperToken
      );
      const bestMatch = exactMatch || results[0];
      return {
        address: bestMatch.address,
        symbol: bestMatch.symbol,
        decimals: bestMatch.decimals,
      };
    }
  } catch (error) {
    console.error("Token search error:", error);
  }
  
  return null;
}

/**
 * Execute a tool call
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  switch (toolName) {
    case "get_token_info": {
      const token = resolveTokenMint(args.token as string);
      const info = await getTokenInfo(token);
      if (!info) {
        const overview = await getTokenOverview(token);
        return overview || { error: "Token not found" };
      }
      return info;
    }

    case "get_ohlcv": {
      const token = resolveTokenMint(args.token as string);
      const timeframe = (args.timeframe as TimeFrame) || "1H";
      const limit = (args.limit as number) || 100;
      const candles = await getOHLCV(token, timeframe, limit);
      return { candles, count: candles.length };
    }

    case "calculate_ema": {
      const token = resolveTokenMint(args.token as string);
      const period = args.period as number;
      const timeframe = (args.timeframe as TimeFrame) || "4H";
      
      const candles = await getOHLCV(token, timeframe, period + 50);
      const closes = candles.map((c) => c.close);
      const ema = calculateEMA(closes, period);
      const currentEMA = ema[ema.length - 1];
      const currentPrice = closes[closes.length - 1];
      
      return {
        period,
        timeframe,
        currentEMA,
        currentPrice,
        priceAboveEMA: currentPrice > currentEMA,
        percentFromEMA: ((currentPrice - currentEMA) / currentEMA) * 100,
      };
    }

    case "get_new_pairs": {
      const options = {
        maxAgeMinutes: (args.maxAgeMinutes as number) || 30,
        minLiquidity: args.minLiquidity as number | undefined,
        maxLiquidity: args.maxLiquidity as number | undefined,
        minVolume: args.minVolume as number | undefined,
        minMarketCap: args.minMarketCap as number | undefined,
        maxMarketCap: args.maxMarketCap as number | undefined,
        limit: (args.limit as number) || 20,
      };
      
      const pairs = await getNewPairsFiltered(options);
      
      return {
        pairs: pairs.map((pair) => ({
          address: pair.address,
          symbol: pair.symbol,
          name: pair.name,
          logoURI: pair.logoURI,
          price: pair.price,
          liquidity: pair.liquidity,
          volume24h: pair.volume24h,
          marketCap: pair.marketCap,
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
      };
    }

    case "get_pair_details": {
      const address = args.address as string;
      const overview = await getPairOverview(address);
      
      if (!overview) {
        // Try token overview as fallback
        const tokenOverview = await getTokenOverview(address);
        if (tokenOverview) {
          return {
            address,
            symbol: tokenOverview.symbol,
            name: tokenOverview.name,
            price: tokenOverview.price,
            volume24h: tokenOverview.volume24h,
            liquidity: tokenOverview.liquidity,
            marketCap: tokenOverview.marketCap,
            holders: tokenOverview.holder,
          };
        }
        return { error: "Pair not found" };
      }
      
      return {
        address,
        ...overview,
      };
    }

    case "search_tokens": {
      // Use advanced search if any filters are provided
      const hasAdvancedFilters = args.symbolStartsWith || args.nameContains || 
        args.minMarketCap || args.maxMarketCap || args.minLiquidity || 
        args.maxLiquidity || args.minVolume24h || args.minHolders;
      
      if (hasAdvancedFilters || args.keyword) {
        const tokens = await advancedTokenSearch({
          keyword: args.keyword as string | undefined,
          symbolStartsWith: args.symbolStartsWith as string | undefined,
          nameContains: args.nameContains as string | undefined,
          minMarketCap: args.minMarketCap as number | undefined,
          maxMarketCap: args.maxMarketCap as number | undefined,
          minLiquidity: args.minLiquidity as number | undefined,
          maxLiquidity: args.maxLiquidity as number | undefined,
          minVolume24h: args.minVolume24h as number | undefined,
          minHolders: args.minHolders as number | undefined,
          limit: (args.limit as number) || 20,
        });
        
        return {
          tokens: tokens.map(t => ({
            symbol: t.symbol,
            name: t.name,
            address: t.address,
            price: t.price,
            priceChange24h: t.priceChange24h,
            volume24h: t.volume24h,
            liquidity: t.liquidity,
            marketCap: t.marketCap,
            holders: t.holder,
          })),
          count: tokens.length,
          filters: {
            keyword: args.keyword,
            symbolStartsWith: args.symbolStartsWith,
            nameContains: args.nameContains,
            minMarketCap: args.minMarketCap,
            maxMarketCap: args.maxMarketCap,
            minLiquidity: args.minLiquidity,
            maxLiquidity: args.maxLiquidity,
            minVolume24h: args.minVolume24h,
            minHolders: args.minHolders,
          },
        };
      }
      
      // Fallback to DexScreener for simple queries
      const query = (args.keyword || args.query) as string;
      const pairs = await searchPairs(query);
      return {
        tokens: pairs.slice(0, 10).map((pair) => ({
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          address: pair.baseToken.address,
          price: pair.priceUsd,
          priceChange24h: pair.priceChange?.h24,
          volume24h: pair.volume?.h24,
          liquidity: pair.liquidity?.usd,
        })),
        count: Math.min(pairs.length, 10),
      };
    }

    case "get_trending_tokens": {
      const limit = (args.limit as number) || 10;
      
      // Try Birdeye first (better data with logos)
      try {
        const tokens = await getBirdeyeTrending(limit);
        if (tokens.length > 0) {
          return tokens.map((token) => ({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            logoURI: token.logoURI,
            price: token.price,
            priceChange24h: token.priceChange24h,
            volume24h: token.volume24h,
            liquidity: token.liquidity,
            marketCap: token.marketCap,
            rank: token.rank,
          }));
        }
      } catch {
        // Birdeye API may not be configured
      }
      
      // Fallback to DexScreener search
      const pairs = await searchPairs("solana");
      return pairs
        .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
        .slice(0, limit)
        .map((pair) => ({
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          address: pair.baseToken.address,
          price: pair.priceUsd,
          priceChange24h: pair.priceChange?.h24,
          volume24h: pair.volume?.h24,
          liquidity: pair.liquidity?.usd,
        }));
    }

    case "analyze_wallet": {
      const address = args.address as string;
      if (!isValidPublicKey(address)) {
        return { error: "Invalid wallet address" };
      }
      
      const solBalance = await getBalance(address);
      const tokens = await getTokenAccounts(address);
      
      return {
        address,
        solBalance,
        tokenCount: tokens.length,
        tokens: tokens.slice(0, 20).map((t) => ({
          mint: t.mint,
          balance: t.balance,
        })),
      };
    }

    case "get_swap_quote": {
      // Resolve tokens with search fallback
      const inputToken = await resolveTokenMintWithSearch(args.inputToken as string);
      const outputToken = await resolveTokenMintWithSearch(args.outputToken as string);
      
      if (!inputToken) {
        return { error: `Could not find token: ${args.inputToken}. Try using the contract address (CA).` };
      }
      if (!outputToken) {
        return { error: `Could not find token: ${args.outputToken}. Try using the contract address (CA).` };
      }
      
      const amount = args.amount as number;
      const slippageBps = (args.slippageBps as number) || 50;
      
      const amountSmallest = toSmallestUnit(amount, inputToken.decimals);
      
      const quote = await getSwapQuote(inputToken.address, outputToken.address, amountSmallest, slippageBps);
      
      return {
        inputToken: inputToken.symbol,
        outputToken: outputToken.symbol,
        inputAmount: amount,
        outputAmount: fromSmallestUnit(parseInt(quote.outAmount), outputToken.decimals),
        priceImpact: quote.priceImpactPct,
        route: quote.routePlan.map((r) => r.swapInfo.label).join(" -> "),
      };
    }

    case "execute_spot_trade": {
      if (!userId) {
        return { error: "Authentication required" };
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });
      
      if (!user?.wallet) {
        return { error: "Wallet not found" };
      }
      
      // Resolve tokens with search fallback
      const inputToken = await resolveTokenMintWithSearch(args.inputToken as string);
      const outputToken = await resolveTokenMintWithSearch(args.outputToken as string);
      
      if (!inputToken) {
        return { error: `Could not find token: ${args.inputToken}. Please provide the contract address (CA).` };
      }
      if (!outputToken) {
        return { error: `Could not find token: ${args.outputToken}. Please provide the contract address (CA).` };
      }
      
      const amount = args.amount as number;
      const slippageBps = (args.slippageBps as number) || 100; // Default 1% for memecoins
      
      const amountSmallest = toSmallestUnit(amount, inputToken.decimals);
      
      const result = await executeSwap(
        user.wallet.encryptedPrivateKey,
        inputToken.address,
        outputToken.address,
        amountSmallest,
        slippageBps
      );
      
      return {
        success: true,
        signature: result.signature,
        inputToken: inputToken.symbol,
        outputToken: outputToken.symbol,
        inputAmount: amount,
        outputAmount: fromSmallestUnit(parseInt(result.outputAmount), outputToken.decimals),
        priceImpact: result.priceImpact,
        explorerUrl: `https://solscan.io/tx/${result.signature}`,
      };
    }

    case "get_perp_markets": {
      const markets = await getAllDriftMarkets();
      return { markets };
    }

    case "execute_perp_trade": {
      if (!userId) {
        return { error: "Authentication required" };
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });
      
      if (!user?.wallet) {
        return { error: "Wallet not found" };
      }
      
      const market = args.market as DriftMarket;
      if (!(market in DRIFT_MARKETS)) {
        return { error: "Invalid market" };
      }
      
      const result = await placeDriftOrder(
        user.wallet.encryptedPrivateKey,
        market,
        args.direction as "long" | "short",
        args.size as number,
        args.leverage as number
      );
      
      return result;
    }

    case "get_balance": {
      if (!userId) {
        return { error: "Authentication required" };
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });
      
      if (!user?.wallet) {
        return { error: "Wallet not found" };
      }
      
      const solBalance = await getBalance(user.wallet.publicKey);
      const tokens = await getTokenAccounts(user.wallet.publicKey);
      
      return {
        publicKey: user.wallet.publicKey,
        solBalance,
        tokens,
      };
    }

    case "withdraw_sol": {
      // Withdrawal is handled by the withdrawal API endpoint
      // This tool provides guidance
      return {
        message: "To withdraw SOL, please use the withdrawal modal in the app UI or call the /api/wallet/withdraw endpoint directly.",
        amount: args.amount,
        destination: args.destination,
      };
    }

    case "create_strategy": {
      if (!userId) {
        return { error: "Authentication required" };
      }

      const strategyType = args.type as string;
      
      // Build config based on strategy type
      let config: {
        type: string;
        amount?: number;
        slippageBps: number;
        inputToken?: string;
        outputToken?: string;
        direction?: string;
        stopLoss?: number;
        takeProfit?: number;
        leverage?: number;
        maxAgeMinutes?: number;
        minLiquidity?: number;
        maxLiquidity?: number;
        minVolume?: number;
        minMarketCap?: number;
        maxMarketCap?: number;
        nameFilter?: string;
        condition?: {
          indicator: string;
          period?: number;
          timeframe?: string;
          trigger: string;
          value?: number;
        };
      } = {
        type: strategyType,
        amount: args.amount as number | undefined,
        slippageBps: (args.slippageBps as number) || (strategyType === "SNIPER" ? 300 : 50),
      };

      if (strategyType === "SPOT") {
        config = {
          ...config,
          inputToken: args.inputToken as string,
          outputToken: args.outputToken as string,
          direction: args.direction as string,
          stopLoss: args.stopLoss as number | undefined,
          takeProfit: args.takeProfit as number | undefined,
        };
      } else if (strategyType === "PERP") {
        config = {
          ...config,
          inputToken: args.inputToken as string,
          direction: args.direction as string,
          leverage: args.leverage as number,
          stopLoss: args.stopLoss as number | undefined,
          takeProfit: args.takeProfit as number | undefined,
        };
      } else if (strategyType === "SNIPER") {
        config = {
          ...config,
          maxAgeMinutes: (args.maxAgeMinutes as number) || 30,
          minLiquidity: args.minLiquidity as number | undefined,
          maxLiquidity: args.maxLiquidity as number | undefined,
          minVolume: args.minVolume as number | undefined,
          minMarketCap: args.minMarketCap as number | undefined,
          maxMarketCap: args.maxMarketCap as number | undefined,
          nameFilter: args.nameFilter as string | undefined,
          takeProfit: args.takeProfit as number | undefined, // undefined = manual exit
          stopLoss: args.stopLoss as number | undefined,
        };
      } else if (strategyType === "CONDITIONAL") {
        const conditionArg = args.condition as {
          indicator?: string;
          period?: number;
          timeframe?: string;
          trigger?: string;
          value?: number;
        } | undefined;
        
        config = {
          ...config,
          inputToken: args.inputToken as string,
          outputToken: args.outputToken as string | undefined,
          direction: args.direction as string || "buy",
          stopLoss: args.stopLoss as number | undefined,
          takeProfit: args.takeProfit as number | undefined,
          condition: conditionArg ? {
            indicator: conditionArg.indicator || "EMA",
            period: conditionArg.period,
            timeframe: conditionArg.timeframe || "1H",
            trigger: conditionArg.trigger || "price_touches",
            value: conditionArg.value,
          } : undefined,
        };
      }

      const strategy = await prisma.strategy.create({
        data: {
          userId,
          name: args.name as string,
          description: args.description as string,
          config: config as object,
          isActive: false,
        },
      });

      const typeEmoji = strategyType === "SNIPER" ? "🎯" : strategyType === "PERP" ? "📈" : strategyType === "CONDITIONAL" ? "📊" : "💱";
      
      return {
        success: true,
        strategyId: strategy.id,
        name: strategy.name,
        type: strategyType,
        config,
        message: `${typeEmoji} Strategy "${strategy.name}" created successfully! You can view and manage it in the Strategies panel (chart icon in the header).`,
      };
    }

    case "get_my_strategies": {
      if (!userId) {
        return { error: "Authentication required" };
      }

      const strategies = await prisma.strategy.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return {
        strategies: strategies.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          isActive: s.isActive,
          type: (s.config as any).type,
          createdAt: s.createdAt.toISOString(),
        })),
        total: strategies.length,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
