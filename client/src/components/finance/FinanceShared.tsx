import { type ReactNode } from "react";
import type {
  ExpenseStatus,
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  View,
} from "@/pages/FinanceDeskTypes";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "نقدي",
  VISA: "بطاقة Visa",
  INSTAPAY: "InstaPay",
  VODAFONE_CASH: "Vodafone Cash",
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  partial: "مدفوعة جزئيًا",
  overdue: "متأخرة",
  paid: "مدفوعة",
  unpaid: "غير مدفوعة",
};

export const EXPENSE_LABEL: Record<ExpenseStatus, string> = {
  pending: "بانتظار الاعتماد",
  approved: "معتمد",
  rejected: "مرفوض",
};

export function money(value: number) {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(num);
}

export function invoiceStatus(invoice: Invoice): InvoiceStatus {
  if (!invoice) return "unpaid";
  if (invoice.status) return invoice.status;
  const collected = typeof invoice.collected === "number" ? invoice.collected : 0;
  const total = typeof invoice.total === "number" ? invoice.total : 0;
  if (collected >= total && total > 0) return "paid";
  if (
    invoice.due &&
    typeof invoice.due === "string" &&
    invoice.due.includes("سبتمبر") &&
    collected === 0
  )
    return "overdue";
  return collected > 0 ? "partial" : "unpaid";
}

export function NavButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button className={`nav-link ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
}

export const VIEW_TITLES: Record<View, string> = {
  overview: "الملخص المالي",
  collections: "الفواتير والتحصيل",
  expenses: "المصاريف",
  shifts: "استلام عهدة ورديات الاستقبال (الكاش)",
  payroll: "مصاريف ومستحقات المدربين",
  reports: "التقارير المالية",
};

export const VIEW_COPY: Record<View, string> = {
  overview:
    "تابع التحصيل والمستحقات والمصروفات المعتمدة قبل اتخاذ الخطوة التالية.",
  collections:
    "سجل الدفعات، راجع الأرصدة، وارفع طلب تصحيح بدل تعديل الفاتورة مباشرة.",
  expenses:
    "أنشئ مصروفًا، راجع حالته، وارفضه بسبب موثق قبل دخوله في الإجماليات.",
  shifts:
    "استلام واعتماد العهدة النقدية اليومية من السكرتارية والاستقبال وتوثيق أي عجز أو فروقات.",
  payroll:
    "احتساب أتعاب المدربين آليًا بناءً على عدد الحصص المنفذة والبدلات والخصومات واعتماد الصرف.",
  reports: "قارن التحصيل بالمصروفات المعتمدة وصافي الحركة حسب الفروع.",
};

export function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
  tone: string;
}) {
  return (
    <article className="finance-desk-kpi">
      <span className={`finance-desk-kpi-icon ${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}

export function PanelTitle({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="finance-desk-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
