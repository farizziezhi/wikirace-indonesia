import type { NextRequest } from "next/server";
import { getRoom, setRoom } from "@/lib/redis";
import { errorResponse, createPlayer, sanitizeRoom } from "@/lib/room";
import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { getRandomBotName } from "@/lib/bot-names";
import type { Room } from "@/lib/types";

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

  if (!roomId) {
    return errorResponse("roomId wajib diisi.");
  }
  if (!clientId) {
    return errorResponse("clientId wajib diisi.");
  }

  try {
    const room = await getRoom(roomId);
    if (!room) {
      return errorResponse("Room tidak ditemukan.", 404);
    }

    // --- KEAMANAN: Verifikasi Pengirim ---
    if (room.hostClientId !== clientId) {
      return errorResponse("Hanya host yang boleh mengundang bot.", 403);
    }

    if (room.isMatchmaking) {
      const sessionUsername = await getSessionUsername();
      const hostPlayer = room.players[0];
      if (!sessionUsername || sessionUsername !== hostPlayer.username) {
        return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
      }
    }

    // --- KEAMANAN 1: Validasi Tipe Kamar & Status ---
    if (!room.isMatchmaking) {
      return errorResponse("Bot hanya diperbolehkan bergabung dalam Ranked Matchmaking.", 403);
    }
    if (room.status !== "lobby") {
      return errorResponse("Game sudah dimulai atau sudah selesai.", 409);
    }

    // --- KEAMANAN 2: Validasi Jumlah Pemain ---
    if (room.players.length !== 1) {
      return errorResponse("Bot hanya bisa masuk jika Anda sendirian di dalam lobi.", 400);
    }

    // --- KEAMANAN 3: Durasi Tunggu Minimal (Anti-Spam) ---
    // Room harus sudah berumur minimal 55 detik untuk memverifikasi tunggu 60 detik dari client.
    const roomAge = Date.now() - room.createdAt;
    if (roomAge < 55000) {
      return errorResponse("Mohon tunggu sedikit lebih lama sebelum mengundang bot.", 400);
    }

    // Ambil info pemain pertama (host asli)
    const hostPlayer = room.players[0];
    const hostElo = hostPlayer.elo ?? 1200;

    // Pilih nama bot secara acak dan pastikan tidak duplikat dengan host
    const botName = getRandomBotName([hostPlayer.username]);

    // Kalkulasi ELO Bot agar setara dengan ELO Host (+/- 20 poin)
    const botEloOffset = Math.floor(Math.random() * 41) - 20; // -20 s/d +20
    const botElo = Math.max(100, hostElo + botEloOffset);

    // Bentuk objek Bot Player
    const botClientId = `bot-${Math.random().toString(36).substring(2, 15)}`;
    const botPlayer = createPlayer(botClientId, botName, false);
    botPlayer.elo = botElo;
    botPlayer.isBot = true;

    // Masukkan bot ke dalam room
    room.players.push(botPlayer);

    // Hitung rata-rata ELO kamar & jadwalkan hitung mundur auto-start (10 detik)
    room.averageElo = (hostElo + botElo) / 2;
    room.autoStartAt = Date.now() + 10000; // 10 detik countdown menuju start
    room.matchFoundAt = Date.now(); // Set ready timer start time

    // Simpan ke Redis & sebarkan event room_updated ke seluruh client via Ably
    await setRoom(room);
    await publishRoomEvent(room.id, "room_updated", { room: sanitizeRoom(room) });

    // Kirim pesan chat sambutan dari bot ke lobi
    await publishRoomEvent(room.id, "chat_message", {
      id: `bot-msg-${Math.random().toString(36).substring(2, 11)}`,
      clientId: botClientId,
      username: botName,
      text: room.language === "en" ? "GLHF! Let's race." : "GLHF! Semangat.",
      timestamp: Date.now(),
    });

    return Response.json({ success: true, room: sanitizeRoom(room) });
  } catch (err) {
    console.error("Gagal menambahkan bot ke lobi:", err);
    return errorResponse("Terjadi kesalahan server internal.", 500);
  }
}

