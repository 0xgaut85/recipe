import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ActivityLog {
  id: string;
  type: "scan" | "check" | "buy" | "sell" | "error" | "info";
  message: string;
  timestamp: string;
  details?: {
    token?: string;
    amount?: number;
    price?: number;
    signature?: string;
  };
}

/**
 * GET /api/strategies/[id]/activity
 * Get activity logs for a specific strategy
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Verify strategy belongs to user
    const strategy = await prisma.strategy.findFirst({
      where: { id, userId },
    });

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    // Get recent trades related to this strategy (based on time window)
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        createdAt: { gte: strategy.createdAt },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Build activity log from trades
    const activities: ActivityLog[] = [];

    // Add strategy creation event
    activities.push({
      id: `created-${strategy.id}`,
      type: "info",
      message: `Strategy "${strategy.name}" created`,
      timestamp: strategy.createdAt.toISOString(),
    });

    // Add activation/deactivation events
    if (strategy.isActive) {
      activities.push({
        id: `active-${strategy.id}`,
        type: "info",
        message: "Strategy is active and scanning for opportunities",
        timestamp: new Date().toISOString(),
      });
    }

    // Add trades as activity
    for (const trade of trades) {
      activities.push({
        id: trade.id,
        type: trade.direction === "BUY" ? "buy" : "sell",
        message: `${trade.direction} ${trade.outputAmount.toFixed(4)} ${trade.outputToken.slice(0, 8)}...`,
        timestamp: trade.createdAt.toISOString(),
        details: {
          token: trade.outputToken,
          amount: trade.outputAmount,
          price: trade.priceUsd,
          signature: trade.signature,
        },
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Add simulated scanning activity if strategy is active
    if (strategy.isActive) {
      const config = strategy.config as any;
      
      // Add recent scan events
      const now = Date.now();
      for (let i = 0; i < 3; i++) {
        const scanTime = new Date(now - i * 30000); // Every 30 seconds
        activities.unshift({
          id: `scan-${i}-${now}`,
          type: "scan",
          message: config.type === "SNIPER" 
            ? `Scanning for new pairs (${config.maxAgeMinutes || 30}min, $${config.minLiquidity || 0} liq)`
            : `Checking market conditions`,
          timestamp: scanTime.toISOString(),
        });
      }
    }

    return NextResponse.json({
      strategyId: id,
      strategyName: strategy.name,
      isActive: strategy.isActive,
      activities: activities.slice(0, 50), // Limit to 50 most recent
      stats: {
        totalTrades: trades.length,
        buyTrades: trades.filter(t => t.direction === "BUY").length,
        sellTrades: trades.filter(t => t.direction === "SELL").length,
        totalPnl: trades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0),
      },
    });
  } catch (error) {
    console.error("Strategy activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
