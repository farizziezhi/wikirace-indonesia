import type { NextRequest } from "next/server";
import { getRoom, updateRoomAtomically, updatePlayerStats } from "@/lib/redis";
import { errorResponse, findPlayer, sanitizeRoom } from "@/lib/room";
import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { calculateEloChanges } from "@/lib/elo";
import type { Room } from "@/lib/types";

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

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  // --- SECURITY: Session Verification (Ranked Matchmaking) ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    const caller = findPlayer(room, clientId);
    if (!caller || !sessionUsername || sessionUsername !== caller.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok dengan clientId pengirim.", 403);
    }
  }

  let eloChangesToApply: Array<{
    username: string;
    change: number;
    clicks: number;
    duration: number;
  }> = [];

  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.status !== "playing") {
        throw new Error("VAL_ERR:Game tidak dalam status 'playing'.");
      }
      const caller = findPlayer(currentRoom, clientId);
      if (!caller) {
        throw new Error("VAL_ERR:Pengirim tidak ditemukan di room ini.");
      }
      if (caller.isBot) {
        throw new Error("VAL_ERR:Pengirim tidak boleh bot.");
      }

      const botPlayer = findPlayer(currentRoom, botClientId);
      if (!botPlayer) {
        throw new Error("VAL_ERR:Bot tidak ditemukan di room ini.");
      }
      if (!botPlayer.isBot) {
        throw new Error("VAL_ERR:Player target bukan bot.");
      }
      if (botPlayer.status !== "playing") {
        throw new Error("VAL_ERR:Bot sudah selesai atau menyerah.");
      }

      // --- SECURITY: Validasi Waktu Selesai Bot Server-Side ---
      if (!botPlayer.botTimeline || botPlayer.botTimeline.length === 0) {
        throw new Error("VAL_ERR:Bot tidak memiliki timeline navigasi.");
      }

      const lastStep = botPlayer.botTimeline[botPlayer.botTimeline.length - 1];
      const botFinishOffset = lastStep.timestamp; // detik sejak start
      const botFinishTime = currentRoom.startTime! + botFinishOffset * 1000; // ms epoch

      // Jika dipanggil terlalu cepat dari clock server asli
      if (Date.now() < botFinishTime) {
        throw new Error("VAL_ERR:Bot belum selesai bermain berdasarkan clock server.");
      }

      // Ubah status bot menjadi finished dan isi rute penuh bot dari timeline
      botPlayer.status = "finished";
      botPlayer.finishedAt = botFinishTime;
      botPlayer.currentArticle = currentRoom.endArticle;
      botPlayer.route = botPlayer.botTimeline.map((step) => ({
        article: step.article,
        timestamp: step.timestamp,
      }));

      // Selesaikan game
      currentRoom.status = "finished";

      // Hitung ELO jika room Ranked
      if (currentRoom.isMatchmaking) {
        const eloData = currentRoom.players.map((p) => ({
          username: p.username,
          elo: p.elo ?? 1200,
          status: p.status,
          finishedAt: p.finishedAt,
        }));

        const eloChanges = calculateEloChanges(eloData);

        // Update ELO di room state & update database stats Turso untuk manusia
        for (const p of currentRoom.players) {
          const change = eloChanges[p.username] || 0;
          p.elo = (p.elo ?? 1200) + change;
          p.eloChange = change;
          
          if (!p.isBot) {
            eloChangesToApply.push({
              username: p.username,
              change,
              clicks: Math.max(0, p.route.length - 1),
              duration: p.route.length > 0 ? p.route[p.route.length - 1].timestamp : 0,
            });
          }
        }
      }

      return currentRoom;
    });
  } catch (err: any) {
    const errMsg = err.message || "";
    if (errMsg.startsWith("VAL_ERR:")) {
      return errorResponse(errMsg.replace("VAL_ERR:", ""));
    }
    console.error("Gagal memproses penyelesaian bot:", err);
    return errorResponse("Terjadi kesalahan server internal.", 500);
  }

  // Terapkan ELO ke database di luar transaksi
  if (updatedRoom.isMatchmaking) {
    try {
      for (const item of eloChangesToApply) {
        await updatePlayerStats(item.username, item.change, false, {
          startArticle: updatedRoom.startArticle || "",
          endArticle: updatedRoom.endArticle || "",
          clicks: item.clicks,
          duration: item.duration,
        });
      }
    } catch (err) {
      console.error("Gagal menyimpan riwayat ELO/pertandingan saat bot selesai:", err);
    }
  }

  // Susun data rute lengkap untuk dikirim via Ably
  const allRoutes = updatedRoom.players.map((p) => ({
    clientId: p.clientId,
    username: p.username,
    status: p.status,
    route: p.route,
    finishedAt: p.finishedAt,
    eloChange: p.eloChange || 0,
    newElo: p.elo ?? 1200,
  }));

  const botPlayer = findPlayer(updatedRoom, botClientId);
  if (botPlayer) {
    await publishRoomEvent(roomId, "chat_message", {
      id: `bot-msg-${Math.random().toString(36).substring(2, 11)}`,
      clientId: botClientId,
      username: botPlayer.username,
      text: updatedRoom.language === "en" ? "GGwp! Good run." : "GGwp! Game yang seru.",
      timestamp: Date.now(),
    });
  }

  await publishRoomEvent(roomId, "game_won", {
    winnerId: botClientId,
    allRoutes,
  });

  return Response.json({ success: true, room: sanitizeRoom(updatedRoom) });
}

