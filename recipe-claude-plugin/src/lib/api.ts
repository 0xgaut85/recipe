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
