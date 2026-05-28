# Side-by-Side Route Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fullscreen modal side-by-side route replay to Results page.

**Architecture:** Create focused `components/RouteReplay.tsx` component that owns modal UI, player selection, and setTimeout-based replay engine. Modify `components/Results.tsx` only to open/close modal and pass ranked route data. No API, Redis, or Ably changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 design tokens.

---

## File Structure

- Create `components/RouteReplay.tsx`
  - Client component modal overlay.
  - Accepts `rows`, `winnerId`, `onClose`.
  - Owns selected players, step indexes, play/pause/reset/speed state.
- Modify `components/Results.tsx`
  - Exports `RankedPlayer` type for RouteReplay.
  - Adds `showReplay` state.
  - Adds "Bandingkan Rute" button in route section header.
  - Renders `RouteReplay` modal when open.

## Task 1: Export RankedPlayer Type

**Files:**
- Modify: `components/Results.tsx`

- [ ] **Step 1: Export existing RankedPlayer interface**

Change:

```ts
interface RankedPlayer {
  player: Player;
  route: RouteStep[];
  steps: number;
  finishTimeSec?: number;
}
```

to:

```ts
export interface RankedPlayer {
  player: Player;
  route: RouteStep[];
  steps: number;
  finishTimeSec?: number;
}
```

- [ ] **Step 2: Typecheck**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

## Task 2: Create RouteReplay Modal Component

**Files:**
- Create: `components/RouteReplay.tsx`

- [ ] **Step 1: Create component file**

Write `components/RouteReplay.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { computeResultBadges, type AchievementBadge } from "@/lib/achievements";
import { avatarColor, initials } from "@/lib/avatar";
import type { RouteStep } from "@/lib/types";

import type { RankedPlayer } from "./Results";

interface RouteReplayProps {
  rows: RankedPlayer[];
  winnerId: string | null;
  onClose: () => void;
}

type Speed = 1 | 2 | 4;
type StepIndexes = Record<string, number>;

export default function RouteReplay({
  rows,
  winnerId,
  onClose,
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
    scheduleNextStep();
    return clearReplayTimeout;
  }, [clearReplayTimeout, playing, scheduleNextStep, stepIndexes]);

  useEffect(() => clearReplayTimeout, [clearReplayTimeout]);

  useEffect(() => {
    setSelectedIds(playableRows.map((row) => row.player.clientId));
    setStepIndexes(buildInitialStepIndexes(playableRows));
    simulatedTimeRef.current = 0;
    setPlaying(false);
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

  return (
    <div
      className="fixed inset-0 z-50 flex bg-charcoal-text/95 px-4 py-4 text-warm-cream sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Bandingkan rute pemain"
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div
              className="font-black text-warm-cream"
              style={{ fontSize: "var(--text-heading)", lineHeight: 1 }}
            >
              Bandingkan Rute
            </div>
            <p className="mt-1 text-warm-cream/70" style={{ fontSize: "14px" }}>
              Replay langkah pemain secara bersamaan.
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
            Tutup
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
}: {
  row: RankedPlayer;
  winnerId: string | null;
  visibleIndex: number;
}) {
  const { player, route } = row;
  const color = avatarColor(player.username);
  const badges = computeResultBadges({ player, route, winnerId });
  const statusLabel = player.status === "finished" ? "✓ Finish" : player.status === "surrendered" ? "■ Menyerah" : "● Playing";

  return (
    <section
      className="flex min-h-[320px] flex-col overflow-hidden bg-warm-cream text-charcoal-text"
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
```

- [ ] **Step 2: Typecheck**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

## Task 3: Add Replay Button To Results

**Files:**
- Modify: `components/Results.tsx`

- [ ] **Step 1: Import RouteReplay**

Add import below avatar import:

```ts
import RouteReplay from "./RouteReplay";
```

- [ ] **Step 2: Add modal state**

After `const [leaveLoading, setLeaveLoading] = useState(false);`, add:

```ts
  const [showReplay, setShowReplay] = useState(false);
```

- [ ] **Step 3: Add replay button in route section header**

Replace route section heading block:

```tsx
          <h2
            className="font-extrabold text-charcoal-text"
            style={{
              fontSize: "var(--text-heading)",
              lineHeight: "var(--leading-heading)",
            }}
          >
            Rute pemain
          </h2>
```

with:

```tsx
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
```

- [ ] **Step 4: Render modal**

Before closing `</main>`, add:

```tsx
      {showReplay && (
        <RouteReplay
          rows={ranked}
          winnerId={winnerId}
          onClose={() => setShowReplay(false)}
        />
      )}
```

- [ ] **Step 5: Typecheck**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

## Task 4: Final Validation And Commit

**Files:**
- Verify: `components/RouteReplay.tsx`
- Verify: `components/Results.tsx`

- [ ] **Step 1: Run typecheck**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 3: Manual validation**

Run:

```bash
pnpm dev
```

Manual checks:
1. Finish race with at least 2 players.
2. Open Results.
3. Click `Bandingkan Rute`.
4. Modal opens fullscreen.
5. Player selector toggles columns.
6. Play reveals route steps side-by-side.
7. Pause stops replay.
8. Play resumes from current positions.
9. Reset returns every selected player to first step.
10. Speed cycles 1x/2x/4x.
11. Close returns to Results.

- [ ] **Step 4: Commit replay feature**

Run:

```bash
git add components/RouteReplay.tsx components/Results.tsx docs/superpowers/plans/2026-05-28-route-replay.md
git commit -m "$(cat <<'EOF'
feat: add side-by-side route replay

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## Self-Review

- Spec coverage: modal, player selector, side-by-side columns, play/pause/reset/speed, no API/schema changes, validation covered.
- Placeholder scan: no TBD/TODO/fill-in placeholders.
- Type consistency: `RouteReplay`, `RankedPlayer`, `RouteStep`, `AchievementBadge`, `StepIndexes`, `Speed` match all tasks.
