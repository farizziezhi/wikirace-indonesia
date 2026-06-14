"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
type StepIndexes = Record<string, number>;

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
  const [stepIndexes, setStepIndexes] = useState<StepIndexes>(() =>
    buildInitialStepIndexes(playableRows),
  );
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const timeoutRef = useRef<number | null>(null);
  const simulatedTimeRef = useRef(0);

  const selectedRows = playableRows.filter((row) =>
    selectedIds.includes(row.player.clientId),
  );

  const clearReplayTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetReplay = useCallback(() => {
    clearReplayTimeout();
    simulatedTimeRef.current = 0;
    setPlaying(false);
    setStepIndexes(buildInitialStepIndexes(playableRows));
  }, [clearReplayTimeout, playableRows]);

  const scheduleNextStep = useCallback(() => {
    clearReplayTimeout();

    const next = findNextStep(selectedRows, stepIndexes);
    if (!next) {
      setPlaying(false);
      return;
    }

    const delay = Math.max(120, (next.timestamp - simulatedTimeRef.current) * 1000);
    timeoutRef.current = window.setTimeout(() => {
      simulatedTimeRef.current = next.timestamp;
      setStepIndexes((prev) => ({
        ...prev,
        [next.clientId]: next.stepIndex,
      }));
    }, delay / speed);
  }, [clearReplayTimeout, selectedRows, speed, stepIndexes]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => scheduleNextStep(), 0);
    return () => {
      window.clearTimeout(id);
      clearReplayTimeout();
    };
  }, [clearReplayTimeout, playing, scheduleNextStep, stepIndexes]);

  useEffect(() => clearReplayTimeout, [clearReplayTimeout]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSelectedIds(playableRows.map((row) => row.player.clientId));
      setStepIndexes(buildInitialStepIndexes(playableRows));
      simulatedTimeRef.current = 0;
      setPlaying(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, [playableRows]);

  function togglePlayer(clientId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId);
      }
      return [...prev, clientId];
    });
    setPlaying(false);
    clearReplayTimeout();
  }

  function cycleSpeed() {
    setSpeed((current) => (current === 1 ? 2 : current === 2 ? 4 : 1));
  }

  const t = translations[language];

  return (
    <div
      className="fixed inset-0 z-50 flex bg-charcoal-text/95 px-4 py-4 text-warm-cream sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.compareDesc}
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div
              className="font-black text-warm-cream"
              style={{ fontSize: "var(--text-heading)", lineHeight: 1 }}
            >
              {t.compareTitle}
            </div>
            <p className="mt-1 text-warm-cream/70" style={{ fontSize: "14px" }}>
              {t.compareDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-warm-cream text-charcoal-text"
            style={{
              borderRadius: "var(--radius-button)",
              padding: "9px 14px",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {t.close}
          </button>
        </header>

        <div className="flex flex-wrap gap-2">
          {playableRows.map((row) => {
            const checked = selectedIds.includes(row.player.clientId);
            return (
              <button
                key={row.player.clientId}
                type="button"
                onClick={() => togglePlayer(row.player.clientId)}
                className={checked ? "bg-lime-accent text-charcoal-text" : "bg-warm-cream/10 text-warm-cream"}
                style={{
                  border: "1px solid var(--color-warm-gray)",
                  borderRadius: "var(--radius-button)",
                  padding: "7px 10px",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {checked ? "✓ " : ""}
                {row.player.username}
              </button>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {selectedRows.map((row) => (
            <ReplayColumn
              key={row.player.clientId}
              row={row}
              winnerId={winnerId}
              visibleIndex={stepIndexes[row.player.clientId] ?? 0}
              language={language}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-warm-cream/20 pt-3">
          <button type="button" onClick={() => setPlaying((v) => !v)} className="btn-primary">
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={resetReplay} className="btn-white">
            Reset
          </button>
          <button type="button" onClick={cycleSpeed} className="btn-white">
            Speed {speed}x
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplayColumn({
  row,
  winnerId,
  visibleIndex,
  language,
}: {
  row: RankedPlayer;
  winnerId: string | null;
  visibleIndex: number;
  language: "id" | "en";
}) {
  const { player, route } = row;
  const color = avatarColor(player.username);
  const badges = computeResultBadges({ player, route, winnerId });
  const statusLabel = player.status === "finished"
    ? "✓ Finish"
    : player.status === "surrendered"
      ? (language === "en" ? "■ Surrendered" : "■ Menyerah")
      : (language === "en" ? "● Playing" : "● Playing");

  return (
    <section
      className="flex min-h-[200px] sm:min-h-[320px] flex-col overflow-hidden bg-warm-cream text-charcoal-text"
      style={{ borderRadius: "var(--radius-input)" }}
    >
      <div className="border-b border-warm-gray p-3">
        <div className="flex items-center gap-2">
          <span
            className="flex shrink-0 items-center justify-center font-extrabold uppercase text-pure-white"
            style={{ width: 34, height: 34, borderRadius: "9999px", background: color, fontSize: 12 }}
            aria-hidden
          >
            {initials(player.username)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-extrabold" style={{ fontSize: "15px" }}>
              {winnerId === player.clientId ? "🏆 " : ""}
              {player.username}
            </div>
            <div className="text-charcoal-text/70" style={{ fontSize: "12px" }}>
              {statusLabel}
            </div>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <AchievementBadgePill key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>

      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {route.map((step, index) => {
          const visible = index <= visibleIndex;
          const active = index === visibleIndex;
          return (
            <ReplayStep key={`${step.article}-${index}`} step={step} index={index} visible={visible} active={active} />
          );
        })}
      </ol>
    </section>
  );
}

function ReplayStep({
  step,
  index,
  visible,
  active,
}: {
  step: RouteStep;
  index: number;
  visible: boolean;
  active: boolean;
}) {
  if (!visible) return null;

  return (
    <li
      className={`transition duration-200 ${active ? "scale-[1.01]" : "scale-100"}`}
    >
      <div
        className={active ? "bg-charcoal-text text-warm-cream" : "bg-lime-accent text-charcoal-text"}
        style={{ borderRadius: "var(--radius-button)", padding: "8px 10px" }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-extrabold" style={{ fontSize: "13px" }}>
            {index + 1}. {step.article}
          </span>
          <span className="shrink-0 tabular-nums opacity-70" style={{ fontSize: "12px" }}>
            {formatTime(step.timestamp)}
          </span>
        </div>
      </div>
    </li>
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
      style={{ borderRadius: "var(--radius-button)", padding: "3px 8px", fontSize: "11px" }}
    >
      <span aria-hidden>{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
  );
}

function buildInitialStepIndexes(rows: RankedPlayer[]): StepIndexes {
  return Object.fromEntries(rows.map((row) => [row.player.clientId, 0]));
}

function findNextStep(rows: RankedPlayer[], stepIndexes: StepIndexes) {
  let next:
    | { clientId: string; stepIndex: number; timestamp: number }
    | null = null;

  for (const row of rows) {
    const currentIndex = stepIndexes[row.player.clientId] ?? 0;
    const nextIndex = currentIndex + 1;
    const step = row.route[nextIndex];
    if (!step) continue;
    if (!next || step.timestamp < next.timestamp) {
      next = {
        clientId: row.player.clientId,
        stepIndex: nextIndex,
        timestamp: step.timestamp,
      };
    }
  }

  return next;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
