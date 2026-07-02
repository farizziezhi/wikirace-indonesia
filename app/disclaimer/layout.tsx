import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer resmi WikiRace Indonesia — informasi tentang status independen platform, penggunaan konten Wikipedia, dan keterbatasan layanan.",
  alternates: {
    canonical: "/disclaimer",
  },
  openGraph: {
    title: "Disclaimer | WikiRace Indonesia",
    description:
      "Disclaimer resmi WikiRace Indonesia — status independen, penggunaan konten Wikipedia, dan keterbatasan layanan.",
    type: "website",
  },
};

export default function DisclaimerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
