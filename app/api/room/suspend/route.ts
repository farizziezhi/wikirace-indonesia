import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import { errorResponse, findPlayer } from "@/lib/room";

/**
 * POST /api/room/suspend
 * Body: { roomId, clientId, reason }
 * Memicu suspensi pemain karena kecurangan Ctrl+F atau tindakan terlarang lainnya.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    reason?: unknown;
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
  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "ctrl_f";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.status !== "playing") {
    return errorResponse("Pemain hanya bisa disuspen saat permainan berlangsung.", 409);
  }

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);
  if (player.status !== "playing") {
    return errorResponse("Pemain tidak dalam status 'playing'.", 409);
  }

  // Durasi suspensi (detik) berdasarkan gameMode:
  // Competitive: 120 detik (2 menit)
  // Casual/Santai: 60 detik (1 menit)
  const isCompetitive = room.gameMode === "competitive" || !room.gameMode;
  const duration = isCompetitive ? 120 : 60;

  const suspendedUntil = Date.now() + duration * 1000;
  player.suspendedUntil = suspendedUntil;

  await setRoom(room);

  // Publish event player_suspended agar player lain bisa lihat alert kecurangan,
  // lalu sinkronkan room_updated untuk sinkronisasi state.
  await publishRoomEvent(roomId, "player_suspended", {
    clientId,
    username: player.username,
    reason,
    duration,
    suspendedUntil,
  });

  await publishRoomEvent(roomId, "room_updated", { room });

  return Response.json({ room, suspendedUntil });
}
