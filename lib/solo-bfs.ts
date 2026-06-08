/**
 * Solo mode: BFS-based procedural article generation.
 * Generates reachable article pairs for Time Attack and Free Roam modes.
 */

import type { WikiLanguage } from "./types";
import { DEFAULT_LANGUAGE, fetchRandomArticle } from "./wikipedia";

interface BfsArticle {
  title: string;
  depth: number;
}

interface GenerateResult {
  startArticle: string;
  endArticle: string;
  estimatedDepth: number;
}

/**
 * Fetch all Wikipedia article links from a given title.
 * Returns array of article titles found in the page.
 */
async function fetchArticleLinks(
  title: string,
  lang: WikiLanguage,
): Promise<string[]> {
  const baseUrl = lang === "id" ? "https://id.wikipedia.org" : "https://en.wikipedia.org";
  const url = new URL(`${baseUrl}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "links");
  url.searchParams.set("pllimit", "500");
  url.searchParams.set("plnamespace", "0");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { links?: Array<{ title: string }> }
        >;
      };
    };

    const pages = data.query?.pages;
    if (!pages) return [];

    const pageData = Object.values(pages)[0];
    if (!pageData?.links) return [];

    return pageData.links.map((link) => link.title).filter((t): t is string => !!t);
  } catch {
    return [];
  }
}

/**
 * BFS from start article up to maxDepth.
 * Collects articles at each level, returns candidates from depth 2-maxDepth.
 * Max 200 total articles explored to prevent runaway API calls.
 */
async function bfsArticles(
  startTitle: string,
  lang: WikiLanguage,
  maxDepth: number = 4,
): Promise<BfsArticle[]> {
  const visited = new Set<string>();
  const queue: BfsArticle[] = [{ title: startTitle, depth: 0 }];
  const candidates: BfsArticle[] = [];
  let explored = 0;
  const MAX_EXPLORED = 200;

  while (queue.length > 0 && explored < MAX_EXPLORED) {
    const { title, depth } = queue.shift()!;

    if (visited.has(title)) continue;
    visited.add(title);
    explored++;

    // Collect articles at depth 2-maxDepth as potential endpoints
    if (depth >= 2 && depth <= maxDepth) {
      candidates.push({ title, depth });
    }

    // Continue BFS if within max depth
    if (depth < maxDepth) {
      const links = await fetchArticleLinks(title, lang);
      for (const link of links) {
        if (!visited.has(link) && explored < MAX_EXPLORED) {
          queue.push({ title: link, depth: depth + 1 });
        }
      }
    }
  }

  return candidates;
}

/**
 * Generate random start and end articles for Solo Mode.
 * Guarantees end is reachable from start within maxDepth clicks.
 *
 * Retries up to 3 times if BFS returns no candidates.
 */
export async function generateSoloArticlePair(
  lang: WikiLanguage = DEFAULT_LANGUAGE,
  maxDepth: number = 4,
  retries: number = 3,
): Promise<GenerateResult | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Get random start article
      const startArticle = await fetchRandomArticle(lang);
      if (!startArticle) continue;

      // BFS to find reachable candidates
      const candidates = await bfsArticles(startArticle, lang, maxDepth);
      if (candidates.length === 0) continue;

      // Pick random candidate as end article
      const endArticle = candidates[Math.floor(Math.random() * candidates.length)];
      const estimatedDepth = endArticle.depth;

      return {
        startArticle,
        endArticle: endArticle.title,
        estimatedDepth,
      };
    } catch {
      // retry
    }
  }

  return null;
}
