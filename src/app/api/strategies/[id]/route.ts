import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Strategy update schema
const updateStrategySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
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
    // SNIPER specific
    maxAgeMinutes: z.number().optional(),
    minLiquidity: z.number().optional(),
    maxLiquidity: z.number().optional(),
    minVolume: z.number().optional(),
    minMarketCap: z.number().optional(),
    maxMarketCap: z.number().optional(),
    slippageBps: z.number().optional(),
    nameFilter: z.string().optional(),
    // CONDITIONAL specific
    condition: z.object({
      indicator: z.enum(["EMA", "RSI", "SMA", "PRICE"]),
      period: z.number().optional(),
      timeframe: z.enum(["1m", "5m", "15m", "1H", "4H", "1D"]).optional(),
      trigger: z.enum(["price_above", "price_below", "price_touches", "crosses_above", "crosses_below"]),
      value: z.number().optional(),
    }).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/strategies/[id]
 * Get a specific strategy
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const strategy = await prisma.strategy.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("Strategy GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/strategies/[id]
 * Update a strategy (including start/stop)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check ownership
    const existing = await prisma.strategy.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateStrategySchema.parse(body);

    const strategy = await prisma.strategy.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ strategy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Strategy PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/strategies/[id]
 * Delete a strategy
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check ownership
    const existing = await prisma.strategy.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    await prisma.strategy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Strategy DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete strategy" },
      { status: 500 }
    );
  }
}
