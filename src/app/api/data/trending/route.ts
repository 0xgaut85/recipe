import { NextResponse } from "next/server";
import { getTrendingTokens, getNewListings } from "@/lib/birdeye";
import { getNewLaunches } from "@/lib/pumpfun";

/**
 * GET /api/data/trending
 * Get trending tokens from Birdeye and new launches from Pump.fun
 */
export async function GET() {
  try {
    // Check if Birdeye API key is configured
    const hasBirdeyeKey = !!process.env.BIRDEYE_API_KEY;

    let trendingPairs: Array<{
      symbol: string;
      name: string;
      address: string;
      price: string | number;
      priceChange24h: number;
      volume24h: number;
      liquidity: number;
      rank?: number;
    }> = [];

    // Fetch trending from Birdeye (preferred) or fallback message
    if (hasBirdeyeKey) {
      try {
        const birdeyeTrending = await getTrendingTokens(15);
        trendingPairs = birdeyeTrending.map((token) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          price: token.price,
          priceChange24h: token.priceChange24h,
          volume24h: token.volume24h,
          liquidity: token.liquidity,
          rank: token.rank,
        }));
      } catch (error) {
        console.error("Birdeye trending error:", error);
      }
    }

    // Fetch new launches from Pump.fun
    let newLaunches: Array<{
      mint: string;
      symbol: string;
      name: string;
      marketCap: number;
      liquidity: number;
      created: number;
      complete: boolean;
    }> = [];

    try {
      const pumpfunCoins = await getNewLaunches(10);
      newLaunches = pumpfunCoins.slice(0, 10).map((coin) => ({
        mint: coin.mint,
        symbol: coin.symbol,
        name: coin.name,
        marketCap: coin.usd_market_cap,
        liquidity: coin.virtual_sol_reserves,
        created: coin.created_timestamp,
        complete: coin.complete,
      }));
    } catch (error) {
      console.error("Pump.fun API error:", error);
    }

    // If no Birdeye data and no Pump.fun data, return empty with message
    if (trendingPairs.length === 0 && newLaunches.length === 0) {
      return NextResponse.json({
        trendingPairs: [],
        newLaunches: [],
        message: "Unable to fetch market data. Please check API configuration.",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      trendingPairs,
      newLaunches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch trending data",
        trendingPairs: [],
        newLaunches: [],
      },
      { status: 500 }
    );
  }
}
