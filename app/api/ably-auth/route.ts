import Ably from "ably";
import type { NextRequest } from "next/server";

/**
 * GET /api/ably-auth?clientId=xxxx
 *
 * Mengembalikan signed Ably TokenRequest sebagai JSON.
 * Dipakai oleh client (`new Ably.Realtime({ authUrl: '/api/ably-auth' })`)
 * supaya `ABLY_API_KEY` tidak pernah dikirim ke browser.
 */

// Selalu jalankan saat request — endpoint auth tidak boleh di-cache.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ABLY_API_KEY belum di-set di environment variable." },
      { status: 500 },
    );
  }

  const clientId = request.nextUrl.searchParams.get("clientId") ?? undefined;

  try {
    const rest = new Ably.Rest({ key: apiKey });
    const tokenRequest = await rest.auth.createTokenRequest({ clientId });
    return Response.json(tokenRequest);
  } catch (error) {
    console.error("[ably-auth] gagal membuat token request:", error);
    return Response.json(
      { error: "Gagal membuat Ably token request." },
      { status: 500 },
    );
  }
}
