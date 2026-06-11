import { type NextRequest, NextResponse } from "next/server";
import { turso, ensureDbInitialized } from "@/lib/turso";

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi secret token dari query parameter
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get("secret");
    const webhookSecret = process.env.SAWERIA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "SAWERIA_WEBHOOK_SECRET belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    if (!secretParam || secretParam !== webhookSecret) {
      return NextResponse.json(
        { error: "Akses ditolak. Secret token tidak cocok." },
        { status: 401 }
      );
    }

    // 2. Parse payload Saweria
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
    }

    // Ekstrak data (Saweria mengirim amount_raw, donator_name, message)
    const amount = Number(payload.amount_raw || payload.amount || 0);
    const name = String(payload.donator_name || payload.name || "Anonim").trim();
    const message = String(payload.message || "").trim();

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Nominal donasi harus lebih besar dari 0." },
        { status: 400 }
      );
    }

    // 3. Simpan donasi baru ke database Turso SQLite
    await ensureDbInitialized();
    const createdAt = Math.floor(Date.now() / 1000);

    await turso.execute({
      sql: `INSERT INTO donators (name, amount, message, created_at)
            VALUES (:name, :amount, :message, :createdAt)`,
      args: {
        name: name || "Anonim",
        amount,
        message,
        createdAt,
      },
    });

    console.log(`[Saweria Webhook] Donasi diterima: ${name} sebesar Rp ${amount.toLocaleString("id-ID")}`);

    return NextResponse.json({
      success: true,
      message: "Webhook Saweria sukses diproses dan disimpan ke database.",
    });
  } catch (err) {
    console.error("Gagal memproses webhook Saweria:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
