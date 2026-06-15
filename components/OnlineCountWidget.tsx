"use client";

import { useEffect, useState } from "react";
import { getOrCreateClientId } from "@/lib/client-id";

export default function OnlineCountWidget() {
  const [count, setCount] = useState<number | null>(null);
  const [language, setLanguage] = useState<"id" | "en">("id");

  useEffect(() => {
    // Baca bahasa terpilih dari localStorage saat client-side
    try {
      const savedLang = window.localStorage.getItem("wikirace:language");
      if (savedLang === "en") {
        setLanguage("en");
      }
    } catch {
      // ignore
    }

    const clientId = getOrCreateClientId();

    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/online-count?clientId=${encodeURIComponent(clientId)}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setCount(data.count);
          }
        }
      } catch (err) {
        console.warn("Gagal mengambil jumlah pemain online:", err);
      }
    };

    void fetchCount();
    const interval = setInterval(fetchCount, 45000);
    return () => clearInterval(interval);
  }, []);

  if (count === null) return null;

  return (
    <div
      className="flex items-center gap-1.5 bg-pure-white text-charcoal-text border-2 border-charcoal-text px-2.5 py-1 rounded-full text-xs font-black shadow-[1.5px_1.5px_0px_#000] select-none"
      title={language === "en" ? "Active players online (including bots)" : "Pemain aktif saat ini (termasuk bot)"}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="tabular-nums">
        {count} {language === "en" ? "Online" : "Aktif"}
      </span>
    </div>
  );
}
