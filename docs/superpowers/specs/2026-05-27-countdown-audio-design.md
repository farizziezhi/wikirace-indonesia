# Countdown + Race Audio Design

## Goal

Add first race-feel feature as one focused commit: a synchronized countdown overlay before gameplay starts, with optional audio unlocked from the home page.

## Scope

In scope:
- Show a 3-second countdown overlay after host starts the game.
- Let article content begin loading behind the overlay.
- Prevent link navigation until countdown finishes.
- Try to play countdown beeps if user has unlocked audio.
- Add a small home-page audio unlock prompt.

Out of scope for this commit:
- Achievement badges.
- Route replay.
- Mini leaderboard.
- Spectator mode.
- Random race presets.

## UX Flow

1. User opens home page.
2. Home page shows a small non-blocking prompt: "Aktifkan audio race".
3. User clicks prompt once. App unlocks Web Audio and saves preference in `localStorage`.
4. Host starts game from lobby.
5. Server publishes `game_started` with `startTime = Date.now() + 3000`.
6. All clients transition to `Game` immediately.
7. `Game` shows fullscreen overlay: `3`, `2`, `1`, `GO`.
8. Wikipedia article loads in background while overlay is visible.
9. Article link clicks are ignored until countdown ends.
10. Overlay disappears when current time reaches `startTime`.

## Components

### Home page

`app/page.tsx` gets a small audio prompt component/state:
- Reads `wikirace:audio-unlocked` from `localStorage` after hydration.
- If not unlocked, shows a compact floating CTA.
- On click, calls audio unlock helper and stores success.

### Audio helper

Add a small client-only helper in `lib/race-audio.ts`:
- `unlockRaceAudio(): Promise<boolean>` creates/resumes `AudioContext` after user gesture and plays a silent/near-silent oscillator.
- `playCountdownBeep(step: "3" | "2" | "1" | "GO")` tries to play short oscillator tone if audio was unlocked.
- If browser blocks audio, it fails silently.

### Start API

`app/api/room/start/route.ts` changes `startTime` from immediate `Date.now()` to future `Date.now() + 3000`.

### Game page

`components/Game.tsx` uses `startTime` as actual race start:
- Timer remains `0:00` during countdown because elapsed is clamped to zero.
- Add derived countdown state based on `startTime - Date.now()`.
- Show overlay while countdown is active.
- Call `playCountdownBeep` once per visible countdown step.
- Block `handleNavigate` before countdown ends.

## Data Flow

No new server state is needed.

Existing `game_started` event already carries `startTime`, `startArticle`, and `endArticle`. The only semantic change is that `startTime` can be in the future. All clients use that same timestamp to synchronize overlay and timer.

## Error Handling

- Audio unlock failure: hide no critical UI, keep game playable, optionally leave prompt available.
- Countdown audio playback failure: ignore; visual countdown remains source of truth.
- Clock skew: small visual mismatch possible between clients, acceptable for this scope because existing timer already uses client clock.

## Testing

Manual:
- Open home page, click audio prompt, verify prompt disappears.
- Create room with two tabs, start game, verify countdown appears in both tabs.
- During countdown, article links cannot navigate.
- After countdown, article links navigate normally.
- Timer starts at `00:00` after countdown, not before.
- Browser with audio blocked still shows countdown and remains playable.

Automated/validation:
- `pnpm lint`
- `pnpm exec tsc --noEmit`

## Commit Strategy

One commit for countdown + audio unlock only. Later commits handle achievements, route replay, and mini leaderboard.
