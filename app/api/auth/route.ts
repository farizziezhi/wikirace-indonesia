import crypto from "crypto";
import { type NextRequest } from "next/server";

import {
  deleteSessionCookie,
  getSessionUsername,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth-server";
import { getPlayerStats, checkRateLimit } from "@/lib/redis";
import { ensureDbInitialized, turso } from "@/lib/turso";

export const dynamic = "force-dynamic";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return Response.json({ loggedIn: false });
  }

  try {
    const stats = await getPlayerStats(username);
    return Response.json({ loggedIn: true, username, stats });
  } catch {
    return Response.json({ loggedIn: true, username, stats: null });
  }
}

export async function POST(request: NextRequest) {
  await ensureDbInitialized();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  if (action === "register") {
    // Rate limit pendaftaran: 5 kali per 10 menit per IP
    const rateLimitIp = await checkRateLimit(ip, "register_ip", 5, 600);
    if (!rateLimitIp.allowed) {
      return Response.json(
        { error: "Terlalu banyak percobaan registrasi. Coba lagi dalam 10 menit." },
        { status: 429 },
      );
    }

    let body: { username?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Body harus JSON valid." }, { status: 400 });
    }

    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username) {
      return Response.json({ error: "Username tidak boleh kosong." }, { status: 400 });
    }
    if (username.length > 20) {
      return Response.json({ error: "Username maksimal 20 karakter." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return Response.json(
        { error: "Username hanya boleh berisi huruf, angka, dan underscore." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return Response.json(
        { error: "Password minimal harus 8 karakter." },
        { status: 400 },
      );
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return Response.json(
        { error: "Password harus mengandung minimal satu huruf dan satu angka." },
        { status: 400 },
      );
    }

    // Cek apakah username sudah ada
    try {
      const existing = await turso.execute({
        sql: "SELECT username FROM users WHERE username = :username",
        args: { username },
      });
      if (existing.rows.length > 0) {
        return Response.json({ error: "Username sudah terdaftar." }, { status: 409 });
      }

      // Hash password dan daftarkan user baru
      const { hash, salt } = hashPassword(password);
      const now = Date.now();
      await turso.execute({
        sql: "INSERT INTO users (username, password_hash, salt, created_at) VALUES (:username, :hash, :salt, :now)",
        args: { username, hash, salt, now },
      });

      // Bikin session token
      const token = crypto.randomUUID();
      const expiresAt = now + 1000 * 60 * 60 * 24 * 30; // 30 hari
      await turso.execute({
        sql: "INSERT INTO sessions (token, username, expires_at) VALUES (:token, :username, :expiresAt)",
        args: { token, username, expiresAt },
      });

      // Set cookie
      await setSessionCookie(token);

      // Inisialisasi default player stats
      const stats = await getPlayerStats(username);

      return Response.json({ success: true, username, stats });
    } catch (err) {
      console.error("Registrasi gagal:", err);
      return Response.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
  }

  if (action === "login") {
    // Rate limit login by IP: 10 kali per 1 menit
    const rateLimitIp = await checkRateLimit(ip, "login_ip", 10, 60);
    if (!rateLimitIp.allowed) {
      return Response.json(
        { error: "Terlalu banyak percobaan login dari IP ini. Coba lagi dalam 1 menit." },
        { status: 429 },
      );
    }

    let body: { username?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Body harus JSON valid." }, { status: 400 });
    }

    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return Response.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 },
      );
    }

    // Rate limit login by Username: 5 kali per 1 menit untuk mencegah targeted brute force
    const rateLimitUser = await checkRateLimit(username, "login_user", 5, 60);
    if (!rateLimitUser.allowed) {
      return Response.json(
        { error: "Terlalu banyak percobaan login untuk akun ini. Coba lagi dalam 1 menit." },
        { status: 429 },
      );
    }

    try {
      const res = await turso.execute({
        sql: "SELECT password_hash, salt FROM users WHERE username = :username",
        args: { username },
      });

      const userRow = res.rows[0];
      if (!userRow) {
        return Response.json(
          { error: "Username atau password salah." },
          { status: 401 },
        );
      }

      const hash = String(userRow.password_hash);
      const salt = String(userRow.salt);

      const isValid = verifyPassword(password, hash, salt);
      if (!isValid) {
        return Response.json(
          { error: "Username atau password salah." },
          { status: 401 },
        );
      }

      // Bikin sesi baru
      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 hari
      await turso.execute({
        sql: "INSERT INTO sessions (token, username, expires_at) VALUES (:token, :username, :expiresAt)",
        args: { token, username, expiresAt },
      });

      await setSessionCookie(token);

      const stats = await getPlayerStats(username);

      return Response.json({ success: true, username, stats });
    } catch (err) {
      console.error("Login gagal:", err);
      return Response.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
  }

  if (action === "logout") {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("wikirace_session")?.value;
      if (token) {
        await turso.execute({
          sql: "DELETE FROM sessions WHERE token = :token",
          args: { token },
        });
      }
    } catch {
      // Abaikan jika cookie Store gagal diakses
    }

    await deleteSessionCookie();
    return Response.json({ success: true });
  }

  return Response.json({ error: "Aksi tidak didukung." }, { status: 400 });
}

// Tambahan helper cookies di file terpisah dibaca lewat standard Next.js
import { cookies } from "next/headers";
