# Product Requirements Document (PRD)
## WikiRace Indonesia

**Versi:** 0.1 (Draft)
**Tanggal:** Mei 2026
**Status:** Brainstorming / Pre-Development

---

## 1. Latar Belakang & Problem Statement

WikiRace adalah permainan di mana pemain berlomba menavigasi dari satu artikel Wikipedia ke artikel lain hanya dengan mengklik tautan dalam artikel — tanpa mengetik di search bar. Website WikiRace yang ada saat ini (seperti thewikigame.com) tidak mendukung Wikipedia Bahasa Indonesia, sehingga pemain Indonesia kehilangan pengalaman bermain dalam bahasa sendiri.

**WikiRace Indonesia** hadir untuk mengisi kekosongan ini: sebuah platform web multiplayer real-time yang menggunakan konten Wikipedia Bahasa Indonesia secara penuh.

---

## 2. Tujuan Produk

- Menyediakan pengalaman WikiRace yang menyenangkan dalam Bahasa Indonesia
- Memungkinkan pemain bermain bersama teman secara real-time tanpa perlu membuat akun
- Menjadi platform yang ringan, cepat, dan mudah diakses dari perangkat apapun

---

## 3. Target Pengguna

> ⚠️ **Catatan:** Target pengguna masih perlu didefinisikan lebih lanjut. Berikut adalah hipotesis awal yang perlu divalidasi.

### Persona Primer — "Andi si Gamer Kasual"
- Usia 15–28 tahun
- Suka main game santai bareng teman saat nongkrong atau online
- Tidak mau ribet daftar akun untuk main
- Menggunakan smartphone atau laptop

### Persona Sekunder — "Guru/Fasilitator"
- Menggunakan WikiRace sebagai aktivitas edukasi yang menyenangkan di kelas
- Butuh cara cepat setup permainan tanpa akun

---

## 4. Ruang Lingkup (Scope)

### ✅ MVP — Yang MASUK di versi pertama

| Fitur | Deskripsi |
|---|---|
| Buat Room | Host membuat room, mendapat kode unik 6 karakter |
| Gabung Room | Pemain lain masuk dengan kode room |
| Username Guest | Tidak perlu akun, cukup masukkan nama |
| Pilih Topik | Host memilih artikel Wikipedia awal dan tujuan |
| Validasi Topik | Sistem memastikan artikel yang dipilih ada di Wikipedia ID |
| Lobby | Ruang tunggu sebelum game dimulai, semua pemain terlihat |
| Gameplay Real-time | Render artikel Wikipedia langsung di dalam app |
| Countdown Start | Hitungan mundur 3-2-1 sebelum balapan dimulai |
| Navigasi Artikel | Klik tautan dalam artikel untuk berpindah halaman |
| Deteksi Pemenang | Sistem mendeteksi siapa yang pertama sampai ke artikel tujuan |
| Leaderboard Akhir | Tampilan hasil akhir: urutan finish, jumlah klik, waktu tempuh |

### ❌ Yang TIDAK masuk di MVP (future)

- Akun pengguna & profil
- Statistik & riwayat permainan
- Mode async / challenge
- Kurasi topik oleh sistem
- Chat dalam game
- Mode solo / latihan
- Papan skor global
- Mobile app native

---

## 5. User Stories

### Alur Host (Pembuat Room)

```
Sebagai Host, saya ingin:
- Memasukkan nama saya tanpa perlu daftar akun
  → Agar bisa langsung bermain
- Membuat room baru dan mendapat kode pendek yang mudah dibagikan
  → Agar teman saya bisa masuk dengan mudah
- Mencari dan memilih artikel Wikipedia Indonesia sebagai titik start
  → Agar permainan terasa relevan dan seru
- Mencari dan memilih artikel Wikipedia Indonesia sebagai titik finish
  → Agar ada tujuan yang jelas
- Melihat siapa saja yang sudah masuk ke room
  → Agar saya tahu kapan semua orang sudah siap
- Memulai permainan ketika semua sudah siap
  → Agar balapan bisa dimulai secara bersamaan
```

### Alur Pemain (Joiner)

```
Sebagai Pemain, saya ingin:
- Memasukkan nama dan kode room dengan cepat
  → Agar saya tidak ketinggalan saat teman sudah menunggu
- Melihat topik start dan finish sebelum mulai
  → Agar saya bisa bersiap-siap secara mental
- Melihat artikel Wikipedia yang bisa saya navigasi di dalam app
  → Agar saya tidak perlu buka tab baru
- Melihat progress teman saya secara real-time (sedang di artikel apa)
  → Agar ada rasa kompetisi yang nyata
- Tahu siapa yang menang dan berapa klik yang dibutuhkan
  → Agar ada closure setelah permainan selesai
```

---

## 6. Alur Permainan (Happy Path)

```
[Halaman Utama]
    ↓ Host klik "Buat Room"
[Input Nama] → [Lobby sebagai Host]
    ↓ Host pilih topik Start & Finish
    ↓ Pemain lain masuk dengan kode room
[Lobby menampilkan semua pemain]
    ↓ Host klik "Mulai"
[Countdown 3-2-1]
    ↓
[GAMEPLAY]
  - Semua pemain melihat artikel Start yang sama
  - Klik tautan untuk berpindah artikel
  - Sidebar kecil menampilkan: artikel tujuan, jumlah klikmu, posisi teman
    ↓ Salah satu pemain tiba di artikel Finish
[Layar Selamat Datang untuk Pemenang]
    ↓ Semua pemain melihat...
[Leaderboard Akhir]
  - Urutan finish
  - Jumlah klik tiap pemain
  - Waktu tempuh
  - Tombol: "Main Lagi" | "Keluar Room"
```

---

## 7. Halaman & Komponen UI

| Halaman | Komponen Utama |
|---|---|
| Landing Page | Tombol "Buat Room" & "Gabung Room", tagline, penjelasan cara main |
| Input Nama + Join | Field nama, field kode room (jika joiner) |
| Lobby | Kode room (bisa copy), daftar pemain, area pilih topik (host only), tombol Mulai |
| Gameplay | Panel artikel Wikipedia (kiri, ~70% lebar), panel status (kanan, ~30%): tujuan, klik count, posisi teman |
| Layar Menang | Animasi celebrasi, nama pemenang, tombol ke leaderboard |
| Leaderboard | Tabel hasil, tombol main lagi |

---

## 8. Integrasi Wikipedia Indonesia

- **API yang digunakan:** MediaWiki Action API (`https://id.wikipedia.org/w/api.php`)
- **Fungsi yang dibutuhkan:**
  - Search artikel (untuk pilih topik di lobby)
  - Ambil konten artikel dalam format HTML
  - Validasi artikel ada atau tidak
- **Tautan yang diklik** harus di-intercept: hanya tautan ke artikel Wikipedia lain yang valid, bukan tautan eksternal, referensi, atau gambar
- **Tautan yang diblokir dalam gameplay:** Wikipedia:..., Berkas:..., Kategori:..., Pembicaraan:..., tautan eksternal

---

## 9. Kebutuhan Real-time

Gameplay real-time membutuhkan komunikasi dua arah antara server dan semua klien dalam satu room.

- **Teknologi kandidat:** WebSocket (via Socket.io atau native)
- **Event yang perlu disinkronisasi:**
  - Pemain baru masuk lobby
  - Pemain keluar
  - Host memilih topik
  - Game dimulai (broadcast ke semua)
  - Update posisi tiap pemain (artikel yang sedang dibuka)
  - Notifikasi ada yang menang
  - Data leaderboard akhir

---

## 10. Keputusan Produk (Sudah Diputuskan)

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Berapa maksimum pemain per room? | **Maksimal 8 pemain** |
| 2 | Apakah ada batas waktu per game? | **Tidak ada batas waktu. Game berakhir ketika ada yang menang.** |
| 3 | Apa yang terjadi jika Host keluar? | **Game langsung dibatalkan, room ditutup, semua pemain dikeluarkan.** |
| 4 | Bagaimana jika tidak ada yang bisa menang? | **Ada tombol "Menyerah" — game berakhir jika SEMUA pemain menekan tombol ini.** |
| 5 | Apakah gambar Wikipedia ditampilkan? | **Ya. Artikel ditampilkan apa adanya seperti Wikipedia asli.** |
| 6 | Apakah ada hint? | **Tidak ada hint.** |
| 7 | Apa yang terjadi setelah game selesai? | **Room tetap aktif. Pemain bisa main lagi dengan topik baru dari lobby yang sama.** |
| 8 | Bagaimana penanganan koneksi putus? | **Pemain yang putus koneksi langsung dikeluarkan dari room secara otomatis.** |

---

## 11. Metrik Keberhasilan (Success Metrics)

Untuk versi MVP, keberhasilan diukur dari:

- Pemain bisa buat & join room dalam < 30 detik
- Game bisa dimulai tanpa error dalam > 95% kasus
- Artikel Wikipedia berhasil di-render dengan tautan yang bisa diklik
- Pemenang terdeteksi dengan benar dan leaderboard tampil akurat
- Tidak ada desync antara pemain (semua lihat update real-time < 1 detik)

---

## 12. Dokumen Selanjutnya

Setelah PRD ini disetujui, dokumen berikutnya yang perlu dibuat:

1. **User Flow Diagram** — Visualisasi alur lengkap semua skenario
2. **Wireframe** — Sketsa layout tiap halaman
3. **Technical Architecture** — Stack teknologi, database, deployment
4. **AI Agent Prompt Spec** — Instruksi detail untuk AI yang akan men-generate kode

---

*Dokumen ini adalah living document. Akan diperbarui seiring keputusan produk yang berkembang.*
