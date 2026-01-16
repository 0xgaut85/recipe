/**
 * Secure Session Management
 * Uses cryptographically secure tokens with database storage and expiration
 */

import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "./prisma";

const SESSION_COOKIE = "recipe_session";
const SESSION_EXPIRY_DAYS = 30;
const TOKEN_LENGTH = 64; // 64 bytes = 512 bits

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Calculate session expiry date
 */
export function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + SESSION_EXPIRY_DAYS);
  return expiry;
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  return token;
}

/**
 * Validate a session token and return the user ID
 * Also updates lastUsedAt for session activity tracking
 */
export async function validateSession(token: string): Promise<string | null> {
  if (!token || token.length !== TOKEN_LENGTH * 2) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true, id: true },
  });

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (new Date() > session.expiresAt) {
    // Clean up expired session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Update last used time (fire and forget)
  prisma.session
    .update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return session.userId;
}

/**
 * Get current user ID from session cookie
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return validateSession(token);
}

/**
 * Get current user with wallet from session
 */
export async function getCurrentUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.delete({ where: { token } }).catch(() => {});
}

/**
 * Invalidate all sessions for a user (logout everywhere)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

/**
 * Extend session expiry (for "remember me" functionality)
 */
export async function extendSession(token: string): Promise<void> {
  const newExpiry = getSessionExpiry();
  await prisma.session
    .update({
      where: { token },
      data: { expiresAt: newExpiry },
    })
    .catch(() => {});
}

/**
 * Get session cookie name
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

/**
 * Get session cookie options
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // in seconds
    path: "/",
  };
}
