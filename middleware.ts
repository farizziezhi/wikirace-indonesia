import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optional Upstash rate limiting. If UPSTASH envs missing, fallback to
// lightweight in-memory rate limiter for local development.
let useUpstash = false;
let upstashLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 s"),
    });

    useUpstash = true;
  } catch (err) {
    console.warn("Upstash init failed, falling back to in-memory rate limiter.", err);
  }
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
  // Only apply rate limiting & CSRF to /api/ routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const method = request.method;
    const pathname = request.nextUrl.pathname;

    // CSRF Protection for state-changing requests
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && pathname !== "/api/webhooks/saweria") {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "";

      let allowed = true;
      if (origin) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            allowed = false;
          }
        } catch {
          allowed = false;
        }
      } else if (referer) {
        try {
          const refererHost = new URL(referer).host;
          if (refererHost !== host) {
            allowed = false;
          }
        } catch {
          allowed = false;
        }
      }

      if (!allowed) {
        return NextResponse.json({ error: "Akses ditolak: Proteksi CSRF memblokir request ini." }, { status: 403 });
      }
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

    if (useUpstash && upstashLimiter) {
      try {
        const { success } = await upstashLimiter.limit(ip);
        if (!success) {
          return NextResponse.json({ error: "Terlalu banyak request. Tunggu sebentar." }, { status: 429 });
        }
      } catch (err) {
        // If Upstash call fails, log and allow request (fail-open)
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
