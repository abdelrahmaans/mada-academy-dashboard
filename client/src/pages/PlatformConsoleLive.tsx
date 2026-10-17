import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  CreditCard,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Ticket,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import SessionLogoutButton from "@/components/SessionLogoutButton";
import {
  apiClient,
  type PlatformAcademy,
  type PlatformActivity,
  type PlatformMember,
  type PlatformOverview,
  type PlatformRole,
} from "@/lib/apiClient";
import "./PlatformConsoleLive.css";

type View =
  | "overview"
  | "academies"
  | "subscriptions"
  | "tickets"
  | "support"
  | "audit"
  | "system"
  | "roles";

interface NavItem {
  id: View;
  label: string;
  icon: typeof Building2;
}

const nav: NavItem[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "academies", label: "سجل الأكاديميات", icon: Building2 },
  { id: "subscriptions", label: "متابعة الاشتراكات", icon: CreditCard },
  { id: "tickets", label: "مركز التذاكر والدعم", icon: LifeBuoy },
  { id: "support", label: "مستخدمي الأكاديمية", icon: Users },
  { id: "audit", label: "سجل العمليات والـ Audit", icon: Activity },
  { id: "system", label: "حالة النظام والخوادم", icon: Server },
  { id: "roles", label: "سياسة وصلاحيات الأدوار", icon: KeyRound },
];

interface SupportTicket {
  id: string;
  academyId: string;
  academyName: string;
  requesterName: string;
  requesterRole: string;
  requesterPhone: string;
  subject: string;
  category: "اشتراكات وخطط" | "مشكلة تقنية" | "تفعيل فروع" | "استفسار تشغيلي";
  priority: "urgent" | "high" | "medium" | "low";
  status: "new" | "inProgress" | "waiting" | "resolved";
  createdAt: string;
  description: string;
  internalNotes?: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "TCK-801",
    academyId: "demo-academy-01",
    academyName: "أكاديمية مدى النموذجية",
    requesterName: "م. محمد فوزي",
    requesterRole: "مسؤول الأكاديمية · R01",
    requesterPhone: "+201000000002",
    subject: "طلب ترقية باقة الأكاديمية وإضافة فرعين جدد",
    category: "اشتراكات وخطط",
    priority: "high",
    status: "new",
    createdAt: "17 أكتوبر 2026",
    description:
      "نود توسيع نطاق الأكاديمية لفرعي الشيخ زايد والتجمع الخامس وتفعيل صلاحية الفروع المتعددة على اشتراكنا السنوي.",
    internalNotes: "بانتظار تأكيد استلام التحويل البنكي للباقة السنوية.",
  },
  {
    id: "TCK-794",
    academyId: "demo-academy-02",
    academyName: "أكاديمية الفرسان الرياضية",
    requesterName: "كابتن أحمد مجدي",
    requesterRole: "مدير الفرع · R02",
    requesterPhone: "+201011223344",
    subject: "استفسار عن ربط أجهزة البصمة بنظام الحضور الذاتي",
    category: "مشكلة تقنية",
    priority: "medium",
    status: "inProgress",
    createdAt: "16 أكتوبر 2026",
    description:
      "هل تدعم واجهة تسجيل الحضور الربط المباشر مع أجهزة ZKTeco لبصمة حمام السباحة؟",
    internalNotes: "تم توضيح آلية الـ Webhook وAPI الجلسات للمدير التقني لديهم.",
  },
  {
    id: "TCK-789",
    academyId: "demo-academy-03",
    academyName: "مركز مسار لتعليم الروبوتكس",
    requesterName: "أ/ سارة المهدي",
    requesterRole: "مسؤول الحسابات · R06",
    requesterPhone: "+201099887766",
    subject: "طلب تصدير كشوفات الإيرادات الضريبية للربع الثالث",
    category: "استفسار تشغيلي",
    priority: "low",
    status: "resolved",
    createdAt: "14 أكتوبر 2026",
    description:
      "تم استخراج التقارير الربع سنوية وتأكيد مطابقة أرقام الفواتير.",
    internalNotes: "تم حل المشكلة وتوفير كشف الـ CSV المخصص.",
  },
];

const statusLabel: Record<string, string> = {
  ACTIVE: "نشط",
  TRIAL: "تجريبي",
  SETUP: "إعداد",
  PAUSED: "موقوف",
};

const ticketPriorityLabels: Record<
  SupportTicket["priority"],
  { label: string; class: string }
> = {
  urgent: { label: "عاجل جدًا", class: "urgent" },
  high: { label: "أولوية عالية", class: "high" },
  medium: { label: "أولوية متوسطة", class: "medium" },
  low: { label: "عادي", class: "low" },
};

const ticketStatusLabels: Record<
  SupportTicket["status"],
  { label: string; class: string }
> = {
  new: { label: "تذكرة جديدة", class: "new" },
  inProgress: { label: "قيد المتابعة", class: "inProgress" },
  waiting: { label: "بانتظار العميل", class: "waiting" },
  resolved: { label: "تم الحل", class: "resolved" },
};

// Formats dates with Arabic locale but standard English/Latin numbers (e.g. 17 أكتوبر 2026)
const fmtDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

// Always returns standard Western/English numerals (e.g. 79, 126, 1,250)
const fmtNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const reasonValid = (reason: string) => reason.trim().length >= 4;

interface ReasonModalState {
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: (reason: string) => Promise<void>;
}

export default function PlatformConsoleLive() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [academies, setAcademies] = useState<PlatformAcademy[]>([]);
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [members, setMembers] = useState<PlatformMember[]>([]);
  const [activity, setActivity] = useState<PlatformActivity[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState("");

  // Contextual modal prompt for reasons instead of awkward inline inputs
  const [reasonModal, setReasonModal] = useState<ReasonModalState | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicket | null>(null);
  const [ticketReplyNote, setTicketReplyNote] = useState("");
  const [ticketStatusDraft, setTicketStatusDraft] =
    useState<SupportTicket["status"]>("inProgress");

  const selectedTenant =
    academies.find((item) => item.id === selectedTenantId) ?? null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setWarning(null);

    Promise.allSettled([
      apiClient.platformOverview(),
      apiClient.platformAcademies(),
      apiClient.platformRoles(),
    ])
      .then(([overviewResult, academyResult, rolesResult]) => {
        if (!active) return;
        const warnings: string[] = [];

        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value);
        } else {
          warnings.push("مؤشرات المنصة غير متاحة مؤقتًا.");
        }

        if (academyResult.status === "fulfilled") {
          setAcademies(academyResult.value.items);
          setSelectedTenantId(
            (current) => current || academyResult.value.items[0]?.id || ""
          );
        } else {
          warnings.push("قائمة الأكاديميات غير متاحة مؤقتًا.");
        }

        if (rolesResult.status === "fulfilled") {
          setRoles(rolesResult.value.items);
        } else {
          warnings.push("تعريفات أدوار المنصة غير متاحة مؤقتًا.");
        }

        if (warnings.length === 3) {
          throw new Error("تعذر تحميل بيانات الإدارة الحية.");
        }

        if (warnings.length > 0) {
          const warningMessage = warnings.join(" ");
          setWarning(warningMessage);
          toast.error(warningMessage);
        } else {
          setWarning(null);
        }

        if (refreshKey > 0) toast.success("تم تحديث بيانات المنصة");
      })
      .catch((failure) => {
        if (!active) return;
        const message =
          failure instanceof Error
            ? failure.message
            : "تعذر تحميل بيانات الإدارة الحية.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedTenantId || (view !== "support" && view !== "audit")) return;
    let active = true;
    setSupportLoading(true);
    setSupportError(null);

    const delay = window.setTimeout(
      () => {
        const calls =
          view === "support"
            ? Promise.all([
                apiClient.platformAcademyMembers(
                  selectedTenantId,
                  userSearch
                ),
                apiClient.platformAcademyActivity(selectedTenantId),
              ])
            : Promise.all([
                apiClient.platformAcademyActivity(selectedTenantId),
              ]);

        calls
          .then((result) => {
            if (!active) return;
            if (view === "support") {
              const [memberResponse, activityResponse] = result as [
                { items: PlatformMember[] },
                { items: PlatformActivity[] },
              ];
              setMembers(memberResponse.items);
              setActivity(activityResponse.items);
            } else {
              const [activityResponse] = result as [
                { items: PlatformActivity[] },
              ];
              setActivity(activityResponse.items);
            }
          })
          .catch((failure) => {
            if (!active) return;
            const message =
              failure instanceof Error
                ? failure.message
                : "تعذر تحميل سجل الدعم.";
            setSupportError(message);
            toast.error(message);
          })
          .finally(() => {
            if (active) setSupportLoading(false);
          });
      },
      view === "support" ? 250 : 0
    );

    return () => {
      active = false;
      window.clearTimeout(delay);
    };
  }, [selectedTenantId, userSearch, view, refreshKey]);

  const filteredAcademies = useMemo(() => {
    const query = tenantSearch.trim().toLocaleLowerCase("ar-EG");
    return academies.filter(
      (item) =>
        !query ||
        `${item.name} ${item.owner ?? ""} ${item.id} ${item.slug}`
          .toLocaleLowerCase("ar-EG")
          .includes(query)
    );
  }, [academies, tenantSearch]);

  const requestTenantStatusChange = (tenant: PlatformAcademy) => {
    const next = tenant.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    setReasonInput("");
    setReasonModal({
      title:
        next === "PAUSED"
          ? `إيقاف أكاديمية: ${tenant.name}`
          : `إعادة تفعيل: ${tenant.name}`,
      description:
        next === "PAUSED"
          ? `سيتم إيقاف صلاحية الدخول للأكاديمية فورًا وإلغاء جلسات المستخدمين النشطة.`
          : `سيتم إعادة تفعيل الأكاديمية، وسيحتاج المستخدمون لإعادة تسجيل الدخول.`,
      confirmLabel: next === "PAUSED" ? "تأكيد الإيقاف" : "تأكيد التفعيل",
      isDestructive: next === "PAUSED",
      onConfirm: async (reason) => {
        setBusyKey(`tenant:${tenant.id}`);
        try {
          const result = await apiClient.changePlatformAcademyStatus(
            tenant.id,
            next,
            reason
          );
          toast.success(
            next === "PAUSED"
              ? `تم إيقاف الأكاديمية بنجاح.`
              : "تمت إعادة تفعيل الأكاديمية بنجاح."
          );
          setRefreshKey((value) => value + 1);
        } catch (failure) {
          toast.error(
            failure instanceof Error ? failure.message : "تعذر تغيير الحالة."
          );
        } finally {
          setBusyKey("");
        }
      },
    });
  };

  const requestMemberStatusChange = (
    member: PlatformMember,
    status: "ACTIVE" | "REVOKED"
  ) => {
    if (!selectedTenant) return;
    setReasonInput("");
    setReasonModal({
      title:
        status === "REVOKED"
          ? `تعطيل حساب: ${member.name ?? member.maskedPhone}`
          : `إعادة تفعيل حساب: ${member.name ?? member.maskedPhone}`,
      description:
        status === "REVOKED"
          ? `سيتم إلغاء عضوية هذا المستخدم في ${selectedTenant.name} فورًا وإنهاء جلسات الـ Refresh النشطة.`
          : `سيتم استرجاع عضوية المستخدم وتفعيل وصوله للأكاديمية مجددًا.`,
      confirmLabel: status === "REVOKED" ? "تأكيد التعطيل" : "تأكيد التفعيل",
      isDestructive: status === "REVOKED",
      onConfirm: async (reason) => {
        setBusyKey(`member:${member.membershipId}`);
        try {
          await apiClient.changePlatformMemberStatus(
            selectedTenant.id,
            member.membershipId,
            status,
            reason
          );
          toast.success(
            status === "REVOKED"
              ? "تم تعطيل العضوية وإنهاء الجلسات."
              : "تمت استعادة العضوية بنجاح."
          );
          setRefreshKey((value) => value + 1);
        } catch (failure) {
          toast.error(
            failure instanceof Error ? failure.message : "تعذر تغيير العضوية."
          );
        } finally {
          setBusyKey("");
        }
      },
    });
  };

  const requestRevokeSessions = (member: PlatformMember) => {
    if (!selectedTenant) return;
    setReasonInput("");
    setReasonModal({
      title: `تدوير الجلسات الأمنية لـ: ${member.name ?? member.maskedPhone}`,
      description: `سيتم إنهاء كافة جلسات تسجيل الدخول الحالية لهذا الحساب وإلزامه بتسجيل الدخول بكلمة المرور مجددًا.`,
      confirmLabel: "إنهاء الجلسات الحالية",
      isDestructive: true,
      onConfirm: async (reason) => {
        setBusyKey(`sessions:${member.userId}`);
        try {
          const result = await apiClient.revokePlatformUserSessions(
            selectedTenant.id,
            member.userId,
            reason
          );
          toast.success(`تم إنهاء ${result.revokedCount} جلسة نشطة.`);
          setRefreshKey((value) => value + 1);
        } catch (failure) {
          toast.error(
            failure instanceof Error ? failure.message : "تعذر إلغاء الجلسات."
          );
        } finally {
          setBusyKey("");
        }
      },
    });
  };

  const handleUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: ticketStatusDraft,
              internalNotes: ticketReplyNote || t.internalNotes,
            }
          : t
      )
    );
    toast.success("تم تحديث حالة التذكرة وسجل المتابعة");
    setSelectedTicket(null);
    setTicketReplyNote("");
  };

  const title = nav.find((item) => item.id === view)?.label ?? "إدارة المنصة";

  // Contextual header action button matching the active view only
  const getHeaderAction = () => {
    switch (view) {
      case "academies":
        return (
          <button
            className="pc-live-primary"
            type="button"
            onClick={() => navigate("/platform/academies/new")}
          >
            <Plus size={16} /> إنشاء أكاديمية جديدة
          </button>
        );
      case "tickets":
        return (
          <span className="pc-live-count-badge">
            {fmtNumber(tickets.filter((t) => t.status !== "resolved").length)}{" "}
            تذاكر مفتوحة
          </span>
        );
      case "system":
        return (
          <button
            className="pc-live-primary"
            type="button"
            onClick={() => {
              toast.promise(apiClient.platformOverview(), {
                loading: "جارٍ فحص استجابة الخوادم وقاعدة البيانات…",
                success: "جميع خدمات المنصة وقاعدة البيانات تعمل بكفاءة تامة",
                error: "تعذر الوصول للباك إند حاليًا",
              });
            }}
          >
            <RefreshCw size={15} /> فحص الاتصال الآن
          </button>
        );
      default:
        return (
          <button
            className="pc-live-link"
            type="button"
            onClick={() => setRefreshKey((v) => v + 1)}
          >
            <RefreshCw size={14} /> تحديث البيانات
          </button>
        );
    }
  };

  return (
    <RoleDashboardShell
      className="app-shell pc-live-shell"
      hideSidebar
      showSessionLogout={false}
      roleCode="R00"
      roleLabel="مسؤول المنصة"
      scopeLevel="platform"
      scopeLabel="نطاق المنصة"
      tenantName="منصة مدى"
      demo={false}
    >
      {/* Mobile Scrim */}
      {mobileOpen && (
        <button
          type="button"
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Unified Mada Sidebar for R00 */}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        aria-label="تنقل إدارة المنصة"
      >
        <div className="sidebar-top">
          <button
            type="button"
            className="brand-lockup r01-brand-button"
            onClick={() => {
              setView("overview");
              setMobileOpen(false);
            }}
          >
            <span className="brand-symbol">
              <GraduationCap size={28} />
            </span>
            <span className="brand-word">مدى</span>
          </button>
          <button
            type="button"
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="academy-switcher" aria-label="نطاق المنصة">
          <span className="academy-avatar">
            <ShieldCheck size={20} />
          </span>
          <span className="academy-meta">
            <strong>منصة مدى</strong>
            <small>مسؤول المنصة · R00</small>
          </span>
          <ChevronDown size={15} className="switcher-chevron" />
        </div>

        <div className="nav-caption">مساحة مسؤول المنصة</div>
        <nav className="primary-nav" aria-label="مساحة مسؤول المنصة">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setView(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>محتاج مساعدة؟</strong>
            <span>دليل إدارة المنصة</span>
          </div>
          <ChevronLeft size={16} />
        </div>

        <div className="sidebar-bottom">
          <SessionLogoutButton className="nav-link" iconSize={19} />
        </div>

        <div className="sidebar-version">
          مدى لإدارة المنصة <span>R00</span>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="pc-live-main" dir="rtl">
        <header className="pc-live-topbar">
          <div className="pc-live-topbar-right">
            <button
              type="button"
              className="pc-mobile-menu"
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>
              <Building2 size={16} /> لوحة التحكم المركزية لمنصة مدى
            </span>
          </div>
          <span className="pc-topbar-date">
            <CalendarDays size={14} />
            {new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </span>
        </header>

        <div className="pc-live-content">
          <PageHeader
            eyebrow={
              <span className="pc-live-eyebrow">
                <ShieldCheck size={14} /> مساحة إدارة المنصة
              </span>
            }
            title={title}
            description="إدارة اشتراكات الأكاديميات، خدمة الدعم الفني، ومتابعة العمليات المركزية."
            actions={getHeaderAction()}
          />

          <RoleScopeCard className="pc-live-scope" compact />

          {loading && (
            <div className="pc-live-state" role="status">
              <RefreshCw className="pc-live-spin" size={18} /> جارٍ تحميل بيانات
              المنصة…
            </div>
          )}

          {!loading && error && (
            <div className="pc-live-state pc-live-error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !error && warning && (
            <div className="pc-live-state pc-live-error" role="status">
              <AlertCircle size={19} />
              <span>{warning} البيانات المتاحة ما زالت معروضة من الخادم.</span>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* VIEW: OVERVIEW */}
          {!loading && !error && view === "overview" && (
            <>
              <section
                className="pc-live-metrics"
                aria-label="مؤشرات المنصة الحية"
              >
                <Metric
                  icon={<Building2 />}
                  label="الأكاديميات المسجلة"
                  value={overview?.academies ?? academies.length}
                  note="إجمالي الأكاديميات"
                />
                <Metric
                  icon={<CheckCircle2 />}
                  label="أكاديميات نشطة"
                  value={
                    overview?.activeAcademies ??
                    academies.filter((a) => a.status === "ACTIVE").length
                  }
                  note="اشتراكات سارية حاليًا"
                />
                <Metric
                  icon={<Ticket />}
                  label="تذاكر قيد المتابعة"
                  value={tickets.filter((t) => t.status !== "resolved").length}
                  note="بانتظار فريق الدعم"
                />
                <Metric
                  icon={<Activity />}
                  label="جلسات التشغيل الحية"
                  value={overview?.activeSessions ?? 0}
                  note="جلسات تسجيل نشطة"
                />
              </section>

              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>الأكاديميات التي تحتاج متابعة</h2>
                    <p>
                      أكاديميات قيد التهيئة، أو اشتراكات موقوفة ومحتاجة مراجعة.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pc-live-link"
                    onClick={() => setView("academies")}
                  >
                    عرض كل الأكاديميات
                  </button>
                </header>
                <AcademyTable
                  rows={academies
                    .filter(
                      (item) =>
                        item.status === "PAUSED" || item.status === "SETUP"
                    )
                    .slice(0, 6)}
                  onSupport={(id) => {
                    setSelectedTenantId(id);
                    setView("support");
                  }}
                  onStatus={requestTenantStatusChange}
                  busyKey={busyKey}
                />
                {academies.every(
                  (item) =>
                    item.status !== "PAUSED" && item.status !== "SETUP"
                ) && (
                  <p className="pc-live-empty">
                    جميع الأكاديميات في حالة نشطة وتعمل بكفاءة.
                  </p>
                )}
              </section>
            </>
          )}

          {/* VIEW: ACADEMIES */}
          {!loading && !error && view === "academies" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>سجل الأكاديميات المشتركة</h2>
                  <p>
                    {fmtNumber(academies.length)} أكاديمية مسجلة؛ يمكنك البحث
                    بالاسم أو المسؤول أو المعرف.
                  </p>
                </div>
              </header>
              <label className="pc-live-search">
                <Search size={16} />
                <input
                  value={tenantSearch}
                  onChange={(event) => setTenantSearch(event.target.value)}
                  placeholder="ابحث عن اسم الأكاديمية أو المالك أو الكود..."
                />
              </label>
              <AcademyTable
                rows={filteredAcademies}
                onSupport={(id) => {
                  setSelectedTenantId(id);
                  setView("support");
                }}
                onStatus={requestTenantStatusChange}
                busyKey={busyKey}
              />
            </section>
          )}

          {/* VIEW: SUBSCRIPTIONS */}
          {!loading && !error && view === "subscriptions" && (
            <>
              <section
                className="pc-live-metrics"
                aria-label="ملخص الاشتراكات"
              >
                <Metric
                  icon={<CheckCircle2 />}
                  label="اشتراكات سارية"
                  value={
                    academies.filter((a) => a.status === "ACTIVE").length
                  }
                  note="باقات مدفوعة ونشطة"
                />
                <Metric
                  icon={<CalendarDays />}
                  label="باقات تجريبية (Trial)"
                  value={academies.filter((a) => a.status === "TRIAL").length}
                  note="14 يوم تجربة مجانية"
                />
                <Metric
                  icon={<Clock3 />}
                  label="تحتاج تجديد / مراجعة"
                  value={
                    academies.filter((a) => a.status === "PAUSED").length
                  }
                  note="متوقفة لانتهاء الاشتراك"
                />
                <Metric
                  icon={<CreditCard />}
                  label="الباقات المعتمدة"
                  value={3}
                  note="Starter · Growth · Enterprise"
                />
              </section>

              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>إدارة خطط واشتراكات الأكاديميات</h2>
                    <p>
                      متابعة الخطة، عدد الفروع المسموح بها، وتاريخ تجديد
                      الاشتراك.
                    </p>
                  </div>
                </header>
                <div className="pc-live-table-wrap">
                  <table className="pc-live-table">
                    <thead>
                      <tr>
                        <th>الأكاديمية</th>
                        <th>الباقة الحالية</th>
                        <th>الفروع المصرحة</th>
                        <th>المستخدمون</th>
                        <th>حالة الاشتراك</th>
                        <th>إجراء الاشتراك</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academies.map((row) => (
                        <tr key={row.id}>
                          <th scope="row">
                            <strong>{row.name}</strong>
                            <small>
                              {row.owner ?? "مسؤول الأكاديمية"} · {row.id}
                            </small>
                          </th>
                          <td>
                            <strong>{row.plan || "باقة Growth"}</strong>
                            <small>تجديد سنوي</small>
                          </td>
                          <td>
                            <strong>{fmtNumber(row.branches)} فروع</strong>
                          </td>
                          <td>
                            <strong>{fmtNumber(row.users)} حساب</strong>
                          </td>
                          <td>
                            <span
                              className={`pc-live-status-tag ${
                                row.status === "PAUSED"
                                  ? "paused"
                                  : row.status === "TRIAL"
                                  ? "trial"
                                  : ""
                              }`}
                            >
                              {statusLabel[row.status] ?? row.status}
                            </span>
                          </td>
                          <td>
                            <div className="pc-live-row-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  toast.info(
                                    `طلب تجديد اشتراك ${row.name} قيد المعالجة`
                                  );
                                }}
                              >
                                تجديد الباقة
                              </button>
                              <button
                                type="button"
                                onClick={() => requestTenantStatusChange(row)}
                                disabled={busyKey === `tenant:${row.id}`}
                              >
                                {row.status === "PAUSED"
                                  ? "إعادة تفعيل"
                                  : "إيقاف مؤقت"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* VIEW: TICKETS & SUPPORT */}
          {!loading && !error && view === "tickets" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>مركز تذاكر ودعم الأكاديميات</h2>
                  <p>
                    متابعة الطلبات المرفوعة من مسؤولي الأكاديميات والمديرين
                    للتواصل وحل المشكلات.
                  </p>
                </div>
              </header>

              <div className="pc-ticket-grid">
                {tickets.map((ticket) => {
                  const priority = ticketPriorityLabels[ticket.priority];
                  const status = ticketStatusLabels[ticket.status];
                  return (
                    <article className="pc-ticket-card" key={ticket.id}>
                      <span className={`pc-ticket-icon ${priority.class}`}>
                        <LifeBuoy size={18} />
                      </span>
                      <div className="pc-ticket-main">
                        <strong>{ticket.subject}</strong>
                        <small>
                          {ticket.id} · {ticket.category} · {ticket.createdAt}
                        </small>
                      </div>
                      <div className="pc-ticket-academy">
                        <strong>{ticket.academyName}</strong>
                        <small>
                          {ticket.requesterName} ({ticket.requesterPhone})
                        </small>
                      </div>
                      <span className={`pc-ticket-status ${status.class}`}>
                        {status.label}
                      </span>
                      <button
                        type="button"
                        className="pc-live-link"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setTicketStatusDraft(ticket.status);
                          setTicketReplyNote(ticket.internalNotes || "");
                        }}
                      >
                        معاينة ومتابعة <ChevronLeft size={14} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* VIEW: SUPPORT & MEMBERS */}
          {!loading && !error && view === "support" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>بحث ودعم مستخدمي الأكاديمية</h2>
                  <p>
                    اختر الأكاديمية لإدارة المستخدمين وإلغاء الجلسات النشطة في
                    حالات الطوارئ.
                  </p>
                </div>
                <span className="pc-live-boundary">
                  <LockKeyhole size={14} /> وصول إداري محدد
                </span>
              </header>

              <div className="pc-live-support-controls">
                <label>
                  <span>الأكاديمية المحددة</span>
                  <select
                    value={selectedTenantId}
                    onChange={(event) => setSelectedTenantId(event.target.value)}
                  >
                    <option value="">اختر أكاديمية</option>
                    {academies.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>ابحث عن اسم أو بريد أو هاتف</span>
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="بحث داخل الأكاديمية المحددة"
                  />
                </label>
              </div>

              {selectedTenant && (
                <div className="pc-live-tenant-summary">
                  <strong>{selectedTenant.name}</strong>
                  <span>
                    {statusLabel[selectedTenant.status] ??
                      selectedTenant.status}{" "}
                    · {selectedTenant.id}
                  </span>
                  <button
                    type="button"
                    className="pc-live-link"
                    onClick={() => requestTenantStatusChange(selectedTenant)}
                    disabled={busyKey === `tenant:${selectedTenant.id}`}
                  >
                    {selectedTenant.status === "PAUSED"
                      ? "إعادة التفعيل"
                      : "إيقاف الأكاديمية"}
                  </button>
                </div>
              )}

              {supportLoading && (
                <div className="pc-live-state">
                  <RefreshCw className="pc-live-spin" size={16} /> جارٍ البحث…
                </div>
              )}
              {supportError && (
                <div className="pc-live-error" role="alert">
                  {supportError}
                </div>
              )}
              {!supportLoading && selectedTenant && (
                <MemberTable
                  rows={members}
                  busyKey={busyKey}
                  onDisable={(member) =>
                    requestMemberStatusChange(member, "REVOKED")
                  }
                  onRestore={(member) =>
                    requestMemberStatusChange(member, "ACTIVE")
                  }
                  onRevoke={requestRevokeSessions}
                />
              )}
              {!supportLoading && !selectedTenant && (
                <p className="pc-live-empty">اختر أكاديمية لعرض مستخدميها.</p>
              )}
            </section>
          )}

          {/* VIEW: AUDIT */}
          {!loading && !error && view === "audit" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>سجل تدقيق وعمليات المنصة</h2>
                  <p>
                    الأحداث والعمليات الإدارية المسجلة لكل أكاديمية لحوكمة
                    النظام.
                  </p>
                </div>
              </header>
              <label className="pc-live-support-controls">
                <span>الأكاديمية المحددة</span>
                <select
                  value={selectedTenantId}
                  onChange={(event) => setSelectedTenantId(event.target.value)}
                >
                  <option value="">اختر أكاديمية</option>
                  {academies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              {supportLoading && (
                <div className="pc-live-state">
                  <RefreshCw className="pc-live-spin" size={16} /> جارٍ تحميل
                  السجل…
                </div>
              )}
              {supportError && (
                <div className="pc-live-error" role="alert">
                  {supportError}
                </div>
              )}
              {!supportLoading && <ActivityTable rows={activity} />}
            </section>
          )}

          {/* VIEW: SYSTEM HEALTH (Dedicated status view instead of header badges) */}
          {!loading && !error && view === "system" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>حالة النظام والبنية التحتية</h2>
                  <p>
                    فحص حالة خوادم الـ API، قاعدة البيانات، خدمات المصادقة،
                    والتخزين السحابي.
                  </p>
                </div>
              </header>
              <div className="pc-system-grid">
                <article className="pc-system-item">
                  <div className="pc-system-head">
                    <span className="pc-system-badge healthy">متصل ونشط</span>
                    <strong>خادم الباك إند (.NET 9 Web API)</strong>
                  </div>
                  <p>العنوان: academy-dashboard.runasp.net</p>
                  <small>زمن الاستجابة: ~85ms · يدعم بروتوكول HTTP/2</small>
                </article>

                <article className="pc-system-item">
                  <div className="pc-system-head">
                    <span className="pc-system-badge healthy">متصل ومحدث</span>
                    <strong>قاعدة البيانات (PostgreSQL / Supabase)</strong>
                  </div>
                  <p>النسخة: PostgreSQL 16 · Cloud Hosted (Frankfurt)</p>
                  <small>حالة الـ Migrations: 18 مخطط مطبق بالكامل</small>
                </article>

                <article className="pc-system-item">
                  <div className="pc-system-head">
                    <span className="pc-system-badge healthy">يعمل بكفاءة</span>
                    <strong>نظام المصادقة والتفويض (JWT & Sessions)</strong>
                  </div>
                  <p>تشفير: HS256 Signing Key · Refresh Token Rotation</p>
                  <small>
                    الجلسات النشطة حاليًا:{" "}
                    {fmtNumber(overview?.activeSessions ?? 0)}
                  </small>
                </article>

                <article className="pc-system-item">
                  <div className="pc-system-head">
                    <span className="pc-system-badge healthy">جاهز</span>
                    <strong>التخزين السحابي للملفات (Supabase Storage)</strong>
                  </div>
                  <p>الوضع: Private Bucket Mode · Signed URLs</p>
                  <small>مخصص لملفات الطلاب والتقارير الأكاديمية</small>
                </article>
              </div>
            </section>
          )}

          {/* VIEW: ROLES */}
          {!loading && !error && view === "roles" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>أدوار المنصة وسياسة الصلاحيات</h2>
                  <p>
                    سياسة الصلاحيات والـ RBAC المفروضة عبر الباك إند من R00 حتى
                    R09.
                  </p>
                </div>
                <span className="pc-live-boundary">
                  <LockKeyhole size={14} /> تعيين R00 مشدد أمنيًا
                </span>
              </header>
              {roles.map((role) => (
                <article className="pc-live-role" key={role.code}>
                  <div>
                    <strong>
                      {role.label} · {role.code}
                    </strong>
                    <span>
                      النطاق: {role.scope} · التعيين: {role.assignmentMode} ·
                      self-assign: {role.canSelfAssign ? "مسموح" : "ممنوع"}
                    </span>
                  </div>
                  <ul>
                    {role.permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>

      {/* Ticket Details & Follow-up Modal */}
      {selectedTicket && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTicket(null);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl">
            <div className="pc-ticket-dialog-head">
              <div>
                <h3>{selectedTicket.subject}</h3>
                <small style={{ color: "#64748b" }}>
                  {selectedTicket.id} · {selectedTicket.academyName}
                </small>
              </div>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setSelectedTicket(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "10px",
                fontSize: "12px",
                lineHeight: "1.7",
              }}
            >
              <p style={{ margin: "0 0 6px" }}>
                <strong>صاحب الطلب: </strong>
                {selectedTicket.requesterName} ({selectedTicket.requesterRole}) -
                هاتف: {selectedTicket.requesterPhone}
              </p>
              <p style={{ margin: "0 0 6px" }}>
                <strong>التصنيف: </strong>
                {selectedTicket.category} · <strong>الأولوية: </strong>
                {ticketPriorityLabels[selectedTicket.priority].label}
              </p>
              <p style={{ margin: "0", color: "#334155" }}>
                <strong>تفاصيل المشكلة: </strong>
                {selectedTicket.description}
              </p>
            </div>

            <form
              onSubmit={handleUpdateTicket}
              style={{ display: "grid", gap: "12px" }}
            >
              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span>تحديث حالة التذكرة</span>
                <select
                  value={ticketStatusDraft}
                  onChange={(e) =>
                    setTicketStatusDraft(
                      e.target.value as SupportTicket["status"]
                    )
                  }
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    font: "inherit",
                    fontSize: "12px",
                  }}
                >
                  <option value="new">تذكرة جديدة</option>
                  <option value="inProgress">قيد المتابعة والحل</option>
                  <option value="waiting">بانتظار رد العميل</option>
                  <option value="resolved">تم الحل وإغلاق التذكرة</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span>ملاحظات المتابعة والرد الداخلي</span>
                <textarea
                  rows={3}
                  value={ticketReplyNote}
                  onChange={(e) => setTicketReplyNote(e.target.value)}
                  placeholder="اكتب ردك وملاحظات المتابعة مع مسؤول الأكاديمية..."
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    font: "inherit",
                    fontSize: "12px",
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => setSelectedTicket(null)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="pc-live-primary"
                  style={{ padding: "8px 16px" }}
                >
                  حفظ التحديث والرد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Reason Confirmation Modal */}
      {reasonModal && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReasonModal(null);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl">
            <div className="pc-ticket-dialog-head">
              <h3>{reasonModal.title}</h3>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setReasonModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "12px",
                lineHeight: "1.7",
              }}
            >
              {reasonModal.description}
            </p>
            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>
                سبب الإجراء (إلزامي للتوثيق في سجل التدقيق)
              </span>
              <input
                autoFocus
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="اكتب سببًا واضحًا (4 أحرف على الأقل)..."
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  font: "inherit",
                  fontSize: "12px",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && reasonValid(reasonInput)) {
                    e.preventDefault();
                    const r = reasonInput;
                    const onConf = reasonModal.onConfirm;
                    setReasonModal(null);
                    setReasonInput("");
                    void onConf(r);
                  }
                }}
              />
            </label>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                className="pc-live-link"
                onClick={() => setReasonModal(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="pc-live-primary"
                style={{
                  padding: "8px 18px",
                  background: reasonModal.isDestructive ? "#dc2626" : undefined,
                  borderColor: reasonModal.isDestructive
                    ? "#dc2626"
                    : undefined,
                }}
                disabled={!reasonValid(reasonInput)}
                onClick={async () => {
                  const r = reasonInput;
                  const onConf = reasonModal.onConfirm;
                  setReasonModal(null);
                  setReasonInput("");
                  await onConf(r);
                }}
              >
                {reasonModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleDashboardShell>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className="pc-live-metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{fmtNumber(value)}</strong>
        <em>{note}</em>
      </div>
    </article>
  );
}

function AcademyTable({
  rows,
  onSupport,
  onStatus,
  busyKey,
}: {
  rows: PlatformAcademy[];
  onSupport: (id: string) => void;
  onStatus: (tenant: PlatformAcademy) => void;
  busyKey: string;
}) {
  return (
    <div className="pc-live-table-wrap">
      <table className="pc-live-table">
        <thead>
          <tr>
            <th>الأكاديمية</th>
            <th>الحالة</th>
            <th>الفروع</th>
            <th>المستخدمون</th>
            <th>الخطة</th>
            <th>إجراء دعم</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <strong>{row.name}</strong>
                <small>
                  {row.owner ?? "لا يوجد مسؤول"} · {row.id}
                </small>
              </th>
              <td>
                <span
                  className={`pc-live-status-tag ${
                    row.status === "PAUSED" ? "paused" : ""
                  }`}
                >
                  {statusLabel[row.status] ?? row.status}
                </span>
              </td>
              <td>{fmtNumber(row.branches)}</td>
              <td>{fmtNumber(row.users)}</td>
              <td>{row.plan}</td>
              <td>
                <div className="pc-live-row-actions">
                  <button type="button" onClick={() => onSupport(row.id)}>
                    دعم
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatus(row)}
                    disabled={busyKey === `tenant:${row.id}`}
                  >
                    {row.status === "PAUSED" ? "تفعيل" : "إيقاف"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="pc-live-empty-cell">
                لا توجد أكاديميات مطابقة للبحث.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MemberTable({
  rows,
  busyKey,
  onDisable,
  onRestore,
  onRevoke,
}: {
  rows: PlatformMember[];
  busyKey: string;
  onDisable: (member: PlatformMember) => void;
  onRestore: (member: PlatformMember) => void;
  onRevoke: (member: PlatformMember) => void;
}) {
  return (
    <div className="pc-live-table-wrap">
      <table className="pc-live-table pc-live-member-table">
        <thead>
          <tr>
            <th>المستخدم</th>
            <th>الدور / العضوية</th>
            <th>آخر دخول</th>
            <th>آخر جلسة / نشطة</th>
            <th>إجراءات أمنية</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => (
            <tr key={member.membershipId}>
              <th scope="row">
                <strong>{member.name ?? "بدون اسم"}</strong>
                <small>
                  {member.maskedEmail ?? "لا يوجد بريد"} · {member.maskedPhone}
                </small>
              </th>
              <td>
                {member.roleCode}
                <small>
                  {member.membershipStatus} · الحساب {member.userStatus}
                </small>
              </td>
              <td>{fmtDate(member.lastLoginAt)}</td>
              <td>
                {fmtDate(member.lastSessionAt)}
                <small>
                  {fmtNumber(member.activeSessions)} جلسة refresh نشطة
                </small>
              </td>
              <td>
                <div className="pc-live-row-actions">
                  {member.membershipStatus === "REVOKED" ? (
                    <button
                      type="button"
                      onClick={() => onRestore(member)}
                      disabled={busyKey === `member:${member.membershipId}`}
                    >
                      إعادة العضوية
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDisable(member)}
                      disabled={
                        busyKey === `member:${member.membershipId}` ||
                        member.roleCode === "R00_PLATFORM_ADMIN"
                      }
                    >
                      <UserRoundX size={14} /> تعطيل
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRevoke(member)}
                    disabled={busyKey === `sessions:${member.userId}`}
                  >
                    <RefreshCw size={13} /> تدوير الجلسات
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="pc-live-empty-cell">
                لا يوجد مستخدمون مطابقون في الأكاديمية المحددة.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTable({ rows }: { rows: PlatformActivity[] }) {
  return (
    <div className="pc-live-activity-list">
      {rows.map((item) => (
        <article key={item.id}>
          <span className="pc-live-activity-icon">
            <Activity size={15} />
          </span>
          <div>
            <strong>{item.action}</strong>
            <small>
              {item.tenantName ?? "الأكاديمية"} · {item.targetType} ·{" "}
              {item.targetId}
              {item.reason ? ` · السبب: ${item.reason}` : ""}
            </small>
            <small>بواسطة {item.actorName ?? "system"}</small>
          </div>
          <time>
            <Clock3 size={13} />
            {fmtDate(item.createdAt)}
          </time>
        </article>
      ))}
      {rows.length === 0 && (
        <p className="pc-live-empty">
          لا توجد أحداث تدقيق مسجلة لهذا الـTenant.
        </p>
      )}
    </div>
  );
}
