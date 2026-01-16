/**
 * Recipe.money API Client
 * All data requiring API keys goes through our backend - users need no configuration
 */

const API_BASE = "https://recipe.money/api";

export interface TrendingToken {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  rank?: number;
}

export interface NewLaunch {
  mint: string;
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  price: number;
  liquidity: number;
  marketCap: number;
  volume24h: number;
  listedAt?: number;  // timestamp in milliseconds
  ageMinutes?: number;
  dex?: string;
}

export interface TokenBalance {
  token: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  decimals: number;
}

export interface TrendingData {
  hotTokens: TrendingToken[];
  volumeTokens: TrendingToken[];
  newLaunches: NewLaunch[];
  trendingPairs?: TrendingToken[];  // backward compat alias for volumeTokens
  timestamp: string;
}

export interface WalletData {
  balances: TokenBalance[];
  address: string;
  timestamp: number;
}

export type TimeFrame = "1m" | "5m" | "15m" | "1H" | "4H" | "1D";

export interface OHLCVCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holder?: number;
}

export interface NewPairData {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  price: number;
  liquidity: number;
  volume24h: number;
  marketCap: number;
  listedAt?: number;
  ageMinutes: number;
  dex?: string;
}

export interface PairOverview {
  price: number;
  volume30m: number;
  volume1h: number;
  volume24h: number;
  liquidity: number;
  trades30m: number;
  trades1h: number;
  priceChange30m: number;
  priceChange1h: number;
}

/**
 * Get trending tokens, volume leaders, and new launches
 * Uses Birdeye data via recipe.money backend
 */
export async function getTrending(): Promise<TrendingData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE}/data/trending`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch trending data: ${response.status}`);
    }

    return response.json() as Promise<TrendingData>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Trending data request timed out");
    }
    throw error;
  }
}

/**
 * Get wallet balances for any address
 * Uses Helius data via recipe.money backend
 */
export async function getWalletBalances(address: string): Promise<WalletData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE}/data/wallet?address=${address}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch wallet data: ${response.status}`);
    }

    return response.json() as Promise<WalletData>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Wallet data request timed out");
    }
    throw error;
  }
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

interface DexScreenerPair {
  chainId: string;
  baseToken: { symbol: string; name: string; address: string };
  priceUsd: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number;
  fdv?: number;
  dexId: string;
  url: string;
}

/**
 * Search tokens by name or symbol via DexScreener (no API key needed)
 * Matches main app's src/lib/dexscreener.ts searchPairs function
 */
export async function searchTokens(query: string): Promise<Array<{
  symbol: string;
  name: string;
  address: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  dex: string;
  url: string;
}>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`DexScreener search failed: ${response.status}`);
    }

    const data = await response.json() as DexScreenerResponse;
    // Filter to Solana pairs only - matches main app
    const pairs = (data.pairs || []).filter((p) => p.chainId === "solana");

    return pairs.slice(0, 10).map((pair) => ({
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      address: pair.baseToken.address,
      price: parseFloat(pair.priceUsd || "0"),
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity?.usd || 0,
      marketCap: pair.marketCap || pair.fdv || 0,
      dex: pair.dexId,
      url: pair.url,
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return []; // Return empty on timeout like main app
    }
    throw error;
  }
}

/**
 * Get token info by address via DexScreener
 * Matches main app's src/lib/dexscreener.ts getPairsByToken function
 */
export async function getTokenInfo(address: string): Promise<{
  symbol: string;
  name: string;
  address: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  dex: string;
  url: string;
} | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as DexScreenerResponse;
    const pairs = (data.pairs || []).filter((p) => p.chainId === "solana");

    if (pairs.length === 0) {
      return null;
    }

    // Get the pair with highest liquidity - matches main app logic
    const pair = pairs.reduce((best, current) =>
      (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
    );

    return {
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      address: pair.baseToken.address,
      price: parseFloat(pair.priceUsd || "0"),
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity?.usd || 0,
      marketCap: pair.marketCap || pair.fdv || 0,
      dex: pair.dexId,
      url: pair.url,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return null; // Return null on timeout like main app
  }
}

interface PumpFunToken {
  symbol: string;
  name: string;
  mint: string;
  description: string;
  usd_market_cap: number;
  complete: boolean;
  creator: string;
  created_timestamp: number;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
}

/**
 * Get new pump.fun launches
 * Matches main app's src/lib/pumpfun.ts getNewLaunches function
 */
export async function getNewLaunches(limit: number = 10): Promise<Array<{
  symbol: string;
  name: string;
  mint: string;
  description: string;
  marketCap: number;
  isComplete: boolean;
  creator: string;
  createdAt: string;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
}>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://frontend-api.pump.fun/coins?offset=0&limit=${Math.min(limit, 50)}&sort=created_timestamp&order=DESC&includeNsfw=false`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Don't throw for 5xx errors, just return empty - matches main app
      if (response.status >= 500) {
        console.error(`Pump.fun server error: ${response.status}`);
        return [];
      }
      throw new Error(`Pump.fun API failed: ${response.status}`);
    }

    const tokens = await response.json() as PumpFunToken[];

    return tokens.map((token) => ({
      symbol: token.symbol,
      name: token.name,
      mint: token.mint,
      description: token.description,
      marketCap: token.usd_market_cap,
      isComplete: token.complete,
      creator: token.creator,
      createdAt: new Date(token.created_timestamp).toISOString(),
      twitter: token.twitter,
      telegram: token.telegram,
      website: token.website,
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    // Silently return empty for network/timeout errors - matches main app
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Pump.fun request timed out");
      return [];
    }
    throw error;
  }
}

/**
 * Get OHLCV candle data for technical analysis
 * NOTE: This feature requires Birdeye API key which is not available in the plugin.
 * The OHLCV endpoint is not implemented on recipe.money backend for public access.
 * Returns an error message directing users to use the web app for this feature.
 */
export async function getOHLCV(
  tokenAddress: string,
  timeframe: TimeFrame = "1H",
  limit: number = 100
): Promise<OHLCVCandle[]> {
  // OHLCV requires Birdeye API key - not available in plugin
  // The /api/data/ohlcv endpoint doesn't exist on recipe.money
  throw new Error(
    "OHLCV data requires Birdeye API access. This feature is available in the Recipe.money web app. " +
    "For technical analysis, please use the web app at https://recipe.money"
  );
}

/**
 * Get new pairs with filters for sniping strategies
 * Uses trending data from recipe.money backend (which has Birdeye API key)
 * Applies local filtering for the options
 */
export async function getNewPairs(options: {
  maxAgeMinutes?: number;
  minLiquidity?: number;
  maxLiquidity?: number;
  minVolume?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  limit?: number;
} = {}): Promise<NewPairData[]> {
  try {
    // Use the working /api/data/trending endpoint and filter locally
    const trending = await getTrending();
    
    let pairs = trending.newLaunches.map(nl => ({
      address: nl.address,
      symbol: nl.symbol,
      name: nl.name,
      logoURI: nl.logoURI,
      price: nl.price,
      liquidity: nl.liquidity,
      volume24h: nl.volume24h,
      marketCap: nl.marketCap,
      listedAt: nl.listedAt,
      ageMinutes: nl.ageMinutes || 0,
      dex: nl.dex,
    }));

    // Apply local filtering
    if (options.maxAgeMinutes) {
      pairs = pairs.filter(p => p.ageMinutes <= options.maxAgeMinutes!);
    }
    if (options.minLiquidity) {
      pairs = pairs.filter(p => p.liquidity >= options.minLiquidity!);
    }
    if (options.maxLiquidity) {
      pairs = pairs.filter(p => p.liquidity <= options.maxLiquidity!);
    }
    if (options.minVolume) {
      pairs = pairs.filter(p => p.volume24h >= options.minVolume!);
    }
    if (options.minMarketCap) {
      pairs = pairs.filter(p => p.marketCap >= options.minMarketCap!);
    }
    if (options.maxMarketCap) {
      pairs = pairs.filter(p => p.marketCap <= options.maxMarketCap!);
    }

    return pairs.slice(0, options.limit || 20);
  } catch (error) {
    console.error("Failed to get new pairs:", error);
    return [];
  }
}

/**
 * Get detailed pair metrics (volume, trades, price changes over multiple timeframes)
 * Uses DexScreener directly (no API key needed)
 * Note: 30m/1h granular data not available via DexScreener, only 24h
 */
export async function getPairDetails(address: string): Promise<PairOverview | null> {
  // Use DexScreener directly - the /api/data/pair-details endpoint doesn't exist
  const tokenInfo = await getTokenInfo(address);
  if (tokenInfo) {
    return {
      price: tokenInfo.price,
      volume30m: 0, // Not available from DexScreener
      volume1h: 0,  // Not available from DexScreener
      volume24h: tokenInfo.volume24h,
      liquidity: tokenInfo.liquidity,
      trades30m: 0, // Not available from DexScreener
      trades1h: 0,  // Not available from DexScreener
      priceChange30m: 0, // Not available from DexScreener
      priceChange1h: 0,  // Not available from DexScreener
    };
  }
  return null;
}

/**
 * Advanced token search with multiple filters
 * Uses DexScreener directly with local filtering (no API key needed)
 * Note: minHolders filter not available via DexScreener
 */
export async function advancedSearchTokens(options: {
  keyword?: string;
  symbolStartsWith?: string;
  nameContains?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minLiquidity?: number;
  maxLiquidity?: number;
  minVolume24h?: number;
  minHolders?: number;
  limit?: number;
}): Promise<TokenOverview[]> {
  // Use DexScreener directly - the /api/data/search-tokens endpoint doesn't exist
  const query = options.keyword || options.symbolStartsWith || "solana";
  
  try {
    const results = await searchTokens(query);
    
    return results
      .filter(r => {
        if (options.symbolStartsWith && !r.symbol.toUpperCase().startsWith(options.symbolStartsWith.toUpperCase())) return false;
        if (options.nameContains && !r.name.toLowerCase().includes(options.nameContains.toLowerCase())) return false;
        if (options.minMarketCap && r.marketCap < options.minMarketCap) return false;
        if (options.maxMarketCap && r.marketCap > options.maxMarketCap) return false;
        if (options.minLiquidity && r.liquidity < options.minLiquidity) return false;
        if (options.maxLiquidity && r.liquidity > options.maxLiquidity) return false;
        if (options.minVolume24h && r.volume24h < options.minVolume24h) return false;
        // minHolders not available from DexScreener
        return true;
      })
      .slice(0, options.limit || 20)
      .map(r => ({
        address: r.address,
        symbol: r.symbol,
        name: r.name,
        decimals: 9,
        price: r.price,
        priceChange24h: r.priceChange24h,
        volume24h: r.volume24h,
        liquidity: r.liquidity,
        marketCap: r.marketCap,
      }));
  } catch (error) {
    console.error("Advanced search error:", error);
    return [];
  }
}

/**
 * Get token overview by address
 * Uses DexScreener directly (no API key needed)
 */
export async function getTokenOverview(address: string): Promise<TokenOverview | null> {
  // Use DexScreener directly - the /api/data/token-overview endpoint doesn't exist
  const info = await getTokenInfo(address);
  if (info) {
    return {
      address: info.address,
      symbol: info.symbol,
      name: info.name,
      decimals: 9, // Default, actual decimals would need on-chain lookup
      price: info.price,
      priceChange24h: info.priceChange24h,
      volume24h: info.volume24h,
      liquidity: info.liquidity,
      marketCap: info.marketCap,
    };
  }
  return null;
}
