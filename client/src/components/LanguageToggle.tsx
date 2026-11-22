import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "./LanguageToggle.css";

interface LanguageToggleProps {
  className?: string;
  variant?: "topbar" | "sidebar" | "compact" | "pill";
  showLabel?: boolean;
}

export default function LanguageToggle({
  className = "",
  variant = "topbar",
  showLabel = true,
}: LanguageToggleProps) {
  const { lang, toggleLang } = useLanguage();

  const targetLabel = lang === "ar" ? "English" : "العربية";
  const title = lang === "ar" ? "التبديل إلى الإنجليزية (Switch to English)" : "التبديل إلى العربية (Switch to Arabic)";

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`mada-lang-toggle mada-lang-toggle-${variant} ${className}`.trim()}
      title={title}
      aria-label={title}
    >
      <Globe size={16} className="mada-lang-icon" />
      {showLabel && <span className="mada-lang-text">{targetLabel}</span>}
      <span className="mada-lang-badge">{lang.toUpperCase()}</span>
    </button>
  );
}
