import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor & Pendukung | WikiRace Indonesia",
  description: "Paddock konstruktor dan donatur WikiRace Indonesia. Dukung server, realtime DB, dan hosting game Wikipedia Game gratis ini.",
};

export default function DonatorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
