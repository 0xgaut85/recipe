/**
 * DexScreener API Integration
 * Fetch token pairs and price data
 */

const DEXSCREENER_API_BASE = "https://api.dexscreener.com/latest";

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
}

/**
 * Search for pairs by query
 */
export async function searchPairs(query: string): Promise<DexScreenerPair[]> {
  try {
    const response = await fetch(
      `${DEXSCREENER_API_BASE}/dex/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to Solana pairs only
    return (data.pairs || []).filter(
      (pair: DexScreenerPair) => pair.chainId === "solana"
    );
  } catch (error) {
    console.error("DexScreener search error:", error);
    return [];
  }
}

/**
 * Get pairs by token address
 */
export async function getPairsByToken(
  tokenAddress: string
): Promise<DexScreenerPair[]> {
  try {
    const response = await fetch(
      `${DEXSCREENER_API_BASE}/dex/tokens/${tokenAddress}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.pairs || [];
  } catch (error) {
    console.error("DexScreener token pairs error:", error);
    return [];
  }
}

/**
 * Get pair by pair address
 */
export async function getPairByAddress(
  pairAddress: string
): Promise<DexScreenerPair | null> {
  try {
    const response = await fetch(
      `${DEXSCREENER_API_BASE}/dex/pairs/solana/${pairAddress}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.pair || null;
  } catch (error) {
    console.error("DexScreener pair error:", error);
    return null;
  }
}

/**
 * Get trending tokens on Solana
 */
export async function getTrendingTokens(): Promise<DexScreenerPair[]> {
  try {
    // DexScreener doesn't have a direct trending endpoint
    // We'll search for popular tokens and sort by volume
    const response = await fetch(
      `${DEXSCREENER_API_BASE}/dex/search?q=solana`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const solanaPairs = (data.pairs || []).filter(
      (pair: DexScreenerPair) => pair.chainId === "solana"
    );

    // Sort by 24h volume
    return solanaPairs
      .sort((a: DexScreenerPair, b: DexScreenerPair) => 
        (b.volume?.h24 || 0) - (a.volume?.h24 || 0)
      )
      .slice(0, 20);
  } catch (error) {
    console.error("DexScreener trending error:", error);
    return [];
  }
}

/**
 * Get token info from DexScreener
 */
export async function getTokenInfo(tokenAddress: string): Promise<{
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  fdv: number;
  pairAddress: string;
  dex: string;
} | null> {
  try {
    const pairs = await getPairsByToken(tokenAddress);
    
    if (pairs.length === 0) {
      return null;
    }

    // Get the pair with highest liquidity
    const bestPair = pairs.reduce((best, pair) =>
      (pair.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? pair : best
    );

    return {
      symbol: bestPair.baseToken.symbol,
      name: bestPair.baseToken.name,
      price: parseFloat(bestPair.priceUsd) || 0,
      priceChange24h: bestPair.priceChange?.h24 || 0,
      volume24h: bestPair.volume?.h24 || 0,
      liquidity: bestPair.liquidity?.usd || 0,
      fdv: bestPair.fdv || 0,
      pairAddress: bestPair.pairAddress,
      dex: bestPair.dexId,
    };
  } catch (error) {
    console.error("DexScreener token info error:", error);
    return null;
  }
}

/**
 * Filter pairs by criteria
 */
export function filterPairs(
  pairs: DexScreenerPair[],
  criteria: {
    minLiquidity?: number;
    maxLiquidity?: number;
    minVolume24h?: number;
    minPriceChange24h?: number;
    maxPriceChange24h?: number;
    minAge?: number; // in milliseconds
    maxAge?: number; // in milliseconds
    dex?: string;
  }
): DexScreenerPair[] {
  const now = Date.now();

  return pairs.filter((pair) => {
    const liquidity = pair.liquidity?.usd || 0;
    const volume = pair.volume?.h24 || 0;
    const priceChange = pair.priceChange?.h24 || 0;
    const age = pair.pairCreatedAt ? now - pair.pairCreatedAt : Infinity;

    if (criteria.minLiquidity && liquidity < criteria.minLiquidity) {
      return false;
    }
    if (criteria.maxLiquidity && liquidity > criteria.maxLiquidity) {
      return false;
    }
    if (criteria.minVolume24h && volume < criteria.minVolume24h) {
      return false;
    }
    if (criteria.minPriceChange24h && priceChange < criteria.minPriceChange24h) {
      return false;
    }
    if (criteria.maxPriceChange24h && priceChange > criteria.maxPriceChange24h) {
      return false;
    }
    if (criteria.minAge && age < criteria.minAge) {
      return false;
    }
    if (criteria.maxAge && age > criteria.maxAge) {
      return false;
    }
    if (criteria.dex && pair.dexId !== criteria.dex) {
      return false;
    }

    return true;
  });
}
