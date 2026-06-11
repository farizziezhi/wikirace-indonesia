import { NextResponse } from "next/server";
import { turso, ensureDbInitialized } from "@/lib/turso";

export async function POST(request: Request) {
  try {
    // 1. Autentikasi dengan token admin
    const authHeader = request.headers.get("Authorization");
    const secretKey = process.env.ADMIN_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "ADMIN_SECRET_KEY tidak terkonfigurasi di server." },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: "Akses ditolak. Token otorisasi tidak valid." },
        { status: 401 }
      );
    }

    // 2. Parse body
    const body = await request.json().catch(() => ({}));
    const { name, amount, message } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Parameter 'name' wajib berupa teks." },
        { status: 400 }
      );
    }

    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Parameter 'amount' wajib berupa angka lebih besar dari 0." },
        { status: 400 }
      );
    }

    // 3. Simpan ke database
    await ensureDbInitialized();
    const createdAt = Math.floor(Date.now() / 1000);

    await turso.execute({
      sql: `INSERT INTO donators (name, amount, message, created_at)
            VALUES (:name, :amount, :message, :createdAt)`,
      args: {
        name: name.trim(),
        amount,
        message: message ? message.trim() : "",
        createdAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan donatur: ${name} sebesar Rp ${amount.toLocaleString("id-ID")}`,
    });
  } catch (err) {
    console.error("Gagal menambahkan donatur:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
