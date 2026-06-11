import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/solo", "/solo/play"],
      disallow: ["/room/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
