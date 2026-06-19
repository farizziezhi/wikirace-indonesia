import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { getRoom, setRoom } from "@/lib/redis";
import { errorResponse, findPlayer } from "@/lib/room";

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

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);
  
  if (player.status !== "playing") {
    return errorResponse("Pemain tidak dalam status 'playing'.", 409);
  }

  // --- SECURITY: Session Verification ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    if (!sessionUsername || sessionUsername !== player.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
    }
  }

  if (player.pitStopUsed) {
    return errorResponse("Kamu sudah menggunakan Pit Stop pada ronde ini.", 400);
  }

  if (player.suspendedUntil && Date.now() < player.suspendedUntil) {
    return errorResponse("Kamu sedang ditangguhkan, tidak bisa masuk Pit Stop.", 403);
  }

  // Setel status pit stop pemain
  player.pitStopUsed = true;
  player.activePowerUp = tyreType as "soft" | "medium" | "hard";
  
  // Power-up soft & medium bertahan selama 15 detik
  if (tyreType === "soft" || tyreType === "medium") {
    player.powerUpExpiresAt = Date.now() + 15000;
  } else if (tyreType === "hard") {
    // Hard tyre: tebarkan oli/mud ke semua lawan instan
    await publishRoomEvent(roomId, "pit_attack", {
      type: "debris",
      attackerId: clientId,
      attackerName: player.username,
    });
  }

  await setRoom(room);

  // Publikasikan room_updated untuk sinkronisasi state
  await publishRoomEvent(roomId, "room_updated", { room });

  return Response.json({ room });
}
