import Link from "next/link";

export const metadata = {
  title: "Syarat dan Ketentuan",
  description: "Syarat dan Ketentuan resmi penggunaan WikiRace Indonesia.",
};

export default function TermsPage() {
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
              Syarat & Ketentuan
            </h1>
            <p className="text-sm text-charcoal-text/60 font-semibold">
              Terakhir diperbarui: {lastUpdated}
            </p>
          </div>

          <div className="flex flex-col gap-6 text-base leading-relaxed text-charcoal-text/90">
            <p>
              Dengan mengakses dan memainkan <strong>WikiRace Indonesia</strong>, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian apa pun dari syarat ini, silakan hentikan penggunaan layanan kami.
            </p>

            <hr className="border-warm-gray" />

            {/* Section 1 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                1. Penggunaan Layanan
              </h2>
              <p>
                WikiRace Indonesia adalah platform game edukasi gratis yang ditujukan untuk hiburan dan asah otak. Anda diizinkan menggunakan layanan ini untuk keperluan pribadi non-komersial.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                2. Akun & Keamanan
              </h2>
              <p>
                Saat Anda membuat akun menggunakan Google OAuth atau metode pendaftaran password, Anda bertanggung jawab penuh untuk menjaga kerahasiaan sesi Anda. Kami tidak bertanggung jawab atas kerugian atau aktivitas ilegal yang terjadi akibat kelalaian pengamanan sesi Anda.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                3. Perilaku Pengguna & Fair Play
              </h2>
              <p className="mb-2">
                Kami berkomitmen menjaga sportivitas dalam permainan Ranked Matchmaking. Anda setuju untuk TIDAK melakukan:
              </p>
              <ul className="list-disc list-inside pl-2 flex flex-col gap-1">
                <li>Menggunakan bot, skrip otomatis, atau cheat untuk mempercepat navigasi.</li>
                <li>Melakukan eksploitasi celah keamanan (bug) sistem atau memanipulasi API.</li>
                <li>Mengirimkan spamming emoji atau chat reaksi yang mengganggu kenyamanan pemain lain.</li>
              </ul>
              <p className="mt-2 text-burnt-orange font-bold">
                Penyalahgunaan poin di atas dapat berakibat pada pemblokiran akun dan penghapusan ELO secara permanen tanpa pemberitahuan.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                4. Hak Kekayaan Intelektual
              </h2>
              <p>
                Seluruh konten artikel Wikipedia yang ditampilkan di dalam permainan dimiliki oleh para kontributor Wikipedia dan dilisensikan di bawah lisensi Creative Commons. Logika permainan, visual desain, dan kode sumber WikiRace Indonesia merupakan kekayaan intelektual kami dan dilindungi hukum.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                5. Batasan Tanggung Jawab
              </h2>
              <p>
                Layanan ini disediakan "apa adanya" (as-is) tanpa jaminan apa pun. Kami tidak menjamin ketersediaan server 100% tanpa gangguan atau bebas dari bug teknis Wikipedia yang berada di luar kendali kami.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-lg font-black text-charcoal-text mb-2">
                6. Hubungi Kami
              </h2>
              <p>
                Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami di:{" "}
                <a
                  href="mailto:support@wikirace.id"
                  className="font-bold underline text-charcoal-text hover:text-burnt-orange"
                >
                  support@wikirace.id
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
