const DEXSCREENER_API = "https://api.dexscreener.com/latest";

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
  marketCap: number;
}

export async function searchTokens(query: string): Promise<DexScreenerPair[]> {
  const response = await fetch(
    `${DEXSCREENER_API}/dex/search?q=${encodeURIComponent(query)}`
  );
  
  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status}`);
  }
  
  const data = await response.json();
  return (data.pairs || []).filter((p: DexScreenerPair) => p.chainId === "solana");
}

export async function getTokenByAddress(tokenAddress: string): Promise<DexScreenerPair[]> {
  const response = await fetch(
    `${DEXSCREENER_API}/dex/tokens/${tokenAddress}`
  );
  
  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status}`);
  }
  
  const data = await response.json();
  return (data.pairs || []).filter((p: DexScreenerPair) => p.chainId === "solana");
}

export function formatPairData(pair: DexScreenerPair) {
  return {
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    address: pair.baseToken.address,
    price: parseFloat(pair.priceUsd || "0"),
    change24h: pair.priceChange?.h24 || 0,
    volume24h: pair.volume?.h24 || 0,
    liquidity: pair.liquidity?.usd || 0,
    marketCap: pair.marketCap || pair.fdv || 0,
    dex: pair.dexId,
    url: pair.url,
  };
}
