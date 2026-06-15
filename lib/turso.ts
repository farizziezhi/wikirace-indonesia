import { createClient } from "@libsql/client";

let tursoInstance: ReturnType<typeof createClient> | null = null;

function getTursoClient() {
  if (!tursoInstance) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) {
      // Selama build Next.js (prerender), environment variable dari Turso bisa kosong.
      // Kita lempar error hanya jika benar-benar diakses saat runtime.
      throw new Error("TURSO_DATABASE_URL tidak dikonfigurasi di environment variables.");
    }
    tursoInstance = createClient({
      url,
      authToken,
    });
  }
  return tursoInstance;
}

export const turso = {
  execute(args: any) {
    return getTursoClient().execute(args);
  },
  batch(args: any, mode?: any) {
    return getTursoClient().batch(args, mode);
  }
};

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
      losses INTEGER DEFAULT 0,
      equipped_title TEXT DEFAULT ''
    );`,
    // Tabel matches baru
    `CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      elo_change REAL NOT NULL,
      start_article TEXT NOT NULL,
      end_article TEXT NOT NULL,
      clicks INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      won INTEGER NOT NULL,
      played_at INTEGER NOT NULL
    );`,
    // Tabel donators
    `CREATE TABLE IF NOT EXISTS donators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      message TEXT,
      created_at INTEGER NOT NULL
    );`
  ], "write");

  // Migrasi kolom equipped_title untuk DB yang sudah ada
  try {
    await turso.execute("ALTER TABLE player_stats ADD COLUMN equipped_title TEXT DEFAULT '';");
  } catch {
    // Abaikan error jika kolom sudah ada
  }
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
