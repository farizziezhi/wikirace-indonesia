"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedUiLanguage, saveUiLanguage } from "@/lib/client-id";
import { 
  BookOpen, 
  Trophy, 
  User, 
  Sliders, 
  Brain, 
  House, 
  CaretLeft, 
  Compass, 
  ListBullets, 
  Warning, 
  Gear, 
  MapTrifold, 
  Sparkle, 
  Globe 
} from "@phosphor-icons/react";

type TabId = "basics" | "ranked" | "solo" | "custom" | "strategy";

export default function GuideClient() {
  const [lang, setLang] = useState<"id" | "en">("id");
  const [activeTab, setActiveTab] = useState<TabId>("basics");

  useEffect(() => {
    const saved = getSavedUiLanguage();
    if (saved === "en" || saved === "id") {
      setLang(saved);
    }
  }, []);

  function handleLangToggle(nextLang: "id" | "en") {
    setLang(nextLang);
    saveUiLanguage(nextLang);
    window.dispatchEvent(
      new CustomEvent("uiLanguageChanged", { detail: nextLang }),
    );
  }

  const tabLabels = {
    basics: { id: "Dasar", en: "Basics" },
    ranked: { id: "Ranked", en: "Ranked" },
    solo: { id: "Solo", en: "Solo" },
    custom: { id: "Custom", en: "Custom" },
    strategy: { id: "Strategi", en: "Strategy" },
  };

  const tabIcons = {
    basics: <Compass size={14} weight="fill" />,
    ranked: <Trophy size={14} weight="fill" />,
    solo: <User size={14} weight="fill" />,
    custom: <Sliders size={14} weight="fill" />,
    strategy: <Brain size={14} weight="fill" />,
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center px-4 py-8 sm:px-6 sm:py-12 bg-warm-cream">
      <div className="w-full max-w-[800px]">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/80 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border-2 border-charcoal-text px-4 py-2 rounded-xl shadow-[2.5px_2.5px_0px_#000] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            <CaretLeft size={14} weight="bold" />
            <span>{lang === "en" ? "Back to Home" : "Kembali ke Beranda"}</span>
          </Link>

          {/* Language Selector */}
          <div className="flex bg-light-beige p-1 border-2 border-charcoal-text rounded-xl w-fit shadow-[2px_2px_0px_#000] bg-pure-white shrink-0 self-end sm:self-auto">
            <button
              onClick={() => handleLangToggle("id")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                lang === "id"
                  ? "bg-charcoal-text text-warm-cream shadow-[1px_1px_0px_rgba(0,0,0,0.15)]"
                  : "text-charcoal-text/60 hover:text-charcoal-text"
              }`}
            >
              <Globe size={13} weight={lang === "id" ? "fill" : "regular"} />
              ID
            </button>
            <button
              onClick={() => handleLangToggle("en")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                lang === "en"
                  ? "bg-charcoal-text text-warm-cream shadow-[1px_1px_0px_rgba(0,0,0,0.15)]"
                  : "text-charcoal-text/60 hover:text-charcoal-text"
              }`}
            >
              <Globe size={13} weight={lang === "en" ? "fill" : "regular"} />
              EN
            </button>
          </div>
        </header>

        {/* Main Guide Card */}
        <div
          className="bg-pure-white text-charcoal-text border-3 border-charcoal-text shadow-[6px_6px_0px_#000] rounded-2xl flex flex-col min-h-[460px] overflow-hidden"
        >
          {/* Guide Title */}
          <div className="border-b border-charcoal-text/10 px-6 sm:px-8 pt-6 pb-4 flex items-center gap-4">
            <div className="p-3 bg-lime-accent text-charcoal-text rounded-2xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] shrink-0">
              <BookOpen size={30} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-charcoal-text uppercase"
                style={{ fontSize: "clamp(22px, 5vw, 30px)", lineHeight: 1.1 }}
              >
                {lang === "en" ? "Game Guide" : "Panduan Bermain"}
              </h1>
              <p className="text-xs text-charcoal-text/50 mt-1">
                {lang === "en"
                  ? "Everything you need to know to start playing."
                  : "Semua yang perlu kamu ketahui untuk mulai bermain."}
              </p>
            </div>
          </div>

          {/* Tab Controls */}
          <div className="flex border-b border-charcoal-text/10 bg-light-beige/50 p-2 gap-1.5 overflow-x-auto scrollbar-none w-full shrink-0">
            {Object.keys(tabLabels).map((key) => {
              const tab = key as TabId;
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 font-black text-[11px] uppercase px-4 py-2 border-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-charcoal-text text-warm-cream border-charcoal-text shadow-[2px_2px_0px_#000]"
                      : "bg-transparent text-charcoal-text/50 border-transparent hover:text-charcoal-text"
                  }`}
                >
                  {tabIcons[tab]}
                  <span>{tabLabels[tab][lang]}</span>
                </button>
              );
            })}
          </div>

          {/* Guide Content */}
          <div className="flex-1 p-6 sm:p-8 text-sm sm:text-base leading-relaxed text-charcoal-text/85 flex flex-col gap-6">
            {/* Panel 1: Basics */}
            <div className={activeTab === "basics" ? "flex flex-col gap-4 animate-fade-in" : "hidden"}>
              <h2 className="text-lg font-black text-charcoal-text uppercase tracking-tight flex items-center gap-1.5">
                <Compass size={20} weight="fill" className="text-lime-accent" />
                <span>{lang === "en" ? "What is WikiRace?" : "Apa itu WikiRace?"}</span>
              </h2>
              <p>
                {lang === "en"
                  ? "WikiRace (also known as the Wikipedia Game) is a race of clicks and logic. Your goal is to navigate from a starting Wikipedia article to a target goal article using ONLY the blue hyperlinks within the article body."
                  : "WikiRace (dikenal juga sebagai Wikipedia Game) adalah kompetisi logika dan kecepatan. Tujuan utamamu adalah berpindah dari artikel Wikipedia awal ke artikel tujuan HANYA dengan mengeklik tautan (link) biru di dalam konten artikel."}
              </p>
              
              <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl text-xs flex flex-col gap-2.5">
                <span className="font-bold text-charcoal-text flex items-center gap-1">
                  <ListBullets size={15} weight="bold" />
                  <span>{lang === "en" ? "Game Rules" : "Aturan Permainan"}</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-charcoal-text/75">
                  <li>{lang === "en" ? "Only blue links inside the article body are active." : "Hanya tautan biru di dalam konten utama artikel yang aktif."}</li>
                  <li>{lang === "en" ? "Browser navigation keys (Back/Forward) and keyboard shortcuts (Ctrl+F) are blocked to prevent cheating." : "Tombol navigasi browser (Kembali/Maju) dan pintasan pencarian (Ctrl+F) diblokir untuk mencegah kecurangan."}</li>
                  <li>{lang === "en" ? "Hovering over links reveals their titles. Use this to plan your next move!" : "Mengarahkan kursor ke link akan menampilkan judul artikel. Gunakan ini untuk merencanakan langkah berikutnya!"}</li>
                </ul>
              </div>

              <div className="border-l-3 border-lime-accent pl-4 py-1.5 italic text-charcoal-text/60">
                {lang === "en"
                  ? "Example: Start from 'Earth' → click 'Solar System' → click 'Sun' → click 'Star' → reach Target 'Milky Way'!"
                  : "Contoh: Mulai dari 'Bumi' → klik 'Tata Surya' → klik 'Matahari' → klik 'Bintang' → sampai ke Target 'Bimasakti'!"}
              </div>
            </div>

            {/* Panel 2: Ranked */}
            <div className={activeTab === "ranked" ? "flex flex-col gap-4 animate-fade-in" : "hidden"}>
              <h2 className="text-lg font-black text-charcoal-text uppercase tracking-tight flex items-center gap-1.5">
                <Trophy size={20} weight="fill" className="text-lime-accent" />
                <span>{lang === "en" ? "Ranked & ELO System" : "Ranked & Sistem ELO"}</span>
              </h2>
              <p>
                {lang === "en"
                  ? "Compete head-to-head in real-time. Winning matches raises your ELO rating and moves you up the global leaderboard, while losing drops it. Matchmaking requires identical language settings."
                  : "Bersaing secara real-time satu lawan satu. Kemenangan akan menaikkan rating ELO-mu dan menggeser posisimu di papan peringkat global, sedangkan kekalahan akan menurunkannya. Bahasa room harus sama saat matchmaking."}
              </p>

              <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl flex items-start gap-2.5">
                <Sparkle size={18} className="text-lime-accent shrink-0 mt-0.5" weight="fill" />
                <div>
                  <span className="font-black text-xs text-charcoal-text block mb-1">{lang === "en" ? "Daily Streak" : "Streak Harian"}</span>
                  <p className="text-xs text-charcoal-text/70">
                    {lang === "en"
                      ? "Complete the Daily Challenge on the homepage to start a streak. Consecutive daily wins upgrade your streak badge on your profile!"
                      : "Selesaikan Tantangan Harian di homepage untuk memulai streak. Kemenangan berturut-turut akan meningkatkan lencana streak di profilmu!"}
                  </p>
                </div>
              </div>

              <div className="bg-burnt-orange/10 border border-burnt-orange/30 p-3 rounded-lg text-xs text-burnt-orange text-center font-semibold flex items-center justify-center gap-1.5">
                <Warning size={14} weight="fill" />
                <span>
                  {lang === "en"
                    ? "Leaving or surrendering in Ranked will penalize your ELO automatically!"
                    : "Keluar atau menyerah saat Ranked akan mengurangi ELO secara otomatis!"}
                </span>
              </div>
            </div>

            {/* Panel 3: Solo */}
            <div className={activeTab === "solo" ? "flex flex-col gap-4 animate-fade-in" : "hidden"}>
              <h2 className="text-lg font-black text-charcoal-text uppercase tracking-tight flex items-center gap-1.5">
                <User size={20} weight="fill" className="text-lime-accent" />
                <span>{lang === "en" ? "Solo Practice" : "Latihan Solo"}</span>
              </h2>
              <p>
                {lang === "en"
                  ? "Practice at your own pace. Training here has no impact on ELO, making it ideal for casual exploration or route testing."
                  : "Berlatih sesuai kecepatan sendiri. Latihan di sini tidak memengaruhi ELO, menjadikannya ideal untuk eksplorasi santai atau pengujian rute baru."}
              </p>

              <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl text-xs flex flex-col gap-2.5">
                <span className="font-bold text-charcoal-text flex items-center gap-1">
                  <Gear size={15} weight="bold" />
                  <span>{lang === "en" ? "Practice Features" : "Fitur Latihan"}</span>
                </span>
                <div className="space-y-1.5 text-charcoal-text/75">
                  <p><strong>• {lang === "en" ? "Curated Themes" : "Kategori Pilihan"}:</strong> {lang === "en" ? "Play on pre-verified routes sorted by popular themes (History, Science, Sports)." : "Main di rute yang telah diverifikasi berdasarkan tema populer (Sejarah, Sains, Olahraga)."}</p>
                  <p><strong>• {lang === "en" ? "Random" : "Acak"}:</strong> {lang === "en" ? "Let the system select two completely random reachable articles." : "Biarkan sistem memilih dua artikel acak yang saling terhubung."}</p>
                  <p><strong>• {lang === "en" ? "Custom" : "Kustom"}:</strong> {lang === "en" ? "Input your own Start and Target articles to practice specific paths." : "Masukkan sendiri judul artikel Awal dan Akhir untuk melatih rute spesifik."}</p>
                </div>
              </div>

              <p className="text-xs italic text-charcoal-text/50">
                {lang === "en"
                  ? "Choose 'Time Attack' to race against the clock, or 'Free Roam' to explore Wikipedia at your own pace."
                  : "Pilih 'Time Attack' untuk berkejaran dengan waktu, atau 'Free Roam' untuk menjelajahi Wikipedia secara santai."}
              </p>
            </div>

            {/* Panel 4: Custom */}
            <div className={activeTab === "custom" ? "flex flex-col gap-4 animate-fade-in" : "hidden"}>
              <h2 className="text-lg font-black text-charcoal-text uppercase tracking-tight flex items-center gap-1.5">
                <Sliders size={20} weight="fill" className="text-lime-accent" />
                <span>{lang === "en" ? "Custom Room" : "Room Kustom"}</span>
              </h2>
              <p>
                {lang === "en"
                  ? "Create a custom room using a Room Code to play with friends. Custom rooms do not affect ELO, and the host can set game rules and restrictions."
                  : "Buat room kustom menggunakan Kode Room untuk bermain bersama teman. Room kustom tidak memengaruhi ELO, dan Host bebas mengatur aturan permainan."}
              </p>

              <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl text-xs flex flex-col gap-2.5">
                <span className="font-bold text-charcoal-text flex items-center gap-1">
                  <Gear size={15} weight="bold" />
                  <span>{lang === "en" ? "Host Settings" : "Pengaturan Host"}</span>
                </span>
                <div className="space-y-1.5 text-charcoal-text/75">
                  <p><strong>• {lang === "en" ? "Click Limit" : "Batas Klik"}:</strong> {lang === "en" ? "Max allowed link clicks. Exceeding disqualifies the player." : "Jumlah klik tautan maksimal. Melebihi batas akan mendiskualifikasi pemain."}</p>
                  <p><strong>• {lang === "en" ? "Time Limit" : "Batas Waktu"}:</strong> {lang === "en" ? "Countdown timer. Reaching 00:00 results in disqualification." : "Hitung mundur waktu bermain. Menyentuh 00:00 berarti didiskualifikasi."}</p>
                  <p><strong>• {lang === "en" ? "Banned Articles" : "Larangan Artikel"}:</strong> {lang === "en" ? "Host can ban specific articles (e.g. 'United States', 'Earth'). Clicking a banned link blocks navigation." : "Host dapat melarang artikel tertentu (misal: 'Amerika Serikat'). Mengeklik link terlarang akan memblokir navigasi."}</p>
                  <p><strong>• {lang === "en" ? "Solution Helper" : "Bantuan Solusi"}:</strong> {lang === "en" ? "Allows players to see the shortest route to the target article." : "Mengizinkan pemain melihat rute terpendek menuju artikel tujuan."}</p>
                </div>
              </div>
            </div>

            {/* Panel 5: Strategy */}
            <div className={activeTab === "strategy" ? "flex flex-col gap-4 animate-fade-in" : "hidden"}>
              <h2 className="text-lg font-black text-charcoal-text uppercase tracking-tight flex items-center gap-1.5">
                <Brain size={20} weight="fill" className="text-lime-accent" />
                <span>{lang === "en" ? "Game Strategies" : "Strategi Bermain"}</span>
              </h2>
              <p>
                {lang === "en"
                  ? "To achieve the fastest times and lowest click counts, you must think associationally and navigate Wikipedia efficiently. Here are key strategies:"
                  : "Untuk mencapai waktu tercepat dan jumlah klik paling sedikit, Anda harus berpikir secara asosiatif dan menavigasi Wikipedia dengan efisien. Berikut strategi utama:"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl">
                  <span className="font-black text-xs text-charcoal-text block mb-1">1. {lang === "en" ? "Hub Articles" : "Artikel Penghubung"}</span>
                  <p className="text-xs text-charcoal-text/70 leading-relaxed">
                    {lang === "en"
                      ? "Identify large articles containing broad topics, such as countries (e.g., 'Indonesia', 'United States'), continents, or centuries. Navigating to a Hub allows you to quickly pivot to almost any other topic."
                      : "Identifikasi artikel besar yang mengandung topik luas, seperti negara (misal: 'Indonesia', 'Amerika Serikat'), benua, atau abad. Masuk ke Hub memungkinkan Anda berpindah secara cepat ke hampir semua topik lain."}
                  </p>
                </div>
                <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl">
                  <span className="font-black text-xs text-charcoal-text block mb-1">2. {lang === "en" ? "Geographic & Time Shortcuts" : "Pintasan Geografis & Waktu"}</span>
                  <p className="text-xs text-charcoal-text/70 leading-relaxed">
                    {lang === "en"
                      ? "If the target is a historical figure, search for their birth country or century. If the target is a biological concept, navigate through related sciences (e.g., 'Biology' → 'Chemistry' → 'Atom')."
                      : "Jika targetnya adalah tokoh sejarah, cari negara kelahiran atau abad hidupnya. Jika targetnya adalah konsep biologi, navigasikan melalui ilmu sains terkait (misal: 'Biologi' → 'Kimia' → 'Atom')."}
                  </p>
                </div>
                <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl">
                  <span className="font-black text-xs text-charcoal-text block mb-1">3. {lang === "en" ? "Associative Leaps" : "Lompatan Asosiatif"}</span>
                  <p className="text-xs text-charcoal-text/70 leading-relaxed">
                    {lang === "en"
                      ? "Don't just click randomly. Read the first paragraph — it contains definitions and context that link to wider fields. Connect distant categories by finding shared entities."
                      : "Jangan asal klik secara acak. Bacalah paragraf pertama — ini berisi definisi dan konteks yang terhubung ke bidang yang lebih luas. Hubungkan kategori yang jauh melalui entitas bersama."}
                  </p>
                </div>
                <div className="bg-light-beige border border-charcoal-text/15 p-4 rounded-xl">
                  <span className="font-black text-xs text-charcoal-text block mb-1">4. {lang === "en" ? "Minimize Clicks" : "Minimalkan Klik"}</span>
                  <p className="text-xs text-charcoal-text/70 leading-relaxed">
                    {lang === "en"
                      ? "In custom rooms with Click Limits, plan one step ahead. Before clicking a link, read the current paragraph to see if other links might lead to a larger Hub first."
                      : "Di room kustom dengan Batas Klik, rencanakan satu langkah di depan. Sebelum mengeklik link, bacalah paragraf saat ini untuk melihat apakah link lain dapat membawa Anda ke artikel Hub yang lebih besar terlebih dahulu."}
                  </p>
                </div>
              </div>

              <div className="border-l-3 border-lime-accent pl-4 py-1.5 italic text-charcoal-text/60 text-xs flex items-start gap-1.5">
                <MapTrifold size={16} className="text-lime-accent shrink-0 mt-0.5" weight="fill" />
                <span>
                  {lang === "en"
                    ? "Pro Tip: Learn to scan the 'See Also' and 'References' sections at the bottom of Wikipedia pages. They often contain direct links to major hubs!"
                    : "Tip: Pelajari cara memindai bagian 'Lihat Juga' dan 'Referensi' di bagian bawah halaman Wikipedia. Bagian tersebut sering menyimpan link langsung ke hub utama!"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto bg-light-beige/50 px-6 py-4 border-t border-charcoal-text/10 text-center flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] text-charcoal-text/40 font-bold">
              WikiRace Indonesia © 2026
            </span>
            <Link
              href="/"
              className="text-[10px] font-black text-charcoal-text uppercase hover:underline"
            >
              {lang === "en" ? "Start Playing →" : "Mulai Bermain →"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
