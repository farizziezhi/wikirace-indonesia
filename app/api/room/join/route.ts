import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import {
  createPlayer,
  errorResponse,
  findPlayer,
  MAX_CLIENT_ID_LENGTH,
  MAX_PLAYERS,
  MAX_USERNAME_LENGTH,
} from "@/lib/room";

/**
 * POST /api/room/join
 * Body: { roomId: string, username: string, clientId: string }
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    username?: unknown;
    clientId?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId =
    typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!/^[A-Z0-9]{6}$/.test(roomId)) {
    return errorResponse("Format kode room tidak valid.");
  }
  if (!username) return errorResponse("username wajib diisi.");
  if (username.length > MAX_USERNAME_LENGTH) {
    return errorResponse(`Nama maksimal ${MAX_USERNAME_LENGTH} karakter.`);
  }
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (clientId.length > MAX_CLIENT_ID_LENGTH) {
    return errorResponse("clientId tidak valid.");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.status !== "lobby") {
    return errorResponse("Room sudah memulai permainan.", 409);
  }

  // Reconnect: pemain dengan clientId yang sama tinggal kembali ke room.
  const existing = findPlayer(room, clientId);
  if (!existing) {
    if (room.players.length >= MAX_PLAYERS) {
      return errorResponse(`Room sudah penuh (maks ${MAX_PLAYERS} pemain).`, 409);
    }

    const usernameTaken = room.players.some(
      (p) => p.username.toLowerCase() === username.toLowerCase(),
    );
    if (usernameTaken) {
      return errorResponse("Username sudah dipakai di room ini.", 409);
    }

    room.players.push(createPlayer(clientId, username, false));
    await setRoom(room);
  }

  await publishRoomEvent(roomId, "room_updated", { room });

  return Response.json({ room });
}
