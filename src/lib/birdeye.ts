/**
 * Birdeye API Integration
 * Provides OHLCV data and price history for technical analysis
 */

const BIRDEYE_API_BASE = "https://public-api.birdeye.so";

/**
 * Get API headers with authentication
 */
function getHeaders(): HeadersInit {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    throw new Error("BIRDEYE_API_KEY environment variable is not set");
  }

  return {
    "X-API-KEY": apiKey,
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

/**
 * Get trending tokens from Birdeye
 */
export async function getTrendingTokens(
  limit: number = 20,
  offset: number = 0
): Promise<Array<{
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  rank: number;
}>> {
  try {
    const headers = getHeaders();
    // Add chain header for Solana
    (headers as Record<string, string>)["x-chain"] = "solana";

    const url = new URL(`${BIRDEYE_API_BASE}/defi/token_trending`);
    url.searchParams.set("sort_by", "rank");
    url.searchParams.set("sort_type", "asc");
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("offset", offset.toString());

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      console.error("Birdeye trending error:", response.status);
      return [];
    }

    const data = await response.json();

    if (!data.success || !data.data?.tokens) {
      return [];
    }

    return data.data.tokens.map((token: any, index: number) => ({
      address: token.address,
      symbol: token.symbol || "???",
      name: token.name || "Unknown",
      price: token.price || 0,
      priceChange24h: token.priceChange24hPercent || 0,
      volume24h: token.v24hUSD || 0,
      liquidity: token.liquidity || 0,
      rank: offset + index + 1,
    }));
  } catch (error) {
    console.error("Birdeye trending error:", error);
    return [];
  }
}

/**
 * Get new token listings from Birdeye
 */
export async function getNewListings(
  limit: number = 20
): Promise<Array<{
  address: string;
  symbol: string;
  name: string;
  price: number;
  liquidity: number;
  listedAt: number;
}>> {
  try {
    const headers = getHeaders();
    (headers as Record<string, string>)["x-chain"] = "solana";

    const url = new URL(`${BIRDEYE_API_BASE}/defi/token_new_listing`);
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      console.error("Birdeye new listings error:", response.status);
      return [];
    }

    const data = await response.json();

    if (!data.success || !data.data?.items) {
      return [];
    }

    return data.data.items.map((token: any) => ({
      address: token.address,
      symbol: token.symbol || "???",
      name: token.name || "Unknown",
      price: token.price || 0,
      liquidity: token.liquidity || 0,
      listedAt: token.listingTime || Date.now(),
    }));
  } catch (error) {
    console.error("Birdeye new listings error:", error);
    return [];
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
