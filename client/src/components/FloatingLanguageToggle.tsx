import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "./FloatingLanguageToggle.css";

export default function FloatingLanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <div className="mada-floating-lang-wrap" aria-label="أداة تغيير لغة النظام">
      <button
        type="button"
        onClick={toggleLang}
        className="mada-floating-lang-btn"
        title={lang === "ar" ? "التبديل إلى الإنجليزية (Switch to English)" : "التبديل إلى العربية (Switch to Arabic)"}
        aria-label="Toggle platform language"
      >
        <Globe size={18} className="mada-floating-lang-icon" />
        <span className="mada-floating-lang-label">
          {lang === "ar" ? "English" : "العربية"}
        </span>
        <span className="mada-floating-lang-badge">
          {lang.toUpperCase()}
        </span>
      </button>
    </div>
  );
}
