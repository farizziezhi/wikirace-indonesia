"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getChallengePackById, getPacksByLanguage } from "@/lib/challenges";
import { avatarColor, initials } from "@/lib/avatar";
import type { Room, WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS, searchArticles } from "@/lib/wikipedia";

interface LobbyProps {
  room: Room;
  currentClientId: string;
}

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const SAVE_DEBOUNCE_MS = 600;

export default function Lobby({ room, currentClientId }: LobbyProps) {
  const router = useRouter();
  const isHost = room.hostClientId === currentClientId;

  const [startArticle, setStartArticle] = useState(room.startArticle);
  const [endArticle, setEndArticle] = useState(room.endArticle);
  const [language, setLanguage] = useState<WikiLanguage>(room.language ?? "id");
  const [gameMode, setGameMode] = useState<"competitive" | "casual">(room.gameMode ?? "competitive");
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [surprising, setSurprising] = useState(false);

  // Re-sync kalau update datang dari server.
  const lastSyncedRef = useRef({
    start: room.startArticle,
    end: room.endArticle,
    language: room.language ?? ("id" as WikiLanguage),
    gameMode: room.gameMode ?? "competitive",
  });
  useEffect(() => {
    const serverLang = room.language ?? "id";
    const serverMode = room.gameMode ?? "competitive";
    if (
      room.startArticle !== lastSyncedRef.current.start ||
      room.endArticle !== lastSyncedRef.current.end ||
      serverLang !== lastSyncedRef.current.language ||
      serverMode !== lastSyncedRef.current.gameMode
    ) {
      setStartArticle(room.startArticle);
      setEndArticle(room.endArticle);
      setLanguage(serverLang);
      setGameMode(serverMode);
      lastSyncedRef.current = {
        start: room.startArticle,
        end: room.endArticle,
        language: serverLang,
        gameMode: serverMode,
      };
    }
  }, [room.startArticle, room.endArticle, room.language, room.gameMode]);

  // ------- Save articles (host only) — debounced -------
  const saveTimer = useRef<number | null>(null);

  const saveArticles = useCallback(
    async (start: string, end: string, lang: WikiLanguage, mode: "competitive" | "casual") => {
      if (!isHost) return;
      const s = start.trim();
      const e = end.trim();
      // Bisa save jika artikel valid ATAU bahasa berubah ATAU gameMode berubah
      const articlesValid = !!s && !!e && s !== e;
      const langChanged = lang !== lastSyncedRef.current.language;
      const modeChanged = mode !== lastSyncedRef.current.gameMode;
      if (!articlesValid && !langChanged && !modeChanged) return;

      try {
        const res = await fetch("/api/room/set-articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: room.id,
            clientId: currentClientId,
            startArticle: s,
            endArticle: e,
            language: lang,
            gameMode: mode,
          }),
        });
        if (!res.ok) {
          const data: { error?: string } = await res.json().catch(() => ({}));
          // Saat ganti bahasa tapi artikel belum valid, server akan tolak;
          // jangan tampilkan error ke user.
          if (articlesValid) {
            setError(data.error ?? "Gagal menyimpan artikel.");
          }
        } else {
          setError(null);
          lastSyncedRef.current = { start: s, end: e, language: lang, gameMode: mode };
        }
      } catch {
        setError("Tidak bisa terhubung ke server.");
      }
    },
    [isHost, room.id, currentClientId],
  );

  function scheduleSave(start: string, end: string, lang: WikiLanguage, mode: "competitive" | "casual") {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveArticles(start, end, lang, mode);
    }, SAVE_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  async function handleStart() {
    if (!isHost || starting) return;
    setError(null);
    setStarting(true);

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
      await saveArticles(startArticle, endArticle, language, gameMode);
    }

    try {
      const res = await fetch("/api/room/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal memulai game.");
      }
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setStarting(false);
    }
  }

  async function handleSurpriseMe() {
    if (!isHost || surprising || starting) return;
    setError(null);
    setSurprising(true);

    try {
      const res = await fetch("/api/room/set-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
          random: true,
          language,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal generate artikel random.");
      }
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setSurprising(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  /**
   * Bagikan link join. Pakai Web Share API kalau ada (lebih natural di mobile),
   * fallback ke copy URL ke clipboard.
   */
  async function handleShareLink() {
    const shareUrl = `${window.location.origin}/?room=${room.id}`;
    const text = `Ayo main WikiRace bareng! Kode room: ${room.id}`;

    // Web Share API tersedia di sebagian besar mobile + browser modern.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "WikiRace Indonesia",
          text,
          url: shareUrl,
        });
        setShareStatus("shared");
        window.setTimeout(() => setShareStatus("idle"), 1500);
        return;
      } catch (err) {
        // User cancel share dialog → return tanpa fallback ke copy.
        const aborted =
          err instanceof DOMException && err.name === "AbortError";
        if (aborted) return;
      }
    }

    // Fallback: copy URL ke clipboard.
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 1800);
    } catch {
      // Last resort: copy kode saja
      try {
        await navigator.clipboard.writeText(room.id);
        setShareStatus("copied");
        window.setTimeout(() => setShareStatus("idle"), 1800);
      } catch {
        // ignore
      }
    }
  }

  async function handleLeave() {
    if (leaving) return;
    setLeaving(true);
    try {
      await fetch("/api/room/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
        }),
      });
    } catch {
      // ignore
    } finally {
      router.push("/");
    }
  }

  async function handleSelectPack(packId: string) {
    if (!isHost || starting) return;
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/room/set-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
          packId,
          language,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal memuat tantangan.");
      }
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setStarting(false);
    }
  }

  const trimmedStart = startArticle.trim();
  const trimmedEnd = endArticle.trim();
  const articlesValid =
    !!trimmedStart && !!trimmedEnd && trimmedStart !== trimmedEnd;
  const enoughPlayers = room.players.length >= MIN_PLAYERS;
  const canStart = isHost && articlesValid && enoughPlayers;

  return (
    <main className="dot-bg flex flex-1 items-start justify-center bg-playdate-yellow px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex w-full max-w-[820px] flex-col gap-6">
        {/* ====== Room code poster ====== */}
        <section
          className="chunky-lg flex flex-col items-center gap-3 bg-pure-white px-6 py-7 text-center"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <span
            className="font-bold uppercase text-charcoal-text/60"
            style={{ fontSize: "12px", letterSpacing: "0.6px" }}
          >
            Kode room — bagikan ke teman
          </span>
          <div
            className="font-black tabular-nums text-charcoal-text"
            style={{
              fontSize: "clamp(48px, 14vw, 104px)",
              lineHeight: 1,
              letterSpacing: "0.14em",
            }}
            aria-label={`Kode room ${room.id}`}
          >
            {room.id}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 px-4">
            <button
              type="button"
              onClick={handleCopyCode}
              className="chunky-press bg-lime-accent text-charcoal-text"
              style={{
                border: "1px solid var(--color-lime-accent)",
                borderRadius: "var(--radius-button)",
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {copied ? "Tersalin!" : "Salin Kode"}
            </button>
            <button
              type="button"
              onClick={handleShareLink}
              className="chunky-press bg-charcoal-text text-warm-cream"
              style={{
                border: "1px solid var(--color-charcoal-text)",
                borderRadius: "var(--radius-button)",
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {shareStatus === "shared"
                ? "Terkirim!"
                : shareStatus === "copied"
                  ? "Link tersalin!"
                  : "🔗 Bagikan Link"}
            </button>
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaving}
              className="chunky-press bg-warm-cream text-charcoal-text"
              style={{
                border: "1px solid var(--color-warm-gray)",
                borderRadius: "var(--radius-button)",
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {leaving ? "Keluar…" : "Keluar"}
            </button>
          </div>
        </section>

        {/* ====== Topik permainan ====== */}
        <section
          className="chunky flex flex-col gap-4 bg-pure-white p-6"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2
              className="font-extrabold text-charcoal-text"
              style={{
                fontSize: "var(--text-heading)",
                lineHeight: "var(--leading-heading)",
              }}
            >
              Topik permainan
            </h2>
            {isHost && (
              <span
                className="font-bold uppercase text-charcoal-text/60"
                style={{ fontSize: "11px", letterSpacing: "0.6px" }}
              >
                Pengaturan host
              </span>
            )}
          </div>

          {isHost && (
            <section
              className="chunky flex flex-col gap-4 bg-pure-white p-6"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              <h3 className="text-xl font-extrabold text-charcoal-text">
                Tantangan Siap Pakai
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {getPacksByLanguage(language).map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => void handleSelectPack(pack.id)}
                    className="chunky text-left p-3 transition hover:bg-lime-accent/10"
                  >
                    <div className="font-bold text-charcoal-text">
                      {pack.name}
                    </div>
                    <div className="text-sm text-charcoal-text/70">
                      {pack.description}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {isHost ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LanguageToggle
                  value={language}
                  onChange={(next) => {
                    setLanguage(next);
                    // Ganti bahasa biasanya invalidasi pilihan artikel sebelumnya.
                    // Bersihkan supaya host pilih ulang dari Wikipedia bahasa baru.
                    setStartArticle("");
                    setEndArticle("");
                    scheduleSave("", "", next, gameMode);
                  }}
                  disabled={starting}
                />
                <GameModeToggle
                  value={gameMode}
                  onChange={(next) => {
                    setGameMode(next);
                    scheduleSave(startArticle, endArticle, language, next);
                  }}
                  disabled={starting}
                />
              </div>

              <button
                type="button"
                onClick={handleSurpriseMe}
                disabled={surprising || starting}
                className="chunky-press bg-lime-accent text-charcoal-text transition disabled:opacity-60"
                style={{
                  border: "1px solid var(--color-lime-accent)",
                  borderRadius: "var(--radius-button)",
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                {surprising ? "Mencari…" : "🎲 Surprise Me"}
              </button>

              <ArticleAutocomplete
                id="start-article"
                label="Artikel awal"
                placeholder={
                  language === "en" ? "e.g. Fried Rice" : "Contoh: Nasi Goreng"
                }
                value={startArticle}
                language={language}
                onChange={(next) => {
                  setStartArticle(next);
                  scheduleSave(next, endArticle, language, gameMode);
                }}
                disabled={starting}
              />
              <ArticleAutocomplete
                id="end-article"
                label="Artikel tujuan"
                placeholder={
                  language === "en" ? "e.g. Sukarno" : "Contoh: Soekarno"
                }
                value={endArticle}
                language={language}
                onChange={(next) => {
                  setEndArticle(next);
                  scheduleSave(startArticle, next, language, gameMode);
                }}
                disabled={starting}
              />
              {!articlesValid && (trimmedStart || trimmedEnd) && (
                <p
                  className="text-charcoal-text/70"
                  style={{ fontSize: "14px" }}
                >
                  Pilih dua artikel berbeda yang ada di Wikipedia{" "}
                  {language === "en" ? "English" : "Bahasa Indonesia"}.
                </p>
              )}
              {articlesValid && (
                <ArticlePreview start={trimmedStart} end={trimmedEnd} />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <LanguagePill language={room.language ?? "id"} />
                <GameModePill gameMode={room.gameMode ?? "competitive"} />
              </div>
              <ArticlePreview
                start={room.startArticle}
                end={room.endArticle}
                empty="Host belum memilih artikel."
              />
            </div>
          )}
        </section>

        {/* ====== Pemain ====== */}
        <section
          className="chunky flex flex-col gap-3 bg-pure-white p-6"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2
              className="font-extrabold text-charcoal-text"
              style={{
                fontSize: "var(--text-heading)",
                lineHeight: "var(--leading-heading)",
              }}
            >
              Pemain
            </h2>
            <span
              className="font-bold tabular-nums text-charcoal-text/70"
              style={{ fontSize: "14px" }}
            >
              {room.players.length}/{MAX_PLAYERS}
            </span>
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {room.players.map((p) => (
              <PlayerSlot
                key={p.clientId}
                username={p.username}
                isMe={p.clientId === currentClientId}
                isHost={p.isHost}
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: MAX_PLAYERS - room.players.length }).map(
              (_, i) => (
                <EmptySlot key={`empty-${i}`} />
              ),
            )}
          </ul>
        </section>

        {/* ====== Action ====== */}
        <section className="flex flex-col gap-3">
          {error && (
            <div
              role="alert"
              className="bg-charcoal-text text-pure-white"
              style={{
                borderRadius: "var(--radius-input)",
                padding: "12px 16px",
                fontSize: "var(--text-body)",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {isHost ? (
            <>
              <button
                type="button"
                onClick={handleStart}
                disabled={!canStart || starting}
                className="btn-primary"
              >
                {starting ? "Memulai…" : "Mulai Game"}
              </button>
              {!enoughPlayers && (
                <p
                  className="text-center text-charcoal-text/80"
                  style={{ fontSize: "14px" }}
                >
                  Butuh minimal {MIN_PLAYERS} pemain untuk memulai.
                </p>
              )}
              {enoughPlayers && !articlesValid && (
                <p
                  className="text-center text-charcoal-text/80"
                  style={{ fontSize: "14px" }}
                >
                  Tentukan dulu artikel start dan finish.
                </p>
              )}
            </>
          ) : (
            <div
              className="chunky flex items-center justify-center gap-3 bg-pure-white text-charcoal-text"
              style={{
                borderRadius: "var(--radius-input)",
                padding: "16px 20px",
                fontSize: "var(--text-body)",
              }}
            >
              <span
                className="bg-crank-violet pd-pulse inline-block shrink-0 rounded-full"
                style={{ width: 10, height: 10 }}
                aria-hidden
              />
              <span>Tunggu host memulai game…</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ============================================================
// Sub-components
// ============================================================

function LanguageToggle({
  value,
  onChange,
  disabled,
}: {
  value: WikiLanguage;
  onChange: (next: WikiLanguage) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-bold text-charcoal-text"
        style={{ fontSize: "var(--text-body)" }}
      >
        Bahasa Wikipedia
      </span>
      <div
        className="grid grid-cols-2 gap-2 border-2 border-charcoal-text bg-paper-white p-1"
        style={{ borderRadius: "var(--radius-input)" }}
        role="radiogroup"
        aria-label="Bahasa Wikipedia"
      >
        {LANGUAGE_OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              className="flex items-center justify-center gap-2 transition disabled:opacity-60"
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-button)",
                background: active
                  ? "var(--color-charcoal-text)"
                  : "transparent",
                color: active
                  ? "var(--color-pure-white)"
                  : "var(--color-charcoal-text)",
                fontWeight: 700,
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
  );
}

function LanguagePill({ language }: { language: WikiLanguage }) {
  const opt = LANGUAGE_OPTIONS.find((o) => o.value === language);
  if (!opt) return null;
  return (
    <div className="flex items-center gap-2">
      <span
        className="font-bold uppercase text-charcoal-text/60"
        style={{ fontSize: "11px", letterSpacing: "0.6px" }}
      >
        Bahasa
      </span>
      <span
        className="chunky-sm bg-paper-white px-2 py-1 font-bold text-charcoal-text"
        style={{
          borderRadius: "var(--radius-button)",
          fontSize: "13px",
        }}
      >
        <span aria-hidden style={{ marginRight: 4 }}>
          {opt.flag}
        </span>
        {opt.label}
      </span>
    </div>
  );
}

function GameModeToggle({
  value,
  onChange,
  disabled,
}: {
  value: "competitive" | "casual";
  onChange: (next: "competitive" | "casual") => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-bold text-charcoal-text"
        style={{ fontSize: "var(--text-body)" }}
      >
        Mode Permainan
      </span>
      <div
        className="grid grid-cols-2 gap-2 border-2 border-charcoal-text bg-paper-white p-1"
        style={{ borderRadius: "var(--radius-input)" }}
        role="radiogroup"
        aria-label="Mode Permainan"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === "competitive"}
          onClick={() => onChange("competitive")}
          disabled={disabled}
          className="flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-button)",
            background: value === "competitive"
              ? "var(--color-charcoal-text)"
              : "transparent",
            color: value === "competitive"
              ? "var(--color-pure-white)"
              : "var(--color-charcoal-text)",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          <span aria-hidden style={{ fontSize: 18 }}>🏆</span>
          <span>Competitive</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === "casual"}
          onClick={() => onChange("casual")}
          disabled={disabled}
          className="flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-button)",
            background: value === "casual"
              ? "var(--color-charcoal-text)"
              : "transparent",
            color: value === "casual"
              ? "var(--color-pure-white)"
              : "var(--color-charcoal-text)",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          <span aria-hidden style={{ fontSize: 18 }}>☕</span>
          <span>Santai</span>
        </button>
      </div>
    </div>
  );
}

function GameModePill({ gameMode }: { gameMode: "competitive" | "casual" }) {
  const isCompetitive = gameMode === "competitive";
  return (
    <div className="flex items-center gap-2">
      <span
        className="font-bold uppercase text-charcoal-text/60"
        style={{ fontSize: "11px", letterSpacing: "0.6px" }}
      >
        Mode
      </span>
      <span
        className="chunky-sm bg-paper-white px-2 py-1 font-bold text-charcoal-text"
        style={{
          borderRadius: "var(--radius-button)",
          fontSize: "13px",
        }}
      >
        <span aria-hidden style={{ marginRight: 4 }}>
          {isCompetitive ? "🏆" : "☕"}
        </span>
        {isCompetitive ? "Competitive" : "Santai"}
      </span>
    </div>
  );
}

function PlayerSlot({
  username,
  isMe,
  isHost,
}: {
  username: string;
  isMe: boolean;
  isHost: boolean;
}) {
  const color = avatarColor(username);
  return (
    <li
      className="flex items-center gap-3 border-2 border-charcoal-text bg-pure-white p-3"
      style={{
        borderRadius: "var(--radius-input)",
        background: isMe
          ? "var(--color-playdate-yellow-soft)"
          : "var(--color-pure-white)",
      }}
    >
      <span
        className="chunky-sm flex shrink-0 items-center justify-center font-extrabold uppercase text-pure-white"
        style={{
          width: 38,
          height: 38,
          borderRadius: "9999px",
          background: color,
          fontSize: 14,
          letterSpacing: "0.04em",
        }}
        aria-hidden
      >
        {initials(username)}
      </span>

      <div className="min-w-0 flex-1">
        <div
          className="flex items-center gap-2 font-extrabold text-charcoal-text"
          style={{ fontSize: "var(--text-body)" }}
        >
          <span className="truncate">{username}</span>
          {isMe && (
            <span
              className="chunky-sm bg-playdate-yellow text-charcoal-text font-bold"
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "var(--radius-button)",
                letterSpacing: "0.4px",
              }}
            >
              KAMU
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1 text-charcoal-text/70"
          style={{ fontSize: "12px" }}
        >
          {isHost ? "👑 Host" : "Siap bermain"}
        </div>
      </div>
    </li>
  );
}

function EmptySlot() {
  return (
    <li
      className="flex items-center gap-3 border-2 border-dashed border-stone-gray bg-pure-white/40 p-3"
      style={{ borderRadius: "var(--radius-input)" }}
    >
      <span
        className="flex shrink-0 items-center justify-center text-stone-gray"
        style={{
          width: 38,
          height: 38,
          borderRadius: "9999px",
          border: "2px dashed var(--color-stone-gray)",
          fontSize: 18,
        }}
        aria-hidden
      >
        ?
      </span>
      <span
        className="text-charcoal-text/50 italic"
        style={{ fontSize: "14px" }}
      >
        Slot kosong
      </span>
    </li>
  );
}

function ArticlePreview({
  start,
  end,
  empty = "",
}: {
  start: string;
  end: string;
  empty?: string;
}) {
  if (!start || !end) {
    if (empty) {
      return (
        <p
          className="text-charcoal-text/70"
          style={{ fontSize: "var(--text-body)" }}
        >
          {empty}
        </p>
      );
    }
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-parchment pt-3">
      <span
        className="font-bold uppercase text-charcoal-text/60"
        style={{ fontSize: "11px", letterSpacing: "0.6px" }}
      >
        Pratinjau
      </span>
      <span
        className="chunky-sm bg-paper-white px-3 py-1 font-bold text-charcoal-text"
        style={{
          borderRadius: "var(--radius-button)",
          fontSize: "var(--text-body)",
        }}
      >
        {start}
      </span>
      <span className="font-bold text-charcoal-text/60" aria-hidden>
        →
      </span>
      <span
        className="chunky-sm bg-playdate-yellow px-3 py-1 font-bold text-charcoal-text"
        style={{
          borderRadius: "var(--radius-button)",
          fontSize: "var(--text-body)",
        }}
      >
        {end}
      </span>
    </div>
  );
}

interface ArticleAutocompleteProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  language: WikiLanguage;
  onChange: (next: string) => void;
  disabled?: boolean;
}

function ArticleAutocomplete({
  id,
  label,
  placeholder,
  value,
  language,
  onChange,
  disabled,
}: ArticleAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (q.length < 2) {
      debounceRef.current = window.setTimeout(() => {
        setSuggestions([]);
        setSearching(false);
      }, 0);
      return;
    }

    const myReqId = ++reqIdRef.current;
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      const result = await searchArticles(q, language).catch(
        () => [] as string[],
      );
      if (myReqId !== reqIdRef.current) return;
      setSuggestions(result);
      setSearching(false);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, language]);

  const showSuggestions =
    open && (searching || suggestions.length > 0) && !disabled;

  return (
    <div className="relative flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-bold text-charcoal-text"
        style={{ fontSize: "var(--text-body)" }}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className="pd-input"
      />

      {showSuggestions && (
        <ul
          className="chunky-sm absolute z-10 mt-1 max-h-[260px] w-full overflow-y-auto bg-pure-white"
          style={{
            top: "100%",
            borderRadius: "var(--radius-input)",
          }}
          role="listbox"
        >
          {searching && suggestions.length === 0 && (
            <li
              className="px-3 py-2 text-charcoal-text/60"
              style={{ fontSize: "14px" }}
            >
              Mencari…
            </li>
          )}
          {suggestions.map((title) => (
            <li
              key={title}
              role="option"
              aria-selected={title === value}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(title);
                setOpen(false);
              }}
              className="cursor-pointer border-b border-parchment px-3 py-2 text-charcoal-text last:border-b-0 hover:bg-paper-white"
              style={{ fontSize: "var(--text-body)" }}
            >
              {title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
