import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { calculateEloChanges } from "@/lib/elo";
import { getRoom, setRoom, updatePlayerStats, getBotStreak, incrementBotStreak, resetBotStreak } from "@/lib/redis";
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

  // --- SECURITY: Session Verification ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    if (!sessionUsername || sessionUsername !== player.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok dengan clientId pemain.", 403);
    }
  }

  if (player.suspendedUntil && Date.now() < player.suspendedUntil) {
    return errorResponse("Kamu sedang ditangguhkan (suspended) dan tidak bisa navigasi.", 403);
  }

  if (room.isMatchmaking) {
    const elapsedSeconds = Math.floor((Date.now() - room.startTime) / 1000);
    if (elapsedSeconds >= 300) {
      return errorResponse("Waktu bermain telah habis (maksimal 5 menit).", 403);
    }
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

        // Deteksi apakah ada bot dalam permainan
        const hasBot = room.players.some((p) => p.isBot);

        // Update database ELO masing-masing pemain & update objek room
        for (const p of room.players) {
          let change = eloChanges[p.username] || 0;
          const isWin = p.clientId === clientId; // Hanya pemain aktif ini yang menang

          if (p.isBot) {
            // Update ELO di objek room saja, skip database
            p.elo = (p.elo ?? 1200) + change;
            p.eloChange = change;
            continue;
          }

          // Pemain manusia
          if (hasBot) {
            if (isWin && change > 0) {
              const currentElo = p.elo ?? 1200;
              if (currentElo >= 1300) {
                // ELO >= 1300 tidak mendapat ELO dari bot
                change = 0;
              } else {
                // Terapkan ELO decay berturut-turut
                const streak = await incrementBotStreak(p.username);
                let multiplier = 1.0;
                if (streak === 2) multiplier = 0.5;
                else if (streak >= 3) multiplier = 0.0;
                change = Math.round(change * multiplier);
              }
            }
          } else {
            // Bermain melawan manusia asli -> reset bot streak
            await resetBotStreak(p.username);
          }

          await updatePlayerStats(p.username, change, isWin);
          p.elo = (p.elo ?? 1200) + change;
          p.eloChange = change;
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
      eloChange: p.eloChange || 0,
      newElo: p.elo ?? 1200,
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
