import { NextResponse } from "next/server";
import { generateSoloArticlePair } from "@/lib/solo-bfs";
import type { WikiLanguage } from "@/lib/types";
import type { SoloTheme } from "@/lib/solo-curated";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") ?? "id") as WikiLanguage;
  const theme = (searchParams.get("theme") ?? "all") as SoloTheme;
  const difficulty = (searchParams.get("difficulty") ?? "medium") as "easy" | "medium" | "hard";
  const start = searchParams.get("start") || null;
  const end = searchParams.get("end") || null;

  // Validate inputs
  if (lang !== "id" && lang !== "en") {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

  try {
    const result = await generateSoloArticlePair(lang, theme, difficulty, start, end);
    if (!result) {
      return NextResponse.json({ error: "Gagal generate artikel. Coba lagi." }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Solo Generation Error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
