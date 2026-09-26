import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  Eye,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type WorkspaceView = "overview" | "team" | "sessions" | "evaluations";
type SessionStatus =
  | "scheduled"
  | "completed"
  | "pending_approval"
  | "cancelled"
  | "rescheduled";
type EvaluationCardStatus = "pending" | "generating" | "ready";
type SessionRecord = {
  id: string;
  offeringId: string;
  courseName: string;
  groupName: string;
  date: string;
  dateLabel: string;
  time: string;
  room: string;
  instructor: string;
  status: SessionStatus;
  students: number;
  attendance?: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
};
type EvaluationRecord = {
  id: string;
  student: string;
  studentId: string;
  courseName: string;
  instructor: string;
  sessionDate: string;
  cardStatus: EvaluationCardStatus;
  scores: { understanding: number; practice: number; collaboration: number };
  comment: string;
};

type Coach = {
  id: string;
  name: string;
  initials: string;
  role: string;
  phone: string;
  groups: string[];
  sessionsThisWeek: number;
  attendanceRate: number;
  evaluationRate: number;
  status: "active" | "on_leave";
};

const BRANCH = "مدينة نصر";
const HEAD_OF_INSTRUCTORS = "مريم حسن";
const VIEW_NAMES: Record<WorkspaceView, string> = {
  overview: "ملخص الفريق",
  team: "فريق المدربين",
  sessions: "الحصص والحضور",
  evaluations: "تقييمات الطلاب",
};
const VIEW_VALUES = Object.keys(VIEW_NAMES) as WorkspaceView[];
const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "مجدولة",
  completed: "مكتملة",
  pending_approval: "تحتاج مراجعة التسجيل",
  cancelled: "ملغاة",
  rescheduled: "أُعيدت جدولتها",
};
const CARD_STATUS_LABELS: Record<EvaluationCardStatus, string> = {
  pending: "بانتظار الإنشاء",
  generating: "جارٍ تجهيز البطاقة",
  ready: "بطاقة جاهزة",
};
const RUBRIC = [
  {
    key: "understanding",
    label: "استيعاب الفكرة",
    hint: "المفاهيم والخطوات الأساسية",
  },
  {
    key: "practice",
    label: "التطبيق العملي",
    hint: "تنفيذ المهمة واستخدام الأدوات",
  },
  {
    key: "collaboration",
    label: "التعاون والمبادرة",
    hint: "المشاركة والتعاون مع الزملاء",
  },
] as const;

const COACH: Coach = {
  id: "USR-0202",
  name: "عمر سامح",
  initials: "عس",
  role: "مدرب · مدينة نصر",
  phone: "01123456789",
  groups: ["روبوتكس مستوى 2", "برمجة للمبتدئين", "أساسيات تصميم الروبوت"],
  sessionsThisWeek: 6,
  attendanceRate: 88,
  evaluationRate: 83,
  status: "active",
};

const SESSIONS: SessionRecord[] = [
  {
    id: "SES-NSR-0926-02",
    offeringId: "GRP-042",
    courseName: "روبوتكس مستوى 2",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "10:00 – 11:30 ص",
    room: "معمل 1",
    instructor: COACH.name,
    status: "completed",
    students: 6,
    attendance: { present: 5, absent: 0, late: 1, excused: 0 },
  },
  {
    id: "SES-NSR-0926-05",
    offeringId: "GRP-041",
    courseName: "برمجة للمبتدئين",
    groupName: "المستوى التأسيسي · 7–9 سنوات",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "12:00 – 01:30 م",
    room: "معمل 2",
    instructor: COACH.name,
    status: "pending_approval",
    students: 8,
    attendance: { present: 7, absent: 1, late: 0, excused: 0 },
  },
  {
    id: "SES-NSR-0926-08",
    offeringId: "GRP-043",
    courseName: "أساسيات تصميم الروبوت",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "03:00 – 04:30 م",
    room: "معمل الروبوتات",
    instructor: COACH.name,
    status: "completed",
    students: 6,
    attendance: { present: 5, absent: 1, late: 0, excused: 0 },
  },
  {
    id: "SES-NSR-0927-01",
    offeringId: "GRP-042",
    courseName: "روبوتكس مستوى 2",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-27",
    dateLabel: "الأحد 27 سبتمبر",
    time: "10:00 – 11:30 ص",
    room: "معمل 1",
    instructor: COACH.name,
    status: "scheduled",
    students: 6,
  },
  {
    id: "SES-NSR-0928-04",
    offeringId: "GRP-041",
    courseName: "برمجة للمبتدئين",
    groupName: "المستوى التأسيسي · 7–9 سنوات",
    date: "2026-09-28",
    dateLabel: "الاثنين 28 سبتمبر",
    time: "12:00 – 01:30 م",
    room: "معمل 2",
    instructor: COACH.name,
    status: "scheduled",
    students: 8,
  },
  {
    id: "SES-NSR-0925-03",
    offeringId: "GRP-043",
    courseName: "أساسيات تصميم الروبوت",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-25",
    dateLabel: "الجمعة 25 سبتمبر",
    time: "04:00 – 05:30 م",
    room: "معمل الروبوتات",
    instructor: COACH.name,
    status: "completed",
    students: 6,
    attendance: { present: 5, absent: 0, late: 0, excused: 1 },
  },
];

const EVALUATIONS: EvaluationRecord[] = [
  {
    id: "EVAL-2418",
    student: "ياسين محمد علي",
    studentId: "ST-0248",
    courseName: "روبوتكس مستوى 2",
    instructor: COACH.name,
    sessionDate: "2026-09-25",
    cardStatus: "ready",
    scores: { understanding: 4, practice: 5, collaboration: 4 },
    comment: "نفّذ التحدي باستقلالية وشرح فكرته لزميله.",
  },
  {
    id: "EVAL-2417",
    student: "عمر خالد إبراهيم",
    studentId: "ST-0246",
    courseName: "برمجة للمبتدئين",
    instructor: COACH.name,
    sessionDate: "2026-09-25",
    cardStatus: "ready",
    scores: { understanding: 3, practice: 4, collaboration: 4 },
    comment:
      "تقدّم جيد في ترتيب الخطوات، ويستفيد من وقت إضافي في تجربة الحلول.",
  },
  {
    id: "EVAL-2414",
    student: "ملك حسام الدين",
    studentId: "ST-0240",
    courseName: "أساسيات تصميم الروبوت",
    instructor: COACH.name,
    sessionDate: "2026-09-24",
    cardStatus: "pending",
    scores: { understanding: 4, practice: 3, collaboration: 5 },
    comment: "تحتاج متابعة إضافية في توثيق خطوات المشروع.",
  },
  {
    id: "EVAL-2412",
    student: "ليلى أحمد محمود",
    studentId: "ST-0238",
    courseName: "روبوتكس مستوى 2",
    instructor: COACH.name,
    sessionDate: "2026-09-23",
    cardStatus: "generating",
    scores: { understanding: 5, practice: 4, collaboration: 4 },
    comment: "مستوى متميز في تحليل المشكلة وتجربة أكثر من مسار للحل.",
  },
];
const ATTENDANCE_TREND = [
  { label: "الأحد", value: 81 },
  { label: "الاثنين", value: 86 },
  { label: "الثلاثاء", value: 84 },
  { label: "الأربعاء", value: 91 },
  { label: "الخميس", value: 88 },
  { label: "الجمعة", value: 82 },
  { label: "السبت", value: 89 },
];

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T12:00:00`));
const averageAttendance = Math.round(
  ATTENDANCE_TREND.reduce((sum, item) => sum + item.value, 0) /
    ATTENDANCE_TREND.length
);
const presentRate = (session: SessionRecord) => {
  if (!session.attendance) return null;
  const included = session.students - (session.attendance.excused || 0);
  if (!included) return 0;
  return Math.round(
    ((session.attendance.present + session.attendance.late) / included) * 100
  );
};

function MadaMark() {
  return (
    <span className="academic-brand-mark" aria-hidden="true">
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
  );
}

function EvaluationCard({
  evaluation,
  reviewed,
  onOpen,
}: {
  evaluation: EvaluationRecord;
  reviewed: boolean;
  onOpen: () => void;
}) {
  const avg = (
    Object.values(evaluation.scores).reduce((sum, value) => sum + value, 0) /
    Object.values(evaluation.scores).length
  ).toFixed(1);
  return (
    <button className="academic-evaluation-card" onClick={onOpen}>
      <span
        className={`academic-evaluation-avatar eval-${evaluation.cardStatus}`}
      >
        {evaluation.student.slice(0, 1)}
      </span>
      <span className="academic-evaluation-main">
        <strong>{evaluation.student}</strong>
        <small>
          {evaluation.courseName} · {formatDate(evaluation.sessionDate)}
        </small>
        <span className="academic-evaluation-comment">
          {evaluation.comment}
        </span>
      </span>
      <span className="academic-evaluation-score">
        <strong>
          <Star size={13} fill="currentColor" />
          {avg}
        </strong>
        <small>من ٥</small>
      </span>
      <span className={`academic-card-status ${evaluation.cardStatus}`}>
        {reviewed ? "تم الاطلاع" : CARD_STATUS_LABELS[evaluation.cardStatus]}
      </span>
      <ChevronLeft size={15} className="academic-row-chevron" />
    </button>
  );
}

export default function HeadInstructors() {
  const [, navigate] = useLocation();
  const sessionSearchRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<WorkspaceView>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return VIEW_VALUES.includes(requested as WorkspaceView)
      ? (requested as WorkspaceView)
      : "overview";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(SESSIONS[0].id);
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("all");
  const [evaluationQuery, setEvaluationQuery] = useState("");
  const [evaluationStatusFilter, setEvaluationStatusFilter] = useState("all");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    string | null
  >(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  const selectedSession =
    SESSIONS.find(session => session.id === selectedSessionId) ?? SESSIONS[0];
  const selectedEvaluation = EVALUATIONS.find(
    evaluation => evaluation.id === selectedEvaluationId
  );
  const completedSessions = SESSIONS.filter(
    session => session.status === "completed"
  );
  const todaySessions = SESSIONS.filter(
    session => session.date === "2026-09-26"
  );
  const pendingReviewSessions = SESSIONS.filter(
    session => session.status === "pending_approval"
  );
  const readyEvaluationCount = EVALUATIONS.filter(
    evaluation => evaluation.cardStatus === "ready"
  ).length;
  const followUpEvaluationCount = EVALUATIONS.filter(
    evaluation => evaluation.cardStatus !== "ready"
  ).length;
  const averageScore = (
    EVALUATIONS.flatMap(evaluation => Object.values(evaluation.scores)).reduce(
      (sum, score) => sum + score,
      0
    ) /
    EVALUATIONS.flatMap(evaluation => Object.values(evaluation.scores)).length
  ).toFixed(1);

  const filteredSessions = useMemo(() => {
    const needle = sessionQuery.trim().toLocaleLowerCase("ar");
    return SESSIONS.filter(session => {
      const matchesSearch = [
        session.courseName,
        session.instructor,
        session.room,
        session.offeringId,
        session.id,
      ].some(value => value.toLocaleLowerCase("ar").includes(needle));
      return (
        matchesSearch &&
        (sessionStatusFilter === "all" ||
          session.status === sessionStatusFilter)
      );
    }).sort((first, second) =>
      `${first.date} ${first.time}`.localeCompare(
        `${second.date} ${second.time}`
      )
    );
  }, [sessionQuery, sessionStatusFilter]);
  const filteredEvaluations = useMemo(() => {
    const needle = evaluationQuery.trim().toLocaleLowerCase("ar");
    return EVALUATIONS.filter(evaluation => {
      const matchesSearch = [
        evaluation.student,
        evaluation.studentId,
        evaluation.courseName,
        evaluation.instructor,
      ].some(value => value.toLocaleLowerCase("ar").includes(needle));
      return (
        matchesSearch &&
        (evaluationStatusFilter === "all" ||
          evaluation.cardStatus === evaluationStatusFilter)
      );
    });
  }, [evaluationQuery, evaluationStatusFilter]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState({}, "", url);
  }, [view]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "k"
      ) {
        event.preventDefault();
        setView("sessions");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => sessionSearchRef.current?.focus())
        );
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const goToView = (nextView: WorkspaceView) => {
    setView(nextView);
    setMobileNavOpen(false);
  };
  const openEvaluation = (id: string) => setSelectedEvaluationId(id);
  const markEvaluationViewed = (id: string) => {
    setReviewedIds(current =>
      current.includes(id) ? current : [...current, id]
    );
    setSelectedEvaluationId(null);
    toast.success("تم تسجيل الاطلاع في المعاينة المحلية", {
      description: "الحالة لا تُحفظ خارج هذه الجلسة.",
    });
  };
  const onSessionKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    sessionId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedSessionId(sessionId);
    }
  };

  return (
    <div className="academic-shell" dir="rtl">
      <button
        className={`academic-mobile-backdrop ${mobileNavOpen ? "is-open" : ""}`}
        aria-label="إغلاق القائمة"
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className={`academic-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="academic-brand">
          <MadaMark />
          <span>مدى</span>
          <small>مساحة رئيس المدربين</small>
        </div>
        <div className="academic-user-card">
          <span className="academic-user-avatar">م</span>
          <span>
            <strong>{HEAD_OF_INSTRUCTORS}</strong>
            <small>رئيس المدربين · {BRANCH}</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <div className="academic-nav-label">الإشراف الأكاديمي</div>
        <nav className="academic-nav" aria-label="التنقل الأكاديمي">
          <button
            className={view === "overview" ? "active" : ""}
            onClick={() => goToView("overview")}
          >
            <LayoutDashboard size={17} />
            <span>ملخص الفريق</span>
          </button>
          <button
            className={view === "team" ? "active" : ""}
            onClick={() => goToView("team")}
          >
            <Users size={17} />
            <span>فريق المدربين</span>
            <b>{COACH.status === "active" ? 1 : 0}</b>
          </button>
          <button
            className={view === "sessions" ? "active" : ""}
            onClick={() => goToView("sessions")}
          >
            <CalendarDays size={17} />
            <span>الحصص والحضور</span>
            <b>{pendingReviewSessions.length}</b>
          </button>
          <button
            className={view === "evaluations" ? "active" : ""}
            onClick={() => goToView("evaluations")}
          >
            <ClipboardCheck size={17} />
            <span>تقييمات الطلاب</span>
            <b>{followUpEvaluationCount}</b>
          </button>
        </nav>
        <div className="academic-sidebar-divider" />
        <button
          className="academic-nav-link"
          onClick={() => navigate("/schedule")}
        >
          <CalendarCheck size={16} />
          <span>جدول الفرع</span>
          <ChevronLeft size={14} />
        </button>
        <button className="academic-nav-link" onClick={() => navigate("/team")}>
          <ShieldCheck size={16} />
          <span>إدارة فريق الفرع</span>
          <ChevronLeft size={14} />
        </button>
        <div className="academic-sidebar-spacer" />
        <div className="academic-branch-card">
          <span>
            <MapPin size={15} />
          </span>
          <div>
            <small>نطاق الإشراف</small>
            <strong>{BRANCH}</strong>
          </div>
          <span className="academic-branch-fixed">ثابت</span>
        </div>
        <button
          className="academic-back-manager"
          onClick={() => navigate("/team")}
        >
          <ArrowRightSafe /> العودة للوحة مدير الفرع
        </button>
        <div className="academic-sidebar-footer">
          <span>مدى لإدارة الأكاديميات</span>
          <b>نسخة تجريبية</b>
        </div>
      </aside>

      <main className="academic-main">
        <header className="academic-topbar">
          <div className="academic-topbar-left">
            <button
              className="academic-icon-button academic-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} />
            </button>
            <span className="academic-branch-pill">
              <MapPin size={14} /> فرع {BRANCH}
            </span>
            <span className="academic-online">
              <i /> الإشراف الأكاديمي نشط
            </span>
          </div>
          <div className="academic-topbar-right">
            <button
              className="academic-icon-button"
              aria-label="التنبيهات"
              onClick={() => goToView("sessions")}
            >
              <Activity size={16} />
              <i className="academic-notification-dot" />
            </button>
            <span className="academic-topbar-divider" />
            <button
              className="academic-profile"
              onClick={() => goToView("team")}
            >
              <span>
                <strong>{HEAD_OF_INSTRUCTORS}</strong>
                <small>رئيس المدربين</small>
              </span>
              <i>م</i>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>

        <div className="academic-content">
          <div className="academic-breadcrumb">
            <span>الأدوار الأكاديمية</span>
            <ChevronLeft size={13} />
            <b>{VIEW_NAMES[view]}</b>
          </div>
          <section className="academic-welcome">
            <div>
              <span className="academic-eyebrow">
                <i /> قيادة أكاديمية · فرع {BRANCH}
              </span>
              <h1>
                {view === "overview"
                  ? "متابعة الفريق الأكاديمي"
                  : VIEW_NAMES[view]}
              </h1>
              <p>
                {view === "overview"
                  ? "صورة عملية عن أداء المدربين والحصص والتقييمات في نطاق الفرع."
                  : "إشراف أكاديمي ضمن الفرع — دون صلاحيات مالية أو إدارية خارج النطاق."}
              </p>
            </div>
            <div className="academic-welcome-actions">
              <span className="academic-date-pill">
                <CalendarDays size={15} /> السبت، ٢٦ سبتمبر ٢٠٢٦
              </span>
              <button
                className="academic-primary-button"
                onClick={() => goToView("sessions")}
              >
                <CalendarCheck size={15} /> متابعة جدول الحصص
              </button>
            </div>
          </section>

          <div className="academic-demo-banner">
            <span className="academic-demo-icon">
              <AlertCircle size={15} />
            </span>
            <span>
              بيانات الفريق والحصص والتقييمات توضيحية ومحلية. لا يوجد حفظ فعلي
              أو اعتماد إداري من هذه المعاينة.
            </span>
            <b>DEMO</b>
          </div>

          {view === "overview" && (
            <OverviewView
              onNavigate={goToView}
              onOpenEvaluation={openEvaluation}
              reviewedIds={reviewedIds}
              completedSessions={completedSessions}
              todaySessions={todaySessions}
              pendingReviewSessions={pendingReviewSessions}
              averageScore={averageScore}
              readyEvaluationCount={readyEvaluationCount}
              followUpEvaluationCount={followUpEvaluationCount}
            />
          )}
          {view === "team" && <TeamView onNavigate={goToView} />}
          {view === "sessions" && (
            <SessionsView
              query={sessionQuery}
              setQuery={setSessionQuery}
              searchRef={sessionSearchRef}
              statusFilter={sessionStatusFilter}
              setStatusFilter={setSessionStatusFilter}
              sessions={filteredSessions}
              selectedSessionId={selectedSessionId}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSessionId}
              onKeyDown={onSessionKeyDown}
            />
          )}
          {view === "evaluations" && (
            <EvaluationsView
              query={evaluationQuery}
              setQuery={setEvaluationQuery}
              statusFilter={evaluationStatusFilter}
              setStatusFilter={setEvaluationStatusFilter}
              evaluations={filteredEvaluations}
              reviewedIds={reviewedIds}
              onOpen={openEvaluation}
            />
          )}

          <footer className="academic-footnote">
            <span>
              <ShieldCheck size={15} />
            </span>
            <p>
              صلاحيات رئيس المدربين تركز على الإشراف الأكاديمي ومتابعة الحصص
              والتقييمات. التعديلات هنا محلية للتجربة، ولا تُغيّر بيانات المدرب
              أو جدول الفرع.
            </p>
          </footer>
        </div>
      </main>

      {selectedEvaluation && (
        <div
          className="academic-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget)
              setSelectedEvaluationId(null);
          }}
        >
          <section
            className="academic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="academic-evaluation-title"
            dir="rtl"
          >
            <div className="academic-modal-top">
              <span>
                <FileCheck2 size={18} />
              </span>
              <button
                aria-label="إغلاق"
                onClick={() => setSelectedEvaluationId(null)}
              >
                <X size={17} />
              </button>
            </div>
            <span className="academic-modal-kicker">
              مراجعة أكاديمية · {selectedEvaluation.id}
            </span>
            <h2 id="academic-evaluation-title">
              تقييم {selectedEvaluation.student}
            </h2>
            <p>
              {selectedEvaluation.courseName} · المدرب{" "}
              {selectedEvaluation.instructor} ·{" "}
              {formatDate(selectedEvaluation.sessionDate)}
            </p>
            <div className="academic-rubric-list">
              {RUBRIC.map(item => (
                <div className="academic-rubric-row" key={item.key}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <span className="academic-rubric-score">
                    <strong>{selectedEvaluation.scores[item.key]}</strong>
                    <small>/ ٥</small>
                  </span>
                </div>
              ))}
            </div>
            <div className="academic-comment-box">
              <span>
                <MessageCircle size={14} /> ملاحظة المدرب
              </span>
              <p>{selectedEvaluation.comment}</p>
            </div>
            <div className="academic-evaluation-state">
              <span>حالة البطاقة</span>
              <b className={selectedEvaluation.cardStatus}>
                {CARD_STATUS_LABELS[selectedEvaluation.cardStatus]}
              </b>
            </div>
            <div className="academic-modal-actions">
              <button
                className="academic-secondary-button"
                onClick={() => setSelectedEvaluationId(null)}
              >
                إغلاق
              </button>
              <button
                className="academic-primary-button"
                onClick={() => markEvaluationViewed(selectedEvaluation.id)}
              >
                <Eye size={15} /> تسجيل الاطلاع
              </button>
            </div>
            <div className="academic-modal-disclaimer">
              تسجيل الاطلاع حالة توضيحية داخل الصفحة فقط؛ لا يغيّر التقييم أو
              ينشئ بطاقة.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ArrowRightSafe() {
  return <ArrowLeft size={15} />;
}

function OverviewView({
  onNavigate,
  onOpenEvaluation,
  reviewedIds,
  completedSessions,
  todaySessions,
  pendingReviewSessions,
  averageScore,
  readyEvaluationCount,
  followUpEvaluationCount,
}: {
  onNavigate: (view: WorkspaceView) => void;
  onOpenEvaluation: (id: string) => void;
  reviewedIds: string[];
  completedSessions: SessionRecord[];
  todaySessions: SessionRecord[];
  pendingReviewSessions: SessionRecord[];
  averageScore: string;
  readyEvaluationCount: number;
  followUpEvaluationCount: number;
}) {
  const avgSessionAttendance = Math.round(
    completedSessions.reduce(
      (sum, session) => sum + (presentRate(session) ?? 0),
      0
    ) / Math.max(1, completedSessions.length)
  );
  const stats = [
    {
      label: "مدربون نشطون",
      value: "1",
      note: "ضمن نطاق الفرع",
      icon: Users,
      tone: "teal",
      view: "team" as const,
    },
    {
      label: "مجموعات أتابعها",
      value: "3",
      note: "مجموعات توضيحية",
      icon: BookOpen,
      tone: "blue",
      view: "team" as const,
    },
    {
      label: "حصص مكتملة",
      value: String(completedSessions.length),
      note: "في العينة الحالية",
      icon: CalendarCheck,
      tone: "violet",
      view: "sessions" as const,
    },
    {
      label: "متوسط الحضور",
      value: `${avgSessionAttendance}%`,
      note: "للحضور المسجل بالعينة",
      icon: Activity,
      tone: "amber",
      view: "sessions" as const,
    },
  ];
  return (
    <>
      <section className="academic-stats-grid">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <button
              className={`academic-stat-card stat-${item.tone}`}
              key={item.label}
              onClick={() => onNavigate(item.view)}
            >
              <span className="academic-stat-icon">
                <Icon size={18} />
              </span>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
              <span className="academic-stat-note">
                {item.note}
                <ChevronLeft size={12} />
              </span>
            </button>
          );
        })}
      </section>

      <div className="academic-overview-grid">
        <section className="academic-panel academic-trend-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">
                مؤشر المتابعة · آخر ٧ أيام
              </span>
              <h2>انتظام حضور الحصص</h2>
              <p>متوسط حضور توضيحي من الجلسات المكتملة في العينة</p>
            </div>
            <div className="academic-trend-total">
              <strong>{avgSessionAttendance}%</strong>
              <span>
                <ArrowUpLeft size={13} /> مقارنة بالعينة السابقة
              </span>
            </div>
          </div>
          <div
            className="academic-chart"
            role="img"
            aria-label="مؤشر حضور توضيحي لآخر سبعة أيام"
          >
            <div className="academic-chart-axis">
              <span>١٠٠٪</span>
              <span>٧٥٪</span>
              <span>٥٠٪</span>
              <span>٢٥٪</span>
            </div>
            <div className="academic-chart-columns">
              {ATTENDANCE_TREND.map((item, index) => (
                <div className="academic-chart-column" key={item.label}>
                  <span className="academic-chart-value">{item.value}%</span>
                  <div className="academic-chart-track">
                    <i
                      style={{
                        height: `${item.value}%`,
                        animationDelay: `${index * 35}ms`,
                      }}
                    />
                  </div>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="academic-chart-footer">
            <span>
              <i className="academic-chart-legend" /> حضور مسجل
            </span>
            <button onClick={() => onNavigate("sessions")}>
              تفاصيل الجلسات <ChevronLeft size={13} />
            </button>
          </div>
        </section>

        <section className="academic-panel academic-coach-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">ضمن نطاق الفرع</span>
              <h2>متابعة المدربين</h2>
              <p>بيانات تشغيلية توضيحية</p>
            </div>
            <button
              className="academic-text-link"
              onClick={() => onNavigate("team")}
            >
              عرض الفريق <ChevronLeft size={14} />
            </button>
          </div>
          <button
            className="academic-coach-card"
            onClick={() => onNavigate("team")}
          >
            <span className="academic-coach-avatar">{COACH.initials}</span>
            <span className="academic-coach-main">
              <strong>{COACH.name}</strong>
              <small>
                {COACH.role} · {COACH.groups.length} مجموعات
              </small>
            </span>
            <span className="academic-coach-online">
              <i /> نشط
            </span>
            <ChevronLeft size={14} />
          </button>
          <div className="academic-coach-metrics">
            <div>
              <span>الحصص هذا الأسبوع</span>
              <strong>{COACH.sessionsThisWeek}</strong>
            </div>
            <div>
              <span>انتظام الحضور</span>
              <strong>{COACH.attendanceRate}%</strong>
            </div>
            <div>
              <span>اكتمال التقييم</span>
              <strong>{COACH.evaluationRate}%</strong>
            </div>
          </div>
          <div className="academic-group-chips">
            {COACH.groups.map(group => (
              <span key={group}>
                <BookOpen size={12} />
                {group}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="academic-overview-grid academic-overview-lower">
        <section className="academic-panel academic-today-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">السبت · ٢٦ سبتمبر</span>
              <h2>
                جلسات اليوم <small>{todaySessions.length} جلسات</small>
              </h2>
            </div>
            <button
              className="academic-text-link"
              onClick={() => onNavigate("sessions")}
            >
              كل الجلسات <ChevronLeft size={14} />
            </button>
          </div>
          <div className="academic-today-list">
            {todaySessions.map(session => (
              <button
                className="academic-today-row"
                key={session.id}
                onClick={() => onNavigate("sessions")}
              >
                <span className="academic-today-time">
                  <Clock3 size={13} />
                  {session.time.split("–")[0].trim()}
                </span>
                <span className="academic-today-course">
                  <strong>{session.courseName}</strong>
                  <small>
                    {session.groupName} · {session.room}
                  </small>
                </span>
                <span className={`academic-session-status ${session.status}`}>
                  {SESSION_STATUS_LABELS[session.status]}
                </span>
                <ChevronLeft size={14} />
              </button>
            ))}
          </div>
          <div className="academic-panel-footer">
            <span>
              <Users size={13} /> مدرب واحد في المعاينة
            </span>
            <span>بيانات محلية</span>
          </div>
        </section>

        <section className="academic-panel academic-evaluation-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">متابعة جودة التعلّم</span>
              <h2>آخر التقييمات</h2>
              <p>
                متوسط الدرجات التوضيحي{" "}
                <b>
                  <Star size={12} fill="currentColor" />
                  {averageScore} / ٥
                </b>
              </p>
            </div>
            <button
              className="academic-review-count"
              onClick={() => onNavigate("evaluations")}
            >
              <span>{followUpEvaluationCount}</span>
              <small>تحتاج متابعة</small>
              <ChevronLeft size={13} />
            </button>
          </div>
          <div className="academic-evaluation-list">
            {EVALUATIONS.slice(0, 3).map(evaluation => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                reviewed={reviewedIds.includes(evaluation.id)}
                onOpen={() => onOpenEvaluation(evaluation.id)}
              />
            ))}
          </div>
          <div className="academic-panel-footer">
            <span>
              <CheckCircle2 size={13} /> {readyEvaluationCount} بطاقات جاهزة
            </span>
            <button onClick={() => onNavigate("evaluations")}>
              مراجعة التقييمات <ChevronLeft size={13} />
            </button>
          </div>
        </section>
      </div>

      <section className="academic-action-strip">
        <div>
          <span className="academic-action-spark">
            <Sparkles size={16} />
          </span>
          <span>
            <strong>الخطوة التالية</strong>
            <small>
              {pendingReviewSessions.length
                ? "راجع تسجيل حضور الجلسة قيد المراجعة."
                : "تابع اكتمال تقييمات الأسبوع."}
            </small>
          </span>
        </div>
        <div className="academic-action-buttons">
          <button
            className="academic-secondary-button"
            onClick={() => onNavigate("evaluations")}
          >
            <ClipboardCheck size={15} /> متابعة التقييمات{" "}
            <b>{followUpEvaluationCount}</b>
          </button>
          <button
            className="academic-primary-button"
            onClick={() => onNavigate("sessions")}
          >
            <CalendarDays size={15} /> جدول الحصص
          </button>
        </div>
      </section>
    </>
  );
}

function TeamView({
  onNavigate,
}: {
  onNavigate: (view: WorkspaceView) => void;
}) {
  return (
    <>
      <section className="academic-team-summary">
        <div>
          <span className="academic-panel-kicker">نطاق إشراف مريم حسن</span>
          <h2>فريق المدربين في {BRANCH}</h2>
          <p>
            المدربون المعيّنون لهذا الفرع فقط. الأرقام والنسب في هذه الواجهة
            توضيحية.
          </p>
        </div>
        <div className="academic-team-total">
          <strong>1</strong>
          <span>مدرب نشط</span>
        </div>
      </section>
      <section className="academic-panel academic-team-table-panel">
        <div className="academic-panel-heading">
          <div>
            <span className="academic-panel-kicker">
              الأعضاء المرتبطون بدور رئيس المدربين
            </span>
            <h2>
              فريق العمل الأكاديمي <small>1 عضو</small>
            </h2>
          </div>
          <button
            className="academic-secondary-button"
            onClick={() => onNavigate("sessions")}
          >
            <CalendarCheck size={15} /> تغطية الحصص
          </button>
        </div>
        <div className="academic-coach-profile-card">
          <span className="academic-coach-avatar large">{COACH.initials}</span>
          <div className="academic-coach-profile-main">
            <strong>{COACH.name}</strong>
            <small>
              {COACH.role} · رقم الموظف <bdi dir="ltr">{COACH.id}</bdi>
            </small>
            <span className="academic-coach-online">
              <i /> {COACH.status === "active" ? "نشط" : "في إجازة"}
            </span>
          </div>
          <div className="academic-team-stat">
            <small>مجموعات التدريس</small>
            <strong>{COACH.groups.length}</strong>
          </div>
          <div className="academic-team-stat">
            <small>حصص هذا الأسبوع</small>
            <strong>{COACH.sessionsThisWeek}</strong>
          </div>
          <div className="academic-team-stat">
            <small>الحضور المسجل</small>
            <strong>{COACH.attendanceRate}%</strong>
          </div>
          <button
            className="academic-icon-button"
            aria-label="عرض حصص المدرب"
            onClick={() => onNavigate("sessions")}
          >
            <ArrowUpLeft size={16} />
          </button>
        </div>
        <div className="academic-group-list-heading">
          <strong>المجموعات الأكاديمية</strong>
          <span>3 مجموعات توضيحية</span>
        </div>
        <div className="academic-group-list">
          {COACH.groups.map((group, index) => {
            const groupSession = SESSIONS.find(
              session => session.courseName === group
            );
            return (
              <button key={group} onClick={() => onNavigate("sessions")}>
                <span className={`academic-group-icon tone-${index}`}>
                  <BookOpen size={16} />
                </span>
                <span>
                  <strong>{group}</strong>
                  <small>
                    {index === 0
                      ? "المستوى المتوسط · 10–12 سنة"
                      : index === 1
                        ? "المستوى التأسيسي · 7–9 سنوات"
                        : "المستوى المتوسط · 10–12 سنة"}
                  </small>
                </span>
                <span className="academic-group-next">
                  {groupSession?.dateLabel ?? "هذا الأسبوع"}
                  <small>{groupSession?.time ?? "حسب الجدول"}</small>
                </span>
                <ChevronLeft size={14} />
              </button>
            );
          })}
        </div>
      </section>
      <section className="academic-permission-note">
        <ShieldCheck size={17} />
        <p>
          المدربون والمجموعات هنا للمتابعة الأكاديمية. إدارة الحسابات وتغيير
          الدور أو حالة الموظف تظل ضمن صلاحيات مدير الفرع.
        </p>
        <button onClick={() => window.location.assign("/team")}>
          إدارة الفريق <ArrowUpLeft size={13} />
        </button>
      </section>
    </>
  );
}

function SessionsView({
  query,
  setQuery,
  searchRef,
  statusFilter,
  setStatusFilter,
  sessions,
  selectedSessionId,
  selectedSession,
  onSelectSession,
  onKeyDown,
}: {
  query: string;
  setQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sessions: SessionRecord[];
  selectedSessionId: string;
  selectedSession: SessionRecord;
  onSelectSession: (id: string) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLTableRowElement>,
    sessionId: string
  ) => void;
}) {
  const completedCount = SESSIONS.filter(
    session => session.status === "completed"
  ).length;
  const pendingCount = SESSIONS.filter(
    session => session.status === "pending_approval"
  ).length;
  const scheduledCount = SESSIONS.filter(
    session => session.status === "scheduled"
  ).length;
  return (
    <>
      <div className="academic-mini-kpis">
        <span>
          <i className="mini-teal" />
          <b>{SESSIONS.length}</b> جلسات في العينة
        </span>
        <span>
          <i className="mini-blue" />
          <b>{completedCount}</b> مكتملة
        </span>
        <span>
          <i className="mini-amber" />
          <b>{pendingCount}</b> مراجعة تسجيل
        </span>
        <span>
          <i className="mini-violet" />
          <b>{scheduledCount}</b> قادمة
        </span>
      </div>
      <div className="academic-workspace-grid">
        <section className="academic-panel academic-sessions-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">
                جلسات الفرع · بيانات توضيحية
              </span>
              <h2>
                سجل الحصص والحضور <small>{sessions.length} نتائج</small>
              </h2>
            </div>
          </div>
          <div className="academic-filter-row">
            <label className="academic-search">
              <Search size={15} />
              <input
                aria-label="بحث في الحصص"
                placeholder="ابحث بالكورس أو المدرب أو المجموعة..."
                ref={searchRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <label className="academic-filter-select">
              <span>الحالة</span>
              <select
                aria-label="تصفية الحصص حسب الحالة"
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
              >
                <option value="all">كل الحالات</option>
                {Object.entries(SESSION_STATUS_LABELS).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="academic-session-table-wrap">
            <table className="academic-session-table">
              <thead>
                <tr>
                  <th>الجلسة</th>
                  <th>المدرب</th>
                  <th>التاريخ والوقت</th>
                  <th>الحضور</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr
                    key={session.id}
                    tabIndex={0}
                    aria-label={`تفاصيل جلسة ${session.courseName}`}
                    aria-current={
                      selectedSessionId === session.id ? "true" : undefined
                    }
                    className={
                      selectedSessionId === session.id ? "selected" : ""
                    }
                    onClick={() => onSelectSession(session.id)}
                    onKeyDown={event => onKeyDown(event, session.id)}
                  >
                    <td>
                      <span className="academic-session-name">
                        <i>
                          <BookOpen size={14} />
                        </i>
                        <span>
                          <strong>{session.courseName}</strong>
                          <small>
                            {session.groupName} · {session.offeringId}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td>{session.instructor}</td>
                    <td>
                      <span className="academic-session-date">
                        {session.dateLabel}
                        <small>
                          <bdi dir="ltr">{session.time}</bdi>
                        </small>
                      </span>
                    </td>
                    <td>
                      {session.attendance ? (
                        <span className="academic-attendance-ratio">
                          <strong>
                            {session.attendance.present +
                              session.attendance.late}
                          </strong>{" "}
                          / {session.students}
                          <small>{presentRate(session)}%</small>
                        </span>
                      ) : (
                        <span className="academic-not-recorded">
                          لم يُسجّل بعد
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`academic-session-status ${session.status}`}
                      >
                        {SESSION_STATUS_LABELS[session.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="academic-empty">
                        <Search size={18} />
                        <strong>لا توجد جلسات مطابقة</strong>
                        <button
                          onClick={() => {
                            setQuery("");
                            setStatusFilter("all");
                          }}
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
          <div className="academic-table-footer">
            <span>
              <ShieldCheck size={13} /> مراجعة أكاديمية ضمن فرع {BRANCH}
            </span>
            <span>لا يوجد تعديل على الجدول</span>
          </div>
        </section>
        <SessionDetail session={selectedSession} />
      </div>
    </>
  );
}

function SessionDetail({ session }: { session: SessionRecord }) {
  const attendance = session.attendance;
  const items = attendance
    ? [
        { label: "حاضر", value: attendance.present, className: "present" },
        { label: "متأخر", value: attendance.late, className: "late" },
        { label: "غائب", value: attendance.absent, className: "absent" },
        { label: "بعذر", value: attendance.excused, className: "excused" },
      ]
    : [];
  return (
    <aside className="academic-panel academic-session-detail">
      <div className="academic-detail-kicker">
        تفاصيل الجلسة <small dir="ltr">{session.id}</small>
      </div>
      <div className="academic-detail-icon">
        <BookOpen size={20} />
      </div>
      <h3>{session.courseName}</h3>
      <p>{session.groupName}</p>
      <span className={`academic-session-status ${session.status}`}>
        {SESSION_STATUS_LABELS[session.status]}
      </span>
      <div className="academic-detail-list">
        <div>
          <span>المدرب</span>
          <strong>{session.instructor}</strong>
        </div>
        <div>
          <span>التاريخ</span>
          <strong>{session.dateLabel}</strong>
        </div>
        <div>
          <span>الوقت</span>
          <strong dir="ltr">{session.time}</strong>
        </div>
        <div>
          <span>المكان</span>
          <strong>{session.room}</strong>
        </div>
        <div>
          <span>المجموعة</span>
          <strong dir="ltr">{session.offeringId}</strong>
        </div>
      </div>
      <div className="academic-attendance-breakdown">
        <div className="academic-breakdown-heading">
          <strong>ملخص تسجيل الحضور</strong>
          <small>{attendance ? `${session.students} طلاب` : "لم يُسجّل"}</small>
        </div>
        {attendance ? (
          items.map(item => (
            <div className="academic-attendance-line" key={item.className}>
              <span>
                <i className={item.className} />
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))
        ) : (
          <div className="academic-attendance-empty">
            <Clock3 size={14} /> ستظهر تفاصيل الحضور بعد التسجيل
          </div>
        )}
      </div>
      {session.status === "pending_approval" && (
        <div className="academic-session-hint">
          <AlertCircle size={14} />
          <span>
            حالة الجلسة تشير إلى مراجعة التسجيل. أي اعتماد رسمي خارج نطاق هذه
            المعاينة.
          </span>
        </div>
      )}
      <div className="academic-detail-local-note">
        <ShieldCheck size={13} /> للعرض فقط · لا يمكن تعديل السجل هنا
      </div>
    </aside>
  );
}

function EvaluationsView({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  evaluations,
  reviewedIds,
  onOpen,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  evaluations: EvaluationRecord[];
  reviewedIds: string[];
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <section className="academic-review-summary">
        <div>
          <span className="academic-panel-kicker">
            التقييمات الأكاديمية · بيانات توضيحية
          </span>
          <h2>متابعة تقدّم الطلاب</h2>
          <p>
            استعرض درجات المعايير وملاحظات المدرب، وسجّل الاطلاع محليًا عند
            الانتهاء.
          </p>
        </div>
        <div className="academic-review-summary-stats">
          <span>
            <strong>{EVALUATIONS.length}</strong>
            <small>نماذج تقييم</small>
          </span>
          <span>
            <strong>
              {EVALUATIONS.filter(item => item.cardStatus === "ready").length}
            </strong>
            <small>بطاقات جاهزة</small>
          </span>
          <span>
            <strong>
              {EVALUATIONS.filter(item => item.cardStatus !== "ready").length}
            </strong>
            <small>بطاقات قيد التجهيز</small>
          </span>
        </div>
      </section>
      <section className="academic-panel academic-evaluation-workspace">
        <div className="academic-panel-heading">
          <div>
            <span className="academic-panel-kicker">
              المعيار مأخوذ من نموذج التقييم
            </span>
            <h2>
              قائمة تقييمات الطلاب <small>{evaluations.length} نتائج</small>
            </h2>
          </div>
          <div className="academic-rubric-note">
            <Star size={13} /> ٣ معايير · كل معيار من ٥
          </div>
        </div>
        <div className="academic-filter-row">
          <label className="academic-search">
            <Search size={15} />
            <input
              aria-label="بحث في التقييمات"
              placeholder="ابحث باسم الطالب أو المجموعة..."
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <label className="academic-filter-select">
            <span>حالة البطاقة</span>
            <select
              aria-label="تصفية التقييمات حسب حالة البطاقة"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            >
              <option value="all">كل الحالات</option>
              {Object.entries(CARD_STATUS_LABELS).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="academic-evaluation-list academic-evaluation-list-full">
          {evaluations.map(evaluation => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              reviewed={reviewedIds.includes(evaluation.id)}
              onOpen={() => onOpen(evaluation.id)}
            />
          ))}
          {evaluations.length === 0 && (
            <div className="academic-empty">
              <Search size={18} />
              <strong>لا توجد تقييمات مطابقة</strong>
              <button
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
        <div className="academic-table-footer">
          <span>
            <ShieldCheck size={13} /> «تم الاطلاع» حالة محلية للاستخدام خلال
            المعاينة فقط
          </span>
          <span>لا يوجد تعديل على درجات الطلاب</span>
        </div>
      </section>
    </>
  );
}
