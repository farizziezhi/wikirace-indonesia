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
            className="flex items-center gap-2 text-charcoal-text/70 hover:text-charcoal-text font-bold transition text-sm"
          >
            {language === "en" ? "← Back to Homepage" : "← Kembali ke Beranda"}
          </Link>
          <span className="font-extrabold uppercase text-charcoal-text text-[11px] tracking-wider bg-light-beige border border-warm-gray/60 px-3 py-1 rounded-full">
            💖 Hall of Fame
          </span>
        </header>

        {/* Hero Banner Section */}
        <section
          className="chunky bg-pure-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-charcoal-text"
          style={{
            border: "2px solid var(--color-charcoal-text)",
            boxShadow: "var(--shadow-lifted)",
            borderRadius: "var(--radius-input)",
          }}
        >
          <div className="flex-1 flex flex-col gap-2.5">
            <h1
              className="font-black text-charcoal-text tracking-tight"
              style={{ fontSize: "clamp(26px, 4vw, 36px)", lineHeight: 1.1 }}
            >
              {language === "en" ? "Donator Hall of Fame 💖" : "Hall of Fame Donatur 💖"}
            </h1>
            <p className="text-sm sm:text-base text-charcoal-text/80 leading-relaxed font-medium">
              {language === "en"
                ? "WikiRace Indonesia is completely free to play, free of annoying ads, and does not sell user data. Your donations help us pay for server costs (VPS), realtime websocket database (Ably), ELO database (Turso), and hosting."
                : "WikiRace Indonesia sepenuhnya gratis dimainkan, bebas dari iklan yang mengganggu, serta tidak menjual data pengguna. Donasi Anda membantu kami membayar biaya server (VPS), websocket database realtime (Ably), database ELO (Turso), dan hosting."}
            </p>
          </div>
          <div className="w-full sm:w-auto shrink-0">
            <a
              href="https://saweria.co/WikiRace"
              target="_blank"
              rel="noopener noreferrer"
              className="chunky-press text-center flex flex-col items-center justify-center bg-lime-accent text-charcoal-text font-extrabold transition hover:bg-lime-deep px-6 py-4 w-full sm:w-[200px]"
              style={{
                border: "2px solid var(--color-charcoal-text)",
                borderRadius: "var(--radius-input)",
                boxShadow: "var(--shadow-raised)"
              }}
            >
              <span className="text-2xl mb-1">☕</span>
              <span className="text-sm">{language === "en" ? "Support via Saweria" : "Dukung via Saweria"}</span>
              <span className="text-[10px] opacity-70 mt-0.5">
                {language === "en" ? "Starts at Rp 10,000" : "Mulai Rp 10.000"}
              </span>
            </a>
          </div>
        </section>

        {/* Podium Highlight (Top 3 Donators) */}
        <section className="flex flex-col gap-4">
          <h2 className="font-black text-xl text-charcoal-text flex items-center gap-2">
            {language === "en" ? "🏆 Top Donators" : "🏆 Donatur Utama"}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20 bg-pure-white border-2 border-charcoal-text rounded-xl animate-pulse">
              <span className="text-charcoal-text/50 font-bold text-sm">
                {language === "en" ? "Loading donator data..." : "Memuat data donatur..."}
              </span>
            </div>
          ) : !gold && !silver && !bronze ? (
            /* Empty State */
            <div
              className="chunky bg-pure-white p-8 text-center flex flex-col items-center justify-center gap-3"
              style={{
                border: "2px solid var(--color-charcoal-text)",
                borderRadius: "var(--radius-input)",
                boxShadow: "var(--shadow-lifted)"
              }}
            >
              <span className="text-4xl">👑</span>
              <h3 className="font-extrabold text-charcoal-text text-base">
                {language === "en" ? "No Donators Registered Yet" : "Belum Ada Donatur Terdaftar"}
              </h3>
              <p className="text-xs text-charcoal-text/70 max-w-[320px] leading-relaxed">
                {language === "en"
                  ? "Be the first supporter! Click the Saweria button above and your name will be highlighted directly as the first place on the podium!"
                  : "Jadilah pendukung pertama! Klik tombol Saweria di atas dan nama Anda akan langsung di-highlight sebagai raja podium pertama!"}
              </p>
            </div>
          ) : (
            /* Podium Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Podium #2: Silver */}
              <div className="order-2 md:order-1 flex flex-col gap-2">
                {silver ? (
                  <div
                    className="chunky bg-light-beige/40 p-5 flex flex-col gap-3 relative border-2 border-charcoal-text"
                    style={{
                      borderRadius: "var(--radius-input)",
                      boxShadow: "var(--shadow-flat)",
                      minHeight: "180px",
                    }}
                  >
                    <div className="absolute -top-3 left-4 bg-charcoal-text text-warm-cream font-black text-xs px-2.5 py-0.5 rounded-full border border-charcoal-text">
                      🥈 {language === "en" ? "RANK 2" : "PERINGKAT 2"}
                    </div>
                    <div className="mt-2">
                      <h3 className="font-black text-charcoal-text text-lg truncate">{silver.name}</h3>
                      <span className="inline-block bg-charcoal-text text-pure-white text-[11px] font-extrabold px-2 py-0.5 rounded mt-1">
                        {formatRupiah(silver.amount)}
                      </span>
                    </div>
                    {silver.message && (
                      <p className="text-xs text-charcoal-text/80 italic leading-relaxed border-l-2 border-warm-gray/60 pl-2">
                        "{silver.message}"
                      </p>
                    )}
                    <span className="text-[10px] text-charcoal-text/50 font-bold mt-auto">
                      {language === "en" ? "Received: " : "Diterima: "} {formatDate(silver.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-warm-gray rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-60"
                    style={{ minHeight: "180px" }}
                  >
                    <span className="text-xl">🥈</span>
                    <span className="text-xs font-bold text-charcoal-text/60 mt-1">
                      {language === "en" ? "None" : "Belum Ada"}
                    </span>
                  </div>
                )}
              </div>

              {/* Podium #1: Gold */}
              <div className="order-1 md:order-2 flex flex-col gap-2">
                {gold ? (
                  <div
                    className="chunky bg-yellow-accent/40 p-6 flex flex-col gap-3.5 relative border-2 border-charcoal-text overflow-hidden"
                    style={{
                      borderRadius: "var(--radius-input)",
                      boxShadow: "var(--shadow-lifted)",
                      minHeight: "220px",
                    }}
                  >
                    {/* Crown Graphic / Badge */}
                    <div className="absolute -top-3 right-4 bg-charcoal-text text-yellow-accent font-black text-xs px-3 py-1 rounded-full border-2 border-charcoal-text flex items-center gap-1">
                      👑 {language === "en" ? "RANK 1" : "PERINGKAT 1"}
                    </div>
                    
                    <div className="mt-2">
                      <h3 className="font-black text-charcoal-text text-2xl truncate">{gold.name}</h3>
                      <span className="inline-block bg-charcoal-text text-yellow-accent text-xs font-black px-2.5 py-1 rounded-md mt-1.5 shadow-flat">
                        {formatRupiah(gold.amount)}
                      </span>
                    </div>
                    {gold.message && (
                      <p className="text-xs text-charcoal-text/90 font-semibold italic leading-relaxed border-l-3 border-yellow-accent pl-2.5">
                        "{gold.message}"
                      </p>
                    )}
                    <span className="text-[10px] text-charcoal-text/60 font-bold mt-auto">
                      {language === "en" ? "Received: " : "Diterima: "} {formatDate(gold.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-warm-gray rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-60"
                    style={{ minHeight: "220px" }}
                  >
                    <span className="text-2xl">👑</span>
                    <span className="text-xs font-bold text-charcoal-text/60 mt-1">
                      {language === "en" ? "None" : "Belum Ada"}
                    </span>
                  </div>
                )}
              </div>

              {/* Podium #3: Bronze */}
              <div className="order-3 md:order-3 flex flex-col gap-2">
                {bronze ? (
                  <div
                    className="chunky bg-warm-gray/10 p-5 flex flex-col gap-3 relative border-2 border-charcoal-text"
                    style={{
                      borderRadius: "var(--radius-input)",
                      boxShadow: "var(--shadow-flat)",
                      minHeight: "180px",
                    }}
                  >
                    <div className="absolute -top-3 left-4 bg-charcoal-text text-warm-cream font-black text-xs px-2.5 py-0.5 rounded-full border border-charcoal-text">
                      🥉 {language === "en" ? "RANK 3" : "PERINGKAT 3"}
                    </div>
                    <div className="mt-2">
                      <h3 className="font-black text-charcoal-text text-lg truncate">{bronze.name}</h3>
                      <span className="inline-block bg-charcoal-text text-pure-white text-[11px] font-extrabold px-2 py-0.5 rounded mt-1">
                        {formatRupiah(bronze.amount)}
                      </span>
                    </div>
                    {bronze.message && (
                      <p className="text-xs text-charcoal-text/80 italic leading-relaxed border-l-2 border-warm-gray/60 pl-2">
                        "{bronze.message}"
                      </p>
                    )}
                    <span className="text-[10px] text-charcoal-text/50 font-bold mt-auto">
                      {language === "en" ? "Received: " : "Diterima: "} {formatDate(bronze.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-warm-gray rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-60"
                    style={{ minHeight: "180px" }}
                  >
                    <span className="text-xl">🥉</span>
                    <span className="text-xs font-bold text-charcoal-text/60 mt-1">
                      {language === "en" ? "None" : "Belum Ada"}
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
            className="chunky bg-pure-white p-6 flex flex-col gap-5 text-charcoal-text"
            style={{
              border: "2px solid var(--color-charcoal-text)",
              boxShadow: "var(--shadow-lifted)",
              borderRadius: "var(--radius-input)",
            }}
          >
            <div>
              <h2 className="font-black text-lg text-charcoal-text">
                {language === "en" ? "💬 Other Supporters' Messages" : "💬 Pesan Pendukung Lainnya"}
              </h2>
              <p className="text-xs text-charcoal-text/60 font-semibold mt-0.5">
                {language === "en"
                  ? "List of donations along with warm messages from contributors."
                  : "Daftar donasi beserta pesan hangat dari para kontributor."}
              </p>
            </div>

            <div className="flex flex-col gap-3.5 max-h-[400px] overflow-y-auto pr-1">
              {recentDonators.map((donator) => (
                <div
                  key={donator.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-gray/40 pb-3.5 last:border-0 last:pb-0"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center flex-wrap gap-2 text-sm font-bold text-charcoal-text">
                      <span className="bg-light-beige border border-charcoal-text/30 px-2 py-0.5 rounded text-[11px] font-black">
                        {formatRupiah(donator.amount)}
                      </span>
                      <span>{donator.name}</span>
                      <span className="text-[10px] text-charcoal-text/40 font-semibold">
                        ({formatDate(donator.createdAt)})
                      </span>
                    </div>
                    {donator.message && (
                      <div
                        className="bg-light-beige p-2.5 border border-warm-gray text-xs rounded-lg text-charcoal-text/85 relative inline-block self-start"
                        style={{
                          borderTopLeftRadius: "0px",
                          boxShadow: "var(--shadow-flat)"
                        }}
                      >
                        {donator.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
