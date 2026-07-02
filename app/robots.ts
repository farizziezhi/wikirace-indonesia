import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/solo",
          "/guide",
          "/donatur",
          "/privacy",
          "/terms",
          "/profile/",
          "/about",
          "/contact",
          "/disclaimer",
          "/blog",
          "/blog/",
        ],
        disallow: ["/room/", "/api/", "/solo/play"],
      },
      {
        userAgent: ["GPTBot", "Claude-Web", "PerplexityBot", "Googlebot", "Applebot"],
        allow: [
          "/",
          "/solo",
          "/guide",
          "/donatur",
          "/privacy",
          "/terms",
          "/profile/",
          "/about",
          "/contact",
          "/disclaimer",
          "/blog",
          "/blog/",
        ],
        disallow: ["/room/", "/api/", "/solo/play"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
