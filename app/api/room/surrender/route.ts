import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { calculateEloChanges } from "@/lib/elo";
import { getRoom, updateRoomAtomically, updatePlayerStats } from "@/lib/redis";
import { errorResponse, findPlayer, sanitizeRoom } from "@/lib/room";
import type { Room } from "@/lib/types";

/**
 * POST /api/room/surrender
 * Body: { roomId, clientId }
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { roomId?: unknown; clientId?: unknown; playerToken?: unknown };
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

  // --- SECURITY: Session Verification (Ranked Matchmaking) ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    const player = findPlayer(room, clientId);
    if (!player || !sessionUsername || sessionUsername !== player.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
    }
  }

  let eloChangesToApply: Array<{
    username: string;
    change: number;
    clicks: number;
    duration: number;
  }> = [];
  let allDone = false;

  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.status !== "playing") {
        throw new Error("VAL_ERR:Game tidak dalam status 'playing'.");
      }

      const player = findPlayer(currentRoom, clientId);
      if (!player) {
        throw new Error("VAL_ERR:Pemain tidak ada di room ini.");
      }
      if (player.status === "finished" || player.status === "surrendered") {
        throw new Error("VAL_ERR:Pemain sudah finished/surrendered.");
      }
      // Relay mode: pemain 'waiting' atau 'finished_leg' juga boleh menyerah
      if (player.status !== "playing" && player.status !== "waiting" && player.status !== "finished_leg") {
        throw new Error("VAL_ERR:Pemain tidak dalam status yang bisa menyerah.");
      }

      // --- SECURITY: Token Verification (Casual Room) ---
      if (!currentRoom.isMatchmaking) {
        const playerToken =
          request.headers.get("x-player-token") ||
          (typeof body.playerToken === "string" ? body.playerToken : "");
        if (!playerToken || playerToken !== player.token) {
          throw new Error("AUTH_ERR:Akses ditolak: Token tidak cocok.");
        }
      }

      player.status = "surrendered";

      const stillActive = currentRoom.players.some(
        (p) => !p.isBot && (p.status === "playing" || p.status === "waiting" || p.status === "finished_leg")
      );
      allDone = !stillActive;

      if (allDone) {
        currentRoom.status = "finished";

        if (currentRoom.isMatchmaking) {
          const eloData = currentRoom.players.map((p) => ({
            username: p.username,
            elo: p.elo ?? 1200,
            status: p.status,
            finishedAt: p.finishedAt,
          }));

          const eloChanges = calculateEloChanges(eloData);

          for (const p of currentRoom.players) {
            const change = eloChanges[p.username] || 0;
            p.elo = (p.elo ?? 1200) + change;
            p.eloChange = change;

            if (!p.isBot) {
              eloChangesToApply.push({
                username: p.username,
                change,
                clicks: Math.max(0, p.route.length - 1),
                duration: p.route.length > 0 ? p.route[p.route.length - 1].timestamp : 0,
              });
            }
          }
        }
      }

      return currentRoom;
    });
  } catch (err: any) {
    const errMsg = err.message || "";
    if (errMsg.startsWith("VAL_ERR:")) {
      return errorResponse(errMsg.replace("VAL_ERR:", ""));
    }
    if (errMsg.startsWith("AUTH_ERR:")) {
      return errorResponse(errMsg.replace("AUTH_ERR:", ""), 403);
    }
    console.error("Gagal memproses surrender:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  if (allDone) {
    if (updatedRoom.isMatchmaking) {
      try {
        for (const item of eloChangesToApply) {
          await updatePlayerStats(item.username, item.change, false, {
            startArticle: updatedRoom.startArticle || "",
            endArticle: updatedRoom.endArticle || "",
            clicks: item.clicks,
            duration: item.duration,
          });
        }
      } catch (err) {
        console.error("Gagal menyimpan riwayat ELO/pertandingan saat menyerah:", err);
      }
    }

    const allRoutes = updatedRoom.players.map((p) => ({
      clientId: p.clientId,
      username: p.username,
      status: p.status,
      route: p.route,
      finishedAt: p.finishedAt,
      eloChange: p.eloChange || 0,
      newElo: p.elo ?? 1200,
    }));

    await publishRoomEvent(roomId, "game_surrendered", { allRoutes });
  } else {
    await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(updatedRoom) });
  }

  return Response.json({ room: sanitizeRoom(updatedRoom), allSurrendered: allDone });
}

