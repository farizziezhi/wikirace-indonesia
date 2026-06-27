"use client";

import { useEffect, useState } from "react";
import { getSavedUiLanguage } from "@/lib/client-id";

/**
 * Hook untuk membaca bahasa UI dari localStorage.
 * Otomatis sync ketika user toggle bahasa dari LanguageToggle.
 */
export function useUiLang(): "id" | "en" {
  const [uiLang, setUiLang] = useState<"id" | "en">("en");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUiLang(getSavedUiLanguage());

    const handler = (e: Event) => {
      setUiLang((e as CustomEvent).detail as "id" | "en");
    };
    window.addEventListener("uiLanguageChanged", handler);
    return () => window.removeEventListener("uiLanguageChanged", handler);
  }, []);

  return uiLang;
}
