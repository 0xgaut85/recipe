import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { generateWallet, getBalance, getTokenAccounts } from "@/lib/wallet";
import {
  createSession,
  validateSessionWithWallet,
  invalidateSession,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/session";

const SESSION_COOKIE = getSessionCookieName();

/**
 * POST /api/auth/wallet
 * Authenticate with connected wallet address
 * This ties the session to the specific wallet that's connected
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const connectedWallet = body.connectedWallet as string;

    if (!connectedWallet || connectedWallet.length < 32) {
      return NextResponse.json(
        { error: "Connected wallet address required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    // Check if we have a valid session for THIS wallet
    if (sessionToken) {
      const { userId, walletMatch } = await validateSessionWithWallet(
        sessionToken,
        connectedWallet
      );

      if (userId && walletMatch) {
        // Session is valid and matches this wallet - return existing user
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { wallet: true },
        });

        if (user?.wallet) {
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
        }
      }

      // Session exists but wallet doesn't match - invalidate it
      if (userId && !walletMatch) {
        await invalidateSession(sessionToken);
      }
    }

    // Check if this wallet has been used before
    // First, check active sessions
    let existingUserId: string | null = null;
    
    const existingSession = await prisma.session.findFirst({
      where: {
        connectedWallet,
        expiresAt: { gt: new Date() },
      },
      select: { userId: true },
      orderBy: { lastUsedAt: "desc" },
    });

    if (existingSession) {
      existingUserId = existingSession.userId;
    } else {
      // Fallback: check expired sessions too (user returning after session expired)
      const expiredSession = await prisma.session.findFirst({
        where: { connectedWallet },
        select: { userId: true },
        orderBy: { lastUsedAt: "desc" },
      });
      
      if (expiredSession) {
        // Verify the user still exists with a wallet
        const existingUser = await prisma.user.findUnique({
          where: { id: expiredSession.userId },
          include: { wallet: true },
        });
        if (existingUser?.wallet) {
          existingUserId = existingUser.id;
        }
      }
    }

    let userId: string;
    let isNew = false;

    if (existingUserId) {
      // User has connected with this wallet before
      userId = existingUserId;
    } else {
      // New wallet - create new user
      const user = await prisma.user.create({
        data: {
          name: `trader_${Date.now().toString(36)}`,
        },
      });
      userId = user.id;
      isNew = true;

      // Generate internal custodial wallet
      const { publicKey, encryptedPrivateKey } = generateWallet();
      await prisma.wallet.create({
        data: {
          userId: user.id,
          publicKey,
          encryptedPrivateKey,
        },
      });
    }

    // Create new session tied to this wallet
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const newToken = await createSession(userId, userAgent, ipAddress, connectedWallet);

    // Get user with wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 500 });
    }

    // Get balance
    let solBalance = 0;
    let tokens: Array<{ mint: string; balance: number; decimals: number }> = [];
    try {
      solBalance = await getBalance(user.wallet.publicKey);
      tokens = await getTokenAccounts(user.wallet.publicKey);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }

    const response = NextResponse.json({
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
      isNew,
    });

    response.cookies.set(SESSION_COOKIE, newToken, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Wallet auth error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate wallet" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/wallet
 * Get current wallet (requires valid session)
 * @deprecated Use POST with connectedWallet instead
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Not authenticated. Please connect your wallet." },
        { status: 401 }
      );
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: { userId: true, expiresAt: true, connectedWallet: true },
    });

    if (!session || new Date() > session.expiresAt) {
      const response = NextResponse.json(
        { error: "Session expired. Please reconnect your wallet." },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    // Get user and wallet
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Get balance
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
      connectedWallet: session.connectedWallet,
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
      { error: "Failed to get wallet" },
      { status: 500 }
    );
  }
}

