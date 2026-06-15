import type { NextRequest } from "next/server";
import { getRoom, setRoom, updatePlayerStats } from "@/lib/redis";
import { errorResponse, findPlayer } from "@/lib/room";
import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { calculateEloChanges } from "@/lib/elo";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { roomId?: unknown; botClientId?: unknown; clientId?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId =
    typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const botClientId =
    typeof body.botClientId === "string" ? body.botClientId.trim() : "";
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!botClientId) return errorResponse("botClientId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  try {
    const room = await getRoom(roomId);
    if (!room) return errorResponse("Room tidak ditemukan.", 404);

    if (room.status !== "playing") {
      return errorResponse("Game tidak dalam status 'playing'.", 409);
    }
    if (!room.startTime) {
      return errorResponse("Room belum memiliki startTime.", 500);
    }

    // --- KEAMANAN: Verifikasi Pengirim ---
    const caller = findPlayer(room, clientId);
    if (!caller) return errorResponse("Pengirim tidak ditemukan di room ini.", 404);
    if (caller.isBot) return errorResponse("Pengirim tidak boleh bot.", 400);

    if (room.isMatchmaking) {
      const sessionUsername = await getSessionUsername();
      if (!sessionUsername || sessionUsername !== caller.username) {
        return errorResponse("Akses ditolak: Sesi tidak cocok dengan clientId pengirim.", 403);
      }
    }

    const botPlayer = findPlayer(room, botClientId);
    if (!botPlayer) return errorResponse("Bot tidak ditemukan di room ini.", 404);
    if (!botPlayer.isBot) return errorResponse("Player target bukan bot.", 400);

    if (botPlayer.status !== "playing") {
      return errorResponse("Bot sudah selesai atau menyerah.", 409);
    }

    // --- KEAMANAN: Validasi Waktu Selesai Bot Server-Side ---
    if (!botPlayer.botTimeline || botPlayer.botTimeline.length === 0) {
      return errorResponse("Bot tidak memiliki timeline navigasi.", 500);
    }

    const lastStep = botPlayer.botTimeline[botPlayer.botTimeline.length - 1];
    const botFinishOffset = lastStep.timestamp; // detik sejak start
    const botFinishTime = room.startTime + botFinishOffset * 1000; // ms epoch

    // Jika dipanggil terlalu cepat dari clock server asli
    if (Date.now() < botFinishTime) {
      return errorResponse("Bot belum selesai bermain berdasarkan clock server.", 400);
    }

    // Ubah status bot menjadi finished dan isi rute penuh bot dari timeline
    botPlayer.status = "finished";
    botPlayer.finishedAt = botFinishTime;
    botPlayer.currentArticle = room.endArticle;

    // Sinkronisasi riwayat rute bot di state room agar lengkap di scoreboard
    botPlayer.route = botPlayer.botTimeline.map((step) => ({
      article: step.article,
      timestamp: step.timestamp,
    }));

    // Selesaikan game
    room.status = "finished";

    // Hitung ELO jika room Ranked
    let eloChanges: Record<string, number> = {};
    if (room.isMatchmaking) {
      try {
        const eloData = room.players.map((p) => ({
          username: p.username,
          elo: p.elo ?? 1200,
          status: p.status,
          finishedAt: p.finishedAt,
        }));

        eloChanges = calculateEloChanges(eloData);

        // Update ELO di room state & update database stats Turso untuk manusia
        for (const p of room.players) {
          const change = eloChanges[p.username] || 0;
          
          if (!p.isBot) {
            // Pemain manusia kalah dari bot (isWin = false)
            await updatePlayerStats(p.username, change, false);
          }
          p.elo = (p.elo ?? 1200) + change;
          p.eloChange = change;
        }
      } catch (err) {
        console.error("Gagal menghitung ELO di resolve-bot:", err);
      }
    }

    // Susun data rute lengkap untuk dikirim via Ably
    const allRoutes = room.players.map((p) => ({
      clientId: p.clientId,
      username: p.username,
      status: p.status,
      route: p.route,
      finishedAt: p.finishedAt,
      eloChange: p.eloChange || 0,
      newElo: p.elo ?? 1200,
    }));

    await setRoom(room);

    // Kirim pesan chat dari bot yang menang
    await publishRoomEvent(roomId, "chat_message", {
      id: `bot-msg-${Math.random().toString(36).substring(2, 11)}`,
      clientId: botClientId,
      username: botPlayer.username,
      text: room.language === "en" ? "GGwp! Good run." : "GGwp! Game yang seru.",
      timestamp: Date.now(),
    });

    // Kirim pesan kemenangan bot ke Ably agar semua browser ter-update otomatis
    await publishRoomEvent(roomId, "game_won", {
      winnerId: botClientId,
      allRoutes,
    });

    return Response.json({ success: true, room });
  } catch (err) {
    console.error("Gagal memproses penyelesaian bot:", err);
    return errorResponse("Terjadi kesalahan server internal.", 500);
  }
}
