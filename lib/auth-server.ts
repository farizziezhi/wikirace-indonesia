import crypto from "crypto";
import { cookies } from "next/headers";

import { ensureDbInitialized, turso } from "./turso";

/**
 * Hash password menggunakan algoritma pbkdf2 bawaan Node.js.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
}

/**
 * Verifikasi apakah password cocok dengan hash dan salt yang disimpan.
 */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): boolean {
  const checkHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return checkHash === hash;
}

/**
 * Mengambil nama pengguna dari sesi aktif saat ini berdasarkan cookie.
 */
export async function getSessionUsername(): Promise<string | null> {
  await ensureDbInitialized();
  const cookieStore = await cookies();
  const token = cookieStore.get("wikirace_session")?.value;
  if (!token) return null;

  try {
    const res = await turso.execute({
      sql: "SELECT username, expires_at FROM sessions WHERE token = :token",
      args: { token },
    });

    const row = res.rows[0];
    if (!row) return null;

    const expiresAt = Number(row.expires_at);
    if (Date.now() > expiresAt) {
      // Sesi kedaluwarsa, hapus dari DB
      await turso.execute({
        sql: "DELETE FROM sessions WHERE token = :token",
        args: { token },
      });
      return null;
    }

    return String(row.username);
  } catch (err) {
    console.error("Gagal verifikasi sesi di DB:", err);
    return null;
  }
}

/**
 * Menyimpan token sesi ke browser menggunakan HttpOnly Cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("wikirace_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 hari dalam detik
    path: "/",
    sameSite: "lax",
  });
}

/**
 * Menghapus token sesi dari browser.
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("wikirace_session");
}
