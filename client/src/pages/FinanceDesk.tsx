import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Collections,
  Expenses,
  NavButton,
  Overview,
  PanelTitle,
  Reports,
  PAYMENT_METHOD_LABELS,
  STATUS_LABEL,
  EXPENSE_LABEL,
  VIEW_COPY,
  VIEW_TITLES,
  invoiceStatus,
  money,
} from "@/components/FinanceDeskViews";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import {
  canAccessFinanceView,
  financeCapabilitiesForRole,
  type FinanceView,
} from "@/lib/financeAccess";
import {
  apiClient,
  type AuthMe,
  type FinanceExpense,
  type FinanceInvoice,
  type FinancePayment,
  type FinanceReport,
  type StudentRecord,
} from "@/lib/apiClient";

export type View = FinanceView;
export type InvoiceStatus = "partial" | "overdue" | "paid" | "unpaid";
export type ExpenseStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "CASH" | "VISA" | "INSTAPAY" | "VODAFONE_CASH";
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
function mapFinanceInvoice(invoice: FinanceInvoice): Invoice {
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

function financeInvoiceStatus(status: string): InvoiceStatus {
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
function mapFinanceExpense(expense: FinanceExpense): Expense {
  return {
    id: expense.id,
    description: expense.description,
    branch: expense.branchName ?? expense.branchId,
    category: expense.category,
    amount: expense.amountPiastres / 100,
    date: expense.spentOn,
    status: expense.status.toLowerCase() as ExpenseStatus,
    createdBy: expense.createdByUserId,
    reason: expense.approvalReason ?? undefined,
    evidenceStatus: expense.evidenceStatus,
    evidenceFileName: expense.evidenceFileName,
  };
}
export default function FinanceDesk() {
  const [, navigate] = useLocation();
  const [liveMode] = useState(() => apiClient.hasSession());
  const [view, setView] = useState<View>(() =>
    liveMode ? "collections" : "overview"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branch, setBranch] = useState("مدينة نصر");
  const [query, setQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    liveMode ? [] : INVOICES
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    liveMode ? [] : INITIAL_EXPENSES
  );
  const [paymentInvoice, setPaymentInvoice] = useState(() =>
    liveMode ? "" : INVOICES[0].id
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [receivedOn, setReceivedOn] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [externalReference, setExternalReference] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseBranch, setExpenseBranch] = useState("مدينة نصر");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [invoiceStudentId, setInvoiceStudentId] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  });
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [financeMe, setFinanceMe] = useState<AuthMe | null>(null);
  const [financeAccess, setFinanceAccess] = useState(() =>
    financeCapabilitiesForRole(null)
  );
  const [workspaceState, setWorkspaceState] = useState<
    "loading" | "ready" | "error" | "forbidden"
  >(() => (liveMode ? "loading" : "ready"));
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!liveMode) return;
    let cancelled = false;
    setWorkspaceState("loading");
    setLoadError("");
    setInvoices([]);
    setExpenses([]);
    setStudents([]);
    setReport(null);

    const loadFinanceWorkspace = async () => {
      try {
        const currentUser = await apiClient.me();
        const access = financeCapabilitiesForRole(currentUser.role);
        if (cancelled) return;

        setFinanceMe(currentUser);
        setFinanceAccess(access);
        if (!access.allowed) {
          setWorkspaceState("forbidden");
          return;
        }

        const [invoiceResponse, studentResponse] = await Promise.all([
          apiClient.financeInvoices(),
          apiClient.listStudents(),
        ]);
        let loadedExpenses: Expense[] = [];
        let loadedReport: FinanceReport | null = null;
        if (access.canReadExpenses) {
          const [expenseResponse, reportResponse] = await Promise.all([
            apiClient.financeExpenses(),
            apiClient.financeReport(),
          ]);
          loadedExpenses = expenseResponse.items.map(mapFinanceExpense);
          loadedReport = reportResponse;
        }

        if (cancelled) return;
        const loadedInvoices = invoiceResponse.items.map(mapFinanceInvoice);
        setInvoices(loadedInvoices);
        setExpenses(loadedExpenses);
        setStudents(studentResponse.items);
        setReport(loadedReport);
        setInvoiceStudentId(studentResponse.items[0]?.id ?? "");
        setPaymentInvoice(
          loadedInvoices.find(invoice => invoice.collected < invoice.total)
            ?.id ?? ""
        );
        setView(access.initialView);
        setWorkspaceState("ready");
      } catch (error) {
        if (cancelled) return;
        setInvoices([]);
        setExpenses([]);
        setStudents([]);
        setReport(null);
        setLoadError(
          error instanceof Error ? error.message : "تعذر تحميل البيانات المالية"
        );
        setWorkspaceState("error");
      }
    };

    void loadFinanceWorkspace();
    return () => {
      cancelled = true;
    };
  }, [liveMode, loadAttempt]);

  const activeAccess = liveMode
    ? financeAccess
    : financeCapabilitiesForRole("R06_ACCOUNTANT");
  const roleCode: "R05" | "R06" =
    liveMode && financeAccess.roleCode === "R05" ? "R05" : "R06";
  const roleLabel = liveMode
    ? financeAccess.roleLabel || "مساحة مالية"
    : "المحاسب · معاينة";
  const branchContext = liveMode
    ? (financeMe?.branches?.[0]?.name ?? "الفرع المصرح")
    : branch;
  const scopedInvoices = liveMode
    ? invoices
    : invoices.filter(item => item.branch === branch);
  const scopedExpenses = liveMode
    ? expenses
    : expenses.filter(item => item.branch === branch);
  const filteredInvoices = scopedInvoices.filter(
    item =>
      !query.trim() ||
      `${item.number} ${item.student} ${item.parent}`
        .toLocaleLowerCase("ar")
        .includes(query.trim().toLocaleLowerCase("ar"))
  );
  const filteredExpenses = scopedExpenses.filter(
    item =>
      !query.trim() ||
      `${item.description} ${item.createdBy} ${item.category}`
        .toLocaleLowerCase("ar")
        .includes(query.trim().toLocaleLowerCase("ar"))
  );
  const collected = scopedInvoices.reduce(
    (sum, item) => sum + item.collected,
    0
  );
  const outstanding = scopedInvoices.reduce(
    (sum, item) => sum + item.total - item.collected,
    0
  );
  const approvedExpenses = scopedExpenses
    .filter(item => item.status === "approved")
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = scopedExpenses.filter(
    item => item.status === "pending"
  ).length;
  const net = collected - approvedExpenses;
  const exportReport = async () => {
    if (!liveMode) {
      toast.info("تصدير التقرير متاح في وضع LIVE فقط");
      return;
    }
    try {
      const blob = await apiClient.downloadFinanceReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mada-financial-report.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل التقرير المالي");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تعذر تصدير التقرير"
      );
    }
  };
  const selectView = (next: View) => {
    if (!canAccessFinanceView(activeAccess, next)) return;
    setView(next);
    setMobileOpen(false);
    setQuery("");
  };
  const recordPayment = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(paymentAmount);
    const invoice = invoices.find(item => item.id === paymentInvoice);
    const remaining = invoice ? invoice.total - invoice.collected : 0;
    const reference = externalReference.trim();
    if (!invoice || !amount || amount <= 0) {
      toast.error("أدخل مبلغ تحصيل صحيح");
      return;
    }
    if (amount > remaining) {
      toast.error("المبلغ أكبر من الرصيد المتبقي", {
        description: `المتاح للتحصيل ${money(remaining)} ج.م فقط.`,
      });
      return;
    }
    if (!receivedOn) {
      toast.error("اختر تاريخ استلام التحصيل");
      return;
    }
    if (
      (paymentMethod === "INSTAPAY" || paymentMethod === "VODAFONE_CASH") &&
      !reference
    ) {
      toast.error("المرجع مطلوب لهذه الطريقة");
      return;
    }
    const input = {
      amountPiastres: amount * 100,
      method: paymentMethod,
      receivedOn,
      ...(reference ? { externalReference: reference } : {}),
    };
    if (liveMode) {
      void apiClient
        .createFinancePayment(invoice.id, input)
        .then(response => {
          setInvoices(current =>
            current.map(item =>
              item.id === invoice.id
                ? {
                    ...item,
                    collected: item.collected + amount,
                    payments: [response.payment, ...item.payments],
                  }
                : item
            )
          );
          toast.success("تم تسجيل التحصيل على الـAPI");
          setPaymentAmount("");
          setExternalReference("");
        })
        .catch(error =>
          toast.error(
            error instanceof Error ? error.message : "تعذر تسجيل التحصيل"
          )
        );
      return;
    }
    setInvoices(current =>
      current.map(item =>
        item.id === paymentInvoice
          ? { ...item, collected: item.collected + amount }
          : item
      )
    );
    toast.success("تم تسجيل التحصيل في وضع المعاينة", {
      description: `${money(amount)} ج.م · ${PAYMENT_METHOD_LABELS[paymentMethod]}.`,
    });
    setPaymentAmount("");
    setExternalReference("");
  };
  const createExpense = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseDescription.trim() || !amount || amount <= 0) {
      toast.error("أدخل وصف المصروف والمبلغ");
      return;
    }
    if (liveMode) {
      void apiClient
        .createFinanceExpense({
          description: expenseDescription,
          category: "OPERATIONS",
          amountPiastres: amount * 100,
        })
        .then(expense => {
          setExpenses(current => [mapFinanceExpense(expense), ...current]);
          toast.success("تم رفع المصروف للمراجعة");
          setExpenseDescription("");
          setExpenseAmount("");
        })
        .catch(error =>
          toast.error(
            error instanceof Error ? error.message : "تعذر رفع المصروف"
          )
        );
      return;
    }
    setExpenses(current => [
      {
        id: `EXP-${current.length + 110}`,
        description: expenseDescription,
        branch: expenseBranch,
        category: "تشغيل وصيانة",
        amount,
        date: "اليوم",
        status: "pending",
        createdBy: "المحاسب",
      },
      ...current,
    ]);
    toast.success("تم رفع المصروف للمراجعة", {
      description: "لن يدخل الإجماليات المعتمدة قبل قرار الاعتماد.",
    });
    setExpenseDescription("");
    setExpenseAmount("");
  };
  const approveExpense = (expenseId: string) => {
    if (liveMode) {
      const reason = window.prompt("سبب اعتماد المصروف (مطلوب للتدقيق):");
      if (!reason?.trim()) {
        toast.error("يجب إدخال سبب اعتماد المصروف");
        return;
      }
      void apiClient
        .approveFinanceExpense(expenseId, reason.trim())
        .then(expense => {
          setExpenses(current =>
            current.map(item =>
              item.id === expenseId ? mapFinanceExpense(expense) : item
            )
          );
          toast.success("تم اعتماد المصروف");
        })
        .catch(error =>
          toast.error(
            error instanceof Error ? error.message : "تعذر اعتماد المصروف"
          )
        );
      return;
    }
    setExpenses(current =>
      current.map(item =>
        item.id === expenseId ? { ...item, status: "approved" } : item
      )
    );
  };
  const rejectExpense = (event: FormEvent) => {
    event.preventDefault();
    if (!rejecting || !rejectReason.trim()) {
      toast.error("سبب الرفض إلزامي");
      return;
    }
    if (liveMode) {
      void apiClient
        .rejectFinanceExpense(rejecting, rejectReason)
        .then(expense => {
          setExpenses(current =>
            current.map(item =>
              item.id === rejecting ? mapFinanceExpense(expense) : item
            )
          );
          toast.success("تم رفض المصروف بسبب موثق");
          setRejecting(null);
          setRejectReason("");
        })
        .catch(error =>
          toast.error(
            error instanceof Error ? error.message : "تعذر رفض المصروف"
          )
        );
      return;
    }
    setExpenses(current =>
      current.map(item =>
        item.id === rejecting
          ? { ...item, status: "rejected", reason: rejectReason }
          : item
      )
    );
    toast.success("تم رفض المصروف بسبب موثق");
    setRejecting(null);
    setRejectReason("");
  };
  const createInvoice = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(invoiceAmount);
    if (
      !invoiceStudentId ||
      !invoiceDescription.trim() ||
      !amount ||
      amount <= 0 ||
      !invoiceDueDate
    ) {
      toast.error("أدخل الطالب والوصف والمبلغ وتاريخ الاستحقاق");
      return;
    }
    if (!liveMode) {
      toast.info("إنشاء الفواتير متاح في وضع LIVE فقط");
      return;
    }
    void apiClient
      .createFinanceInvoice({
        studentId: invoiceStudentId,
        dueDate: invoiceDueDate,
        lines: [
          {
            description: invoiceDescription.trim(),
            amountPiastres: amount * 100,
          },
        ],
      })
      .then(invoice => {
        setInvoices(current => [mapFinanceInvoice(invoice), ...current]);
        toast.success("تم إنشاء الفاتورة");
        setInvoiceDialogOpen(false);
        setInvoiceDescription("");
        setInvoiceAmount("");
      })
      .catch(error =>
        toast.error(
          error instanceof Error ? error.message : "تعذر إنشاء الفاتورة"
        )
      );
  };
  const uploadPaymentEvidence = (paymentId: string, file: File) => {
    if (!liveMode) return;
    void apiClient
      .uploadPaymentEvidence(paymentId, file)
      .then(() => {
        setInvoices(current =>
          current.map(invoice => ({
            ...invoice,
            payments: invoice.payments.map(payment =>
              payment.id === paymentId
                ? {
                    ...payment,
                    evidenceStatus: "ATTACHED",
                    evidenceFileName: file.name,
                  }
                : payment
            ),
          }))
        );
        toast.success("تم رفع إثبات الدفع");
      })
      .catch(error =>
        toast.error(
          error instanceof Error ? error.message : "تعذر رفع إثبات الدفع"
        )
      );
  };
  const uploadExpenseEvidence = (expenseId: string, file: File) => {
    if (!liveMode) return;
    void apiClient
      .uploadExpenseEvidence(expenseId, file)
      .then(() => {
        setExpenses(current =>
          current.map(expense =>
            expense.id === expenseId
              ? {
                  ...expense,
                  evidenceStatus: "ATTACHED",
                  evidenceFileName: file.name,
                }
              : expense
          )
        );
        toast.success("تم رفع إثبات المصروف");
      })
      .catch(error =>
        toast.error(
          error instanceof Error ? error.message : "تعذر رفع إثبات المصروف"
        )
      );
  };
  const downloadEvidence = async (
    loader: () => Promise<Blob>,
    filename: string
  ) => {
    try {
      const blob = await loader();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تعذر تنزيل الإثبات"
      );
    }
  };
  return (
    <RoleDashboardShell
      demo={!liveMode}
      className="app-shell finance-desk-shell"
      roleCode={roleCode}
      roleLabel={roleLabel}
      scopeLevel="branch"
      scopeLabel={
        liveMode ? "المالية داخل النطاق المصرح" : "معاينة بيانات مالية"
      }
      tenantName={financeMe?.academy?.name ?? "أكاديمية مدى"}
      branchName={branchContext}
    >
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <button
            className="finance-desk-brand"
            onClick={() => navigate("/finance")}
          >
            <strong>مدى</strong>
            <small>المالية والتحصيل · {roleCode}</small>
          </button>
          <button
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="academy-switcher">
          <span className="academy-avatar">
            <Wallet size={20} />
          </span>
          <span className="academy-meta">
            <strong>{financeMe?.academy?.name ?? "أكاديمية مدى"}</strong>
            <small>
              {financeMe?.user?.displayName ?? "مساحة مالية"} · {roleLabel}
            </small>
          </span>
        </div>
        <div className="nav-caption">المساحة المالية</div>
        <nav className="primary-nav">
          {canAccessFinanceView(activeAccess, "overview") && (
            <NavButton
              active={view === "overview"}
              onClick={() => selectView("overview")}
              icon={<LayoutDashboard size={19} />}
              label="ملخص مالي"
            />
          )}
          {canAccessFinanceView(activeAccess, "collections") && (
            <NavButton
              active={view === "collections"}
              onClick={() => selectView("collections")}
              icon={<CreditCard size={19} />}
              label="الفواتير والتحصيل"
              count={scopedInvoices.length}
            />
          )}
          {canAccessFinanceView(activeAccess, "expenses") && (
            <NavButton
              active={view === "expenses"}
              onClick={() => selectView("expenses")}
              icon={<TrendingDown size={19} />}
              label="المصاريف"
              count={pendingCount}
            />
          )}
          {canAccessFinanceView(activeAccess, "reports") && (
            <NavButton
              active={view === "reports"}
              onClick={() => selectView("reports")}
              icon={<BarChart3 size={19} />}
              label="التقارير"
            />
          )}
        </nav>
        {!liveMode && (
          <>
            <div className="nav-caption nav-caption-spaced">روابط أخرى</div>
            <nav className="primary-nav">
              <button
                className="nav-link"
                onClick={() => navigate("/academy-owner")}
              >
                <ShieldCheck size={19} />
                <span>مراجعة الإدارة</span>
              </button>
              <button
                className="nav-link"
                onClick={() => navigate("/approvals")}
              >
                <FileCheck2 size={19} />
                <span>الموافقات</span>
              </button>
            </nav>
          </>
        )}
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>محتاج مساعدة؟</strong>
            <span>سياسة التصحيح والمصروفات</span>
          </div>
          <ChevronLeft size={16} />
        </div>
        <div className="sidebar-bottom">
          <button
            className="nav-link"
            onClick={() => toast("الإعدادات قيد التجهيز")}
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => toast("تم تسجيل الخروج التجريبي")}
          >
            <LogOut size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <label className="finance-branch-select">
              <MapPin size={16} />
              <select
                value={branchContext}
                disabled={liveMode}
                onChange={event => setBranch(event.target.value)}
              >
                {liveMode && (
                  <option value={branchContext}>{branchContext}</option>
                )}
                <option>مدينة نصر</option>
                <option>المعادي</option>
                <option>الشيخ زايد</option>
              </select>
            </label>
          </div>
          <span className="finance-desk-scope">
            <ShieldCheck size={14} /> نطاق الفروع المصرح بها · فصل الإنشاء عن
            الاعتماد
          </span>
        </header>
        <div className="workspace finance-desk-content">
          <PageHeader
            className="welcome-row"
            copyClassName="welcome-copy"
            actionsClassName="welcome-actions"
            eyebrow={
              <span className="eyebrow">
                <i className="eyebrow-dot" /> المالية والتحصيل · {roleCode}
              </span>
            }
            title={VIEW_TITLES[view]}
            description={VIEW_COPY[view]}
            actions={
              <span className="finance-desk-date">
                <CalendarDays size={14} />
                {new Intl.DateTimeFormat("ar-EG", {
                  month: "long",
                  year: "numeric",
                }).format(new Date())}{" "}
                · {branchContext}
              </span>
            }
          />
          <RoleScopeCard className="finance-desk-scope-card" />
          <div className="finance-desk-banner" role="status" aria-live="polite">
            {!liveMode && (
              <>
                <AlertCircle size={15} />
                <span>
                  <strong>DEMO · معاينة محلية:</strong> البيانات والعمليات هنا
                  غير محفوظة على الـAPI.
                </span>
              </>
            )}
            {liveMode && workspaceState === "loading" && (
              <span>جار تحميل بيانات المالية الحية ضمن صلاحيات الحساب…</span>
            )}
            {liveMode && workspaceState === "error" && (
              <span>
                تعذر تحميل البيانات المالية. لم يتم عرض بيانات معاينة.{" "}
                {loadError}{" "}
                <button
                  type="button"
                  onClick={() => setLoadAttempt(value => value + 1)}
                >
                  إعادة المحاولة
                </button>
              </span>
            )}
            {liveMode && workspaceState === "forbidden" && (
              <span>
                هذه المساحة متاحة فقط لدوري R05 السكرتير وR06 المحاسب.
              </span>
            )}
            {(!liveMode || workspaceState === "ready") && (
              <>
                <ShieldCheck size={15} />
                <span>
                  <strong>قاعدة مالية:</strong> الفاتورة المحصلة لا تعدّل
                  مباشرة، والمصروف المرفوض لا يدخل الإجماليات المعتمدة. كل قرار
                  يحتفظ بسبب وسجل.
                </span>
              </>
            )}
          </div>
          {liveMode && workspaceState !== "ready" && (
            <section className="finance-desk-panel" role="status">
              {workspaceState === "loading"
                ? "جار تحميل بيانات الحساب…"
                : workspaceState === "forbidden"
                  ? "لا توجد صلاحية لعرض هذه المساحة."
                  : "البيانات الحية غير متاحة حاليًا؛ أعد المحاولة لاحقًا."}
            </section>
          )}
          {(!liveMode || workspaceState === "ready") && view === "overview" && (
            <Overview
              collected={collected}
              outstanding={outstanding}
              expenses={approvedExpenses}
              net={net}
              pending={pendingCount}
              onCollections={() => selectView("collections")}
              onExpenses={() => selectView("expenses")}
              onReports={() => selectView("reports")}
              scopeHint={liveMode ? "الفرع الحالي" : "كل الفروع · هذا الشهر"}
            />
          )}
          {(!liveMode || workspaceState === "ready") &&
            view === "collections" && (
              <Collections
                invoices={filteredInvoices}
                query={query}
                setQuery={setQuery}
                paymentInvoice={paymentInvoice}
                setPaymentInvoice={setPaymentInvoice}
                amount={paymentAmount}
                setAmount={setPaymentAmount}
                onSubmit={recordPayment}
                onCreateInvoice={() => setInvoiceDialogOpen(true)}
                onUploadEvidence={uploadPaymentEvidence}
                onDownloadEvidence={(paymentId, fileName) =>
                  void downloadEvidence(
                    () => apiClient.downloadPaymentEvidence(paymentId),
                    fileName
                  )
                }
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                receivedOn={receivedOn}
                setReceivedOn={setReceivedOn}
                externalReference={externalReference}
                setExternalReference={setExternalReference}
                roleCode={roleCode}
              />
            )}
          {(!liveMode || workspaceState === "ready") &&
            canAccessFinanceView(activeAccess, "expenses") &&
            view === "expenses" && (
              <Expenses
                expenses={filteredExpenses}
                query={query}
                setQuery={setQuery}
                description={expenseDescription}
                setDescription={setExpenseDescription}
                amount={expenseAmount}
                setAmount={setExpenseAmount}
                branch={expenseBranch}
                setBranch={setExpenseBranch}
                onSubmit={createExpense}
                onReject={setRejecting}
                onApprove={approveExpense}
                onUploadEvidence={uploadExpenseEvidence}
                onDownloadEvidence={(expenseId, fileName) =>
                  void downloadEvidence(
                    () => apiClient.downloadExpenseEvidence(expenseId),
                    fileName
                  )
                }
                liveMode={liveMode}
              />
            )}
          {(!liveMode || workspaceState === "ready") &&
            canAccessFinanceView(activeAccess, "reports") &&
            view === "reports" && (
              <Reports
                invoices={scopedInvoices}
                expenses={scopedExpenses}
                collected={collected}
                approvedExpenses={approvedExpenses}
                net={net}
                report={report}
                liveMode={liveMode}
                onExport={exportReport}
              />
            )}
        </div>
      </main>
      {invoiceDialogOpen && (!liveMode || workspaceState === "ready") && (
        <div className="finance-desk-modal-backdrop">
          <form className="finance-desk-modal" onSubmit={createInvoice}>
            <button
              type="button"
              className="finance-modal-close"
              onClick={() => setInvoiceDialogOpen(false)}
            >
              <X size={16} />
            </button>
            <span className="finance-modal-icon">
              <FileText size={19} />
            </span>
            <h2>إنشاء فاتورة</h2>
            <p>الفاتورة الجديدة ستظهر مباشرة في سجل التحصيل وFamily Portal.</p>
            <label>
              الطالب
              <select
                value={invoiceStudentId}
                onChange={event => setInvoiceStudentId(event.target.value)}
              >
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              وصف البند
              <input
                value={invoiceDescription}
                onChange={event => setInvoiceDescription(event.target.value)}
                placeholder="مثال: رسوم شهر أكتوبر"
              />
            </label>
            <label>
              المبلغ (ج.م)
              <input
                value={invoiceAmount}
                onChange={event => setInvoiceAmount(event.target.value)}
                type="number"
                min="1"
                placeholder="مثال: 2500"
              />
            </label>
            <label>
              تاريخ الاستحقاق
              <input
                value={invoiceDueDate}
                onChange={event => setInvoiceDueDate(event.target.value)}
                type="date"
              />
            </label>
            <button className="finance-desk-primary" type="submit">
              <Plus size={15} /> إنشاء الفاتورة
            </button>
          </form>
        </div>
      )}
      {rejecting && (!liveMode || workspaceState === "ready") && (
        <div className="finance-desk-modal-backdrop">
          <form className="finance-desk-modal" onSubmit={rejectExpense}>
            <button
              type="button"
              className="finance-modal-close"
              onClick={() => setRejecting(null)}
            >
              <X size={16} />
            </button>
            <span className="finance-modal-icon">
              <AlertCircle size={19} />
            </span>
            <h2>رفض المصروف</h2>
            <p>سبب الرفض إلزامي وسيظهر في سجل المصروف.</p>
            <textarea
              value={rejectReason}
              onChange={event => setRejectReason(event.target.value)}
              placeholder="اكتب سببًا واضحًا للرفض..."
              rows={4}
            />
            <button className="finance-desk-primary" type="submit">
              <Check size={15} /> حفظ الرفض
            </button>
          </form>
        </div>
      )}
    </RoleDashboardShell>
  );
}
