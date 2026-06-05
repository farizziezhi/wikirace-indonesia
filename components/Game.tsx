"use client";

import type Ably from "ably";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  computeLiveBadges,
  computeMiniLeaderboard,
  type AchievementBadge,
} from "@/lib/achievements";
import { playCountdownBeep, playCheatAlarm } from "@/lib/race-audio";
import type { Room } from "@/lib/types";

import WikiArticle from "./WikiArticle";

interface GameProps {
  room: Room;
  currentClientId: string;
  ablyChannel: Ably.RealtimeChannel;
  /** Timestamp ms saat game dimulai. */
  startTime: number;
}

const MiniLeaderboard = memo(
  ({
    players,
    currentClientId,
    hasBadges,
  }: {
    players: Room["players"];
    currentClientId: string;
    hasBadges: boolean;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        const timer = setTimeout(() => setIsExpanded(true), 0);
        return () => clearTimeout(timer);
      }
    }, []);

    const miniBoard = useMemo(
      () =>
        computeMiniLeaderboard({
          players,
          currentClientId,
          winnerClientId: null,
        }),
      [players, currentClientId],
    );

    const allDone = useMemo(
      () =>
        players.every(
          (p) =>
            p.status === "finished" ||
            p.status === "surrendered" ||
            p.status === "waiting",
        ),
      [players],
    );
    const showMiniBoard = !allDone && players.length > 1;

    if (!showMiniBoard) return null;

    const topClass = hasBadges
      ? "top-[108px] sm:top-[124px]"
      : "top-[72px] sm:top-[80px]";

    if (!isExpanded) {
      const myEntry = miniBoard.find((e) => e.isMe);
      const steps = myEntry ? myEntry.steps : 0;
      return (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={`fixed right-3 ${topClass} z-35 flex items-center justify-center bg-charcoal-text text-warm-cream chunky-press`}
          style={{
            width: 44,
            height: 44,
            borderRadius: "9999px",
            boxShadow: "var(--shadow-floating)",
          }}
          aria-label="Buka Papan Skor"
        >
          <span style={{ fontSize: 16 }}>🏆</span>
          <span
            className="absolute -bottom-1 -right-1 flex items-center justify-center bg-lime-accent text-charcoal-text font-black text-[10px] tabular-nums"
            style={{
              width: 18,
              height: 18,
              borderRadius: "9999px",
              border: "1.5px solid var(--color-charcoal-text)",
            }}
          >
            {steps}
          </span>
        </button>
      );
    }

    return (
      <div
        className={`fixed right-3 ${topClass} z-35 flex w-[200px] flex-col gap-1 bg-charcoal-text text-warm-cream`}
        style={{
          borderRadius: "var(--radius-input)",
          padding: "8px 10px",
          boxShadow: "var(--shadow-floating)",
        }}
      >
        <div className="flex items-center justify-between border-b border-warm-cream/10 pb-1 mb-1">
          <div
            className="font-bold uppercase text-warm-cream/70"
            style={{ fontSize: "10px", letterSpacing: "0.5px" }}
          >
            Papan Skor
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-warm-cream/60 hover:text-warm-cream text-[11px] font-bold"
          >
            Tutup
          </button>
        </div>
        {miniBoard.map((entry) => (
          <div
            key={entry.clientId}
            className="flex items-center gap-2"
            style={{ fontSize: "13px" }}
          >
            <span
              className="flex shrink-0 items-center justify-center font-extrabold uppercase text-charcoal-text"
              style={{
                width: 22,
                height: 22,
                borderRadius: "9999px",
                background: entry.isWinner
                  ? "var(--color-lime-accent)"
                  : entry.isSurrendered
                    ? "var(--color-stone-gray)"
                    : "var(--color-warm-cream)",
                fontSize: "9px",
              }}
              aria-hidden
            >
              {initials(entry.username)}
            </span>
            <span
              className={`min-w-0 flex-1 truncate font-bold ${entry.isMe ? "text-lime-accent" : ""}`}
            >
              {entry.isWinner ? "🏆 " : ""}
              {entry.username}
            </span>
            <span
              className="shrink-0 tabular-nums opacity-80"
              style={{ fontSize: "12px" }}
            >
              {entry.isSurrendered
                ? "■"
                : entry.status === "finished"
                  ? "✓"
                  : `${entry.steps}`}
            </span>
          </div>
        ))}
      </div>
    );
  },
);
MiniLeaderboard.displayName = "MiniLeaderboard";

const GameHeader = memo(
  ({
    room,
    hasSurrendered,
    confirmingSurrender,
    elapsed,
    liveBadges,
    handleSurrenderClick,
  }: {
    room: Room;
    hasSurrendered: boolean;
    confirmingSurrender: boolean;
    elapsed: number;
    liveBadges: AchievementBadge[];
    handleSurrenderClick: () => void;
  }) => (
    <header className="sticky top-0 z-30 border-b border-warm-gray bg-warm-cream pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-[920px] flex-wrap items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 shrink-0">
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

        <div className="flex shrink-0 flex-col items-end leading-none">
          <span
            className="font-bold uppercase text-charcoal-text/60"
            style={{ fontSize: "10px", letterSpacing: "0.6px" }}
          >
            Waktu
          </span>
          <span
            className="font-extrabold tabular-nums text-charcoal-text"
            style={{
              fontSize: "20px",
              lineHeight: 1,
            }}
            aria-label="Waktu yang sudah berjalan"
          >
            {formatElapsed(elapsed)}
          </span>
        </div>

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
            padding: "8px 12px",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          {hasSurrendered
            ? "Sudah"
            : confirmingSurrender
              ? "Yakin?"
              : "Menyerah"}
        </button>
      </div>

      {liveBadges.length > 0 && (
        <div className="border-t border-warm-gray bg-light-beige">
          <div className="mx-auto flex w-full max-w-[920px] gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            {liveBadges.map((badge) => (
              <AchievementBadgePill key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

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
  ),
);
GameHeader.displayName = "GameHeader";

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

  const me = useMemo(
    () => room.players.find((p) => p.clientId === currentClientId),
    [room.players, currentClientId],
  );

  // Optimistic flag — tetap perlukan supaya UI langsung respon sebelum
  // event `room_updated` tiba dari server.
  const [optimisticSurrendered, setOptimisticSurrendered] = useState(false);
  const hasSurrendered =
    me?.status === "surrendered" || optimisticSurrendered;
  const liveBadges = useMemo(
    () => (me ? computeLiveBadges({ route: me.route, status: me.status }) : []),
    [me],
  );

  // ------- Cheat prevention: disable search shortcuts (Ctrl+F, Cmd+F, F3, etc) -------
  const [cheaterInfo, setCheaterInfo] = useState<{
    username: string;
    isMe: boolean;
  } | null>(null);

  useEffect(() => {
    if (!cheaterInfo) return;
    const timer = window.setTimeout(() => setCheaterInfo(null), 4000);
    return () => window.clearTimeout(timer);
  }, [cheaterInfo]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const keyLower = e.key.toLowerCase();
      const isSearchShortcut =
        ((e.ctrlKey || e.metaKey) && (keyLower === "f" || keyLower === "g")) ||
        e.key === "F3";

      if (isSearchShortcut) {
        e.preventDefault();
        e.stopPropagation();
        
        // Show local toast and play sound immediately for responsive feedback
        setCheaterInfo({
          username: me?.username || "Kamu",
          isMe: true,
        });
        playCheatAlarm();

        // Broadcast to all other players in the room via Ably
        void ablyChannel.publish("player_cheated", {
          username: me?.username || "Pemain",
          clientId: currentClientId,
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [ablyChannel, me?.username, currentClientId]);

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

  // ------- Subscribe game events (cancelled & cheated) -------
  useEffect(() => {
    type GameCancelledData = { reason?: string };
    type PlayerCheatedData = { username: string; clientId: string };

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

    function handlePlayerCheated(message: Ably.Message) {
      const data = message.data as PlayerCheatedData;
      if (!data?.username) return;

      // If this client initiated the cheat, ignore the pubsub message (handled locally)
      if (data.clientId === currentClientId) return;

      // Display warning banner for other player cheating and play alarm sound
      setCheaterInfo({
        username: data.username,
        isMe: false,
      });
      playCheatAlarm();
    }

    void ablyChannel.subscribe("game_cancelled", handleGameCancelled);
    void ablyChannel.subscribe("player_cheated", handlePlayerCheated);

    return () => {
      ablyChannel.unsubscribe("game_cancelled", handleGameCancelled);
      ablyChannel.unsubscribe("player_cheated", handlePlayerCheated);
    };
  }, [ablyChannel, router, currentClientId]);

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
      {cheaterInfo && (
        <div
          className="pointer-events-none fixed inset-x-0 top-18 z-50 flex flex-col items-center px-4"
          aria-live="polite"
        >
          <div
            role="status"
            className="pointer-events-auto bg-burnt-orange text-warm-cream font-bold"
            style={{
              borderRadius: "var(--radius-rounded)",
              padding: "12px 16px",
              fontSize: "14px",
              lineHeight: "1.4",
              boxShadow: "var(--shadow-floating)",
              maxWidth: 500,
              textAlign: "center",
            }}
          >
            {cheaterInfo.isMe
              ? "🚫 Pencarian (Ctrl+F) dinonaktifkan untuk mencegah kecurangan!"
              : `⚠️ ${cheaterInfo.username} mencoba mencari kata menggunakan Ctrl+F (Kecurangan terdeteksi!)`}
          </div>
        </div>
      )}

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

      <MiniLeaderboard
        players={room.players}
        currentClientId={currentClientId}
        hasBadges={liveBadges.length > 0}
      />

      <GameHeader
        room={room}
        hasSurrendered={hasSurrendered}
        confirmingSurrender={confirmingSurrender}
        elapsed={elapsed}
        liveBadges={liveBadges}
        handleSurrenderClick={handleSurrenderClick}
      />

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

function AchievementBadgePill({ badge }: { badge: AchievementBadge }) {
  const className =
    badge.tone === "lime"
      ? "bg-lime-accent text-charcoal-text"
      : "border border-warm-gray bg-warm-cream text-charcoal-text";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 font-bold ${className}`}
      style={{
        borderRadius: "var(--radius-button)",
        padding: "3px 10px",
        fontSize: "12px",
        letterSpacing: "0.3px",
      }}
    >
      <span aria-hidden>{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
