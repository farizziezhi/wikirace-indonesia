import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, strategi, trivia, dan panduan lengkap seputar WikiRace dan Wikipedia — ditulis oleh Tim WikiRace Indonesia.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog | WikiRace Indonesia",
    description:
      "Tips, strategi, trivia, dan panduan lengkap seputar WikiRace dan Wikipedia.",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
