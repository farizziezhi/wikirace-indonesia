import Redis from "ioredis";

import type { Room } from "./types";
import { ensureDbInitialized, turso } from "./turso";

// ---------- Valkey (Aiven Redis) Client Singleton ----------

let valkeyClient: Redis | null = null;

export function getValkeyClient(): Redis {
  if (!valkeyClient) {
    const uri = process.env.VALKEY_URI;
    if (!uri) {
      throw new Error("VALKEY_URI tidak ditemukan di environment variables.");
    }
    valkeyClient = new Redis(uri, {
      maxRetriesPerRequest: null,
    });
  }
  return valkeyClient;
}

// ---------- Room Helpers (Valkey / Redis) ----------

const roomKey = (roomId: string) => `room:${roomId}`;
const ROOM_TTL_SECONDS = 60 * 60 * 24; // 24 jam dalam detik

export async function getRoom(roomId: string): Promise<Room | null> {
  const client = getValkeyClient();
  const data = await client.get(roomKey(roomId));
  if (!data) return null;
  try {
    return JSON.parse(data) as Room;
  } catch {
    return null;
  }
}

export async function setRoom(room: Room): Promise<void> {
  const client = getValkeyClient();
  await client.set(
    roomKey(room.id),
    JSON.stringify(room),
    "EX",
    ROOM_TTL_SECONDS,
  );
}

export async function deleteRoom(roomId: string): Promise<void> {
  const client = getValkeyClient();
  await client.del(roomKey(roomId));
}

// ---------- Matchmaking Helpers (Valkey / Redis) ----------

const matchmakingKey = (lang: string) => `matchmaking:rooms:${lang}`;

export async function addMatchmakingRoom(
  lang: string,
  roomId: string,
): Promise<void> {
  const client = getValkeyClient();
  await client.sadd(matchmakingKey(lang), roomId);
}

export async function removeMatchmakingRoom(
  lang: string,
  roomId: string,
): Promise<void> {
  const client = getValkeyClient();
  await client.srem(matchmakingKey(lang), roomId);
}

export async function getMatchmakingRooms(lang: string): Promise<string[]> {
  const client = getValkeyClient();
  return await client.smembers(matchmakingKey(lang));
}

// ---------- Player Stats & Leaderboard Helpers (Turso) ----------

export interface PlayerStats {
  username: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
}

export async function getPlayerStats(username: string): Promise<PlayerStats> {
  await ensureDbInitialized();
  const res = await turso.execute({
    sql: "SELECT username, elo, games_played, wins, losses FROM player_stats WHERE username = :username",
    args: { username },
  });

  if (res.rows.length === 0) {
    // Buat data baru jika pengguna belum memiliki catatan statistik
    await turso.execute({
      sql: `INSERT INTO player_stats (username, elo, games_played, wins, losses)
            VALUES (:username, 1200, 0, 0, 0)`,
      args: { username },
    });
    return { username, elo: 1200, games_played: 0, wins: 0, losses: 0 };
  }

  const row = res.rows[0];
  return {
    username: String(row.username),
    elo: Number(row.elo),
    games_played: Number(row.games_played),
    wins: Number(row.wins),
    losses: Number(row.losses),
  };
}

export async function updatePlayerStats(
  username: string,
  eloChange: number,
  isWin: boolean,
): Promise<void> {
  await ensureDbInitialized();
  // Memastikan baris data stats sudah ada
  await getPlayerStats(username);

  await turso.execute({
    sql: `UPDATE player_stats
          SET elo = elo + :eloChange,
              games_played = games_played + 1,
              wins = wins + :winAdd,
              losses = losses + :lossAdd
          WHERE username = :username`,
    args: {
      username,
      eloChange,
      winAdd: isWin ? 1 : 0,
      lossAdd: isWin ? 0 : 1,
    },
  });
}

export interface LeaderboardEntry {
  username: string;
  elo: number;
  games_played: number;
  wins: number;
}

export async function getGlobalLeaderboard(
  limit = 10,
): Promise<LeaderboardEntry[]> {
  await ensureDbInitialized();
  const res = await turso.execute({
    sql: "SELECT username, elo, games_played, wins FROM player_stats ORDER BY elo DESC LIMIT :limit",
    args: { limit },
  });

  return res.rows.map((row) => ({
    username: String(row.username),
    elo: Number(row.elo),
    games_played: Number(row.games_played),
    wins: Number(row.wins),
  }));
}

/**
 * Pengecekan rate limit menggunakan Aiven Valkey (Redis).
 * Mengembalikan objek status apakah diperbolehkan, sisa kuota, dan hitungan saat ini.
 */
export async function checkRateLimit(
  ip: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; count: number; remaining: number }> {
  try {
    const client = getValkeyClient();
    const key = `rate:${action}:${ip}`;

    const current = await client.incr(key);

    if (current === 1) {
      await client.expire(key, windowSeconds);
    }

    const remaining = Math.max(0, limit - current);
    return {
      allowed: current <= limit,
      count: current,
      remaining,
    };
  } catch (err) {
    console.error("Gagal memeriksa rate limit:", err);
    // Jika koneksi Valkey bermasalah, kita kembalikan allowed true agar sistem tidak mati total (fail-open)
    return { allowed: true, count: 0, remaining: limit };
  }
}
