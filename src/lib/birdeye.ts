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
      price: token.price || 0,
      priceChange24h: token.priceChange24hPercent || 0,
      volume24h: token.v24hUSD || token.volume24hUSD || 0,
      liquidity: token.liquidity || 0,
      // Market cap: mc is the primary field from Birdeye, realMc and fdv as fallbacks
      marketCap: token.mc || token.realMc || token.fdv || 0,
      supply: token.supply || 0,
      holder: token.holder || 0,
    };
  } catch (error) {
    console.error("Birdeye token overview error:", error);
    return null;
  }
}

/**
 * Search tokens by keyword
 */
export async function searchTokens(query: string, limit: number = 10): Promise<TokenOverview[]> {
  try {
    const url = new URL(`${BIRDEYE_API_BASE}/defi/v3/search`);
    url.searchParams.set("keyword", query);
    url.searchParams.set("target", "token");
    url.searchParams.set("sort_by", "volume_24h_usd");
    url.searchParams.set("sort_type", "desc");
    url.searchParams.set("offset", "0");
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
    });

    if (!response.ok) {
      // Fallback to old endpoint
      const fallbackUrl = new URL(`${BIRDEYE_API_BASE}/defi/token_search`);
      fallbackUrl.searchParams.set("keyword", query);
      fallbackUrl.searchParams.set("limit", limit.toString());
      
      const fallbackRes = await fetch(fallbackUrl.toString(), { headers: getHeaders() });
      if (!fallbackRes.ok) return [];
      
      const fallbackData = await fallbackRes.json();
      if (!fallbackData.success || !fallbackData.data?.items) return [];
      
      return fallbackData.data.items.map((token: any) => ({
        address: token.address,
        symbol: token.symbol || "???",
        name: token.name || "Unknown",
        decimals: token.decimals || 9,
        price: token.price || 0,
        priceChange24h: token.priceChange24hPercent || 0,
        volume24h: token.v24hUSD || token.volume24hUSD || 0,
        liquidity: token.liquidity || 0,
        marketCap: token.mc || token.realMc || token.fdv || 0,
        supply: token.supply || 0,
        holder: token.holder || 0,
      }));
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.items) {
      return [];
    }

    return data.data.items.map((token: any) => ({
      address: token.address,
      symbol: token.symbol || "???",
      name: token.name || "Unknown",
      decimals: token.decimals || 9,
      price: token.price || 0,
      priceChange24h: token.priceChange24hPercent || token.price24hChangePercent || 0,
      volume24h: token.v24hUSD || token.volume24hUSD || 0,
      liquidity: token.liquidity || 0,
      marketCap: token.mc || token.realMc || token.fdv || 0,
      supply: token.supply || 0,
      holder: token.holder || 0,
    }));
  } catch (error) {
    console.error("Birdeye search error:", error);
    return [];
  }
}

/**
 * Advanced token search with multiple filters
 * Use this for complex queries like "tokens starting with X" or "tokens with mcap > Y"
 */
export async function advancedTokenSearch(options: {
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
  const {
    keyword,
    symbolStartsWith,
    nameContains,
    minMarketCap,
    maxMarketCap,
    minLiquidity,
    maxLiquidity,
    minVolume24h,
    minHolders,
    limit = 20,
  } = options;

  // Start with a search if we have a keyword
  let tokens: TokenOverview[] = [];
  
  if (keyword || symbolStartsWith) {
    const searchQuery = keyword || symbolStartsWith || "";
    tokens = await searchTokens(searchQuery, 50); // Get more to filter
  } else {
    // If no keyword, get trending tokens as base
    const trending = await getTrendingTokens(50);
    tokens = trending.map(t => ({
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      decimals: 9, // default
      price: t.price,
      priceChange24h: t.priceChange24h,
      volume24h: t.volume24h,
      liquidity: t.liquidity,
      marketCap: t.marketCap,
      supply: 0,
      holder: 0,
    }));
  }

  // Apply filters
  let filtered = tokens.filter(token => {
    // Symbol starts with filter
    if (symbolStartsWith && !token.symbol.toUpperCase().startsWith(symbolStartsWith.toUpperCase())) {
      return false;
    }
    
    // Name contains filter
    if (nameContains && !token.name.toLowerCase().includes(nameContains.toLowerCase())) {
      return false;
    }
    
    // Market cap filters
    if (minMarketCap && token.marketCap < minMarketCap) return false;
    if (maxMarketCap && token.marketCap > maxMarketCap) return false;
    
    // Liquidity filters
    if (minLiquidity && token.liquidity < minLiquidity) return false;
    if (maxLiquidity && token.liquidity > maxLiquidity) return false;
    
    // Volume filter
    if (minVolume24h && token.volume24h < minVolume24h) return false;
    
    // Holders filter
    if (minHolders && token.holder < minHolders) return false;
    
    return true;
  });

  return filtered.slice(0, limit);
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
 * Valid sort_by options: rank, volume24hUSD, liquidity
 */
async function fetchTrendingTokens(sortBy: "volume24hUSD" | "rank" | "liquidity"): Promise<TrendingToken[]> {
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
      priceChange24h: token.priceChange24hPercent || token.price24hChange || 0,
      volume24h: token.volume24hUSD || token.v24hUSD || 0,
      liquidity: token.liquidity || 0,
      // Market cap: mc is primary, realMc and fdv as fallbacks
      marketCap: token.mc || token.realMc || token.fdv || 0,
      rank: token.rank || index + 1,
    }));
  } catch (error) {
    console.error("Birdeye trending error:", error);
    return [];
  }
}

/**
 * Get tokens sorted by 24h VOLUME (high volume plays)
 * Uses Birdeye's Token List V3 API to get tokens sorted by volume
 * This is DIFFERENT from token_trending which getHotTokens uses
 */
export async function getTrendingTokens(limit: number = 20): Promise<TrendingToken[]> {
  // Return cached data if available and fresh
  if (volumeCache && Date.now() - volumeCache.timestamp < CACHE_TTL_MS) {
    return volumeCache.data.slice(0, limit);
  }

  try {
    const headers = getHeaders();
    
    // Use Token List V3 API - different endpoint from token_trending
    // This gives us tokens sorted purely by volume
    const url = new URL(`${BIRDEYE_API_BASE}/defi/v3/token/list`);
    url.searchParams.set("sort_by", "v24hUSD");  // Sort by 24h volume
    url.searchParams.set("sort_type", "desc");
    url.searchParams.set("offset", "0");
    url.searchParams.set("limit", Math.min(limit + 10, 50).toString());
    
    const response = await fetch(url.toString(), { headers });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data?.items && data.data.items.length > 0) {
        const tokens: TrendingToken[] = data.data.items
          .filter((token: any) => token.v24hUSD > 0 && token.price > 0)
          .map((token: any, index: number) => ({
            address: token.address,
            symbol: token.symbol || "???",
            name: token.name || "Unknown",
            logoURI: token.logoURI || token.logo || "",
            price: token.price || 0,
            priceChange24h: token.priceChange24hPercent || token.price24hChangePercent || 0,
            volume24h: token.v24hUSD || 0,
            liquidity: token.liquidity || 0,
            marketCap: token.mc || token.realMc || token.fdv || 0,
            rank: index + 1,
          }));
        
        if (tokens.length > 0) {
          console.log(`getTrendingTokens (v3/token/list): got ${tokens.length} tokens sorted by volume`);
          volumeCache = { data: tokens, timestamp: Date.now() };
          return tokens.slice(0, limit);
        }
      }
    } else {
      const errorText = await response.text();
      console.error("Token List V3 volume error:", response.status, errorText);
    }
    
    // Fallback: Use token_trending with liquidity sort, then re-sort by volume
    console.log("Token List V3 failed, falling back to token_trending liquidity");
    const liquidityTokens = await fetchTrendingTokens("liquidity");
    const sortedByVolume = liquidityTokens
      .filter(t => t.volume24h > 0 && t.price > 0)
      .sort((a, b) => b.volume24h - a.volume24h)
      .map((t, index) => ({ ...t, rank: index + 1 }));
    
    volumeCache = { data: sortedByVolume, timestamp: Date.now() };
    return sortedByVolume.slice(0, limit);
  } catch (error) {
    console.error("getTrendingTokens error:", error);
    return [];
  }
}

// Cache for high volume new pairs
let highVolumeNewPairsCache: {
  data: TrendingToken[];
  timestamp: number;
} | null = null;

/**
 * Get high-volume NEW tokens (max 3 days old)
 * Uses token_trending endpoint sorted by volume, then filters to recent tokens
 * This is more reliable than v3/token/list which may have permission issues
 */
export async function getHighVolumeNewPairs(limit: number = 15): Promise<TrendingToken[]> {
  // Return cached data if available and fresh
  if (highVolumeNewPairsCache && Date.now() - highVolumeNewPairsCache.timestamp < CACHE_TTL_MS) {
    return highVolumeNewPairsCache.data.slice(0, limit);
  }

  try {
    const headers = getHeaders();
    
    // Strategy: Get trending by volume, combine with new listings
    // to find tokens that are both NEW and have high volume
    const [trendingByVolume, newListings] = await Promise.all([
      fetchTrendingTokens("volume24hUSD"),
      getNewListings(50), // Get more new listings to find ones with volume
    ]);
    
    // Create a set of new token addresses (listed in last 3 days)
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const newTokenAddresses = new Set(
      newListings
        .filter(t => {
          const listedAt = t.listedAt ? new Date(t.listedAt).getTime() : Date.now();
          return listedAt > threeDaysAgo;
        })
        .map(t => t.address.toLowerCase())
    );
    
    // Filter trending tokens to only include new ones
    const newTrendingTokens = trendingByVolume.filter(t => 
      newTokenAddresses.has(t.address.toLowerCase())
    );
    
    // Also add new listings that have good volume, sorted by volume
    const newListingsWithVolume = newListings
      .filter(t => t.volume24h > 0 && t.liquidity > 100)
      .sort((a, b) => b.volume24h - a.volume24h)
      .map((t, index) => ({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        logoURI: t.logoURI,
        price: t.price,
        priceChange24h: 0,
        volume24h: t.volume24h,
        liquidity: t.liquidity,
        marketCap: t.marketCap,
        rank: index + 1,
      }));
    
    // Combine: prioritize trending tokens that are new, then add new listings by volume
    const seen = new Set<string>();
    const combined: TrendingToken[] = [];
    
    for (const token of newTrendingTokens) {
      if (!seen.has(token.address.toLowerCase())) {
        seen.add(token.address.toLowerCase());
        combined.push(token);
      }
    }
    
    for (const token of newListingsWithVolume) {
      if (!seen.has(token.address.toLowerCase())) {
        seen.add(token.address.toLowerCase());
        combined.push(token);
      }
    }
    
    // Re-rank
    const result = combined.map((t, i) => ({ ...t, rank: i + 1 }));
    
    if (result.length > 0) {
      highVolumeNewPairsCache = { data: result, timestamp: Date.now() };
      return result.slice(0, limit);
    }
    
    // Ultimate fallback: just use new listings sorted by volume
    console.log("Using new listings fallback for volume section");
    return await getHighVolumeNewPairsFallback(limit);
  } catch (error) {
    console.error("High volume new pairs error:", error);
    return await getHighVolumeNewPairsFallback(limit);
  }
}

/**
 * Fallback function using new_listing endpoint
 * Used when Token List V3 is not available or fails
 */
async function getHighVolumeNewPairsFallback(limit: number): Promise<TrendingToken[]> {
  try {
    const newListings = await getNewListings(20);
    
    const sorted = newListings
      .filter(t => t.volume24h > 0 && t.liquidity > 0)
      .sort((a, b) => b.volume24h - a.volume24h)
      .map((listing, index) => ({
        address: listing.address,
        symbol: listing.symbol,
        name: listing.name,
        logoURI: listing.logoURI,
        price: listing.price,
        priceChange24h: 0,
        volume24h: listing.volume24h,
        liquidity: listing.liquidity,
        marketCap: listing.marketCap,
        rank: index + 1,
      }));
    
    highVolumeNewPairsCache = { data: sorted, timestamp: Date.now() };
    return sorted.slice(0, limit);
  } catch (error) {
    console.error("High volume new pairs fallback error:", error);
    return [];
  }
}

// Market cap filter constants for Hot tokens (trenches focus)
const HOT_MIN_MCAP = 100000;    // $100k minimum
const HOT_MAX_MCAP = 50000000;  // $50M maximum

/**
 * Get HOT tokens - trending tokens from Birdeye's algorithm
 * Uses /defi/token_trending endpoint with rank sort (Birdeye's trending algorithm)
 * Shows tokens that are currently "hot" based on activity, social, and price action
 * Filtered to $100k - $50M market cap (trenches focus)
 */
export async function getHotTokens(limit: number = 20): Promise<TrendingToken[]> {
  // Return cached data if available and fresh
  if (gainersCache && Date.now() - gainersCache.timestamp < CACHE_TTL_MS) {
    return gainersCache.data.slice(0, limit);
  }

  try {
    // Get tokens from Birdeye's trending algorithm (rank = their internal hot algo)
    const trendingByRank = await fetchTrendingTokens("rank");
    
    console.log(`getHotTokens: got ${trendingByRank.length} raw tokens`);
    
    // Log market cap values to debug
    trendingByRank.slice(0, 5).forEach(t => {
      console.log(`  ${t.symbol}: mcap=${t.marketCap}, price=${t.price}`);
    });
    
    // Filter for quality tokens: $100k - $50M market cap (trenches focus)
    const hotTokens = trendingByRank
      .filter(t => {
        const mcap = t.marketCap || 0;
        return (
          t.price > 0 && 
          t.volume24h > 0 && 
          t.liquidity > 0 &&
          mcap >= HOT_MIN_MCAP && 
          mcap <= HOT_MAX_MCAP
        );
      })
      .map((t, index) => ({ ...t, rank: index + 1 }));

    console.log(`getHotTokens: ${hotTokens.length} tokens after $100k-$50M mcap filter`);

    // If we got tokens, cache and return
    if (hotTokens.length > 0) {
      gainersCache = { data: hotTokens, timestamp: Date.now() };
      return hotTokens.slice(0, limit);
    }

    // Fallback: use liquidity-based trending with same market cap filter
    console.log("No hot tokens from rank filter, trying liquidity fallback");
    const liquidityTokens = await fetchTrendingTokens("liquidity");
    
    const filtered = liquidityTokens
      .filter(t => {
        const mcap = t.marketCap || 0;
        return (
          t.price > 0 && 
          t.volume24h > 0 &&
          mcap >= HOT_MIN_MCAP && 
          mcap <= HOT_MAX_MCAP
        );
      })
      .map((t, index) => ({ ...t, rank: index + 1 }));

    console.log(`getHotTokens fallback: ${filtered.length} tokens after filter`);

    gainersCache = { data: filtered, timestamp: Date.now() };
    return filtered.slice(0, limit);
  } catch (error) {
    console.error("Birdeye hot tokens error:", error);
    
    // Ultimate fallback - just return empty and let UI handle it
    return [];
  }
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
      volume24h: token.v24hUSD || token.volume24hUSD || token.volume24h || 0,
      // Market cap: mc is primary, realMc and fdv as fallbacks
      marketCap: token.mc || token.realMc || token.fdv || 0,
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
 * All filters are optional and use sensible defaults
 */
export async function getNewPairsFiltered(options: {
  maxAgeMinutes?: number;
  minLiquidity?: number;
  maxLiquidity?: number;
  minVolume?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  limit?: number;
} = {}): Promise<NewPairData[]> {
  const {
    maxAgeMinutes = 30,
    minLiquidity = 0,
    maxLiquidity,
    minVolume = 0,
    minMarketCap = 0,
    maxMarketCap,
    limit = 20,
  } = options;

  const allPairs = await getNewListings(20);

  return allPairs
    .filter((pair) => {
      // Filter by age (max age in minutes)
      if (maxAgeMinutes > 0 && pair.ageMinutes > maxAgeMinutes) return false;
      
      // Filter by liquidity (min/max)
      if (minLiquidity > 0 && pair.liquidity < minLiquidity) return false;
      if (maxLiquidity && pair.liquidity > maxLiquidity) return false;
      
      // Filter by volume
      if (minVolume > 0 && pair.volume24h < minVolume) return false;
      
      // Filter by market cap (min/max)
      if (minMarketCap > 0 && pair.marketCap < minMarketCap) return false;
      if (maxMarketCap && pair.marketCap > maxMarketCap) return false;
      
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
