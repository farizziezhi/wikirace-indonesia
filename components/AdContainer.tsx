"use client";

import { useEffect, useRef, useState } from "react";

export type AdType =
  | "homepage-banner"
  | "lobby-banner"
  | "skyscraper-left"
  | "skyscraper-right"
  | "results-banner"
  | "sticky-footer";

interface AdContainerProps {
  type: AdType;
  className?: string;
}

export default function AdContainer({ type, className = "" }: AdContainerProps) {
  const [hydrated, setHydrated] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
    if (type === "sticky-footer") {
      try {
        if (window.sessionStorage.getItem("wikirace:hide-footer-ad") === "true") {
          setIsClosed(true);
        }
      } catch {
        // ignore
      }
    }
  }, [type]);

  const handleClose = () => {
    setIsClosed(true);
    try {
      window.sessionStorage.setItem("wikirace:hide-footer-ad", "true");
    } catch {
      // ignore
    }
  };

  // Ambil konfigurasi iklan dari environment variables
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID; // Contoh: ca-pub-XXXXXXXXXXXXXXXX
  const isAdSenseEnabled = !!adsenseClientId;

  // Efek untuk memicu inisialisasi script Google AdSense jika aktif
  useEffect(() => {
    if (!hydrated || !isAdSenseEnabled || isClosed) return;
    try {
      // Panggil push iklan Google AdSense
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (err) {
      console.warn("Gagal inisialisasi unit iklan Google AdSense:", err);
    }
  }, [hydrated, isAdSenseEnabled, isClosed]);

  // Efek untuk memicu iklan Adsterra secara dinamis jika AdSense tidak aktif
  useEffect(() => {
    if (!hydrated || isAdSenseEnabled || isClosed || !containerRef.current) return;

    // Bersihkan kontainer sebelum merender
    containerRef.current.innerHTML = "";

    let key = "";
    let width = 0;
    let height = 0;

    switch (type) {
      case "homepage-banner":
        key = "c1e217e605ed0f620368784a1d47e979";
        width = 300;
        height = 250;
        break;
      case "results-banner":
        key = "c1e217e605ed0f620368784a1d47e979"; // Gunakan key banner 300x250 untuk layar hasil
        width = 300;
        height = 250;
        break;
      case "lobby-banner":
      case "sticky-footer":
        key = "37fb2cc3c9984cf60441480e40a18713";
        width = 728;
        height = 90;
        break;
      case "skyscraper-left":
      case "skyscraper-right":
        key = "596058e2ffebb086794b033f1c3bb100";
        width = 160;
        height = 600;
        break;
    }

    if (!key) return;

    const adEl = document.createElement("div");
    adEl.className = "flex items-center justify-center w-full h-full";

    const scriptOpt = document.createElement("script");
    scriptOpt.type = "text/javascript";
    scriptOpt.innerHTML = `
      atOptions = {
        'key' : '${key}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;

    const scriptSrc = document.createElement("script");
    scriptSrc.type = "text/javascript";
    scriptSrc.src = `https://www.highperformanceformat.com/${key}/invoke.js`;

    adEl.appendChild(scriptOpt);
    adEl.appendChild(scriptSrc);
    containerRef.current.appendChild(adEl);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [hydrated, isAdSenseEnabled, isClosed, type]);

  if (!hydrated || isClosed) {
    return null; // Hindari mismatch saat SSR atau jika ditutup
  }

  // Tentukan dimensi visual untuk placeholder neobrutalism (jika mode dev murni/tidak ada iklan sama sekali)
  let dimensionsLabel = "";
  let sizeClasses = "";

  switch (type) {
    case "homepage-banner":
      dimensionsLabel = "300 x 250 (Medium Banner)";
      sizeClasses = "w-full max-w-[300px] h-[250px] mx-auto";
      break;
    case "lobby-banner":
      dimensionsLabel = "728 x 90 (Lobby Banner)";
      sizeClasses = "w-full max-w-[728px] h-[90px] mx-auto";
      break;
    case "skyscraper-left":
    case "skyscraper-right":
      dimensionsLabel = "160 x 600 (Skyscraper)";
      sizeClasses = "w-[160px] h-[600px]";
      break;
    case "results-banner":
      dimensionsLabel = "336 x 280 (Large Banner)";
      sizeClasses = "w-full max-w-[336px] h-[280px] mx-auto";
      break;
    case "sticky-footer":
      dimensionsLabel = "Responsive Sticky Footer (728x90 / 320x50)";
      sizeClasses = "w-full h-[50px] sm:h-[90px]";
      break;
  }

  // Khusus tipe sticky-footer, tangani wrapper fixed dan tombol close secara khusus
  if (type === "sticky-footer") {
    const adSlotId = isAdSenseEnabled ? (process.env.NEXT_PUBLIC_ADS_SLOT_FOOTER || "") : "";

    return (
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-warm-cream border-t-2 border-charcoal-text flex items-center justify-center p-1 sm:p-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] ${className}`}>
        <button
          onClick={handleClose}
          className="absolute right-2 -top-7 bg-burnt-orange text-warm-cream border border-charcoal-text font-bold text-[10px] px-1.5 py-0.5 shadow-[1px_1px_0px_#000] hover:bg-burnt-orange/90 transition z-50 cursor-pointer"
          title="Tutup Iklan"
        >
          Tutup ×
        </button>
        {isAdSenseEnabled ? (
          <div className="w-full max-w-[728px] overflow-hidden flex items-center justify-center">
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client={adsenseClientId}
              data-ad-slot={adSlotId}
              data-ad-format="horizontal"
              data-full-width-responsive="true"
            />
          </div>
        ) : (
          /* Render Adsterra secara dinamis melalui containerRef */
          <div ref={containerRef} className="w-full max-w-[728px] h-[50px] sm:h-[90px]" />
        )}
      </div>
    );
  }

  // Jika Google AdSense diaktifkan
  if (isAdSenseEnabled) {
    let adSlotId = "";
    switch (type) {
      case "homepage-banner":
        adSlotId = process.env.NEXT_PUBLIC_ADS_SLOT_HOMEPAGE || "";
        break;
      case "lobby-banner":
        adSlotId = process.env.NEXT_PUBLIC_ADS_SLOT_LOBBY || "";
        break;
      case "skyscraper-left":
        adSlotId = process.env.NEXT_PUBLIC_ADS_SLOT_SKYSCRAPER_LEFT || "";
        break;
      case "skyscraper-right":
        adSlotId = process.env.NEXT_PUBLIC_ADS_SLOT_SKYSCRAPER_RIGHT || "";
        break;
      case "results-banner":
        adSlotId = process.env.NEXT_PUBLIC_ADS_SLOT_RESULTS || "";
        break;
    }

    return (
      <div
        ref={containerRef}
        className={`ad-wrapper overflow-hidden my-4 ${className}`}
        style={{ minHeight: 50 }}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adsenseClientId}
          data-ad-slot={adSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Render Adsterra secara dinamis melalui containerRef sebagai fallback aktif
  return (
    <div
      ref={containerRef}
      className={`ad-wrapper overflow-hidden ${sizeClasses} ${className}`}
    />
  );
}
