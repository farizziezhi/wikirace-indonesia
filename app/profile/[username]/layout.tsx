import type { Metadata } from "next";
import { getPlayerStats } from "@/lib/redis";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  let statsInfo = "";
  try {
    const stats = await getPlayerStats(decodedUsername);
    if (stats) {
      const titleStr = stats.equipped_title ? ` [${stats.equipped_title}]` : "";
      statsInfo = ` (ELO: ${Math.round(stats.elo)} | Wins: ${stats.wins}/${stats.games_played}${titleStr})`;
    }
  } catch (err) {
    // Fail-silent, fallback to default title
  }

  return {
    title: `Profil ${decodedUsername}${statsInfo}`,
    description: `Profil pemain, statistik ELO rating, dan riwayat pertandingan ${decodedUsername} di WikiRace Indonesia. Mainkan game balapan Wikipedia gratis online!`,
    alternates: {
      canonical: `${baseUrl}/profile/${encodeURIComponent(username)}`,
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
