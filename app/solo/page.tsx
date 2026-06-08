"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS } from "@/lib/wikipedia";

type SoloMode = "time-attack" | "free-roam";

export default function SoloPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMode, setSelectedMode] = useState<SoloMode>("time-attack");
  const [language, setLanguage] = useState<WikiLanguage>(() => {
    const param = searchParams.get("lang");
    return param === "en" ? "en" : "id";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/solo/generate?lang=${language}&mode=${selectedMode}`
      );
      const data = await res.json();

      if (!res.ok || !data.startArticle || !data.endArticle) {
        setError(data.error ?? "Gagal generate artikel. Coba lagi.");
        setLoading(false);
        return;
      }

      router.push(
        `/solo/play?start=${encodeURIComponent(data.startArticle)}&end=${encodeURIComponent(data.endArticle)}&mode=${selectedMode}&lang=${language}&depth=${data.estimatedDepth}`
      );
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setLoading(false);
    }
  }

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[560px]">
        <header className="mb-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-charcoal-text/70 hover:text-charcoal-text"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            ← Kembali ke home
          </button>

          <h1
            className="font-black text-charcoal-text"
            style={{ fontSize: "clamp(32px, 5vw, 42px)", lineHeight: 1.1 }}
          >
            🏎️ Solo Mode
          </h1>

          <p
            className="text-charcoal-text/80"
            style={{ fontSize: "16px", lineHeight: 1.5 }}
          >
            Latihan sendiri tanpa multiplayer. Artikel dijamin bisa dicapai.
          </p>
        </header>

        <section
          className="flex flex-col gap-6 bg-warm-cream p-6"
          style={{
            borderRadius: "var(--radius-input)",
            border: "1px solid var(--color-warm-gray)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {/* Mode picker */}
          <div className="flex flex-col gap-3">
            <label className="font-bold text-charcoal-text" style={{ fontSize: "16px" }}>
              Pilih Mode
            </label>

            <button
              type="button"
              onClick={() => setSelectedMode("time-attack")}
              disabled={loading}
              className="flex flex-col items-start gap-1 p-4 transition"
              style={{
                borderRadius: "var(--radius-input)",
                border: `2px solid ${selectedMode === "time-attack" ? "var(--color-lime-accent)" : "var(--color-warm-gray)"}`,
                background: selectedMode === "time-attack" ? "var(--color-light-beige)" : "transparent",
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "20px" }}>⏱️</span>
                <span className="font-bold text-charcoal-text" style={{ fontSize: "16px" }}>
                  Time Attack
                </span>
              </div>
              <span className="text-charcoal-text/70" style={{ fontSize: "14px" }}>
                Timer jalan. Cari rute tercepat. Tidak disimpan.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("free-roam")}
              disabled={loading}
              className="flex flex-col items-start gap-1 p-4 transition"
              style={{
                borderRadius: "var(--radius-input)",
                border: `2px solid ${selectedMode === "free-roam" ? "var(--color-lime-accent)" : "var(--color-warm-gray)"}`,
                background: selectedMode === "free-roam" ? "var(--color-light-beige)" : "transparent",
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "20px" }}>🧭</span>
                <span className="font-bold text-charcoal-text" style={{ fontSize: "16px" }}>
                  Free Roam
                </span>
              </div>
              <span className="text-charcoal-text/70" style={{ fontSize: "14px" }}>
                Tidak ada timer. Eksplorasi santai. Hitung klik saja.
              </span>
            </button>
          </div>

          {/* Language picker */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-charcoal-text" style={{ fontSize: "16px" }}>
              Bahasa Wikipedia
            </label>
            <div
              className="grid grid-cols-2 gap-2 bg-light-beige p-1"
              style={{
                borderRadius: "var(--radius-input)",
                border: "1px solid var(--color-warm-gray)",
              }}
              role="radiogroup"
              aria-label="Bahasa Wikipedia"
            >
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = opt.value === language;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLanguage(opt.value)}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 transition disabled:opacity-60"
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-button)",
                      background: active ? "var(--color-charcoal-text)" : "transparent",
                      color: active ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    <span aria-hidden style={{ fontSize: 18 }}>
                      {opt.flag}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Generating..." : "🚀 Mulai"}
          </button>

          {error && (
            <div
              role="alert"
              className="bg-charcoal-text text-warm-cream"
              style={{
                borderRadius: "var(--radius-input)",
                padding: "12px 16px",
                fontSize: "14px",
              }}
            >
              ⚠ {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
