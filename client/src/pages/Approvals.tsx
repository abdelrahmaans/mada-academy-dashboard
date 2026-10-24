import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  FileText,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { getRoleDefinition } from "@/lib/roleNavigation";
import type { RoleCode } from "@/contexts/RoleScopeContext";
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
import {
  apiClient,
  freezeStorage,
  type ApprovalRequestRecord,
  type FinanceExpense,
  type InvoiceCorrection,
  type NotificationRecord,
  type SubscriptionFreezeRequest,
} from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

import {
  type QueueTab,
  type ApprovalSort,
  BRANCH_MANAGER_DISCOUNT_LIMIT,
  INITIAL_REQUESTS,
  INITIAL_NOTIFICATIONS,
  approvalFromApi,
  notificationFromApi,
  correctionFromApi,
  expenseFromApi,
  freezeFromStorage,
} from "./ApprovalsTypes";

export type {
  QueueTab,
  ApprovalSort,
};

export {
  BRANCH_MANAGER_DISCOUNT_LIMIT,
  INITIAL_REQUESTS,
  INITIAL_NOTIFICATIONS,
  approvalFromApi,
  notificationFromApi,
  correctionFromApi,
  expenseFromApi,
  freezeFromStorage,
};

export default function Approvals() {
  const [, navigate] = useLocation();
  const { me } = useAuth();
  const [liveMode, setLiveMode] = useState(() => apiClient.hasSession());
  const [loading, setLoading] = useState(() => apiClient.hasSession());
  const [requests, setRequests] = useState<ApprovalItem[]>(() => apiClient.hasSession() ? [] : INITIAL_REQUESTS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const branch = liveMode
    ? me?.branches?.find(item => item.id === me.branchId)?.name ?? me?.branches?.[0]?.name ?? "الفرع المصرح"
    : "مدينة نصر";
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
      apiClient.freezeRequests(),
    ]).then(([approvalResult, notificationResult, correctionResult, expenseResult, freezeResult]) => {
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
      const freezes = freezeResult.status === "fulfilled"
        ? freezeResult.value.map(freezeFromStorage)
        : freezeStorage.getRequests().map(freezeFromStorage);
      setRequests([...supported.map(approvalFromApi), ...corrections, ...expenses, ...freezes]);
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
      try {
        if (item.kind === "freeze") {
          try {
            await apiClient.decideFreezeRequest(id, status === "approved" ? "APPROVED" : "REJECTED", decisionNote.trim());
          } catch {
            freezeStorage.decideRequest(id, status === "approved" ? "APPROVED" : "REJECTED", me?.user?.displayName || "مدير الفرع", decisionNote.trim());
          }
        } else if (item.kind === "expense") {
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
        setRequests(current => current.map(request => request.id === id ? { ...request, status, decidedAt, decidedAtSort: decidedAtDate.getTime(), decidedBy: me?.user?.displayName || "مدير الفرع", decisionNote: decisionNote.trim() || undefined } : request));
        setSelected(null); setDecisionNote(""); setExpenseRejectionMode(false);
        toast.success(status === "approved" ? (item.kind === "freeze" ? "تم اعتماد التجميد وتمديد الاشتراك وإضافة رصيد التعويض" : "تم اعتماد الطلب") : "تم رفض الطلب");
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

  const userRoleCode = me?.role ? (me.role.replace(/_.*$/, "") as RoleCode) : undefined;
  const activeRoleCode: RoleCode = userRoleCode || "R02";
  const roleDef = getRoleDefinition(activeRoleCode);
  const branchContext = me?.branchId ? me.branches?.find(b => b.id === me.branchId)?.name : branch;

  return (
    <RoleDashboardShell
      className="app-shell approvals-shell"
      roleCode={activeRoleCode}
      roleLabel={me?.roleLabel || roleDef.label}
      scopeLevel={roleDef.scopeLevel}
      scopeLabel={roleDef.defaultScopeLabel}
      tenantName={me?.academy?.name}
      branchName={branchContext}
      demo={!liveMode}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
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
                  { id: "freeze", label: "تجميد اشتراكات", count: pending.filter(item => item.kind === "freeze").length },
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
                    id: "freeze",
                    label: "تجميد اشتراكات",
                    count: branchRequests.filter(item => item.kind === "freeze").length,
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
    </RoleDashboardShell>
  );
}
