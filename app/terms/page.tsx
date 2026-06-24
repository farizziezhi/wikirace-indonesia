"use client";

import Link from "next/link";
import { 
  Gavel, 
  House, 
  Devices, 
  Lock, 
  WarningOctagon, 
  Copyright, 
  Warning, 
  EnvelopeSimple 
} from "@phosphor-icons/react";

export default function TermsPage() {
  const lastUpdatedId = "11 Juni 2026";
  const lastUpdatedEn = "June 11, 2026";

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
            <span>Kembali ke Beranda / Back to Home</span>
          </Link>
        </header>

        {/* Content Card */}
        <section
          className="relative overflow-hidden bg-charcoal-deep text-warm-cream p-6 sm:p-10 flex flex-col gap-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
          style={{
            borderRadius: "var(--radius-input)",
            paddingTop: "40px"
          }}
        >
          <div className="border-b border-warm-cream/15 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-lime-accent text-charcoal-text rounded-2xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] w-fit shrink-0">
              <Gavel size={32} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-lime-accent uppercase mb-1"
                style={{ fontSize: "clamp(24px, 4.5vw, 32px)", lineHeight: 1.1 }}
              >
                Syarat & Ketentuan / Terms & Conditions
              </h1>
              <p className="text-xs text-warm-cream/60 font-mono uppercase tracking-wider">
                Terakhir diperbarui / Last updated: {lastUpdatedId} ({lastUpdatedEn})
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 text-sm sm:text-base leading-relaxed text-warm-cream/90">
            <div>
              <p className="mb-2 font-medium">
                Dengan mengakses dan memainkan <strong>WikiRace Indonesia</strong>, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian apa pun dari syarat ini, silakan hentikan penggunaan layanan kami.
              </p>
              <p className="italic text-warm-cream/70">
                By accessing and playing <strong>WikiRace Indonesia</strong>, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please stop using our services.
              </p>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 1 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <Devices size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  1. Penggunaan Layanan / Use of Service
                </h2>
                <p className="mb-2">
                  WikiRace Indonesia adalah platform game edukasi gratis yang ditujukan untuk hiburan dan asah otak. Anda diizinkan menggunakan layanan ini untuk keperluan pribadi non-komersial.
                </p>
                <p className="italic text-warm-cream/70">
                  WikiRace Indonesia is a free educational game platform intended for entertainment and brain exercise. You are permitted to use this service for personal, non-commercial use only.
                </p>
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 2 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <Lock size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  2. Akun & Keamanan / Account & Security
                </h2>
                <p className="mb-2">
                  Saat Anda membuat akun menggunakan Google OAuth atau metode pendaftaran password, Anda bertanggung jawab penuh untuk menjaga kerahasiaan sesi Anda. Kami tidak bertanggung jawab atas kerugian atau aktivitas ilegal yang terjadi akibat kelalaian pengamanan sesi Anda.
                </p>
                <p className="italic text-warm-cream/70">
                  When you create an account using Google OAuth or password registration, you are fully responsible for maintaining the confidentiality of your session. We are not responsible for any loss or illegal activities resulting from your failure to secure your session.
                </p>
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 3 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <WarningOctagon size={22} weight="duotone" />
              </div>
              <div className="w-full">
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  3. Perilaku Pengguna & Fair Play / User Conduct & Fair Play
                </h2>
                <p className="mb-2">
                  Kami berkomitmen menjaga sportivitas dalam permainan Ranked Matchmaking. Anda setuju untuk TIDAK melakukan:
                </p>
                <p className="italic text-warm-cream/70 mb-3">
                  We are committed to maintaining sportsmanship in Ranked Matchmaking. You agree NOT to:
                </p>
                <ul className="list-disc list-inside pl-2 flex flex-col gap-2">
                  <li>
                    <span>Menggunakan program otomatis pihak ketiga atau ekstensi browser untuk berbuat curang.</span>
                    <span className="block italic text-warm-cream/70 pl-4">Use automated third-party tools or browser extensions to gain an unfair advantage.</span>
                  </li>
                  <li>
                    <span>Melakukan eksploitasi celah keamanan (bug) sistem atau memanipulasi API.</span>
                    <span className="block italic text-warm-cream/70 pl-4">Exploit security vulnerabilities (bugs) or manipulate APIs.</span>
                  </li>
                  <li>
                    <span>Mengirimkan spamming emoji atau chat reaksi yang mengganggu kenyamanan pemain lain.</span>
                    <span className="block italic text-warm-cream/70 pl-4">Spam emojis or reaction chats that disturb other players.</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-burnt-orange/10 border-l-3 border-burnt-orange rounded-r-xl">
                  <p className="text-burnt-orange font-bold font-mono uppercase text-xs">
                    ⚠️ Penyalahgunaan poin di atas dapat berakibat pada pemblokiran akun dan penghapusan ELO secara permanen tanpa pemberitahuan.
                  </p>
                  <p className="italic text-burnt-orange font-bold font-mono uppercase text-xs mt-1">
                    ⚠️ Abuse of the above items may result in account suspension and permanent ELO deletion without prior notice.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 4 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <Copyright size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  4. Hak Kekayaan Intelektual / Intellectual Property Rights
                </h2>
                <p className="mb-2">
                  Seluruh konten artikel Wikipedia yang ditampilkan di dalam permainan dimiliki oleh para kontributor Wikipedia dan dilisensikan di bawah lisensi Creative Commons. Logika permainan, visual desain, dan kode sumber WikiRace Indonesia merupakan kekayaan intelektual kami dan dilindungi hukum.
                </p>
                <p className="italic text-warm-cream/70">
                  All Wikipedia article content displayed in the game is owned by Wikipedia contributors and licensed under the Creative Commons license. The game logic, visual design, and source code of WikiRace Indonesia are our intellectual property and protected by law.
                </p>
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 5 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <Warning size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  5. Batasan Tanggung Jawab / Limitation of Liability
                </h2>
                <p className="mb-2">
                  Layanan ini disediakan "apa adanya" (as-is) tanpa jaminan apa pun. Kami tidak menjamin ketersediaan server 100% tanpa gangguan atau bebas dari bug teknis Wikipedia yang berada di luar kendali kami.
                </p>
                <p className="italic text-warm-cream/70">
                  This service is provided "as is" without warranties of any kind. We do not guarantee 100% uninterrupted server availability or freedom from Wikipedia technical bugs that are beyond our control.
                </p>
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 6 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <EnvelopeSimple size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  6. Hubungi Kami / Contact Us
                </h2>
                <p className="mb-1">
                  Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami di:
                </p>
                <p className="italic text-warm-cream/70 mb-2">
                  If you have any questions regarding these terms and conditions, please contact us at:
                </p>
                <a
                  href="mailto:support@wikiraceid.web.id"
                  className="font-bold underline text-lime-accent hover:text-burnt-orange transition"
                >
                  support@wikiraceid.web.id
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
