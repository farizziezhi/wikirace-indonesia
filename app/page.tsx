"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getOrCreateClientId,
  getSavedUsername,
  saveUsername,
} from "@/lib/client-id";
import { isRaceAudioUnlocked, unlockRaceAudio } from "@/lib/race-audio";
import type { Room, WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS } from "@/lib/wikipedia";

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
  const [playMode, setPlayMode] = useState<"ranked" | "mabar" | "solo">("ranked");

  useEffect(() => {
    clientIdRef.current = getOrCreateClientId();

    window.setTimeout(() => {
      setUsername(getSavedUsername());
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

    // Muat data sesi aktif & leaderboard global
    void checkAuthSession();
    void loadLeaderboard();
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
              artikel A
            </span>{" "}
            ke{" "}
            <span
              className="inline-block bg-charcoal-text text-warm-cream px-2"
              style={{ borderRadius: 8 }}
            >
              artikel B
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
            Multiplayer realtime di Wikipedia Bahasa Indonesia. Daftar untuk main Ranked
            atau masuk room secara santai.
          </p>

          {/* ====== Cara main — desktop only ====== */}
          <section className="mt-2 hidden w-full grid-cols-3 gap-3 lg:grid">
            <HowToCard
              n={1}
              title="Pilih nama"
              body="Main instan atau login untuk menyimpan rating ELO."
            />
            <HowToCard
              n={2}
              title="Cari Lawan"
              body="Klik Matchmaking untuk bertanding otomatis dengan lawan seimbang."
            />
            <HowToCard
              n={3}
              title="Klik & lari"
              body="Hanya boleh klik tautan dalam artikel. Sampai duluan, ELO naik!"
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
                  Memeriksa sesi...
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-40">
                  <button
                    disabled
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                  >
                    Masuk
                  </button>
                  <button
                    disabled
                    className="btn-white"
                    style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                  >
                    Daftar
                  </button>
                </div>
              </div>
            ) : user ? (
              <div
                className="flex items-center justify-between bg-pure-white p-3 border border-warm-gray"
                style={{
                  borderRadius: "var(--radius-input)",
                  boxShadow: "var(--shadow-flat)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center font-extrabold uppercase text-pure-white"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "var(--color-charcoal-text)",
                      fontSize: "13px",
                    }}
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="font-extrabold text-charcoal-text text-sm">
                      {user.username}
                    </div>
                    <div className="text-[11px] text-charcoal-text/70 font-bold mt-0.5 flex items-center gap-1.5">
                      <span className="inline-block bg-lime-accent text-charcoal-text font-black px-1.5 py-0.5 rounded">
                        🏆 {user.stats?.elo ?? 1200} ELO
                      </span>
                      <span>•</span>
                      <span>{user.stats?.wins ?? 0} Win</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "11px", height: "fit-content" }}
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div
                className="p-3 bg-light-beige border border-warm-gray/60 flex items-center justify-between gap-3"
                style={{ borderRadius: "var(--radius-input)" }}
              >
                <div className="text-[11px] font-bold text-charcoal-text/80 max-w-[200px] leading-relaxed">
                  Masuk atau Daftar untuk menyimpan skor ELO & masuk Papan Peringkat.
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => openAuth("login")}
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => openAuth("register")}
                    className="btn-white"
                    style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                  >
                    Daftar
                  </button>
                </div>
              </div>
            )
          )}

          {/* Invitation or Tabbed Interface - Wrapped with min-height to prevent vertical layout shifting */}
          <div style={{ minHeight: "320px" }} className="flex flex-col gap-4">
            {invitedTo ? (
              <div className="flex flex-col gap-4">
                <div className="bg-lime-accent/20 border border-lime-accent p-3.5 text-xs text-charcoal-text" style={{ borderRadius: "var(--radius-input)" }}>
                  <span className="font-extrabold block mb-1 text-[13px]">📬 Undangan Room: {invitedTo}</span>
                  Masukkan nama Anda di bawah untuk langsung bergabung ke balapan.
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="username" className="font-bold text-charcoal-text text-sm">Nama kamu</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={MAX_USERNAME_LENGTH}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Contoh: Andi"
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
                  {mode === "joining" ? "Bergabung..." : "Gabung Sekarang"}
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
                  Batal & Main Mode Lain
                </button>
              </div>
            ) : (
              <>
                {/* Tab Selector */}
                <div className="flex bg-light-beige p-1 gap-1" style={{ borderRadius: "var(--radius-button)" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("play")}
                    className="flex-1 py-2 text-center font-extrabold transition-all"
                    style={{
                      fontSize: "13px",
                      borderRadius: "var(--radius-button)",
                      background: activeTab === "play" ? "var(--color-charcoal-text)" : "transparent",
                      color: activeTab === "play" ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                    }}
                  >
                    🎮 Bermain
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("leaderboard")}
                    className="flex-1 py-2 text-center font-extrabold transition-all"
                    style={{
                      fontSize: "13px",
                      borderRadius: "var(--radius-button)",
                      background: activeTab === "leaderboard" ? "var(--color-charcoal-text)" : "transparent",
                      color: activeTab === "leaderboard" ? "var(--color-warm-cream)" : "var(--color-charcoal-text)",
                    }}
                  >
                    🏆 Leaderboard
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
                        Nama kamu
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={MAX_USERNAME_LENGTH}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Contoh: Andi"
                        disabled={busy || !hydrated || !!user}
                        className="pd-input"
                      />
                      {!user && (
                        <div className="flex justify-between items-center text-[11px] text-charcoal-text/50">
                          <span>💡 Tip: Login untuk simpan ELO</span>
                          <span>{username.length}/{MAX_USERNAME_LENGTH}</span>
                        </div>
                      )}
                    </div>

                    {/* Pilihan bahasa */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-charcoal-text text-sm">
                        Bahasa Wikipedia
                      </span>
                      <div
                        className="grid grid-cols-2 gap-1 bg-light-beige p-1"
                        style={{
                          borderRadius: "var(--radius-input)",
                          border: "1px solid var(--color-warm-gray)",
                        }}
                        role="radiogroup"
                        aria-label="Bahasa Wikipedia"
                      >
                        {LANGUAGE_OPTIONS.map((opt) => {
                          const active = opt.value === language;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setLanguage(opt.value)}
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
                        👥 Mabar
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
                        🏎️ Solo
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
                          {mode === "matchmaking" ? "⚡ Mencari Lawan..." : "⚡ Cari Lawan (Ranked)"}
                        </button>
                        <p className="text-[11px] text-charcoal-text/60 text-center leading-relaxed">
                          Cari lawan seimbang secara realtime. Skor ELO Anda akan naik/turun sesuai hasil permainan.
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
                          {mode === "creating" ? "Membuat room…" : "Buat Room Mabar Baru"}
                        </button>

                        <div className="flex items-center gap-2" aria-hidden>
                          <div className="h-px flex-1 bg-parchment/60" />
                          <span className="font-bold text-[10px] uppercase text-charcoal-text/50">atau gabung room</span>
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
                            placeholder="KODE"
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
                            {mode === "joining" ? "Gabung…" : "Gabung"}
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
                          🏎️ Mulai Latihan Solo
                        </button>
                        <p className="text-[11px] text-charcoal-text/60 text-center leading-relaxed">
                          Latihan mandiri tanpa memengaruhi ELO. Sempurna untuk latihan rute Wikipedia secara santai.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Leaderboard */}
                {activeTab === "leaderboard" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 20 }}>🏆</span>
                      <h3 className="font-extrabold text-charcoal-text" style={{ fontSize: "15px" }}>
                        Peringkat ELO Global
                      </h3>
                    </div>

                    {leaderboardLoading ? (
                      <div className="flex justify-center py-8 text-charcoal-text/60 text-xs">Memuat peringkat...</div>
                    ) : leaderboard.length === 0 ? (
                      <div className="text-center py-8 text-charcoal-text/60 text-xs">Belum ada data peringkat.</div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                        {leaderboard.map((entry, index) => {
                          let medal = "";
                          if (index === 0) medal = "🥇";
                          else if (index === 1) medal = "🥈";
                          else if (index === 2) medal = "🥉";

                          return (
                            <div
                              key={entry.username}
                              className="flex items-center justify-between border-b border-warm-gray/30 pb-2 last:border-0"
                              style={{ fontSize: "13px" }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 font-bold text-charcoal-text/60 text-xs">{medal || `${index + 1}`}</span>
                                <span className="font-bold text-charcoal-text">{entry.username}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-charcoal-text/70 text-xs">{entry.wins} Win</span>
                                <span className="font-bold text-charcoal-text bg-lime-accent/70 px-2 py-0.5 rounded text-xs">
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

        {/* ====== Cara main — mobile only ====== */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:hidden">
          <HowToCard
            n={1}
            title="Pilih nama"
            body="Main instan atau login untuk menyimpan rating ELO."
          />
          <HowToCard
            n={2}
            title="Cari Lawan"
            body="Klik Matchmaking untuk bertanding otomatis dengan lawan seimbang."
          />
          <HowToCard
            n={3}
            title="Klik & lari"
            body="Hanya boleh klik tautan dalam artikel. Sampai duluan, ELO naik!"
          />
        </section>

        <p
          className="text-center text-charcoal-text/70 lg:col-span-2"
          style={{ fontSize: "13px" }}
        >
          Dibuat dengan ☕ oleh{" "}
          <a
            href="https://github.com/farizziezhi"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-charcoal-text underline underline-offset-2 hover:text-lime-soft"
          >
            @farizziezhi
          </a>
          .
        </p>
      </div>

      {/* ====== AUTH MODAL DIALOG ====== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-text/60 p-4 backdrop-blur-xs animate-fade-in">
          <div
            className="chunky-lg w-full max-w-[380px] bg-pure-white p-6 flex flex-col gap-4 text-charcoal-text"
            style={{ borderRadius: "var(--radius-rounded)", border: "1px solid var(--color-warm-gray)" }}
          >
            <div className="flex justify-between items-center border-b border-warm-gray pb-2">
              <h3 className="font-extrabold text-xl">
                {authType === "login" ? "Masuk ke Akun" : "Daftar Akun Baru"}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="font-bold text-charcoal-text/60 hover:text-charcoal-text cursor-pointer"
                style={{ fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            {authError && (
              <div
                className="bg-burnt-orange/15 text-burnt-orange p-3 text-sm font-semibold"
                style={{ borderRadius: "var(--radius-subtle)" }}
              >
                ⚠ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold">Username</label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="pd-input"
                  maxLength={20}
                  required
                  autoComplete="username"
                  placeholder="Hanya huruf, angka, underscore"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="pd-input"
                  required
                  autoComplete="current-password"
                  placeholder={authType === "register" ? "Min. 8 karakter (huruf & angka)" : "Masukkan password"}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary w-full mt-2 cursor-pointer"
              >
                {authLoading ? "Memproses..." : authType === "login" ? "Masuk" : "Daftar"}
              </button>
            </form>

            <div className="flex items-center gap-2 my-1" aria-hidden>
              <div className="h-px flex-1 bg-warm-gray/30" />
              <span className="text-[10px] font-bold text-charcoal-text/45 uppercase">atau</span>
              <div className="h-px flex-1 bg-warm-gray/30" />
            </div>

            <a
              href="/api/auth/google"
              className="btn-white w-full text-center flex items-center justify-center gap-2.5 font-bold cursor-pointer transition-all"
              style={{
                padding: "10px 18px",
                fontSize: "14px",
                border: "1px solid var(--color-warm-gray)",
                background: "var(--color-pure-white)",
                boxShadow: "var(--shadow-flat)"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Masuk dengan Google</span>
            </a>

            <div className="text-center text-sm text-charcoal-text/70 mt-1 border-t border-warm-gray/50 pt-3">
              {authType === "login" ? (
                <>
                  Belum punya akun?{" "}
                  <button
                    onClick={() => openAuth("register")}
                    className="font-bold text-charcoal-text underline cursor-pointer hover:text-lime-soft"
                  >
                    Daftar di sini
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun?{" "}
                  <button
                    onClick={() => openAuth("login")}
                    className="font-bold text-charcoal-text underline cursor-pointer hover:text-lime-soft"
                  >
                    Masuk di sini
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
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
