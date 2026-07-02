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
  alternates: {
    canonical: "/",
  },
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
        "@type": "WebSite",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id"}/#website`,
        "url": process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id",
        "name": "WikiRace Indonesia",
        "alternateName": ["WikiRace ID", "Wiki Race Indonesia"],
        "inLanguage": ["id", "en"],
      },
      {
        "@type": "Organization",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id"}/#organization`,
        "name": "WikiRace Indonesia",
        "url": process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id",
        "description": "Platform balapan Wikipedia online berbahasa Indonesia — kompetitif, edukatif, dan gratis.",
        "foundingDate": "2024",
        "sameAs": [
          "https://github.com/farizziezhi/wikirace-indonesia"
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id"}/#webapp`,
        "name": "WikiRace Indonesia",
        "url": process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id",
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
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id"}/#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Apakah WikiRace Indonesia gratis dimainkan?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Ya, game WikiRace Indonesia sepenuhnya 100% gratis dimainkan selamanya, bebas dari iklan spanduk yang mengganggu, serta tidak menjual data pribadi Anda.",
            },
          },
          {
            "@type": "Question",
            "name": "Is the Wikipedia Game free to play?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes, WikiRace Indonesia is 100% free with no intrusive ads, paying limits, or hidden fees.",
            },
          },
          {
            "@type": "Question",
            "name": "Apakah mendukung rute Wikipedia Bahasa Inggris?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Tentu saja! Anda cukup mengganti pilihan Bahasa Wikipedia ke bendera 🇺🇸 (English) di form bermain untuk bertanding menggunakan database Wikipedia versi global.",
            },
          },
          {
            "@type": "Question",
            "name": "Does it support English Wikipedia routes?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes! You can toggle the Wikipedia Language to the US flag 🇺🇸 (English) on the main lobby form to play with the global English Wikipedia database.",
            },
          },
          {
            "@type": "Question",
            "name": "Bagaimana sistem penentuan peringkat ELO dihitung?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Setiap kali Anda menang di mode Ranked multiplayer, rating ELO Anda akan meningkat. Sebaliknya jika kalah, ELO Anda akan berkurang. Peringkat di Papan Skor diurutkan berdasarkan ELO tertinggi secara global.",
            },
          },
          {
            "@type": "Question",
            "name": "How does the ELO rating system work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Winning in Ranked matchmaking mode grants you ELO rating points, while losing decreases them. The global leaderboard displays players based on their ELO ratings.",
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


