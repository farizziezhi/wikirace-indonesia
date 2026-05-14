import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import { errorResponse } from "@/lib/room";

/**
 * POST /api/room/play-again
 * Body: { roomId, clientId }
 *
 * Reset room kembali ke 'lobby'. Hanya host yang boleh memicu ini
 * untuk mencegah race condition saat banyak pemain spam tombolnya.
 */
export const dynamic = "force-dynamic";

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
  if (room.hostClientId !== clientId) {
    return errorResponse("Hanya host yang boleh mereset room.", 403);
  }
  if (room.status !== "finished") {
    return errorResponse("Room hanya bisa direset setelah game selesai.", 409);
  }

  room.status = "lobby";
  room.startArticle = "";
  room.endArticle = "";
  room.startTime = undefined;
  for (const player of room.players) {
    player.status = "waiting";
    player.currentArticle = "";
    player.route = [];
    player.finishedAt = undefined;
  }

  await setRoom(room);
  await publishRoomEvent(roomId, "room_reset", { room });

  return Response.json({ room });
}
