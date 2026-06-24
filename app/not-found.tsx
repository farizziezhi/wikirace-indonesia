import Link from "next/link";

/**
 * Halaman 404 bertema WikiRace — menampilkan pesan informatif
 * bukan sekadar redirect diam-diam ke homepage.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-warm-cream flex items-center justify-center p-4">
      <div
        className="relative bg-pure-white border-2 border-charcoal-text p-8 text-center max-w-lg w-full"
        style={{
          borderRadius: "var(--radius-rounded)",
          boxShadow: "6px 6px 0px #282C20",
        }}
      >
        <div className="mt-4 mb-4 text-6xl font-mono font-black text-charcoal-text">
          404
        </div>
        <div className="text-4xl mb-4">🔍</div>

        <h1 className="text-xl font-bold text-charcoal-text mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-medium-gray text-sm mb-6">
          Halaman yang kamu cari tidak ditemukan atau telah dipindahkan.
          <br />
          <span className="text-xs italic">
            This page doesn&apos;t exist or has been moved.
          </span>
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-lime-accent text-charcoal-text font-bold text-sm border-2 border-charcoal-text cursor-pointer transition-all hover:translate-y-[-2px] no-underline"
          style={{
            borderRadius: "var(--radius-button)",
            boxShadow: "3px 3px 0px #282C20",
          }}
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
