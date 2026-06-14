import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donatur & Hall of Fame",
  description:
    "Daftar donatur dan pendukung yang membantu menjaga server WikiRace Indonesia tetap aktif dan gratis untuk semua orang.",
};

export default function DonaturLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
