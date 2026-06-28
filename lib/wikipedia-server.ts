import { getValkeyClient } from "@/lib/redis";

export async function fetchWikiLinks(title: string, lang: string): Promise<string[]> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(title)}&pllimit=150&plnamespace=0&format=json&origin=*`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "WikiRaceID/1.0 (https://wikiraceid.web.id) NextJS/16",
      },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];
    const pageId = Object.keys(pages)[0];
    const linksObj = pages[pageId]?.links;
    if (!linksObj || !Array.isArray(linksObj)) return [];
    return linksObj.map((l: { title: string }) => l.title).filter(Boolean);
  } catch {
    return [];
  }
}

export async function fetchWikiBacklinks(title: string, lang: string): Promise<string[]> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=backlinks&bltitle=${encodeURIComponent(title)}&bllimit=150&blnamespace=0&format=json&origin=*`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "WikiRaceID/1.0 (https://wikiraceid.web.id) NextJS/16",
      },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const backlinks = data.query?.backlinks;
    if (!backlinks || !Array.isArray(backlinks)) return [];
    return backlinks.map((l: { title: string }) => l.title).filter(Boolean);
  } catch {
    return [];
  }
}

export async function fetchWikiLinksCached(title: string, lang: string): Promise<string[]> {
  try {
    const client = getValkeyClient();
    const cacheKey = `wiki:links:${lang}:${title}`;
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const links = await fetchWikiLinks(title, lang);
    if (links.length > 0) {
      await client.set(cacheKey, JSON.stringify(links), "EX", 300); // 5 mins
    }
    return links;
  } catch (err) {
    console.warn("Cache error for links:", err);
    return fetchWikiLinks(title, lang);
  }
}

export async function fetchWikiBacklinksCached(title: string, lang: string): Promise<string[]> {
  try {
    const client = getValkeyClient();
    const cacheKey = `wiki:backlinks:${lang}:${title}`;
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const backlinks = await fetchWikiBacklinks(title, lang);
    if (backlinks.length > 0) {
      await client.set(cacheKey, JSON.stringify(backlinks), "EX", 300); // 5 mins
    }
    return backlinks;
  } catch (err) {
    console.warn("Cache error for backlinks:", err);
    return fetchWikiBacklinks(title, lang);
  }
}

export async function generateLogicalBotRoute(
  start: string,
  end: string,
  lang: string,
  solutionRoute?: string[]
): Promise<string[]> {
  if (solutionRoute && solutionRoute.length >= 2 && solutionRoute[0] === start && solutionRoute[solutionRoute.length - 1] === end) {
    return solutionRoute;
  }

  try {
    const backlinks = await fetchWikiBacklinksCached(end, lang);
    const startLinks = await fetchWikiLinksCached(start, lang);
    
    if (startLinks.includes(end)) {
      return [start, end];
    }
    
    const intersect2 = startLinks.filter(x => backlinks.includes(x));
    if (intersect2.length > 0) {
      const mid = intersect2[Math.floor(Math.random() * intersect2.length)];
      return [start, mid, end];
    }
    
    const sampleY = startLinks.slice(0, 8);
    for (const y of sampleY) {
      const yLinks = await fetchWikiLinksCached(y, lang);
      const intersect3 = yLinks.filter(z => backlinks.includes(z));
      if (intersect3.length > 0) {
        const z = intersect3[Math.floor(Math.random() * intersect3.length)];
        return [start, y, z, end];
      }
    }
    
    if (backlinks.length > 0) {
      const route = [start];
      let current = start;
      for (let i = 0; i < 2; i++) {
        const links = await fetchWikiLinksCached(current, lang);
        if (links.length === 0) break;
        const connection = links.find(l => backlinks.includes(l));
        if (connection) {
          route.push(connection);
          route.push(end);
          return route;
        }
        const next = links[Math.floor(Math.random() * links.length)];
        route.push(next);
        current = next;
      }
      const randomBacklink = backlinks[Math.floor(Math.random() * backlinks.length)];
      route.push(randomBacklink);
      route.push(end);
      return route;
    }
  } catch (err) {
    console.error("Gagal memproses rute logis bot:", err);
  }

  return [start, end];
}
