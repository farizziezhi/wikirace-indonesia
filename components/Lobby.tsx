"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getPacksByLanguage } from "@/lib/challenges";
import { avatarColor, initials } from "@/lib/avatar";
import type { Room, WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS, searchArticles } from "@/lib/wikipedia";
import AdContainer from "./AdContainer";
import { translations } from "@/lib/translations";

interface LobbyProps {
  room: Room;
  currentClientId: string;
  clockOffset?: number;
  language: "id" | "en";
}

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const SAVE_DEBOUNCE_MS = 600;

export default function Lobby({ room, currentClientId, clockOffset = 0, language: uiLanguage }: LobbyProps) {
  const t = translations[uiLanguage];
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

  // Hitung mundur untuk matchmaking
  const [matchmakingTimeLeft, setMatchmakingTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!room.isMatchmaking || !room.autoStartAt || room.players.length < 2) {
      setMatchmakingTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const diff = room.autoStartAt! - (Date.now() + clockOffset);
      const seconds = Math.max(0, Math.ceil(diff / 1000));
      setMatchmakingTimeLeft(seconds);

      if (seconds <= 0) {
        clearInterval(interval);
        const isHost = room.hostClientId === currentClientId;
        // Host memicu start langsung, non-host menunggu 2 detik sebagai fallback
        const delay = isHost ? 0 : 2000;
        setTimeout(() => {
          if (room.status === "lobby") {
            void handleStart();
          }
        }, delay);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room.isMatchmaking, room.autoStartAt, room.players.length, room.status, currentClientId, room.hostClientId, clockOffset]);

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
    const canInitiate = room.isMatchmaking || isHost;
    if (!canInitiate || starting) return;
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

    // Batal simpanan debounced agar tidak menimpa artikel acak
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

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

    // Batal simpanan debounced agar tidak menimpa paket artikel
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
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
    <main className="dot-bg flex flex-1 items-start justify-center bg-playdate-yellow px-4 pt-8 pb-32 sm:px-6 sm:pt-10 sm:pb-36">
      <div className="flex w-full max-w-[820px] flex-col gap-6">
        {/* ====== Ranked Matchmaking Header ====== */}
        {room.isMatchmaking ? (
          <section
            className="chunky-lg flex flex-col items-center gap-4 bg-charcoal-text text-warm-cream px-6 py-8 text-center"
            style={{
              borderRadius: "var(--radius-input)",
              boxShadow: "var(--shadow-floating)",
              background: "var(--color-charcoal-text)",
              color: "var(--color-warm-cream)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>⚔️</span>
              <span className="font-extrabold uppercase tracking-widest text-lime-accent" style={{ fontSize: "14px" }}>
                Ranked Matchmaking
              </span>
            </div>
            
            <h1 className="font-black tracking-tight" style={{ fontSize: "clamp(24px, 6vw, 42px)", lineHeight: 1.1 }}>
              BATTLE LOBBY
            </h1>

            <div className="flex items-center gap-4 border-t border-b border-warm-cream/20 py-3 px-6 my-1">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-warm-cream/60 tracking-wider">{t.averageElo}</span>
                <span className="font-black text-xl text-lime-accent tabular-nums">{Math.round(room.averageElo ?? 1200)}</span>
              </div>
              <div className="w-[1px] h-8 bg-warm-cream/20" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-warm-cream/60 tracking-wider">{t.players}</span>
                <span className="font-black text-xl tabular-nums">{room.players.length}/8</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-1">
              <button
                type="button"
                onClick={handleLeave}
                disabled={leaving}
                className="chunky-press bg-burnt-orange text-warm-cream transition hover:bg-burnt-orange/90 font-bold"
                style={{
                  border: "1px solid var(--color-charcoal-text)",
                  borderRadius: "var(--radius-button)",
                  padding: "8px 16px",
                  fontSize: "13px",
                }}
              >
                {leaving ? (uiLanguage === "en" ? "Cancelling..." : "Batal…") : t.cancelMatchmaking}
              </button>
            </div>
          </section>
        ) : (
          /* ====== Room code poster (Custom Room) ====== */
          <section
            className="chunky-lg flex flex-col items-center gap-3 bg-pure-white px-6 py-7 text-center"
            style={{ borderRadius: "var(--radius-input)" }}
          >
            <span
              className="font-bold uppercase text-charcoal-text/60"
              style={{ fontSize: "12px", letterSpacing: "0.6px" }}
            >
              {t.roomCodeShare}
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
                {copied ? t.copied : t.copyCode}
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
                  ? t.shared
                  : shareStatus === "copied"
                    ? t.linkCopied
                    : `🔗 ${t.shareLink}`}
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
                {leaving ? t.leaving : t.leave}
              </button>
            </div>
          </section>
        )}

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
              {room.isMatchmaking ? (uiLanguage === "en" ? "Ranked Battle Route" : "Rute Pertempuran Ranked") : t.gameTopic}
            </h2>
            {isHost && !room.isMatchmaking && (
              <span
                className="font-bold uppercase text-charcoal-text/60"
                style={{ fontSize: "11px", letterSpacing: "0.6px" }}
              >
                {t.hostSettings}
              </span>
            )}
          </div>

          {isHost && !room.isMatchmaking && (
            <section
              className="chunky flex flex-col gap-3 bg-pure-white p-6"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              <h3 className="text-xl font-extrabold text-charcoal-text">
                {t.readyChallenges}
              </h3>
              <select
                id="challenge-select"
                disabled={starting}
                onChange={(e) => {
                  if (e.target.value) {
                    void handleSelectPack(e.target.value);
                  }
                }}
                className="pd-input cursor-pointer font-bold bg-pure-white"
                defaultValue=""
              >
                <option value="" disabled>
                  {uiLanguage === "en" ? "Select a challenge..." : "Pilih tantangan..."}
                </option>
                {getPacksByLanguage(language).map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} — {pack.description}
                  </option>
                ))}
              </select>
            </section>
          )}

          {room.isMatchmaking ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase text-charcoal-text/60" style={{ fontSize: "11px", letterSpacing: "0.6px" }}>
                    Lobby
                  </span>
                  <span className="chunky-sm bg-lime-accent px-2 py-0.5 font-extrabold text-charcoal-text" style={{ borderRadius: "var(--radius-button)", fontSize: "12px" }}>
                    ⚔️ Ranked Matchmaking
                  </span>
                </div>
                <LanguagePill language={language} uiLanguage={uiLanguage} />
                <GameModePill gameMode={gameMode} uiLanguage={uiLanguage} />
              </div>
              <ArticlePreview
                start={room.startArticle}
                end={room.endArticle}
                empty={t.loadingArticle}
                uiLanguage={uiLanguage}
              />
            </div>
          ) : isHost ? (
            <div className="flex flex-col gap-4">
              <div
                className="bg-light-beige/60 text-charcoal-text border border-warm-gray/60 p-3.5"
                style={{
                  borderRadius: "var(--radius-input)",
                  fontSize: "13px",
                  lineHeight: "1.45",
                }}
              >
                💡{" "}
                <span className="font-bold">
                  {uiLanguage === "en" ? "How to set up the game:" : "Cara mengatur permainan:"}
                </span>{" "}
                {uiLanguage === "en" ? (
                  <>
                    Select from the <strong>Ready-to-use Challenges</strong> dropdown, click <strong>🎲 Surprise Me</strong> for random articles, or <strong>search and type your own</strong> starting and destination articles manually.
                  </>
                ) : (
                  <>
                    Pilih dari menu dropdown <strong>Tantangan Siap Pakai</strong>, klik <strong>🎲 Surprise Me</strong> untuk acak artikel, atau <strong>cari dan ketik sendiri</strong> artikel awal dan tujuan secara manual.
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LanguageToggle
                  value={language}
                  onChange={(next) => {
                    setLanguage(next);
                    setStartArticle("");
                    setEndArticle("");
                    if (saveTimer.current) {
                      window.clearTimeout(saveTimer.current);
                      saveTimer.current = null;
                    }
                    void saveArticles("", "", next, gameMode);
                  }}
                  disabled={starting}
                  uiLanguage={uiLanguage}
                />
                <GameModeToggle
                  value={gameMode}
                  onChange={(next) => {
                    setGameMode(next);
                    if (saveTimer.current) {
                      window.clearTimeout(saveTimer.current);
                      saveTimer.current = null;
                    }
                    void saveArticles(startArticle, endArticle, language, next);
                  }}
                  disabled={starting}
                  uiLanguage={uiLanguage}
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
                {surprising ? t.searching : t.surpriseMe}
              </button>

              <ArticleAutocomplete
                id="start-article"
                label={t.startArticle}
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
                uiLanguage={uiLanguage}
              />
              <ArticleAutocomplete
                id="end-article"
                label={t.destinationArticle}
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
                uiLanguage={uiLanguage}
              />
              {!articlesValid && (trimmedStart || trimmedEnd) && (
                <p
                  className="text-charcoal-text/70"
                  style={{ fontSize: "14px" }}
                >
                  {t.chooseDifferent}
                </p>
              )}
              {articlesValid && (
                <ArticlePreview start={trimmedStart} end={trimmedEnd} uiLanguage={uiLanguage} />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <LanguagePill language={room.language ?? "id"} uiLanguage={uiLanguage} />
                <GameModePill gameMode={room.gameMode ?? "competitive"} uiLanguage={uiLanguage} />
              </div>
              <ArticlePreview
                start={room.startArticle}
                end={room.endArticle}
                empty={t.hostNotChosen}
                uiLanguage={uiLanguage}
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
              {t.players}
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
                elo={p.elo}
                uiLanguage={uiLanguage}
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: MAX_PLAYERS - room.players.length }).map(
              (_, i) => (
                <EmptySlot key={`empty-${i}`} uiLanguage={uiLanguage} />
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

          {room.isMatchmaking ? (
            <div
              className="chunky flex flex-col items-center justify-center gap-3 text-center p-6"
              style={{
                borderRadius: "var(--radius-input)",
                background: room.players.length < 2 ? "var(--color-pure-white)" : "var(--color-lime-accent)",
                color: "var(--color-charcoal-text)",
              }}
            >
              {room.players.length < 2 ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="bg-lime-soft pd-pulse inline-block shrink-0 rounded-full" style={{ width: 10, height: 10 }} />
                    <span className="font-extrabold text-charcoal-text">{t.findingOpponent}</span>
                  </div>
                  <p className="text-sm text-charcoal-text/75 mt-1">
                    {t.waitingPlayers}
                  </p>
                </>
              ) : matchmakingTimeLeft !== null ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <span className="bg-burnt-orange pd-pulse inline-block shrink-0 rounded-full" style={{ width: 10, height: 10 }} />
                    <span className="font-black text-xl text-charcoal-text uppercase tracking-tight">
                      🏎️ {t.opponentFound}{matchmakingTimeLeft}{t.opponentFoundEnd}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-text/90 font-bold uppercase tracking-wider">
                    {t.prepareStart}
                  </p>
                </>
              ) : (
                <>
                  <div className="border-charcoal-text border-t-transparent animate-spin rounded-full" style={{ width: 20, height: 20, borderWidth: 3 }} />
                  <span className="font-black uppercase text-charcoal-text">{t.startingMatch}</span>
                </>
              )}
            </div>
          ) : isHost ? (
            <>
              <button
                type="button"
                onClick={handleStart}
                disabled={!canStart || starting}
                className="btn-primary"
              >
                {starting ? (uiLanguage === "en" ? "Starting..." : "Memulai…") : t.startGame}
              </button>
              {!enoughPlayers && (
                <p
                  className="text-center text-charcoal-text/80"
                  style={{ fontSize: "14px" }}
                >
                  {t.needMinPlayers.replace("{count}", String(MIN_PLAYERS))}
                </p>
              )}
              {enoughPlayers && !articlesValid && (
                <p
                  className="text-center text-charcoal-text/80"
                  style={{ fontSize: "14px" }}
                >
                  {t.determineArticles}
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
              <span>{t.waitingHost}</span>
            </div>
          )}
        </section>

        {/* Iklan Banner Lobi */}
        <AdContainer type="lobby-banner" className="w-full mt-2" />
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
  uiLanguage,
}: {
  value: WikiLanguage;
  onChange: (next: WikiLanguage) => void;
  disabled?: boolean;
  uiLanguage: "id" | "en";
}) {
  const t = translations[uiLanguage];
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-bold text-charcoal-text"
        style={{ fontSize: "var(--text-body)" }}
      >
        {t.wikipediaLanguage}
      </span>
      <div
        className="grid grid-cols-2 gap-2 border-2 border-charcoal-text bg-paper-white p-1"
        style={{ borderRadius: "var(--radius-input)" }}
        role="radiogroup"
        aria-label={t.wikipediaLanguage}
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

function LanguagePill({ language, uiLanguage }: { language: WikiLanguage; uiLanguage: "id" | "en" }) {
  const opt = LANGUAGE_OPTIONS.find((o) => o.value === language);
  if (!opt) return null;
  return (
    <div className="flex items-center gap-2">
      <span
        className="font-bold uppercase text-charcoal-text/60"
        style={{ fontSize: "11px", letterSpacing: "0.6px" }}
      >
        {uiLanguage === "en" ? "Language" : "Bahasa"}
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
  uiLanguage,
}: {
  value: "competitive" | "casual";
  onChange: (next: "competitive" | "casual") => void;
  disabled?: boolean;
  uiLanguage: "id" | "en";
}) {
  const t = translations[uiLanguage];
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-bold text-charcoal-text"
        style={{ fontSize: "var(--text-body)" }}
      >
        {t.gameMode}
      </span>
      <div
        className="grid grid-cols-2 gap-2 border-2 border-charcoal-text bg-paper-white p-1"
        style={{ borderRadius: "var(--radius-input)" }}
        role="radiogroup"
        aria-label={t.gameMode}
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
          <span>{t.casual}</span>
        </button>
      </div>
    </div>
  );
}

function GameModePill({ gameMode, uiLanguage }: { gameMode: "competitive" | "casual"; uiLanguage: "id" | "en" }) {
  const isCompetitive = gameMode === "competitive";
  const t = translations[uiLanguage];
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
        {isCompetitive ? t.competitive : t.casual}
      </span>
    </div>
  );
}

function PlayerSlot({
  username,
  isMe,
  isHost,
  elo,
  uiLanguage,
}: {
  username: string;
  isMe: boolean;
  isHost: boolean;
  elo?: number;
  uiLanguage: "id" | "en";
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
              {uiLanguage === "en" ? "YOU" : "KAMU"}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 text-charcoal-text/70"
          style={{ fontSize: "12px" }}
        >
          <span>{isHost ? "👑 Host" : (uiLanguage === "en" ? "Ready to play" : "Siap bermain")}</span>
          {elo !== undefined && (
            <span className="font-bold text-charcoal-text bg-lime-accent/40 px-1.5 py-0.5 rounded ml-1" style={{ fontSize: "10px" }}>
              {elo} ELO
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptySlot({ uiLanguage }: { uiLanguage: "id" | "en" }) {
  const t = translations[uiLanguage];
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
        {t.emptySlot}
      </span>
    </li>
  );
}

function ArticlePreview({
  start,
  end,
  empty = "",
  uiLanguage,
}: {
  start: string;
  end: string;
  empty?: string;
  uiLanguage: "id" | "en";
}) {
  const t = translations[uiLanguage];
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
        {t.preview}
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
  uiLanguage: "id" | "en";
}

function ArticleAutocomplete({
  id,
  label,
  placeholder,
  value,
  language,
  onChange,
  disabled,
  uiLanguage,
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
              {translations[uiLanguage].searching}
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
