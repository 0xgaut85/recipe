import { NextResponse } from "next/server";
import { getTrendingTokens, getNewListings } from "@/lib/birdeye";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/data/trending
 * Get trending tokens and new listings from Birdeye
 * Birdeye covers all major launchpads including Pump.fun, Raydium, etc.
 */
export async function GET() {
  try {
    // Check if Birdeye API key is configured
    const hasBirdeyeKey = !!process.env.BIRDEYE_API_KEY;

    if (!hasBirdeyeKey) {
      return NextResponse.json({
        trendingPairs: [],
        newLaunches: [],
        message: "Birdeye API key not configured",
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch trending tokens and new listings in parallel
    const [trendingTokens, newListings] = await Promise.all([
      getTrendingTokens(15).catch(() => []),
      getNewListings(10).catch(() => []),
    ]);

    const trendingPairs = trendingTokens.map((token) => ({
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

    const newLaunches = newListings.map((token) => ({
      mint: token.address,
      symbol: token.symbol,
      name: token.name,
      logoURI: token.logoURI,
      price: token.price,
      liquidity: token.liquidity,
      created: token.listedAt,
    }));

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
