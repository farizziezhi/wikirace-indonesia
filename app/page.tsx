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

type Mode = "idle" | "creating" | "joining";

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
  }, []);

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

  // Launch solo mode practice. Save username and navigate to /solo.
  async function handleSolo() {
    setError(null);
    const usernameError = validateUsername();
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const trimmedUsername = username.trim();
    saveUsername(trimmedUsername);
    // navigate to solo page with language param
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

  const busy = mode !== "idle";

  return (
    <main className="dot-bg flex flex-1 items-center justify-center bg-warm-cream px-6 py-12 lg:py-16">
      {/* ===== Floating notifications (top-center on desktop, top on mobile) ===== */}
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

      <div className="grid w-full max-w-[1100px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ====== Brand mark + hero ====== */}
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
            Multiplayer realtime di Wikipedia Bahasa Indonesia. Buat room,
            bagikan kodenya, dan klik tautan secepat mungkin.
          </p>

          {/* ====== Cara main — desktop only, di bawah hero ====== */}
          <section className="mt-2 hidden w-full grid-cols-3 gap-3 lg:grid">
            <HowToCard
              n={1}
              title="Pilih nama"
              body="Tidak perlu daftar. Cukup ketik nama dan masuk room."
            />
            <HowToCard
              n={2}
              title="Bagikan kode"
              body="Salin kode 6 karakter ke teman. Maksimal 8 pemain per room."
            />
            <HowToCard
              n={3}
              title="Klik & lari"
              body="Hanya boleh klik tautan dalam artikel. Sampai duluan, menang."
            />
          </section>
        </header>

        {/* ====== Card form ====== */}
        <section
          className="flex flex-col gap-5 bg-warm-cream p-6"
          style={{
            borderRadius: "var(--radius-input)",
            border: "1px solid var(--color-warm-gray)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="username"
              className="font-bold text-charcoal-text"
              style={{ fontSize: "var(--text-body)" }}
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
              disabled={busy || !hydrated}
              className="pd-input"
            />
            <span
              className="text-charcoal-text/60"
              style={{ fontSize: "13px" }}
            >
              {username.length}/{MAX_USERNAME_LENGTH} karakter
            </span>
          </div>

          {/* Pilihan bahasa — hanya muncul saat tidak diundang ke room
              tertentu. Untuk join, bahasa ditentukan host. */}
          {!invitedTo && (
            <div className="flex flex-col gap-2">
              <span
                className="font-bold text-charcoal-text"
                style={{ fontSize: "var(--text-body)" }}
              >
                Bahasa Wikipedia
              </span>
              <div
                className="grid grid-cols-2 gap-2 bg-light-beige p-1"
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
                      className="flex items-center justify-center gap-2 transition disabled:opacity-60"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-button)",
                        background: active
                          ? "var(--color-charcoal-text)"
                          : "transparent",
                        color: active
                          ? "var(--color-warm-cream)"
                          : "var(--color-charcoal-text)",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      <span aria-hidden style={{ fontSize: 18 }}>
                        {opt.flag}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tombol Buat */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy || !hydrated}
            className={invitedTo ? "btn-white" : "btn-primary"}
          >
            {mode === "creating" ? "Membuat room…" : "Buat Room Baru"}
          </button>

          {/* Tombol Solo */}
          <button
            type="button"
            onClick={handleSolo}
            disabled={busy || !hydrated}
            className="btn-secondary"
            style={{
              border: "1px solid var(--color-lime-accent)",
              color: "var(--color-charcoal-text)",
            }}
          >
            🏎️ Latihan Solo
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3" aria-hidden>
            <div className="h-px flex-1 bg-parchment" />
            <span
              className="font-bold uppercase text-charcoal-text/70"
              style={{ fontSize: "12px", letterSpacing: "0.6px" }}
            >
              {invitedTo ? "atau buat baru di atas" : "atau gabung room"}
            </span>
            <div className="h-px flex-1 bg-parchment" />
          </div>

          {/* Join */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="roomCode"
              className="font-bold text-charcoal-text"
              style={{ fontSize: "var(--text-body)" }}
            >
              Kode room
            </label>
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
              placeholder="ABC123"
              disabled={busy || !hydrated}
              className="pd-input"
              style={{
                fontSize: "var(--text-heading)",
                lineHeight: "1.1",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={busy || !hydrated}
            className={invitedTo ? "btn-primary" : "btn-yellow"}
          >
            {mode === "joining" ? "Bergabung…" : "Gabung Room"}
          </button>

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

        {/* ====== Cara main — mobile only, di bawah form ====== */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:hidden">
          <HowToCard
            n={1}
            title="Pilih nama"
            body="Tidak perlu daftar. Cukup ketik nama dan masuk room."
          />
          <HowToCard
            n={2}
            title="Bagikan kode"
            body="Salin kode 6 karakter ke teman. Maksimal 8 pemain per room."
          />
          <HowToCard
            n={3}
            title="Klik & lari"
            body="Hanya boleh klik tautan dalam artikel. Sampai duluan, menang."
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
