import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description:
    "Hubungi tim WikiRace Indonesia — laporkan bug, beri masukan, atau ajukan ide fitur baru. Kami selalu terbuka untuk komunitas.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Hubungi Kami | WikiRace Indonesia",
    description:
      "Hubungi tim WikiRace Indonesia — laporkan bug, beri masukan, atau ajukan ide fitur baru.",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
