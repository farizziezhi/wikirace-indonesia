import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, removeMatchmakingRoom, setRoom, updateRoomAtomically, resolveWikipediaRedirect } from "@/lib/redis";
import { errorResponse, sanitizeRoom } from "@/lib/room";
import type { Room, Player } from "@/lib/types";
import { generateLogicalBotRoute } from "@/lib/wikipedia-server";
import { fetchRandomArticle } from "@/lib/wikipedia";

/**
 * POST /api/room/start
 * Body: { roomId, clientId }
 */
export const dynamic = "force-dynamic";

const COUNTDOWN_MS = 3000;

export async function POST(request: NextRequest) {
  let body: { roomId?: unknown; clientId?: unknown; playerToken?: unknown };
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

  // Jika room biasa (bukan matchmaking), hanya host yang boleh memulai
  if (!room.isMatchmaking) {
    if (room.hostClientId !== clientId) {
      return errorResponse("Hanya host yang boleh memulai game.", 403);
    }
  } else {
    const isPlayer = room.players.some((p) => p.clientId === clientId);
    if (!isPlayer) {
      return errorResponse("Hanya pemain dalam room yang boleh memulai game.", 403);
    }
  }

  if (room.status !== "lobby") {
    return errorResponse("Game sudah dimulai atau sudah selesai.", 409);
  }
  if (!room.startArticle || !room.endArticle) {
    return errorResponse("Artikel start dan finish belum diatur.");
  }
  if (room.players.length < 2) {
    return errorResponse("Minimal 2 pemain untuk memulai game.");
  }

  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (!currentRoom.isMatchmaking) {
        if (currentRoom.hostClientId !== clientId) {
          throw new Error("VAL_ERR:Hanya host yang boleh memulai game.");
        }
        const hostPlayer = currentRoom.players.find((p) => p.clientId === currentRoom.hostClientId);
        if (!hostPlayer) {
          throw new Error("VAL_ERR:Host tidak ditemukan di room.");
        }
        // --- SECURITY: Token Verification (Casual Room) ---
        const playerToken =
          request.headers.get("x-player-token") ||
          (typeof body.playerToken === "string" ? body.playerToken : "");
        if (!playerToken || playerToken !== hostPlayer.token) {
          throw new Error("AUTH_ERR:Akses ditolak: Token tidak cocok.");
        }
      } else {
        const callerPlayer = currentRoom.players.find((p) => p.clientId === clientId);
        if (!callerPlayer) {
          throw new Error("VAL_ERR:Pemain tidak ada di room.");
        }
      }

      if (currentRoom.status !== "lobby") {
        throw new Error("VAL_ERR:Game sudah dimulai atau sudah selesai.");
      }
      if (!currentRoom.startArticle || !currentRoom.endArticle) {
        throw new Error("VAL_ERR:Artikel start dan finish belum diatur.");
      }
      if (currentRoom.players.length < 2) {
        throw new Error("VAL_ERR:Minimal 2 pemain untuk memulai game.");
      }

      const startTime = Date.now() + COUNTDOWN_MS;
      currentRoom.status = "playing";
      currentRoom.startTime = startTime;

      if (currentRoom.gameMode === "relay") {
        // Coerce undefined teams to "A" for safety
        for (const player of currentRoom.players) {
          if (!player.team) player.team = "A";
        }

        // Validation: Teams must have at least 1 player
        const teamA = currentRoom.players.filter(p => p.team === "A");
        const teamB = currentRoom.players.filter(p => p.team === "B");
        if (teamA.length === 0 || teamB.length === 0) {
          throw new Error("VAL_ERR:Kedua tim harus memiliki minimal 1 pemain.");
        }

        const maxPlayers = Math.max(teamA.length, teamB.length);
        const checkpointCount = Math.max(0, maxPlayers - 1);

        if (checkpointCount > 0) {
          if (!currentRoom.checkpoints || currentRoom.checkpoints.length !== checkpointCount || currentRoom.checkpoints.some(c => !c.trim())) {
            throw new Error("VAL_ERR:Masih ada checkpoint yang kosong. Silakan isi terlebih dahulu.");
          }
        } else {
          currentRoom.checkpoints = [];
        }

        // Assign Relay Order
        let aIndex = 1;
        let bIndex = 1;
        for (const player of currentRoom.players) {
          player.currentArticle = currentRoom.startArticle;
          player.route = [{ article: currentRoom.startArticle, timestamp: 0 }];
          player.finishedAt = undefined;
          
          if (player.team === "A") {
            player.relayOrder = aIndex++;
          } else {
            player.relayOrder = bIndex++;
          }
          
          if (player.relayOrder === 1) {
            player.status = "playing";
          } else {
            player.status = "waiting";
          }
        }
      } else {
        for (const player of currentRoom.players) {
          player.status = "playing";
          player.currentArticle = currentRoom.startArticle;
          player.route = [{ article: currentRoom.startArticle, timestamp: 0 }];
          player.finishedAt = undefined;
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
    console.error("Gagal memulai game:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  if (updatedRoom.isMatchmaking) {
    await removeMatchmakingRoom(updatedRoom.language ?? "id", updatedRoom.id);
  }

  let needsSave = false;
  for (const player of updatedRoom.players) {
    if (player.isBot) {
      needsSave = true;
      let minSec = 10;
      let maxSec = 18;
      
      const playerElo = updatedRoom.averageElo ?? 1200;
      if (playerElo >= 1300) {
        minSec = 6;
        maxSec = 12;
      } else if (playerElo < 1100) {
        minSec = 15;
        maxSec = 25;
      }
      
      const route = await generateLogicalBotRoute(
        updatedRoom.startArticle,
        updatedRoom.endArticle,
        updatedRoom.language ?? "id",
        updatedRoom.solutionRoute
      );
      
      const timeline: Array<{ article: string; timestamp: number }> = [];
      let elapsed = 0;
      timeline.push({ article: route[0], timestamp: 0 });
      for (let i = 1; i < route.length; i++) {
        const delay = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
        elapsed += delay;
        timeline.push({ article: route[i], timestamp: elapsed });
      }
      
      const botFinishTime = elapsed;
      
      player.botTimeline = timeline;
      const { generateBotReactions } = require("@/lib/bot-names");
      const { botEmojis, botChats } = generateBotReactions(botFinishTime, updatedRoom.language ?? "id");
      player.botEmojis = botEmojis;
      player.botChats = botChats;
    }
  }

  if (needsSave) {
    await setRoom(updatedRoom);
  }

  await publishRoomEvent(roomId, "game_started", {
    startArticle: updatedRoom.startArticle,
    endArticle: updatedRoom.endArticle,
    startTime: updatedRoom.startTime,
    players: sanitizeRoom(updatedRoom).players,
    checkpoints: updatedRoom.checkpoints,
  });

  return Response.json({ room: sanitizeRoom(updatedRoom) });
}

