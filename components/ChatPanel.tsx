"use client";

import type Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";

import { avatarColor, initials } from "@/lib/avatar";
import type { ChatMessage, Room } from "@/lib/types";
import { MAX_CHAT_LENGTH } from "@/lib/room";

interface ChatPanelProps {
  room: Room;
  currentClientId: string;
  ablyChannel: Ably.RealtimeChannel;
  /** Lobby/results → "expanded", playing → "collapsed". */
  defaultMode: "expanded" | "collapsed";
}

/** Maks pesan di buffer lokal (ring buffer). */
const MAX_MESSAGES = 50;
/** Cooldown kirim pesan (ms). */
const SEND_COOLDOWN_MS = 1000;

export default function ChatPanel({
  room,
  currentClientId,
  ablyChannel,
  defaultMode,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(defaultMode === "expanded");
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sendCooldown, setSendCooldown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sinkronkan expanded state saat defaultMode berubah (phase switch).
  useEffect(() => {
    setIsExpanded(defaultMode === "expanded");
  }, [defaultMode]);

  // Subscribe chat_message dari Ably.
  useEffect(() => {
    function handleMessage(msg: Ably.Message) {
      const data = msg.data as ChatMessage;
      if (!data?.id) return;

      setMessages((prev) => {
        const next = [...prev, data];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });

      // Increment unread kalau panel collapsed.
      if (!isExpanded) {
        setUnreadCount((c) => c + 1);
      }
    }

    void ablyChannel.subscribe("chat_message", handleMessage);
    return () => {
      ablyChannel.unsubscribe("chat_message", handleMessage);
    };
  }, [ablyChannel, isExpanded]);

  // Auto-scroll ke bawah kalau user sudah di bawah.
  useEffect(() => {
    if (isExpanded && isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // Track apakah user scroll di bawah.
  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 40;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  // Toggle expand/collapse.
  function toggleExpand() {
    setIsExpanded((prev) => {
      if (!prev) {
        // Expanding → clear unread.
        setUnreadCount(0);
        // Auto-scroll ke bawah saat expand.
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
          inputRef.current?.focus();
        });
      }
      return !prev;
    });
  }

  // Kirim pesan.
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sendCooldown) return;

    setInputText("");
    setSendCooldown(true);

    try {
      await fetch("/api/room/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          clientId: currentClientId,
          text,
        }),
      });
    } catch {
      // ignore — pesan ephemeral, tidak kritis
    }

    setTimeout(() => setSendCooldown(false), SEND_COOLDOWN_MS);
  }, [inputText, sendCooldown, room.id, currentClientId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const canSend = inputText.trim().length > 0 && !sendCooldown;

  // ------- Collapsed mode -------
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={toggleExpand}
        className="chunky-press fixed bottom-4 left-4 z-35 flex items-center gap-2 bg-charcoal-text text-warm-cream"
        style={{
          borderRadius: "var(--radius-pill)",
          padding: "10px 18px",
          boxShadow: "var(--shadow-floating)",
          zIndex: 35,
          fontSize: "14px",
          fontWeight: 600,
        }}
        aria-label={`Buka obrolan${unreadCount > 0 ? `, ${unreadCount} pesan baru` : ""}`}
      >
        <span aria-hidden style={{ fontSize: 16 }}>
          💬
        </span>
        <span>Obrolan</span>
        {unreadCount > 0 && (
          <span
            className="bg-lime-accent text-charcoal-text inline-flex items-center justify-center font-extrabold"
            style={{
              borderRadius: "9999px",
              minWidth: 20,
              height: 20,
              padding: "0 6px",
              fontSize: "11px",
              marginLeft: 2,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // ------- Expanded mode -------
  return (
    <div
      className="fixed bottom-4 left-4 z-35 flex flex-col bg-pure-white"
      style={{
        width: "min(320px, calc(100vw - 32px))",
        maxHeight: "min(420px, calc(100vh - 100px))",
        borderRadius: "var(--radius-rounded)",
        boxShadow: "var(--shadow-floating)",
        border: "1px solid var(--color-warm-gray)",
        zIndex: 35,
      }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-warm-gray px-4 py-3"
        style={{ background: "var(--color-warm-cream)" }}
      >
        <span
          className="font-extrabold text-charcoal-text"
          style={{ fontSize: "14px" }}
        >
          💬 Obrolan
        </span>
        <button
          type="button"
          onClick={toggleExpand}
          className="text-charcoal-text/60 hover:text-charcoal-text transition"
          style={{ fontSize: 18, lineHeight: 1 }}
          aria-label="Tutup obrolan"
        >
          ✕
        </button>
      </div>

      {/* Message list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ minHeight: 120 }}
      >
        {messages.length === 0 ? (
          <p
            className="py-4 text-center italic text-charcoal-text/50"
            style={{ fontSize: "13px" }}
          >
            Belum ada pesan. Pesan bersifat sementara.
          </p>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isMe={msg.clientId === currentClientId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-warm-gray p-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHAT_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            maxLength={MAX_CHAT_LENGTH}
            className="flex-1 border-none bg-warm-cream text-charcoal-text outline-none"
            style={{
              borderRadius: "var(--radius-input)",
              padding: "8px 12px",
              fontSize: "14px",
              fontFamily: "var(--font-roobert)",
            }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="bg-lime-accent text-charcoal-text shrink-0 transition disabled:opacity-40"
            style={{
              borderRadius: "var(--radius-button)",
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: canSend ? "pointer" : "not-allowed",
            }}
          >
            Kirim
          </button>
        </div>
        {inputText.length > MAX_CHAT_LENGTH * 0.8 && (
          <p
            className="mt-1 text-right text-charcoal-text/50"
            style={{ fontSize: "11px" }}
          >
            {inputText.length}/{MAX_CHAT_LENGTH}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ChatBubble({
  message,
  isMe,
}: {
  message: ChatMessage;
  isMe: boolean;
}) {
  const color = avatarColor(message.username);

  return (
    <div
      className="mb-2 flex items-start gap-2"
      style={{
        flexDirection: isMe ? "row-reverse" : "row",
      }}
    >
      {/* Avatar */}
      <span
        className="flex shrink-0 items-center justify-center font-extrabold uppercase text-pure-white"
        style={{
          width: 28,
          height: 28,
          borderRadius: "9999px",
          background: color,
          fontSize: 10,
        }}
        aria-hidden
      >
        {initials(message.username)}
      </span>

      {/* Bubble */}
      <div
        className="min-w-0"
        style={{
          maxWidth: "75%",
        }}
      >
        <div
          className="font-bold text-charcoal-text"
          style={{
            fontSize: "11px",
            marginBottom: 2,
            textAlign: isMe ? "right" : "left",
          }}
        >
          {message.username}
        </div>
        <div
          className="bg-warm-cream text-charcoal-text"
          style={{
            borderRadius: "var(--radius-input)",
            padding: "6px 10px",
            fontSize: "14px",
            lineHeight: 1.4,
            wordBreak: "break-word",
            border: "1px solid var(--color-warm-gray)",
            textAlign: isMe ? "right" : "left",
          }}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
