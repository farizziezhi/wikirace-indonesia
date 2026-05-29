import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom } from "@/lib/redis";
import {
  ALLOWED_EMOJIS,
  errorResponse,
  findPlayer,
} from "@/lib/room";

/**
 * POST /api/room/react
 * Body: { roomId, clientId, emoji }
 *
 * Kirim reaksi emoji ke room. Ephemeral — disiarkan, tidak disimpan.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    emoji?: unknown;
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
  const emoji =
    typeof body.emoji === "string" ? body.emoji : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (!(ALLOWED_EMOJIS as readonly string[]).includes(emoji)) {
    return errorResponse("Emoji tidak valid.");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);

  await publishRoomEvent(roomId, "emoji_reaction", {
    emoji,
    clientId,
    username: player.username,
    timestamp: Date.now(),
  });

  return Response.json({ ok: true });
}
