"use client";

import { useEffect } from "react";

/**
 * Global error boundary — ditampilkan Next.js saat terjadi
 * error tak tertangkap di halaman. Bertema cyber-neobrutalism.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("WikiRace Global Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-warm-cream flex items-center justify-center p-4">
      <div
        className="relative bg-pure-white border-2 border-charcoal-text p-8 text-center max-w-lg w-full"
        style={{
          borderRadius: "var(--radius-rounded)",
          boxShadow: "6px 6px 0px #FF6B00",
        }}
      >
        {/* Red warning stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{
            background: "repeating-linear-gradient(90deg, #FF6B00 0px, #FF6B00 8px, transparent 8px, transparent 16px)",
            borderRadius: "var(--radius-rounded) var(--radius-rounded) 0 0",
          }}
        />

        <div className="mt-4 mb-4 text-5xl">⚠️</div>

        <h1 className="text-xl font-bold text-charcoal-text mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-medium-gray text-sm mb-6">
          Something went wrong. Coba refresh halaman atau klik tombol di bawah.
        </p>

        {error.digest && (
          <p className="font-mono text-xs text-stone-gray mb-4">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-lime-accent text-charcoal-text font-bold text-sm border-2 border-charcoal-text cursor-pointer transition-all hover:translate-y-[-2px]"
            style={{
              borderRadius: "var(--radius-button)",
              boxShadow: "3px 3px 0px #282C20",
            }}
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="px-6 py-2.5 bg-light-beige text-charcoal-text font-bold text-sm border-2 border-charcoal-text cursor-pointer transition-all hover:translate-y-[-2px] no-underline"
            style={{
              borderRadius: "var(--radius-button)",
              boxShadow: "3px 3px 0px #282C20",
            }}
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
