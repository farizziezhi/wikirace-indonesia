"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  House, 
  IdentificationCard, 
  Gear, 
  ShareNetwork, 
  Cookie, 
  UserMinus, 
  Megaphone, 
  EnvelopeSimple 
} from "@phosphor-icons/react";
import LanguageToggle from "@/components/LanguageToggle";
import { useUiLanguage } from "@/hooks/useUiLanguage";

export default function PrivacyPage() {
  const { isEn, mounted } = useUiLanguage();
  const lastUpdatedId = "11 Juni 2026";
  const lastUpdatedEn = "June 11, 2026";

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[750px]">
        {/* Back Button and Language Toggle */}
        <header className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full shadow-[2px_2px_0px_#000] z-10 w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
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
            paddingTop: "40px"
          }}
        >
          <div className="border-b border-warm-cream/15 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-lime-accent text-charcoal-text rounded-2xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] w-fit shrink-0">
              <ShieldCheck size={32} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-lime-accent uppercase mb-1"
                style={{ fontSize: "clamp(24px, 4.5vw, 32px)", lineHeight: 1.1 }}
              >
                {mounted && isEn ? "Privacy Policy" : "Kebijakan Privasi"}
              </h1>
              <p className="text-xs text-warm-cream/60 font-mono uppercase tracking-wider">
                {mounted && isEn 
                  ? `Last updated: ${lastUpdatedEn}` 
                  : `Terakhir diperbarui: ${lastUpdatedId}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 text-sm sm:text-base leading-relaxed text-warm-cream/90">
            <div>
              {mounted && isEn ? (
                <p>
                  Welcome to <strong>WikiRace Indonesia</strong>. We are committed to protecting your personal data privacy while you play our game. This Privacy Policy explains what data we collect, how we use it, and how we protect it.
                </p>
              ) : (
                <p>
                  Selamat datang di <strong>WikiRace Indonesia</strong>. Kami berkomitmen untuk melindungi privasi data pribadi Anda saat menggunakan permainan kami. Kebijakan Privasi ini menjelaskan jenis data apa saja yang kami kumpulkan, bagaimana kami menggunakannya, dan bagaimana kami melindunginya.
                </p>
              )}
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 1 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <IdentificationCard size={22} weight="duotone" />
              </div>
              <div className="w-full">
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  {mounted && isEn ? "1. Information We Collect" : "1. Informasi yang Kami Kumpulkan"}
                </h2>
                <p className="mb-3">
                  {mounted && isEn 
                    ? "We only collect the minimum information strictly necessary for the game's functionality:" 
                    : "Kami hanya mengumpulkan informasi minimal yang mutlak diperlukan untuk fungsionalitas game:"}
                </p>
                <ul className="list-disc list-inside pl-2 flex flex-col gap-3">
                  {mounted && isEn ? (
                    <>
                      <li>
                        <strong>Google OAuth Authentication</strong>: Your Google email address, display name, and profile picture. We use email solely as a unique account identifier.
                      </li>
                      <li>
                        <strong>Game Statistics</strong>: ELO rating, wins, losses, article path history, and race completion times.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <strong>Autentikasi Google OAuth</strong>: Alamat email Google, nama tampilan, dan foto profil Anda. Kami menggunakan email hanya sebagai pengidentifikasi unik akun Anda.
                      </li>
                      <li>
                        <strong>Statistik Permainan</strong>: Rating ELO, jumlah kemenangan, jumlah kekalahan, riwayat rute artikel yang Anda lalui, dan waktu penyelesaian balapan Anda.
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 2 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <Gear size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  {mounted && isEn ? "2. How We Use Your Information" : "2. Penggunaan Informasi Anda"}
                </h2>
                <p className="mb-3">
                  {mounted && isEn 
                    ? "The information we collect is used solely to:" 
                    : "Informasi yang kami kumpulkan digunakan semata-mata untuk:"}
                </p>
                <ul className="list-disc list-inside pl-2 flex flex-col gap-2">
                  {mounted && isEn ? (
                    <>
                      <li>Securely manage your account and login sessions.</li>
                      <li>Save ELO ratings and build the global leaderboard.</li>
                      <li>Match balanced opponents in Ranked Matchmaking.</li>
                      <li>Detect and prevent cheating or system abuse.</li>
                    </>
                  ) : (
                    <>
                      <li>Mengelola akun dan sesi login Anda secara aman.</li>
                      <li>Menyimpan rating ELO serta menyusun papan peringkat (Leaderboard) global.</li>
                      <li>Mencocokkan lawan yang seimbang di mode Ranked Matchmaking.</li>
                      <li>Mendeteksi dan mencegah kecurangan atau perilaku penyalahgunaan sistem.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 3 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <ShareNetwork size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  {mounted && isEn ? "3. Third-Party Data Sharing" : "3. Berbagi Data dengan Pihak Ketiga"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    We will <strong>NEVER</strong> sell, rent, share, or trade your personal information with any third parties or companies for commercial or advertising purposes. All data is processed purely internally.
                  </p>
                ) : (
                  <p>
                    Kami <strong>TIDAK AKAN PERNAH</strong> menjual, menyewakan, membagikan, atau memperdagangkan informasi pribadi Anda kepada perusahaan atau pihak ketiga mana pun untuk tujuan komersial atau periklanan. Seluruh data murni diolah secara internal.
                  </p>
                )}
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 4 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <Cookie size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  {mounted && isEn ? "4. Session Cookies Usage" : "4. Penggunaan Cookie Sesi"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    We use a technical session cookie named <code>wikirace_session</code>. This cookie is configured with the highest security attributes (<strong>HttpOnly, Secure, and SameSite=Lax</strong>), meaning your session data is protected from malicious script access and Cross-Site Request Forgery (CSRF) attacks.
                  </p>
                ) : (
                  <p>
                    Kami menggunakan cookie sesi teknis bernama <code>wikirace_session</code>. Cookie ini dikonfigurasi dengan adatribusi keamanan tertinggi (<strong>HttpOnly, Secure, dan SameSite=Lax</strong>) yang berarti data sesi Anda terlindung dari akses skrip jahat dan serangan pemalsuan request (CSRF).
                  </p>
                )}
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 5 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <UserMinus size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  {mounted && isEn ? "5. Account Deletion" : "5. Penghapusan Data Akun"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    You have the right to request the deletion of your account and all associated ELO history at any time. Please contact us using the official contact information below.
                  </p>
                ) : (
                  <p>
                    Anda berhak meminta penghapusan akun beserta seluruh data riwayat ELO Anda kapan saja. Silakan hubungi kami melalui kontak resmi yang tertera di bawah.
                  </p>
                )}
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 6 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <Megaphone size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  {mounted && isEn ? "6. Google AdSense & Advertising Cookies" : "6. Google AdSense & Cookie Periklanan"}
                </h2>
                {mounted && isEn ? (
                  <p>
                    We display advertisements provided by Google AdSense. Google uses cookies (such as the DoubleClick cookie) to serve ads to users based on their visits to our site and other sites on the internet. You may opt out of personalized advertising by visiting the <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-lime-accent hover:text-burnt-orange transition">Google Ad Settings</a> page.
                  </p>
                ) : (
                  <p>
                    Kami menampilkan iklan yang disediakan oleh Google AdSense. Google menggunakan cookie (seperti cookie DoubleClick) untuk menayangkan iklan kepada pengguna berdasarkan kunjungan mereka ke situs kami dan situs lainnya di internet. Anda dapat memilih untuk membatalkan penayangan iklan yang dipersonalisasi dengan mengunjungi halaman <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-lime-accent hover:text-burnt-orange transition">Setelan Iklan Google</a>.
                  </p>
                )}
              </div>
            </div>

            <hr className="border-warm-cream/15" />

            {/* Section 7 */}
            <div className="flex gap-4">
              <div className="text-lime-accent shrink-0 mt-1">
                <EnvelopeSimple size={22} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-lime-accent mb-2 uppercase font-mono">
                  {mounted && isEn ? "7. Contact Us" : "7. Hubungi Kami"}
                </h2>
                <p className="mb-2">
                  {mounted && isEn 
                    ? "If you have any questions regarding this Privacy Policy, please contact our development team via email at:" 
                    : "Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi tim pengembang kami melalui email di:"}
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
