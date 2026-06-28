import { type NextRequest } from "next/server";
import { getSessionUsername } from "@/lib/auth-server";
import { updatePlayerTitle, getPlayerStats } from "@/lib/redis";
import { errorResponse } from "@/lib/room";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const username = await getSessionUsername();
  if (!username) {
    return errorResponse("Anda harus masuk terlebih dahulu.", 401);
  }

  let body: { title?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Body harus JSON valid.", 400);
  }

  const title = typeof body.title === "string" ? body.title : "";

  // Verifikasi kelayakan gelar (bisa dilewati jika string kosong untuk melepas gelar)
  if (title !== "") {
    const stats = await getPlayerStats(username);
    const elo = stats.elo ?? 1200;
    const wins = stats.wins ?? 0;
    const games = stats.games_played ?? 0;
    const winRate = games > 0 ? (wins / games) : 0;

    let isEligible = false;

    // ELO titles
    if (title === "Wikipedia Rookie" || title === "Pemula Wikipedia") {
      isEligible = true;
    } else if (title === "Link Explorer" || title === "Penjelajah Link") {
      isEligible = elo >= 1100;
    } else if (title === "Word Racer" || title === "Pembalap Kata") {
      isEligible = elo >= 1300;
    } else if (title === "Article Knight" || title === "Ksatria Artikel") {
      isEligible = elo >= 1500;
    } else if (title === "WikiRace Legend" || title === "Legenda WikiRace") {
      isEligible = elo >= 1700;
    } 
    // Achievement titles
    else if (title === "Reigning Champion" || title === "Juara Bertahan") {
      isEligible = wins >= 50;
    } else if (title === "Veteran Explorer" || title === "Veteran Penjelajah") {
      isEligible = games >= 100;
    } else if (title === "Wiki Doctor" || title === "Doktor Wiki") {
      isEligible = wins >= 10 && winRate >= 0.7;
    }

    if (!isEligible) {
      return errorResponse("Anda belum memenuhi syarat untuk gelar ini.", 403);
    }
  }

  try {
    await updatePlayerTitle(username, title);
    return Response.json({ success: true, title });
  } catch (err) {
    console.error("Gagal mengganti gelar:", err);
    return errorResponse("Gagal menyimpan gelar baru.", 500);
  }
}
