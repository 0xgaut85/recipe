import { NextRequest, NextResponse } from "next/server";
import { getNewPairsFiltered } from "@/lib/birdeye";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/data/new-pairs
 * Get newly launched token pairs with filters for sniping strategies
 * Uses Birdeye's official /defi/v2/tokens/new_listing endpoint
 * Covers all launchpads: Pump.fun, Raydium, Meteora, etc.
 */
export async function GET(req: NextRequest) {
  try {
    // Check if Birdeye API key is configured
    const hasBirdeyeKey = !!process.env.BIRDEYE_API_KEY;

    if (!hasBirdeyeKey) {
      return NextResponse.json(
        {
          pairs: [],
          error: "Birdeye API key not configured",
        },
        { status: 503 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const options = {
      maxAgeMinutes: searchParams.get("maxAgeMinutes")
        ? parseInt(searchParams.get("maxAgeMinutes")!)
        : undefined,
      minLiquidity: searchParams.get("minLiquidity")
        ? parseFloat(searchParams.get("minLiquidity")!)
        : undefined,
      maxLiquidity: searchParams.get("maxLiquidity")
        ? parseFloat(searchParams.get("maxLiquidity")!)
        : undefined,
      minVolume: searchParams.get("minVolume")
        ? parseFloat(searchParams.get("minVolume")!)
        : undefined,
      minMarketCap: searchParams.get("minMarketCap")
        ? parseFloat(searchParams.get("minMarketCap")!)
        : undefined,
      maxMarketCap: searchParams.get("maxMarketCap")
        ? parseFloat(searchParams.get("maxMarketCap")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
    };

    // Get filtered pairs from Birdeye
    const pairs = await getNewPairsFiltered(options);

    return NextResponse.json({
      pairs,
      count: pairs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("New pairs API error:", error);
    return NextResponse.json(
      {
        pairs: [],
        error: "Failed to fetch new pairs",
        count: 0,
      },
      { status: 500 }
    );
  }
}
