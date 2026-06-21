import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, removeMatchmakingRoom, setRoom, updateRoomAtomically } from "@/lib/redis";
import { errorResponse, sanitizeRoom } from "@/lib/room";
import { getSessionUsername } from "@/lib/auth-server";
import type { Room } from "@/lib/types";

export const dynamic = "force-dynamic";

const COUNTDOWN_MS = 3000;

async function fetchWikiLinks(title: string, lang: string): Promise<string[]> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(title)}&pllimit=150&plnamespace=0&format=json&origin=*`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "WikiRaceID/1.0 (https://wikiraceid.web.id) NextJS/16",
      },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];
    const pageId = Object.keys(pages)[0];
    const linksObj = pages[pageId]?.links;
    if (!linksObj || !Array.isArray(linksObj)) return [];
    return linksObj.map((l: { title: string }) => l.title).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchWikiBacklinks(title: string, lang: string): Promise<string[]> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=backlinks&bltitle=${encodeURIComponent(title)}&bllimit=150&blnamespace=0&format=json&origin=*`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "WikiRaceID/1.0 (https://wikiraceid.web.id) NextJS/16",
      },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const backlinks = data.query?.backlinks;
    if (!backlinks || !Array.isArray(backlinks)) return [];
    return backlinks.map((l: { title: string }) => l.title).filter(Boolean);
  } catch {
    return [];
  }
}

async function generateLogicalBotRoute(
  start: string,
  end: string,
  lang: string,
  solutionRoute?: string[]
): Promise<string[]> {
  if (solutionRoute && solutionRoute.length >= 2 && solutionRoute[0] === start && solutionRoute[solutionRoute.length - 1] === end) {
    return solutionRoute;
  }

  try {
    const backlinks = await fetchWikiBacklinks(end, lang);
    const startLinks = await fetchWikiLinks(start, lang);
    
    if (startLinks.includes(end)) {
      return [start, end];
    }
    
    const intersect2 = startLinks.filter(x => backlinks.includes(x));
    if (intersect2.length > 0) {
      const mid = intersect2[Math.floor(Math.random() * intersect2.length)];
      return [start, mid, end];
    }
    
    const sampleY = startLinks.slice(0, 8);
    for (const y of sampleY) {
      const yLinks = await fetchWikiLinks(y, lang);
      const intersect3 = yLinks.filter(z => backlinks.includes(z));
      if (intersect3.length > 0) {
        const z = intersect3[Math.floor(Math.random() * intersect3.length)];
        return [start, y, z, end];
      }
    }
    
    if (backlinks.length > 0) {
      const route = [start];
      let current = start;
      for (let i = 0; i < 2; i++) {
        const links = await fetchWikiLinks(current, lang);
        if (links.length === 0) break;
        const connection = links.find(l => backlinks.includes(l));
        if (connection) {
          route.push(connection);
          route.push(end);
          return route;
        }
        const next = links[Math.floor(Math.random() * links.length)];
        route.push(next);
        current = next;
      }
      const randomBacklink = backlinks[Math.floor(Math.random() * backlinks.length)];
      route.push(randomBacklink);
      route.push(end);
      return route;
    }
  } catch (err) {
    console.error("Gagal memproses rute logis bot:", err);
  }

  return [start, end];
}

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

