import type { HTMLAttributes } from "react";

type StatusBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  status: string;
  label?: string;
};

const defaultLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING: "قيد الانتظار",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  LOCKED: "مقفل",
  CANCELLED: "ملغى",
  COMPLETED: "مكتمل",
  NEEDS_REVIEW: "يحتاج مراجعة",
  FAILED: "فشل",
  DISABLED: "غير متاح",
  IN_PROGRESS: "جارية",
  SCHEDULED: "مجدولة",
  ACTIVE: "نشطة",
  TRIAL: "تجريبية",
  SETUP: "تحتاج استكمالًا",
  PAUSED: "معلّقة",
};

export default function StatusBadge({
  status,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const normalizedStatus = status.trim().toUpperCase().replace(/\s+/g, "_");
  const classes = [
    "status-badge",
    `status-badge-${normalizedStatus.toLowerCase()}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span {...props} className={classes} data-status={normalizedStatus}>
      {label ?? defaultLabels[normalizedStatus] ?? status}
    </span>
  );
}
