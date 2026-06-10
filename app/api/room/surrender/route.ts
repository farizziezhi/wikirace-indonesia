import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { calculateEloChanges } from "@/lib/elo";
import { getRoom, setRoom, updatePlayerStats } from "@/lib/redis";
import { errorResponse, findPlayer } from "@/lib/room";

/**
 * POST /api/room/surrender
 * Body: { roomId, clientId }
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
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.status !== "playing") {
    return errorResponse("Game tidak dalam status 'playing'.", 409);
  }

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);
  if (player.status !== "playing") {
    return errorResponse("Pemain sudah finished/surrendered.", 409);
  }

  player.status = "surrendered";

  // Cek apakah semua pemain non-finished sekarang sudah surrendered
  const stillPlaying = room.players.some((p) => p.status === "playing");
  const allDone = !stillPlaying;

  if (allDone) {
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

        // Update database ELO masing-masing pemain (karena menyerah semua, isWin = false)
        for (const p of room.players) {
          const change = eloChanges[p.username] || 0;
          await updatePlayerStats(p.username, change, false);
        }
      } catch (err) {
        console.error("Gagal menghitung ELO saat menyerah:", err);
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
    await publishRoomEvent(roomId, "game_surrendered", {
      allRoutes,
    });
  } else {
    await setRoom(room);
    await publishRoomEvent(roomId, "room_updated", { room });
  }

  return Response.json({ room, allSurrendered: allDone });
}
