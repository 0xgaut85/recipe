/**
 * Strategy Execution API
 * GET: Check and execute active strategies (called by frontend polling)
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { checkAndExecuteStrategies, getStrategyStatus } from "@/lib/strategy-executor";
import { applyRateLimit, rateLimiters } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/strategies/execute
 * Check active strategies and execute trades if opportunities exist
 * Frontend should poll this every 10-30 seconds when strategies are active
 */
export async function GET(req: NextRequest) {
  // Rate limit to prevent abuse (max 10 per minute per IP)
  const rateLimitResult = applyRateLimit(req, rateLimiters.api);
  if (rateLimitResult) {
    return rateLimitResult.response;
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get strategy status first
    const status = await getStrategyStatus(userId);

    // If no active strategies, just return status
    if (status.activeCount === 0) {
      return NextResponse.json({
        executed: false,
        message: "No active strategies",
        status,
        results: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Check and execute strategies
    const results = await checkAndExecuteStrategies(userId);

    // Check if any trades were executed
    const tradesExecuted = results.filter((r) => r.action === "TRADE_EXECUTED");
    const errors = results.filter((r) => r.action === "ERROR");

    return NextResponse.json({
      executed: tradesExecuted.length > 0,
      message:
        tradesExecuted.length > 0
          ? `Executed ${tradesExecuted.length} trade(s)`
          : errors.length > 0
          ? `${errors.length} error(s) occurred`
          : "No opportunities found",
      status: await getStrategyStatus(userId), // Refresh status after execution
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Strategy execution error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute strategies",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
