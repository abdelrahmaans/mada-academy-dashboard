import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  type Language,
  TRANSLATIONS,
  ARABIC_TO_ENGLISH_PHRASES,
  SORTED_ARABIC_PHRASES,
  ENGLISH_TO_ARABIC_PHRASES,
  SORTED_ENGLISH_PHRASES,
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
      const current = originalTextMap.get(node) || text;
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
      // Switch back to Arabic
      const original = originalTextMap.get(node);
      if (original && node.nodeValue !== original) {
        node.nodeValue = original;
      } else {
        // Fallback reverse-translate using pre-sorted English phrases
        const current = node.nodeValue || "";
        let modified = current;
        for (const [en, ar] of SORTED_ENGLISH_PHRASES) {
          if (modified.includes(en)) {
            modified = modified.split(en).join(ar);
          }
        }
        if (modified !== current) {
          node.nodeValue = modified;
        }
      }
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
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
          if (orig) {
            input.placeholder = orig;
          } else {
            let p = input.placeholder;
            for (const [en, ar] of SORTED_ENGLISH_PHRASES) {
              if (p.includes(en)) p = p.split(en).join(ar);
            }
            input.placeholder = p;
          }
        }
      }
      return;
    }

    // Keep child dir attributes in sync with platform direction
    if (el.hasAttribute("dir")) {
      const targetDir = lang === "ar" ? "rtl" : "ltr";
      if (el.getAttribute("dir") !== targetDir) {
        el.setAttribute("dir", targetDir);
      }
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
      document.body.dir = dir;
      document.body.classList.toggle("lang-ar", lang === "ar");
      document.body.classList.toggle("lang-en", lang === "en");

      const apply = () => {
        const root = document.getElementById("root");
        if (root) {
          const dirElements = root.querySelectorAll<HTMLElement>("[dir]");
          dirElements.forEach((el) => {
            if (el.getAttribute("dir") !== dir) {
              el.setAttribute("dir", dir);
            }
          });
          translateNode(root, lang);
        }
      };

      apply();
      const raf1 = requestAnimationFrame(apply);
      const timer1 = setTimeout(apply, 60);
      const timer2 = setTimeout(apply, 200);

      return () => {
        cancelAnimationFrame(raf1);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [lang, dir]);

  // Observer for dynamic UI changes (new nodes, modals, tables in both EN and AR)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.getElementById("root");
    if (!root) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const dirElements = root.querySelectorAll<HTMLElement>("[dir]");
        dirElements.forEach((el) => {
          if (el.getAttribute("dir") !== dir) {
            el.setAttribute("dir", dir);
          }
        });
        translateNode(root, lang);
      }, 50);
    });

    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
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
        const trimmed = key.trim();
        if (ARABIC_TO_ENGLISH_PHRASES[trimmed]) {
          return ARABIC_TO_ENGLISH_PHRASES[trimmed];
        }
      } else if (lang === "ar") {
        if (ENGLISH_TO_ARABIC_PHRASES[key]) {
          return ENGLISH_TO_ARABIC_PHRASES[key];
        }
        const trimmed = key.trim();
        if (ENGLISH_TO_ARABIC_PHRASES[trimmed]) {
          return ENGLISH_TO_ARABIC_PHRASES[trimmed];
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
