import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

import type { Room } from "./types";
import { ensureDbInitialized, turso } from "./turso";

// ---------- Valkey (Aiven Redis) Client Singleton ----------

let valkeyClient: Redis | null = null;
let upstashClient: UpstashRedis | null = null;

export function getUpstashClient(): UpstashRedis | null {
  if (upstashClient) return upstashClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  try {
    upstashClient = new UpstashRedis({ url, token });
    return upstashClient;
  } catch (err) {
    console.warn("Gagal inisialisasi Upstash client:", err);
    return null;
  }
}

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

/**
 * Melakukan pembaruan state room secara atomik di Redis/Valkey menggunakan
 * pola WATCH/MULTI/EXEC untuk mencegah race condition.
 */
export async function updateRoomAtomically(
  roomId: string,
  updateFn: (room: Room) => Room | Promise<Room>,
): Promise<Room> {
  const client = getValkeyClient();
  const key = roomKey(roomId);
  const maxRetries = 15;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await client.watch(key);

    const data = await client.get(key);
    if (!data) {
      await client.unwatch();
      throw new Error("Room tidak ditemukan.");
    }

    let room: Room;
    try {
      room = JSON.parse(data) as Room;
    } catch {
      await client.unwatch();
      throw new Error("Format data room tidak valid.");
    }

    const updatedRoom = await updateFn(room);

    const tx = client.multi();
    tx.set(key, JSON.stringify(updatedRoom), "EX", ROOM_TTL_SECONDS);

    const results = await tx.exec();
    if (results === null) {
      // Transaksi batal karena data berubah di tengah proses. Backoff & retry.
      console.warn(`Retry updateRoomAtomically untuk room ${roomId}, percobaan ke-${attempt}`);
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));
      continue;
    }

    return updatedRoom;
  }

  throw new Error("Gagal mengupdate room setelah beberapa kali percobaan karena konflik konkuren.");
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
  equipped_title?: string;
  daily_streak?: number;
  last_daily_challenge_completed_at?: string;
}

export interface MatchDetails {
  startArticle: string;
  endArticle: string;
  clicks: number;
  duration: number;
}

export interface PlayerMatch {
  id: number;
  username: string;
  elo_change: number;
  start_article: string;
  end_article: string;
  clicks: number;
  duration: number;
  won: number;
  played_at: number;
}

export async function getPlayerStats(username: string): Promise<PlayerStats> {
  await ensureDbInitialized();
  const res = await turso.execute({
    sql: "SELECT username, elo, games_played, wins, losses, equipped_title, daily_streak, last_daily_challenge_completed_at FROM player_stats WHERE username = :username",
    args: { username },
  });

  if (res.rows.length === 0) {
    // Buat data baru jika pengguna belum memiliki catatan statistik
    await turso.execute({
      sql: `INSERT INTO player_stats (username, elo, games_played, wins, losses, equipped_title, daily_streak, last_daily_challenge_completed_at)
            VALUES (:username, 1200, 0, 0, 0, '', 0, '')`,
      args: { username },
    });
    return { username, elo: 1200, games_played: 0, wins: 0, losses: 0, equipped_title: "", daily_streak: 0, last_daily_challenge_completed_at: "" };
  }

  const row = res.rows[0];
  return {
    username: String(row.username),
    elo: Number(row.elo),
    games_played: Number(row.games_played),
    wins: Number(row.wins),
    losses: Number(row.losses),
    equipped_title: row.equipped_title ? String(row.equipped_title) : "",
    daily_streak: row.daily_streak !== undefined && row.daily_streak !== null ? Number(row.daily_streak) : 0,
    last_daily_challenge_completed_at: row.last_daily_challenge_completed_at ? String(row.last_daily_challenge_completed_at) : "",
  };
}

export async function updatePlayerStats(
  username: string,
  eloChange: number,
  isWin: boolean,
  matchDetails?: MatchDetails,
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

  if (matchDetails) {
    try {
      await turso.execute({
        sql: `INSERT INTO matches (username, elo_change, start_article, end_article, clicks, duration, won, played_at)
              VALUES (:username, :eloChange, :startArticle, :endArticle, :clicks, :duration, :won, :playedAt)`,
        args: {
          username,
          eloChange,
          startArticle: matchDetails.startArticle,
          endArticle: matchDetails.endArticle,
          clicks: matchDetails.clicks,
          duration: matchDetails.duration,
          won: isWin ? 1 : 0,
          playedAt: Date.now(),
        },
      });
    } catch (err) {
      console.error("Gagal menyimpan riwayat pertandingan:", err);
    }
  }
}

export async function getPlayerMatches(username: string, limit = 10): Promise<PlayerMatch[]> {
  await ensureDbInitialized();
  const res = await turso.execute({
    sql: `SELECT id, username, elo_change, start_article, end_article, clicks, duration, won, played_at 
          FROM matches 
          WHERE username = :username 
          ORDER BY played_at DESC 
          LIMIT :limit`,
    args: { username, limit },
  });

  return res.rows.map((row: any) => ({
    id: Number(row.id),
    username: String(row.username),
    elo_change: Number(row.elo_change),
    start_article: String(row.start_article),
    end_article: String(row.end_article),
    clicks: Number(row.clicks),
    duration: Number(row.duration),
    won: Number(row.won),
    played_at: Number(row.played_at),
  }));
}

export async function updatePlayerTitle(username: string, title: string): Promise<void> {
  await ensureDbInitialized();
  await turso.execute({
    sql: `UPDATE player_stats SET equipped_title = :title WHERE username = :username`,
    args: { username, title },
  });
}

export async function completeDailyChallenge(
  username: string,
  dateStr: string
): Promise<{ newStreak: number; success: boolean }> {
  await ensureDbInitialized();
  const stats = await getPlayerStats(username);

  if (stats.last_daily_challenge_completed_at === dateStr) {
    // Sudah menyelesaikan hari ini, tidak dihitung kembali tapi sukses
    return { newStreak: stats.daily_streak ?? 0, success: false };
  }

  // Hitung kemarin (yesterday)
  const today = new Date(dateStr);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD

  let newStreak = 1;
  if (stats.last_daily_challenge_completed_at === yesterdayStr) {
    newStreak = (stats.daily_streak ?? 0) + 1;
  }

  await turso.execute({
    sql: `UPDATE player_stats 
          SET daily_streak = :newStreak, last_daily_challenge_completed_at = :dateStr 
          WHERE username = :username`,
    args: { username, newStreak, dateStr },
  });

  return { newStreak, success: true };
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

// ---------- Matchmaking Paths Pool Helpers (Upstash Redis + Valkey Fallback) ----------

const poolKey = (lang: string, difficulty: string) =>
  `matchmaking:pool:${lang}:${difficulty}`;

export async function popMatchmakingPath(
  lang: string,
  difficulty: string,
): Promise<{ startArticle: string; endArticle: string; path?: string[] } | null> {
  try {
    const key = poolKey(lang, difficulty);
    const upstash = getUpstashClient();
    if (upstash) {
      const res = await upstash.rpop(key);
      if (!res) return null;
      if (typeof res === "object") {
        return res as { startArticle: string; endArticle: string; path?: string[] };
      }
      return JSON.parse(res as string) as { startArticle: string; endArticle: string; path?: string[] };
    } else {
      const valkey = getValkeyClient();
      const res = await valkey.rpop(key);
      if (!res) return null;
      return JSON.parse(res) as { startArticle: string; endArticle: string; path?: string[] };
    }
  } catch (err) {
    console.error("Gagal RPOP dari matchmaking pool:", err);
    return null;
  }
}

export async function pushMatchmakingPath(
  lang: string,
  difficulty: string,
  path: { startArticle: string; endArticle: string; path?: string[] },
): Promise<void> {
  try {
    const key = poolKey(lang, difficulty);
    const upstash = getUpstashClient();
    if (upstash) {
      await upstash.lpush(key, JSON.stringify(path));
    } else {
      const valkey = getValkeyClient();
      await valkey.lpush(key, JSON.stringify(path));
    }
  } catch (err) {
    console.error("Gagal LPUSH ke matchmaking pool:", err);
  }
}

export async function getMatchmakingPoolSize(
  lang: string,
  difficulty: string,
): Promise<number> {
  try {
    const key = poolKey(lang, difficulty);
    const upstash = getUpstashClient();
    if (upstash) {
      return await upstash.llen(key);
    } else {
      const valkey = getValkeyClient();
      return await valkey.llen(key);
    }
  } catch (err) {
    console.error("Gagal LLEN dari matchmaking pool:", err);
    return 0;
  }
}

export async function trackActivePlayer(clientId: string): Promise<number> {
  const key = "active_players";
  const now = Date.now();
  const expirationTime = now - 120000; // 2 menit yang lalu

  try {
    const upstash = getUpstashClient();
    if (upstash) {
      await upstash.zadd(key, { score: now, member: clientId });
      await upstash.zremrangebyscore(key, 0, expirationTime);
      return await upstash.zcard(key);
    } else {
      const valkey = getValkeyClient();
      await valkey.zadd(key, now, clientId);
      await valkey.zremrangebyscore(key, 0, expirationTime);
      return await valkey.zcard(key);
    }
  } catch (err) {
    console.error("Gagal melakukan trackActivePlayer:", err);
    return 1;
  }
}

export async function getActivePlayersCount(): Promise<number> {
  const key = "active_players";
  const now = Date.now();
  const expirationTime = now - 120000;

  try {
    const upstash = getUpstashClient();
    if (upstash) {
      await upstash.zremrangebyscore(key, 0, expirationTime);
      return await upstash.zcard(key);
    } else {
      const valkey = getValkeyClient();
      await valkey.zremrangebyscore(key, 0, expirationTime);
      return await valkey.zcard(key);
    }
  } catch (err) {
    console.error("Gagal mendapatkan online count:", err);
    return 1;
  }
}

export async function getBotStreak(username: string): Promise<number> {
  const key = `bot_streak:${username}`;
  try {
    const upstash = getUpstashClient();
    if (upstash) {
      const val = await upstash.get(key);
      return val ? Number(val) : 0;
    } else {
      const valkey = getValkeyClient();
      const val = await valkey.get(key);
      return val ? Number(val) : 0;
    }
  } catch (err) {
    console.error("Gagal getBotStreak:", err);
    return 0;
  }
}

export async function incrementBotStreak(username: string): Promise<number> {
  const key = `bot_streak:${username}`;
  const TTL = 86400; // 24 jam dalam detik
  try {
    const upstash = getUpstashClient();
    if (upstash) {
      const val = await upstash.incr(key);
      await upstash.expire(key, TTL);
      return val;
    } else {
      const valkey = getValkeyClient();
      const val = await valkey.incr(key);
      await valkey.expire(key, TTL);
      return val;
    }
  } catch (err) {
    console.error("Gagal incrementBotStreak:", err);
    return 1;
  }
}

export async function resetBotStreak(username: string): Promise<void> {
  const key = `bot_streak:${username}`;
  try {
    const upstash = getUpstashClient();
    if (upstash) {
      await upstash.del(key);
    } else {
      const valkey = getValkeyClient();
      await valkey.del(key);
    }
  } catch (err) {
    console.error("Gagal resetBotStreak:", err);
  }
}
