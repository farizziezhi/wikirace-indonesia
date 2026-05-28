# Side-by-Side Route Replay Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add modal overlay for animated side-by-side route replay in Results page.

**Architecture:** New `RouteReplay` component renders inside a fullscreen modal. Pure setTimeout loop drives step-by-step animation based on existing `route[].timestamp` data. No API, no Redis schema changes, no Ably payloads.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 design tokens.

---

## Scope

- **In scope:** modal overlay, player selector, side-by-side columns, animated step-by-step playback, play/pause/reset controls, speed multiplier.
- **Out of scope:** persistent replay storage, real-time replay during live race, audio during replay, route visualization on Wikipedia article.

## Trigger

- Button "Bandingkan Rute" in the header of "Rute pemain" section in Results.
- Opens fullscreen modal overlay (z-50, bg-charcoal-text/95).
- Close button in modal header (top-right).

## Modal Layout

```
┌────────────────────────────────────────────────────┐
│ Bandingkan Rute                          [X Close] │
├────────────────────────────────────────────────────┤
│ [✓] Andi  [✓] Budi  [✓] Citra                     │
├──────────────┬──────────────┬──────────────┐        │
│ Andi 🏆      │ Budi         │ Citra        │        │
│ ● Indonesia  │ ● Indonesia  │ ● Indonesia  │        │
│ ● Jakarta    │ ● Jawa       │ ● Jakarta    │        │
│ (berikutnya) │ ● Surabaya   │ (berikutnya) │        │
│              │ (berikutnya) │              │        │
├──────────────┴──────────────┴──────────────┤        │
│  [▶ Play]  [⏸ Pause]  [↺ Reset]  [Speed: 1x]     │
└────────────────────────────────────────────────────┘
```

- Columns: 2 on mobile, 3+ on desktop (responsive grid).
- Each column scrolls independently if route is long.
- Player selector: checkboxes at top of modal. Default: all checked. Unchecking hides that column.

## Replay Engine

State:
- `stepIndex`: `Record<string, number>` — current visible step count per player (`clientId` → index into `route[]`).
- `playing`: boolean.
- `speed`: `1 | 2 | 4` (default 1).

Normalization:
- All players share same `startTime`.
- Delta between consecutive steps: `route[i+1].timestamp - route[i].timestamp`.
- Steps at index 0 (start article) always visible immediately.

Play loop:
1. If `playing`, find player with smallest next-step timestamp among all players with remaining steps.
2. Schedule `setTimeout` with delta from current simulated time, divided by speed.
3. On fire: increment `stepIndex` for that player, update state, schedule next.
4. If no player has remaining steps, stop.

Pause:
- Clear timeout. Keep `stepIndex` positions.

Reset:
- Set all `stepIndex` to 0. Clear timeout. Set `playing` to false.

Speed:
- Cycle through 1x → 2x → 4x on button click.
- Only affects next scheduled timeout, not in-flight.

## Column UI

Each column:
- Header: avatar circle (existing `avatarColor` + `initials`), player name, achievement badges, status indicator (✓ finished, ■ surrendered).
- List of article pills, vertically stacked.
- Already visible: `bg-lime-accent text-charcoal-text` pill with step number.
- Currently appearing (just revealed): fade-in + subtle scale-up transition (`opacity 0→1, transform scale(0.95)→1`).
- Not yet visible: `opacity-0 h-0` (collapsed, no layout shift).
- Column auto-scrolls to keep latest revealed article in view.

## Files

| File | Action | Purpose |
|------|--------|---------|
| `components/RouteReplay.tsx` | Create | Modal overlay + replay engine + column UI |
| `components/Results.tsx` | Modify | Add "Bandingkan Rute" button, modal state, render RouteReplay |

## Testing

- `pnpm exec tsc --noEmit` after each file.
- `pnpm lint` after all changes.
- Manual: finish a race with 2+ players, open Results, click "Bandingkan Rute", select players, click Play, verify steps appear synchronized, pause/resume works, reset works, speed cycle works, close modal works.
- Edge: single player (should still work), surrendered player (stops early), empty route (shows start article only).
