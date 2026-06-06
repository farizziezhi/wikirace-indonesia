# 🏎️ WikiRace Indonesia

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38BDF8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Ably](https://img.shields.io/badge/Ably-Realtime_PubSub-FD9E2B?style=for-the-badge&logo=ably)](https://ably.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-Serverless-FF4438?style=for-the-badge&logo=redis)](https://upstash.com/)

**WikiRace Indonesia** adalah game balapan multiplayer realtime berbasis artikel Wikipedia Bahasa Indonesia. Tantang temanmu untuk berlari dari satu artikel awal ke artikel tujuan secepat mungkin, hanya dengan mengklik tautan di dalam artikel!

Inspirasi desain bertema **"Lando Norris Modern Racing Premium"** — memadukan fondasi *warm cream* klasik, teks *deep forest charcoal*, dan aksen warna *lime green* ala lintasan balap F1 yang dinamis.

---

## ✨ Fitur Utama

- 🏎️ **Realtime Multiplayer (Up to 8 Players):** Balapan realtime yang didukung penuh oleh **Ably Pub/Sub** untuk sinkronisasi aksi dan perpindahan halaman instan.
- 💬 **Realtime Chat & Reactions:** Saling ejek dan berekspresi di tengah balapan dengan panel obrolan terintegrasi serta emoji melayang (*floating reactions*).
- 🏆 **Timing Screen Podium:** Klasemen akhir otomatis yang meniru layar waktu balapan profesional, lengkap dengan pembagian lencana pencapaian (*achievement badges*).
- 🎲 **Surprise Me & Challenge Packs:** Host bisa memilih 14+ paket tantangan buatan kurator atau melempar dadu artikel acak (Wikipedia API) untuk balapan instan.
- 🔗 **Dynamic OpenGraph Image Sharing:** Setiap kali Anda membagikan link room atau link hasil balapan, pratinjau media sosial (Discord, WA, Telegram, dll) secara otomatis menampilkan informasi artikel dan nama pemenang yang ter-update dari database Redis.
- 📱 **Mobile-First Responsive Design:** Konten Wikipedia dibersihkan dan dioptimalkan agar terbaca dengan nyaman baik di desktop maupun layar HP.

---

## 🛠️ Stack Teknologi

Game ini dibangun dengan pendekatan *serverless-first* berkinerja tinggi:

- **Frontend & Routing:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Realtime Channel:** [Ably Realtime SDK](https://ably.com/) (Token Auth aman tanpa mengekspos API Key ke client)
- **State Management:** [Upstash Redis](https://upstash.com/) (Penyimpanan instan & terdistribusi untuk room metadata dengan TTL otomatis 24 jam)
- **Styling System:** [Tailwind CSS v4](https://tailwindcss.com/) (Kombinasi warna khusus Lando Norris, custom typography Geist, bayangan taktil, dan animasi mikro)
- **API Konten:** Wikipedia MediaWiki API (Pencarian autocomplete secara client-side & generator acak gratis)

---

## 📦 Struktur Folderr

```plain
wikirace-id/
├── app/
│   ├── api/                    # Route handler (room state, chat, navigation, Ably auth)
│   ├── room/
│   │   └── [roomId]/
│   │       ├── page.tsx        # Gameplay client component (Lobby/Game/Results)
│   │       └── opengraph-image.tsx # OG image generator dinamis untuk satu room
│   ├── icon.tsx                # Favicon dinamis (Next.js OG)
│   ├── apple-icon.tsx          # Apple Touch Icon dinamis
│   ├── opengraph-image.tsx     # OG image dinamis global
│   ├── layout.tsx              # Root HTML wrapper
│   └── page.tsx                # Beranda / Landing page
├── components/                 # UI Components modular (WikiArticle, Results, Lobby, dll)
├── lib/                        # Konfigurasi database client, helper wikipedia, dan types
├── docs/                       # Arsitektur teknis, user flow, dan panduan deployment
└── public/                     # Static assets (sounds, icons)
```

---

## 🚀 Memulai Pengembangan Lokal

### Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) (v18+) dan paket manajer [pnpm](https://pnpm.io/).

### Langkah-langkah
1. **Clone repository:**
   ```bash
   git clone https://github.com/username/wikirace-indonesia.git
   cd wikirace-indonesia
   ```

2. **Instal dependensi:**
   ```bash
   pnpm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin file template `.env.local.example` menjadi `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   Buka file `.env.local` dan isi nilainya:
   - `ABLY_API_KEY`: Dapatkan dari [Ably Dashboard](https://ably.com/dashboard)
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Dapatkan dari [Upstash Console](https://console.upstash.com/)

4. **Jalankan server development:**
   ```bash
   pnpm dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## ⚙️ Environment Variables

| Nama | Sumber | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `ABLY_API_KEY` | [Ably](https://ably.com/) | API Key utama untuk otentikasi channel realtime. | Server-only (Aman) |
| `UPSTASH_REDIS_REST_URL` | [Upstash](https://upstash.com/) | Endpoint REST database serverless Redis. | Server-only (Aman) |
| `UPSTASH_REDIS_REST_TOKEN` | [Upstash](https://upstash.com/) | Token otentikasi REST database Redis. | Server-only (Aman) |
| `NEXT_PUBLIC_SITE_URL` | Hosting | URL dasar website (opsional, untuk meta tags / sharing). | Public (Aman di-expose) |

---

## ⚡ Build & Produksi

Untuk menghasilkan bundle produksi yang terkompresi dan siap dideploy:

```bash
pnpm build
pnpm start
```

Panduan lengkap mengenai deployment di platform serverless dapat dilihat pada berkas [docs/deploy.md](docs/deploy.md).

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi MIT. Silakan gunakan, modifikasi, dan distribusikan kode ini untuk keperluan edukasi atau personal.

Dibuat dengan 🏎️ dan ☕ oleh [@farizziezhi](https://github.com/farizziezhi).
