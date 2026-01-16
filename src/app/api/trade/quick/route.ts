import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { executeSwap, toSmallestUnit, fromSmallestUnit, getTokenDecimals, TOKEN_MINTS } from "@/lib/jupiter";
import { getTokenOverview } from "@/lib/birdeye";

export const dynamic = "force-dynamic";

const tradeSchema = z.object({
  action: z.enum(["buy", "sell"]),
  tokenMint: z.string().min(32),
  amount: z.number().positive().optional(),
  percentage: z.number().min(1).max(100).optional(),
  slippageBps: z.number().default(100),
});

/**
 * POST /api/trade/quick
 * Execute a quick buy or sell trade
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { action, tokenMint, amount, percentage, slippageBps } = tradeSchema.parse(body);

    // Get user wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const SOL_MINT = TOKEN_MINTS.SOL;
    let inputMint: string;
    let outputMint: string;
    let tradeAmount: number;

    if (action === "buy") {
      // Buy: SOL -> Token
      inputMint = SOL_MINT;
      outputMint = tokenMint;
      
      if (!amount) {
        return NextResponse.json({ error: "Amount required for buy" }, { status: 400 });
      }
      tradeAmount = amount;
    } else {
      // Sell: Token -> SOL
      inputMint = tokenMint;
      outputMint = SOL_MINT;
      
      // Get token balance to calculate sell amount
      const tokenInfo = await getTokenOverview(tokenMint);
      if (!tokenInfo) {
        return NextResponse.json({ error: "Token not found" }, { status: 404 });
      }

      // For percentage-based sells, we need to get the actual balance
      // This would require querying the wallet's token balance
      if (percentage) {
        // TODO: Get actual token balance and calculate percentage
        // For now, require explicit amount
        return NextResponse.json({ 
          error: "Percentage sell requires amount. Please specify the amount to sell." 
        }, { status: 400 });
      }
      
      if (!amount) {
        return NextResponse.json({ error: "Amount required for sell" }, { status: 400 });
      }
      tradeAmount = amount;
    }

    // Get token decimals
    const inputDecimals = getTokenDecimals(inputMint);
    const outputDecimals = getTokenDecimals(outputMint);
    
    // Convert to smallest unit
    const amountSmallest = toSmallestUnit(tradeAmount, inputDecimals);

    // Execute the swap
    const result = await executeSwap(
      user.wallet.encryptedPrivateKey,
      inputMint,
      outputMint,
      amountSmallest,
      slippageBps
    );

    // Get token info for the trade record
    const outputTokenInfo = await getTokenOverview(outputMint);
    const inputTokenInfo = await getTokenOverview(inputMint);

    // Record the trade
    const trade = await prisma.trade.create({
      data: {
        userId,
        signature: result.signature,
        type: "SPOT",
        direction: action.toUpperCase(),
        inputToken: inputMint,
        outputToken: outputMint,
        inputAmount: tradeAmount,
        outputAmount: fromSmallestUnit(parseInt(result.outputAmount), outputDecimals),
        priceUsd: outputTokenInfo?.price || 0,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        signature: result.signature,
        action,
        inputToken: inputTokenInfo?.symbol || inputMint.slice(0, 8),
        outputToken: outputTokenInfo?.symbol || outputMint.slice(0, 8),
        inputAmount: tradeAmount,
        outputAmount: fromSmallestUnit(parseInt(result.outputAmount), outputDecimals),
        priceImpact: result.priceImpact,
        explorerUrl: `https://solscan.io/tx/${result.signature}`,
      },
    });
  } catch (error) {
    console.error("Quick trade error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trade failed" },
      { status: 500 }
    );
  }
}
