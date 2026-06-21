"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getPacksByLanguage } from "@/lib/challenges";
import { avatarColor, initials } from "@/lib/avatar";
import type { Room, WikiLanguage } from "@/lib/types";
import { LANGUAGE_OPTIONS, searchArticles } from "@/lib/wikipedia";
import AdContainer from "./AdContainer";
import { translations } from "@/lib/translations";
import { getPlayerToken } from "@/lib/client-id";

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

  // Aturan Kustom
  const [clickLimit, setClickLimit] = useState<number>(room.customRules?.clickLimit ?? 0);
  const [timeLimit, setTimeLimit] = useState<number>(room.customRules?.timeLimit ?? 0);
  const [bannedArticles, setBannedArticles] = useState<string[]>(room.customRules?.bannedArticles ?? []);
  const [banInput, setBanInput] = useState("");
  const [banSuggestions, setBanSuggestions] = useState<string[]>([]);
  const [banOpen, setBanOpen] = useState(false);
  const [banSearching, setBanSearching] = useState(false);
  const banDebounceRef = useRef<number | null>(null);
  const banReqIdRef = useRef(0);

  // Hitung mundur untuk matchmaking & ready up
  const [toggleReadyLoading, setToggleReadyLoading] = useState(false);
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);

  useEffect(() => {
    const q = banInput.trim();
    if (banDebounceRef.current) window.clearTimeout(banDebounceRef.current);

    if (q.length < 2) {
      banDebounceRef.current = window.setTimeout(() => {
        setBanSuggestions([]);
        setBanSearching(false);
      }, 0);
      return;
    }

    const myReqId = ++banReqIdRef.current;
    banDebounceRef.current = window.setTimeout(async () => {
      setBanSearching(true);
      const result = await searchArticles(q, language).catch(
        () => [] as string[],
      );
      if (myReqId !== banReqIdRef.current) return;
      setBanSuggestions(result);
      setBanSearching(false);
    }, 250);

    return () => {
      if (banDebounceRef.current) window.clearTimeout(banDebounceRef.current);
    };
  }, [banInput, language]);

  // Redirect and alert if kicked (AFK)
  useEffect(() => {
    const isMeInRoom = room.players.some((p) => p.clientId === currentClientId);
    if (!isMeInRoom && room.status === "lobby") {
      try {
        window.sessionStorage.setItem("wikirace:toast", uiLanguage === "en"
          ? "You were kicked from the Ranked lobby for not readying up (AFK)!"
          : "Kamu dikeluarkan dari lobi Ranked karena tidak bersiap (AFK)!"
        );
      } catch {}
      router.replace("/");
    }
  }, [room.players, currentClientId, room.status, router, uiLanguage]);

  // Efek untuk memicu bot join jika pemain sendirian di Ranked matchmaking > 60 detik (1 menit)
  useEffect(() => {
    if (!room.isMatchmaking || room.status !== "lobby" || room.players.length !== 1) {
      return;
    }

    let botJoinCalled = false;

    const checkTimeout = () => {
      const elapsed = (Date.now() + clockOffset) - room.createdAt;
      if (elapsed >= 60000 && !botJoinCalled) {
        botJoinCalled = true;
        // Panggil API bot-join untuk mengundang bot masuk ke Ranked match
        void fetch("/api/room/bot-join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room.id, clientId: currentClientId }),
        }).catch((err) => {
          console.warn("Gagal mengundang bot matchmaking:", err);
        });
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [room.isMatchmaking, room.status, room.players.length, room.createdAt, room.id, clockOffset, currentClientId]);

  // Efek untuk auto-ready bot setelah delay acak (1 s/d 2.5s) - Host Only
  useEffect(() => {
    if (!room.isMatchmaking || room.status !== "lobby" || !isHost) return;

    const unreadyBots = room.players.filter((p) => p.isBot && !p.ready);
    if (unreadyBots.length === 0) return;

    const timers = unreadyBots.map((bot) => {
      const delay = 1000 + Math.random() * 1500;
      return setTimeout(async () => {
        try {
          await fetch("/api/room/ready", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomId: room.id,
              clientId: currentClientId,
              targetClientId: bot.clientId,
              ready: true,
            }),
          });
        } catch (err) {
          console.warn("Gagal mengubah status ready bot:", err);
        }
      }, delay);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [room.players, room.isMatchmaking, room.status, isHost, room.id, currentClientId]);

  // Efek hitung mundur 30 detik bersiap & kick unready
  useEffect(() => {
    if (!room.isMatchmaking || !room.matchFoundAt || room.players.length < 2 || room.status !== "lobby") {
      setReadyCountdown(null);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() + clockOffset) - room.matchFoundAt!;
      const secondsLeft = Math.max(0, Math.ceil((30000 - elapsed) / 1000));
      setReadyCountdown(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(interval);
        
        const unreadyPlayers = room.players.filter(p => !p.ready);
        if (unreadyPlayers.length > 0) {
          // Hanya satu client yang menembak API kick untuk mencegah request storms
          const hostIsUnready = room.players.find(p => p.clientId === room.hostClientId)?.ready === false;
          const firstReadyHuman = room.players.find(p => p.ready && !p.isBot);
          const amFirstReadyHuman = firstReadyHuman?.clientId === currentClientId;
          
          if (isHost || (hostIsUnready && amFirstReadyHuman)) {
            const target = unreadyPlayers[0];
            void fetch("/api/room/kick-unready", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomId: room.id,
                clientId: currentClientId,
                targetClientId: target.clientId,
              }),
            }).catch(err => {
              console.warn("Gagal kick unready player:", err);
            });
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room.isMatchmaking, room.matchFoundAt, room.players, room.status, currentClientId, room.hostClientId, isHost, clockOffset, room.id]);

  // Re-sync kalau update datang dari server.
  const lastSyncedRef = useRef({
    start: room.startArticle,
    end: room.endArticle,
    language: room.language ?? ("id" as WikiLanguage),
    gameMode: room.gameMode ?? "competitive",
    clickLimit: room.customRules?.clickLimit ?? 0,
    timeLimit: room.customRules?.timeLimit ?? 0,
    bannedArticles: room.customRules?.bannedArticles ?? [],
  });
  useEffect(() => {
    const serverLang = room.language ?? "id";
    const serverMode = room.gameMode ?? "competitive";
    const serverClickLimit = room.customRules?.clickLimit ?? 0;
    const serverTimeLimit = room.customRules?.timeLimit ?? 0;
    const serverBannedArticles = room.customRules?.bannedArticles ?? [];

    const startChanged = room.startArticle !== lastSyncedRef.current.start;
    const endChanged = room.endArticle !== lastSyncedRef.current.end;
    const langChanged = serverLang !== lastSyncedRef.current.language;
    const modeChanged = serverMode !== lastSyncedRef.current.gameMode;
    const clickLimitChanged = serverClickLimit !== lastSyncedRef.current.clickLimit;
    const timeLimitChanged = serverTimeLimit !== lastSyncedRef.current.timeLimit;
    const bannedArticlesChanged = JSON.stringify(serverBannedArticles) !== JSON.stringify(lastSyncedRef.current.bannedArticles);

    if (
      startChanged ||
      endChanged ||
      langChanged ||
      modeChanged ||
      clickLimitChanged ||
      timeLimitChanged ||
      bannedArticlesChanged
    ) {
      setStartArticle(room.startArticle);
      setEndArticle(room.endArticle);
      setLanguage(serverLang);
      setGameMode(serverMode);
      setClickLimit(serverClickLimit);
      setTimeLimit(serverTimeLimit);
      setBannedArticles(serverBannedArticles);
      lastSyncedRef.current = {
        start: room.startArticle,
        end: room.endArticle,
        language: serverLang,
        gameMode: serverMode,
        clickLimit: serverClickLimit,
        timeLimit: serverTimeLimit,
        bannedArticles: serverBannedArticles,
      };
    }
  }, [room.startArticle, room.endArticle, room.language, room.gameMode, room.customRules]);

  // ------- Save articles (host only) — debounced -------
  const saveTimer = useRef<number | null>(null);

  const saveArticles = useCallback(
    async (
      start: string,
      end: string,
      lang: WikiLanguage,
      mode: "competitive" | "casual",
      rules?: { clickLimit: number; timeLimit: number; bannedArticles: string[] }
    ) => {
      if (!isHost) return;
      const s = start.trim();
      const e = end.trim();
      const articlesValid = !!s && !!e && s !== e;
      const langChanged = lang !== lastSyncedRef.current.language;
      const modeChanged = mode !== lastSyncedRef.current.gameMode;
      
      const targetRules = rules ?? {
        clickLimit: lastSyncedRef.current.clickLimit,
        timeLimit: lastSyncedRef.current.timeLimit,
        bannedArticles: lastSyncedRef.current.bannedArticles,
      };

      const clickLimitChanged = targetRules.clickLimit !== lastSyncedRef.current.clickLimit;
      const timeLimitChanged = targetRules.timeLimit !== lastSyncedRef.current.timeLimit;
      const bannedArticlesChanged = JSON.stringify(targetRules.bannedArticles) !== JSON.stringify(lastSyncedRef.current.bannedArticles);

      const rulesChanged = clickLimitChanged || timeLimitChanged || bannedArticlesChanged;

      if (!articlesValid && !langChanged && !modeChanged && !rulesChanged) return;

      try {
        const res = await fetch("/api/room/set-articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Player-Token": getPlayerToken(room.id),
          },
          body: JSON.stringify({
            roomId: room.id,
            clientId: currentClientId,
            startArticle: s,
            endArticle: e,
            language: lang,
            gameMode: mode,
            customRules: targetRules,
          }),
        });
        if (!res.ok) {
          const data: { error?: string } = await res.json().catch(() => ({}));
          if (articlesValid) {
            setError(data.error ?? "Gagal menyimpan artikel.");
          }
        } else {
          setError(null);
          lastSyncedRef.current = {
            start: s,
            end: e,
            language: lang,
            gameMode: mode,
            clickLimit: targetRules.clickLimit,
            timeLimit: targetRules.timeLimit,
            bannedArticles: targetRules.bannedArticles,
          };
        }
      } catch {
        setError("Tidak bisa terhubung ke server.");
      }
    },
    [isHost, room.id, currentClientId],
  );

  function scheduleSave(
    start: string,
    end: string,
    lang: WikiLanguage,
    mode: "competitive" | "casual",
    rules?: { clickLimit: number; timeLimit: number; bannedArticles: string[] }
  ) {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveArticles(start, end, lang, mode, rules);
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
        headers: {
          "Content-Type": "application/json",
          "X-Player-Token": getPlayerToken(room.id),
        },
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
        headers: {
          "Content-Type": "application/json",
          "X-Player-Token": getPlayerToken(room.id),
        },
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
        headers: {
          "Content-Type": "application/json",
          "X-Player-Token": getPlayerToken(room.id),
        },
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
        headers: {
          "Content-Type": "application/json",
          "X-Player-Token": getPlayerToken(room.id),
        },
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

  async function handleToggleReady() {
    if (toggleReadyLoading) return;
    const me = room.players.find((p) => p.clientId === currentClientId);
    if (!me) return;
    const nextReady = !me.ready;
    setToggleReadyLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/room/ready", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Player-Token": getPlayerToken(room.id),
        },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
          ready: nextReady,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error ?? (uiLanguage === "en" ? "Failed to ready up." : "Gagal mengubah status bersiap."));
      }
    } catch {
      setError(uiLanguage === "en" ? "Cannot connect to server." : "Tidak bisa terhubung ke server.");
    } finally {
      setToggleReadyLoading(false);
    }
  }
  const handleClickLimitChange = (val: number) => {
    setClickLimit(val);
    scheduleSave(startArticle, endArticle, language, gameMode, {
      clickLimit: val,
      timeLimit,
      bannedArticles,
    });
  };

  const handleTimeLimitChange = (val: number) => {
    setTimeLimit(val);
    scheduleSave(startArticle, endArticle, language, gameMode, {
      clickLimit,
      timeLimit: val,
      bannedArticles,
    });
  };

  const handleAddBannedArticle = (articleName: string) => {
    const clean = articleName.trim();
    if (!clean) return;
    if (bannedArticles.some(a => a.toLowerCase() === clean.toLowerCase())) return;
    const nextList = [...bannedArticles, clean];
    setBannedArticles(nextList);
    setBanInput("");
    void saveArticles(startArticle, endArticle, language, gameMode, {
      clickLimit,
      timeLimit,
      bannedArticles: nextList,
    });
  };

  const handleRemoveBannedArticle = (index: number) => {
    const nextList = bannedArticles.filter((_, i) => i !== index);
    setBannedArticles(nextList);
    void saveArticles(startArticle, endArticle, language, gameMode, {
      clickLimit,
      timeLimit,
      bannedArticles: nextList,
    });
  };

  const handleBanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBannedArticle(banInput);
    }
  };

  const trimmedStart = startArticle.trim();
  const trimmedEnd = endArticle.trim();
  const articlesValid =
    !!trimmedStart && !!trimmedEnd && trimmedStart !== trimmedEnd;
  const enoughPlayers = room.players.length >= MIN_PLAYERS;
  const canStart = isHost && articlesValid && enoughPlayers;

  // Calculate matchmaking ready states
  const numPlayers = room.players.length;
  const readyCount = room.players.filter(p => p.ready).length;
  const allReady = numPlayers >= MIN_PLAYERS && readyCount === numPlayers;
  const showBanSuggestions =
    banOpen && (banSearching || banSuggestions.length > 0);

  if (room.isMatchmaking) {
    return (
      <main className="dot-bg flex flex-1 items-start justify-center bg-warm-cream px-4 pt-8 pb-32 sm:px-6 sm:pt-10 sm:pb-36">
        <div className="w-full max-w-[1150px] grid grid-cols-12 gap-6 items-start">
          {/* Left Column: Matchmaking Info & Track */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-6 w-full">
            {/* ====== Ranked Matchmaking Header ====== */}
            <section
              className="relative overflow-hidden flex flex-col items-center gap-4 p-0 text-center w-full"
              style={{
                borderRadius: "var(--radius-rounded)",
                border: "3px solid var(--color-charcoal-text)",
                boxShadow: "6px 6px 0px #000",
                background: "var(--color-charcoal-text)",
                color: "var(--color-warm-cream)",
              }}
            >
              {/* Header Checkered Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-charcoal-text overflow-hidden flex" aria-hidden="true">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
                ))}
              </div>

              <div className="flex flex-col items-center gap-2.5 px-6 py-5 w-full mt-1.5">
                <h1 className="font-black tracking-tight text-lime-accent uppercase" style={{ fontSize: "22px", lineHeight: 1.1 }}>
                  🏎️ Ranked Match Cockpit
                </h1>

                <div className="flex items-center gap-6 border-t border-b border-warm-gray/10 py-2.5 px-6 my-0.5 w-full justify-center font-mono">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-black text-warm-cream/50 tracking-wider">Rata-rata Elo</span>
                    <span className="font-black text-xl text-lime-accent tabular-nums">{Math.round(room.averageElo ?? 1200)}</span>
                  </div>
                  <div className="w-[2px] h-8 bg-warm-gray/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-black text-warm-cream/50 tracking-wider">Pemain</span>
                    <span className="font-black text-xl text-warm-cream tabular-nums">{room.players.length}/{MAX_PLAYERS}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={leaving}
                    className="chunky-press bg-burnt-orange text-warm-cream font-mono font-black border-2 border-charcoal-text tracking-wider uppercase text-[11px]"
                    style={{
                      borderRadius: "var(--radius-button)",
                      padding: "8px 18px",
                      boxShadow: "3px 3px 0px #000",
                    }}
                  >
                    {leaving ? (uiLanguage === "en" ? "Cancelling..." : "Membatalkan...") : t.cancelMatchmaking}
                  </button>
                </div>
              </div>
            </section>

            {/* ====== Rute Pertempuran ====== */}
            <section
              className="flex flex-col gap-4 p-5 bg-pure-white w-full"
              style={{
                borderRadius: "var(--radius-input)",
                border: "3px solid var(--color-charcoal-text)",
                boxShadow: "6px 6px 0px #000",
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2
                  className="font-extrabold text-charcoal-text text-xl"
                  style={{
                    lineHeight: "1.2",
                  }}
                >
                  {uiLanguage === "en" ? "Ranked Battle Route" : "Rute Pertempuran Ranked"}
                </h2>
              </div>

              <div className="flex flex-col gap-4">
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
                
                <div className="flex flex-col gap-4 p-5 bg-charcoal-deep border-3 border-charcoal-text text-warm-cream shadow-[5px_5px_0px_#000] rounded-xl relative overflow-hidden">
                  {/* Visual Header */}
                  <div className="flex items-center justify-between border-b border-warm-cream/10 pb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-lime-accent flex items-center gap-1.5">
                      🏁 {uiLanguage === "en" ? "Battle Track" : "Lintasan Pertempuran"}
                    </span>
                    <span className="text-[11px] font-semibold text-warm-cream/40">
                      {uiLanguage === "en" ? "Reach the target in fewest clicks" : "Capai target dengan klik sesedikit mungkin"}
                    </span>
                  </div>

                  <div className="relative flex flex-col md:flex-row md:items-stretch justify-between gap-4 mt-1">
                    {/* Start Box */}
                    <div className="z-10 flex-1 bg-charcoal-text border-2 border-lime-accent/30 p-3 rounded-xl flex flex-col gap-1.5 shadow-[4px_4px_0px_rgba(210,255,0,0.1)] hover:border-lime-accent transition-colors duration-200">
                      <div className="flex items-center gap-2">
                        <span className="bg-lime-accent text-charcoal-text font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          {uiLanguage === "en" ? "Start" : "Awal"}
                        </span>
                      </div>
                      <span className="font-extrabold text-warm-cream text-sm md:text-base leading-snug break-words">
                        {(room.startArticle || t.loadingArticle).replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Connector Graphic */}
                    <div className="flex items-center justify-center shrink-0 py-2 md:py-0 self-center">
                      <div className="flex items-center justify-center bg-charcoal-text border-2 border-charcoal-text w-9 h-9 rounded-full shadow-[2px_2px_0px_#000] text-lime-accent font-black text-base">
                        ➔
                      </div>
                    </div>

                    {/* Destination Box */}
                    <div className="z-10 flex-1 bg-charcoal-text border-2 border-burnt-orange/30 p-3 rounded-xl flex flex-col gap-1.5 shadow-[4px_4px_0px_rgba(255,107,0,0.1)] hover:border-burnt-orange transition-colors duration-200">
                      <div className="flex items-center gap-2">
                        <span className="bg-burnt-orange text-warm-cream font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          {uiLanguage === "en" ? "Target" : "Tujuan"}
                        </span>
                      </div>
                      <span className="font-extrabold text-warm-cream text-sm md:text-base leading-snug break-words">
                        {(room.endArticle || t.loadingArticle).replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Players & Action Section */}
          <div className="col-span-12 md:col-span-7 flex flex-col gap-6 w-full">
            {/* ====== Pemain ====== */}
            <section
              className="flex flex-col gap-4 p-6 bg-charcoal-deep text-warm-cream w-full border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
              style={{
                borderRadius: "var(--radius-rounded)",
              }}
            >
              <div className="flex items-center justify-between border-b border-warm-cream/10 pb-3">
                <h2 className="font-black text-lg uppercase tracking-wider text-lime-accent">
                  🏎️ Driver Standings
                </h2>
                <span className={`font-mono font-black text-xs uppercase ${allReady ? "text-lime-accent" : "text-burnt-orange"}`}>
                  {readyCount}/{numPlayers} READY
                </span>
              </div>

              {/* Player Grid */}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {room.players.map((p) => (
                  <li key={p.clientId}>
                    <VersusCard
                      player={p}
                      isMe={p.clientId === currentClientId}
                      uiLanguage={uiLanguage}
                    />
                  </li>
                ))}
                {/* Empty slots */}
                {Array.from({ length: MAX_PLAYERS - room.players.length }).map(
                  (_, i) => (
                    <li key={`empty-${i}`}>
                      <VersusEmptyCard uiLanguage={uiLanguage} />
                    </li>
                  ),
                )}
              </ul>
            </section>

            {/* ====== Action (Mencari Lawan & Tombol Siap) ====== */}
            <section className="flex flex-col gap-3 w-full">
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

              <div className="flex flex-col gap-4">
                {room.players.length < 2 ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3 text-center p-6 bg-pure-white border-3 border-charcoal-text shadow-[5px_5px_0px_#000]"
                    style={{
                      borderRadius: "var(--radius-rounded)",
                      color: "var(--color-charcoal-text)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-burnt-orange pd-pulse inline-block shrink-0 rounded-full" style={{ width: 12, height: 12 }} />
                      <span className="font-mono font-black text-base uppercase tracking-tight">{t.findingOpponent}</span>
                    </div>
                    <p className="text-xs text-charcoal-text/75 font-bold uppercase tracking-wider">
                      {t.waitingPlayers}
                    </p>
                  </div>
                ) : readyCountdown !== null ? (
                  <div
                    className="flex flex-col gap-3 p-5 bg-lime-accent border-3 border-charcoal-text shadow-[5px_5px_0px_#000]"
                    style={{
                      borderRadius: "var(--radius-rounded)",
                      color: "var(--color-charcoal-text)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-charcoal-text pd-pulse inline-block shrink-0 rounded-full" style={{ width: 10, height: 10 }} />
                        <span className="font-mono font-black text-sm uppercase tracking-tight">
                          ⏱️ {uiLanguage === "en" ? "READY COUNTDOWN" : "HITUNG MUNDUR BERSIAP"}
                        </span>
                      </div>
                      <span className="font-mono font-black text-lg bg-charcoal-text text-lime-accent px-2 py-0.5 rounded border border-charcoal-text">
                        {readyCountdown}S
                      </span>
                    </div>
                    
                    {/* Segmented Timer Bar */}
                    <div className="w-full h-4 bg-charcoal-text/10 border-2 border-charcoal-text rounded overflow-hidden flex p-[2px] gap-[2px]">
                      {Array.from({ length: 30 }).map((_, idx) => {
                        const isActive = idx < (readyCountdown ?? 0);
                        return (
                          <div 
                            key={idx}
                            className={`flex-1 h-full rounded-sm border-r border-charcoal-text/5 last:border-0 transition-all duration-300 ${
                              isActive 
                                ? (readyCountdown !== null && readyCountdown <= 10 
                                  ? "bg-burnt-orange animate-pulse" 
                                  : "bg-charcoal-text") 
                                : "bg-transparent"
                            }`}
                          />
                        );
                      })}
                    </div>
                    
                    <p className="text-[11px] text-charcoal-text/80 font-bold uppercase tracking-wide">
                      {uiLanguage === "en" 
                        ? "Ready up to lock in the battle! Unready nodes will be terminated." 
                        : "Harap klik bersiap sebelum waktu habis atau koneksi Anda akan diputus!"}
                    </p>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-3 text-center p-6 bg-lime-accent border-3 border-charcoal-text shadow-[5px_5px_0px_#000]"
                    style={{
                      borderRadius: "var(--radius-rounded)",
                      color: "var(--color-charcoal-text)",
                    }}
                  >
                    <div className="border-charcoal-text border-t-transparent animate-spin rounded-full" style={{ width: 24, height: 24, borderWidth: 4 }} />
                    <span className="font-black uppercase text-lg tracking-wide text-charcoal-text font-mono">{t.startingMatch}</span>
                  </div>
                )}

                {room.players.length >= 2 && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleToggleReady}
                      disabled={toggleReadyLoading}
                      className={`relative overflow-hidden chunky-press w-full py-4 text-center font-mono font-black uppercase tracking-wider text-lg transition border-3 border-charcoal-text active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000] bg-lime-accent text-charcoal-text shadow-[5px_5px_0px_#000] hover:bg-lime-accent/90`}
                      style={{
                        borderRadius: "var(--radius-button)",
                      }}
                    >
                      <span className="relative z-10">
                        {toggleReadyLoading 
                          ? (uiLanguage === "en" ? "Processing..." : "Memproses...")
                          : room.players.find(p => p.clientId === currentClientId)?.ready
                            ? (uiLanguage === "en" ? "✓ READY" : "✓ SAYA SIAP")
                            : (uiLanguage === "en" ? "READY TO PLAY" : "SIAP BERMAIN")}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Iklan Banner Lobi */}
          <AdContainer type="lobby-banner" className="w-full mt-2 col-span-12" />
        </div>
      </main>
    );
  }

  return (
    <main className="dot-bg flex flex-1 items-start justify-center bg-warm-cream px-4 pt-8 pb-32 sm:px-6 sm:pt-10 sm:pb-36">
      <div className="flex w-full max-w-[820px] flex-col gap-6">
        {/* ====== Room code poster (Custom Room) ====== */}
        <section
          className="relative overflow-hidden flex flex-col items-center gap-3 bg-charcoal-deep text-warm-cream px-6 py-8 text-center border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
          style={{ borderRadius: "var(--radius-rounded)" }}
        >
          {/* Header Checkered Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-charcoal-text overflow-hidden flex" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
            ))}
          </div>

          <span
            className="font-mono font-black uppercase text-lime-accent text-xs tracking-widest mt-1.5"
          >
            🏁 {t.roomCodeShare} • PADDOCK ENTRY
          </span>
          <div
            className="font-black font-mono tabular-nums text-lime-accent bg-charcoal-text/50 px-8 py-3 rounded-2xl border-2 border-charcoal-text shadow-[inset_0px_2px_8px_rgba(0,0,0,0.5)] my-2"
            style={{
              fontSize: "clamp(36px, 10vw, 76px)",
              lineHeight: 1,
              letterSpacing: "0.15em",
            }}
            aria-label={`Kode room ${room.id}`}
          >
            {room.id}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 px-4 z-10">
            <button
              type="button"
              onClick={handleCopyCode}
              className="chunky-press bg-lime-accent text-charcoal-text font-mono font-black text-xs uppercase px-5 py-3 border-2 border-charcoal-text shadow-[3px_3px_0px_#000] rounded-xl hover:bg-lime-deep transition-all"
            >
              {copied ? t.copied : t.copyCode}
            </button>
            <button
              type="button"
              onClick={handleShareLink}
              className="chunky-press bg-charcoal-text text-warm-cream border-2 border-charcoal-text font-mono font-black text-xs uppercase px-5 py-3 shadow-[3px_3px_0px_#000] rounded-xl hover:bg-charcoal-deep transition-all"
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
              className="chunky-press bg-burnt-orange text-warm-cream border-2 border-charcoal-text font-mono font-black text-xs uppercase px-5 py-3 shadow-[3px_3px_0px_#000] rounded-xl hover:bg-[#d65a00] transition-all"
            >
              {leaving ? t.leaving : t.leave}
            </button>
          </div>
        </section>

        {/* ====== Topik permainan ====== */}
        <section
          className="flex flex-col gap-4 bg-pure-white p-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
          style={{ borderRadius: "var(--radius-rounded)" }}
        >
          <div className="flex items-baseline justify-between gap-2 border-b-3 border-charcoal-text pb-2.5">
            <h2 className="font-black text-xl text-charcoal-text uppercase tracking-wider">
              🏁 {t.gameTopic}
            </h2>
            {isHost && (
              <span className="font-mono font-black uppercase text-[10px] bg-charcoal-text text-lime-accent px-2 py-0.5 rounded border border-charcoal-text">
                🛠️ {t.hostSettings}
              </span>
            )}
          </div>

          {isHost && (
            <div className="flex flex-col gap-3.5 bg-light-beige/50 p-4 border-2 border-charcoal-text rounded-xl mt-1">
              <h3 className="text-xs font-black text-charcoal-text uppercase tracking-wider font-mono">
                🏆 {t.readyChallenges}
              </h3>
              <select
                id="challenge-select"
                disabled={starting}
                onChange={(e) => {
                  if (e.target.value) {
                    void handleSelectPack(e.target.value);
                  }
                }}
                className="pd-input cursor-pointer font-bold bg-pure-white border-2 border-charcoal-text shadow-[2px_2px_0px_#000]"
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
            </div>
          )}

          {isHost ? (
            <div className="flex flex-col gap-4">
              <div
                className="bg-charcoal-deep text-warm-cream border-2 border-charcoal-text p-4 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
                style={{
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              >
                💡{" "}
                <span className="font-black text-lime-accent uppercase font-mono tracking-wider block sm:inline mr-1">
                  {uiLanguage === "en" ? "COCKPIT SETUP:" : "CARA MENGATUR BALAPAN:"}
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
                className="chunky-press bg-lime-accent text-charcoal-text border-2 border-charcoal-text font-mono font-black text-xs uppercase px-4 py-3 shadow-[3px_3px_0px_#000] rounded-xl hover:bg-lime-deep transition-all"
              >
                🎲 {surprising ? t.searching : t.surpriseMe}
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
                  className="text-burnt-orange font-bold text-xs uppercase font-mono"
                >
                  ⚠️ {t.chooseDifferent}
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

        {/* ====== Aturan Kustom (Diagnostics Dashboard) ====== */}
        <section
          className="flex flex-col gap-4 bg-pure-white p-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
          style={{ borderRadius: "var(--radius-rounded)" }}
        >
          <div className="flex items-baseline justify-between gap-2 border-b-3 border-charcoal-text pb-2.5">
            <h2 className="font-black text-xl text-charcoal-text uppercase tracking-wider">
              ⚙️ {uiLanguage === "en" ? "Custom Diagnostics" : "Aturan Kustom"}
            </h2>
            {isHost && (
              <span className="font-mono font-black uppercase text-[10px] bg-charcoal-text text-lime-accent px-2 py-0.5 rounded border border-charcoal-text">
                🛠️ {t.hostSettings}
              </span>
            )}
          </div>

          {isHost ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Click Limit Select */}
                <div className="flex flex-col gap-2">
                  <label className="font-mono font-black text-xs uppercase text-charcoal-text/70">
                    🔋 {uiLanguage === "en" ? "Click Limit" : "Batas Klik"}
                  </label>
                  <select
                    value={clickLimit}
                    onChange={(e) => handleClickLimitChange(Number(e.target.value))}
                    className="pd-input cursor-pointer font-bold bg-pure-white border-2 border-charcoal-text shadow-[2px_2px_0px_#000]"
                  >
                    <option value={0}>{uiLanguage === "en" ? "Unlimited" : "Tanpa Batas"}</option>
                    <option value={5}>5 {uiLanguage === "en" ? "clicks" : "klik"}</option>
                    <option value={10}>10 {uiLanguage === "en" ? "clicks" : "klik"}</option>
                    <option value={15}>15 {uiLanguage === "en" ? "clicks" : "klik"}</option>
                    <option value={20}>20 {uiLanguage === "en" ? "clicks" : "klik"}</option>
                  </select>
                </div>

                {/* Time Limit Select */}
                <div className="flex flex-col gap-2">
                  <label className="font-mono font-black text-xs uppercase text-charcoal-text/70">
                    ⏱️ {uiLanguage === "en" ? "Time Limit" : "Batas Waktu"}
                  </label>
                  <select
                    value={timeLimit}
                    onChange={(e) => handleTimeLimitChange(Number(e.target.value))}
                    className="pd-input cursor-pointer font-bold bg-pure-white border-2 border-charcoal-text shadow-[2px_2px_0px_#000]"
                  >
                    <option value={0}>{uiLanguage === "en" ? "Unlimited" : "Tanpa Batas"}</option>
                    <option value={60}>1 {uiLanguage === "en" ? "minute" : "menit"}</option>
                    <option value={120}>2 {uiLanguage === "en" ? "minutes" : "menit"}</option>
                    <option value={180}>3 {uiLanguage === "en" ? "minutes" : "menit"}</option>
                    <option value={300}>5 {uiLanguage === "en" ? "minutes" : "menit"}</option>
                  </select>
                </div>
              </div>

              {/* Ban List Input */}
              <div className="flex flex-col gap-2">
                <label className="font-mono font-black text-xs uppercase text-charcoal-text/70">
                  ⛔ {uiLanguage === "en" ? "Ban Wikipedia Articles" : "Daftar Larangan Artikel"}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={banInput}
                      onChange={(e) => setBanInput(e.target.value)}
                      onFocus={() => setBanOpen(true)}
                      onBlur={() => window.setTimeout(() => setBanOpen(false), 120)}
                      onKeyDown={handleBanKeyDown}
                      placeholder={
                        uiLanguage === "en"
                          ? "Type article name & press enter..."
                          : "Ketik nama artikel & tekan enter..."
                      }
                      className="pd-input w-full border-2 border-charcoal-text shadow-[2px_2px_0px_#000]"
                      autoComplete="off"
                      spellCheck={false}
                    />

                    {/* Autocomplete Dropdown */}
                    {showBanSuggestions && (
                      <ul
                        className="chunky-sm absolute z-20 mt-1 max-h-[200px] w-full overflow-y-auto bg-pure-white"
                        style={{
                          top: "100%",
                          borderRadius: "var(--radius-input)",
                        }}
                        role="listbox"
                      >
                        {banSearching && banSuggestions.length === 0 && (
                          <li
                            className="px-3 py-2 text-charcoal-text/60"
                            style={{ fontSize: "14px" }}
                          >
                            {translations[uiLanguage].searching}
                          </li>
                        )}
                        {banSuggestions.map((title) => (
                          <li
                            key={title}
                            role="option"
                            aria-selected={bannedArticles.includes(title)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddBannedArticle(title);
                              setBanOpen(false);
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

                  <button
                    type="button"
                    onClick={() => handleAddBannedArticle(banInput)}
                    className="chunky-press bg-charcoal-text text-warm-cream font-mono font-black text-xs uppercase px-5 border-2 border-charcoal-text shadow-[2px_2px_0px_#000] rounded-xl hover:bg-charcoal-deep"
                  >
                    {uiLanguage === "en" ? "Ban" : "Larang"}
                  </button>
                </div>
                
                {/* Tags display (Stiker Plat Nomor Hazard) */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {bannedArticles.length === 0 ? (
                    <span className="text-xs text-charcoal-text/50 font-mono italic">
                      {uiLanguage === "en" ? "No banned articles yet." : "Belum ada artikel yang dilarang."}
                    </span>
                  ) : (
                    bannedArticles.map((art, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 bg-burnt-orange text-warm-cream font-mono font-black text-[11px] uppercase px-3 py-1 rounded border-2 border-charcoal-text shadow-[2px_2px_0px_#000] hover:scale-[1.02] transition-all"
                      >
                        <span>{art}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBannedArticle(idx)}
                          className="text-warm-cream hover:text-lime-accent font-extrabold focus:outline-none ml-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-black uppercase text-charcoal-text/50">
                    {uiLanguage === "en" ? "Click Limit" : "Batas Klik"}
                  </span>
                  <span className="font-extrabold text-charcoal-text">
                    {clickLimit > 0
                      ? `${clickLimit} ${uiLanguage === "en" ? "clicks" : "klik"}`
                      : (uiLanguage === "en" ? "Unlimited" : "Tanpa Batas")}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-black uppercase text-charcoal-text/50">
                    {uiLanguage === "en" ? "Time Limit" : "Batas Waktu"}
                  </span>
                  <span className="font-extrabold text-charcoal-text">
                    {timeLimit > 0
                      ? `${timeLimit / 60} ${uiLanguage === "en" ? "minutes" : "menit"}`
                      : (uiLanguage === "en" ? "Unlimited" : "Tanpa Batas")}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 border-t border-parchment pt-3">
                <span className="text-[10px] font-mono font-black uppercase text-charcoal-text/50">
                  {uiLanguage === "en" ? "Banned Articles" : "Artikel yang Dilarang"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {bannedArticles.length === 0 ? (
                    <span className="text-xs text-charcoal-text/50 font-mono italic">
                      {uiLanguage === "en" ? "No banned articles." : "Tidak ada artikel yang dilarang."}
                    </span>
                  ) : (
                    bannedArticles.map((art, idx) => (
                      <span
                        key={idx}
                        className="bg-burnt-orange/15 text-burnt-orange border border-burnt-orange font-mono font-black px-2.5 py-0.5 rounded text-[11px] uppercase"
                      >
                        ⛔ {art}
                      </span>
                    ))
                  )}
                </div>
              </div>
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
                ready={p.ready}
                isMatchmaking={room.isMatchmaking}
                uiLanguage={uiLanguage}
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: MAX_PLAYERS - room.players.length }).map(
              (_, i) => (
                <EmptySlot key={`empty-${i}`} isMatchmaking={room.isMatchmaking} uiLanguage={uiLanguage} />
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
  ready,
  isMatchmaking,
  uiLanguage,
}: {
  username: string;
  isMe: boolean;
  isHost: boolean;
  elo?: number;
  ready?: boolean;
  isMatchmaking?: boolean;
  uiLanguage: "id" | "en";
}) {
  const color = avatarColor(username);

  let tierName = "";
  let tierColor = "";
  let tierBg = "";

  if (isMatchmaking && elo !== undefined) {
    if (elo < 1100) {
      tierName = uiLanguage === "en" ? "Novice" : "Pemula";
      tierColor = "#FF6B00";
      tierBg = "rgba(255, 107, 0, 0.1)";
    } else if (elo < 1300) {
      tierName = uiLanguage === "en" ? "Explorer" : "Penjelajah";
      tierColor = "#B2C73A";
      tierBg = "rgba(178, 199, 58, 0.1)";
    } else {
      tierName = uiLanguage === "en" ? "Speedrunner" : "Legenda";
      tierColor = "#D2FF00";
      tierBg = "rgba(210, 255, 0, 0.1)";
    }
  }

  return (
    <li
      className="flex items-center gap-3 p-3 text-charcoal-text border-2 border-charcoal-text bg-pure-white transition-all shadow-[2px_2px_0px_#000] hover:scale-[1.01]"
      style={{
        borderRadius: "var(--radius-input)",
        background: isMe
          ? "var(--color-light-beige)"
          : "var(--color-pure-white)",
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center font-extrabold uppercase text-pure-white border-2 border-charcoal-text shadow-[1px_1px_0px_#000]"
        style={{
          width: 38,
          height: 38,
          borderRadius: "8px",
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
          <Link
            href={`/profile/${username}`}
            target="_blank"
            className="truncate hover:underline hover:text-lime-deep transition-colors cursor-pointer"
          >
            {username}
          </Link>
          {isMe && (
            <span
              className="bg-lime-accent text-charcoal-text font-black text-[9px] px-1.5 py-0.5 rounded border border-charcoal-text shadow-[1px_1px_0px_#000] shrink-0"
              style={{
                letterSpacing: "0.4px",
              }}
            >
              {uiLanguage === "en" ? "YOU" : "KAMU"}
            </span>
          )}
        </div>
        <div
          className="flex flex-wrap items-center gap-1.5 text-charcoal-text/70"
          style={{ fontSize: "12px" }}
        >
          <span>{isHost ? "👑 Host" : (uiLanguage === "en" ? "Player" : "Pemain")}</span>
          
          {isMatchmaking && (
            <span 
              className={`font-black uppercase px-1.5 py-0.5 rounded text-[9px] border border-charcoal-text shadow-[1px_1px_0px_#000] ${
                ready 
                  ? "bg-lime-accent text-charcoal-text" 
                  : "bg-burnt-orange text-warm-cream"
              }`}
            >
              {ready 
                ? (uiLanguage === "en" ? "READY" : "SIAP") 
                : (uiLanguage === "en" ? "PREPARING" : "BERSIAP")}
            </span>
          )}

          {elo !== undefined && (
            <span className="font-bold text-charcoal-text bg-lime-accent/30 border border-charcoal-text/20 px-1.5 py-0.5 rounded ml-1" style={{ fontSize: "10px" }}>
              {elo} ELO
            </span>
          )}
          
          {tierName && (
            <span 
              className="font-bold px-1.5 py-0.5 rounded border border-current text-[9px]"
              style={{ color: tierColor, backgroundColor: tierBg, borderColor: tierColor }}
            >
              {tierName}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptySlot({ isMatchmaking, uiLanguage }: { isMatchmaking?: boolean; uiLanguage: "id" | "en" }) {
  const t = translations[uiLanguage];
  return (
    <li
      className="flex items-center gap-3 border-dashed bg-pure-white/40 p-3"
      style={{
        borderRadius: "var(--radius-input)",
        border: isMatchmaking ? "3px dashed var(--color-stone-gray)" : "2px dashed var(--color-stone-gray)",
        boxShadow: isMatchmaking ? "3px 3px 0px rgba(0,0,0,0.05)" : "none",
      }}
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
        className="text-charcoal-text/50 italic font-bold"
        style={{ fontSize: "14px" }}
      >
        {t.emptySlot}
      </span>
    </li>
  );
}

function VersusCard({
  player,
  isMe,
  uiLanguage,
}: {
  player: { username: string; elo?: number; ready?: boolean; isBot?: boolean };
  isMe: boolean;
  uiLanguage: "id" | "en";
}) {
  const color = avatarColor(player.username);
  const elo = player.elo ?? 1200;

  let tierName = "";
  let tierColor = "";
  let tierBg = "";

  if (elo < 1100) {
    tierName = uiLanguage === "en" ? "Novice" : "Pemula";
    tierColor = "#FF6B00";
    tierBg = "rgba(255, 107, 0, 0.1)";
  } else if (elo < 1300) {
    tierName = uiLanguage === "en" ? "Explorer" : "Penjelajah";
    tierColor = "#B2C73A";
    tierBg = "rgba(178, 199, 58, 0.1)";
  } else {
    tierName = uiLanguage === "en" ? "Speedrunner" : "Legenda";
    tierColor = "#D2FF00";
    tierBg = "rgba(210, 255, 0, 0.1)";
  }

  return (
    <Link
      href={`/profile/${player.username}`}
      target="_blank"
      className="w-full flex items-center gap-3 p-3 bg-charcoal-deep border-2 border-charcoal-text transition-all duration-300 hover:scale-[1.015] hover:border-lime-accent/50 cursor-pointer text-warm-cream"
      style={{
        borderRadius: "var(--radius-input)",
        boxShadow: player.ready ? `0 0 12px ${tierColor}40, 4px 4px 0px #000` : "4px 4px 0px #000",
        borderColor: player.ready ? tierColor : undefined,
      }}
    >
      {/* Avatar */}
      <span
        className="flex shrink-0 items-center justify-center font-black uppercase text-pure-white text-base border-2 border-charcoal-text shadow-[2px_2px_0px_#000]"
        style={{
          width: 38,
          height: 38,
          borderRadius: "8px",
          background: color,
        }}
      >
        {initials(player.username)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-extrabold text-warm-cream text-sm">
          <span className="truncate">{player.username}</span>
          {isMe && (
            <span className="bg-lime-accent text-charcoal-text font-black text-[9px] px-1.5 py-0.5 rounded border border-charcoal-text shadow-[1px_1px_0px_#000] shrink-0 font-mono">
              {uiLanguage === "en" ? "YOU" : "KAMU"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-0.5 font-mono">
          <span className="font-bold text-lime-accent text-[11px]">
            {elo} Elo
          </span>
          <span
            className="font-bold px-1 py-0.2 rounded text-[8px]"
            style={{ color: tierColor, backgroundColor: tierBg, border: `1px solid ${tierColor}` }}
          >
            {tierName}
          </span>
        </div>
      </div>

      {/* Ready status */}
      <span
        className={`shrink-0 font-mono font-black uppercase px-2 py-0.5 rounded text-[9px] border border-charcoal-text shadow-[1px_1px_0px_#000] ${
          player.ready
            ? "bg-lime-accent text-charcoal-text"
            : "bg-burnt-orange text-warm-cream"
        }`}
      >
        {player.ready
          ? (uiLanguage === "en" ? "Ready" : "Siap")
          : (uiLanguage === "en" ? "Not ready" : "Belum siap")}
      </span>
    </Link>
  );
}

function VersusEmptyCard({ uiLanguage }: { uiLanguage: "id" | "en" }) {
  return (
    <div
      className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-warm-cream/15 bg-charcoal-deep"
      style={{
        borderRadius: "var(--radius-input)",
      }}
    >
      {/* Empty avatar */}
      <span
        className="flex shrink-0 items-center justify-center text-warm-cream/20 text-base border-2 border-dashed border-warm-cream/15"
        style={{
          width: 38,
          height: 38,
          borderRadius: "8px",
        }}
      >
        ?
      </span>

      <div className="min-w-0 flex-1">
        <span className="text-warm-cream/30 text-xs">
          {uiLanguage === "en" ? "Waiting for player..." : "Menunggu pemain..."}
        </span>
      </div>

      {/* Pulsing dot */}
      <span className="w-2 h-2 rounded-full bg-burnt-orange/60 animate-pulse shrink-0" />
    </div>
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
          className="text-charcoal-text/70 font-mono text-xs uppercase"
        >
          {empty}
        </p>
      );
    }
    return null;
  }
  return (
    <div className="flex flex-col gap-2 border-t border-warm-gray/30 pt-4 mt-2">
      <span className="text-[10px] font-mono font-black text-charcoal-text/50 uppercase tracking-widest">
        {t.preview} • TELEMETRY ROUTE
      </span>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-deep p-4 rounded-xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] text-warm-cream">
        {/* Start */}
        <div className="flex-1 min-w-0">
          <span className="bg-lime-accent text-charcoal-text text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
            START
          </span>
          <p className="font-extrabold text-sm truncate mt-1.5 text-warm-cream">
            {start.replace(/_/g, ' ')}
          </p>
        </div>
        {/* Arrow */}
        <span className="text-lime-accent font-black text-lg self-center rotate-90 sm:rotate-0">➔</span>
        {/* Goal */}
        <div className="flex-1 min-w-0 text-right sm:text-right">
          <span className="bg-burnt-orange text-warm-cream text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
            GOAL
          </span>
          <p className="font-extrabold text-sm truncate mt-1.5 text-lime-accent">
            {end.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
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
