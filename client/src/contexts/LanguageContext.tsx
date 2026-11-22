import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  type Language,
  TRANSLATIONS,
  ARABIC_TO_ENGLISH_PHRASES,
  SORTED_ARABIC_PHRASES,
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

const originalTextMap = new WeakMap<Node, string>();

function translateNode(node: Node, lang: Language) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue;
    if (!text || !text.trim()) return;

    if (lang === "en") {
      let current = originalTextMap.get(node) || text;
      if (!originalTextMap.has(node)) {
        originalTextMap.set(node, text);
      }

      let modified = current;
      for (const [ar, en] of SORTED_ARABIC_PHRASES) {
        if (modified.includes(ar)) {
          modified = modified.split(ar).join(en);
        }
      }
      if (modified !== node.nodeValue) {
        node.nodeValue = modified;
      }
    } else {
      const original = originalTextMap.get(node);
      if (original !== undefined && node.nodeValue !== original) {
        node.nodeValue = original;
      }
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.tagName.toLowerCase();
    if (tagName === "script" || tagName === "style" || tagName === "code" || tagName === "pre") {
      return;
    }

    if (tagName === "input" || tagName === "textarea") {
      const input = el as HTMLInputElement;
      if (input.placeholder) {
        if (lang === "en") {
          const orig = input.getAttribute("data-orig-placeholder") || input.placeholder;
          if (!input.hasAttribute("data-orig-placeholder")) {
            input.setAttribute("data-orig-placeholder", orig);
          }
          let modified = orig;
          for (const [ar, en] of SORTED_ARABIC_PHRASES) {
            if (modified.includes(ar)) modified = modified.split(ar).join(en);
          }
          input.placeholder = modified;
        } else {
          const orig = input.getAttribute("data-orig-placeholder");
          if (orig) input.placeholder = orig;
        }
      }
      return;
    }

    for (let i = 0; i < el.childNodes.length; i++) {
      translateNode(el.childNodes[i], lang);
    }
  }
}

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

      const root = document.getElementById("root");
      if (root) {
        translateNode(root, lang);
      }
    }
  }, [lang, dir]);

  // Observer for dynamic UI changes when in English mode
  useEffect(() => {
    if (typeof document === "undefined" || lang !== "en") return;
    const root = document.getElementById("root");
    if (!root) return;

    let timeoutId: any = null;
    const observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        translateNode(root, "en");
      }, 50);
    });

    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [lang]);

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
