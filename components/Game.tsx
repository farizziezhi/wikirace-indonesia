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
import { playCountdownBeep, playCheatAlarm, playPitStopSound, playPowerUpEquippedSound, playOilSplatSound } from "@/lib/race-audio";
import type { Room } from "@/lib/types";
import { getPlayerToken } from "@/lib/client-id";
import { Lightning, Check, ArrowCounterClockwise } from "@phosphor-icons/react";

import WikiArticle from "./WikiArticle";
import AdContainer from "./AdContainer";
import AudioToggleWidget from "./AudioToggleWidget";
import LanguageToggle from "./LanguageToggle";
import { translations } from "@/lib/translations";
import { useUiLang } from "@/lib/use-ui-lang";

interface GameProps {
  room: Room;
  currentClientId: string;
  ablyChannel: Ably.RealtimeChannel;
  /** Timestamp ms saat game dimulai. */
  startTime: number;
  clockOffset?: number;
}

const MiniLeaderboard = memo(
  ({
    players,
    currentClientId,
    hasBadges,
    uiLang,
  }: {
    players: Room["players"];
    currentClientId: string;
    hasBadges: boolean;
    uiLang: "id" | "en";
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
          aria-label={uiLang === "en" ? "Open Scoreboard" : "Buka Papan Skor"}
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
            {translations[uiLang].scoreboard}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-warm-cream/60 hover:text-warm-cream text-[11px] font-bold"
          >
            {translations[uiLang].close}
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
  timeLimit = 0,
  onTimeout,
  hasSurrendered,
  clockOffset = 0,
  uiLang,
}: {
  startTime: number;
  isMatchmaking: boolean;
  timeLimit?: number;
  onTimeout?: () => void;
  hasSurrendered: boolean;
  clockOffset?: number;
  uiLang: "id" | "en";
}) {
  const normalizedStartTime = useMemo(() => normalizeStartTime(startTime), [startTime]);
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(normalizedStartTime, clockOffset));

  const limit = isMatchmaking ? 300 : timeLimit;
  const isCountdown = limit > 0;

  useEffect(() => {
    if (hasSurrendered) return;

    let timeoutId: number | null = null;

    function tick() {
      const next = getElapsedSeconds(normalizedStartTime, clockOffset);
      setElapsed(next);

      if (isCountdown && next >= limit) {
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
  }, [normalizedStartTime, isCountdown, limit, onTimeout, hasSurrendered, clockOffset]);

  const remaining = isCountdown ? Math.max(0, limit - elapsed) : 0;
  const timeToDisplay = isCountdown ? remaining : elapsed;
  const isWarning = isCountdown && remaining < 30;

  return (
    <span
      className={`font-extrabold tabular-nums text-charcoal-text ${isWarning ? "timer-pulse-warning" : ""}`}
      style={{
        fontSize: "20px",
        lineHeight: 1,
      }}
      aria-label={
        isCountdown
          ? (uiLang === "en" ? "Time left to play" : "Sisa waktu bermain")
          : (uiLang === "en" ? "Elapsed time" : "Waktu yang sudah berjalan")
      }
    >
      {formatElapsed(timeToDisplay)}
    </span>
  );
});

const GameHeader = memo(
  ({
    room,
    clicksCount,
    hasSurrendered,
    confirmingSurrender,
    startTime,
    isTimeout,
    liveBadges,
    handleSurrenderClick,
    showHelpButton,
    isHelpDisabled,
    handleHelpClick,
    showPitStopButton,
    isPitStopDisabled,
    handlePitStopClick,
    onTimeout,
    clockOffset = 0,
    uiLang,
  }: {
    room: Room;
    clicksCount: number;
    hasSurrendered: boolean;
    confirmingSurrender: boolean;
    startTime: number;
    isTimeout: boolean;
    liveBadges: AchievementBadge[];
    handleSurrenderClick: () => void;
    showHelpButton: boolean;
    isHelpDisabled: boolean;
    handleHelpClick: () => void;
    showPitStopButton: boolean;
    isPitStopDisabled: boolean;
    handlePitStopClick: () => void;
    onTimeout?: () => void;
    clockOffset?: number;
    uiLang: "id" | "en";
  }) => {
    const isMatchmaking = !!room.isMatchmaking;
    const clickLimit = room.customRules?.clickLimit ?? 0;
    const isClickLimitWarning = clickLimit > 0 && (clickLimit - clicksCount) <= 3;

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
                {uiLang === "en" ? "Target" : "Tujuan"}
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

          {clickLimit > 0 && (
            <div className="flex shrink-0 flex-col items-end leading-none">
              <span
                className="font-bold uppercase text-charcoal-text/60"
                style={{ fontSize: "10px", letterSpacing: "0.6px" }}
              >
                {uiLang === "en" ? "Clicks Left" : "Sisa Klik"}
              </span>
              <span
                className={`font-extrabold tabular-nums text-charcoal-text ${
                  isClickLimitWarning ? "timer-pulse-warning text-burnt-orange animate-pulse" : ""
                }`}
                style={{
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                {Math.max(0, clickLimit - clicksCount)} / {clickLimit}
              </span>
            </div>
          )}

          <div className="flex shrink-0 flex-col items-end leading-none">
            <span
              className="font-bold uppercase text-charcoal-text/60"
              style={{ fontSize: "10px", letterSpacing: "0.6px" }}
            >
              {isMatchmaking || (room.customRules?.timeLimit && room.customRules.timeLimit > 0)
                ? (uiLang === "en" ? "Time Left" : "Sisa Waktu")
                : (uiLang === "en" ? "Time" : "Waktu")}
            </span>
            <TimerDisplay
              startTime={startTime}
              isMatchmaking={isMatchmaking}
              timeLimit={room.customRules?.timeLimit}
              onTimeout={onTimeout}
              hasSurrendered={hasSurrendered}
              clockOffset={clockOffset}
              uiLang={uiLang}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AudioToggleWidget />
            {showPitStopButton && (
              <button
                type="button"
                onClick={handlePitStopClick}
                disabled={isPitStopDisabled}
                className="chunky-press bg-playdate-yellow text-charcoal-text transition disabled:opacity-60 cursor-pointer font-extrabold"
                style={{
                  border: "1px solid var(--color-warm-gray)",
                  borderRadius: "var(--radius-button)",
                  padding: "8px 12px",
                  fontSize: "13px",
                }}
                title={uiLang === "en" ? "Activate power-up to gain a tactical advantage" : "Aktifkan power-up untuk mendapatkan keuntungan taktis"}
              >
                <span className="flex items-center gap-1.5 justify-center">
                  <Lightning size={14} weight="fill" />
                  <span>{uiLang === "en" ? "USE POWER-UP" : "GUNAKAN POWER-UP"}</span>
                </span>
              </button>
            )}

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
                title={uiLang === "en" ? "Return to starting article (penalty suspension)" : "Kembali ke awal artikel (denda suspension)"}
              >
                <span className="flex items-center gap-1.5 justify-center">
                  <ArrowCounterClockwise size={14} weight="bold" />
                  <span>{uiLang === "en" ? "Back to Start" : "Kembali ke Awal"}</span>
                </span>
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
                ? (uiLang === "en" ? "Done" : "Sudah")
                : confirmingSurrender
                  ? (uiLang === "en" ? "Sure?" : "Yakin?")
                  : (uiLang === "en" ? "Surrender" : "Menyerah")}
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
              ? (uiLang === "en" ? "⏰ Time's up! Waiting for other players to finish…" : "⏰ Waktu habis! Menunggu pemain lain selesai…")
              : (uiLang === "en" ? "You have surrendered. Waiting for other players to finish…" : "Kamu sudah menyerah. Menunggu pemain lain selesai…")}
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
}: GameProps) {
  const uiLang = useUiLang();
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
  const clicksCount = me ? Math.max(0, me.route.length - 1) : 0;

  // ------- Power-Ups States -------
  const [pitActive, setPitActive] = useState(false);
  const [pitTimeLeft, setPitTimeLeft] = useState(4.0);
  const [selectedPowerUp, setSelectedPowerUp] = useState<"soft" | "medium" | "hard" | null>(null);

  const [localActivePowerUp, setLocalActivePowerUp] = useState<"soft" | "medium" | "hard" | null>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState(0);

  const [oilSplat, setOilSplat] = useState(false);
  const [splatClicksLeft, setSplatClicksLeft] = useState(0);
  const [attackerName, setAttackerName] = useState("");

  // Sync active powerups from server
  useEffect(() => {
    const active = me?.activePowerUp ?? null;
    const expiresAt = me?.powerUpExpiresAt ?? 0;
    if (active && expiresAt > Date.now() + clockOffset) {
      setLocalActivePowerUp(active);
      const timer = setInterval(() => {
        const left = Math.max(0, (expiresAt - (Date.now() + clockOffset)) / 1000);
        setPowerUpTimeLeft(Math.round(left * 10) / 10);
        if (left <= 0) {
          setLocalActivePowerUp(null);
          clearInterval(timer);
        }
      }, 100);
      return () => clearInterval(timer);
    } else {
      setLocalActivePowerUp(null);
      setPowerUpTimeLeft(0);
    }
  }, [me?.activePowerUp, me?.powerUpExpiresAt, clockOffset]);

  // Pit stop ticking logic
  useEffect(() => {
    if (!pitActive) return;

    const interval = setInterval(() => {
      setPitTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0) {
          clearInterval(interval);
          setPitActive(false);

          // Submit the choice
          const finalPowerUp = selectedPowerUp || "medium";
          void fetch("/api/room/pit-stop", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Player-Token": getPlayerToken(room.id),
            },
            body: JSON.stringify({
              roomId: room.id,
              clientId: currentClientId,
              powerUpType: finalPowerUp,
            }),
          }).then((res) => {
            if (res.ok) {
              playPowerUpEquippedSound();
            }
          }).catch((err) => {
            console.error("Gagal mengirim power-up:", err);
          });
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [pitActive, selectedPowerUp, room.id, currentClientId]);

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

  const handlePitStopClick = useCallback(() => {
    if (pitActive || me?.pitStopUsed || hasSurrendered || (suspensionTimeLeft > 0)) return;

    setSelectedPowerUp(null);
    setPitTimeLeft(4.0);
    setPitActive(true);
    playPitStopSound();
  }, [pitActive, me?.pitStopUsed, hasSurrendered, suspensionTimeLeft]);


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
          headers: {
            "Content-Type": "application/json",
            "X-Player-Token": getPlayerToken(room.id),
          },
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
          ? (uiLang === "en" ? "Host left, game cancelled." : "Host keluar, game dibatalkan.")
          : (uiLang === "en" ? "Game cancelled." : "Game dibatalkan.");
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

    function handlePowerUpAttack(message: Ably.Message) {
      const data = message.data as {
        type: string;
        attackerId: string;
        attackerName: string;
      };
      if (data && data.attackerId !== currentClientId) {
        setOilSplat(true);
        setSplatClicksLeft(4);
        setAttackerName(data.attackerName);
        playOilSplatSound();
      }
    }

    void ablyChannel.subscribe("game_cancelled", handleGameCancelled);
    void ablyChannel.subscribe("player_suspended", handlePlayerSuspended);
    void ablyChannel.subscribe("powerup_attack", handlePowerUpAttack);

    return () => {
      ablyChannel.unsubscribe("game_cancelled", handleGameCancelled);
      ablyChannel.unsubscribe("player_suspended", handlePlayerSuspended);
      ablyChannel.unsubscribe("powerup_attack", handlePowerUpAttack);
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
          headers: {
            "Content-Type": "application/json",
            "X-Player-Token": getPlayerToken(room.id),
          },
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
        headers: {
          "Content-Type": "application/json",
          "X-Player-Token": getPlayerToken(room.id),
        },
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
        headers: {
          "Content-Type": "application/json",
          "X-Player-Token": getPlayerToken(room.id),
        },
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
              ? (uiLang === "en"
                  ? `⚠️ ${suspensionNotice.username} suspended for ${suspensionNotice.duration === 120 ? "2 minutes" : "1 minute"} for pressing Ctrl+F (Cheating detected!)`
                  : `⚠️ ${suspensionNotice.username} disuspen ${suspensionNotice.duration === 120 ? "2 menit" : "1 menit"} karena menekan Ctrl+F (Kecurangan terdeteksi!)`)
              : (uiLang === "en"
                  ? `🔄 ${suspensionNotice.username} returned to start and suspended for ${suspensionNotice.duration} seconds.`
                  : `🔄 ${suspensionNotice.username} kembali ke awal dan disuspen ${suspensionNotice.duration} detik.`)}
          </div>
        </div>
      )}

      {countdownActive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/90 px-6 text-center text-warm-cream"
          aria-live="assertive"
          aria-label={uiLang === "en" ? "Race countdown" : "Countdown race"}
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
              {uiLang === "en" ? "Race starting" : "Game dimulai"}
            </div>
          </div>
        </div>
      )}

      {room.gameMode !== "competitive" && (
        <MiniLeaderboard
          players={room.players}
          currentClientId={currentClientId}
          hasBadges={liveBadges.length > 0}
          uiLang={uiLang}
        />
      )}

      <GameHeader
        room={room}
        clicksCount={clicksCount}
        hasSurrendered={hasSurrendered}
        confirmingSurrender={confirmingSurrender}
        startTime={startTime}
        isTimeout={isTimeout}
        onTimeout={handleTimeout}
        liveBadges={liveBadges}
        handleSurrenderClick={handleSurrenderClick}
        showHelpButton={me ? !me.helpUsed && myArticle !== room.startArticle && me.status === "playing" : false}
        isHelpDisabled={usingHelp || (suspensionTimeLeft > 0) || pitActive}
        handleHelpClick={handleHelpClick}
        showPitStopButton={room.gameMode === "casual" && me ? !me.pitStopUsed && me.status === "playing" : false}
        isPitStopDisabled={pitActive || (suspensionTimeLeft > 0) || usingHelp}
        handlePitStopClick={handlePitStopClick}
        clockOffset={clockOffset}
        uiLang={uiLang}
      />

      {/* ============================================================ */}
      {/* Konten artikel (full-width, page-level scroll) */}
      {/* ============================================================ */}
      <section className="mx-auto w-full max-w-[920px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div
          className="relative bg-pure-white border border-warm-gray shadow-raised"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          {suspensionTimeLeft > 0 && (
            <div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-charcoal-text/85 text-center p-6"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              <div
                className="bg-pure-white border border-warm-gray p-6 sm:p-8 flex flex-col items-center gap-4 text-charcoal-text max-w-sm"
                style={{ borderRadius: "var(--radius-rounded)", boxShadow: "var(--shadow-floating)" }}
              >
                <div className="text-4xl" aria-hidden>⏳</div>
                <h3 className="font-black text-xl uppercase tracking-wider text-burnt-orange">
                  {uiLang === "en" ? "ACCESS SUSPENDED" : "AKSES DITANGGUHKAN"}
                </h3>
                <p className="text-sm text-charcoal-text/80 leading-relaxed">
                  {mySuspensionReason === "ctrl_f" 
                    ? (uiLang === "en" ? "Word search (Ctrl+F) detected! Searching words is forbidden for game fairness." : "Pencarian kata (Ctrl+F) terdeteksi! Dilarang mencari kata demi kejujuran permainan.")
                    : (uiLang === "en" ? "You used help to return to start." : "Anda menggunakan bantuan untuk kembali ke awal.")}
                </p>
                <div
                  className="font-black text-4xl tabular-nums bg-charcoal-text text-lime-accent px-4 py-2 mt-2"
                  style={{ borderRadius: "var(--radius-button)" }}
                >
                  {formatElapsed(suspensionTimeLeft)}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-text/50">
                  {uiLang === "en" ? "Wait until penalty expires" : "Tunggu hingga hukuman selesai"}
                </span>
              </div>
            </div>
          )}

          {/* Active Power-up HUD status bar */}
          {localActivePowerUp && (
            <div
              className={`border-b border-charcoal-text px-5 py-2.5 font-mono font-extrabold text-xs flex justify-between items-center text-charcoal-text ${
                localActivePowerUp === "soft"
                  ? "bg-burnt-orange text-warm-cream"
                  : "bg-playdate-yellow"
              }`}
              style={{
                borderRadius: "var(--radius-input) var(--radius-input) 0 0",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span>
                  {localActivePowerUp === "soft"
                    ? (uiLang === "en" ? "LINK PREVIEW ACTIVE: HOVER LINKS TO PREVIEW" : "PRATINJAU LINK AKTIF: ARAHKAN KURSOR KE LINK")
                    : (uiLang === "en" ? "BAN BYPASS ACTIVE: ALL LINKS UNLOCKED" : "ABAIKAN BLOKIR AKTIF: SEMUA LINK BISA DIKLIK")}
                </span>
              </div>
              <div className="tabular-nums opacity-95">
                {powerUpTimeLeft.toFixed(1)}s {uiLang === "en" ? "LEFT" : "SISA"}
              </div>
            </div>
          )}

          {/* Oil Splat Attack Overlay */}
          {oilSplat && (
            <div
              className="fixed inset-0 z-45 flex flex-col items-center justify-center p-6 text-center"
              style={{
                backgroundColor: `rgba(20, 20, 20, ${Math.max(0.4, (splatClicksLeft / 4) * 0.95)})`,
                backdropFilter: `blur(${Math.max(0, splatClicksLeft * 2.5)}px)`,
                transition: "background-color 0.2s, backdrop-filter 0.2s",
              }}
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <svg className="w-full h-full opacity-90 fill-charcoal-text" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M15,12 Q30,10 25,35 Q10,40 12,20 Z" />
                  <path d="M85,25 Q90,40 75,45 Q65,30 80,15 Z" />
                  <path d="M30,80 Q45,95 20,90 Q10,75 25,65 Z" />
                  <path d="M70,75 Q85,60 90,85 Q65,90 75,70 Z" />
                  <path d="M50,35 C65,30 75,45 60,60 C45,75 35,65 30,55 C25,45 35,40 50,35 Z" className="opacity-70" />
                </svg>
              </div>

              <div
                className="z-50 bg-playdate-yellow p-6 sm:p-8 flex flex-col items-center gap-4 text-charcoal-text max-w-sm border-4 border-charcoal-text shadow-[6px_6px_0px_#000]"
                style={{ borderRadius: "var(--radius-input)" }}
              >
                <div className="text-4xl animate-bounce" aria-hidden>🧹</div>
                <h3 className="font-black text-xl uppercase tracking-wider text-burnt-orange">
                  {translations[uiLang].debrisAlertTitle}
                </h3>
                <p className="text-xs font-extrabold leading-relaxed text-charcoal-text/80">
                  {translations[uiLang].debrisAlertDesc.replace("{username}", attackerName)}
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    playOilSplatSound();
                    setSplatClicksLeft((prev) => {
                      const next = prev - 1;
                      if (next <= 0) {
                        setOilSplat(false);
                      }
                      return next;
                    });
                  }}
                  className="chunky-press w-full bg-charcoal-text text-warm-cream font-mono font-black text-sm uppercase py-3 border-2 border-charcoal-text shadow-[4px_4px_0px_#000] rounded-xl hover:bg-charcoal-text/90"
                >
                  {translations[uiLang].wipeScreen.replace("{count}", splatClicksLeft.toString())}
                </button>
              </div>
            </div>
          )}

          <div className={(suspensionTimeLeft > 0 || oilSplat) ? "blur-md pointer-events-none select-none" : ""}>
            <WikiArticle
              currentArticle={myArticle}
              endArticle={room.endArticle}
              language={room.language ?? "id"}
              onNavigate={handleNavigate}
              uiLanguage={uiLang}
              activePowerUp={localActivePowerUp}
              bannedArticles={room.customRules?.bannedArticles}
            />
          </div>
        </div>
      </section>

      {/* Main Pit Stop Strategy Screen Overlay */}
      {pitActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/95 p-4 sm:p-6 text-warm-cream">
          <div className="relative w-full max-w-[640px] bg-charcoal-deep border-4 border-lime-accent p-6 text-center flex flex-col gap-6" style={{ borderRadius: "var(--radius-input)", boxShadow: "var(--shadow-floating)" }}>


            <div className="mt-2 flex flex-col items-center gap-1">
              <h2 className="font-mono font-black text-2xl text-lime-accent uppercase tracking-wider animate-pulse">
                {translations[uiLang].pitInClickTitle}
              </h2>
              <p className="text-sm font-semibold opacity-70">
                {translations[uiLang].pitInClickDesc}
              </p>
            </div>

            {/* Gigantic Ticking Timer */}
            <div className="flex flex-col items-center justify-center py-4 bg-charcoal-text rounded-2xl border-2 border-warm-cream/15">
              <div className="font-mono font-black text-6xl text-lime-accent tracking-tighter tabular-nums animate-pulse">
                {pitTimeLeft.toFixed(1)}s
              </div>
              <span className="font-mono font-bold text-xs uppercase tracking-widest text-warm-cream/50 mt-1">
                {uiLang === "en" ? "LIMIT TIME FOR SELECTION" : "BATAS WAKTU MEMILIH"}
              </span>
            </div>

            {/* Power-Up Card Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {/* Soft Power-up Card */}
              <button
                key="soft-powerup"
                type="button"
                onClick={() => {
                  setSelectedPowerUp("soft");
                }}
                className={`relative text-left p-3.5 flex flex-col gap-2 transition select-none border ${
                  selectedPowerUp === "soft"
                    ? "bg-burnt-orange text-warm-cream border-lime-accent scale-[1.03] shadow-none translate-y-[2px]"
                    : "bg-charcoal-text border-warm-cream/20 text-warm-cream hover:border-warm-cream/40 hover:scale-[1.01]"
                }`}
                style={{
                  borderRadius: "var(--radius-button)",
                  borderWidth: selectedPowerUp === "soft" ? "3px" : "1px",
                }}
              >
                <div className="font-mono font-black text-xs sm:text-[13px] flex items-center justify-between w-full gap-1">
                  <span>{translations[uiLang].linkPreviewTitle}</span>
                  {selectedPowerUp === "soft" && (
                    <span className="shrink-0 bg-lime-accent text-charcoal-text font-black text-[9px] px-1.5 py-0.5 rounded border border-charcoal-text shadow-[2px_2px_0px_#000] uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <Check size={10} weight="bold" />
                      <span>{uiLang === "en" ? "CHOSEN" : "TERPILIH"}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-85 font-semibold mt-1">
                  {translations[uiLang].linkPreviewDesc}
                </p>
              </button>

              {/* Medium Power-up Card */}
              <button
                key="medium-powerup"
                type="button"
                onClick={() => {
                  setSelectedPowerUp("medium");
                }}
                className={`relative text-left p-3.5 flex flex-col gap-2 transition select-none border ${
                  selectedPowerUp === "medium"
                    ? "bg-playdate-yellow text-charcoal-text border-lime-accent scale-[1.03] shadow-none translate-y-[2px]"
                    : "bg-charcoal-text border-warm-cream/20 text-warm-cream hover:border-warm-cream/40 hover:scale-[1.01]"
                }`}
                style={{
                  borderRadius: "var(--radius-button)",
                  borderWidth: selectedPowerUp === "medium" ? "3px" : "1px",
                }}
              >
                <div className="font-mono font-black text-xs sm:text-[13px] flex items-center justify-between w-full gap-1">
                  <span>{translations[uiLang].bypassBanTitle}</span>
                  {selectedPowerUp === "medium" && (
                    <span className="shrink-0 bg-lime-accent text-charcoal-text font-black text-[9px] px-1.5 py-0.5 rounded border border-charcoal-text shadow-[2px_2px_0px_#000] uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <Check size={10} weight="bold" />
                      <span>{uiLang === "en" ? "CHOSEN" : "TERPILIH"}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-85 font-semibold mt-1">
                  {translations[uiLang].bypassBanDesc}
                </p>
              </button>

              {/* Hard Power-up Card */}
              <button
                key="hard-powerup"
                type="button"
                onClick={() => {
                  setSelectedPowerUp("hard");
                }}
                className={`relative text-left p-3.5 flex flex-col gap-2 transition select-none border ${
                  selectedPowerUp === "hard"
                    ? "bg-pure-white text-charcoal-text border-lime-accent scale-[1.03] shadow-none translate-y-[2px]"
                    : "bg-charcoal-text border-warm-cream/20 text-warm-cream hover:border-warm-cream/40 hover:scale-[1.01]"
                }`}
                style={{
                  borderRadius: "var(--radius-button)",
                  borderWidth: selectedPowerUp === "hard" ? "3px" : "1px",
                }}
              >
                <div className="font-mono font-black text-xs sm:text-[13px] flex items-center justify-between w-full gap-1">
                  <span>{translations[uiLang].obstructTitle}</span>
                  {selectedPowerUp === "hard" && (
                    <span className="shrink-0 bg-lime-accent text-charcoal-text font-black text-[9px] px-1.5 py-0.5 rounded border border-charcoal-text shadow-[2px_2px_0px_#000] uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <Check size={10} weight="bold" />
                      <span>{uiLang === "en" ? "CHOSEN" : "TERPILIH"}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-85 font-semibold mt-1">
                  {translations[uiLang].obstructDesc}
                </p>
              </button>
            </div>

            {/* Strategy Console Bar */}
            <div className="border-t border-warm-cream/10 pt-4">
              <div
                className={`font-mono text-sm uppercase tracking-wider font-extrabold p-3.5 flex justify-between items-center transition-all duration-300 border ${
                  selectedPowerUp === "soft"
                    ? "bg-burnt-orange text-warm-cream border-pure-white shadow-[2px_2px_0px_#000]"
                    : selectedPowerUp === "medium"
                      ? "bg-playdate-yellow text-charcoal-text border-pure-white shadow-[2px_2px_0px_#000]"
                      : selectedPowerUp === "hard"
                        ? "bg-pure-white text-charcoal-text border-pure-white shadow-[2px_2px_0px_#000]"
                        : "bg-charcoal-text text-burnt-orange border-burnt-orange animate-pulse"
                }`}
                style={{ borderRadius: "var(--radius-button)" }}
              >
                <div className="flex items-center gap-2">
                  <span>{uiLang === "en" ? "POWER-UP:" : "POWER-UP:"}</span>
                  <span className="font-black underline decoration-2">
                    {selectedPowerUp 
                      ? (selectedPowerUp === "soft" ? "LINK PREVIEW" : selectedPowerUp === "medium" ? "BYPASS BAN" : "OBSTRUCT")
                      : (uiLang === "en" ? "SELECT POWER-UP!" : "PILIH POWER-UP!")}
                  </span>
                </div>
                <span className="text-xs opacity-90 font-bold">
                  {uiLang === "en" ? "AUTO-ACTIVATE AT " : "OTOMATIS AKTIF PADA "}
                  <span className="font-black tabular-nums">{pitTimeLeft.toFixed(1)}s</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
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
