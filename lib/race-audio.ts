declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

let audioContext: AudioContext | null = null;
let unlocked = false;

const STORAGE_KEY = "wikirace:audio-unlocked";
const MUTE_STORAGE_KEY = "wikirace:audio-muted";

let isMuted = false;
if (typeof window !== "undefined") {
  try {
    isMuted = window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    // ignore
  }
}

export function isAudioMuted(): boolean {
  return isMuted;
}

export function toggleMuteAudio(): boolean {
  isMuted = !isMuted;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, isMuted ? "1" : "0");
    } catch {
      // ignore
    }
  }
  return isMuted;
}

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
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

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

export function playCheatAlarm(): void {
  if (isAudioMuted()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
  } catch {
    // ignore
  }

  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.linearRampToValueAtTime(880, now + 0.15);
  osc.frequency.linearRampToValueAtTime(440, now + 0.3);
  osc.frequency.linearRampToValueAtTime(880, now + 0.45);
  osc.frequency.linearRampToValueAtTime(440, now + 0.6);
  
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.6);
}

export function playBannedBeep(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.linearRampToValueAtTime(100, now + 0.25);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

export function playVictoryChime(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = freq;

    const start = now + idx * 0.08;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.25);
  });
}

export function playPitRadioClick(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = 1600;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.025);
}

export function speakRadioMessage(text: string, lang: "id" | "en"): void {
  if (isAudioMuted()) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text: strip out emojis and radio prefix
    const cleanText = text
      .replace("📻", "")
      .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === "en" ? "en-US" : "id-ID";
    
    // Game radio style: slightly faster and flat tone
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Find custom voice if possible
    const voices = window.speechSynthesis.getVoices();
    const voiceLang = lang === "en" ? "en" : "id";
    const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(voiceLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    // Play radio static beep before speaking
    playPitRadioClick();

    // Speak after click sound plays out slightly
    setTimeout(() => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.speak(utterance);
      }
    }, 40);

    // Play static beep after speaking finishes
    utterance.onend = () => {
      setTimeout(() => {
        playPitRadioClick();
      }, 50);
    };
  } catch (err) {
    console.warn("Gagal membacakan pesan suara:", err);
  }
}

export function playPitStopSound(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  
  // Power-up activation sound simulation:
  // 4 rapid high-speed energetic bursts ("Zzzt! Zzzt! Zzzt! Zzzt!")
  for (let i = 0; i < 4; i++) {
    const burstStart = now + i * 0.8;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    // Sweep frequency down rapidly from 1200Hz to 180Hz
    osc.frequency.setValueAtTime(1200, burstStart);
    osc.frequency.exponentialRampToValueAtTime(180, burstStart + 0.4);

    // Dynamic gain envelope for impact burst
    gain.gain.setValueAtTime(0.0001, burstStart);
    gain.gain.exponentialRampToValueAtTime(0.12, burstStart + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.05, burstStart + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, burstStart + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(burstStart);
    osc.stop(burstStart + 0.45);
  }
}

export function playPowerUpEquippedSound(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  
  // Futuristic upward chime
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    const start = now + idx * 0.07;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.2);
  });
}

export function playOilSplatSound(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Bubbly squish sound: frequency sweeps low and gains fluctuate
  osc.type = "triangle";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

export function playEmojiPop(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  // Quick pitch sweep upwards: 600Hz -> 1000Hz (bubble pop)
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

export function playChatBeep(): void {
  if (isAudioMuted() || !isRaceAudioUnlocked()) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  // Simple notification sweep: 600Hz -> 800Hz
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}
