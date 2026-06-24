"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WikiArticle from "@/components/WikiArticle";
import AudioToggleWidget from "@/components/AudioToggleWidget";
import type { WikiLanguage } from "@/lib/types";
import { getSavedLanguage } from "@/lib/client-id";
import { playVictoryChime } from "@/lib/race-audio";
import { useUiLang } from "@/lib/use-ui-lang";

type SoloMode = "time-attack" | "free-roam";

// Self-contained Canvas-based Confetti effect
function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Confetti particles definition
    const colors = ["#D2FF00", "#FF6B00", "#B2C73A", "#282C20", "#EBEEE0", "#343A26"];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 5 + 4,
      d: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.08 + 0.02,
      tiltAngle: 0,
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 12;

        // Reset particle to top if it goes off screen
        if (p.y > height) {
          p.x = Math.random() * width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function SoloPlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startArticle = searchParams.get("start") ?? "";
  const endArticle = searchParams.get("end") ?? "";
  const mode = (searchParams.get("mode") ?? "time-attack") as SoloMode;
  const language = (searchParams.get("lang") ?? "id") as WikiLanguage;
  const estimatedDepth = parseInt(searchParams.get("depth") ?? "-1", 10);

  const [currentArticle, setCurrentArticle] = useState(startArticle);
  const [clicks, setClicks] = useState(0);
  const uiLanguage = useUiLang();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [route, setRoute] = useState<string[]>([startArticle]);
  const [startTime] = useState<number | null>(() => Date.now());
  const [copied, setCopied] = useState(false);

  // Daily Challenge States
  const [dailyStreak, setDailyStreak] = useState<number | null>(null);
  const [dailyMessage, setDailyMessage] = useState<string | null>(null);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const isDaily = searchParams.get("daily") === "true";

  useEffect(() => {
    if (finished && isDaily) {
      void triggerDailyCompletion();
    }
  }, [finished, isDaily]);

  useEffect(() => {
    if (finished) {
      playVictoryChime();
    }
  }, [finished]);

  async function triggerDailyCompletion() {
    setDailyLoading(true);
    setDailyError(null);
    try {
      const res = await fetch("/api/daily/complete", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        let errText = data.error ?? "Gagal menyimpan tantangan harian.";
        if (res.status === 401) {
          errText = uiLanguage === "en"
            ? "Please log in on the homepage to record your Daily Streak."
            : "Silakan login di halaman beranda untuk mencatat Streak Harian Anda.";
        }
        setDailyError(errText);
      } else {
        setDailyStreak(data.streak);
        setDailyMessage(
          uiLanguage === "en"
            ? (data.streakUpdated
                ? "Daily challenge completed! Your streak has increased."
                : "Daily challenge already completed today.")
            : data.message
        );
      }
    } catch (err) {
      console.error(err);
      setDailyError(
        uiLanguage === "en"
          ? "Failed to connect to the server to save daily challenge."
          : "Gagal menghubungi server untuk menyimpan tantangan harian."
      );
    } finally {
      setDailyLoading(false);
    }
  }

  const timerRef = useRef<number | null>(null);

  // Timer logic for both modes (used to count time-attack or track duration in free-roam)
  useEffect(() => {
    if (startTime == null || finished) return;

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [startTime, finished]);

  // Handle navigation click
  function handleNavigate(article: string) {
    if (finished) return;

    // Avoid double clicks or loops on exact same page
    if (article === currentArticle) return;

    setCurrentArticle(article);
    setClicks((prev) => prev + 1);
    setRoute((prev) => [...prev, article]);

    // Check if player reached the target article
    if (article.toLowerCase() === endArticle.toLowerCase()) {
      setFinished(true);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    }
  }

  function handleRestart() {
    router.push(`/solo?lang=${language}`);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate Wordle-like share text
  function handleShare() {
    const minClicksText = estimatedDepth === -1 ? "?" : estimatedDepth;
    const shareText = `WikiRace Indonesia — Latihan Solo (${language.toUpperCase()})
Rute: ${startArticle} ➔ ${endArticle}
Waktu: ${formatTime(elapsedSeconds)} | Klik: ${clicks} (Jarak minimum: ${minClicksText})

Jalur penelusuran saya:
${route.join(" ➔ ")}

Mainkan gratis di: https://wikiraceid.web.id`;

    void navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // Calculate player performance rating
  function getPerformanceRating() {
    if (estimatedDepth === -1) {
      return uiLanguage === "en" ? "Custom Explorer" : "Penjelajah Kustom";
    }
    if (clicks <= estimatedDepth) {
      return uiLanguage === "en" ? "Perfect! Shortest Route" : "Sempurna! Rute Terpendek";
    }
    if (clicks <= estimatedDepth + 2) {
      return uiLanguage === "en" ? "Efficient Explorer" : "Penjelajah Efisien";
    }
    return uiLanguage === "en" ? "Steady Explorer" : "Penjelajah Tangguh";
  }

  if (!startArticle || !endArticle) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-warm-cream px-6">
        <div className="text-center chunky p-6 bg-pure-white max-w-sm">
          <p className="text-charcoal-text font-bold" style={{ fontSize: "16px" }}>
            {uiLanguage === "en" ? "Invalid practice session. Start from Solo Lobby." : "Sesi latihan tidak valid. Mulai dari Lobby Solo."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/solo")}
            className="btn-primary mt-4 w-full"
          >
            {uiLanguage === "en" ? "Back to Lobby" : "Kembali ke Lobby"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-warm-cream">
      {/* Dynamic Confetti Shower */}
      <Confetti active={finished} />

      {/* INSTRUMENT HUD PANEL */}
      <header className="sticky top-0 z-30 bg-charcoal-text text-warm-cream shadow-lifted">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-very-dark px-4 py-3 md:py-2.5 gap-3">
          {/* Left Block: Exit, Mode Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/solo")}
              className="text-warm-cream/80 hover:text-lime-accent font-bold transition flex items-center gap-1.5"
              style={{ fontSize: "13px" }}
            >
              ← Keluar
            </button>
            <div className="h-4 w-px bg-very-dark" />
            <AudioToggleWidget dark />
            <div className="h-4 w-px bg-very-dark" />
            <span
              className="px-2 py-0.5 text-[10px] font-black tracking-widest rounded bg-very-dark text-lime-accent uppercase"
            >
              {mode === "time-attack" ? "⏱️ Time Attack" : "🧭 Free Roam"}
            </span>
          </div>

          {/* Center Block: Active Target Indicator */}
          <div className="flex items-center justify-center bg-very-dark px-3 py-1.5 rounded-lg border border-lime-soft/30 max-w-full md:max-w-md overflow-hidden flex-1 md:mx-6">
            <span className="text-[11px] font-bold text-warm-cream/60 uppercase tracking-wide mr-1.5 shrink-0">Target:</span>
            <span className="font-extrabold text-lime-accent text-sm truncate">{endArticle}</span>
          </div>

          {/* Right Block: Counters (Clicks & Time) */}
          <div className="flex items-center justify-end gap-5 font-mono text-sm shrink-0">
            {/* Click Odometer */}
            <div className="flex items-center gap-2">
              <span className="text-warm-cream/50 text-xs uppercase font-sans font-bold">Clicks:</span>
              <span className="bg-very-dark px-2.5 py-1 rounded text-base font-black text-warm-cream border border-very-dark select-none tabular-nums">
                {clicks}
              </span>
            </div>

            {/* Stop watch */}
            <div className="flex items-center gap-2">
              <span className="text-warm-cream/50 text-xs uppercase font-sans font-bold">Time:</span>
              <span className={`bg-very-dark px-2.5 py-1 rounded text-base font-black border select-none tabular-nums ${mode === "time-attack" ? "text-lime-accent border-lime-soft/20" : "text-warm-cream/80 border-very-dark"}`}>
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Accordion Breadcrumb Path Drawer */}
        <details className="group border-t border-very-dark bg-very-dark/50">
          <summary className="flex items-center justify-between px-4 py-1.5 cursor-pointer text-xs font-bold text-warm-cream/60 hover:text-warm-cream select-none transition">
            <span className="flex items-center gap-1.5">
              <span>Jalur penelusuran saat ini ({route.length} artikel)</span>
            </span>
            <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
          </summary>
          <div className="px-4 py-3 text-xs bg-very-dark/80 text-warm-cream/90 max-h-24 overflow-y-auto leading-relaxed border-t border-very-dark border-dashed">
            {route.map((art, idx) => (
              <span key={idx}>
                {idx > 0 && <span className="text-lime-accent/50 font-bold mx-1"> ➔ </span>}
                <span className={idx === route.length - 1 ? "text-lime-accent font-extrabold" : ""}>{art}</span>
              </span>
            ))}
          </div>
        </details>
      </header>

      {/* VICTORY SCREEN PREMIUM OVERLAY */}
      {finished && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/90 px-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div
            className="relative overflow-hidden w-full max-w-[530px] bg-charcoal-deep p-6 sm:p-8 my-8 text-warm-cream border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
            style={{
              borderRadius: "var(--radius-input)",
              paddingTop: "24px"
            }}
          >
            <div className="text-center mb-6 mt-3">
              <span className="text-5xl" aria-hidden>🏆</span>
              <h2
                className="mt-3 font-black text-lime-accent uppercase tracking-tight"
                style={{ fontSize: "clamp(24px, 6vw, 36px)", lineHeight: 1.1 }}
              >
                {uiLanguage === "en" ? "Practice Completed!" : "Latihan Selesai!"}
              </h2>
              <p className="text-burnt-orange font-black text-sm uppercase tracking-wider mt-1.5 animate-pulse">
                {getPerformanceRating()}
              </p>
            </div>

            {isDaily && (
              <div className="mb-6 p-4 bg-charcoal-text text-warm-cream border-2 border-lime-accent/30 shadow-[3px_3px_0px_#000] rounded-xl relative overflow-hidden text-left font-mono">
                <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-lime-accent to-lime-deep opacity-80" />
                <div className="flex items-center justify-between">
                  <span className="bg-lime-accent text-charcoal-text font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                    🔥 {uiLanguage === "en" ? "Daily Challenge" : "Tantangan Harian"}
                  </span>
                  {dailyStreak !== null && (
                    <span className="text-xs font-black uppercase text-lime-accent animate-pulse">
                      🔥 {dailyStreak} {uiLanguage === "en" ? "Day Streak" : "Hari Streak"}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {dailyLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="border-warm-cream border-t-transparent animate-spin w-4 h-4 rounded-full border-2" />
                      <span className="text-[11px] text-warm-cream/50 uppercase tracking-wide font-bold">
                        {uiLanguage === "en" ? "Saving progress..." : "Menyimpan rekor..."}
                      </span>
                    </div>
                  ) : dailyError ? (
                    <div className="text-xs text-burnt-orange font-bold">
                      ⚠️ {dailyError}
                    </div>
                  ) : dailyMessage ? (
                    <div className="text-xs text-lime-accent font-bold leading-normal">
                      🎉 {dailyMessage}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6 font-mono">
              <div className="bg-charcoal-text p-3 text-center rounded-lg border border-lime-accent/15 flex flex-col justify-center shadow-[2px_2px_0px_#000]">
                <span className="text-[9px] uppercase font-bold text-warm-cream/50">Clicks</span>
                <span className="text-2xl font-black text-lime-accent mt-0.5 tabular-nums">{clicks}</span>
                <span className="text-[9px] text-warm-cream/40 mt-0.5">
                  Min: {estimatedDepth === -1 ? "?" : estimatedDepth}
                </span>
              </div>

              <div className="bg-charcoal-text p-3 text-center rounded-lg border border-lime-accent/15 flex flex-col justify-center shadow-[2px_2px_0px_#000]">
                <span className="text-[9px] uppercase font-bold text-warm-cream/50">Time</span>
                <span className="text-2xl font-black text-lime-accent mt-0.5 tabular-nums">
                  {formatTime(elapsedSeconds)}
                </span>
                <span className="text-[9px] text-warm-cream/40 mt-0.5">elapsed</span>
              </div>

              <div className="bg-charcoal-text p-3 text-center rounded-lg border border-lime-accent/15 flex flex-col justify-center shadow-[2px_2px_0px_#000]">
                <span className="text-[9px] uppercase font-bold text-warm-cream/50">Pace</span>
                <span className="text-2xl font-black text-lime-accent mt-0.5 tabular-nums">
                  {(elapsedSeconds / Math.max(clicks, 1)).toFixed(1)}s
                </span>
                <span className="text-[9px] text-warm-cream/40 mt-0.5">per click</span>
              </div>
            </div>

            {/* Visual Flow Track Map */}
            <div className="border border-warm-cream/15 rounded-lg p-4 bg-charcoal-text mb-6 font-mono text-xs">
              <span className="block text-[10px] font-bold text-warm-cream/60 uppercase tracking-wide mb-2">
                {uiLanguage === "en" ? "PATH HISTORY" : "RIWAYAT JALUR"} ({route.length} {uiLanguage === "en" ? "PAGES" : "HALAMAN"}):
              </span>
              <div className="max-h-36 overflow-y-auto text-xs scrollbar-thin">
                <div className="flex flex-col gap-2">
                  {route.map((art, idx) => (
                    <div key={idx} className="flex items-center">
                      <span
                        className={`inline-flex items-center justify-center font-bold text-[9px] rounded-full w-4.5 h-4.5 shrink-0 ${
                          idx === 0
                            ? "bg-warm-cream text-charcoal-text"
                            : idx === route.length - 1
                            ? "bg-lime-accent text-charcoal-text"
                            : "bg-warm-cream/20 text-warm-cream"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className={`ml-2 font-bold truncate ${idx === route.length - 1 ? "text-lime-accent underline decoration-2 decoration-lime-accent/50 font-black" : "text-warm-cream/80"}`}>
                        {art.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Toast Notification inside modal */}
            {copied && (
              <div className="bg-lime-accent text-charcoal-text text-xs font-black text-center py-2.5 px-4 mb-4 rounded-md animate-fade-in flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000]">
                <span>✓</span>
                <span>{uiLanguage === "en" ? "STATS COPIED TO CLIPBOARD!" : "STATISTIK DISALIN KE CLIPBOARD!"}</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="chunky-press btn-primary flex-1 py-3 text-sm font-black flex items-center justify-center gap-2 border-2 border-charcoal-text shadow-[3px_3px_0px_#000]"
              >
                <span>SHARE</span>
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="chunky-press btn-white py-3 text-sm font-black flex-1 border-2 border-charcoal-text shadow-[3px_3px_0px_#000]"
              >
                {uiLanguage === "en" ? "PLAY AGAIN" : "MAIN LAGI"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="chunky-press btn-white py-3 text-sm font-black flex-1 border-2 border-charcoal-text shadow-[3px_3px_0px_#000]"
              >
                {uiLanguage === "en" ? "HOME" : "BERANDA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wikipedia Render Area */}
      <div className="flex flex-1 flex-col px-4 py-6 lg:px-8">
        <WikiArticle
          currentArticle={currentArticle}
          endArticle={endArticle}
          language={language}
          onNavigate={handleNavigate}
          uiLanguage={uiLanguage}
        />
      </div>
    </main>
  );
}

export default function SoloPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-warm-cream px-6">
          <div className="text-center">
            <div
              className="border-charcoal-text border-t-transparent animate-spin w-8 h-8 mx-auto mb-3"
              style={{ borderWidth: 4, borderRadius: "50%" }}
            />
            <p className="text-charcoal-text font-bold" style={{ fontSize: "16px" }}>
              Loading...
            </p>
          </div>
        </main>
      }
    >
      <SoloPlayContent />
    </Suspense>
  );
}