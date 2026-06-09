/**
 * Helper Wikipedia API.
 * Mendukung dua bahasa: Bahasa Indonesia (`id`) dan English (`en`).
 */

import type { WikiLanguage } from "./types";

/** Pemain default kalau belum di-set. */
export const DEFAULT_LANGUAGE: WikiLanguage = "id";

/** Daftar bahasa yang didukung beserta metadata UI. */
export const LANGUAGE_OPTIONS: Array<{
  value: WikiLanguage;
  label: string;
  flag: string;
  baseUrl: string;
}> = [
  {
    value: "id",
    label: "Bahasa Indonesia",
    flag: "🇮🇩",
    baseUrl: "https://id.wikipedia.org",
  },
  {
    value: "en",
    label: "English",
    flag: "🇬🇧",
    baseUrl: "https://en.wikipedia.org",
  },
];

const LANG_BY_VALUE = new Map<WikiLanguage, (typeof LANGUAGE_OPTIONS)[number]>(
  LANGUAGE_OPTIONS.map((o) => [o.value, o]),
);

/** Resolve bahasa → base URL Wikipedia (fallback ke id). */
function getLangConfig(lang: WikiLanguage | undefined) {
  return (
    (lang && LANG_BY_VALUE.get(lang)) ??
    LANG_BY_VALUE.get(DEFAULT_LANGUAGE)!
  );
}

/**
 * Daftar prefix namespace yang BUKAN artikel utama, baik untuk
 * Wikipedia ID maupun EN. Setiap link dengan prefix ini akan
 * diabaikan saat intercept klik.
 */
const NON_ARTICLE_PREFIXES = [
  // EN
  "Wikipedia:",
  "File:",
  "Category:",
  "Help:",
  "Template:",
  "Talk:",
  "User_talk:",
  "User:",
  "Special:",
  "Portal:",
  "Module:",
  "MediaWiki:",
  "Book:",
  "Draft:",
  "TimedText:",
  // ID
  "Berkas:",
  "Kategori:",
  "Bantuan:",
  "Templat:",
  "Pembicaraan:",
  "Pembicaraan_Wikipedia:",
  "Pembicaraan_Pengguna:",
  "Pembicaraan_Berkas:",
  "Pembicaraan_Templat:",
  "Pembicaraan_Kategori:",
  "Pengguna:",
  "Istimewa:",
  "Modul:",
];

/**
 * Client-side LRU cache untuk HTML artikel Wikipedia.
 * Max 30 entries. Map iterates in insertion order → delete oldest = delete first.
 */
const ARTICLE_CACHE_MAX = 30;
const articleCache = new Map<string, Promise<string | null>>();

/**
 * Ambil HTML konten artikel Wikipedia untuk judul tertentu.
 * Return null kalau artikel tidak ada / fetch gagal.
 * Hasil di-cache secara client-side supaya navigasi ulang instan.
 */
export async function fetchArticleHtml(
  title: string,
  lang: WikiLanguage = DEFAULT_LANGUAGE,
): Promise<string | null> {
  const key = `${lang}:${title}`;
  const cached = articleCache.get(key);
  if (cached) return cached;

  if (articleCache.size >= ARTICLE_CACHE_MAX) {
    const oldest = articleCache.keys().next().value;
    if (oldest) articleCache.delete(oldest);
  }

  const promise = fetchArticleHtmlRaw(title, lang);
  articleCache.set(key, promise);
  return promise;
}

/** Fetch tanpa cache — dipanggil internal. */
async function fetchArticleHtmlRaw(
  title: string,
  lang: WikiLanguage,
): Promise<string | null> {
  const cfg = getLangConfig(lang);
  const url = new URL(`${cfg.baseUrl}/w/api.php`);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "text");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "WikiRaceID/1.0 (https://wikirace.id; contact@wikirace.id) NextJS/16",
    },
  });
  if (!res.ok) return null;

  const data: {
    parse?: { text?: string };
    error?: { info?: string };
  } = await res.json();

  if (data.error || !data.parse?.text) return null;
  return data.parse.text;
}

/**
 * Ekstrak judul artikel dari href Wikipedia.
 * Mendukung `/wiki/Judul` relatif maupun `https://<lang>.wikipedia.org/wiki/Judul`.
 *
 * Hanya menerima link yang sesuai dengan bahasa room:
 * - Domain harus `<lang>.wikipedia.org` (atau path relatif).
 * - Bukan namespace non-artikel (Wikipedia:, Berkas:, dll).
 */
export function extractArticleTitle(
  href: string,
  lang: WikiLanguage = DEFAULT_LANGUAGE,
): string | null {
  if (!href) return null;
  if (href.startsWith("#")) return null;

  const cfg = getLangConfig(lang);
  let pathname: string;
  try {
    const url = new URL(href, cfg.baseUrl);
    if (url.hostname && url.hostname !== new URL(cfg.baseUrl).hostname) {
      // Domain berbeda dari bahasa room → reject. Cegah pemain navigasi
      // ke wiki bahasa lain via link interwiki.
      return null;
    }
    pathname = url.pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith("/wiki/")) return null;

  let raw = pathname.slice("/wiki/".length);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // biarkan apa adanya kalau gagal decode
  }

  if (!raw) return null;

  for (const prefix of NON_ARTICLE_PREFIXES) {
    if (raw.startsWith(prefix)) return null;
  }

  return raw.replace(/_/g, " ");
}

/**
 * Autocomplete pencarian judul artikel via OpenSearch.
 */
export async function searchArticles(
  query: string,
  lang: WikiLanguage = DEFAULT_LANGUAGE,
): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cfg = getLangConfig(lang);
  const url = new URL(`${cfg.baseUrl}/w/api.php`);
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", trimmed);
  url.searchParams.set("limit", "10");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "WikiRaceID/1.0 (https://wikirace.id; contact@wikirace.id) NextJS/16",
    },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[1])) return [];
  return (data[1] as unknown[]).filter((t): t is string => typeof t === "string");
}

/**
 * Ambil satu artikel Wikipedia random.
 * Dipakai untuk fitur "Surprise Me" — generate article pair otomatis.
 */
export async function fetchRandomArticle(
  lang: WikiLanguage = DEFAULT_LANGUAGE,
): Promise<string | null> {
  const cfg = getLangConfig(lang);
  const url = new URL(`${cfg.baseUrl}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "random");
  url.searchParams.set("rnnamespace", "0");
  url.searchParams.set("rnlimit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "WikiRaceID/1.0 (https://wikirace.id; contact@wikirace.id) NextJS/16",
    },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    query?: { random?: Array<{ title: string }> };
  };

  return data.query?.random?.[0]?.title ?? null;
}
