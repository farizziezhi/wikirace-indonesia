# Countdown Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a synchronized 3-second race countdown with best-effort browser audio.

**Architecture:** Server shifts `startTime` three seconds into the future. `Game.tsx` treats `startTime` as real race start, blocks navigation during countdown, and displays overlay while article content loads behind it. `lib/race-audio.ts` owns Web Audio unlock/playback, and `app/page.tsx` owns the one-click home-page audio prompt.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Web Audio API, localStorage, existing Ably room events.

---

## File Structure

- Create `lib/race-audio.ts`: client-side Web Audio helper with unlock and beep functions.
- Modify `app/page.tsx`: floating "Aktifkan audio race" prompt, unlock state, localStorage persistence.
- Modify `app/api/room/start/route.ts`: schedule race start 3 seconds in future.
- Modify `components/Game.tsx`: countdown state, overlay UI, countdown beeps, navigation lock before race start.
- Modify `app/globals.css`: countdown overlay animation utilities if inline styles are not enough.

---

### Task 1: Add Race Audio Helper

**Files:**
- Create: `lib/race-audio.ts`

- [ ] **Step 1: Create `lib/race-audio.ts`**

```ts
let audioContext: AudioContext | null = null;
let unlocked = false;

const STORAGE_KEY = "wikirace:audio-unlocked";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) audioContext = new AudioContextCtor();
  return audioContext;
}

export function isRaceAudioUnlocked(): boolean {
  if (unlocked) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export async function unlockRaceAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") await ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.03);

    unlocked = true;
    window.localStorage.setItem(STORAGE_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function playCountdownBeep(step: "3" | "2" | "1" | "GO"): void {
  if (!isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = step === "GO" ? 880 : 520;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(step === "GO" ? 0.14 : 0.09, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (step === "GO" ? 0.18 : 0.12));

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + (step === "GO" ? 0.2 : 0.14));
}
```

- [ ] **Step 2: Add global TypeScript declaration for webkitAudioContext if needed**

If TypeScript reports `webkitAudioContext` missing, add this to top of `lib/race-audio.ts` before variables:

```ts
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: PASS. If `webkitAudioContext` errors, apply Step 2 and run again.

---

### Task 2: Add Home Audio Unlock Prompt

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Import audio helpers**

At top of `app/page.tsx`, add:

```ts
import { isRaceAudioUnlocked, unlockRaceAudio } from "@/lib/race-audio";
```

- [ ] **Step 2: Add state**

Inside `HomePage`, near existing state declarations:

```ts
const [audioUnlocked, setAudioUnlocked] = useState(false);
```

- [ ] **Step 3: Initialize state after hydration**

Inside existing `useEffect` after `setHydrated(true);`, add:

```ts
setAudioUnlocked(isRaceAudioUnlocked());
```

- [ ] **Step 4: Add click handler**

Before `validateUsername`, add:

```ts
async function handleEnableAudio() {
  const ok = await unlockRaceAudio();
  setAudioUnlocked(ok);
}
```

- [ ] **Step 5: Render prompt with floating notifications**

Inside existing floating notification block, include this before invited/toast content or create a sibling fixed wrapper if notification block only renders when toast/invite exists:

```tsx
{hydrated && !audioUnlocked && (
  <button
    type="button"
    onClick={handleEnableAudio}
    className="pointer-events-auto bg-charcoal-text text-warm-cream"
    style={{
      border: "1px solid var(--color-warm-gray)",
      borderRadius: "var(--radius-rounded)",
      padding: "10px 14px",
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1.4,
      boxShadow: "var(--shadow-floating)",
    }}
  >
    Aktifkan audio race
  </button>
)}
```

- [ ] **Step 6: Run typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 3: Schedule Server Start Time In Future

**Files:**
- Modify: `app/api/room/start/route.ts`

- [ ] **Step 1: Add constant**

Near imports or before `POST`:

```ts
const COUNTDOWN_MS = 3000;
```

- [ ] **Step 2: Change start time**

Replace:

```ts
const startTime = Date.now();
```

with:

```ts
const startTime = Date.now() + COUNTDOWN_MS;
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 4: Add Countdown Overlay To Game

**Files:**
- Modify: `components/Game.tsx`

- [ ] **Step 1: Import audio helper**

Add:

```ts
import { playCountdownBeep } from "@/lib/race-audio";
```

- [ ] **Step 2: Add countdown state helpers**

After elapsed timer effect, add:

```ts
const [now, setNow] = useState(() => Date.now());

useEffect(() => {
  if (Date.now() >= normalizedStartTime) return;

  const id = window.setInterval(() => {
    setNow(Date.now());
  }, 100);

  return () => window.clearInterval(id);
}, [normalizedStartTime]);

const countdownLabel = getCountdownLabel(normalizedStartTime, now);
const countdownActive = countdownLabel !== null;
```

- [ ] **Step 3: Play beep once per countdown label**

Add refs near other refs:

```ts
const lastCountdownBeepRef = useRef<string | null>(null);
```

Add effect after `countdownLabel`:

```ts
useEffect(() => {
  if (!countdownLabel) return;
  if (lastCountdownBeepRef.current === countdownLabel) return;
  lastCountdownBeepRef.current = countdownLabel;
  playCountdownBeep(countdownLabel);
}, [countdownLabel]);
```

- [ ] **Step 4: Block navigation before start**

In `handleNavigate`, after surrender check, add:

```ts
if (Date.now() < normalizedStartTime) return;
```

Add `normalizedStartTime` to dependency array.

- [ ] **Step 5: Render overlay**

Inside `return`, right after opening `<div className="flex flex-1 flex-col bg-warm-cream">`, add:

```tsx
{countdownActive && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/90 px-6 text-center text-warm-cream"
    aria-live="assertive"
    aria-label="Countdown race"
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
        Race starting
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 6: Add helper function**

Near bottom before `formatElapsed`, add:

```ts
function getCountdownLabel(startTime: number, now: number): "3" | "2" | "1" | "GO" | null {
  const remaining = startTime - now;
  if (remaining <= 0) return null;
  if (remaining > 2000) return "3";
  if (remaining > 1000) return "2";
  if (remaining > 250) return "1";
  return "GO";
}
```

- [ ] **Step 7: Run typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 5: Validate And Commit

**Files:**
- Validate all changed files.

- [ ] **Step 1: Run lint**

Run: `pnpm lint`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Manual test**

Run: `pnpm dev`

Manual checks:
- Home page shows "Aktifkan audio race" until clicked.
- Click prompt; prompt disappears.
- Create room with two tabs.
- Start game; countdown overlay appears in both tabs.
- Timer displays `00:00` during countdown.
- Article links do not navigate during countdown.
- Overlay disappears after countdown.
- Article links work after countdown.

- [ ] **Step 4: Commit feature**

```bash
git add lib/race-audio.ts app/page.tsx app/api/room/start/route.ts components/Game.tsx
git commit -m "$(cat <<'EOF'
feat: add race countdown audio

Add a synchronized pre-race countdown overlay with best-effort browser audio unlock.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

Spec coverage:
- Countdown overlay: Task 4.
- Article loads behind overlay: Task 4 renders overlay without delaying `WikiArticle`.
- Link blocking during countdown: Task 4 Step 4.
- Audio unlock prompt: Task 2.
- Web Audio helper: Task 1.
- Future `startTime`: Task 3.
- Validation: Task 5.

Placeholder scan: no placeholders.

Type consistency: `countdownLabel` uses union `"3" | "2" | "1" | "GO" | null`, matching `playCountdownBeep` parameter.
