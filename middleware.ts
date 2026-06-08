import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optional Upstash rate limiting. If UPSTASH envs missing, fallback to
// lightweight in-memory rate limiter for local development.
let useUpstash = false;
let upstashInitialized = false;
let upstashLimiter: any = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Dynamically require to avoid hard dependency in environments where
    // @upstash/ratelimit isn't installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Ratelimit } = require("@upstash/ratelimit");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require("@upstash/redis");

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 s"),
    });

    useUpstash = true;
    upstashInitialized = true;
  }
} catch (err) {
  // If require failed, leave useUpstash false and fall back to in-memory limiter
  // dev-only. We intentionally swallow error to avoid crashing the middleware.
  // eslint-disable-next-line no-console
  console.warn("Upstash init failed, falling back to in-memory rate limiter.", err);
}

// In-memory limiter: Map<key, timestamps[]>
const inMemoryMap: Map<string, number[]> = new Map();
const INMEMORY_LIMIT = 100; // requests
const INMEMORY_WINDOW_MS = 10 * 1000; // 10s

async function inMemoryAllow(key: string) {
  const now = Date.now();
  const arr = inMemoryMap.get(key) ?? [];
  const windowStart = now - INMEMORY_WINDOW_MS;
  const filtered = arr.filter((t) => t >= windowStart);
  filtered.push(now);
  inMemoryMap.set(key, filtered);
  return filtered.length <= INMEMORY_LIMIT;
}

export async function middleware(request: NextRequest) {
  // Only apply rate limiting to /api/ routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

    if (useUpstash && upstashInitialized && upstashLimiter) {
      try {
        const { success } = await upstashLimiter.limit(ip);
        if (!success) {
          return NextResponse.json({ error: "Terlalu banyak request. Tunggu sebentar." }, { status: 429 });
        }
      } catch (err) {
        // If Upstash call fails, log and allow request (fail-open)
        // eslint-disable-next-line no-console
        console.warn("Upstash rate limit check failed, allowing request.", err);
      }
    } else {
      // Fallback in-memory limiter
      const ok = await inMemoryAllow(ip);
      if (!ok) {
        return NextResponse.json({ error: "Terlalu banyak request. Tunggu sebentar." }, { status: 429 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
