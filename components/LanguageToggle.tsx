"use client";

import { useEffect, useState } from "react";
import { getSavedUiLanguage, saveUiLanguage } from "@/lib/client-id";

/**
 * Toggle bahasa UI — eye-catching pill button dengan bendera.
 * Tersimpan otomatis di localStorage, independen dari bahasa artikel Wikipedia.
 *
 * Props:
 *  - dark: mode gelap (untuk in-game HUD)
 *  - onChange: callback opsional saat bahasa berubah
 */
export default function LanguageToggle({
  dark = false,
  onChange,
}: {
  dark?: boolean;
  onChange?: (lang: "id" | "en") => void;
}) {
  const [lang, setLang] = useState<"id" | "en">("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLang(getSavedUiLanguage());
    setMounted(true);

    // Listen for changes from other components/tabs
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as "id" | "en";
      setLang(detail);
    };
    window.addEventListener("uiLanguageChanged", handler);
    return () => window.removeEventListener("uiLanguageChanged", handler);
  }, []);

  const toggle = () => {
    const next = lang === "en" ? "id" : "en";
    setLang(next);
    saveUiLanguage(next);
    onChange?.(next);
    // Broadcast to other components on the same page
    window.dispatchEvent(
      new CustomEvent("uiLanguageChanged", { detail: next }),
    );
  };

  if (!mounted) return null;

  const isEn = lang === "en";

  return (
    <button
      type="button"
      onClick={toggle}
      title={isEn ? "Switch to Bahasa Indonesia" : "Ganti ke English"}
      aria-label={isEn ? "Switch language to Indonesian" : "Ganti bahasa ke Inggris"}
      className="group relative flex items-center gap-0 rounded-full transition-all duration-300 cursor-pointer select-none overflow-hidden"
      style={{
        height: 32,
        background: dark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.06)",
        backdropFilter: "blur(12px)",
        border: dark
          ? "1px solid rgba(255,255,255,0.15)"
          : "1px solid rgba(0,0,0,0.10)",
        boxShadow: dark
          ? "0 2px 8px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* ID side */}
      <span
        className="flex items-center gap-1 px-2.5 h-full transition-all duration-300"
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.05em",
          borderRadius: "9999px 0 0 9999px",
          background: !isEn
            ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
            : "transparent",
          color: !isEn
            ? "#fff"
            : dark
              ? "rgba(255,255,255,0.5)"
              : "rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ fontSize: 14 }}>🇮🇩</span>
        ID
      </span>

      {/* Divider */}
      <span
        className="block h-4 transition-opacity duration-300"
        style={{
          width: 1,
          background: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
        }}
      />

      {/* EN side */}
      <span
        className="flex items-center gap-1 px-2.5 h-full transition-all duration-300"
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.05em",
          borderRadius: "0 9999px 9999px 0",
          background: isEn
            ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
            : "transparent",
          color: isEn
            ? "#fff"
            : dark
              ? "rgba(255,255,255,0.5)"
              : "rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ fontSize: 14 }}>🇺🇸</span>
        EN
      </span>
    </button>
  );
}
