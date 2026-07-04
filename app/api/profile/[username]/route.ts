import { type NextRequest } from "next/server";
import { getPlayerStats, getPlayerMatches } from "@/lib/redis";
import { isBotName } from "@/lib/bot-names";
import { turso } from "@/lib/turso";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  if (!username) {
    return Response.json({ error: "Username wajib diisi." }, { status: 400 });
  }

  try {
    // Cek apakah user terdaftar di database
    const userCheck = await turso.execute({
      sql: "SELECT 1 FROM users WHERE username = :username",
      args: { username },
    });

    const isRegisteredUser = userCheck.rows.length > 0;

    if (isRegisteredUser) {
      // User asli terdaftar — tampilkan profil lengkap
      const stats = await getPlayerStats(username);
      const matches = await getPlayerMatches(username);

      return Response.json({
        success: true,
        username,
        stats,
        matches,
      });
    }

    if (isBotName(username)) {
      // Username bot — tampilkan profil default (seolah pemain baru)
      return Response.json({
        success: true,
        username,
        stats: {
          username,
          elo: 1200,
          games_played: 0,
          wins: 0,
          losses: 0,
          equipped_title: "",
          daily_streak: 0,
          last_daily_challenge_completed_at: "",
        },
        matches: [],
      });
    }

    // Username tidak terdaftar dan bukan bot — not found
    return Response.json(
      { error: "Pemain tidak ditemukan." },
      { status: 404 }
    );
  } catch (err) {
    console.error("Gagal memuat profil:", err);
    return Response.json({ error: "Gagal memuat data profil." }, { status: 500 });
  }
}
