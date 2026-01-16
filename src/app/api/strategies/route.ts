import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Condition schema for CONDITIONAL strategies
const conditionSchema = z.object({
  indicator: z.enum(["EMA", "RSI", "SMA", "PRICE"]),
  period: z.number().optional(),
  timeframe: z.enum(["1m", "5m", "15m", "1H", "4H", "1D"]).optional(),
  trigger: z.enum(["price_above", "price_below", "price_touches", "crosses_above", "crosses_below"]),
  value: z.number().optional(),
});

// Strategy creation schema
const createStrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  config: z.object({
    type: z.enum(["SPOT", "SNIPER", "CONDITIONAL"]),
    token: z.string().optional(),
    inputToken: z.string().optional(),
    outputToken: z.string().optional(),
    amount: z.number().positive().optional(),
    direction: z.enum(["buy", "sell"]).optional(),
    conditions: z.array(z.object({
      type: z.string(),
      value: z.any(),
    })).optional(),
    stopLoss: z.number().optional(),
    takeProfit: z.number().optional(),
    // SNIPER specific config
    maxAgeMinutes: z.number().optional(),
    minLiquidity: z.number().optional(),
    maxLiquidity: z.number().optional(),
    minVolume: z.number().optional(),
    minMarketCap: z.number().optional(),
    maxMarketCap: z.number().optional(),
    slippageBps: z.number().optional(),
    nameFilter: z.string().optional(),
    // CONDITIONAL specific config
    condition: conditionSchema.optional(),
  }),
});

/**
 * GET /api/strategies
 * Get all strategies for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const strategies = await prisma.strategy.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Get trade stats for each strategy
    const strategiesWithStats = await Promise.all(
      strategies.map(async (strategy) => {
        // Get trades related to this strategy (by matching time window)
        const trades = await prisma.trade.findMany({
          where: {
            userId,
            createdAt: {
              gte: strategy.createdAt,
            },
          },
          select: {
            pnlUsd: true,
            status: true,
          },
        });

        const totalPnl = trades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0);
        const totalTrades = trades.filter(t => t.status === "CONFIRMED").length;
        const winningTrades = trades.filter(t => (t.pnlUsd || 0) > 0).length;

        return {
          ...strategy,
          stats: {
            totalPnl,
            totalTrades,
            winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
          },
        };
      })
    );

    return NextResponse.json({ strategies: strategiesWithStats });
  } catch (error) {
    console.error("Strategies GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/strategies
 * Create a new strategy
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, config } = createStrategySchema.parse(body);

    const strategy = await prisma.strategy.create({
      data: {
        userId,
        name,
        description,
        config,
        isActive: false,
      },
    });

    return NextResponse.json({ strategy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Strategies POST error:", error);
    return NextResponse.json(
      { error: "Failed to create strategy" },
      { status: 500 }
    );
  }
}
