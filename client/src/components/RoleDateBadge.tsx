import React from "react";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "./RoleDateBadge.css";

interface RoleDateBadgeProps {
  className?: string;
  style?: React.CSSProperties;
  hideOnMobile?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function formatSystemDate(date: Date = new Date(), lang: "ar" | "en" = "ar"): string {
  try {
    const locale = lang === "en" ? "en-US" : "ar-EG-u-nu-latn";
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString(lang === "en" ? "en-US" : "ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}

export default function RoleDateBadge({
  className = "",
  style,
  hideOnMobile = true,
  prefix,
  suffix,
}: RoleDateBadgeProps) {
  const { lang, t } = useLanguage();
  const formattedDate = formatSystemDate(new Date(), lang);

  return (
    <span
      className={`role-date-badge ${hideOnMobile ? "hide-mobile" : ""} ${className}`.trim()}
      style={style}
      title={formattedDate}
      aria-label={`${lang === "en" ? "Today's Date" : "تاريخ اليوم"}: ${formattedDate}`}
    >
      {prefix}
      <CalendarDays size={14} aria-hidden="true" />
      <span>{formattedDate}</span>
      {suffix}
    </span>
  );
}
