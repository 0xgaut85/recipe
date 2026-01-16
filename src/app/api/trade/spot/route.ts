import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  executeSwap,
  getSwapQuote,
  TOKEN_MINTS,
  getTokenDecimals,
  toSmallestUnit,
  fromSmallestUnit,
  getTokenPrice,
} from "@/lib/jupiter";
import { applyRateLimit, rateLimiters } from "@/lib/rate-limit";

// Trade request schema
const tradeSchema = z.object({
  inputToken: z.string().min(32).max(44),
  outputToken: z.string().min(32).max(44),
  amount: z.number().positive(),
  slippageBps: z.number().min(1).max(5000).default(50),
});

// Quote request schema
const quoteSchema = z.object({
  inputToken: z.string().min(32).max(44),
  outputToken: z.string().min(32).max(44),
  amount: z.number().positive(),
  slippageBps: z.number().min(1).max(5000).default(50),
});

/**
 * GET /api/trade/spot
 * Get a swap quote without executing
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params = quoteSchema.parse({
      inputToken: searchParams.get("inputToken"),
      outputToken: searchParams.get("outputToken"),
      amount: parseFloat(searchParams.get("amount") || "0"),
      slippageBps: parseInt(searchParams.get("slippageBps") || "50", 10),
    });

    // Convert amount to smallest unit
    const inputDecimals = getTokenDecimals(params.inputToken);
    const amountSmallest = toSmallestUnit(params.amount, inputDecimals);

    // Get quote
    const quote = await getSwapQuote(
      params.inputToken,
      params.outputToken,
      amountSmallest,
      params.slippageBps
    );

    // Convert output amount
    const outputDecimals = getTokenDecimals(params.outputToken);
    const outputAmount = fromSmallestUnit(parseInt(quote.outAmount), outputDecimals);

    // Get USD prices
    const inputPrice = await getTokenPrice(params.inputToken);
    const outputPrice = await getTokenPrice(params.outputToken);

    return NextResponse.json({
      inputToken: params.inputToken,
      outputToken: params.outputToken,
      inputAmount: params.amount,
      outputAmount,
      priceImpact: parseFloat(quote.priceImpactPct),
      slippageBps: params.slippageBps,
      route: quote.routePlan.map((r) => ({
        dex: r.swapInfo.label,
        percent: r.percent,
      })),
      inputValueUsd: params.amount * inputPrice,
      outputValueUsd: outputAmount * outputPrice,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Quote error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get quote" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trade/spot
 * Execute a spot swap
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
    const params = tradeSchema.parse(body);

    // Get user's wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Convert amount to smallest unit
    const inputDecimals = getTokenDecimals(params.inputToken);
    const amountSmallest = toSmallestUnit(params.amount, inputDecimals);

    // Get quote first for price info
    const quote = await getSwapQuote(
      params.inputToken,
      params.outputToken,
      amountSmallest,
      params.slippageBps
    );

    // Get USD price
    const priceUsd = await getTokenPrice(params.outputToken);

    // Determine direction
    const isBuy = params.inputToken === TOKEN_MINTS.SOL || params.inputToken === TOKEN_MINTS.USDC;

    // Create pending trade record
    const trade = await prisma.trade.create({
      data: {
        userId,
        signature: `pending_${Date.now()}`,
        type: "SPOT",
        direction: isBuy ? "BUY" : "SELL",
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        inputAmount: params.amount,
        outputAmount: fromSmallestUnit(parseInt(quote.outAmount), getTokenDecimals(params.outputToken)),
        priceUsd,
        status: "PENDING",
      },
    });

    try {
      // Execute swap
      const result = await executeSwap(
        user.wallet.encryptedPrivateKey,
        params.inputToken,
        params.outputToken,
        amountSmallest,
        params.slippageBps
      );

      // Update trade record
      const outputDecimals = getTokenDecimals(params.outputToken);
      const actualOutputAmount = fromSmallestUnit(parseInt(result.outputAmount), outputDecimals);

      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          signature: result.signature,
          outputAmount: actualOutputAmount,
          status: "CONFIRMED",
        },
      });

      return NextResponse.json({
        success: true,
        signature: result.signature,
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        inputAmount: params.amount,
        outputAmount: actualOutputAmount,
        priceImpact: parseFloat(result.priceImpact),
        explorerUrl: `https://solscan.io/tx/${result.signature}`,
      });
    } catch (error) {
      // Update trade as failed
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: "FAILED",
        },
      });

      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Trade error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trade failed" },
      { status: 500 }
    );
  }
}
