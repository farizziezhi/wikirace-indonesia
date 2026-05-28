# Mini Leaderboard Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add floating top-right mini leaderboard to Game.tsx showing live player progress during countdown and race.

**Architecture:** Compute leaderboard from existing `room.players` on every render. No new state, no API, no Ably subscription changes. Ably `room_updated` already syncs player state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 design tokens.

---

## Scope

- **In scope:** floating top-right panel, pre-race start list, live step count, winner highlight, surrender indicator.
- **Out of scope:** persistent leaderboard, realtime player_moved subscription, mini leaderboard in Results.

## UI

- Fixed top-right, z-30, max-width 220px.
- Appears during countdown and while race is active.
- Hides when all players finished/surrendered.
- Each row: small avatar circle + username + step count or status.
- Current player: thicker left border or highlight.
- Winner: lime accent + "✓ Winner".
- Surrendered: "■" + username.
- Scrollable overflow for 5+ players.

## Data Flow

- `room.players` is already synced via Ably `room_updated`.
- `computeLeaderboard()` on render:
  - Filter out waiting players.
  - Sort: current player first, then by step count descending.
  - Derive: `steps = route.length - 1`, `isWinner`, `isSurrendered`.
- No new hooks, no new state, no new API.

## Files

| File | Action | Purpose |
|------|--------|---------|
| `lib/achievements.ts` | Modify | Add `computeLeaderboard()` pure helper |
| `components/Game.tsx` | Modify | Import helper, render floating panel |

## Testing

- `pnpm exec tsc --noEmit` after each file.
- `pnpm lint` after all changes.
- Manual: create room with 2+ players, start race, verify:
  - Pre-countdown: start list visible.
  - During race: step count updates.
  - Player finishes: winner highlight appears.
  - Player surrenders: surrender indicator appears.
  - All done: panel hides.
