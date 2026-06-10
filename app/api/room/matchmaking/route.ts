import { type NextRequest } from "next/server";

import { getSessionUsername } from "@/lib/auth-server";
import { getPacksByLanguage } from "@/lib/challenges";
import { publishRoomEvent } from "@/lib/ably";
import {
  addMatchmakingRoom,
  getPlayerStats,
  getMatchmakingRooms,
  getRoom,
  removeMatchmakingRoom,
  setRoom,
} from "@/lib/redis";
import {
  createPlayer,
  errorResponse,
  generateRoomId,
  MAX_PLAYERS,
} from "@/lib/room";
import type { Room, WikiLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Verifikasi Sesi (Wajib Login untuk Ranked)
  const username = await getSessionUsername();
  if (!username) {
    return errorResponse("Anda harus login untuk bermain Ranked.", 401);
  }

  let body: { clientId?: unknown; language?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const language: WikiLanguage = body.language === "en" ? "en" : "id";

  if (!clientId) {
    return errorResponse("clientId wajib diisi.");
  }

  try {
    // 2. Ambil ELO pemain saat ini
    const userStats = await getPlayerStats(username);
    const userElo = userStats.elo;

    // 3. Cari room matchmaking yang aktif dari Valkey
    const matchmakingRoomIds = await getMatchmakingRooms(language);
    let bestRoom: Room | null = null;
    let minEloDiff = Infinity;

    for (const roomId of matchmakingRoomIds) {
      const room = await getRoom(roomId);
      if (!room) {
        // Bersihkan room yang sudah mati dari antrean
        await removeMatchmakingRoom(language, roomId);
        continue;
      }

      // Validasi kelayakan room:
      // Harus status 'lobby', isMatchmaking true, dan kuota belum penuh
      if (
        room.status !== "lobby" ||
        !room.isMatchmaking ||
        room.players.length >= MAX_PLAYERS
      ) {
        await removeMatchmakingRoom(language, roomId);
        continue;
      }

      // Cek apakah pemain sudah ada di room tersebut (misal karena refresh/reconnect)
      const alreadyInRoom = room.players.some((p) => p.clientId === clientId);
      if (alreadyInRoom) {
        return Response.json({ roomId: room.id, room });
      }

      // Pilih room dengan rata-rata ELO terdekat
      const roomAvgElo = room.averageElo ?? 1200;
      const eloDiff = Math.abs(roomAvgElo - userElo);
      if (eloDiff < minEloDiff) {
        minEloDiff = eloDiff;
        bestRoom = room;
      }
    }

    // 4. Jika ditemukan room yang cocok, bergabung!
    if (bestRoom) {
      const room = bestRoom;
      const newPlayer = createPlayer(clientId, username, false);
      newPlayer.elo = userElo;
      room.players.push(newPlayer);

      // Hitung ulang average ELO room
      const totalElo = room.players.reduce((sum, p) => sum + (p.elo ?? 1200), 0);
      room.averageElo = totalElo / room.players.length;

      // Pemicu Auto-Start jika pemain >= 2
      if (room.players.length >= 2 && !room.autoStartAt) {
        room.autoStartAt = Date.now() + 15000; // 15 detik countdown
      }

      // Jika room sekarang penuh, hapus dari antrean matchmaking
      if (room.players.length >= MAX_PLAYERS) {
        await removeMatchmakingRoom(language, room.id);
      }

      await setRoom(room);
      await publishRoomEvent(room.id, "room_updated", { room });

      return Response.json({ roomId: room.id, room });
    }

    // 5. Jika tidak ditemukan room, buat room matchmaking baru!
    // Pilih tantangan siap pakai acak
    const packs = getPacksByLanguage(language);
    let startArticle = "";
    let endArticle = "";

    if (packs.length > 0) {
      const pack = packs[Math.floor(Math.random() * packs.length)];
      startArticle = pack.startArticle;
      endArticle = pack.endArticle;
    } else {
      startArticle = language === "en" ? "London" : "Jakarta";
      endArticle = language === "en" ? "Paris" : "Bali";
    }

    // Generate roomId yang unik
    let roomId = generateRoomId();
    for (let i = 0; i < 5; i++) {
      const existing = await getRoom(roomId);
      if (!existing) break;
      roomId = generateRoomId();
    }

    const hostPlayer = createPlayer(clientId, username, true);
    hostPlayer.elo = userElo;

    const newRoom: Room = {
      id: roomId,
      hostClientId: clientId,
      status: "lobby",
      language,
      gameMode: "competitive",
      startArticle,
      endArticle,
      players: [hostPlayer],
      createdAt: Date.now(),
      isMatchmaking: true,
      averageElo: userElo,
    };

    await setRoom(newRoom);
    await addMatchmakingRoom(language, roomId);

    return Response.json({ roomId, room: newRoom });
  } catch (err) {
    console.error("Matchmaking error:", err);
    return errorResponse("Terjadi kesalahan server internal.", 500);
  }
}
