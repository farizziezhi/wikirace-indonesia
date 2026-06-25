import crypto from "crypto";
import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import {
  getPlayerStats,
  getRoom,
  removeMatchmakingRoom,
  setRoom,
  checkRateLimit,
} from "@/lib/redis";
import {
  createPlayer,
  errorResponse,
  findPlayer,
  MAX_CLIENT_ID_LENGTH,
  MAX_PLAYERS,
  MAX_USERNAME_LENGTH,
  sanitizeRoom,
} from "@/lib/room";

/**
 * POST /api/room/join
 * Body: { roomId: string, username: string, clientId: string }
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  // Rate limit: Maksimal 10 join room per menit per IP
  const { allowed } = await checkRateLimit(ip, "room_join", 10, 60);
  if (!allowed) {
    return errorResponse("Terlalu banyak permintaan bergabung room. Silakan coba lagi nanti.", 429);
  }

  let body: {
    roomId?: unknown;
    username?: unknown;
    clientId?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId =
    typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const usernameInput =
    typeof body.username === "string" ? body.username.trim() : "";
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!/^[A-Z0-9]{6}$/.test(roomId)) {
    return errorResponse("Format kode room tidak valid.");
  }
  if (!usernameInput) return errorResponse("username wajib diisi.");
  if (usernameInput.length > MAX_USERNAME_LENGTH) {
    return errorResponse(`Nama maksimal ${MAX_USERNAME_LENGTH} karakter.`);
  }
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (clientId.length > MAX_CLIENT_ID_LENGTH) {
    return errorResponse("clientId tidak valid.");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  // Jika room bertipe matchmaking, validasi bahwa user harus sudah login
  const sessionUsername = await getSessionUsername();
  if (room.isMatchmaking && !sessionUsername) {
    return errorResponse("Anda harus login untuk bergabung ke room Ranked.", 401);
  }

  const activeUsername = sessionUsername || usernameInput;
  let token = "";

  // Reconnect: pemain dengan clientId yang sama tinggal kembali ke room.
  const existing = findPlayer(room, clientId);
  if (existing) {
    if (!existing.token) {
      existing.token = crypto.randomUUID();
      await setRoom(room);
    }
    token = existing.token;
  } else {
    if (room.isMatchmaking) {
      return errorResponse("Ranked Matchmaking room hanya dapat dimasuki melalui antrean matchmaking otomatis.", 403);
    }
    if (room.status !== "lobby") {
      return errorResponse("Room sudah memulai permainan.", 409);
    }
    if (room.players.length >= MAX_PLAYERS) {
      return errorResponse(`Room sudah penuh (maks ${MAX_PLAYERS} pemain).`, 409);
    }

    const usernameTaken = room.players.some(
      (p) => p.username.toLowerCase() === activeUsername.toLowerCase(),
    );
    if (usernameTaken) {
      return errorResponse("Username sudah dipakai di room ini.", 409);
    }

    // Ambil ELO jika ber-sesi
    let userElo = 1200;
    if (sessionUsername) {
      try {
        const stats = await getPlayerStats(sessionUsername);
        userElo = stats.elo;
      } catch (err) {
        console.error("Gagal memuat ELO saat join:", err);
      }
    }

    token = crypto.randomUUID();
    const newPlayer = createPlayer(clientId, activeUsername, false, token);
    newPlayer.elo = userElo;
    room.players.push(newPlayer);

    // Update rata-rata ELO & autoStartAt jika matchmaking
    if (room.isMatchmaking) {
      const totalElo = room.players.reduce((sum, p) => sum + (p.elo ?? 1200), 0);
      room.averageElo = totalElo / room.players.length;

      if (room.players.length >= 2 && !room.autoStartAt) {
        room.autoStartAt = Date.now() + 20000;
      }
      if (room.players.length >= MAX_PLAYERS) {
        await removeMatchmakingRoom(room.language ?? "id", room.id);
      }
    }

    await setRoom(room);
  }

  await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(room) });

  return Response.json({ room: sanitizeRoom(room), playerToken: token, serverTime: Date.now() });
}

