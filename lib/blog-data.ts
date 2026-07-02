/** Struktur data artikel blog WikiRace Indonesia. */
export interface BlogArticle {
  slug: string;
  title: string;
  summary: string;
  /** Konten artikel dalam format HTML. */
  content: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  language?: "id" | "en";
}

/**
 * Daftar semua artikel blog.
 * Konten disimpan sebagai data statis untuk performa SSG maksimal.
 */
const articles: BlogArticle[] = [
  {
    slug: "apa-itu-wikirace",
    title: "Apa Itu WikiRace? Panduan Lengkap untuk Pemula",
    summary:
      "Penjelasan lengkap tentang permainan WikiRace — aturan, cara bermain, dan kenapa game balapan Wikipedia ini bisa bikin ketagihan.",
    category: "Panduan",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "5 menit",
    language: "id",
    content: `
<p>Pernah dengar istilah "WikiRace"? Kalau belum, kamu baru saja menemukan salah satu permainan paling sederhana sekaligus paling adiktif yang lahir dari internet: balapan berpindah antar-artikel Wikipedia.</p>

<h2>Definisi Singkat</h2>
<p>WikiRace adalah permainan di mana pemain diberikan dua artikel Wikipedia — satu sebagai <strong>titik awal</strong> dan satu sebagai <strong>titik tujuan</strong>. Aturannya sederhana: kamu hanya boleh berpindah halaman dengan mengklik tautan biru yang ada di dalam teks artikel, tanpa menggunakan fitur pencarian atau mengetik URL langsung. Pemenangnya adalah yang berhasil mencapai artikel tujuan paling cepat, atau dengan jumlah klik paling sedikit.</p>
<p>Kedengarannya sepele? Coba saja. Butuh berapa langkah untuk sampai dari artikel "Kucing" ke artikel "Perang Dunia II"? Di situlah letak serunya — otak kita dipaksa berpikir cepat, mengenali pola, dan menebak koneksi tersembunyi antar-topik yang kelihatannya tidak berhubungan sama sekali.</p>

<h2>Dari Mana Asalnya WikiRace?</h2>
<p>Permainan ini awalnya muncul secara organik di kalangan mahasiswa dan pengguna internet yang iseng mengeksplorasi Wikipedia di sela waktu senggang, jauh sebelum ada platform khusus untuk memainkannya. Karena sifatnya yang sederhana — cukup membuka dua tab Wikipedia — permainan ini menyebar dari mulut ke mulut, forum, hingga akhirnya menjadi genre permainan browser tersendiri dengan berbagai platform khusus di seluruh dunia.</p>

<h2>Kenapa WikiRace Menarik?</h2>
<p>Ada beberapa alasan kenapa permainan sesederhana ini bisa membuat orang ketagihan:</p>
<p><strong>1. Menguji pengetahuan umum secara natural</strong></p>
<p>Tidak ada soal pilihan ganda atau pertanyaan trivia langsung. Pengetahuanmu diuji lewat cara yang lebih organik — seberapa baik kamu mengenali hubungan antar-topik.</p>
<p><strong>2. Melatih kecepatan berpikir</strong></p>
<p>Setiap detik berharga. Kamu harus cepat memindai artikel, mengenali tautan mana yang paling potensial membawamu lebih dekat ke tujuan, dan mengambil keputusan dalam hitungan detik.</p>
<p><strong>3. Selalu berbeda setiap kali main</strong></p>
<p>Dengan jutaan artikel Wikipedia yang bisa jadi titik awal atau tujuan, kombinasi permainan nyaris tidak terbatas. Tidak akan ada dua ronde yang benar-benar sama.</p>
<p><strong>4. Bisa dimainkan sendiri atau rame-rame</strong></p>
<p>Cocok untuk mengisi waktu luang sendirian, atau dijadikan kompetisi seru bareng teman untuk lihat siapa yang paling jago.</p>

<h2>Bagaimana Cara Bermain di WikiRace Indonesia?</h2>
<p>Di WikiRace Indonesia, kamu bisa langsung mencoba permainan ini dengan antarmuka berbahasa Indonesia, tanpa perlu ribet buka banyak tab manual. Sistem akan memberikan artikel awal dan tujuan secara acak (atau sesuai tantangan tertentu), lalu mencatat waktu dan jumlah langkahmu secara otomatis.</p>
<p>Untuk panduan langkah demi langkah cara bermain, kamu bisa cek <a href="/guide">halaman panduan lengkap kami</a>.</p>

<h2>Tips Singkat Sebelum Mulai</h2>
<ul>
<li>Baca judul dan paragraf pembuka artikel dengan cepat — biasanya tautan-tautan penting ada di sana.</li>
<li>Artikel dengan topik luas (negara, tahun, konsep umum) sering jadi "jalan pintas" karena punya banyak tautan keluar.</li>
<li>Jangan panik kalau nyasar — kembali (back) masih dihitung sebagai bagian dari strategi, bukan kegagalan.</li>
</ul>
<p>Penasaran ingin coba? Langsung mainkan <a href="/">WikiRace Indonesia</a> dan rasakan sendiri serunya balapan Wikipedia ala Indonesia.</p>
    `.trim(),
  },
  {
    slug: "5-strategi-menang-wikirace",
    title: "5 Strategi Jitu Menang WikiRace: Cara Berpikir Seperti Pemain Pro",
    summary:
      "Pelajari lima strategi yang dipakai pemain berpengalaman untuk konsisten menang di WikiRace, dari mengenali halaman hub hingga berpikir mundur dari tujuan.",
    category: "Strategi",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "6 menit",
    language: "id",
    content: `
<p>Kalau kamu sudah beberapa kali main WikiRace dan merasa masih sering nyasar atau kelamaan menyelesaikan ronde, tenang — ini bukan soal keberuntungan semata. Ada pola pikir dan strategi tertentu yang dipakai pemain berpengalaman untuk konsisten menang cepat. Berikut lima di antaranya.</p>

<h2>1. Kenali "Halaman Hub" — Jalan Pintas Tersembunyi</h2>
<p>Beberapa artikel Wikipedia punya jauh lebih banyak tautan keluar dibanding artikel lain. Artikel tentang <strong>negara</strong>, <strong>tahun tertentu</strong>, <strong>konsep sains dasar</strong>, atau <strong>tokoh sejarah besar</strong> biasanya punya puluhan hingga ratusan tautan ke topik lain.</p>
<p>Kalau kamu merasa buntu di sebuah artikel yang tautannya terbatas, coba cari tautan menuju salah satu "halaman hub" ini dulu. Dari sana, peluangmu untuk menemukan jalan ke tujuan akan jauh lebih besar.</p>

<h2>2. Baca Paragraf Pembuka Lebih Dulu</h2>
<p>Paragraf pertama sebuah artikel Wikipedia biasanya berisi ringkasan paling penting — termasuk kategori besar, konteks waktu, dan hubungan utama topik tersebut dengan hal lain. Alih-alih scroll panjang mencari tautan secara acak, biasakan memindai paragraf pembuka dulu. Sering kali, jalan tercepat sudah ada di sana.</p>

<h2>3. Berpikir Mundur dari Tujuan</h2>
<p>Salah satu trik yang jarang disadari pemula: jangan cuma berpikir "dari sini saya bisa ke mana", tapi juga "menuju tujuan saya, kira-kira topik apa yang biasanya terhubung ke sana?"</p>
<p>Misalnya kalau tujuanmu adalah artikel tentang sebuah negara, kamu tahu bahwa hampir semua topik geografi, sejarah perang, atau tokoh terkenal biasanya punya tautan balik ke artikel negara. Ini membantumu mengarahkan langkah lebih strategis, bukan cuma asal klik maju.</p>

<h2>4. Jangan Takut "Mundur"</h2>
<p>Banyak pemain baru merasa harus terus maju meski sudah salah arah. Padahal, menyadari kesalahan lebih cepat dan kembali ke halaman sebelumnya jauh lebih efisien dibanding memaksakan diri dari jalur yang salah. Pemain berpengalaman biasanya punya "batas toleransi" — kalau dalam 2-3 klik tidak ada progres, mereka langsung mundur dan coba jalur lain.</p>

<h2>5. Latihan Bikin Insting Makin Tajam</h2>
<p>Ini mungkin terdengar klise, tapi memang terbukti — semakin sering main, semakin cepat otakmu mengenali pola. Kamu akan mulai hafal artikel-artikel mana yang sering jadi jalan pintas, kategori topik mana yang biasanya saling terhubung, dan bagaimana Wikipedia "berpikir" dalam menyusun tautan antar-artikel.</p>

<h2>Bonus: Kesalahan yang Sering Bikin Kalah</h2>
<ul>
<li><strong>Terlalu lama membaca detail</strong> — ingat, kamu tidak sedang belajar untuk ujian, kamu sedang mencari jalan tercepat.</li>
<li><strong>Mengabaikan tautan di infobox</strong> — kotak informasi di sisi kanan artikel sering menyimpan tautan penting yang terlewat kalau kamu hanya fokus ke isi paragraf.</li>
<li><strong>Panik saat waktu menipis</strong> — justru saat itulah penting untuk tetap tenang dan berpikir sistematis, bukan asal klik.</li>
</ul>
<p>Siap mempraktikkan strategi ini? Coba langsung di <a href="/">WikiRace Indonesia</a> dan lihat seberapa banyak waktu penyelesaianmu bisa dipangkas.</p>
    `.trim(),
  },
  {
    slug: "sejarah-wikiracing",
    title:
      "Sejarah WikiRacing: Dari Iseng Mahasiswa Jadi Genre Permainan Tersendiri",
    summary:
      "Telusuri perjalanan WikiRace dari keisengan mahasiswa di kampus hingga berkembang menjadi genre permainan browser tersendiri yang dimainkan di seluruh dunia.",
    category: "Trivia & Edukasi",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "5 menit",
    language: "id",
    content: `
<p>Setiap permainan besar biasanya punya cerita asal-usul yang sederhana, dan WikiRace tidak terkecuali. Yuk kita telusuri bagaimana permainan yang cuma bermodalkan dua tab browser ini bisa berkembang jadi genre tersendiri.</p>

<h2>Awal Mula: Keisengan di Ruang Kuliah</h2>
<p>Sejak Wikipedia mulai populer di pertengahan 2000-an sebagai sumber referensi cepat, pengguna internet — terutama mahasiswa yang sering membuka Wikipedia untuk tugas — mulai menyadari sesuatu yang menarik: hampir semua artikel, sekilas terlihat tidak berhubungan, ternyata bisa saling terhubung lewat beberapa klik tautan saja.</p>
<p>Dari situ, muncul tantangan iseng: "coba deh, dari artikel ini, bisa nggak sampai ke artikel itu cuma pakai tautan?" Tantangan sederhana ini menyebar dari circle pertemanan ke forum-forum online, dan pelan-pelan berkembang jadi permainan dengan aturan yang lebih terstruktur.</p>

<h2>Dari Forum ke Platform Khusus</h2>
<p>Seiring makin banyak orang memainkannya, muncul kebutuhan untuk membuat pengalaman ini lebih terorganisir — tidak lagi harus manual membuka dua tab dan menghitung sendiri, tapi ada sistem yang mencatat waktu, jumlah klik, dan bisa dimainkan melawan pemain lain secara real-time.</p>
<p>Dari sinilah bermunculan berbagai platform WikiRace di seluruh dunia, masing-masing dengan variasi aturan dan fitur sendiri — ada yang fokus ke mode kompetitif satu lawan satu, ada yang menekankan tantangan harian, dan ada yang lebih santai untuk dimainkan sendiri.</p>

<h2>Kenapa Permainan Ini Bertahan Lama?</h2>
<p>Menariknya, WikiRace tidak pernah benar-benar menjadi tren viral raksasa, tapi juga tidak pernah hilang. Ada beberapa alasan permainan ini tetap punya penggemar setia dari generasi ke generasi:</p>
<ul>
<li><strong>Sangat mudah dipahami</strong> — tidak butuh tutorial panjang, cukup jelaskan aturannya dalam satu kalimat.</li>
<li><strong>Selalu relevan</strong> — karena berbasis Wikipedia, kontennya otomatis mengikuti perkembangan pengetahuan dunia.</li>
<li><strong>Menggabungkan edukasi dan hiburan</strong> — jarang ada permainan yang membuat orang belajar sesuatu yang baru justru saat sedang having fun.</li>
</ul>

<h2>WikiRace di Indonesia</h2>
<p>Meski konsepnya sudah lama ada secara global, versi yang benar-benar dibangun untuk komunitas Indonesia — dengan bahasa Indonesia dan fokus pada artikel Wikipedia berbahasa Indonesia — masih terbilang baru. <a href="/">WikiRace Indonesia</a> hadir untuk mengisi ruang itu, memberikan pengalaman yang lebih relevan dan mudah diakses bagi pemain lokal, tanpa kendala bahasa yang sering jadi penghalang di platform-platform luar negeri.</p>
<p>Permainan yang dulunya cuma iseng-iseng di kalangan kecil kini terus berkembang, dan siapa tahu, kamu adalah bagian dari babak berikutnya dari cerita ini.</p>
    `.trim(),
  },
  {
    slug: "fakta-unik-wikipedia",
    title: "Fakta Unik Seputar Wikipedia yang Mungkin Belum Kamu Tahu",
    summary:
      "Kenali arena WikiRace lebih dalam — dari jumlah artikel Wikipedia Indonesia, fenomena 'Getting to Philosophy', hingga kepadatan tautan yang membuat game ini bisa berjalan.",
    category: "Trivia & Edukasi",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 menit",
    language: "id",
    content: `
<p>Sebelum kamu balapan antar-artikel di WikiRace Indonesia, ada baiknya kenalan dulu sedikit lebih dalam dengan "arena" tempat kamu bermain: Wikipedia itu sendiri. Berikut beberapa fakta menarik yang mungkin belum kamu ketahui.</p>

<h2>1. Wikipedia Bahasa Indonesia Salah Satu yang Terbesar di Asia Tenggara</h2>
<p>Wikipedia bahasa Indonesia adalah salah satu edisi Wikipedia dengan jumlah artikel terbanyak di kawasan Asia Tenggara, terus bertambah setiap harinya berkat kontribusi sukarelawan dari seluruh Indonesia. Setiap kali kamu bermain WikiRace Indonesia, kamu sebenarnya sedang menjelajahi hasil kerja keras ribuan kontributor sukarela ini.</p>

<h2>2. Semua Artikel (Konon) Bisa Nyambung ke "Filosofi"</h2>
<p>Ada fenomena menarik bernama <strong>"Wikipedia: Getting to Philosophy"</strong> — sebuah pengamatan bahwa jika kamu mengklik tautan pertama yang valid pada paragraf pertama sebuah artikel Wikipedia bahasa Inggris berulang kali, kamu pada akhirnya hampir selalu akan sampai ke artikel "Philosophy". Ini terjadi karena struktur penulisan ensiklopedis yang cenderung mendefinisikan istilah dengan kategori yang lebih luas dan mendasar.</p>
<p>Fenomena serupa (meski tidak selalu identik) juga bisa ditemukan polanya di Wikipedia bahasa Indonesia — coba saja sendiri dan lihat ke mana klik pertamamu berulang kali membawamu!</p>

<h2>3. Wikipedia Ditulis dan Disunting Sepenuhnya oleh Sukarelawan</h2>
<p>Tidak ada tim redaksi berbayar khusus yang menulis semua artikel Wikipedia. Semuanya dikerjakan oleh sukarelawan dari seluruh dunia, yang bisa menyunting, menambah, atau memperbaiki artikel kapan saja. Inilah kenapa kamu kadang menemukan artikel yang sangat detail untuk topik yang cukup spesifik — ada seseorang di suatu tempat yang benar-benar peduli dengan topik itu.</p>

<h2>4. Struktur Tautan Wikipedia Sangat Padat</h2>
<p>Rata-rata, satu artikel Wikipedia bisa memiliki puluhan hingga ratusan tautan keluar ke artikel lain. Kepadatan tautan inilah yang membuat permainan seperti WikiRace bisa berjalan — hampir selalu ada jalan untuk berpindah dari satu topik ke topik lain, meski kadang butuh beberapa langkah memutar.</p>

<h2>5. Wikipedia Punya "Artikel Pilihan" dengan Standar Kualitas Tinggi</h2>
<p>Selain artikel biasa, Wikipedia punya kategori "Artikel Pilihan" — artikel yang sudah melalui proses review ketat dari komunitas dan dianggap memenuhi standar kualitas, kelengkapan, dan netralitas tertinggi. Artikel-artikel ini biasanya jadi contoh terbaik bagaimana sebuah topik seharusnya ditulis di Wikipedia.</p>

<h2>Kenapa Fakta Ini Penting Buat Pemain WikiRace?</h2>
<p>Memahami bagaimana Wikipedia "berpikir" — soal struktur tautan, cara artikel saling terhubung, dan pola penulisannya — bisa jadi keuntungan tersendiri saat bermain. Semakin kamu paham "logika" di balik ensiklopedia ini, semakin tajam pula insting navigasimu saat balapan.</p>
<p>Sudah siap menguji pemahamanmu? Yuk main <a href="/">WikiRace Indonesia</a> sekarang.</p>
    `.trim(),
  },
  {
    slug: "manfaat-main-wikirace",
    title: "Manfaat Main WikiRace: Lebih dari Sekadar Hiburan",
    summary:
      "Ternyata main WikiRace bukan cuma seru — ada manfaat kognitif nyata seperti melatih kecepatan baca, memperluas wawasan, dan mengasah pengambilan keputusan.",
    category: "Edukasi",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 menit",
    language: "id",
    content: `
<p>Sekilas, WikiRace mungkin terlihat cuma permainan iseng untuk mengisi waktu luang. Tapi kalau ditelusuri lebih dalam, ada beberapa manfaat nyata yang bisa kamu dapat dari kebiasaan bermain WikiRace secara rutin.</p>

<h2>1. Melatih Kecepatan Membaca dan Memindai Informasi (Skimming)</h2>
<p>Saat bermain WikiRace, kamu tidak sempat membaca artikel kata demi kata. Kamu dipaksa untuk memindai teks dengan cepat, menangkap poin-poin penting, dan mengenali tautan relevan dalam hitungan detik. Kebiasaan ini, kalau dilatih terus-menerus, bisa terbawa ke aktivitas lain — seperti membaca materi kuliah, dokumen kerja, atau artikel berita — dengan lebih efisien.</p>

<h2>2. Memperluas Wawasan Tanpa Sadar</h2>
<p>Karena setiap ronde membawamu melewati berbagai topik yang tidak terduga — dari sejarah, sains, tokoh, geografi, hingga budaya pop — kamu secara tidak langsung terpapar informasi baru yang mungkin tidak pernah kamu cari sendiri. Ini adalah bentuk belajar insidental yang menyenangkan, jauh dari kesan menggurui.</p>

<h2>3. Mengasah Kemampuan Berpikir Asosiatif</h2>
<p>WikiRace pada dasarnya melatih otak untuk melihat hubungan antar-konsep yang kelihatannya tidak berkaitan. Kemampuan ini — yang dalam psikologi kognitif sering disebut <em>associative thinking</em> — sangat berguna dalam banyak konteks, mulai dari brainstorming kreatif, problem-solving, hingga membuat koneksi antar-ide dalam pekerjaan maupun studi.</p>

<h2>4. Melatih Pengambilan Keputusan di Bawah Tekanan</h2>
<p>Setiap detik di WikiRace berarti kamu harus terus mengambil keputusan cepat — tautan mana yang diklik, kapan harus mundur, kapan harus mencoba jalur berbeda. Ini adalah simulasi ringan dari pengambilan keputusan di bawah tekanan waktu, sebuah skill yang berguna jauh di luar konteks permainan.</p>

<h2>5. Hiburan yang Sekaligus Produktif</h2>
<p>Berbeda dengan banyak game kasual yang cenderung pasif secara kognitif, WikiRace membuat otakmu tetap aktif bekerja selama bermain. Kalau kamu mencari cara mengisi waktu senggang yang tetap terasa "bermanfaat", ini salah satu pilihan yang pas.</p>

<h2>6. Cocok untuk Melatih Kerja Sama dan Kompetisi Sehat</h2>
<p>Dalam mode multiplayer, WikiRace juga jadi sarana seru untuk kompetisi sehat bersama teman — melihat siapa yang paling cepat berpikir, sambil tetap santai karena sifatnya yang casual dan tidak terlalu serius.</p>

<h2>Kesimpulan</h2>
<p>Di balik kesederhanaannya, WikiRace menyimpan banyak manfaat kognitif yang sering tidak disadari pemainnya. Jadi, lain kali kamu main <a href="/">WikiRace Indonesia</a>, anggap saja itu bukan cuma buang-buang waktu — tapi juga latihan ringan untuk otakmu.</p>
<p>Yuk coba sendiri dan rasakan manfaatnya di <a href="/">WikiRace Indonesia</a>.</p>
    `.trim(),
  },
];

import { artikelStrategi } from "./articles-strategi";
import { artikelTrivia } from "./articles-trivia";
import { artikelKomunitas } from "./articles-komunitas";
import { artikelUmum } from "./articles-umum";

import { artikelMainEn } from "./articles-main-en";
import { artikelStrategiEn } from "./articles-strategi-en";
import { artikelTriviaEn } from "./articles-trivia-en";
import { artikelKomunitasEn } from "./articles-komunitas-en";
import { artikelUmumEn } from "./articles-umum-en";

const allArticlesData: BlogArticle[] = [
  ...articles,
  ...artikelStrategi,
  ...artikelTrivia,
  ...artikelKomunitas,
  ...artikelUmum,
  ...artikelMainEn,
  ...artikelStrategiEn,
  ...artikelTriviaEn,
  ...artikelKomunitasEn,
  ...artikelUmumEn,
];

/** Ambil semua artikel, diurutkan berdasarkan tanggal publish terbaru. */
export function getAllArticles(): BlogArticle[] {
  return [...allArticlesData].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Ambil satu artikel berdasarkan slug. */
export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return allArticlesData.find((a) => a.slug === slug);
}

/** Ambil semua slug (untuk generateStaticParams). */
export function getArticleSlugs(): string[] {
  return allArticlesData.map((a) => a.slug);
}

/** Ambil artikel berdasarkan kategori. */
export function getArticlesByCategory(category: string): BlogArticle[] {
  return allArticlesData.filter(
    (a) => a.category.toLowerCase() === category.toLowerCase()
  );
}

/** Ambil semua kategori unik. */
export function getCategories(): string[] {
  return [...new Set(allArticlesData.map((a) => a.category))];
}
