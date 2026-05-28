"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  computeResultBadges,
  type AchievementBadge,
} from "@/lib/achievements";
import { avatarColor, initials } from "@/lib/avatar";
import type { Player, Room, RouteStep } from "@/lib/types";

import RouteReplay from "./RouteReplay";

interface ResultsProps {
  room: Room;
  currentClientId: string;
  /** Rute final setiap pemain (key = clientId). */
  allRoutes: Record<string, RouteStep[]>;
  /** clientId pemenang. `null` jika semua menyerah. */
  winnerId: string | null;
  /** Dipanggil setelah `/api/room/play-again` sukses. */
  onPlayAgain: () => void;
}

export default function Results({
  room,
  currentClientId,
  allRoutes,
  winnerId,
  onPlayAgain,
}: ResultsProps) {
  const router = useRouter();
  const isHost = currentClientId === room.hostClientId;

  const ranked = useMemo(
    () => buildLeaderboard(room.players, allRoutes),
    [room.players, allRoutes],
  );

  const winner = winnerId
    ? ranked.find((r) => r.player.clientId === winnerId)
    : null;

  // Top 3 untuk podium (kalau jumlahnya cukup).
  const podium = ranked.slice(0, 3);

  // ------- Action: main lagi (host) -------
  const playAgainBusy = useRef(false);
  const [playAgainError, setPlayAgainError] = useState<string | null>(null);
  const [playAgainLoading, setPlayAgainLoading] = useState(false);

  const handlePlayAgain = useCallback(async () => {
    if (playAgainBusy.current) return;
    playAgainBusy.current = true;
    setPlayAgainError(null);
    setPlayAgainLoading(true);

    try {
      const res = await fetch("/api/room/play-again", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setPlayAgainError(data.error ?? "Gagal mereset room.");
        return;
      }
      onPlayAgain();
    } catch {
      setPlayAgainError("Tidak bisa terhubung ke server.");
    } finally {
      setPlayAgainLoading(false);
      playAgainBusy.current = false;
    }
  }, [room.id, currentClientId, onPlayAgain]);

  // ------- Action: keluar -------
  const leaveBusy = useRef(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showReplay, setShowReplay] = useState(false);

  const handleLeave = useCallback(async () => {
    if (leaveBusy.current) return;
    leaveBusy.current = true;
    setLeaveLoading(true);
    try {
      await fetch("/api/room/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
        }),
      });
    } catch {
      // ignore
    } finally {
      router.push("/");
    }
  }, [room.id, currentClientId, router]);

  return (
    <main className="dot-bg flex flex-1 flex-col items-center bg-playdate-yellow px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex w-full max-w-[820px] flex-col gap-6">
        {/* ====== Header ====== */}
        <header
          className="chunky-lg flex flex-col gap-3 bg-pure-white p-6 text-charcoal-text"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <span
            className="font-bold uppercase text-charcoal-text/60"
            style={{ fontSize: "12px", letterSpacing: "0.6px" }}
          >
            Hasil — Room {room.id}
          </span>

          {winner ? (
            <>
              <h1
                className="flex flex-wrap items-baseline gap-2 font-extrabold text-charcoal-text"
                style={{
                  fontSize: "var(--text-heading-lg)",
                  lineHeight: "var(--leading-heading-lg)",
                }}
              >
                <span aria-hidden>🏆</span>
                <span>{winner.player.username}</span>
                <span className="font-extrabold text-charcoal-text">
                  Menang!
                </span>
              </h1>
              <p
                className="text-charcoal-text/80"
                style={{ fontSize: "var(--text-body)" }}
              >
                Selesai dalam{" "}
                <strong>{formatTime(winner.finishTimeSec ?? 0)}</strong> dengan{" "}
                <strong>{winner.steps} klik</strong>.
              </p>
            </>
          ) : (
            <>
              <h1
                className="font-extrabold text-charcoal-text"
                style={{
                  fontSize: "var(--text-heading-lg)",
                  lineHeight: "var(--leading-heading-lg)",
                }}
              >
                Semua menyerah!
              </h1>
              <p
                className="text-charcoal-text/80"
                style={{ fontSize: "var(--text-body)" }}
              >
                Tidak ada pemenang. Lihat rute masing-masing pemain di bawah.
              </p>
            </>
          )}

          <div
            className="mt-2 flex flex-wrap items-center gap-2 text-charcoal-text/70"
            style={{ fontSize: "14px" }}
          >
            <span
              className="chunky-sm bg-paper-white px-2 py-1 font-bold text-charcoal-text"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {room.startArticle}
            </span>
            <span aria-hidden>→</span>
            <span
              className="chunky-sm bg-playdate-yellow px-2 py-1 font-bold text-charcoal-text"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {room.endArticle}
            </span>
          </div>
        </header>

        {/* ====== Podium top-3 ====== */}
        {podium.length >= 2 && winner && (
          <Podium podium={podium} currentClientId={currentClientId} />
        )}

        {/* ====== Leaderboard penuh ====== */}
        <section
          className="chunky flex flex-col gap-3 bg-pure-white p-6"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <h2
            className="font-extrabold text-charcoal-text"
            style={{
              fontSize: "var(--text-heading)",
              lineHeight: "var(--leading-heading)",
            }}
          >
            Klasemen
          </h2>

          <ol className="flex flex-col gap-2">
            {ranked.map((row, index) => (
              <LeaderboardRow
                key={row.player.clientId}
                position={index + 1}
                row={row}
                isMe={row.player.clientId === currentClientId}
                isWinner={winnerId === row.player.clientId}
                winnerId={winnerId}
              />
            ))}
          </ol>
        </section>

        {/* ====== Rute ====== */}
        <section
          className="chunky flex flex-col gap-3 bg-pure-white p-6"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              className="font-extrabold text-charcoal-text"
              style={{
                fontSize: "var(--text-heading)",
                lineHeight: "var(--leading-heading)",
              }}
            >
              Rute pemain
            </h2>
            <button
              type="button"
              onClick={() => setShowReplay(true)}
              className="bg-charcoal-text text-warm-cream"
              style={{
                borderRadius: "var(--radius-button)",
                padding: "9px 14px",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Bandingkan Rute
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {ranked.map((row) => (
              <RouteAccordion
                key={row.player.clientId}
                row={row}
                openByDefault={winnerId === row.player.clientId}
                isMe={row.player.clientId === currentClientId}
                winnerId={winnerId}
              />
            ))}
          </div>
        </section>

        {/* ====== Actions ====== */}
        <section className="flex flex-col gap-3">
          {playAgainError && (
            <div
              role="alert"
              className="bg-charcoal-text text-pure-white"
              style={{
                borderRadius: "var(--radius-input)",
                padding: "12px 16px",
                fontSize: "var(--text-body)",
              }}
            >
              ⚠ {playAgainError}
            </div>
          )}

          {isHost ? (
            <button
              type="button"
              onClick={handlePlayAgain}
              disabled={playAgainLoading || leaveLoading}
              className="btn-primary"
            >
              {playAgainLoading ? "Mereset room…" : "Main Lagi"}
            </button>
          ) : (
            <div
              className="chunky flex items-center justify-center gap-3 bg-pure-white text-charcoal-text"
              style={{
                borderRadius: "var(--radius-input)",
                padding: "16px 20px",
                fontSize: "var(--text-body)",
              }}
            >
              <span
                className="bg-crank-violet pd-pulse inline-block shrink-0 rounded-full"
                style={{ width: 10, height: 10 }}
                aria-hidden
              />
              <span>Tunggu host untuk memulai ronde berikutnya…</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLeave}
            disabled={leaveLoading || playAgainLoading}
            className="btn-white"
          >
            {leaveLoading ? "Keluar…" : "Keluar Room"}
          </button>
        </section>
      </div>
      {showReplay && (
        <RouteReplay
          rows={ranked}
          winnerId={winnerId}
          onClose={() => setShowReplay(false)}
        />
      )}
    </main>
  );
}

// ============================================================
// Podium
// ============================================================

function Podium({
  podium,
  currentClientId,
}: {
  podium: RankedPlayer[];
  currentClientId: string;
}) {
  // Tampilkan urutan: 2 - 1 - 3 supaya juara di tengah.
  const arranged = [
    podium[1] ?? null,
    podium[0] ?? null,
    podium[2] ?? null,
  ];

  return (
    <section
      className="chunky flex items-end justify-center gap-3 bg-pure-white px-4 py-6 sm:gap-4 sm:px-6"
      style={{ borderRadius: "var(--radius-input)" }}
    >
      {arranged.map((row, idx) => {
        if (!row) return <div key={idx} className="flex-1" />;

        const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
        const heights = { 1: 130, 2: 100, 3: 80 } as const;
        const medals = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;
        const medalBgs = {
          1: "var(--color-medal-gold)",
          2: "var(--color-medal-silver)",
          3: "var(--color-medal-bronze)",
        } as const;

        const isMe = row.player.clientId === currentClientId;
        const color = avatarColor(row.player.username);

        return (
          <div
            key={row.player.clientId}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <span
              className="chunky-sm flex items-center justify-center font-extrabold uppercase text-pure-white"
              style={{
                width: 52,
                height: 52,
                borderRadius: "9999px",
                background: color,
                fontSize: 18,
              }}
              aria-hidden
            >
              {initials(row.player.username)}
            </span>
            <div
              className="text-center font-extrabold text-charcoal-text"
              style={{ fontSize: "14px", lineHeight: 1.1 }}
            >
              <span className="block truncate max-w-[120px] sm:max-w-[160px]">
                {row.player.username}
              </span>
              {isMe && (
                <span
                  className="text-charcoal-text/60"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.3px",
                  }}
                >
                  (kamu)
                </span>
              )}
            </div>
            <div
              className="chunky-sm flex w-full flex-col items-center justify-end gap-1 px-2 py-2 text-charcoal-text"
              style={{
                background: medalBgs[place],
                borderRadius: "var(--radius-input)",
                minHeight: heights[place],
              }}
            >
              <span style={{ fontSize: 26 }} aria-hidden>
                {medals[place]}
              </span>
              <span
                className="font-extrabold tabular-nums"
                style={{ fontSize: 18 }}
              >
                #{place}
              </span>
              {row.finishTimeSec !== undefined ? (
                <span
                  className="font-bold tabular-nums text-charcoal-text/80"
                  style={{ fontSize: 12 }}
                >
                  {formatTime(row.finishTimeSec)}
                </span>
              ) : (
                <span
                  className="font-bold text-charcoal-text/80"
                  style={{ fontSize: 12 }}
                >
                  {row.steps} klik
                </span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ============================================================
// Leaderboard row
// ============================================================

interface LeaderboardRowProps {
  position: number;
  row: RankedPlayer;
  isMe: boolean;
  isWinner: boolean;
  winnerId: string | null;
}

function LeaderboardRow({
  position,
  row,
  isMe,
  isWinner,
  winnerId,
}: LeaderboardRowProps) {
  const { player, steps, finishTimeSec } = row;
  const color = avatarColor(player.username);
  const achievementBadges = computeResultBadges({
    player,
    route: row.route,
    winnerId,
  });

  let badgeLabel = "—";
  let badgeBg = "var(--color-paper-white)";
  if (player.status === "finished") {
    badgeLabel = "Finish";
    badgeBg = "var(--color-seafoam-teal)";
  } else if (player.status === "surrendered") {
    badgeLabel = "Menyerah";
    badgeBg = "var(--color-stone-gray)";
  } else if (player.status === "playing") {
    badgeLabel = "Tidak finish";
    badgeBg = "var(--color-parchment)";
  }

  return (
    <li
      className="flex items-center gap-3 border border-warm-gray p-3"
      style={{
        borderRadius: "var(--radius-input)",
        background: isWinner
          ? "var(--color-lime-accent)"
          : isMe
            ? "var(--color-light-beige)"
            : "var(--color-warm-cream)",
      }}
    >
      <span
        className="chunky-sm flex shrink-0 items-center justify-center font-extrabold tabular-nums text-charcoal-text"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-button)",
          background: "var(--color-paper-white)",
          fontSize: "var(--text-body)",
        }}
        aria-label={`Peringkat ${position}`}
      >
        {position}
      </span>

      <span
        className="chunky-sm flex shrink-0 items-center justify-center font-extrabold uppercase text-pure-white"
        style={{
          width: 36,
          height: 36,
          borderRadius: "9999px",
          background: color,
          fontSize: 13,
        }}
        aria-hidden
      >
        {initials(player.username)}
      </span>

      <div className="min-w-0 flex-1">
        <div
          className="flex items-center gap-2 font-extrabold text-charcoal-text"
          style={{ fontSize: "var(--text-body)" }}
        >
          <span className="truncate">
            {isWinner ? "🏆 " : ""}
            {player.username}
          </span>
          {isMe && (
            <span
              className="chunky-sm bg-pure-white text-charcoal-text font-bold"
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "var(--radius-button)",
                letterSpacing: "0.4px",
              }}
            >
              KAMU
            </span>
          )}
          {player.isHost && (
            <span
              className="text-charcoal-text/70 font-bold"
              style={{ fontSize: "10px", letterSpacing: "0.4px" }}
            >
              HOST
            </span>
          )}
        </div>
        <div className="text-charcoal-text/80" style={{ fontSize: "14px" }}>
          <span className="tabular-nums">{steps} klik</span>
          {finishTimeSec !== undefined && (
            <>
              <span className="mx-2 opacity-50">·</span>
              <span className="tabular-nums">{formatTime(finishTimeSec)}</span>
            </>
          )}
        </div>
        {achievementBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {achievementBadges.map((badge) => (
              <AchievementBadgePill key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>

      <span
        className="chunky-sm font-bold text-charcoal-text"
        style={{
          background: badgeBg,
          padding: "2px 8px",
          borderRadius: "var(--radius-button)",
          fontSize: "11px",
          letterSpacing: "0.4px",
        }}
      >
        {badgeLabel}
      </span>
    </li>
  );
}

// ============================================================
// Route accordion
// ============================================================

interface RouteAccordionProps {
  row: RankedPlayer;
  openByDefault: boolean;
  isMe: boolean;
  winnerId: string | null;
}

function RouteAccordion({
  row,
  openByDefault,
  isMe,
  winnerId,
}: RouteAccordionProps) {
  const { player, route, steps, finishTimeSec } = row;
  const finished = player.status === "finished";
  const surrendered = player.status === "surrendered";
  const color = avatarColor(player.username);
  const achievementBadges = computeResultBadges({
    player,
    route,
    winnerId,
  });

  return (
    <details
      className="border border-warm-gray bg-warm-cream"
      style={{ borderRadius: "var(--radius-input)" }}
      open={openByDefault}
    >
      <summary
        className="flex cursor-pointer items-center gap-3 px-4 py-3 select-none"
        style={{ listStyle: "none" }}
      >
        <span
          className="chunky-sm flex shrink-0 items-center justify-center font-extrabold uppercase text-pure-white"
          style={{
            width: 32,
            height: 32,
            borderRadius: "9999px",
            background: color,
            fontSize: 12,
          }}
          aria-hidden
        >
          {initials(player.username)}
        </span>

        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 font-extrabold text-charcoal-text"
            style={{ fontSize: "var(--text-body)" }}
          >
            <span className="truncate">
              {finished ? "🏆 " : ""}
              {player.username}
            </span>
            {isMe && (
              <span
                className="text-charcoal-text/70 font-bold"
                style={{ fontSize: "10px", letterSpacing: "0.4px" }}
              >
                KAMU
              </span>
            )}
          </div>
          <div className="text-charcoal-text/70" style={{ fontSize: "13px" }}>
            <span className="tabular-nums">{steps} klik</span>
            {finishTimeSec !== undefined && (
              <>
                <span className="mx-2 opacity-50">·</span>
                <span className="tabular-nums">{formatTime(finishTimeSec)}</span>
              </>
            )}
            {surrendered && (
              <>
                <span className="mx-2 opacity-50">·</span>
                <span>menyerah</span>
              </>
            )}
          </div>
          {achievementBadges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {achievementBadges.map((badge) => (
                <AchievementBadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          )}
        </div>
        <span
          className="text-charcoal-text/60 transition-transform"
          style={{
            fontSize: "16px",
          }}
          aria-hidden
        >
          ▾
        </span>
      </summary>

      <div className="border-t border-parchment px-4 py-3">
        {route.length === 0 ? (
          <p
            className="text-charcoal-text/70"
            style={{ fontSize: "14px" }}
          >
            Pemain tidak sempat membuka artikel apa pun.
          </p>
        ) : (
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
            {route.map((step, i) => {
              const isLast = i === route.length - 1;
              const isStart = i === 0;
              const isFinishStep = finished && isLast;
              const showStopHere = isLast && !finished;

              let bg = "var(--color-paper-white)";
              if (isStart) bg = "var(--color-pure-white)";
              if (isFinishStep) bg = "var(--color-playdate-yellow)";

              return (
                <li
                  key={`${step.article}-${i}`}
                  className="flex items-center gap-1"
                >
                  <span
                    className="inline-flex items-baseline gap-1 border border-warm-gray text-charcoal-text"
                    style={{
                      background: bg,
                      padding: "3px 8px",
                      borderRadius: "var(--radius-button)",
                      fontSize: "13px",
                    }}
                  >
                    <span className="font-bold">{step.article}</span>
                    <span className="text-charcoal-text/60 tabular-nums">
                      ({formatTime(step.timestamp)})
                    </span>
                  </span>
                  {showStopHere && (
                    <span
                      className="text-charcoal-text/70 italic"
                      style={{ fontSize: "12px" }}
                    >
                      (berhenti di sini)
                    </span>
                  )}
                  {!isLast && (
                    <span
                      className="text-charcoal-text/50 px-1"
                      style={{ fontSize: "14px" }}
                      aria-hidden
                    >
                      →
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </details>
  );
}

// ============================================================
// Helpers
// ============================================================

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

export interface RankedPlayer {
  player: Player;
  route: RouteStep[];
  steps: number;
  finishTimeSec?: number;
}

function buildLeaderboard(
  players: Player[],
  allRoutes: Record<string, RouteStep[]>,
): RankedPlayer[] {
  const rows: RankedPlayer[] = players.map((p) => {
    const route = allRoutes[p.clientId] ?? p.route ?? [];
    const steps = Math.max(0, route.length - 1);
    let finishTimeSec: number | undefined;
    if (p.status === "finished" && route.length > 0) {
      finishTimeSec = route[route.length - 1].timestamp;
    }
    return { player: p, route, steps, finishTimeSec };
  });

  const groupRank: Record<Player["status"], number> = {
    finished: 0,
    waiting: 1,
    playing: 1,
    surrendered: 2,
  };

  rows.sort((a, b) => {
    const ga = groupRank[a.player.status];
    const gb = groupRank[b.player.status];
    if (ga !== gb) return ga - gb;

    if (a.player.status === "finished" && b.player.status === "finished") {
      const af = a.player.finishedAt ?? Number.MAX_SAFE_INTEGER;
      const bf = b.player.finishedAt ?? Number.MAX_SAFE_INTEGER;
      return af - bf;
    }
    return b.steps - a.steps;
  });

  return rows;
}

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
