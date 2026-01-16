import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Strategy creation schema
const createStrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  config: z.object({
    type: z.enum(["SPOT", "PERP"]),
    token: z.string().optional(),
    inputToken: z.string().optional(),
    outputToken: z.string().optional(),
    amount: z.number().positive().optional(),
    leverage: z.number().min(1).max(20).optional(),
    direction: z.enum(["long", "short", "buy", "sell"]).optional(),
    conditions: z.array(z.object({
      type: z.string(),
      value: z.any(),
    })).optional(),
    stopLoss: z.number().optional(),
    takeProfit: z.number().optional(),
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
