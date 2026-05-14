import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import { buildAllRoutes, errorResponse, findPlayer } from "@/lib/room";

/**
 * POST /api/room/surrender
 * Body: { roomId, clientId }
 *
 * Pemain menyerah. Jika SEMUA pemain menyerah, game ditutup.
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
  if (room.status !== "playing") {
    return errorResponse("Game tidak dalam status 'playing'.", 409);
  }

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);
  if (player.status !== "playing") {
    return errorResponse("Pemain sudah finished/surrendered.", 409);
  }

  player.status = "surrendered";

  // Cek apakah semua pemain non-finished sekarang sudah surrendered.
  // (Pemain yang sudah 'finished' artinya menang, jadi tidak perlu menyerah.)
  const stillPlaying = room.players.some((p) => p.status === "playing");
  const allDone = !stillPlaying;

  if (allDone) {
    room.status = "finished";
    await setRoom(room);
    await publishRoomEvent(roomId, "game_surrendered", {
      allRoutes: buildAllRoutes(room),
    });
  } else {
    await setRoom(room);
    await publishRoomEvent(roomId, "room_updated", { room });
  }

  return Response.json({ room, allSurrendered: allDone });
}
