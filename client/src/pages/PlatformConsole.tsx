import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./PlatformConsole.css";

type AcademyStatus = "active" | "trial" | "setup" | "paused";
type TicketStatus = "new" | "inProgress" | "waiting" | "resolved";
type ViewKey =
  | "overview"
  | "academies"
  | "subscriptions"
  | "support"
  | "activity";
type Academy = {
  id: string;
  name: string;
  owner: string;
  plan: string;
  branches: number;
  users: number;
  status: AcademyStatus;
  renewal: string;
};
type SupportTicket = {
  id: string;
  title: string;
  academy: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: TicketStatus;
  updated: string;
  summary: string;
};
type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "teal" | "amber" | "blue";
};

const initialAcademies: Academy[] = [
  {
    id: "MD-2401",
    name: "أكاديمية الروّاد",
    owner: "مها صالح",
    plan: "متعددة الفروع · توضيحية",
    branches: 4,
    users: 126,
    status: "active",
    renewal: "15 أكتوبر 2026",
  },
  {
    id: "MD-2402",
    name: "مسار الابتكار",
    owner: "يوسف حسان",
    plan: "نمو · توضيحية",
    branches: 2,
    users: 54,
    status: "active",
    renewal: "02 أكتوبر 2026",
  },
  {
    id: "MD-2403",
    name: "براعم التقنية",
    owner: "ندى فؤاد",
    plan: "تجريبية",
    branches: 1,
    users: 28,
    status: "trial",
    renewal: "تنتهي خلال 5 أيام",
  },
  {
    id: "MD-2404",
    name: "آفاق للعلوم",
    owner: "كريم حسن",
    plan: "نمو · توضيحية",
    branches: 3,
    users: 91,
    status: "setup",
    renewal: "بانتظار استكمال الإعداد",
  },
  {
    id: "MD-2405",
    name: "مختبر المستقبل",
    owner: "سلمى نادر",
    plan: "متعددة الفروع · توضيحية",
    branches: 5,
    users: 143,
    status: "paused",
    renewal: "تحتاج مراجعة",
  },
];

const initialTickets: SupportTicket[] = [
  {
    id: "T-318",
    title: "طلب تعديل حد الفروع",
    academy: "مسار الابتكار",
    category: "اشتراك وخطة",
    priority: "medium",
    status: "new",
    updated: "منذ 18 دقيقة",
    summary:
      "استفسار توضيحي عن إعدادات الخطة وحدود الفروع. لا تحتوي هذه العينة على بيانات طلاب أو أسرار.",
  },
  {
    id: "T-316",
    title: "متابعة تهيئة الحساب",
    academy: "آفاق للعلوم",
    category: "إعداد أكاديمية",
    priority: "high",
    status: "inProgress",
    updated: "منذ ساعة",
    summary:
      "طلب مساعدة متعلق بخطوة التهيئة الأولية للأكاديمية. تفاصيل العرض تجريبية ومحدودة ببيانات الدعم.",
  },
  {
    id: "T-311",
    title: "استفسار عن تجديد الاشتراك",
    academy: "أكاديمية الروّاد",
    category: "اشتراك وخطة",
    priority: "low",
    status: "waiting",
    updated: "أمس",
    summary:
      "سؤال عام عن توقيت التجديد وخيارات الخطة. لا يوجد دفع أو فاتورة فعلية في النموذج.",
  },
];

const initialActivity: ActivityItem[] = [
  {
    id: "A-91",
    title: "طلب خطة بانتظار المراجعة",
    detail: "مسار الابتكار · تحديث توضيحي من مسؤول الأكاديمية",
    time: "منذ 18 دقيقة",
    tone: "blue",
  },
  {
    id: "A-90",
    title: "تم استلام تذكرة دعم جديدة",
    detail: "طلب تعديل حد الفروع · T-318",
    time: "منذ 18 دقيقة",
    tone: "teal",
  },
  {
    id: "A-89",
    title: "حالة إعداد تحتاج متابعة",
    detail: "آفاق للعلوم · خطوة تهيئة غير مكتملة",
    time: "منذ ساعة",
    tone: "amber",
  },
];

const viewDetails: Record<
  ViewKey,
  { title: string; eyebrow: string; description: string }
> = {
  overview: {
    title: "مراقبة الأكاديميات من مكان واحد",
    eyebrow: "إدارة منصة مدى · R00",
    description:
      "تابع حالة الأكاديميات والاشتراكات وطلبات الدعم ضمن نطاق المنصة، من غير الدخول إلى سجلات الأكاديمية التشغيلية.",
  },
  academies: {
    title: "الأكاديميات",
    eyebrow: "سجل المنصة",
    description: "معلومات إدارية تجريبية عن الأكاديميات وحالة التهيئة والخطة.",
  },
  subscriptions: {
    title: "الاشتراكات والخطط",
    eyebrow: "متابعة الاشتراك",
    description:
      "نظرة توضيحية على حالة الخطة والتجديد والاستخدام؛ لا توجد فوترة أو عملية دفع فعلية هنا.",
  },
  support: {
    title: "الدعم والتذاكر",
    eyebrow: "خدمة الأكاديميات",
    description:
      "تابع الطلبات التي أرسلتها الأكاديميات. معلومات التذكرة فقط هي المعروضة في مساحة الدعم.",
  },
  activity: {
    title: "سجل نشاط المنصة",
    eyebrow: "متابعة إدارية",
    description:
      "عرض تجريبي لأحداث المنصة الإدارية؛ الوصول إلى بيانات الأكاديميات الحساسة غير متاح من هذه الشاشة.",
  },
};

const viewNavigation: {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { key: "academies", label: "الأكاديميات", icon: Building2 },
  { key: "subscriptions", label: "الاشتراكات", icon: CreditCard },
  { key: "support", label: "الدعم والتذاكر", icon: LifeBuoy },
  { key: "activity", label: "سجل المنصة", icon: Activity },
];

const academyStatusLabels: Record<AcademyStatus, string> = {
  active: "نشطة",
  trial: "فترة تجريبية",
  setup: "تحتاج استكمالًا",
  paused: "معلّقة للمراجعة",
};
const ticketStatusLabels: Record<TicketStatus, string> = {
  new: "جديدة",
  inProgress: "قيد المتابعة",
  waiting: "بانتظار الأكاديمية",
  resolved: "تم الحل",
};
const ticketPriorityLabels = {
  high: "عالية",
  medium: "متوسطة",
  low: "عادية",
} as const;
const formatNumber = (value: number) =>
  new Intl.NumberFormat("ar-EG").format(value);

function StatusBadge({ status }: { status: AcademyStatus }) {
  return (
    <span className={`pc-status-badge pc-status-${status}`}>
      {academyStatusLabels[status]}
    </span>
  );
}

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`pc-ticket-status pc-ticket-${status}`}>
      {ticketStatusLabels[status]}
    </span>
  );
}

function AcademyTable({
  academies,
  onOpen,
  compact = false,
}: {
  academies: Academy[];
  onOpen: (academy: Academy) => void;
  compact?: boolean;
}) {
  const rows = compact ? academies.slice(0, 4) : academies;
  const tableWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrapper = tableWrapRef.current;
    if (!wrapper) return;

    const alignToAcademyColumn = () => {
      wrapper.scrollLeft = wrapper.scrollWidth;
    };

    alignToAcademyColumn();
    const resizeObserver = new ResizeObserver(alignToAcademyColumn);
    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, [rows.length]);

  if (rows.length === 0) {
    return (
      <div className="pc-empty-state">
        <Building2 size={22} aria-hidden="true" />
        <strong>مافيش أكاديميات مطابقة</strong>
        <span>جرّب تغيير كلمة البحث أو حالة الاشتراك.</span>
      </div>
    );
  }

  return (
    <>
      <p className="pc-table-swipe-hint">
        اسحب الجدول أفقيًا لعرض باقي الأعمدة
      </p>
      <div
        className="pc-table-wrap"
        dir="ltr"
        role="region"
        aria-label="جدول الأكاديميات قابل للتمرير أفقيًا"
        tabIndex={0}
        ref={tableWrapRef}
      >
        <table className="pc-table" dir="rtl">
          <thead>
            <tr>
              <th scope="col">الأكاديمية</th>
              <th scope="col">الخطة</th>
              <th scope="col">الفروع</th>
              <th scope="col">الحسابات</th>
              <th scope="col">الحالة</th>
              <th scope="col">التجديد / المتابعة</th>
              <th scope="col">
                <span className="pc-sr-only">التفاصيل</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(academy => (
              <tr key={academy.id}>
                <td>
                  <div className="pc-academy-cell">
                    <span className="pc-academy-avatar" aria-hidden="true">
                      {academy.name.slice(0, 1)}
                    </span>
                    <span className="pc-academy-copy">
                      <strong>{academy.name}</strong>
                      <small>
                        {academy.id} · مسؤول الأكاديمية: {academy.owner}
                      </small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="pc-plan-label">{academy.plan}</span>
                </td>
                <td>
                  <span className="pc-number-ltr">
                    {formatNumber(academy.branches)}
                  </span>
                </td>
                <td>
                  <span className="pc-number-ltr">
                    {formatNumber(academy.users)}
                  </span>
                </td>
                <td>
                  <StatusBadge status={academy.status} />
                </td>
                <td>
                  <span className="pc-renewal-text">{academy.renewal}</span>
                </td>
                <td>
                  <button
                    className="pc-row-action"
                    type="button"
                    onClick={() => onOpen(academy)}
                  >
                    التفاصيل <ChevronLeft size={14} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TicketList({
  tickets,
  onOpen,
  compact = false,
}: {
  tickets: SupportTicket[];
  onOpen: (ticket: SupportTicket) => void;
  compact?: boolean;
}) {
  const rows = compact ? tickets.slice(0, 3) : tickets;

  if (rows.length === 0) {
    return (
      <div className="pc-empty-state pc-empty-compact">
        <Ticket size={21} aria-hidden="true" />
        <strong>مافيش تذاكر في العينة</strong>
        <span>ستظهر الطلبات هنا عندما ترسلها أكاديمية.</span>
      </div>
    );
  }

  return (
    <div className="pc-ticket-list">
      {rows.map(ticket => (
        <article className="pc-ticket-card" key={ticket.id}>
          <div className="pc-ticket-card-top">
            <span className="pc-ticket-id">{ticket.id}</span>
            <span className={`pc-priority pc-priority-${ticket.priority}`}>
              {ticketPriorityLabels[ticket.priority]}
            </span>
          </div>
          <button
            className="pc-ticket-title"
            type="button"
            onClick={() => onOpen(ticket)}
          >
            {ticket.title}
          </button>
          <div className="pc-ticket-meta">
            <span>
              <Building2 size={13} aria-hidden="true" />
              {ticket.academy}
            </span>
            <span>
              <Clock3 size={13} aria-hidden="true" />
              {ticket.updated}
            </span>
          </div>
          <div className="pc-ticket-card-bottom">
            <span className="pc-ticket-category">{ticket.category}</span>
            <TicketStatusBadge status={ticket.status} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function PlatformConsole() {
  const [, navigate] = useLocation();
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [academies, setAcademies] = useState(initialAcademies);
  const [tickets, setTickets] = useState(initialTickets);
  const [activities, setActivities] = useState(initialActivity);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AcademyStatus>(
    "all"
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(
    null
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketStatusDraft, setTicketStatusDraft] =
    useState<TicketStatus>("new");
  const [academyName, setAcademyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [firstBranchName, setFirstBranchName] = useState("");
  const [planName, setPlanName] = useState("تجريبية · توضيحية");

  const normalizedQuery = query.trim().toLocaleLowerCase("ar-EG");
  const filteredAcademies = useMemo(
    () =>
      academies.filter(academy => {
        const matchesQuery =
          !normalizedQuery ||
          `${academy.name} ${academy.owner} ${academy.id} ${academy.plan}`
            .toLocaleLowerCase("ar-EG")
            .includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "all" || academy.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [academies, normalizedQuery, statusFilter]
  );

  const activeCount = academies.filter(
    academy => academy.status === "active"
  ).length;
  const trialCount = academies.filter(
    academy => academy.status === "trial"
  ).length;
  const attentionCount = academies.filter(
    academy => academy.status === "setup" || academy.status === "paused"
  ).length;
  const openTicketCount = tickets.filter(
    ticket => ticket.status !== "resolved"
  ).length;
  const selectedAcademy =
    academies.find(academy => academy.id === selectedAcademyId) ?? null;
  const selectedTicket =
    tickets.find(ticket => ticket.id === selectedTicketId) ?? null;
  const currentView = viewDetails[activeView];

  const openTicket = (ticket: SupportTicket) => {
    setTicketStatusDraft(ticket.status);
    setSelectedTicketId(ticket.id);
  };

  const handleCreateAcademy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = academyName.trim();
    const cleanOwner = ownerName.trim();
    const cleanBranch = firstBranchName.trim();
    if (!cleanName || !cleanOwner || !cleanBranch) return;

    const academy: Academy = {
      id: `DEMO-${Date.now().toString().slice(-4)}`,
      name: cleanName,
      owner: cleanOwner,
      plan: planName,
      branches: 1,
      users: 0,
      status: "setup",
      renewal: "دعوة/تهيئة تجريبية",
    };
    setAcademies(current => [academy, ...current]);
    setActivities(current => [
      {
        id: `EV-${Date.now()}`,
        title: "إضافة أكاديمية للمعاينة",
        detail: `${cleanName} · ${cleanBranch} · لم يتم إنشاء حساب أو إرسال دعوة`,
        time: "الآن",
        tone: "teal",
      },
      ...current,
    ]);
    setAcademyName("");
    setOwnerName("");
    setFirstBranchName("");
    setPlanName("تجريبية · توضيحية");
    setCreateOpen(false);
    setActiveView("academies");
    toast.success("أُضيفت الأكاديمية إلى المعاينة فقط", {
      description: "لم يتم حفظها على خادم أو إنشاء حساب أو إرسال دعوة.",
    });
  };

  const handleSaveTicketStatus = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicket) return;
    setTickets(current =>
      current.map(ticket =>
        ticket.id === selectedTicket.id
          ? { ...ticket, status: ticketStatusDraft, updated: "الآن" }
          : ticket
      )
    );
    setActivities(current => [
      {
        id: `EV-${Date.now()}`,
        title: "تحديث حالة تذكرة في المعاينة",
        detail: `${selectedTicket.id} · ${selectedTicket.academy} · ${ticketStatusLabels[ticketStatusDraft]}`,
        time: "الآن",
        tone: "blue",
      },
      ...current,
    ]);
    setSelectedTicketId(null);
    toast.success("تم تحديث الحالة في المعاينة فقط", {
      description: "هذا التغيير محلي ولا يُرسل إلى فريق دعم أو قاعدة بيانات.",
    });
  };

  const pageAction =
    activeView === "support" ? (
      <span className="pc-header-note">
        <ShieldCheck size={15} aria-hidden="true" /> وصول محدود لمعلومات التذكرة
      </span>
    ) : (
      <button
        className="pc-primary-button"
        type="button"
        onClick={() => setCreateOpen(true)}
      >
        <Plus size={17} aria-hidden="true" /> إضافة أكاديمية
      </button>
    );

  return (
    <RoleDashboardShell
      className="app-shell platform-console"
      roleCode="R00"
      roleLabel="أدمن منصة مدى"
      scopeLevel="platform"
      scopeLabel="نطاق المنصة"
      tenantName="منصة مدى"
    >
      {mobileNavOpen && (
        <button
          className="mobile-scrim pc-sidebar-scrim"
          type="button"
          aria-label="إغلاق قائمة المنصة"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        className={`sidebar pc-sidebar ${mobileNavOpen ? "sidebar-open pc-sidebar-open" : ""}`}
        aria-label="تنقل المنصة"
      >
        <div className="sidebar-top pc-brand-row">
          <span className="pc-brand-symbol" aria-hidden="true">
            <Building2 size={21} />
          </span>
          <span className="pc-brand-copy">
            <strong>مدى</strong>
            <small>منصة الأكاديميات</small>
          </span>
          <button
            className="sidebar-close pc-mobile-close"
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="academy-switcher pc-platform-card">
          <span className="pc-platform-avatar">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <span>
            <strong>مساحة المنصة</strong>
            <small>الدور R00 · معاينة</small>
          </span>
          <ChevronDown size={14} aria-hidden="true" />
        </div>

        <div className="nav-caption pc-nav-caption">إدارة المنصة</div>
        <nav
          className="primary-nav pc-nav-list"
          aria-label="أقسام إدارة المنصة"
        >
          {viewNavigation.map(item => {
            const Icon = item.icon;
            return (
              <button
                className={`nav-link pc-nav-item ${activeView === item.key ? "active pc-nav-active" : ""}`}
                type="button"
                key={item.key}
                aria-current={activeView === item.key ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
                onClick={() => {
                  setActiveView(item.key);
                  setMobileNavOpen(false);
                }}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
                {item.key === "support" && openTicketCount > 0 && (
                  <span className="pc-nav-count">
                    {formatNumber(openTicketCount)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer pc-sidebar-spacer" />
        <div className="pc-privacy-card">
          <span className="pc-privacy-icon">
            <ShieldCheck size={16} aria-hidden="true" />
          </span>
          <div>
            <strong>خصوصية الأكاديميات</strong>
            <small>المعروض هنا بيانات إدارية تجريبية فقط.</small>
          </div>
        </div>
        <div className="pc-role-preview">
          <div className="pc-nav-caption">معاينة أدوار أخرى</div>
          <button type="button" onClick={() => navigate("/academy-owner")}>
            R01 · صاحب الأكاديمية <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => navigate("/")}>
            R02 · مدير الفرع <ChevronLeft size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="sidebar-version pc-sidebar-foot">
          <span className="pc-demo-dot" /> نموذج واجهات · لا يوجد دخول فعلي
        </div>
      </aside>

      <main className="main-panel pc-main">
        <header className="topbar pc-topbar">
          <div className="pc-topbar-start">
            <button
              className="mobile-menu-button pc-menu-button"
              type="button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="pc-breadcrumb">
              مدى <ChevronLeft size={13} aria-hidden="true" />{" "}
              <strong>إدارة المنصة</strong>
            </span>
          </div>
          <div className="pc-topbar-end">
            <span className="pc-topbar-scope">
              <Building2 size={14} aria-hidden="true" /> نطاق المنصة
            </span>
            <button
              className="pc-icon-button"
              type="button"
              aria-label="الإشعارات التجريبية"
              onClick={() => toast("لا توجد إشعارات منصة جديدة في هذه العينة")}
            >
              <Bell size={18} />
              <span className="pc-notification-dot" />
            </button>
            <span className="pc-topbar-divider" />
            <span className="pc-admin-profile">
              <span className="pc-profile-avatar">م</span>
              <span>
                <strong>مسؤول المنصة</strong>
                <small>R00 · معاينة فقط</small>
              </span>
            </span>
          </div>
        </header>

        <div className="pc-content">
          <section className="pc-page-heading">
            <div>
              <span className="pc-eyebrow">
                <span className="pc-eyebrow-dot" />
                {currentView.eyebrow}
              </span>
              <h1>{currentView.title}</h1>
              <p>{currentView.description}</p>
            </div>
            <div className="pc-heading-actions">{pageAction}</div>
          </section>

          <div className="pc-demo-banner" role="note">
            <span className="pc-demo-mark">DEMO</span>
            <span>
              <strong>معاينة واجهة فقط.</strong> كل الأسماء والأرقام محلية
              وتوضيحية؛ لا يتم إنشاء حسابات أو إرسال دعوات أو تنفيذ اشتراكات
              فعلية.
            </span>
          </div>
          <div className="pc-security-banner" role="note">
            <ShieldCheck size={17} aria-hidden="true" />
            <p>
              <strong>حدود الاطلاع:</strong> نتابع بيانات الأكاديمية الإدارية
              وحالة الاشتراك والتذكرة فقط. لا تعرض هذه الشاشة سجلات الطلاب أو
              أولياء الأمور أو كلمات المرور أو مفاتيح الوصول.
            </p>
          </div>

          {activeView === "overview" && (
            <>
              <section
                className="pc-metric-grid"
                aria-label="مؤشرات المنصة التوضيحية"
              >
                <MetricCard
                  label="الأكاديميات"
                  value={formatNumber(academies.length)}
                  note="سجلات توضيحية في العينة"
                  icon={Building2}
                  tone="teal"
                />
                <MetricCard
                  label="اشتراكات نشطة"
                  value={formatNumber(activeCount)}
                  note="حالة عرض وليست حالة فوترة"
                  icon={CheckCircle2}
                  tone="blue"
                />
                <MetricCard
                  label="فترات تجريبية"
                  value={formatNumber(trialCount)}
                  note="باقات وحدود توضيحية"
                  icon={CalendarDays}
                  tone="amber"
                />
                <MetricCard
                  label="تذاكر مفتوحة"
                  value={formatNumber(openTicketCount)}
                  note="تذاكر دعم تجريبية"
                  icon={Ticket}
                  tone="violet"
                />
              </section>
              <div className="pc-overview-grid">
                <section
                  className="pc-panel pc-academies-panel"
                  aria-label="الأكاديميات"
                >
                  <PanelHeading
                    title="الأكاديميات"
                    eyebrow="ملخص الحسابات"
                    action={
                      <button
                        className="pc-text-button"
                        type="button"
                        onClick={() => setActiveView("academies")}
                      >
                        عرض السجل <ChevronLeft size={14} />
                      </button>
                    }
                  />
                  <AcademyTable
                    academies={filteredAcademies}
                    onOpen={academy => setSelectedAcademyId(academy.id)}
                    compact
                  />
                </section>
                <section
                  className="pc-panel pc-support-panel"
                  aria-label="الدعم والتذاكر"
                >
                  <PanelHeading
                    title="تحتاج متابعة"
                    eyebrow="الدعم والتذاكر"
                    action={
                      <button
                        className="pc-text-button"
                        type="button"
                        onClick={() => setActiveView("support")}
                      >
                        كل التذاكر <ChevronLeft size={14} />
                      </button>
                    }
                  />
                  <TicketList
                    tickets={tickets.filter(
                      ticket => ticket.status !== "resolved"
                    )}
                    onOpen={openTicket}
                    compact
                  />
                </section>
              </div>
              <section className="pc-privacy-strip">
                <span className="pc-privacy-strip-icon">
                  <ShieldCheck size={17} aria-hidden="true" />
                </span>
                <div>
                  <strong>إدارة المنصة ≠ الاطلاع على محتوى العملاء</strong>
                  <p>
                    التصميم يفصل متابعة الخطة والتذاكر عن سجلات الطلاب والماليات
                    التشغيلية. صلاحيات العرض هنا توضيحية ولا تمثل حماية فعلية
                    قبل تنفيذ الخادم وقاعدة البيانات.
                  </p>
                </div>
                <button type="button" onClick={() => setActiveView("activity")}>
                  سجل الإجراءات <ChevronLeft size={14} />
                </button>
              </section>
            </>
          )}

          {activeView === "academies" && (
            <section
              className="pc-panel pc-full-panel"
              aria-label="قائمة الأكاديميات"
            >
              <PanelHeading
                title="سجل الأكاديميات"
                eyebrow={`${formatNumber(filteredAcademies.length)} نتيجة في بيانات العرض`}
                action={
                  <button
                    className="pc-primary-button pc-primary-compact"
                    type="button"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus size={16} /> إضافة أكاديمية
                  </button>
                }
              />
              <AcademyFilters
                query={query}
                setQuery={setQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
              <AcademyTable
                academies={filteredAcademies}
                onOpen={academy => setSelectedAcademyId(academy.id)}
              />
            </section>
          )}

          {activeView === "subscriptions" && (
            <>
              <section
                className="pc-metric-grid pc-subscription-metrics"
                aria-label="ملخص الاشتراكات التوضيحي"
              >
                <MetricCard
                  label="نشطة"
                  value={formatNumber(activeCount)}
                  note="حالة اشتراك تجريبية"
                  icon={CheckCircle2}
                  tone="teal"
                />
                <MetricCard
                  label="تجريبية"
                  value={formatNumber(trialCount)}
                  note="لا توجد عملية تحويل آلية"
                  icon={CalendarDays}
                  tone="amber"
                />
                <MetricCard
                  label="تحتاج متابعة"
                  value={formatNumber(attentionCount)}
                  note="تحتاج مراجعة من مسؤول المنصة"
                  icon={Clock3}
                  tone="violet"
                />
                <MetricCard
                  label="باقات معرفة"
                  value="٣"
                  note="أسماء الخطة للتصميم فقط"
                  icon={CreditCard}
                  tone="blue"
                />
              </section>
              <section
                className="pc-panel pc-full-panel"
                aria-label="قائمة الاشتراكات"
              >
                <PanelHeading
                  title="حالة الاشتراكات"
                  eyebrow="متابعة الخطة والتجديد"
                  action={
                    <span className="pc-demo-caption">
                      <ShieldCheck size={14} /> لا توجد فواتير أو مدفوعات فعلية
                    </span>
                  }
                />
                <AcademyFilters
                  query={query}
                  setQuery={setQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
                <div className="pc-subscription-list">
                  {filteredAcademies.map(academy => (
                    <article className="pc-subscription-row" key={academy.id}>
                      <span className="pc-subscription-icon">
                        <CreditCard size={18} aria-hidden="true" />
                      </span>
                      <span className="pc-subscription-academy">
                        <strong>{academy.name}</strong>
                        <small>
                          {academy.id} · {academy.plan}
                        </small>
                      </span>
                      <span className="pc-subscription-usage">
                        <small>الفروع المسجلة</small>
                        <strong>
                          {formatNumber(academy.branches)} <span>فرع</span>
                        </strong>
                      </span>
                      <span className="pc-subscription-renewal">
                        <small>التجديد / الحالة</small>
                        <strong>{academy.renewal}</strong>
                      </span>
                      <StatusBadge status={academy.status} />
                      <button
                        className="pc-row-action"
                        type="button"
                        onClick={() => setSelectedAcademyId(academy.id)}
                      >
                        التفاصيل <ChevronLeft size={14} />
                      </button>
                    </article>
                  ))}
                  {filteredAcademies.length === 0 && (
                    <div className="pc-empty-state">
                      <CreditCard size={22} />
                      <strong>مافيش اشتراكات مطابقة</strong>
                      <span>غيّر عوامل البحث أو الفلترة.</span>
                    </div>
                  )}
                </div>
                <p className="pc-panel-footnote">
                  الباقات والأسعار والحدود النهائية لم تُعتمد بعد؛ هذه البيانات
                  لتجربة تدفق الواجهة فقط.
                </p>
              </section>
            </>
          )}

          {activeView === "support" && (
            <section
              className="pc-panel pc-full-panel"
              aria-label="صندوق التذاكر"
            >
              <PanelHeading
                title="صندوق التذاكر"
                eyebrow={`${formatNumber(openTicketCount)} تذكرة غير محلولة في العينة`}
                action={
                  <span className="pc-demo-caption">
                    <ShieldCheck size={14} /> تفاصيل التذكرة فقط
                  </span>
                }
              />
              <div className="pc-ticket-permission-note">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>
                  <strong>نطاق محدود:</strong> التذكرة لا تمنح صلاحية لفتح
                  بيانات طلاب الأكاديمية أو سجلاتها المالية.
                </span>
              </div>
              <TicketList tickets={tickets} onOpen={openTicket} />
            </section>
          )}

          {activeView === "activity" && (
            <section
              className="pc-panel pc-full-panel"
              aria-label="سجل نشاطات المنصة"
            >
              <PanelHeading
                title="آخر نشاطات المنصة"
                eyebrow="سجل عرض توضيحي"
                action={
                  <span className="pc-demo-caption">
                    <Activity size={14} /> غير محفوظ
                  </span>
                }
              />
              <div className="pc-activity-list">
                {activities.map(item => (
                  <article className="pc-activity-row" key={item.id}>
                    <span
                      className={`pc-activity-icon pc-activity-${item.tone}`}
                    >
                      <Activity size={16} aria-hidden="true" />
                    </span>
                    <span className="pc-activity-copy">
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <time>{item.time}</time>
                  </article>
                ))}
              </div>
              <p className="pc-panel-footnote">
                في النظام الفعلي يجب أن يسجل Audit Log الفاعل والنطاق والتوقيت
                والتغيير؛ سجل المعاينة لا يحفظ أي حدث.
              </p>
            </section>
          )}

          <footer className="pc-page-footer">
            <CircleHelp size={15} aria-hidden="true" /> معاينة R00 للمنصة فقط ·
            لا تمثل تسجيل دخول أو إنفاذًا للصلاحيات · البيانات محلية وغير
            محفوظة.
          </footer>
        </div>
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir="rtl" className="pc-dialog">
          <DialogHeader className="pc-dialog-header">
            <span className="pc-dialog-kicker">
              <Building2 size={15} /> إعداد Tenant جديد · R00
            </span>
            <DialogTitle className="pc-dialog-title">
              إضافة أكاديمية للمعاينة
            </DialogTitle>
            <DialogDescription className="pc-dialog-description">
              محاكاة خطوات إعداد الأكاديمية وتعيين مسؤولها الأول. لن يتم إنشاء
              حساب أو إرسال دعوة أو حفظ البيانات.
            </DialogDescription>
          </DialogHeader>
          <form
            id="platform-academy-create"
            className="pc-create-form"
            onSubmit={handleCreateAcademy}
          >
            <label className="pc-form-field" htmlFor="pc-academy-name">
              <span>
                اسم الأكاديمية <b>*</b>
              </span>
              <input
                id="pc-academy-name"
                autoFocus
                required
                value={academyName}
                onChange={event => setAcademyName(event.target.value)}
                placeholder="مثال: أكاديمية العلوم الحديثة"
              />
            </label>
            <label className="pc-form-field" htmlFor="pc-owner-name">
              <span>
                مسؤول الأكاديمية الأول (R01) <b>*</b>
              </span>
              <input
                id="pc-owner-name"
                required
                value={ownerName}
                onChange={event => setOwnerName(event.target.value)}
                placeholder="اسم توضيحي لمسؤول الأكاديمية"
              />
            </label>
            <div className="pc-form-grid">
              <label className="pc-form-field" htmlFor="pc-first-branch">
                <span>
                  اسم الفرع الأول <b>*</b>
                </span>
                <input
                  id="pc-first-branch"
                  required
                  value={firstBranchName}
                  onChange={event => setFirstBranchName(event.target.value)}
                  placeholder="مثال: فرع مدينة نصر"
                />
              </label>
              <label className="pc-form-field" htmlFor="pc-plan-name">
                <span>الخطة (توضيحية)</span>
                <select
                  id="pc-plan-name"
                  value={planName}
                  onChange={event => setPlanName(event.target.value)}
                >
                  <option>تجريبية · توضيحية</option>
                  <option>أساسية · توضيحية</option>
                  <option>متعددة الفروع · توضيحية</option>
                </select>
              </label>
            </div>
            <div className="pc-invite-note">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                <strong>خطوة الدعوة غير متصلة.</strong> عند بناء النظام ستُرسل
                دعوة آمنة للمسؤول؛ النموذج الحالي يضيف صفًا تجريبيًا لهذه الصفحة
                فقط.
              </span>
            </div>
          </form>
          <DialogFooter className="pc-dialog-footer">
            <button
              className="pc-primary-button"
              type="submit"
              form="platform-academy-create"
              disabled={
                !academyName.trim() ||
                !ownerName.trim() ||
                !firstBranchName.trim()
              }
            >
              <Plus size={16} /> إضافة للمعاينة
            </button>
            <DialogClose asChild>
              <button className="pc-secondary-button" type="button">
                إلغاء
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedAcademy)}
        onOpenChange={open => {
          if (!open) setSelectedAcademyId(null);
        }}
      >
        <DialogContent dir="rtl" className="pc-dialog pc-details-dialog">
          {selectedAcademy && (
            <>
              <DialogHeader className="pc-dialog-header">
                <span className="pc-dialog-kicker">
                  <Building2 size={15} /> سجل منصة · {selectedAcademy.id}
                </span>
                <DialogTitle className="pc-dialog-title">
                  {selectedAcademy.name}
                </DialogTitle>
                <DialogDescription className="pc-dialog-description">
                  ملخص إداري توضيحي. لا يعرض بيانات الطلاب أو تفاصيل الحسابات.
                </DialogDescription>
              </DialogHeader>
              <div className="pc-detail-grid">
                <DetailItem
                  label="مسؤول الأكاديمية"
                  value={selectedAcademy.owner}
                />
                <DetailItem label="الخطة" value={selectedAcademy.plan} />
                <DetailItem
                  label="الفروع"
                  value={formatNumber(selectedAcademy.branches)}
                />
                <DetailItem
                  label="الحسابات"
                  value={formatNumber(selectedAcademy.users)}
                />
                <DetailItem
                  label="حالة الاشتراك"
                  value={academyStatusLabels[selectedAcademy.status]}
                />
                <DetailItem
                  label="التجديد / المتابعة"
                  value={selectedAcademy.renewal}
                />
              </div>
              <div className="pc-detail-scope-note">
                <ShieldCheck size={16} />
                <span>
                  نطاق R00 في هذا النموذج محدود ببيانات الأكاديمية الإدارية.
                  بيانات الأسرة والطلاب غير متاحة.
                </span>
              </div>
              <DialogFooter className="pc-dialog-footer">
                <DialogClose asChild>
                  <button className="pc-primary-button" type="button">
                    إغلاق
                  </button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedTicket)}
        onOpenChange={open => {
          if (!open) setSelectedTicketId(null);
        }}
      >
        <DialogContent dir="rtl" className="pc-dialog pc-details-dialog">
          {selectedTicket && (
            <>
              <DialogHeader className="pc-dialog-header">
                <span className="pc-dialog-kicker">
                  <Ticket size={15} /> تذكرة دعم · {selectedTicket.id}
                </span>
                <DialogTitle className="pc-dialog-title">
                  {selectedTicket.title}
                </DialogTitle>
                <DialogDescription className="pc-dialog-description">
                  {selectedTicket.academy} · {selectedTicket.category} · أولوية{" "}
                  {ticketPriorityLabels[selectedTicket.priority]}
                </DialogDescription>
              </DialogHeader>
              <div className="pc-ticket-summary">
                <span>ملخص الطلب</span>
                <p>{selectedTicket.summary}</p>
              </div>
              <form
                id="platform-ticket-update"
                onSubmit={handleSaveTicketStatus}
                className="pc-create-form"
              >
                <label className="pc-form-field" htmlFor="pc-ticket-status">
                  <span>حالة التذكرة في المعاينة</span>
                  <select
                    id="pc-ticket-status"
                    value={ticketStatusDraft}
                    onChange={event =>
                      setTicketStatusDraft(event.target.value as TicketStatus)
                    }
                  >
                    {Object.entries(ticketStatusLabels).map(
                      ([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <div className="pc-invite-note">
                  <ShieldCheck size={16} />
                  <span>
                    التغيير محلي فقط. الملاحظات الداخلية وردود الأكاديمية تحتاج
                    تدفقًا منفصلًا في النسخة الفعلية.
                  </span>
                </div>
              </form>
              <DialogFooter className="pc-dialog-footer">
                <button
                  className="pc-primary-button"
                  type="submit"
                  form="platform-ticket-update"
                >
                  حفظ الحالة في المعاينة
                </button>
                <DialogClose asChild>
                  <button className="pc-secondary-button" type="button">
                    إغلاق
                  </button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </RoleDashboardShell>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Building2;
  tone: "teal" | "blue" | "amber" | "violet";
}) {
  return (
    <article className="pc-metric-card">
      <div className={`pc-metric-icon pc-metric-${tone}`}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <span className="pc-metric-label">{label}</span>
      <strong className="pc-metric-value">{value}</strong>
      <small className="pc-metric-note">{note}</small>
    </article>
  );
}

function PanelHeading({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow: string;
  action?: ReactNode;
}) {
  return (
    <div className="pc-panel-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function AcademyFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: "all" | AcademyStatus;
  setStatusFilter: (value: "all" | AcademyStatus) => void;
}) {
  const filters: { value: "all" | AcademyStatus; label: string }[] = [
    { value: "all", label: "الكل" },
    { value: "active", label: "نشطة" },
    { value: "trial", label: "تجريبية" },
    { value: "setup", label: "تحتاج استكمالًا" },
    { value: "paused", label: "معلّقة" },
  ];
  return (
    <div className="pc-filter-row">
      <label className="pc-search-field">
        <Search size={17} aria-hidden="true" />
        <input
          aria-label="ابحث عن أكاديمية أو مسؤولها"
          placeholder="ابحث عن أكاديمية أو مسؤولها..."
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div
        className="pc-filter-chips"
        role="group"
        aria-label="تصفية الأكاديميات حسب الحالة"
      >
        {filters.map(filter => (
          <button
            type="button"
            key={filter.value}
            className={statusFilter === filter.value ? "pc-filter-active" : ""}
            aria-pressed={statusFilter === filter.value}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="pc-detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
