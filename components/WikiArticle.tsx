"use client";

import { memo, useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";

import type { WikiLanguage } from "@/lib/types";
import { extractArticleTitle, fetchArticleHtml } from "@/lib/wikipedia";
import { translations } from "@/lib/translations";
import { playBannedBeep } from "@/lib/race-audio";

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
  activePowerUp?: "soft" | "medium" | "hard" | null;
  /** Dipanggil jika artikel yang di-fetch merupakan redirect dan menghasilkan judul canonical baru. */
  onRedirectResolved?: (resolvedTitle: string) => void;
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
  activePowerUp = null,
  onRedirectResolved,
}: WikiArticleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedArticle, setDisplayedArticle] = useState(currentArticle);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannedWarningTitle, setBannedWarningTitle] = useState<string | null>(null);
  const [hoverSummary, setHoverSummary] = useState<{
    x: number;
    y: number;
    text: string;
    loading: boolean;
  } | null>(null);

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
          // Sanitasi HTML dari Wikipedia untuk mencegah XSS.
          // DOMPurify mempertahankan <a>, <img>, <table>, dll.
          // tapi menghapus <script>, <iframe>, <object>, dan event handlers on*.
          const cleanHtml = DOMPurify.sanitize(result.html, {
            FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "button"],
            FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onsubmit", "onchange"],
          });
          setDisplayedArticle(result.title);
          setHtml(cleanHtml);
          setLoading(false);

          if (result.title !== currentArticle && onRedirectResolved) {
            onRedirectResolved(result.title);
          }
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
  }, [currentArticle, language, t, onRedirectResolved]);

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

  // Listen for link hover events when Link Preview power-up is active
  useEffect(() => {
    const node = containerRef.current;
    if (!node || activePowerUp !== "soft") {
      setHoverSummary(null);
      return;
    }

    let activeTimeout: number | null = null;

    function handleMouseOver(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      const articleTitle = extractArticleTitle(href, language);
      if (!articleTitle) return;

      // Clear any pending timeout
      if (activeTimeout !== null) {
        window.clearTimeout(activeTimeout);
      }

      const clientX = event.clientX;
      const clientY = event.clientY;

      setHoverSummary({
        x: clientX,
        y: clientY,
        text: "",
        loading: true,
      });

      // Debounce the Wikipedia fetch by 300ms to avoid unnecessary network queries
      activeTimeout = window.setTimeout(async () => {
        try {
          const wikiLang = language === "en" ? "en" : "id";
          const res = await fetch(
            `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
              articleTitle.replace(/\s+/g, "_")
            )}`
          );
          if (res.ok) {
            const data = await res.json();
            setHoverSummary((prev) => {
              if (!prev) return null; // already hovered out
              return {
                ...prev,
                text: data.extract ?? "",
                loading: false,
              };
            });
          } else {
            setHoverSummary(null);
          }
        } catch {
          setHoverSummary(null);
        }
      }, 300);
    }

    function handleMouseOut(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      if (activeTimeout !== null) {
        window.clearTimeout(activeTimeout);
        activeTimeout = null;
      }
      setHoverSummary(null);
    }

    node.addEventListener("mouseover", handleMouseOver);
    node.addEventListener("mouseout", handleMouseOut);

    return () => {
      if (activeTimeout !== null) {
        window.clearTimeout(activeTimeout);
      }
      node.removeEventListener("mouseover", handleMouseOver);
      node.removeEventListener("mouseout", handleMouseOut);
      setHoverSummary(null);
    };
  }, [activePowerUp, language]);

  // Background prefetching on link hover to speed up navigation
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let activePrefetchTimeout: number | null = null;
    let hoveredTitle: string | null = null;

    function handleMouseOver(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      const articleTitle = extractArticleTitle(href, language);
      if (!articleTitle) return;

      // Avoid prefetching if it's already hovered
      if (articleTitle === hoveredTitle) return;

      if (activePrefetchTimeout !== null) {
        window.clearTimeout(activePrefetchTimeout);
      }

      hoveredTitle = articleTitle;

      activePrefetchTimeout = window.setTimeout(() => {
        // Prefetch the article HTML in background. It will be cached inside articleCache
        void fetchArticleHtml(articleTitle, language).catch(() => {
          // ignore background errors
        });
      }, 150);
    }

    function handleMouseOut(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      if (activePrefetchTimeout !== null) {
        window.clearTimeout(activePrefetchTimeout);
        activePrefetchTimeout = null;
      }
      hoveredTitle = null;
    }

    node.addEventListener("mouseover", handleMouseOver);
    node.addEventListener("mouseout", handleMouseOut);

    return () => {
      if (activePrefetchTimeout !== null) {
        window.clearTimeout(activePrefetchTimeout);
      }
      node.removeEventListener("mouseover", handleMouseOver);
      node.removeEventListener("mouseout", handleMouseOut);
    };
  }, [language]);

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

      // Cek apakah artikel terlarang (Ban List) - dilewati jika ban Medium aktif
      const isBanned = activePowerUp !== "medium" && bannedArticles.some(
        (ban) => ban.toLowerCase().replace(/_/g, " ") === articleTitle.toLowerCase().replace(/_/g, " ")
      );
      if (isBanned) {
        setBannedWarningTitle(articleTitle);
        playBannedBeep();
        return;
      }

      onNavigate(articleTitle);
    }

    node.addEventListener("click", handleClick);
    return () => node.removeEventListener("click", handleClick);
  }, [onNavigate, language, bannedArticles, activePowerUp]);

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

      {hoverSummary && (
        <div
          className="fixed z-[100] max-w-[280px] p-3 chunky bg-playdate-yellow text-charcoal-text text-xs font-semibold pointer-events-none shadow-[4px_4px_0px_#000] border-2 border-charcoal-text"
          style={{
            left: Math.min(window.innerWidth - 300, hoverSummary.x + 12),
            top: Math.min(window.innerHeight - 150, hoverSummary.y + 12),
            borderRadius: "var(--radius-button)",
          }}
        >
          {hoverSummary.loading ? (
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-charcoal-text/60 animate-pulse">
              <span className="inline-block w-2.5 h-2.5 border-2 border-charcoal-text border-t-transparent animate-spin rounded-full" />
              <span>{uiLanguage === "en" ? "Loading preview..." : "Memuat pratinjau..."}</span>
            </div>
          ) : (
            <div className="leading-relaxed">
              {hoverSummary.text || (uiLanguage === "en" ? "No preview description available." : "Pratinjau tidak tersedia.")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(WikiArticle);
