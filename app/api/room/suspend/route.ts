import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { getRoom, updateRoomAtomically } from "@/lib/redis";
import { errorResponse, findPlayer, sanitizeRoom } from "@/lib/room";
import type { Room } from "@/lib/types";

/**
 * POST /api/room/suspend
 * Body: { roomId, clientId, reason }
 * Memicu suspensi pemain karena kecurangan Ctrl+F atau tindakan terlarang lainnya.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    reason?: unknown;
    playerToken?: unknown;
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
  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "ctrl_f";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.status !== "playing") {
    return errorResponse("Pemain hanya bisa disuspen saat permainan berlangsung.", 409);
  }

  // --- SECURITY: Session Verification (Ranked Matchmaking) ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    const player = findPlayer(room, clientId);
    if (!player || !sessionUsername || sessionUsername !== player.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
    }
  }

  let duration = 60;
  let suspendedUntil = 0;
  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.status !== "playing") {
        throw new Error("VAL_ERR:Pemain hanya bisa disuspen saat permainan berlangsung.");
      }
      const player = findPlayer(currentRoom, clientId);
      if (!player) {
        throw new Error("VAL_ERR:Pemain tidak ada di room ini.");
      }
      if (player.status !== "playing") {
        throw new Error("VAL_ERR:Pemain tidak dalam status 'playing'.");
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

      const isCompetitive = currentRoom.gameMode === "competitive" || !currentRoom.gameMode;
      duration = isCompetitive ? 120 : 60;
      suspendedUntil = Date.now() + duration * 1000;
      player.suspendedUntil = suspendedUntil;

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
    console.error("Gagal melakukan suspensi:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  const finalPlayer = findPlayer(updatedRoom, clientId);
  if (!finalPlayer) return errorResponse("Pemain tidak ditemukan setelah suspensi.", 500);

  await publishRoomEvent(roomId, "player_suspended", {
    clientId,
    username: finalPlayer.username,
    reason,
    duration,
    suspendedUntil,
  });

  await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(updatedRoom) });

  return Response.json({ room: sanitizeRoom(updatedRoom), suspendedUntil });
}

