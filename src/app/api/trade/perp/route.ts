import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DRIFT_MARKETS,
  DriftMarket,
  placeDriftOrder,
  getDriftPositions,
  getDriftMarketData,
  getAllDriftMarkets,
  closeDriftPosition,
} from "@/lib/drift";
import { applyRateLimit, rateLimiters } from "@/lib/rate-limit";

// Trade request schema
const perpTradeSchema = z.object({
  market: z.string().refine((m) => m in DRIFT_MARKETS, {
    message: "Invalid market",
  }),
  direction: z.enum(["long", "short"]),
  size: z.number().positive(),
  leverage: z.number().min(1).max(20),
});

// Close position schema
const closePositionSchema = z.object({
  market: z.string().refine((m) => m in DRIFT_MARKETS, {
    message: "Invalid market",
  }),
});

/**
 * GET /api/trade/perp
 * Get perp markets and user positions
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "markets";

    if (action === "markets") {
      // Get all perp markets
      const markets = await getAllDriftMarkets();
      return NextResponse.json({ markets });
    }

    if (action === "positions") {
      const userId = await getCurrentUserId();

      if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user?.wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }

      const positions = await getDriftPositions(user.wallet.publicKey);
      return NextResponse.json({ positions });
    }

    if (action === "market") {
      const market = searchParams.get("market") as DriftMarket;
      if (!market || !(market in DRIFT_MARKETS)) {
        return NextResponse.json({ error: "Invalid market" }, { status: 400 });
      }

      const marketData = await getDriftMarketData(market);
      return NextResponse.json(marketData);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Perp GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch perp data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trade/perp
 * Open or close a perp position
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting for trades (10 per minute)
  const rateLimitResult = applyRateLimit(req, rateLimiters.trade);
  if (rateLimitResult) {
    return rateLimitResult.response;
  }

  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action || "open";

    // Get user's wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (action === "open") {
      const params = perpTradeSchema.parse(body);
      const market = params.market as DriftMarket;

      // Get market data for price
      const marketData = await getDriftMarketData(market);

      // Create pending trade record
      const trade = await prisma.trade.create({
        data: {
          userId,
          signature: `perp_pending_${Date.now()}`,
          type: "PERP",
          direction: params.direction === "long" ? "LONG" : "SHORT",
          inputToken: "USDC", // Perps use USDC as collateral
          outputToken: market,
          inputAmount: params.size * marketData.price / params.leverage, // Collateral
          outputAmount: params.size,
          priceUsd: marketData.price,
          status: "PENDING",
        },
      });

      try {
        // Place order (currently simulated)
        const result = await placeDriftOrder(
          user.wallet.encryptedPrivateKey,
          market,
          params.direction,
          params.size,
          params.leverage
        );

        // Update trade record - mark as simulated
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            signature: result.orderId,
            priceUsd: result.estimatedEntryPrice,
            // Simulated orders are marked as PENDING since no real trade occurred
            status: result.isSimulated ? "PENDING" : "CONFIRMED",
          },
        });

        return NextResponse.json({
          success: true,
          ...result,
        });
      } catch (error) {
        // Update trade as failed
        await prisma.trade.update({
          where: { id: trade.id },
          data: { status: "FAILED" },
        });

        throw error;
      }
    }

    if (action === "close") {
      const params = closePositionSchema.parse(body);
      const market = params.market as DriftMarket;

      const result = await closeDriftPosition(
        user.wallet.encryptedPrivateKey,
        market
      );

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Perp POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trade failed" },
      { status: 500 }
    );
  }
}
