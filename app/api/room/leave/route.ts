import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import {
  addMatchmakingRoom,
  deleteRoom,
  getRoom,
  removeMatchmakingRoom,
  setRoom,
  updatePlayerStats,
} from "@/lib/redis";
import { errorResponse, MAX_PLAYERS, sanitizeRoom } from "@/lib/room";

/**
 * POST /api/room/leave
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
  if (!room) {
    return Response.json({ ok: true, roomDeleted: true });
  }

  // --- SECURITY: Session / Token Verification ---
  // Presence cleanup: Ketika pemain lain mendeteksi bahwa seseorang offline via Ably presence,
  // mereka mengirim leave atas nama pemain yang offline. Kita izinkan tanpa token karena
  // clientId bersifat UUID per-session dan tidak ter-expose ke pemain lain.
  const isPresenceCleanup = request.headers.get("x-presence-cleanup") === "true";

  const player = room.players.find((p) => p.clientId === clientId);
  if (player && !isPresenceCleanup) {
    if (room.isMatchmaking) {
      const sessionUsername = await getSessionUsername();
      if (!sessionUsername || sessionUsername !== player.username) {
        return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
      }
    } else {
      const playerToken =
        request.headers.get("x-player-token") ||
        (body && typeof body === "object" && typeof (body as any).playerToken === "string"
          ? (body as any).playerToken
          : "");
      if (!playerToken || playerToken !== player.token) {
        return errorResponse("Akses ditolak: Token tidak cocok.", 403);
      }
    }
  }

  const isMatchmaking = !!room.isMatchmaking;
  const language = room.language ?? "id";

  // --- PENALTI RAGE QUIT (MATCHMAKING/RANKED SAJA) ---
  if (room.status === "playing" && isMatchmaking) {
    if (player && player.status !== "finished" && player.status !== "surrendered") {
      player.status = "surrendered";
      // Terapkan penalti ELO -15 dan kekalahan ke database Turso
      await updatePlayerStats(player.username, -15, false);
      player.elo = Math.max(100, (player.elo ?? 1200) - 15);
      player.eloChange = -15;
    }

    if (clientId === room.hostClientId) {
      const otherHumans = room.players.filter((p) => !p.isBot && p.clientId !== clientId);
      if (otherHumans.length === 0) {
        // Tidak ada manusia lain tersisa, batalkan game & hapus room
        await publishRoomEvent(roomId, "game_cancelled", { reason: "host_left" });
        await removeMatchmakingRoom(language, roomId);
        await deleteRoom(roomId);
        return Response.json({ ok: true, roomDeleted: true });
      } else {
        // Promosikan manusia lain menjadi host
        const newHost = otherHumans[0];
        newHost.isHost = true;
        room.hostClientId = newHost.clientId;
      }
    }

    await setRoom(room);
    await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(room) });
    return Response.json({ ok: true, room: sanitizeRoom(room) });
  }

  if (clientId === room.hostClientId) {
    const otherPlayers = room.players.filter((p) => p.clientId !== clientId);
    const otherHumans = otherPlayers.filter((p) => !p.isBot);
    if (otherHumans.length === 0) {
      // Pembatalan & pembersihan total (tidak ada pemain manusia tersisa)
      await publishRoomEvent(roomId, "game_cancelled", { reason: "host_left" });
      if (isMatchmaking) {
        await removeMatchmakingRoom(language, roomId);
      }
      await deleteRoom(roomId);
      return Response.json({ ok: true, roomDeleted: true });
    } else {
      // Promosikan pemain manusia berikutnya menjadi host baru
      const newHost = otherHumans[0];
      newHost.isHost = true;
      room.hostClientId = newHost.clientId;
      room.players = otherPlayers; // Bot tetap dipertahankan dalam list players jika ada

      // Update matchmaking data jika aktif
      if (isMatchmaking) {
        const totalElo = room.players.reduce((sum, p) => sum + (p.elo ?? 1200), 0);
        room.averageElo = totalElo / room.players.length;

        if (room.players.length < 2) {
          room.autoStartAt = undefined;
          room.matchFoundAt = undefined;
        } else {
          room.matchFoundAt = Date.now();
        }
        if (room.players.length < MAX_PLAYERS) {
          await addMatchmakingRoom(language, roomId);
        }
      }

      await setRoom(room);
      await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(room) });
      return Response.json({ ok: true, room: sanitizeRoom(room) });
    }
  }

  const beforeLen = room.players.length;
  room.players = room.players.filter((p) => p.clientId !== clientId);
  if (room.players.length === beforeLen) {
    return Response.json({ ok: true, room: sanitizeRoom(room) });
  }

  if (isMatchmaking) {
    const totalElo = room.players.reduce((sum, p) => sum + (p.elo ?? 1200), 0);
    room.averageElo = totalElo / room.players.length;

    if (room.players.length < 2) {
      room.autoStartAt = undefined;
      room.matchFoundAt = undefined;
    } else {
      room.matchFoundAt = Date.now();
    }
    if (room.players.length < MAX_PLAYERS) {
      await addMatchmakingRoom(language, roomId);
    }
  }

  await setRoom(room);
  await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(room) });

  return Response.json({ ok: true, room: sanitizeRoom(room) });
}
