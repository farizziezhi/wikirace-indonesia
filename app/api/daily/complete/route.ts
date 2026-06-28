import { type NextRequest, NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth-server";
import { completeDailyChallenge } from "@/lib/redis";
import { errorResponse } from "@/lib/room";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const username = await getSessionUsername();
  if (!username) {
    return errorResponse("Anda harus login untuk mencatat tantangan harian.", 401);
  }

  // Get date string in WIB (GMT+7)
  const wibTime = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const dateStr = wibTime.toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const result = await completeDailyChallenge(username, dateStr);

    return NextResponse.json({
      success: true,
      streak: result.newStreak,
      streakUpdated: result.success,
      message: result.success 
      ? "Tantangan harian berhasil diselesaikan! Streak Anda bertambah." 
      : "Tantangan harian sudah diselesaikan hari ini.",
    });
  } catch (err) {
    console.error("Gagal memproses penyelesaian tantangan harian:", err);
    return errorResponse("Terjadi kesalahan server saat menyimpan tantangan harian.", 500);
  }
}
