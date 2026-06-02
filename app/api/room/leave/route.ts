import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { deleteRoom, getRoom, setRoom } from "@/lib/redis";
import { errorResponse } from "@/lib/room";

/**
 * POST /api/room/leave
 * Body: { roomId, clientId }
 *
 * Jika host yang keluar → room dibatalkan & dihapus dari Redis.
 * Jika bukan host → player dihapus dari list, broadcast `room_updated`.
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
  if (!room) {
    // Room sudah tidak ada — anggap leave berhasil (idempotent).
    return Response.json({ ok: true, roomDeleted: true });
  }

  if (clientId === room.hostClientId) {
    const otherPlayers = room.players.filter((p) => p.clientId !== clientId);
    if (otherPlayers.length === 0) {
      // Publish dulu, baru hapus, supaya semua client masih nyambung
      // ke channel saat menerima event.
      await publishRoomEvent(roomId, "game_cancelled", { reason: "host_left" });
      await deleteRoom(roomId);
      return Response.json({ ok: true, roomDeleted: true });
    } else {
      // Promosikan pemain berikutnya menjadi host baru.
      const newHost = otherPlayers[0];
      newHost.isHost = true;
      room.hostClientId = newHost.clientId;
      room.players = otherPlayers;

      await setRoom(room);
      await publishRoomEvent(roomId, "room_updated", { room });
      return Response.json({ ok: true, room });
    }
  }

  const beforeLen = room.players.length;
  room.players = room.players.filter((p) => p.clientId !== clientId);
  if (room.players.length === beforeLen) {
    // Pemain memang tidak ada di room — tetap idempotent.
    return Response.json({ ok: true, room });
  }

  await setRoom(room);
  await publishRoomEvent(roomId, "room_updated", { room });

  return Response.json({ ok: true, room });
}
