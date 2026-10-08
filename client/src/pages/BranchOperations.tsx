import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import BranchManagerSidebar from "@/components/BranchManagerSidebar";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import StatusBadge from "@/components/StatusBadge";
import BranchManagerSidebar from "@/components/BranchManagerSidebar";
import "@/components/PreviewBanner.css";

type OpsView = "departments" | "trainers" | "schedule";
type TrainerStatus = "active" | "on_leave" | "needs_review";
type SessionStatus = "confirmed" | "needs_room" | "pending_approval";

type Department = {
  id: string;
  name: string;
  lead: string;
  groups: number;
  students: number;
  trainers: number;
  status: "active" | "needs_review";
};
type Trainer = {
  id: string;
  name: string;
  department: string;
  specialty: string;
  sessions: number;
  students: number;
  status: TrainerStatus;
};
type WeekSession = {
  id: string;
  day: string;
  time: string;
  duration: string;
  course: string;
  department: string;
  trainer: string;
  room: string;
  status: SessionStatus;
};

const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const INITIAL_DEPARTMENTS: Department[] = [
  { id: "DEP-01", name: "الروبوتكس والدوائر", lead: "مريم حسن", groups: 4, students: 58, trainers: 3, status: "active" },
  { id: "DEP-02", name: "البرمجة", lead: "عمر سامح", groups: 5, students: 72, trainers: 4, status: "active" },
  { id: "DEP-03", name: "المهارات الإبداعية", lead: "سارة خالد", groups: 3, students: 41, trainers: 2, status: "needs_review" },
];
const INITIAL_TRAINERS: Trainer[] = [
  { id: "USR-0201", name: "مريم حسن", department: "الروبوتكس والدوائر", specialty: "رئيسة المدربين · روبوتكس", sessions: 11, students: 38, status: "active" },
  { id: "USR-0202", name: "عمر سامح", department: "البرمجة", specialty: "Python · مبتدئين", sessions: 14, students: 46, status: "active" },
  { id: "USR-0208", name: "دينا مصطفى", department: "البرمجة", specialty: "Web · أطفال", sessions: 12, students: 39, status: "active" },
  { id: "USR-0209", name: "كريم أشرف", department: "الروبوتكس والدوائر", specialty: "دوائر إلكترونية", sessions: 9, students: 31, status: "needs_review" },
  { id: "USR-0203", name: "سارة خالد", department: "المهارات الإبداعية", specialty: "تفكير إبداعي", sessions: 8, students: 27, status: "active" },
];
const INITIAL_SESSIONS: WeekSession[] = [
  { id: "SES-301", day: "السبت", time: "10:00", duration: "90 د", course: "روبوتكس مستوى 2", department: "الروبوتكس والدوائر", trainer: "مريم حسن", room: "معمل 1", status: "confirmed" },
  { id: "SES-302", day: "السبت", time: "12:00", duration: "90 د", course: "برمجة للمبتدئين", department: "البرمجة", trainer: "عمر سامح", room: "معمل 2", status: "confirmed" },
  { id: "SES-303", day: "الأحد", time: "16:00", duration: "60 د", course: "مهارات التفكير الإبداعي", department: "المهارات الإبداعية", trainer: "سارة خالد", room: "قاعة 3", status: "confirmed" },
  { id: "SES-304", day: "الإثنين", time: "10:00", duration: "90 د", course: "دوائر إلكترونية", department: "الروبوتكس والدوائر", trainer: "كريم أشرف", room: "معمل 1", status: "needs_room" },
  { id: "SES-305", day: "الثلاثاء", time: "12:00", duration: "90 د", course: "Web للأطفال", department: "البرمجة", trainer: "دينا مصطفى", room: "معمل 2", status: "confirmed" },
  { id: "SES-306", day: "الأربعاء", time: "17:00", duration: "90 د", course: "Python مستوى 1", department: "البرمجة", trainer: "عمر سامح", room: "معمل 2", status: "pending_approval" },
  { id: "SES-307", day: "الخميس", time: "15:00", duration: "60 د", course: "روبوتكس مستوى 1", department: "الروبوتكس والدوائر", trainer: "مريم حسن", room: "معمل 1", status: "confirmed" },
];
const TRAINER_STATUS_LABELS: Record<TrainerStatus, string> = { active: "نشط", on_leave: "إجازة", needs_review: "يحتاج مراجعة" };
const SESSION_STATUS_LABELS: Record<SessionStatus, string> = { confirmed: "مؤكدة", needs_room: "تحتاج قاعة", pending_approval: "بانتظار الاعتماد" };

export default function BranchOperations() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<OpsView>("departments");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [trainers, setTrainers] = useState(INITIAL_TRAINERS);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({ day: "السبت", time: "16:00", course: "", department: INITIAL_DEPARTMENTS[0].name, trainer: INITIAL_TRAINERS[0].name, room: "معمل 1" });

  const filteredTrainers = useMemo(() => trainers.filter(trainer => {
    const text = `${trainer.name} ${trainer.specialty} ${trainer.department}`.toLocaleLowerCase("ar");
    return (!query.trim() || text.includes(query.trim().toLocaleLowerCase("ar"))) && (departmentFilter === "all" || trainer.department === departmentFilter);
  }), [departmentFilter, query, trainers]);
  const filteredSessions = useMemo(() => sessions.filter(session => departmentFilter === "all" || session.department === departmentFilter), [departmentFilter, sessions]);
  const activeTrainerCount = trainers.filter(trainer => trainer.status === "active").length;
  const pendingSessions = sessions.filter(session => session.status !== "confirmed").length;

  const selectView = (next: OpsView) => { setView(next); setMobileNavOpen(false); setQuery(""); };
  const toggleTrainerStatus = (id: string) => {
    setTrainers(current => current.map(trainer => trainer.id === id ? { ...trainer, status: trainer.status === "active" ? "needs_review" : "active" } : trainer));
    toast.success("تم تحديث حالة المدرب", { description: "التغيير محفوظ محليًا في العرض التجريبي فقط." });
  };
  const changeDepartment = (id: string, department: string) => {
    setTrainers(current => current.map(trainer => trainer.id === id ? { ...trainer, department } : trainer));
    toast.success("تم تحديث القسم", { description: "التعيين المحلي لا يرسل طلبًا للخادم بعد." });
  };
  const addSession = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newSession.course.trim()) { toast.error("اكتب اسم الحصة أولًا"); return; }
    const conflict = sessions.find(session => session.day === newSession.day && session.time === newSession.time && (session.room === newSession.room || session.trainer === newSession.trainer));
    if (conflict) { toast.error("يوجد تعارض في القاعة أو جدول المدرب", { description: `الحصة المتعارضة: ${conflict.course}` }); return; }
    setSessions(current => [...current, { id: `SES-${Date.now()}`, ...newSession, duration: "90 د", status: "pending_approval" }]);
    setAddSessionOpen(false);
    setNewSession(current => ({ ...current, course: "" }));
    toast.success("تمت إضافة الحصة للمراجعة", { description: "الحصة الجديدة بانتظار اعتماد مدير الفرع محليًا." });
  };

  return <RoleDashboardShell className="app-shell r02-operations-shell" showSessionLogout={false} roleCode="R02" roleLabel="مدير الفرع" scopeLevel="branch" scopeLabel="فرع مدينة نصر" tenantName="أكاديمية مدى" branchName="فرع مدينة نصر">
    <BranchManagerSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    <main className="main-panel"><header className="topbar"><div className="topbar-right"><button className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button><div className="branch-select assigned-branch"><span className="branch-icon"><MapPin size={17} /></span><span>فرع مدينة نصر</span></div></div><div className="r02-ops-scope-pill"><ShieldCheck size={15} /> صلاحية مدير الفرع · فرع واحد</div></header>
      <div className="workspace r02-ops-content"><div className="r02-preview-banner" role="note"><strong>PREVIEW / DEMO</strong> هذه الصفحة غير متصلة ببيانات الخادم؛ الأقسام والمدربون والجلسات والأفعال المعروضة محلية توضيحية ولا تُحفظ.</div><PageHeader className="welcome-row" copyClassName="welcome-copy" actionsClassName="welcome-actions" eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> تشغيل الفرع · R02</span>} title={VIEW_TITLES[view]} description={VIEW_DESCRIPTIONS[view]} actions={<span className="r02-ops-date"><Clock3 size={14} /> أسبوع التشغيل الحالي</span>} /><RoleScopeCard className="r02-ops-scope-card" /><div className="r02-ops-demo-note"><ShieldCheck size={14} /><strong>عرض محلي فقط:</strong> لا تستخدم الأرقام أو التغييرات هنا كحالة فعلية للفرع.</div>
        {view === "departments" && <DepartmentsView departments={departments} trainers={filteredTrainers} query={query} setQuery={setQuery} departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter} onToggle={toggleTrainerStatus} onDepartmentChange={changeDepartment} onSchedule={() => selectView("schedule")} />}
        {view === "trainers" && <TrainersView trainers={filteredTrainers} query={query} setQuery={setQuery} departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter} departments={departments} onToggle={toggleTrainerStatus} onDepartmentChange={changeDepartment} />}
        {view === "schedule" && <ScheduleView sessions={filteredSessions} weekOffset={weekOffset} setWeekOffset={setWeekOffset} departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter} onAdd={() => setAddSessionOpen(true)} />}
      </div>
    </main>
    {addSessionOpen && <SessionDialog value={newSession} departments={departments} trainers={trainers} onChange={setNewSession} onClose={() => setAddSessionOpen(false)} onSubmit={addSession} />}
    </RoleDashboardShell>
  );
}

const VIEW_TITLES: Record<OpsView, string> = { departments: "إدارة الأقسام والمدربين", trainers: "فريق المدربين في الفرع", schedule: "الجدول الأسبوعي للفرع" };
const VIEW_DESCRIPTIONS: Record<OpsView, string> = { departments: "نظّم أقسام الفرع، راجع أحمال المدربين، وانتقل للجدول دون مغادرة نطاق التشغيل المحلي.", trainers: "تابع التعيين للقسم وحالة كل مدرب وحجم الجلسات والطلاب المسندين إليه.", schedule: "خطط أسبوع الفرع، راجع التعارضات، وأضف جلسة تمر بحالة انتظار الاعتماد قبل اعتمادها." };

function DepartmentsView({ departments, trainers, query, setQuery, departmentFilter, setDepartmentFilter, onToggle, onDepartmentChange, onSchedule }: { departments: Department[]; trainers: Trainer[]; query: string; setQuery: (value: string) => void; departmentFilter: string; setDepartmentFilter: (value: string) => void; onToggle: (id: string) => void; onDepartmentChange: (id: string, value: string) => void; onSchedule: () => void }) {
  return <><section className="r02-ops-summary-grid"><SummaryCard icon={<Building2 size={17} />} label="أقسام نشطة" value={departments.filter(item => item.status === "active").length} hint={`${departments.length} أقسام في الفرع`} tone="teal" /><SummaryCard icon={<Users size={17} />} label="مدربون نشطون" value={trainers.filter(item => item.status === "active").length} hint="ضمن فريق الفرع" tone="blue" /><SummaryCard icon={<BookOpen size={17} />} label="مجموعات الأسبوع" value={departments.reduce((sum, item) => sum + item.groups, 0)} hint="تشغيل محلي" tone="amber" /><SummaryCard icon={<UserCog size={17} />} label="يحتاج مراجعة" value={trainers.filter(item => item.status === "needs_review").length} hint="حالات متابعة" tone="violet" /></section><section className="r02-ops-panel"><PanelHeading icon={<Building2 size={16} />} title="الأقسام التشغيلية" action={<button onClick={onSchedule}>فتح الجدول الأسبوعي <ChevronLeft size={14} /></button>} /><div className="r02-department-grid">{departments.map(department => <article className="r02-department-card" key={department.id}><div className="r02-department-head"><span className="r02-department-icon"><Building2 size={17} /></span><span><strong>{department.name}</strong><small>مسؤول القسم: {department.lead}</small></span><StatusBadge status={department.status === "active" ? "success" : "warning"} label={department.status === "active" ? "نشط" : "يحتاج مراجعة"} /></div><div className="r02-department-metrics"><Metric label="مجموعات" value={department.groups} /><Metric label="طلاب" value={department.students} /><Metric label="مدربين" value={department.trainers} /></div><div className="r02-department-foot"><span><CheckCircle2 size={13} /> نطاق الفرع فقط</span><b>{department.id}</b></div></article>)}</div></section><TrainersPanel trainers={trainers} departments={departments} query={query} setQuery={setQuery} departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter} onToggle={onToggle} onDepartmentChange={onDepartmentChange} /></>;
}
function TrainersView(props: Omit<Parameters<typeof TrainersPanel>[0], "departments"> & { departments: Department[] }) { return <TrainersPanel {...props} />; }
function TrainersPanel({ trainers, departments, query, setQuery, departmentFilter, setDepartmentFilter, onToggle, onDepartmentChange }: { trainers: Trainer[]; departments: Department[]; query: string; setQuery: (value: string) => void; departmentFilter: string; setDepartmentFilter: (value: string) => void; onToggle: (id: string) => void; onDepartmentChange: (id: string, value: string) => void }) {
  return <section className="r02-ops-panel r02-trainers-panel"><PanelHeading icon={<Users size={16} />} title="المدربون والتعيينات" action={<span className="r02-ops-context"><ShieldCheck size={13} /> إدارة R02 داخل الفرع</span>} /><div className="r02-ops-toolbar"><label><Search size={14} /><input placeholder="ابحث عن مدرب أو تخصص..." value={query} onChange={event => setQuery(event.target.value)} /></label><select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}><option value="all">كل الأقسام</option>{departments.map(department => <option key={department.id} value={department.name}>{department.name}</option>)}</select></div><div className="r02-trainer-table-wrap"><table className="r02-trainer-table"><thead><tr><th>المدرب</th><th>القسم</th><th>الجلسات</th><th>الطلاب</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{trainers.map(trainer => <tr key={trainer.id}><td><span className="r02-person-cell"><i>{trainer.name.slice(0, 1)}</i><span><strong>{trainer.name}</strong><small>{trainer.specialty}</small></span></span></td><td><select value={trainer.department} onChange={event => onDepartmentChange(trainer.id, event.target.value)}>{departments.map(department => <option key={department.id}>{department.name}</option>)}</select></td><td><b>{trainer.sessions}</b> هذا الأسبوع</td><td>{trainer.students}</td><td><StatusBadge status={trainer.status === "active" ? "success" : trainer.status === "needs_review" ? "warning" : "info"} label={TRAINER_STATUS_LABELS[trainer.status]} /></td><td><button className="r02-plain-action" onClick={() => onToggle(trainer.id)}>{trainer.status === "active" ? "طلب مراجعة" : "تفعيل"}</button></td></tr>)}</tbody></table>{trainers.length === 0 && <div className="r02-ops-empty"><Search size={20} /><strong>لا يوجد مدربون مطابقون</strong><small>غيّر البحث أو فلتر القسم.</small></div>}</div></section>;
}
function ScheduleView({ sessions, weekOffset, setWeekOffset, departmentFilter, setDepartmentFilter, onAdd }: { sessions: WeekSession[]; weekOffset: number; setWeekOffset: (value: number | ((current: number) => number)) => void; departmentFilter: string; setDepartmentFilter: (value: string) => void; onAdd: () => void }) {
  const weekLabel = weekOffset === 0 ? "هذا الأسبوع" : weekOffset > 0 ? `الأسبوع القادم ${weekOffset > 1 ? `+${weekOffset - 1}` : ""}` : `الأسبوع السابق ${weekOffset < -1 ? `+${Math.abs(weekOffset) - 1}` : ""}`;
  return <><section className="r02-schedule-toolbar"><div className="r02-week-switcher"><button aria-label="الأسبوع السابق" onClick={() => setWeekOffset(value => value - 1)}><ChevronRight size={16} /></button><strong>{weekLabel}</strong><button aria-label="الأسبوع التالي" onClick={() => setWeekOffset(value => value + 1)}><ChevronLeft size={16} /></button></div><label><span>القسم</span><select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}><option value="all">كل الأقسام</option>{INITIAL_DEPARTMENTS.map(department => <option key={department.id}>{department.name}</option>)}</select></label><button className="r02-primary-action" onClick={onAdd}><Plus size={15} /> إضافة حصة</button></section><section className="r02-ops-panel r02-schedule-panel"><PanelHeading icon={<CalendarDays size={16} />} title="أسبوع فرع مدينة نصر" action={<span className="r02-ops-context"><Clock3 size={13} /> {sessions.length} حصص · {sessions.filter(item => item.status !== "confirmed").length} تحتاج متابعة</span>} /><div className="r02-week-grid">{DAYS.map(day => <div className="r02-day-column" key={day}><div className="r02-day-header"><strong>{day}</strong><small>{sessions.filter(session => session.day === day).length} حصص</small></div><div className="r02-day-sessions">{sessions.filter(session => session.day === day).map(session => <article className={`r02-session-card ${session.status}`} key={session.id}><div className="r02-session-time"><Clock3 size={12} /> {session.time}<small>{session.duration}</small></div><strong>{session.course}</strong><span>{session.trainer}</span><small>{session.room} · {session.department}</small><StatusBadge status={session.status === "confirmed" ? "success" : session.status === "needs_room" ? "danger" : "warning"} label={SESSION_STATUS_LABELS[session.status]} /></article>)}{sessions.filter(session => session.day === day).length === 0 && <div className="r02-day-empty">لا توجد حصص</div>}</div></div>)}</div></section><div className="r02-schedule-note"><ShieldCheck size={15} /><span><strong>قاعدة اعتماد الجدول:</strong> أي حصة جديدة أو تغيير في القاعة/المدرب تظهر بانتظار اعتماد مدير الفرع، مع منع تعارض القاعة أو المدرب قبل الحفظ.</span></div></>;
}
function SessionDialog({ value, departments, trainers, onChange, onClose, onSubmit }: { value: { day: string; time: string; course: string; department: string; trainer: string; room: string }; departments: Department[]; trainers: Trainer[]; onChange: (value: { day: string; time: string; course: string; department: string; trainer: string; room: string }) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="r02-dialog-backdrop"><div className="r02-dialog" role="dialog" aria-modal="true" aria-labelledby="r02-dialog-title"><div className="r02-dialog-head"><span><Plus size={17} /><h2 id="r02-dialog-title">إضافة حصة للجدول</h2></span><button onClick={onClose} aria-label="إغلاق"><X size={18} /></button></div><form onSubmit={onSubmit}><label>اسم الحصة<input autoFocus value={value.course} onChange={event => onChange({ ...value, course: event.target.value })} placeholder="مثال: برمجة للمبتدئين" /></label><div className="r02-form-grid"><label>اليوم<select value={value.day} onChange={event => onChange({ ...value, day: event.target.value })}>{DAYS.map(day => <option key={day}>{day}</option>)}</select></label><label>الوقت<input type="time" value={value.time} onChange={event => onChange({ ...value, time: event.target.value })} /></label><label>القسم<select value={value.department} onChange={event => onChange({ ...value, department: event.target.value })}>{departments.map(department => <option key={department.id}>{department.name}</option>)}</select></label><label>المدرب<select value={value.trainer} onChange={event => onChange({ ...value, trainer: event.target.value })}>{trainers.filter(trainer => trainer.status !== "on_leave").map(trainer => <option key={trainer.id}>{trainer.name}</option>)}</select></label><label>القاعة<select value={value.room} onChange={event => onChange({ ...value, room: event.target.value })}><option>معمل 1</option><option>معمل 2</option><option>قاعة 3</option></select></label></div><div className="r02-dialog-actions"><button type="button" onClick={onClose}>إلغاء</button><button className="r02-primary-action" type="submit">إضافة بانتظار الاعتماد</button></div></form></div></div>; }
function SummaryCard({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint: string; tone: string }) { return <article className="r02-summary-card"><span className={`r02-summary-icon ${tone}`}>{icon}</span><small>{label}</small><strong>{value}</strong><span>{hint}</span></article>; }
function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <span><small>{label}</small><strong>{value}</strong></span>; }
function PanelHeading({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) { return <div className="r02-panel-heading"><div><span>{icon}</span><h2>{title}</h2></div>{action}</div>; }
