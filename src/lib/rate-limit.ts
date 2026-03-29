// In-memory rate limiter (no Redis required, suitable for single-instance Vercel Hobby)
// Tracks request counts per key within sliding time windows.
// Note: state resets on server restart / new deployment, which is acceptable for free tier.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No entry or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Within window
  if (entry.count < config.maxRequests) {
    entry.count++;
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
  }

  // Rate limited
  return { allowed: false, remaining: 0, resetAt: entry.resetAt };
}

// Pre-configured limiters for different endpoint categories
export const RATE_LIMITS = {
  aiChat: { maxRequests: 20, windowMs: 60 * 1000 },
  aiPronunciation: { maxRequests: 30, windowMs: 60 * 1000 },
  dailyCheck: { maxRequests: 10, windowMs: 60 * 1000 },
  search: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;

// Helper: create a JSON 429 response with rate limit headers
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  return Response.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Terlalu banyak permintaan. Coba lagi nanti.",
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
