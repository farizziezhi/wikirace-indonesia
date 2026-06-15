import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import OnlineCountWidget from "@/components/OnlineCountWidget";

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
    default: "WikiRace Indonesia - Play Wikipedia Game | Balapan Wikipedia Online",
    template: "%s | WikiRace Indonesia",
  },
  description:
    "WikiRace Indonesia is a free online Wikipedia speedrun game. Race multiplayer or practice solo. / Game balapan edukatif Wikipedia gratis. Main multiplayer atau solo.",
  keywords: [
    "wikirace",
    "wikirace indonesia",
    "wikipedia game",
    "wikipedia speedrun",
    "wikipedia game online",
    "wikipedia game indonesia",
    "balapan wikipedia",
    "main wikirace gratis",
    "wikirace multiplayer",
    "wiki speedrun",
  ],
  openGraph: {
    title: "WikiRace Indonesia - Play Wikipedia Game | Balapan Wikipedia Online",
    description:
      "WikiRace Indonesia is a free online Wikipedia speedrun game. Race multiplayer or practice solo. / Game balapan edukatif Wikipedia gratis. Main multiplayer atau solo.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id",
    siteName: "WikiRace Indonesia",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WikiRace Indonesia - Play Wikipedia Game | Balapan Wikipedia Online",
    description:
      "WikiRace Indonesia is a free online Wikipedia speedrun game. Race multiplayer or practice solo. / Game balapan edukatif Wikipedia gratis. Main multiplayer atau solo.",
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
          "WikiRace Indonesia is a free online multiplayer Wikipedia game (speedrun). Players race to navigate from a start article to a target article using only blue links. / Game balapan edukatif multiplayer untuk menelusuri artikel Wikipedia secepat mungkin.",
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
            "name": "What is WikiRace Indonesia (Wikipedia Game)?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "WikiRace Indonesia (also known as the Wikipedia Game) is a free online speedrun game where you navigate from a starting Wikipedia article to a destination article using only the blue hyperlinks inside the articles.",
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
            "name": "How do you play the Wikipedia Game (WikiRace)?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "You are given a starting article and a target article. Click the blue hyperlinks within the Wikipedia pages to move from article to article until you reach the target. The player who reaches the target first or with the fewest clicks wins.",
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
            "name": "Is WikiRace Indonesia free to play?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes, WikiRace Indonesia is 100% free to play with no intrusive ads or hidden subscription fees.",
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
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <div className="fixed bottom-4 left-4 z-40 hidden md:block">
          <OnlineCountWidget />
        </div>
        <Analytics />
      </body>
    </html>
  );
}


