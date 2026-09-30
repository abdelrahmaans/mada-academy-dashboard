import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileBarChart,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import StatusBadge from "@/components/StatusBadge";
import InstructorPerformanceComparison from "@/components/InstructorPerformanceComparison";
import {
  ACADEMY_BRANCHES,
  INSTRUCTOR_MONTHLY_PERFORMANCE,
  PERFORMANCE_MONTHS,
} from "@/lib/instructorPerformance";

type OwnerView = "overview" | "branches" | "tickets" | "reports";
type TicketStatus = "open" | "in_progress" | "waiting" | "resolved";
type TicketPriority = "urgent" | "high" | "normal";

type BranchRecord = {
  name: (typeof ACADEMY_BRANCHES)[number];
  manager: string;
  managerStatus: "active" | "needs_attention";
  students: number;
  instructors: number;
  attendance: number;
  sessions: number;
  capacity: number;
  leads: number;
  openTickets: number;
  collected: number;
  trend: number;
};

type AcademyTicket = {
  id: string;
  title: string;
  branch: (typeof ACADEMY_BRANCHES)[number];
  category: "تشغيل" | "حسابات" | "أكاديمي";
  priority: TicketPriority;
  status: TicketStatus;
  updated: string;
  requester: string;
  description: string;
};

const BRANCH_ROLLUP: BranchRecord[] = [
  {
    name: "مدينة نصر",
    manager: "أحمد محمود",
    managerStatus: "active",
    students: 248,
    instructors: 9,
    attendance: 86,
    sessions: 51,
    capacity: 78,
    leads: 12,
    openTickets: 2,
    collected: 128500,
    trend: 5.6,
  },
  {
    name: "المعادي",
    manager: "سارة كمال",
    managerStatus: "active",
    students: 186,
    instructors: 7,
    attendance: 91,
    sessions: 44,
    capacity: 69,
    leads: 8,
    openTickets: 1,
    collected: 101200,
    trend: 3.1,
  },
  {
    name: "الشيخ زايد",
    manager: "يوسف عماد",
    managerStatus: "needs_attention",
    students: 121,
    instructors: 5,
    attendance: 81,
    sessions: 32,
    capacity: 57,
    leads: 5,
    openTickets: 3,
    collected: 72400,
    trend: -2.4,
  },
];

const INITIAL_TICKETS: AcademyTicket[] = [
  {
    id: "TKT-1048",
    title: "تعارض في جدول معمل الروبوتات",
    branch: "مدينة نصر",
    category: "تشغيل",
    priority: "high",
    status: "in_progress",
    updated: "منذ 28 دقيقة",
    requester: "أحمد محمود · مدير الفرع",
    description: "يوجد تعارض بين مجموعة روبوتكس 2 وحصة خاصة في معمل 1 يوم الثلاثاء.",
  },
  {
    id: "TKT-1042",
    title: "طلب مراجعة صلاحية مدير الفرع",
    branch: "الشيخ زايد",
    category: "حسابات",
    priority: "urgent",
    status: "open",
    updated: "منذ ساعتين",
    requester: "يوسف عماد · مدير الفرع",
    description: "حساب مدير الفرع يحتاج مراجعة قبل إضافة عضو جديد إلى الفريق.",
  },
  {
    id: "TKT-1037",
    title: "انخفاض الحضور في مجموعة البرمجة",
    branch: "الشيخ زايد",
    category: "أكاديمي",
    priority: "normal",
    status: "waiting",
    updated: "أمس",
    requester: "مريم حسن · رئيس المدربين",
    description: "تم رفع توصية دعم للمجموعة وننتظر رد مدير الفرع على خطة المتابعة.",
  },
  {
    id: "TKT-1029",
    title: "تحديث بيانات مدير الفرع",
    branch: "المعادي",
    category: "حسابات",
    priority: "normal",
    status: "resolved",
    updated: "منذ 3 أيام",
    requester: "سارة كمال · مدير الفرع",
    description: "تم تحديث رقم التواصل وتسجيل الأثر في سجل الأكاديمية.",
  },
];

const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "مفتوحة",
  in_progress: "قيد المتابعة",
  waiting: "بانتظار رد",
  resolved: "مغلقة",
};
const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "عاجلة",
  high: "عالية",
  normal: "عادية",
};

export default function AcademyOwner() {
  const [, navigate] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [view, setView] = useState<OwnerView>("overview");
  const [month, setMonth] = useState<string>(PERFORMANCE_MONTHS[0].value);
  const [branch, setBranch] = useState("all");
  const [instructorId, setInstructorId] = useState("all");
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [ticketFilter, setTicketFilter] = useState<TicketStatus | "all">("all");
  const [ticketQuery, setTicketQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(INITIAL_TICKETS[0].id);

  const branchLabel = branch === "all" ? "كل الفروع" : `فرع ${branch}`;
  const monthLabel = PERFORMANCE_MONTHS.find(item => item.value === month)?.label ?? "";
  const selectedTicket = tickets.find(ticket => ticket.id === selectedTicketId) ?? tickets[0];
  const summary = useMemo(() => {
    const records = INSTRUCTOR_MONTHLY_PERFORMANCE.filter(
      record =>
        record.month === month &&
        (branch === "all" || record.branch === branch) &&
        (instructorId === "all" || record.instructorId === instructorId)
    );
    return {
      instructors: new Set(records.map(record => record.instructorId)).size,
      branches: new Set(records.map(record => record.branch)).size,
      sessions: records.reduce((sum, record) => sum + record.sessions, 0),
      attendance: records.length
        ? Math.round(
            records.reduce((sum, record) => sum + record.attendanceRate * record.sessions, 0) /
              records.reduce((sum, record) => sum + record.sessions, 0)
          )
        : 0,
    };
  }, [branch, instructorId, month]);
  const visibleTickets = useMemo(() => {
    const query = ticketQuery.trim().toLocaleLowerCase("ar");
    return tickets.filter(ticket => {
      const matchesText = [ticket.id, ticket.title, ticket.branch, ticket.category]
        .some(value => value.toLocaleLowerCase("ar").includes(query));
      return matchesText && (ticketFilter === "all" || ticket.status === ticketFilter);
    });
  }, [ticketFilter, ticketQuery, tickets]);
  const rollup = useMemo(
    () => BRANCH_ROLLUP.filter(item => branch === "all" || item.name === branch),
    [branch]
  );
  const academyTotals = useMemo(
    () =>
      rollup.reduce(
        (total, item) => ({
          students: total.students + item.students,
          sessions: total.sessions + item.sessions,
          collected: total.collected + item.collected,
          tickets: total.tickets + item.openTickets,
          leads: total.leads + item.leads,
        }),
        { students: 0, sessions: 0, collected: 0, tickets: 0, leads: 0 }
      ),
    [rollup]
  );

  const goToView = (next: OwnerView) => {
    setView(next);
    setMobileNavOpen(false);
  };
  const updateTicketStatus = (status: TicketStatus) => {
    if (!selectedTicket) return;
    setTickets(current => current.map(ticket => ticket.id === selectedTicket.id ? { ...ticket, status, updated: "الآن" } : ticket));
  };
  const downloadReport = () => {
    const rows = [
      ["تقرير الأكاديمية المجمع", monthLabel],
      ["الفرع", "الطلاب", "الحصص", "الحضور", "المقاعد المشغولة", "التذاكر المفتوحة"],
      ...rollup.map(item => [item.name, item.students, item.sessions, `${item.attendance}%`, `${item.capacity}%`, item.openTickets]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = `mada-academy-rollup-${month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <RoleDashboardShell
      className="academy-owner-shell"
      roleCode="R01"
      roleLabel="مسؤول الأكاديمية"
      scopeLevel="tenant"
      scopeLabel={branchLabel}
      tenantName="أكاديمية مدى"
      branchName={branchLabel}
    >
      {mobileNavOpen && <button className="academy-owner-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`academy-owner-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="academy-owner-brand"><span className="academy-owner-mark">مدى</span><div><strong>مدى</strong><small>نظرة الأكاديمية</small></div><button className="academy-owner-close" aria-label="إغلاق القائمة" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div>
        <div className="academy-owner-user"><span className="academy-owner-user-avatar">أم</span><span><strong>أحمد محمود</strong><small>رئيس الأكاديمية · معاينة</small></span></div>
        <span className="academy-owner-nav-caption">نطاق الأكاديمية</span>
        <nav className="academy-owner-nav" aria-label="تنقل رئيس الأكاديمية">
          <OwnerNavButton active={view === "overview"} icon={<LayoutDashboard size={17} />} label="نظرة عامة" onClick={() => goToView("overview")} />
          <OwnerNavButton active={view === "branches"} icon={<Building2 size={17} />} label="الفروع والأداء" count={BRANCH_ROLLUP.length} onClick={() => goToView("branches")} />
          <OwnerNavButton active={view === "tickets"} icon={<Headphones size={17} />} label="مركز التذاكر" count={tickets.filter(ticket => ticket.status !== "resolved").length} onClick={() => goToView("tickets")} />
          <OwnerNavButton active={view === "reports"} icon={<FileBarChart size={17} />} label="التقارير المجمعة" onClick={() => goToView("reports")} />
          <button className="academy-owner-nav-button" onClick={() => navigate("/academy/branches")}><Building2 size={17} /><span>إدارة الفروع</span></button>
          <button className="academy-owner-nav-button" onClick={() => navigate("/academy/classrooms")}><Settings2 size={17} /><span>القاعات الدراسية</span></button>
          <button className="academy-owner-nav-button" onClick={() => navigate("/academy/roles")}><ShieldCheck size={17} /><span>المستخدمون والصلاحيات</span></button>
          <button className="academy-owner-nav-button" onClick={() => navigate("/executive-dashboard")}><TrendingUp size={17} /><span>لوحة الإدارة التنفيذية</span></button>
        </nav>
        <div className="academy-owner-sidebar-spacer" />
        <div className="academy-owner-scope-card"><MapPin size={15} /><span><small>نطاق العرض</small><strong>{branchLabel}</strong></span></div>
        <button className="academy-owner-back" onClick={() => navigate("/")}><ArrowRight size={15} /> العودة إلى لوحة مدير الفرع</button>
        <div className="academy-owner-sidebar-footer">نسخة تجريبية · بيانات محلية</div>
      </aside>

      <main className="academy-owner-main">
        <header className="academy-owner-topbar"><button className="academy-owner-menu" aria-label="فتح القائمة" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button><span className="academy-owner-scope-pill"><Building2 size={15} /> أكاديمية مدى · {branchLabel}</span><span className="academy-owner-demo-pill"><i /> مسؤول الأكاديمية</span></header>
        <div className="academy-owner-content">
          <div className="academy-owner-breadcrumb"><span>مساحات الأدوار</span><ChevronLeft size={13} /><strong>{OWNER_VIEW_LABELS[view]}</strong></div>
          <PageHeader
            className="academy-owner-welcome"
            copyClassName="academy-owner-welcome-copy"
            actionsClassName="academy-owner-welcome-meta"
            eyebrow={<span className="academy-owner-eyebrow"><i /> إدارة على مستوى الأكاديمية · {branchLabel}</span>}
            title={OWNER_VIEW_TITLES[view]}
            description={OWNER_VIEW_DESCRIPTIONS[view]}
            actions={<><span><CalendarIcon /> {monthLabel}</span><span><ShieldCheck size={14} /> عرض وصلاحيات الأكاديمية</span></>}
          />
          <RoleScopeCard className="academy-owner-content-scope" />
          <div className="academy-owner-demo-banner" role="note"><AlertCircle size={15} /><span>DEMO</span>بيانات الفروع والتذاكر والتقارير توضيحية محلية وليست متصلة بالـbackend.</div>

          {view === "overview" && <OverviewView totals={academyTotals} rollup={rollup} openTickets={tickets.filter(ticket => ticket.status !== "resolved")} onBranches={() => goToView("branches")} onTickets={() => goToView("tickets")} onReports={() => goToView("reports")} />}
          {view === "branches" && <BranchRollupView branch={branch} setBranch={setBranch} rollup={rollup} onReports={() => goToView("reports")} />}
          {view === "tickets" && <TicketCenterView tickets={visibleTickets} selectedTicket={selectedTicket} query={ticketQuery} setQuery={setTicketQuery} filter={ticketFilter} setFilter={setTicketFilter} onSelect={setSelectedTicketId} onStatus={updateTicketStatus} />}
          {view === "reports" && <ReportsView month={month} setMonth={setMonth} branch={branch} setBranch={setBranch} instructorId={instructorId} setInstructorId={setInstructorId} summary={summary} rollup={rollup} onDownload={downloadReport} />}

          <footer className="academy-owner-footnote"><GraduationCap size={16} /><p>R01 يرى كل فروع أكاديميته ويستطيع متابعة التقارير والتذاكر والتصعيدات، لكنه لا يرى بيانات أي أكاديمية أخرى ولا يتجاوز صلاحيات R00.</p><div className="academy-owner-footnote-actions"><button onClick={() => navigate("/academy/roles")}><ShieldCheck size={14} /> إدارة المستخدمين والصلاحيات <ChevronLeft size={14} /></button><button onClick={() => navigate("/team")}>معاينة فريق الفرع <ChevronLeft size={14} /></button></div></footer>
        </div>
      </main>
    </RoleDashboardShell>
  );
}

const OWNER_VIEW_LABELS: Record<OwnerView, string> = { overview: "نظرة عامة", branches: "الفروع والأداء", tickets: "مركز التذاكر", reports: "التقارير المجمعة" };
const OWNER_VIEW_TITLES: Record<OwnerView, string> = { overview: "مركز الأكاديمية", branches: "الفروع والأداء", tickets: "مركز تذاكر الأكاديمية", reports: "التقارير المجمعة" };
const OWNER_VIEW_DESCRIPTIONS: Record<OwnerView, string> = { overview: "ابدأ من صورة موحّدة للفروع والتنبيهات والتقارير، ثم انتقل إلى الإجراء المطلوب دون خلط نطاق الأكاديمية بنطاق الفرع.", branches: "قارن أداء الفروع، راجع حالة مدير كل فرع، وحدد أين يحتاج الفريق إلى دعم أو تصعيد.", tickets: "تابع تذاكر كل فروع أكاديميتك في مكان واحد مع أولوية وحالة ومالك واضحين.", reports: "أنشئ تقريرًا مجمعًا قابلًا للتصدير مع الحفاظ على محدد الشهر والفرع كسياق واضح." };

function OwnerNavButton({ active, icon, label, count, onClick }: { active: boolean; icon: React.ReactNode; label: string; count?: number; onClick: () => void }) {
  return <button className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={onClick}>{icon}<span>{label}</span>{count !== undefined && <b>{count}</b>}</button>;
}

function OverviewView({ totals, rollup, openTickets, onBranches, onTickets, onReports }: { totals: { students: number; sessions: number; collected: number; tickets: number; leads: number }; rollup: BranchRecord[]; openTickets: AcademyTicket[]; onBranches: () => void; onTickets: () => void; onReports: () => void }) {
  return <>
    <section className="academy-owner-summary-grid" aria-label="ملخص الأكاديمية"><SummaryCard icon={<Users size={17} />} tone="teal" label="طلاب نشطون" value={totals.students} hint="عبر الفروع المحددة" /><SummaryCard icon={<Building2 size={17} />} tone="blue" label="فروع نشطة" value={rollup.length} hint="ضمن نطاق الأكاديمية" /><SummaryCard icon={<FileText size={17} />} tone="amber" label="تذاكر تحتاج متابعة" value={totals.tickets} hint={`${totals.leads} leads تحتاج متابعة`} /><SummaryCard icon={<TrendingUp size={17} />} tone="violet" label="حصص هذا الشهر" value={totals.sessions} hint={`${formatMoney(totals.collected)} تحصيل توضيحي`} /></section>
    <section className="academy-owner-feature-grid"><article className="academy-owner-panel"><PanelHeading icon={<Building2 size={16} />} title="لقطة الفروع" action={<button onClick={onBranches}>عرض كل الفروع <ChevronLeft size={14} /></button>} /><div className="academy-owner-branch-list">{rollup.map(item => <BranchRow key={item.name} branch={item} />)}</div></article><article className="academy-owner-panel"><PanelHeading icon={<Headphones size={16} />} title="تذاكر تحتاج انتباهًا" action={<button onClick={onTickets}>فتح المركز <ChevronLeft size={14} /></button>} /><div className="academy-owner-ticket-preview">{openTickets.slice(0, 3).map(ticket => <button key={ticket.id} onClick={onTickets}><span className={`academy-owner-ticket-dot ${ticket.priority}`} /><span><strong>{ticket.title}</strong><small>{ticket.branch} · {PRIORITY_LABELS[ticket.priority]}</small></span><ChevronLeft size={14} /></button>)}{openTickets.length === 0 && <p className="academy-owner-muted">لا توجد تذاكر مفتوحة.</p>}</div></article></section>
    <section className="academy-owner-action-strip"><div><FileBarChart size={18} /><span><strong>التقرير المجمع جاهز للبدء</strong><small>قارن الحضور والطاقة والتذاكر بين فروع الأكاديمية.</small></span></div><button onClick={onReports}>فتح التقارير <ChevronLeft size={14} /></button></section>
  </>;
}

function BranchRollupView({ branch, setBranch, rollup, onReports }: { branch: string; setBranch: (value: string) => void; rollup: BranchRecord[]; onReports: () => void }) {
 return <section className="academy-owner-panel academy-owner-rollup-panel"><PanelHeading icon={<Building2 size={16} />} title="Branch Rollup · ملخص كل الفروع" action={<button onClick={onReports}>التقرير المجمع <ChevronLeft size={14} /></button>} /><div className="academy-owner-filter-bar"><label><MapPin size={14} /><span>النطاق</span><select value={branch} onChange={event => setBranch(event.target.value)}><option value="all">كل الفروع</option>{ACADEMY_BRANCHES.map(item => <option key={item} value={item}>{item}</option>)}</select></label><span className="academy-owner-context-note"><ShieldCheck size={13} /> النطاق: أكاديمية مدى فقط</span></div><div className="academy-owner-branch-grid">{rollup.map(item => <article className="academy-owner-branch-card" key={item.name}><div className="academy-owner-branch-card-head"><span className="owner-summary-icon teal"><Building2 size={16} /></span><div><strong>{item.name}</strong><small>مدير الفرع: {item.manager}</small></div><StatusBadge status={item.managerStatus === "active" ? "success" : "warning"} label={item.managerStatus === "active" ? "نشط" : "يحتاج متابعة"} /></div><div className="academy-owner-branch-metrics"><Metric label="طلاب" value={item.students} /><Metric label="حضور" value={`${item.attendance}%`} /><Metric label="طاقة" value={`${item.capacity}%`} /><Metric label="تذاكر" value={item.openTickets} /></div><div className="academy-owner-branch-progress"><span>الحضور</span><div><i style={{ width: `${item.attendance}%` }} /></div><b>{item.attendance}%</b></div><div className="academy-owner-branch-card-foot"><span><Users size={13} /> {item.instructors} مدربين</span><span><MessageSquare size={13} /> {item.leads} leads</span><span className={item.trend >= 0 ? "trend-up" : "trend-down"}>{item.trend >= 0 ? "↗" : "↘"} {Math.abs(item.trend)}%</span></div></article>)}</div></section>;
}

function TicketCenterView({ tickets, selectedTicket, query, setQuery, filter, setFilter, onSelect, onStatus }: { tickets: AcademyTicket[]; selectedTicket?: AcademyTicket; query: string; setQuery: (value: string) => void; filter: TicketStatus | "all"; setFilter: (value: TicketStatus | "all") => void; onSelect: (id: string) => void; onStatus: (status: TicketStatus) => void }) {
 return <section className="academy-owner-ticket-layout"><article className="academy-owner-panel academy-owner-ticket-list-panel"><PanelHeading icon={<Headphones size={16} />} title="كل تذاكر الأكاديمية" action={<button onClick={() => setFilter("all")}><RefreshIcon /> تحديث العرض</button>} /><div className="academy-owner-ticket-toolbar"><label><Search size={14} /><input placeholder="ابحث برقم التذكرة أو العنوان..." value={query} onChange={event => setQuery(event.target.value)} /></label><select value={filter} onChange={event => setFilter(event.target.value as TicketStatus | "all")}><option value="all">كل الحالات</option>{Object.entries(TICKET_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><div className="academy-owner-tickets">{tickets.map(ticket => <button className={`academy-owner-ticket-row ${selectedTicket?.id === ticket.id ? "selected" : ""}`} key={ticket.id} onClick={() => onSelect(ticket.id)}><span className={`academy-owner-ticket-icon ${ticket.priority}`}><Ticket size={15} /></span><span><strong>{ticket.title}</strong><small>{ticket.id} · {ticket.branch} · {ticket.category}</small></span><StatusBadge status={ticket.status === "resolved" ? "success" : ticket.priority === "urgent" ? "danger" : "warning"} label={TICKET_STATUS_LABELS[ticket.status]} /><ChevronLeft size={14} /></button>)}{tickets.length === 0 && <div className="academy-owner-empty"><Search size={20} /><strong>لا توجد تذاكر مطابقة</strong><small>جرّب تغيير البحث أو الفلتر.</small></div>}</div></article><aside className="academy-owner-panel academy-owner-ticket-detail">{selectedTicket ? <><div className="academy-owner-ticket-detail-head"><span className={`academy-owner-ticket-icon ${selectedTicket.priority}`}><Ticket size={17} /></span><span><small>{selectedTicket.id} · {selectedTicket.branch}</small><h2>{selectedTicket.title}</h2></span></div><div className="academy-owner-ticket-meta"><span><b>الفئة</b>{selectedTicket.category}</span><span><b>الأولوية</b>{PRIORITY_LABELS[selectedTicket.priority]}</span><span><b>آخر تحديث</b>{selectedTicket.updated}</span></div><p className="academy-owner-ticket-description">{selectedTicket.description}</p><div className="academy-owner-requester"><MessageSquare size={15} /><span><small>صاحب الطلب</small><strong>{selectedTicket.requester}</strong></span></div><div className="academy-owner-ticket-actions"><small>تغيير الحالة</small><div>{(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]).filter(status => status !== selectedTicket.status).map(status => <button key={status} onClick={() => onStatus(status)}>{TICKET_STATUS_LABELS[status]}</button>)}</div></div><div className="academy-owner-audit-note"><CheckCircle2 size={14} /> القرار محلي في المعاينة، ويجب أن يُسجل كـAudit Event عند ربط الـbackend.</div></> : <div className="academy-owner-empty"><AlertCircle size={20} /><strong>اختر تذكرة لمراجعتها</strong></div>}</aside></section>;
}

function ReportsView({ month, setMonth, branch, setBranch, instructorId, setInstructorId, summary, rollup, onDownload }: { month: string; setMonth: (value: string) => void; branch: string; setBranch: (value: string) => void; instructorId: string; setInstructorId: (value: string) => void; summary: { instructors: number; branches: number; sessions: number; attendance: number }; rollup: BranchRecord[]; onDownload: () => void }) {
  return <><section className="academy-owner-report-toolbar"><div><span className="academy-owner-panel-kicker">سياق التقرير</span><strong>تقرير أداء الأكاديمية</strong><small>الفترة والنطاق ظاهرين قبل أي رقم أو تصدير.</small></div><label><span>الشهر</span><select value={month} onChange={event => setMonth(event.target.value)}>{PERFORMANCE_MONTHS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label><span>الفرع</span><select value={branch} onChange={event => setBranch(event.target.value)}><option value="all">كل الفروع</option>{ACADEMY_BRANCHES.map(item => <option key={item} value={item}>{item}</option>)}</select></label><button onClick={onDownload}><FileText size={15} /> تصدير CSV</button></section><section className="academy-owner-summary-grid academy-owner-report-summary"><SummaryCard icon={<Users size={17} />} tone="teal" label="مدربون في التقرير" value={summary.instructors} hint={`${summary.branches} فروع`} /><SummaryCard icon={<BarChart3 size={17} />} tone="blue" label="حصص الفترة" value={summary.sessions} hint="بعد تطبيق الفلاتر" /><SummaryCard icon={<TrendingUp size={17} />} tone="amber" label="الحضور الموزون" value={`${summary.attendance}%`} hint="حسب عدد الحصص" /><SummaryCard icon={<Building2 size={17} />} tone="violet" label="نطاق التقرير" value={branch === "all" ? "الكل" : branch} hint="أكاديمية مدى" /></section><div className="academy-owner-anchor"><InstructorPerformanceComparison scope="academy" month={month} onMonthChange={setMonth} selectedBranch={branch} onBranchChange={setBranch} selectedInstructorId={instructorId} onInstructorChange={setInstructorId} /></div><section className="academy-owner-panel academy-owner-report-table"><PanelHeading icon={<FileBarChart size={16} />} title="مقارنة الفروع" action={<span className="academy-owner-context-note"><Clock3 size={13} /> {PERFORMANCE_MONTHS.find(item => item.value === month)?.label}</span>} /><div className="academy-owner-report-table-wrap"><table><thead><tr><th>الفرع</th><th>الطلاب</th><th>الحضور</th><th>الحصص</th><th>الطاقة</th><th>التذاكر</th></tr></thead><tbody>{rollup.map(item => <tr key={item.name}><td><strong>{item.name}</strong><small>{item.manager}</small></td><td>{item.students}</td><td><b className={item.attendance >= 88 ? "report-good" : "report-watch"}>{item.attendance}%</b></td><td>{item.sessions}</td><td>{item.capacity}%</td><td>{item.openTickets}</td></tr>)}</tbody></table></div></section></>;
}

function SummaryCard({ icon, tone, label, value, hint }: { icon: React.ReactNode; tone: string; label: string; value: React.ReactNode; hint: string }) {
  return <article><span className={`owner-summary-icon ${tone}`}>{icon}</span><small>{label}</small><strong>{value}</strong><span>{hint}</span></article>;
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <span><small>{label}</small><strong>{value}</strong></span>; }
function BranchRow({ branch }: { branch: BranchRecord }) { return <div className="academy-owner-branch-row"><span className="owner-summary-icon teal"><Building2 size={15} /></span><span><strong>{branch.name}</strong><small>{branch.manager} · {branch.students} طالب</small></span><span><b>{branch.attendance}%</b><small>حضور</small></span><span className={branch.trend >= 0 ? "trend-up" : "trend-down"}>{branch.trend >= 0 ? "↗" : "↘"} {Math.abs(branch.trend)}%</span><ChevronLeft size={14} /></div>; }
function PanelHeading({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) { return <div className="academy-owner-panel-heading"><div><span>{icon}</span><h2>{title}</h2></div>{action}</div>; }
function RefreshIcon() { return <span aria-hidden="true">↻</span>; }
function CalendarIcon() { return <span aria-hidden="true">▦</span>; }
function formatMoney(value: number) { return `${new Intl.NumberFormat("ar-EG").format(value)} ج.م`; }
