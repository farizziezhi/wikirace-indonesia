import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, setRoom } from "@/lib/redis";
import {
  createRouteStep,
  errorResponse,
  findPlayer,
} from "@/lib/room";

/**
 * POST /api/room/use-help
 * Body: { roomId, clientId }
 * Memindahkan pemain kembali ke artikel awal (teleport) dengan denda suspensi.
 * Hanya bisa dilakukan 1 kali per game.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
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

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.status !== "playing") {
    return errorResponse("Bantuan hanya bisa digunakan saat permainan berlangsung.", 409);
  }
  if (!room.startTime) {
    return errorResponse("Waktu mulai permainan tidak valid.", 500);
  }

  const player = findPlayer(room, clientId);
  if (!player) return errorResponse("Pemain tidak ada di room ini.", 404);
  if (player.status !== "playing") {
    return errorResponse("Pemain tidak dalam status 'playing'.", 409);
  }

  if (player.helpUsed) {
    return errorResponse("Bantuan 'Kembali ke Awal' hanya bisa digunakan 1 kali.", 400);
  }

  if (player.suspendedUntil && Date.now() < player.suspendedUntil) {
    return errorResponse("Kamu sedang ditangguhkan, tidak bisa menggunakan bantuan.", 403);
  }

  if (player.currentArticle === room.startArticle) {
    return errorResponse("Kamu sudah berada di artikel awal.", 400);
  }

  // Setel posisi artikel kembali ke awal dan catat di route
  const startArticle = room.startArticle;
  const step = createRouteStep(startArticle, room.startTime);
  player.route.push(step);
  player.currentArticle = startArticle;
  player.helpUsed = true;

  // Denda suspensi berdasarkan gameMode:
  // Competitive: 60 detik (1 menit)
  // Casual: 30 detik
  const isCompetitive = room.gameMode === "competitive" || !room.gameMode;
  const duration = isCompetitive ? 60 : 30;

  const suspendedUntil = Date.now() + duration * 1000;
  player.suspendedUntil = suspendedUntil;

  await setRoom(room);

  // Kirim event player_suspended untuk memberi tahu player lain tentang denda bantuan,
  // lalu player_moved untuk sinkronisasi posisi navigasi terbaru pemain,
  // lalu sinkronkan room_updated untuk sinkronisasi state.
  await publishRoomEvent(roomId, "player_suspended", {
    clientId,
    username: player.username,
    reason: "help",
    duration,
    suspendedUntil,
  });

  await publishRoomEvent(roomId, "player_moved", {
    clientId,
    article: startArticle,
    route: player.route,
  });

  await publishRoomEvent(roomId, "room_updated", { room });

  return Response.json({ room });
}
