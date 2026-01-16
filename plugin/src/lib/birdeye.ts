/**
 * Birdeye API Integration for Plugin
 */

const BIRDEYE_API_BASE = "https://public-api.birdeye.so";

function getApiKey(): string {
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) {
    throw new Error("BIRDEYE_API_KEY environment variable is required");
  }
  return key;
}

function getHeaders(): HeadersInit {
  return {
    "X-API-KEY": getApiKey(),
    "Content-Type": "application/json",
  };
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

export async function getOHLCV(
  tokenAddress: string,
  timeframe: TimeFrame = "1H",
  limit: number = 100
): Promise<OHLCVCandle[]> {
  const timeframeMs: Record<TimeFrame, number> = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1H": 60 * 60 * 1000,
    "4H": 4 * 60 * 60 * 1000,
    "1D": 24 * 60 * 60 * 1000,
  };

  const url = new URL(`${BIRDEYE_API_BASE}/defi/ohlcv`);
  url.searchParams.set("address", tokenAddress);
  url.searchParams.set("type", timeframe);
  url.searchParams.set(
    "time_from",
    Math.floor((Date.now() - limit * timeframeMs[timeframe]) / 1000).toString()
  );
  url.searchParams.set("time_to", Math.floor(Date.now() / 1000).toString());

  const response = await fetch(url.toString(), { headers: getHeaders() });

  if (!response.ok) {
    throw new Error(`Birdeye API error: ${response.status}`);
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
}

export async function getTokenPrice(tokenAddress: string): Promise<number> {
  const url = new URL(`${BIRDEYE_API_BASE}/defi/price`);
  url.searchParams.set("address", tokenAddress);

  const response = await fetch(url.toString(), { headers: getHeaders() });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.data?.value || 0;
}
