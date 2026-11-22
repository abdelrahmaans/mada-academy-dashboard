import React from "react";
import { CalendarDays } from "lucide-react";
import "./RoleDateBadge.css";

interface RoleDateBadgeProps {
  className?: string;
  style?: React.CSSProperties;
  hideOnMobile?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function formatSystemDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString("ar-EG", {
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
  const formattedDate = formatSystemDate();

  return (
    <span
      className={`role-date-badge ${hideOnMobile ? "hide-mobile" : ""} ${className}`.trim()}
      style={style}
      title={formattedDate}
      aria-label={`تاريخ اليوم: ${formattedDate}`}
    >
      {prefix}
      <CalendarDays size={14} aria-hidden="true" />
      <span>{formattedDate}</span>
      {suffix}
    </span>
  );
}
