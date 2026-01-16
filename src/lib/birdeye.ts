/**
 * Birdeye API Integration
 * Provides OHLCV data and price history for technical analysis
 */

const BIRDEYE_API_BASE = "https://public-api.birdeye.so";

/**
 * Get API headers with authentication
 * Always includes x-chain: solana since we're Solana-focused
 */
function getHeaders(): Record<string, string> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    throw new Error("BIRDEYE_API_KEY environment variable is not set");
  }

  return {
    "X-API-KEY": apiKey,
    "x-chain": "solana",
    "Content-Type": "application/json",
  };
}

export type TimeFrame = "1m" | "3m" | "5m" | "15m" | "30m" | "1H" | "2H" | "4H" | "6H" | "8H" | "12H" | "1D" | "3D" | "1W" | "1M";

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
  supply: number;
  holder: number;
}

/**
 * Get OHLCV candles for a token
 */
export async function getOHLCV(
  tokenAddress: string,
  timeframe: TimeFrame = "1H",
  limit: number = 100
): Promise<OHLCVCandle[]> {
  try {
    const url = new URL(`${BIRDEYE_API_BASE}/defi/ohlcv`);
    url.searchParams.set("address", tokenAddress);
    url.searchParams.set("type", timeframe);
    url.searchParams.set("time_from", Math.floor((Date.now() - limit * getTimeframeMs(timeframe)) / 1000).toString());
    url.searchParams.set("time_to", Math.floor(Date.now() / 1000).toString());

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Birdeye API error: ${error}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.items) {
      return [];
    }

    return data.data.items.map((item: any) => ({
      timestamp: item.unixTime * 1000,
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v,
    }));
  } catch (error) {
    console.error("Birdeye OHLCV error:", error);
    throw error;
  }
}

/**
 * Get price history for a token
 */
export async function getPriceHistory(
  tokenAddress: string,
  timeframe: TimeFrame = "1H",
  limit: number = 100
): Promise<Array<{ timestamp: number; price: number }>> {
  try {
    const url = new URL(`${BIRDEYE_API_BASE}/defi/history_price`);
    url.searchParams.set("address", tokenAddress);
    url.searchParams.set("address_type", "token");
    url.searchParams.set("type", timeframe);
    url.searchParams.set("time_from", Math.floor((Date.now() - limit * getTimeframeMs(timeframe)) / 1000).toString());
    url.searchParams.set("time_to", Math.floor(Date.now() / 1000).toString());

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Birdeye API error: ${error}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.items) {
      return [];
    }

    return data.data.items.map((item: any) => ({
      timestamp: item.unixTime * 1000,
      price: item.value,
    }));
  } catch (error) {
    console.error("Birdeye price history error:", error);
    throw error;
  }
}

/**
 * Get token overview
 */
export async function getTokenOverview(tokenAddress: string): Promise<TokenOverview | null> {
  try {
    const url = new URL(`${BIRDEYE_API_BASE}/defi/token_overview`);
    url.searchParams.set("address", tokenAddress);

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }

    const token = data.data;
    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      price: token.price,
      priceChange24h: token.priceChange24hPercent,
      volume24h: token.v24hUSD,
      liquidity: token.liquidity,
      marketCap: token.mc,
      supply: token.supply,
      holder: token.holder,
    };
  } catch (error) {
    console.error("Birdeye token overview error:", error);
    return null;
  }
}

/**
 * Search tokens
 */
export async function searchTokens(query: string, limit: number = 10): Promise<TokenOverview[]> {
  try {
    const url = new URL(`${BIRDEYE_API_BASE}/defi/token_search`);
    url.searchParams.set("keyword", query);
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.items) {
      return [];
    }

    return data.data.items.map((token: any) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      price: token.price,
      priceChange24h: token.priceChange24hPercent,
      volume24h: token.v24hUSD,
      liquidity: token.liquidity,
      marketCap: token.mc,
      supply: token.supply,
      holder: token.holder,
    }));
  } catch (error) {
    console.error("Birdeye search error:", error);
    return [];
  }
}

export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  rank: number;
}

// Simple in-memory caches to prevent rate limiting
let volumeCache: { data: TrendingToken[]; timestamp: number } | null = null;
let gainersCache: { data: TrendingToken[]; timestamp: number } | null = null;

const CACHE_TTL_MS = 30000; // 30 seconds cache

/**
 * Fetch tokens from Birdeye token_trending endpoint
 */
async function fetchTrendingTokens(sortBy: "volume24hUSD" | "priceChange24hPercent"): Promise<TrendingToken[]> {
  try {
    const headers = getHeaders();

    const url = new URL(`${BIRDEYE_API_BASE}/defi/token_trending`);
    url.searchParams.set("sort_by", sortBy);
    url.searchParams.set("sort_type", "desc");
    url.searchParams.set("offset", "0");
    url.searchParams.set("limit", "20"); // Birdeye max is 20

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Birdeye trending error:", response.status, errorText);
      return [];
    }

    const data = await response.json();

    if (!data.success || !data.data?.tokens) {
      console.error("Birdeye trending: no data", data);
      return [];
    }

    return data.data.tokens.map((token: any, index: number) => ({
      address: token.address,
      symbol: token.symbol || "???",
      name: token.name || "Unknown",
      logoURI: token.logoURI || token.logo || "",
      price: token.price || 0,
      priceChange24h: token.priceChange24hPercent || 0,
      volume24h: token.volume24hUSD || 0,
      liquidity: token.liquidity || 0,
      marketCap: token.mc || token.marketCap || 0,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Birdeye trending error:", error);
    return [];
  }
}

/**
 * Get trending tokens sorted by 24h VOLUME (high volume plays)
 */
export async function getTrendingTokens(limit: number = 20): Promise<TrendingToken[]> {
  // Return cached data if available and fresh
  if (volumeCache && Date.now() - volumeCache.timestamp < CACHE_TTL_MS) {
    return volumeCache.data.slice(0, limit);
  }

  const tokens = await fetchTrendingTokens("volume24hUSD");
  
  volumeCache = { data: tokens, timestamp: Date.now() };
  return tokens.slice(0, limit);
}

/**
 * Get HOT tokens sorted by 24h PRICE CHANGE (biggest gainers/movers)
 */
export async function getHotTokens(limit: number = 20): Promise<TrendingToken[]> {
  // Return cached data if available and fresh
  if (gainersCache && Date.now() - gainersCache.timestamp < CACHE_TTL_MS) {
    return gainersCache.data.slice(0, limit);
  }

  const tokens = await fetchTrendingTokens("priceChange24hPercent");
  
  gainersCache = { data: tokens, timestamp: Date.now() };
  return tokens.slice(0, limit);
}

// Cache for new listings
let newListingsCache: {
  data: NewPairData[];
  timestamp: number;
} | null = null;

export interface NewPairData {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  price: number;
  liquidity: number;
  volume24h: number;
  marketCap: number;
  listedAt: number;
  ageMinutes: number;
  dex?: string;
}

/**
 * Get new token listings from Birdeye
 * Covers all launchpads: Pump.fun, Raydium, Meteora, etc.
 */
export async function getNewListings(
  limit: number = 20
): Promise<NewPairData[]> {
  // Return cached data if fresh (30 seconds)
  if (newListingsCache && Date.now() - newListingsCache.timestamp < CACHE_TTL_MS) {
    return newListingsCache.data.slice(0, limit).map(addAgeMinutes);
  }

  try {
    const headers = getHeaders();

    // Use v2 endpoint for new listings
    const url = new URL(`${BIRDEYE_API_BASE}/defi/v2/tokens/new_listing`);
    url.searchParams.set("limit", Math.min(limit, 20).toString()); // Max 20

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Birdeye new listings error:", response.status, errorText);
      return [];
    }

    const data = await response.json();

    if (!data.success || !data.data?.items) {
      return [];
    }

    const listings = data.data.items.map((token: any) => ({
      address: token.address,
      symbol: token.symbol || "???",
      name: token.name || "Unknown",
      logoURI: token.logoURI || token.logo || "",
      price: token.price || 0,
      liquidity: token.liquidity || 0,
      volume24h: token.v24hUSD || token.volume24h || 0,
      marketCap: token.mc || token.marketCap || 0,
      listedAt: token.listingTime || token.createdAt || Date.now(),
      ageMinutes: 0,
      dex: token.source || token.dex || undefined,
    }));

    // Update cache
    newListingsCache = {
      data: listings,
      timestamp: Date.now(),
    };

    return listings.map(addAgeMinutes);
  } catch (error) {
    console.error("Birdeye new listings error:", error);
    return [];
  }
}

/**
 * Add age in minutes to token data
 */
function addAgeMinutes(token: any): NewPairData {
  const ageMs = Date.now() - (token.listedAt || Date.now());
  return {
    ...token,
    ageMinutes: Math.floor(ageMs / 60000),
  };
}

/**
 * Get new pairs with filters - for sniping strategies
 * @param maxAgeMinutes Maximum age of pair in minutes (default 30)
 * @param minLiquidity Minimum liquidity in USD (default 1000)
 * @param minVolume Minimum 24h volume in USD (default 0)
 */
export async function getNewPairsFiltered(options: {
  maxAgeMinutes?: number;
  minLiquidity?: number;
  minVolume?: number;
  limit?: number;
} = {}): Promise<NewPairData[]> {
  const {
    maxAgeMinutes = 30,
    minLiquidity = 1000,
    minVolume = 0,
    limit = 20,
  } = options;

  const allPairs = await getNewListings(20);

  return allPairs
    .filter((pair) => {
      // Filter by age
      if (pair.ageMinutes > maxAgeMinutes) return false;
      // Filter by liquidity
      if (pair.liquidity < minLiquidity) return false;
      // Filter by volume
      if (minVolume > 0 && pair.volume24h < minVolume) return false;
      return true;
    })
    .slice(0, limit);
}

/**
 * Get pair overview with detailed metrics
 */
export async function getPairOverview(pairAddress: string): Promise<{
  price: number;
  volume30m: number;
  volume1h: number;
  volume24h: number;
  liquidity: number;
  trades30m: number;
  trades1h: number;
  priceChange30m: number;
  priceChange1h: number;
} | null> {
  try {
    const headers = getHeaders();
    const url = new URL(`${BIRDEYE_API_BASE}/defi/v3/pair/overview/single`);
    url.searchParams.set("address", pairAddress);

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      console.error("Birdeye pair overview error:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return null;
    }

    const pair = data.data;
    return {
      price: pair.price || 0,
      volume30m: pair.v30mUSD || 0,
      volume1h: pair.v1hUSD || 0,
      volume24h: pair.v24hUSD || 0,
      liquidity: pair.liquidity || 0,
      trades30m: pair.trade30m || 0,
      trades1h: pair.trade1h || 0,
      priceChange30m: pair.priceChange30mPercent || 0,
      priceChange1h: pair.priceChange1hPercent || 0,
    };
  } catch (error) {
    console.error("Birdeye pair overview error:", error);
    return null;
  }
}

/**
 * Convert timeframe to milliseconds
 */
function getTimeframeMs(timeframe: TimeFrame): number {
  const multipliers: Record<TimeFrame, number> = {
    "1m": 60 * 1000,
    "3m": 3 * 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1H": 60 * 60 * 1000,
    "2H": 2 * 60 * 60 * 1000,
    "4H": 4 * 60 * 60 * 1000,
    "6H": 6 * 60 * 60 * 1000,
    "8H": 8 * 60 * 60 * 1000,
    "12H": 12 * 60 * 60 * 1000,
    "1D": 24 * 60 * 60 * 1000,
    "3D": 3 * 24 * 60 * 60 * 1000,
    "1W": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
  };
  return multipliers[timeframe];
}
