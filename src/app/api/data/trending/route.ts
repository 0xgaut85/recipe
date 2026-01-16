import { NextResponse } from "next/server";
import { getTrendingTokens } from "@/lib/birdeye";
import { getNewLaunches } from "@/lib/pumpfun";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/data/trending
 * Get trending tokens from Birdeye with logos and accurate prices
 */
export async function GET() {
  try {
    // Check if Birdeye API key is configured
    const hasBirdeyeKey = !!process.env.BIRDEYE_API_KEY;

    let trendingPairs: Array<{
      symbol: string;
      name: string;
      address: string;
      logoURI: string;
      price: number;
      priceChange24h: number;
      volume24h: number;
      liquidity: number;
      marketCap: number;
      rank?: number;
    }> = [];

    // Fetch trending from Birdeye (preferred)
    if (hasBirdeyeKey) {
      try {
        const birdeyeTrending = await getTrendingTokens(15);
        trendingPairs = birdeyeTrending.map((token) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          logoURI: token.logoURI,
          price: token.price,
          priceChange24h: token.priceChange24h,
          volume24h: token.volume24h,
          liquidity: token.liquidity,
          marketCap: token.marketCap,
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
      imageUri?: string;
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
        imageUri: coin.image_uri,
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
