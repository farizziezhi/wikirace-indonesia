"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WikiArticle from "@/components/WikiArticle";
import type { WikiLanguage } from "@/lib/types";

type SoloMode = "time-attack" | "free-roam";

export default function SoloPlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startArticle = searchParams.get("start") ?? "";
  const endArticle = searchParams.get("end") ?? "";
  const mode = (searchParams.get("mode") ?? "time-attack") as SoloMode;
  const language = (searchParams.get("lang") ?? "id") as WikiLanguage;
  const estimatedDepth = parseInt(searchParams.get("depth") ?? "3", 10);

  const [currentArticle, setCurrentArticle] = useState(startArticle);
  const [clicks, setClicks] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [route, setRoute] = useState<string[]>([startArticle]);

  const timerRef = useRef<number | null>(null);

  // Start timer on mount for time-attack
  useEffect(() => {
    if (mode === "time-attack") {
      setStartTime(Date.now());
    }
  }, [mode]);

  // Timer tick for time-attack
  useEffect(() => {
    if (mode !== "time-attack" || !startTime || finished) return;

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [mode, startTime, finished]);

  // Handle navigation
  function handleNavigate(article: string) {
    if (finished) return;

    setCurrentArticle(article);
    setClicks((prev) => prev + 1);
    setRoute((prev) => [...prev, article]);

    // Check if reached end
    if (article === endArticle) {
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

  if (!startArticle || !endArticle) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-warm-cream px-6">
        <div className="text-center">
          <p className="text-charcoal-text" style={{ fontSize: "16px" }}>
            Invalid solo session. Please start from /solo.
          </p>
          <button
            type="button"
            onClick={() => router.push("/solo")}
            className="btn-primary mt-4"
          >
            Back to Solo Mode
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-warm-cream">
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-warm-cream px-4 py-3 shadow-sm"
        style={{ borderColor: "var(--color-warm-gray)" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/solo")}
            className="text-charcoal-text/70 hover:text-charcoal-text"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            ← Exit
          </button>
          <div className="h-6 w-px bg-warm-gray" />
          <span
            className="font-bold uppercase text-charcoal-text/70"
            style={{ fontSize: "12px", letterSpacing: "0.05em" }}
          >
            {mode === "time-attack" ? "⏱️ Time Attack" : "🧭 Free Roam"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Clicks counter */}
          <div className="flex items-center gap-2">
            <span className="text-charcoal-text/70" style={{ fontSize: "14px" }}>
              Clicks:
            </span>
            <span
              className="font-bold tabular-nums text-charcoal-text"
              style={{ fontSize: "18px" }}
            >
              {clicks}
            </span>
          </div>

          {/* Timer (time-attack only) */}
          {mode === "time-attack" && (
            <>
              <div className="h-6 w-px bg-warm-gray" />
              <div className="flex items-center gap-2">
                <span className="text-charcoal-text/70" style={{ fontSize: "14px" }}>
                  Time:
                </span>
                <span
                  className="font-bold tabular-nums text-charcoal-text"
                  style={{ fontSize: "18px" }}
                >
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Finish modal */}
      {finished && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/80 px-4"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-md bg-warm-cream p-6"
            style={{
              borderRadius: "var(--radius-input)",
              boxShadow: "var(--shadow-floating)",
            }}
          >
            <h2
              className="mb-4 font-black text-charcoal-text"
              style={{ fontSize: "28px" }}
            >
              🎉 Selesai!
            </h2>

            <div className="mb-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-text/70" style={{ fontSize: "16px" }}>
                  Total Clicks:
                </span>
                <span
                  className="font-bold tabular-nums text-charcoal-text"
                  style={{ fontSize: "24px" }}
                >
                  {clicks}
                </span>
              </div>

              {mode === "time-attack" && (
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-text/70" style={{ fontSize: "16px" }}>
                    Time:
                  </span>
                  <span
                    className="font-bold tabular-nums text-charcoal-text"
                    style={{ fontSize: "24px" }}
                  >
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              )}

              <div
                className="mt-2 border-t pt-3"
                style={{ borderColor: "var(--color-warm-gray)" }}
              >
                <span
                  className="mb-2 block text-charcoal-text/70"
                  style={{ fontSize: "14px" }}
                >
                  Route ({route.length} articles):
                </span>
                <div
                  className="max-h-32 overflow-y-auto text-charcoal-text"
                  style={{ fontSize: "13px", lineHeight: 1.6 }}
                >
                  {route.map((article, idx) => (
                    <div key={idx}>
                      {idx > 0 && <span className="text-charcoal-text/40">→ </span>}
                      {article}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="btn-primary flex-1"
              >
                Main Lagi
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="btn-white flex-1"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game content */}
      <div className="flex flex-1 flex-col px-4 py-6 lg:px-8">
        <WikiArticle
          currentArticle={currentArticle}
          endArticle={endArticle}
          language={language}
          onNavigate={handleNavigate}
        />
      </div>
    </main>
  );
}
