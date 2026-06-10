import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { calculateEloChanges } from "@/lib/elo";
import { getRoom, setRoom, updatePlayerStats } from "@/lib/redis";
import {
  createRouteStep,
  errorResponse,
  findPlayer,
  MAX_ARTICLE_TITLE_LENGTH,
} from "@/lib/room";

/**
 * POST /api/room/navigate
 * Body: { roomId, clientId, article }
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

  if (player.suspendedUntil && Date.now() < player.suspendedUntil) {
    return errorResponse("Kamu sedang ditangguhkan (suspended) dan tidak bisa navigasi.", 403);
  }

  const step = createRouteStep(article, room.startTime);
  player.route.push(step);
  player.currentArticle = article;

  // Jika pemain mencapai artikel akhir -> MENANG!
  if (article === room.endArticle) {
    player.status = "finished";
    player.finishedAt = Date.now();
    room.status = "finished";

    // Hitung perubahan ELO jika ini room Ranked Matchmaking
    let eloChanges: Record<string, number> = {};
    if (room.isMatchmaking) {
      try {
        const eloData = room.players.map((p) => ({
          username: p.username,
          elo: p.elo ?? 1200,
          status: p.status,
          finishedAt: p.finishedAt,
        }));

        eloChanges = calculateEloChanges(eloData);

        // Update database ELO masing-masing pemain
        for (const p of room.players) {
          const change = eloChanges[p.username] || 0;
          const isWin = p.clientId === clientId; // Hanya pemain aktif ini yang menang
          await updatePlayerStats(p.username, change, isWin);
        }
      } catch (err) {
        console.error("Gagal menghitung ELO:", err);
      }
    }

    // Bangun allRoutes dengan payload data ELO tambahan
    const allRoutes = room.players.map((p) => ({
      clientId: p.clientId,
      username: p.username,
      status: p.status,
      route: p.route,
      finishedAt: p.finishedAt,
      eloChange: eloChanges[p.username] || 0,
      newElo: (p.elo ?? 1200) + (eloChanges[p.username] || 0),
    }));

    await setRoom(room);

    // Kirim event navigasi terakhir, lalu kirim hasil kemenangan
    await publishRoomEvent(roomId, "player_moved", {
      clientId,
      article,
      route: player.route,
    });
    await publishRoomEvent(roomId, "game_won", {
      winnerId: clientId,
      allRoutes,
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
