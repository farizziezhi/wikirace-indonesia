import { type NextRequest, NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth-server";
import { getPlayerStats } from "@/lib/redis";
import { CHALLENGE_PACKS } from "@/lib/challenges";
import type { WikiLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") ?? "id") as WikiLanguage;

  if (lang !== "id" && lang !== "en") {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  // Get date string in WIB (GMT+7)
  const wibTime = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const dateStr = wibTime.toISOString().split("T")[0]; // YYYY-MM-DD

  // Deterministic hash based on date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Filter challenges by requested language
  const filtered = CHALLENGE_PACKS.filter((c) => c.lang === lang);
  if (filtered.length === 0) {
    return NextResponse.json({ error: "No challenges available for this language" }, { status: 404 });
  }

  const idx = Math.abs(hash) % filtered.length;
  const challenge = filtered[idx];

  // Check user session
  const username = await getSessionUsername();
  let completed = false;
  let streak = 0;

  if (username) {
    try {
      const stats = await getPlayerStats(username);
      streak = stats.daily_streak ?? 0;
      completed = stats.last_daily_challenge_completed_at === dateStr;
    } catch (err) {
      console.warn("Gagal mengambil status tantangan harian user:", err);
    }
  }

  return NextResponse.json({
    success: true,
    date: dateStr,
    challenge: {
      id: challenge.id,
      startArticle: challenge.startArticle,
      endArticle: challenge.endArticle,
      difficulty: challenge.difficulty,
      description: challenge.description,
      name: challenge.name,
      lang: challenge.lang,
    },
    completed,
    streak,
  });
}
