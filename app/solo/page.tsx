"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS, searchArticles } from "@/lib/wikipedia";
import { SOLO_THEMES, SoloTheme, CURATED_ARTICLES } from "@/lib/solo-curated";
import { getSavedLanguage, saveLanguage } from "@/lib/client-id";

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

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown("GO! 🏁");
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
            className="flex items-center gap-2 text-charcoal-text/70 hover:text-charcoal-text font-semibold transition"
            style={{ fontSize: "14px" }}
          >
            {language === "en" ? "← Back to home" : "← Kembali ke home"}
          </button>

          <div className="flex items-center gap-3">
            <h1
              className="font-black text-charcoal-text"
              style={{ fontSize: "clamp(32px, 5vw, 42px)", lineHeight: 1.1 }}
            >
              {language === "en" ? "🏎️ Solo Practice" : "🏎️ Latihan Solo"}
            </h1>
          </div>

          <p
            className="text-charcoal-text/80"
            style={{ fontSize: "15px", lineHeight: 1.5 }}
          >
            {language === "en"
              ? "Train your Wikipedia navigation speed on your own, without other players."
              : "Latih kecepatan navigasi Wikipedia Anda sendiri tanpa pemain lain."}
          </p>
        </header>

        {previewResult ? (
          /* PREVIEW CHALLENGE CARD */
          <section
            className="chunky-lg flex flex-col gap-6 bg-paper-white p-6 sm:p-8 animate-scale-up"
            style={{ border: "2px solid var(--color-charcoal-text)" }}
          >
            <div className="text-center">
              <span
                className="bg-charcoal-text text-lime-accent text-xs font-bold uppercase tracking-wider px-3 py-1"
                style={{ borderRadius: "var(--radius-pill)" }}
              >
                {language === "en" ? "🏁 Race Route Ready" : "🏁 Rute Balapan Siap"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div
                className="bg-warm-cream p-4 flex flex-col items-center text-center justify-center relative"
                style={{ borderRadius: "var(--radius-input)", border: "1px solid var(--color-warm-gray)" }}
              >
                <span className="text-[11px] font-bold text-charcoal-text/60 uppercase tracking-wide">
                  {language === "en" ? "Start From" : "Mulai Dari"}
                </span>
                <span className="font-extrabold text-charcoal-text text-lg mt-1 break-all px-2">{previewResult.startArticle}</span>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-charcoal-text text-warm-cream text-xs w-6 h-6 rounded-full hidden md:flex items-center justify-center font-bold z-10">
                  →
                </div>
              </div>

              <div
                className="bg-lime-accent/15 p-4 flex flex-col items-center text-center justify-center"
                style={{
                  borderRadius: "var(--radius-input)",
                  border: "1px solid var(--color-lime-soft)",
                }}
              >
                <span className="text-[11px] font-bold text-charcoal-text/60 uppercase tracking-wide">
                  {language === "en" ? "Final Destination" : "Tujuan Akhir"}
                </span>
                <span className="font-extrabold text-charcoal-text text-lg mt-1 break-all px-2">{previewResult.endArticle}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 border-warm-gray">
              <div className="text-center sm:text-left">
                <span className="text-charcoal-text/70 text-sm block">{language === "en" ? "Estimated Shortest Route:" : "Estimasi Rute Terpendek:"}</span>
                <span className="font-black text-charcoal-text text-base">
                  {previewResult.estimatedDepth === -1
                    ? (language === "en" ? "Custom Route (Free)" : "Rute Kustom (Bebas)")
                    : `~${previewResult.estimatedDepth} ${language === "en" ? "clicks" : "klik"}`}
                </span>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-charcoal-text/70 text-sm block">{language === "en" ? "Mode & Language:" : "Mode & Bahasa:"}</span>
                <span className="font-bold text-charcoal-text text-sm uppercase">
                  {selectedMode === "time-attack" ? "⏱️ Time Attack" : "🧭 Free Roam"} ({language.toUpperCase()})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={handleStartGame}
                className="btn-primary flex-1 py-4 text-base tracking-wide"
                style={{ border: "2px solid var(--color-charcoal-text)", boxShadow: "0 4px 0 var(--color-charcoal-text)" }}
              >
                {language === "en" ? "START RACE 🏁" : "MULAI BALAPAN 🏁"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="btn-white py-4 text-base"
              >
                {language === "en" ? "Change Settings" : "Ubah Pengaturan"}
              </button>
            </div>
          </section>
        ) : (
          /* LOBBY OPTIONS SELECTOR */
          <section
            className="flex flex-col gap-6 bg-warm-cream p-6 border border-warm-gray shadow-raised"
            style={{ borderRadius: "var(--radius-input)" }}
          >
            {/* 1. Module Selector: Curated / Wild / Custom */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-charcoal-text" style={{ fontSize: "15px" }}>
                {language === "en" ? "Choose Article Search Module" : "Pilih Modul Pencarian Artikel"}
              </label>
              <div
                className="grid grid-cols-3 gap-1 bg-light-beige p-1"
                style={{ borderRadius: "var(--radius-input)", border: "1px solid var(--color-warm-gray)" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule("curated");
                    setError(null);
                  }}
                  className={`py-2 text-xs sm:text-sm rounded font-bold transition ${activeModule === "curated" ? "bg-charcoal-text text-warm-cream" : "text-charcoal-text hover:bg-warm-gray/30"}`}
                >
                  {language === "en" ? "🎯 Popular" : "🎯 Populer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule("wild");
                    setError(null);
                  }}
                  className={`py-2 text-xs sm:text-sm rounded font-bold transition ${activeModule === "wild" ? "bg-charcoal-text text-warm-cream" : "text-charcoal-text hover:bg-warm-gray/30"}`}
                >
                  {language === "en" ? "🌀 Random" : "🌀 Acak (Liar)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule("custom");
                    setError(null);
                  }}
                  className={`py-2 text-xs sm:text-sm rounded font-bold transition ${activeModule === "custom" ? "bg-charcoal-text text-warm-cream" : "text-charcoal-text hover:bg-warm-gray/30"}`}
                >
                  {language === "en" ? "🛠️ Custom" : "🛠️ Kustom"}
                </button>
              </div>
            </div>

            {/* CURATED MODULE CONFIGURATION */}
            {activeModule === "curated" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Theme selection grid */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-charcoal-text text-sm">
                    {language === "en" ? "Choose Category" : "Pilih Kategori Kategori"}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOLO_THEMES.filter((t) => t.value !== "all").map((themeItem) => {
                      const active = selectedTheme === themeItem.value;
                      return (
                        <button
                          key={themeItem.value}
                          type="button"
                          onClick={() => setSelectedTheme(themeItem.value as any)}
                          className="flex flex-col items-center justify-center p-3 text-center transition chunky-press"
                          style={{
                            borderRadius: "var(--radius-input)",
                            border: `2px solid ${active ? "var(--color-charcoal-text)" : "var(--color-warm-gray)"}`,
                            background: active ? "var(--color-lime-accent)" : "var(--color-pure-white)",
                          }}
                        >
                          <span className="text-2xl mb-1">{themeItem.emoji}</span>
                          <span className="font-extrabold text-charcoal-text text-xs sm:text-sm">
                            {language === "id" ? themeItem.labelId : themeItem.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty selector */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-charcoal-text text-sm">
                    {language === "en" ? "Difficulty Level" : "Tingkat Kesulitan"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((level) => {
                      const active = difficulty === level;
                      const label = level === "easy" 
                        ? (language === "en" ? "Easy (2 clicks)" : "Mudah (2 klik)") 
                        : level === "hard" 
                          ? (language === "en" ? "Hard (4 clicks)" : "Sulit (4 klik)") 
                          : (language === "en" ? "Medium (3 clicks)" : "Sedang (3 klik)");
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className="py-2.5 px-2 rounded-lg font-bold text-xs sm:text-sm border transition"
                          style={{
                            borderColor: active ? "var(--color-charcoal-text)" : "var(--color-warm-gray)",
                            background: active ? "var(--color-charcoal-text)" : "transparent",
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
              <div className="flex flex-col gap-4 animate-fade-in bg-paper-white p-4 border border-dashed border-warm-gray rounded-lg">
                <p className="text-charcoal-text/80 text-sm leading-relaxed">
                  {language === "en"
                    ? "🌀 Wild Wikipedia will pick a completely random starting article from the language you chose. Paths might be harder because topics vary widely!"
                    : "🌀 Wikipedia Liar akan mencocokkan artikel awal secara acak total dari seluruh isi Wikipedia bahasa yang Anda pilih. Jalur mungkin akan sulit karena topiknya sangat bervariasi!"}
                </p>

                {/* Difficulty selector */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-charcoal-text text-sm">
                    {language === "en" ? "Difficulty Level" : "Tingkat Kesulitan"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((level) => {
                      const active = difficulty === level;
                      const label = level === "easy" 
                        ? (language === "en" ? "Easy" : "Mudah") 
                        : level === "hard" 
                          ? (language === "en" ? "Hard" : "Sulit") 
                          : (language === "en" ? "Medium" : "Sedang");
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className="py-2.5 px-2 rounded-lg font-bold text-xs sm:text-sm border transition"
                          style={{
                            borderColor: active ? "var(--color-charcoal-text)" : "var(--color-warm-gray)",
                            background: active ? "var(--color-charcoal-text)" : "transparent",
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
                  <label htmlFor="customStart" className="font-bold text-charcoal-text text-sm">
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
                    className="pd-input"
                    autoComplete="off"
                  />

                  {showStartSuggest && startSuggestions.length > 0 && (
                    <ul
                      className="absolute left-0 right-0 top-full mt-1 bg-pure-white border border-warm-gray shadow-floating z-30 max-h-48 overflow-y-auto"
                      style={{ borderRadius: "var(--radius-input)" }}
                    >
                      {startSuggestions.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setCustomStart(s);
                              setStartSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-lime-accent/15 text-sm text-charcoal-text font-medium transition"
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
                  <label htmlFor="customEnd" className="font-bold text-charcoal-text text-sm">
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
                    className="pd-input"
                    autoComplete="off"
                  />

                  {showEndSuggest && endSuggestions.length > 0 && (
                    <ul
                      className="absolute left-0 right-0 top-full mt-1 bg-pure-white border border-warm-gray shadow-floating z-30 max-h-48 overflow-y-auto"
                      style={{ borderRadius: "var(--radius-input)" }}
                    >
                      {endSuggestions.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setCustomEnd(s);
                              setEndSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-lime-accent/15 text-sm text-charcoal-text font-medium transition"
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
            <div className="flex flex-col gap-3 border-t pt-4 border-warm-gray">
              <label className="font-bold text-charcoal-text" style={{ fontSize: "15px" }}>
                {language === "en" ? "Select Game Mode" : "Pilih Mode Permainan"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMode("time-attack")}
                  disabled={loading}
                  className="flex items-start gap-3 p-3 text-left transition"
                  style={{
                    borderRadius: "var(--radius-input)",
                    border: `2px solid ${selectedMode === "time-attack" ? "var(--color-charcoal-text)" : "var(--color-warm-gray)"}`,
                    background: selectedMode === "time-attack" ? "var(--color-light-beige)" : "var(--color-pure-white)",
                  }}
                >
                  <span className="text-2xl mt-0.5">⏱️</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-charcoal-text text-sm">Time Attack</span>
                    <span className="text-charcoal-text/70 text-xs mt-0.5 leading-snug">
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
                  className="flex items-start gap-3 p-3 text-left transition"
                  style={{
                    borderRadius: "var(--radius-input)",
                    border: `2px solid ${selectedMode === "free-roam" ? "var(--color-charcoal-text)" : "var(--color-warm-gray)"}`,
                    background: selectedMode === "free-roam" ? "var(--color-light-beige)" : "var(--color-pure-white)",
                  }}
                >
                  <span className="text-2xl mt-0.5">🧭</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-charcoal-text text-sm">Free Roam</span>
                    <span className="text-charcoal-text/70 text-xs mt-0.5 leading-snug">
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
              <label className="font-bold text-charcoal-text text-sm">
                {language === "en" ? "Wikipedia Language" : "Bahasa Wikipedia"}
              </label>
              <div
                className="grid grid-cols-2 gap-2 bg-light-beige p-1"
                style={{
                  borderRadius: "var(--radius-input)",
                  border: "1px solid var(--color-warm-gray)",
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
                      className="flex items-center justify-center gap-2 py-2.5 transition rounded-md font-bold text-sm"
                      style={{
                        background: active ? "var(--color-charcoal-text)" : "transparent",
                        color: active ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
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
              className="btn-primary py-4 text-base tracking-wide"
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div
                    className="border-charcoal-text border-t-transparent animate-spin w-5 h-5"
                    style={{ borderWidth: 3, borderRadius: "50%" }}
                  />
                  <span>{language === "en" ? "Preparing Route..." : "Menyiapkan Rute..."}</span>
                </div>
              ) : (
                language === "en" ? "🏁 Get Route Challenge" : "🏁 Dapatkan Tantangan Rute"
              )}
            </button>

            {error && (
              <div
                role="alert"
                className="bg-charcoal-text text-warm-cream flex items-center gap-2"
                style={{
                  borderRadius: "var(--radius-input)",
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
              >
                <span>⚠</span>
                <span className="font-semibold">{error}</span>
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
