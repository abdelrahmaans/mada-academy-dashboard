import React from "react";
import { Sparkles } from "lucide-react";

export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string | number;
  tone?: "default" | "primary";
}

export default function QuickActionsBar({
  actions,
  title = "إجراءات سريعة:",
  className = "",
}: {
  actions: QuickActionItem[];
  title?: string;
  className?: string;
}) {
  if (!actions.length) return null;

  return (
    <div className={`mada-quick-actions-bar ${className}`.trim()} role="region" aria-label="إجراءات سريعة">
      <span className="mada-quick-actions-title">
        <Sparkles size={15} /> {title}
      </span>
      <div className="mada-quick-actions-list">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`mada-quick-btn ${action.tone === "primary" ? "mada-quick-btn-primary" : ""}`.trim()}
            onClick={action.onClick}
          >
            {action.icon}
            <span>{action.label}</span>
            {action.badge !== undefined && action.badge !== null && action.badge !== "" && (
              <b className="mada-quick-badge">{action.badge}</b>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

