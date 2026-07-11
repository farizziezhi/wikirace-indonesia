import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, updateRoomAtomically } from "@/lib/redis";
import { errorResponse, sanitizeRoom } from "@/lib/room";
import type { Room } from "@/lib/types";

/**
 * POST /api/room/play-again
 * Body: { roomId, clientId }
 *
 * Reset room kembali ke 'lobby'. Hanya host yang boleh memicu ini
 * untuk mencegah race condition saat banyak pemain spam tombolnya.
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

  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.isMatchmaking) {
        throw new Error("VAL_ERR:Ranked Matchmaking room tidak bisa direset.");
      }
      if (currentRoom.hostClientId !== clientId) {
        throw new Error("VAL_ERR:Hanya host yang boleh mereset room.");
      }
      if (currentRoom.status !== "finished") {
        throw new Error("VAL_ERR:Room hanya bisa direset setelah game selesai.");
      }

      const hostPlayer = currentRoom.players.find((p) => p.clientId === currentRoom.hostClientId);
      if (!hostPlayer) {
        throw new Error("VAL_ERR:Host tidak ditemukan di room.");
      }

      // --- SECURITY: Token Verification (Casual Room) ---
      const playerToken =
        request.headers.get("x-player-token") ||
        (typeof body.playerToken === "string" ? body.playerToken : "");
      if (!playerToken || playerToken !== hostPlayer.token) {
        throw new Error("AUTH_ERR:Akses ditolak: Token tidak cocok.");
      }

      currentRoom.status = "lobby";
      currentRoom.startArticle = "";
      currentRoom.endArticle = "";
      currentRoom.startTime = undefined;
      for (const player of currentRoom.players) {
        player.status = "waiting";
        player.currentArticle = "";
        player.route = [];
        player.finishedAt = undefined;
        player.relayOrder = undefined;
        // Reset per-game state
        player.helpUsed = false;
        player.pitStopUsed = false;
        player.activePowerUp = undefined;
        player.powerUpExpiresAt = undefined;
        player.suspendedUntil = undefined;
        player.eloChange = undefined;
        player.ready = false;
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
    console.error("Gagal melakukan reset room:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  await publishRoomEvent(roomId, "room_reset", { room: sanitizeRoom(updatedRoom) });

  return Response.json({ room: sanitizeRoom(updatedRoom) });
}

