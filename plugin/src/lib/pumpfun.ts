const PUMPFUN_API = "https://frontend-api.pump.fun";

export interface PumpFunToken {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  creator: string;
  created_timestamp: number;
  complete: boolean;
  usd_market_cap: number;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  reply_count: number;
}

export async function getNewLaunches(limit = 20): Promise<PumpFunToken[]> {
  const response = await fetch(
    `${PUMPFUN_API}/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC&includeNsfw=false`
  );
  
  if (!response.ok) {
    throw new Error(`Pump.fun API error: ${response.status}`);
  }
  
  return response.json();
}

export async function getTokenByMint(mint: string): Promise<PumpFunToken | null> {
  const response = await fetch(`${PUMPFUN_API}/coins/${mint}`);
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Pump.fun API error: ${response.status}`);
  }
  
  return response.json();
}

export async function searchTokens(query: string): Promise<PumpFunToken[]> {
  const response = await fetch(
    `${PUMPFUN_API}/coins?offset=0&limit=20&sort=market_cap&order=DESC&includeNsfw=false&searchTerm=${encodeURIComponent(query)}`
  );
  
  if (!response.ok) {
    throw new Error(`Pump.fun API error: ${response.status}`);
  }
  
  return response.json();
}

export function formatTokenData(token: PumpFunToken) {
  return {
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
  };
}
