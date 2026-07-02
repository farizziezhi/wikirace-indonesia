"use client";

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

export default function DisclaimerPage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";
  const lastUpdated = "2 Juli 2026";

  const disclaimerSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Disclaimer — WikiRace Indonesia",
    description:
      "Disclaimer resmi WikiRace Indonesia tentang status independen, penggunaan konten Wikipedia, dan keterbatasan layanan.",
    url: `${siteUrl}/disclaimer`,
    lastReviewed: "2026-07-02",
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[750px]">
        {/* Back Button */}
        <header className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full self-start shadow-[2px_2px_0px_#000] z-10 w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            <House size={14} />
            <span>Kembali ke Beranda</span>
          </Link>
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
                Terakhir diperbarui: {lastUpdated}
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
                  Bukan Afiliasi Resmi dengan Wikimedia Foundation
                </h2>
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
                  Sifat Permainan
                </h2>
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
                  Akurasi Konten
                </h2>
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
                  Ketersediaan Layanan
                </h2>
                <p>
                  Kami berusaha menjaga platform ini tetap dapat diakses dan
                  berjalan lancar, namun tidak dapat menjamin ketersediaan layanan
                  100% sepanjang waktu. Gangguan teknis, pemeliharaan, atau
                  perubahan pada API Wikipedia dapat memengaruhi fungsi platform.
                </p>
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
                  Pertanyaan
                </h2>
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
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
