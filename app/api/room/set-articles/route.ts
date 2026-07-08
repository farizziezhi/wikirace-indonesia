import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, updateRoomAtomically, resolveWikipediaRedirect } from "@/lib/redis";
import { errorResponse, MAX_ARTICLE_TITLE_LENGTH, sanitizeRoom } from "@/lib/room";
import { getChallengePackById } from "@/lib/challenges";
import { fetchRandomArticle } from "@/lib/wikipedia";
import type { WikiLanguage, Room } from "@/lib/types";

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
    checkpoints?: unknown;
    language?: unknown;
    gameMode?: unknown;
    random?: unknown;
    packId?: unknown;
    customRules?: unknown;
    playerToken?: unknown;
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
  let targetLanguage: WikiLanguage = "id";
  let resolvedCheckpoints: string[] = [];

  const effectiveGameMode = body.gameMode === "relay" ? "relay" : (body.gameMode ? body.gameMode : room.gameMode);
  let checkpointCount = 0;
  if (effectiveGameMode === "relay") {
    const teamA = room.players.filter(p => p.team === "A");
    const teamB = room.players.filter(p => p.team === "B");
    checkpointCount = Math.max(0, Math.max(teamA.length, teamB.length) - 1);
  }

  if (packId) {
    const pack = getChallengePackById(packId);
    if (!pack) return errorResponse("Pack tidak ditemukan.");
    startArticle = await resolveWikipediaRedirect(pack.startArticle, pack.lang as WikiLanguage);
    endArticle = await resolveWikipediaRedirect(pack.endArticle, pack.lang as WikiLanguage);
    targetLanguage = pack.lang as WikiLanguage;
  } else if (random) {
    const targetLang =
      body.language === "en" || body.language === "id"
        ? (body.language as WikiLanguage)
        : (room.language ?? "id");
    
    // Generate Start and End
    const s = await fetchRandomArticle(targetLang);
    const e = await fetchRandomArticle(targetLang);
    if (!s || !e || s === e) {
      return errorResponse("Gagal generate artikel random. Coba lagi.");
    }
    startArticle = await resolveWikipediaRedirect(s, targetLang);
    endArticle = await resolveWikipediaRedirect(e, targetLang);
    
    // Generate Checkpoints
    for (let i = 0; i < checkpointCount; i++) {
      const cp = await fetchRandomArticle(targetLang);
      if (cp) {
        resolvedCheckpoints.push(await resolveWikipediaRedirect(cp, targetLang));
      }
    }
    
    targetLanguage = targetLang;
  } else {
    const targetLang =
      body.language === "en" || body.language === "id"
        ? (body.language as WikiLanguage)
        : (room.language ?? "id");
        
    if (typeof body.startArticle === "string") {
      const s = body.startArticle.trim();
      if (s.length > MAX_ARTICLE_TITLE_LENGTH) {
        return errorResponse("Judul artikel awal terlalu panjang.");
      }
      startArticle = await resolveWikipediaRedirect(s, targetLang);
    }
    if (typeof body.endArticle === "string") {
      const e = body.endArticle.trim();
      if (e.length > MAX_ARTICLE_TITLE_LENGTH) {
        return errorResponse("Judul artikel tujuan terlalu panjang.");
      }
      endArticle = await resolveWikipediaRedirect(e, targetLang);
    }
    
    if (Array.isArray(body.checkpoints)) {
      const cps = body.checkpoints.map(String).slice(0, checkpointCount);
      resolvedCheckpoints = await Promise.all(
        cps.map(async (cp) => {
          const trimmed = cp.trim();
          if (!trimmed) return "";
          if (trimmed.length > MAX_ARTICLE_TITLE_LENGTH) return trimmed; // Let it fail later or keep it as is
          return await resolveWikipediaRedirect(trimmed, targetLang);
        })
      );
    }
    
    targetLanguage = targetLang;
  }

  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.hostClientId !== clientId) {
        throw new Error("VAL_ERR:Hanya host yang boleh mengatur artikel.");
      }
      if (currentRoom.isMatchmaking) {
        throw new Error("VAL_ERR:Artikel pada Ranked Matchmaking tidak boleh diubah manual.");
      }
      if (currentRoom.status !== "lobby") {
        throw new Error("VAL_ERR:Artikel hanya bisa diatur saat di lobby.");
      }

      const hostPlayer = currentRoom.players.find((p) => p.clientId === currentRoom.hostClientId);
      if (!hostPlayer) {
        throw new Error("VAL_ERR:Host tidak ditemukan di room.");
      }

      // --- SECURITY: Token Verification (Casual Room) ---
      const playerToken =
        request.headers.get("x-player-token") ||
        (typeof body.playerToken === "string" ? body.playerToken : "");
      if (!playerToken || playerToken !== hostPlayer.token) {
        throw new Error("AUTH_ERR:Akses ditolak: Token tidak cocok.");
      }

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
            : body.gameMode === "relay"
              ? "relay"
              : undefined;

      if (packId) {
        const pack = getChallengePackById(packId);
        if (!pack) throw new Error("VAL_ERR:Pack tidak ditemukan.");
        currentRoom.startArticle = startArticle;
        currentRoom.endArticle = endArticle;
        currentRoom.language = pack.lang as WikiLanguage;
      } else if (random) {
        currentRoom.startArticle = startArticle;
        currentRoom.endArticle = endArticle;
        currentRoom.language = targetLanguage;
      } else {
        if (startArticle) {
          currentRoom.startArticle = startArticle;
        }
        if (endArticle) {
          currentRoom.endArticle = endArticle;
        }
        if (currentRoom.startArticle && currentRoom.endArticle && currentRoom.startArticle === currentRoom.endArticle) {
          throw new Error("VAL_ERR:Artikel awal dan tujuan tidak boleh sama.");
        }
      }

      if (effectiveGameMode === "relay") {
        currentRoom.checkpoints = resolvedCheckpoints;
      } else {
        delete currentRoom.checkpoints;
      }

      if (language !== undefined) {
        currentRoom.language = language;
      }
      if (gameMode !== undefined) {
        currentRoom.gameMode = gameMode;
      }
      if (body.customRules && typeof body.customRules === "object") {
        const rules = body.customRules as any;
        currentRoom.customRules = {
          clickLimit: typeof rules.clickLimit === "number" ? Math.max(0, rules.clickLimit) : 0,
          timeLimit: typeof rules.timeLimit === "number" ? Math.max(0, rules.timeLimit) : 0,
          bannedArticles: Array.isArray(rules.bannedArticles)
            ? rules.bannedArticles.map((a: any) => String(a).trim()).filter(Boolean)
            : [],
        };
      }

      return currentRoom;
    });
  } catch (err: any) {
    const errMsg = err.message || "";
    if (errMsg.startsWith("VAL_ERR:")) {
      return errorResponse(errMsg.replace("VAL_ERR:", ""));
    }
    if (errMsg.startsWith("AUTH_ERR:")) {
      return errorResponse(errMsg.replace("AUTH_ERR:", ""), 403);
    }
    console.error("Gagal melakukan pengaturan artikel:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(updatedRoom) });

  return Response.json({ room: sanitizeRoom(updatedRoom) });
}


