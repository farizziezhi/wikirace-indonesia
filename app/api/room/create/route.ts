import crypto from "crypto";
import type { NextRequest } from "next/server";

import { getChallengePackById } from "@/lib/challenges";
import { fetchRandomArticle } from "@/lib/wikipedia";
import { getRoom, setRoom, checkRateLimit, resolveWikipediaRedirect } from "@/lib/redis";
import {
  createPlayer,
  errorResponse,
  generateRoomId,
  MAX_CLIENT_ID_LENGTH,
  MAX_USERNAME_LENGTH,
  sanitizeRoom,
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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  // Rate limit: Maksimal 3 room per 5 menit per IP
  const { allowed } = await checkRateLimit(ip, "room_create", 3, 300);
  if (!allowed) {
    return errorResponse("Terlalu banyak membuat room. Silakan coba lagi nanti.", 429);
  }

  let body: {
    username?: unknown;
    clientId?: unknown;
    language?: unknown;
    random?: unknown;
    packId?: unknown;
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
  let language: WikiLanguage =
    body.language === "en" ? "en" : "id";
  const random = !!body.random;
  const packId = typeof body.packId === "string" ? body.packId : null;

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

  if (packId) {
    const pack = getChallengePackById(packId);
    if (!pack) return errorResponse("Pack tidak ditemukan.");
    startArticle = pack.startArticle;
    endArticle = pack.endArticle;
    language = pack.lang as WikiLanguage;
  } else if (random) {
    const s = await fetchRandomArticle(language);
    const e = await fetchRandomArticle(language);
    if (!s || !e || s === e) {
      return errorResponse("Gagal generate artikel random. Coba lagi.");
    }
    startArticle = s;
    endArticle = e;
  }

  // Resolve Wikipedia redirects for start and end articles (if set)
  if (startArticle) {
    startArticle = await resolveWikipediaRedirect(startArticle, language);
  }
  if (endArticle) {
    endArticle = await resolveWikipediaRedirect(endArticle, language);
  }

  // Cari roomId yang belum dipakai. Tabrakan amat jarang
  // (32^6 = ~1 milyar), tapi tetap kita guard.
  let roomId = generateRoomId();
  for (let i = 0; i < 5; i++) {
    const existing = await getRoom(roomId);
    if (!existing) break;
    roomId = generateRoomId();
  }

  const hostToken = crypto.randomUUID();

  const room: Room = {
    id: roomId,
    hostClientId: clientId,
    status: "lobby",
    language,
    gameMode: "competitive",
    startArticle,
    endArticle,
    players: [createPlayer(clientId, username, true, hostToken)],
    createdAt: Date.now(),
    customRules: {
      clickLimit: 0,
      timeLimit: 0,
      bannedArticles: [],
    },
  };

  await setRoom(room);

  return Response.json({ roomId, room: sanitizeRoom(room), playerToken: hostToken });
}

