"use client";

import Ably from "ably";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ChatPanel from "@/components/ChatPanel";
import EmojiReactions from "@/components/EmojiReactions";
import Game from "@/components/Game";
import Lobby from "@/components/Lobby";
import Results from "@/components/Results";
import { getOrCreateClientId, getSavedUsername, getSavedLanguage } from "@/lib/client-id";
import { unlockRaceAudio } from "@/lib/race-audio";
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
  const [language, setLanguage] = useState<"id" | "en">("id");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const clientId = getOrCreateClientId();
      const username = getSavedUsername();
      const lang = getSavedLanguage();
      setLanguage(lang);
      if (!clientId || !username) {
        try {
          window.sessionStorage.setItem(
            "wikirace:toast",
            lang === "en" ? "Please enter your name before joining the room." : "Masukkan nama dulu sebelum gabung room.",
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
        const data: { room?: Room; serverTime?: number; error?: string } = await res
          .json()
          .catch(() => ({}));

        if (!res.ok || !data.room) {
          if (cancelled) return;
          try {
            window.sessionStorage.setItem(
              "wikirace:toast",
              data.error ?? "Tidak bisa bergabung ke room.",
            );
          } catch {
            // ignore
          }
          router.replace(`/?room=${normalizedRoomId}`);
          return;
        }

        if (cancelled) return;

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
          setFatalError("Tidak bisa terhubung ke server. Periksa koneksi.");
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
              players: prev.players.map((p) => ({
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
      const text =
        data.reason === "host_left"
          ? "Host keluar, game dibatalkan."
          : "Game dibatalkan.";
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
      if (!currentRoom) return;

      const isHost = member.clientId === currentRoom.hostClientId;
      const isMatchmakingLobby = !!currentRoom.isMatchmaking && currentRoom.status === "lobby";

      if (isHost || isMatchmakingLobby) {
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

  // Step 4: beforeunload → sendBeacon ke /api/room/leave (best-effort).
  useEffect(() => {
    if (!identity || !room) return;

    // Host jangan send leave beacon biar kalau refresh room tidak hancur.
    const isHost = identity.clientId === room.hostClientId;
    if (isHost) return;

    // Hanya kirim leave beacon kalau masih di lobby.
    // Kalau sudah main, refresh harus tetap diizinkan tanpa terkeluar.
    if (room.status !== "lobby") return;

    function handleBeforeUnload() {
      try {
        const payload = JSON.stringify({
          roomId: normalizedRoomId,
          clientId: identity!.clientId,
        });
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/room/leave", blob);
      } catch {
        // ignore — best effort
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [identity, normalizedRoomId, room]);

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
      ? (language === "en" ? "Cannot connect to the server. Check your connection." : "Tidak bisa terhubung ke server. Periksa koneksi.")
      : fatalError;
    return (
      <main className="dot-bg flex flex-1 items-center justify-center bg-playdate-yellow px-6 py-12">
        <div
          className="chunky-lg bg-pure-white p-6 text-charcoal-text"
          style={{
            borderRadius: "var(--radius-input)",
            maxWidth: 420,
            width: "100%",
          }}
        >
          <p style={{ fontSize: "var(--text-body)" }}>{translatedError}</p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="btn-yellow mt-4"
          >
            {language === "en" ? "Back to Homepage" : "Kembali ke Beranda"}
          </button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="dot-bg flex flex-1 items-center justify-center bg-playdate-yellow px-6 py-12">
        <div
          className="chunky flex items-center gap-3 bg-pure-white px-5 py-4 text-charcoal-text"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <div
            className="border-charcoal-text border-t-transparent animate-spin"
            style={{
              width: 20,
              height: 20,
              borderWidth: 3,
              borderRadius: "9999px",
            }}
          />
          <span style={{ fontSize: "var(--text-body)" }}>
            {language === "en"
              ? `Connecting to room ${normalizedRoomId}…`
              : `Menghubungkan ke room ${normalizedRoomId}…`}
          </span>
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
          language={language}
        />
      ) : gameState === "finished" ? (
        <Results
          room={room}
          currentClientId={identity.clientId}
          allRoutes={finishedSnapshot?.allRoutes ?? {}}
          winnerId={finishedSnapshot?.winnerId ?? null}
          onPlayAgain={handlePlayAgain}
          language={language}
        />
      ) : (
        <Lobby
          room={room}
          currentClientId={identity.clientId}
          clockOffset={clockOffset}
          language={language}
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
            language={language}
          />
          <EmojiReactions
            roomId={normalizedRoomId}
            currentClientId={identity.clientId}
            ablyChannel={ablyChannel}
            isChatExpanded={isChatExpanded}
            language={language}
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
