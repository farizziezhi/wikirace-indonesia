import Link from "next/link";
import { getAllArticles, getCategories } from "@/lib/blog-data";
import {
  House,
  BookOpen,
  Calendar,
  Clock,
  Tag,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

export default function BlogPage() {
  const articles = getAllArticles();
  const categories = getCategories();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog WikiRace Indonesia",
    description:
      "Tips, strategi, trivia, dan panduan lengkap seputar WikiRace dan Wikipedia.",
    url: `${siteUrl}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteUrl}/blog/${article.slug}`,
        name: article.title,
      })),
    },
  };

  const categoryColors: Record<string, string> = {
    Panduan: "bg-lime-accent text-charcoal-text",
    Strategi: "bg-playdate-yellow text-charcoal-text",
    "Trivia & Edukasi": "bg-burnt-orange text-warm-cream",
    Edukasi: "bg-sky-400 text-charcoal-text",
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[800px]">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        />

        {/* Back Button */}
        <header className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full self-start shadow-[2px_2px_0px_#000] z-10 w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            <House size={14} />
            <span>Kembali ke Beranda</span>
          </Link>
        </header>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-charcoal-text text-playdate-yellow rounded-xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000]">
              <BookOpen size={28} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-charcoal-text uppercase"
                style={{
                  fontSize: "clamp(28px, 5vw, 38px)",
                  lineHeight: 1.1,
                }}
              >
                Blog
              </h1>
              <p className="text-xs text-charcoal-text/50 font-mono uppercase tracking-wider mt-0.5">
                Tips, strategi &amp; trivia WikiRace
              </p>
            </div>
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-charcoal-text shadow-[2px_2px_0px_#000] ${
                  categoryColors[cat] ?? "bg-warm-gray text-charcoal-text"
                }`}
                style={{ borderRadius: "var(--radius-button)" }}
              >
                <Tag size={10} weight="fill" />
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Article Cards */}
        <div className="flex flex-col gap-5">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group block bg-charcoal-deep text-warm-cream p-5 sm:p-6 border-3 border-charcoal-text shadow-[5px_5px_0px_#000] hover:shadow-[7px_7px_0px_#000] hover:translate-y-[-2px] transition-all duration-200"
              style={{ borderRadius: "var(--radius-input)" }}
            >
              <div className="flex flex-col gap-3">
                {/* Category + Meta */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-charcoal-text ${
                      categoryColors[article.category] ??
                      "bg-warm-gray text-charcoal-text"
                    }`}
                    style={{ borderRadius: "var(--radius-subtle)" }}
                  >
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-warm-cream/40 font-mono">
                    <Calendar size={10} />
                    {new Date(article.publishedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-warm-cream/40 font-mono">
                    <Clock size={10} />
                    {article.readingTime}
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-black text-lg sm:text-xl text-lime-accent group-hover:text-playdate-yellow transition leading-tight">
                  {article.title}
                </h2>

                {/* Summary */}
                <p className="text-sm text-warm-cream/70 leading-relaxed line-clamp-2">
                  {article.summary}
                </p>

                {/* Read More */}
                <div className="flex items-center gap-1.5 text-xs font-black text-lime-accent/70 group-hover:text-lime-accent transition uppercase tracking-wider mt-1">
                  Baca Selengkapnya
                  <ArrowRight
                    size={12}
                    weight="bold"
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-charcoal-text/60 mb-3 font-bold">
            Sudah baca semuanya? Saatnya praktek!
          </p>
          <Link
            href="/"
            className="chunky-press btn-primary py-3 px-6 text-sm font-extrabold border-2 border-charcoal-text inline-flex items-center gap-2"
            style={{ borderRadius: "var(--radius-button)" }}
          >
            🎮 Main WikiRace Sekarang
          </Link>
        </div>
      </div>
    </main>
  );
}
