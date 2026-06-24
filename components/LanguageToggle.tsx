"use client";

import { useEffect, useState } from "react";
import { getSavedUiLanguage, saveUiLanguage } from "@/lib/client-id";
import { Translate, Globe } from "@phosphor-icons/react";

/**
 * Toggle bahasa UI — premium neobrutalist pill button dengan Phosphor Icons.
 * Tersimpan otomatis di localStorage, independen dari bahasa artikel Wikipedia.
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
      className="group relative flex items-center justify-between p-1 rounded-full cursor-pointer select-none overflow-hidden transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000]"
      style={{
        width: 96,
        height: 36,
        border: dark
          ? "2px solid rgba(255,255,255,0.8)"
          : "2px solid var(--color-charcoal-text)",
        background: dark ? "rgba(255,255,255,0.08)" : "var(--color-pure-white)",
        boxShadow: dark ? "0 0 0 2px rgba(255,255,255,0.1)" : "3px 3px 0px #282C20",
      }}
    >
      {/* Sliding Active Indicator */}
      <span
        className="absolute top-0.5 bottom-0.5 h-[28px] w-[42px] transition-all duration-300 ease-out"
        style={{
          left: isEn ? "calc(100% - 44px)" : "2px",
          borderRadius: "9999px",
          background: isEn 
            ? "var(--color-lime-accent)" 
            : "var(--color-playdate-yellow)",
          border: dark ? "1.5px solid #fff" : "1.5px solid var(--color-charcoal-text)",
          boxShadow: dark ? "none" : "1px 1px 0px #000",
        }}
      />

      {/* ID Label & Icon */}
      <span
        className="flex-1 flex items-center justify-center gap-0.5 z-10 transition-colors duration-200"
        style={{
          fontSize: 11,
          fontWeight: 900,
          color: !isEn 
            ? "var(--color-charcoal-text)" 
            : dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
        }}
      >
        <Globe size={13} weight={!isEn ? "fill" : "regular"} />
        ID
      </span>

      {/* Center Translate Icon */}
      <span 
        className="z-10 opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ color: dark ? "#fff" : "var(--color-charcoal-text)" }}
      >
        <Translate size={14} />
      </span>

      {/* EN Label & Icon */}
      <span
        className="flex-1 flex items-center justify-center gap-0.5 z-10 transition-colors duration-200"
        style={{
          fontSize: 11,
          fontWeight: 900,
          color: isEn 
            ? "var(--color-charcoal-text)" 
            : dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
        }}
      >
        EN
        <Globe size={13} weight={isEn ? "fill" : "regular"} />
      </span>
    </button>
  );
}
