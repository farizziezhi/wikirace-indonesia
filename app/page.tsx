"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getOrCreateClientId,
  getSavedUsername,
  saveUsername,
} from "@/lib/client-id";
import type { Room } from "@/lib/types";

const MAX_USERNAME_LENGTH = 20;

type Mode = "idle" | "creating" | "joining";

export default function HomePage() {
  const router = useRouter();
  const clientIdRef = useRef<string>("");

  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [hydrated, setHydrated] = useState(false);
  /** Pemain datang via shared link `?room=XXX` — UI sedikit beda. */
  const [invitedTo, setInvitedTo] = useState<string | null>(null);

  useEffect(() => {
    clientIdRef.current = getOrCreateClientId();
    setUsername(getSavedUsername());
    setHydrated(true);

    // Pre-fill kode room dari query param `?room=XXX`. Pakai
    // `window.location` (bukan `useSearchParams`) supaya halaman tetap
    // bisa di-prerender static — efek hanya jalan di client.
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
  }, []);

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
    <main className="dot-bg flex flex-1 items-center justify-center bg-playdate-yellow px-6 py-12">
      <div className="flex w-full max-w-[520px] flex-col gap-8">
        {invitedTo && (
          <div
            role="status"
            className="chunky bg-crank-violet text-pure-white"
            style={{
              borderRadius: "var(--radius-input)",
              padding: "14px 16px",
              fontSize: "var(--text-body)",
              lineHeight: "var(--leading-body)",
            }}
          >
            <div
              className="font-bold uppercase opacity-80"
              style={{ fontSize: "11px", letterSpacing: "0.6px" }}
            >
              Undangan room
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
              <span>Kamu diundang ke room</span>
              <span
                className="chunky-sm bg-pure-white text-charcoal-text font-extrabold tabular-nums"
                style={{
                  borderRadius: "var(--radius-button)",
                  padding: "2px 10px",
                  fontSize: "var(--text-subheading)",
                  letterSpacing: "0.18em",
                }}
              >
                {invitedTo}
              </span>
            </div>
            <div className="mt-1 opacity-90" style={{ fontSize: 14 }}>
              Masukkan nama lalu tekan{" "}
              <span className="font-bold">Gabung Room</span>.
            </div>
          </div>
        )}

        {toast && (
          <div
            role="status"
            className="chunky bg-pure-white text-charcoal-text"
            style={{
              borderRadius: "var(--radius-input)",
              padding: "12px 16px",
              fontSize: "var(--text-body)",
              lineHeight: "var(--leading-body)",
            }}
          >
            <span className="font-bold">📣 </span>
            {toast}
          </div>
        )}

        {/* ====== Brand mark + hero ====== */}
        <header className="flex flex-col items-start gap-4 text-charcoal-text">
          <div className="flex items-center gap-2">
            <span
              className="chunky-sm flex items-center justify-center bg-charcoal-text text-pure-white font-extrabold"
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
            className="font-extrabold text-charcoal-text"
            style={{
              fontSize: "clamp(38px, 6vw, 56px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Lompat dari{" "}
            <span
              className="chunky-sm inline-block bg-pure-white px-2"
              style={{ borderRadius: 8 }}
            >
              artikel A
            </span>{" "}
            ke{" "}
            <span
              className="chunky-sm inline-block bg-crank-violet text-pure-white px-2"
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
        </header>

        {/* ====== Card form ====== */}
        <section
          className="chunky-lg flex flex-col gap-5 bg-pure-white p-6"
          style={{ borderRadius: "var(--radius-input)" }}
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

          {/* Tombol Buat */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy || !hydrated}
            className={invitedTo ? "btn-white" : "btn-primary"}
          >
            {mode === "creating" ? "Membuat room…" : "Buat Room Baru"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3" aria-hidden>
            <div className="h-px flex-1 bg-parchment" />
            <span
              className="font-bold uppercase text-charcoal-text/70"
              style={{ fontSize: "12px", letterSpacing: "0.6px" }}
            >
              {invitedTo ? "atau buat baru di atas" : "atau gabung"}
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
              className="bg-charcoal-text text-pure-white"
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

        {/* ====== Cara main ====== */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          className="text-center text-charcoal-text/70"
          style={{ fontSize: "13px" }}
        >
          Dibuat dengan ☕ untuk pemain Wikipedia Bahasa Indonesia.
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
      className="chunky bg-pure-white p-4"
      style={{ borderRadius: "var(--radius-input)" }}
    >
      <span
        className="chunky-sm flex items-center justify-center bg-playdate-yellow font-extrabold tabular-nums text-charcoal-text"
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
