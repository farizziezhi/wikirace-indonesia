import type { Metadata } from "next";
import Link from "next/link";
import { House, UsersThree, EnvelopeSimple, Globe, Code } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Tim Pengembang & Kreator | WikiRace Indonesia",
  description:
    "Kenali tim pengembang di balik WikiRace Indonesia. Pelajari visi kami untuk membangun platform permainan edukasi Wikipedia game pertama di Indonesia.",
  alternates: {
    canonical: "/tim",
  },
};

export default function TimPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Tim Pengembang WikiRace Indonesia",
    "description": "Informasi tentang kreator dan pengembang platform WikiRace Indonesia.",
    "url": `${siteUrl}/tim`,
    "mainEntity": {
      "@type": "Person",
      "name": "Muhammad Farizzi",
      "jobTitle": "Full Stack Web Developer & Founder",
      "url": "https://www.muhfarizzi.tech",
      "sameAs": [
        "https://github.com/farizziezhi"
      ]
    }
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[750px]">
        {/* Schema markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
        />

        {/* Back Button */}
        <header className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full shadow-[2px_2px_0px_#000] z-10 w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
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
          {/* Header */}
          <div className="border-b border-warm-cream/15 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-lime-accent text-charcoal-text rounded-2xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] w-fit shrink-0">
              <UsersThree size={32} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-lime-accent uppercase mb-1"
                style={{ fontSize: "clamp(24px, 4.5vw, 32px)", lineHeight: 1.1 }}
              >
                Kreator & Pengembang
              </h1>
              <p className="text-xs text-warm-cream/60 font-mono uppercase tracking-wider">
                Meet the Team / Creator
              </p>
            </div>
          </div>

          {/* Bio Section */}
          <div className="text-sm sm:text-base leading-relaxed text-warm-cream/90 flex flex-col gap-6">
            <div>
              <h2 className="font-extrabold text-lime-accent text-lg mb-2">Tentang Kreator</h2>
              <p className="mb-3">
                Platform <strong>WikiRace Indonesia</strong> didirikan dan dikembangkan secara mandiri oleh <strong>Muhammad Farizzi</strong>, seorang Full Stack Web Developer dan penggemar teknologi asal Indonesia.
              </p>
              <p>
                Proyek ini berawal dari kegemaran pribadi memainkan Wikipedia Game versi global dan keinginan untuk menghadirkan pengalaman serupa yang lebih teroptimasi bagi pengguna berbahasa Indonesia. Semua logika server, integrasi database, websocket multiplayer, serta desain antarmuka dikembangkan dari nol untuk memastikan performa yang cepat dan responsif.
              </p>
            </div>

            <div className="h-px bg-warm-cream/15 w-full" />

            <div>
              <h2 className="font-extrabold text-lime-accent text-lg mb-2">Misi Pengembagan</h2>
              <p className="mb-3">
                Misi kami sederhana: <strong>menjadikan belajar menyenangkan</strong>. Wikipedia adalah tambang emas informasi terbesar di dunia, dan melalui format permainan kompetitif seperti WikiRace, kami ingin:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-sm text-warm-cream/80">
                <li>Meningkatkan minat baca dan keterampilan literasi digital di Indonesia.</li>
                <li>Melatih kemampuan kognitif seperti berpikir asosiatif dan penyaringan informasi (skimming).</li>
                <li>Menghadirkan alternatif game browser edukasi berkualitas tinggi yang gratis dan bebas dari iklan yang mengganggu.</li>
              </ul>
            </div>

            <div className="h-px bg-warm-cream/15 w-full" />

            {/* Social Links */}
            <div>
              <h2 className="font-extrabold text-lime-accent text-lg mb-3">Tautan & Kontak</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm font-mono mt-1">
                <a
                  href="https://www.muhfarizzi.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-warm-cream/80 hover:text-lime-accent transition"
                >
                  <Globe size={18} className="text-lime-accent" />
                  <span>Website: muhfarizzi.tech</span>
                </a>
                <a
                  href="https://github.com/farizziezhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-warm-cream/80 hover:text-lime-accent transition"
                >
                  <Code size={18} className="text-lime-accent" />
                  <span>GitHub: @farizziezhi</span>
                </a>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-warm-cream/80 hover:text-lime-accent transition"
                >
                  <EnvelopeSimple size={18} className="text-lime-accent" />
                  <span>Form Hubungi Kami</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-charcoal-text/50 font-bold">
          WikiRace Indonesia © 2026
        </div>
      </div>
    </main>
  );
}
