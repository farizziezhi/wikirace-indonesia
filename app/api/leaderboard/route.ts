import { getGlobalLeaderboard } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = await getGlobalLeaderboard(10);
    return Response.json({ leaderboard });
  } catch (err) {
    console.error("Gagal memuat leaderboard:", err);
    return Response.json({ error: "Gagal memuat papan peringkat." }, { status: 500 });
  }
}
