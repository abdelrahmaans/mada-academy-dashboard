import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import StatusBadge from "@/components/StatusBadge";
import SessionLogoutButton from "@/components/SessionLogoutButton";
import { apiClient } from "@/lib/apiClient";
import AcademicProgramsLive from "./AcademicProgramsLive";

type ProgramView = "curriculum" | "sessions" | "progress";
type CurriculumStatus = "published" | "in_review" | "draft";
type SessionStatus = "ready" | "needs_support" | "missing_plan";
type ProgressRisk = "on_track" | "watch" | "at_risk";
type Curriculum = { id: string; name: string; level: string; version: string; owner: string; units: number; completedUnits: number; groups: number; status: CurriculumStatus; updated: string };
type ProgramSession = { id: string; date: string; time: string; course: string; group: string; instructor: string; unit: string; students: number; status: SessionStatus };
type StudentProgress = { id: string; name: string; group: string; course: string; completion: number; mastery: number; attendance: number; lastCheckpoint: string; risk: ProgressRisk; note?: string };

const VIEW_TITLES: Record<ProgramView, string> = { curriculum: "إدارة المناهج والبرامج", sessions: "جلسات البرامج", progress: "تقدم الطلاب" };
const VIEW_COPY: Record<ProgramView, string> = { curriculum: "راجع نسخ المناهج ووحداتها، وارفع التعديلات للمراجعة قبل اعتمادها على مستوى الأكاديمية.", sessions: "تابع جاهزية كل جلسة، الوحدة التي يتم تنفيذها، وما يحتاج تدخلًا أكاديميًا من المشرف.", progress: "اربط الحضور والـcheckpoints بإتقان الطالب، وحدد الطلاب الذين يحتاجون خطة دعم واضحة." };
const CURRICULUM_STATUS: Record<CurriculumStatus, string> = { published: "منشور", in_review: "قيد المراجعة", draft: "مسودة" };
const SESSION_STATUS: Record<SessionStatus, string> = { ready: "خطة مكتملة", needs_support: "تحتاج دعم", missing_plan: "خطة ناقصة" };
const RISK_LABEL: Record<ProgressRisk, string> = { on_track: "على المسار", watch: "تحت الملاحظة", at_risk: "يحتاج تدخل" };
const INITIAL_CURRICULA: Curriculum[] = [
  { id: "CUR-021", name: "روبوتكس للمستوى المتوسط", level: "10–12 سنة", version: "v2.3", owner: "مريم حسن", units: 8, completedUnits: 8, groups: 3, status: "published", updated: "24 سبتمبر 2026" },
  { id: "CUR-014", name: "برمجة Python للمبتدئين", level: "11–14 سنة", version: "v1.8", owner: "عمر سامح", units: 10, completedUnits: 7, groups: 2, status: "in_review", updated: "26 سبتمبر 2026" },
  { id: "CUR-033", name: "أساسيات الذكاء الاصطناعي", level: "13–16 سنة", version: "v0.9", owner: "كريم أشرف", units: 6, completedUnits: 2, groups: 1, status: "draft", updated: "28 سبتمبر 2026" },
];
const INITIAL_SESSIONS: ProgramSession[] = [
  { id: "PS-301", date: "السبت 26 سبتمبر", time: "10:00 – 11:30", course: "روبوتكس للمستوى المتوسط", group: "مجموعة A · 10–12", instructor: "مريم حسن", unit: "الوحدة 5 · الحساسات", students: 12, status: "ready" },
  { id: "PS-302", date: "السبت 26 سبتمبر", time: "12:00 – 13:30", course: "برمجة Python للمبتدئين", group: "مجموعة B · 11–14", instructor: "عمر سامح", unit: "الوحدة 4 · الحلقات", students: 14, status: "needs_support" },
  { id: "PS-303", date: "الأحد 27 سبتمبر", time: "16:00 – 17:30", course: "أساسيات الذكاء الاصطناعي", group: "مجموعة A · 13–16", instructor: "كريم أشرف", unit: "الوحدة 2 · البيانات", students: 9, status: "missing_plan" },
  { id: "PS-304", date: "الإثنين 28 سبتمبر", time: "10:00 – 11:30", course: "روبوتكس للمستوى المتوسط", group: "مجموعة B · 10–12", instructor: "دينا مصطفى", unit: "الوحدة 6 · التحكم", students: 11, status: "ready" },
];
const INITIAL_PROGRESS: StudentProgress[] = [
  { id: "ST-0241", name: "آدم رامي", group: "روبوتكس · مجموعة A", course: "روبوتكس للمستوى المتوسط", completion: 76, mastery: 84, attendance: 96, lastCheckpoint: "الحساسات · 25 سبتمبر", risk: "on_track" },
  { id: "ST-0242", name: "جنى حسام", group: "روبوتكس · مجموعة A", course: "روبوتكس للمستوى المتوسط", completion: 68, mastery: 72, attendance: 89, lastCheckpoint: "الحساسات · 25 سبتمبر", risk: "watch" },
  { id: "ST-0246", name: "عمر خالد", group: "Python · مجموعة B", course: "برمجة Python للمبتدئين", completion: 42, mastery: 55, attendance: 76, lastCheckpoint: "الشروط · 23 سبتمبر", risk: "at_risk", note: "يحتاج تمرينًا إضافيًا قبل الحصة القادمة" },
  { id: "ST-0316", name: "كريم سامي", group: "Python · مجموعة B", course: "برمجة Python للمبتدئين", completion: 61, mastery: 64, attendance: 82, lastCheckpoint: "الحلقات · 24 سبتمبر", risk: "watch" },
  { id: "ST-0322", name: "تاليا عمرو", group: "AI · مجموعة A", course: "أساسيات الذكاء الاصطناعي", completion: 28, mastery: 48, attendance: 70, lastCheckpoint: "البيانات · 22 سبتمبر", risk: "at_risk" },
];

function AcademicProgramsPreview() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<ProgramView>("curriculum");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [curricula, setCurricula] = useState(INITIAL_CURRICULA);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredCurricula = useMemo(() => curricula.filter(item => !query.trim() || `${item.name} ${item.owner} ${item.version}`.toLocaleLowerCase("ar").includes(query.trim().toLocaleLowerCase("ar"))), [curricula, query]);
  const filteredSessions = useMemo(() => sessions.filter(item => (statusFilter === "all" || item.status === statusFilter) && (!query.trim() || `${item.course} ${item.instructor} ${item.unit}`.toLocaleLowerCase("ar").includes(query.trim().toLocaleLowerCase("ar")))), [query, sessions, statusFilter]);
  const filteredProgress = useMemo(() => progress.filter(item => (statusFilter === "all" || item.risk === statusFilter) && (!query.trim() || `${item.name} ${item.group} ${item.course}`.toLocaleLowerCase("ar").includes(query.trim().toLocaleLowerCase("ar")))), [progress, query, statusFilter]);
  const selectView = (next: ProgramView) => { setView(next); setQuery(""); setStatusFilter("all"); setMobileOpen(false); };
  const submitCurriculum = (id: string) => { setCurricula(current => current.map(item => item.id === id && item.status === "draft" ? { ...item, status: "in_review" } : item)); toast.success("تم رفع المنهج للمراجعة", { description: "سيحتاج اعتماد الأكاديمية قبل نشر النسخة الجديدة." }); };
  const resolveSession = (id: string) => { setSessions(current => current.map(item => item.id === id ? { ...item, status: "ready" } : item)); toast.success("تم تسجيل متابعة الجلسة", { description: "تم وضعها كجاهزة في العرض المحلي." }); };
  const addProgressNote = (id: string) => { setProgress(current => current.map(item => item.id === id ? { ...item, note: "تمت إضافة ملاحظة متابعة من مشرف البرامج" } : item)); toast.success("تم تسجيل ملاحظة متابعة", { description: "الملاحظة محلية توضيحية حتى ربط الـAPI." }); };
  return <RoleDashboardShell className="app-shell academic-programs-shell" roleCode="R03" roleLabel="مشرف البرامج" scopeLevel="branch" scopeLabel="فرع واحد · فريق المدربين والبرامج التابعة" tenantName="أكاديمية مدى" branchName="فرع مدينة نصر">
    {mobileOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}><div className="sidebar-top"><button className="academic-programs-brand" onClick={() => navigate("/head-instructors")}><strong>مدى</strong><small>الإشراف الأكاديمي · R03</small></button><button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)}><X size={19} /></button></div><div className="academy-switcher"><span className="academy-avatar"><GraduationCap size={20} /></span><span className="academy-meta"><strong>أكاديمية مدى</strong><small>فرع مدينة نصر</small></span></div><div className="nav-caption">الإشراف الأكاديمي</div><nav className="primary-nav"><button className="nav-link" onClick={() => navigate("/head-instructors")}><LayoutDashboard size={19} /><span>ملخص الفريق</span></button><button className={`nav-link ${view === "curriculum" ? "active" : ""}`} onClick={() => selectView("curriculum")}><BookOpen size={19} /><span>المناهج والبرامج</span></button><button className={`nav-link ${view === "sessions" ? "active" : ""}`} onClick={() => selectView("sessions")}><CalendarDays size={19} /><span>جلسات البرامج</span><span className="nav-count">{sessions.filter(item => item.status !== "ready").length}</span></button><button className={`nav-link ${view === "progress" ? "active" : ""}`} onClick={() => selectView("progress")}><Target size={19} /><span>تقدم الطلاب</span><span className="nav-count">{progress.filter(item => item.risk === "at_risk").length}</span></button></nav><div className="nav-caption nav-caption-spaced">مسارات أخرى</div><nav className="primary-nav"><button className="nav-link" onClick={() => navigate("/schedule")}><Clock3 size={19} /><span>جدول الفرع</span></button><button className="nav-link" onClick={() => navigate("/team")}><Users size={19} /><span>فريق الفرع</span></button><button className="nav-link" onClick={() => navigate("/approvals")}><CheckCircle2 size={19} /><span>الموافقات</span></button></nav><div className="sidebar-spacer" /><div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>محتاج مساعدة؟</strong><span>تصعيد أكاديمي موثق</span></div><ChevronLeft size={16} /></div><div className="sidebar-bottom"><button className="nav-link" onClick={() => toast("الإعدادات قيد التجهيز")}><Settings size={19} /><span>الإعدادات</span></button><SessionLogoutButton className="nav-link" iconSize={19} /></div></aside>
    <main className="main-panel"><header className="topbar"><div className="topbar-right"><button className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="branch-select assigned-branch"><span className="branch-icon"><MapPin size={17} /></span><span>فرع مدينة نصر</span></div></div><span className="academic-programs-scope"><ShieldCheck size={14} /> إشراف أكاديمي · لا اعتماد مالي</span></header><div className="workspace academic-programs-content"><PageHeader className="welcome-row" copyClassName="welcome-copy" actionsClassName="welcome-actions" eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> البرامج الأكاديمية · R03</span>} title={VIEW_TITLES[view]} description={VIEW_COPY[view]} actions={<span className="academic-programs-week"><CalendarDays size={14} /> أسبوع 26–30 سبتمبر</span>} /><RoleScopeCard className="academic-programs-scope-card" /><div className="academic-programs-banner"><ShieldCheck size={15} /><span><strong>حدود الدور:</strong> مشرف البرامج يراجع المحتوى والحضور والتقدم ويقترح الدعم، بينما اعتماد القوالب النهائي والصلاحيات المالية يظل خارج R03.</span></div><div className="academic-programs-tabs"><button className={view === "curriculum" ? "active" : ""} onClick={() => selectView("curriculum")}><BookOpen size={15} /> المناهج</button><button className={view === "sessions" ? "active" : ""} onClick={() => selectView("sessions")}><CalendarDays size={15} /> الجلسات</button><button className={view === "progress" ? "active" : ""} onClick={() => selectView("progress")}><Target size={15} /> تقدم الطلاب</button></div>{view === "curriculum" && <CurriculumView items={filteredCurricula} query={query} setQuery={setQuery} onSubmit={submitCurriculum} />}{view === "sessions" && <SessionsView items={filteredSessions} query={query} setQuery={setQuery} filter={statusFilter} setFilter={setStatusFilter} onResolve={resolveSession} />}{view === "progress" && <ProgressView items={filteredProgress} query={query} setQuery={setQuery} filter={statusFilter} setFilter={setStatusFilter} onNote={addProgressNote} />}</div></main>
  </RoleDashboardShell>;
}
function CurriculumView({ items, query, setQuery, onSubmit }: { items: Curriculum[]; query: string; setQuery: (value: string) => void; onSubmit: (id: string) => void }) { return <><section className="academic-programs-kpis"><Kpi icon={<BookOpen size={16} />} label="مناهج نشطة" value={items.filter(item => item.status === "published").length} hint="ضمن فرع مدينة نصر" tone="teal" /><Kpi icon={<FileCheck2 size={16} />} label="قيد المراجعة" value={items.filter(item => item.status === "in_review").length} hint="تحتاج قرار أكاديمي" tone="violet" /><Kpi icon={<Users size={16} />} label="مجموعات مرتبطة" value={items.reduce((sum, item) => sum + item.groups, 0)} hint="في البرامج الحالية" tone="blue" /><Kpi icon={<AlertCircle size={16} />} label="مسودات" value={items.filter(item => item.status === "draft").length} hint="ليست منشورة" tone="amber" /></section><section className="academic-programs-panel"><PanelTitle icon={<BookOpen size={16} />} title="مكتبة المناهج" action={<button className="academic-programs-secondary" onClick={() => toast("إنشاء منهج جديد يحتاج ربط Course Template API") }><Plus size={14} /> منهج جديد</button>} /><Toolbar query={query} setQuery={setQuery} placeholder="ابحث باسم المنهج أو المسؤول..." /><div className="curriculum-grid">{items.length === 0 ? <EmptyMessage text="لا توجد مناهج مطابقة" /> : items.map(item => <article className="curriculum-card" key={item.id}><div className="curriculum-card-top"><span className="curriculum-icon"><BookOpen size={17} /></span><StatusBadge status={item.status === "published" ? "success" : item.status === "in_review" ? "warning" : "info"} label={CURRICULUM_STATUS[item.status]} /></div><h3>{item.name}</h3><p>{item.level} · {item.version}</p><div className="curriculum-owner"><span>{item.owner.slice(0, 1)}</span><small>مسؤول المحتوى <strong>{item.owner}</strong></small></div><div className="curriculum-progress-line"><div><i style={{ width: `${Math.round(item.completedUnits / item.units * 100)}%` }} /></div><b>{item.completedUnits}/{item.units} وحدات</b></div><div className="curriculum-meta"><span>{item.groups} مجموعات</span><span>آخر تحديث {item.updated}</span></div><div className="curriculum-actions"><button onClick={() => toast(`تم فتح تفاصيل ${item.name}`)}>فتح الوحدات <ChevronLeft size={13} /></button>{item.status === "draft" && <button className="academic-programs-primary" onClick={() => onSubmit(item.id)}><FileCheck2 size={13} /> رفع للمراجعة</button>}</div></article>)}</div></section></>; }
function SessionsView({ items, query, setQuery, filter, setFilter, onResolve }: { items: ProgramSession[]; query: string; setQuery: (value: string) => void; filter: string; setFilter: (value: string) => void; onResolve: (id: string) => void }) { return <section className="academic-programs-panel"><PanelTitle icon={<CalendarDays size={16} />} title="جلسات البرامج" action={<span className="academic-programs-context"><ShieldCheck size={13} /> مراجعة أكاديمية داخل الفرع</span>} /><Toolbar query={query} setQuery={setQuery} placeholder="ابحث عن جلسة أو مدرب أو وحدة..." /><div className="academic-filter-row"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>كل الجلسات</button><button className={filter === "ready" ? "active" : ""} onClick={() => setFilter("ready")}>جاهزة</button><button className={filter === "needs_support" ? "active" : ""} onClick={() => setFilter("needs_support")}>تحتاج دعم</button><button className={filter === "missing_plan" ? "active" : ""} onClick={() => setFilter("missing_plan")}>خطة ناقصة</button></div><div className="program-session-list">{items.map(item => <article className={`program-session-row ${item.status}`} key={item.id}><div className="program-session-date"><strong>{item.date}</strong><span><Clock3 size={12} /> {item.time}</span></div><div className="program-session-main"><strong>{item.course}</strong><span>{item.group} · {item.instructor}</span><small><BookOpen size={12} /> {item.unit} · {item.students} طلاب</small></div><StatusBadge status={item.status === "ready" ? "success" : item.status === "needs_support" ? "warning" : "danger"} label={SESSION_STATUS[item.status]} /><div className="program-session-action">{item.status !== "ready" ? <button onClick={() => onResolve(item.id)}><Check size={14} /> تسجيل المتابعة</button> : <span><CheckCircle2 size={14} /> مكتملة الخطة</span>}</div></article>)}{items.length === 0 && <EmptyMessage text="لا توجد جلسات مطابقة للفلتر الحالي" />}</div></section>; }
function ProgressView({ items, query, setQuery, filter, setFilter, onNote }: { items: StudentProgress[]; query: string; setQuery: (value: string) => void; filter: string; setFilter: (value: string) => void; onNote: (id: string) => void }) { return <section className="academic-programs-panel"><PanelTitle icon={<Target size={16} />} title="لوحة تقدم الطلاب" action={<span className="academic-programs-context"><Sparkles size={13} /> checkpoint + حضور + إتقان</span>} /><Toolbar query={query} setQuery={setQuery} placeholder="ابحث باسم الطالب أو المجموعة..." /><div className="academic-filter-row"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>كل الطلاب</button><button className={filter === "on_track" ? "active" : ""} onClick={() => setFilter("on_track")}>على المسار</button><button className={filter === "watch" ? "active" : ""} onClick={() => setFilter("watch")}>تحت الملاحظة</button><button className={filter === "at_risk" ? "active" : ""} onClick={() => setFilter("at_risk")}>يحتاج تدخل</button></div><div className="progress-table-wrap"><table className="progress-table"><thead><tr><th>الطالب</th><th>إكمال المنهج</th><th>الإتقان</th><th>الحضور</th><th>آخر checkpoint</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><span className="progress-student"><i>{item.name.slice(0, 1)}</i><span><strong>{item.name}</strong><small>{item.group} · {item.course}</small></span></span></td><td><ProgressValue value={item.completion} /></td><td><ProgressValue value={item.mastery} /></td><td><b>{item.attendance}%</b></td><td>{item.lastCheckpoint}</td><td><StatusBadge status={item.risk === "on_track" ? "success" : item.risk === "watch" ? "warning" : "danger"} label={RISK_LABEL[item.risk]} /></td><td><button className="progress-note-button" onClick={() => onNote(item.id)}><MessageCircle size={13} /> {item.note ? "تمت الملاحظة" : "إضافة ملاحظة"}</button></td></tr>)}</tbody></table>{items.length === 0 && <EmptyMessage text="لا يوجد طلاب مطابقون" />}</div><div className="progress-legend"><AlertCircle size={14} /><span><strong>قاعدة التدخل:</strong> الطالب الذي ينخفض إتقانه أو حضوره يظهر للمراجعة، لكن القرار النهائي وخطة التواصل تُسجل عبر المسار المعتمد.</span></div></section>; }
function Toolbar({ query, setQuery, placeholder }: { query: string; setQuery: (value: string) => void; placeholder: string }) { return <label className="academic-programs-search"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={placeholder} /></label>; }
function Kpi({ icon, label, value, hint, tone }: { icon: ReactNode; label: string; value: ReactNode; hint: string; tone: string }) { return <article className="academic-programs-kpi"><span className={`academic-programs-kpi-icon ${tone}`}>{icon}</span><small>{label}</small><strong>{value}</strong><span>{hint}</span></article>; }
function PanelTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) { return <div className="academic-programs-panel-title"><div><span>{icon}</span><h2>{title}</h2></div>{action}</div>; }
function ProgressValue({ value }: { value: number }) { return <span className="progress-value"><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></span>; }
function EmptyMessage({ text }: { text: string }) { return <div className="academic-programs-empty"><Search size={18} /><strong>{text}</strong><small>جرّب تغيير البحث أو الفلتر.</small></div>; }


export default function AcademicPrograms() {
  return apiClient.hasSession() ? <AcademicProgramsLive /> : <AcademicProgramsPreview />;
}
