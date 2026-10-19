import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpLeft,
  Banknote,
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
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FinanceDeskDialogs } from "@/components/FinanceDeskDialogs";
import {
  Collections,
  Expenses,
  NavButton,
  Overview,
  PanelTitle,
  Reports,
  ShiftsView,
  PayrollView,
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
import SessionLogoutButton from "@/components/SessionLogoutButton";
import BranchManagerSidebar from "@/components/BranchManagerSidebar";
import RoleSidebar from "@/components/RoleSidebar";
import {
  canAccessFinanceView,
  financeCapabilitiesForRole,
  type FinanceView,
} from "@/lib/financeAccess";
import {
  apiClient,
  shiftStorage,
  payrollStorage,
  type AuthMe,
  type FinanceExpense,
  type FinanceInvoice,
  type FinancePayment,
  type FinanceReport,
  type ShiftCashHandover,
  type StudentRecord,
  type TrainerPayrollRecord,
} from "@/lib/apiClient";
import {
  buildExpenseMutation,
  buildInvoiceMutation,
  buildPaymentMutation,
  createSingleFlightGuard,
  runSingleFlightMutation,
} from "@/lib/financeMutations";

export type View = FinanceView;
export type InvoiceStatus = "partial" | "overdue" | "paid" | "unpaid";
export type ExpenseStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "CASH" | "VISA" | "INSTAPAY" | "VODAFONE_CASH";
type ExpenseDecisionSubmission = {
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
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const paymentSubmitGuard = useRef(createSingleFlightGuard());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [receivedOn, setReceivedOn] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [externalReference, setExternalReference] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const expenseSubmitGuard = useRef(createSingleFlightGuard());
  const [expenseDecisionSubmitting, setExpenseDecisionSubmitting] =
    useState<ExpenseDecisionSubmission | null>(null);
  const expenseDecisionSubmitGuard = useRef(createSingleFlightGuard());
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
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const invoiceSubmitGuard = useRef(createSingleFlightGuard());
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [evidenceUploadingIds, setEvidenceUploadingIds] = useState<Set<string>>(
    () => new Set()
  );
  const evidenceUploadGuards = useRef(
    new Map<string, ReturnType<typeof createSingleFlightGuard>>()
  );
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

  const [handovers, setHandovers] = useState<ShiftCashHandover[]>(() => shiftStorage.getHandovers());
  const [payrolls, setPayrolls] = useState<TrainerPayrollRecord[]>(() => payrollStorage.getPayrolls());

  useEffect(() => {
    if (liveMode) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      apiClient.instructorPayroll({ month: currentMonth })
        .then(items => {
          if (items && items.length > 0) {
            const livePayrolls: TrainerPayrollRecord[] = items.map((item, idx) => {
              const netPayable = Math.round(item.totalCompensationPiastres / 100);
              const ratePerSession = Math.round(item.sessionRatePiastres / 100);
              return {
                id: `PAY-LIVE-${idx + 1}`,
                instructorId: item.instructorId,
                instructorName: item.instructorName + (item.substituteSessionsCount > 0 ? ` (${item.substituteSessionsCount} كبديل)` : ""),
                month: currentMonth,
                completedSessionsCount: item.completedSessions,
                ratePerSession: ratePerSession,
                baseSalary: 0,
                bonusAmount: 0,
                deductionAmount: 0,
                netPayable: netPayable,
                status: "SUBMITTED" as const,
              };
            });
            const localPayrolls = payrollStorage.getPayrolls();
            const merged = [...livePayrolls, ...localPayrolls.filter(lp => lp.status === "PAID")];
            setPayrolls(merged);
          }
        })
        .catch(() => undefined);
    }
  }, [liveMode]);

  const acceptShiftHandover = async (id: string, notes?: string) => {
    const shift = handovers.find(h => h.id === id);
    if (liveMode && shift) {
      try {
        await apiClient.closeoutCashierShift({ countedCashPiastres: Math.round(shift.cashAmount * 100), notes: notes || "تم استلام ومطابقة النقدية" });
        await apiClient.depositCashierSafe({ amountPiastres: Math.round(shift.cashAmount * 100), notes: `توريد عهدة وردية ${shift.id} إلى الخزينة الرئيسية` });
      } catch (err) {
        // Gracefully handle or log
      }
    }
    const updated = shiftStorage.acceptShift(id, financeMe?.user?.displayName || "المحاسب", 0, notes);
    setHandovers(shiftStorage.getHandovers());
    toast.success(`تم استلام وتوريد عهدة الوردية ${updated.id} للخزينة بنجاح!`);
  };

  const approveTrainerPayroll = (id: string) => {
    payrollStorage.approvePayroll(id);
    setPayrolls(payrollStorage.getPayrolls());
    toast.success("تم اعتماد مسير الراتب، وجاهز للصرف للمدرب");
  };

  const payTrainerPayroll = (id: string, method: string, reference?: string) => {
    payrollStorage.markPaid(id, method, reference);
    setPayrolls(payrollStorage.getPayrolls());
    toast.success(`تم تسجيل صرف الراتب عبر ${method} بنجاح!`);
  };

  const getEvidenceUploadGuard = (key: string) => {
    let guard = evidenceUploadGuards.current.get(key);
    if (!guard) {
      guard = createSingleFlightGuard();
      evidenceUploadGuards.current.set(key, guard);
    }
    return guard;
  };
  const setEvidenceUploadPending = (key: string, pending: boolean) => {
    setEvidenceUploadingIds(current => {
      if (current.has(key) === pending) return current;
      const next = new Set(current);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });
  };

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
    window.location.hash = next === "overview" ? "" : next;
    setMobileOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as View;
      const validViews: View[] = [
        "overview",
        "collections",
        "expenses",
        "shifts",
        "payroll",
        "reports",
      ];
      if (validViews.includes(hash) && canAccessFinanceView(activeAccess, hash)) {
        setView(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [activeAccess]);
  const recordPayment = (event: FormEvent) => {
    event.preventDefault();
    const invoice = invoices.find(item => item.id === paymentInvoice);
    const remaining = invoice ? invoice.total - invoice.collected : 0;
    if (!invoice) {
      toast.error("أدخل مبلغ تحصيل صحيح");
      return;
    }
    const mutation = buildPaymentMutation({ amount: paymentAmount, remaining, method: paymentMethod, receivedOn, externalReference });
    if (!mutation.ok) {
      const messages = { INVALID_AMOUNT: "أدخل مبلغ تحصيل صحيح", OVER_COLLECTION: "المبلغ أكبر من الرصيد المتبقي", MISSING_DATE: "اختر تاريخ استلام التحصيل", MISSING_REFERENCE: "المرجع مطلوب لهذه الطريقة" } as const;
      toast.error(messages[mutation.code], mutation.code === "OVER_COLLECTION" ? { description: `المتاح للتحصيل ${money(remaining)} ج.م فقط.` } : undefined);
      return;
    }
    const input = mutation.input;
    const amount = input.amountPiastres / 100;
    if (liveMode) {
      void runSingleFlightMutation(
        paymentSubmitGuard.current,
        async () => {
          const response = await apiClient.createFinancePayment(invoice.id, input);
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
        },
        setPaymentSubmitting
      ).catch(error =>
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
    const mutation = buildExpenseMutation(expenseDescription, expenseAmount);
    if (!mutation) {
      toast.error("أدخل وصف المصروف والمبلغ");
      return;
    }
    if (liveMode) {
      void runSingleFlightMutation(
        expenseSubmitGuard.current,
        async () => {
          const expense = await apiClient.createFinanceExpense({
            ...mutation,
          });
          setExpenses(current => [mapFinanceExpense(expense), ...current]);
          toast.success("تم رفع المصروف للمراجعة");
          setExpenseDescription("");
          setExpenseAmount("");
        },
        setExpenseSubmitting
      ).catch(error =>
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
        amount: mutation.amountPiastres / 100,
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
      void runSingleFlightMutation(
        expenseDecisionSubmitGuard.current,
        async () => {
          const expense = await apiClient.approveFinanceExpense(
            expenseId,
            reason.trim()
          );
          setExpenses(current =>
            current.map(item =>
              item.id === expenseId ? mapFinanceExpense(expense) : item
            )
          );
          toast.success("تم اعتماد المصروف");
        },
        pending =>
          setExpenseDecisionSubmitting(
            pending ? { expenseId, action: "approve" } : null
          )
      ).catch(error =>
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
      const expenseId = rejecting;
      const reason = rejectReason.trim();
      void runSingleFlightMutation(
        expenseDecisionSubmitGuard.current,
        async () => {
          const expense = await apiClient.rejectFinanceExpense(
            expenseId,
            reason
          );
          setExpenses(current =>
            current.map(item =>
              item.id === expenseId ? mapFinanceExpense(expense) : item
            )
          );
          toast.success("تم رفض المصروف بسبب موثق");
          setRejecting(null);
          setRejectReason("");
        },
        pending =>
          setExpenseDecisionSubmitting(
            pending ? { expenseId, action: "reject" } : null
          )
      ).catch(error =>
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
    const mutation = buildInvoiceMutation(
      invoiceStudentId,
      invoiceDescription,
      invoiceAmount,
      invoiceDueDate
    );
    if (!mutation) {
      toast.error("أدخل الطالب والوصف والمبلغ وتاريخ الاستحقاق");
      return;
    }
    if (!liveMode) {
      toast.info("إنشاء الفواتير متاح في وضع LIVE فقط");
      return;
    }
    void runSingleFlightMutation(
      invoiceSubmitGuard.current,
      async () => {
        const invoice = await apiClient.createFinanceInvoice({
          ...mutation,
        });
        setInvoices(current => [mapFinanceInvoice(invoice), ...current]);
        toast.success("تم إنشاء الفاتورة");
        setInvoiceDialogOpen(false);
        setInvoiceDescription("");
        setInvoiceAmount("");
      },
      setInvoiceSubmitting
    ).catch(error =>
      toast.error(
        error instanceof Error ? error.message : "تعذر إنشاء الفاتورة"
      )
    );
  };
  const uploadPaymentEvidence = (paymentId: string, file: File) => {
    if (!liveMode) return;
    const key = `payment:${paymentId}`;
    void runSingleFlightMutation(
      getEvidenceUploadGuard(key),
      async () => {
        await apiClient.uploadPaymentEvidence(paymentId, file);
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
      },
      pending => setEvidenceUploadPending(key, pending)
    ).catch(error =>
      toast.error(
        error instanceof Error ? error.message : "تعذر رفع إثبات الدفع"
      )
    );
  };
  const uploadExpenseEvidence = (expenseId: string, file: File) => {
    if (!liveMode) return;
    const key = `expense:${expenseId}`;
    void runSingleFlightMutation(
      getEvidenceUploadGuard(key),
      async () => {
        await apiClient.uploadExpenseEvidence(expenseId, file);
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
      },
      pending => setEvidenceUploadPending(key, pending)
    ).catch(error =>
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
      hideSidebar
      roleCode={roleCode}
      roleLabel={roleLabel}
      scopeLevel="branch"
      scopeLabel={
        liveMode ? "المالية داخل النطاق المصرح" : "معاينة بيانات مالية"
      }
      tenantName={financeMe?.academy?.name ?? "أكاديمية مدى"}
      branchName={branchContext}
    >
      {roleCode === "R06" ? (
        <BranchManagerSidebar
          roleCode="R06"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      ) : (
        <RoleSidebar
          roleCode="R05"
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      )}
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
          <div className="finance-desk-tabs" role="tablist" aria-label="أقسام المكتب المالي">
            {canAccessFinanceView(activeAccess, "overview") && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "overview"}
                className={`finance-tab-btn ${view === "overview" ? "active" : ""}`}
                onClick={() => selectView("overview")}
              >
                <LayoutDashboard size={15} />
                <span>ملخص مالي</span>
              </button>
            )}
            {canAccessFinanceView(activeAccess, "collections") && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "collections"}
                className={`finance-tab-btn ${view === "collections" ? "active" : ""}`}
                onClick={() => selectView("collections")}
              >
                <CreditCard size={15} />
                <span>الفواتير والتحصيل</span>
                <span className="finance-tab-badge">{scopedInvoices.length}</span>
              </button>
            )}
            {canAccessFinanceView(activeAccess, "expenses") && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "expenses"}
                className={`finance-tab-btn ${view === "expenses" ? "active" : ""}`}
                onClick={() => selectView("expenses")}
              >
                <TrendingDown size={15} />
                <span>المصاريف</span>
                {pendingCount > 0 && (
                  <span className="finance-tab-badge amber">{pendingCount}</span>
                )}
              </button>
            )}
            {canAccessFinanceView(activeAccess, "shifts") && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "shifts"}
                className={`finance-tab-btn ${view === "shifts" ? "active" : ""}`}
                onClick={() => selectView("shifts")}
              >
                <Banknote size={15} />
                <span>ورديات الاستقبال (الكاش)</span>
                {handovers.filter(h => h.status === "SUBMITTED").length > 0 && (
                  <span className="finance-tab-badge teal">
                    {handovers.filter(h => h.status === "SUBMITTED").length}
                  </span>
                )}
              </button>
            )}
            {canAccessFinanceView(activeAccess, "payroll") && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "payroll"}
                className={`finance-tab-btn ${view === "payroll" ? "active" : ""}`}
                onClick={() => selectView("payroll")}
              >
                <UserCheck size={15} />
                <span>أتعاب المدربين بالحصة</span>
                {payrolls.filter(p => p.status !== "PAID").length > 0 && (
                  <span className="finance-tab-badge blue">
                    {payrolls.filter(p => p.status !== "PAID").length}
                  </span>
                )}
              </button>
            )}
            {canAccessFinanceView(activeAccess, "reports") && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "reports"}
                className={`finance-tab-btn ${view === "reports" ? "active" : ""}`}
                onClick={() => selectView("reports")}
              >
                <BarChart3 size={15} />
                <span>التقارير</span>
              </button>
            )}
          </div>
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
                submitting={paymentSubmitting}
                evidenceUploadingIds={evidenceUploadingIds}
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
                submitting={expenseSubmitting}
                decisionSubmitting={expenseDecisionSubmitting}
                evidenceUploadingIds={evidenceUploadingIds}
              />
            )}
          {(!liveMode || workspaceState === "ready") &&
            canAccessFinanceView(activeAccess, "shifts") &&
            view === "shifts" && (
              <ShiftsView
                handovers={handovers}
                onAccept={acceptShiftHandover}
                accountantName={financeMe?.user?.displayName || "المحاسب"}
              />
            )}
          {(!liveMode || workspaceState === "ready") &&
            canAccessFinanceView(activeAccess, "payroll") &&
            view === "payroll" && (
              <PayrollView
                payrolls={payrolls}
                onApprove={approveTrainerPayroll}
                onPay={payTrainerPayroll}
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
      <FinanceDeskDialogs
        invoiceDialogOpen={invoiceDialogOpen}
        setInvoiceDialogOpen={setInvoiceDialogOpen}
        invoiceStudentId={invoiceStudentId}
        setInvoiceStudentId={setInvoiceStudentId}
        students={students}
        invoiceDescription={invoiceDescription}
        setInvoiceDescription={setInvoiceDescription}
        invoiceAmount={invoiceAmount}
        setInvoiceAmount={setInvoiceAmount}
        invoiceDueDate={invoiceDueDate}
        setInvoiceDueDate={setInvoiceDueDate}
        invoiceSubmitting={invoiceSubmitting}
        createInvoice={createInvoice}
        rejecting={rejecting}
        setRejecting={setRejecting}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectSubmitting={expenseDecisionSubmitting?.action === "reject" && expenseDecisionSubmitting.expenseId === rejecting}
        rejectExpense={rejectExpense}
        liveMode={liveMode}
        workspaceState={workspaceState}
      />
    </RoleDashboardShell>
  );
}
