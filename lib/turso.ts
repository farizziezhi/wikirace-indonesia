import { createClient } from "@libsql/client";

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

/**
 * Inisialisasi tabel-tabel SQLite di Turso jika belum ada.
 */
async function initDb() {
  await turso.batch([
    // Tabel users
    `CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );`,
    // Tabel sessions
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );`,
    // Tabel player_stats
    `CREATE TABLE IF NOT EXISTS player_stats (
      username TEXT PRIMARY KEY,
      elo REAL DEFAULT 1200,
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0
    );`
  ], "write");
}

let dbInitializedPromise: Promise<void> | null = null;

/**
 * Memastikan database sudah diinisialisasi sebelum melakukan query.
 */
export async function ensureDbInitialized(): Promise<void> {
  if (!dbInitializedPromise) {
    dbInitializedPromise = initDb().catch((err) => {
      console.error("Gagal inisialisasi Turso DB:", err);
      dbInitializedPromise = null; // Coba lagi di request berikutnya jika gagal
      throw err;
    });
  }
  return dbInitializedPromise;
}
