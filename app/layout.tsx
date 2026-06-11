import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id",
  ),
  title: {
    default: "WikiRace Indonesia - Game Balapan Wikipedia Tercepat",
    template: "%s | WikiRace Indonesia",
  },
  description:
    "Game balapan edukatif online terpopuler di Indonesia. Telusuri Wikipedia dari satu artikel ke artikel lain hanya dengan klik link biru. Main multiplayer (Ranked ELO), mabar bersama teman, atau solo training gratis selamanya.",
  keywords: [
    "wikirace",
    "wikirace indonesia",
    "wikipedia game",
    "wikipedia game indonesia",
    "game edukasi",
    "balapan wikipedia",
    "main wikirace gratis",
    "wikirace multiplayer",
    "game asah otak",
  ],
  openGraph: {
    title: "WikiRace Indonesia - Game Balapan Wikipedia Tercepat",
    description:
      "Game balapan edukatif online terpopuler di Indonesia. Telusuri Wikipedia hanya dengan klik link biru. Main multiplayer ELO, mabar, atau solo gratis selamanya.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id",
    siteName: "WikiRace Indonesia",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WikiRace Indonesia - Game Balapan Wikipedia Tercepat",
    description:
      "Game balapan edukatif online terpopuler di Indonesia. Telusuri Wikipedia hanya dengan klik link biru. Main multiplayer ELO, mabar, atau solo gratis selamanya.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://wikirace-indonesia.vercel.app/#webapp",
        "name": "WikiRace Indonesia",
        "url": "https://wikirace-indonesia.vercel.app",
        "applicationCategory": "GameApplication",
        "operatingSystem": "All",
        "genre": "Educational Game, Puzzle",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "IDR",
        },
        "description":
          "WikiRace Indonesia adalah game balapan edukatif multiplayer di mana pemain berlomba menelusuri artikel Wikipedia dengan hanya mengklik tautan (link) dari artikel awal hingga mencapai artikel tujuan secepat mungkin.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://wikirace-indonesia.vercel.app/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Apa itu WikiRace Indonesia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "WikiRace Indonesia (dikenal juga sebagai Wikipedia Game) adalah permainan edukasi online di mana Anda harus menelusuri Wikipedia dari artikel start ke artikel finish yang ditentukan hanya dengan mengklik link biru di dalam artikel tersebut.",
            },
          },
          {
            "@type": "Question",
            "name": "Bagaimana cara bermain WikiRace Indonesia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Anda diberikan sebuah artikel awal dan artikel tujuan. Klik link biru di dalam halaman Wikipedia untuk berpindah artikel sampai Anda menemukan artikel tujuan. Pemain dengan waktu tercepat atau jumlah klik paling sedikit memenangkan permainan.",
            },
          },
          {
            "@type": "Question",
            "name": "Apakah game ini gratis?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Ya, WikiRace Indonesia 100% gratis dimainkan selamanya tanpa biaya atau iklan yang mengganggu.",
            },
          },
          {
            "@type": "Question",
            "name": "Apakah ada mode multiplayer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Tentu saja! Anda bisa bermain di mode 'Cari Lawan' (Ranked Matchmaking) berbasis ELO atau membuat room custom ('Mabar') untuk bermain bersama teman secara real-time.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

