import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getBalance, getTokenAccounts } from "@/lib/wallet";
import { getTokenOverview } from "@/lib/birdeye";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

interface Position {
  mint: string;
  symbol: string;
  name: string;
  logoURI?: string;
  balance: number;
  decimals: number;
  price: number;
  value: number;
  priceChange24h: number;
  // For P&L calculation
  avgBuyPrice?: number;
  pnl?: number;
  pnlPercent?: number;
}

/**
 * GET /api/data/positions
 * Get user's token positions with real-time prices and P&L
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      return NextResponse.json({ error: "No wallet found" }, { status: 404 });
    }

    // Get SOL balance and token accounts
    const [solBalance, tokenAccounts] = await Promise.all([
      getBalance(user.wallet.publicKey),
      getTokenAccounts(user.wallet.publicKey),
    ]);

    // Get SOL price
    const solAddress = "So11111111111111111111111111111111111111112";
    const solOverview = await getTokenOverview(solAddress);
    const solPrice = solOverview?.price || 200; // Fallback price

    // Build SOL position
    const solPosition: Position = {
      mint: solAddress,
      symbol: "SOL",
      name: "Solana",
      logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      balance: solBalance,
      decimals: 9,
      price: solPrice,
      value: solBalance * solPrice,
      priceChange24h: solOverview?.priceChange24h || 0,
    };

    // Get token positions with prices (limit to first 10 for performance)
    const tokenPositions: Position[] = [];
    const tokensToFetch = tokenAccounts.slice(0, 10);

    for (const token of tokensToFetch) {
      if (token.balance <= 0) continue;

      try {
        const overview = await getTokenOverview(token.mint);
        if (overview) {
          tokenPositions.push({
            mint: token.mint,
            symbol: overview.symbol || "???",
            name: overview.name || "Unknown",
            logoURI: overview.logoURI,
            balance: token.balance,
            decimals: overview.decimals || 9,
            price: overview.price || 0,
            value: token.balance * (overview.price || 0),
            priceChange24h: overview.priceChange24h || 0,
          });
        }
      } catch (error) {
        // Skip tokens we can't get info for
        logger.warn({ mint: token.mint }, "Failed to get token info");
      }
    }

    // Sort by value (highest first)
    const allPositions = [solPosition, ...tokenPositions].sort(
      (a, b) => b.value - a.value
    );

    // Calculate total portfolio value
    const totalValue = allPositions.reduce((sum, pos) => sum + pos.value, 0);

    return NextResponse.json({
      positions: allPositions,
      totalValue,
      solBalance,
      tokenCount: tokenAccounts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Positions API error");
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
