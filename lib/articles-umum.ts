import { BlogArticle } from "./blog-data";

export const artikelUmum: BlogArticle[] = [
  {
    slug: "faq-lengkap-semua-pertanyaan-wikirace",
    title: "FAQ Lengkap: Semua Pertanyaan soal WikiRace Indonesia Dijawab",
    summary: "Kumpulan jawaban atas pertanyaan yang paling sering diajukan oleh pemain baru maupun veteran.",
    category: "Panduan",
    author: "Tim WikiRace Indonesia",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "5 menit",
    content: `
<p>Masih bingung dengan beberapa hal di WikiRace Indonesia? Jangan khawatir, kami telah mengumpulkan pertanyaan yang paling sering diajukan oleh komunitas.</p>

<h2>Q: Apakah main WikiRace Indonesia gratis?</h2>
<p><strong>A:</strong> 100% Gratis selamanya! Kamu tidak perlu membayar apapun untuk bermain. Namun, jika kamu ingin mendukung biaya server kami, fitur Donasi via Saweria selalu terbuka.</p>

<h2>Q: Kenapa saat saya klik tautan tertentu tidak terjadi apa-apa?</h2>
<p><strong>A:</strong> WikiRace hanya mengizinkan kamu mengklik <em>internal link</em> Wikipedia (tautan biru biasa). Tautan eksternal, tautan gambar, atau tautan "Edit" tidak akan berfungsi. Selain itu, pastikan koneksi internetmu stabil.</p>

<h2>Q: Apakah saya bisa main di HP?</h2>
<p><strong>A:</strong> Sangat bisa! Kami telah mendesain antarmuka yang sangat responsif untuk pengguna mobile. Bahkan, tampilan artikelnya disesuaikan menyerupai Wikipedia versi seluler agar pengalaman bermainmu nyaman.</p>

<h2>Q: Mengapa artikel awal dan akhir kadang sangat tidak nyambung?</h2>
<p><strong>A:</strong> Itulah seninya! Sistem kami seringkali mengacak artikel agar tingkat kesulitannya menantang. Tapi tenang saja, menurut hukum <em>Six Degrees of Wikipedia</em>, hampir setiap artikel bisa dihubungkan ke artikel manapun dalam kurang dari 6 klik.</p>

<h2>Q: Bagaimana cara melaporkan bug atau masalah?</h2>
<p><strong>A:</strong> Kamu bisa menuju ke halaman <a href="/contact">Hubungi Kami</a> dan mengisi formulir yang ada. Tim kami akan segera menindaklanjutinya.</p>
<p>Selamat bermain, dan semoga insting navigasimu semakin tajam!</p>
    `.trim(),
  }
];
