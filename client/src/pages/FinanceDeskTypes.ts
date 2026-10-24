import type {
  FinanceExpense,
  FinanceInvoice,
  FinancePayment,
} from "@/lib/apiClient";
import type { FinanceView } from "@/lib/financeAccess";

export type View = FinanceView;
export type InvoiceStatus = "partial" | "overdue" | "paid" | "unpaid";
export type ExpenseStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "CASH" | "VISA" | "INSTAPAY" | "VODAFONE_CASH";

export type ExpenseDecisionSubmission = {
  expenseId: string;
  action: "approve" | "reject";
};

export type Invoice = {
  id: string;
  number: string;
  student: string;
  parent: string;
  branch: string;
  course: string;
  total: number;
  collected: number;
  due: string;
  status?: InvoiceStatus;
  payments: FinancePayment[];
};

export type Expense = {
  id: string;
  description: string;
  branch: string;
  category: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  createdBy: string;
  reason?: string;
  evidenceStatus?: string;
  evidenceFileName?: string | null;
};

export const INVOICES: Invoice[] = [
  {
    id: "INV-0908",
    number: "MAD-NSR-2026-0908",
    student: "ياسين محمد علي",
    parent: "محمد علي",
    branch: "مدينة نصر",
    course: "روبوتكس مستوى 2",
    total: 4800,
    collected: 2400,
    due: "26 سبتمبر",
    payments: [],
  },
  {
    id: "INV-0904",
    number: "MAD-NSR-2026-0904",
    student: "عمر خالد إبراهيم",
    parent: "نهى إبراهيم",
    branch: "مدينة نصر",
    course: "دوائر إلكترونية",
    total: 4500,
    collected: 1500,
    due: "20 سبتمبر",
    payments: [],
  },
  {
    id: "INV-0905",
    number: "MAD-MAD-2026-0905",
    student: "ليلى أحمد محمود",
    parent: "أحمد محمود",
    branch: "المعادي",
    course: "برمجة للمبتدئين",
    total: 5200,
    collected: 5200,
    due: "18 سبتمبر",
    payments: [],
  },
  {
    id: "INV-0902",
    number: "MAD-ZAY-2026-0902",
    student: "ملك حسام الدين",
    parent: "حسام الدين",
    branch: "الشيخ زايد",
    course: "روبوتكس مستوى 1",
    total: 3900,
    collected: 0,
    due: "30 سبتمبر",
    payments: [],
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "EXP-104",
    description: "مستلزمات روبوتكس للمجموعات الجديدة",
    branch: "مدينة نصر",
    category: "مواد ومستلزمات",
    amount: 3850,
    date: "24 سبتمبر",
    status: "approved",
    createdBy: "أحمد محمود",
  },
  {
    id: "EXP-103",
    description: "صيانة أجهزة معمل البرمجة",
    branch: "المعادي",
    category: "تشغيل وصيانة",
    amount: 1650,
    date: "23 سبتمبر",
    status: "pending",
    createdBy: "سارة خالد",
  },
  {
    id: "EXP-102",
    description: "مكافأة تدريب مسابقة سبتمبر",
    branch: "الشيخ زايد",
    category: "مسابقات",
    amount: 2400,
    date: "22 سبتمبر",
    status: "pending",
    createdBy: "أحمد محمود",
  },
  {
    id: "EXP-101",
    description: "اشتراك خدمة غير معتمد",
    branch: "مدينة نصر",
    category: "أخرى",
    amount: 900,
    date: "21 سبتمبر",
    status: "rejected",
    createdBy: "سارة خالد",
    reason: "المرفق لا يطابق سياسة المصروفات.",
  },
];

export function financeInvoiceStatus(status?: string | null): InvoiceStatus {
  if (!status || typeof status !== "string") return "unpaid";
  switch (status.toUpperCase()) {
    case "PAID":
      return "paid";
    case "PARTIAL":
      return "partial";
    case "OVERDUE":
      return "overdue";
    default:
      return "unpaid";
  }
}

export function mapFinanceInvoice(invoice: FinanceInvoice): Invoice {
  return {
    id: invoice.id,
    number: invoice.invoiceNumber,
    student: invoice.studentName ?? "طالب",
    parent: "—",
    branch: invoice.branchName ?? invoice.branchId,
    course: invoice.lines[0]?.description ?? "—",
    total: invoice.totalPiastres / 100,
    collected: invoice.paidPiastres / 100,
    due: invoice.dueDate,
    status: financeInvoiceStatus(invoice.status),
    payments: invoice.payments,
  };
}

export function mapFinanceExpense(expense: FinanceExpense): Expense {
  const rawStatus =
    typeof expense.status === "string" ? expense.status.toLowerCase() : "pending";
  return {
    id: expense.id || "",
    description: expense.description || "بند مصروف",
    branch: expense.branchName ?? expense.branchId ?? "الفرع الرئيسي",
    category: expense.category || "عام",
    amount:
      typeof expense.amountPiastres === "number"
        ? expense.amountPiastres / 100
        : 0,
    date: expense.spentOn || "",
    status: (rawStatus === "approved" || rawStatus === "rejected"
      ? rawStatus
      : "pending") as ExpenseStatus,
    createdBy: expense.createdByUserId || "",
    reason: expense.approvalReason ?? undefined,
    evidenceStatus: expense.evidenceStatus,
    evidenceFileName: expense.evidenceFileName,
  };
}
