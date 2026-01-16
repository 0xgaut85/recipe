import { NextRequest, NextResponse } from "next/server";
import { getTokenBalances, getSolBalance, getTokenMetadata } from "@/lib/helius";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Missing wallet address", balances: [] },
      { status: 400 }
    );
  }

  try {
    // Fetch balances in parallel
    const [tokenBalances, solBalance] = await Promise.all([
      getTokenBalances(address),
      getSolBalance(address),
    ]);

    // Filter out zero balances
    const nonZeroBalances = tokenBalances.filter((b) => b.amount > 0);

    // Get metadata for tokens with balances
    let metadata: Awaited<ReturnType<typeof getTokenMetadata>> = [];
    if (nonZeroBalances.length > 0) {
      metadata = await getTokenMetadata(nonZeroBalances.map((b) => b.mint));
    }

    // Create a map for quick metadata lookup
    const metadataMap = new Map(metadata.map((m) => [m.mint, m]));

    // Format balances with metadata
    const balances = [
      // SOL balance first
      {
        token: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        balance: solBalance,
        usdValue: solBalance * 100, // Approximate, should fetch real price
        decimals: 9,
      },
      // Token balances
      ...nonZeroBalances.map((balance) => {
        const meta = metadataMap.get(balance.mint);
        return {
          token: balance.mint,
          symbol: meta?.onChainData?.symbol || meta?.offChainData?.symbol || "???",
          name: meta?.onChainData?.name || meta?.offChainData?.name || "Unknown",
          balance: balance.amount,
          usdValue: 0, // Would need price data to calculate
          decimals: balance.decimals,
        };
      }),
    ];

    return NextResponse.json({
      balances,
      address,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Wallet API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet data", balances: [] },
      { status: 500 }
    );
  }
}
