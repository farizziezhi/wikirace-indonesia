import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "Kenali WikiRace Indonesia — platform balapan Wikipedia online pertama berbahasa Indonesia. Misi, tim, dan cerita di balik pembuatannya.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Tentang Kami | WikiRace Indonesia",
    description:
      "Kenali WikiRace Indonesia — platform balapan Wikipedia online pertama berbahasa Indonesia.",
    type: "website",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
