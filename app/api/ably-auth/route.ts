import Ably from "ably";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/redis";

/**
 * GET /api/ably-auth?clientId=xxxx
 *
 * Mengembalikan signed Ably TokenRequest sebagai JSON.
 * Dipakai oleh client (`new Ably.Realtime({ authUrl: '/api/ably-auth' })`)
 * supaya `ABLY_API_KEY` tidak pernah dikirim ke browser.
 */

// Selalu jalankan saat request — endpoint auth tidak boleh di-cache.
export const dynamic = "force-dynamic";

// Regex untuk validasi UUID v4
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  // Rate limit: Maksimal 3 token request per 60 detik per IP
  const { allowed } = await checkRateLimit(ip, "ably_auth", 3, 60);
  if (!allowed) {
    return Response.json(
      { error: "Terlalu banyak permintaan token. Silakan coba lagi nanti." },
      { status: 429 },
    );
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ABLY_API_KEY belum di-set di environment variable." },
      { status: 500 },
    );
  }

  const clientId = request.nextUrl.searchParams.get("clientId") ?? "";

  // Validasi clientId harus berformat UUID v4
  if (!clientId || !UUID_V4_REGEX.test(clientId)) {
    return Response.json(
      { error: "clientId tidak valid atau tidak berformat UUID v4." },
      { status: 400 },
    );
  }

  try {
    const rest = new Ably.Rest({ key: apiKey });
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      ttl: 2700000, // 45 menit dalam milidetik (45 * 60 * 1000)
      capability: {
        "room:*": ["subscribe", "presence"],
      },
    });
    return Response.json(tokenRequest);
  } catch (error) {
    console.error("[ably-auth] gagal membuat token request:", error);
    return Response.json(
      { error: "Gagal membuat Ably token request." },
      { status: 500 },
    );
  }
}

