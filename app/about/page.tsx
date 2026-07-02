"use client";

import Link from "next/link";
import {
  House,
  UsersThree,
  Rocket,
  GameController,
  EnvelopeSimple,
  Info,
} from "@phosphor-icons/react/dist/ssr";

export default function AboutPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Tentang WikiRace Indonesia",
    description:
      "Kenali WikiRace Indonesia — platform balapan Wikipedia online pertama berbahasa Indonesia.",
    url: `${siteUrl}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "WikiRace Indonesia",
      url: siteUrl,
      description:
        "Platform balapan Wikipedia online berbahasa Indonesia — kompetitif, edukatif, dan gratis.",
      foundingDate: "2024",
      sameAs: [
        "https://github.com/farizziezhi/wikirace-indonesia",
      ],
    },
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
                Tentang WikiRace Indonesia
              </h1>
              <p className="text-xs text-warm-cream/60 font-mono uppercase tracking-wider">
                About Us
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-6 text-sm sm:text-base leading-relaxed text-warm-cream/90">
            <p>
              WikiRace Indonesia lahir dari sebuah pertanyaan sederhana:{" "}
              <strong className="text-lime-accent">
                seberapa cepat kamu bisa berpindah dari satu artikel Wikipedia ke
                artikel lain, hanya dengan mengikuti tautan yang ada di dalamnya?
              </strong>
            </p>

            <p>
              Permainan &ldquo;WikiRacing&rdquo; sendiri sudah lama menjadi hiburan
              tersembunyi di kalangan mahasiswa dan pecinta trivia di berbagai belahan
              dunia — sebuah cara iseng untuk menguji kecepatan berpikir, intuisi
              navigasi, dan pengetahuan umum sambil bersenang-senang. Namun, versi yang
              benar-benar dibangun untuk komunitas Indonesia, dengan antarmuka berbahasa
              Indonesia dan fokus pada pengalaman kompetitif yang rapi, masih sangat
              jarang ditemukan.
            </p>

            <p>Dari situlah WikiRace Indonesia dibangun.</p>

            {/* Misi */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-playdate-yellow/20 rounded-lg border border-playdate-yellow/30 shrink-0 mt-0.5">
                <Rocket size={20} weight="fill" className="text-playdate-yellow" />
              </div>
              <div>
                <h2 className="font-black text-lg text-playdate-yellow uppercase mb-2">
                  Misi Kami
                </h2>
                <p className="mb-3">
                  Kami ingin menghadirkan platform balapan Wikipedia yang:
                </p>
                <ul className="list-none flex flex-col gap-2">
                  <li className="flex items-start gap-2">
                    <span className="text-lime-accent font-black mt-0.5">▸</span>
                    <span>
                      <strong>Kompetitif namun santai</strong> — cocok dimainkan sendiri
                      untuk mengasah kecepatan berpikir, atau bersama teman dalam mode
                      multiplayer untuk seru-seruan.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lime-accent font-black mt-0.5">▸</span>
                    <span>
                      <strong>Ringan dan cepat diakses</strong> — tanpa instalasi rumit,
                      langsung main dari browser.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lime-accent font-black mt-0.5">▸</span>
                    <span>
                      <strong>Dibangun oleh dan untuk komunitas</strong> — masukan dari
                      pemain adalah bahan bakar utama pengembangan fitur kami ke depan.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tim */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-lime-accent/20 rounded-lg border border-lime-accent/30 shrink-0 mt-0.5">
                <UsersThree size={20} weight="fill" className="text-lime-accent" />
              </div>
              <div>
                <h2 className="font-black text-lg text-lime-accent uppercase mb-2">
                  Siapa di Balik WikiRace Indonesia
                </h2>
                <p>
                  WikiRace Indonesia dikembangkan secara independen, tumbuh dari
                  keterlibatan aktif di dunia pemrograman dan komunitas teknologi,
                  salah satunya melalui Komunitas Pemrograman Tadulako. Proyek ini
                  dibangun dengan semangat belajar sambil berkarya — mengombinasikan
                  minat pada game kompetitif, pengembangan web, dan keinginan
                  menciptakan sesuatu yang benar-benar bisa dinikmati komunitas
                  Indonesia.
                </p>
                <p className="mt-2">
                  Platform ini terus dikembangkan secara bertahap, dengan penambahan
                  fitur baru berdasarkan masukan langsung dari para pemain.
                </p>
              </div>
            </div>

            {/* Cara Kerja */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-burnt-orange/20 rounded-lg border border-burnt-orange/30 shrink-0 mt-0.5">
                <GameController
                  size={20}
                  weight="fill"
                  className="text-burnt-orange"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-burnt-orange uppercase mb-2">
                  Bagaimana Cara Kerjanya
                </h2>
                <p>
                  Secara singkat, WikiRace Indonesia memberikan dua artikel Wikipedia —
                  satu sebagai titik awal, satu sebagai tujuan. Tugas pemain adalah
                  mencapai artikel tujuan hanya dengan mengklik tautan-tautan yang
                  tersedia di dalam artikel, secepat dan seefisien mungkin. Semakin
                  sedikit langkah dan semakin cepat waktu yang dibutuhkan, semakin
                  tinggi skor yang didapat.
                </p>
                <p className="mt-3">
                  Kamu bisa membaca panduan lengkap cara bermain di{" "}
                  <Link
                    href="/guide"
                    className="text-lime-accent underline underline-offset-2 hover:text-playdate-yellow transition font-bold"
                  >
                    halaman panduan kami
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Hubungi Kami */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warm-cream/10 rounded-lg border border-warm-cream/20 shrink-0 mt-0.5">
                <EnvelopeSimple
                  size={20}
                  weight="fill"
                  className="text-warm-cream/70"
                />
              </div>
              <div>
                <h2 className="font-black text-lg text-warm-cream uppercase mb-2">
                  Hubungi Kami
                </h2>
                <p>
                  Punya masukan, laporan bug, atau ide fitur? Kami selalu terbuka untuk
                  mendengar dari komunitas. Kunjungi{" "}
                  <Link
                    href="/contact"
                    className="text-lime-accent underline underline-offset-2 hover:text-playdate-yellow transition font-bold"
                  >
                    halaman kontak
                  </Link>{" "}
                  untuk terhubung dengan kami.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="border-t border-warm-cream/15 pt-5 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="chunky-press btn-primary py-3 px-5 text-sm font-extrabold text-center border-2 border-charcoal-text flex-1"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              🎮 Main Sekarang
            </Link>
            <Link
              href="/blog"
              className="chunky-press btn-white py-3 px-5 text-sm font-extrabold text-center border-2 border-charcoal-text flex-1"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              📖 Baca Blog
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
