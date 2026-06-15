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
import AdContainer from "./AdContainer";
import { translations } from "@/lib/translations";

interface GameProps {
  room: Room;
  currentClientId: string;
  ablyChannel: Ably.RealtimeChannel;
  /** Timestamp ms saat game dimulai. */
  startTime: number;
  clockOffset?: number;
  language: "id" | "en";
}

const MiniLeaderboard = memo(
  ({
    players,
    currentClientId,
    hasBadges,
    language,
  }: {
    players: Room["players"];
    currentClientId: string;
    hasBadges: boolean;
    language: "id" | "en";
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
          aria-label={language === "en" ? "Open Scoreboard" : "Buka Papan Skor"}
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
            {translations[language].scoreboard}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-warm-cream/60 hover:text-warm-cream text-[11px] font-bold"
          >
            {translations[language].close}
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

const TimerDisplay = memo(function TimerDisplay({
  startTime,
  isMatchmaking,
  onTimeout,
  hasSurrendered,
  clockOffset = 0,
  language,
}: {
  startTime: number;
  isMatchmaking: boolean;
  onTimeout?: () => void;
  hasSurrendered: boolean;
  clockOffset?: number;
  language: "id" | "en";
}) {
  const normalizedStartTime = useMemo(() => normalizeStartTime(startTime), [startTime]);
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(normalizedStartTime, clockOffset));

  useEffect(() => {
    if (hasSurrendered) return;

    let timeoutId: number | null = null;

    function tick() {
      const next = getElapsedSeconds(normalizedStartTime, clockOffset);
      setElapsed(next);

      if (isMatchmaking && next >= 300) {
        if (onTimeout) onTimeout();
        return;
      }

      const msUntilNextSecond = 1000 - (((Date.now() + clockOffset) - normalizedStartTime) % 1000);
      timeoutId = window.setTimeout(tick, msUntilNextSecond || 1000);
    }

    tick();

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [normalizedStartTime, isMatchmaking, onTimeout, hasSurrendered, clockOffset]);

  const remaining = isMatchmaking ? Math.max(0, 300 - elapsed) : 0;
  const timeToDisplay = isMatchmaking ? remaining : elapsed;
  const isWarning = isMatchmaking && remaining < 30;

  return (
    <span
      className={`font-extrabold tabular-nums text-charcoal-text ${isWarning ? "timer-pulse-warning" : ""}`}
      style={{
        fontSize: "20px",
        lineHeight: 1,
      }}
      aria-label={
        isMatchmaking
          ? (language === "en" ? "Time left to play" : "Sisa waktu bermain")
          : (language === "en" ? "Elapsed time" : "Waktu yang sudah berjalan")
      }
    >
      {formatElapsed(timeToDisplay)}
    </span>
  );
});

const GameHeader = memo(
  ({
    room,
    hasSurrendered,
    confirmingSurrender,
    startTime,
    isTimeout,
    liveBadges,
    handleSurrenderClick,
    showHelpButton,
    isHelpDisabled,
    handleHelpClick,
    onTimeout,
    clockOffset = 0,
    language,
  }: {
    room: Room;
    hasSurrendered: boolean;
    confirmingSurrender: boolean;
    startTime: number;
    isTimeout: boolean;
    liveBadges: AchievementBadge[];
    handleSurrenderClick: () => void;
    showHelpButton: boolean;
    isHelpDisabled: boolean;
    handleHelpClick: () => void;
    onTimeout?: () => void;
    clockOffset?: number;
    language: "id" | "en";
  }) => {
    const isMatchmaking = !!room.isMatchmaking;

    return (
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
                {language === "en" ? "Target" : "Tujuan"}
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
              {isMatchmaking ? (language === "en" ? "Time Left" : "Sisa Waktu") : (language === "en" ? "Time" : "Waktu")}
            </span>
            <TimerDisplay
              startTime={startTime}
              isMatchmaking={isMatchmaking}
              onTimeout={onTimeout}
              hasSurrendered={hasSurrendered}
              clockOffset={clockOffset}
              language={language}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showHelpButton && (
              <button
                type="button"
                onClick={handleHelpClick}
                disabled={isHelpDisabled}
                className="chunky-press bg-pure-white text-charcoal-text transition disabled:opacity-60 cursor-pointer font-bold"
                style={{
                  border: "1px solid var(--color-warm-gray)",
                  borderRadius: "var(--radius-button)",
                  padding: "8px 12px",
                  fontSize: "13px",
                }}
                title={language === "en" ? "Return to starting article (penalty suspension)" : "Kembali ke awal artikel (denda suspension)"}
              >
                {language === "en" ? "Back to Start 🔁" : "Kembali ke Awal 🔁"}
              </button>
            )}

            <button
              type="button"
              onClick={handleSurrenderClick}
              disabled={hasSurrendered}
              className="shrink-0 transition disabled:opacity-60 cursor-pointer"
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
                ? (language === "en" ? "Done" : "Sudah")
                : confirmingSurrender
                  ? (language === "en" ? "Sure?" : "Yakin?")
                  : (language === "en" ? "Surrender" : "Menyerah")}
            </button>
          </div>
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
            className="border-t border-warm-gray bg-light-beige text-charcoal-text font-semibold"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {isTimeout
              ? (language === "en" ? "⏰ Time's up! Waiting for other players to finish…" : "⏰ Waktu habis! Menunggu pemain lain selesai…")
              : (language === "en" ? "You have surrendered. Waiting for other players to finish…" : "Kamu sudah menyerah. Menunggu pemain lain selesai…")}
          </div>
        )}
      </header>
    );
  },
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
  clockOffset = 0,
  language,
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
  const [suspensionNotice, setSuspensionNotice] = useState<{
    username: string;
    isMe: boolean;
    reason: string;
    duration: number;
  } | null>(null);

  const [mySuspensionReason, setMySuspensionReason] = useState<string | null>(null);
  const [suspensionTimeLeft, setSuspensionTimeLeft] = useState(0);

  useEffect(() => {
    if (!suspensionNotice) return;
    const timer = window.setTimeout(() => setSuspensionNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [suspensionNotice]);

  const suspensionUntilRef = useRef<number | null>(null);

  useEffect(() => {
    const current = me?.suspendedUntil ?? null;
    const prev = suspensionUntilRef.current;
    suspensionUntilRef.current = current;

    // Suspension cleared externally → reset via microtask (avoids sync cascade)
    if (!current) {
      if (prev !== null) {
        void Promise.resolve().then(() => {
          setSuspensionTimeLeft(0);
          setMySuspensionReason(null);
        });
      }
      return;
    }

    const interval = window.setInterval(() => {
      const msLeft = current - (Date.now() + clockOffset);
      if (msLeft <= 0) {
        setSuspensionTimeLeft(0);
        setMySuspensionReason(null);
        return;
      }
      setSuspensionTimeLeft(Math.ceil(msLeft / 1000));
    }, 250);

    return () => window.clearInterval(interval);
  }, [me?.suspendedUntil, clockOffset]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const keyLower = e.key.toLowerCase();
      const isSearchShortcut =
        ((e.ctrlKey || e.metaKey) && (keyLower === "f" || keyLower === "g")) ||
        e.key === "F3";

      if (isSearchShortcut) {
        e.preventDefault();
        e.stopPropagation();
        
        // Cek jika sedang disuspensi untuk menghindari request dobel
        const isSuspendedNow = me?.suspendedUntil && Date.now() + clockOffset < me.suspendedUntil;
        if (isSuspendedNow) return;

        // Panggil endpoint suspensi server
        void fetch("/api/room/suspend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: room.id,
            clientId: currentClientId,
            reason: "ctrl_f",
          }),
        }).catch((err) => console.warn("[suspend] gagal:", err));
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [ablyChannel, me?.suspendedUntil, room.id, currentClientId, clockOffset]);

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
  const [isTimeout, setIsTimeout] = useState(false);

  const [now, setNow] = useState(() => Date.now() + clockOffset);
  useEffect(() => {
    if (Date.now() + clockOffset >= normalizedStartTime) return;

    const id = window.setInterval(() => {
      setNow(Date.now() + clockOffset);
    }, 100);

    return () => window.clearInterval(id);
  }, [normalizedStartTime, clockOffset]);

  const countdownLabel = getCountdownLabel(normalizedStartTime, now);
  const countdownActive = countdownLabel !== null;
  const lastCountdownBeepRef = useRef<string | null>(null);

  useEffect(() => {
    if (!countdownLabel) return;
    if (lastCountdownBeepRef.current === countdownLabel) return;
    lastCountdownBeepRef.current = countdownLabel;
    playCountdownBeep(countdownLabel);
  }, [countdownLabel]);

  // ------- Subscribe game events (cancelled & suspended) -------
  useEffect(() => {
    type GameCancelledData = { reason?: string };
    type PlayerSuspendedData = {
      clientId: string;
      username: string;
      reason: string;
      duration: number;
      suspendedUntil: number;
    };

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

    function handlePlayerSuspended(message: Ably.Message) {
      const data = message.data as PlayerSuspendedData;
      if (!data?.clientId) return;

      playCheatAlarm();

      if (data.clientId === currentClientId) {
        setMySuspensionReason(data.reason);
      } else {
        setSuspensionNotice({
          username: data.username,
          isMe: false,
          reason: data.reason,
          duration: data.duration,
        });
      }
    }

    void ablyChannel.subscribe("game_cancelled", handleGameCancelled);
    void ablyChannel.subscribe("player_suspended", handlePlayerSuspended);

    return () => {
      ablyChannel.unsubscribe("game_cancelled", handleGameCancelled);
      ablyChannel.unsubscribe("player_suspended", handlePlayerSuspended);
    };
  }, [ablyChannel, router, currentClientId]);

  // Efek untuk mensimulasikan emoji dan mendeteksi selesainya bot
  useEffect(() => {
    const bots = room.players.filter((p) => p.isBot && p.status === "playing");
    if (bots.length === 0 || hasSurrendered) return;

    // Simpan daftar emoji yang sudah dipicu untuk menghindari duplikasi
    const triggeredEmojis = new Set<string>();
    let resolveBotCalled = false;

    const checkBotTimeline = () => {
      const elapsed = Math.floor((Date.now() + clockOffset - normalizedStartTime) / 1000);
      if (elapsed < 0) return;

      for (const bot of bots) {
        if (!bot.botTimeline) continue;

        // 1. Kirim emoji terjadwal via Ably
        if (bot.botEmojis) {
          for (const item of bot.botEmojis) {
            const key = `${bot.clientId}-${item.timestamp}-${item.emoji}`;
            if (elapsed >= item.timestamp && !triggeredEmojis.has(key)) {
              triggeredEmojis.add(key);
              void ablyChannel.publish("emoji_reaction", {
                clientId: bot.clientId,
                username: bot.username,
                emojis: [item.emoji],
              }).catch(() => {});
            }
          }
        }

        // 2. Cek apakah bot sudah mencapai finish untuk memicu resolve-bot di server
        const lastStep = bot.botTimeline[bot.botTimeline.length - 1];
        if (elapsed >= lastStep.timestamp && !resolveBotCalled) {
          resolveBotCalled = true;
          void fetch("/api/room/resolve-bot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomId: room.id,
              botClientId: bot.clientId,
              clientId: currentClientId,
            }),
          }).catch((err) => {
            console.warn("Gagal memicu penyelesaian bot:", err);
          });
        }
      }
    };

    checkBotTimeline();
    const interval = setInterval(checkBotTimeline, 500);
    return () => clearInterval(interval);
  }, [room.players, normalizedStartTime, clockOffset, ablyChannel, room.id, hasSurrendered]);

  // ------- Action: navigate -------
  const navigatingRef = useRef(false);

  const handleNavigate = useCallback(
    async (article: string) => {
      if (navigatingRef.current) return;
      if (hasSurrendered) return;
      if (Date.now() + clockOffset < normalizedStartTime) return;
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
    [hasSurrendered, normalizedStartTime, myArticle, room.id, currentClientId, clockOffset],
  );

  // ------- Action: surrender (two-step confirm & auto-timeout) -------
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

  const performSurrender = useCallback(async () => {
    if (hasSurrendered || surrenderingRef.current) return;

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
  }, [hasSurrendered, room.id, currentClientId]);

  const handleSurrenderClick = useCallback(() => {
    if (hasSurrendered || surrenderingRef.current) return;

    if (!confirmingSurrender) {
      setConfirmingSurrender(true);
      return;
    }

    void performSurrender();
  }, [hasSurrendered, confirmingSurrender, performSurrender]);

  const handleTimeout = useCallback(() => {
    setIsTimeout(true);
    void performSurrender();
  }, [performSurrender]);

  const [usingHelp, setUsingHelp] = useState(false);

  const handleHelpClick = useCallback(async () => {
    if (usingHelp || me?.helpUsed || hasSurrendered) return;

    setUsingHelp(true);
    try {
      const res = await fetch("/api/room/use-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        console.warn("[use-help] gagal:", data.error ?? res.status);
      }
    } catch (err) {
      console.warn("[use-help] error jaringan:", err);
    } finally {
      setUsingHelp(false);
    }
  }, [me?.helpUsed, hasSurrendered, room.id, currentClientId, usingHelp]);

  return (
    <div className="flex flex-1 flex-col bg-warm-cream">
      {/* Skyscraper Kiri */}
      <div className="fixed left-2 top-1/2 -translate-y-1/2 z-30 hidden xl:block">
        <AdContainer type="skyscraper-left" />
      </div>

      {/* Skyscraper Kanan */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30 hidden xl:block">
        <AdContainer type="skyscraper-right" />
      </div>
      {suspensionNotice && (
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
            {suspensionNotice.reason === "ctrl_f"
              ? (language === "en"
                  ? `⚠️ ${suspensionNotice.username} suspended for ${suspensionNotice.duration === 120 ? "2 minutes" : "1 minute"} for pressing Ctrl+F (Cheating detected!)`
                  : `⚠️ ${suspensionNotice.username} disuspen ${suspensionNotice.duration === 120 ? "2 menit" : "1 menit"} karena menekan Ctrl+F (Kecurangan terdeteksi!)`)
              : (language === "en"
                  ? `🔄 ${suspensionNotice.username} returned to start and suspended for ${suspensionNotice.duration} seconds.`
                  : `🔄 ${suspensionNotice.username} kembali ke awal dan disuspen ${suspensionNotice.duration} detik.`)}
          </div>
        </div>
      )}

      {countdownActive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/90 px-6 text-center text-warm-cream"
          aria-live="assertive"
          aria-label={language === "en" ? "Race countdown" : "Countdown race"}
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
              {language === "en" ? "Race starting" : "Game dimulai"}
            </div>
          </div>
        </div>
      )}

      {room.gameMode !== "competitive" && (
        <MiniLeaderboard
          players={room.players}
          currentClientId={currentClientId}
          hasBadges={liveBadges.length > 0}
          language={language}
        />
      )}

      <GameHeader
        room={room}
        hasSurrendered={hasSurrendered}
        confirmingSurrender={confirmingSurrender}
        startTime={startTime}
        isTimeout={isTimeout}
        onTimeout={handleTimeout}
        liveBadges={liveBadges}
        handleSurrenderClick={handleSurrenderClick}
        showHelpButton={me ? !me.helpUsed && myArticle !== room.startArticle && me.status === "playing" : false}
        isHelpDisabled={usingHelp || (suspensionTimeLeft > 0)}
        handleHelpClick={handleHelpClick}
        clockOffset={clockOffset}
        language={language}
      />

      {/* ============================================================ */}
      {/* Konten artikel (full-width, page-level scroll) */}
      {/* ============================================================ */}
      <section className="mx-auto w-full max-w-[920px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div
          className="relative chunky bg-pure-white"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          {suspensionTimeLeft > 0 && (
            <div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-charcoal-text/85 text-center p-6"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              <div
                className="chunky-lg bg-pure-white p-6 sm:p-8 flex flex-col items-center gap-4 text-charcoal-text max-w-sm"
                style={{ boxShadow: "var(--shadow-floating)" }}
              >
                <div className="text-4xl" aria-hidden>⏳</div>
                <h3 className="font-black text-xl uppercase tracking-wider text-burnt-orange">
                  {language === "en" ? "ACCESS SUSPENDED" : "AKSES DITANGGUHKAN"}
                </h3>
                <p className="text-sm text-charcoal-text/80 leading-relaxed">
                  {mySuspensionReason === "ctrl_f" 
                    ? (language === "en" ? "Word search (Ctrl+F) detected! Searching words is forbidden for game fairness." : "Pencarian kata (Ctrl+F) terdeteksi! Dilarang mencari kata demi kejujuran permainan.")
                    : (language === "en" ? "You used help to return to start." : "Anda menggunakan bantuan untuk kembali ke awal.")}
                </p>
                <div
                  className="font-black text-4xl tabular-nums bg-charcoal-text text-lime-accent px-4 py-2 mt-2"
                  style={{ borderRadius: "var(--radius-button)" }}
                >
                  {formatElapsed(suspensionTimeLeft)}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-text/50">
                  {language === "en" ? "Wait until penalty expires" : "Tunggu hingga hukuman selesai"}
                </span>
              </div>
            </div>
          )}

          <div className={suspensionTimeLeft > 0 ? "blur-md pointer-events-none select-none" : ""}>
            <WikiArticle
              currentArticle={myArticle}
              endArticle={room.endArticle}
              language={room.language ?? "id"}
              onNavigate={handleNavigate}
              uiLanguage={language}
            />
          </div>
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

function getElapsedSeconds(startTime: number, clockOffset = 0): number {
  return Math.max(0, Math.floor(((Date.now() + clockOffset) - startTime) / 1000));
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
