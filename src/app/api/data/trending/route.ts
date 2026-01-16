import { NextResponse } from "next/server";
import { getTrendingTokens } from "@/lib/dexscreener";
import { getNewLaunches } from "@/lib/pumpfun";

/**
 * GET /api/data/trending
 * Get trending tokens from DexScreener and new launches from Pump.fun
 */
export async function GET() {
  try {
    // Fetch trending from DexScreener
    const dexscreenerPairs = await getTrendingTokens();

    // Fetch new launches from Pump.fun
    let pumpfunCoins: any[] = [];
    try {
      pumpfunCoins = await getNewLaunches(10);
    } catch (error) {
      console.error("Pump.fun API error:", error);
    }

    // Format DexScreener data
    const trendingPairs = dexscreenerPairs.slice(0, 10).map((pair) => ({
      symbol: pair.baseToken?.symbol || "???",
      name: pair.baseToken?.name || "Unknown",
      address: pair.baseToken?.address || "",
      price: pair.priceUsd || "0",
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity?.usd || 0,
    }));

    // Format Pump.fun data
    const newLaunches = pumpfunCoins.slice(0, 10).map((coin) => ({
      mint: coin.mint,
      symbol: coin.symbol,
      name: coin.name,
      marketCap: coin.usd_market_cap,
      liquidity: coin.virtual_sol_reserves,
      created: coin.created_timestamp,
      complete: coin.complete,
    }));

    return NextResponse.json({
      trendingPairs,
      newLaunches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending data", trendingPairs: [], newLaunches: [] },
      { status: 500 }
    );
  }
}
