import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import {
  buildAllRoutes,
  createRouteStep,
  errorResponse,
  findPlayer,
  MAX_ARTICLE_TITLE_LENGTH,
} from "@/lib/room";

/**
 * POST /api/room/navigate
 * Body: { roomId, clientId, article }
 *
 * Catat navigasi pemain ke artikel baru. Jika article === endArticle,
 * pemain dianggap menang dan game selesai.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    article?: unknown;
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
  const article =
    typeof body.article === "string" ? body.article.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (!article) return errorResponse("article wajib diisi.");
  if (article.length > MAX_ARTICLE_TITLE_LENGTH) {
    return errorResponse("Judul artikel terlalu panjang.");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.status !== "playing") {
    return errorResponse("Game tidak dalam status 'playing'.", 409);
  }
  if (!room.startTime) {
    return errorResponse("Room belum punya startTime.", 500);
  }

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);
  if (player.status !== "playing") {
    return errorResponse("Pemain tidak dalam status 'playing'.", 409);
  }

  const step = createRouteStep(article, room.startTime);
  player.route.push(step);
  player.currentArticle = article;

  if (article === room.endArticle) {
    player.status = "finished";
    player.finishedAt = Date.now();
    room.status = "finished";

    await setRoom(room);

    // Publish update navigasi terakhir, lalu game_won.
    await publishRoomEvent(roomId, "player_moved", {
      clientId,
      article,
      route: player.route,
    });
    await publishRoomEvent(roomId, "game_won", {
      winnerId: clientId,
      allRoutes: buildAllRoutes(room),
    });

    return Response.json({ room, won: true });
  }

  await setRoom(room);

  await publishRoomEvent(roomId, "player_moved", {
    clientId,
    article,
    route: player.route,
  });

  return Response.json({ room, won: false });
}
