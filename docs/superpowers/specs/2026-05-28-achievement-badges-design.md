# Achievement Badges Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add computed per-room achievement badges visible during live race and in results.

**Architecture:** Pure helper `lib/achievements.ts` computes badge set from existing room state. No Redis schema change, no API change, no persistent profile storage. Badges are recomputed on render from `players`, `allRoutes`, `winnerId`, and current player's `route`/`status`.

**Tech Stack:** TypeScript, React 19, existing Tailwind design tokens.

---

## Scope

- **In scope:** computed badges per room, live badge strip in Game top bar (current player only), badge chips in Results leaderboard + route accordion.
- **Out of scope:** persistent user profiles, badge history across rooms, storage in Redis, new API endpoints.

## Badge Set v1

| Badge | Condition | Color |
|-------|-----------|-------|
| Winner | Player is `winnerId` | lime |
| Speedrun | Finished in under 60s | lime |
| Minimalist | Finished in 5 clicks or less | lime |
| Explorer | Route has 10+ clicks | warm-cream |
| Last Stand | Surrendered after 5+ clicks | warm-cream |
| First Move | Live: player has at least 1 click | lime |
| On Track | Live: player status is `playing` | warm-cream |

Badges are mutually exclusive where overlapping (e.g. Winner + Speedrun both show). A player can have multiple badges.

## Data Flow

### Live (Game.tsx)
```
const liveBadges = computeLiveBadges({
  route: me.route,
  status: me.status,
});
```
- `me` comes from `room.players.find(p => p.clientId === currentClientId)`.
- `computeLiveBadges` returns `Badge[]` for current player only.
- Rendered as small pill strip below the timer in the sticky top bar.

### Results (Results.tsx)
```
const playerBadges = computeResultBadges({
  player: ranked[i],
  winnerId: winnerId,
  startTime: room.startTime,
});
```
- `computeResultBadges` returns `Badge[]` per player.
- Rendered as chips under each leaderboard player name and inside route accordion header.
- Uses existing `ranked` array and `allRoutes` from parent props.

## Badge Pill Style

```tsx
<span
  className="inline-flex items-center gap-1 bg-lime-accent text-charcoal-text font-bold"
  style={{
    borderRadius: "var(--radius-button)",
    padding: "3px 10px",
    fontSize: "12px",
    letterSpacing: "0.3px",
  }}
>
  {badge.icon} {badge.label}
</span>
```

Color variants:
- lime: `bg-lime-accent text-charcoal-text` (Winner, Speedrun, Minimalist, First Move)
- warm: `bg-warm-cream text-charcoal-text border border-warm-gray` (Explorer, Last Stand, On Track)

## UI Placement

### Game.tsx (live)
- Below sticky top bar timer row, only if `liveBadges.length > 0`.
- Horizontal scroll on overflow for many badges.
- Badges animate in with subtle opacity transition.

### Results.tsx (results)
- Under each player name in leaderboard.
- Inside route accordion header next to player name.
- Same pill style, same color variants.

## Files

| File | Action | Purpose |
|------|--------|---------|
| `lib/achievements.ts` | Create | Pure helper: `computeLiveBadges`, `computeResultBadges`, `Badge` type |
| `components/Game.tsx` | Modify | Add live badge strip in top bar |
| `components/Results.tsx` | Modify | Add badge chips to leaderboard + route accordion |

## Testing

- `pnpm exec tsc --noEmit` after each file.
- `pnpm lint` after all changes.
- Manual: create room, start race, click once (First Move), finish fast (Winner + Speedrun + Minimalist), confirm live badges during race and result badges after.
- Edge: surrender (Last Stand), many clicks (Explorer), no clicks (On Track only).
