/**
 * Solo mode: BFS-based procedural article generation with difficulty and theme filters.
 * Generates reachable article pairs for Time Attack and Free Roam modes.
 */

import type { WikiLanguage } from "./types";
import { DEFAULT_LANGUAGE, fetchRandomArticle } from "./wikipedia";
import { CURATED_ARTICLES, getAllCuratedArticles, SoloTheme } from "./solo-curated";

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
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "WikiRaceID/1.0 (https://wikirace.id; contact@wikirace.id) NextJS/16",
      },
      signal: AbortSignal.timeout(8000),
    });
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
 * Check if a Wikipedia article exists.
 */
async function checkArticleExists(title: string, lang: WikiLanguage): Promise<boolean> {
  const baseUrl = lang === "id" ? "https://id.wikipedia.org" : "https://en.wikipedia.org";
  const url = new URL(`${baseUrl}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", title);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "WikiRaceID/1.0 (https://wikirace.id; contact@wikirace.id) NextJS/16",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      query?: {
        pages?: Record<string, { pageid?: number; missing?: boolean }>;
      };
    };
    const pages = data.query?.pages;
    if (!pages) return false;
    const page = Object.values(pages)[0];
    return !!(page && page.pageid !== undefined && page.missing === undefined);
  } catch {
    return false;
  }
}

/**
 * Run a quick BFS from start to find target up to maxDepth.
 * Returns the depth if found, or -1 if not found.
 */
async function findBfsDepth(
  start: string,
  target: string,
  lang: WikiLanguage,
  maxDepth: number = 4,
): Promise<number> {
  if (start.toLowerCase() === target.toLowerCase()) return 0;
  const visited = new Set<string>();
  let frontier: string[] = [start];
  visited.add(start);
  let depth = 0;
  const MAX_EXPLORED = 100;
  let explored = 0;

  async function fetchBatch(titles: string[]): Promise<string[][]> {
    const chunks: string[][] = [];
    const BATCH = 5;
    for (let i = 0; i < titles.length; i += BATCH) {
      const batch = titles.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((t) => fetchArticleLinks(t, lang)),
      );
      chunks.push(...results);
    }
    return chunks;
  }

  while (depth < maxDepth && explored < MAX_EXPLORED && frontier.length > 0) {
    const linksPerNode = await fetchBatch(frontier);
    const nextFrontier: string[] = [];
    const nextDepth = depth + 1;

    for (const links of linksPerNode) {
      explored++;
      for (const link of links) {
        if (link.toLowerCase() === target.toLowerCase()) {
          return nextDepth;
        }
        if (visited.has(link)) continue;
        visited.add(link);
        if (nextDepth < maxDepth && explored < MAX_EXPLORED) {
          nextFrontier.push(link);
        }
        explored++;
        if (explored >= MAX_EXPLORED) break;
      }
      if (explored >= MAX_EXPLORED) break;
    }

    frontier = nextFrontier;
    depth = nextDepth;
  }

  return -1;
}

/**
 * BFS from start article up to maxDepth.
 * Collects articles at each level, returns candidates from depth 2-maxDepth.
 * Parallel fetch per depth level. Max 120 total articles explored.
 */
async function bfsArticles(
  startTitle: string,
  lang: WikiLanguage,
  maxDepth: number = 3,
): Promise<BfsArticle[]> {
  const visited = new Set<string>();
  const candidates: BfsArticle[] = [];
  let frontier: string[] = [startTitle];
  visited.add(startTitle);
  let explored = 0;
  const MAX_EXPLORED = 120;
  let depth = 0;

  // Batch fetch 5 articles at a time
  async function fetchBatch(titles: string[]): Promise<string[][]> {
    const chunks: string[][] = [];
    const BATCH = 5;
    for (let i = 0; i < titles.length; i += BATCH) {
      const batch = titles.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((t) => fetchArticleLinks(t, lang)),
      );
      chunks.push(...results);
    }
    return chunks;
  }

  while (depth < maxDepth && explored < MAX_EXPLORED && frontier.length > 0) {
    // Limit frontier to explore at most 8 articles at this level to prevent triggering Wikipedia 429 rate limits
    const frontierToExplore = frontier.slice(0, 8);
    const linksPerNode = await fetchBatch(frontierToExplore);
    const nextFrontier: string[] = [];
    const nextDepth = depth + 1;

    for (const links of linksPerNode) {
      explored++;
      for (const link of links) {
        if (visited.has(link)) continue;
        visited.add(link);
        if (nextDepth >= 2 && nextDepth <= maxDepth) {
          candidates.push({ title: link, depth: nextDepth });
        }
        if (nextDepth < maxDepth && explored < MAX_EXPLORED) {
          nextFrontier.push(link);
        }
        explored++;
        if (explored >= MAX_EXPLORED) break;
      }
      if (explored >= MAX_EXPLORED) break;
    }

    // Shuffle next frontier slightly or just filter out visited
    frontier = nextFrontier;
    depth = nextDepth;
  }

  return candidates;
}

/**
 * Generate random start and end articles for Solo Mode.
 * Guarantees end is reachable from start within maxDepth clicks.
 *
 * Supports difficulty, curated themes, prioritizing popular targets,
 * and optional custom start/end articles.
 */
export async function generateSoloArticlePair(
  lang: WikiLanguage = DEFAULT_LANGUAGE,
  theme: SoloTheme = "all",
  difficulty: "easy" | "medium" | "hard" = "medium",
  customStart?: string | null,
  customEnd?: string | null,
  retries: number = 3,
): Promise<GenerateResult | null> {
  // 1. Handle BOTH custom start and custom end
  if (customStart && customEnd) {
    const [startOk, endOk] = await Promise.all([
      checkArticleExists(customStart, lang),
      checkArticleExists(customEnd, lang),
    ]);

    if (!startOk) throw new Error(lang === "id" ? `Artikel awal "${customStart}" tidak ditemukan.` : `Start article "${customStart}" not found.`);
    if (!endOk) throw new Error(lang === "id" ? `Artikel akhir "${customEnd}" tidak ditemukan.` : `End article "${customEnd}" not found.`);

    // Find shortest path in background up to depth 4
    const depth = await findBfsDepth(customStart, customEnd, lang, 4);
    return {
      startArticle: customStart,
      endArticle: customEnd,
      estimatedDepth: depth > 0 ? depth : -1, // -1 means custom route (> 4 clicks or unknown)
    };
  }

  // Determine max depth based on difficulty
  const maxDepth = difficulty === "easy" ? 2 : difficulty === "hard" ? 4 : 3;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      let startArticle: string | null = null;

      // 2. Select Starting Article
      if (customStart) {
        const startOk = await checkArticleExists(customStart, lang);
        if (!startOk) throw new Error(lang === "id" ? `Artikel awal "${customStart}" tidak ditemukan.` : `Start article "${customStart}" not found.`);
        startArticle = customStart;
      } else if (theme !== "all") {
        // Pick random from curated theme list
        const list = CURATED_ARTICLES[lang][theme];
        startArticle = list[Math.floor(Math.random() * list.length)];
      } else {
        // Wild Wikipedia: Pick completely random
        startArticle = await fetchRandomArticle(lang);
      }

      if (!startArticle) continue;

      // 3. BFS to find reachable candidates
      const candidates = await bfsArticles(startArticle, lang, maxDepth);
      if (candidates.length === 0) continue;

      // 4. Select Target Article
      let endArticle: BfsArticle | null = null;

      if (customEnd) {
        const endOk = await checkArticleExists(customEnd, lang);
        if (!endOk) throw new Error(lang === "id" ? `Artikel akhir "${customEnd}" tidak ditemukan.` : `End article "${customEnd}" not found.`);
        // Ensure it's reachable or just use it
        endArticle = { title: customEnd, depth: -1 };
      } else {
        // Prioritize candidates that are in our curated list of popular articles
        const curatedList = getAllCuratedArticles(lang);
        const popularCandidates = candidates.filter((c) =>
          curatedList.some((p) => p.toLowerCase() === c.title.toLowerCase()),
        );

        if (popularCandidates.length > 0) {
          // Pick from popular ones to ensure an interesting ending article
          endArticle = popularCandidates[Math.floor(Math.random() * popularCandidates.length)];
        } else {
          // Fallback to any BFS candidate
          endArticle = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }

      if (!endArticle) continue;

      return {
        startArticle,
        endArticle: endArticle.title,
        estimatedDepth: endArticle.depth,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("tidak ditemukan")) {
        throw err; // bubble up validation errors
      }
      // retry on connection/other errors
    }
  }

  return null;
}
