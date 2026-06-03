import type { NextRequest } from "next/server";

import { fetchRandomArticle } from "@/lib/wikipedia";
import { getRoom, setRoom } from "@/lib/redis";
import {
  createPlayer,
  errorResponse,
  generateRoomId,
  MAX_CLIENT_ID_LENGTH,
  MAX_USERNAME_LENGTH,
} from "@/lib/room";
import type { Room, WikiLanguage } from "@/lib/types";

/**
 * POST /api/room/create
 * Body: { username: string, clientId: string }
 *
 * Buat room baru dengan status 'lobby', simpan ke Redis (TTL 24 jam),
 * dan return `{ roomId, room }`. Pemain pertama otomatis jadi host.
 *
 * Catatan: tidak perlu publish ke Ably karena belum ada subscriber lain
 * (host akan subscribe setelah dapat roomId).
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    username?: unknown;
    clientId?: unknown;
    language?: unknown;
    random?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";
  const language: WikiLanguage =
    body.language === "en" ? "en" : "id";
  const random = !!body.random;

  if (!username) return errorResponse("username wajib diisi.");
  if (username.length > MAX_USERNAME_LENGTH) {
    return errorResponse(`Nama maksimal ${MAX_USERNAME_LENGTH} karakter.`);
  }
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (clientId.length > MAX_CLIENT_ID_LENGTH) {
    return errorResponse("clientId tidak valid.");
  }

  let startArticle = "";
  let endArticle = "";

  if (random) {
    const s = await fetchRandomArticle(language);
    const e = await fetchRandomArticle(language);
    if (!s || !e || s === e) {
      return errorResponse("Gagal generate artikel random. Coba lagi.");
    }
    startArticle = s;
    endArticle = e;
  }

  // Cari roomId yang belum dipakai. Tabrakan amat jarang
  // (32^6 = ~1 milyar), tapi tetap kita guard.
  let roomId = generateRoomId();
  for (let i = 0; i < 5; i++) {
    const existing = await getRoom(roomId);
    if (!existing) break;
    roomId = generateRoomId();
  }

  const room: Room = {
    id: roomId,
    hostClientId: clientId,
    status: "lobby",
    language,
    startArticle,
    endArticle,
    players: [createPlayer(clientId, username, true)],
    createdAt: Date.now(),
  };

  await setRoom(room);

  return Response.json({ roomId, room });
}
