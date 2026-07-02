"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  House,
  Warning,
  Scales,
  Globe,
  ShieldWarning,
  WifiHigh,
  Question,
} from "@phosphor-icons/react";
import LanguageToggle from "@/components/LanguageToggle";
import { useUiLanguage } from "@/hooks/useUiLanguage";

function DisclaimerContent() {
  const { isEn, mounted } = useUiLanguage();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";
  const lastUpdated = "2 Juli 2026";

  const disclaimerSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Disclaimer — WikiRace Indonesia",
    description: isEn
      ? "Official disclaimer of WikiRace Indonesia regarding its independent status, use of Wikipedia content, and service limitations."
      : "Disclaimer resmi WikiRace Indonesia tentang status independen, penggunaan konten Wikipedia, dan keterbatasan layanan.",
    url: `${siteUrl}/disclaimer`,
    lastReviewed: "2026-07-02",
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[750px]">
        {/* Back Button */}
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
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(disclaimerSchema),
            }}
          />

          {/* Header */}
          <div className="border-b border-warm-cream/15 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-playdate-yellow text-charcoal-text rounded-2xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] w-fit shrink-0">
              <Warning size={32} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-playdate-yellow uppercase mb-1"
                style={{
                  fontSize: "clamp(24px, 4.5vw, 32px)",
                  lineHeight: 1.1,
                }}
              >
                Disclaimer
              </h1>
              <p className="text-xs text-warm-cream/60 font-mono uppercase tracking-wider">
                {mounted && isEn ? "Last updated:" : "Terakhir diperbarui:"} {mounted && isEn ? "July 2, 2026" : lastUpdated}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-6 text-sm sm:text-base leading-relaxed text-warm-cream/90">
            {/* Bukan Afiliasi */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-burnt-orange/20 rounded-lg border border-burnt-orange/30 shrink-0 mt-0.5">
                <Globe
                  size={20}
                  weight="fill"
                  className="text-burnt-orange"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-burnt-orange uppercase mb-2">
                  {mounted && isEn ? "Not Officially Affiliated with Wikimedia Foundation" : "Bukan Afiliasi Resmi dengan Wikimedia Foundation"}
                </h2>
                {mounted && isEn ? (
                  <>
                    <p>
                      WikiRace Indonesia is an independent gaming platform created by fans and is{" "}
                      <strong>
                        not affiliated, sponsored, or officially endorsed
                      </strong>{" "}
                      by the Wikimedia Foundation, Wikipedia, or any other related entities. &ldquo;Wikipedia&rdquo; is a registered trademark of the Wikimedia Foundation.
                    </p>
                    <p className="mt-2">
                      WikiRace Indonesia uses Wikipedia article content via the public API provided by Wikimedia, in accordance with the{" "}
                      <strong>
                        Creative Commons Attribution-ShareAlike (CC BY-SA)
                      </strong>{" "}
                      license that applies to Wikipedia content.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      WikiRace Indonesia adalah platform permainan independen yang
                      dibuat oleh penggemar dan{" "}
                      <strong>
                        tidak berafiliasi, disponsori, atau didukung secara resmi
                      </strong>{" "}
                      oleh Wikimedia Foundation, Wikipedia, atau entitas terkait
                      lainnya. &ldquo;Wikipedia&rdquo; adalah merek dagang terdaftar
                      milik Wikimedia Foundation.
                    </p>
                    <p className="mt-2">
                      WikiRace Indonesia menggunakan konten artikel Wikipedia melalui
                      API publik yang disediakan oleh Wikimedia, sesuai dengan
                      lisensi{" "}
                      <strong>
                        Creative Commons Attribution-ShareAlike (CC BY-SA)
                      </strong>{" "}
                      yang berlaku untuk konten Wikipedia.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Sifat Permainan */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-lime-accent/20 rounded-lg border border-lime-accent/30 shrink-0 mt-0.5">
                <Scales
                  size={20}
                  weight="fill"
                  className="text-lime-accent"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-lime-accent uppercase mb-2">
                  {mounted && isEn ? "Nature of the Game" : "Sifat Permainan"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    WikiRace Indonesia is an entertainment and educational platform
                    designed to test players' navigation speed and general knowledge
                    through the links available in Wikipedia articles.
                    This platform is{" "}
                    <strong>
                      not intended as an academic or authoritative reference source
                    </strong>{" "}
                    — for research or reference needs, please visit{" "}
                    <a
                      href="https://en.wikipedia.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lime-accent underline underline-offset-2 hover:text-playdate-yellow transition"
                    >
                      Wikipedia.org
                    </a>{" "}
                    directly.
                  </p>
                ) : (
                  <p>
                    WikiRace Indonesia adalah platform hiburan dan edukasi yang
                    dirancang untuk menguji kecepatan navigasi dan pengetahuan umum
                    pemain melalui tautan-tautan yang tersedia di artikel Wikipedia.
                    Platform ini{" "}
                    <strong>
                      tidak dimaksudkan sebagai sumber referensi akademis atau
                      otoritatif
                    </strong>{" "}
                    — untuk kebutuhan riset atau referensi, silakan mengunjungi{" "}
                    <a
                      href="https://id.wikipedia.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lime-accent underline underline-offset-2 hover:text-playdate-yellow transition"
                    >
                      Wikipedia.org
                    </a>{" "}
                    secara langsung.
                  </p>
                )}
              </div>
            </div>

            {/* Akurasi Konten */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-playdate-yellow/20 rounded-lg border border-playdate-yellow/30 shrink-0 mt-0.5">
                <ShieldWarning
                  size={20}
                  weight="fill"
                  className="text-playdate-yellow"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-playdate-yellow uppercase mb-2">
                  {mounted && isEn ? "Content Accuracy" : "Akurasi Konten"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    Because the article content displayed comes directly from
                    Wikipedia, WikiRace Indonesia{" "}
                    <strong>
                      is not responsible for the accuracy, completeness, or
                      updates
                    </strong>{" "}
                    of the content. Wikipedia is an open-edit encyclopedia, so the information inside it can change at any time.
                  </p>
                ) : (
                  <p>
                    Karena konten artikel yang ditampilkan berasal langsung dari
                    Wikipedia, WikiRace Indonesia{" "}
                    <strong>
                      tidak bertanggung jawab atas akurasi, kelengkapan, atau
                      pembaruan
                    </strong>{" "}
                    konten tersebut. Wikipedia adalah ensiklopedia yang dapat
                    disunting secara terbuka, sehingga informasi di dalamnya dapat
                    berubah sewaktu-waktu.
                  </p>
                )}
              </div>
            </div>

            {/* Ketersediaan Layanan */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warm-cream/10 rounded-lg border border-warm-cream/20 shrink-0 mt-0.5">
                <WifiHigh
                  size={20}
                  weight="fill"
                  className="text-warm-cream/70"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-warm-cream uppercase mb-2">
                  {mounted && isEn ? "Service Availability" : "Ketersediaan Layanan"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    We strive to keep this platform accessible and running smoothly,
                    but we cannot guarantee 100% service availability at all times.
                    Technical issues, maintenance, or changes to the Wikipedia API
                    may affect the platform's functionality.
                  </p>
                ) : (
                  <p>
                    Kami berusaha menjaga platform ini tetap dapat diakses dan
                    berjalan lancar, namun tidak dapat menjamin ketersediaan layanan
                    100% sepanjang waktu. Gangguan teknis, pemeliharaan, atau
                    perubahan pada API Wikipedia dapat memengaruhi fungsi platform.
                  </p>
                )}
              </div>
            </div>

            {/* Pertanyaan */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-lime-accent/20 rounded-lg border border-lime-accent/30 shrink-0 mt-0.5">
                <Question
                  size={20}
                  weight="fill"
                  className="text-lime-accent"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-lime-accent uppercase mb-2">
                  {mounted && isEn ? "Questions" : "Pertanyaan"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    If you have any questions regarding this disclaimer, please contact
                    us via the{" "}
                    <Link
                      href="/contact"
                      className="text-lime-accent underline underline-offset-2 hover:text-playdate-yellow transition font-bold"
                    >
                      contact page
                    </Link>
                    .
                  </p>
                ) : (
                  <p>
                    Jika ada pertanyaan mengenai disclaimer ini, silakan hubungi
                    kami melalui{" "}
                    <Link
                      href="/contact"
                      className="text-lime-accent underline underline-offset-2 hover:text-playdate-yellow transition font-bold"
                    >
                      halaman kontak
                    </Link>
                    .
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DisclaimerPage() {
  return (
    <Suspense>
      <DisclaimerContent />
    </Suspense>
  );
}
