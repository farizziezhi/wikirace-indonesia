"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSavedLanguage } from "@/lib/client-id";

interface Donator {
  id: number;
  name: string;
  amount: number;
  message: string;
  createdAt: number;
}

export default function DonatorsPage() {
  const [topDonators, setTopDonators] = useState<Donator[]>([]);
  const [recentDonators, setRecentDonators] = useState<Donator[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"id" | "en">("id");

  useEffect(() => {
    setLanguage(getSavedLanguage());
    async function fetchDonators() {
      try {
        const res = await fetch("/api/donators");
        if (res.ok) {
          const data = await res.json();
          setTopDonators(data.top || []);
          setRecentDonators(data.recent || []);
        }
      } catch (err) {
        console.error("Gagal memuat donatur:", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchDonators();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (epochSecs: number) => {
    return new Date(epochSecs * 1000).toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Ambil podium donatur teratas
  const gold = topDonators[0] || null;
  const silver = topDonators[1] || null;
  const bronze = topDonators[2] || null;
  const others = topDonators.slice(3);

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-start bg-warm-cream px-4 py-10 sm:px-6">
      <div className="w-full max-w-[850px] flex flex-col gap-6">
        
        {/* Header Navigation */}
        <header className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-3.5 py-1.5 rounded-full shadow-[1.5px_1.5px_0px_#000]"
          >
            {language === "en" ? "← Back to Homepage" : "← Kembali ke Beranda"}
          </Link>
          <span className="font-extrabold uppercase text-charcoal-text text-[11px] tracking-wider bg-light-beige border border-charcoal-text px-3.5 py-1.5 rounded-full shadow-[1.5px_1.5px_0px_#000]">
            🏎️ Paddock Pass
          </span>
        </header>

        {/* Hero Banner Section */}
        <section
          className="relative overflow-hidden bg-charcoal-deep text-warm-cream p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
          style={{
            borderRadius: "var(--radius-input)",
          }}
        >
          {/* Checkered Racing Stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-charcoal-text overflow-hidden flex" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? "bg-pure-white" : "bg-charcoal-text"}`} />
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-2.5 mt-2">
            <h1
              className="font-black text-lime-accent tracking-tight uppercase"
              style={{ fontSize: "clamp(26px, 4vw, 36px)", lineHeight: 1.1 }}
            >
              🏁 {language === "en" ? "Sponsors & Supporters Paddock" : "Paddock Sponsor & Pendukung"}
            </h1>
            <p className="text-sm sm:text-base text-warm-cream/80 leading-relaxed font-medium">
              {language === "en"
                ? "WikiRace Indonesia is completely free to play, free of ads, and does not sell user data. Your sponsorships help pay for VPS, realtime Ably database, Turso ELO database, and hosting."
                : "WikiRace Indonesia sepenuhnya gratis dimainkan, bebas dari iklan, serta tidak menjual data pengguna. Dukungan Anda membantu kami membiayai VPS, database realtime Ably, database ELO Turso, dan hosting."}
            </p>
          </div>
          <div className="w-full sm:w-auto shrink-0 z-10">
            <a
              href="https://saweria.co/WikiRace"
              target="_blank"
              rel="noopener noreferrer"
              className="chunky-press text-center flex flex-col items-center justify-center bg-lime-accent text-charcoal-text font-black hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] px-6 py-4 w-full sm:w-[200px] border-3 border-charcoal-text transition duration-200"
              style={{
                borderRadius: "var(--radius-input)",
                boxShadow: "4px 4px 0px #000"
              }}
            >
              <span className="text-2xl mb-1">☕</span>
              <span className="text-sm uppercase tracking-wider">{language === "en" ? "Support via Saweria" : "Dukung via Saweria"}</span>
              <span className="text-[10px] font-bold opacity-80 mt-1">
                {language === "en" ? "Starts at Rp 10,000" : "Mulai Rp 10.000"}
              </span>
            </a>
          </div>
        </section>

        {/* Podium Highlight (Top 3 Donators) */}
        <section className="flex flex-col gap-4">
          <h2 className="font-black text-xl text-charcoal-text flex items-center gap-2 uppercase font-mono">
            🏆 {language === "en" ? "Constructor Podium" : "Podium Konstruktor Utama"}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20 bg-charcoal-deep border-3 border-charcoal-text rounded-xl shadow-[6px_6px_0px_#000] text-warm-cream">
              <span className="font-mono text-lime-accent font-bold text-sm animate-pulse uppercase tracking-wider">
                {language === "en" ? "Telemetry: Fetching Sponsor Profiles..." : "Telemetri: Mengunduh Profil Sponsor..."}
              </span>
            </div>
          ) : !gold && !silver && !bronze ? (
            /* Empty State */
            <div
              className="bg-charcoal-deep p-8 text-center flex flex-col items-center justify-center gap-3 border-3 border-charcoal-text text-warm-cream"
              style={{
                borderRadius: "var(--radius-input)",
                boxShadow: "6px 6px 0px #000"
              }}
            >
              <span className="text-4xl">👑</span>
              <h3 className="font-mono font-black text-lime-accent text-base uppercase">
                {language === "en" ? "No Sponsors Registered Yet" : "Belum Ada Sponsor Terdaftar"}
              </h3>
              <p className="text-xs text-warm-cream/80 max-w-[340px] leading-relaxed font-semibold">
                {language === "en"
                  ? "Be the first sponsor! Click the Saweria button above to register your team construct onto the podium."
                  : "Jadilah sponsor pertama! Klik tombol Saweria di atas untuk mendaftarkan nama tim konstruktor Anda di atas podium."}
              </p>
            </div>
          ) : (
            /* Podium Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Podium #2: Silver */}
              <div className="order-2 md:order-1 flex flex-col gap-2">
                {silver ? (
                  <div
                    className="bg-[#E2E2E2]/10 p-5 flex flex-col gap-3 relative border-3 border-warm-gray text-charcoal-text"
                    style={{
                      borderRadius: "var(--radius-input)",
                      boxShadow: "4px 4px 0px var(--color-charcoal-text)",
                      minHeight: "190px",
                    }}
                  >
                    <div className="absolute -top-3 left-4 bg-charcoal-text text-warm-cream font-mono font-black text-[9px] px-2.5 py-1 rounded border border-charcoal-text uppercase tracking-widest shadow-[2px_2px_0px_#000]">
                      🥈 CONSTRUCTOR #2
                    </div>
                    <div className="mt-2">
                      <span className="text-[9px] font-mono text-warm-gray font-bold uppercase tracking-wider block">CONSTRUCTOR TEAM</span>
                      <h3 className="font-black text-charcoal-text text-lg truncate font-mono">{silver.name}</h3>
                      <span className="inline-block bg-charcoal-text text-warm-cream text-[11px] font-extrabold px-2 py-0.5 rounded mt-1 shadow-[2px_2px_0px_#000]">
                        {formatRupiah(silver.amount)}
                      </span>
                    </div>
                    {silver.message && (
                      <p className="text-xs text-charcoal-text/80 italic leading-relaxed border-l-2 border-warm-gray/60 pl-2">
                        "{silver.message}"
                      </p>
                    )}
                    <span className="text-[9px] text-charcoal-text/50 font-mono font-bold mt-auto">
                      TELEMETRY REC: {formatDate(silver.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div
                    className="border-3 border-dashed border-warm-gray rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-60"
                    style={{ minHeight: "190px" }}
                  >
                    <span className="text-xl">🥈</span>
                    <span className="text-xs font-bold text-charcoal-text/60 mt-1 uppercase font-mono">
                      {language === "en" ? "Slot Vacant" : "Slot Kosong"}
                    </span>
                  </div>
                )}
              </div>

              {/* Podium #1: Gold */}
              <div className="order-1 md:order-2 flex flex-col gap-2">
                {gold ? (
                  <div
                    className="bg-[#FFE259]/10 p-6 flex flex-col gap-3.5 relative border-3 border-lime-accent text-charcoal-text overflow-hidden"
                    style={{
                      borderRadius: "var(--radius-input)",
                      boxShadow: "6px 6px 0px var(--color-charcoal-text)",
                      minHeight: "230px",
                    }}
                  >
                    <div className="absolute -top-3 right-4 bg-charcoal-text text-lime-accent font-mono font-black text-[9px] px-3 py-1 rounded border-2 border-charcoal-text flex items-center gap-1 uppercase tracking-widest shadow-[2px_2px_0px_#000]">
                      👑 CONSTRUCTOR #1
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-[9px] font-mono text-lime-accent font-black uppercase tracking-wider block bg-charcoal-text px-1.5 py-0.5 rounded text-center self-start inline-block">CHAMPION SPONSOR</span>
                      <h3 className="font-black text-charcoal-text text-2xl truncate font-mono mt-1">{gold.name}</h3>
                      <span className="inline-block bg-charcoal-text text-lime-accent text-xs font-black px-2.5 py-1 rounded-md mt-1.5 shadow-[2px_2px_0px_#000]">
                        {formatRupiah(gold.amount)}
                      </span>
                    </div>
                    {gold.message && (
                      <p className="text-xs text-charcoal-text/90 font-semibold italic leading-relaxed border-l-3 border-lime-accent pl-2.5">
                        "{gold.message}"
                      </p>
                    )}
                    <span className="text-[9px] text-charcoal-text/60 font-mono font-bold mt-auto">
                      TELEMETRY REC: {formatDate(gold.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div
                    className="border-3 border-dashed border-lime-accent rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-60"
                    style={{ minHeight: "230px" }}
                  >
                    <span className="text-2xl">👑</span>
                    <span className="text-xs font-bold text-charcoal-text/60 mt-1 uppercase font-mono">
                      {language === "en" ? "Slot Vacant" : "Slot Kosong"}
                    </span>
                  </div>
                )}
              </div>

              {/* Podium #3: Bronze */}
              <div className="order-3 md:order-3 flex flex-col gap-2">
                {bronze ? (
                  <div
                    className="bg-[#FF6B00]/10 p-5 flex flex-col gap-3 relative border-3 border-burnt-orange text-charcoal-text"
                    style={{
                      borderRadius: "var(--radius-input)",
                      boxShadow: "4px 4px 0px var(--color-charcoal-text)",
                      minHeight: "190px",
                    }}
                  >
                    <div className="absolute -top-3 left-4 bg-charcoal-text text-warm-cream font-mono font-black text-[9px] px-2.5 py-0.5 rounded border border-charcoal-text uppercase tracking-widest shadow-[2px_2px_0px_#000]">
                      🥉 CONSTRUCTOR #3
                    </div>
                    <div className="mt-2">
                      <span className="text-[9px] font-mono text-burnt-orange font-bold uppercase tracking-wider block">CONSTRUCTOR TEAM</span>
                      <h3 className="font-black text-charcoal-text text-lg truncate font-mono">{bronze.name}</h3>
                      <span className="inline-block bg-charcoal-text text-burnt-orange text-[11px] font-extrabold px-2 py-0.5 rounded mt-1 shadow-[2px_2px_0px_#000]">
                        {formatRupiah(bronze.amount)}
                      </span>
                    </div>
                    {bronze.message && (
                      <p className="text-xs text-charcoal-text/80 italic leading-relaxed border-l-2 border-burnt-orange/60 pl-2">
                        "{bronze.message}"
                      </p>
                    )}
                    <span className="text-[9px] text-charcoal-text/50 font-mono font-bold mt-auto">
                      TELEMETRY REC: {formatDate(bronze.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div
                    className="border-3 border-dashed border-burnt-orange rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-60"
                    style={{ minHeight: "190px" }}
                  >
                    <span className="text-xl">🥉</span>
                    <span className="text-xs font-bold text-charcoal-text/60 mt-1 uppercase font-mono">
                      {language === "en" ? "Slot Vacant" : "Slot Kosong"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Other Donators list */}
        {!loading && (others.length > 0 || recentDonators.length > 0) && (
          <section
            className="flex flex-col gap-5 bg-charcoal-deep text-warm-cream p-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
            style={{
              borderRadius: "var(--radius-input)",
            }}
          >
            <div>
              <h2 className="font-black text-lg text-lime-accent uppercase font-mono flex items-center gap-2">
                📡 Crew Radio & Pit Message Log
              </h2>
              <p className="text-xs text-warm-cream/70 font-semibold mt-0.5 uppercase tracking-wide font-mono">
                {language === "en"
                  ? "Incoming transmissions and warm logs from pit supporters."
                  : "Transmisi masuk dan log hangat dari para pendukung pit."}
              </p>
            </div>

            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 bg-charcoal-text p-4 border border-lime-accent/25 rounded-lg font-mono text-xs">
              {recentDonators.map((donator) => (
                <div
                  key={donator.id}
                  className="flex flex-col gap-1.5 border-b border-warm-cream/10 pb-3.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center flex-wrap gap-2 text-warm-cream">
                    <span className="text-lime-accent font-bold">[{formatDate(donator.createdAt)}]</span>
                    <span className="bg-lime-accent/10 text-lime-accent border border-lime-accent/30 px-2.5 py-0.5 rounded text-[10px] font-black">
                      {formatRupiah(donator.amount)}
                    </span>
                    <span className="font-bold text-lime-accent font-mono">{donator.name} &gt;</span>
                  </div>
                  {donator.message && (
                    <div className="text-warm-cream/90 pl-4 border-l border-lime-accent/30 mt-1 leading-relaxed text-xs">
                      {donator.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
