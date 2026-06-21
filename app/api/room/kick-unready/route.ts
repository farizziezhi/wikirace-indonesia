import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, removeMatchmakingRoom, setRoom, deleteRoom, addMatchmakingRoom } from "@/lib/redis";
import { errorResponse, MAX_PLAYERS, sanitizeRoom } from "@/lib/room";
import { getSessionUsername } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { roomId?: unknown; targetClientId?: unknown; clientId?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId = typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const targetClientId = typeof body.targetClientId === "string" ? body.targetClientId.trim() : "";
  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!targetClientId) return errorResponse("targetClientId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  if (!room.isMatchmaking) {
    return errorResponse("Hanya untuk Ranked Matchmaking.", 403);
  }

  if (room.status !== "lobby") {
    return errorResponse("Game sudah dimulai atau sudah selesai.", 409);
  }

  if (!room.matchFoundAt) {
    return errorResponse("Waktu bersiap belum diatur.", 400);
  }

  // --- SECURITY: Session Verification for Caller ---
  const sessionUsername = await getSessionUsername();
  if (!sessionUsername) {
    return errorResponse("Anda harus login.", 401);
  }

  const callerPlayer = room.players.find((p) => p.clientId === clientId);
  if (!callerPlayer) {
    return errorResponse("Pemain pemanggil tidak ada di room.", 403);
  }

  if (callerPlayer.username !== sessionUsername) {
    return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
  }

  // Check target player
  const targetPlayer = room.players.find((p) => p.clientId === targetClientId);
  if (!targetPlayer) {
    return errorResponse("Pemain target tidak ditemukan di room.", 404);
  }

  if (targetPlayer.ready === true) {
    return errorResponse("Tidak bisa mengeluarkan pemain yang sudah ready.", 400);
  }

  // Verify timer has actually expired (30 seconds)
  // We use 28 seconds tolerance to prevent minor browser/server clock differences or network latency issues.
  const elapsed = Date.now() - room.matchFoundAt;
  if (elapsed < 28000) {
    return errorResponse("Waktu bersiap belum habis.", 400);
  }

  // Kick target player
  if (targetClientId === room.hostClientId) {
    const otherPlayers = room.players.filter((p) => p.clientId !== targetClientId);
    const otherHumans = otherPlayers.filter((p) => !p.isBot);
    if (otherHumans.length === 0) {
      // Game cancelled, delete room
      await publishRoomEvent(roomId, "game_cancelled", { reason: "host_left" });
      await removeMatchmakingRoom(room.language ?? "id", roomId);
      await deleteRoom(roomId);
      return Response.json({ success: true, roomDeleted: true });
    } else {
      // Promote new host
      const newHost = otherHumans[0];
      newHost.isHost = true;
      room.hostClientId = newHost.clientId;
      room.players = otherPlayers;
    }
  } else {
    room.players = room.players.filter((p) => p.clientId !== targetClientId);
  }

  // Recalculate average ELO and adjust matchmaking list
  const totalElo = room.players.reduce((sum, p) => sum + (p.elo ?? 1200), 0);
  room.averageElo = totalElo / room.players.length;

  if (room.players.length < 2) {
    room.autoStartAt = undefined;
    room.matchFoundAt = undefined;
  } else {
    room.matchFoundAt = Date.now(); // Reset 30s timer for remaining players
  }

  if (room.players.length < MAX_PLAYERS) {
    await addMatchmakingRoom(room.language ?? "id", roomId);
  }

  await setRoom(room);
  await publishRoomEvent(room.id, "room_updated", { room: sanitizeRoom(room) });

  // Publish a custom notification chat message that a player was kicked
  await publishRoomEvent(room.id, "chat_message", {
    id: `system-msg-${Math.random().toString(36).substring(2, 11)}`,
    clientId: "system",
    username: "System",
    text: room.language === "en" 
      ? `${targetPlayer.username} was kicked for being AFK.` 
      : `${targetPlayer.username} dikeluarkan dari lobi karena AFK.`,
    timestamp: Date.now(),
  });

  return Response.json({ success: true, room: sanitizeRoom(room) });
}
