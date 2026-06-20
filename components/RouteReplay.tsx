"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { computeResultBadges, type AchievementBadge } from "@/lib/achievements";
import { avatarColor, initials } from "@/lib/avatar";
import type { RouteStep } from "@/lib/types";
import { translations } from "@/lib/translations";

import type { RankedPlayer } from "./Results";

interface RouteReplayProps {
  rows: RankedPlayer[];
  winnerId: string | null;
  onClose: () => void;
  language: "id" | "en";
}

type Speed = 1 | 2 | 4;

export interface CategoryCount {
  name: string;
  count: number;
  icon: string;
}

// Client-side Wikipedia article categorizer helper
export function categorizeRoute(route: RouteStep[], language: "id" | "en"): CategoryCount[] {
  if (route.length === 0) return [];
  
  const idCategories = [
    { name: "Sejarah & Politik", icon: "🏛️", keywords: ["sejarah", "politik", "perang", "presiden", "kerajaan", "dinasti", "kemerdekaan", "dunia", "pahlawan", "sultan", "bupati", "menteri", "pemerintah", "kabinet", "undang", "hukum", "sejarawan", "pasukan", "monarki", "republik"] },
    { name: "Sains & Teknologi", icon: "🔬", keywords: ["sains", "teknologi", "komputer", "fisika", "kimia", "biologi", "matematika", "angkasa", "planet", "penemu", "internet", "program", "elektronik", "mesin", "pesawat", "telepon", "software", "hardware", "astronomi", "medis", "kedokteran"] },
    { name: "Geografi & Tempat", icon: "🗺️", keywords: ["negara", "kota", "gunung", "sungai", "pulau", "provinsi", "daerah", "benua", "laut", "wilayah", "danau", "kecamatan", "kabupaten", "desa", "samudra", "selat", "pantai", "lembah", "peta", "lokasi", "asia", "eropa", "amerika", "afrika"] },
    { name: "Seni, Budaya & Olahraga", icon: "🎨", keywords: ["musik", "film", "seni", "budaya", "sepak", "bola", "atlet", "lagu", "tari", "tradisional", "bahasa", "sastra", "game", "olahraga", "lukisan", "drama", "teater", "musisi", "aktor", "sutradara", "komik", "novel", "puisi", "stadion", "juara"] }
  ];
  
  const enCategories = [
    { name: "History & Politics", icon: "🏛️", keywords: ["history", "war", "president", "kingdom", "dynasty", "politics", "empire", "treaty", "independence", "minister", "government", "parliament", "law", "governor"] },
    { name: "Science & Tech", icon: "🔬", keywords: ["science", "tech", "computer", "physics", "chemistry", "biology", "math", "space", "planet", "internet", "software", "machine", "aircraft", "phone", "engineer"] },
    { name: "Geography & Places", icon: "🗺️", keywords: ["country", "city", "river", "mountain", "island", "province", "capital", "continent", "sea", "lake", "ocean", "valley", "desert", "gulf", "strait"] },
    { name: "Arts, Culture & Sports", icon: "🎨", keywords: ["music", "movie", "art", "culture", "football", "soccer", "sport", "song", "dance", "traditional", "literature", "game", "painting", "actor", "director", "musician", "athlete", "championship"] }
  ];

  const categories = language === "en" ? enCategories : idCategories;
  const counts: Record<string, number> = {};
  
  categories.forEach(c => {
    counts[c.name] = 0;
  });

  route.forEach(step => {
    const title = step.article.toLowerCase().replace(/_/g, " ");
    for (const cat of categories) {
      if (cat.keywords.some(kw => title.includes(kw))) {
        counts[cat.name]++;
        break;
      }
    }
  });

  const sorted = Object.entries(counts)
    .map(([name, count]) => {
      const icon = categories.find(c => c.name === name)?.icon ?? "🌐";
      return { name, count, icon };
    })
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return [{
      name: language === "en" ? "General Knowledge" : "Pengetahuan Umum",
      count: route.length,
      icon: "🌐"
    }];
  }

  return sorted;
}

export function getDrivingStyle(route: RouteStep[], playerStatus: string, language: "id" | "en") {
  const steps = route.length;
  const t = translations[language];

  let avgReactionTime = 0;
  if (steps > 1) {
    const totalTime = route[steps - 1].timestamp - route[0].timestamp;
    avgReactionTime = totalTime / (steps - 1);
  }

  const uniqueArticles = new Set(route.map(s => s.article)).size;
  const backtracks = steps - uniqueArticles;
  const efficiency = steps > 0 ? Math.round((uniqueArticles / steps) * 100) : 0;

  let style = t.styleSafe;
  let desc = language === "en" 
    ? "Clean and steady navigation progress."
    : "Navigasi bersih dan stabil sepanjang balapan.";

  if (playerStatus === "finished") {
    if (avgReactionTime > 0 && avgReactionTime < 3.5) {
      style = t.styleSpeedster;
      desc = language === "en"
        ? "Extremely fast links navigation with low decision latency."
        : "Navigasi link luar biasa cepat dengan latensi berpikir minimal.";
    } else if (avgReactionTime >= 8.0) {
      style = t.styleThinker;
      desc = language === "en"
        ? "Carefully analyzes each link for the optimal target path."
        : "Menganalisis setiap tautan secara matang demi jalur optimal.";
    } else if (backtracks === 0 && steps > 3) {
      style = t.styleNavigator;
      desc = language === "en"
        ? "Flawless straight run to the destination with zero backtracks."
        : "Jalur mulus tanpa pernah memutar balik atau tersesat.";
    } else if (steps > 15) {
      style = t.styleDrifter;
      desc = language === "en"
        ? "Navigated through many scenic detours before reaching the goal."
        : "Melintasi banyak rute memutar yang dramatis sebelum mencapai finish.";
    }
  } else {
    desc = language === "en"
      ? "Did not complete the race track."
      : "Tidak berhasil menyelesaikan sirkuit balap.";
  }

  return {
    style,
    desc,
    avgReactionTime,
    efficiency,
  };
}

export default function RouteReplay({
  rows,
  winnerId,
  onClose,
  language,
}: RouteReplayProps) {
  const playableRows = useMemo(
    () => rows.filter((row) => row.route.length > 0),
    [rows],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    playableRows.map((row) => row.player.clientId),
  );
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [playerTabs, setPlayerTabs] = useState<Record<string, "route" | "analytics">>({});

  const selectedRows = useMemo(() => 
    playableRows.filter((row) => selectedIds.includes(row.player.clientId)),
    [playableRows, selectedIds]
  );

  const maxSteps = useMemo(() => {
    if (selectedRows.length === 0) return 0;
    return Math.max(...selectedRows.map((r) => r.route.length - 1), 0);
  }, [selectedRows]);

  // Handle auto-play step increments
  useEffect(() => {
    if (!playing) return;

    const intervalTime = 1200 / speed;
    const timer = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= maxSteps) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => window.clearInterval(timer);
  }, [playing, maxSteps, speed]);

  const resetReplay = useCallback(() => {
    setPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  function togglePlayer(clientId: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId];
      
      // Reset playback step when selected list changes to avoid index overflow
      setCurrentStepIndex(0);
      setPlaying(false);
      return next;
    });
  }

  function cycleSpeed() {
    setSpeed((current) => (current === 1 ? 2 : current === 2 ? 4 : 1));
  }

  const togglePlayerTab = (clientId: string, tab: "route" | "analytics") => {
    setPlayerTabs((prev) => ({
      ...prev,
      [clientId]: tab,
    }));
  };

  const t = translations[language];

  return (
    <div
      className="fixed inset-0 z-50 flex bg-charcoal-text/98 px-4 py-4 text-warm-cream sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.compareDesc}
    >
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 overflow-hidden">
        {/* ====== Header ====== */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-cream/15 pb-2.5">
          <div>
            <div
              className="font-black text-lime-accent uppercase tracking-wider"
              style={{ fontSize: "var(--text-heading)", lineHeight: 1 }}
            >
              🏁 {t.compareTitle}
            </div>
            <p className="mt-1 text-warm-cream/70 text-xs font-semibold uppercase tracking-wider">
              {language === "en" ? "Interactive Telemetry Comparison Deck" : "Dek Perbandingan Telemetri Interaktif"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="chunky-press bg-burnt-orange text-warm-cream font-black uppercase text-xs px-5 py-2.5 border-2 border-charcoal-text shadow-[3px_3px_0px_#000] rounded-lg"
          >
            {t.close}
          </button>
        </header>

        {/* ====== Player Selection Deck ====== */}
        <div className="flex flex-wrap items-center gap-2 bg-charcoal-deep/40 p-2.5 rounded-xl border border-warm-cream/10">
          <span className="text-[11px] font-bold text-warm-cream/50 uppercase tracking-widest mr-1.5">
            {language === "en" ? "Select Drivers:" : "Pilih Pembalap:"}
          </span>
          {playableRows.map((row) => {
            const checked = selectedIds.includes(row.player.clientId);
            return (
              <button
                key={row.player.clientId}
                type="button"
                onClick={() => togglePlayer(row.player.clientId)}
                className={`chunky-press font-mono font-black text-xs uppercase px-3 py-1.5 border border-charcoal-text rounded-lg transition ${
                  checked 
                    ? "bg-lime-accent text-charcoal-text shadow-[2px_2px_0px_#000]" 
                    : "bg-charcoal-text border-warm-cream/10 text-warm-cream/60 hover:text-warm-cream"
                }`}
              >
                {checked ? "✓ " : ""}
                {row.player.username}
              </button>
            );
          })}
        </div>

        {/* ====== Main Columns Grid ====== */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
          {selectedRows.map((row) => (
            <ReplayColumn
              key={row.player.clientId}
              row={row}
              winnerId={winnerId}
              currentStepIndex={currentStepIndex}
              activeTab={playerTabs[row.player.clientId] ?? "route"}
              onTabChange={(tab) => togglePlayerTab(row.player.clientId, tab)}
              language={language}
            />
          ))}
        </div>

        {/* ====== Timeline Scrubber & Navigation Deck ====== */}
        <div className="bg-charcoal-deep border border-warm-cream/10 p-4 flex flex-col gap-4" style={{ borderRadius: "var(--radius-input)" }}>
          {/* Scrubber Slider */}
          <div className="flex items-center gap-4 w-full">
            <span className="font-mono text-xs text-warm-cream/50 uppercase font-black shrink-0">START</span>
            <input
              type="range"
              min="0"
              max={maxSteps}
              value={currentStepIndex}
              onChange={(e) => {
                setPlaying(false);
                setCurrentStepIndex(Number(e.target.value));
              }}
              className="flex-1 h-3 bg-charcoal-text border border-warm-cream/15 rounded-lg appearance-none cursor-pointer accent-lime-accent focus:outline-none"
            />
            <span className="font-mono text-xs text-lime-accent font-black shrink-0">GOAL</span>
          </div>

          {/* Scrubber Status & Control Deck */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Step Counter Badge */}
            <div className="font-mono font-bold text-xs uppercase text-warm-cream/70 flex items-center gap-2">
              <span>{t.stepLabel}:</span>
              <span className="bg-charcoal-text text-lime-accent px-2 py-0.5 rounded border border-warm-cream/15 font-black text-sm tabular-nums">
                {currentStepIndex} / {maxSteps}
              </span>
            </div>

            {/* F1 Playback buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setPlaying(false); setCurrentStepIndex(0); }}
                className="chunky-press bg-charcoal-text border border-warm-cream/15 hover:border-warm-cream/40 p-2.5 rounded-lg font-black text-sm uppercase"
                title="First Step"
              >
                ⏮️
              </button>
              <button
                type="button"
                onClick={() => { setPlaying(false); setCurrentStepIndex((prev) => Math.max(0, prev - 1)); }}
                className="chunky-press bg-charcoal-text border border-warm-cream/15 hover:border-warm-cream/40 px-3.5 py-2.5 rounded-lg font-black text-sm uppercase flex items-center gap-1"
              >
                ◀ {t.prevStepBtn}
              </button>

              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                className={`chunky-press px-5 py-2.5 rounded-lg font-mono font-black text-sm uppercase border-2 border-charcoal-text shadow-[3px_3px_0px_#000] text-charcoal-text ${
                  playing ? "bg-playdate-yellow" : "bg-lime-accent"
                }`}
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>

              <button
                type="button"
                onClick={() => { setPlaying(false); setCurrentStepIndex((prev) => Math.min(maxSteps, prev + 1)); }}
                className="chunky-press bg-charcoal-text border border-warm-cream/15 hover:border-warm-cream/40 px-3.5 py-2.5 rounded-lg font-black text-sm uppercase flex items-center gap-1"
              >
                {t.nextStepBtn} ▶
              </button>
              <button
                type="button"
                onClick={() => { setPlaying(false); setCurrentStepIndex(maxSteps); }}
                className="chunky-press bg-charcoal-text border border-warm-cream/15 hover:border-warm-cream/40 p-2.5 rounded-lg font-black text-sm uppercase"
                title="Last Step"
              >
                ⏭️
              </button>
            </div>

            {/* Speed & Reset buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cycleSpeed}
                className="chunky-press bg-charcoal-text border border-warm-cream/15 text-warm-cream font-mono font-black text-xs uppercase px-4 py-2.5 rounded-lg"
              >
                🏎️ {speed}x Speed
              </button>
              <button
                type="button"
                onClick={resetReplay}
                className="chunky-press bg-warm-cream text-charcoal-text border border-charcoal-text font-mono font-black text-xs uppercase px-4 py-2.5 rounded-lg"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReplayColumnProps {
  row: RankedPlayer;
  winnerId: string | null;
  currentStepIndex: number;
  activeTab: "route" | "analytics";
  onTabChange: (tab: "route" | "analytics") => void;
  language: "id" | "en";
}

function ReplayColumn({
  row,
  winnerId,
  currentStepIndex,
  activeTab,
  onTabChange,
  language,
}: ReplayColumnProps) {
  const { player, route } = row;
  const color = avatarColor(player.username);
  
  const visibleIndex = Math.min(currentStepIndex, route.length - 1);
  const stepCount = Math.max(0, route.length - 1);
  
  // Driving style analytics
  const analytics = useMemo(() => 
    getDrivingStyle(route, player.status, language),
    [route, player.status, language]
  );

  const categories = useMemo(() => 
    categorizeRoute(route, language),
    [route, language]
  );

  const badges = computeResultBadges({ player, route, winnerId });

  // Custom neobrutalist status tags
  const statusBadge = useMemo(() => {
    const t = translations[language];
    if (player.status === "finished") {
      return (
        <span className="bg-lime-accent text-charcoal-text border border-charcoal-text font-mono font-black text-[10px] px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_#000]">
          🏁 FINISH
        </span>
      );
    }
    if (player.status === "surrendered") {
      return (
        <span className="bg-burnt-orange text-warm-cream border border-charcoal-text font-mono font-black text-[10px] px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_#000]">
          ❌ DNF
        </span>
      );
    }
    return (
      <span className="bg-playdate-yellow text-charcoal-text border border-charcoal-text font-mono font-black text-[10px] px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_#000] animate-pulse">
        ● PLAYING
      </span>
    );
  }, [player.status, language]);

  const t = translations[language];

  return (
    <section
      className="flex min-h-[360px] flex-col overflow-hidden bg-warm-cream text-charcoal-text border-3 border-charcoal-text shadow-[4px_4px_0px_#000]"
      style={{ borderRadius: "var(--radius-input)" }}
    >
      {/* Column Header Panel */}
      <div className="border-b-2 border-charcoal-text bg-charcoal-text/5 p-3.5">
        <div className="flex items-center gap-3">
          <span
            className="flex shrink-0 items-center justify-center font-extrabold uppercase text-pure-white border-2 border-charcoal-text"
            style={{ width: 38, height: 38, borderRadius: "9999px", background: color, fontSize: 13 }}
            aria-hidden
          >
            {initials(player.username)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-black flex items-center gap-1.5 text-base">
              {winnerId === player.clientId ? "🏆 " : ""}
              {player.username}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {statusBadge}
              {player.elo !== undefined && (
                <span className="font-mono font-extrabold text-[11px] text-charcoal-text/70 uppercase">
                  🏎️ {player.elo} ELO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic driving style banner - permanently visible for instant telemetry wow factor */}
        <div className="mt-3 bg-charcoal-text text-warm-cream p-2 border border-charcoal-text rounded-lg flex items-center gap-2">
          <span className="text-lg shrink-0 font-black animate-bounce">{analytics.style.split(" ")[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="font-mono font-black text-[10px] uppercase text-lime-accent tracking-wider">
              {t.drivingStyle}:
            </div>
            <div className="font-bold text-[11px] truncate text-warm-cream">
              {analytics.style.split(" ").slice(1).join(" ")}
            </div>
          </div>
        </div>

        {/* Tabs selector */}
        <div className="flex gap-1.5 mt-3.5 bg-charcoal-text/10 p-1 rounded-lg border border-charcoal-text/10">
          <button
            type="button"
            onClick={() => onTabChange("route")}
            className={`flex-1 font-mono font-black text-[11px] py-1.5 uppercase transition rounded-md ${
              activeTab === "route"
                ? "bg-charcoal-text text-warm-cream shadow-sm"
                : "text-charcoal-text/60 hover:text-charcoal-text hover:bg-charcoal-text/5"
            }`}
          >
            📊 {t.routeTab}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("analytics")}
            className={`flex-1 font-mono font-black text-[11px] py-1.5 uppercase transition rounded-md ${
              activeTab === "analytics"
                ? "bg-charcoal-text text-warm-cream shadow-sm"
                : "text-charcoal-text/60 hover:text-charcoal-text hover:bg-charcoal-text/5"
            }`}
          >
            ⚡ {t.analyticsTab}
          </button>
        </div>
      </div>

      {/* Column Content View */}
      <div className="flex-1 overflow-y-auto p-3 bg-paper-white relative">
        {activeTab === "route" ? (
          <ol className="flex flex-col gap-2">
            {route.map((step, index) => {
              const visible = index <= visibleIndex;
              const active = index === visibleIndex;
              if (!visible) return null;
              
              const isStart = index === 0;
              const isLastStep = index === route.length - 1;
              const isFinishStep = player.status === "finished" && isLastStep;

              let stepColorClass = "bg-lime-accent text-charcoal-text border border-charcoal-text";
              if (isStart) {
                stepColorClass = "bg-charcoal-text border-2 border-lime-accent text-warm-cream";
              } else if (isFinishStep) {
                stepColorClass = "bg-lime-accent border-2 border-charcoal-text font-black shadow-[2px_2px_0px_#000]";
              } else if (active) {
                stepColorClass = "bg-burnt-orange text-warm-cream border-2 border-charcoal-text shadow-[2px_2px_0px_#000]";
              }

              return (
                <li
                  key={`${step.article}-${index}`}
                  className={`transition duration-150 ${active ? "scale-[1.01]" : "scale-100"}`}
                >
                  <div
                    className={`flex items-baseline justify-between gap-2 p-2.5 rounded-lg font-semibold ${stepColorClass}`}
                  >
                    <span className="font-extrabold text-[12px] truncate">
                      {index + 1}. {step.article.replace(/_/g, " ")}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums opacity-80">
                      ⏱️ {formatTime(step.timestamp)}
                    </span>
                  </div>
                </li>
              );
            })}

            {/* Completion Status Box */}
            {currentStepIndex >= stepCount && (
              <div className="mt-2 border-2 border-dashed border-charcoal-text/25 p-3 rounded-lg flex flex-col gap-1 items-center text-center">
                {player.status === "finished" ? (
                  <>
                    <span className="text-lime-accent font-black text-sm uppercase bg-charcoal-text border border-charcoal-text px-2 py-0.5 rounded shadow-[2px_2px_0px_#000] tracking-wider animate-pulse">
                      🏁 Sirkuit Selesai
                    </span>
                    <p className="text-[11px] font-extrabold text-charcoal-text/75 mt-1">
                      {t.finishedIn
                        .replace("{time}", formatTime(route[route.length - 1]?.timestamp ?? 0))
                        .replace("{clicks}", String(stepCount))}
                    </p>
                  </>
                ) : player.status === "surrendered" ? (
                  <>
                    <span className="text-warm-cream font-black text-sm uppercase bg-burnt-orange border border-charcoal-text px-2 py-0.5 rounded shadow-[2px_2px_0px_#000] tracking-wider">
                      ❌ DNF (Gagal/Menyerah)
                    </span>
                    <p className="text-[11px] font-extrabold text-charcoal-text/75 mt-1 leading-relaxed">
                      {language === "en" ? "Stopped clicking after" : "Berhenti mengetuk setelah"}{" "}
                      <span className="font-black font-mono">{stepCount}</span> {language === "en" ? "moves" : "langkah"}.
                    </p>
                  </>
                ) : null}
              </div>
            )}
          </ol>
        ) : (
          /* Analytics Sub-View */
          <div className="flex flex-col gap-4 font-mono text-xs p-1 animate-fade-in">
            {/* Driving Style Description */}
            <div className="p-3 border-2 border-charcoal-text bg-charcoal-deep text-warm-cream rounded-xl shadow-[3px_3px_0px_#000]">
              <div className="font-black text-[10px] text-lime-accent uppercase tracking-wider mb-0.5">
                {language === "en" ? "TIMING DIAGNOSTIC" : "DIAGNOSIS WAKTU"}
              </div>
              <p className="text-[11px] leading-relaxed font-bold font-sans">
                {analytics.desc}
              </p>
            </div>

            {/* Primary Metrics Group */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 border border-charcoal-text/25 bg-charcoal-text/5 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] font-bold text-charcoal-text/55 uppercase tracking-wider">{t.decisionIndex}</span>
                <span className="font-black text-sm text-charcoal-text">
                  ⏱️ {analytics.avgReactionTime > 0 ? t.secPerClick.replace("{sec}", analytics.avgReactionTime.toFixed(1)) : "—"}
                </span>
              </div>
              <div className="p-2.5 border border-charcoal-text/25 bg-charcoal-text/5 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] font-bold text-charcoal-text/55 uppercase tracking-wider">{t.navEfficiency}</span>
                <span className="font-black text-sm text-charcoal-text">
                  🎯 {analytics.efficiency}%
                </span>
              </div>
            </div>

            {/* Knowledge Categories Progress Bars */}
            <div className="flex flex-col gap-2">
              <h4 className="font-black text-[11px] uppercase tracking-wider text-charcoal-text/60 border-b border-charcoal-text/10 pb-1 flex justify-between">
                <span>{t.topCategories}</span>
                <span className="text-[9px] opacity-75 font-normal">CLKS</span>
              </h4>
              <div className="flex flex-col gap-2.5 mt-1">
                {categories.map((cat, idx) => {
                  const maxCount = Math.max(...categories.map(c => c.count), 1);
                  const percentage = Math.round((cat.count / maxCount) * 100);
                  
                  // F1 Telemetry bar coloring based on index
                  const barColor = idx === 0 
                    ? "bg-lime-accent border border-charcoal-text" 
                    : idx === 1 
                      ? "bg-playdate-yellow border border-charcoal-text" 
                      : idx === 2 
                        ? "bg-burnt-orange border border-charcoal-text text-warm-cream"
                        : "bg-charcoal-text text-warm-cream";
                        
                  return (
                    <div key={cat.name} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[11px] font-bold text-charcoal-text font-sans">
                        <span>{cat.icon} {cat.name}</span>
                        <span className="font-mono font-black">{cat.count}</span>
                      </div>
                      <div className="w-full h-3 bg-charcoal-text/10 rounded-sm border border-charcoal-text/10 overflow-hidden">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result badges list */}
            {badges.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-charcoal-text/10 pt-3">
                <h4 className="font-black text-[11px] uppercase tracking-wider text-charcoal-text/60">
                  {language === "en" ? "AWARDED BADGES" : "LENCANA PRESTASI"}
                </h4>
                <div className="flex flex-wrap gap-1 mt-1 font-sans">
                  {badges.map((badge) => (
                    <AchievementBadgePill key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function AchievementBadgePill({ badge }: { badge: AchievementBadge }) {
  const className =
    badge.tone === "lime"
      ? "bg-lime-accent text-charcoal-text"
      : "border border-warm-gray bg-warm-cream text-charcoal-text";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 font-bold ${className}`}
      style={{ borderRadius: "var(--radius-button)", padding: "3.5px 8.5px", fontSize: "11px" }}
    >
      <span aria-hidden>{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
