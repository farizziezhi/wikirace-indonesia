# WikiRace Indonesia

Multiplayer realtime WikiRace memakai konten Wikipedia Bahasa Indonesia. Buat
room, bagikan kodenya, lalu klik tautan secepat mungkin untuk sampai ke
artikel tujuan.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind v4** (design system Playdate-inspired)
- **Ably** — realtime messaging (token auth, no API key di client)
- **Upstash Redis** — state room serverless (TTL 24 jam per room)

## Local development

```bash
pnpm install
cp .env.local.example .env.local
# isi ABLY_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
pnpm dev
```

Buka http://localhost:3000.

## Environment variables

| Nama                       | Sumber                                  | Catatan                |
| -------------------------- | --------------------------------------- | ---------------------- |
| `ABLY_API_KEY`             | https://ably.com/dashboard              | Server only — jangan expose |
| `UPSTASH_REDIS_REST_URL`   | https://console.upstash.com             | Server only            |
| `UPSTASH_REDIS_REST_TOKEN` | https://console.upstash.com             | Server only            |
| `NEXT_PUBLIC_SITE_URL`     | URL produksi (opsional, untuk OG image) | Public — boleh expose  |

## Build

```bash
pnpm build
pnpm start
```

## Deploy

Lihat [docs/deploy.md](docs/deploy.md) untuk panduan deploy ke Vercel.

## Struktur

```
app/
├── api/                    # Route handlers (room state + Ably auth)
├── room/[roomId]/          # Halaman gameplay (lobby/game/results)
├── icon.tsx                # Favicon dinamis (next/og)
├── apple-icon.tsx          # Apple touch icon dinamis
├── opengraph-image.tsx     # OG image dinamis
└── page.tsx                # Landing page
components/                 # Lobby, Game, Results, WikiArticle
lib/                        # Helper Ably, Redis, Wikipedia, types
docs/                       # PRD, technical architecture, deploy guide
```
