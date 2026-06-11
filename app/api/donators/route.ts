import { NextResponse } from "next/server";
import { turso, ensureDbInitialized } from "@/lib/turso";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized();

    // Ambil top donatur (diurutkan berdasarkan nominal tertinggi)
    const topRes = await turso.execute(
      "SELECT id, name, amount, message, created_at FROM donators ORDER BY amount DESC, created_at DESC LIMIT 50"
    );

    // Ambil donasi terbaru (diurutkan berdasarkan waktu terbaru)
    const recentRes = await turso.execute(
      "SELECT id, name, amount, message, created_at FROM donators ORDER BY created_at DESC LIMIT 50"
    );

    const top = topRes.rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      amount: Number(row.amount),
      message: row.message ? String(row.message) : "",
      createdAt: Number(row.created_at),
    }));

    const recent = recentRes.rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      amount: Number(row.amount),
      message: row.message ? String(row.message) : "",
      createdAt: Number(row.created_at),
    }));

    return NextResponse.json({ top, recent });
  } catch (err) {
    console.error("Gagal mengambil donatur:", err);
    return NextResponse.json({ error: "Gagal mengambil data donatur." }, { status: 500 });
  }
}
