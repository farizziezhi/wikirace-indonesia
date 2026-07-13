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
    author: "Muhammad Farizzi",
    publishedAt: "2026-06-12",
    updatedAt: "2026-06-12",
    readingTime: "5 menit",
    language: "id",
    content: `
<p>Pernahkah kamu membayangkan bahwa ensiklopedia digital terbesar di dunia, Wikipedia, bukan sekadar tempat mencari tugas sekolah atau riset sejarah, melainkan sebuah sirkuit balapan raksasa? Selamat datang di dunia <strong>WikiRace</strong>, salah satu fenomena permainan internet paling sederhana namun paling adiktif yang pernah diciptakan.</p>

<p>Bagi banyak orang, internet adalah tempat untuk bersantai. Namun bagi para pemain WikiRace, Wikipedia adalah medan pertempuran kecerdasan, kecepatan membaca, dan ketangkasan berlogika. Mari kita bedah apa sebenarnya game balapan Wikipedia ini, mengapa ia bisa membuat ribuan orang ketagihan, dan bagaimana kamu bisa mulai memainkannya sekarang juga.</p>

<h2>Apa Itu WikiRace? (Definisi & Aturan Main)</h2>
<p>Secara sederhana, <strong>WikiRace</strong> (juga sering disebut WikiWars atau Wikipedia Maze) adalah permainan perlombaan berpindah dari satu artikel Wikipedia ke artikel Wikipedia lainnya yang sama sekali tidak berhubungan, hanya dengan menggunakan tautan (hyperlink) biru yang ada di dalam teks.</p>
<p>Pemain akan diberikan dua titik: <strong>Titik Awal (Start)</strong> dan <strong>Titik Tujuan (Finish)</strong>. Aturan emas dalam permainan ini sangat ketat namun simpel:</p>
<ul>
  <li>Kamu hanya boleh mengklik tautan internal berwarna biru di dalam artikel.</li>
  <li><strong>DILARANG KERAS</strong> menggunakan fitur pencarian (Search bar) bawaan Wikipedia.</li>
  <li><strong>DILARANG</strong> mengetik URL langsung di address bar browser.</li>
  <li><strong>DILARANG</strong> menggunakan tombol <em>Back</em> di browser (meski beberapa variasi game mengizinkannya sebagai hukuman penalti waktu).</li>
</ul>
<p>Pemenangnya adalah pemain yang berhasil mencapai artikel tujuan dengan waktu tercepat (Speedrun) atau jumlah klik paling sedikit (Least Clicks).</p>

<h2>Contoh Rute Ekstrem: Dari "Kucing" ke "Perang Dunia II"</h2>
<p>Kedengarannya mudah? Coba kita buat simulasi. Bayangkan titik awalmu adalah artikel tentang <strong>"Kucing"</strong> dan tujuanmu adalah <strong>"Perang Dunia II"</strong>. Bagaimana cara menghubungkan hewan peliharaan berbulu dengan konflik militer global?</p>
<p>Seorang pemain pemula mungkin akan tersesat ke artikel tentang <em>Ras Kucing</em>, lalu ke <em>Makanan Kucing</em>, dan berputar-putar di topik biologi. Namun, pemain WikiRace yang cerdik akan menggunakan logika "berpikir mundur" dan mencari jalur penghubung (hub):</p>
<ol>
  <li>Dari artikel <strong>Kucing</strong>, mereka mencari tautan sejarah, misalnya "Mesir Kuno" (karena kucing dipuja di sana).</li>
  <li>Dari <strong>Mesir Kuno</strong>, mereka mengklik tautan ke wilayah "Eropa" atau "Kekaisaran Romawi".</li>
  <li>Dari artikel sejarah Eropa, sangat mudah menemukan tautan yang menuju ke "Abad ke-20" atau langsung ke <strong>"Perang Dunia II"</strong>.</li>
</ol>
<p>Hanya dalam 3 atau 4 klik, dua topik yang tampak tak memiliki benang merah berhasil dihubungkan! Di sinilah letak ledakan adrenalin dari permainan ini.</p>

<h2>Teori "Enam Derajat Pemisahan" (Six Degrees of Separation)</h2>
<p>Mengapa permainan ini selalu bisa diselesaikan? Jawabannya ada pada teori jaringan. Ada sebuah konsep terkenal bernama <em>Six Degrees of Separation</em> (Enam Derajat Pemisahan) yang menyatakan bahwa semua orang di dunia ini terhubung satu sama lain melalui maksimal enam perantara. </p>
<p>Wikipedia, dengan miliaran tautannya, adalah perwujudan digital paling sempurna dari teori ini. Hampir tidak ada artikel di Wikipedia yang benar-benar terisolasi. Melalui tautan-tautan negara, tahun, tokoh sejarah, atau bidang ilmu yang sangat luas, kamu bisa menghubungkan artikel tentang <em>SpongeBob SquarePants</em> dengan artikel tentang <em>Fisika Kuantum</em> dalam kurang dari 6 klik jika kamu tahu jalurnya.</p>

<h2>Mengapa Game Balapan Wikipedia Ini Sangat Adiktif?</h2>
<p>Tidak ada grafis 3D mewah, tidak ada sistem <em>leveling</em> karakter, tidak ada <em>gacha</em>. Lalu kenapa WikiRace sangat digemari?</p>

<h3>1. Menguji Pengetahuan Umum Secara Organik</h3>
<p>WikiRace tidak menyuguhkan soal pilihan ganda seperti game trivia biasa. Pengetahuanmu diuji melalui seberapa baik kamu memahami kategorisasi dunia. Jika kamu tahu bahwa <em>Padi</em> adalah tanaman yang berasal dari <em>Asia</em>, kamu bisa menggunakan benua Asia sebagai batu loncatan menuju artikel lain. Ini adalah bentuk tes pengetahuan umum yang jauh lebih natural.</p>

<h3>2. Melatih Kecepatan Membaca (Skimming) & Fokus</h3>
<p>Dalam balapan, kamu tidak punya waktu membaca detail sejarah seorang tokoh. Matamu dipaksa memindai paragraf (skimming) hanya untuk mencari kata dengan warna biru. Otak akan berlatih menyaring informasi yang tidak relevan dengan kecepatan tinggi.</p>

<h3>3. Sensasi Kemenangan yang Murni</h3>
<p>Menemukan tautan ke artikel tujuan yang tersembunyi di paragraf ketiga setelah kebingungan selama dua menit memberikan kepuasan yang luar biasa. Rasanya seperti memecahkan teka-teki labirin, namun labirin ini terbuat dari sejarah umat manusia.</p>

<h2>Cara Bermain di WikiRace Indonesia</h2>
<p>Kini, kamu tidak perlu repot-repot membuka dua tab Wikipedia secara manual. Di platform <strong>WikiRace Indonesia</strong>, kami telah merancang sistem otomatis yang akan memberimu artikel awal dan akhir berbahasa Indonesia, menghitung waktu, serta melacak setiap klikmu.</p>
<p>Kamu bisa menantang diri sendiri dalam mode Solo, atau membuat <em>Room Private</em> untuk balapan langsung melawan teman-temanmu. Sistem kami menggunakan antarmuka yang sangat bersih dan berfokus pada konten Wikipedia itu sendiri, sehingga kamu bisa sepenuhnya berkonsentrasi pada strategi memenangkan balapan.</p>

<blockquote>
<p><strong>Tips Ekstra:</strong> Sebelum mulai, pastikan kamu selalu membaca paragraf pertama artikel dengan teliti. Paragraf pembuka Wikipedia adalah tempat berkumpulnya tautan-tautan "super" yang bisa membawamu ke topik-topik raksasa!</p>
</blockquote>

<p>Apakah kamu siap menguji seberapa luas wawasanmu? Jangan cuma membaca artikel ini, buktikan kecepatanmu sekarang juga di <a href="/">WikiRace Indonesia</a>. Selamat tersesat di labirin pengetahuan!</p>
    `.trim(),
  },
  {
    slug: "5-strategi-menang-wikirace",
    title: "5 Strategi Jitu Menang WikiRace: Cara Berpikir Seperti Pemain Pro",
    summary:
      "Pelajari lima strategi yang dipakai pemain berpengalaman untuk konsisten menang di WikiRace, dari mengenali halaman hub hingga berpikir mundur dari tujuan.",
    category: "Strategi",
    author: "Ahmad Zaki",
    publishedAt: "2026-06-16",
    updatedAt: "2026-06-17",
    readingTime: "8 menit",
    language: "id",
    content: `
<p>Apakah kamu sudah mencoba bermain WikiRace namun sering frustrasi karena menghabiskan puluhan klik dan waktu berlarut-larut tanpa pernah menemukan artikel tujuan? Atau mungkin kamu sering kalah telak saat balapan melawan temanmu di mode multiplayer?</p>

<p>Tenang saja, memenangkan WikiRace bukanlah masalah IQ atau seberapa banyak kamu menghafal isi ensiklopedia. Ini murni soal <strong>metode, observasi, dan kemampuan mengenali pola</strong>. Para pemain WikiRace veteran (pro) tidak membaca artikel—mereka memindai struktur jaringan informasi. Jika kamu ingin memangkas waktu penyelesaianmu secara drastis, terapkan 5 strategi jitu berikut ini.</p>

<h2>1. Kuasai Seni Mengenali "Halaman Hub" (Jalan Tol Wikipedia)</h2>
<p>Kesalahan terbesar pemula adalah mengklik tautan yang membawa mereka ke topik yang lebih spesifik. Jika kamu ingin pergi dari "Kopi" ke "Teleskop", jangan mengklik "Biji Kopi" atau "Kafein". Kamu akan terjebak di <em>rabbit hole</em> botani dan kimia.</p>
<p>Pemain pro selalu mengincar <strong>Halaman Hub</strong>. Ini adalah artikel raksasa yang memiliki ribuan tautan keluar ke berbagai disiplin ilmu. Beberapa contoh Halaman Hub paling kuat di Wikipedia adalah:</p>
<ul>
  <li><strong>Nama Negara Besar:</strong> Amerika Serikat, Indonesia, Inggris, Tiongkok. Negara-negara ini memiliki tautan ke sejarah, geografi, politik, tokoh terkenal, teknologi, hingga budaya pop.</li>
  <li><strong>Artikel Tahun/Abad:</strong> "Abad ke-20", "1995", "Perang Dingin". Tahun dan era bersejarah menghubungkan penemuan fiksi, perang, ilmuwan, dan lahirnya selebriti.</li>
  <li><strong>Disiplin Ilmu Utama:</strong> Fisika, Biologi, Sejarah, atau Ekonomi.</li>
</ul>
<p><strong>Aturan Emas:</strong> Jika kamu merasa buntu, selalu cari jalan keluar menuju salah satu Halaman Hub ini terlebih dahulu. Dari sana, seluruh penjuru Wikipedia terbuka lebar.</p>

<h2>2. Selalu Berpikir Mundur (Reverse Engineering)</h2>
<p>Jangan hanya bertanya, <em>"Dari artikel saat ini, saya bisa mengklik apa?"</em>. Pemain pro yang cerdas selalu memulai ronde dengan bertanya, <em>"Kira-kira, artikel apa saja yang biasanya menyertakan tautan menuju artikel tujuan saya?"</em></p>
<p>Sebagai contoh, jika artikel tujuanmu adalah <strong>Albert Einstein</strong>, kamu harus berpikir mundur. Artikel apa yang memiliki link ke Einstein? Mungkin artikel tentang <em>Fisika, Relativitas, Pemenang Hadiah Nobel, Jerman,</em> atau <em>Amerika Serikat</em>.</p>
<p>Dengan menetapkan target-target antara (milestones) ini di kepalamu, kamu tidak akan asal klik. Kamu akan memandu navigasimu dari artikel acak mana pun, menuju "Jerman" atau "Fisika", karena kamu tahu kedua artikel itu pasti memiliki jalan masuk langsung ke Einstein.</p>

<h2>3. Prioritaskan Membaca Paragraf Pembuka dan Infobox</h2>
<p>Ketika halaman Wikipedia baru saja dimuat, jangan langsung men-scroll ke bawah secara membabi buta. Mengapa? Karena standar penulisan ensiklopedia mengharuskan <strong>paragraf pembuka (lead paragraph)</strong> berisi ringkasan paling padat tentang subjek tersebut.</p>
<p>Paragraf pertama pasti mengandung definisi, klasifikasi luas, sejarah pembentukan, dan geografi. Ini adalah tempat di mana tautan Halaman Hub paling banyak berkumpul.</p>
<p>Selain paragraf pembuka, perhatikan <strong>Infobox</strong> (kotak informasi di sisi kanan desktop, atau di bagian atas pada tampilan mobile). Infobox berisi tautan terstruktur seperti nama negara asal, genre, atau afiliasi. Seringkali, jalan pintas terbaik bersembunyi rapi di dalam tabel Infobox tersebut.</p>

<h2>4. Latih Mata untuk "Skimming" Berbasis Warna</h2>
<p>Kamu tidak sedang membaca novel. Di WikiRace, kamu sedang memindai layar untuk mencari teks berwarna biru. Latih matamu untuk melompat dari satu tautan biru ke tautan biru lainnya, mengabaikan teks hitam sama sekali.</p>
<p>Jika dalam 5 detik pertama pemindaian kamu tidak menemukan kata kunci yang mengarah ke tujuanmu, segera scroll ke bagian lain yang padat tautan, seperti bagian <em>"Lihat Pula" (See Also)</em> di bagian paling bawah artikel. Bagian ini sering menyimpan koneksi ke topik-topik paralel yang sangat berguna.</p>

<h2>5. Jangan Ragu Menggunakan Tombol "Kembali" (Jika Diizinkan)</h2>
<p>Terkadang, insting kita salah. Kita mengira sebuah tautan akan membawa kita ke jalan yang benar, namun ternyata halaman tersebut sangat pendek dan hampir tidak memiliki tautan keluar (sering disebut sebagai artikel buntu atau <em>Dead End</em>).</p>
<p>Pemain pemula sering memaksakan diri mencari jalan keluar dari artikel buntu tersebut, yang akhirnya memakan belasan klik. Pemain pro memiliki <strong>batas toleransi</strong>. Jika setelah 2 klik mereka merasa semakin menjauh dari tujuan, mereka tidak ragu untuk segera kembali (menggunakan sejarah navigasi dalam game atau tombol <em>back</em> browser, tergantung aturan platform) ke artikel yang sebelumnya lebih menjanjikan.</p>

<h2>Kesimpulan</h2>
<p>Menang di WikiRace bukanlah soal keberuntungan, melainkan eksekusi dari taktik navigasi yang solid. Mulailah dengan mengenali Halaman Hub, pikirkan rute secara terbalik, manfaatkan paragraf pembuka, dan jangan membuang waktu membaca teks hitam.</p>
<p>Semakin sering kamu bermain, insting asosiatifmu akan semakin tajam. Teori sudah di tangan, sekarang waktunya pembuktian! Ajak temanmu dan buktikan siapa yang lebih menguasai labirin ensiklopedia ini di <a href="/">WikiRace Indonesia</a>.</p>
    `.trim(),
  },
  {
    slug: "sejarah-wikiracing",
    title:
      "Sejarah WikiRacing: Dari Iseng Mahasiswa Jadi Genre Permainan Tersendiri",
    summary:
      "Telusuri perjalanan WikiRace dari keisengan mahasiswa di kampus hingga berkembang menjadi genre permainan browser tersendiri yang dimainkan di seluruh dunia.",
    category: "Trivia & Edukasi",
    author: "Budi Hartono",
    publishedAt: "2026-06-20",
    updatedAt: "2026-06-20",
    readingTime: "5 menit",
    language: "id",
    content: `
<p>Bagi generasi yang tumbuh dengan internet di era 2000-an, Wikipedia adalah keajaiban modern. Ribuan hingga jutaan artikel terhubung satu sama lain dalam satu klik. Dari sinilah lahir sebuah permainan organik yang tidak diciptakan oleh perusahaan game raksasa mana pun, melainkan oleh keisengan para mahasiswa yang bosan di ruang kuliah: <strong>WikiRace</strong>.</p>

<p>Mari kita menelusuri lorong waktu dan melihat bagaimana permainan sederhana bermodalkan dua tab browser ini berkembang menjadi genre permainan internet kompetitif yang memiliki platform dan komunitasnya sendiri di seluruh dunia.</p>

<h2>Awal Mula: Keisengan di Era Web 2.0 (Pertengahan 2000-an)</h2>
<p>Sekitar tahun 2005 hingga 2007, Wikipedia mulai mengukuhkan dirinya sebagai sumber referensi utama di internet. Di masa-masa ini, pelajar dan mahasiswa sering menggunakan Wikipedia untuk mencari bahan tugas. Saat berselancar dari satu halaman ke halaman lain, seseorang menyadari pola unik: <em>hampir semua artikel, seberapa pun jauh topiknya, selalu bisa dihubungkan hanya dengan beberapa klik tautan (hyperlink).</em></p>

<p>Fenomena ini melahirkan tantangan informal di asrama-asrama kampus. <em>"Coba buktikan kamu bisa pergi dari halaman 'Sepeda' ke 'Marilyn Monroe' cuma pakai link biru!"</em>. Tidak ada antarmuka khusus, tidak ada penghitung waktu otomatis. Permainan ini murni dilakukan dengan modal kejujuran, membuka dua jendela browser secara bersebelahan, dan menghitung jumlah klik secara manual.</p>

<h2>Evolusi Menjadi Permainan Terstruktur</h2>
<p>Seiring berjalannya waktu, aturan-aturan dasar mulai terbentuk secara alami di dalam komunitas forum internet seperti Reddit dan 4chan. Aturan klasik <strong>"Tidak Boleh Pakai Search Bar"</strong> dan <strong>"Tidak Boleh Pencet Back"</strong> menjadi standar kompetisi.</p>

<p>Pada awal dekade 2010-an, para developer independen mulai membangun platform khusus untuk memfasilitasi balapan ini. Situs web pertama bermunculan dengan fitur otomatisasi: memberikan dua kata acak kepada pemain, melacak waktu, dan menghitung klik (Clicks) secara presisi. Dari sinilah WikiRace berubah dari sekadar <em>"permainan anak kuliahan"</em> menjadi kompetisi speedrun berskala global.</p>

<h2>Munculnya Varian dan Gaya Bermain Baru</h2>
<p>Seiring bertumbuhnya komunitas, WikiRace melahirkan beberapa varian gaya bermain yang lebih menantang:</p>
<ul>
  <li><strong>Speedrun (Waktu Tercepat):</strong> Pemain berlomba mencapai tujuan secepat mungkin, tidak peduli berapa ratus klik yang mereka habiskan.</li>
  <li><strong>Least Clicks (Klik Sedikit):</strong> Waktu tidak menjadi masalah. Pemain yang bisa merencanakan rute paling efisien (misalnya hanya 3 atau 4 klik) adalah pemenangnya. Ini sangat menguras otak karena menuntut pemahaman mendalam tentang teori jaringan <em>Halaman Hub</em>.</li>
  <li><strong>5 Clicks to Jesus:</strong> Varian klasik di mana pemain ditantang untuk memulai dari artikel acak apa pun, dan harus mencapai artikel "Jesus" dalam maksimal lima langkah.</li>
</ul>

<h2>WikiRace di Indonesia: Melokalkan Keseruan</h2>
<p>Meskipun WikiRace sudah populer secara global, bermain menggunakan Wikipedia berbahasa Inggris seringkali menjadi kendala bagi pemain di Indonesia. Struktur tautan (link density) antara Wikipedia Inggris dan Wikipedia Indonesia sangat berbeda. Wikipedia Inggris memiliki lebih dari 6 juta artikel, sementara versi Indonesia berada di kisaran ratusan ribu artikel dengan tata letak tautan yang lebih spesifik pada konteks lokal.</p>

<p>Inilah yang mendasari lahirnya <strong>WikiRace Indonesia</strong>. Platform ini didedikasikan untuk membawa keseruan balapan Wikipedia dengan menggunakan artikel dan bahasa ibu kita sendiri. Dengan platform ini, pemain lokal tidak lagi harus kesulitan menerjemahkan istilah sains dalam bahasa asing, melainkan bisa mengandalkan pengetahuan umum mereka tentang sejarah, tokoh, dan budaya pop Indonesia.</p>

<h2>Warisan yang Terus Bertahan</h2>
<p>Alasan mengapa WikiRace tidak pernah mati, meskipun banyak game online canggih terus bermunculan, adalah karena sifatnya yang <em>timeless</em> (tak lekang oleh waktu). Selama Wikipedia terus diperbarui dengan tokoh baru, kejadian terkini, dan sejarah yang terus ditulis, "peta" permainan WikiRace akan terus berubah dan tidak akan pernah tamat.</p>

<p>Siap untuk menjadi bagian dari sejarah permainan legendaris ini? Uji kemampuanmu dan rasakan sensasi balapannya langsung di <a href="/">WikiRace Indonesia</a>. Jadilah pelari tercepat di labirin pengetahuan terbesar di dunia!</p>
    `.trim(),
  },
  {
    slug: "fakta-unik-wikipedia",
    title: "Fakta Unik Seputar Wikipedia yang Mungkin Belum Kamu Tahu",
    summary:
      "Kenali arena WikiRace lebih dalam — dari jumlah artikel Wikipedia Indonesia, fenomena 'Getting to Philosophy', hingga kepadatan tautan yang membuat game ini bisa berjalan.",
    category: "Trivia & Edukasi",
    author: "Siti Rahma",
    publishedAt: "2026-06-24",
    updatedAt: "2026-06-24",
    readingTime: "6 menit",
    language: "id",
    content: `
<p>Sebelum kamu menancap gas dan memulai balapan antar-artikel di WikiRace Indonesia, ada baiknya kamu berkenalan lebih dalam dengan "sirkuit" tempat kamu bermain: <strong>Wikipedia</strong> itu sendiri. Ensiklopedia daring ini bukan hanya gudang data raksasa, melainkan sebuah ekosistem digital yang memiliki pola dan rahasia unik.</p>

<p>Berikut adalah 5 fakta unik dan mencengangkan seputar Wikipedia yang akan membuatmu melihat situs ini dari sudut pandang yang sama sekali baru.</p>

<h2>1. Fenomena "Getting to Philosophy" (Menuju ke Filsafat)</h2>
<p>Ini adalah salah satu misteri Wikipedia paling terkenal yang sering dijadikan permainan mandiri. Ada sebuah pengamatan tak tertulis yang menyatakan: <strong>Jika kamu mengklik tautan pertama yang valid pada paragraf pertama sebuah artikel Wikipedia berulang kali, kamu hampir selalu akan berakhir di artikel "Filsafat" (Philosophy).</strong></p>
<p>Mengapa ini bisa terjadi? Wikipedia memiliki pedoman gaya penulisan (Manual of Style) yang mengharuskan setiap artikel mendefinisikan subjeknya dengan mengklasifikasikannya ke dalam konsep yang lebih luas. Misalnya:</p>
<ul>
  <li>Artikel <em>Kucing</em> adalah mamalia.</li>
  <li><em>Mamalia</em> adalah bagian dari biologi.</li>
  <li><em>Biologi</em> adalah cabang dari ilmu alam.</li>
  <li><em>Ilmu alam</em> bersumber dari metode ilmiah.</li>
  <li><em>Metode ilmiah</em> berakar pada filsafat.</li>
</ul>
<p>Pada akhirnya, semua pengetahuan manusia bermuara pada pertanyaan-pertanyaan dasar tentang eksistensi, alias filsafat. (Catatan: Fakta ini paling konsisten terjadi di Wikipedia bahasa Inggris, namun pola serupa sering muncul di Wikipedia bahasa Indonesia).</p>

<h2>2. Kepadatan Tautan (Link Density) yang Luar Biasa</h2>
<p>Tahukah kamu bahwa rata-rata satu artikel Wikipedia dapat memiliki puluhan hingga ratusan tautan keluar (outbound links)? Kepadatan inilah yang memungkinkan permainan WikiRace bisa eksis.</p>
<p>Tanpa sistem <em>hyperlinking</em> yang masif ini, pemain akan terjebak di artikel buntu (Dead End). Kontributor Wikipedia (disebut Wikipedian) sangat didorong untuk melakukan "Wikifikasi", yaitu proses menambahkan tautan internal ke kata-kata penting dalam sebuah artikel agar pembaca dapat menjelajahi konteks yang lebih luas tanpa harus membuka mesin pencari.</p>

<h2>3. Wikipedia Ditulis Sepenuhnya oleh Sukarelawan (Tanpa Gaji)</h2>
<p>Banyak orang mengira ada tim redaksi atau profesor bayaran yang duduk seharian di kantor untuk memvalidasi artikel Wikipedia. Kenyataannya, 100% konten Wikipedia ditulis, disunting, dan dijaga oleh komunitas sukarelawan dari seluruh dunia.</p>
<p>Mereka meluangkan waktu berjam-jam untuk meneliti referensi, memperbaiki ejaan, hingga berdebat di halaman "Pembicaraan" (Talk Page) hanya demi memastikan netralitas sebuah informasi. Dedikasi tanpa pamrih inilah yang membuat Wikipedia bertahan sebagai salah satu situs web paling banyak dikunjungi di dunia tanpa menayangkan satu pun iklan komersial.</p>

<h2>4. Wikipedia Bahasa Indonesia Adalah Salah Satu yang Terbesar di Asia Tenggara</h2>
<p>Wikipedia tidak hanya eksis dalam bahasa Inggris. Hingga saat ini, ada lebih dari 300 bahasa yang memiliki versi Wikipedia-nya sendiri. Kebanggaannya, <strong>Wikipedia bahasa Indonesia</strong> adalah salah satu edisi dengan pertumbuhan tercepat dan jumlah artikel terbanyak di kawasan Asia Tenggara.</p>
<p>Setiap harinya, ratusan artikel baru dibuat dan diperbaiki oleh sukarelawan lokal. Kekayaan konten lokal inilah yang membuat pengalaman bermain WikiRace Indonesia menjadi sangat unik—kamu akan lebih sering menemukan jalur yang melibatkan sejarah Nusantara, geografi provinsi di Indonesia, hingga kebudayaan lokal yang tidak akan kamu temukan di versi bahasa Inggris.</p>

<h2>5. Hierarki "Artikel Pilihan" (Featured Articles)</h2>
<p>Tidak semua artikel Wikipedia diciptakan setara. Ada sebuah kasta tertinggi yang disebut <strong>Artikel Pilihan (Featured Articles)</strong>. Ini adalah artikel-artikel yang telah melewati proses ulasan sejawat (peer review) yang sangat ketat oleh para editor senior. Artikel ini dianggap memiliki kualitas penulisan sempurna, referensi yang tak terbantahkan, dan format yang rapi.</p>
<p>Ciri khas artikel ini adalah ikon bintang kecil di sudut kanan atas judul. Jika dalam ronde WikiRace kamu "tersesat" masuk ke halaman Artikel Pilihan, bersiaplah menemukan "Jalan Tol" yang dipenuhi dengan tautan berkualitas tinggi yang bisa membawamu ke berbagai subjek besar lainnya.</p>

<h2>Kesimpulan</h2>
<p>Mengetahui bagaimana struktur "sirkuit" tempatmu membalap akan memberimu keuntungan strategis (competitive advantage). Semakin kamu memahami pola penulisan dan logika <em>hyperlink</em> Wikipedia, instingmu untuk menemukan jalur tercepat menuju tujuan akan semakin tajam.</p>

<p>Sudah siap menguji teori "Menuju Filsafat" atau mencari Artikel Pilihan? Langsung saja terjun ke arena di <a href="/">WikiRace Indonesia</a> dan buktikan seberapa cepat kamu bisa memecahkan labirin pengetahuan ini!</p>
    `.trim(),
  },
  {
    slug: "manfaat-main-wikirace",
    title: "Manfaat Main WikiRace: Lebih dari Sekadar Hiburan",
    summary:
      "Ternyata main WikiRace bukan cuma seru — ada manfaat kognitif nyata seperti melatih kecepatan baca, memperluas wawasan, dan mengasah pengambilan keputusan.",
    category: "Edukasi",
    author: "Muhammad Farizzi",
    publishedAt: "2026-06-28",
    updatedAt: "2026-06-28",
    readingTime: "4 menit",
    language: "id",
    content: `
<p>Banyak orang menganggap video game atau permainan browser hanyalah sarana untuk membuang-buang waktu (time-killer). Sekilas, WikiRace mungkin terlihat seperti permainan iseng belaka. Namun, di balik antarmukanya yang sederhana berupa halaman Wikipedia, permainan ini diam-diam memberikan "olahraga otak" yang sangat intensif.</p>

<p>Para peneliti kognitif dan praktisi pendidikan mulai melihat nilai tambah dari permainan berbasis ensiklopedia ini. Bermain WikiRace secara rutin ternyata memberikan dampak positif yang nyata bagi perkembangan kognitif dan keterampilan literasi digital. Inilah 5 manfaat tersembunyi yang akan kamu dapatkan jika rutin bermain WikiRace.</p>

<h2>1. Melatih Kemampuan "Skimming" (Membaca Pindai) Tingkat Tinggi</h2>
<p>Di era banjir informasi, kemampuan membaca setiap kata dari awal hingga akhir perlahan menjadi tidak efisien. Yang lebih dibutuhkan saat ini adalah kemampuan <strong>Skimming</strong>—memindai teks dengan cepat untuk menemukan informasi spesifik.</p>
<p>Saat berpacu dengan waktu di WikiRace, kamu tidak memiliki kemewahan untuk membaca sejarah lengkap Kekaisaran Ottoman. Matamu akan dilatih untuk melompat dari satu paragraf ke paragraf lain, mengabaikan kata penghubung, dan langsung mengunci target pada teks berwarna biru (tautan) yang relevan. Kemampuan <em>skimming</em> ini akan sangat terasa manfaatnya saat kamu harus meninjau dokumen kerja yang panjang, mencari poin utama dalam jurnal akademik, atau memilah berita di internet.</p>

<h2>2. Mengasah Berpikir Asosiatif (Associative Thinking)</h2>
<p>Bagaimana cara menghubungkan "Bulan" dengan "Cokelat"? Otak manusia yang tidak terlatih mungkin akan menyerah. Namun, pemain WikiRace akan langsung mengaktifkan <strong>Berpikir Asosiatif</strong>. Mereka akan mencari batu loncatan: <em>Bulan &rarr; Neil Armstrong &rarr; Amerika Serikat &rarr; Hari Valentine &rarr; Cokelat.</em></p>
<p>Kemampuan untuk melihat benang merah antara dua hal yang tampak sama sekali tidak berhubungan ini adalah inti dari kreativitas dan <em>problem-solving</em> (pemecahan masalah). Dalam dunia profesional, individu yang mampu melakukan <em>associative thinking</em> seringkali menjadi inovator yang bisa menggabungkan ide dari berbagai disiplin ilmu menjadi satu solusi brilian.</p>

<h2>3. Belajar Tanpa Sadar (Incidental Learning)</h2>
<p>Tahukah kamu dari mana asal usul kata "Robot"? Atau kapan tepatnya perang dingin berakhir? Kamu mungkin tidak pernah secara sengaja mencari informasi tersebut di Google. Namun, karena kamu harus melewati halaman-halaman tersebut untuk memenangkan ronde WikiRace, informasi itu tanpa sadar terekam di memorimu.</p>
<p>Dalam psikologi, ini disebut <em>Incidental Learning</em> (pembelajaran insidental). Kamu memperoleh pengetahuan baru secara organik dan menyenangkan, tanpa merasa sedang digurui atau sedang menghafal buku pelajaran. Semakin sering kamu bermain, semakin luas pula wawasan triviamu.</p>

<h2>4. Melatih Pengambilan Keputusan di Bawah Tekanan (Decision Making)</h2>
<p>Di mode <em>Speedrun</em> atau saat kamu bertanding langsung dengan teman di mode Multiplayer, setiap detik sangat berharga. Kamu dihadapkan pada puluhan tautan dalam satu halaman. Apakah kamu harus mengklik tautan "Amerika Serikat" yang aman tapi panjang jalurnya, atau mengambil risiko mengklik "Revolusi Industri" yang mungkin lebih pendek tapi belum pasti?</p>
<p>Kamu dipaksa untuk terus-menerus mengambil keputusan secara cepat dan rasional di bawah tekanan waktu. Simulasi ringan ini akan membantu melatih mentalmu agar tidak mudah panik saat dihadapkan pada tenggat waktu (deadline) di dunia nyata.</p>

<h2>5. Detoksifikasi dari Algoritma Media Sosial (Mindful Scrolling)</h2>
<p>Kita sering menghabiskan waktu berjam-jam melakukan <em>doom-scrolling</em> di media sosial, mengonsumsi konten pendek yang didikte oleh algoritma, yang akhirnya membuat otak merasa lelah namun kosong.</p>
<p>WikiRace menawarkan alternatif <strong>Mindful Scrolling</strong>. Kamu masih menatap layar dan menggulir halaman, namun dengan tujuan yang jelas dan kontrol penuh atas ke mana arah klikmu. Ini adalah bentuk hiburan aktif yang menstimulasi rasa penasaran (curiosity) secara positif, menjauhkanmu dari efek pasif media sosial.</p>

<h2>Kesimpulan: Senam Otak yang Menyenangkan</h2>
<p>Mulai sekarang, jangan merasa bersalah jika kamu menghabiskan waktu 30 menit untuk melompat dari satu artikel ke artikel lain. Anggap saja kamu sedang melakukan senam otak (brain gym).</p>

<p>WikiRace membuktikan bahwa belajar dan bermain bisa melebur menjadi satu kesatuan yang adiktif. Yuk, latih insting dan wawasanmu sekarang juga di <a href="/">WikiRace Indonesia</a>. Siapa tahu, kamu adalah pemegang rekor waktu tercepat berikutnya!</p>
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
