"use client";

import type Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";

import type { EmojiReaction } from "@/lib/types";
import { ALLOWED_EMOJIS } from "@/lib/room";

interface EmojiReactionsProps {
  roomId: string;
  currentClientId: string;
  ablyChannel: Ably.RealtimeChannel;
  isChatExpanded: boolean;
}

/** Cooldown antar kirim emoji (ms). */
const REACT_COOLDOWN_MS = 500;
/** Maks floating emoji sekaligus. */
const MAX_FLOATING = 15;
/** Durasi animasi floating (ms) — harus match CSS keyframes. */
const FLOAT_DURATION_MS = 2000;

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number; // 0..100 (percent)
}

export default function EmojiReactions({
  roomId,
  currentClientId,
  ablyChannel,
  isChatExpanded,
}: EmojiReactionsProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const cooldownRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  // Subscribe emoji_reaction dari Ably.
  useEffect(() => {
    function handleReaction(msg: Ably.Message) {
      const data = msg.data as EmojiReaction;
      if (!data?.emoji) return;

      const id = `${data.timestamp}-${data.clientId}-${Math.random().toString(36).slice(2, 6)}`;
      const x = 10 + Math.random() * 80; // 10%-90% dari lebar layar

      setFloating((prev) => {
        const next = [...prev, { id, emoji: data.emoji, x }];
        return next.length > MAX_FLOATING ? next.slice(-MAX_FLOATING) : next;
      });

      // Hapus setelah animasi selesai.
      setTimeout(() => {
        setFloating((prev) => prev.filter((e) => e.id !== id));
      }, FLOAT_DURATION_MS);
    }

    void ablyChannel.subscribe("emoji_reaction", handleReaction);
    return () => {
      ablyChannel.unsubscribe("emoji_reaction", handleReaction);
    };
  }, [ablyChannel]);

  // Kirim emoji.
  const handleReact = useCallback(
    async (emoji: string) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;

      // Optimistic: trigger local floating juga.
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const x = 10 + Math.random() * 80;
      setFloating((prev) => {
        const next = [...prev, { id, emoji, x }];
        return next.length > MAX_FLOATING ? next.slice(-MAX_FLOATING) : next;
      });
      setTimeout(() => {
        setFloating((prev) => prev.filter((e) => e.id !== id));
      }, FLOAT_DURATION_MS);

      try {
        await fetch("/api/room/react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, clientId: currentClientId, emoji }),
        });
      } catch {
        // ignore — ephemeral
      }

      setTimeout(() => {
        cooldownRef.current = false;
      }, REACT_COOLDOWN_MS);
    },
    [roomId, currentClientId],
  );

  return (
    <>
      {/* Floating emoji overlay */}
      {floating.length > 0 && (
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{ zIndex: 40 }}
          aria-hidden
        >
          {floating.map((item) => (
            <span
              key={item.id}
              className="emoji-float absolute"
              style={{
                left: `${item.x}%`,
                bottom: 60,
                fontSize: "clamp(28px, 6vw, 44px)",
              }}
            >
              {item.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Click outside backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-34"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Emoji trigger & dropdown container */}
      <div
        className={`${isChatExpanded ? "hidden sm:block" : "block"} fixed bottom-4 right-4 z-35`}
      >
        {/* Dropdown Menu (Muncul di atas tombol pemicu) */}
        {isOpen && (
          <div
            className="absolute bottom-10 right-0 z-35 flex items-center gap-1 bg-charcoal-text p-1 sm:p-1.5 mb-1.5 border border-warm-gray"
            style={{
              borderRadius: "var(--radius-pill)",
              boxShadow: "var(--shadow-floating)",
            }}
          >
            {ALLOWED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  void handleReact(emoji);
                  setIsOpen(false);
                }}
                className="chunky-press flex shrink-0 items-center justify-center transition hover:scale-115 w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base"
                style={{
                  borderRadius: "9999px",
                }}
                aria-label={`Kirim reaksi ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Trigger Button (Tombol smile untuk membuka/menutup) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="chunky-press flex shrink-0 items-center justify-center bg-charcoal-text text-warm-cream transition hover:bg-charcoal-deep w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base"
          style={{
            borderRadius: "9999px",
            boxShadow: "var(--shadow-floating)",
          }}
          aria-label="Buka Pilihan Reaksi"
        >
          {isOpen ? "✕" : "😀"}
        </button>
      </div>
    </>
  );
}
