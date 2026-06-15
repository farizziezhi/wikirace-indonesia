import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
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
    emojis?: unknown;
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
  const emojis =
    Array.isArray(body.emojis) ? body.emojis.filter((e): e is string => typeof e === "string") : [];

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  // Validasi emoji tunggal jika dikirim
  if (emoji && !(ALLOWED_EMOJIS as readonly string[]).includes(emoji)) {
    return errorResponse("Emoji tidak valid.");
  }

  // Validasi daftar emojis jika dikirim
  const validEmojis = emojis.filter((e) => (ALLOWED_EMOJIS as readonly string[]).includes(e));

  if (!emoji && validEmojis.length === 0) {
    return errorResponse("Tidak ada emoji valid yang dikirim.");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);

  // --- SECURITY: Session Verification ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    if (!sessionUsername || sessionUsername !== player.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
    }
  }

  // Kirim payload batch jika validEmojis ada, jika tidak kirim emoji tunggal (untuk backward compat)
  await publishRoomEvent(roomId, "emoji_reaction", {
    ...(validEmojis.length > 0 ? { emojis: validEmojis } : { emoji }),
    clientId,
    username: player.username,
    timestamp: Date.now(),
  });

  return Response.json({ ok: true });
}
