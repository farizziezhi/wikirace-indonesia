import type { Metadata } from "next";
import GuideClient from "./GuideClient";

export const metadata: Metadata = {
  title: "Game Guide & Cara Bermain Wikipedia Game | WikiRace Indonesia",
  description:
    "Pelajari aturan dasar bermain WikiRace, sistem rating ELO kompetitif, latihan mode solo, room kustom, serta strategi jitu memenangkan perlombaan Wikipedia.",
  alternates: {
    canonical: "/guide",
  },
  openGraph: {
    title: "Game Guide & Cara Bermain Wikipedia Game | WikiRace Indonesia",
    description:
      "Pelajari aturan dasar bermain WikiRace, sistem rating ELO kompetitif, latihan mode solo, room kustom, serta strategi jitu memenangkan perlombaan Wikipedia.",
    type: "website",
  },
};

export default function GuidePage() {
  return <GuideClient />;
}
