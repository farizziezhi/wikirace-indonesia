# Mini Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add floating top-right mini leaderboard to Game.tsx showing live player progress during countdown and race.

**Architecture:** Add `computeMiniLeaderboard()` to `lib/achievements.ts`. Render floating panel in `components/Game.tsx`. Computed from existing `room.players` on every render.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 design tokens.

---

## Task 1: Add Mini Leaderboard Helper

**Files:**
- Modify: `lib/achievements.ts`

- [ ] **Step 1: Add helper to achievements.ts**

Read `lib/achievements.ts`, then add at the bottom before closing:

```ts
interface MiniLeaderboardEntry {
  clientId: string;
  username: string;
  steps: number;
  isMe: boolean;
  isWinner: boolean;
  isSurrendered: boolean;
  status: Player["status"];
}

interface ComputeMiniLeaderboardInput {
  players: Player[];
  currentClientId: string;
  winnerClientId: string | null;
}

export function computeMiniLeaderboard({
  players,
  currentClientId,
  winnerClientId,
}: ComputeMiniLeaderboardInput): MiniLeaderboardEntry[] {
  const entries: MiniLeaderboardEntry[] = players
    .filter((p) => p.status !== "waiting")
    .map((p) => ({
      clientId: p.clientId,
      username: p.username,
      steps: Math.max(0, p.route.length - 1),
      isMe: p.clientId === currentClientId,
      isWinner: p.clientId === winnerClientId,
      isSurrendered: p.status === "surrendered",
      status: p.status,
    }));

  return entries.sort((a, b) => {
    if (a.isMe) return -1;
    if (b.isMe) return 1;
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    if (a.isSurrendered !== b.isSurrendered) {
      return a.isSurrendered ? 1 : -1;
    }
    return b.steps - a.steps;
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/achievements.ts
git commit -m "$(cat <<'EOF'
feat: add mini leaderboard helper

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## Task 2: Add Floating Leaderboard To Game

**Files:**
- Modify: `components/Game.tsx`

- [ ] **Step 1: Import helper**

Add import:

```ts
import { computeLiveBadges, computeMiniLeaderboard } from "@/lib/achievements";
```

- [ ] **Step 2: Compute leaderboard**

After `hasSurrendered` declaration, add:

```ts
  const miniBoard = computeMiniLeaderboard({
    players: room.players,
    currentClientId,
    winnerClientId: null,
  });

  const allDone = room.players.every(
    (p) => p.status === "finished" || p.status === "surrendered" || p.status === "waiting",
  );
  const showMiniBoard = !allDone && room.players.length > 1;
```

- [ ] **Step 3: Render floating panel**

After the countdown overlay block and before the sticky header, add:

```tsx
      {showMiniBoard && (
        <div
          className="fixed right-3 top-3 z-30 flex w-[200px] flex-col gap-1 bg-charcoal-text text-warm-cream"
          style={{
            borderRadius: "var(--radius-input)",
            padding: "8px 10px",
            boxShadow: "var(--shadow-floating)",
          }}
        >
          <div
            className="font-bold uppercase text-warm-cream/70"
            style={{ fontSize: "10px", letterSpacing: "0.5px" }}
          >
            Papan Skor
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
              <span className="shrink-0 tabular-nums opacity-80" style={{ fontSize: "12px" }}>
                {entry.isSurrendered ? "■" : entry.status === "finished" ? "✓" : `${entry.steps}`}
              </span>
            </div>
          ))}
        </div>
      )}
```

- [ ] **Step 4: Add initials helper**

At the bottom of Game.tsx, near other helpers, add:

```ts
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/Game.tsx
git commit -m "$(cat <<'EOF'
feat: add floating mini leaderboard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## Task 3: Final Validation

**Files:**
- Verify: `lib/achievements.ts`
- Verify: `components/Game.tsx`

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Manual validation**

Run: `pnpm dev`

Manual checks:
1. Create room, join from 2 tabs.
2. Start race. Countdown overlay visible.
3. After countdown, mini leaderboard visible top-right.
4. Click links in both tabs. Step count updates.
5. Finish in one tab. Winner highlight appears.
6. Surrender in other tab. Panel hides (all done).

## Self-Review

- Spec coverage: helper, floating UI, winner/surrender/status indicators, auto-hide when all done.
- No placeholders.
- Type consistency: `MiniLeaderboardEntry`, `computeMiniLeaderboard`, `Player` all match.
