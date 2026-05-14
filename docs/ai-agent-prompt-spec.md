# AI Agent Prompt Spec — WikiRace Indonesia

**Versi:** 1.0  
**Status:** Ready to use  
**Target:** v0 (vercel.com/v0), Lovable, atau Bolt

---

## Cara Pakai Dokumen Ini

Gunakan prompt-prompt di bawah secara **berurutan**. Jangan kirim semuanya sekaligus — AI agent bekerja lebih baik kalau satu prompt = satu deliverable yang jelas.

Setiap prompt sudah mengandung konteks yang cukup, jadi kamu tidak perlu menjelaskan ulang dari awal di setiap sesi.

---

## PROMPT 1 — Setup Project & Infrastruktur

```
Buatkan setup awal untuk project Next.js 16 (App Router) dengan nama "WikiRace Indonesia".

Stack yang digunakan:
- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Ably (real-time messaging)
- Upstash Redis (state room)

Yang perlu dibuat:

1. **Struktur folder** sesuai ini:
   - app/page.tsx (kosong dulu)
   - app/room/[roomId]/page.tsx (kosong dulu)
   - app/api/ably-auth/route.ts
   - app/api/room/create/route.ts (kosong dulu)
   - components/ (kosong dulu)
   - lib/ably.ts
   - lib/redis.ts
   - lib/wikipedia.ts (kosong dulu)

2. **lib/ably.ts** — Ably client singleton untuk sisi client (pakai `ably` npm package), dan fungsi helper `getAblyServer()` untuk sisi server (publish pesan dari API Route).

3. **lib/redis.ts** — Helper untuk Upstash Redis dengan tiga fungsi:
   - `getRoom(roomId: string): Promise<Room | null>`
   - `setRoom(room: Room): Promise<void>` — simpan dengan TTL 24 jam
   - `deleteRoom(roomId: string): Promise<void>`
   
   Gunakan package `@upstash/redis`. Inisialisasi client dengan `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` dari environment variable.

4. **app/api/ably-auth/route.ts** — GET endpoint yang return Ably token request untuk client. Gunakan `ABLY_API_KEY` dari environment variable. Ini penting agar API key tidak terekspos ke browser.

5. **TypeScript interfaces** di file `lib/types.ts`:

```typescript
interface RouteStep {
  article: string;
  timestamp: number; // detik sejak game dimulai
}

interface Player {
  clientId: string;
  username: string;
  isHost: boolean;
  status: 'waiting' | 'playing' | 'finished' | 'surrendered';
  currentArticle: string;
  route: RouteStep[];
  finishedAt?: number;
}

interface Room {
  id: string;
  hostClientId: string;
  status: 'lobby' | 'playing' | 'finished';
  startArticle: string;
  endArticle: string;
  players: Player[];
  createdAt: number;
}
```

Environment variables yang dibutuhkan (tambahkan ke .env.local):
- ABLY_API_KEY
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Jangan buat UI dulu, fokus ke setup infrastruktur saja.
```

---

## PROMPT 2 — API Routes (Backend Logic)

```
Lanjutkan project WikiRace Indonesia. Setup infrastruktur sudah ada.
Sekarang buat semua API Routes berikut.

Konteks penting:
- State room disimpan di Upstash Redis dengan helper getRoom/setRoom/deleteRoom dari lib/redis.ts
- Setelah update state, publish pesan ke Ably channel bernama `room:{roomId}` menggunakan getAblyServer() dari lib/ably.ts
- Setiap API route menerima `clientId` di body/header untuk identifikasi pemain
- Room maksimum 8 pemain

Buat endpoint berikut:

**POST /api/room/create**
- Body: `{ username: string, clientId: string }`
- Generate roomId 6 karakter (huruf kapital + angka)
- Buat room baru dengan status 'lobby', player pertama sebagai host
- Simpan ke KV, return `{ roomId, room }`

**POST /api/room/join**
- Body: `{ roomId: string, username: string, clientId: string }`
- Validasi: room ada, status masih 'lobby', belum penuh (< 8 pemain), username belum dipakai di room ini
- Tambah player ke room, publish event `room_updated` ke Ably channel `room:{roomId}`
- Return `{ room }` atau error message

**POST /api/room/set-articles**
- Body: `{ roomId: string, clientId: string, startArticle: string, endArticle: string }`
- Validasi: hanya host yang boleh, status harus 'lobby'
- Update startArticle dan endArticle di room, publish `room_updated`

**POST /api/room/start**
- Body: `{ roomId: string, clientId: string }`
- Validasi: hanya host, status 'lobby', startArticle dan endArticle sudah diset, minimal 2 pemain
- Update status room ke 'playing', set currentArticle semua pemain ke startArticle, catat startTime
- Publish event `game_started` dengan `{ startArticle, endArticle, startTime }`

**POST /api/room/navigate**
- Body: `{ roomId: string, clientId: string, article: string }`
- Validasi: room status 'playing', player status 'playing'
- Tambah artikel ke route player dengan timestamp (Date.now() - room.startTime) / 1000
- Update currentArticle player
- Publish `player_moved` dengan `{ clientId, article, route: player.route }`
- Jika article === room.endArticle:
  - Update player status ke 'finished', catat finishedAt
  - Update room status ke 'finished'
  - Publish `game_won` dengan `{ winnerId: clientId, allRoutes: semua player dengan route masing-masing }`

**POST /api/room/surrender**
- Body: `{ roomId: string, clientId: string }`
- Update player status ke 'surrendered'
- Cek apakah SEMUA player sudah 'surrendered'
- Jika ya: publish `game_surrendered` dengan `{ allRoutes }` dan update room status 'finished'
- Jika belum: publish `room_updated`

**POST /api/room/leave**
- Body: `{ roomId: string, clientId: string }`
- Jika yang keluar adalah host: publish `game_cancelled` dengan `{ reason: 'host_left' }`, hapus room dari KV
- Jika bukan host: hapus player dari list, publish `room_updated`

**POST /api/room/play-again**
- Body: `{ roomId: string, clientId: string }`
- Reset room: status kembali ke 'lobby', semua player status 'waiting', route dikosongkan, startArticle & endArticle dikosongkan
- Publish `room_reset` dengan `{ room }`
```

---

## PROMPT 3 — Landing Page

```
Lanjutkan project WikiRace Indonesia. Backend API sudah siap.
Sekarang buat Landing Page di app/page.tsx.

Fungsi halaman ini:
1. User masukkan username
2. Pilih: Buat Room Baru ATAU Join Room dengan kode
3. Setelah berhasil, redirect ke /room/[roomId]

Behaviour detail:
- Username disimpan di localStorage agar tidak perlu diketik ulang
- clientId dibuat sekali saat pertama kali buka app dan disimpan di localStorage (gunakan crypto.randomUUID())
- Tombol "Buat Room": call POST /api/room/create, redirect ke /room/{roomId} yang baru dibuat
- Input + tombol "Join Room": call POST /api/room/join dengan roomId yang diketik user
  - Jika berhasil: redirect ke /room/{roomId}
  - Jika gagal (room tidak ada / penuh): tampilkan pesan error yang jelas
- Validasi sederhana: username tidak boleh kosong dan maksimal 20 karakter

Desain:
- Tema gelap (dark mode), nuansa petualangan/eksplorer
- Nama produk: "WikiRace ID"
- Tampilkan tagline singkat yang menjelaskan cara main: "Navigasi Wikipedia dari satu artikel ke artikel lain, lebih cepat dari temanmu"
- Mobile-friendly
```

---

## PROMPT 4 — Lobby

```
Lanjutkan project WikiRace Indonesia.
Sekarang buat komponen Lobby di components/Lobby.tsx, yang dirender di app/room/[roomId]/page.tsx ketika room.status === 'lobby'.

Props yang diterima Lobby:
- room: Room
- currentClientId: string
- ablyChannel: Ably.RealtimeChannel

Fungsi Lobby:
1. Tampilkan kode room yang bisa di-copy (misal: "ABC123") — klik untuk copy ke clipboard
2. Tampilkan daftar pemain yang sudah join, dengan badge "Host" untuk host
3. **Hanya host** yang bisa set artikel start dan finish:
   - Input dengan autocomplete: saat user mengetik, panggil Wikipedia API opensearch untuk suggest judul artikel
   - `GET https://id.wikipedia.org/w/api.php?action=opensearch&search={query}&limit=8&namespace=0&format=json&origin=*`
   - Tampilkan hasil sebagai dropdown suggestion
   - Setelah dipilih, call POST /api/room/set-articles
4. **Hanya host** yang bisa klik tombol "Mulai Game"
   - Tombol aktif hanya jika: startArticle dan endArticle sudah diset, dan ada minimal 2 pemain
   - Klik tombol: call POST /api/room/start
5. Pemain non-host melihat status "Menunggu host memulai game..."

Subscribe ke Ably channel (sudah di-pass sebagai prop) untuk event:
- `room_updated`: update tampilan daftar pemain dan artikel yang diset
- `game_started`: parent component akan handle ini untuk switch ke tampilan Game

Jangan lupa: saat komponen unmount atau user tutup browser, kirim POST /api/room/leave (gunakan useEffect cleanup dan/atau beforeunload event).
```

---

## PROMPT 5 — Game Screen

```
Lanjutkan project WikiRace Indonesia.
Sekarang buat komponen Game di components/Game.tsx, yang dirender ketika room.status === 'playing'.

Props:
- room: Room
- currentClientId: string
- ablyChannel: Ably.RealtimeChannel
- startTime: number (timestamp ms saat game dimulai)

Layout halaman Game (dua panel):
- **Panel kiri (lebar ~70%):** Konten artikel Wikipedia
- **Panel kanan (lebar ~30%):** Progress semua pemain + tombol surrender

**Panel kiri — WikiArticle:**
Buat komponen components/WikiArticle.tsx yang:
1. Fetch konten artikel dari Wikipedia:
   `GET https://id.wikipedia.org/w/api.php?action=parse&page={judulArtikel}&prop=text&format=json&origin=*`
2. Render HTML response di dalam div (gunakan dangerouslySetInnerHTML)
3. Intercept semua klik `<a>` di dalam div tersebut:
   - Prevent default (agar tidak redirect keluar app)
   - Ekstrak judul artikel dari href: href biasanya `/wiki/Judul_Artikel` atau full URL `https://id.wikipedia.org/wiki/Judul_Artikel`
   - Abaikan link bukan artikel (yang mengandung `/wiki/` tapi diikuti `Wikipedia:`, `Berkas:`, `Kategori:`, `Bantuan:`, `Template:`, dll — hanya artikel namespace utama yang boleh)
   - Panggil POST /api/room/navigate dengan judul artikel
   - Load artikel baru
4. Tampilkan judul artikel saat ini di atas konten
5. Tampilkan loading spinner saat fetch artikel

**Panel kanan — PlayerList:**
Buat komponen components/PlayerList.tsx yang:
1. Tampilkan semua pemain dengan:
   - Username
   - Artikel terakhir yang mereka kunjungi
   - Jumlah langkah (panjang route)
   - Indikator visual kalau mereka baru saja pindah artikel
2. Tombol "Menyerah" di bawah list
   - Klik: call POST /api/room/surrender
   - Setelah klik: tombol berubah jadi "Menunggu pemain lain menyerah..." dan disabled
   - Tampilkan berapa pemain yang sudah menyerah dari total

Subscribe ke Ably channel untuk:
- `player_moved`: update posisi pemain di PlayerList
- `game_won`: parent handle untuk switch ke Results
- `game_surrendered`: parent handle untuk switch ke Results
- `game_cancelled`: redirect ke landing page + tampilkan toast "Host keluar, game dibatalkan"

Tampilkan juga timer di atas (waktu yang sudah berjalan sejak game mulai, format MM:SS).
```

---

## PROMPT 6 — Results Screen

```
Lanjutkan project WikiRace Indonesia.
Sekarang buat komponen Results di components/Results.tsx, yang dirender ketika room.status === 'finished'.

Props:
- room: Room
- currentClientId: string
- allRoutes: Record<string, RouteStep[]> — key adalah clientId
- winnerId: string | null (null jika semua menyerah)
- onPlayAgain: () => void

Tampilan Results:

1. **Header:**
   - Jika ada pemenang: tampilkan "🏆 {username pemenang} Menang!" dengan waktu penyelesaian
   - Jika semua menyerah: tampilkan "Semua menyerah! Tidak ada pemenang."

2. **Leaderboard:** Daftar semua pemain diurutkan berdasarkan:
   - Pemain yang finish duluan (berdasarkan finishedAt)
   - Pemain yang belum finish (urutkan berdasarkan jumlah langkah terbanyak)
   - Pemain yang menyerah (paling bawah)

3. **Rute pemain (accordion):**
   - Tiap pemain punya section yang bisa dibuka/tutup
   - Rute pemenang langsung terbuka by default
   - Tampilkan setiap artikel dalam rute sebagai chain: Artikel A (0:05) → Artikel B (0:12) → Artikel C (0:43)
   - Untuk pemain yang tidak finish, artikel terakhir diberi label "(berhenti di sini)"
   - Tampilkan total langkah dan total waktu (jika finish)

4. **Tombol di bawah:**
   - "Main Lagi" — call POST /api/room/play-again, lalu panggil onPlayAgain() untuk kembali ke Lobby
   - "Keluar Room" — call POST /api/room/leave, redirect ke landing page
```

---

## PROMPT 7 — Integrasi & Page Router

```
Lanjutkan project WikiRace Indonesia.
Sekarang satukan semua komponen di app/room/[roomId]/page.tsx.

Halaman ini adalah entry point untuk semua state game. Yang perlu dilakukan:

1. **Ambil clientId dan username dari localStorage** saat halaman load.
   - Jika tidak ada (user langsung buka URL tanpa lewat landing page), redirect ke landing page (/).

2. **Connect ke Ably:**
   - Fetch token dari GET /api/ably-auth
   - Buat Ably Realtime client dengan token tersebut dan clientId dari localStorage
   - Subscribe ke channel `room:{roomId}`
   - Enter Ably Presence dengan data `{ username }`

3. **Join room otomatis jika belum join:**
   - Call GET atau POST /api/room/join saat pertama load
   - Jika room tidak ada atau penuh, redirect ke landing page dengan pesan error

4. **State management halaman ini:**
   ```typescript
   type GameState = 'lobby' | 'playing' | 'finished'
   ```
   - `gameState === 'lobby'` → render `<Lobby />`
   - `gameState === 'playing'` → render `<Game />`
   - `gameState === 'finished'` → render `<Results />`

5. **Subscribe ke Ably events untuk transisi state:**
   - `game_started` → set gameState ke 'playing', simpan startTime
   - `game_won` → set gameState ke 'finished', simpan allRoutes dan winnerId
   - `game_surrendered` → set gameState ke 'finished', simpan allRoutes (winnerId = null)
   - `room_reset` → set gameState ke 'lobby', reset semua state game

6. **Handle disconnect:**
   - Gunakan window.addEventListener('beforeunload') untuk call POST /api/room/leave saat user tutup browser
   - Gunakan Ably Presence leave event: jika host yang leave (presence.clientId === room.hostClientId), tampilkan toast dan redirect ke landing page

Pass ablyChannel sebagai prop ke semua child components agar mereka bisa subscribe event tambahan yang spesifik ke state masing-masing.
```

---

## Tips Saat Menggunakan Prompt Ini

- **Jalankan satu prompt per sesi**, atau minimal tunggu satu selesai sebelum lanjut ke berikutnya.
- **Kalau ada error**, paste pesan error-nya ke AI agent di sesi yang sama — jangan mulai sesi baru.
- **Setelah semua prompt selesai**, coba test flow end-to-end: buka dua tab berbeda, buat room di tab 1, join di tab 2, mainkan sampai ada yang menang.
- **Deploy ke Vercel** setelah semua berjalan di local. Jangan lupa set environment variables (`ABLY_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) di dashboard Vercel → Settings → Environment Variables.

---

*Dokumen ini adalah bagian dari seri dokumentasi WikiRace Indonesia. Lihat juga: PRD, User Flow, Technical Architecture.*