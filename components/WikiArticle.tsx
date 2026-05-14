"use client";

import { useEffect, useRef, useState } from "react";

import { extractArticleTitle, fetchArticleHtml } from "@/lib/wikipedia";

interface WikiArticleProps {
  /** Judul artikel yang sedang ditampilkan ke pemain. */
  currentArticle: string;
  /** Judul artikel tujuan — ditampilkan sebagai badge konteks di header. */
  endArticle: string;
  /**
   * Dipanggil saat pemain klik link artikel valid di dalam konten.
   * Parent (Game.tsx) bertanggung jawab POST /api/room/navigate.
   */
  onNavigate: (article: string) => void;
}

/**
 * Render konten artikel Wikipedia ID + intercept klik tautan.
 * Hanya tautan ke artikel namespace utama yang ditindaklanjuti;
 * link non-artikel (Berkas:, Wikipedia:, dll) di-cancel saja.
 *
 * Tidak ada scroll internal — ukuran konten mengikuti page, biar parent
 * bisa atur sticky bar dan scroll natural pada level page.
 */
export default function WikiArticle({
  currentArticle,
  endArticle,
  onNavigate,
}: WikiArticleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch HTML artikel setiap kali currentArticle berubah.
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setHtml(null);

    fetchArticleHtml(currentArticle)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError("Artikel tidak bisa dimuat. Coba klik tautan lain.");
          setLoading(false);
          return;
        }
        setHtml(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Gagal terhubung ke Wikipedia. Periksa koneksi.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentArticle]);

  // Scroll ke top page setiap kali load artikel baru — supaya pemain mulai
  // membaca dari atas, dan sticky bar tetap terlihat tanpa lompatan.
  useEffect(() => {
    if (html) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [html]);

  // Intercept klik <a> di dalam konten.
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
      const articleTitle = extractArticleTitle(href);

      event.preventDefault();
      event.stopPropagation();

      if (!articleTitle) return; // bukan artikel valid → ignore
      onNavigate(articleTitle);
    }

    node.addEventListener("click", handleClick);
    return () => node.removeEventListener("click", handleClick);
  }, [onNavigate, html]);

  return (
    <div className="flex flex-col">
      {/* Header artikel saat ini */}
      <div
        className="border-b border-parchment px-5 py-4 sm:px-6"
        style={{
          borderRadius: "var(--radius-input) var(--radius-input) 0 0",
        }}
      >
        <div
          className="font-bold uppercase text-charcoal-text/60"
          style={{ fontSize: "11px", letterSpacing: "0.6px" }}
        >
          Sedang dibuka
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            className="break-words font-extrabold text-charcoal-text"
            style={{
              fontSize: "var(--text-heading)",
              lineHeight: "var(--leading-heading)",
            }}
          >
            {currentArticle}
          </h2>
          <div
            className="flex items-center gap-2 text-charcoal-text/70"
            style={{ fontSize: "13px" }}
          >
            <span>menuju</span>
            <span
              className="border-t-[1.5px] border-charcoal-text bg-playdate-yellow px-2 py-0.5 font-bold text-charcoal-text"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {endArticle}
            </span>
          </div>
        </div>
      </div>

      {/* Konten */}
      <div ref={containerRef} className="px-5 py-5 sm:px-6">
        {loading && (
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
              Memuat artikel…
            </span>
          </div>
        )}

        {error && !loading && (
          <div
            className="border-t-2 border-charcoal-text bg-charcoal-text text-pure-white"
            style={{
              borderRadius: "var(--radius-input)",
              padding: "12px 16px",
              fontSize: "var(--text-body)",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && html && (
          <div
            className="wiki-article"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
