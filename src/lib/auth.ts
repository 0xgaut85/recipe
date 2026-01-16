/**
 * Authentication Utilities
 * Re-exports session functions for backward compatibility
 */

import prisma from "./prisma";
import {
  getCurrentUserId as getSessionUserId,
  getCurrentUser as getSessionUser,
  invalidateSession,
  invalidateAllUserSessions,
} from "./session";

/**
 * Get the current user ID from session cookie
 */
export async function getCurrentUserId(): Promise<string | null> {
  return getSessionUserId();
}

/**
 * Get the current user from session cookie
 */
export async function getCurrentUser() {
  return getSessionUser();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * Get user with wallet data
 */
export async function getUserWithWallet(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      trades: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

/**
 * Logout - invalidate current session
 */
export { invalidateSession, invalidateAllUserSessions };
