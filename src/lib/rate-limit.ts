/**
 * Simple in-memory rate limiting
 * For production with multiple instances, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (cleared on server restart)
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Identifier for the rate limit bucket (e.g., "api", "chat", "trade") */
  identifier: string;
}

export interface RateLimitResult {
  /** Whether the request should be allowed */
  allowed: boolean;
  /** Current count of requests in the window */
  current: number;
  /** Maximum allowed requests */
  limit: number;
  /** Time in ms until the rate limit resets */
  resetIn: number;
  /** Remaining requests in the current window */
  remaining: number;
}

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${config.identifier}:${key}`;

  let entry = rateLimitStore.get(bucketKey);

  // Create new entry if doesn't exist or has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(bucketKey, entry);
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= config.limit;
  const resetIn = Math.max(0, entry.resetAt - now);
  const remaining = Math.max(0, config.limit - entry.count);

  return {
    allowed,
    current: entry.count,
    limit: config.limit,
    resetIn,
    remaining,
  };
}

/**
 * Get rate limit key from request
 * Uses IP address or session ID
 */
export function getRateLimitKey(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  // Use first IP from forwarded header if available
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a default key (not ideal but prevents errors)
  return "unknown";
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.resetIn / 1000).toString());
  return headers;
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // General API: 100 requests per minute
  api: {
    limit: 100,
    windowMs: 60 * 1000,
    identifier: "api",
  },

  // Chat API: 30 requests per minute (more expensive)
  chat: {
    limit: 30,
    windowMs: 60 * 1000,
    identifier: "chat",
  },

  // Trade execution: 10 per minute (very sensitive)
  trade: {
    limit: 10,
    windowMs: 60 * 1000,
    identifier: "trade",
  },

  // Withdrawal: 5 per hour
  withdrawal: {
    limit: 5,
    windowMs: 60 * 60 * 1000,
    identifier: "withdrawal",
  },

  // Auth: 20 per minute
  auth: {
    limit: 20,
    windowMs: 60 * 1000,
    identifier: "auth",
  },

  // Data endpoints: 60 per minute
  data: {
    limit: 60,
    windowMs: 60 * 1000,
    identifier: "data",
  },
} as const;

/**
 * Helper to apply rate limiting in API routes
 * Returns null if allowed, or a Response if rate limited
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig
): { response: Response; headers: Headers } | null {
  const key = getRateLimitKey(request);
  const result = checkRateLimit(key, config);
  const headers = createRateLimitHeaders(result);

  if (!result.allowed) {
    return {
      response: new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil(result.resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(result.resetIn / 1000).toString(),
          },
        }
      ),
      headers,
    };
  }

  return null;
}
