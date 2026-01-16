import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Validate that a URL is safe (only https protocol allowed)
 */
function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return true; // null/undefined is valid (no avatar)
  
  try {
    const parsed = new URL(url);
    // Only allow https URLs to prevent javascript: and other protocol attacks
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML from string to prevent XSS
 */
function sanitizeHtml(str: string | null | undefined): string | null | undefined {
  if (!str) return str;
  // Remove all HTML tags
  return str.replace(/<[^>]*>/g, "").trim();
}

/**
 * Sanitize X handle (only alphanumeric and underscore)
 */
function sanitizeXHandle(handle: string | null | undefined): string | null | undefined {
  if (!handle) return handle;
  return handle.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15); // Twitter handles max 15 chars
}

// Profile update schema with custom avatar validation
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine(
      (url) => !url || isValidAvatarUrl(url),
      { message: "Avatar URL must use HTTPS protocol" }
    ),
  bio: z.string().max(500).optional().nullable(),
  xHandle: z.string().max(50).optional().nullable(),
  showOnLeaderboard: z.boolean().optional(),
});

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        xHandle: true,
        showOnLeaderboard: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
export async function PUT(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Additional sanitization for XSS prevention
    const sanitizedData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) {
      sanitizedData.name = sanitizeHtml(validatedData.name);
    }

    if (validatedData.avatar !== undefined) {
      // Double-check avatar URL is safe
      if (validatedData.avatar && !isValidAvatarUrl(validatedData.avatar)) {
        return NextResponse.json(
          { error: "Avatar URL must use HTTPS protocol" },
          { status: 400 }
        );
      }
      sanitizedData.avatar = validatedData.avatar;
    }

    if (validatedData.bio !== undefined) {
      sanitizedData.bio = sanitizeHtml(validatedData.bio);
    }

    if (validatedData.xHandle !== undefined) {
      sanitizedData.xHandle = sanitizeXHandle(validatedData.xHandle);
    }

    if (validatedData.showOnLeaderboard !== undefined) {
      sanitizedData.showOnLeaderboard = validatedData.showOnLeaderboard;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: sanitizedData,
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        xHandle: true,
        showOnLeaderboard: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
