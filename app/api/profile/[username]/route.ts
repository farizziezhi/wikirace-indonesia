import { type NextRequest } from "next/server";
import { getPlayerStats, getPlayerMatches } from "@/lib/redis";

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
    const stats = await getPlayerStats(username);
    const matches = await getPlayerMatches(username);

    return Response.json({
      success: true,
      username,
      stats,
      matches,
    });
  } catch (err) {
    console.error("Gagal memuat profil:", err);
    return Response.json({ error: "Gagal memuat data profil." }, { status: 500 });
  }
}
