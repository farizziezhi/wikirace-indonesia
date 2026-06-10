import { type NextRequest } from "next/server";

import { getSessionUsername } from "@/lib/auth-server";
import { getPacksByLanguage } from "@/lib/challenges";
import { getAllCuratedArticles } from "@/lib/solo-curated";
import { publishRoomEvent } from "@/lib/ably";
import {
  addMatchmakingRoom,
  getPlayerStats,
  getMatchmakingRooms,
  getRoom,
  removeMatchmakingRoom,
  setRoom,
  popMatchmakingPath,
  pushMatchmakingPath,
  getMatchmakingPoolSize,
} from "@/lib/redis";
import {
  createPlayer,
  errorResponse,
  generateRoomId,
  MAX_PLAYERS,
} from "@/lib/room";
import type { Room, WikiLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchWikiLinks(title: string, lang: string): Promise<string[]> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(title)}&pllimit=500&plnamespace=0&format=json&origin=*`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "WikiRaceID/1.0 (https://wikirace.id; contact@wikirace.id) NextJS/16",
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];
    const pageId = Object.keys(pages)[0];
    const linksObj = pages[pageId]?.links;
    if (!linksObj || !Array.isArray(linksObj)) return [];
    return linksObj.map((l: { title: string }) => l.title).filter(Boolean);
  } catch (err) {
    console.error("Gagal mengambil link Wiki:", err);
    return [];
  }
}

async function generateRandomWalkPath(
  lang: WikiLanguage,
  elo: number,
): Promise<{ startArticle: string; endArticle: string } | null> {
  let steps = 5;
  if (elo >= 1300) {
    steps = 9;
  } else if (elo >= 1100) {
    steps = 7;
  }

  const seeds = getAllCuratedArticles(lang);
  if (seeds.length === 0) return null;

  let attempts = 0;
  const startAttemptTime = Date.now();
  // Maksimal 3 percobaan atau 3 detik total untuk mencegah timeout serverless
  while (attempts < 3 && (Date.now() - startAttemptTime) < 3000) {
    attempts++;
    const startArticle = seeds[Math.floor(Math.random() * seeds.length)];
    let current = startArticle;
    const visited = new Set<string>([startArticle]);
    let success = true;

    for (let i = 0; i < steps; i++) {
      const links = await fetchWikiLinks(current, lang);
      const candidates = links.filter((l) => !visited.has(l));
      if (candidates.length === 0) {
        success = false;
        break;
      }
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      visited.add(next);
      current = next;
    }

    if (success && current !== startArticle) {
      return { startArticle, endArticle: current };
    }
  }

  return null;
}

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
    // Pilih tingkat kesulitan berdasarkan ELO pemain
    let targetDifficulty: "easy" | "medium" | "hard" = "easy";
    if (userElo >= 1300) {
      targetDifficulty = "hard";
    } else if (userElo >= 1100) {
      targetDifficulty = "medium";
    }

    let startArticle = "";
    let endArticle = "";
    let pathFound = false;

    // A. Coba ambil dari kolam Upstash Redis / Valkey pool
    const cachedPath = await popMatchmakingPath(language, targetDifficulty);
    if (cachedPath) {
      startArticle = cachedPath.startArticle;
      endArticle = cachedPath.endArticle;
      pathFound = true;
    } else {
      // B. Jika pool kosong, generate via Random Walk secara instan
      const dynamicPath = await generateRandomWalkPath(language, userElo);
      if (dynamicPath) {
        startArticle = dynamicPath.startArticle;
        endArticle = dynamicPath.endArticle;
        pathFound = true;
      }
    }

    // C. Fallback ke preset challenge packs jika pool kosong dan random walk gagal/timeout
    if (!pathFound) {
      const allPacks = getPacksByLanguage(language);
      let filteredPacks = allPacks.filter((p) => p.difficulty === targetDifficulty);

      if (filteredPacks.length === 0) {
        if (targetDifficulty === "hard") {
          filteredPacks = allPacks.filter((p) => p.difficulty === "medium");
          if (filteredPacks.length === 0) {
            filteredPacks = allPacks.filter((p) => p.difficulty === "easy");
          }
        } else if (targetDifficulty === "medium") {
          filteredPacks = allPacks.filter((p) => p.difficulty === "easy");
          if (filteredPacks.length === 0) {
            filteredPacks = allPacks.filter((p) => p.difficulty === "hard");
          }
        }
      }

      if (filteredPacks.length === 0) {
        filteredPacks = allPacks;
      }

      if (filteredPacks.length > 0) {
        const pack = filteredPacks[Math.floor(Math.random() * filteredPacks.length)];
        startArticle = pack.startArticle;
        endArticle = pack.endArticle;
      } else {
        startArticle = language === "en" ? "Earth" : "Indonesia";
        endArticle = language === "en" ? "London" : "Jakarta";
      }
    }

    // D. Trigger pengisian kembali pool secara asinkronus (fire-and-forget)
    void getMatchmakingPoolSize(language, targetDifficulty)
      .then(async (size) => {
        if (size < 3) {
          const newPath = await generateRandomWalkPath(language, userElo);
          if (newPath) {
            await pushMatchmakingPath(language, targetDifficulty, newPath);
          }
        }
      })
      .catch((err) => console.warn("Gagal mengisi kembali pool matchmaking:", err));

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
