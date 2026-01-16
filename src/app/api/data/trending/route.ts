import { NextResponse } from "next/server";
import { getHotTokens, getNewListings, getHighVolumeNewPairs } from "@/lib/birdeye";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/data/trending
 * Get market data from Birdeye:
 * - hotTokens: Biggest gainers/movers (sorted by 24h price change)
 * - volumeTokens: High volume NEW tokens (max 3 days old, sorted by volume)
 * - newLaunches: Recently launched tokens (very fresh, < 30 min)
 */
export async function GET() {
  try {
    // Check if Birdeye API key is configured
    const hasBirdeyeKey = !!process.env.BIRDEYE_API_KEY;

    if (!hasBirdeyeKey) {
      return NextResponse.json({
        hotTokens: [],
        volumeTokens: [],
        newLaunches: [],
        message: "Birdeye API key not configured",
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch all data in parallel
    // - Hot: biggest price movers
    // - Volume: high volume NEW tokens (max 3 days old)
    // - New: very fresh launches
    const [hotTokens, volumeTokens, newListings] = await Promise.all([
      getHotTokens(15).catch(() => []),
      getHighVolumeNewPairs(15).catch(() => []), // Changed to high volume new pairs
      getNewListings(10).catch(() => []),
    ]);

    // Format hot tokens (gainers by price change)
    const formattedHotTokens = hotTokens.map((token) => ({
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

    // Format volume tokens (high volume)
    const formattedVolumeTokens = volumeTokens.map((token) => ({
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

    // Format new launches
    const formattedNewLaunches = newListings.map((token) => ({
      mint: token.address,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      logoURI: token.logoURI,
      price: token.price,
      liquidity: token.liquidity,
      marketCap: token.marketCap,
      volume24h: token.volume24h,
      listedAt: token.listedAt,
      ageMinutes: token.ageMinutes,
    }));

    return NextResponse.json({
      hotTokens: formattedHotTokens,
      volumeTokens: formattedVolumeTokens,
      newLaunches: formattedNewLaunches,
      // Keep trendingPairs for backward compatibility
      trendingPairs: formattedVolumeTokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch trending data",
        hotTokens: [],
        volumeTokens: [],
        newLaunches: [],
        trendingPairs: [],
      },
      { status: 500 }
    );
  }
}
