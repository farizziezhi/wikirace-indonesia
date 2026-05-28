# Achievement Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add computed per-room achievement badges visible during live race and in results.

**Architecture:** Create pure `lib/achievements.ts` helper that derives badges from existing player route/status data. Add reusable badge pill rendering in `Game.tsx` and `Results.tsx` without changing Redis schema, Ably payloads, or API routes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 design tokens.

---

## File Structure

- Create `lib/achievements.ts`
  - Owns `AchievementBadge`, `AchievementBadgeTone`, `computeLiveBadges`, and `computeResultBadges`.
  - No browser APIs, no React, no side effects.
- Modify `components/Game.tsx`
  - Imports `computeLiveBadges` and badge type.
  - Computes current-player live badges from `me`.
  - Renders small badge strip in sticky top bar.
- Modify `components/Results.tsx`
  - Imports `computeResultBadges` and badge type.
  - Computes badges per ranked row.
  - Renders badge chips in leaderboard row and route accordion header.

## Task 1: Add Achievement Helper

**Files:**
- Create: `lib/achievements.ts`

- [ ] **Step 1: Create helper file**

Write `lib/achievements.ts`:

```ts
import type { Player, RouteStep } from "./types";

export type AchievementBadgeTone = "lime" | "warm";

export interface AchievementBadge {
  id:
    | "winner"
    | "speedrun"
    | "minimalist"
    | "explorer"
    | "last-stand"
    | "first-move"
    | "on-track";
  label: string;
  icon: string;
  tone: AchievementBadgeTone;
}

interface ComputeLiveBadgesInput {
  route: RouteStep[];
  status: Player["status"];
}

interface ComputeResultBadgesInput {
  player: Player;
  route: RouteStep[];
  winnerId: string | null;
}

export function computeLiveBadges({
  route,
  status,
}: ComputeLiveBadgesInput): AchievementBadge[] {
  const badges: AchievementBadge[] = [];
  const steps = countClicks(route);

  if (status === "playing") {
    badges.push({
      id: "on-track",
      label: "On Track",
      icon: "●",
      tone: "warm",
    });
  }

  if (steps >= 1) {
    badges.push({
      id: "first-move",
      label: "First Move",
      icon: "⚡",
      tone: "lime",
    });
  }

  if (steps >= 10) {
    badges.push({
      id: "explorer",
      label: "Explorer",
      icon: "↗",
      tone: "warm",
    });
  }

  return badges;
}

export function computeResultBadges({
  player,
  route,
  winnerId,
}: ComputeResultBadgesInput): AchievementBadge[] {
  const badges: AchievementBadge[] = [];
  const steps = countClicks(route);
  const finishTime = getFinishTime(player, route);

  if (winnerId === player.clientId) {
    badges.push({
      id: "winner",
      label: "Winner",
      icon: "🏆",
      tone: "lime",
    });
  }

  if (finishTime !== undefined && finishTime < 60) {
    badges.push({
      id: "speedrun",
      label: "Speedrun",
      icon: "⚡",
      tone: "lime",
    });
  }

  if (player.status === "finished" && steps <= 5) {
    badges.push({
      id: "minimalist",
      label: "Minimalist",
      icon: "◇",
      tone: "lime",
    });
  }

  if (steps >= 10) {
    badges.push({
      id: "explorer",
      label: "Explorer",
      icon: "↗",
      tone: "warm",
    });
  }

  if (player.status === "surrendered" && steps >= 5) {
    badges.push({
      id: "last-stand",
      label: "Last Stand",
      icon: "■",
      tone: "warm",
    });
  }

  return badges;
}

function countClicks(route: RouteStep[]): number {
  return Math.max(0, route.length - 1);
}

function getFinishTime(
  player: Player,
  route: RouteStep[],
): number | undefined {
  if (player.status !== "finished") return undefined;
  if (route.length === 0) return undefined;
  return route[route.length - 1].timestamp;
}
```

- [ ] **Step 2: Typecheck helper**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit helper**

Run:

```bash
git add lib/achievements.ts
git commit -m "$(cat <<'EOF'
feat: add computed achievement helpers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## Task 2: Add Live Badges To Game

**Files:**
- Modify: `components/Game.tsx`

- [ ] **Step 1: Import helper and type**

In `components/Game.tsx`, change imports near existing race audio import:

```ts
import {
  computeLiveBadges,
  type AchievementBadge,
} from "@/lib/achievements";
import { playCountdownBeep } from "@/lib/race-audio";
```

- [ ] **Step 2: Compute live badges**

After `hasSurrendered` is declared, add:

```ts
  const liveBadges = me
    ? computeLiveBadges({ route: me.route, status: me.status })
    : [];
```

- [ ] **Step 3: Render live badge strip**

Inside `<header>`, after the first top-bar `<div ...>` closes and before surrendered banner, add:

```tsx
        {liveBadges.length > 0 && (
          <div className="border-t border-warm-gray bg-light-beige">
            <div className="mx-auto flex w-full max-w-[920px] gap-2 overflow-x-auto px-4 py-2 sm:px-6">
              {liveBadges.map((badge) => (
                <AchievementBadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}
```

- [ ] **Step 4: Add badge pill component**

Before `function normalizeStartTime`, add:

```tsx
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
```

- [ ] **Step 5: Typecheck live UI**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit live UI**

Run:

```bash
git add components/Game.tsx
git commit -m "$(cat <<'EOF'
feat: show live achievement badges

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## Task 3: Add Result Badges

**Files:**
- Modify: `components/Results.tsx`

- [ ] **Step 1: Import helper and type**

In `components/Results.tsx`, add import below avatar import:

```ts
import {
  computeResultBadges,
  type AchievementBadge,
} from "@/lib/achievements";
```

- [ ] **Step 2: Pass `winnerId` into leaderboard rows**

Change leaderboard render from:

```tsx
              <LeaderboardRow
                key={row.player.clientId}
                position={index + 1}
                row={row}
                isMe={row.player.clientId === currentClientId}
                isWinner={winnerId === row.player.clientId}
              />
```

to:

```tsx
              <LeaderboardRow
                key={row.player.clientId}
                position={index + 1}
                row={row}
                isMe={row.player.clientId === currentClientId}
                isWinner={winnerId === row.player.clientId}
                winnerId={winnerId}
              />
```

- [ ] **Step 3: Pass `winnerId` into route accordions**

Change route render from:

```tsx
              <RouteAccordion
                key={row.player.clientId}
                row={row}
                openByDefault={winnerId === row.player.clientId}
                isMe={row.player.clientId === currentClientId}
              />
```

to:

```tsx
              <RouteAccordion
                key={row.player.clientId}
                row={row}
                openByDefault={winnerId === row.player.clientId}
                isMe={row.player.clientId === currentClientId}
                winnerId={winnerId}
              />
```

- [ ] **Step 4: Update leaderboard props**

Change `LeaderboardRowProps` to:

```ts
interface LeaderboardRowProps {
  position: number;
  row: RankedPlayer;
  isMe: boolean;
  isWinner: boolean;
  winnerId: string | null;
}
```

Change function signature to:

```ts
function LeaderboardRow({
  position,
  row,
  isMe,
  isWinner,
  winnerId,
}: LeaderboardRowProps) {
```

- [ ] **Step 5: Compute leaderboard badges**

Inside `LeaderboardRow`, after `const color = avatarColor(player.username);`, add:

```ts
  const achievementBadges = computeResultBadges({
    player,
    route: row.route,
    winnerId,
  });
```

- [ ] **Step 6: Render leaderboard badges**

Inside leaderboard row text block, after the click/time `<div className="text-charcoal-text/80" ...>` closes, add:

```tsx
        {achievementBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {achievementBadges.map((badge) => (
              <AchievementBadgePill key={badge.id} badge={badge} />
            ))}
          </div>
        )}
```

- [ ] **Step 7: Update route accordion props**

Change `RouteAccordionProps` to:

```ts
interface RouteAccordionProps {
  row: RankedPlayer;
  openByDefault: boolean;
  isMe: boolean;
  winnerId: string | null;
}
```

Change function signature to:

```ts
function RouteAccordion({
  row,
  openByDefault,
  isMe,
  winnerId,
}: RouteAccordionProps) {
```

- [ ] **Step 8: Compute route badges**

Inside `RouteAccordion`, after `const color = avatarColor(player.username);`, add:

```ts
  const achievementBadges = computeResultBadges({
    player,
    route,
    winnerId,
  });
```

- [ ] **Step 9: Render route badges**

Inside route accordion summary text block, after metadata `<div className="text-charcoal-text/70" ...>` closes, add:

```tsx
          {achievementBadges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {achievementBadges.map((badge) => (
                <AchievementBadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          )}
```

- [ ] **Step 10: Add badge pill component**

Before `interface RankedPlayer`, add:

```tsx
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
```

- [ ] **Step 11: Typecheck results UI**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 12: Commit results UI**

Run:

```bash
git add components/Results.tsx
git commit -m "$(cat <<'EOF'
feat: show result achievement badges

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## Task 4: Final Validation

**Files:**
- Verify: `lib/achievements.ts`
- Verify: `components/Game.tsx`
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

1. Open two browser tabs.
2. Create room and join from second tab.
3. Set start/end articles and start race.
4. During countdown, no achievement badges required.
5. After first click, current player sees `First Move` in Game top bar.
6. While still playing, current player sees `On Track`.
7. Finish race in under 60 seconds and 5 clicks or less.
8. Results page shows `Winner`, `Speedrun`, and `Minimalist` for winner.
9. Surrender from another player after 5+ clicks and confirm `Last Stand` appears.
10. Click 10+ times and confirm `Explorer` appears.

Expected: live badges and result badges match conditions.

- [ ] **Step 4: Final git status**

Run:

```bash
git status --short
```

Expected: no modified tracked files from this feature. Existing unrelated untracked files may remain untouched.

## Self-Review

- Spec coverage: helper, live Game badges, Results badges, styling, no persistence, validation all covered.
- Placeholder scan: no TBD/TODO/fill-in placeholders.
- Type consistency: `AchievementBadge`, `computeLiveBadges`, `computeResultBadges`, `Player`, and `RouteStep` names match all tasks.
