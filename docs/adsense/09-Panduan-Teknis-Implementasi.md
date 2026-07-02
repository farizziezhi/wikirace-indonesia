# Panduan Teknis Implementasi — WikiRace Indonesia untuk AdSense

Stack yang dipakai: Next.js App Router, TypeScript, Tailwind CSS. Semua contoh kode di bawah disesuaikan untuk stack itu.

---

## 1. Struktur Halaman yang Perlu Ditambahkan

```
app/
├── about/page.tsx          → konten dari file 01
├── contact/page.tsx        → konten dari file 02
├── disclaimer/page.tsx     → konten dari file 03
├── blog/
│   ├── page.tsx             → daftar semua artikel
│   ├── [slug]/page.tsx      → template artikel individual
│   └── kategori/[kategori]/page.tsx  → halaman per kategori (opsional, tahap 2)
```

## 2. Metadata per Halaman (Next.js App Router)

Setiap halaman blog/artikel WAJIB punya metadata unik. Contoh untuk `app/blog/[slug]/page.tsx`:

```tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const artikel = await getArtikelBySlug(params.slug); // fungsi ambil data artikel kamu

  return {
    title: `${artikel.judul} | WikiRace Indonesia`,
    description: artikel.ringkasan, // 150-160 karakter, unik per artikel
    openGraph: {
      title: artikel.judul,
      description: artikel.ringkasan,
      type: 'article',
      publishedTime: artikel.tanggalPublish,
      authors: [artikel.penulis],
      images: [artikel.gambarUtama],
    },
    twitter: {
      card: 'summary_large_image',
      title: artikel.judul,
      description: artikel.ringkasan,
    },
  };
}
```

## 3. Structured Data (Schema.org) — Article

Tambahkan JSON-LD di setiap halaman artikel agar Google memahami konten sebagai artikel yang valid:

```tsx
function ArticleSchema({ artikel }: { artikel: Artikel }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: artikel.judul,
    description: artikel.ringkasan,
    image: artikel.gambarUtama,
    datePublished: artikel.tanggalPublish,
    dateModified: artikel.tanggalUpdate || artikel.tanggalPublish,
    author: {
      '@type': 'Organization',
      name: 'WikiRace Indonesia',
      url: 'https://wikiraceid.web.id',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WikiRace Indonesia',
      logo: {
        '@type': 'ImageObject',
        url: 'https://wikiraceid.web.id/logo.png',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

Untuk homepage, tambahkan schema `WebSite` + `Organization`:

```tsx
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'WikiRace Indonesia',
  url: 'https://wikiraceid.web.id',
  description: 'Platform balapan Wikipedia online berbahasa Indonesia',
  inLanguage: 'id-ID',
};
```

## 4. Sitemap Otomatis

Next.js App Router mendukung sitemap dinamis. Buat `app/sitemap.ts`:

```tsx
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artikelList = await getAllArtikel(); // ambil semua artikel dari data source-mu

  const artikelUrls = artikelList.map((artikel) => ({
    url: `https://wikiraceid.web.id/blog/${artikel.slug}`,
    lastModified: artikel.tanggalUpdate || artikel.tanggalPublish,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: 'https://wikiraceid.web.id',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://wikiraceid.web.id/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://wikiraceid.web.id/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://wikiraceid.web.id/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...artikelUrls,
  ];
}
```

Ini otomatis menghasilkan `/sitemap.xml` yang bisa disubmit ke Google Search Console.

## 5. Robots.txt

Buat `app/robots.ts`:

```tsx
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: 'https://wikiraceid.web.id/sitemap.xml',
  };
}
```

## 6. Checklist Google Search Console

1. Daftarkan properti `wikiraceid.web.id` di [Google Search Console](https://search.google.com/search-console) (kemungkinan sudah ada karena verifikasi kepemilikan sudah sukses di AdSense).
2. Submit sitemap: masuk ke menu **Sitemaps**, masukkan `sitemap.xml`.
3. Setelah semua halaman baru live, gunakan fitur **URL Inspection** untuk request indexing manual pada halaman-halaman penting (About, Contact, dan beberapa artikel awal) agar tidak perlu menunggu crawl otomatis.
4. Cek status indexing berkala di menu **Pages** — pantau halaman mana yang "Indexed" vs "Discovered but not indexed".

## 7. Breadcrumb (Opsional tapi Direkomendasikan)

```tsx
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://wikiraceid.web.id' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://wikiraceid.web.id/blog' },
    { '@type': 'ListItem', position: 3, name: artikel.judul, item: `https://wikiraceid.web.id/blog/${artikel.slug}` },
  ],
};
```

## 8. Rekomendasi Penyimpanan Data Artikel (Zero-Budget)

Karena stack zi sudah pakai Supabase, bisa buat tabel sederhana:

```sql
create table artikel (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  judul text not null,
  ringkasan text not null,
  konten text not null,
  kategori text not null,
  penulis text default 'Tim WikiRace Indonesia',
  gambar_utama text,
  tanggal_publish timestamptz default now(),
  tanggal_update timestamptz
);
```

Ini juga memudahkan zi menambah fitur kategori dan tag di kemudian hari tanpa perlu redeploy setiap kali menambah artikel.

## 9. Urutan Eksekusi yang Disarankan

1. Buat 3 halaman wajib (About, Contact, Disclaimer) — dampak cepat, effort kecil.
2. Setup struktur `/blog` dengan minimal template artikel + sitemap + robots.txt.
3. Publish 5 artikel dari paket ini sebagai konten awal.
4. Submit sitemap ke Search Console, request indexing manual.
5. Tunggu 1-2 minggu, pantau status indexing.
6. Tambah 5-10 artikel lagi (idealnya rutin, bukan sekaligus) sambil menunggu.
7. Setelah total 15-20 artikel + semua halaman wajib live dan ter-index, baru submit ulang review AdSense.
