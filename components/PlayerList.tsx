"use client";

import { useEffect, useState } from "react";

import type { Player } from "@/lib/types";

interface PlayerListProps {
  players: Player[];
  currentClientId: string;
  /** Map clientId -> timestamp ms saat terakhir kali pemain itu pindah artikel. */
  lastMoveAt: Record<string, number>;
  /** Sudah klik tombol surrender? Tombol jadi disabled + label berbeda. */
  hasSurrendered: boolean;
  onSurrender: () => void;
}

/**
 * Daftar pemain di sidebar gameplay + tombol Menyerah.
 * Komponen ini "dumb" — semua subscribe Ably ditangani oleh Game.tsx.
 */
export default function PlayerList({
  players,
  currentClientId,
  lastMoveAt,
  hasSurrendered,
  onSurrender,
}: PlayerListProps) {
  const surrenderedCount = players.filter(
    (p) => p.status === "surrendered",
  ).length;
  const totalActive = players.filter((p) => p.status !== "finished").length;

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h3
          className="font-extrabold text-charcoal-text"
          style={{
            fontSize: "var(--text-subheading)",
            lineHeight: "var(--leading-subheading)",
          }}
        >
          Pemain
        </h3>
        <p
          className="text-charcoal-text/60"
          style={{ fontSize: "14px" }}
        >
          {players.length} pemain di room ini
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {players.map((player) => (
          <PlayerCard
            key={player.clientId}
            player={player}
            isMe={player.clientId === currentClientId}
            lastMoveAt={lastMoveAt[player.clientId] ?? 0}
          />
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        {totalActive > 0 && surrenderedCount > 0 && (
          <p
            className="text-charcoal-text/70 text-center"
            style={{ fontSize: "14px" }}
          >
            {surrenderedCount} dari {players.length} pemain sudah menyerah
          </p>
        )}

        <button
          type="button"
          onClick={onSurrender}
          disabled={hasSurrendered}
          className="border-t-2 border-charcoal-text bg-pure-white text-charcoal-text transition active:translate-y-[1px] disabled:opacity-60 disabled:active:translate-y-0"
          style={{
            borderRadius: "var(--radius-button)",
            padding: "10px 20px 13px 20px",
            fontWeight: 700,
            fontSize: "var(--text-body)",
          }}
        >
          {hasSurrendered ? "Menunggu pemain lain menyerah…" : "Menyerah"}
        </button>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: Player;
  isMe: boolean;
  lastMoveAt: number;
}

function PlayerCard({ player, isMe, lastMoveAt }: PlayerCardProps) {
  // Indikator "baru saja pindah" — kuning sebentar setelah event player_moved.
  const justMoved = useJustMoved(lastMoveAt);

  const stepsCount = Math.max(0, player.route.length - 1);

  let badgeLabel: string | null = null;
  let badgeBg = "var(--color-paper-white)";
  if (player.status === "finished") {
    badgeLabel = "Menang";
    badgeBg = "var(--color-seafoam-teal)";
  } else if (player.status === "surrendered") {
    badgeLabel = "Menyerah";
    badgeBg = "var(--color-stone-gray)";
  } else if (justMoved) {
    badgeLabel = "Bergerak";
    badgeBg = "var(--color-playdate-yellow)";
  }

  return (
    <li
      className="border-t-2 border-charcoal-text bg-pure-white p-3 transition-colors"
      style={{
        borderRadius: "var(--radius-input)",
        // Kalau ini pemain saya, kasih background paper-white biar terbaca.
        background: isMe ? "var(--color-paper-white)" : "var(--color-pure-white)",
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 font-extrabold text-charcoal-text"
            style={{ fontSize: "var(--text-body)" }}
          >
            <span className="truncate">{player.username}</span>
            {isMe && (
              <span
                className="border-t-[1.5px] border-charcoal-text bg-playdate-yellow text-charcoal-text font-bold"
                style={{
                  fontSize: "11px",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-button)",
                  letterSpacing: "0.3px",
                }}
              >
                KAMU
              </span>
            )}
            {player.isHost && (
              <span
                className="text-charcoal-text/70 font-bold"
                style={{ fontSize: "11px", letterSpacing: "0.3px" }}
              >
                HOST
              </span>
            )}
          </div>
          <div
            className="truncate text-charcoal-text/80"
            style={{ fontSize: "14px" }}
            title={player.currentArticle}
          >
            {player.currentArticle || "—"}
          </div>
        </div>
        <div
          className="text-charcoal-text/80 font-bold tabular-nums"
          style={{ fontSize: "14px" }}
        >
          {stepsCount} klik
        </div>
      </div>

      {badgeLabel && (
        <div
          className="mt-2 inline-block border-t-[1.5px] border-charcoal-text font-bold text-charcoal-text"
          style={{
            background: badgeBg,
            padding: "2px 8px",
            borderRadius: "var(--radius-button)",
            fontSize: "12px",
            letterSpacing: "0.3px",
          }}
        >
          {badgeLabel}
        </div>
      )}
    </li>
  );
}

/**
 * Hook kecil: return true selama 1.2 detik setelah `lastMoveAt` berubah.
 * Dipakai untuk indikator "baru saja pindah".
 */
function useJustMoved(lastMoveAt: number): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!lastMoveAt) return;
    setActive(true);
    const id = window.setTimeout(() => setActive(false), 1200);
    return () => window.clearTimeout(id);
  }, [lastMoveAt]);

  return active;
}
