import type { ReactNode } from "react";

export type ApprovalQueueTab<T extends string = string> = {
  id: T;
  label: string;
  count?: number;
  icon?: ReactNode;
};

export type ApprovalQueueTabsProps<T extends string = string> = {
  tabs: ApprovalQueueTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  label?: string;
};

export default function ApprovalQueueTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  label = "أنواع الطلبات",
}: ApprovalQueueTabsProps<T>) {
  return (
    <div className="approval-queue-tabs" role="tablist" aria-label={label}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? "active" : ""}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
          {typeof tab.count === "number" && <b>{tab.count}</b>}
        </button>
      ))}
    </div>
  );
}
