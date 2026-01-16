import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/leaderboard
 * Get leaderboard data sorted by PnL, trades, or win rate
 * Uses database aggregation for better performance
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const sortBy = searchParams.get("sortBy") || "pnl"; // pnl, trades, winRate

    // Use raw SQL for efficient aggregation
    // This avoids loading all trades into memory
    const leaderboardQuery = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string | null;
        avatar: string | null;
        xHandle: string | null;
        createdAt: Date;
        totalPnl: number;
        totalTrades: bigint;
        winningTrades: bigint;
      }>
    >`
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u."xHandle",
        u."createdAt",
        COALESCE(SUM(t."pnlUsd"), 0) as "totalPnl",
        COUNT(t.id) as "totalTrades",
        COUNT(CASE WHEN t."pnlUsd" > 0 AND t.status = 'CONFIRMED' THEN 1 END) as "winningTrades"
      FROM "User" u
      LEFT JOIN "Trade" t ON t."userId" = u.id AND t.status = 'CONFIRMED'
      WHERE u."showOnLeaderboard" = true
      GROUP BY u.id, u.name, u.avatar, u."xHandle", u."createdAt"
      ORDER BY 
        CASE 
          WHEN ${sortBy} = 'pnl' THEN COALESCE(SUM(t."pnlUsd"), 0)
          WHEN ${sortBy} = 'trades' THEN COUNT(t.id)
          WHEN ${sortBy} = 'winRate' THEN 
            CASE 
              WHEN COUNT(t.id) > 0 
              THEN (COUNT(CASE WHEN t."pnlUsd" > 0 AND t.status = 'CONFIRMED' THEN 1 END)::float / COUNT(t.id)::float) * 100
              ELSE 0 
            END
          ELSE COALESCE(SUM(t."pnlUsd"), 0)
        END DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count for pagination
    const totalCountResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "User" WHERE "showOnLeaderboard" = true
    `;
    const totalCount = Number(totalCountResult[0].count);

    // Format results
    const leaderboard = leaderboardQuery.map((user, index) => {
      const totalTrades = Number(user.totalTrades);
      const winningTrades = Number(user.winningTrades);
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      return {
        rank: offset + index + 1,
        id: user.id,
        name: user.name || "anonymous",
        avatar: user.avatar,
        xHandle: user.xHandle,
        totalPnl: Math.round(Number(user.totalPnl) * 100) / 100,
        totalTrades,
        winRate: Math.round(winRate * 10) / 10,
        memberSince: user.createdAt,
      };
    });

    return NextResponse.json({
      leaderboard,
      total: totalCount,
      hasMore: offset + limit < totalCount,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
