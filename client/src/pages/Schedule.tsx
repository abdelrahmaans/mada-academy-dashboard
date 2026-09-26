import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
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
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SessionStatus = "scheduled" | "ongoing" | "completed" | "pending_approval" | "cancelled" | "rescheduled";
type SessionType = "regular" | "competition_training" | "competition_day";
type Session = {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  title: string;
  level: string;
  instructor: string;
  room: string;
  branch: string;
  enrolled: number;
  capacity: number;
  status: SessionStatus;
  type: SessionType;
};
type SessionTemplate = Omit<Session, "date" | "status"> & { day: number; baseStatus?: SessionStatus };
type SessionForm = Pick<Session, "date" | "startTime" | "duration" | "title" | "level" | "instructor" | "room" | "branch" | "type">;

const DAY_NAMES = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const BRANCHES = ["مدينة نصر", "المعادي", "الشيخ زايد"];
const INSTRUCTORS = ["مريم حسن", "عمر سامح", "سارة خالد", "يوسف عماد", "هبة محمود", "كريم عادل"];
const ROOMS = ["معمل 1", "معمل 2", "معمل الروبوتات", "قاعة الإبداع"];
const BASE_DATE = new Date(2026, 8, 26, 12, 0, 0);
const FIRST_HOUR = 9;
const LAST_HOUR = 18;
const HOUR_HEIGHT = 72;

const TEMPLATES: SessionTemplate[] = [
  { id: "s1", day: 0, startTime: "09:00", duration: 60, title: "روبوتكس مستوى 1", level: "المستوى التمهيدي · 7–9 سنوات", instructor: "يوسف عماد", room: "معمل الروبوتات", branch: "مدينة نصر", enrolled: 10, capacity: 14, type: "regular", baseStatus: "completed" },
  { id: "s2", day: 0, startTime: "12:00", duration: 90, title: "روبوتكس مستوى 2", level: "المستوى المتوسط · 10–12 سنة", instructor: "مريم حسن", room: "معمل 1", branch: "مدينة نصر", enrolled: 12, capacity: 16, type: "regular", baseStatus: "ongoing" },
  { id: "s3", day: 0, startTime: "12:00", duration: 90, title: "برمجة للمبتدئين", level: "المستوى التمهيدي · 7–9 سنوات", instructor: "عمر سامح", room: "معمل 2", branch: "مدينة نصر", enrolled: 8, capacity: 12, type: "regular" },
  { id: "s4", day: 0, startTime: "14:00", duration: 90, title: "دوائر إلكترونية", level: "المستوى المتقدم · 13–15 سنة", instructor: "سارة خالد", room: "معمل 1", branch: "المعادي", enrolled: 11, capacity: 14, type: "regular" },
  { id: "s5", day: 0, startTime: "16:00", duration: 90, title: "برمجة الألعاب", level: "المستوى المتوسط · 10–12 سنة", instructor: "كريم عادل", room: "قاعة الإبداع", branch: "الشيخ زايد", enrolled: 9, capacity: 12, type: "regular" },
  { id: "s6", day: 1, startTime: "10:00", duration: 90, title: "الذكاء الاصطناعي للصغار", level: "المستوى التمهيدي · 10–12 سنة", instructor: "هبة محمود", room: "معمل 2", branch: "المعادي", enrolled: 10, capacity: 14, type: "regular" },
  { id: "s7", day: 1, startTime: "12:00", duration: 90, title: "روبوتكس مستوى 1", level: "المستوى التمهيدي · 7–9 سنوات", instructor: "مريم حسن", room: "معمل الروبوتات", branch: "مدينة نصر", enrolled: 13, capacity: 16, type: "regular" },
  { id: "s8", day: 1, startTime: "15:00", duration: 60, title: "مهارات التفكير الإبداعي", level: "مهارات حياتية · 10–12 سنة", instructor: "هبة محمود", room: "قاعة الإبداع", branch: "الشيخ زايد", enrolled: 7, capacity: 12, type: "regular" },
  { id: "s9", day: 2, startTime: "11:00", duration: 90, title: "دوائر إلكترونية", level: "المستوى المتقدم · 13–15 سنة", instructor: "سارة خالد", room: "معمل 1", branch: "مدينة نصر", enrolled: 9, capacity: 14, type: "regular" },
  { id: "s10", day: 2, startTime: "13:00", duration: 90, title: "أساسيات البرمجة", level: "المستوى التمهيدي · 7–9 سنوات", instructor: "عمر سامح", room: "معمل 2", branch: "المعادي", enrolled: 8, capacity: 12, type: "regular" },
  { id: "s11", day: 3, startTime: "10:00", duration: 90, title: "روبوتكس مستوى 2", level: "المستوى المتوسط · 10–12 سنة", instructor: "مريم حسن", room: "معمل الروبوتات", branch: "مدينة نصر", enrolled: 12, capacity: 16, type: "regular" },
  { id: "s12", day: 3, startTime: "14:00", duration: 120, title: "تدريب مسابقة الروبوتات", level: "تدريب منافسات · 13–15 سنة", instructor: "يوسف عماد", room: "معمل 1", branch: "الشيخ زايد", enrolled: 8, capacity: 10, type: "competition_training", baseStatus: "pending_approval" },
  { id: "s13", day: 4, startTime: "10:00", duration: 90, title: "برمجة للمبتدئين", level: "المستوى التمهيدي · 7–9 سنوات", instructor: "عمر سامح", room: "معمل 2", branch: "مدينة نصر", enrolled: 10, capacity: 12, type: "regular" },
  { id: "s14", day: 4, startTime: "12:00", duration: 90, title: "الذكاء الاصطناعي للصغار", level: "المستوى المتوسط · 10–12 سنة", instructor: "هبة محمود", room: "قاعة الإبداع", branch: "المعادي", enrolled: 11, capacity: 14, type: "regular" },
  { id: "s15", day: 5, startTime: "11:00", duration: 90, title: "برمجة الألعاب", level: "المستوى المتوسط · 10–12 سنة", instructor: "كريم عادل", room: "معمل 2", branch: "الشيخ زايد", enrolled: 8, capacity: 12, type: "regular" },
  { id: "s16", day: 5, startTime: "15:00", duration: 90, title: "دوائر إلكترونية", level: "المستوى المتقدم · 13–15 سنة", instructor: "سارة خالد", room: "معمل 1", branch: "مدينة نصر", enrolled: 12, capacity: 14, type: "regular" },
  { id: "s17", day: 6, startTime: "10:00", duration: 180, title: "يوم المسابقة الشهرية", level: "فعالية أكاديمية · جميع المستويات", instructor: "يوسف عماد", room: "قاعة الإبداع", branch: "مدينة نصر", enrolled: 24, capacity: 30, type: "competition_day" },
];

const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "قادمة",
  ongoing: "جارية الآن",
  completed: "مكتملة",
  pending_approval: "تحتاج مراجعة",
  cancelled: "ملغاة",
  rescheduled: "أعيدت جدولتها",
};

const TYPE_LABELS: Record<SessionType, string> = {
  regular: "حصة منتظمة",
  competition_training: "تدريب مسابقة",
  competition_day: "يوم مسابقة",
};

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", options).format(date);
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "م" : "ص";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function seededSessions(): Session[] {
  const result: Session[] = [];
  for (let week = -3; week <= 6; week += 1) {
    const weekStart = addDays(BASE_DATE, week * 7);
    for (const template of TEMPLATES) {
      let status = template.baseStatus ?? "scheduled";
      if (week < 0 && status !== "pending_approval") status = "completed";
      if (week > 0 && (status === "completed" || status === "ongoing")) status = "scheduled";
      result.push({
        id: `${template.id}-w${week}`,
        date: toISODate(addDays(weekStart, template.day)),
        startTime: template.startTime,
        duration: template.duration,
        title: template.title,
        level: template.level,
        instructor: template.instructor,
        room: template.room,
        branch: template.branch,
        enrolled: template.enrolled,
        capacity: template.capacity,
        status,
        type: template.type,
      });
    }
  }
  return result;
}

function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="مدى">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M4 12.5 12.5 8l8.2 4.5v9.4l-8.2 4.6L4 21.9v-9.4Z" fill="currentColor" />
          <path d="m19.3 12.5 8.2-4.5 8.5 4.5v9.4l-8.5 4.6-8.2-4.6v-9.4Z" fill="currentColor" opacity=".72" />
          <path d="m11.5 24.1 8.3-4.6 8.2 4.6v8.2l-8.2 4.4-8.3-4.4v-8.2Z" fill="currentColor" opacity=".48" />
        </svg>
      </span>
      <span className="brand-word">مدى</span>
    </div>
  );
}

function SchedulePage() {
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<Session[]>(seededSessions);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("كل الفروع");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [view, setView] = useState<"week" | "day">(() => typeof window !== "undefined" && window.matchMedia("(max-width: 780px)").matches ? "day" : "week");
  const [statusFilter, setStatusFilter] = useState<"all" | SessionStatus>("all");
  const [instructorFilter, setInstructorFilter] = useState("الكل");
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsSession, setDetailsSession] = useState<Session | null>(null);
  const [form, setForm] = useState<SessionForm>(() => ({
    date: toISODate(BASE_DATE),
    startTime: "16:00",
    duration: 90,
    title: "",
    level: "المستوى التمهيدي",
    instructor: INSTRUCTORS[0],
    room: ROOMS[0],
    branch: BRANCHES[0],
    type: "regular",
  }));

  const weekStart = useMemo(() => addDays(BASE_DATE, weekOffset * 7), [weekOffset]);
  const days = useMemo(
    () => DAY_NAMES.map((name, index) => {
      const date = addDays(weekStart, index);
      return { name, date, iso: toISODate(date), index };
    }),
    [weekStart],
  );
  const visibleDays = view === "day" ? [days[selectedDay]] : days;
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const weekRecords = sessions.filter((session) => days.some((day) => day.iso === session.date));
  const matchingSessions = useMemo(
    () => weekRecords.filter((session) => {
      const textMatch = !normalizedQuery || [session.title, session.level, session.instructor, session.room, session.branch, session.startTime]
        .some((value) => value.toLocaleLowerCase("ar").includes(normalizedQuery));
      const branchMatch = branch === "كل الفروع" || session.branch === branch;
      const instructorMatch = instructorFilter === "الكل" || session.instructor === instructorFilter;
      const statusMatch = statusFilter === "all" || session.status === statusFilter;
      const dayMatch = view !== "day" || session.date === days[selectedDay].iso;
      return textMatch && branchMatch && instructorMatch && statusMatch && dayMatch;
    }),
    [weekRecords, normalizedQuery, branch, instructorFilter, statusFilter, view, days, selectedDay],
  );
  const instructors = useMemo(() => ["الكل", ...Array.from(new Set(weekRecords.map((session) => session.instructor)))], [weekRecords]);
  const todayCount = sessions.filter((session) => session.date === days[0].iso).length;
  const weekCount = weekRecords.length;
  const reviewCount = weekRecords.filter((session) => session.status === "pending_approval").length;
  const roomCount = new Set(weekRecords.map((session) => session.room)).size;

  const comingSoon = (label: string) => {
    toast("القسم قيد التجهيز", { description: `هنبدأ في تطوير «${label}» في المرحلة التالية.` });
    setMobileNavOpen(false);
  };

  const shiftSelection = (direction: -1 | 1) => {
    if (view === "week") {
      setWeekOffset((offset) => offset + direction);
      return;
    }
    if (selectedDay + direction < 0) {
      setWeekOffset((offset) => offset - 1);
      setSelectedDay(6);
    } else if (selectedDay + direction > 6) {
      setWeekOffset((offset) => offset + 1);
      setSelectedDay(0);
    } else {
      setSelectedDay((day) => day + direction);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setBranch("كل الفروع");
    setInstructorFilter("الكل");
    setStatusFilter("all");
  };

  const openAddDialog = () => {
    const date = view === "day" ? days[selectedDay].iso : toISODate(weekStart);
    setEditingId(null);
    setForm({ date, startTime: "16:00", duration: 90, title: "", level: "المستوى التمهيدي", instructor: INSTRUCTORS[0], room: ROOMS[0], branch: branch === "كل الفروع" ? BRANCHES[0] : branch, type: "regular" });
    setDialogMode("add");
  };

  const openEditDialog = (session: Session) => {
    setEditingId(session.id);
    setForm({ date: session.date, startTime: session.startTime, duration: session.duration, title: session.title, level: session.level, instructor: session.instructor, room: session.room, branch: session.branch, type: session.type });
    setDetailsSession(null);
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingId(null);
  };

  const handleSessionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const start = minutesFromTime(form.startTime);
    const end = start + Number(form.duration);
    const conflict = sessions.find((session) => {
      if (session.id === editingId || session.date !== form.date || session.status === "cancelled") return false;
      const sessionStart = minutesFromTime(session.startTime);
      const sessionEnd = sessionStart + session.duration;
      const overlaps = start < sessionEnd && sessionStart < end;
      return overlaps && (session.room === form.room || session.instructor === form.instructor);
    });
    if (conflict) {
      const resource = conflict.room === form.room ? `قاعة ${form.room}` : `جدول الكوتش ${form.instructor}`;
      toast.error("في تعارض محتمل في الجدول", { description: `الحصة تتداخل مع «${conflict.title}» في ${resource}. غيّر الوقت أو المورد قبل الحفظ.` });
      return;
    }
    if (dialogMode === "edit" && editingId) {
      setSessions((current) => current.map((session) => session.id === editingId ? { ...session, ...form, duration: Number(form.duration) } : session));
      toast.success("اتحدّثت بيانات الحصة", { description: "التغيير محفوظ محليًا في العرض التجريبي فقط." });
    } else {
      const created: Session = { id: `local-${Date.now()}`, ...form, duration: Number(form.duration), enrolled: 0, capacity: 16, status: "scheduled" };
      setSessions((current) => [created, ...current]);
      const targetDay = days.find((day) => day.iso === form.date);
      const chosenDate = fromISODate(form.date);
      setWeekOffset(Math.floor((chosenDate.getTime() - BASE_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000)));
      setSelectedDay(targetDay?.index ?? ((chosenDate.getDay() + 1) % 7));
      toast.success("اتضافت الحصة", { description: "اتضافت لبيانات العرض التجريبية، من غير حفظ على خادم." });
    }
    closeDialog();
  };

  const cancelSession = (session: Session) => {
    setSessions((current) => current.map((item) => item.id === session.id ? { ...item, status: "cancelled" } : item));
    setDetailsSession(null);
    toast.success("اتعلّمت الحصة كملغاة", { description: "التغيير محلي للعرض التجريبي فقط." });
  };

  const filteredTabs: { key: "all" | SessionStatus; label: string }[] = [
    { key: "all", label: "كل الحصص" },
    { key: "scheduled", label: "قادمة" },
    { key: "pending_approval", label: "تحتاج مراجعة" },
    { key: "completed", label: "مكتملة" },
    { key: "cancelled", label: "ملغاة" },
  ];

  return (
    <div className="app-shell" dir="rtl">
      {mobileNavOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><BrandMark /><button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={() => setMobileNavOpen(false)}><X size={19} /></button></div>
        <div className="academy-switcher"><span className="academy-avatar"><GraduationCap size={20} /></span><span className="academy-meta"><strong>أكاديمية مدى</strong><small>إدارة الأكاديمية</small></span><ChevronDown size={15} className="switcher-chevron" /></div>
        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="primary-nav" aria-label="القائمة الرئيسية">
          <button className="nav-link" onClick={() => navigate("/")}><LayoutDashboard size={19} /><span>الرئيسية</span></button>
          <button className="nav-link" onClick={() => navigate("/students")}><Users size={19} /><span>الطلاب</span><span className="nav-count">248</span></button>
          <button className="nav-link active" aria-current="page"><CalendarDays size={19} /><span>الجدول</span></button>
          <button className="nav-link" onClick={() => comingSoon("الحصص والكورسات")}><BookOpen size={19} /><span>الحصص والكورسات</span></button>
          <button className="nav-link" onClick={() => comingSoon("المسابقات")}><Sparkles size={19} /><span>المسابقات</span></button>
        </nav>
        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link" onClick={() => comingSoon("المالية والتحصيل")}><Wallet size={19} /><span>المالية والتحصيل</span></button>
          <button className="nav-link" onClick={() => comingSoon("التقارير والتحليلات")}><Activity size={19} /><span>التقارير والتحليلات</span></button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>محتاج مساعدة؟</strong><span>مركز الدعم والإرشادات</span></div><ChevronLeft size={16} /></div>
        <div className="sidebar-bottom"><button className="nav-link" onClick={() => comingSoon("الإعدادات")}><Settings size={19} /><span>الإعدادات</span></button><button className="nav-link" onClick={() => toast("تم تسجيل الخروج التجريبي")}><LogOut size={19} /><span>تسجيل الخروج</span></button></div>
        <div className="sidebar-version">مدى لإدارة الأكاديميات <span>نسخة تجريبية</span></div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
            <div className="branch-select-wrap">
              <button className={`branch-select ${branchMenuOpen ? "is-open" : ""}`} aria-expanded={branchMenuOpen} onClick={() => setBranchMenuOpen((open) => !open)}><span className="branch-icon"><MapPin size={17} /></span><span>{branch === "كل الفروع" ? branch : `فرع ${branch}`}</span><ChevronDown size={15} /></button>
              {branchMenuOpen && <div className="branch-menu"><button className={branch === "كل الفروع" ? "selected" : ""} onClick={() => { setBranch("كل الفروع"); setBranchMenuOpen(false); }}>كل الفروع</button>{BRANCHES.map((item) => <button className={branch === item ? "selected" : ""} key={item} onClick={() => { setBranch(item); setBranchMenuOpen(false); }}><MapPin size={15} />فرع {item}</button>)}</div>}
            </div>
            <label className="top-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن حصة أو كوتش..." aria-label="ابحث عن حصة أو كوتش" /><kbd>⌘ K</kbd></label>
          </div>
          <div className="topbar-left"><button className="icon-button notification-button" aria-label="الإشعارات" onClick={() => toast("لا توجد إشعارات جديدة")}><Bell size={18} /></button><span className="topbar-divider" /><button className="profile-button" onClick={() => toast("إعدادات الحساب قيد التجهيز")}><span className="profile-copy"><strong>أحمد محمود</strong><small>مدير الفرع</small></span><span className="profile-avatar">أم</span><ChevronDown size={14} /></button></div>
        </header>

        <div className="workspace schedule-workspace">
          <div className="students-breadcrumb"><button onClick={() => navigate("/")}>الرئيسية</button><ChevronLeft size={13} /><span>الجدول</span></div>
          <section className="students-welcome schedule-welcome">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> تخطيط الحصص والفصول</div><h1>الجدول</h1><p>نظّم حصص الأسبوع وتابع الكوتشيز والقاعات من شاشة واحدة.</p></div>
            <div className="welcome-actions"><button className="button button-secondary" onClick={() => toast("التصدير متاح بعد ربط بيانات الجدول الحقيقية")}><ArrowRightLeft size={16} /> مشاركة العرض</button><button className="button button-primary" onClick={openAddDialog}><Plus size={18} /> إضافة حصة</button></div>
          </section>

          <section className="schedule-stats" aria-label="ملخص الجدول">
            <article className="schedule-stat"><span className="schedule-stat-icon icon-teal"><CalendarDays size={17} /></span><div><small>حصص هذا الأسبوع</small><strong>{weekCount}</strong></div><span className="schedule-stat-note">في {branch === "كل الفروع" ? "كل الفروع" : branch}</span></article>
            <article className="schedule-stat"><span className="schedule-stat-icon icon-blue"><Clock3 size={17} /></span><div><small>حصص السبت</small><strong>{todayCount}</strong></div><span className="schedule-stat-note">26 سبتمبر</span></article>
            <article className="schedule-stat"><span className="schedule-stat-icon icon-amber"><AlertCircle size={17} /></span><div><small>تحتاج مراجعة</small><strong>{reviewCount}</strong></div><span className="schedule-stat-note">موافقة مطلوبة</span></article>
            <article className="schedule-stat"><span className="schedule-stat-icon icon-violet"><MapPin size={17} /></span><div><small>قاعات مستخدمة</small><strong>{roomCount}</strong></div><span className="schedule-stat-note">هذا الأسبوع</span></article>
          </section>

          <section className="panel schedule-board-panel" aria-label="الجدول الأسبوعي للحصص">
            <div className="schedule-board-heading">
              <div className="panel-title-group"><span className="panel-icon panel-icon-teal"><CalendarDays size={18} /></span><div><h2>مواعيد الحصص</h2><p>عرض أسبوعي — السبت إلى الجمعة</p></div></div>
              <div className="schedule-date-tools">
                <button className="button button-secondary schedule-today" onClick={() => { setWeekOffset(0); setSelectedDay(0); }}>اليوم</button>
                <div className="schedule-nav-arrows"><button aria-label={view === "week" ? "الأسبوع السابق" : "اليوم السابق"} onClick={() => shiftSelection(-1)}><ChevronRight size={17} /></button><button aria-label={view === "week" ? "الأسبوع التالي" : "اليوم التالي"} onClick={() => shiftSelection(1)}><ChevronLeft size={17} /></button></div>
                <strong className="schedule-range">{formatDate(weekStart, { day: "numeric", month: "long" })} — {formatDate(addDays(weekStart, 6), { day: "numeric", month: "long", year: "numeric" })}</strong>
              </div>
            </div>

            <div className="schedule-toolbar">
              <div className="schedule-filter-tabs" role="tablist" aria-label="تصفية حسب حالة الحصة">
                {filteredTabs.map((tab) => <button key={tab.key} role="tab" aria-selected={statusFilter === tab.key} className={`schedule-filter-tab ${statusFilter === tab.key ? "active" : ""}`} onClick={() => setStatusFilter(tab.key)}>{tab.label}{tab.key === "pending_approval" && reviewCount > 0 && <span>{reviewCount}</span>}</button>)}
              </div>
              <div className="schedule-toolbar-controls">
                <label className="schedule-select"><Users size={15} /><select aria-label="فلترة حسب الكوتش" value={instructorFilter} onChange={(event) => setInstructorFilter(event.target.value)}>{instructors.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
                <div className="schedule-view-switch" role="tablist" aria-label="طريقة عرض الجدول"><button role="tab" aria-selected={view === "week"} className={view === "week" ? "active" : ""} onClick={() => setView("week")}>أسبوع</button><button role="tab" aria-selected={view === "day"} className={view === "day" ? "active" : ""} onClick={() => setView("day")}>يوم</button></div>
              </div>
            </div>

            <section className="schedule-mobile-day-picker" aria-label="اختيار يوم الأسبوع">{days.map((day) => <button key={day.iso} className={selectedDay === day.index ? "active" : ""} onClick={() => { setSelectedDay(day.index); setView("day"); }}><span>{day.name.slice(0, 2)}</span><strong>{formatDate(day.date, { day: "numeric" })}</strong></button>)}</section>
            <div className="schedule-calendar-scroll" aria-label="تقويم الحصص">
              <div className={`schedule-calendar ${view === "day" ? "is-day-view" : ""}`}>
                <div className="calendar-header-row">
                  <div className="calendar-time-heading"><span>التوقيت</span></div>
                  {visibleDays.map((day) => <button key={day.iso} className={`calendar-day-heading ${day.index === selectedDay ? "selected" : ""}`} onClick={() => setSelectedDay(day.index)}><span>{day.name}</span><strong>{formatDate(day.date, { day: "numeric" })}</strong><small>{formatDate(day.date, { month: "short" })}</small>{day.index === 0 && weekOffset === 0 && <i>اليوم</i>}</button>)}
                </div>
                <div className="calendar-body-row">
                  <div className="calendar-time-rail">{Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, index) => FIRST_HOUR + index).map((hour) => <div className="calendar-time-label" key={hour}><span>{String(hour % 12 || 12).padStart(2, "0")}:00</span><small>{hour < 12 ? "ص" : "م"}</small></div>)}</div>
                  {visibleDays.map((day) => {
                    const daySessions = matchingSessions.filter((session) => session.date === day.iso);
                    return <div className="calendar-day-track" key={day.iso}>
                      {daySessions.map((session) => {
                        const start = minutesFromTime(session.startTime);
                        const top = ((start - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT + 4;
                        const height = Math.max(62, (session.duration / 60) * HOUR_HEIGHT - 8);
                        const inView = start >= FIRST_HOUR * 60 && start < LAST_HOUR * 60;
                        if (!inView) return null;
                        return <button key={session.id} className={`calendar-session-card tone-${session.type} state-${session.status}`} style={{ top, height }} onClick={() => setDetailsSession(session)} aria-label={`${session.title}، ${timeLabel(session.startTime)}، ${session.instructor}`}>
                          <span className="session-card-time"><Clock3 size={11} />{timeLabel(session.startTime)}</span><strong>{session.title}</strong><small>{session.instructor} <i /> {session.room}</small>{height > 88 && <span className="session-card-status">{STATUS_LABELS[session.status]}</span>}
                        </button>;
                      })}
                      {daySessions.length === 0 && <div className="calendar-day-empty"><span>لا توجد حصص مطابقة</span></div>}
                    </div>;
                  })}
                </div>
              </div>
            </div>
            <div className="schedule-board-footer"><span><i className="legend-status legend-scheduled" /> قادمة</span><span><i className="legend-status legend-live" /> جارية</span><span><i className="legend-status legend-review" /> تحتاج مراجعة</span><small><Clock3 size={13} /> ساعات العرض من 9 ص إلى 6 م</small></div>
          </section>

          <div className="students-demo-note"><AlertCircle size={14} /><span>بيانات الحصص والكوتشيز والقاعات المعروضة توضيحية ومولّدة للعرض فقط؛ لا تتصل بقاعدة بيانات. فحص التعارض داخل النموذج محلي ومبدئي.</span></div>
          <footer className="workspace-footer"><span>© مدى 2026</span><span>واجهة تجريبية — إصدار 0.1</span></footer>
        </div>
      </main>

      {detailsSession && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsSession(null); }}><section className="student-dialog schedule-details-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-details-title"><div className="dialog-top"><span className="dialog-mark"><CalendarDays size={20} /></span><button className="icon-button" aria-label="إغلاق" onClick={() => setDetailsSession(null)}><X size={18} /></button></div><div className="schedule-detail-heading"><h2 id="schedule-details-title">{detailsSession.title}</h2><span className={`schedule-status-badge status-${detailsSession.status}`}><i />{STATUS_LABELS[detailsSession.status]}</span></div><p className="schedule-detail-subtitle">{detailsSession.level}</p><div className="schedule-detail-grid"><div><small>اليوم والتاريخ</small><strong><CalendarDays size={14} />{DAY_NAMES[fromISODate(detailsSession.date).getDay() === 6 ? 0 : (fromISODate(detailsSession.date).getDay() + 1) % 7]}، {formatDate(fromISODate(detailsSession.date), { day: "numeric", month: "long", year: "numeric" })}</strong></div><div><small>وقت الحصة</small><strong><Clock3 size={14} /><span dir="ltr">{timeLabel(detailsSession.startTime)} · {detailsSession.duration} دقيقة</span></strong></div><div><small>الكوتش</small><strong><Users size={14} />{detailsSession.instructor}</strong></div><div><small>القاعة والفرع</small><strong><MapPin size={14} />{detailsSession.room} · {detailsSession.branch}</strong></div><div><small>تسجيل الطلاب</small><strong><CheckCircle2 size={14} /><span dir="ltr">{detailsSession.enrolled} / {detailsSession.capacity}</span></strong></div><div><small>نوع الحصة</small><strong><BookOpen size={14} />{TYPE_LABELS[detailsSession.type]}</strong></div></div><div className="dialog-info"><AlertCircle size={15} /><span>تفاصيل هذه الحصة توضيحية ولا تمثل سجلًا حقيقيًا.</span></div><div className="dialog-actions"><button className="button button-secondary" onClick={() => cancelSession(detailsSession)} disabled={detailsSession.status === "cancelled"}>إلغاء الحصة</button><button className="button button-primary" onClick={() => openEditDialog(detailsSession)}><Check size={15} /> تعديل الحصة</button></div></section></div>}

      {dialogMode && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}><section className="student-dialog schedule-form-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-form-title"><div className="dialog-top"><span className="dialog-mark"><CalendarDays size={20} /></span><button className="icon-button" aria-label="إغلاق" onClick={closeDialog}><X size={18} /></button></div><h2 id="schedule-form-title">{dialogMode === "edit" ? "تعديل الحصة" : "إضافة حصة للجدول"}</h2><p>بيانات توضيحية تُحفظ محليًا أثناء العرض فقط.</p><form onSubmit={handleSessionSubmit}>
        <label className="form-field"><span>اسم الحصة <b>*</b></span><input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="مثال: روبوتكس مستوى 1" /></label>
        <div className="form-row"><label className="form-field"><span>التاريخ <b>*</b></span><input required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label><label className="form-field"><span>بداية الحصة <b>*</b></span><input required type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} /></label></div>
        <div className="form-row"><label className="form-field"><span>الكوتش <b>*</b></span><select value={form.instructor} onChange={(event) => setForm((current) => ({ ...current, instructor: event.target.value }))}>{INSTRUCTORS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-field"><span>القاعة <b>*</b></span><select value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))}>{ROOMS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        <div className="form-row"><label className="form-field"><span>الفرع</span><select value={form.branch} onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}>{BRANCHES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-field"><span>المدة</span><select value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value) }))}><option value={60}>60 دقيقة</option><option value={90}>90 دقيقة</option><option value={120}>120 دقيقة</option><option value={180}>180 دقيقة</option></select></label></div>
        <label className="form-field"><span>نوع الحصة</span><select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as SessionType }))}>{Object.entries(TYPE_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <div className="dialog-info"><AlertCircle size={15} /><span>المحاكاة تمنع تداخل المواعيد محليًا حسب الكوتش أو القاعة فقط.</span></div><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={closeDialog}>إلغاء</button><button type="submit" className="button button-primary"><Plus size={16} />{dialogMode === "edit" ? "حفظ التعديل" : "إضافة للجدول"}</button></div>
      </form></section></div>}
    </div>
  );
}

export default SchedulePage;
