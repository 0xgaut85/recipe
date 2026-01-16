import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  withdrawSol,
  isValidPublicKey,
  getBalance,
  MIN_WITHDRAWAL_AMOUNT,
  PLATFORM_WITHDRAWAL_FEE,
  MAX_DAILY_WITHDRAWALS,
  RENT_EXEMPT_MINIMUM,
  NETWORK_FEE_ESTIMATE,
} from "@/lib/wallet";
import { applyRateLimit, rateLimiters, createRateLimitHeaders, checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// Withdrawal request schema
const withdrawSchema = z.object({
  amount: z.number().positive(),
  destination: z.string().min(32).max(44),
});

/**
 * GET /api/wallet/withdraw
 * Get withdrawal info and history
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Get current balance
    let solBalance = 0;
    try {
      solBalance = await getBalance(user.wallet.publicKey);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }

    // Get today's withdrawals count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayWithdrawals = await prisma.withdrawal.count({
      where: {
        userId,
        createdAt: { gte: today },
        status: { not: "FAILED" },
      },
    });

    // Get recent withdrawals
    const recentWithdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate max withdrawable amount
    const totalFee = NETWORK_FEE_ESTIMATE + PLATFORM_WITHDRAWAL_FEE;
    const maxWithdrawable = Math.max(0, solBalance - totalFee - RENT_EXEMPT_MINIMUM);

    return NextResponse.json({
      publicKey: user.wallet.publicKey,
      solBalance,
      maxWithdrawable: Math.round(maxWithdrawable * 10000) / 10000,
      minWithdrawal: MIN_WITHDRAWAL_AMOUNT,
      networkFee: NETWORK_FEE_ESTIMATE,
      platformFee: PLATFORM_WITHDRAWAL_FEE,
      totalFee,
      withdrawalsToday: todayWithdrawals,
      maxDailyWithdrawals: MAX_DAILY_WITHDRAWALS,
      canWithdraw: todayWithdrawals < MAX_DAILY_WITHDRAWALS && maxWithdrawable >= MIN_WITHDRAWAL_AMOUNT,
      recentWithdrawals,
    });
  } catch (error) {
    console.error("Withdraw GET error:", error);
    return NextResponse.json(
      { error: "Failed to get withdrawal info" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/withdraw
 * Execute a withdrawal with transaction-based race condition prevention
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting for withdrawals (5 per hour)
  const rateLimitResult = applyRateLimit(req, rateLimiters.withdrawal);
  if (rateLimitResult) {
    return rateLimitResult.response;
  }

  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, destination } = withdrawSchema.parse(body);

    // Validate destination address
    if (!isValidPublicKey(destination)) {
      return NextResponse.json(
        { error: "Invalid destination address" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} SOL` },
        { status: 400 }
      );
    }

    // Use a transaction with serializable isolation to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Get user's wallet with lock
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user?.wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // Check daily withdrawal limit atomically
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayWithdrawals = await tx.withdrawal.count({
        where: {
          userId,
          createdAt: { gte: today },
          status: { not: "FAILED" },
        },
      });

      if (todayWithdrawals >= MAX_DAILY_WITHDRAWALS) {
        throw new Error("DAILY_LIMIT_EXCEEDED");
      }

      // Create pending withdrawal record within transaction
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount,
          fee: NETWORK_FEE_ESTIMATE + PLATFORM_WITHDRAWAL_FEE,
          destination,
          status: "PENDING",
        },
      });

      return { withdrawal, wallet: user.wallet };
    }, {
      // Use serializable isolation to prevent concurrent withdrawals
      isolationLevel: "Serializable",
      timeout: 10000, // 10 second timeout
    });

    // Execute the actual blockchain withdrawal outside the transaction
    // (blockchain operations shouldn't be in a DB transaction)
    try {
      const withdrawResult = await withdrawSol(
        result.wallet.encryptedPrivateKey,
        destination,
        amount
      );

      // Update withdrawal record with success
      await prisma.withdrawal.update({
        where: { id: result.withdrawal.id },
        data: {
          signature: withdrawResult.signature,
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        signature: withdrawResult.signature,
        amount: withdrawResult.netAmount,
        fee: withdrawResult.fee,
        destination,
        explorerUrl: `https://solscan.io/tx/${withdrawResult.signature}`,
      });
    } catch (error) {
      // Update withdrawal as failed
      await prisma.withdrawal.update({
        where: { id: result.withdrawal.id },
        data: {
          status: "FAILED",
        },
      });

      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    // Handle transaction-specific errors
    if (error instanceof Error) {
      if (error.message === "WALLET_NOT_FOUND") {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }
      if (error.message === "DAILY_LIMIT_EXCEEDED") {
        return NextResponse.json(
          { error: `Maximum ${MAX_DAILY_WITHDRAWALS} withdrawals per day` },
          { status: 429 }
        );
      }
    }

    console.error("Withdraw POST error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
