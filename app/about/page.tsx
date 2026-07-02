"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  House,
  UsersThree,
  Rocket,
  GameController,
  EnvelopeSimple,
  Info,
} from "@phosphor-icons/react";
import LanguageToggle from "@/components/LanguageToggle";
import { useUiLanguage } from "@/hooks/useUiLanguage";

export default function AboutPage() {
  const { isEn, mounted } = useUiLanguage();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: isEn ? "About WikiRace Indonesia" : "Tentang WikiRace Indonesia",
    description: isEn
      ? "Get to know WikiRace Indonesia — the first Indonesian-language Wikipedia racing platform."
      : "Kenali WikiRace Indonesia — platform balapan Wikipedia online pertama berbahasa Indonesia.",
    url: `${siteUrl}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "WikiRace Indonesia",
      url: siteUrl,
      description: isEn
        ? "Indonesian-language online Wikipedia racing platform — competitive, educational, and free."
        : "Platform balapan Wikipedia online berbahasa Indonesia — kompetitif, edukatif, dan gratis.",
      foundingDate: "2024",
      sameAs: [
        "https://github.com/farizziezhi/wikirace-indonesia",
      ],
    },
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[750px]">
        {/* Back Button and Language Toggle */}
        <header className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full self-start shadow-[2px_2px_0px_#000] z-10 w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            <House size={14} />
            <span>{mounted && isEn ? "Back to Home" : "Kembali ke Beranda"}</span>
          </Link>

          <LanguageToggle />
        </header>

        {/* Content Card */}
        <section
          className="relative overflow-hidden bg-charcoal-deep text-warm-cream p-6 sm:p-10 flex flex-col gap-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
          style={{
            borderRadius: "var(--radius-input)",
            paddingTop: "40px",
          }}
        >
          {/* JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
          />

          {/* Header */}
          <div className="border-b border-warm-cream/15 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-lime-accent text-charcoal-text rounded-2xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] w-fit shrink-0">
              <Info size={32} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-lime-accent uppercase mb-1"
                style={{ fontSize: "clamp(24px, 4.5vw, 32px)", lineHeight: 1.1 }}
              >
                {mounted && isEn ? "About Us" : "Tentang Kami"}
              </h1>
              <p className="text-xs text-warm-cream/60 font-mono uppercase tracking-wider">
                About Us
              </p>
            </div>
          </div>

          {/* Intro Section */}
          <div className="text-sm sm:text-base leading-relaxed text-warm-cream/90 flex flex-col gap-4">
            {mounted && isEn ? (
              <>
                <p>
                  <strong className="text-lime-accent">WikiRace Indonesia</strong>{" "}
                  was born from a simple idea: exploring Wikipedia doesn't have to be boring. We want to bring the excitement of "wiki racing" — competing to jump from one article to another just by clicking links — to Indonesian speakers.
                </p>
                <p>
                  As an independent platform, our goal is to build an educational and entertaining space where players can test their general knowledge while learning new and unexpected things from the largest online encyclopedia in the world.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong className="text-lime-accent">WikiRace Indonesia</strong>{" "}
                  lahir dari ide sederhana: menjelajahi Wikipedia tidak harus membosankan. Kami ingin membawa keseruan "wiki racing" — adu cepat berpindah dari satu artikel ke artikel lain hanya dengan mengklik tautan — ke dalam ekosistem bahasa Indonesia.
                </p>
                <p>
                  Sebagai platform independen, tujuan kami adalah membangun ruang edukasi sekaligus hiburan, di mana pemain dapat menguji pengetahuan umum mereka sembari belajar hal-hal baru yang tak terduga dari ensiklopedia daring terbesar di dunia.
                </p>
              </>
            )}
          </div>

          {/* Mission */}
          <div className="text-sm sm:text-base leading-relaxed text-warm-cream/90 flex flex-col gap-4">
            <h2 className="font-black text-lg text-lime-accent uppercase mb-1">
              {mounted && isEn ? "Our Mission" : "Misi Kami"}
            </h2>
            {mounted && isEn ? (
              <p>
                We believe learning can happen organically through curiosity. WikiRace Indonesia acts as a bridge for players to discover Wikipedia's hidden gems — articles they might never have searched for manually. It's a game of speed, but the knowledge stays long after the race is over.
              </p>
            ) : (
              <p>
                Kami percaya bahwa belajar bisa terjadi secara organik melalui rasa penasaran. WikiRace Indonesia hadir sebagai jembatan agar pemain dapat menemukan <i>hidden gem</i> di Wikipedia — artikel-artikel yang mungkin tidak akan pernah mereka cari secara manual. Ini adalah permainan kecepatan, namun pengetahuan yang didapat akan bertahan jauh setelah balapan selesai.
              </p>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-warm-cream/15 py-8">
            <div
              className="bg-playdate-yellow/15 border border-playdate-yellow/30 p-4"
              style={{ borderRadius: "var(--radius-subtle)" }}
            >
              <Rocket
                size={24}
                weight="fill"
                className="text-playdate-yellow mb-2"
              />
              <h3 className="font-black text-playdate-yellow uppercase mb-1">
                {mounted && isEn ? "Play Together" : "Main Bareng (Mabar)"}
              </h3>
              <p className="text-xs text-warm-cream/80 leading-relaxed">
                {mounted && isEn ? "Create custom rooms and race against your friends in real-time." : "Buat ruangan khusus dan balapan dengan teman-temanmu secara real-time."}
              </p>
            </div>
            <div
              className="bg-sky-400/15 border border-sky-400/30 p-4"
              style={{ borderRadius: "var(--radius-subtle)" }}
            >
              <UsersThree
                size={24}
                weight="fill"
                className="text-sky-400 mb-2"
              />
              <h3 className="font-black text-sky-400 uppercase mb-1">
                {mounted && isEn ? "Solo Challenge" : "Tantangan Harian"}
              </h3>
              <p className="text-xs text-warm-cream/80 leading-relaxed">
                {mounted && isEn ? "Test yourself with daily challenges and climb the global leaderboard." : "Uji kemampuanmu setiap hari dengan target artikel yang terus berganti."}
              </p>
            </div>
          </div>

          {/* Contact CTA */}
          <div
            className="bg-charcoal-text text-warm-cream p-5 border-3 border-charcoal-text shadow-[5px_5px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderRadius: "var(--radius-input)" }}
          >
            <div className="flex items-center gap-3">
              <EnvelopeSimple
                size={28}
                weight="fill"
                className="text-burnt-orange shrink-0"
              />
              <p className="text-sm font-bold">
                {mounted && isEn ? "Have suggestions or found a bug?" : "Punya saran atau menemukan bug?"}
              </p>
            </div>
            <Link
              href={`/contact`}
              className="chunky-press bg-burnt-orange text-warm-cream hover:bg-[#d95d1a] py-2.5 px-5 text-xs font-extrabold border-2 border-charcoal-text whitespace-nowrap"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {mounted && isEn ? "Contact Us →" : "Hubungi Kami →"}
            </Link>
          </div>

          {/* Bottom CTA */}
          <div className="border-t border-warm-cream/15 pt-5 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="chunky-press btn-primary py-3 px-5 text-sm font-extrabold text-center border-2 border-charcoal-text flex-1"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              🎮 {mounted && isEn ? "Play Now" : "Main Sekarang"}
            </Link>
            <Link
              href={`/blog${mounted && isEn ? "?lang=en" : ""}`}
              className="chunky-press btn-white py-3 px-5 text-sm font-extrabold text-center border-2 border-charcoal-text flex-1"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              📖 {mounted && isEn ? "Read Blog" : "Baca Blog"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
