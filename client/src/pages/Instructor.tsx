import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type WorkspaceView =
  | "overview"
  | "attendance"
  | "evaluations"
  | "achievements"
  | "profile";
type AttendanceStatus = "unmarked" | "present" | "absent" | "late" | "excused";
type SessionStatus = "in_progress" | "upcoming" | "completed";
type InstructorStudent = {
  id: string;
  name: string;
  age: number;
  initials: string;
  color: string;
  parent: string;
};
type InstructorSession = {
  id: string;
  title: string;
  level: string;
  date: string;
  dateLabel: string;
  time: string;
  room: string;
  status: SessionStatus;
  students: InstructorStudent[];
};
type AttendanceRecord = { status: AttendanceStatus; lateMinutes: number };
type Evaluation = {
  scores: Record<string, number>;
  comment: string;
  cardStatus: "ready";
  updatedAt: string;
};

const INSTRUCTOR = "مريم حسن";
const BRANCH = "مدينة نصر";
const RUBRIC = [
  {
    id: "understanding",
    title: "استيعاب الفكرة",
    hint: "يفهم المفاهيم والخطوات الأساسية",
  },
  {
    id: "practice",
    title: "التطبيق العملي",
    hint: "يستخدم الأدوات ويكمل المهمة",
  },
  {
    id: "collaboration",
    title: "التعاون والمبادرة",
    hint: "يشارك ويتعاون مع زملائه",
  },
];
const ROSTER: InstructorStudent[] = [
  {
    id: "ST-0248",
    name: "ياسين محمد علي",
    age: 11,
    initials: "يع",
    color: "teal",
    parent: "محمد علي",
  },
  {
    id: "ST-0246",
    name: "عمر خالد إبراهيم",
    age: 13,
    initials: "عإ",
    color: "blue",
    parent: "نهى إبراهيم",
  },
  {
    id: "ST-0244",
    name: "آدم شريف حسن",
    age: 14,
    initials: "آح",
    color: "navy",
    parent: "شريف حسن",
  },
  {
    id: "ST-0242",
    name: "سيف مصطفى عادل",
    age: 14,
    initials: "سع",
    color: "violet",
    parent: "مصطفى عادل",
  },
  {
    id: "ST-0240",
    name: "ملك حسام الدين",
    age: 10,
    initials: "مح",
    color: "amber",
    parent: "حسام الدين",
  },
  {
    id: "ST-0238",
    name: "ليلى أحمد محمود",
    age: 11,
    initials: "لم",
    color: "rose",
    parent: "أحمد محمود",
  },
];
const SESSIONS: InstructorSession[] = [
  {
    id: "SES-NSR-0926-02",
    title: "روبوتكس مستوى 2",
    level: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "12:00 – 01:30 م",
    room: "معمل 1",
    status: "in_progress",
    students: ROSTER,
  },
  {
    id: "SES-NSR-0926-05",
    title: "أساسيات تصميم الروبوت",
    level: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "03:00 – 04:30 م",
    room: "معمل الروبوتات",
    status: "upcoming",
    students: ROSTER.slice(0, 5),
  },
  {
    id: "SES-NSR-0927-01",
    title: "مشروع الحركة الذكية",
    level: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-27",
    dateLabel: "الأحد 27 سبتمبر",
    time: "10:00 – 11:30 ص",
    room: "معمل 2",
    status: "upcoming",
    students: ROSTER.slice(1, 6),
  },
  {
    id: "SES-NSR-0925-03",
    title: "روبوتكس مستوى 2",
    level: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-25",
    dateLabel: "الجمعة 25 سبتمبر",
    time: "04:00 – 05:30 م",
    room: "معمل 1",
    status: "completed",
    students: ROSTER.slice(0, 5),
  },
];
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  unmarked: "لم يسجل",
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};
const SESSION_STATUS: Record<SessionStatus, string> = {
  in_progress: "جارية الآن",
  upcoming: "قادمة",
  completed: "مكتملة",
};
const INITIAL_ATTENDANCE: Record<string, Record<string, AttendanceRecord>> = {
  "SES-NSR-0926-02": {
    "ST-0248": { status: "present", lateMinutes: 0 },
    "ST-0246": { status: "present", lateMinutes: 0 },
    "ST-0244": { status: "late", lateMinutes: 8 },
    "ST-0242": { status: "present", lateMinutes: 0 },
    "ST-0240": { status: "unmarked", lateMinutes: 0 },
    "ST-0238": { status: "unmarked", lateMinutes: 0 },
  },
  "SES-NSR-0925-03": {
    "ST-0248": { status: "present", lateMinutes: 0 },
    "ST-0246": { status: "present", lateMinutes: 0 },
    "ST-0244": { status: "absent", lateMinutes: 0 },
    "ST-0242": { status: "present", lateMinutes: 0 },
    "ST-0240": { status: "excused", lateMinutes: 0 },
  },
};
const INITIAL_EVALUATIONS: Record<string, Evaluation> = {
  "SES-NSR-0925-03:ST-0248": {
    scores: { understanding: 4, practice: 5, collaboration: 4 },
    comment: "نفّذ التحدي باستقلالية وشرح فكرته لزميله.",
    cardStatus: "ready",
    updatedAt: "أمس · 05:34 م",
  },
};
const STUDENT_PROGRESS = [
  {
    id: "ST-0248",
    name: "ياسين محمد علي",
    initials: "يع",
    color: "teal",
    track: "روبوتكس مستوى 2",
    progress: 86,
    attendance: 96,
    average: 4.4,
    milestone: "أتقن التحدي الأخير باستقلالية",
  },
  {
    id: "ST-0246",
    name: "عمر خالد إبراهيم",
    initials: "عإ",
    color: "blue",
    track: "روبوتكس مستوى 2",
    progress: 72,
    attendance: 88,
    average: 4.0,
    milestone: "تحسن في التطبيق العملي",
  },
  {
    id: "ST-0244",
    name: "آدم شريف حسن",
    initials: "آح",
    color: "navy",
    track: "روبوتكس مستوى 2",
    progress: 64,
    attendance: 79,
    average: 3.7,
    milestone: "يحتاج دعمًا في شرح الفكرة",
  },
  {
    id: "ST-0240",
    name: "ملك حسام الدين",
    initials: "مح",
    color: "amber",
    track: "أساسيات تصميم الروبوت",
    progress: 91,
    attendance: 100,
    average: 4.8,
    milestone: "مرشحة لشارة الإبداع",
  },
];
const INSTRUCTOR_MILESTONES = [
  { label: "بطاقات تقييم جاهزة", value: "12", hint: "هذا الشهر", icon: Star },
  {
    label: "متوسط حضور الطلاب",
    value: "91%",
    hint: "آخر 30 يومًا",
    icon: CalendarCheck,
  },
  {
    label: "طلاب تحسنوا",
    value: "8",
    hint: "مقارنة بالجولة السابقة",
    icon: ArrowUpRight,
  },
];

function InstructorBrand() {
  return (
    <div className="instructor-brand" aria-label="مدى">
      <span className="instructor-brand-mark" aria-hidden="true">
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
      <span>مدى</span>
      <small>مساحة المدرب</small>
    </div>
  );
}

export default function Instructor() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<WorkspaceView>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return requested === "attendance" ||
      requested === "evaluations" ||
      requested === "achievements" ||
      requested === "profile"
      ? requested
      : "overview";
  });
  const rosterSearchRef = useRef<HTMLInputElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(SESSIONS[0].id);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [attendanceSaved, setAttendanceSaved] = useState<
    Record<string, boolean>
  >({
    "SES-NSR-0925-03": true,
  });
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(ROSTER[0].id);
  const [scores, setScores] = useState<Record<string, number>>({
    understanding: 4,
    practice: 4,
    collaboration: 4,
  });
  const [comment, setComment] = useState("");
  const [evaluations, setEvaluations] = useState(INITIAL_EVALUATIONS);
  const [previewEvaluation, setPreviewEvaluation] = useState(false);
  const [sentCards, setSentCards] = useState<Record<string, boolean>>({});

  const selectedSession =
    SESSIONS.find(item => item.id === selectedSessionId) ?? SESSIONS[0];
  const selectedStudent =
    selectedSession.students.find(item => item.id === selectedStudentId) ??
    selectedSession.students[0];
  const selectedAttendance = attendance[selectedSession.id] ?? {};
  const visibleRoster = useMemo(() => {
    const needle = studentQuery.trim().toLocaleLowerCase("ar");
    return selectedSession.students.filter(student =>
      [student.name, student.id].some(value =>
        value.toLocaleLowerCase("ar").includes(needle)
      )
    );
  }, [selectedSession, studentQuery]);
  const attendanceSummary = useMemo(() => {
    const records = selectedSession.students.map(
      student => selectedAttendance[student.id]?.status ?? "unmarked"
    );
    return {
      present: records.filter(status => status === "present").length,
      late: records.filter(status => status === "late").length,
      absent: records.filter(status => status === "absent").length,
      excused: records.filter(status => status === "excused").length,
      unmarked: records.filter(status => status === "unmarked").length,
      total: records.length,
    };
  }, [selectedAttendance, selectedSession]);
  const completedSessionCount = SESSIONS.filter(
    item => item.status === "completed"
  ).length;
  const todaySessionCount = SESSIONS.filter(
    item => item.date === "2026-09-26"
  ).length;
  const selectedEvaluationKey = `${selectedSession.id}:${selectedStudent?.id ?? ""}`;
  const savedEvaluation = evaluations[selectedEvaluationKey];
  const evaluationCount = Object.keys(evaluations).length;
  const sessionProgress = Math.round(
    ((attendanceSummary.total - attendanceSummary.unmarked) /
      attendanceSummary.total) *
      100
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState({}, "", url);
  }, [view]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "k"
      ) {
        event.preventDefault();
        if (view !== "attendance") setView("attendance");
        requestAnimationFrame(() => rosterSearchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [view]);

  const selectSession = (id: string) => {
    const next = SESSIONS.find(item => item.id === id);
    if (!next) return;
    setSelectedSessionId(id);
    setSelectedStudentId(next.students[0]?.id ?? "");
    setStudentQuery("");
    setComment("");
    setScores({ understanding: 4, practice: 4, collaboration: 4 });
    setPreviewEvaluation(false);
  };

  const setAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(current => ({
      ...current,
      [selectedSession.id]: {
        ...(current[selectedSession.id] ?? {}),
        [studentId]: {
          status,
          lateMinutes:
            status === "late"
              ? current[selectedSession.id]?.[studentId]?.lateMinutes || 5
              : 0,
        },
      },
    }));
    setAttendanceSaved(current => ({
      ...current,
      [selectedSession.id]: false,
    }));
  };

  const changeLateMinutes = (studentId: string, value: number) => {
    setAttendance(current => ({
      ...current,
      [selectedSession.id]: {
        ...(current[selectedSession.id] ?? {}),
        [studentId]: {
          status: "late",
          lateMinutes: Math.max(1, value || 1),
        },
      },
    }));
    setAttendanceSaved(current => ({
      ...current,
      [selectedSession.id]: false,
    }));
  };

  const saveAttendance = (event: FormEvent) => {
    event.preventDefault();
    if (attendanceSummary.unmarked > 0) {
      toast.error("سجّل حالة كل طالب قبل تأكيد الحضور", {
        description: `ما زال هناك ${attendanceSummary.unmarked} طالب بدون حالة.`,
      });
      return;
    }
    setAttendanceSaved(current => ({ ...current, [selectedSession.id]: true }));
    toast.success("تم تأكيد حضور الجلسة في المعاينة", {
      description: "لن يُرسل الإجراء إلى نظام الحضور الفعلي.",
    });
  };

  const saveEvaluation = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedStudent) return;
    const savedAt = new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
    setEvaluations(current => ({
      ...current,
      [selectedEvaluationKey]: {
        scores: { ...scores },
        comment: comment.trim(),
        cardStatus: "ready",
        updatedAt: savedAt,
      },
    }));
    setPreviewEvaluation(true);
    setSentCards(current => ({ ...current, [selectedEvaluationKey]: false }));
    toast.success("تم حفظ التقييم محليًا", {
      description: "بطاقة التقييم التجريبية أصبحت جاهزة للمعاينة.",
    });
  };

  const sendEvaluationCard = () => {
    if (!savedEvaluation) return;
    setSentCards(current => ({ ...current, [selectedEvaluationKey]: true }));
    toast.success("تم تجهيز البطاقة للإرسال", {
      description: "الإرسال للأسرة محاكى محليًا في هذه المرحلة.",
    });
  };

  const showComingSoon = (label: string) => {
    toast("قسم توضيحي", {
      description: `قسم «${label}» سيُنفذ في مرحلة مستقلة.`,
    });
    setMobileNavOpen(false);
  };

  const navItems = [
    { id: "overview" as const, label: "الرئيسية", icon: LayoutDashboard },
    { id: "attendance" as const, label: "الحضور والغياب", icon: CalendarCheck },
    { id: "evaluations" as const, label: "تقييم الطلاب", icon: Star },
  ];

  return (
    <div className="instructor-shell" dir="rtl">
      <div
        className={`instructor-mobile-backdrop ${mobileNavOpen ? "is-open" : ""}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <aside className={`instructor-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <InstructorBrand />
        <div className="instructor-role-badge">
          <span className="instructor-avatar">م</span>
          <span>
            <strong>{INSTRUCTOR}</strong>
            <small>مدرب · فرع {BRANCH}</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="instructor-nav-label">مساحة عملي</div>
        <nav className="instructor-nav" aria-label="قائمة المدرب">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? "active" : ""}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => {
                  setView(item.id);
                  setMobileNavOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === "attendance" && attendanceSummary.unmarked > 0 && (
                  <b className="instructor-nav-count">
                    {attendanceSummary.unmarked}
                  </b>
                )}
              </button>
            );
          })}
          <button
            className={view === "achievements" ? "active" : ""}
            aria-current={view === "achievements" ? "page" : undefined}
            onClick={() => {
              setView("achievements");
              setMobileNavOpen(false);
            }}
          >
            <Sparkles size={18} />
            <span>الإنجازات</span>
          </button>
          <button
            className={view === "profile" ? "active" : ""}
            aria-current={view === "profile" ? "page" : undefined}
            onClick={() => {
              setView("profile");
              setMobileNavOpen(false);
            }}
          >
            <ShieldCheck size={18} />
            <span>ملفي الشخصي</span>
          </button>
        </nav>
        <div className="instructor-sidebar-spacer" />
        <button
          className="instructor-help"
          onClick={() => showComingSoon("مركز المساعدة")}
        >
          <span>
            <MessageCircle size={17} />
          </span>
          <span>
            <strong>محتاج مساعدة؟</strong>
            <small>مركز الدعم والإرشادات</small>
          </span>
          <ChevronLeft size={14} />
        </button>
        <div className="instructor-scope-note">
          <ShieldCheck size={16} />
          <span>
            <strong>نطاق صلاحيتك</strong>
            <small>جلساتك وطلابك فقط</small>
          </span>
        </div>
        <div className="instructor-sidebar-version">
          مدى لإدارة الأكاديميات <span>نسخة تجريبية</span>
        </div>
      </aside>

      <main className="instructor-main">
        <header className="instructor-topbar">
          <div className="instructor-topbar-start">
            <button
              className="instructor-icon-button instructor-mobile-menu"
              aria-label="فتح القائمة"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(value => !value)}
            >
              <Menu size={20} />
            </button>
            <span className="instructor-branch-pill">
              <MapPin size={15} /> فرع {BRANCH}
            </span>
            <div className="instructor-live-pill">
              <i /> جدول المدرب
            </div>
          </div>
          <div className="instructor-topbar-end">
            <button
              className="instructor-icon-button"
              aria-label="الإشعارات"
              onClick={() => toast("لا توجد إشعارات جديدة")}
            >
              {" "}
              <Activity size={17} />
            </button>
            <span className="instructor-topbar-divider" />
            <button
              className="instructor-profile"
              onClick={() => showComingSoon("إعدادات الحساب")}
            >
              <span>
                <strong>{INSTRUCTOR}</strong>
                <small>مدرب</small>
              </span>
              <i>م</i>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>

        <div className="instructor-content">
          <div className="instructor-breadcrumb">
            <button onClick={() => setView("overview")}>مساحة المدرب</button>
            <ChevronLeft size={13} />
            <span>
              {navItems.find(item => item.id === view)?.label ??
                (view === "achievements" ? "الإنجازات" : "ملفي الشخصي")}
            </span>
          </div>
          <section className="instructor-welcome">
            <div>
              <div className="instructor-eyebrow">
                <i /> لوحة المدرب · مريم حسن · {BRANCH}
              </div>
              <h1>
                {view === "overview"
                  ? "يومك الأكاديمي"
                  : view === "attendance"
                    ? "الحضور والغياب"
                    : view === "evaluations"
                      ? "تقييم الطلاب"
                      : view === "achievements"
                        ? "إنجازات طلابي"
                        : "ملفي الشخصي"}
              </h1>
              <p>
                {view === "overview"
                  ? "تابعي جلساتك، وسجلي الحضور والتقييم من مساحة عمل واحدة."
                  : view === "attendance"
                    ? "سجّلي حالة كل طالب قبل تأكيد حضور الجلسة."
                    : view === "evaluations"
                      ? "قدّمي ملاحظات بنّاءة لكل طالب بعد الجلسة."
                      : view === "achievements"
                        ? "تابعي التقدم والإنجازات التي تستحق الاحتفال داخل مجموعاتك."
                        : "راجعي بياناتك المهنية ونطاق الصلاحيات المتاح لك."}
              </p>
            </div>
            <div className="instructor-welcome-actions">
              <span className="instructor-date-pill">
                <CalendarDays size={16} /> السبت، ٢٦ سبتمبر ٢٠٢٦
              </span>
              {view === "overview" && (
                <button
                  className="instructor-primary-button"
                  onClick={() => setView("attendance")}
                >
                  <CalendarCheck size={16} /> تسجيل الحضور
                </button>
              )}
              {view === "attendance" && (
                <button
                  className="instructor-secondary-button"
                  onClick={() => setView("evaluations")}
                >
                  <Star size={16} /> التقييمات
                </button>
              )}
              {view === "achievements" && (
                <button
                  className="instructor-secondary-button"
                  onClick={() => setView("evaluations")}
                >
                  <Star size={16} /> إضافة تقييم
                </button>
              )}
            </div>
          </section>
          <section className="instructor-demo-note" role="note">
            <AlertCircle size={15} />
            <span>
              بيانات توضيحية محلية للمدرب «مريم حسن». الحضور والتقييم لا يُحفظان
              في النظام الفعلي.
            </span>
            <b>DEMO</b>
          </section>
          {view === "overview" && (
            <section
              className="instructor-permission-card"
              aria-label="صلاحيات المدرب"
            >
              <div className="instructor-permission-heading">
                <span className="instructor-permission-icon">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <strong>مساحتك مصممة للتركيز على الجلسة</strong>
                  <p>
                    تظهر لك البيانات اللازمة للتنفيذ فقط، بدون تفاصيل مالية أو
                    إدارية.
                  </p>
                </div>
              </div>
              <div className="instructor-permission-list">
                <span>
                  <CheckCircle2 size={14} /> جلساتك المسندة
                </span>
                <span>
                  <CheckCircle2 size={14} /> حضور الطلاب
                </span>
                <span>
                  <CheckCircle2 size={14} /> تقييمات الطلاب
                </span>
                <span className="is-locked">
                  <ShieldCheck size={14} /> المالية والموافقات للإدارة
                </span>
              </div>
            </section>
          )}

          {view === "overview" && (
            <>
              <section
                className="instructor-stats-grid"
                aria-label="ملخص المدرب"
              >
                <article className="instructor-stat-card stat-teal">
                  <span className="instructor-stat-icon">
                    <CalendarDays size={18} />
                  </span>
                  <small>جلسات اليوم</small>
                  <strong>{todaySessionCount}</strong>
                  <span>جلسة واحدة جارية الآن</span>
                </article>
                <article className="instructor-stat-card stat-blue">
                  <span className="instructor-stat-icon">
                    <Users size={18} />
                  </span>
                  <small>طلابي اليوم</small>
                  <strong>
                    {SESSIONS.filter(item => item.date === "2026-09-26").reduce(
                      (sum, item) => sum + item.students.length,
                      0
                    )}
                  </strong>
                  <span>موزعون على جلساتك</span>
                </article>
                <article className="instructor-stat-card stat-amber">
                  <span className="instructor-stat-icon">
                    <Clock3 size={18} />
                  </span>
                  <small>حضور يحتاج استكمالًا</small>
                  <strong>{attendanceSummary.unmarked}</strong>
                  <span>في الجلسة الجارية</span>
                </article>
                <article className="instructor-stat-card stat-violet">
                  <span className="instructor-stat-icon">
                    <Star size={18} />
                  </span>
                  <small>تقييمات محفوظة</small>
                  <strong>{evaluationCount}</strong>
                  <span>بطاقات محلية جاهزة</span>
                </article>
              </section>

              <div className="instructor-dashboard-grid">
                <section className="instructor-panel instructor-session-panel">
                  <div className="instructor-panel-heading">
                    <div>
                      <span className="instructor-panel-kicker">
                        الموعد الأكاديمي
                      </span>
                      <h2>جلساتك القادمة</h2>
                    </div>
                    <button
                      className="instructor-text-link"
                      onClick={() => showComingSoon("التقويم الكامل")}
                    >
                      التقويم الكامل <ChevronLeft size={14} />
                    </button>
                  </div>
                  <div className="instructor-session-list">
                    {SESSIONS.filter(item => item.status !== "completed").map(
                      session => (
                        <article
                          className={`instructor-session-card ${session.status === "in_progress" ? "is-live" : ""}`}
                          key={session.id}
                        >
                          <span
                            className={`instructor-session-time ${session.status === "in_progress" ? "live" : ""}`}
                          >
                            <strong>{session.time.split(" – ")[0]}</strong>
                            <small>{session.time.split(" – ")[1]}</small>
                          </span>
                          <div className="instructor-session-info">
                            <div className="instructor-session-card-top">
                              <span
                                className={`instructor-session-status ${session.status}`}
                              >
                                {session.status === "in_progress" && <i />}
                                {SESSION_STATUS[session.status]}
                              </span>
                              <small>{session.dateLabel}</small>
                            </div>
                            <h3>{session.title}</h3>
                            <p>{session.level}</p>
                            <div className="instructor-session-meta">
                              <span>
                                <MapPin size={13} />
                                {session.room}
                              </span>
                              <span>
                                <Users size={13} />
                                {session.students.length} طلاب
                              </span>
                            </div>
                          </div>
                          <button
                            className={
                              session.status === "in_progress"
                                ? "instructor-session-cta"
                                : "instructor-session-open"
                            }
                            onClick={() => {
                              selectSession(session.id);
                              setView("attendance");
                            }}
                            aria-label={`فتح حضور ${session.title}`}
                          >
                            {session.status === "in_progress"
                              ? "الحضور"
                              : "تفاصيل"}
                            <ChevronLeft size={14} />
                          </button>
                        </article>
                      )
                    )}
                  </div>
                </section>

                <section className="instructor-panel instructor-today-panel">
                  <div className="instructor-panel-heading">
                    <div>
                      <span className="instructor-panel-kicker">
                        أولوية اليوم
                      </span>
                      <h2>تحتاج انتباهك</h2>
                    </div>
                    <span className="instructor-attention-count">
                      {attendanceSummary.unmarked + 1}
                    </span>
                  </div>
                  <button
                    className="instructor-attention-row"
                    onClick={() => setView("attendance")}
                  >
                    <span className="attention-symbol amber">
                      <CalendarCheck size={16} />
                    </span>
                    <span>
                      <strong>استكمال تسجيل الحضور</strong>
                      <small>
                        {attendanceSummary.unmarked} طلاب بلا حالة بعد
                      </small>
                    </span>
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    className="instructor-attention-row"
                    onClick={() => setView("evaluations")}
                  >
                    <span className="attention-symbol violet">
                      <Star size={16} />
                    </span>
                    <span>
                      <strong>تقييم جلسة الأمس</strong>
                      <small>بطاقة ياسين جاهزة · أضيفي بقية التقييمات</small>
                    </span>
                    <ChevronLeft size={15} />
                  </button>
                  <div className="instructor-tip">
                    <Sparkles size={16} />
                    <p>
                      <strong>تذكير تربوي</strong>
                      <span>
                        الملاحظة القصيرة المحددة تساعد ولي الأمر على فهم تقدم
                        طفله.
                      </span>
                    </p>
                  </div>
                </section>
              </div>

              <section className="instructor-panel instructor-quick-panel">
                <div className="instructor-panel-heading">
                  <div>
                    <span className="instructor-panel-kicker">اختصارات</span>
                    <h2>ماذا تريدين أن تفعلي؟</h2>
                  </div>
                </div>
                <div className="instructor-quick-grid">
                  <button onClick={() => setView("attendance")}>
                    <span className="quick-icon quick-teal">
                      <CalendarCheck size={18} />
                    </span>
                    <strong>تسجيل الحضور</strong>
                    <small>تحديد حاضر / غائب / متأخر</small>
                    <ArrowUpRight size={15} />
                  </button>
                  <button onClick={() => setView("evaluations")}>
                    <span className="quick-icon quick-violet">
                      <Star size={18} />
                    </span>
                    <strong>تقييم طالب</strong>
                    <small>تسجيل ملاحظة ومعايير التقييم</small>
                    <ArrowUpRight size={15} />
                  </button>
                  <button onClick={() => showComingSoon("سجل الطلاب")}>
                    <span className="quick-icon quick-blue">
                      <GraduationCap size={18} />
                    </span>
                    <strong>ملفات طلابي</strong>
                    <small>الطلاب المسجلون في مجموعاتي</small>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </section>
            </>
          )}

          {view === "achievements" && (
            <div className="instructor-achievements-page">
              <section className="instructor-achievements-summary">
                <div>
                  <span className="instructor-panel-kicker">لوحة التقدم</span>
                  <h2>كل خطوة صغيرة تستحق أن تُرى</h2>
                  <p>
                    راجعي تطور طلابك من خلال الحضور ومتوسط التقييم وآخر إنجاز
                    مسجل لكل طالب.
                  </p>
                </div>
                <span className="achievement-summary-mark">
                  <Sparkles size={23} />
                </span>
              </section>
              <section
                className="instructor-milestone-grid"
                aria-label="ملخص الإنجازات"
              >
                {INSTRUCTOR_MILESTONES.map(item => {
                  const Icon = item.icon;
                  return (
                    <article
                      className="instructor-milestone-card"
                      key={item.label}
                    >
                      <span>
                        <Icon size={17} />
                      </span>
                      <small>{item.label}</small>
                      <strong>{item.value}</strong>
                      <em>{item.hint}</em>
                    </article>
                  );
                })}
              </section>
              <section className="instructor-panel student-progress-panel">
                <div className="instructor-panel-heading">
                  <div>
                    <span className="instructor-panel-kicker">
                      مجموعاتك الحالية
                    </span>
                    <h2>تطور الطلاب</h2>
                  </div>
                  <span className="instructor-evaluation-count">
                    {STUDENT_PROGRESS.length} طلاب
                  </span>
                </div>
                <div className="student-progress-list">
                  {STUDENT_PROGRESS.map(student => (
                    <article className="student-progress-card" key={student.id}>
                      <div className="student-progress-person">
                        <i className={`student-color-${student.color}`}>
                          {student.initials}
                        </i>
                        <span>
                          <strong>{student.name}</strong>
                          <small>
                            {student.track} · {student.id}
                          </small>
                        </span>
                      </div>
                      <div className="student-progress-metric">
                        <div>
                          <span>التقدم في المسار</span>
                          <strong>{student.progress}%</strong>
                        </div>
                        <div className="student-progress-bar">
                          <i style={{ width: `${student.progress}%` }} />
                        </div>
                      </div>
                      <div className="student-progress-meta">
                        <span>
                          <CalendarCheck size={13} /> حضور {student.attendance}%
                        </span>
                        <span>
                          <Star size={13} /> متوسط {student.average}/5
                        </span>
                      </div>
                      <p>
                        <Sparkles size={13} /> {student.milestone}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === "profile" && (
            <div className="instructor-profile-page">
              <section className="instructor-profile-hero">
                <div className="instructor-profile-identity">
                  <span className="instructor-profile-large-avatar">م</span>
                  <div>
                    <span className="instructor-panel-kicker">
                      الحساب المهني
                    </span>
                    <h2>{INSTRUCTOR}</h2>
                    <p>مدرب روبوتكس · فرع {BRANCH}</p>
                  </div>
                </div>
                <span className="profile-active-badge">
                  <i /> حساب نشط
                </span>
              </section>
              <div className="instructor-profile-grid">
                <section className="instructor-panel profile-details-panel">
                  <div className="instructor-panel-heading">
                    <div>
                      <span className="instructor-panel-kicker">
                        بيانات العمل
                      </span>
                      <h2>ملخص الملف</h2>
                    </div>
                    <ShieldCheck size={18} className="profile-heading-icon" />
                  </div>
                  <div className="profile-detail-list">
                    <div>
                      <small>المسمى الوظيفي</small>
                      <strong>مدرب روبوتكس</strong>
                    </div>
                    <div>
                      <small>الفرع الأساسي</small>
                      <strong>فرع {BRANCH}</strong>
                    </div>
                    <div>
                      <small>المجموعات الحالية</small>
                      <strong>3 مجموعات</strong>
                    </div>
                    <div>
                      <small>منذ الانضمام</small>
                      <strong>يناير ٢٠٢٥</strong>
                    </div>
                  </div>
                </section>
                <section className="instructor-panel profile-permissions-panel">
                  <div className="instructor-panel-heading">
                    <div>
                      <span className="instructor-panel-kicker">الوصول</span>
                      <h2>صلاحياتي الحالية</h2>
                    </div>
                  </div>
                  <div className="profile-permission-row is-allowed">
                    <CheckCircle2 size={15} />
                    <span>
                      <strong>الجلسات المسندة</strong>
                      <small>عرض التفاصيل والتحديث التشغيلي</small>
                    </span>
                    <em>متاح</em>
                  </div>
                  <div className="profile-permission-row is-allowed">
                    <CheckCircle2 size={15} />
                    <span>
                      <strong>الحضور والتقييم</strong>
                      <small>تسجيل ومراجعة بيانات طلاب مجموعاتك</small>
                    </span>
                    <em>متاح</em>
                  </div>
                  <div className="profile-permission-row is-locked">
                    <ShieldCheck size={15} />
                    <span>
                      <strong>المالية والموافقات</strong>
                      <small>تحتاج صلاحية مدير الفرع</small>
                    </span>
                    <em>مقيد</em>
                  </div>
                </section>
              </div>
              <section className="instructor-panel profile-note-panel">
                <MessageCircle size={18} />
                <div>
                  <strong>هل تحتاج تعديلًا على صلاحياتك؟</strong>
                  <p>
                    تواصل مع مدير الفرع لمراجعة نطاق الوصول أو طلب إضافة مجموعة
                    جديدة.
                  </p>
                </div>
                <button
                  className="instructor-secondary-button"
                  onClick={() => toast("تم تسجيل طلب المساعدة في المعاينة")}
                >
                  طلب مساعدة
                </button>
              </section>
            </div>
          )}

          {view === "attendance" && (
            <>
              <section className="instructor-session-selector panel-like">
                <label>
                  <span>الجلسة</span>
                  <select
                    value={selectedSession.id}
                    onChange={event => selectSession(event.target.value)}
                  >
                    {SESSIONS.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.dateLabel} · {session.time} · {session.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="instructor-selected-session-meta">
                  <span>
                    <MapPin size={14} />
                    {selectedSession.room}
                  </span>
                  <span>
                    <BookOpen size={14} />
                    {selectedSession.level}
                  </span>
                  <span
                    className={`instructor-session-status ${selectedSession.status}`}
                  >
                    {SESSION_STATUS[selectedSession.status]}
                  </span>
                </div>
              </section>
              <section
                className="instructor-stats-grid attendance-stats"
                aria-label="ملخص الحضور"
              >
                <article className="instructor-stat-card stat-teal">
                  <small>حاضر</small>
                  <strong>{attendanceSummary.present}</strong>
                  <span>من {attendanceSummary.total} طلاب</span>
                </article>
                <article className="instructor-stat-card stat-amber">
                  <small>متأخر</small>
                  <strong>{attendanceSummary.late}</strong>
                  <span>يسجل وقت التأخير</span>
                </article>
                <article className="instructor-stat-card stat-rose">
                  <small>غائب / بعذر</small>
                  <strong>
                    {attendanceSummary.absent + attendanceSummary.excused}
                  </strong>
                  <span>
                    {attendanceSummary.absent} بدون عذر ·{" "}
                    {attendanceSummary.excused} بعذر
                  </span>
                </article>
                <article className="instructor-stat-card stat-blue">
                  <small>لم يسجل</small>
                  <strong>{attendanceSummary.unmarked}</strong>
                  <span>تغطية الحضور {sessionProgress}%</span>
                </article>
              </section>
              <form
                className="instructor-panel attendance-panel"
                onSubmit={saveAttendance}
              >
                <div className="instructor-panel-heading attendance-heading">
                  <div>
                    <span className="instructor-panel-kicker">
                      {selectedSession.dateLabel} · {selectedSession.time}
                    </span>
                    <h2>
                      كشف الحضور{" "}
                      <small>{selectedSession.students.length} طلاب</small>
                    </h2>
                  </div>
                  <label className="instructor-roster-search">
                    <Search size={15} />
                    <input
                      ref={rosterSearchRef}
                      aria-label="بحث في قائمة الطلاب"
                      placeholder="ابحث عن طالب..."
                      value={studentQuery}
                      onChange={event => setStudentQuery(event.target.value)}
                    />
                    <kbd>⌘ K</kbd>
                  </label>
                </div>
                <div className="instructor-roster-wrap">
                  <table className="instructor-roster-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>الحالة</th>
                        <th>تفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRoster.map(student => {
                        const record = selectedAttendance[student.id] ?? {
                          status: "unmarked" as const,
                          lateMinutes: 0,
                        };
                        return (
                          <tr key={student.id}>
                            <td>
                              <span className="instructor-student-cell">
                                <i className={`student-color-${student.color}`}>
                                  {student.initials}
                                </i>
                                <span>
                                  <strong>{student.name}</strong>
                                  <small>
                                    {student.age} سنة · {student.id}
                                  </small>
                                </span>
                              </span>
                            </td>
                            <td>
                              <select
                                className={`attendance-select attendance-${record.status}`}
                                aria-label={`حالة ${student.name}`}
                                value={record.status}
                                onChange={event =>
                                  setAttendanceStatus(
                                    student.id,
                                    event.target.value as AttendanceStatus
                                  )
                                }
                              >
                                <option value="unmarked">لم يسجل</option>
                                <option value="present">حاضر</option>
                                <option value="absent">غائب</option>
                                <option value="late">متأخر</option>
                                <option value="excused">بعذر</option>
                              </select>
                            </td>
                            <td>
                              {record.status === "late" ? (
                                <label className="late-minutes-field">
                                  <input
                                    type="number"
                                    min={1}
                                    max={180}
                                    aria-label={`دقائق تأخير ${student.name}`}
                                    value={record.lateMinutes || 5}
                                    onChange={event =>
                                      changeLateMinutes(
                                        student.id,
                                        Number(event.target.value)
                                      )
                                    }
                                  />
                                  <span>دقيقة تأخير</span>
                                </label>
                              ) : (
                                <span className="attendance-detail-muted">
                                  {record.status === "present"
                                    ? "حضور مسجل"
                                    : record.status === "excused"
                                      ? "بعذر مسبق"
                                      : record.status === "absent"
                                        ? "لم يحضر"
                                        : "—"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {visibleRoster.length === 0 && (
                        <tr>
                          <td colSpan={3}>
                            <div className="instructor-empty">
                              <Search size={18} />
                              <strong>لا توجد نتائج</strong>
                              <button
                                type="button"
                                onClick={() => setStudentQuery("")}
                              >
                                مسح البحث
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="attendance-panel-footer">
                  <span>
                    <AlertCircle size={14} />
                    تأكيد الحضور محلي لهذه المعاينة فقط.
                  </span>
                  <button
                    className="instructor-primary-button"
                    type="submit"
                    disabled={attendanceSummary.unmarked > 0}
                  >
                    <Check size={16} />
                    {attendanceSaved[selectedSession.id]
                      ? "تم تأكيد الحضور"
                      : "تأكيد حضور الجلسة"}
                  </button>
                  {attendanceSaved[selectedSession.id] && (
                    <button
                      className="instructor-secondary-button attendance-next-step"
                      type="button"
                      onClick={() => setView("evaluations")}
                    >
                      <Star size={15} /> ابدئي التقييمات
                    </button>
                  )}
                </div>
                {attendanceSummary.unmarked > 0 && (
                  <p className="attendance-validation-hint">
                    باقي تسجيل حالة {attendanceSummary.unmarked} طالب قبل
                    التأكيد.
                  </p>
                )}
              </form>
            </>
          )}

          {view === "evaluations" && (
            <div className="instructor-evaluation-layout">
              <section className="instructor-panel evaluation-student-panel">
                <div className="instructor-panel-heading">
                  <div>
                    <span className="instructor-panel-kicker">
                      طلاب المجموعة
                    </span>
                    <h2>اختاري طالبًا</h2>
                  </div>
                  <span className="instructor-evaluation-count">
                    {evaluationCount} بطاقة
                  </span>
                </div>
                <label className="evaluation-session-select">
                  <span>الجلسة</span>
                  <select
                    value={selectedSession.id}
                    onChange={event => selectSession(event.target.value)}
                  >
                    {SESSIONS.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.dateLabel} · {session.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="evaluation-student-list">
                  {selectedSession.students.map(student => {
                    const key = `${selectedSession.id}:${student.id}`;
                    const evaluation = evaluations[key];
                    return (
                      <button
                        key={student.id}
                        className={
                          student.id === selectedStudent?.id ? "selected" : ""
                        }
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setComment(evaluations[key]?.comment ?? "");
                          setScores(
                            evaluations[key]?.scores ?? {
                              understanding: 4,
                              practice: 4,
                              collaboration: 4,
                            }
                          );
                          setPreviewEvaluation(false);
                        }}
                      >
                        <i className={`student-color-${student.color}`}>
                          {student.initials}
                        </i>
                        <span>
                          <strong>{student.name}</strong>
                          <small>{student.age} سنة</small>
                        </span>
                        {evaluation ? (
                          <span className="evaluation-ready">
                            <CheckCircle2 size={14} /> جاهز
                          </span>
                        ) : (
                          <ChevronLeft size={14} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="instructor-panel evaluation-form-panel">
                {selectedStudent ? (
                  <>
                    <div className="instructor-panel-heading">
                      <div>
                        <span className="instructor-panel-kicker">
                          {selectedSession.title} · {selectedSession.dateLabel}
                        </span>
                        <h2>
                          بطاقة تقييم <small>{selectedStudent.name}</small>
                        </h2>
                      </div>
                      <span className="rubric-snapshot-badge">
                        <ShieldCheck size={14} /> معايير ثابتة
                      </span>
                    </div>
                    <div className="evaluation-student-banner">
                      <i className={`student-color-${selectedStudent.color}`}>
                        {selectedStudent.initials}
                      </i>
                      <div>
                        <strong>{selectedStudent.name}</strong>
                        <small>
                          {selectedStudent.age} سنة · {selectedStudent.id}
                        </small>
                      </div>
                      <span>{selectedSession.level}</span>
                    </div>
                    <div className="evaluation-review-chain">
                      <ShieldCheck size={14} />
                      <span>
                        مسار المراجعة: المدرب يكتب · رئيس المدربين يراجع · مدير
                        الفرع يطلع على ملخص الفريق
                      </span>
                    </div>
                    <form className="evaluation-form" onSubmit={saveEvaluation}>
                      <div className="evaluation-rubric-list">
                        {RUBRIC.map((criterion, index) => (
                          <fieldset
                            className="evaluation-criterion"
                            key={criterion.id}
                          >
                            <legend>
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              <strong>{criterion.title}</strong>
                            </legend>
                            <p>{criterion.hint}</p>
                            <div
                              className="score-options"
                              role="radiogroup"
                              aria-label={criterion.title}
                            >
                              {[1, 2, 3, 4, 5].map(score => (
                                <button
                                  type="button"
                                  role="radio"
                                  aria-checked={scores[criterion.id] === score}
                                  className={
                                    scores[criterion.id] === score
                                      ? "selected"
                                      : ""
                                  }
                                  key={score}
                                  onClick={() => {
                                    setScores(current => ({
                                      ...current,
                                      [criterion.id]: score,
                                    }));
                                    setPreviewEvaluation(false);
                                  }}
                                >
                                  <Star
                                    size={14}
                                    fill={
                                      scores[criterion.id] >= score
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                  <span>{score}</span>
                                </button>
                              ))}
                            </div>
                          </fieldset>
                        ))}
                      </div>
                      <label className="evaluation-comment">
                        <span>
                          ملاحظة لولي الأمر <small>اختياري</small>
                        </span>
                        <textarea
                          rows={3}
                          maxLength={300}
                          value={comment}
                          onChange={event => {
                            setComment(event.target.value);
                            setPreviewEvaluation(false);
                          }}
                          placeholder="اكتبي تقدّمًا محددًا أو خطوة تالية للتدرب عليها..."
                        />
                        <small>{comment.length}/300</small>
                      </label>
                      <div className="evaluation-form-footer">
                        <span>
                          <AlertCircle size={14} />
                          سيتم إنشاء بطاقة توضيحية محلية، دون إرسالها للأسرة.
                        </span>
                        <button
                          className="instructor-primary-button"
                          type="submit"
                        >
                          <Check size={16} />
                          حفظ التقييم
                        </button>
                      </div>
                    </form>
                    {previewEvaluation && savedEvaluation && (
                      <div className="evaluation-preview-card">
                        <span className="evaluation-preview-brand">
                          <Sparkles size={15} /> مدى · تقدّم الطالب
                        </span>
                        <strong>
                          أحسنت يا {selectedStudent.name.split(" ")[0]}!
                        </strong>
                        <p>
                          {savedEvaluation.comment ||
                            "واصل التعلم والمحاولة؛ كل جلسة خطوة جديدة."}
                        </p>
                        <small>
                          {selectedSession.title} · متوسط التقييم{" "}
                          {(
                            Object.values(savedEvaluation.scores).reduce(
                              (sum, value) => sum + value,
                              0
                            ) / RUBRIC.length
                          ).toFixed(1)}{" "}
                          / 5
                        </small>
                        <div className="evaluation-card-actions">
                          <span
                            className={
                              sentCards[selectedEvaluationKey]
                                ? "card-sent-status is-sent"
                                : "card-sent-status"
                            }
                          >
                            {sentCards[selectedEvaluationKey] ? (
                              <>
                                <CheckCircle2 size={13} /> جاهزة للإرسال
                              </>
                            ) : (
                              "معاينة محلية"
                            )}
                          </span>
                          <button
                            type="button"
                            className="instructor-primary-button"
                            onClick={sendEvaluationCard}
                          >
                            <ArrowUpRight size={14} /> إرسال للأسرة
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="instructor-empty">
                    <Users size={20} />
                    <strong>لا يوجد طلاب في الجلسة</strong>
                  </div>
                )}
              </section>
            </div>
          )}
          <footer className="instructor-footer-note">
            <span>
              <AlertCircle size={14} />
            </span>
            <p>
              مساحة المدرب مصممة لبيانات المدرب المسندة فقط. العمليات هنا
              توضيحية ولا تستبدل تسجيل الحضور والتقييم على الخادم.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
