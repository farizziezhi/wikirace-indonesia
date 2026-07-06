"use client";

import Ably from "ably";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ChatPanel from "@/components/ChatPanel";
import EmojiReactions from "@/components/EmojiReactions";
import Game from "@/components/Game";
import Lobby from "@/components/Lobby";
import Results from "@/components/Results";
import { getOrCreateClientId, getSavedUsername, getSavedLanguage, savePlayerToken, getPlayerToken, getSavedUiLanguage } from "@/lib/client-id";
import { unlockRaceAudio, playVictoryChime } from "@/lib/race-audio";
import { useUiLang } from "@/lib/use-ui-lang";
import type { Player, Room, RouteStep } from "@/lib/types";
import AdContainer from "@/components/AdContainer";

type GameState = "lobby" | "playing" | "finished";

interface FinishedSnapshot {
  allRoutes: Record<string, RouteStep[]>;
  winnerId: string | null;
}

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const { roomId } = use(params);
  const normalizedRoomId = roomId.toUpperCase();

  // ------- Identity -------
  const [identity, setIdentity] = useState<{
    clientId: string;
    username: string;
  } | null>(null);
  const uiLanguage = useUiLang();

  useEffect(() => {
    const id = window.setTimeout(() => {
      const clientId = getOrCreateClientId();
      const username = getSavedUsername();
      const uiLang = getSavedUiLanguage();
      if (!clientId || !username) {
        try {
          window.sessionStorage.setItem(
            "wikirace:toast",
            uiLang === "en" ? "Please enter your name before joining the room." : "Masukkan nama dulu sebelum gabung room.",
          );
        } catch {
          // ignore
        }
        router.replace(`/?room=${normalizedRoomId}`);
        return;
      }
      setIdentity({ clientId, username });
    }, 0);

    return () => window.clearTimeout(id);
  }, [router, normalizedRoomId]);

  // Silently auto-unlock audio on first click/touch inside the room
  useEffect(() => {
    function handleUnlock() {
      unlockRaceAudio();
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    }
    window.addEventListener("click", handleUnlock);
    window.addEventListener("touchstart", handleUnlock);
    return () => {
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    };
  }, []);

  // ------- Room state -------
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [clockOffset, setClockOffset] = useState<number>(0);
  const [finishedSnapshot, setFinishedSnapshot] =
    useState<FinishedSnapshot | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [prevGameState, setPrevGameState] = useState<GameState>("lobby");

  if (gameState !== prevGameState) {
    setPrevGameState(gameState);
    setIsChatExpanded(gameState !== "playing");
  }

  const roomRef = useRef<Room | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    if (gameState === "finished") {
      playVictoryChime();
    }
  }, [gameState]);

  // ------- Ably client + channel -------
  const [ablyChannel, setAblyChannel] =
    useState<Ably.RealtimeChannel | null>(null);
  const ablyClientRef = useRef<Ably.Realtime | null>(null);

  // Step 1: connect Ably + join room. Dilakukan sekali per identity.
  useEffect(() => {
    if (!identity) return;

    let cancelled = false;

    const client = new Ably.Realtime({
      authUrl: `/api/ably-auth?clientId=${encodeURIComponent(identity.clientId)}`,
      clientId: identity.clientId,
      transportParams: { remainPresentFor: 15000 },
    });
    ablyClientRef.current = client;

    const channel = client.channels.get(`room:${normalizedRoomId}`);

    async function setup() {
      let initialRoom: Room | undefined = undefined;
      // 1) Join room (idempotent — server kita allow reconnect via clientId).
      try {
        const res = await fetch("/api/room/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: normalizedRoomId,
            username: identity!.username,
            clientId: identity!.clientId,
          }),
        });
        const data: { room?: Room; serverTime?: number; error?: string; playerToken?: string } = await res
          .json()
          .catch(() => ({}));

        const uiLang = getSavedUiLanguage();
        if (!res.ok || !data.room) {
          if (cancelled) return;
          try {
            window.sessionStorage.setItem(
              "wikirace:toast",
              data.error ?? (uiLang === "en" ? "Failed to join room." : "Tidak bisa bergabung ke room."),
            );
          } catch {
            // ignore
          }
          router.replace(`/?room=${normalizedRoomId}`);
          return;
        }

        if (cancelled) return;

        if (data.playerToken) {
          savePlayerToken(normalizedRoomId, data.playerToken);
        }

        initialRoom = data.room;
        setRoom(initialRoom);
        setGameState(initialRoom.status);
        if (data.serverTime) {
          setClockOffset(data.serverTime - Date.now());
        }
        if (initialRoom.status === "playing" && initialRoom.startTime) {
          setStartTime(initialRoom.startTime);
        }
      } catch {
        if (!cancelled) {
          const uiLang = getSavedUiLanguage();
          setFatalError(uiLang === "en" ? "Cannot connect to the server. Check your connection." : "Tidak bisa terhubung ke server. Periksa koneksi.");
        }
        return;
      }

      // 2) Attach + presence enter.
      try {
        await channel.attach();
        await channel.presence.enter({ username: identity!.username });

        // Bersihkan pemain/host yang offline saat masuk lobby
        if (initialRoom && initialRoom.status === "lobby") {
          const members = await channel.presence.get();
          const presentClientIds = new Set(members.map((m) => m.clientId));

          if (!presentClientIds.has(initialRoom.hostClientId)) {
            void fetch("/api/room/leave", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomId: normalizedRoomId,
                clientId: initialRoom.hostClientId,
              }),
            }).catch(() => {});
          }

          if (initialRoom.isMatchmaking) {
            for (const p of initialRoom.players) {
              if (p.clientId !== identity!.clientId && !presentClientIds.has(p.clientId)) {
                void fetch("/api/room/leave", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    roomId: normalizedRoomId,
                    clientId: p.clientId,
                  }),
                }).catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        console.warn("[room] gagal attach/presence/get:", err);
        // Tetap lanjut — message-based events bisa tetap jalan tanpa presence.
      }

      if (cancelled) return;
      setAblyChannel(channel);
    }

    void setup();

    return () => {
      cancelled = true;
      // Detach + close di cleanup. presence leave akan auto-fire saat detach.
      void channel.detach().catch(() => {
        /* ignore */
      });
      client.close();
      if (ablyClientRef.current === client) ablyClientRef.current = null;
    };
  }, [identity, normalizedRoomId, router]);

  // Step 2: subscribe game events di channel — terpisah dari setup
  // supaya tidak re-subscribe saat re-render.
  useEffect(() => {
    if (!ablyChannel) return;

    function handleRoomUpdated(message: Ably.Message) {
      const data = message.data as { room?: Room };
      if (data?.room) {
        setRoom(data.room);
        // Sinkronkan gameState kalau status di room berubah lewat event ini.
        if (data.room.status === "lobby") setGameState("lobby");
        if (data.room.status === "playing") setGameState("playing");
      }
    }

    function handleGameStarted(message: Ably.Message) {
      const data = message.data as {
        startArticle: string;
        endArticle: string;
        startTime: number;
        players?: Player[];
        checkpoints?: string[];
      };
      setStartTime(data.startTime);
      setGameState("playing");
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              status: "playing",
              startArticle: data.startArticle,
              endArticle: data.endArticle,
              startTime: data.startTime,
              checkpoints: data.checkpoints ?? prev.checkpoints,
              players: data.players ?? prev.players.map((p) => ({
                ...p,
                status: "playing",
                currentArticle: data.startArticle,
                route: [{ article: data.startArticle, timestamp: 0 }],
                finishedAt: undefined,
              })),
            }
          : prev,
      );
    }

    function handlePlayerMoved(message: Ably.Message) {
      const data = message.data as {
        clientId: string;
        article: string;
        route: RouteStep[];
        status?: Player["status"];
      };
      if (!data?.clientId) return;
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              players: prev.players.map((p) =>
                p.clientId === data.clientId
                  ? {
                      ...p,
                      currentArticle: data.article,
                      route: data.route ?? p.route,
                      status: data.status ?? p.status,
                    }
                  : p,
              ),
            }
          : prev,
      );
    }

    function buildAllRoutesRecord(
      arr: Array<{ clientId: string; route: RouteStep[] }> | undefined,
    ): Record<string, RouteStep[]> {
      const out: Record<string, RouteStep[]> = {};
      if (!arr) return out;
      for (const entry of arr) {
        if (entry?.clientId) {
          out[entry.clientId] = entry.route ?? [];
        }
      }
      return out;
    }

    function handleGameWon(message: Ably.Message) {
      const data = message.data as {
        winnerId: string;
        allRoutes?: Array<{
          clientId: string;
          username: string;
          status: Player["status"];
          route: RouteStep[];
          finishedAt?: number;
          eloChange?: number;
          newElo?: number;
        }>;
      };
      const allRoutes = buildAllRoutesRecord(data.allRoutes);
      setFinishedSnapshot({ winnerId: data.winnerId ?? null, allRoutes });

      // Update player statuses + finishedAt sesuai snapshot.
      setRoom((prev) => {
        if (!prev) return prev;
        const updatedPlayers = prev.players.map((p) => {
          const snap = data.allRoutes?.find(
            (r) => r.clientId === p.clientId,
          );
          if (!snap) return p;
          return {
            ...p,
            status: snap.status ?? p.status,
            route: snap.route ?? p.route,
            finishedAt: snap.finishedAt ?? p.finishedAt,
            elo: snap.newElo !== undefined ? snap.newElo : p.elo,
            eloChange: snap.eloChange !== undefined ? snap.eloChange : p.eloChange,
          };
        });
        return { ...prev, status: "finished", players: updatedPlayers };
      });
      setGameState("finished");
    }

    function handleGameSurrendered(message: Ably.Message) {
      const data = message.data as {
        allRoutes?: Array<{
          clientId: string;
          username: string;
          status: Player["status"];
          route: RouteStep[];
          finishedAt?: number;
          eloChange?: number;
          newElo?: number;
        }>;
      };
      const allRoutes = buildAllRoutesRecord(data.allRoutes);
      setFinishedSnapshot({ winnerId: null, allRoutes });
      setRoom((prev) => {
        if (!prev) return prev;
        const updatedPlayers = prev.players.map((p) => {
          const snap = data.allRoutes?.find(
            (r) => r.clientId === p.clientId,
          );
          if (!snap) return p;
          return {
            ...p,
            status: snap.status ?? p.status,
            route: snap.route ?? p.route,
            elo: snap.newElo !== undefined ? snap.newElo : p.elo,
            eloChange: snap.eloChange !== undefined ? snap.eloChange : p.eloChange,
          };
        });
        return { ...prev, status: "finished", players: updatedPlayers };
      });
      setGameState("finished");
    }

    function handleGameCancelled(message: Ably.Message) {
      const data = (message.data as { reason?: string }) ?? {};
      const uiLang = getSavedUiLanguage();
      const text =
        data.reason === "host_left"
          ? (uiLang === "en" ? "Host left, game cancelled." : "Host keluar, game dibatalkan.")
          : (uiLang === "en" ? "Game cancelled." : "Game dibatalkan.");
      try {
        window.sessionStorage.setItem("wikirace:toast", text);
      } catch {
        // ignore
      }
      router.replace("/");
    }

    function handleRoomReset(message: Ably.Message) {
      const data = message.data as { room?: Room };
      if (data?.room) {
        setRoom(data.room);
        setGameState("lobby");
        setStartTime(null);
        setFinishedSnapshot(null);
      }
    }

    void ablyChannel.subscribe("room_updated", handleRoomUpdated);
    void ablyChannel.subscribe("game_started", handleGameStarted);
    void ablyChannel.subscribe("player_moved", handlePlayerMoved);
    void ablyChannel.subscribe("game_won", handleGameWon);
    void ablyChannel.subscribe("game_surrendered", handleGameSurrendered);
    void ablyChannel.subscribe("game_cancelled", handleGameCancelled);
    void ablyChannel.subscribe("room_reset", handleRoomReset);

    return () => {
      ablyChannel.unsubscribe("room_updated", handleRoomUpdated);
      ablyChannel.unsubscribe("game_started", handleGameStarted);
      ablyChannel.unsubscribe("player_moved", handlePlayerMoved);
      ablyChannel.unsubscribe("game_won", handleGameWon);
      ablyChannel.unsubscribe("game_surrendered", handleGameSurrendered);
      ablyChannel.unsubscribe("game_cancelled", handleGameCancelled);
      ablyChannel.unsubscribe("room_reset", handleRoomReset);
    };
  }, [ablyChannel, router]);

  // Step 3: presence — kalau host leave, panggil API leave atas nama host untuk memicu transfer host atau penghapusan room.
  useEffect(() => {
    if (!ablyChannel) return;

    function handlePresenceLeave(member: Ably.PresenceMessage) {
      const currentRoom = roomRef.current;
      if (!currentRoom || !ablyChannel) return;

      const activeChannel = ablyChannel;
      const isHost = member.clientId === currentRoom.hostClientId;
      const isMatchmaking = !!currentRoom.isMatchmaking;

      if (isMatchmaking) {
        // Grace period 8 detik untuk mencegah kick langsung saat refresh / putus koneksi sesaat
        setTimeout(async () => {
          try {
            const members = await activeChannel.presence.get();
            const isBack = members.some((m) => m.clientId === member.clientId);
            if (isBack) return; // Pemain sudah kembali, batalkan leave

            void fetch("/api/room/leave", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomId: normalizedRoomId,
                clientId: member.clientId,
              }),
            });
          } catch {
            // ignore
          }
        }, 8000);
      } else if (isHost) {
        // Room kustom: langsung kick jika host keluar
        void fetch("/api/room/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: normalizedRoomId,
            clientId: member.clientId,
          }),
        }).catch(() => {
          // ignore
        });
      }
    }

    void ablyChannel.presence.subscribe("leave", handlePresenceLeave);

    return () => {
      ablyChannel.presence.unsubscribe("leave", handlePresenceLeave);
    };
  }, [ablyChannel, normalizedRoomId]);

  // Step 4: beforeunload → konfirmasi jika game aktif + sendBeacon ke /api/room/leave (best-effort).
  useEffect(() => {
    if (!identity) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      const currentRoom = roomRef.current;
      if (!currentRoom) return;

      // Jika game sedang aktif, tampilkan dialog konfirmasi keluar halaman
      if (currentRoom.status === "playing" && currentRoom.isMatchmaking) {
        e.preventDefault();
        e.returnValue = ""; // Pemicu dialog konfirmasi browser
      }

      // Hanya kirim leave beacon jika di lobby
      if (currentRoom.status === "lobby") {
        const isHost = identity!.clientId === currentRoom.hostClientId;
        if (isHost) return;

        try {
          const payload = JSON.stringify({
            roomId: normalizedRoomId,
            clientId: identity!.clientId,
            playerToken: getPlayerToken(normalizedRoomId),
          });
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/room/leave", blob);
        } catch {
          // ignore — best effort
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [identity, normalizedRoomId]);

  // Callback untuk Results: setelah host call play-again, server akan publish
  // room_reset. Kita juga set state lokal langsung biar UX instant.
  function handlePlayAgain() {
    setGameState("lobby");
    setStartTime(null);
    setFinishedSnapshot(null);
  }

  // ------- Rendering -------
  const isLoading = !identity || !room || !ablyChannel;

  // Memo `me` (currently unused, but cheap to compute and keeps types tidy).
  useMemo(() => {
    if (!room || !identity) return null;
    return room.players.find((p) => p.clientId === identity.clientId) ?? null;
  }, [room, identity]);

  if (fatalError) {
    const translatedError = fatalError === "Tidak bisa terhubung ke server. Periksa koneksi."
      ? (uiLanguage === "en" ? "Cannot connect to the server. Check your connection." : "Tidak bisa terhubung ke server. Periksa koneksi.")
      : fatalError;
    return (
      <main className="dot-bg flex min-h-screen w-full flex-col items-center justify-center bg-warm-cream px-6 py-12">
        <div
          className="relative overflow-hidden p-6 bg-charcoal-deep text-warm-cream border-3 border-burnt-orange shadow-[6px_6px_0px_#000]"
          style={{
            borderRadius: "var(--radius-rounded)",
            maxWidth: 440,
            width: "100%",
            paddingTop: "24px"
          }}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <span className="text-4xl animate-pulse">⚠️</span>
            <span className="font-mono font-black text-xs text-burnt-orange uppercase tracking-widest">
              {uiLanguage === "en" ? "CONNECTION ERROR" : "KONEKSI GAGAL"}
            </span>
            <p className="font-bold text-sm leading-relaxed text-warm-cream/80">
              {translatedError}
            </p>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="chunky-press w-full bg-burnt-orange text-warm-cream font-mono font-black text-xs uppercase py-3 border-2 border-charcoal-text shadow-[3px_3px_0px_#000] rounded-xl hover:bg-[#d65a00]"
            >
              ← {uiLanguage === "en" ? "Abort & Exit" : "Batalkan & Kembali"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="dot-bg flex min-h-screen w-full flex-col items-center justify-center bg-warm-cream px-6 py-12">
        <div
          className="relative overflow-hidden p-6 bg-charcoal-deep text-warm-cream border-3 border-lime-accent shadow-[6px_6px_0px_#000] flex flex-col items-center justify-center gap-4"
          style={{
            borderRadius: "var(--radius-rounded)",
            maxWidth: 440,
            width: "100%",
            paddingTop: "24px"
          }}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div
              className="border-lime-accent border-t-transparent animate-spin rounded-full"
              style={{
                width: 32,
                height: 32,
                borderWidth: 4,
              }}
            />
            <span className="font-mono font-black text-xs text-lime-accent uppercase tracking-widest animate-pulse">
              {uiLanguage === "en" ? "CONNECTING..." : "MENGHUBUNGKAN..."}
            </span>
            <p className="text-xs text-warm-cream/50 uppercase font-mono font-semibold">
              {uiLanguage === "en"
                ? "Connecting to server..."
                : "Menghubungkan ke server..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const showChatAndEmoji = !(gameState === "playing" && room.gameMode === "competitive");

  return (
    <>
      {gameState === "playing" && startTime !== null ? (
        <Game
          room={room}
          currentClientId={identity.clientId}
          ablyChannel={ablyChannel}
          startTime={startTime}
          clockOffset={clockOffset}
        />
      ) : gameState === "finished" ? (
        <Results
          room={room}
          currentClientId={identity.clientId}
          allRoutes={finishedSnapshot?.allRoutes ?? {}}
          winnerId={finishedSnapshot?.winnerId ?? null}
          onPlayAgain={handlePlayAgain}
        />
      ) : (
        <Lobby
          room={room}
          currentClientId={identity.clientId}
          clockOffset={clockOffset}
          ablyChannel={ablyChannel}
        />
      )}
      {showChatAndEmoji && (
        <>
          <ChatPanel
            room={room}
            currentClientId={identity.clientId}
            ablyChannel={ablyChannel}
            isExpanded={isChatExpanded}
            onToggleExpand={() => setIsChatExpanded((prev) => !prev)}
          />
          <EmojiReactions
            roomId={normalizedRoomId}
            currentClientId={identity.clientId}
            ablyChannel={ablyChannel}
            isChatExpanded={isChatExpanded}
          />
        </>
      )}

      {/* Sticky Footer Ad Slot (Tersembunyi otomatis saat gameplay aktif) */}
      {gameState !== "playing" && (
        <AdContainer type="sticky-footer" />
      )}
    </>
  );
}
