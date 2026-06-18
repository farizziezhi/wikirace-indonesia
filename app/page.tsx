"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  getOrCreateClientId,
  getSavedUsername,
  saveUsername,
  getSavedLanguage,
  saveLanguage,
} from "@/lib/client-id";
import { isRaceAudioUnlocked, unlockRaceAudio } from "@/lib/race-audio";
import type { Room, WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS } from "@/lib/wikipedia";
import AdContainer from "@/components/AdContainer";
import OnlineCountWidget from "@/components/OnlineCountWidget";

const MAX_USERNAME_LENGTH = 20;

type Mode = "idle" | "creating" | "joining" | "matchmaking";

interface UserProfile {
  username: string;
  stats: {
    elo: number;
    games_played: number;
    wins: number;
    losses: number;
  } | null;
}

interface LeaderboardEntry {
  username: string;
  elo: number;
  games_played: number;
  wins: number;
}

export default function HomePage() {
  const router = useRouter();
  const clientIdRef = useRef<string>("");

  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [language, setLanguage] = useState<WikiLanguage>("id");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [hydrated, setHydrated] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  /** Pemain datang via shared link `?room=XXX` — UI sedikit beda. */
  const [invitedTo, setInvitedTo] = useState<string | null>(null);

  // ------- State Auth & Leaderboard -------
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"play" | "leaderboard">("play");
  const [topDonators, setTopDonators] = useState<any[]>([]);
  const [playMode, setPlayMode] = useState<"ranked" | "mabar" | "solo">("ranked");
  const [dailyInfo, setDailyInfo] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyMinimized, setDailyMinimized] = useState(false);

  useEffect(() => {
    clientIdRef.current = getOrCreateClientId();

    window.setTimeout(() => {
      setUsername(getSavedUsername());
      setLanguage(getSavedLanguage());
      setHydrated(true);
      setAudioUnlocked(isRaceAudioUnlocked());

      try {
        const fromQuery =
          new URLSearchParams(window.location.search)
            .get("room")
            ?.trim()
            .toUpperCase() ?? "";
        if (/^[A-Z0-9]{6}$/.test(fromQuery)) {
          setRoomCode(fromQuery);
          setInvitedTo(fromQuery);
        }
      } catch {
        // ignore
      }

      try {
        const saved = window.sessionStorage.getItem("wikirace:toast");
        if (saved) {
          setToast(saved);
          window.sessionStorage.removeItem("wikirace:toast");
        }
      } catch {
        // ignore
      }
    }, 0);

    // Muat data sesi aktif, leaderboard global & top donatur
    void checkAuthSession();
    void loadLeaderboard();
    void loadTopDonators();
    void loadDailyChallenge(getSavedLanguage());
  }, []);

  // Sync username jika user login
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      saveUsername(user.username);
    }
  }, [user]);

  // Silently auto-unlock audio on first user click/touch
  useEffect(() => {
    function handleUnlock() {
      unlockRaceAudio().then((ok) => {
        if (ok) setAudioUnlocked(true);
      });
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    }
    if (hydrated && !audioUnlocked) {
      window.addEventListener("click", handleUnlock);
      window.addEventListener("touchstart", handleUnlock);
    }
    return () => {
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    };
  }, [hydrated, audioUnlocked]);

  // Auto-dismiss toast setelah 5 detik.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // ------- Fungsi Auth & API -------

  async function checkAuthSession() {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (res.ok && data.loggedIn) {
        setUser({ username: data.username, stats: data.stats });
      }
    } catch (err) {
      console.warn("Gagal mengecek sesi login:", err);
    } finally {
      setSessionChecking(false);
    }
  }

  async function loadLeaderboard() {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (res.ok && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.warn("Gagal memuat leaderboard:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  async function loadTopDonators() {
    try {
      const res = await fetch("/api/donators");
      if (res.ok) {
        const data = await res.json();
        setTopDonators(data.top || []);
      }
    } catch (err) {
      console.warn("Gagal memuat top donatur:", err);
    }
  }

  async function loadDailyChallenge(lang: string) {
    setDailyLoading(true);
    try {
      const res = await fetch(`/api/daily/challenge?lang=${lang}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDailyInfo(data);
      }
    } catch (err) {
      console.warn("Gagal memuat tantangan harian:", err);
    } finally {
      setDailyLoading(false);
    }
  }

  // Reload daily challenge on language or session user change
  useEffect(() => {
    if (hydrated) {
      void loadDailyChallenge(language);
    }
  }, [language, user, hydrated]);

  function openAuth(type: "login" | "register") {
    setAuthType(type);
    setAuthUsername("");
    setAuthPassword("");
    setAuthError(null);
    setShowAuthModal(true);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (authType === "register") {
      if (authPassword.length < 8) {
        setAuthError("Password minimal harus 8 karakter.");
        setAuthLoading(false);
        return;
      }
      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(authPassword)) {
        setAuthError("Password harus mengandung minimal satu huruf dan satu angka.");
        setAuthLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/auth?action=${authType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Terjadi kesalahan. Coba lagi.");
        setAuthLoading(false);
        return;
      }

      setUser({ username: data.username, stats: data.stats });
      setShowAuthModal(false);
      void loadLeaderboard(); // Segarkan leaderboard
    } catch {
      setAuthError("Gagal terhubung ke server. Periksa koneksi internet.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth?action=logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setUsername("");
    void loadLeaderboard();
  }

  async function handleEnableAudio() {
    const ok = await unlockRaceAudio();
    setAudioUnlocked(ok);
  }

  function validateUsername(): string | null {
    const trimmed = username.trim();
    if (!trimmed) return "Nama tidak boleh kosong.";
    if (trimmed.length > MAX_USERNAME_LENGTH) {
      return `Nama maksimal ${MAX_USERNAME_LENGTH} karakter.`;
    }
    return null;
  }

  async function handleCreate() {
    setError(null);
    const usernameError = validateUsername();
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const trimmedUsername = username.trim();
    saveUsername(trimmedUsername);
    setMode("creating");

    try {
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          clientId: clientIdRef.current,
          language,
        }),
      });

      const data: { roomId?: string; room?: Room; error?: string } =
        await res.json();

      if (!res.ok || !data.roomId) {
        setError(data.error ?? "Gagal membuat room. Coba lagi.");
        setMode("idle");
        return;
      }

      router.push(`/room/${data.roomId}`);
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa koneksi internet.");
      setMode("idle");
    }
  }

  async function handleSolo() {
    setError(null);
    const usernameError = validateUsername();
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const trimmedUsername = username.trim();
    saveUsername(trimmedUsername);
    router.push(`/solo?lang=${language}`);
  }

  async function handleJoin() {
    setError(null);
    const usernameError = validateUsername();
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const trimmedRoomId = roomCode.trim().toUpperCase();
    if (!trimmedRoomId) {
      setError("Masukkan kode room.");
      return;
    }
    if (trimmedRoomId.length !== 6) {
      setError("Kode room harus 6 karakter.");
      return;
    }

    const trimmedUsername = username.trim();
    saveUsername(trimmedUsername);
    setMode("joining");

    try {
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: trimmedRoomId,
          username: trimmedUsername,
          clientId: clientIdRef.current,
        }),
      });

      const data: { room?: Room; error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal bergabung ke room.");
        setMode("idle");
        return;
      }

      router.push(`/room/${trimmedRoomId}`);
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa koneksi internet.");
      setMode("idle");
    }
  }

  // ------- Fitur Matchmaking (Ranked) -------

  async function handleMatchmaking() {
    setError(null);
    if (!user) {
      // Jika belum login, buka modal login dulu
      openAuth("login");
      return;
    }

    setMode("matchmaking");

    try {
      const res = await fetch("/api/room/matchmaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          language,
        }),
      });

      const data: { roomId?: string; error?: string } = await res.json();

      if (!res.ok || !data.roomId) {
        setError(data.error ?? "Gagal mencocokkan lawan. Coba lagi.");
        setMode("idle");
        return;
      }

      router.push(`/room/${data.roomId}`);
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa koneksi internet.");
      setMode("idle");
    }
  }

  const busy = mode !== "idle" || !hydrated || sessionChecking;

  return (
    <main className="dot-bg flex flex-1 items-center justify-center bg-warm-cream px-6 py-12 lg:py-16">
      {/* ===== Floating notifications ===== */}
      {(hydrated && !audioUnlocked) || invitedTo || toast ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:top-6"
          aria-live="polite"
        >
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

          {invitedTo && (
            <div
              role="status"
              className="pointer-events-auto bg-charcoal-text text-warm-cream"
              style={{
                borderRadius: "var(--radius-rounded)",
                padding: "12px 16px",
                fontSize: "14px",
                lineHeight: "1.4",
                boxShadow: "var(--shadow-floating)",
                maxWidth: 460,
                width: "100%",
              }}
            >
              <div
                className="font-bold uppercase opacity-70"
                style={{ fontSize: "11px", letterSpacing: "0.6px" }}
              >
                Undangan room
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span>Kamu diundang ke room</span>
                <span
                  className="bg-lime-accent text-charcoal-text font-extrabold tabular-nums"
                  style={{
                    borderRadius: "var(--radius-button)",
                    padding: "2px 10px",
                    fontSize: "var(--text-body)",
                    letterSpacing: "0.18em",
                  }}
                >
                  {invitedTo}
                </span>
              </div>
            </div>
          )}

          {toast && (
            <div
              role="status"
              className="pointer-events-auto bg-charcoal-text text-warm-cream"
              style={{
                borderRadius: "var(--radius-rounded)",
                padding: "12px 16px",
                fontSize: "14px",
                lineHeight: "1.4",
                boxShadow: "var(--shadow-floating)",
                maxWidth: 460,
                width: "100%",
              }}
            >
              <span className="font-bold">📣 </span>
              {toast}
            </div>
          )}
        </div>
      ) : null}

      <div className="grid w-full max-w-[1100px] grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ====== Brand mark + hero + Leaderboard ====== */}
        <header className="flex flex-col items-start gap-4 text-charcoal-text">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center bg-charcoal-text text-warm-cream font-extrabold"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  fontSize: 18,
                }}
                aria-hidden
              >
                W
              </span>
              <span
                className="font-extrabold uppercase tabular-nums"
                style={{ fontSize: 17, letterSpacing: "0.18em" }}
              >
                WikiRace · ID
              </span>
            </div>
            <OnlineCountWidget />
          </div>

          <h1
            className="font-black text-charcoal-text"
            style={{
              fontSize: "clamp(38px, 6vw, 56px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
            }}
          >
            Lompat dari{" "}
            <span
              className="inline-block bg-light-beige px-2"
              style={{
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray)",
              }}
            >
              {language === "en" ? "Article A" : "artikel A"}
            </span>{" "}
            {language === "en" ? "to" : "ke"}{" "}
            <span
              className="inline-block bg-charcoal-text text-warm-cream px-2"
              style={{ borderRadius: 8 }}
            >
              {language === "en" ? "Article B" : "artikel B"}
            </span>
            .
          </h1>

          <p
            className="text-charcoal-text/85"
            style={{
              fontSize: "var(--text-body)",
              lineHeight: "var(--leading-body)",
              maxWidth: 460,
            }}
          >
            {language === "en"
              ? "Real-time multiplayer speedrun on Wikipedia. Sign up to play Ranked ELO matches or join custom rooms."
              : "Multiplayer realtime di Wikipedia Bahasa Indonesia. Daftar untuk main Ranked atau masuk room secara santai."}
          </p>

          {/* ====== Donatur Highlight Card ====== */}
          <div
            className="w-full mt-2 border-2 border-charcoal-text bg-pure-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              borderRadius: "var(--radius-button)",
              boxShadow: "var(--shadow-raised)",
            }}
          >
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-charcoal-text/60 flex items-center gap-1.5">
                💖 {language === "en" ? "Top Donators" : "Donatur Teratas"}
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Always show Dev */}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-yellow-accent/70 text-charcoal-text px-2.5 py-1 border border-charcoal-text rounded-md">
                  👑 farizziezhi (Dev)
                </span>

                {topDonators.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-light-beige text-charcoal-text/80 px-2.5 py-1 border border-dashed border-warm-gray rounded-md">
                    ☕ {language === "en" ? "Be the First Donator!" : "Jadilah Donatur Pertama!"}
                  </span>
                ) : (
                  topDonators.slice(0, 3).map((donator, idx) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const colors = ["bg-lime-accent/80", "bg-light-beige", "bg-warm-gray/25"];
                    return (
                      <span
                        key={donator.id}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 border border-charcoal-text rounded-md ${colors[idx] || "bg-light-beige"}`}
                      >
                        {medals[idx] || "☕"} {donator.name}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <Link
              href="/donatur"
              className="btn-white text-[11px] font-black py-1.5 px-3 shrink-0 self-start sm:self-center text-center"
              style={{
                border: "1px solid var(--color-charcoal-text)",
                boxShadow: "var(--shadow-flat)",
                fontSize: "11px",
              }}
            >
              {language === "en" ? "Hall of Fame ➔" : "Hall of Fame ➔"}
            </Link>
          </div>

          {/* ====== Cara main — desktop only ====== */}
          <section className="mt-2 hidden w-full grid-cols-3 gap-3 lg:grid">
            <HowToCard
              n={1}
              title={language === "en" ? "Choose name" : "Pilih nama"}
              body={language === "en" ? "Play instantly or log in to save your ELO rating." : "Main instan atau login untuk menyimpan rating ELO."}
            />
            <HowToCard
              n={2}
              title={language === "en" ? "Matchmaking" : "Cari Lawan"}
              body={language === "en" ? "Click Matchmaking to automatically play against players of similar skill." : "Klik Matchmaking untuk bertanding otomatis dengan lawan seimbang."}
            />
            <HowToCard
              n={3}
              title={language === "en" ? "Click & run" : "Klik & lari"}
              body={language === "en" ? "Only click hyperlinks inside articles. Reach the target first to gain ELO!" : "Hanya boleh klik tautan dalam artikel. Sampai duluan, ELO naik!"}
            />
          </section>
        </header>

        {/* ====== Card form ====== */}
        <section
          className="flex flex-col gap-4 bg-warm-cream p-6"
          style={{
            borderRadius: "var(--radius-input)",
            border: "1px solid var(--color-warm-gray)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {/* Status Profil / Auth */}
          {hydrated && (
            sessionChecking ? (
              <div
                className="p-3 bg-light-beige border border-warm-gray/60 flex items-center justify-between gap-3 animate-pulse"
                style={{ borderRadius: "var(--radius-input)" }}
              >
                <div className="text-[11px] font-bold text-charcoal-text/40 leading-relaxed">
                  {language === "en" ? "Checking session..." : "Memeriksa sesi..."}
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-40">
                  <button
                    disabled
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                  >
                    {language === "en" ? "Log In" : "Masuk"}
                  </button>
                  <button
                    disabled
                    className="btn-white"
                    style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                  >
                    {language === "en" ? "Sign Up" : "Daftar"}
                  </button>
                </div>
              </div>
            ) : user ? (
              <div
                className="relative overflow-hidden p-5 bg-charcoal-deep border-3 border-charcoal-text text-warm-cream shadow-[5px_5px_0px_#000] flex flex-col gap-4"
                style={{ borderRadius: "var(--radius-input)" }}
              >
                {/* Header Checkered Line */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-charcoal-text overflow-hidden flex" aria-hidden="true">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
                  ))}
                </div>

                <div className="flex items-start justify-between gap-3 mt-1.5">
                  <div className="flex items-center gap-3.5">
                    {/* Avatar as a technical license photo */}
                    <span
                      className="flex items-center justify-center font-black uppercase text-charcoal-text bg-lime-accent border-2 border-charcoal-text shadow-[2px_2px_0px_#000]"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "var(--radius-button)",
                        fontSize: "16px",
                      }}
                      aria-hidden="true"
                    >
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-mono font-black text-warm-cream/50 tracking-wider">Driver/Pembalap</span>
                      <Link
                        href={`/profile/${user.username}`}
                        className="font-black text-warm-cream text-base hover:underline hover:text-lime-accent transition-colors cursor-pointer"
                      >
                        {user.username}
                      </Link>
                      
                      <div className="text-[10px] text-warm-cream/70 font-mono mt-0.5 flex items-center gap-2">
                        <span className="text-lime-accent font-black">
                          🏆 {user.stats?.elo ?? 1200} ELO
                        </span>
                        <span>•</span>
                        <span>{user.stats?.wins ?? 0} {language === "en" ? "Wins" : "Win"}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG ELO RPM Speedometer */}
                  <div className="flex flex-col items-center gap-1 bg-charcoal-text/50 p-2 rounded-lg border border-warm-gray/10">
                    <span className="text-[8px] uppercase font-mono font-black text-warm-cream/45 tracking-wider">RPM Gauge</span>
                    <div className="relative w-12 h-6 overflow-hidden flex items-end justify-center">
                      <svg width="48" height="24" viewBox="0 0 48 24" aria-hidden="true">
                        {/* Background Arc */}
                        <path d="M 4 24 A 20 20 0 0 1 44 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                        {/* Filled Arc based on ELO */}
                        <path 
                          d="M 4 24 A 20 20 0 0 1 44 24" 
                          fill="none" 
                          stroke="var(--color-lime-accent)" 
                          strokeWidth="4"
                          strokeDasharray="63"
                          strokeDashoffset={Math.max(0, 63 - (63 * Math.min(1.0, Math.max(0.0, ((user.stats?.elo ?? 1200) - 800) / 1000))) )}
                        />
                      </svg>
                      <span className="absolute bottom-0 text-[10px] font-black font-mono text-lime-accent">
                        {Math.min(9, Math.max(1, Math.round(((user.stats?.elo ?? 1200) / 1800) * 10)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer of Driver Card */}
                <div className="flex items-center justify-between border-t border-warm-cream/10 pt-3.5 mt-0.5">
                  {/* Tier Badge */}
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-mono font-black text-warm-cream/45 tracking-wider">License Status</span>
                    <span className="text-[10px] font-black uppercase text-lime-accent tracking-widest bg-lime-accent/15 px-2 py-0.5 rounded border border-lime-accent/20 mt-0.5">
                      {(user.stats?.elo ?? 1200) < 1100 ? (language === "en" ? "NOVICE" : "PEMULA") : (user.stats?.elo ?? 1200) < 1300 ? (language === "en" ? "EXPLORER" : "PENJELAJAH") : (language === "en" ? "SPEEDRUNNER" : "LEGENDA")}
                    </span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/profile/${user.username}`}
                      className="chunky-press bg-charcoal-text text-warm-cream border-2 border-charcoal-text hover:bg-charcoal-deep font-black"
                      style={{ padding: "6px 12px", fontSize: "10px", height: "fit-content", borderRadius: "var(--radius-button)" }}
                    >
                      {language === "en" ? "Profile" : "Profil"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="chunky-press bg-burnt-orange text-warm-cream border-2 border-charcoal-text font-black"
                      style={{ padding: "6px 12px", fontSize: "10px", height: "fit-content", borderRadius: "var(--radius-button)" }}
                    >
                      {language === "en" ? "Log Out" : "Keluar"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-4 bg-charcoal-deep border-3 border-charcoal-text text-warm-cream shadow-[5px_5px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ borderRadius: "var(--radius-input)" }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] uppercase font-mono font-black text-warm-cream/45 tracking-wider">Unregistered Node</span>
                  <div className="text-xs font-bold text-warm-cream/80 max-w-[280px] leading-relaxed">
                    {language === "en" ? "Log in or Sign up to save ELO score & enter the Leaderboard." : "Masuk atau Daftar untuk menyimpan skor ELO & masuk Papan Peringkat."}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => openAuth("login")}
                    className="chunky-press btn-primary py-2 px-4 text-xs font-extrabold flex-1 sm:flex-none border-2 border-charcoal-text"
                    style={{ whiteSpace: "nowrap", height: "fit-content", boxShadow: "2px 2px 0px #000" }}
                  >
                    {language === "en" ? "Log In" : "Masuk"}
                  </button>
                  <button
                    onClick={() => openAuth("register")}
                    className="chunky-press btn-white py-2 px-4 text-xs font-extrabold flex-1 sm:flex-none border-2 border-charcoal-text"
                    style={{ whiteSpace: "nowrap", height: "fit-content", boxShadow: "2px 2px 0px #000" }}
                  >
                    {language === "en" ? "Sign Up" : "Daftar"}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Daily Challenge Floating Widget (Only on Homepage) */}
          {hydrated && (
            <div
              className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
                dailyMinimized 
                  ? "pointer-events-none opacity-0 translate-y-4 scale-95" 
                  : "pointer-events-auto opacity-100 translate-y-0 scale-100"
              }`}
              style={{
                maxWidth: "340px",
                width: "calc(100vw - 3rem)",
              }}
            >
              <div
                className="flex flex-col gap-3.5 bg-charcoal-text text-warm-cream p-5 relative overflow-hidden"
                style={{
                  borderRadius: "var(--radius-input)",
                  border: "2px solid var(--color-charcoal-text)",
                  boxShadow: "4px 4px 0px #000",
                }}
              >
                {/* Checkered side accent */}
                <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-lime-accent to-lime-deep opacity-80" />

                <div className="flex items-center justify-between">
                  <span className="bg-lime-accent text-charcoal-text font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                    🔥 {language === "en" ? "Daily Challenge" : "Tantangan Harian"}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    {user ? (
                      <span className={`text-xs font-black uppercase tracking-wide flex items-center gap-1 ${
                        dailyInfo?.streak && dailyInfo.streak >= 3 
                          ? "text-lime-accent animate-pulse" 
                          : "text-warm-cream/70"
                      }`}>
                        🔥 {dailyInfo?.streak ?? 0} {language === "en" ? "Day Streak" : "Hari Streak"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-warm-cream/40 font-bold uppercase tracking-wider">
                        {language === "en" ? "Daily" : "Harian"}
                      </span>
                    )}

                    {/* Minimize button */}
                    <button
                      onClick={() => setDailyMinimized(true)}
                      className="bg-light-beige text-charcoal-text font-black hover:bg-lime-accent rounded border border-charcoal-text shadow-[1px_1px_0px_#000] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_#000] transition-all cursor-pointer flex items-center justify-center font-mono"
                      style={{
                        width: "18px",
                        height: "18px",
                        fontSize: "9px",
                      }}
                      title={language === "en" ? "Minimize" : "Perkecil"}
                    >
                      ➖
                    </button>
                  </div>
                </div>

                {dailyLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="border-warm-cream border-t-transparent animate-spin w-4 h-4 rounded-full border-2" />
                    <span className="text-[11px] text-warm-cream/50 uppercase tracking-wide font-bold">
                      {language === "en" ? "Loading challenge..." : "Memuat tantangan..."}
                    </span>
                  </div>
                ) : dailyInfo?.challenge ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="font-extrabold text-sm text-lime-accent truncate">
                        {language === "id" ? dailyInfo.challenge.name : (dailyInfo.challenge.nameEn || dailyInfo.challenge.name)}
                      </h4>
                      <p className="text-[11px] text-warm-cream/70 leading-normal">
                        {language === "id" ? dailyInfo.challenge.description : (dailyInfo.challenge.descEn || dailyInfo.challenge.description)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-black text-warm-cream flex-wrap bg-very-dark/40 px-3 py-2 rounded-lg border border-very-dark/50">
                      <span className="bg-warm-cream text-charcoal-text px-1.5 py-0.5 rounded text-[8px] tracking-wide uppercase font-extrabold">START</span>
                      <span className="truncate max-w-[85px]">{dailyInfo.challenge.startArticle.replace(/_/g, ' ')}</span>
                      <span className="text-warm-cream/30">➔</span>
                      <span className="bg-lime-accent text-charcoal-text px-1.5 py-0.5 rounded text-[8px] tracking-wide uppercase font-extrabold">GOAL</span>
                      <span className="truncate max-w-[85px] text-lime-accent">{dailyInfo.challenge.endArticle.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-1">
                      {dailyInfo.completed ? (
                        <div className="w-full flex items-center justify-center gap-1.5 bg-lime-accent/15 border border-lime-accent/40 text-lime-accent py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wide">
                          <span>✓</span>
                          <span>{language === "en" ? "Completed Today" : "Selesai Hari Ini"}</span>
                        </div>
                      ) : (
                        <Link
                          href={`/solo/play?start=${encodeURIComponent(dailyInfo.challenge.startArticle)}&end=${encodeURIComponent(dailyInfo.challenge.endArticle)}&mode=time-attack&lang=${language}&daily=true`}
                          className="w-full text-center bg-lime-accent hover:bg-lime-deep text-charcoal-text font-black text-xs px-4 py-2.5 rounded-lg border border-charcoal-text shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all uppercase tracking-wide cursor-pointer"
                        >
                          {language === "en" ? "Start Daily Challenge" : "Mulai Tantangan Harian"}
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-warm-cream/50 italic py-2">
                    {language === "en" ? "No daily challenge available." : "Tantangan harian tidak tersedia."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Minimized Daily Challenge Trigger (Only on Homepage) */}
          {hydrated && dailyMinimized && (
            <button
              onClick={() => setDailyMinimized(false)}
              className="fixed bottom-6 right-6 z-40 bg-charcoal-text text-warm-cream font-black text-xs px-3.5 py-2.5 border-2 border-charcoal-text shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000] rounded-xl flex items-center gap-2 cursor-pointer transition-all animate-bounce"
              title={language === "en" ? "Expand Daily Challenge" : "Buka Tantangan Harian"}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-accent"></span>
              </span>
              <span>🔥 {language === "en" ? "Daily Challenge" : "Tantangan Harian"}</span>
              {user && dailyInfo?.streak > 0 && (
                <span className="bg-lime-accent text-charcoal-text font-black text-[9px] px-1.5 py-0.5 rounded">
                  {dailyInfo.streak}
                </span>
              )}
            </button>
          )}

          {/* Invitation or Tabbed Interface - Wrapped with min-height to prevent vertical layout shifting */}
          <div style={{ minHeight: "320px" }} className="flex flex-col gap-4">
            {invitedTo ? (
              <div className="flex flex-col gap-4">
                <div className="bg-lime-accent/20 border border-lime-accent p-3.5 text-xs text-charcoal-text" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="font-extrabold block mb-1 text-[13px]">{language === "en" ? "📬 Room Invitation: " : "📬 Undangan Room: "}{invitedTo}</span>
                  {language === "en" ? "Enter your name below to join the race immediately." : "Masukkan nama Anda di bawah untuk langsung bergabung ke balapan."}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="username" className="font-bold text-charcoal-text text-sm">{language === "en" ? "Your name" : "Nama kamu"}</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={MAX_USERNAME_LENGTH}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={language === "en" ? "e.g. Andi" : "Contoh: Andi"}
                    disabled={busy || !hydrated || !!user}
                    className="pd-input"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={busy || !hydrated}
                  className="btn-primary w-full"
                  style={{ padding: "12px 18px", fontSize: "15px" }}
                >
                  {mode === "joining" ? (language === "en" ? "Joining..." : "Bergabung...") : (language === "en" ? "Join Now" : "Gabung Sekarang")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInvitedTo(null);
                    setRoomCode("");
                  }}
                  className="btn-white w-full"
                  style={{ padding: "8px 14px", fontSize: "12px" }}
                >
                  {language === "en" ? "Cancel & Play Other Mode" : "Batal & Main Mode Lain"}
                </button>
              </div>
            ) : (
              <>
                {/* Tab Selector */}
                <div className="flex bg-light-beige p-1 gap-1" style={{ borderRadius: "var(--radius-button)" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("play")}
                    className="flex-1 py-2 text-center font-extrabold transition-all text-xs sm:text-sm"
                    style={{
                      borderRadius: "var(--radius-button)",
                      background: activeTab === "play" ? "var(--color-charcoal-text)" : "transparent",
                      color: activeTab === "play" ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                    }}
                  >
                    {language === "en" ? "🎮 Play" : "🎮 Bermain"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("leaderboard")}
                    className="flex-1 py-2 text-center font-extrabold transition-all text-xs sm:text-sm"
                    style={{
                      borderRadius: "var(--radius-button)",
                      background: activeTab === "leaderboard" ? "var(--color-charcoal-text)" : "transparent",
                      color: activeTab === "leaderboard" ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                    }}
                  >
                    {language === "en" ? "🏆 Leaderboard" : "🏆 Papan Skor"}
                  </button>
                </div>

                {/* Tab: Bermain */}
                {activeTab === "play" && (
                  <div className="flex flex-col gap-4">
                    {/* Nama kamu */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="username"
                        className="font-bold text-charcoal-text text-sm"
                      >
                        {language === "en" ? "Your name" : "Nama kamu"}
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={MAX_USERNAME_LENGTH}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={language === "en" ? "e.g. Andi" : "Contoh: Andi"}
                        disabled={busy || !hydrated || !!user}
                        className="pd-input"
                      />
                      {!user && (
                        <div className="flex justify-between items-center text-[11px] text-charcoal-text/50">
                          <span>{language === "en" ? "💡 Tip: Log in to save ELO" : "💡 Tip: Login untuk simpan ELO"}</span>
                          <span>{username.length}/{MAX_USERNAME_LENGTH}</span>
                        </div>
                      )}
                    </div>

                    {/* Pilihan bahasa */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-charcoal-text text-sm">
                        {language === "en" ? "Wikipedia Language" : "Bahasa Wikipedia"}
                      </span>
                      <div
                        className="grid grid-cols-2 gap-1 bg-light-beige p-1"
                        style={{
                          borderRadius: "var(--radius-input)",
                          border: "1px solid var(--color-warm-gray)",
                        }}
                        role="radiogroup"
                        aria-label={language === "en" ? "Wikipedia Language" : "Bahasa Wikipedia"}
                      >
                        {LANGUAGE_OPTIONS.map((opt) => {
                          const active = opt.value === language;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => {
                                setLanguage(opt.value);
                                saveLanguage(opt.value);
                              }}
                              disabled={busy}
                              className="flex items-center justify-center gap-1.5 transition disabled:opacity-60"
                              style={{
                                padding: "8px 10px",
                                borderRadius: "var(--radius-button)",
                                background: active
                                  ? "var(--color-charcoal-text)"
                                  : "transparent",
                                color: active
                                  ? "var(--color-warm-cream)"
                                  : "var(--color-charcoal-text)",
                                fontWeight: 600,
                                fontSize: "13px",
                              }}
                            >
                              <span aria-hidden style={{ fontSize: 16 }}>
                                {opt.flag}
                              </span>
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sub-mode Segmented Control */}
                    <div className="flex bg-light-beige p-1 gap-1" style={{ borderRadius: "var(--radius-button)" }}>
                      <button
                        type="button"
                        onClick={() => setPlayMode("ranked")}
                        className="flex-1 py-1.5 text-center font-bold transition-all text-xs"
                        style={{
                          borderRadius: "var(--radius-button)",
                          background: playMode === "ranked" ? "var(--color-charcoal-text)" : "transparent",
                          color: playMode === "ranked" ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                        }}
                      >
                        ⚡ Ranked
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayMode("mabar")}
                        className="flex-1 py-1.5 text-center font-bold transition-all text-xs"
                        style={{
                          borderRadius: "var(--radius-button)",
                          background: playMode === "mabar" ? "var(--color-charcoal-text)" : "transparent",
                          color: playMode === "mabar" ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                        }}
                      >
                        {language === "en" ? "👥 Party" : "👥 Mabar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayMode("solo")}
                        className="flex-1 py-1.5 text-center font-bold transition-all text-xs"
                        style={{
                          borderRadius: "var(--radius-button)",
                          background: playMode === "solo" ? "var(--color-charcoal-text)" : "transparent",
                          color: playMode === "solo" ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                        }}
                      >
                        {language === "en" ? "🏎️ Solo" : "🏎️ Solo"}
                      </button>
                    </div>

                    {/* Sub-mode Actions */}
                    {playMode === "ranked" && (
                      <div className="flex flex-col gap-2 mt-1">
                        <button
                          type="button"
                          onClick={handleMatchmaking}
                          disabled={busy || !hydrated}
                          className="btn-primary w-full cursor-pointer"
                          style={{
                            background: "linear-gradient(135deg, var(--color-lime-accent) 0%, var(--color-lime-deep) 100%)",
                            color: "var(--color-charcoal-text)",
                            fontWeight: 800,
                            fontSize: "16px",
                            padding: "12px 18px",
                          }}
                        >
                          {mode === "matchmaking"
                            ? (language === "en" ? "⚡ Finding Opponent..." : "⚡ Mencari Lawan...")
                            : (language === "en" ? "⚡ Find Opponent (Ranked)" : "⚡ Cari Lawan (Ranked)")}
                        </button>
                        <p className="text-[11px] text-charcoal-text/60 text-center leading-relaxed">
                          {language === "en"
                            ? "Find a balanced opponent in real-time. Your ELO rating will change based on match results."
                            : "Cari lawan seimbang secara realtime. Skor ELO Anda akan naik/turun sesuai hasil permainan."}
                        </p>
                      </div>
                    )}

                    {playMode === "mabar" && (
                      <div className="flex flex-col gap-3 mt-1">
                        <button
                          type="button"
                          onClick={handleCreate}
                          disabled={busy || !hydrated}
                          className="btn-primary w-full"
                          style={{ padding: "12px 18px", fontSize: "15px" }}
                        >
                          {mode === "creating"
                            ? (language === "en" ? "Creating room..." : "Membuat room…")
                            : (language === "en" ? "Create New Party Room" : "Buat Room Mabar Baru")}
                        </button>

                        <div className="flex items-center gap-2" aria-hidden>
                          <div className="h-px flex-1 bg-parchment/60" />
                          <span className="font-bold text-[10px] uppercase text-charcoal-text/50">
                            {language === "en" ? "or join room" : "atau gabung room"}
                          </span>
                          <div className="h-px flex-1 bg-parchment/60" />
                        </div>

                        <div className="flex gap-2">
                          <input
                            id="roomCode"
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleJoin();
                              }
                            }}
                            maxLength={6}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            placeholder={language === "en" ? "CODE" : "KODE"}
                            disabled={busy || !hydrated}
                            className="pd-input"
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              textAlign: "center",
                              flex: 1,
                              letterSpacing: "0.1em",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleJoin}
                            disabled={busy || !hydrated}
                            className="btn-yellow"
                            style={{ padding: "10px 18px", fontSize: "14px" }}
                          >
                            {mode === "joining"
                              ? (language === "en" ? "Joining..." : "Gabung…")
                              : (language === "en" ? "Join" : "Gabung")}
                          </button>
                        </div>
                      </div>
                    )}

                    {playMode === "solo" && (
                      <div className="flex flex-col gap-2 mt-1">
                        <button
                          type="button"
                          onClick={handleSolo}
                          disabled={busy || !hydrated}
                          className="btn-secondary w-full"
                          style={{ padding: "12px 18px", fontSize: "15px" }}
                        >
                          {language === "en" ? "🏎️ Start Solo Practice" : "🏎️ Mulai Latihan Solo"}
                        </button>
                        <p className="text-[11px] text-charcoal-text/60 text-center leading-relaxed">
                          {language === "en"
                            ? "Practice solo without affecting ELO. Perfect for casual Wikipedia route training."
                            : "Latihan mandiri tanpa memengaruhi ELO. Sempurna untuk latihan rute Wikipedia secara santai."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Leaderboard */}
                {activeTab === "leaderboard" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-charcoal-text/10 pb-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 16 }}>🏆</span>
                        <h3 className="font-black text-charcoal-text uppercase tracking-tight" style={{ fontSize: "14px" }}>
                          {language === "en" ? "Global Driver Standings" : "Klasemen Global Pembalap"}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-black text-charcoal-text/50 uppercase">Session ELO</span>
                    </div>

                    {leaderboardLoading ? (
                      <div className="flex items-center justify-center py-8 text-charcoal-text/60 text-xs font-bold uppercase tracking-wider animate-pulse">
                        {language === "en" ? "Loading standings..." : "Memuat klasemen..."}
                      </div>
                    ) : leaderboard.length === 0 ? (
                      <div className="text-center py-8 text-charcoal-text/60 text-xs font-bold uppercase">
                        {language === "en" ? "No data available." : "Data tidak tersedia."}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                        {leaderboard.map((entry, index) => {
                          const isGold = index === 0;
                          const isSilver = index === 1;
                          const isBronze = index === 2;

                          let medalBg = "bg-light-beige";
                          if (isGold) {
                            medalBg = "bg-lime-accent/20";
                          } else if (isSilver) {
                            medalBg = "bg-warm-gray/30";
                          } else if (isBronze) {
                            medalBg = "bg-burnt-orange/20";
                          }

                          return (
                            <div
                              key={entry.username}
                              className={`flex items-center justify-between border-2 border-charcoal-text p-2 rounded-lg ${medalBg}`}
                              style={{ fontSize: "13px", boxShadow: "2px 2px 0px #000" }}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 flex items-center justify-center font-black text-xs font-mono text-charcoal-text/60">
                                  #{index + 1}
                                </span>
                                <Link
                                  href={`/profile/${entry.username}`}
                                  className="font-extrabold text-charcoal-text hover:text-lime-deep hover:underline cursor-pointer transition-colors"
                                >
                                  {entry.username}
                                </Link>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-charcoal-text/70 text-[11px] font-bold">{entry.wins} W</span>
                                <span className="font-black text-charcoal-text bg-lime-accent border border-charcoal-text px-2 py-0.5 rounded text-xs shadow-[1.5px_1.5px_0px_#000]">
                                  {entry.elo} ELO
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}


              </>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="bg-charcoal-text text-warm-cream"
              style={{
                borderRadius: "var(--radius-input)",
                padding: "12px 16px",
                fontSize: "var(--text-body)",
                lineHeight: "var(--leading-body)",
              }}
            >
              ⚠ {error}
            </div>
          )}
        </section>

        {/* Iklan Kolom Kanan (di bawah form) */}
        <AdContainer type="homepage-banner" className="mt-2 w-full" />

        {/* ====== Cara main — mobile only ====== */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:hidden">
          <HowToCard
            n={1}
            title={language === "en" ? "Choose name" : "Pilih nama"}
            body={language === "en" ? "Play instantly or log in to save your ELO rating." : "Main instan atau login untuk menyimpan rating ELO."}
          />
          <HowToCard
            n={2}
            title={language === "en" ? "Matchmaking" : "Cari Lawan"}
            body={language === "en" ? "Click Matchmaking to automatically play against players of similar skill." : "Klik Matchmaking untuk bertanding otomatis dengan lawan seimbang."}
          />
          <HowToCard
            n={3}
            title={language === "en" ? "Click & run" : "Klik & lari"}
            body={language === "en" ? "Only click hyperlinks inside articles. Reach the target first to gain ELO!" : "Hanya boleh klik tautan dalam artikel. Sampai duluan, ELO naik!"}
          />
        </section>

        {/* ====== Rich Bilingual SEO Content (Static Guide & FAQ) ====== */}
        <section
          className="lg:col-span-2 mt-4 flex flex-col gap-6 text-charcoal-text bg-pure-white p-6 sm:p-8"
          style={{
            border: "2px solid var(--color-charcoal-text)",
            borderRadius: "var(--radius-input)",
            boxShadow: "var(--shadow-lifted)"
          }}
        >
          {/* Indonesian SEO Content */}
          <div className={language === "id" ? "flex flex-col gap-6" : "hidden"}>
            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-2">
                📖 Tentang WikiRace Indonesia
              </h2>
              <p className="text-sm sm:text-base text-charcoal-text/85 leading-relaxed font-medium">
                WikiRace Indonesia (dikenal juga sebagai <strong>Wikipedia Game</strong> atau <strong>Wiki Speedrun</strong>) adalah sebuah permainan edukatif gratis di mana Anda berlomba menelusuri artikel Wikipedia dari satu artikel awal menuju artikel target yang telah ditentukan secepat mungkin, hanya dengan mengklik link biru di dalam artikel tersebut. Game ini melatih kecepatan navigasi, pemahaman logika, dan wawasan umum.
              </p>
            </div>
            
            <div className="h-px bg-warm-gray/30 w-full" />
            
            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-3 flex items-center gap-2">
                🏁 Panduan & Cara Bermain Balapan Wikipedia
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-light-beige/40 p-4 border border-charcoal-text/30 rounded-xl" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="bg-lime-accent text-charcoal-text font-black px-2.5 py-0.5 rounded text-xs">Langkah 1</span>
                  <h3 className="font-extrabold text-sm mt-2 text-charcoal-text">Isi Nama & Mulai</h3>
                  <p className="text-xs text-charcoal-text/80 mt-1.5 leading-relaxed">
                    Masukkan nama Anda secara instan atau gunakan login Google untuk menyimpan statistik serta rating ELO kompetitif Anda.
                  </p>
                </div>
                <div className="bg-light-beige/40 p-4 border border-charcoal-text/30 rounded-xl" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="bg-lime-accent text-charcoal-text font-black px-2.5 py-0.5 rounded text-xs">Langkah 2</span>
                  <h3 className="font-extrabold text-sm mt-2 text-charcoal-text">Pilih Mode Permainan</h3>
                  <p className="text-xs text-charcoal-text/80 mt-1.5 leading-relaxed">
                    Pilih <strong>Ranked</strong> untuk bertanding 1v1 multiplayer secara adil, <strong>Mabar</strong> untuk bermain kustom bersama teman, atau <strong>Solo Training</strong> untuk latihan santai.
                  </p>
                </div>
                <div className="bg-light-beige/40 p-4 border border-charcoal-text/30 rounded-xl" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="bg-lime-accent text-charcoal-text font-black px-2.5 py-0.5 rounded text-xs">Langkah 3</span>
                  <h3 className="font-extrabold text-sm mt-2 text-charcoal-text">Klik Link & Lari</h3>
                  <p className="text-xs text-charcoal-text/80 mt-1.5 leading-relaxed">
                    Telusuri artikel Wikipedia hanya dengan mengklik link biru. Dilarang keras menggunakan fitur pencarian internal Wikipedia (search bar) atau tombol Ctrl+F!
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-warm-gray/30 w-full" />

            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-3 flex items-center gap-2">
                ❓ Pertanyaan Umum (FAQ)
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="font-black text-sm text-charcoal-text">Apakah WikiRace Indonesia gratis dimainkan?</h4>
                  <p className="text-xs sm:text-sm text-charcoal-text/75 mt-1">
                    Ya, game WikiRace Indonesia sepenuhnya 100% gratis dimainkan selamanya, bebas dari iklan spanduk yang mengganggu, serta tidak menjual data pribadi Anda.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-sm text-charcoal-text">Apakah mendukung rute Wikipedia Bahasa Inggris?</h4>
                  <p className="text-xs sm:text-sm text-charcoal-text/75 mt-1">
                    Tentu saja! Anda cukup mengganti pilihan <strong>Bahasa Wikipedia</strong> ke bendera 🇺🇸 (English) di form bermain untuk bertanding menggunakan database Wikipedia versi global.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-sm text-charcoal-text">Bagaimana sistem penentuan peringkat ELO dihitung?</h4>
                  <p className="text-xs sm:text-sm text-charcoal-text/75 mt-1">
                    Setiap kali Anda menang di mode Ranked multiplayer, rating ELO Anda akan meningkat. Sebaliknya jika kalah, ELO Anda akan berkurang. Peringkat di Papan Skor diurutkan berdasarkan ELO tertinggi secara global.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* English SEO Content */}
          <div className={language === "en" ? "flex flex-col gap-6" : "hidden"}>
            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-2">
                📖 About WikiRace Indonesia
              </h2>
              <p className="text-sm sm:text-base text-charcoal-text/85 leading-relaxed font-medium">
                WikiRace Indonesia (widely known as the <strong>Wikipedia Game</strong> or <strong>Wiki Speedrun</strong>) is a free online educational game where players race to navigate through Wikipedia articles from a random start page to a designated target page. The catch? You can only click the blue hyperlinks inside the articles. It tests your speed, logic, and general knowledge.
              </p>
            </div>
            
            <div className="h-px bg-warm-gray/30 w-full" />
            
            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-3 flex items-center gap-2">
                🏁 Wikipedia Game Guide & How to Play
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-light-beige/40 p-4 border border-charcoal-text/30 rounded-xl" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="bg-lime-accent text-charcoal-text font-black px-2.5 py-0.5 rounded text-xs">Step 1</span>
                  <h3 className="font-extrabold text-sm mt-2 text-charcoal-text">Choose Name & Enter</h3>
                  <p className="text-xs text-charcoal-text/80 mt-1.5 leading-relaxed">
                    Choose a quick nickname or register using Google login to save ELO points and track your match history.
                  </p>
                </div>
                <div className="bg-light-beige/40 p-4 border border-charcoal-text/30 rounded-xl" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="bg-lime-accent text-charcoal-text font-black px-2.5 py-0.5 rounded text-xs">Step 2</span>
                  <h3 className="font-extrabold text-sm mt-2 text-charcoal-text">Select Game Mode</h3>
                  <p className="text-xs text-charcoal-text/80 mt-1.5 leading-relaxed">
                    Play <strong>Ranked</strong> matchmaking to challenge online opponents, create a <strong>Party (Mabar)</strong> to play with friends, or select <strong>Solo</strong> for pressure-free practice.
                  </p>
                </div>
                <div className="bg-light-beige/40 p-4 border border-charcoal-text/30 rounded-xl" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="bg-lime-accent text-charcoal-text font-black px-2.5 py-0.5 rounded text-xs">Step 3</span>
                  <h3 className="font-extrabold text-sm mt-2 text-charcoal-text">Click Links to Destination</h3>
                  <p className="text-xs text-charcoal-text/80 mt-1.5 leading-relaxed">
                    Navigate only by clicking the blue hyperlinks inside Wikipedia pages. Using Wikipedia's search bar or Ctrl+F is strictly forbidden!
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-warm-gray/30 w-full" />

            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-3 flex items-center gap-2">
                ❓ Frequently Asked Questions (FAQ)
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="font-black text-sm text-charcoal-text">Is the Wikipedia Game free to play?</h4>
                  <p className="text-xs sm:text-sm text-charcoal-text/75 mt-1">
                    Yes, WikiRace Indonesia is 100% free with no intrusive ads, paying limits, or hidden fees.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-sm text-charcoal-text">Does it support English Wikipedia routes?</h4>
                  <p className="text-xs sm:text-sm text-charcoal-text/75 mt-1">
                    Yes! You can toggle the <strong>Wikipedia Language</strong> to the US flag 🇺🇸 (English) on the main lobby form to play with the global English Wikipedia database.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-sm text-charcoal-text">How does the ELO rating system work?</h4>
                  <p className="text-xs sm:text-sm text-charcoal-text/75 mt-1">
                    Winning in Ranked matchmaking mode grants you ELO rating points, while losing decreases them. The global leaderboard displays players based on their ELO ratings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center gap-3 lg:col-span-2 mt-4">
          <a
            href="https://saweria.co/WikiRace"
            target="_blank"
            rel="noopener noreferrer"
            className="chunky-press flex items-center gap-2 bg-lime-accent text-charcoal-text font-bold transition hover:bg-lime-deep"
            style={{
              border: "1px solid var(--color-charcoal-text)",
              borderRadius: "var(--radius-button)",
              padding: "6px 14px",
              fontSize: "13px",
              boxShadow: "var(--shadow-raised)",
            }}
          >
            {language === "en" ? "☕ Support Server (Saweria)" : "☕ Dukung Server (Saweria)"}
          </a>
          <p
            className="text-center text-charcoal-text/70"
            style={{ fontSize: "13px" }}
          >
            {language === "en" ? "Made with ☕ by " : "Dibuat dengan ☕ oleh "}{" "}
            <a
            href="https://www.muhfarizzi.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-charcoal-text underline underline-offset-2 hover:text-lime-soft"
            >
              @farizziezhi
            </a>
            .
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-charcoal-text/60 mt-1">
            <Link href="/privacy" className="hover:text-charcoal-text hover:underline transition">
              {language === "en" ? "Privacy Policy" : "Kebijakan Privasi"}
            </Link>
            <span className="opacity-40" aria-hidden="true">•</span>
            <Link href="/terms" className="hover:text-charcoal-text hover:underline transition">
              {language === "en" ? "Terms & Conditions" : "Syarat & Ketentuan"}
            </Link>
          </div>
        </div>
      </div>

      {/* ====== AUTH MODAL DIALOG ====== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/80 p-4 backdrop-blur-xs animate-fade-in">
          <div
            className="relative overflow-hidden w-full max-w-[390px] bg-charcoal-deep text-warm-cream p-6 flex flex-col gap-5 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
            style={{ borderRadius: "var(--radius-input)" }}
          >
            {/* Checkered Racing Stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-charcoal-text overflow-hidden flex" aria-hidden="true">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
              ))}
            </div>

            <div className="flex justify-between items-center border-b border-warm-cream/15 pb-2.5 mt-2">
              <h3 className="font-mono font-black text-xl uppercase text-lime-accent">
                🏁 {authType === "login" ? "Masuk Paddock" : "Daftar Driver"}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="font-black text-warm-cream/70 hover:text-lime-accent cursor-pointer transition"
                style={{ fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            {authError && (
              <div
                className="bg-burnt-orange/15 text-burnt-orange border border-burnt-orange/30 p-3 text-xs font-mono font-bold animate-pulse"
                style={{ borderRadius: "var(--radius-subtle)" }}
              >
                ⚠️ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-black text-warm-cream/80 uppercase">Username</label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="pd-input bg-charcoal-text border-2 border-charcoal-text text-warm-cream font-black focus:border-lime-accent focus:outline-none"
                  maxLength={20}
                  required
                  autoComplete="username"
                  placeholder="Hanya huruf, angka, underscore"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-black text-warm-cream/80 uppercase">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="pd-input bg-charcoal-text border-2 border-charcoal-text text-warm-cream font-black focus:border-lime-accent focus:outline-none"
                  required
                  autoComplete="current-password"
                  placeholder={authType === "register" ? "Min. 8 karakter (huruf & angka)" : "Masukkan password"}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="chunky-press btn-primary w-full mt-2 cursor-pointer font-black text-sm uppercase border-2 border-charcoal-text py-3 shadow-[3px_3px_0px_#000]"
              >
                {authLoading ? "PROSES..." : authType === "login" ? "🏁 MASUK BALAPAN" : "🏁 DAFTAR DRIVER"}
              </button>
            </form>

            <div className="flex items-center gap-2 my-1" aria-hidden>
              <div className="h-px flex-1 bg-warm-cream/15" />
              <span className="text-[10px] font-bold text-warm-cream/45 uppercase font-mono">atau</span>
              <div className="h-px flex-1 bg-warm-cream/15" />
            </div>

            <a
              href="/api/auth/google"
              className="chunky-press w-full text-center flex items-center justify-center gap-2.5 font-black text-xs cursor-pointer transition-all border-2 border-charcoal-text bg-pure-white text-charcoal-text shadow-[3px_3px_0px_#000]"
              style={{
                padding: "10px 18px",
                borderRadius: "var(--radius-button)"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>MASUK DENGAN GOOGLE</span>
            </a>

            <div className="text-center text-xs text-warm-cream/70 mt-1 border-t border-warm-cream/15 pt-3 font-mono font-bold">
              {authType === "login" ? (
                <>
                  Belum punya akun?{" "}
                  <button
                    onClick={() => openAuth("register")}
                    className="font-black text-lime-accent underline cursor-pointer hover:text-burnt-orange transition"
                  >
                    Daftar di sini
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun?{" "}
                  <button
                    onClick={() => openAuth("login")}
                    className="font-black text-lime-accent underline cursor-pointer hover:text-burnt-orange transition"
                  >
                    Masuk di sini
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Footer Ad Slot (Floating di bawah layar) */}
      <AdContainer type="sticky-footer" />
    </main>
  );
}

function HowToCard({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div
      className="bg-warm-cream p-4"
      style={{
        borderRadius: "var(--radius-input)",
        border: "1px solid var(--color-warm-gray)",
      }}
    >
      <span
        className="flex items-center justify-center bg-lime-accent font-extrabold tabular-nums text-charcoal-text"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {n}
      </span>
      <div
        className="font-extrabold text-charcoal-text"
        style={{ fontSize: "var(--text-body)" }}
      >
        {title}
      </div>
      <p
        className="mt-1 text-charcoal-text/75"
        style={{ fontSize: "14px", lineHeight: 1.4 }}
      >
        {body}
      </p>
    </div>
  );
}
