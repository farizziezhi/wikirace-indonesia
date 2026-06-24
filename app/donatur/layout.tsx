import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor & Pendukung | WikiRace Indonesia",
  description: "Daftar sponsor dan donatur WikiRace Indonesia. Dukung server, realtime DB, dan hosting game Wikipedia Game gratis ini.",
  alternates: {
    canonical: "/donatur",
  },
};

export default function DonatorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
