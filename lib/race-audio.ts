declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

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
  gain.gain.exponentialRampToValueAtTime(
    step === "GO" ? 0.14 : 0.09,
    now + 0.01,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + (step === "GO" ? 0.18 : 0.12),
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + (step === "GO" ? 0.2 : 0.14));
}
