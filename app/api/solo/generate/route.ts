import { NextResponse } from "next/server";
import { generateSoloArticlePair } from "@/lib/solo-bfs";
import type { WikiLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") ?? "id") as WikiLanguage;

  // Validate inputs
  if (lang !== "id" && lang !== "en") {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  try {
    const result = await generateSoloArticlePair(lang, 4);
    if (!result) {
      return NextResponse.json({ error: "Gagal generate artikel. Coba lagi." }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Solo Generation Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
