import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import { errorResponse, MAX_ARTICLE_TITLE_LENGTH } from "@/lib/room";
import { getChallengePackById } from "@/lib/challenges";
import { fetchRandomArticle } from "@/lib/wikipedia";
import type { WikiLanguage } from "@/lib/types";

/**
 * POST /api/room/set-articles
 * Body: { roomId, clientId, startArticle, endArticle, language, random, packId }
 * Hanya host yang boleh, status harus 'lobby'.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    startArticle?: unknown;
    endArticle?: unknown;
    language?: unknown;
    gameMode?: unknown;
    random?: unknown;
    packId?: unknown;
    customRules?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId =
    typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";
  const random = !!body.random;
  const packId = typeof body.packId === "string" ? body.packId : null;

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.hostClientId !== clientId) {
    return errorResponse("Hanya host yang boleh mengatur artikel.", 403);
  }
  if (room.isMatchmaking) {
    return errorResponse("Artikel pada Ranked Matchmaking tidak boleh diubah manual.", 403);
  }
  if (room.status !== "lobby") {
    return errorResponse("Artikel hanya bisa diatur saat di lobby.", 409);
  }

  let startArticle = "";
  let endArticle = "";
  let language: WikiLanguage | undefined =
    body.language === "id"
      ? "id"
      : body.language === "en"
        ? "en"
        : undefined;
  const gameMode =
    body.gameMode === "casual"
      ? "casual"
      : body.gameMode === "competitive"
        ? "competitive"
        : undefined;

  if (packId) {
    const pack = getChallengePackById(packId);
    if (!pack) return errorResponse("Pack tidak ditemukan.");
    startArticle = pack.startArticle;
    endArticle = pack.endArticle;
    language = pack.lang as WikiLanguage;
    room.startArticle = startArticle;
    room.endArticle = endArticle;
  } else if (random) {
    const targetLang = language ?? room.language ?? "id";
    const s = await fetchRandomArticle(targetLang);
    const e = await fetchRandomArticle(targetLang);
    if (!s || !e || s === e) {
      return errorResponse("Gagal generate artikel random. Coba lagi.");
    }
    startArticle = s;
    endArticle = e;
    language = targetLang;
    room.startArticle = startArticle;
    room.endArticle = endArticle;
  } else {
    if (typeof body.startArticle === "string") {
      const s = body.startArticle.trim();
      if (s.length > MAX_ARTICLE_TITLE_LENGTH) {
        return errorResponse("Judul artikel awal terlalu panjang.");
      }
      room.startArticle = s;
    }
    if (typeof body.endArticle === "string") {
      const e = body.endArticle.trim();
      if (e.length > MAX_ARTICLE_TITLE_LENGTH) {
        return errorResponse("Judul artikel tujuan terlalu panjang.");
      }
      room.endArticle = e;
    }
    if (room.startArticle && room.endArticle && room.startArticle === room.endArticle) {
      return errorResponse("Artikel awal dan tujuan tidak boleh sama.");
    }
  }

  if (language !== undefined) {
    room.language = language;
  }
  if (gameMode !== undefined) {
    room.gameMode = gameMode;
  }
  if (body.customRules && typeof body.customRules === "object") {
    const rules = body.customRules as any;
    room.customRules = {
      clickLimit: typeof rules.clickLimit === "number" ? Math.max(0, rules.clickLimit) : 0,
      timeLimit: typeof rules.timeLimit === "number" ? Math.max(0, rules.timeLimit) : 0,
      bannedArticles: Array.isArray(rules.bannedArticles)
        ? rules.bannedArticles.map((a: any) => String(a).trim()).filter(Boolean)
        : [],
    };
  }

  await setRoom(room);

  await publishRoomEvent(roomId, "room_updated", { room });

  return Response.json({ room });
}

