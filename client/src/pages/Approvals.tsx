import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import ApprovalCard, {
  APPROVAL_STATUS_LABELS,
  type ApprovalItem,
  type ApprovalKind,
  type ApprovalStatus,
} from "@/components/ApprovalCard";
import ApprovalQueueTabs from "@/components/ApprovalQueueTabs";
import AuditTimeline, { type AuditEvent } from "@/components/AuditTimeline";
import DecisionDialog from "@/components/DecisionDialog";
import NotificationCenter, {
  type NotificationItem,
} from "@/components/NotificationCenter";
import { apiClient, type ApprovalRequestRecord, type FinanceExpense, type InvoiceCorrection, type NotificationRecord } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

type QueueTab = "all" | ApprovalKind;
type ApprovalSort = "priority" | "oldest" | "newest";

const INITIAL_REQUESTS: ApprovalItem[] = [
  {
    id: "APR-085",
    kind: "expense",
    title: "مصروف مستلزمات يحتاج تأكيدًا",
    summary: "طلب تأكيد مصروف تشغيلي مسجل من المحاسبة",
    branch: "مدينة نصر",
    requestedBy: "أحمد محمود · المحاسبة",
    submittedAt: "اليوم · 11:10 ص",
    submittedAtSort: "2026-09-26T11:10:00",
    expenseDescription: "مستلزمات معمل الروبوتكس",
    expenseAmount: 3850,
    expenseCategory: "مواد ومستلزمات",
    status: "pending",
  },
  {
    id: "APR-084",
    kind: "discount",
    title: "خصم إخوة يحتاج اعتمادًا",
    summary: "خصم إضافي على تسجيل الأخ الثاني",
    branch: "مدينة نصر",
    requestedBy: "هبة محمود · السكرتارية",
    submittedAt: "اليوم · 10:24 ص",
    submittedAtSort: "2026-09-26T10:24:00",
    student: "آدم شريف حسن",
    course: "ذكاء اصطناعي للصغار",
    invoice: "MAD-NSR-2026-0914",
    discountType: "خصم إخوة",
    discountValue: 15,
    originalAmount: 3600,
    finalAmount: 3060,
    status: "pending",
  },
  {
    id: "APR-083",
    kind: "substitute",
    title: "طلب مدرب بديل لحصة اليوم",
    summary: "تغطية الحصة بسبب غياب المدرب الأساسي",
    branch: "مدينة نصر",
    requestedBy: "مريم حسن · رئيس المدربين",
    submittedAt: "اليوم · 09:05 ص",
    submittedAtSort: "2026-09-26T09:05:00",
    course: "روبوتكس مستوى 2",
    instructor: "عمر سامح",
    substitute: "يوسف عماد",
    sessionDate: "السبت 26 سبتمبر",
    sessionTime: "12:00 – 1:30 م",
    status: "pending",
  },
  {
    id: "APR-082",
    kind: "discount",
    title: "خصم حملة موسمية",
    summary: "طلب تعديل قيمة خصم الحملة المسجل",
    branch: "المعادي",
    requestedBy: "سارة خالد · المحاسبة",
    submittedAt: "أمس · 04:18 م",
    submittedAtSort: "2026-09-25T16:18:00",
    student: "ليلى أحمد محمود",
    course: "برمجة للمبتدئين",
    invoice: "MAD-MAD-2026-0905",
    discountType: "خصم حملة",
    discountValue: 10,
    originalAmount: 2800,
    finalAmount: 2520,
    status: "pending",
  },
  {
    id: "APR-081",
    kind: "substitute",
    title: "طلب مدرب بديل لحصة قادمة",
    summary: "تبديل مؤقت بسبب تعارض في الجدول",
    branch: "مدينة نصر",
    requestedBy: "مريم حسن · رئيس المدربين",
    submittedAt: "أمس · 01:40 م",
    submittedAtSort: "2026-09-25T13:40:00",
    course: "دوائر إلكترونية",
    instructor: "سارة خالد",
    substitute: "هبة محمود",
    sessionDate: "الأحد 27 سبتمبر",
    sessionTime: "02:00 – 03:30 م",
    status: "pending",
  },
];
const BRANCH_MANAGER_DISCOUNT_LIMIT = 15;
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "approval-expense-085",
    kind: "approval",
    title: "مصروف يحتاج اعتمادك",
    description: "مستلزمات معمل الروبوتكس · مدينة نصر · 3,850 ج.م",
    time: "منذ 20 دقيقة",
    unread: true,
    actionLabel: "فتح المصروفات",
  },
  {
    id: "approval-discount-084",
    kind: "approval",
    title: "خصم إخوة بانتظار القرار",
    description: "آدم شريف حسن · خصم 15% ضمن سقف الفرع",
    time: "منذ 45 دقيقة",
    unread: true,
    actionLabel: "فتح الخصومات",
  },
  {
    id: "escalation-discount-policy",
    kind: "escalation",
    title: "تذكير بسياسة التصعيد",
    description: "أي خصم يتجاوز 15% يُرفع للإدارة المركزية.",
    time: "اليوم · 09:00 ص",
    actionLabel: "مراجعة الطلبات",
  },
];

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

function approvalFromApi(record: ApprovalRequestRecord): ApprovalItem {
  const isSubstitution = record.requestType === "INSTRUCTOR_SUBSTITUTION";
  const typeName = record.requestType === "EXTRA" ? "جلسة إضافية" : record.requestType === "MAKEUP" ? "جلسة تعويضية" : "طلب مدرب بديل";
  const start = record.sessionStartAt ? new Date(record.sessionStartAt) : null;
  const end = record.sessionEndAt ? new Date(record.sessionEndAt) : null;
  const time = start ? `${start.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}${end ? ` – ${end.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}` : ""}` : undefined;
  return {
    id: record.id, kind: isSubstitution ? "substitute" : "session", title: typeName,
    summary: record.reason || (record.courseName ? `${record.courseName} · جلسة ${record.sessionNumber ?? ""}` : "طلب تشغيلي مسجل على الخادم"),
    branch: record.branchName ?? record.branchId ?? "كل الفروع", requestedBy: record.instructorName ?? record.submittedByRole,
    submittedAt: new Date(record.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
    submittedAtSort: record.createdAt, status: record.state.toLowerCase() as ApprovalStatus,
    decidedAt: record.decidedAt ? new Date(record.decidedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : undefined,
    decidedAtSort: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined,
    decidedBy: record.decidedByUserId ?? undefined, decisionNote: record.reason ?? undefined,
    requestType: record.requestType, targetId: record.targetId, proposedInstructorId: record.proposedInstructorId,
    course: record.courseName ?? undefined, instructor: record.instructorName ?? undefined,
    substitute: record.proposedInstructorId ?? undefined,
    sessionDate: start?.toLocaleDateString("ar-EG", { dateStyle: "medium" }), sessionTime: time, live: true,
  };
}

function notificationFromApi(record: NotificationRecord): NotificationItem {
  const isApproval = record.type.includes("APPROVAL") || record.type.includes("SUBSTITUTION");
  return {
    id: record.id, kind: isApproval ? "approval" : "warning", title: record.title, description: record.body,
    time: new Date(record.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" }),
    unread: !record.isRead, actionLabel: isApproval ? "فتح الطلبات" : undefined,
  };
}
function correctionFromApi(record: InvoiceCorrection): ApprovalItem {
  return { id: record.id, kind: "correction", title: "تصحيح فاتورة يحتاج اعتمادًا", summary: record.reason, branch: record.branchId, requestedBy: "المحاسبة", submittedAt: new Date(record.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }), submittedAtSort: record.createdAt, status: record.status.toLowerCase() as ApprovalStatus, decidedAt: record.decidedAt ? new Date(record.decidedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : undefined, decidedAtSort: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined, decidedBy: record.decidedByUserId ?? undefined, decisionNote: record.reason, targetId: record.id, correctionInvoice: record.invoiceNumber ?? record.invoiceId, correctionCurrentAmount: Math.round(record.currentTotalPiastres / 100), correctionProposedAmount: Math.round(record.proposedTotalPiastres / 100), live: true };
}

function expenseFromApi(record: FinanceExpense): ApprovalItem {
  return {
    id: record.id,
    kind: "expense",
    title: "مصروف يحتاج اعتمادًا",
    summary: record.description,
    branch: record.branchName ?? record.branchId,
    requestedBy: "مقدم الطلب",
    submittedAt: new Date(record.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
    submittedAtSort: record.createdAt,
    status: record.status.toLowerCase() as ApprovalStatus,
    decidedAt: record.decidedAt ? new Date(record.decidedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : undefined,
    decidedAtSort: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined,
    decidedBy: record.decidedByUserId ?? undefined,
    decisionNote: record.approvalReason ?? undefined,
    expenseDescription: record.description,
    expenseAmount: Math.round(record.amountPiastres / 100),
    expenseCategory: record.category,
    targetId: record.id,
    live: true,
  };
}

export default function Approvals() {
  const [, navigate] = useLocation();
  const { logout, me } = useAuth();
  const [liveMode, setLiveMode] = useState(() => apiClient.hasSession());
  const [loading, setLoading] = useState(() => apiClient.hasSession());
  const [requests, setRequests] = useState<ApprovalItem[]>(() => apiClient.hasSession() ? [] : INITIAL_REQUESTS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const branch = liveMode
    ? me?.branches?.find(item => item.id === me.branchId)?.name ?? me?.branches?.[0]?.name ?? "الفرع المصرح"
    : "مدينة نصر";
  const isAccountant = me?.role === "R06_ACCOUNTANT";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<QueueTab>("all");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">(
    "all"
  );
  const [sortOrder, setSortOrder] = useState<ApprovalSort>("priority");
  const [selected, setSelected] = useState<ApprovalItem | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [expenseRejectionMode, setExpenseRejectionMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => apiClient.hasSession() ? [] : INITIAL_NOTIFICATIONS);
  const canApproveSelected =
    selected?.kind === "substitute" ? Boolean(selected.proposedInstructorId) : selected?.kind !== "discount" || (selected.discountValue ?? 0) <= BRANCH_MANAGER_DISCOUNT_LIMIT;

  useEffect(() => {
    if (!apiClient.hasSession()) {
      setLiveMode(false);
      setLoading(false);
      setRequests(INITIAL_REQUESTS);
      setNotifications(INITIAL_NOTIFICATIONS);
      return;
    }
    setLiveMode(true);
    setLoading(true);
    setLoadError(null);
    Promise.allSettled([
      apiClient.listApprovals(),
      apiClient.listNotifications(),
      apiClient.invoiceCorrections(),
      apiClient.financeExpenses({ status: "ALL" }),
    ]).then(([approvalResult, notificationResult, correctionResult, expenseResult]) => {
      if (approvalResult.status === "rejected") {
        setRequests([]);
        setNotifications([]);
        const cause = approvalResult.reason;
        setLoadError(cause instanceof Error ? cause.message : "تعذر تحميل الموافقات التشغيلية من الخادم.");
        return;
      }

      const supported = approvalResult.value.items.filter(item => item.targetType === "SESSION" && ["EXTRA", "MAKEUP", "INSTRUCTOR_SUBSTITUTION"].includes(item.requestType));
      const notifications = notificationResult.status === "fulfilled"
        ? notificationResult.value.items.map(notificationFromApi)
        : [];
      const corrections = correctionResult.status === "fulfilled"
        ? correctionResult.value.items.map(correctionFromApi)
        : [];
      const expenses = expenseResult.status === "fulfilled"
        ? expenseResult.value.items.map(expenseFromApi)
        : [];
      setRequests([...supported.map(approvalFromApi), ...corrections, ...expenses]);
      setNotifications(notifications);

      const optionalFailure = [notificationResult, correctionResult, expenseResult].find(result => result.status === "rejected");
      if (optionalFailure?.status === "rejected") {
        setLoadError("تم تحميل الموافقات التشغيلية؛ بعض الملحقات غير متاحة لصلاحيات الحساب الحالية.");
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [me?.role]);

  const branchRequests = useMemo(
    () => liveMode ? requests : requests.filter(item => item.branch === branch),
    [requests, branch, liveMode]
  );
  const visibleRequests = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return branchRequests
      .filter(item => {
        const matchesTab = tab === "all" || item.kind === tab;
        const matchesStatus =
          statusFilter === "all" || item.status === statusFilter;
        const matchesText =
          !needle ||
          [
            item.id,
            item.title,
            item.summary,
            item.student ?? "",
            item.course ?? "",
            item.invoice ?? "",
            item.instructor ?? "",
            item.substitute ?? "",
            item.expenseDescription ?? "",
            item.decisionNote ?? "",
          ].some(value => value.toLocaleLowerCase("ar").includes(needle));
        return matchesTab && matchesStatus && matchesText;
      })
      .sort((a, b) => {
        if (sortOrder === "oldest")
          return a.submittedAtSort.localeCompare(b.submittedAtSort);
        if (sortOrder === "newest")
          return b.submittedAtSort.localeCompare(a.submittedAtSort);
        const pendingFirst =
          Number(b.status === "pending") - Number(a.status === "pending");
        if (pendingFirst) return pendingFirst;
        return a.status === "pending"
          ? a.submittedAtSort.localeCompare(b.submittedAtSort)
          : (b.decidedAtSort ?? 0) - (a.decidedAtSort ?? 0);
      });
  }, [branchRequests, query, sortOrder, statusFilter, tab]);
  const pending = branchRequests.filter(item => item.status === "pending");
  const pendingDiscounts = pending.filter(
    item => item.kind === "discount"
  ).length;
  const pendingSubstitutes = pending.filter(
    item => item.kind === "substitute"
  ).length;
  const pendingExpenses = pending.filter(
    item => item.kind === "expense"
  ).length;
  const pendingSessionRequests = pending.filter(item => item.kind === "session").length;
  const reviewedRequests = branchRequests
    .filter(item => item.status !== "pending")
    .sort((a, b) => (b.decidedAtSort ?? 0) - (a.decidedAtSort ?? 0));
  const auditEvents: AuditEvent[] = reviewedRequests.map(item => ({
    id: `decision-${item.id}`,
    title: item.title,
    description: item.decisionNote
      ? `${item.kind === "expense" || item.kind === "correction" ? "سبب القرار: " : "ملاحظة القرار: "}${item.decisionNote}`
      : undefined,
    actor: item.decidedBy ?? "مدير الفرع",
    timestamp: item.decidedAt ?? "قرار توضيحي سابق",
    tone: item.status === "approved" ? "approved" : "rejected",
    meta: <span dir="ltr">{item.id}</span>,
  }));

  const closeReview = () => {
    setSelected(null);
    setDecisionNote("");
    setExpenseRejectionMode(false);
  };

  const showComingSoon = (label: string) => {
    toast("القسم قيد التجهيز", {
      description: `هنبدأ في تطوير «${label}» في المرحلة التالية.`,
    });
    setMobileNavOpen(false);
  };
  const handleNotificationAction = async (notification: NotificationItem) => {
    let marked = !liveMode;
    if (liveMode) {
      try { await apiClient.markNotificationRead(notification.id); marked = true; }
      catch (cause) { toast.error("تعذر تحديث حالة الإشعار", { description: cause instanceof Error ? cause.message : "فشل الاتصال بالخادم." }); }
    }
    setNotifications(current =>
      current.map(item =>
        item.id === notification.id ? { ...item, unread: marked ? false : item.unread } : item
      )
    );
    if (notification.id.includes("expense")) setTab("expense");
    else if (notification.id.includes("discount")) setTab("discount");
    else setTab("all");
    setQuery("");
    toast.success("تم فتح قائمة الموافقات", {
      description: liveMode ? "تم فتح قائمة الطلبات المسجلة على الخادم." : "البيانات توضيحية ومحلية داخل هذه المعاينة.",
    });
  };
  const markAllNotificationsRead = async () => {
    let successfullyMarked: Set<string> | null = null;
    if (liveMode) {
      const unreadIds = notifications.filter(item => item.unread).map(item => item.id);
      const results = await Promise.allSettled(unreadIds.map(id => apiClient.markNotificationRead(id)));
      successfullyMarked = new Set(unreadIds.filter((_, index) => results[index]?.status === "fulfilled"));
      if (results.some(result => result.status === "rejected")) {
        toast.error("تعذر تحديث بعض الإشعارات على الخادم.");
      }
    }
    setNotifications(current => current.map(item => ({ ...item, unread: successfullyMarked ? successfullyMarked.has(item.id) ? false : item.unread : false })));
  };
  const openReview = (item: ApprovalItem) => {
    setDecisionNote("");
    setExpenseRejectionMode(false);
    setSelected(item);
  };
  const decide = async (id: string, status: "approved" | "rejected") => {
    const item = requests.find(request => request.id === id);
    if (!item) return;
    if (
      status === "approved" &&
      item.kind === "discount" &&
      !canApproveSelected
    ) {
      toast.error("الخصم يتجاوز حد اعتماد مدير الفرع", {
        description: `ارفع الطلب للإدارة المركزية لأن الحد الحالي ${BRANCH_MANAGER_DISCOUNT_LIMIT}%.`,
      });
      return;
    }
    if (status === "rejected" && !decisionNote.trim()) {
      toast.error("اكتب سبب الرفض قبل إغلاق الطلب");
      return;
    }
    if (item.live && liveMode && status === "approved" && ["expense", "correction"].includes(item.kind) && !decisionNote.trim()) {
      toast.error("اكتب مبرر الاعتماد قبل إغلاق الطلب");
      return;
    }
    if (item.live && liveMode) {
      if (item.kind === "substitute" && status === "approved" && !item.proposedInstructorId) {
        toast.error("لا يمكن اعتماد الاستبدال قبل اقتراح مدرب بديل.");
        return;
      }
      try {
        if (item.kind === "expense") {
          if (status === "approved") await apiClient.approveFinanceExpense(id, decisionNote.trim());
          else await apiClient.rejectFinanceExpense(id, decisionNote.trim());
        } else if (item.kind === "correction") {
          await apiClient.decideInvoiceCorrection(id, { decision: status.toUpperCase() as "APPROVED" | "REJECTED", reason: decisionNote.trim() });
        } else {
          await apiClient.decideApproval(id, {
            decision: status.toUpperCase() as "APPROVED" | "REJECTED",
            assignedInstructorId: status === "approved" && item.kind === "substitute" ? item.proposedInstructorId ?? undefined : undefined,
            reason: decisionNote.trim() || undefined,
          });
        }
        const decidedAtDate = new Date();
        const decidedAt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(decidedAtDate);
        setRequests(current => current.map(request => request.id === id ? { ...request, status, decidedAt, decidedAtSort: decidedAtDate.getTime(), decidedBy: "المستخدم الحالي", decisionNote: decisionNote.trim() || undefined } : request));
        setSelected(null); setDecisionNote(""); setExpenseRejectionMode(false);
        toast.success(status === "approved" ? "تم اعتماد الطلب على الخادم" : "تم رفض الطلب على الخادم");
      } catch (cause) {
        toast.error("تعذر تسجيل القرار", { description: cause instanceof Error ? cause.message : "فشل الاتصال بالخادم." });
      }
      return;
    }
    const decidedAtDate = new Date();
    const decidedAt = new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(decidedAtDate);
    setRequests(current =>
      current.map(item =>
        item.id === id
          ? {
              ...item,
              status,
              decidedAt,
              decidedAtSort: decidedAtDate.getTime(),
              decidedBy: "أحمد محمود · مدير الفرع",
              decisionNote: decisionNote.trim() || undefined,
            }
          : item
      )
    );
    setSelected(null);
    setDecisionNote("");
    setExpenseRejectionMode(false);
    toast.success(
      status === "approved"
        ? "تمت الموافقة في بيانات العرض"
        : "تم الرفض في بيانات العرض",
      {
        description: "هذا القرار محلي ولا يتم حفظه على خادم.",
      }
    );
  };
  const downloadCsv = () => {
    const rows = [
      [
        "رقم الطلب",
        "النوع",
        "الفرع",
        "الطلب",
        "مقدم الطلب",
        "التاريخ",
        "الحالة",
      ],
      ...visibleRequests.map(item => [
        item.id,
        item.kind === "discount"
          ? "خصم"
          : item.kind === "expense"
            ? "مصروف"
            : "مدرب بديل",
        item.branch,
        item.title,
        item.requestedBy,
        item.submittedAt,
        APPROVAL_STATUS_LABELS[item.status],
      ]),
    ];
    const csv = `\uFEFF${rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mada-branch-approvals-sample.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("تم تنزيل الطلبات الظاهرة كملف CSV");
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
          <button className="nav-link" onClick={() => navigate(isAccountant ? "/finance-desk" : "/")}>
            <LayoutDashboard size={19} />
            <span>الرئيسية</span>
          </button>
          <button className="nav-link" hidden={isAccountant} onClick={() => navigate("/students")}>
            <Users size={19} />
            <span>الطلاب</span>
            <span className="nav-count">248</span>
          </button>
          <button className="nav-link" hidden={isAccountant} onClick={() => navigate("/schedule")}>
            <CalendarDays size={19} />
            <span>الجدول</span>
          </button>
          <button className="nav-link" hidden={isAccountant} onClick={() => navigate("/classes")}>
            <BookOpen size={19} />
            <span>الحصص والكورسات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => showComingSoon("المسابقات")}
          >
            <Sparkles size={19} />
            <span>المسابقات</span>
          </button>
        </nav>
        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link" onClick={() => navigate("/finance")}>
            <Wallet size={19} />
            <span>المالية والتحصيل</span>
          </button>
          <button className="nav-link" hidden={isAccountant} onClick={() => navigate("/team")}>
            <Users size={19} />
            <span>الفريق والأدوار</span>
          </button>
          <button className="nav-link active" aria-current="page">
            <ShieldCheck size={19} />
            <span>الموافقات</span>
            <span className="nav-count">{pending.length}</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/reports")}>
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
        <div className="sidebar-bottom">
          <button
            className="nav-link"
            onClick={() => showComingSoon("الإعدادات")}
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => { void logout().then(() => navigate("/login")); }}
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
            <div
              className="branch-select assigned-branch"
              aria-label={liveMode ? "النطاق المصرح به" : `النطاق: فرع ${branch}`}
            >
              <span className="branch-icon">
                <MapPin size={17} />
              </span>
              <span>{liveMode ? "النطاق المصرح به" : `فرع ${branch}`}</span>
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                aria-label="البحث في الطلبات"
                placeholder="ابحث برقم الطلب أو الاسم..."
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="topbar-left">
            <NotificationCenter
              notifications={notifications}
              onAction={handleNotificationAction}
              onMarkAllRead={markAllNotificationsRead}
              demo={!liveMode}
            />
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => toast("إعدادات الحساب قيد التجهيز")}
            >
              <span className="profile-copy">
                <strong>{me?.user?.displayName?.trim() || "أحمد محمود"}</strong>
                <small>{me?.roleLabel || (liveMode ? "مدير الفرع" : "مدير الفرع")}</small>
              </span>
              <span className="profile-avatar">{me?.user?.displayName ? me.user.displayName.trim().slice(0, 2) : "أم"}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="workspace approvals-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => navigate("/")}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>الموافقات</span>
          </div>
          <section className="students-welcome approvals-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> {liveMode ? "طلبات الجلسات المسجلة على الخادم" : "قرارات مدير الفرع · طلبات تحتاج مراجعة"}
              </div>
              <h1>الموافقات</h1>
              <p>{liveMode ? "راجع طلبات الجلسات وطلبات البديل ضمن نطاق صلاحيتك." : `راجع طلبات الخصم وتغيير مدرب الحصة قبل اعتمادها لفرع ${branch}.`}</p>
            </div>
            <div className="welcome-actions">
              <button className="button button-secondary" onClick={downloadCsv}>
                <ArrowDownToLine size={17} /> تصدير القائمة
              </button>
              <span className="approval-pending-pill">
                <i /> {loading ? "..." : `${pending.length} طلبات معلّقة`}
              </span>
            </div>
          </section>
          {loadError && <section className="team-demo-note approvals-demo-note" role="alert"><AlertCircle size={16} /><span>تعذر تحميل الموافقات والإشعارات: {loadError}</span></section>}
          <section className="team-demo-note approvals-demo-note" role="note">
            <AlertCircle size={16} />
            <span>
              {liveMode ? "الطلبات التشغيلية تُقرأ من الـAPI. يمكن تسجيل القرار من هذه الشاشة؛ الخصومات والمصروفات لا يدعمها هذا endpoint." : "بيانات توضيحية محلية. الموافقة أو الرفض يغيّر حالة الطلب داخل هذه المعاينة فقط ولا يحفظ قرارًا رسميًا."}
            </span>
            {!liveMode && <span className="demo-tag">DEMO</span>}
          </section>
          {!liveMode && <section
            className="manager-policy-card"
            aria-label="صلاحيات مدير الفرع"
          >
            <span className="manager-policy-icon">
              <ShieldCheck size={18} />
            </span>
            <div>
              <strong>نطاق مدير فرع مدينة نصر</strong>
              <p>
                اعتماد الخصومات حتى {BRANCH_MANAGER_DISCOUNT_LIMIT}% وتبديل
                المدربين داخل الفرع.
              </p>
            </div>
            <span className="manager-policy-escalation">
              ما فوق {BRANCH_MANAGER_DISCOUNT_LIMIT}% <b>يُرفع للإدارة</b>
            </span>
          </section>}

          <section
            className="finance-stats-grid approval-stats"
            aria-label="ملخص الموافقات"
          >
            <article className="finance-stat">
              <span className="finance-stat-icon icon-amber">
                <Clock3 size={18} />
              </span>
              <span className="finance-stat-label">بانتظار قرارك</span>
              <div>
                <strong>{loading ? "..." : pending.length}</strong>
                <small>{liveMode ? "طلب ضمن نطاقك" : "طلب داخل الفرع"}</small>
              </div>
              <small>ابدأ بالأقدم أو الأكثر تأثيرًا</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-blue">
                <FileText size={18} />
              </span>
              <span className="finance-stat-label">{liveMode ? "طلبات جلسة" : "طلبات الخصم"}</span>
              <div>
                <strong>{loading ? "..." : (liveMode ? pendingSessionRequests : pendingDiscounts)}</strong>
                <small>تحتاج مراجعة</small>
              </div>
              <small>{liveMode ? "إضافية أو تعويضية" : "خصم إخوة أو حملة توضيحية"}</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-violet">
                <UserCheck size={18} />
              </span>
              <span className="finance-stat-label">طلبات مدرب بديل</span>
              <div>
                <strong>{pendingSubstitutes}</strong>
                <small>تحتاج مراجعة</small>
              </div>
              <small>تبديل مؤقت لجلسة محددة</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-teal">
                <Wallet size={18} />
              </span>
              <span className="finance-stat-label">مصروفات تحتاج تأكيدًا</span>
              <div>
                <strong>{liveMode ? "—" : pendingExpenses}</strong>
                <small>{liveMode ? "غير مدعومة هنا" : "ترفعها المحاسبة"}</small>
              </div>
              <small>{liveMode ? "تحتاج endpoint مالي منفصل" : "تظهر في الماليات بعد اعتمادك"}</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-teal">
                <CheckCircle2 size={18} />
              </span>
              <span className="finance-stat-label">تمت مراجعتها</span>
              <div>
                <strong>
                  {
                    reviewedRequests.length
                  }
                </strong>
                <small>{liveMode ? "من الخادم" : "في هذه المعاينة"}</small>
              </div>
              <small>يمكن متابعة سجل القرار في كل بطاقة</small>
            </article>
          </section>

          <section className="panel approvals-panel">
            <div className="approval-toolbar-top">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-amber">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h2>قائمة المراجعة</h2>
                  <p>الطلبات المرسلة إلى مدير الفرع</p>
                </div>
              </div>
              <span className="team-table-total">
                {visibleRequests.length} طلب
              </span>
            </div>
            <div className="approval-controls">
              <ApprovalQueueTabs
                activeTab={tab}
                onChange={setTab}
                tabs={liveMode ? [
                  { id: "all", label: "كل الطلبات", count: branchRequests.length },
                  { id: "session", label: "طلبات الجلسات", count: pendingSessionRequests },
                  { id: "substitute", label: "مدرب بديل", count: pendingSubstitutes },
                  { id: "correction", label: "تصحيح فواتير", count: pending.filter(item => item.kind === "correction").length },
                ] : [
                  {
                    id: "all",
                    label: "كل الطلبات",
                    count: branchRequests.length,
                  },
                  {
                    id: "discount",
                    label: "خصومات",
                    count: branchRequests.filter(
                      item => item.kind === "discount"
                    ).length,
                  },
                  {
                    id: "substitute",
                    label: "مدرب بديل",
                    count: branchRequests.filter(
                      item => item.kind === "substitute"
                    ).length,
                  },
                  {
                    id: "expense",
                    label: "مصروفات",
                    count: branchRequests.filter(
                      item => item.kind === "expense"
                    ).length,
                  },
                ]}
              />
              <label className="approval-search">
                <Search size={15} />
                <input
                  aria-label="بحث في قائمة المراجعة"
                  placeholder="بحث في الطلبات..."
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="approval-filter-row">
              <label>
                حالة الطلب
                <select
                  aria-label="تصفية حسب حالة الطلب"
                  value={statusFilter}
                  onChange={event =>
                    setStatusFilter(
                      event.target.value as ApprovalStatus | "all"
                    )
                  }
                >
                  <option value="all">كل الحالات</option>
                  <option value="pending">بانتظار المراجعة</option>
                  <option value="approved">تمت الموافقة</option>
                  <option value="rejected">تم الرفض</option>
                </select>
              </label>
              <label>
                ترتيب القائمة
                <select
                  aria-label="ترتيب قائمة الطلبات"
                  value={sortOrder}
                  onChange={event =>
                    setSortOrder(event.target.value as ApprovalSort)
                  }
                >
                  <option value="priority">المعلّق أولًا · الأقدم</option>
                  <option value="oldest">الأقدم إرسالًا</option>
                  <option value="newest">الأحدث إرسالًا</option>
                </select>
              </label>
              <span className="approval-filter-summary">
                {loading ? "جارٍ التحميل…" : `${visibleRequests.length} نتيجة · ${pending.length} معلّق`}
              </span>
            </div>
            {loading ? (
              <div className="team-empty approval-empty" style={{ minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                <div style={{ width: 28, height: 28, border: "3px solid rgba(13, 148, 136, 0.2)", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <strong style={{ color: "var(--foreground, #1e293b)" }}>جارٍ تحميل طلبات الاعتماد من الخادم…</strong>
                <span style={{ color: "var(--muted-foreground, #64748b)", fontSize: "0.875rem" }}>يرجى الانتظار لحظات لمزامنة أحدث الطلبات التشغيلية</span>
              </div>
            ) : visibleRequests.length ? (
              <div className="approval-list">
                {visibleRequests.map(item => (
                  <ApprovalCard
                    key={item.id}
                    item={item}
                    onReview={openReview}
                  />
                ))}
              </div>
            ) : (
              <div className="team-empty approval-empty">
                <Search size={20} />
                <strong>مفيش طلبات مطابقة</strong>
                <span>جرّب نوع طلب مختلف أو ابحث بكلمة أقصر.</span>
                <button
                  className="text-link"
                  onClick={() => {
                    setQuery("");
                    setTab("all");
                  }}
                >
                  مسح البحث والفلاتر
                </button>
              </div>
            )}
            <div className="team-table-footer">
              <span>{loading ? "جارٍ التحديث…" : (liveMode ? "طلبات الخادم" : "قائمة توضيحية")} · {visibleRequests.length} من {branchRequests.length} طلب</span>
              <span>النطاق: {branch}</span>
            </div>
          </section>
          <section
            className="panel approval-history-panel"
            aria-labelledby="approval-history-title"
          >
            <div className="approval-history-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-teal">
                  <Activity size={18} />
                </span>
                <div>
                  <h2 id="approval-history-title">سجل القرارات</h2>
                  <p>آخر قرارات مدير الفرع · {branch}</p>
                </div>
              </div>
              <span className="team-table-total">
                {loading ? "..." : `${reviewedRequests.length} قرار`}
              </span>
            </div>
            <AuditTimeline
              events={auditEvents}
              emptyLabel={loading ? "جارٍ تحميل سجل القرارات…" : (liveMode ? "لا توجد قرارات محفوظة في هذا النطاق بعد." : "لا توجد قرارات مسجلة في بيانات العرض بعد.")}
            />
          </section>
          <div className="finance-footer-note">
            <span>
              <AlertCircle size={14} />
            </span>
            <p>
              {liveMode
                ? "الموافقات المعروضة محمّلة من واجهات الخادم ومقيّدة بنطاق الحساب؛ قرارات المصروفات والتصحيحات تحفظ السبب والمستخدم والفرع في سجل التدقيق."
                : "الخصومات والجلسات في هذه المعاينة توضيحية فقط؛ لا تُحفظ قراراتها على الخادم."}
            </p>
          </div>
        </div>
      </main>

      {selected && (
        <DecisionDialog
          item={selected}
          canApprove={canApproveSelected}
          discountLimit={BRANCH_MANAGER_DISCOUNT_LIMIT}
          decisionNote={decisionNote}
          expenseRejectionMode={expenseRejectionMode}
          liveMode={liveMode}
          onDecisionNoteChange={setDecisionNote}
          onClose={closeReview}
          onDecide={status => decide(selected.id, status)}
          onStartExpenseRejection={() => {
            setDecisionNote("");
            setExpenseRejectionMode(true);
          }}
          onCancelExpenseRejection={() => {
            setExpenseRejectionMode(false);
            setDecisionNote("");
          }}
        />
      )}
    </div>
  );
}
