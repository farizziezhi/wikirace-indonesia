import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, removeMatchmakingRoom, setRoom, updateRoomAtomically } from "@/lib/redis";
import { errorResponse, sanitizeRoom } from "@/lib/room";
import { getSessionUsername } from "@/lib/auth-server";
import type { Room } from "@/lib/types";
import { generateLogicalBotRoute } from "@/lib/wikipedia-server";

export const dynamic = "force-dynamic";

const COUNTDOWN_MS = 3000;

export async function POST(request: NextRequest) {
  let body: { roomId?: unknown; clientId?: unknown; targetClientId?: unknown; ready?: unknown; playerToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const roomId = typeof body.roomId === "string" ? body.roomId.trim().toUpperCase() : "";
  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const targetClientId = typeof body.targetClientId === "string" ? body.targetClientId.trim() : clientId;
  const ready = typeof body.ready === "boolean" ? body.ready : false;

  if (!roomId) return errorResponse("roomId wajib diisi.");
  if (!clientId) return errorResponse("clientId wajib diisi.");

  const room = await getRoom(roomId);
  if (!room) return errorResponse("Room tidak ditemukan.", 404);

  if (room.status !== "lobby") {
    return errorResponse("Game sudah dimulai atau sudah selesai.", 409);
  }

  // --- SECURITY: Session Verification (Ranked Matchmaking) ---
  if (room.isMatchmaking) {
    const sessionUsername = await getSessionUsername();
    if (!sessionUsername) {
      return errorResponse("Anda harus login.", 401);
    }
    const callerPlayer = room.players.find((p) => p.clientId === clientId);
    if (!callerPlayer || callerPlayer.username !== sessionUsername) {
      return errorResponse("Akses ditolak: Sesi tidak cocok.", 403);
    }
  }

  let updatedRoom: Room;
  try {
    updatedRoom = await updateRoomAtomically(roomId, async (currentRoom) => {
      if (currentRoom.status !== "lobby") {
        throw new Error("VAL_ERR:Game sudah dimulai atau sudah selesai.");
      }

      const callerPlayer = currentRoom.players.find((p) => p.clientId === clientId);
      if (!callerPlayer) {
        throw new Error("VAL_ERR:Pemain pemanggil tidak ada di room.");
      }

      // --- SECURITY: Token Verification (Casual Room) ---
      if (!currentRoom.isMatchmaking) {
        const playerToken =
          request.headers.get("x-player-token") ||
          (typeof body.playerToken === "string" ? body.playerToken : "");
        if (!playerToken || playerToken !== callerPlayer.token) {
          throw new Error("AUTH_ERR:Akses ditolak: Token tidak cocok.");
        }
      }

      const targetPlayer = currentRoom.players.find((p) => p.clientId === targetClientId);
      if (!targetPlayer) {
        throw new Error("VAL_ERR:Pemain target tidak ditemukan di room.");
      }

      // Jika mengubah status ready orang lain, harus berupa bot dan caller harus host
      if (targetClientId !== clientId) {
        if (!targetPlayer.isBot) {
          throw new Error("VAL_ERR:Anda tidak bisa mengubah status ready pemain lain.");
        }
        if (clientId !== currentRoom.hostClientId) {
          throw new Error("VAL_ERR:Hanya host yang bisa mengubah status ready bot.");
        }
      }

      targetPlayer.ready = ready;

      const allReady = currentRoom.players.length >= 2 && currentRoom.players.every((p) => p.ready);
      if (allReady) {
        currentRoom.status = "playing";
        currentRoom.startTime = Date.now() + COUNTDOWN_MS;

        for (const p of currentRoom.players) {
          p.status = "playing";
          p.currentArticle = currentRoom.startArticle;
          p.route = [{ article: currentRoom.startArticle, timestamp: 0 }];
          p.finishedAt = undefined;
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
    console.error("Gagal memproses ready:", err);
    return errorResponse("Terjadi kesalahan internal server.", 500);
  }

  const isStarting = updatedRoom.status === "playing";

  if (isStarting) {
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
        player.botEmojis = [
          { emoji: ["👏", "🔥", "😤"][Math.floor(Math.random() * 3)], timestamp: Math.floor(botFinishTime / 3) },
          { emoji: ["😂", "🎉"][Math.floor(Math.random() * 2)], timestamp: Math.max(5, botFinishTime - 5) }
        ];
        player.botChats = [
          { text: "GLHF!", timestamp: 3 },
          { text: updatedRoom.language === "en" ? "GGwp!" : "GGwp", timestamp: botFinishTime + 1 }
        ];
      }
    }

    if (needsSave) {
      await setRoom(updatedRoom);
    }

    await publishRoomEvent(updatedRoom.id, "room_updated", { room: sanitizeRoom(updatedRoom) });
    await publishRoomEvent(roomId, "game_started", {
      startArticle: updatedRoom.startArticle,
      endArticle: updatedRoom.endArticle,
      startTime: updatedRoom.startTime,
    });
  } else {
    await publishRoomEvent(updatedRoom.id, "room_updated", { room: sanitizeRoom(updatedRoom) });
  }

  return Response.json({ success: true, room: sanitizeRoom(updatedRoom) });
}

