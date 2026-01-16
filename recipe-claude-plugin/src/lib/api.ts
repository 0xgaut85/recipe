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
  listedAt?: string;
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
  timestamp: string;
}

export interface WalletData {
  balances: TokenBalance[];
  address: string;
  timestamp: number;
}

/**
 * Get trending tokens, volume leaders, and new launches
 */
export async function getTrending(): Promise<TrendingData> {
  const response = await fetch(`${API_BASE}/data/trending`);

  if (!response.ok) {
    throw new Error(`Failed to fetch trending data: ${response.status}`);
  }

  return response.json();
}

/**
 * Get wallet balances for any address
 */
export async function getWalletBalances(address: string): Promise<WalletData> {
  const response = await fetch(`${API_BASE}/data/wallet?address=${address}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch wallet data: ${response.status}`);
  }

  return response.json();
}

/**
 * Search tokens by name or symbol via DexScreener (no API key needed)
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
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`DexScreener search failed: ${response.status}`);
  }

  const data = await response.json();
  const pairs = (data.pairs || []).filter((p: { chainId: string }) => p.chainId === "solana");

  return pairs.slice(0, 10).map((pair: {
    baseToken: { symbol: string; name: string; address: string };
    priceUsd: string;
    priceChange?: { h24?: number };
    volume?: { h24?: number };
    liquidity?: { usd?: number };
    marketCap?: number;
    fdv?: number;
    dexId: string;
    url: string;
  }) => ({
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
}

/**
 * Get token info by address via DexScreener
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
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${address}`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const pairs = (data.pairs || []).filter((p: { chainId: string }) => p.chainId === "solana");

  if (pairs.length === 0) {
    return null;
  }

  const pair = pairs[0];
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
}

/**
 * Get new pump.fun launches
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
  const response = await fetch(
    `https://frontend-api.pump.fun/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC&includeNsfw=false`
  );

  if (!response.ok) {
    throw new Error(`Pump.fun API failed: ${response.status}`);
  }

  const tokens = await response.json();

  return tokens.map((token: {
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
  }) => ({
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
}
