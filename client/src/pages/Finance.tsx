import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpLeft,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type InvoiceStatus = "unpaid" | "partial" | "paid" | "overdue";
type Invoice = {
  id: string;
  invoiceNumber: string;
  student: string;
  parent: string;
  course: string;
  branch: string;
  issueDate: string;
  dueDate: string;
  total: number;
  collected: number;
};
type Expense = {
  id: string;
  description: string;
  category:
    | "instructor_salary"
    | "competition"
    | "materials"
    | "events"
    | "operational"
    | "other";
  branch: string;
  date: string;
  amount: number;
  createdBy: string;
  approvalStatus: "pending" | "approved";
  approvedBy?: string;
  approvalNote?: string;
};
type CorrectionRequestStatus = "pending" | "approved" | "rejected";
type InvoiceCorrectionRequest = {
  id: string;
  invoiceId: string;
  reason: string;
  evidenceReference: string;
  evidenceFileName: string;
  status: CorrectionRequestStatus;
  requestedAt: string;
  requestedBy: string;
};
type FinanceTab = "collections" | "expenses";
type FinanceDialog = "payment" | "expense" | "correction" | null;

const BRANCHES = ["كل الفروع", "مدينة نصر", "المعادي", "الشيخ زايد"];
const TODAY = "2026-09-26";
const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "MAD-NSR-2026-0908",
    student: "ياسين محمد علي",
    parent: "محمد علي",
    course: "روبوتكس مستوى 2",
    branch: "مدينة نصر",
    issueDate: "2026-09-08",
    dueDate: "2026-09-26",
    total: 4800,
    collected: 2400,
  },
  {
    id: "inv-2",
    invoiceNumber: "MAD-MAD-2026-0905",
    student: "ليلى أحمد محمود",
    parent: "أحمد محمود",
    course: "برمجة للمبتدئين",
    branch: "المعادي",
    issueDate: "2026-09-05",
    dueDate: "2026-09-18",
    total: 5200,
    collected: 5200,
  },
  {
    id: "inv-3",
    invoiceNumber: "MAD-NSR-2026-0904",
    student: "عمر خالد إبراهيم",
    parent: "نهى إبراهيم",
    course: "دوائر إلكترونية",
    branch: "مدينة نصر",
    issueDate: "2026-09-04",
    dueDate: "2026-09-20",
    total: 4500,
    collected: 1500,
  },
  {
    id: "inv-4",
    invoiceNumber: "MAD-ZAY-2026-0902",
    student: "ملك حسام الدين",
    parent: "حسام الدين",
    course: "روبوتكس مستوى 1",
    branch: "الشيخ زايد",
    issueDate: "2026-09-02",
    dueDate: "2026-09-30",
    total: 3900,
    collected: 0,
  },
  {
    id: "inv-5",
    invoiceNumber: "MAD-MAD-2026-0910",
    student: "آدم شريف حسن",
    parent: "شريف حسن",
    course: "ذكاء اصطناعي للصغار",
    branch: "المعادي",
    issueDate: "2026-09-10",
    dueDate: "2026-09-25",
    total: 5600,
    collected: 2800,
  },
  {
    id: "inv-6",
    invoiceNumber: "MAD-MAD-2026-0901",
    student: "نور عمرو فؤاد",
    parent: "عمرو فؤاد",
    course: "برمجة الألعاب",
    branch: "المعادي",
    issueDate: "2026-09-01",
    dueDate: "2026-09-14",
    total: 4200,
    collected: 2100,
  },
  {
    id: "inv-7",
    invoiceNumber: "MAD-ZAY-2026-0912",
    student: "سيف مصطفى عادل",
    parent: "مصطفى عادل",
    course: "الدوائر والروبوتات",
    branch: "الشيخ زايد",
    issueDate: "2026-09-12",
    dueDate: "2026-09-28",
    total: 4800,
    collected: 4800,
  },
];
const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    description: "مستلزمات روبوتكس للمجموعات الجديدة",
    category: "materials",
    branch: "مدينة نصر",
    date: "2026-09-24",
    amount: 3850,
    createdBy: "أحمد محمود",
    approvalStatus: "approved",
  },
  {
    id: "exp-2",
    description: "مكافأة تدريب مسابقة سبتمبر",
    category: "competition",
    branch: "الشيخ زايد",
    date: "2026-09-22",
    amount: 2400,
    createdBy: "أحمد محمود",
    approvalStatus: "approved",
  },
  {
    id: "exp-3",
    description: "صيانة أجهزة معمل البرمجة",
    category: "operational",
    branch: "المعادي",
    date: "2026-09-19",
    amount: 1650,
    createdBy: "سارة خالد",
    approvalStatus: "approved",
  },
  {
    id: "exp-4",
    description: "أجر مدرب — حصص الأسبوع الثالث",
    category: "instructor_salary",
    branch: "مدينة نصر",
    date: "2026-09-17",
    amount: 6200,
    createdBy: "أحمد محمود",
    approvalStatus: "approved",
  },
  {
    id: "exp-5",
    description: "يوم الأنشطة الشهرية",
    category: "events",
    branch: "المعادي",
    date: "2026-09-12",
    amount: 2900,
    createdBy: "سارة خالد",
    approvalStatus: "approved",
  },
];
const STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "غير مدفوعة",
  partial: "مدفوعة جزئيًا",
  paid: "مدفوعة",
  overdue: "متأخرة",
};
const CORRECTION_STATUS_LABELS: Record<CorrectionRequestStatus, string> = {
  pending: "بانتظار المراجعة",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
};
const CATEGORY_LABELS: Record<Expense["category"], string> = {
  instructor_salary: "أجور مدربين",
  competition: "مسابقات",
  materials: "مواد ومستلزمات",
  events: "فعاليات",
  operational: "تشغيل وصيانة",
  other: "أخرى",
};
const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدي",
  card: "بطاقة",
  transfer: "تحويل",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function getStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.collected >= invoice.total) return "paid";
  if (invoice.dueDate < TODAY) return "overdue";
  if (invoice.collected > 0) return "partial";
  return "unpaid";
}
function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="مدى">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M4 12.5 12.5 8l8.2 4.5v9.4l-8.2 4.6L4 21.9v-9.4Z"
            fill="currentColor"
          />
          <path
            d="m19.3 12.5 8.2-4.5 8.5 4.5v9.4l-8.5 4.6-8.2-4.6v-9.4Z"
            fill="currentColor"
            opacity=".72"
          />
          <path
            d="m11.5 24.1 8.3-4.6 8.2 4.6v8.2l-8.2 4.4-8.3-4.4v-8.2Z"
            fill="currentColor"
            opacity=".48"
          />
        </svg>
      </span>
      <span className="brand-word">مدى</span>
    </div>
  );
}

export default function Finance() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<FinanceTab>("collections");
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("كل الفروع");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dialog, setDialog] = useState<FinanceDialog>(null);
  const [correctionRequests, setCorrectionRequests] = useState<
    InvoiceCorrectionRequest[]
  >([]);
  const [correctionInvoiceId, setCorrectionInvoiceId] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionEvidenceReference, setCorrectionEvidenceReference] =
    useState("");
  const [correctionEvidenceFileName, setCorrectionEvidenceFileName] =
    useState("");
  const [correctionValidationError, setCorrectionValidationError] =
    useState("");
  const [invoiceId, setInvoiceId] = useState(
    INITIAL_INVOICES.find(invoice => invoice.collected < invoice.total)?.id ??
      ""
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] =
    useState<Expense["category"]>("materials");
  const [expenseBranch, setExpenseBranch] = useState("مدينة نصر");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [monthlyReportOpen, setMonthlyReportOpen] = useState(false);
  const currentInvoice = invoices.find(invoice => invoice.id === invoiceId);
  const remainingForInvoice = currentInvoice
    ? Math.max(0, currentInvoice.total - currentInvoice.collected)
    : 0;
  const correctionInvoice = invoices.find(
    invoice => invoice.id === correctionInvoiceId
  );
  const correctionHistory = correctionRequests.filter(
    request => request.invoiceId === correctionInvoiceId
  );
  const hasPendingCorrection = correctionHistory.some(
    request => request.status === "pending"
  );

  const visibleInvoices = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return invoices.filter(invoice => {
      const matchesText =
        !needle ||
        [
          invoice.invoiceNumber,
          invoice.student,
          invoice.parent,
          invoice.course,
        ].some(part => part.toLocaleLowerCase("ar").includes(needle));
      const matchesBranch = branch === "كل الفروع" || invoice.branch === branch;
      const status = getStatus(invoice);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesText && matchesBranch && matchesStatus;
    });
  }, [invoices, query, branch, statusFilter]);
  const visibleExpenses = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return expenses.filter(expense => {
      const matchesText =
        !needle ||
        [
          expense.description,
          expense.createdBy,
          CATEGORY_LABELS[expense.category],
        ].some(part => part.toLocaleLowerCase("ar").includes(needle));
      const matchesBranch = branch === "كل الفروع" || expense.branch === branch;
      const matchesCategory =
        statusFilter === "all" || expense.category === statusFilter;
      return matchesText && matchesBranch && matchesCategory;
    });
  }, [expenses, query, branch, statusFilter]);
  const scopedInvoices =
    branch === "كل الفروع"
      ? invoices
      : invoices.filter(invoice => invoice.branch === branch);
  const scopedExpenses =
    branch === "كل الفروع"
      ? expenses
      : expenses.filter(expense => expense.branch === branch);
  const approvedExpenses = scopedExpenses.filter(
    expense => expense.approvalStatus === "approved"
  );
  const pendingExpenseCount = scopedExpenses.filter(
    expense => expense.approvalStatus === "pending"
  ).length;
  const collectedTotal = scopedInvoices.reduce(
    (sum, invoice) => sum + invoice.collected,
    0
  );
  const receivables = scopedInvoices.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.total - invoice.collected),
    0
  );
  const overdueTotal = scopedInvoices
    .filter(invoice => getStatus(invoice) === "overdue")
    .reduce((sum, invoice) => sum + invoice.total - invoice.collected, 0);
  const expensesTotal = approvedExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const collectionRatio = scopedInvoices.length
    ? Math.round(
        (scopedInvoices.reduce((sum, invoice) => sum + invoice.collected, 0) /
          scopedInvoices.reduce((sum, invoice) => sum + invoice.total, 0)) *
          100
      )
    : 0;
  const monthlyBilled = scopedInvoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0
  );
  const monthlyCollected = scopedInvoices.reduce(
    (sum, invoice) => sum + invoice.collected,
    0
  );
  const monthlyNetCash = monthlyCollected - expensesTotal;
  const monthlyBranchBreakdown = BRANCHES.filter(
    item => item !== "كل الفروع"
  ).map(item => {
    const invoicesForBranch = invoices.filter(
      invoice => invoice.branch === item
    );
    const expensesForBranch = expenses
      .filter(expense => expense.branch === item)
      .filter(expense => expense.approvalStatus === "approved")
      .reduce((sum, expense) => sum + expense.amount, 0);
    return {
      branch: item,
      collected: invoicesForBranch.reduce(
        (sum, invoice) => sum + invoice.collected,
        0
      ),
      outstanding: invoicesForBranch.reduce(
        (sum, invoice) => sum + Math.max(0, invoice.total - invoice.collected),
        0
      ),
      expenses: expensesForBranch,
    };
  });

  const openPaymentDialog = (targetId?: string) => {
    const target = targetId
      ? invoices.find(invoice => invoice.id === targetId)
      : invoices.find(invoice => invoice.collected < invoice.total);
    if (!target || target.collected >= target.total) {
      toast("مفيش رصيد مستحق على الفاتورة المحددة");
      return;
    }
    setInvoiceId(target.id);
    setPaymentAmount(String(target.total - target.collected));
    setPaymentMethod("cash");
    setDialog("payment");
  };
  const openExpenseDialog = () => {
    setExpenseDescription("");
    setExpenseAmount("");
    setExpenseCategory("materials");
    setExpenseBranch(branch === "كل الفروع" ? "مدينة نصر" : branch);
    setDialog("expense");
  };
  const requestInvoiceCorrection = (invoice: Invoice) => {
    setCorrectionInvoiceId(invoice.id);
    setCorrectionReason("");
    setCorrectionEvidenceReference("");
    setCorrectionEvidenceFileName("");
    setCorrectionValidationError("");
    setDialog("correction");
  };
  const submitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(paymentAmount);
    if (
      !currentInvoice ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > remainingForInvoice
    ) {
      toast.error("أدخل مبلغًا صحيحًا لا يتجاوز الرصيد المستحق");
      return;
    }
    setInvoices(current =>
      current.map(invoice =>
        invoice.id === currentInvoice.id
          ? { ...invoice, collected: invoice.collected + amount }
          : invoice
      )
    );
    setDialog(null);
    toast.success("تم تسجيل التحصيل في بيانات العرض التجريبية", {
      description: `${formatMoney(amount)} ج.م · ${PAYMENT_LABELS[paymentMethod]}`,
    });
  };
  const submitExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseDescription.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("أدخل وصف المصروف ومبلغًا صحيحًا");
      return;
    }
    setExpenses(current => [
      {
        id: `exp-${Date.now()}`,
        description: expenseDescription.trim(),
        category: expenseCategory,
        branch: expenseBranch,
        date: TODAY,
        amount,
        createdBy: "أحمد محمود",
        approvalStatus: "pending",
      },
      ...current,
    ]);
    setDialog(null);
    toast.success("تم رفع المصروف للمراجعة", {
      description:
        "يحتاج تأكيد مدير الفرع قبل اعتباره مصروفًا معتمدًا في الماليات.",
    });
  };
  const submitCorrectionRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !correctionInvoice ||
      correctionInvoice.collected < correctionInvoice.total
    ) {
      toast.error("لا يمكن طلب تصحيح قبل اكتمال تحصيل الفاتورة");
      return;
    }
    if (correctionHistory.some(request => request.status === "pending")) {
      setCorrectionValidationError("يوجد طلب مفتوح لهذه الفاتورة بالفعل.");
      return;
    }
    const reason = correctionReason.trim();
    const evidenceReference = correctionEvidenceReference.trim();
    if (!reason) {
      setCorrectionValidationError("اكتب سبب التصحيح قبل إرسال الطلب.");
      return;
    }
    if (!evidenceReference && !correctionEvidenceFileName) {
      setCorrectionValidationError(
        "أضف رقمًا مرجعيًا أو اختر اسم ملف مستند داعم للمتابعة."
      );
      return;
    }

    const request: InvoiceCorrectionRequest = {
      id: `COR-${Date.now()}`,
      invoiceId: correctionInvoice.id,
      reason,
      evidenceReference,
      evidenceFileName: correctionEvidenceFileName,
      status: "pending",
      requestedAt: new Date().toISOString(),
      requestedBy: "أحمد محمود · محاسب الفرع",
    };
    setCorrectionRequests(current => [request, ...current]);
    setDialog(null);
    setCorrectionReason("");
    setCorrectionEvidenceReference("");
    setCorrectionEvidenceFileName("");
    setCorrectionValidationError("");
    toast.success("تم تسجيل طلب التصحيح في بيانات العرض", {
      description: `${correctionInvoice.invoiceNumber} · بانتظار المراجعة الإدارية.`,
    });
  };
  const downloadCsv = () => {
    const rows =
      tab === "collections"
        ? [
            [
              "رقم الفاتورة",
              "الطالب",
              "ولي الأمر",
              "الكورس",
              "الفرع",
              "الإجمالي",
              "المحصل",
              "المتبقي",
              "الحالة",
            ],
            ...visibleInvoices.map(invoice => [
              invoice.invoiceNumber,
              invoice.student,
              invoice.parent,
              invoice.course,
              invoice.branch,
              invoice.total,
              invoice.collected,
              invoice.total - invoice.collected,
              STATUS_LABELS[getStatus(invoice)],
            ]),
          ]
        : [
            ["الوصف", "التصنيف", "الفرع", "التاريخ", "المبلغ", "سجل بواسطة"],
            ...visibleExpenses.map(expense => [
              expense.description,
              CATEGORY_LABELS[expense.category],
              expense.branch,
              expense.date,
              expense.amount,
              expense.createdBy,
            ]),
          ];
    const csv = `\uFEFF${rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download =
      tab === "collections"
        ? "mada-collections-sample.csv"
        : "mada-expenses-sample.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("تم تنزيل نسخة CSV من البيانات الظاهرة");
  };
  const downloadMonthlyReport = () => {
    const rows = [
      ["التقرير المالي الشهري", "سبتمبر 2026", branch],
      ["إجمالي الفواتير", monthlyBilled],
      ["إجمالي التحصيل", monthlyCollected],
      ["المبالغ المستحقة", receivables],
      ["المصروفات", expensesTotal],
      ["صافي التدفق النقدي", monthlyNetCash],
      [],
      ["الفرع", "التحصيل", "المستحق", "المصروفات"],
      ...monthlyBranchBreakdown.map(item => [
        item.branch,
        item.collected,
        item.outstanding,
        item.expenses,
      ]),
    ];
    const csv = `\uFEFF${rows
      .map(row =>
        row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mada-monthly-finance-report-september-2026.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("تم تنزيل التقرير المالي الشهري كملف CSV");
  };
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setBranch("كل الفروع");
  };
  const labelFilter = tab === "collections" ? "الحالة" : "التصنيف";
  const comingSoon = (label: string) => {
    toast("القسم قيد التجهيز", {
      description: `المرحلة التالية هتكون «${label}».`,
    });
    setMobileNavOpen(false);
  };
  const restricted = (label: string) => {
    toast("صلاحية غير متاحة للمحاسب", {
      description: `الوصول إلى «${label}» محجوز للإدارة أو الدور المختص.`,
    });
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell" dir="rtl">
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <BrandMark />
          <button
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="academy-switcher">
          <span className="academy-avatar">
            <GraduationCap size={20} />
          </span>
          <span className="academy-meta">
            <strong>أكاديمية مدى</strong>
            <small>إدارة الأكاديمية</small>
          </span>
          <ChevronDown size={15} className="switcher-chevron" />
        </div>
        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="primary-nav" aria-label="القائمة الرئيسية">
          <button className="nav-link" onClick={() => navigate("/")}>
            <LayoutDashboard size={19} />
            <span>الرئيسية</span>
          </button>
          <button
            className="nav-link"
            onClick={() => restricted("ملفات الطلاب")}
          >
            <Users size={19} />
            <span>الطلاب</span>
            <span className="nav-count">248</span>
          </button>
          <button className="nav-link" onClick={() => restricted("الجدول")}>
            <CalendarDays size={19} />
            <span>الجدول</span>
          </button>
          <button
            className="nav-link"
            onClick={() => restricted("الحصص والكورسات")}
          >
            <BookOpen size={19} />
            <span>الحصص والكورسات</span>
          </button>
          <button className="nav-link" onClick={() => comingSoon("المسابقات")}>
            <Sparkles size={19} />
            <span>المسابقات</span>
          </button>
        </nav>
        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link active" aria-current="page">
            <Wallet size={19} />
            <span>المالية والتحصيل</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/finance-desk")}>
            <FileCheck2 size={19} />
            <span>مركز الإقفال المالي</span>
          </button>
          <button
            className="nav-link"
            onClick={() => restricted("الفريق والأدوار")}
          >
            <Users size={19} />
            <span>الفريق والأدوار</span>
          </button>
          <button className="nav-link" onClick={() => restricted("الموافقات")}>
            <CheckCircle2 size={19} />
            <span>الموافقات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => restricted("التقارير العامة")}
          >
            <Activity size={19} />
            <span>التقارير والتحليلات</span>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>محتاج مساعدة؟</strong>
            <span>مركز الدعم والإرشادات</span>
          </div>
          <ChevronLeft size={16} />
        </div>
        <div className="finance-scope-note">
          <CheckCircle2 size={15} />
          <span>
            <strong>نطاق صلاحيتك</strong>
            <small>التحصيل والمصروفات والتصدير</small>
          </span>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-link" onClick={() => comingSoon("الإعدادات")}>
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => toast("تسجيل الخروج التجريبي")}
          >
            <LogOut size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
        <div className="sidebar-version">
          مدى لإدارة الأكاديميات <span>نسخة تجريبية</span>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="branch-select-wrap">
              <button
                className={`branch-select ${branchMenuOpen ? "is-open" : ""}`}
                aria-expanded={branchMenuOpen}
                onClick={() => setBranchMenuOpen(open => !open)}
              >
                <span className="branch-icon">
                  <MapPin size={17} />
                </span>
                <span>
                  {branch === "كل الفروع" ? "كل الفروع" : `فرع ${branch}`}
                </span>
                <ChevronDown size={15} />
              </button>
              {branchMenuOpen && (
                <div className="branch-menu">
                  {BRANCHES.map(item => (
                    <button
                      key={item}
                      className={branch === item ? "selected" : ""}
                      onClick={() => {
                        setBranch(item);
                        setBranchMenuOpen(false);
                      }}
                    >
                      {item === "كل الفروع" ? (
                        <Users size={15} />
                      ) : (
                        <MapPin size={15} />
                      )}
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                aria-label="ابحث عن فاتورة أو طالب"
                placeholder="ابحث عن فاتورة أو طالب..."
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="topbar-left">
            <button
              className="icon-button notification-button"
              aria-label="الإشعارات"
              onClick={() => toast("لا توجد إشعارات جديدة")}
            >
              <span className="notification-dot" />
              <Bell size={18} />
            </button>
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => toast("إعدادات الحساب قيد التجهيز")}
            >
              <span className="profile-copy">
                <strong>أحمد محمود</strong>
                <small>محاسب الفرع</small>
              </span>
              <span className="profile-avatar">أم</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <div className="workspace finance-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => navigate("/")}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>المالية والتحصيل</span>
          </div>
          <section className="students-welcome finance-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> إدارة الفواتير · التحصيل ·
                المصروفات
              </div>
              <h1>المالية والتحصيل</h1>
              <p>تابع الفواتير والأقساط والمصروفات حسب الفرع.</p>
            </div>
            <div className="welcome-actions">
              <button className="button button-secondary" onClick={downloadCsv}>
                <ArrowDownToLine size={17} /> تصدير CSV
              </button>
              <button
                className="button button-secondary finance-report-trigger"
                onClick={() => setMonthlyReportOpen(open => !open)}
                aria-expanded={monthlyReportOpen}
              >
                <FileText size={16} /> التقرير الشهري
              </button>
              <button
                className="button button-primary"
                onClick={
                  tab === "collections"
                    ? () => openPaymentDialog()
                    : openExpenseDialog
                }
              >
                <Plus size={18} />
                {tab === "collections" ? "تسجيل تحصيل" : "إضافة مصروف"}
              </button>
            </div>
          </section>
          <section className="finance-demo-note" role="note">
            <AlertCircle size={16} />
            <span>
              بيانات العرض توضيحية ومحلية — لا توجد مدفوعات حقيقية أو تغييرات
              محفوظة.
            </span>
            <span className="finance-demo-badge">DEMO</span>
          </section>
          <section
            className="finance-permission-card"
            aria-label="صلاحيات المحاسب"
          >
            <span className="finance-permission-icon">
              <CheckCircle2 size={17} />
            </span>
            <div>
              <strong>مساحة مالية مركزة على التسجيل والمراجعة</strong>
              <p>
                سجل التحصيل والمصروفات، راجع الأرصدة، وصدّر الحركة المالية ضمن
                نطاق الفروع.
              </p>
            </div>
            <div className="finance-permission-tags">
              <span>
                <Check size={12} /> تحصيل
              </span>
              <span>
                <Check size={12} /> مصروفات
              </span>
              <span className="is-locked">
                <Users size={12} /> تعديل الطلاب للإدارة
              </span>
            </div>
          </section>
          {monthlyReportOpen && (
            <section
              className="finance-monthly-report"
              aria-label="التقرير المالي الشهري"
            >
              <div className="finance-monthly-report-heading">
                <div className="panel-title-group">
                  <span className="panel-icon panel-icon-violet">
                    <FileText size={18} />
                  </span>
                  <div>
                    <h2>تقرير سبتمبر 2026</h2>
                    <p>ملخص التحصيل والمصروفات · {branch}</p>
                  </div>
                </div>
                <button
                  className="button button-secondary"
                  onClick={downloadMonthlyReport}
                >
                  <ArrowDownToLine size={15} /> تنزيل التقرير
                </button>
              </div>
              <div className="finance-monthly-kpis">
                <div>
                  <small>إجمالي الفواتير</small>
                  <strong>
                    <bdi dir="ltr">{formatMoney(monthlyBilled)}</bdi> ج.م
                  </strong>
                </div>
                <div>
                  <small>التحصيل</small>
                  <strong className="is-positive">
                    <bdi dir="ltr">{formatMoney(monthlyCollected)}</bdi> ج.م
                  </strong>
                </div>
                <div>
                  <small>المصروفات</small>
                  <strong className="is-expense">
                    <bdi dir="ltr">{formatMoney(expensesTotal)}</bdi> ج.م
                  </strong>
                </div>
                <div>
                  <small>صافي التدفق النقدي</small>
                  <strong>
                    <bdi dir="ltr">{formatMoney(monthlyNetCash)}</bdi> ج.م
                  </strong>
                </div>
              </div>
              <div className="finance-monthly-table-wrap">
                <table className="finance-monthly-table">
                  <thead>
                    <tr>
                      <th>الفرع</th>
                      <th>التحصيل</th>
                      <th>المستحق</th>
                      <th>المصروفات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBranchBreakdown.map(item => (
                      <tr key={item.branch}>
                        <td>{item.branch}</td>
                        <td>
                          <bdi dir="ltr">{formatMoney(item.collected)}</bdi> ج.م
                        </td>
                        <td>
                          <bdi dir="ltr">{formatMoney(item.outstanding)}</bdi>{" "}
                          ج.م
                        </td>
                        <td>
                          <bdi dir="ltr">{formatMoney(item.expenses)}</bdi> ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <small className="finance-report-footnote">
                الأرقام توضيحية ومحلية، وتتأثر بفرع العرض المحدد في أعلى الصفحة.
              </small>
            </section>
          )}
          <section className="finance-stats-grid" aria-label="ملخص مالي للعينة">
            <article className="finance-stat">
              <span className="finance-stat-icon icon-teal">
                <Wallet size={18} />
              </span>
              <span className="finance-stat-label">المتحصل من الفواتير</span>
              <div>
                <strong>
                  <bdi dir="ltr">{formatMoney(collectedTotal)}</bdi>
                </strong>
                <span>ج.م</span>
              </div>
              <small>
                <CheckCircle2 size={13} />{" "}
                {scopedInvoices.filter(invoice => invoice.collected > 0).length}{" "}
                فواتير بها تحصيل
              </small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-blue">
                <FileText size={18} />
              </span>
              <span className="finance-stat-label">
                إجمالي المبالغ المستحقة
              </span>
              <div>
                <strong>
                  <bdi dir="ltr">{formatMoney(receivables)}</bdi>
                </strong>
                <span>ج.م</span>
              </div>
              <small className="finance-neutral">
                متبقي على{" "}
                {
                  scopedInvoices.filter(
                    invoice => invoice.collected < invoice.total
                  ).length
                }{" "}
                فاتورة
              </small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-amber">
                <Clock3 size={18} />
              </span>
              <span className="finance-stat-label">متأخرات التحصيل</span>
              <div>
                <strong>
                  <bdi dir="ltr">{formatMoney(overdueTotal)}</bdi>
                </strong>
                <span>ج.م</span>
              </div>
              <small>
                <AlertCircle size={13} /> راجع مواعيد الاستحقاق
              </small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-violet">
                <TrendingDown size={18} />
              </span>
              <span className="finance-stat-label">مصروفات مسجلة بالعينة</span>
              <div>
                <strong>
                  <bdi dir="ltr">{formatMoney(expensesTotal)}</bdi>
                </strong>
                <span>ج.م</span>
              </div>
              <small className="finance-neutral">
                {scopedExpenses.length} بنود توضيحية
              </small>
            </article>
          </section>
          <section className="finance-insights-grid">
            <article className="panel finance-insight-card">
              <div className="finance-panel-heading">
                <div className="panel-title-group">
                  <span className="panel-icon panel-icon-teal">
                    <CreditCard size={18} />
                  </span>
                  <div>
                    <h2>موقف الفواتير</h2>
                    <p>نسبة المحصل من قيمة الفواتير الظاهرة في العينة</p>
                  </div>
                </div>
                <span className="finance-ratio">
                  <bdi dir="ltr">{collectionRatio}%</bdi>
                </span>
              </div>
              <div className="finance-progress">
                <span style={{ width: `${collectionRatio}%` }} />
              </div>
              <div className="finance-legend">
                <span>
                  <i className="legend-paid" /> المحصل{" "}
                  <bdi dir="ltr">{formatMoney(collectedTotal)} ج.م</bdi>
                </span>
                <span>
                  <i className="legend-open" /> المتبقي{" "}
                  <bdi dir="ltr">{formatMoney(receivables)} ج.م</bdi>
                </span>
              </div>
            </article>
            <article className="panel finance-reminder-card">
              <div className="finance-panel-heading">
                <div className="panel-title-group">
                  <span className="panel-icon panel-icon-amber">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <h2>أقساط تحتاج متابعة</h2>
                    <p>أقرب الفواتير المستحقة في البيانات</p>
                  </div>
                </div>
              </div>
              <div className="finance-reminder-list">
                {scopedInvoices
                  .filter(invoice => invoice.collected < invoice.total)
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 3)
                  .map(invoice => (
                    <button
                      className="finance-reminder"
                      key={invoice.id}
                      onClick={() => openPaymentDialog(invoice.id)}
                    >
                      <span
                        className={`finance-reminder-icon ${getStatus(invoice) === "overdue" ? "is-late" : ""}`}
                      >
                        {getStatus(invoice) === "overdue" ? (
                          <AlertCircle size={15} />
                        ) : (
                          <Clock3 size={15} />
                        )}
                      </span>
                      <span className="finance-reminder-copy">
                        <strong>{invoice.student}</strong>
                        <small>
                          {getStatus(invoice) === "overdue"
                            ? "متأخر"
                            : "موعد الاستحقاق"}{" "}
                          · {formatDate(invoice.dueDate)}
                        </small>
                      </span>
                      <bdi className="finance-reminder-amount" dir="ltr">
                        {formatMoney(invoice.total - invoice.collected)} ج.م
                      </bdi>
                      <ChevronLeft size={15} />
                    </button>
                  ))}
              </div>
            </article>
          </section>
          <section className="panel finance-table-panel">
            <div className="finance-table-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-blue">
                  <Wallet size={18} />
                </span>
                <div>
                  <h2>الحركة المالية</h2>
                  <p>الفواتير والمبالغ حسب الفرع والحالة</p>
                </div>
              </div>
              <button
                className="students-more"
                aria-label="المزيد"
                onClick={() => toast("المزيد من خيارات المالية قريبًا")}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="finance-toolbar">
              <div
                className="finance-tabs"
                role="tablist"
                aria-label="نوع الحركة المالية"
              >
                <button
                  role="tab"
                  aria-selected={tab === "collections"}
                  className={
                    tab === "collections" ? "finance-tab active" : "finance-tab"
                  }
                  onClick={() => {
                    setTab("collections");
                    setStatusFilter("all");
                  }}
                >
                  <CreditCard size={15} /> الفواتير والتحصيل{" "}
                  <span>{invoices.length}</span>
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "expenses"}
                  className={
                    tab === "expenses" ? "finance-tab active" : "finance-tab"
                  }
                  onClick={() => {
                    setTab("expenses");
                    setStatusFilter("all");
                  }}
                >
                  <TrendingDown size={15} /> المصروفات{" "}
                  <span>{expenses.length}</span>
                </button>
              </div>
              <div className="finance-filters">
                <label className="finance-search">
                  <Search size={15} />
                  <input
                    aria-label="بحث في الحركة المالية"
                    placeholder={
                      tab === "collections"
                        ? "رقم فاتورة، طالب، كورس..."
                        : "ابحث في وصف المصروف..."
                    }
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                </label>
                <label className="finance-select">
                  <span>{labelFilter}</span>
                  <select
                    aria-label={`تصفية حسب ${labelFilter}`}
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value)}
                  >
                    {tab === "collections" ? (
                      <>
                        <option value="all">كل الحالات</option>
                        <option value="unpaid">غير مدفوعة</option>
                        <option value="partial">مدفوعة جزئيًا</option>
                        <option value="paid">مدفوعة</option>
                        <option value="overdue">متأخرة</option>
                      </>
                    ) : (
                      <>
                        <option value="all">كل التصنيفات</option>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown size={13} />
                </label>
                <span className="finance-result-count">
                  {tab === "collections"
                    ? visibleInvoices.length
                    : visibleExpenses.length}{" "}
                  نتيجة
                </span>
              </div>
            </div>
            {tab === "collections" ? (
              <div className="finance-table-wrap">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>الفاتورة / الطالب</th>
                      <th>الكورس والفرع</th>
                      <th>الإجمالي</th>
                      <th>المحصل</th>
                      <th>المتبقي</th>
                      <th>الاستحقاق</th>
                      <th>الحالة</th>
                      <th aria-label="تسجيل تحصيل" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInvoices.map(invoice => {
                      const status = getStatus(invoice);
                      const due = invoice.total - invoice.collected;
                      return (
                        <tr key={invoice.id}>
                          <td data-label="الفاتورة / الطالب">
                            <span className="finance-invoice-cell">
                              <i>
                                <FileText size={16} />
                              </i>
                              <span>
                                <strong>{invoice.student}</strong>
                                <small className="finance-code" dir="ltr">
                                  {invoice.invoiceNumber}
                                </small>
                              </span>
                            </span>
                          </td>
                          <td data-label="الكورس والفرع">
                            <span className="finance-course-cell">
                              <strong>{invoice.course}</strong>
                              <small>
                                <MapPin size={12} />
                                {invoice.branch}
                              </small>
                            </span>
                          </td>
                          <td data-label="الإجمالي">
                            <bdi className="finance-money" dir="ltr">
                              {formatMoney(invoice.total)} ج.م
                            </bdi>
                          </td>
                          <td data-label="المحصل">
                            <bdi className="finance-money paid-money" dir="ltr">
                              {formatMoney(invoice.collected)} ج.م
                            </bdi>
                          </td>
                          <td data-label="المتبقي">
                            <bdi className="finance-money" dir="ltr">
                              {formatMoney(due)} ج.م
                            </bdi>
                          </td>
                          <td data-label="الاستحقاق">
                            <span className="finance-date" dir="ltr">
                              {formatDate(invoice.dueDate)}
                            </span>
                          </td>
                          <td data-label="الحالة">
                            <span
                              className={`finance-status finance-status-${status}`}
                            >
                              <i />
                              {STATUS_LABELS[status]}
                            </span>
                          </td>
                          <td data-label="الإجراء">
                            {due > 0 ? (
                              <button
                                className="finance-collect-button"
                                onClick={() => openPaymentDialog(invoice.id)}
                              >
                                تحصيل
                              </button>
                            ) : (
                              (() => {
                                const history = correctionRequests.filter(
                                  request => request.invoiceId === invoice.id
                                );
                                const latestRequest = history[0];
                                return (
                                  <span className="finance-correction-action">
                                    <button
                                      className="finance-correction-button"
                                      onClick={() =>
                                        requestInvoiceCorrection(invoice)
                                      }
                                      aria-label={`${latestRequest ? "عرض سجل طلب التصحيح" : "طلب تصحيح"} للفاتورة ${invoice.invoiceNumber}`}
                                    >
                                      <FileText size={14} />
                                      {latestRequest
                                        ? "سجل التصحيح"
                                        : "طلب تصحيح"}
                                    </button>
                                    {latestRequest && (
                                      <span
                                        className={`finance-correction-status finance-correction-status-${latestRequest.status}`}
                                      >
                                        <i />
                                        {
                                          CORRECTION_STATUS_LABELS[
                                            latestRequest.status
                                          ]
                                        }
                                      </span>
                                    )}
                                  </span>
                                );
                              })()
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!visibleInvoices.length && (
                      <tr>
                        <td colSpan={8}>
                          <div className="finance-empty">
                            <Search size={20} />
                            <strong>مفيش فواتير مطابقة</strong>
                            <small>
                              غيّر البحث أو الفلاتر عشان تظهر نتائج تانية.
                            </small>
                            <button
                              className="text-link"
                              onClick={clearFilters}
                            >
                              مسح الفلاتر
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="finance-table-wrap">
                <table className="finance-table expense-table">
                  <thead>
                    <tr>
                      <th>وصف المصروف</th>
                      <th>التصنيف</th>
                      <th>الفرع</th>
                      <th>تاريخ التسجيل</th>
                      <th>سجل بواسطة</th>
                      <th>حالة الاعتماد</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleExpenses.map(expense => (
                      <tr key={expense.id}>
                        <td data-label="وصف المصروف">
                          <span className="finance-expense-cell">
                            <i>
                              <TrendingDown size={15} />
                            </i>
                            <strong>{expense.description}</strong>
                          </span>
                        </td>
                        <td data-label="التصنيف">
                          <span className="finance-category">
                            {CATEGORY_LABELS[expense.category]}
                          </span>
                        </td>
                        <td data-label="الفرع">
                          <span className="finance-branch-cell">
                            <MapPin size={12} />
                            {expense.branch}
                          </span>
                        </td>
                        <td data-label="تاريخ التسجيل">
                          <span className="finance-date" dir="ltr">
                            {formatDate(expense.date)}
                          </span>
                        </td>
                        <td data-label="سجل بواسطة">{expense.createdBy}</td>
                        <td data-label="حالة الاعتماد">
                          <span
                            className={`finance-approval-status ${expense.approvalStatus}`}
                          >
                            <i />{" "}
                            {expense.approvalStatus === "approved"
                              ? "معتمد من مدير الفرع"
                              : "بانتظار تأكيد مدير الفرع"}
                          </span>
                        </td>
                        <td data-label="المبلغ">
                          <bdi
                            className="finance-money expense-money"
                            dir="ltr"
                          >
                            {formatMoney(expense.amount)} ج.م
                          </bdi>
                        </td>
                      </tr>
                    ))}
                    {!visibleExpenses.length && (
                      <tr>
                        <td colSpan={7}>
                          <div className="finance-empty">
                            <Search size={20} />
                            <strong>مفيش مصروفات مطابقة</strong>
                            <small>
                              غيّر البحث أو الفلاتر عشان تظهر نتائج تانية.
                            </small>
                            <button
                              className="text-link"
                              onClick={clearFilters}
                            >
                              مسح الفلاتر
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="finance-table-footer">
              <span>
                عرض بيانات <b>تجريبية</b> محلية ·{" "}
                <b>
                  {tab === "collections"
                    ? visibleInvoices.length
                    : visibleExpenses.length}
                </b>{" "}
                سجل
                {tab === "expenses" && pendingExpenseCount > 0 && (
                  <em className="finance-pending-note">
                    {" "}
                    · {pendingExpenseCount} بانتظار اعتماد مدير الفرع
                  </em>
                )}
              </span>
              <button className="text-link" onClick={downloadCsv}>
                <ArrowDownToLine size={14} /> تنزيل CSV للنتائج
              </button>
            </div>
          </section>
          <footer className="finance-footer-note">
            <span>
              <AlertCircle size={14} />
            </span>
            <p>
              التحصيل والمصروفات هنا نموذج واجهة فقط. الرواتب تُدار كـ Payroll
              Run منفصل، ولا يتم احتساب صافي ربح حقيقي قبل ربط بيانات الإيراد
              والتكاليف الفعلية.
            </p>
          </footer>
        </div>
      </main>
      {dialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className={`student-dialog finance-dialog${dialog === "correction" ? " finance-correction-dialog" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-dialog-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                {dialog === "payment" ? (
                  <CreditCard size={20} />
                ) : dialog === "correction" ? (
                  <FileText size={20} />
                ) : (
                  <TrendingDown size={20} />
                )}
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="finance-dialog-heading">
              <h2 id="finance-dialog-title">
                {dialog === "payment"
                  ? "تسجيل تحصيل"
                  : dialog === "correction"
                    ? "طلب تصحيح فاتورة"
                    : "إضافة مصروف"}
              </h2>
              <p>
                {dialog === "payment"
                  ? "سجّل دفعة على فاتورة الطالب."
                  : dialog === "correction"
                    ? "ارفع طلب مراجعة موثقًا؛ لا يتم تعديل الفاتورة المحصّلة مباشرة."
                    : "أضف بند مصروف توضيحي للفرع."}
              </p>
            </div>
            {dialog === "payment" ? (
              <form className="finance-form" onSubmit={submitPayment}>
                <label>
                  الفاتورة والطالب
                  <select
                    value={invoiceId}
                    onChange={event => {
                      setInvoiceId(event.target.value);
                      const invoice = invoices.find(
                        item => item.id === event.target.value
                      );
                      setPaymentAmount(
                        invoice ? String(invoice.total - invoice.collected) : ""
                      );
                    }}
                    required
                  >
                    {invoices
                      .filter(invoice => invoice.collected < invoice.total)
                      .map(invoice => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} · {invoice.student}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="finance-due-hint">
                  <span>الرصيد المتبقي</span>
                  <bdi dir="ltr">{formatMoney(remainingForInvoice)} ج.م</bdi>
                </div>
                <label>
                  مبلغ التحصيل (ج.م)
                  <input
                    type="number"
                    min="1"
                    max={remainingForInvoice}
                    step="1"
                    inputMode="numeric"
                    value={paymentAmount}
                    onChange={event => setPaymentAmount(event.target.value)}
                    required
                  />
                </label>
                <label>
                  طريقة الدفع
                  <select
                    value={paymentMethod}
                    onChange={event =>
                      setPaymentMethod(
                        event.target.value as "cash" | "card" | "transfer"
                      )
                    }
                  >
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة</option>
                    <option value="transfer">تحويل</option>
                  </select>
                </label>
                <div className="dialog-info">
                  <AlertCircle size={15} />
                  <span>
                    سيظهر التغيير في هذه المعاينة فقط، ولن يتم حفظه على خادم.
                  </span>
                </div>
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setDialog(null)}
                  >
                    إلغاء
                  </button>
                  <button className="button button-primary" type="submit">
                    <Check size={15} /> تسجيل التحصيل
                  </button>
                </div>
              </form>
            ) : dialog === "expense" ? (
              <form className="finance-form" onSubmit={submitExpense}>
                <label>
                  وصف المصروف
                  <input
                    value={expenseDescription}
                    onChange={event =>
                      setExpenseDescription(event.target.value)
                    }
                    placeholder="مثال: مستلزمات معمل الروبوتكس"
                    required
                  />
                </label>
                <div className="finance-form-row">
                  <label>
                    التصنيف
                    <select
                      value={expenseCategory}
                      onChange={event =>
                        setExpenseCategory(
                          event.target.value as Expense["category"]
                        )
                      }
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    الفرع
                    <select
                      value={expenseBranch}
                      onChange={event => setExpenseBranch(event.target.value)}
                    >
                      {BRANCHES.slice(1).map(item => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  المبلغ (ج.م)
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={expenseAmount}
                    onChange={event => setExpenseAmount(event.target.value)}
                    placeholder="0"
                    required
                  />
                </label>
                <div className="dialog-info">
                  <AlertCircle size={15} />
                  <span>سيتم تسجيله كمصروف توضيحي بتاريخ 26 سبتمبر 2026.</span>
                </div>
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setDialog(null)}
                  >
                    إلغاء
                  </button>
                  <button className="button button-primary" type="submit">
                    <Plus size={15} /> إضافة المصروف
                  </button>
                </div>
              </form>
            ) : correctionInvoice ? (
              <div className="finance-correction-content">
                <div className="finance-correction-lock-note">
                  <AlertCircle size={16} />
                  <span>
                    <strong>الفاتورة المحصّلة غير قابلة للتعديل المباشر</strong>
                    <small>
                      الطلب يذهب للمراجعة فقط، ولا يغيّر قيمة الفاتورة أو بيانات
                      التحصيل.
                    </small>
                  </span>
                </div>
                <div className="finance-correction-invoice">
                  <span>
                    <small>رقم الفاتورة</small>
                    <strong dir="ltr">{correctionInvoice.invoiceNumber}</strong>
                  </span>
                  <span>
                    <small>الطالب / ولي الأمر</small>
                    <strong>
                      {correctionInvoice.student} · {correctionInvoice.parent}
                    </strong>
                  </span>
                  <span>
                    <small>الكورس والفرع</small>
                    <strong>
                      {correctionInvoice.course} · {correctionInvoice.branch}
                    </strong>
                  </span>
                  <span>
                    <small>إجمالي الفاتورة المحصّل</small>
                    <strong dir="ltr">
                      {formatMoney(correctionInvoice.total)} ج.م
                    </strong>
                  </span>
                </div>
                <section
                  className="finance-correction-history"
                  aria-labelledby="correction-history-title"
                >
                  <div className="finance-correction-history-heading">
                    <span>
                      <Clock3 size={15} />
                      <strong id="correction-history-title">سجل الطلبات</strong>
                    </span>
                    <small>{correctionHistory.length} طلب</small>
                  </div>
                  {correctionHistory.length ? (
                    <ol>
                      {correctionHistory.map(request => (
                        <li key={request.id}>
                          <div className="finance-correction-history-top">
                            <strong dir="ltr">{request.id}</strong>
                            <span
                              className={`finance-correction-status finance-correction-status-${request.status}`}
                            >
                              <i />
                              {CORRECTION_STATUS_LABELS[request.status]}
                            </span>
                          </div>
                          <small>
                            {request.requestedBy} ·{" "}
                            {formatDateTime(request.requestedAt)}
                          </small>
                          <p>{request.reason}</p>
                          {(request.evidenceReference ||
                            request.evidenceFileName) && (
                            <small className="finance-correction-evidence-summary">
                              المستند: {request.evidenceReference || "—"}
                              {request.evidenceFileName
                                ? ` · ${request.evidenceFileName}`
                                : ""}
                            </small>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="finance-correction-empty-history">
                      لا توجد طلبات سابقة لهذه الفاتورة.
                    </p>
                  )}
                </section>
                {hasPendingCorrection ? (
                  <div
                    className="finance-correction-pending"
                    role="status"
                    aria-live="polite"
                  >
                    <Clock3 size={16} />
                    <span>
                      <strong>يوجد طلب مفتوح بانتظار المراجعة</strong>
                      <small>
                        لن يمكن إرسال طلب آخر لهذه الفاتورة قبل انتهاء المراجعة.
                      </small>
                    </span>
                  </div>
                ) : (
                  <form
                    className="finance-form finance-correction-form"
                    onSubmit={submitCorrectionRequest}
                  >
                    <label>
                      سبب طلب التصحيح <b>*</b>
                      <textarea
                        value={correctionReason}
                        onChange={event => {
                          setCorrectionReason(event.target.value);
                          setCorrectionValidationError("");
                        }}
                        maxLength={500}
                        rows={3}
                        placeholder="وضّح البيانات المطلوب مراجعتها وسبب طلب التعديل..."
                        required
                      />
                      <small className="finance-correction-counter">
                        {correctionReason.length}/500
                      </small>
                    </label>
                    <div className="finance-correction-evidence">
                      <div>
                        <strong>
                          مستند داعم أو مرجع <b>*</b>
                        </strong>
                        <small>
                          أرفق ملفًا أو أدخل رقم إيصال/مستند مرتبط بالطلب.
                        </small>
                      </div>
                      <div className="finance-correction-evidence-controls">
                        <label className="finance-evidence-picker">
                          <FileText size={14} /> اختيار ملف
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                            aria-label="اختيار مستند داعم"
                            onChange={event => {
                              setCorrectionEvidenceFileName(
                                event.target.files?.[0]?.name ?? ""
                              );
                              setCorrectionValidationError("");
                            }}
                          />
                        </label>
                        {correctionEvidenceFileName && (
                          <span className="finance-evidence-file-name">
                            {correctionEvidenceFileName}
                          </span>
                        )}
                      </div>
                      <label className="finance-evidence-reference">
                        أو رقم/مرجع المستند
                        <input
                          value={correctionEvidenceReference}
                          onChange={event => {
                            setCorrectionEvidenceReference(event.target.value);
                            setCorrectionValidationError("");
                          }}
                          maxLength={120}
                          placeholder="مثال: إيصال تحصيل رقم 2048"
                        />
                      </label>
                      <small className="finance-evidence-disclaimer">
                        معاينة محلية فقط: لا يتم رفع الملف أو حفظه على خادم؛
                        يُسجّل اسم الملف/المرجع في سجل الطلب.
                      </small>
                    </div>
                    {correctionValidationError && (
                      <p className="finance-correction-error" role="alert">
                        {correctionValidationError}
                      </p>
                    )}
                    <div className="dialog-info">
                      <AlertCircle size={15} />
                      <span>
                        تسجيل الطلب لا يغيّر الفاتورة. حالة الطلب وسجله محفوظان
                        داخل هذه المعاينة فقط.
                      </span>
                    </div>
                    <div className="dialog-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => setDialog(null)}
                      >
                        إلغاء
                      </button>
                      <button className="button button-primary" type="submit">
                        <Check size={15} /> إرسال طلب المراجعة
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
