import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan Privasi resmi permainan WikiRace Indonesia.",
};

export default function PrivacyPage() {
  const lastUpdated = "11 Juni 2026";

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[680px]">
        {/* Back Button */}
        <header className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/70 hover:text-charcoal-text font-bold transition text-sm"
          >
            ← Kembali ke Beranda
          </Link>
        </header>

        {/* Content Card */}
        <section
          className="chunky-lg bg-pure-white p-6 sm:p-10 flex flex-col gap-6 text-charcoal-text"
          style={{
            border: "2px solid var(--color-charcoal-text)",
            boxShadow: "var(--shadow-lifted)",
            borderRadius: "var(--radius-input)",
          }}
        >
          <div className="border-b border-warm-gray pb-4">
            <h1
              className="font-black text-charcoal-text mb-1"
              style={{ fontSize: "clamp(28px, 5vw, 38px)", lineHeight: 1.1 }}
            >
              Kebijakan Privasi
            </h1>
            <p className="text-sm text-charcoal-text/60 font-semibold">
              Terakhir diperbarui: {lastUpdated}
            </p>
          </div>

          <div className="flex flex-col gap-6 text-base leading-relaxed text-charcoal-text/90">
            <p>
              Selamat datang di <strong>WikiRace Indonesia</strong>. Kami sangat berkomitmen untuk melindungi privasi data pribadi Anda saat menggunakan permainan kami. Kebijakan Privasi ini menjelaskan jenis data apa saja yang kami kumpulkan, bagaimana kami menggunakannya, dan bagaimana kami melindunginya.
            </p>

            <hr className="border-warm-gray" />

            {/* Section 1 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                1. Informasi yang Kami Kumpulkan
              </h2>
              <p className="mb-2">
                Kami hanya mengumpulkan informasi minimal yang mutlak diperlukan untuk fungsionalitas game:
              </p>
              <ul className="list-disc list-inside pl-2 flex flex-col gap-1">
                <li>
                  <strong>Autentikasi Google OAuth</strong>: Alamat email Google, nama tampilan, dan foto profil Anda. Kami menggunakan email hanya sebagai pengidentifikasi unik akun Anda.
                </li>
                <li>
                  <strong>Statistik Permainan</strong>: Rating ELO, jumlah kemenangan, jumlah kekalahan, riwayat rute artikel yang Anda lalui, dan waktu penyelesaian balapan Anda.
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                2. Bagaimana Kami Menggunakan Informasi Anda
              </h2>
              <p>
                Informasi yang kami kumpulkan digunakan semata-mata untuk:
              </p>
              <ul className="list-disc list-inside pl-2 flex flex-col gap-1 mt-1">
                <li>Mengelola akun dan sesi login Anda secara aman.</li>
                <li>Menyimpan rating ELO serta menyusun papan peringkat (Leaderboard) global.</li>
                <li>Mencocokkan lawan yang seimbang di mode Ranked Matchmaking.</li>
                <li>Mendeteksi dan mencegah kecurangan atau perilaku penyalahgunaan sistem.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                3. Berbagi Data dengan Pihak Ketiga
              </h2>
              <p>
                Kami <strong>TIDAK AKAN PERNAH</strong> menjual, menyewakan, membagikan, atau memperdagangkan informasi pribadi Anda kepada perusahaan atau pihak ketiga mana pun untuk tujuan komersial atau periklanan. Seluruh data murni diolah secara internal.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                4. Penggunaan Cookie Sesi
              </h2>
              <p>
                Kami menggunakan cookie sesi teknis bernama <code>wikirace_session</code>. Cookie ini dikonfigurasi dengan atribut keamanan tertinggi (<strong>HttpOnly, Secure, dan SameSite=Lax</strong>) yang berarti data sesi Anda terlindung dari akses skrip jahat dan serangan pemalsuan request (CSRF).
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                5. Penghapusan Data Akun
              </h2>
              <p>
                Anda berhak meminta penghapusan akun beserta seluruh data riwayat ELO Anda kapan saja. Silakan hubungi kami melalui kontak resmi yang tertera di bawah.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                6. Hubungi Kami
              </h2>
              <p>
                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi tim pengembang kami melalui email di:{" "}
                <a
                  href="mailto:support@wikiraceid.web.id"
                  className="font-bold underline text-charcoal-text hover:text-burnt-orange"
                >
                  support@wikiraceid.web.id
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
