import { type NextRequest, NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth-server";
import { getPlayerStats } from "@/lib/redis";
import { CHALLENGE_PACKS } from "@/lib/challenges";
import type { WikiLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

const CHALLENGE_TRANSLATIONS: Record<string, { nameEn: string; descEn: string }> = {
  "geography-id-1": { nameEn: "Island to Island", descEn: "Explore the Indonesian archipelago" },
  "geography-id-2": { nameEn: "Major Cities", descEn: "From metropolises to historical cities" },
  "geography-id-3": { nameEn: "Eastern Archipelago", descEn: "Adventure to eastern Indonesia" },
  "history-id-1": { nameEn: "Founding Figures", descEn: "From proclamators to the republic" },
  "history-id-2": { nameEn: "Kingdom Era", descEn: "Traces of Indonesian kingdoms" },
  "history-id-3": { nameEn: "Independence Struggle", descEn: "Traces of the 1945 struggle" },
  "culture-id-1": { nameEn: "Traditional Arts", descEn: "Wayang to regional dances" },
  "culture-id-2": { nameEn: "Archipelago Cuisine", descEn: "Indonesian taste adventure" },
  "philosophy-id-1": { nameEn: "World Philosophy", descEn: "A journey of logic and thoughts" },
  "tech-id-1": { nameEn: "Computing Systems", descEn: "From operating systems to the cloud" },
  "food-id-3": { nameEn: "Spicy Food", descEn: "Nusantara chili lovers" },
  "culture-id-3": { nameEn: "Public Transportation", descEn: "KRL Commuter Line to TransJakarta" },
  "nature-id-1": { nameEn: "Flora & Fauna", descEn: "Unique creatures of Indonesia" },
  "music-id-1": { nameEn: "Legendary Bands", descEn: "From alternative to pop era" },
  "history-id-4": { nameEn: "Generals' Struggle", descEn: "Indonesian national heroes" },
  "nature-id-2": { nameEn: "Pacific Ring of Fire", descEn: "Legendary active volcanoes" },
  "geography-id-4": { nameEn: "Two Great Temples", descEn: "Explore the heritage of ancient dynasties" },
  "culture-id-4": { nameEn: "Literature & Poetry", descEn: "Global Indonesian poets" },
  "myth-id-1": { nameEn: "Astronomy & Myths", descEn: "From eclipse science to the southern coast legend" },
  "tech-id-2": { nameEn: "Ancient Maritime Tech", descEn: "From traditional weapons to sailboats" },
  "philosophy-id-2": { nameEn: "National Motto", descEn: "From the state foundation to national unity" },
  "sports-id-1": { nameEn: "Badminton Legends", descEn: "From modern to classic legends" },
  "food-id-4": { nameEn: "Sweet Culinary", descEn: "Traditional Indonesian sweet snacks" },
  "tech-id-3": { nameEn: "Popular Social Media", descEn: "From legendary local forums to global social media" },
  "media-id-1": { nameEn: "Indonesian Cinema", descEn: "From the television industry to national film awards" },
  "geography-id-5": { nameEn: "Peaks and Lakes", descEn: "From Papua's highest peak to Sumatra's volcanic lake" },
  "geography-id-6": { nameEn: "Lake Tourism", descEn: "Explore the beauty of the largest caldera" },
  "history-id-5": { nameEn: "Islamic Kingdoms", descEn: "The development of major sultanates in Java" },
  "culture-id-5": { nameEn: "Bamboo Arts", descEn: "Traditional instruments to their cultural hub" },
  "history-id-6": { nameEn: "Archaeological Sites", descEn: "Java's prehistoric sites to ancient human species" },
  "history-id-7": { nameEn: "Spices & Colonialism", descEn: "From cloves to the Dutch East India Company" },
  "myth-id-2": { nameEn: "Wayang & Ancient Epics", descEn: "Local heroic characters to ancient Indian epics" },
  "law-id-1": { nameEn: "State Constitution", descEn: "The constitution to its guardian" },
  "nature-id-3": { nameEn: "Ancient Fauna & Climate", descEn: "Sumatran large mammals to the ice age" },
};

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

  const translation = CHALLENGE_TRANSLATIONS[challenge.id];
  const nameEn = translation ? translation.nameEn : challenge.name;
  const descEn = translation ? translation.descEn : challenge.description;

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
      nameEn,
      descEn,
    },
    completed,
    streak,
  });
}
