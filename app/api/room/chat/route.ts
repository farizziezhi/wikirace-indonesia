import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { getRoom } from "@/lib/redis";
import {
  errorResponse,
  findPlayer,
  MAX_CHAT_LENGTH,
} from "@/lib/room";

/**
 * POST /api/room/chat
 * Body: { roomId, clientId, text }
 *
 * Kirim pesan chat ke room. Pesan bersifat ephemeral —
 * disiarkan ke subscriber Ably, tidak disimpan di Redis.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    text?: unknown;
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
  const text =
    typeof body.text === "string" ? body.text.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (!text) return errorResponse("Pesan tidak boleh kosong.");
  if (text.length > MAX_CHAT_LENGTH) {
    return errorResponse(`Pesan maksimal ${MAX_CHAT_LENGTH} karakter.`);
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);

  // --- SECURITY: Session / Token Verification ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    if (!sessionUsername || sessionUsername !== player.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
    }
  } else {
    const playerToken =
      request.headers.get("x-player-token") ||
      (body && typeof body === "object" && typeof (body as any).playerToken === "string"
        ? (body as any).playerToken
        : "");
    if (!playerToken || playerToken !== player.token) {
      return errorResponse("Akses ditolak: Token tidak cocok.", 403);
    }
  }

  await publishRoomEvent(roomId, "chat_message", {
    id: crypto.randomUUID(),
    clientId,
    username: player.username,
    text,
    timestamp: Date.now(),
  });

  return Response.json({ ok: true });
}

