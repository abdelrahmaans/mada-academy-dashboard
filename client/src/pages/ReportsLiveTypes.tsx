import React, { type ReactNode } from "react";

export type ReportsTab = "overview" | "expenses" | "radar" | "courses" | "instructors";

export function FinanceStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article className={`reports-live-stat reports-live-stat-${tone}`}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}
