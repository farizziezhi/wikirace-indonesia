import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  House,
  Calendar,
  Clock,
  User,
  Tag,
  ArrowLeft,
  ArrowRight,
  GameController,
} from "@phosphor-icons/react/dist/ssr";
import {
  getArticleBySlug,
  getArticleSlugs,
  getAllArticles,
} from "@/lib/blog-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      url: `${siteUrl}/blog/${article.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const isEn = article.language === "en";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  // Get other articles for "Read Next" section
  const allArticles = getAllArticles();
  const otherArticles = allArticles
    .filter((a) => a.slug !== slug && (a.language || "id") === (article.language || "id"))
    .slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Organization",
      name: "WikiRace Indonesia",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "WikiRace Indonesia",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${article.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${siteUrl}/blog/${article.slug}`,
      },
    ],
  };

  const categoryColors: Record<string, string> = {
    Panduan: "bg-lime-accent text-charcoal-text",
    Strategi: "bg-playdate-yellow text-charcoal-text",
    "Trivia & Edukasi": "bg-burnt-orange text-warm-cream",
    Edukasi: "bg-sky-400 text-charcoal-text",
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[750px]">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />

        {/* Breadcrumb Nav */}
        <header className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full shadow-[2px_2px_0px_#000] w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            <House size={14} />
            <span>{isEn ? "Home" : "Beranda"}</span>
          </Link>
          <Link
            href={`/blog${isEn ? "?lang=en" : ""}`}
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full shadow-[2px_2px_0px_#000] w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            <ArrowLeft size={12} />
            <span>Blog</span>
          </Link>
        </header>

        {/* Article Card */}
        <article
          className="bg-charcoal-deep text-warm-cream p-6 sm:p-10 border-3 border-charcoal-text shadow-[6px_6px_0px_#000] flex flex-col gap-6"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          {/* Article Header */}
          <div className="border-b border-warm-cream/15 pb-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-charcoal-text ${
                  categoryColors[article.category] ??
                  "bg-warm-gray text-charcoal-text"
                }`}
                style={{ borderRadius: "var(--radius-subtle)" }}
              >
                <Tag size={9} weight="fill" />
                {article.category}
              </span>
            </div>

            <h1
              className="font-black text-lime-accent leading-tight mb-4"
              style={{ fontSize: "clamp(22px, 4vw, 30px)" }}
            >
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-warm-cream/50 font-mono">
              <span className="flex items-center gap-1.5">
                <User size={12} />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(article.publishedAt).toLocaleDateString(isEn ? "en-US" : "id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {article.readingTime}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div
            className="blog-article text-sm sm:text-base leading-relaxed text-warm-cream/90"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Author Card */}
          <div
            className="bg-charcoal-text/20 border border-warm-cream/10 p-4 flex items-center gap-3 mt-2"
            style={{ borderRadius: "var(--radius-subtle)" }}
          >
            <div className="p-2 bg-lime-accent/20 rounded-lg shrink-0">
              <User size={20} className="text-lime-accent" />
            </div>
            <div>
              <p className="font-black text-xs text-lime-accent uppercase">
                {article.author}
              </p>
              <p className="text-[11px] text-warm-cream/50 mt-0.5">
                {isEn ? "The first Indonesian Wikipedia racing platform." : "Platform balapan Wikipedia online pertama berbahasa Indonesia."}
              </p>
            </div>
          </div>
        </article>

        {/* CTA */}
        <div
          className="mt-6 bg-charcoal-text text-warm-cream p-5 border-3 border-charcoal-text shadow-[5px_5px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderRadius: "var(--radius-input)" }}
        >
          <div className="flex items-center gap-3">
            <GameController
              size={28}
              weight="fill"
              className="text-playdate-yellow shrink-0"
            />
            <p className="text-sm font-bold">
              {isEn ? "Ready to practice? Play WikiRace now!" : "Siap praktek? Main WikiRace sekarang!"}
            </p>
          </div>
          <Link
            href="/"
            className="chunky-press btn-primary py-2.5 px-5 text-xs font-extrabold border-2 border-charcoal-text whitespace-nowrap"
            style={{ borderRadius: "var(--radius-button)" }}
          >
            {isEn ? "Play Now →" : "Main Sekarang →"}
          </Link>
        </div>

        {/* Read Next */}
        {otherArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="font-black text-lg text-charcoal-text uppercase mb-4 flex items-center gap-2">
              <ArrowRight size={18} weight="bold" />
              {isEn ? "Read Next" : "Baca Juga"}
            </h2>
            <div className="flex flex-col gap-3">
              {otherArticles.map((other) => (
                <Link
                  key={other.slug}
                  href={`/blog/${other.slug}`}
                  className="group bg-charcoal-deep text-warm-cream p-4 border-3 border-charcoal-text shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:translate-y-[-1px] transition-all duration-200 flex flex-col gap-1.5"
                  style={{ borderRadius: "var(--radius-input)" }}
                >
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border border-charcoal-text w-fit ${
                      categoryColors[other.category] ??
                      "bg-warm-gray text-charcoal-text"
                    }`}
                    style={{ borderRadius: "var(--radius-subtle)" }}
                  >
                    {other.category}
                  </span>
                  <h3 className="font-black text-sm text-lime-accent group-hover:text-playdate-yellow transition">
                    {other.title}
                  </h3>
                  <p className="text-xs text-warm-cream/50 line-clamp-1">
                    {other.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
