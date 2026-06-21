import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, updateRoomAtomically } from "@/lib/redis";
import { errorResponse, findPlayer, sanitizeRoom } from "@/lib/room";
import type { Room } from "@/lib/types";

/**
 * POST /api/room/pit-stop
 * Body: { roomId, clientId, tyreType }
 * Mengaktifkan pit stop dan ban compound terpilih untuk pemain.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    tyreType?: unknown;
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
  const tyreType =
    typeof body.tyreType === "string" ? body.tyreType.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (!tyreType || !["soft", "medium", "hard"].includes(tyreType)) {
    return errorResponse("tyreType tidak valid (harus soft, medium, atau hard).");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  
  if (room.status !== "playing") {
    return errorResponse("Pit stop hanya bisa digunakan saat permainan berlangsung.", 409);
  }

  if (room.gameMode !== "casual") {
    return errorResponse("Pit stop hanya tersedia pada mode Casual.", 403);
  }

  let triggerPitAttack = false;
  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.status !== "playing") {
        throw new Error("VAL_ERR:Pit stop hanya bisa digunakan saat permainan berlangsung.");
      }
      if (currentRoom.gameMode !== "casual") {
        throw new Error("VAL_ERR:Pit stop hanya tersedia pada mode Casual.");
      }
      const player = findPlayer(currentRoom, clientId);
      if (!player) {
        throw new Error("VAL_ERR:Pemain tidak ada di room ini.");
      }
      if (player.status !== "playing") {
        throw new Error("VAL_ERR:Pemain tidak dalam status 'playing'.");
      }

      // --- SECURITY: Token Verification (Casual Room) ---
      const playerToken =
        request.headers.get("x-player-token") ||
        (typeof body.playerToken === "string" ? body.playerToken : "");
      if (!playerToken || playerToken !== player.token) {
        throw new Error("AUTH_ERR:Akses ditolak: Token tidak cocok.");
      }

      if (player.pitStopUsed) {
        throw new Error("VAL_ERR:Kamu sudah menggunakan Pit Stop pada ronde ini.");
      }
      if (player.suspendedUntil && Date.now() < player.suspendedUntil) {
        throw new Error("VAL_ERR:Kamu sedang ditangguhkan, tidak bisa masuk Pit Stop.");
      }

      player.pitStopUsed = true;
      player.activePowerUp = tyreType as "soft" | "medium" | "hard";
      
      if (tyreType === "soft" || tyreType === "medium") {
        player.powerUpExpiresAt = Date.now() + 15000;
      } else if (tyreType === "hard") {
        triggerPitAttack = true;
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
    console.error("Gagal memproses pit-stop:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  const finalPlayer = findPlayer(updatedRoom, clientId);

  if (triggerPitAttack && finalPlayer) {
    await publishRoomEvent(roomId, "pit_attack", {
      type: "debris",
      attackerId: clientId,
      attackerName: finalPlayer.username,
    });
  }

  await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(updatedRoom) });

  return Response.json({ room: sanitizeRoom(updatedRoom) });
}

