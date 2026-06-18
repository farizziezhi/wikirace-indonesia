"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedLanguage, saveLanguage } from "@/lib/client-id";
import { playPitRadioClick } from "@/lib/race-audio";

type TabId = "basics" | "ranked" | "solo" | "custom";

export default function GuidePage() {
  const [lang, setLang] = useState<"id" | "en">("id");
  const [activeTab, setActiveTab] = useState<TabId>("basics");

  useEffect(() => {
    const saved = getSavedLanguage();
    if (saved === "en" || saved === "id") {
      setLang(saved);
    }
  }, []);

  function handleLangToggle(nextLang: "id" | "en") {
    setLang(nextLang);
    saveLanguage(nextLang);
    playPitRadioClick();
  }

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    playPitRadioClick();
  }

  const tabLabels = {
    basics: { id: "🏎️ Dasar", en: "🏎️ Basics" },
    ranked: { id: "🏆 Ranked", en: "🏆 Ranked" },
    solo: { id: "⏱️ Solo", en: "⏱️ Solo" },
    custom: { id: "⛔ Custom", en: "⛔ Custom" },
  };

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center px-4 py-8 sm:px-6 sm:py-12 bg-warm-cream">
      <div className="w-full max-w-[800px]">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/80 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border-2 border-charcoal-text px-4 py-2 rounded-xl shadow-[2.5px_2.5px_0px_#000]"
          >
            ← {lang === "en" ? "Back to Home" : "Kembali ke Beranda"}
          </Link>

          {/* Language Toggle Segmented Control */}
          <div className="flex bg-charcoal-text/5 p-1 border-2 border-charcoal-text rounded-xl w-fit shadow-[2px_2px_0px_#000] bg-pure-white shrink-0 self-end sm:self-auto">
            <button
              onClick={() => handleLangToggle("id")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                lang === "id"
                  ? "bg-charcoal-text text-warm-cream shadow-[1px_1px_0px_rgba(0,0,0,0.15)]"
                  : "text-charcoal-text/60 hover:text-charcoal-text"
              }`}
            >
              ID
            </button>
            <button
              onClick={() => handleLangToggle("en")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                lang === "en"
                  ? "bg-charcoal-text text-warm-cream shadow-[1px_1px_0px_rgba(0,0,0,0.15)]"
                  : "text-charcoal-text/60 hover:text-charcoal-text"
              }`}
            >
              EN
            </button>
          </div>
        </header>

        {/* Main Console Board */}
        <div className="relative overflow-hidden bg-charcoal-deep text-warm-cream border-3 border-charcoal-text shadow-[6px_6px_0px_#000] rounded-2xl flex flex-col min-h-[460px]">
          {/* Header Checkered Stripe Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-charcoal-text overflow-hidden flex" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
            ))}
          </div>

          {/* Guide Title Panel */}
          <div className="border-b border-warm-cream/10 px-6 sm:px-8 pt-6 pb-4 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-lime-accent animate-ping" />
              <span className="text-[10px] font-mono font-black text-lime-accent uppercase tracking-widest">
                WIKIRACE TELEMETRY // MANUAL_v1.0
              </span>
            </div>
            <h1
              className="font-black text-lime-accent uppercase"
              style={{ fontSize: "clamp(22px, 5vw, 30px)", lineHeight: 1.1 }}
            >
              {lang === "en" ? "Game Guide & Manual" : "Pedoman & Panduan Bermain"}
            </h1>
            <p className="text-xs text-warm-cream/50 font-mono mt-1">
              {lang === "en"
                ? "Configure your engines and learn the race tracks."
                : "Konfigurasikan mesin balapmu dan pelajari sirkuit Wikipedia."}
            </p>
          </div>

          {/* Segmented Tab Controls (Neobrutalist F1 Dials) */}
          <div className="flex border-b border-warm-cream/10 bg-charcoal-text/20 p-2 gap-1.5 overflow-x-auto scrollbar-none w-full shrink-0">
            {(["basics", "ranked", "solo", "custom"] as TabId[]).map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`shrink-0 font-mono font-black text-[11px] uppercase px-4 py-2 border-2 rounded-xl transition-all cursor-pointer ${
                    active
                      ? "bg-lime-accent text-charcoal-text border-charcoal-text shadow-[2px_2px_0px_#000]"
                      : "bg-charcoal-deep/50 text-warm-cream/60 border-transparent hover:text-warm-cream"
                  }`}
                >
                  {tabLabels[tab][lang]}
                </button>
              );
            })}
          </div>

          {/* Guide Content Panel */}
          <div className="flex-1 p-6 sm:p-8 text-sm sm:text-base leading-relaxed text-warm-cream/90 flex flex-col gap-6">
            {activeTab === "basics" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-black text-lime-accent uppercase font-mono tracking-tight flex items-center gap-1.5">
                  🏁 {lang === "en" ? "WHAT IS WIKIRACE?" : "APA ITU WIKIRACE?"}
                </h2>
                <p>
                  {lang === "en"
                    ? "WikiRace (also known as the Wikipedia Game) is a race of clicks and logic. Your goal is to navigate from a starting Wikipedia article to a target goal article using ONLY the blue hyperlinks within the article body."
                    : "WikiRace (dikenal juga sebagai Wikipedia Game) adalah kompetisi logika dan kecepatan. Tujuan utamamu adalah berpindah dari artikel Wikipedia awal ke artikel tujuan HANYA dengan mengeklik tautan (link) biru di dalam konten artikel."}
                </p>
                
                <div className="bg-charcoal-text/40 border border-warm-gray/15 p-4 rounded-xl font-mono text-xs flex flex-col gap-2.5">
                  <span className="font-bold text-burnt-orange">⚙️ {lang === "en" ? "TELEMETRY RULES" : "ATURAN BALAPAN"}</span>
                  <ul className="list-disc list-inside space-y-1 text-warm-cream/80">
                    <li>{lang === "en" ? "Only blue links inside the article body are active." : "Hanya tautan biru di dalam konten utama artikel yang aktif."}</li>
                    <li>{lang === "en" ? "Browser navigation keys (Back/Forward) and keyboard shortcuts (Ctrl+F) are strictly blocked to prevent cheating." : "Tombol navigasi browser (Kembali/Maju) dan pintasan pencarian (Ctrl+F) diblokir untuk mencegah kecurangan."}</li>
                    <li>{lang === "en" ? "Hovering over links reveals their titles. Use this telemetry to plan your next apex!" : "Mengarahkan kursor ke link akan menampilkan judul artikel. Gunakan data ini untuk merencanakan tikungan rute berikutnya!"}</li>
                  </ul>
                </div>

                <div className="border-l-3 border-lime-accent pl-4 py-1.5 italic text-warm-cream/70">
                  {lang === "en"
                    ? "Example: Start from 'Formula 1' ➔ click 'Internal Combustion Engine' ➔ click 'Gasoline' ➔ click 'Oil' ➔ reach Target 'Fossil Fuel'!"
                    : "Contoh: Mulai dari 'Formula 1' ➔ klik 'Mesin Pembakaran Dalam' ➔ klik 'Bensin' ➔ klik 'Minyak Bumi' ➔ sampai ke Target 'Bahan Bakar Fosil'!"}
                </div>
              </div>
            )}

            {activeTab === "ranked" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-black text-lime-accent uppercase font-mono tracking-tight flex items-center gap-1.5">
                  🏆 {lang === "en" ? "RANKED ARENA & ELO SYSTEM" : "ARENA RANKED & SISTEM ELO"}
                </h2>
                <p>
                  {lang === "en"
                    ? "Compete head-to-head in real-time. Winning matches raises your ELO rating and shifts you up the Global Standings leaderboard, while losing drops it. Matchmaking requires identical language settings."
                    : "Bersaing secara real-time satu lawan satu. Kemenangan akan menaikkan rating ELO-mu dan menggeser posisimu di papan peringkat global, sedangkan kekalahan akan menurunkannya. Bahasa room harus sama saat matchmaking."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                  <div className="bg-charcoal-text/40 border border-warm-gray/15 p-4 rounded-xl">
                    <span className="font-mono font-black text-xs text-lime-accent block mb-1">🤖 BOT MATCHMAKING</span>
                    <p className="text-xs text-warm-cream/70">
                      {lang === "en"
                        ? "If matchmaking queue exceeds 1 minute, an AI Driver Bot (ELO-calibrated) will enter the lobby. Bot paths are 100% realistic and calculated on-the-fly."
                        : "Jika antrean matchmaking melebihi 1 menit, AI Driver Bot (terkalibrasi sesuai ELO Anda) akan masuk ke lobi. Jalur Bot 100% logis dan dihitung secara langsung."}
                    </p>
                  </div>
                  <div className="bg-charcoal-text/40 border border-warm-gray/15 p-4 rounded-xl">
                    <span className="font-mono font-black text-xs text-burnt-orange block mb-1">🔥 DAILY STREAK BADGE</span>
                    <p className="text-xs text-warm-cream/70">
                      {lang === "en"
                        ? "Complete the deterministically seeded Daily Challenge on the homepage to start a streak. Consecutive daily wins upgrade your streak badge on your profile!"
                        : "Selesaikan Tantangan Harian di homepage untuk memulai streak. Kemenangan berturut-turut akan meng-upgrade lencana api streak di profilmu!"}
                    </p>
                  </div>
                </div>

                <div className="bg-burnt-orange/10 border border-burnt-orange/30 p-3 rounded-lg text-xs font-mono text-burnt-orange text-center">
                  {lang === "en"
                    ? "🚨 LEAVING OR SURRENDERING IN RANKED WILL PENALIZE ELO AUTOMATICALLY!"
                    : "🚨 KELUAR ATAU MENYERAH SAAT BALAPAN RANKED AKAN MENGURANGI ELO SECARA OTOMATIS!"}
                </div>
              </div>
            )}

            {activeTab === "solo" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-black text-lime-accent uppercase font-mono tracking-tight flex items-center gap-1.5">
                  ⏱️ {lang === "en" ? "SOLO PRACTICE GARAGE" : "GARASI LATIHAN SOLO"}
                </h2>
                <p>
                  {lang === "en"
                    ? "Refine your lines in the Solo Garage. Training here has no impact on ELO, making it ideal for casual exploration or route testing."
                    : "Pertajam instingmu di Garasi Latihan Solo. Latihan di sini tidak memengaruhi ELO, menjadikannya ideal untuk eksplorasi santai atau pengujian rute baru."}
                </p>

                <div className="bg-charcoal-text/40 border border-warm-gray/15 p-4 rounded-xl font-mono text-xs flex flex-col gap-2.5">
                  <span className="font-bold text-lime-accent">🛠️ {lang === "en" ? "TUNING MODULES" : "MODUL LATIHAN"}</span>
                  <div className="space-y-1.5 text-warm-cream/80">
                    <p><strong>• {lang === "en" ? "Curated Themes" : "Kategori Pilihan"}:</strong> {lang === "en" ? "Race on pre-verified tracks sorted by Popular themes (History, Science, Sports)." : "Balapan di rute yang telah terverifikasi berdasarkan tema populer (Sejarah, Sains, Olahraga)."}</p>
                    <p><strong>• {lang === "en" ? "Wild Random" : "Wikipedia Acak"}:</strong> {lang === "en" ? "Let the engine select two completely random reachable articles." : "Biarkan mesin memilih dua artikel acak yang dipastikan saling terhubung."}</p>
                    <p><strong>• {lang === "en" ? "Custom Setup" : "Kustom Mandiri"}:</strong> {lang === "en" ? "Input your own Start and Target articles to practice specific paths." : "Masukkan sendiri judul artikel Awal dan Akhir untuk melatih rute spesifik."}</p>
                  </div>
                </div>

                <p className="text-xs italic text-warm-cream/60">
                  {lang === "en"
                    ? "Choose 'Time Attack' to race against the clock, or 'Free Roam' to explore Wikipedia at your own pace without pressure."
                    : "Pilih 'Time Attack' untuk berkejaran dengan waktu, atau 'Free Roam' untuk menjelajahi Wikipedia secara santai tanpa tekanan waktu."}
                </p>
              </div>
            )}

            {activeTab === "custom" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-black text-lime-accent uppercase font-mono tracking-tight flex items-center gap-1.5">
                  ⛔ {lang === "en" ? "CUSTOM PARTY LOBBY" : "LOBI MABAR KUSTOM"}
                </h2>
                <p>
                  {lang === "en"
                    ? "Create a custom party room using a Room Code to play with friends. Custom rooms do not affect ELO, allowing the host to tune cockpit game limits and special restrictions."
                    : "Buat lobi permainan kustom menggunakan Kode Room untuk bermain bersama teman. Room kustom tidak memengaruhi ELO, sehingga Host bebas menyetel batasan mekanis."}
                </p>

                <div className="bg-charcoal-text/40 border border-warm-gray/15 p-4 rounded-xl font-mono text-xs flex flex-col gap-2.5">
                  <span className="font-bold text-burnt-orange">🎛️ {lang === "en" ? "HOST COCKPIT RULES" : "ATURAN KENDALI HOST"}</span>
                  <div className="space-y-1.5 text-warm-cream/80">
                    <p><strong>• {lang === "en" ? "Click Limit" : "Batas Klik"}:</strong> {lang === "en" ? "Max allowed link clicks. Exceeding disqualifies the player." : "Jumlah klik tautan maksimal. Melebihi batas akan mendiskualifikasi pemain."}</p>
                    <p><strong>• {lang === "en" ? "Time Limit" : "Batas Waktu"}:</strong> {lang === "en" ? "Countdown timer. Reaching 00:00 triggers local engine failure (DQ)." : "Hitung mundur waktu bermain. Menyentuh 00:00 memicu kegagalan mesin (DQ)."}</p>
                    <p><strong>• {lang === "en" ? "Banned Articles" : "Larangan Artikel (Ban List)"}:</strong> {lang === "en" ? "Host can ban specific articles (e.g. 'United States', 'Earth'). Clicking a banned link plays an alarm beep and blocks navigation." : "Host dapat melarang artikel tertentu (misal: 'Amerika Serikat'). Mengeklik link terlarang memicu beeps alarm dan memblokir rute."}</p>
                    <p><strong>• {lang === "en" ? "Emergency GPS Help" : "Bantuan GPS Darurat"}:</strong> {lang === "en" ? "Allows players to use a 'Solution Helper' showing the shortest route calculated by our background BFS engine." : "Mengizinkan pemain memakai 'Bantuan Solusi' yang memperlihatkan rute terpendek hasil kalkulasi mesin BFS."}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Checkered Line */}
          <div className="mt-auto bg-charcoal-text/30 px-6 py-4 border-t border-warm-cream/10 text-center flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-warm-cream/40">
              {lang === "en" ? "WIKIRACE INDONESIA © 2026 // SIRKUIT DATA WIKIPEDIA" : "WIKIRACE INDONESIA © 2026 // SIRKUIT DATA WIKIPEDIA"}
            </span>
            <Link
              href="/"
              onClick={() => playPitRadioClick()}
              className="text-[10px] font-mono font-black text-lime-accent uppercase hover:underline"
            >
              🏁 {lang === "en" ? "READY TO RACE? JOIN LOBBY" : "SIAP BALAPAN? MASUK LOBI"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
