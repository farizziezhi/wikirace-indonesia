import { type NextRequest, after } from "next/server";
import { getRoom, setRoom } from "@/lib/redis";
import { errorResponse, createPlayer, sanitizeRoom, MAX_PLAYERS } from "@/lib/room";
import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { getRandomBotName, BOT_GREETINGS_ID, BOT_GREETINGS_EN, BOT_EMOJIS } from "@/lib/bot-names";
import type { Room } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { roomId?: unknown; clientId?: unknown; botCount?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId =
    typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";

  // botCount: jumlah bot yang diminta (1-3), default 1
  let botCount = typeof body.botCount === "number" ? body.botCount : 1;
  botCount = Math.max(1, Math.min(3, Math.round(botCount)));

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
    // Bot hanya boleh masuk jika belum ada pemain manusia lain (hanya host sendiri)
    const humanPlayers = room.players.filter((p) => !p.isBot);
    if (humanPlayers.length !== 1) {
      return errorResponse("Bot hanya bisa masuk jika Anda sendirian di dalam lobi.", 400);
    }

    // --- KEAMANAN 3: Durasi Tunggu Minimal (Anti-Spam) ---
    // Room harus sudah berumur minimal 15 detik (client timer = 20 detik)
    const roomAge = Date.now() - room.createdAt;
    if (roomAge < 15000) {
      return errorResponse("Mohon tunggu sedikit lebih lama sebelum mengundang bot.", 400);
    }

    // Ambil info pemain pertama (host asli)
    const hostPlayer = room.players[0];
    const hostElo = hostPlayer.elo ?? 1200;

    // Pastikan tidak melebihi batas pemain
    const slotsAvailable = MAX_PLAYERS - room.players.length;
    const actualBotCount = Math.min(botCount, slotsAvailable);

    if (actualBotCount <= 0) {
      return errorResponse("Lobi sudah penuh.", 400);
    }

    // Kumpulkan nama yang sudah terpakai
    const usedNames = room.players.map((p) => p.username);
    const botPlayers: Array<{ clientId: string; username: string }> = [];

    for (let i = 0; i < actualBotCount; i++) {
      // Pilih nama bot unik yang belum dipakai
      const botName = getRandomBotName(usedNames);
      usedNames.push(botName);

      // Kalkulasi ELO Bot agar setara dengan ELO Host (+/- 50 poin, variasi lebih lebar)
      const botEloOffset = Math.floor(Math.random() * 101) - 50; // -50 s/d +50
      const botElo = Math.max(100, hostElo + botEloOffset);

      // Bentuk objek Bot Player
      const botClientId = `bot-${Math.random().toString(36).substring(2, 15)}`;
      const botPlayer = createPlayer(botClientId, botName, false);
      botPlayer.elo = botElo;
      botPlayer.isBot = true;

      room.players.push(botPlayer);
      botPlayers.push({ clientId: botClientId, username: botName });
    }

    // Hitung rata-rata ELO kamar
    const totalElo = room.players.reduce((sum, p) => sum + (p.elo ?? 1200), 0);
    room.averageElo = totalElo / room.players.length;

    // Jadwalkan hitung mundur auto-start (10 detik)
    room.autoStartAt = Date.now() + 10000;
    room.matchFoundAt = Date.now();

    // Simpan ke Redis & sebarkan event room_updated ke seluruh client via Ably
    await setRoom(room);
    await publishRoomEvent(room.id, "room_updated", { room: sanitizeRoom(room) });

    // Efek Chat & Emoji Staggered (di luar respon HTTP utama agar terasa alami)
    after(async () => {
      const isEn = room.language === "en";
      const pool = isEn ? BOT_GREETINGS_EN : BOT_GREETINGS_ID;

      for (let i = 0; i < botPlayers.length; i++) {
        const bot = botPlayers[i];
        const delay = i * (600 + Math.random() * 800); // 600ms - 1400ms delay per bot

        await new Promise((resolve) => setTimeout(resolve, delay));

        // 80% chance to greet in chat
        if (Math.random() < 0.8) {
          const chatText = pool[Math.floor(Math.random() * pool.length)];
          await publishRoomEvent(room.id, "chat_message", {
            id: `bot-msg-${Math.random().toString(36).substring(2, 11)}`,
            clientId: bot.clientId,
            username: bot.username,
            text: chatText,
            timestamp: Date.now(),
          }).catch(() => {});
        }

        // 50% chance to send an emoji reaction immediately after joining
        if (Math.random() < 0.5) {
          const emoji = BOT_EMOJIS[Math.floor(Math.random() * BOT_EMOJIS.length)];
          await publishRoomEvent(room.id, "emoji_reaction", {
            clientId: bot.clientId,
            username: bot.username,
            emojis: [emoji],
          }).catch(() => {});
        }
      }
    });

    return Response.json({ success: true, room: sanitizeRoom(room) });
  } catch (err) {
    console.error("Gagal menambahkan bot ke lobi:", err);
    return errorResponse("Terjadi kesalahan server internal.", 500);
  }
}
