/**
 * Helper Wikipedia API (Bahasa Indonesia).
 * Endpoint utama: https://id.wikipedia.org/w/api.php
 */

const API_BASE = "https://id.wikipedia.org/w/api.php";
export const WIKI_BASE = "https://id.wikipedia.org";

/**
 * Daftar prefix namespace yang BUKAN artikel utama.
 * Setiap link dengan prefix ini akan diabaikan saat intercept klik.
 * Mendukung varian tanpa "Pembicaraan_" / "Talk:".
 */
const NON_ARTICLE_PREFIXES = [
  "Wikipedia:",
  "Berkas:",
  "File:",
  "Kategori:",
  "Category:",
  "Bantuan:",
  "Help:",
  "Templat:",
  "Template:",
  "Pembicaraan:",
  "Pembicaraan_Wikipedia:",
  "Pembicaraan_Pengguna:",
  "Pembicaraan_Berkas:",
  "Pembicaraan_Templat:",
  "Pembicaraan_Kategori:",
  "Talk:",
  "User_talk:",
  "User:",
  "Pengguna:",
  "Istimewa:",
  "Special:",
  "Portal:",
  "Modul:",
  "Module:",
  "MediaWiki:",
];

/**
 * Ambil HTML konten artikel Wikipedia untuk judul tertentu.
 * Return null kalau artikel tidak ada / fetch gagal.
 */
export async function fetchArticleHtml(title: string): Promise<string | null> {
  const url = new URL(API_BASE);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "text");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString());
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
 * Mendukung relative `/wiki/Judul` maupun absolute `https://id.wikipedia.org/wiki/Judul`.
 *
 * Return:
 * - string judul (sudah di-decode + spasi normal) jika link adalah artikel valid
 * - null jika bukan link artikel namespace utama (Wikipedia:, Berkas:, dll),
 *   anchor (#section), atau eksternal.
 */
export function extractArticleTitle(href: string): string | null {
  if (!href) return null;
  // Anchor murni di dalam halaman yang sama.
  if (href.startsWith("#")) return null;

  let pathname: string;
  try {
    const url = new URL(href, WIKI_BASE);
    // Hanya domain Wikipedia ID yang kita izinkan.
    if (url.hostname && url.hostname !== "id.wikipedia.org") return null;
    pathname = url.pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith("/wiki/")) return null;

  // Buang prefix `/wiki/` lalu decode URI.
  let raw = pathname.slice("/wiki/".length);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // biarkan apa adanya kalau gagal decode
  }

  if (!raw) return null;

  // Tolak namespace non-artikel.
  for (const prefix of NON_ARTICLE_PREFIXES) {
    if (raw.startsWith(prefix)) return null;
  }

  // Wikipedia menulis spasi sebagai underscore di URL.
  return raw.replace(/_/g, " ");
}


/**
 * Autocomplete pencarian judul artikel via OpenSearch.
 * Return array berisi judul artikel (sudah di-decode).
 *
 * Format response OpenSearch:
 *   [query, [titles], [descriptions], [urls]]
 */
export async function searchArticles(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(API_BASE);
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", trimmed);
  url.searchParams.set("limit", "10");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[1])) return [];
  return (data[1] as unknown[]).filter((t): t is string => typeof t === "string");
}
