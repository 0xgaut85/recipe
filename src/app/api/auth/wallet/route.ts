import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { generateWallet, getBalance, getTokenAccounts } from "@/lib/wallet";
import {
  createSession,
  validateSession,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/session";

const SESSION_COOKIE = getSessionCookieName();

/**
 * GET /api/auth/wallet
 * Get or create wallet for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    // Validate existing session
    let userId: string | null = null;
    if (sessionToken) {
      userId = await validateSession(sessionToken);
    }

    // If no valid session, create a new user and wallet
    if (!userId) {
      // Create new user
      const user = await prisma.user.create({
        data: {
          name: `chef_${Date.now().toString(36)}`,
        },
      });

      // Generate wallet
      const { publicKey, encryptedPrivateKey } = generateWallet();

      // Store wallet
      await prisma.wallet.create({
        data: {
          userId: user.id,
          publicKey,
          encryptedPrivateKey,
        },
      });

      // Create secure session
      const userAgent = req.headers.get("user-agent") || undefined;
      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        undefined;
      const newToken = await createSession(user.id, userAgent, ipAddress);

      // Set session cookie
      const response = NextResponse.json({
        userId: user.id,
        publicKey,
        isNew: true,
      });

      response.cookies.set(SESSION_COOKIE, newToken, getSessionCookieOptions());

      return response;
    }

    // Get existing user and wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      // Invalid user (shouldn't happen but handle gracefully)
      const response = NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    // If user exists but no wallet, create one
    if (!user.wallet) {
      const { publicKey, encryptedPrivateKey } = generateWallet();
      await prisma.wallet.create({
        data: {
          userId: user.id,
          publicKey,
          encryptedPrivateKey,
        },
      });

      return NextResponse.json({
        userId: user.id,
        publicKey,
        isNew: true,
      });
    }

    // Get wallet balance
    let solBalance = 0;
    let tokens: Array<{ mint: string; balance: number; decimals: number }> = [];

    try {
      solBalance = await getBalance(user.wallet.publicKey);
      tokens = await getTokenAccounts(user.wallet.publicKey);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }

    return NextResponse.json({
      userId: user.id,
      publicKey: user.wallet.publicKey,
      solBalance,
      tokens,
      profile: {
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        xHandle: user.xHandle,
        showOnLeaderboard: user.showOnLeaderboard,
      },
      isNew: false,
    });
  } catch (error) {
    console.error("Wallet API error:", error);
    return NextResponse.json(
      { error: "Failed to get or create wallet" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/wallet/refresh
 * Force refresh wallet balance
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = await validateSession(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const solBalance = await getBalance(user.wallet.publicKey);
    const tokens = await getTokenAccounts(user.wallet.publicKey);

    return NextResponse.json({
      publicKey: user.wallet.publicKey,
      solBalance,
      tokens,
    });
  } catch (error) {
    console.error("Wallet refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh wallet" },
      { status: 500 }
    );
  }
}
