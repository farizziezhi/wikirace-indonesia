"use client";

import type Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { playCountdownBeep } from "@/lib/race-audio";
import type { Room } from "@/lib/types";

import WikiArticle from "./WikiArticle";

interface GameProps {
  room: Room;
  currentClientId: string;
  ablyChannel: Ably.RealtimeChannel;
  /** Timestamp ms saat game dimulai. */
  startTime: number;
}

/**
 * Layar gameplay aktif (room.status === 'playing').
 *
 * Layout fokus tinggi:
 * - Sticky top bar berisi ROOM code, artikel tujuan, timer, dan tombol Menyerah.
 *   Bar tetap menempel di viewport saat scroll → pemain selalu lihat target.
 * - Konten artikel Wikipedia mengisi seluruh lebar page — tidak ada panel kanan
 *   yang menampilkan posisi pemain lain. Sengaja: bikin lebih deg-degan karena
 *   pemain tidak tahu sudah ketinggalan atau memimpin.
 *
 * Subscribe Ably:
 * - `game_cancelled` → toast + redirect ke landing page.
 * - `player_moved`, `game_won`, `game_surrendered` di-handle oleh parent
 *   (RoomPage) untuk update state global / switch ke Results.
 */
export default function Game({
  room,
  currentClientId,
  ablyChannel,
  startTime,
}: GameProps) {
  const router = useRouter();

  const me = room.players.find((p) => p.clientId === currentClientId);

  // Optimistic flag — tetap perlukan supaya UI langsung respon sebelum
  // event `room_updated` tiba dari server.
  const [optimisticSurrendered, setOptimisticSurrendered] = useState(false);
  const hasSurrendered =
    me?.status === "surrendered" || optimisticSurrendered;

  // ------- Current article (saya) — optimistic -------
  const [myArticle, setMyArticle] = useState<string>(
    me?.currentArticle || room.startArticle,
  );

  // Re-sync kalau server kasih artikel baru (mis. setelah re-fetch).
  const lastServerArticleRef = useRef<string>(me?.currentArticle ?? "");
  useEffect(() => {
    const serverArticle = me?.currentArticle ?? "";
    if (serverArticle && serverArticle !== lastServerArticleRef.current) {
      lastServerArticleRef.current = serverArticle;
      setMyArticle(serverArticle);
    }
  }, [me?.currentArticle]);

  const normalizedStartTime = normalizeStartTime(startTime);
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(normalizedStartTime));
  useEffect(() => {
    let timeoutId: number | null = null;

    function tick() {
      setElapsed((prev) => {
        const next = getElapsedSeconds(normalizedStartTime);
        return next === prev ? prev : next;
      });

      const msUntilNextSecond = 1000 - ((Date.now() - normalizedStartTime) % 1000);
      timeoutId = window.setTimeout(tick, msUntilNextSecond || 1000);
    }

    tick();

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [normalizedStartTime]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Date.now() >= normalizedStartTime) return;

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => window.clearInterval(id);
  }, [normalizedStartTime]);

  const countdownLabel = getCountdownLabel(normalizedStartTime, now);
  const countdownActive = countdownLabel !== null;
  const lastCountdownBeepRef = useRef<string | null>(null);

  useEffect(() => {
    if (!countdownLabel) return;
    if (lastCountdownBeepRef.current === countdownLabel) return;
    lastCountdownBeepRef.current = countdownLabel;
    playCountdownBeep(countdownLabel);
  }, [countdownLabel]);

  // ------- Subscribe game_cancelled -------
  useEffect(() => {
    type GameCancelledData = { reason?: string };

    function handleGameCancelled(message: Ably.Message) {
      const data = (message.data as GameCancelledData) ?? {};
      const reason =
        data.reason === "host_left"
          ? "Host keluar, game dibatalkan."
          : "Game dibatalkan.";
      try {
        window.sessionStorage.setItem("wikirace:toast", reason);
      } catch {
        // ignore
      }
      router.push("/");
    }

    void ablyChannel.subscribe("game_cancelled", handleGameCancelled);
    return () => {
      ablyChannel.unsubscribe("game_cancelled", handleGameCancelled);
    };
  }, [ablyChannel, router]);

  // ------- Action: navigate -------
  const navigatingRef = useRef(false);

  const handleNavigate = useCallback(
    async (article: string) => {
      if (navigatingRef.current) return;
      if (hasSurrendered) return;
      if (Date.now() < normalizedStartTime) return;
      if (article === myArticle) return;

      navigatingRef.current = true;
      setMyArticle(article); // optimistic

      try {
        const res = await fetch("/api/room/navigate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: room.id,
            clientId: currentClientId,
            article,
          }),
        });
        if (!res.ok) {
          const data: { error?: string } = await res
            .json()
            .catch(() => ({}));
          console.warn("[navigate] gagal:", data.error ?? res.status);
        }
      } catch (err) {
        console.warn("[navigate] error jaringan:", err);
      } finally {
        navigatingRef.current = false;
      }
    },
    [hasSurrendered, normalizedStartTime, myArticle, room.id, currentClientId],
  );

  // ------- Action: surrender (two-step confirm) -------
  const surrenderingRef = useRef(false);
  const [confirmingSurrender, setConfirmingSurrender] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  // Reset state "konfirmasi" otomatis setelah 3 detik kalau user tidak klik lagi.
  useEffect(() => {
    if (!confirmingSurrender) return;
    confirmTimerRef.current = window.setTimeout(
      () => setConfirmingSurrender(false),
      3000,
    );
    return () => {
      if (confirmTimerRef.current) {
        window.clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
    };
  }, [confirmingSurrender]);

  const handleSurrenderClick = useCallback(async () => {
    if (hasSurrendered || surrenderingRef.current) return;

    if (!confirmingSurrender) {
      setConfirmingSurrender(true);
      return;
    }

    surrenderingRef.current = true;
    setConfirmingSurrender(false);
    setOptimisticSurrendered(true);

    try {
      const res = await fetch("/api/room/surrender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        console.warn("[surrender] gagal:", data.error ?? res.status);
        // Roll back optimistic kalau server tolak.
        setOptimisticSurrendered(false);
      }
    } catch (err) {
      console.warn("[surrender] error jaringan:", err);
      setOptimisticSurrendered(false);
    } finally {
      surrenderingRef.current = false;
    }
  }, [
    hasSurrendered,
    confirmingSurrender,
    room.id,
    currentClientId,
  ]);

  return (
    <div className="flex flex-1 flex-col bg-warm-cream">
      {countdownActive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/90 px-6 text-center text-warm-cream"
          aria-live="assertive"
          aria-label="Countdown race"
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="font-black tabular-nums"
              style={{
                fontSize: "clamp(88px, 22vw, 180px)",
                lineHeight: 0.9,
                letterSpacing: countdownLabel === "GO" ? "0.04em" : "0",
              }}
            >
              {countdownLabel}
            </div>
            <div
              className="font-bold uppercase text-lime-accent"
              style={{ fontSize: "14px", letterSpacing: "0.18em" }}
            >
              Race starting
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Sticky top bar */}
      {/* ============================================================ */}
      <header
        className="sticky top-0 z-30 border-b border-warm-gray bg-warm-cream"
      >
        <div className="mx-auto flex w-full max-w-[920px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          {/* Kiri: room code + tujuan */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="shrink-0 bg-lime-accent px-2 py-1 font-bold text-charcoal-text tabular-nums"
              style={{
                borderRadius: "var(--radius-button)",
                fontSize: "13px",
                letterSpacing: "0.6px",
              }}
              title={`Room ${room.id}`}
            >
              {room.id}
            </span>
            <div className="flex min-w-0 flex-col">
              <span
                className="font-bold uppercase text-charcoal-text/60"
                style={{ fontSize: "11px", letterSpacing: "0.6px" }}
              >
                Tujuan
              </span>
              <span
                className="truncate font-extrabold text-charcoal-text"
                style={{
                  fontSize: "var(--text-subheading)",
                  lineHeight: 1.1,
                }}
                title={room.endArticle}
              >
                {room.endArticle}
              </span>
            </div>
          </div>

          {/* Tengah/kanan: timer */}
          <div className="flex flex-col items-end leading-none">
            <span
              className="font-bold uppercase text-charcoal-text/60"
              style={{ fontSize: "11px", letterSpacing: "0.6px" }}
            >
              Waktu
            </span>
            <span
              className="font-extrabold tabular-nums text-charcoal-text"
              style={{
                fontSize: "var(--text-heading)",
                lineHeight: 1,
              }}
              aria-label="Waktu yang sudah berjalan"
            >
              {formatElapsed(elapsed)}
            </span>
          </div>

          {/* Tombol Menyerah */}
          <button
            type="button"
            onClick={handleSurrenderClick}
            disabled={hasSurrendered}
            className="shrink-0 transition disabled:opacity-60"
            style={{
              border: "1px solid var(--color-warm-gray)",
              background: hasSurrendered
                ? "var(--color-warm-gray)"
                : confirmingSurrender
                  ? "var(--color-charcoal-text)"
                  : "var(--color-warm-cream)",
              color: confirmingSurrender
                ? "var(--color-warm-cream)"
                : "var(--color-charcoal-text)",
              borderRadius: "var(--radius-button)",
              padding: "10px 16px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {hasSurrendered
              ? "Sudah menyerah"
              : confirmingSurrender
                ? "Yakin? Klik lagi"
                : "Menyerah"}
          </button>
        </div>

        {/* Banner saat sudah menyerah — info ke pemain bahwa tinggal nunggu */}
        {hasSurrendered && (
          <div
            className="border-t border-warm-gray bg-light-beige text-charcoal-text"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            Kamu sudah menyerah. Menunggu pemain lain selesai…
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* Konten artikel (full-width, page-level scroll) */}
      {/* ============================================================ */}
      <section className="mx-auto w-full max-w-[920px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div
          className="chunky bg-pure-white"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <WikiArticle
            currentArticle={myArticle}
            endArticle={room.endArticle}
            language={room.language ?? "id"}
            onNavigate={handleNavigate}
          />
        </div>
      </section>
    </div>
  );
}

function normalizeStartTime(value: number): number {
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

function getElapsedSeconds(startTime: number): number {
  return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
}

function getCountdownLabel(
  startTime: number,
  now: number,
): "3" | "2" | "1" | "GO" | null {
  const remaining = startTime - now;
  if (remaining <= 0) return null;
  if (remaining > 2000) return "3";
  if (remaining > 1000) return "2";
  if (remaining > 250) return "1";
  return "GO";
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
