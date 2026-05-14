# User Flow — WikiRace Indonesia

**Versi:** 0.1 (Draft)
**Berkaitan dengan:** PRD WikiRace Indonesia v0.1

---

## Legenda

| Warna / Simbol | Arti |
|---|---|
| 🟢 Hijau | Layar / State aktif |
| 🟣 Ungu | Aksi pemain |
| 🟡 Kuning | Kondisi / validasi |
| 🔴 Merah | Error / keluar / game batal |
| ✅ Bintang | Selesai / menang |
| `- - ->` | Edge case / alur tidak normal |

---

## Alur Utama

```
[🟢 LANDING PAGE]
        |
   _____|_____
  |           |
"Buat Room"  "Gabung Room"
  |           |
  ▼           ▼

══════════════════════════════════════════════════════
  HOST FLOW                    JOINER FLOW
══════════════════════════════════════════════════════

[🟣 Input nama host]          [🟣 Input nama + kode room]
        |                               |
        ▼                               ▼
[🟢 Lobby - Host]            [🟡 Cek kode room]
 Kode room tampil                       |
 (bisa di-copy)              Valid & room < 8 pemain?
        |                     YES ───────── NO
        ▼                      |             |
[🟣 Host pilih topik]          ▼           [🔴 Error:
 Search artikel start    [🟢 Lobby - Joiner]  kode salah /
 Search artikel finish    Lihat topik &        room penuh]
        |                 daftar pemain         |
        ▼                      |               kembali ke
[🟡 Validasi artikel]          |               form join
 Ada di Wikipedia ID?     Menunggu host
 YES ──── NO               memulai...
  |        |                    |
  |      kembali                |
  |      ke form topik          |
  ▼                             |
[🟢 Lobby - Tunggu join]        |
 Daftar pemain update           |
 real-time (max 8)              |
        |                       |
[🟣 Host klik "Mulai"] ─────────┘
        |
        ▼
══════════════════════════════════════════════════════
  COUNTDOWN & GAMEPLAY (semua pemain)
══════════════════════════════════════════════════════

[🟢 Countdown 3 - 2 - 1]
        |
        ▼
[🟢 GAMEPLAY AKTIF]
  ┌─────────────────────────────────────────────┐
  │ Panel kiri (70%): Artikel Wikipedia tampil  │
  │ Panel kanan (30%): Sidebar status           │
  │  • Artikel tujuan                           │
  │  • Jumlah klik pemain ini                   │
  │  • Posisi teman (sedang di artikel apa)     │
  └─────────────────────────────────────────────┘
  Pemain klik tautan → artikel baru dimuat
        |
   _____|___________
  |         |       |
  ▼         ▼       ▼

══════════════════════════════════════════════════════
  TIGA SKENARIO AKHIR
══════════════════════════════════════════════════════

[✅ SKENARIO 1]     [🟡 SKENARIO 2]     [🔴 SKENARIO 3]
Ada yang sampai     Tombol Menyerah      Host disconnect
artikel tujuan      (semua harus         (kapan saja)
                    pencet)
      |                  |                     |
      ▼                  |                     ▼
[✅ Layar Menang!]   Belum semua?        [🔴 Game dibatalkan]
  Animasi +           ↩ kembali           Room ditutup
  nama pemenang       ke gameplay         Semua pemain
                          |               dikeluarkan
                    Semua setuju              |
                          |                  ▼
                          ▼           [🟢 Landing page]
                   [🟢 Tanpa pemenang]
                    Tampil pesan
                    semua menyerah

══════════════════════════════════════════════════════
  LEADERBOARD (Skenario 1 & 2)
══════════════════════════════════════════════════════

[🟢 LEADERBOARD AKHIR]
  • Urutan finish semua pemain
  • Jumlah klik tiap pemain
  • Waktu tempuh tiap pemain
        |
   _____|_____
  |           |
  ▼           ▼
[🟣 Main Lagi] [🟣 Keluar Room]
  |                   |
  ▼                   ▼
[🟢 Kembali ke   [🟢 Landing page]
 Lobby sama]
 Topik di-reset
 Host pilih topik baru
 Pemain lain masih di room
```

---

## Edge Cases

### EC-01: Pemain (non-host) disconnect saat gameplay
```
Pemain kehilangan koneksi
        |
        ▼
[Server deteksi timeout WebSocket]
        |
        ▼
Pemain langsung dikeluarkan dari room
        |
   _____|_____________
  |                   |
  ▼                   ▼
[Game TETAP JALAN]  [Sidebar semua
 untuk pemain lain]  pemain diupdate:
                     nama hilang]
```
**Dampak pada Menyerah:** Jika ada mekanisme surrender, hitungannya menyesuaikan dengan jumlah pemain yang masih aktif.

---

### EC-02: Pemain (non-host) disconnect saat lobby
```
Pemain kehilangan koneksi sebelum game mulai
        |
        ▼
Nama hilang dari daftar lobby
        |
Tidak ada efek ke room atau host
Game masih bisa dimulai dengan pemain yang tersisa
```

---

### EC-03: Host disconnect saat lobby (sebelum mulai)
```
Host kehilangan koneksi di lobby
        |
        ▼
[🔴 Room langsung ditutup]
        |
        ▼
Semua joiner mendapat notifikasi: "Host keluar, room ditutup"
        |
        ▼
Semua diarahkan ke Landing page
```

---

### EC-04: Room sudah penuh (8 pemain)
```
Joiner ke-9 memasukkan kode room yang valid
        |
        ▼
[🔴 Error: "Room sudah penuh, maksimal 8 pemain"]
        |
        ▼
Kembali ke form join, kode tetap terisi
```

---

### EC-05: Artikel Wikipedia tidak bisa dimuat (saat gameplay)
```
Pemain klik tautan → Wikipedia API error / timeout
        |
        ▼
[Tampil pesan error di panel artikel]
"Artikel tidak dapat dimuat, coba lagi"
        |
        ▼
Pemain bisa coba klik tautan lain
(posisi tetap di artikel sebelumnya)
```

---

### EC-06: Tautan yang diblokir diklik pemain
```
Pemain klik tautan kategori / gambar / eksternal
        |
        ▼
[Tidak ada navigasi, tautan diabaikan]
Opsional: tampil tooltip kecil "Tautan ini tidak bisa digunakan"
```

---

## Halaman & State Summary

| # | Halaman / State | Siapa yang melihat | Notes |
|---|---|---|---|
| 1 | Landing page | Semua | Entry point |
| 2 | Input nama (host) | Host saja | Sebelum buat room |
| 3 | Input nama + kode (joiner) | Joiner saja | Sebelum join room |
| 4 | Lobby (host view) | Host | Ada kontrol pilih topik & tombol mulai |
| 5 | Lobby (joiner view) | Joiner | Read-only, lihat topik & daftar pemain |
| 6 | Countdown | Semua pemain di room | 3 detik |
| 7 | Gameplay | Semua pemain di room | Panel artikel + sidebar status |
| 8 | Layar menang | Semua (1 pemenang, sisanya lihat pengumuman) | Transisi ke leaderboard |
| 9 | Leaderboard | Semua pemain | Tombol main lagi / keluar |
| 10 | Error states | Situasional | Room penuh, kode salah, game dibatalkan |

---

## Real-time Events (WebSocket)

| Event | Trigger | Diterima oleh |
|---|---|---|
| `player_joined` | Joiner berhasil masuk room | Semua di lobby |
| `player_left` | Pemain disconnect | Semua di lobby / gameplay |
| `topic_selected` | Host pilih topik | Semua joiner di lobby |
| `game_start` | Host klik Mulai | Semua di lobby → countdown |
| `player_moved` | Pemain pindah artikel | Semua pemain (update sidebar) |
| `surrender_vote` | Pemain tekan Menyerah | Semua pemain (update counter) |
| `game_won` | Pemain sampai artikel tujuan | Semua pemain → layar menang |
| `game_cancelled` | Host disconnect | Semua pemain → landing page |
| `game_surrendered` | Semua vote menyerah | Semua pemain → leaderboard |

---

*Dokumen ini adalah living document. Akan diperbarui seiring iterasi produk.*
```
