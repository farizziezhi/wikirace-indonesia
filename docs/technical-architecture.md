# Technical Architecture — WikiRace Indonesia

**Versi:** 1.1  
**Status:** Draft  
**Konteks:** Optimized untuk AI agent generation (v0, Lovable, Bolt, dll), deployment gratis, dan kompleksitas minimal.

---

## 1. Prinsip Desain Teknis

| Prinsip | Keputusan |
|---|---|
| Developer | AI Agent (v0, Lovable, Bolt) |
| Kompleksitas | Sesederhana mungkin |
| Biaya | Gratis / semurah mungkin |
| Stack preference | Yang paling AI-familiar |

---

## 2. Stack Teknologi

### Frontend + Backend (Satu Project)
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Real-time:** Ably (managed WebSocket — tidak butuh server persistent)
- **Language:** TypeScript

> **Kenapa Next.js fullstack?** Dengan Ably, kita tidak butuh server WebSocket sendiri. Next.js API Routes cukup untuk handle logic room (create, join, validate) karena operasinya singkat. Ably yang handle koneksi real-time persisten antar pemain. Hasilnya: satu codebase, satu platform, deploy gratis semua di Vercel.

> **Kenapa Ably?** Tier gratis Ably lebih generous dari Pusher: 200 koneksi simultan, 6 juta pesan/bulan — lebih dari cukup untuk MVP.

### State Management
- **Database:** Tidak ada — state room disimpan di **Upstash Redis** (serverless Redis, gratis 500K commands/bulan)

> **Kenapa butuh Redis?** Tanpa server persistent, kita perlu tempat menyimpan data room (siapa hostnya, artikel apa, route tiap pemain) yang bisa diakses oleh semua API Routes. Upstash Redis pakai HTTP-based connection — cocok untuk serverless/edge seperti Vercel. Data dihapus saat game selesai (TTL 24 jam).

> **Kenapa bukan Vercel KV?** Vercel KV sudah deprecated. Penggantinya adalah Upstash Redis yang bisa diintegrasikan langsung lewat Vercel Marketplace, atau didaftarkan mandiri di upstash.com.

### Hosting
| Komponen | Platform | Biaya |
|---|---|---|
| Next.js (frontend + API routes) | Vercel | Gratis |
| Real-time messaging | Ably | Gratis (200 koneksi, 6jt pesan/bulan) |
| State room (Redis) | Upstash | Gratis (500K commands/bulan, 256MB) |

---

## 3. Struktur Data

State room disimpan di **Upstash Redis**, dengan key `room:{roomId}`.

### Room
```typescript
interface Room {
  id: string;              // 6 karakter, e.g. "ABC123"
  hostClientId: string;    // Ably clientId host
  status: 'lobby' | 'playing' | 'finished';
  startArticle: string;    // Judul artikel Wikipedia (e.g. "Nasi Goreng")
  endArticle: string;      // Judul artikel Wikipedia (e.g. "Soekarno")
  players: Player[];
  createdAt: number;       // timestamp
}
```

### Player
```typescript
interface Player {
  clientId: string;        // Ably clientId (unique per koneksi)
  username: string;
  isHost: boolean;
  status: 'waiting' | 'playing' | 'finished' | 'surrendered';
  currentArticle: string;
  route: RouteStep[];      // Riwayat semua artikel yang dilewati
  finishedAt?: number;     // timestamp saat menang (null jika belum)
}
```

### RouteStep
```typescript
interface RouteStep {
  article: string;         // Judul artikel
  timestamp: number;       // Detik sejak game dimulai
}
```

---

## 4. API Wikipedia Bahasa Indonesia

Satu-satunya API eksternal yang dipakai.

**Base URL:** `https://id.wikipedia.org/w/api.php`

### Endpoint yang Digunakan

#### Ambil konten artikel (untuk ditampilkan di game)
```
GET https://id.wikipedia.org/w/api.php
  ?action=parse
  &page={JUDUL_ARTIKEL}
  &prop=text
  &format=json
  &origin=*
```
> Response berisi HTML lengkap artikel Wikipedia — langsung dirender di iframe atau div.

#### Autocomplete pencarian judul artikel (untuk pilih start/finish)
```
GET https://id.wikipedia.org/w/api.php
  ?action=opensearch
  &search={QUERY}
  &limit=10
  &namespace=0
  &format=json
  &origin=*
```

#### Cek apakah artikel ada
```
GET https://id.wikipedia.org/w/api.php
  ?action=query
  &titles={JUDUL_ARTIKEL}
  &format=json
  &origin=*
```

> **Catatan penting:** `&origin=*` diperlukan agar bisa dipanggil dari browser (CORS). Semua endpoint di atas bisa dipanggil langsung dari frontend — tidak perlu proxy backend.

---

## 5. Ably — Real-time Events

Setiap room punya satu **Ably Channel** dengan nama `room:{roomId}`. Semua pemain di room yang sama subscribe ke channel ini.

Berbeda dari Socket.io, dengan Ably semua pesan dikirim melalui channel yang sama — tidak ada "server emit". Logika game divalidasi di **Next.js API Routes**, lalu hasilnya dipublish ke channel Ably dari server.

### Alur Umum
```
Client action → Next.js API Route (validasi + update KV) → publish ke Ably channel → semua client terima
```

### Messages di Ably Channel `room:{roomId}`

| Event Name | Dikirim oleh | Data | Keterangan |
|---|---|---|---|
| `room_updated` | Server (API Route) | `{ room }` | Update state room (pemain masuk/keluar, artikel diset) |
| `game_started` | Server | `{ startArticle, endArticle, startTime }` | Game dimulai |
| `player_moved` | Server | `{ clientId, article, route }` | Ada pemain yang navigasi |
| `game_won` | Server | `{ winnerId, allRoutes }` | Ada yang menang, game selesai |
| `game_surrendered` | Server | `{ allRoutes }` | Semua menyerah |
| `game_cancelled` | Server | `{ reason }` | Game dibatalkan (host disconnect) |
| `room_reset` | Server | `{ room }` | Room direset untuk main lagi |

### Next.js API Routes (Client → Server)

| Route | Method | Body | Keterangan |
|---|---|---|---|
| `/api/room/create` | POST | `{ username }` | Buat room baru |
| `/api/room/join` | POST | `{ roomId, username }` | Join room |
| `/api/room/set-articles` | POST | `{ roomId, startArticle, endArticle }` | Host set artikel |
| `/api/room/start` | POST | `{ roomId }` | Host mulai game |
| `/api/room/navigate` | POST | `{ roomId, article }` | Pemain navigasi ke artikel baru |
| `/api/room/surrender` | POST | `{ roomId }` | Pemain menyerah |
| `/api/room/leave` | POST | `{ roomId }` | Pemain keluar room |
| `/api/room/play-again` | POST | `{ roomId }` | Reset room untuk main lagi |
| `/api/ably-auth` | GET | — | Token auth Ably (tidak expose API key ke client) |

---

## 6. Struktur Folder Project

Satu project Next.js — tidak ada folder terpisah untuk backend.

```
wikirace-id/
├── app/
│   ├── page.tsx                  # Landing page (form username + join/create)
│   ├── room/
│   │   └── [roomId]/
│   │       └── page.tsx          # Lobby & Game (satu halaman, beda state)
│   ├── layout.tsx
│   └── api/
│       ├── ably-auth/
│       │   └── route.ts          # Token auth Ably (GET)
│       └── room/
│           ├── create/route.ts
│           ├── join/route.ts
│           ├── set-articles/route.ts
│           ├── start/route.ts
│           ├── navigate/route.ts
│           ├── surrender/route.ts
│           ├── leave/route.ts
│           └── play-again/route.ts
├── components/
│   ├── Lobby.tsx                 # State: waiting di lobby
│   ├── Game.tsx                  # State: sedang bermain
│   ├── Results.tsx               # State: game selesai + rute semua pemain
│   ├── WikiArticle.tsx           # Komponen render artikel Wikipedia
│   └── PlayerList.tsx            # Daftar pemain + progress
└── lib/
    ├── ably.ts                   # Ably client singleton + helper
    ├── redis.ts                  # Helper Upstash Redis (get/set/delete room)
    └── wikipedia.ts              # Helper fungsi Wikipedia API
```

---

## 7. Alur Teknis Kunci

### Render Artikel Wikipedia
1. Pemain klik link di artikel → frontend intercept klik (`onClick`)
2. Frontend extract judul artikel dari URL (`/wiki/Judul_Artikel`)
3. Frontend panggil Wikipedia API `action=parse` untuk judul tersebut (langsung dari browser)
4. Render HTML response di komponen `WikiArticle`
5. Frontend kirim `POST /api/room/navigate` dengan judul artikel baru
6. API Route validasi + update KV → publish `player_moved` ke Ably channel
7. Semua client (termasuk pengirim) terima event dan update UI progress bar

> **Catatan penting:** Link di Wikipedia mengarah ke `https://id.wikipedia.org/wiki/...`. Kita perlu intercept semua klik `<a>` di dalam konten artikel dan prevent default agar pemain tidak keluar dari aplikasi kita.

### Sinkronisasi Game Selesai
1. API Route `/navigate` deteksi `article === endArticle`
2. Update status room di KV menjadi `finished`
3. Publish `game_won` ke Ably channel dengan semua route semua pemain
4. Semua client terima event dan render halaman Results

### Deteksi Host Disconnect
Ably menyediakan **Presence** feature — client bisa "enter" dan "leave" presence di channel. Saat host leave presence (disconnect/tutup browser), semua client lain mendapat event `presence.leave` dan frontend bisa otomatis hit `/api/room/leave` untuk trigger `game_cancelled`.

---

## 8. Batasan & Trade-offs

| Trade-off | Keputusan | Konsekuensi |
|---|---|---|
| State di Upstash Redis | Vercel KV deprecated, Upstash penggantinya | TTL 24 jam per room — acceptable untuk MVP |
| Wikipedia API dari frontend | Tidak butuh proxy | Ada risiko rate limit jika banyak user, tapi oke untuk MVP |
| Ably tier gratis | 200 koneksi, 6jt pesan/bulan | Cukup untuk ratusan sesi game per bulan |
| Tidak ada auth | Username saja | Tidak ada persistensi history, tapi sesuai kebutuhan |
| API Route per aksi | Lebih verbose dari WebSocket | Trade-off yang wajar untuk menghindari server persistent |

---

## 9. Environment Variables yang Dibutuhkan

```env
ABLY_API_KEY=xxxx                   # Dari dashboard Ably
UPSTASH_REDIS_REST_URL=xxxx         # Dari dashboard Upstash
UPSTASH_REDIS_REST_TOKEN=xxxx       # Dari dashboard Upstash
```

---

## 10. Urutan Build yang Direkomendasikan untuk AI Agent

Kalau pakai AI agent, berikan dokumen ini beserta PRD dan User Flow sebagai konteks, lalu minta build dalam urutan ini:

1. **Setup Ably + Vercel KV** — koneksi, auth token endpoint, helper KV
2. **API Routes** — semua endpoint room (create, join, navigate, dll)
3. **Landing page** — form username, create room, join room
4. **Lobby** — daftar pemain, set artikel, tombol start (host only)
5. **Game screen** — render artikel Wikipedia + intercept link + progress pemain lain
6. **Results screen** — leaderboard + rute semua pemain

---

*Dokumen ini adalah bagian dari seri dokumentasi WikiRace Indonesia. Lihat juga: PRD, User Flow.*