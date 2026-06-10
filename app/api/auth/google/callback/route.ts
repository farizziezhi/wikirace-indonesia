import crypto from "crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth-server";
import { getPlayerStats } from "@/lib/redis";
import { ensureDbInitialized, turso } from "@/lib/turso";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await ensureDbInitialized();

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  // Hapus cookie state setelah dibaca
  cookieStore.delete("google_oauth_state");

  // 1) CSRF Verification
  if (!state || !savedState || state !== savedState) {
    return new NextResponse(
      "Gagal verifikasi keamanan (State mismatch). Kemungkinan serangan CSRF.",
      { status: 400 }
    );
  }

  if (!code) {
    return new NextResponse("Authorization code tidak ditemukan.", { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Kredensial Google OAuth belum dikonfigurasi." },
      { status: 500 }
    );
  }

  // Tentukan redirect URI secara dinamis agar cocok dengan request
  const host = request.headers.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  try {
    // 2) Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Gagal menukar OAuth code:", tokenData);
      return new NextResponse("Gagal autentikasi dengan server Google.", { status: 500 });
    }

    // 3) Fetch user details from Google userinfo API
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userinfoRes.json();
    if (!userinfoRes.ok || !userInfo.email) {
      console.error("Gagal mengambil profil Google:", userInfo);
      return new NextResponse("Gagal mengambil data profil Google.", { status: 500 });
    }

    // 4) Sanitize username dari awalan email (maks 20 karakter, huruf/angka/underscore)
    const rawName = userInfo.email.split("@")[0];
    const sanitized = rawName.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20);
    if (!sanitized) {
      return new NextResponse("Email Google Anda tidak dapat digunakan untuk username.", { status: 400 });
    }

    // 5) Cari atau buat user baru di DB Turso dengan resolusi tabrakan (collision)
    let username = sanitized;
    let finished = false;
    let attempts = 0;

    while (!finished && attempts < 10) {
      const existing = await turso.execute({
        sql: "SELECT password_hash FROM users WHERE username = :username",
        args: { username },
      });

      if (existing.rows.length === 0) {
        // Username kosong! Daftarkan akun baru
        const now = Date.now();
        await turso.execute({
          sql: "INSERT INTO users (username, password_hash, salt, created_at) VALUES (:username, 'oauth:google', 'oauth', :now)",
          args: { username, now },
        });
        finished = true;
      } else {
        const row = existing.rows[0];
        if (row.password_hash === "oauth:google") {
          // User sudah pernah mendaftar via Google, lanjut login
          finished = true;
        } else {
          // Tabrakan dengan user lokal (password), buat variasi username baru
          attempts++;
          if (attempts === 1) {
            // Potong agar pas ditambahkan "_gg" (max 20 char)
            username = `${sanitized.slice(0, 17)}_gg`;
          } else {
            const rand = Math.floor(Math.random() * 100);
            username = `${sanitized.slice(0, 16)}_${rand}`;
          }
        }
      }
    }

    if (!finished) {
      return new NextResponse("Gagal menghasilkan username unik.", { status: 500 });
    }

    // 6) Inisialisasi statistik pemain di DB
    await getPlayerStats(username);

    // 7) Buat sesi baru
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 hari
    await turso.execute({
      sql: "INSERT INTO sessions (token, username, expires_at) VALUES (:token, :username, :expiresAt)",
      args: { token, username, expiresAt },
    });

    await setSessionCookie(token);

    // 8) Arahkan kembali ke halaman utama
    const appUrl = `${protocol}://${host}`;
    return NextResponse.redirect(appUrl);
  } catch (err) {
    console.error("Proses Google Callback gagal:", err);
    return new NextResponse("Terjadi kesalahan server internal.", { status: 500 });
  }
}
