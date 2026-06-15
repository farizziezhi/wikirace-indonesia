import type { NextRequest } from "next/server";

import { publishRoomEvent } from "@/lib/ably";
import { getRoom, removeMatchmakingRoom, setRoom } from "@/lib/redis";
import { errorResponse } from "@/lib/room";

/**
 * POST /api/room/start
 * Body: { roomId, clientId }
 */
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

async function generateBotRoute(
  start: string,
  end: string,
  lang: string,
  clicksCount: number,
): Promise<string[]> {
  const route = [start];
  let current = start;
  const startTime = Date.now();
  
  for (let i = 0; i < clicksCount - 1; i++) {
    if (Date.now() - startTime > 2000) break; // Cegah timeout serverless
    const links = await fetchWikiLinks(current, lang);
    if (links.length === 0) break;
    const next = links[Math.floor(Math.random() * links.length)];
    route.push(next);
    current = next;
  }
  
  route.push(end);
  return route;
}

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
    // Jika room matchmaking, pastikan pemanggil adalah salah satu pemain di room
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

  // Jika matchmaking, pastikan dihapus dari antrean agar tidak ada yang masuk di tengah game
  if (room.isMatchmaking) {
    await removeMatchmakingRoom(room.language ?? "id", room.id);
  }

  const startTime = Date.now() + COUNTDOWN_MS;
  room.status = "playing";
  room.startTime = startTime;

  for (const player of room.players) {
    player.status = "playing";
    player.currentArticle = room.startArticle;
    player.route = [{ article: room.startArticle, timestamp: 0 }];
    player.finishedAt = undefined;

    if (player.isBot) {
      // Tentukan jumlah klik berdasarkan ELO pemain
      let clicksCount = 4;
      let minSec = 10;
      let maxSec = 18;
      
      const playerElo = room.averageElo ?? 1200;
      if (playerElo >= 1300) {
        clicksCount = 3;
        minSec = 6;
        maxSec = 12;
      } else if (playerElo < 1100) {
        clicksCount = 5;
        minSec = 15;
        maxSec = 25;
      }
      
      const route = await generateBotRoute(
        room.startArticle,
        room.endArticle,
        room.language ?? "id",
        clicksCount
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
        { text: room.language === "en" ? "GGwp!" : "GGwp", timestamp: botFinishTime + 1 }
      ];
    }
  }

  await setRoom(room);

  await publishRoomEvent(roomId, "game_started", {
    startArticle: room.startArticle,
    endArticle: room.endArticle,
    startTime,
  });

  return Response.json({ room });
}
