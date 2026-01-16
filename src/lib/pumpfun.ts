/**
 * Pump.fun API Integration
 * Fetch new token launches and token information
 */

const PUMPFUN_API_BASE = "https://frontend-api.pump.fun";

export interface PumpFunCoin {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  metadata_uri: string;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  bonding_curve: string;
  associated_bonding_curve: string;
  creator: string;
  created_timestamp: number;
  raydium_pool: string | null;
  complete: boolean;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  total_supply: number;
  market_cap: number;
  usd_market_cap: number;
  reply_count: number;
  last_reply: number | null;
  nsfw: boolean;
  king_of_the_hill_timestamp: number | null;
}

export interface PumpFunTrade {
  signature: string;
  mint: string;
  sol_amount: number;
  token_amount: number;
  is_buy: boolean;
  user: string;
  timestamp: number;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
}

/**
 * Get new coin launches from Pump.fun
 */
export async function getNewLaunches(
  limit: number = 50,
  offset: number = 0
): Promise<PumpFunCoin[]> {
  try {
    const url = new URL(`${PUMPFUN_API_BASE}/coins`);
    url.searchParams.set("sort", "created_timestamp");
    url.searchParams.set("order", "DESC");
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("offset", offset.toString());
    url.searchParams.set("includeNsfw", "false");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Pump.fun API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Pump.fun new launches error:", error);
    return [];
  }
}

/**
 * Get coin details by mint address
 */
export async function getCoinByMint(mint: string): Promise<PumpFunCoin | null> {
  try {
    const response = await fetch(`${PUMPFUN_API_BASE}/coins/${mint}`);

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Pump.fun coin error:", error);
    return null;
  }
}

/**
 * Get recent trades for a coin
 */
export async function getRecentTrades(
  mint: string,
  limit: number = 50
): Promise<PumpFunTrade[]> {
  try {
    const url = new URL(`${PUMPFUN_API_BASE}/trades/latest`);
    url.searchParams.set("mint", mint);
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Pump.fun trades error:", error);
    return [];
  }
}

/**
 * Get coins by creator
 */
export async function getCoinsByCreator(
  creator: string,
  limit: number = 50
): Promise<PumpFunCoin[]> {
  try {
    const url = new URL(`${PUMPFUN_API_BASE}/coins`);
    url.searchParams.set("creator", creator);
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Pump.fun creator coins error:", error);
    return [];
  }
}

/**
 * Get king of the hill coins (trending)
 */
export async function getKingOfTheHill(limit: number = 10): Promise<PumpFunCoin[]> {
  try {
    const url = new URL(`${PUMPFUN_API_BASE}/coins/king-of-the-hill`);
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Pump.fun king of the hill error:", error);
    return [];
  }
}

/**
 * Filter coins by criteria
 */
export function filterCoins(
  coins: PumpFunCoin[],
  criteria: {
    minMarketCap?: number;
    maxMarketCap?: number;
    minAge?: number; // in seconds
    maxAge?: number; // in seconds
    minLiquidity?: number;
    hasTwitter?: boolean;
    hasTelegram?: boolean;
    hasWebsite?: boolean;
    isComplete?: boolean;
  }
): PumpFunCoin[] {
  const now = Date.now();

  return coins.filter((coin) => {
    const age = (now - coin.created_timestamp) / 1000;
    const liquidity = coin.virtual_sol_reserves || 0;

    if (criteria.minMarketCap && coin.usd_market_cap < criteria.minMarketCap) {
      return false;
    }
    if (criteria.maxMarketCap && coin.usd_market_cap > criteria.maxMarketCap) {
      return false;
    }
    if (criteria.minAge && age < criteria.minAge) {
      return false;
    }
    if (criteria.maxAge && age > criteria.maxAge) {
      return false;
    }
    if (criteria.minLiquidity && liquidity < criteria.minLiquidity) {
      return false;
    }
    if (criteria.hasTwitter && !coin.twitter) {
      return false;
    }
    if (criteria.hasTelegram && !coin.telegram) {
      return false;
    }
    if (criteria.hasWebsite && !coin.website) {
      return false;
    }
    if (criteria.isComplete !== undefined && coin.complete !== criteria.isComplete) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate price from bonding curve reserves
 */
export function calculatePrice(
  virtualSolReserves: number,
  virtualTokenReserves: number
): number {
  if (virtualTokenReserves === 0) return 0;
  return virtualSolReserves / virtualTokenReserves;
}

/**
 * Estimate buy amount from bonding curve
 */
export function estimateBuyAmount(
  solAmount: number,
  virtualSolReserves: number,
  virtualTokenReserves: number
): number {
  const k = virtualSolReserves * virtualTokenReserves;
  const newSolReserves = virtualSolReserves + solAmount;
  const newTokenReserves = k / newSolReserves;
  return virtualTokenReserves - newTokenReserves;
}

/**
 * Estimate sell amount from bonding curve
 */
export function estimateSellAmount(
  tokenAmount: number,
  virtualSolReserves: number,
  virtualTokenReserves: number
): number {
  const k = virtualSolReserves * virtualTokenReserves;
  const newTokenReserves = virtualTokenReserves + tokenAmount;
  const newSolReserves = k / newTokenReserves;
  return virtualSolReserves - newSolReserves;
}
