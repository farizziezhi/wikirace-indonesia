import { BlogArticle } from "./blog-data";

export const artikelKomunitas: BlogArticle[] = [
  {
    slug: "rute-tercepat-minggu-ini",
    title: "Rute Tercepat Minggu Ini: Dari Artikel A ke Artikel B",
    summary: "Analisis rute-rute paling mindblowing yang berhasil ditemukan pemain komunitas minggu ini.",
    category: "Komunitas",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 menit",
    content: `
<p>Selamat datang di rubrik mingguan Komunitas WikiRace Indonesia! Minggu ini, kita melihat beberapa rute penyelesaian yang benar-benar di luar nalar dari pemain kita.</p>

<h2>Highlight: Dari "Batu Bara" ke "Anime"</h2>
<p>Rute menantang ini diselesaikan oleh pemain <code>@wiki_master99</code> hanya dalam 4 klik!</p>
<p><strong>Rute aslinya:</strong> Batu Bara -> Jepang (via ekspor energi) -> Budaya Populer Jepang -> Anime.</p>
<p>Pemikiran lateral yang luar biasa. Banyak pemain lain yang mencoba lewat jalur geologi, tersesat di artikel tambang selama berjam-jam, sementara <code>@wiki_master99</code> dengan cerdik melihat koneksi ekonomi global.</p>

<h2>Tantangan Minggu Depan</h2>
<p>Apakah kamu bisa mengalahkan rekor? Tantangan minggu depan akan diposting di halaman Beranda. Pastikan kamu selalu mengasah insting navigasimu dan bersiaplah untuk masuk ke Leaderboard!</p>
    `.trim(),
  },
  {
    slug: "leaderboard-bulanan-raja-wikirace",
    title: "Leaderboard Bulanan: Siapa Raja WikiRace Indonesia Bulan Ini?",
    summary: "Pengumuman pemenang dan pemain paling aktif dalam mode Solo dan Multiplayer di bulan ini.",
    category: "Komunitas",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "3 menit",
    content: `
<p>Bulan yang luar biasa untuk komunitas WikiRace Indonesia! Kami telah merekap ribuan pertandingan yang terjadi selama 30 hari terakhir, dan kompetisinya sangat ketat.</p>

<h2>Pemain Tercepat (Multiplayer)</h2>
<p>Posisi pertama diraih oleh <strong>FlashClicker</strong> dengan rata-rata waktu penyelesaian hanya 42 detik per ronde! Kecepatan membaca dan akurasi kliknya sangat luar biasa.</p>

<h2>Penyelesaian Paling Efisien (Solo)</h2>
<p>Untuk kategori Solo (jumlah klik tersedikit), <strong>PathfinderID</strong> kembali memegang tahta. Rata-rata ia hanya membutuhkan 4.1 klik untuk menyelesaikan tantangan harian sepanjang bulan ini.</p>
<p>Selamat kepada para pemenang! Terus mainkan game ini, tingkatkan ranking kamu, dan raih posisi puncak di bulan berikutnya.</p>
    `.trim(),
  },
  {
    slug: "cerita-di-balik-layar-membangun-wikirace",
    title: "Cerita di Balik Layar: Membangun WikiRace Indonesia dari Nol",
    summary: "Sejarah singkat dan proses development platform WikiRace pertama yang dikhususkan untuk bahasa Indonesia.",
    category: "Edukasi",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "5 menit",
    content: `
<p>Pernahkah kamu penasaran bagaimana platform WikiRace Indonesia ini dibuat? Semuanya berawal dari proyek iseng akhir pekan yang berujung menjadi wadah bagi ribuan pemain.</p>

<h2>Inspirasi Awal</h2>
<p>Kami menyadari bahwa meskipun ada beberapa situs WikiRace internasional, hampir tidak ada yang dioptimasi khusus untuk Wikipedia Bahasa Indonesia. Tantangannya beda, karena jumlah dan struktur artikelnya tidak sama persis dengan Wikipedia bahasa Inggris.</p>

<h2>Arsitektur Teknis</h2>
<p>Situs ini dibangun menggunakan teknologi modern: <strong>Next.js App Router</strong> untuk kecepatan loading maksimal, dipadukan dengan <strong>Turso (SQLite)</strong> untuk menyimpan data pemain dan <em>leaderboard</em> dengan sangat responsif.</p>
<p>Tantangan terbesar kami adalah memproses ribuan artikel Wikipedia secara *real-time* tanpa membuat server lambat. Oleh karena itu, permainan ini memanfaatkan API resmi Wikipedia dengan teknik <em>client-side fetching</em>, yang berarti game ini sangat ringan di server kami namun sangat responsif bagi pemain.</p>
<p>Terima kasih kepada semua pemain yang telah mendukung proyek ini sejak awal!</p>
    `.trim(),
  },
  {
    slug: "update-fitur-baru-wikirace-indonesia",
    title: "Update Fitur Baru di WikiRace Indonesia — Apa yang Berubah?",
    summary: "Catatan rilis (patch notes) terbaru: mode baru, perbaikan bug, dan optimasi performa UI.",
    category: "Komunitas",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 menit",
    content: `
<p>Kami terus mendengar masukan dari komunitas. Di pembaruan v1.2 ini, kami membawa sejumlah peningkatan kualitas hidup (QoL) dan fitur baru yang ditunggu-tunggu.</p>

<h2>1. Mode UI "Mobile Wikipedia"</h2>
<p>Kini, jika kamu bermain di perangkat *mobile* (smartphone), tampilan artikel di dalam arena balap akan otomatis menyesuaikan menjadi gaya <em>Mobile Wikipedia</em>. Gambar akan berada di tengah, tidak ada lagi tabel yang merusak layout, dan font lebih nyaman dibaca!</p>

<h2>2. Animasi & Feedback Klik</h2>
<p>Banyak yang bingung apakah klik mereka sudah terdaftar saat koneksi lambat. Kami telah menambahkan indikator <em>loading</em> ringan saat kamu mengklik tautan, sehingga kamu tahu halaman sedang dimuat.</p>

<h2>3. Optimalisasi Leaderboard</h2>
<p>Leaderboard kini dimuat 3x lebih cepat berkat implementasi caching baru di database kami.</p>
<p>Terus sampaikan feedback kalian via halaman Contact atau Discord komunitas!</p>
    `.trim(),
  },
  {
    slug: "highlight-match-paling-epik",
    title: "Highlight Match Paling Epik dari Komunitas Minggu Ini",
    summary: "Ulasan pertandingan multiplayer paling dramatis dan *comeback* tak terduga.",
    category: "Komunitas",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 menit",
    content: `
<p>Dalam pertandingan *room private* akhir pekan lalu, terjadi salah satu balapan paling dramatis yang pernah terekam di server kami.</p>

<h2>Kisah Comeback Sang Underdog</h2>
<p>Di pertandingan final turnamen komunitas, rutenya adalah: <strong>Rendang -> Lubang Hitam</strong>.</p>
<p>Pemain A memimpin dengan cepat melompat dari Rendang -> Sumatera Barat -> Astronomi. Namun, ia terjebak di artikel Astronomi yang terlalu luas dan salah mengklik artikel tentang Sejarah Teleskop.</p>
<p>Sementara itu, Pemain B yang tertinggal jauh dan sempat nyasar ke artikel "Masakan Padang", tiba-time menyadari jalan pintas epik: Masakan Padang -> Daftar Budaya -> Fisika Modern -> Lubang Hitam. Pemain B menyalip di detik-detik terakhir dan menang dengan selisih waktu hanya 1.2 detik!</p>
<p>Keseruan seperti inilah yang membuat WikiRace tak pernah usang. Apakah kamu punya momen epik? Bagikan dengan kami!</p>
    `.trim(),
  }
];
