import { useState, useEffect } from "react";
import { getSavedUiLanguage } from "@/lib/client-id";

export function useUiLanguage() {
  const [lang, setLang] = useState<"id" | "en">("id");
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

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = lang;
    }
  }, [lang, mounted]);

  return { lang, isEn: lang === "en", mounted };
}
