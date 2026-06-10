import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, removeMatchmakingRoom, setRoom } from "@/lib/redis";
import { errorResponse } from "@/lib/room";

/**
 * POST /api/room/start
 * Body: { roomId, clientId }
 */
export const dynamic = "force-dynamic";

const COUNTDOWN_MS = 3000;

export async function POST(request: NextRequest) {
  let body: { roomId?: unknown; clientId?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId =
    typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  // Jika room biasa (bukan matchmaking), hanya host yang boleh memulai
  if (!room.isMatchmaking) {
    if (room.hostClientId !== clientId) {
      return errorResponse("Hanya host yang boleh memulai game.", 403);
    }
  } else {
    // Jika room matchmaking, pastikan pemanggil adalah salah satu pemain di room
    const isPlayer = room.players.some((p) => p.clientId === clientId);
    if (!isPlayer) {
      return errorResponse("Hanya pemain dalam room yang boleh memulai game.", 403);
    }
  }

  if (room.status !== "lobby") {
    return errorResponse("Game sudah dimulai atau sudah selesai.", 409);
  }
  if (!room.startArticle || !room.endArticle) {
    return errorResponse("Artikel start dan finish belum diatur.");
  }
  if (room.players.length < 2) {
    return errorResponse("Minimal 2 pemain untuk memulai game.");
  }

  // Jika matchmaking, pastikan dihapus dari antrean agar tidak ada yang masuk di tengah game
  if (room.isMatchmaking) {
    await removeMatchmakingRoom(room.language ?? "id", room.id);
  }

  const startTime = Date.now() + COUNTDOWN_MS;
  room.status = "playing";
  room.startTime = startTime;
  for (const player of room.players) {
    player.status = "playing";
    player.currentArticle = room.startArticle;
    player.route = [{ article: room.startArticle, timestamp: 0 }];
    player.finishedAt = undefined;
  }

  await setRoom(room);

  await publishRoomEvent(roomId, "game_started", {
    startArticle: room.startArticle,
    endArticle: room.endArticle,
    startTime,
  });

  return Response.json({ room });
}
