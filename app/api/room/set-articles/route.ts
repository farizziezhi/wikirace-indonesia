import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import { errorResponse, MAX_ARTICLE_TITLE_LENGTH } from "@/lib/room";

/**
 * POST /api/room/set-articles
 * Body: { roomId, clientId, startArticle, endArticle }
 * Hanya host yang boleh, status harus 'lobby'.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    startArticle?: unknown;
    endArticle?: unknown;
    language?: unknown;
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
  const startArticle =
    typeof body.startArticle === "string" ? body.startArticle.trim() : "";
  const endArticle =
    typeof body.endArticle === "string" ? body.endArticle.trim() : "";
  // Whitelist & opsional — kalau body tidak kirim language, biarkan tetap.
  const language: "id" | "en" | undefined =
    body.language === "id"
      ? "id"
      : body.language === "en"
        ? "en"
        : undefined;

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (!startArticle) return errorResponse("startArticle wajib diisi.");
  if (!endArticle) return errorResponse("endArticle wajib diisi.");
  if (
    startArticle.length > MAX_ARTICLE_TITLE_LENGTH ||
    endArticle.length > MAX_ARTICLE_TITLE_LENGTH
  ) {
    return errorResponse("Judul artikel terlalu panjang.");
  }
  if (startArticle === endArticle) {
    return errorResponse("startArticle dan endArticle tidak boleh sama.");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.hostClientId !== clientId) {
    return errorResponse("Hanya host yang boleh mengatur artikel.", 403);
  }
  if (room.status !== "lobby") {
    return errorResponse("Artikel hanya bisa diatur saat di lobby.", 409);
  }

  room.startArticle = startArticle;
  room.endArticle = endArticle;
  if (language !== undefined) {
    room.language = language;
  }
  await setRoom(room);

  await publishRoomEvent(roomId, "room_updated", { room });

  return Response.json({ room });
}
