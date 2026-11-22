import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  type Language,
  TRANSLATIONS,
  ARABIC_TO_ENGLISH_PHRASES,
} from "@/lib/translations";

interface LanguageContextType {
  lang: Language;
  dir: "rtl" | "ltr";
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  toggleLang: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem("mada_lang") as Language;
      return stored === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("mada_lang", newLang);
    } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      document.body.classList.toggle("lang-ar", lang === "ar");
      document.body.classList.toggle("lang-en", lang === "en");
    }
  }, [lang, dir]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      if (!key) return "";
      const currentDict = TRANSLATIONS[lang];
      if (currentDict && currentDict[key]) {
        return currentDict[key];
      }

      if (lang === "en") {
        if (ARABIC_TO_ENGLISH_PHRASES[key]) {
          return ARABIC_TO_ENGLISH_PHRASES[key];
        }
        // Try trimmed lookup
        const trimmed = key.trim();
        if (ARABIC_TO_ENGLISH_PHRASES[trimmed]) {
          return ARABIC_TO_ENGLISH_PHRASES[trimmed];
        }
      }

      return fallback !== undefined ? fallback : key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
