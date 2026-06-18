"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS, searchArticles } from "@/lib/wikipedia";
import { SOLO_THEMES, SoloTheme, CURATED_ARTICLES } from "@/lib/solo-curated";
import { getSavedLanguage, saveLanguage } from "@/lib/client-id";
import { playCountdownBeep, unlockRaceAudio } from "@/lib/race-audio";

type SoloMode = "time-attack" | "free-roam";
type SelectionModule = "curated" | "wild" | "custom";

function SoloPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [language, setLanguage] = useState<WikiLanguage>("id");

  // Load language choice from localStorage if not provided in search parameters
  useEffect(() => {
    const param = searchParams.get("lang");
    if (param === "en" || param === "id") {
      setLanguage(param);
    } else {
      setLanguage(getSavedLanguage());
    }
  }, [searchParams]);

  // Module state: curated themes vs wild random vs custom inputs
  const [activeModule, setActiveModule] = useState<SelectionModule>("curated");

  // Mode state
  const [selectedMode, setSelectedMode] = useState<SoloMode>("time-attack");

  // Curated theme & difficulty states
  const [selectedTheme, setSelectedTheme] = useState<Exclude<SoloTheme, "all">>("history-geo");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Custom start & target states
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<string[]>([]);
  const [showStartSuggest, setShowStartSuggest] = useState(false);
  const [showEndSuggest, setShowEndSuggest] = useState(false);

  // Flow states: idle -> loading -> preview -> countdown -> navigate
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    startArticle: string;
    endArticle: string;
    estimatedDepth: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | string | null>(null);

  // Autocomplete debouncing
  useEffect(() => {
    if (customStart.trim().length < 2) {
      setStartSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchArticles(customStart, language);
        setStartSuggestions(results);
      } catch {
        setStartSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customStart, language]);

  useEffect(() => {
    if (customEnd.trim().length < 2) {
      setEndSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchArticles(customEnd, language);
        setEndSuggestions(results);
      } catch {
        setEndSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customEnd, language]);

  // Generate route from Lobby parameters
  async function handleGenerateChallenge() {
    setLoading(true);
    setError(null);
    setPreviewResult(null);

    // Validate custom inputs if module is custom
    if (activeModule === "custom") {
      if (!customStart.trim()) {
        setError(language === "id" ? "Masukkan artikel awal kustom." : "Please enter custom start article.");
        setLoading(false);
        return;
      }
      if (!customEnd.trim()) {
        setError(language === "id" ? "Masukkan artikel akhir kustom." : "Please enter custom target article.");
        setLoading(false);
        return;
      }
      if (customStart.trim().toLowerCase() === customEnd.trim().toLowerCase()) {
        setError(language === "id" ? "Artikel awal dan akhir tidak boleh sama." : "Start and target articles cannot be the same.");
        setLoading(false);
        return;
      }
    }

    try {
      const themeParam = activeModule === "curated" ? selectedTheme : "all";
      const startParam = activeModule === "custom" ? customStart.trim() : "";
      const endParam = activeModule === "custom" ? customEnd.trim() : "";

      const queryParams = new URLSearchParams({
        lang: language,
        theme: themeParam,
        difficulty,
      });

      if (startParam) queryParams.append("start", startParam);
      if (endParam) queryParams.append("end", endParam);

      const res = await fetch(`/api/solo/generate?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? (language === "id" ? "Gagal generate artikel. Coba lagi." : "Failed to generate articles. Retry."));
        setLoading(false);
        return;
      }

      setPreviewResult({
        startArticle: data.startArticle,
        endArticle: data.endArticle,
        estimatedDepth: data.estimatedDepth,
      });
      setLoading(false);
    } catch {
      setError(language === "id" ? "Tidak bisa terhubung ke server." : "Could not connect to the server.");
      setLoading(false);
    }
  }

  // Trigger countdown sequence before navigating
  function handleStartGame() {
    if (!previewResult) return;

    let count = 3;
    setCountdown(count);
    void unlockRaceAudio();
    playCountdownBeep("3");

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playCountdownBeep(String(count) as "3" | "2" | "1");
      } else if (count === 0) {
        setCountdown("GO! 🏁");
        playCountdownBeep("GO");
      } else {
        clearInterval(timer);
        // Navigate to play page
        router.push(
          `/solo/play?start=${encodeURIComponent(previewResult.startArticle)}&end=${encodeURIComponent(previewResult.endArticle)}&mode=${selectedMode}&lang=${language}&depth=${previewResult.estimatedDepth}`
        );
      }
    }, 700);
  }

  return (
    <main className="dot-bg relative flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      {/* Countdown overlay */}
      {countdown !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal-text/90 text-warm-cream animate-fade-in"
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div className="text-center">
            <p className="mb-2 text-lime-accent font-extrabold uppercase tracking-widest text-lg sm:text-xl">
              {selectedMode === "time-attack" ? "⏱️ Time Attack" : "🧭 Free Roam"}
            </p>
            <h2
              className="font-black text-lime-accent transition-transform duration-200 scale-110"
              style={{ fontSize: "clamp(80px, 15vw, 150px)", lineHeight: 1 }}
            >
              {countdown}
            </h2>
            <p className="mt-4 text-warm-cream/70 text-sm sm:text-base max-w-xs mx-auto">
              {language === "id"
                ? "Bersiaplah untuk melompat dari tautan ke tautan!"
                : "Get ready to jump from link to link!"}
            </p>
          </div>
        </div>
      )}
      <div className="w-full max-w-[620px]">
        <header className="mb-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-3.5 py-1.5 rounded-full self-start shadow-[1.5px_1.5px_0px_#000]"
          >
            {language === "en" ? "← Back to home" : "← Kembali ke home"}
          </button>

          <div className="flex items-center gap-3 mt-1">
            <h1
              className="font-black text-charcoal-text uppercase tracking-tight"
              style={{ fontSize: "clamp(30px, 5vw, 38px)", lineHeight: 1.1 }}
            >
              🏎️ {language === "en" ? "Solo Practice" : "Latihan Solo"}
            </h1>
          </div>

          <p
            className="text-charcoal-text/80 text-sm font-semibold leading-relaxed"
          >
            {language === "en"
              ? "Train your Wikipedia navigation speed on your own, without other players."
              : "Latih kecepatan navigasi Wikipedia Anda sendiri tanpa pemain lain."}
          </p>
        </header>

        {previewResult ? (
          /* PREVIEW CHALLENGE CARD */
          <section
            className="relative overflow-hidden flex flex-col gap-6 bg-charcoal-deep text-warm-cream p-6 sm:p-8 border-3 border-charcoal-text shadow-[6px_6px_0px_#000] animate-scale-up"
            style={{ borderRadius: "var(--radius-input)" }}
          >
            {/* Header Checkered Stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-charcoal-text overflow-hidden flex" aria-hidden="true">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
              ))}
            </div>

            <div className="text-center mt-2">
              <span
                className="bg-lime-accent text-charcoal-text text-xs font-black uppercase tracking-widest px-4 py-1.5 border border-charcoal-text shadow-[2px_2px_0px_#000]"
                style={{ borderRadius: "var(--radius-button)" }}
              >
                🏁 {language === "en" ? "Practice Route Ready" : "Rute Latihan Siap"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div
                className="bg-charcoal-text p-4 flex flex-col items-center text-center justify-center relative border border-warm-gray/10"
                style={{ borderRadius: "var(--radius-input)" }}
              >
                <span className="text-[9px] font-mono font-black text-warm-cream/50 uppercase tracking-widest">
                  {language === "en" ? "Start Point" : "Titik Awal"}
                </span>
                <span className="font-extrabold text-lime-accent text-base mt-1 break-all px-2">
                  {previewResult.startArticle.replace(/_/g, ' ')}
                </span>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-charcoal-text border border-lime-accent/30 text-lime-accent text-xs w-6 h-6 rounded-full hidden md:flex items-center justify-center font-bold z-10" aria-hidden="true">
                  ➔
                </div>
              </div>

              <div
                className="bg-charcoal-text p-4 flex flex-col items-center text-center justify-center border border-burnt-orange/20"
                style={{
                  borderRadius: "var(--radius-input)",
                }}
              >
                <span className="text-[9px] font-mono font-black text-warm-cream/50 uppercase tracking-widest">
                  {language === "en" ? "Target Destination" : "Tujuan Target"}
                </span>
                <span className="font-extrabold text-warm-cream text-base mt-1 break-all px-2">
                  {previewResult.endArticle.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 border-warm-cream/15">
              <div className="text-center sm:text-left">
                <span className="text-warm-cream/60 text-xs block font-mono uppercase tracking-wider">{language === "en" ? "Est. Path Length:" : "Estimasi Panjang Rute:"}</span>
                <span className="font-black text-lime-accent text-sm">
                  {previewResult.estimatedDepth === -1
                    ? (language === "en" ? "Custom Route (Free)" : "Rute Kustom (Bebas)")
                    : `~${previewResult.estimatedDepth} ${language === "en" ? "clicks" : "klik"}`}
                </span>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-warm-cream/60 text-xs block font-mono uppercase tracking-wider">{language === "en" ? "Mapped Mode & Lang:" : "Mode & Bahasa Mapping:"}</span>
                <span className="font-black text-playdate-yellow text-xs uppercase font-mono">
                  ⏱️ {selectedMode === "time-attack" ? "Time Attack" : "Free Roam"} ({language.toUpperCase()})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={handleStartGame}
                className="chunky-press btn-primary flex-1 py-4 text-base font-black border-2 border-charcoal-text"
                style={{ boxShadow: "4px 4px 0px #000" }}
              >
                {language === "en" ? "START LAP 🏎️" : "MULAI LAP 🏎️"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="chunky-press btn-white py-4 text-base font-black border-2 border-charcoal-text"
                style={{ boxShadow: "4px 4px 0px #000" }}
              >
                {language === "en" ? "Change Setup" : "Ubah Setup"}
              </button>
            </div>
          </section>
        ) : (
          /* LOBBY OPTIONS SELECTOR */
          <section
            className="flex flex-col gap-6 bg-pure-white p-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
            style={{ borderRadius: "var(--radius-input)" }}
          >
            {/* 1. Module Selector: Curated / Wild / Custom */}
            <div className="flex flex-col gap-2">
              <label className="font-black text-charcoal-text text-sm uppercase tracking-tight">
                🔧 {language === "en" ? "Choose Practice Preset" : "Pilih Preset Latihan"}
              </label>
              <div
                className="grid grid-cols-3 gap-1 bg-charcoal-deep border-2 border-charcoal-text p-1"
                style={{ borderRadius: "var(--radius-input)", boxShadow: "2px 2px 0px #000" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule("curated");
                    setError(null);
                  }}
                  className={`py-2 text-xs sm:text-sm rounded font-black uppercase tracking-wider transition ${activeModule === "curated" ? "bg-lime-accent text-charcoal-text" : "text-warm-cream/60 hover:text-warm-cream hover:bg-warm-gray/10"}`}
                >
                  {language === "en" ? "Popular" : "Populer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule("wild");
                    setError(null);
                  }}
                  className={`py-2 text-xs sm:text-sm rounded font-black uppercase tracking-wider transition ${activeModule === "wild" ? "bg-lime-accent text-charcoal-text" : "text-warm-cream/60 hover:text-warm-cream hover:bg-warm-gray/10"}`}
                >
                  {language === "en" ? "Random" : "Acak"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule("custom");
                    setError(null);
                  }}
                  className={`py-2 text-xs sm:text-sm rounded font-black uppercase tracking-wider transition ${activeModule === "custom" ? "bg-lime-accent text-charcoal-text" : "text-warm-cream/60 hover:text-warm-cream hover:bg-warm-gray/10"}`}
                >
                  {language === "en" ? "Custom" : "Kustom"}
                </button>
              </div>
            </div>

            {/* CURATED MODULE CONFIGURATION */}
            {activeModule === "curated" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Theme selection grid */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-charcoal-text text-xs uppercase tracking-wider opacity-70">
                    {language === "en" ? "Choose Category" : "Pilih Kategori"}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOLO_THEMES.filter((t) => t.value !== "all").map((themeItem) => {
                      const active = selectedTheme === themeItem.value;
                      return (
                        <button
                          key={themeItem.value}
                          type="button"
                          onClick={() => setSelectedTheme(themeItem.value as any)}
                          className="flex flex-col items-center justify-center p-3 text-center transition chunky-press border-2 border-charcoal-text shadow-[3px_3px_0px_#000]"
                          style={{
                            borderRadius: "var(--radius-input)",
                            background: active ? "var(--color-lime-accent)" : "var(--color-warm-cream)",
                            color: "var(--color-charcoal-text)"
                          }}
                        >
                          <span className="text-2xl mb-1" aria-hidden="true">{themeItem.emoji}</span>
                          <span className="font-black text-xs uppercase tracking-tight">
                            {language === "id" ? themeItem.labelId : themeItem.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty selector */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-charcoal-text text-xs uppercase tracking-wider opacity-70">
                    {language === "en" ? "Engine Mapping (Difficulty)" : "Mapping Mesin (Kesulitan)"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((level) => {
                      const active = difficulty === level;
                      const label = level === "easy" 
                        ? (language === "en" ? "MAP 1 (Easy)" : "MAP 1 (Mudah)") 
                        : level === "hard" 
                          ? (language === "en" ? "MAP 3 (Hard)" : "MAP 3 (Sulit)") 
                          : (language === "en" ? "MAP 2 (Med)" : "MAP 2 (Sedang)");
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className="py-2.5 px-2 rounded-lg font-black text-xs sm:text-sm border-2 border-charcoal-text transition shadow-[2px_2px_0px_#000]"
                          style={{
                            background: active ? "var(--color-charcoal-text)" : "var(--color-warm-cream)",
                            color: active ? "var(--color-lime-accent)" : "var(--color-charcoal-text)",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* WILD MODULE CONFIGURATION */}
            {activeModule === "wild" && (
              <div className="flex flex-col gap-4 animate-fade-in bg-light-beige/50 p-4 border-2 border-dashed border-charcoal-text/25 rounded-lg">
                <p className="text-charcoal-text/80 text-xs font-semibold leading-relaxed">
                  {language === "en"
                    ? "🌀 Wild Wikipedia will pick a completely random starting article from the language you chose. Paths might be harder because topics vary widely!"
                    : "🌀 Wikipedia Liar akan mencocokkan artikel awal secara acak total dari seluruh isi Wikipedia bahasa yang Anda pilih. Jalur mungkin akan sulit karena topiknya sangat bervariasi!"}
                </p>

                {/* Difficulty selector */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-charcoal-text text-xs uppercase tracking-wider opacity-70">
                    {language === "en" ? "Engine Mapping (Difficulty)" : "Mapping Mesin (Kesulitan)"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((level) => {
                      const active = difficulty === level;
                      const label = level === "easy" 
                        ? (language === "en" ? "MAP 1 (Easy)" : "MAP 1 (Mudah)") 
                        : level === "hard" 
                          ? (language === "en" ? "MAP 3 (Hard)" : "MAP 3 (Sulit)") 
                          : (language === "en" ? "MAP 2 (Med)" : "MAP 2 (Sedang)");
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className="py-2.5 px-2 rounded-lg font-black text-xs sm:text-sm border-2 border-charcoal-text transition shadow-[2px_2px_0px_#000]"
                          style={{
                            background: active ? "var(--color-charcoal-text)" : "var(--color-warm-cream)",
                            color: active ? "var(--color-lime-accent)" : "var(--color-charcoal-text)",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOM CHALLENGE MODULE */}
            {activeModule === "custom" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Custom Start Article Input */}
                <div className="flex flex-col gap-2 relative">
                  <label htmlFor="customStart" className="font-black text-charcoal-text text-xs uppercase tracking-wider opacity-70">
                    {language === "en" ? "Starting Article (Start)" : "Artikel Awal (Start)"}
                  </label>
                  <input
                    id="customStart"
                    type="text"
                    value={customStart}
                    onChange={(e) => {
                      setCustomStart(e.target.value);
                      setShowStartSuggest(true);
                    }}
                    onFocus={() => setShowStartSuggest(true)}
                    onBlur={() => setTimeout(() => setShowStartSuggest(false), 200)}
                    placeholder={language === "en" ? "Type Wikipedia article... (e.g. Cat)" : "Ketik artikel Wikipedia... (misal: Kucing)"}
                    className="pd-input border-2 border-charcoal-text"
                    style={{ borderRadius: "var(--radius-button)" }}
                    autoComplete="off"
                  />

                  {showStartSuggest && startSuggestions.length > 0 && (
                    <ul
                      className="absolute left-0 right-0 top-full mt-1 bg-pure-white border-2 border-charcoal-text shadow-[4px_4px_0px_#000] z-30 max-h-48 overflow-y-auto"
                      style={{ borderRadius: "var(--radius-button)" }}
                    >
                      {startSuggestions.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setCustomStart(s);
                              setStartSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-lime-accent text-sm text-charcoal-text font-black transition border-b border-charcoal-text/10 last:border-0"
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Custom Target Article Input */}
                <div className="flex flex-col gap-2 relative">
                  <label htmlFor="customEnd" className="font-black text-charcoal-text text-xs uppercase tracking-wider opacity-70">
                    {language === "en" ? "Ending Article (Target)" : "Artikel Akhir (Target)"}
                  </label>
                  <input
                    id="customEnd"
                    type="text"
                    value={customEnd}
                    onChange={(e) => {
                      setCustomEnd(e.target.value);
                      setShowEndSuggest(true);
                    }}
                    onFocus={() => setShowEndSuggest(true)}
                    onBlur={() => setTimeout(() => setShowEndSuggest(false), 200)}
                    placeholder={language === "en" ? "Type Wikipedia article... (e.g. World War II)" : "Ketik artikel Wikipedia... (misal: Perang Dunia II)"}
                    className="pd-input border-2 border-charcoal-text"
                    style={{ borderRadius: "var(--radius-button)" }}
                    autoComplete="off"
                  />

                  {showEndSuggest && endSuggestions.length > 0 && (
                    <ul
                      className="absolute left-0 right-0 top-full mt-1 bg-pure-white border-2 border-charcoal-text shadow-[4px_4px_0px_#000] z-30 max-h-48 overflow-y-auto"
                      style={{ borderRadius: "var(--radius-button)" }}
                    >
                      {endSuggestions.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setCustomEnd(s);
                              setEndSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-lime-accent text-sm text-charcoal-text font-black transition border-b border-charcoal-text/10 last:border-0"
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* 2. Choose Game Mode */}
            <div className="flex flex-col gap-3 border-t-2 pt-4 border-charcoal-text/10">
              <label className="font-black text-charcoal-text text-sm uppercase tracking-tight">
                ⚙️ {language === "en" ? "Select Game Mode" : "Pilih Mode Permainan"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMode("time-attack")}
                  disabled={loading}
                  className="flex items-start gap-3 p-3.5 text-left transition border-2 border-charcoal-text shadow-[3px_3px_0px_#000] hover:scale-[1.01]"
                  style={{
                    borderRadius: "var(--radius-input)",
                    background: selectedMode === "time-attack" ? "var(--color-lime-accent)" : "var(--color-pure-white)",
                    color: "var(--color-charcoal-text)"
                  }}
                >
                  <span className="text-2xl mt-0.5" aria-hidden="true">⏱️</span>
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tight">Time Attack</span>
                    <span className="text-charcoal-text/85 text-[11px] font-bold mt-1 leading-snug">
                      {language === "en"
                        ? "Timer counts up. Find the fastest route to finish."
                        : "Timer berjalan. Cari rute tercepat untuk finis."}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode("free-roam")}
                  disabled={loading}
                  className="flex items-start gap-3 p-3.5 text-left transition border-2 border-charcoal-text shadow-[3px_3px_0px_#000] hover:scale-[1.01]"
                  style={{
                    borderRadius: "var(--radius-input)",
                    background: selectedMode === "free-roam" ? "var(--color-lime-accent)" : "var(--color-pure-white)",
                    color: "var(--color-charcoal-text)"
                  }}
                >
                  <span className="text-2xl mt-0.5" aria-hidden="true">🧭</span>
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tight">Free Roam</span>
                    <span className="text-charcoal-text/85 text-[11px] font-bold mt-1 leading-snug">
                      {language === "en"
                        ? "No time limit. Explore freely, only click count is tracked."
                        : "Tanpa batas waktu. Eksplorasi bebas, hanya jumlah klik yang dihitung."}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Language picker */}
            <div className="flex flex-col gap-2">
              <label className="font-black text-charcoal-text text-sm uppercase tracking-tight">
                🌐 {language === "en" ? "Wikipedia Language" : "Bahasa Wikipedia"}
              </label>
              <div
                className="grid grid-cols-2 gap-2 bg-charcoal-deep border-2 border-charcoal-text p-1"
                style={{
                  borderRadius: "var(--radius-input)",
                  boxShadow: "2px 2px 0px #000"
                }}
                role="radiogroup"
                aria-label={language === "en" ? "Wikipedia Language" : "Bahasa Wikipedia"}
              >
                {LANGUAGE_OPTIONS.map((opt) => {
                  const active = opt.value === language;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setLanguage(opt.value);
                        saveLanguage(opt.value);
                        // Reset kustom jika ganti bahasa
                        setCustomStart("");
                        setCustomEnd("");
                      }}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 py-2.5 transition rounded-md font-black text-sm"
                      style={{
                        background: active ? "var(--color-lime-accent)" : "transparent",
                        color: active ? "var(--color-charcoal-text)" : "var(--color-warm-cream)",
                      }}
                    >
                      <span aria-hidden style={{ fontSize: 16 }}>
                        {opt.flag}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate challenge button */}
            <button
              type="button"
              onClick={handleGenerateChallenge}
              disabled={loading}
              className="chunky-press btn-primary py-4 text-base font-black border-2 border-charcoal-text shadow-[4px_4px_0px_#000]"
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div
                    className="border-charcoal-text border-t-transparent animate-spin w-5 h-5"
                    style={{ borderWidth: 3, borderRadius: "50%" }}
                  />
                  <span>{language === "en" ? "CALCULATING LAP..." : "MENGKALKULASI LAP..."}</span>
                </div>
              ) : (
                language === "en" ? "🏁 INITIALIZE PRACTICE CHALLENGE" : "🏁 INISIALISASI TANTANGAN LAP"
              )}
            </button>

            {error && (
              <div
                role="alert"
                className="bg-charcoal-text text-warm-cream flex items-center gap-2 border-2 border-charcoal-text shadow-[2px_2px_0px_#000]"
                style={{
                  borderRadius: "var(--radius-input)",
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
              >
                <span>⚠</span>
                <span className="font-bold">{error}</span>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function SoloPage() {
  return (
    <Suspense
      fallback={
        <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
          <div className="w-full max-w-[560px] text-center">
            <p className="text-charcoal-text font-bold" style={{ fontSize: "16px" }}>
              Loading...
            </p>
          </div>
        </main>
      }
    >
      <SoloPageContent />
    </Suspense>
  );
}
