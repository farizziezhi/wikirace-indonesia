import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getSessionUsername } from "@/lib/auth-server";
import { calculateEloChanges } from "@/lib/elo";
import {
  getRoom,
  updateRoomAtomically,
  updatePlayerStats,
  getBotStreak,
  incrementBotStreak,
  resetBotStreak,
  resolveWikipediaRedirect,
} from "@/lib/redis";
import {
  createRouteStep,
  errorResponse,
  findPlayer,
  MAX_ARTICLE_TITLE_LENGTH,
  sanitizeRoom,
} from "@/lib/room";
import type { Room } from "@/lib/types";

/**
 * POST /api/room/navigate
 * Body: { roomId, clientId, article }
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    roomId?: unknown;
    clientId?: unknown;
    article?: unknown;
    playerToken?: unknown;
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
  const article =
    typeof body.article === "string" ? body.article.trim() : "";

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");
  if (!article) return errorResponse("article wajib diisi.");
  if (article.length > MAX_ARTICLE_TITLE_LENGTH) {
    return errorResponse("Judul artikel terlalu panjang.");
  }

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);
  if (room.status !== "playing") {
    return errorResponse("Game tidak dalam status 'playing'.", 409);
  }
  if (!room.startTime) {
    return errorResponse("Room belum punya startTime.", 500);
  }

  // --- SECURITY: Session Verification (Ranked Matchmaking) ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    const player = findPlayer(room, clientId);
    if (!player || !sessionUsername || sessionUsername !== player.username) {
      return errorResponse("Akses ditolak: Sesi tidak cocok dengan clientId pemain.", 403);
    }
  }

  // Resolve Wikipedia redirect to canonical title (done before transaction to prevent blocking database connection)
  const resolvedArticle = await resolveWikipediaRedirect(article, room.language ?? "id");

  // Pre-fetch bot streaks untuk pemain manusia jika ini Ranked Matchmaking
  const botStreaks: Record<string, number> = {};
  if (room.isMatchmaking) {
    for (const p of room.players) {
      if (!p.isBot) {
        botStreaks[p.username] = await getBotStreak(p.username);
      }
    }
  }

  let eloChangesToApply: Array<{
    username: string;
    change: number;
    isWin: boolean;
    clicks: number;
    duration: number;
  }> = [];
  let isWon = false;

  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.status !== "playing") {
        throw new Error("VAL_ERR:Game tidak dalam status 'playing'.");
      }

      const player = findPlayer(currentRoom, clientId);
      if (!player) {
        throw new Error("VAL_ERR:Pemain tidak ada di room ini.");
      }
      if (player.status !== "playing") {
        throw new Error("VAL_ERR:Pemain tidak dalam status 'playing'.");
      }

      // --- SECURITY: Token Verification (Casual Room) ---
      if (!currentRoom.isMatchmaking) {
        const playerToken =
          request.headers.get("x-player-token") ||
          (typeof body.playerToken === "string" ? body.playerToken : "");
        if (!playerToken || playerToken !== player.token) {
          throw new Error("AUTH_ERR:Akses ditolak: Token tidak cocok.");
        }
      }

      if (player.suspendedUntil && Date.now() < player.suspendedUntil) {
        throw new Error("VAL_ERR:Kamu sedang ditangguhkan (suspended) dan tidak bisa navigasi.");
      }

      const elapsedSeconds = Math.floor((Date.now() - currentRoom.startTime!) / 1000);
      if (currentRoom.isMatchmaking) {
        if (elapsedSeconds >= 300) {
          throw new Error("VAL_ERR:Waktu bermain telah habis (maksimal 5 menit).");
        }
      } else if (currentRoom.customRules?.timeLimit && currentRoom.customRules.timeLimit > 0) {
        if (elapsedSeconds >= currentRoom.customRules.timeLimit) {
          player.status = "surrendered";
          return currentRoom;
        }
      }

      // Determine the player's target for this leg
      let targetArticle = currentRoom.endArticle;
      let teamSize = 1;
      if (currentRoom.gameMode === "relay" && player.team) {
        teamSize = currentRoom.players.filter(p => p.team === player.team).length;
        if (player.relayOrder && player.relayOrder < teamSize) {
          targetArticle = currentRoom.checkpoints?.[player.relayOrder - 1] || currentRoom.endArticle;
        }
      }

      // --- DUPLICATE CLICK PROTECTION ---
      if (player.currentArticle === resolvedArticle) {
        // Just return currentRoom, no click recorded, but check victory condition
        if (resolvedArticle === targetArticle) {
          if (currentRoom.gameMode === "relay" && player.relayOrder && player.relayOrder < teamSize) {
            player.status = "finished_leg";
            player.finishedAt = Date.now();
            const nextPlayer = currentRoom.players.find(p => p.team === player.team && p.relayOrder === player.relayOrder! + 1);
            if (nextPlayer) {
              nextPlayer.status = "playing";
              nextPlayer.currentArticle = targetArticle;
              nextPlayer.route = [{ article: targetArticle, timestamp: Date.now() - currentRoom.startTime! }];
            }
          } else {
            player.status = "finished";
            player.finishedAt = Date.now();
            currentRoom.status = "finished";
            isWon = true;
          }
        }
        return currentRoom;
      }

      // --- CUSTOM RULES: Click Limit Check ---
      const currentClicks = player.route.length - 1;
      if (currentRoom.customRules?.clickLimit && currentRoom.customRules.clickLimit > 0) {
        if (currentClicks >= currentRoom.customRules.clickLimit) {
          throw new Error("VAL_ERR:Kuota klik Anda telah habis!");
        }
      }

      // --- CUSTOM RULES: Ban List Check ---
      const hasBypassPowerUp =
        player.activePowerUp === "medium" &&
        player.powerUpExpiresAt &&
        Date.now() < player.powerUpExpiresAt;
      if (
        !hasBypassPowerUp &&
        currentRoom.customRules?.bannedArticles &&
        currentRoom.customRules.bannedArticles.some(
          (ban) =>
            ban.toLowerCase().replace(/_/g, " ") ===
            resolvedArticle.toLowerCase().replace(/_/g, " "),
        )
      ) {
        throw new Error(`VAL_ERR:Artikel "${resolvedArticle}" dilarang di room ini!`);
      }

      const step = createRouteStep(resolvedArticle, currentRoom.startTime!);
      player.route.push(step);
      player.currentArticle = resolvedArticle;

      // --- CUSTOM RULES: Post-move Click Expiry Check ---
      const clicksAfter = player.route.length - 1;
      if (currentRoom.customRules?.clickLimit && currentRoom.customRules.clickLimit > 0) {
        if (clicksAfter >= currentRoom.customRules.clickLimit && resolvedArticle !== targetArticle) {
          player.status = "surrendered";
        }
      }

      // Jika pemain mencapai artikel target -> MENANG (atau lanjut pelari estafet)!
      if (resolvedArticle === targetArticle) {
        if (currentRoom.gameMode === "relay" && player.relayOrder && player.relayOrder < teamSize) {
          player.status = "finished_leg";
          player.finishedAt = Date.now();
          const nextPlayer = currentRoom.players.find(p => p.team === player.team && p.relayOrder === player.relayOrder! + 1);
          if (nextPlayer) {
            nextPlayer.status = "playing";
            nextPlayer.currentArticle = targetArticle;
            nextPlayer.route = [{ article: targetArticle, timestamp: Date.now() - currentRoom.startTime! }];
          }
        } else {
          player.status = "finished";
          player.finishedAt = Date.now();
          currentRoom.status = "finished";
          isWon = true;
        }

        // Hitung perubahan ELO jika ini room Ranked Matchmaking
        if (currentRoom.isMatchmaking) {
          const eloData = currentRoom.players.map((p) => ({
            username: p.username,
            elo: p.elo ?? 1200,
            status: p.status,
            finishedAt: p.finishedAt,
          }));

          const eloChanges = calculateEloChanges(eloData);
          const hasBot = currentRoom.players.some((p) => p.isBot);

          for (const p of currentRoom.players) {
            let change = eloChanges[p.username] || 0;
            const isWin = p.clientId === clientId;

            if (p.isBot) {
              p.elo = (p.elo ?? 1200) + change;
              p.eloChange = change;
              continue;
            }

            // Pemain manusia
            if (hasBot) {
              if (isWin && change > 0) {
                const currentElo = p.elo ?? 1200;
                if (currentElo >= 1300) {
                  change = 0;
                } else {
                  const currentStreak = botStreaks[p.username] ?? 0;
                  const nextStreak = currentStreak + 1;
                  let multiplier = 1.0;
                  if (nextStreak === 2) multiplier = 0.5;
                  else if (nextStreak >= 3) multiplier = 0.0;
                  change = Math.round(change * multiplier);
                }
              }
            }

            p.elo = (p.elo ?? 1200) + change;
            p.eloChange = change;

            eloChangesToApply.push({
              username: p.username,
              change,
              isWin,
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
    if (errMsg.startsWith("AUTH_ERR:")) {
      return errorResponse(errMsg.replace("AUTH_ERR:", ""), 403);
    }
    console.error("Gagal memproses navigasi:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  const finalPlayer = findPlayer(updatedRoom, clientId);
  if (!finalPlayer) return errorResponse("Pemain tidak ditemukan setelah navigasi.", 500);

  // Cek apakah pemain menyerah karena batas waktu terlewati
  const elapsedSeconds = Math.floor((Date.now() - updatedRoom.startTime!) / 1000);
  if (
    !updatedRoom.isMatchmaking &&
    updatedRoom.customRules?.timeLimit &&
    updatedRoom.customRules.timeLimit > 0 &&
    elapsedSeconds >= updatedRoom.customRules.timeLimit &&
    finalPlayer.status === "surrendered"
  ) {
    await publishRoomEvent(roomId, "player_moved", {
      clientId,
      article: finalPlayer.currentArticle,
      route: finalPlayer.route,
      status: "surrendered",
    });
    return errorResponse("Waktu bermain telah habis!", 403);
  }

  if (isWon) {
    // Terapkan perubahan ELO ke database di luar transaksi
    if (updatedRoom.isMatchmaking) {
      try {
        const hasBot = updatedRoom.players.some((p) => p.isBot);
        for (const item of eloChangesToApply) {
          if (hasBot) {
            if (item.isWin && item.change > 0) {
              await incrementBotStreak(item.username);
            }
          } else {
            await resetBotStreak(item.username);
          }

          await updatePlayerStats(item.username, item.change, item.isWin, {
            startArticle: updatedRoom.startArticle || "",
            endArticle: updatedRoom.endArticle || "",
            clicks: item.clicks,
            duration: item.duration,
          });
        }
      } catch (err) {
        console.error("Gagal menyimpan riwayat ELO/pertandingan:", err);
      }
    }

    const allRoutes = updatedRoom.players.map((p) => ({
      clientId: p.clientId,
      username: p.username,
      status: p.status,
      route: p.route,
      finishedAt: p.finishedAt,
      eloChange: p.eloChange || 0,
      newElo: p.elo ?? 1200,
    }));

    await publishRoomEvent(roomId, "player_moved", {
      clientId,
      article,
      route: finalPlayer.route,
      status: finalPlayer.status,
    });
    await publishRoomEvent(roomId, "game_won", {
      winnerId: clientId,
      allRoutes,
    });

    return Response.json({ room: sanitizeRoom(updatedRoom), won: true });
  }

  if (finalPlayer.status === "finished_leg") {
    const nextPlayer = updatedRoom.players.find(p => p.team === finalPlayer.team && p.relayOrder === finalPlayer.relayOrder! + 1);
    if (nextPlayer) {
      await publishRoomEvent(roomId, "player_moved", {
        clientId: nextPlayer.clientId,
        article: nextPlayer.currentArticle,
        route: nextPlayer.route,
        status: nextPlayer.status,
      });
    }
  }

  await publishRoomEvent(roomId, "player_moved", {
    clientId,
    article,
    route: finalPlayer.route,
    status: finalPlayer.status,
  });

  return Response.json({ room: sanitizeRoom(updatedRoom), won: false });
}

