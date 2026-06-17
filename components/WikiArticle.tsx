"use client";

import { memo, useEffect, useRef, useState } from "react";

import type { WikiLanguage } from "@/lib/types";
import { extractArticleTitle, fetchArticleHtml } from "@/lib/wikipedia";
import { translations } from "@/lib/translations";

interface WikiArticleProps {
  /** Judul artikel yang sedang ditampilkan ke pemain. */
  currentArticle: string;
  /** Judul artikel tujuan — ditampilkan sebagai badge konteks di header. */
  endArticle: string;
  /** Bahasa Wikipedia (id / en). */
  language: WikiLanguage;
  /**
   * Dipanggil saat pemain klik link artikel valid di dalam konten.
   * Parent (Game.tsx) bertanggung jawab POST /api/room/navigate.
   */
  onNavigate: (article: string) => void;
  uiLanguage: "id" | "en";
  bannedArticles?: string[];
}

/**
 * Render konten artikel Wikipedia ID + intercept klik tautan.
 *
 * UX:
 * - First load: spinner besar (belum ada konten apa pun).
 * - Navigasi ke artikel berikutnya: konten lama tetap terlihat (sedikit
 *   redup), progress bar tipis berjalan di atas → menghindari "blink".
 * - Setelah HTML baru tiba, swap konten dan scroll page ke atas.
 */
function WikiArticle({
  currentArticle,
  endArticle,
  language,
  onNavigate,
  uiLanguage,
  bannedArticles = [],
}: WikiArticleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedArticle, setDisplayedArticle] = useState(currentArticle);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannedWarningTitle, setBannedWarningTitle] = useState<string | null>(null);

  const t = translations[uiLanguage];

  // Fetch HTML artikel setiap kali currentArticle / language berubah.
  useEffect(() => {
    let cancelled = false;

    const id = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      fetchArticleHtml(currentArticle, language)
        .then((result) => {
          if (cancelled) return;
          if (!result) {
            setError(t.loadError);
            setLoading(false);
            return;
          }
          setDisplayedArticle(currentArticle);
          setHtml(result);
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setError(t.networkError);
          setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [currentArticle, language, t]);

  // Scroll ke atas page setiap kali konten artikel benar-benar diganti.
  useEffect(() => {
    if (html) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [html]);

  // Clear warning setelah 3 detik
  useEffect(() => {
    if (!bannedWarningTitle) return;
    const timer = window.setTimeout(() => {
      setBannedWarningTitle(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [bannedWarningTitle]);

  // Intercept klik <a> di dalam konten — listener satu kali pada container.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      // Modifier click → tetap dicancel supaya tidak bisa keluar app.
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const href = anchor.getAttribute("href") ?? "";
      const articleTitle = extractArticleTitle(href, language);

      event.preventDefault();
      event.stopPropagation();

      if (!articleTitle) return; // bukan artikel valid → ignore

      // Cek apakah artikel terlarang (Ban List)
      const isBanned = bannedArticles.some(
        (ban) => ban.toLowerCase().replace(/_/g, " ") === articleTitle.toLowerCase().replace(/_/g, " ")
      );
      if (isBanned) {
        setBannedWarningTitle(articleTitle);
        return;
      }

      onNavigate(articleTitle);
    }

    node.addEventListener("click", handleClick);
    return () => node.removeEventListener("click", handleClick);
  }, [onNavigate, language, bannedArticles]);

  // Saat first load (belum ada konten apa pun), tampilkan spinner besar.
  const isFirstLoad = loading && html === null && error === null;

  return (
    <div className="relative flex flex-col">
      {bannedWarningTitle && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-charcoal-text/70 p-6 animate-pulse"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <div
            className="chunky bg-burnt-orange p-6 text-warm-cream max-w-sm w-full text-center border-4 border-charcoal-text shadow-[6px_6px_0px_#000]"
            style={{ borderRadius: "var(--radius-input)" }}
          >
            <div className="text-4xl mb-2" aria-hidden>⚠️</div>
            <h3 className="font-black text-lg uppercase tracking-wider text-playdate-yellow">
              {uiLanguage === "en" ? "BANNED ARTICLE!" : "ARTIKEL DI-BAN!"}
            </h3>
            <p className="text-sm font-extrabold mt-2 leading-relaxed">
              {uiLanguage === "en"
                ? `"${bannedWarningTitle}" is forbidden in this room!`
                : `"${bannedWarningTitle}" dilarang di room ini!`}
            </p>
          </div>
        </div>
      )}
      {/* Progress bar tipis saat fetching artikel baru (bukan first load). */}
      {loading && !isFirstLoad && (
        <div
          className="absolute left-0 right-0 top-0 z-10 overflow-hidden"
          style={{
            height: 3,
            borderTopLeftRadius: "var(--radius-input)",
            borderTopRightRadius: "var(--radius-input)",
          }}
          aria-hidden
        >
          <div className="wiki-progress-bar h-full" />
        </div>
      )}

      {/* Header artikel saat ini */}
      <div
        className="border-b border-warm-gray px-5 py-4 sm:px-6"
        style={{
          borderRadius: "var(--radius-input) var(--radius-input) 0 0",
        }}
      >
        <div
          className="font-bold uppercase text-charcoal-text/60"
          style={{ fontSize: "11px", letterSpacing: "0.6px" }}
        >
          {t.currentlyOpen}
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            className="break-words font-extrabold text-charcoal-text"
            style={{
              fontSize: "var(--text-heading)",
              lineHeight: "var(--leading-heading)",
            }}
          >
            {displayedArticle}
          </h2>
          <div
            className="flex items-center gap-2 text-charcoal-text/70"
            style={{ fontSize: "13px" }}
          >
            <span>{t.towards}</span>
            <span
              className="bg-lime-accent px-2 py-0.5 font-bold text-charcoal-text"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {endArticle}
            </span>
          </div>
        </div>
      </div>

      {/* Konten — selalu di-mount; ref tetap stabil untuk listener klik. */}
      <div
        ref={containerRef}
        className="px-5 py-5 sm:px-6"
      >
        {isFirstLoad && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-charcoal-text/70">
            <div
              className="border-charcoal-text border-t-transparent animate-spin"
              style={{
                width: 36,
                height: 36,
                borderWidth: 4,
                borderRadius: "9999px",
              }}
            />
            <span style={{ fontSize: "var(--text-body)" }}>
              {t.loadingArticle}
            </span>
          </div>
        )}

        {error && (
          <div
            className="bg-charcoal-text text-warm-cream"
            style={{
              borderRadius: "var(--radius-input)",
              padding: "12px 16px",
              fontSize: "var(--text-body)",
            }}
          >
            {error}
          </div>
        )}

        {!isFirstLoad && !error && html && (
          <div className="overflow-x-auto">
            <div
              className="wiki-article"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(WikiArticle);
