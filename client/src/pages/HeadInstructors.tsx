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
import AuditTimeline, { type AuditEvent } from "@/components/AuditTimeline";
import EvaluationReviewQueue from "@/components/EvaluationReviewQueue";
import InstructorPerformanceComparison from "@/components/InstructorPerformanceComparison";
import ReasonField from "@/components/ReasonField";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import {
  EmptyState,
  LoadingState,
  LockedState,
} from "@/components/FeedbackStates";
import WorkflowStepper from "@/components/WorkflowStepper";
import { apiClient } from "@/lib/apiClient";

type WorkspaceView =
  | "overview"
  | "team"
  | "sessions"
  | "approvals"
  | "evaluations";
type SessionStatus =
  | "scheduled"
  | "completed"
  | "pending_approval"
  | "cancelled"
  | "rescheduled";
type EvaluationCardStatus = "pending" | "generating" | "ready";
type EvaluationReviewStatus = "pending" | "approved" | "changes_requested";
type AttendanceEntry = {
  studentId: string;
  student: string;
  status: "present" | "absent" | "late" | "excused";
  lateMinutes?: number;
  note?: string;
};
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
  attendanceEntries?: AttendanceEntry[];
  instructorNote?: string;
};
type AttendanceDecision = {
  id: string;
  sessionId: string;
  courseName: string;
  groupName: string;
  instructor: string;
  sessionDate: string;
  actor: string;
  decision: "approved" | "returned";
  note: string;
  decidedAt: string;
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
  approvals: "اعتماد الحضور",
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

const COACHES: Coach[] = [
  {
    id: "USR-0202",
    name: "عمر سامح",
    initials: "عس",
    role: `مدرب · ${BRANCH}`,
    phone: "01123456789",
    groups: ["روبوتكس مستوى 2", "برمجة للمبتدئين", "أساسيات تصميم الروبوت"],
    sessionsThisWeek: 6,
    attendanceRate: 88,
    evaluationRate: 83,
    status: "active",
  },
  {
    id: "USR-0208",
    name: "دينا مصطفى",
    initials: "دم",
    role: `مدربة · ${BRANCH}`,
    phone: "01045678912",
    groups: ["دوائر إلكترونية للمبتدئين", "برمجة ألعاب المستوى الأول"],
    sessionsThisWeek: 5,
    attendanceRate: 92,
    evaluationRate: 86,
    status: "active",
  },
  {
    id: "USR-0209",
    name: "كريم أشرف",
    initials: "كأ",
    role: `مدرب · ${BRANCH}`,
    phone: "01267890123",
    groups: ["روبوتكس متقدم", "أساسيات الذكاء الاصطناعي"],
    sessionsThisWeek: 4,
    attendanceRate: 85,
    evaluationRate: 79,
    status: "active",
  },
];
const COACH = COACHES[0];

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
    attendanceEntries: [
      { studentId: "ST-0241", student: "آدم رامي", status: "present" },
      { studentId: "ST-0242", student: "جنى حسام", status: "present" },
      { studentId: "ST-0243", student: "سليم تامر", status: "present" },
      { studentId: "ST-0244", student: "نور أحمد", status: "present" },
      { studentId: "ST-0245", student: "ملك شريف", status: "present" },
      { studentId: "ST-0246", student: "عمر خالد", status: "present" },
      { studentId: "ST-0247", student: "فرح إيهاب", status: "present" },
      { studentId: "ST-0249", student: "زياد مصطفى", status: "absent" },
    ],
    instructorNote: "تم تسجيل الغياب بعد التواصل مع المجموعة.",
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
  {
    id: "SES-NSR-0926-11",
    offeringId: "GRP-046",
    courseName: "دوائر إلكترونية للمبتدئين",
    groupName: "المستوى التأسيسي · 9–11 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "01:00 – 02:30 م",
    room: "معمل 3",
    instructor: COACHES[1].name,
    status: "pending_approval",
    students: 7,
    attendance: { present: 5, absent: 1, late: 1, excused: 0 },
    attendanceEntries: [
      { studentId: "ST-0311", student: "ليلى محمود", status: "present" },
      { studentId: "ST-0312", student: "يوسف وائل", status: "present" },
      { studentId: "ST-0313", student: "مريم عادل", status: "present" },
      { studentId: "ST-0314", student: "علي شادي", status: "present" },
      { studentId: "ST-0315", student: "رنا أحمد", status: "present" },
      {
        studentId: "ST-0316",
        student: "كريم سامي",
        status: "late",
        lateMinutes: 12,
      },
      {
        studentId: "ST-0317",
        student: "سيف طارق",
        status: "absent",
        note: "تم التواصل مع ولي الأمر",
      },
    ],
    instructorNote: "تم تسجيل تأخر طالب واحد، مع توثيق الغياب في نهاية الحصة.",
  },
  {
    id: "SES-NSR-0926-12",
    offeringId: "GRP-048",
    courseName: "أساسيات الذكاء الاصطناعي",
    groupName: "المستوى التأسيسي · 12–14 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "04:00 – 05:30 م",
    room: "معمل 2",
    instructor: COACHES[2].name,
    status: "pending_approval",
    students: 6,
    attendance: { present: 4, absent: 2, late: 0, excused: 0 },
    attendanceEntries: [
      { studentId: "ST-0321", student: "يحيى حسام", status: "present" },
      { studentId: "ST-0322", student: "تاليا عمرو", status: "present" },
      { studentId: "ST-0323", student: "عمر أسامة", status: "present" },
      { studentId: "ST-0324", student: "نور كريم", status: "present" },
      {
        studentId: "ST-0325",
        student: "مالك محمود",
        status: "absent",
        note: "لم يحضر",
      },
      {
        studentId: "ST-0326",
        student: "جود ياسر",
        status: "absent",
        note: "تم التواصل مع ولي الأمر",
      },
    ],
    instructorNote: "غياب طالبان؛ تم التواصل مع ولي الأمر حسب الإجراء المعتاد.",
  },
  {
    id: "SES-NSR-0925-07",
    offeringId: "GRP-047",
    courseName: "برمجة ألعاب المستوى الأول",
    groupName: "المستوى التأسيسي · 10–12 سنة",
    date: "2026-09-25",
    dateLabel: "الجمعة 25 سبتمبر",
    time: "02:00 – 03:30 م",
    room: "معمل 3",
    instructor: COACHES[1].name,
    status: "completed",
    students: 8,
    attendance: { present: 7, absent: 1, late: 0, excused: 0 },
  },
  {
    id: "SES-NSR-0925-09",
    offeringId: "GRP-047",
    courseName: "روبوتكس متقدم",
    groupName: "المستوى المتقدم · 13–15 سنة",
    date: "2026-09-25",
    dateLabel: "الجمعة 25 سبتمبر",
    time: "05:00 – 06:30 م",
    room: "معمل الروبوتات",
    instructor: COACHES[2].name,
    status: "completed",
    students: 5,
    attendance: { present: 4, absent: 0, late: 1, excused: 0 },
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
  {
    id: "EVAL-2421",
    student: "كريم سامي",
    studentId: "ST-0316",
    courseName: "دوائر إلكترونية للمبتدئين",
    instructor: COACHES[1].name,
    sessionDate: "2026-09-25",
    cardStatus: "ready",
    scores: { understanding: 4, practice: 4, collaboration: 3 },
    comment:
      "فهم توصيل الدائرة بسرعة، ويحتاج مراجعة ترتيب المكونات قبل التشغيل.",
  },
  {
    id: "EVAL-2422",
    student: "تاليا عمرو",
    studentId: "ST-0322",
    courseName: "أساسيات الذكاء الاصطناعي",
    instructor: COACHES[2].name,
    sessionDate: "2026-09-24",
    cardStatus: "pending",
    scores: { understanding: 3, practice: 4, collaboration: 5 },
    comment: "مشاركة قوية في النقاش؛ نوصي بمتابعة شرح خطوات بناء النموذج.",
  },
  {
    id: "EVAL-2423",
    student: "رنا أحمد",
    studentId: "ST-0315",
    courseName: "برمجة ألعاب المستوى الأول",
    instructor: COACHES[1].name,
    sessionDate: "2026-09-23",
    cardStatus: "generating",
    scores: { understanding: 5, practice: 4, collaboration: 4 },
    comment: "أنجزت حركة الشخصية وربطت الأوامر بتسلسل منطقي.",
  },
  {
    id: "EVAL-2424",
    student: "يحيى حسام",
    studentId: "ST-0321",
    courseName: "روبوتكس متقدم",
    instructor: COACHES[2].name,
    sessionDate: "2026-09-22",
    cardStatus: "ready",
    scores: { understanding: 4, practice: 5, collaboration: 4 },
    comment: "أظهر استقلالية جيدة في اختبار المستشعرات والعمل مع الفريق.",
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
      {evaluation.cardStatus === "generating" ? (
        <LoadingState compact label="جارٍ تجهيز البطاقة" />
      ) : (
        <span className={`academic-card-status ${evaluation.cardStatus}`}>
          {reviewed ? "تم الاطلاع" : CARD_STATUS_LABELS[evaluation.cardStatus]}
        </span>
      )}
      <ChevronLeft size={15} className="academic-row-chevron" />
    </button>
  );
}

export default function HeadInstructors() {
  const [, navigate] = useLocation();
  const liveMode = apiClient.hasSession();
  const sessionSearchRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<WorkspaceView>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return VIEW_VALUES.includes(requested as WorkspaceView)
      ? (requested as WorkspaceView)
      : "overview";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState<AttendanceDecision[]>(
    []
  );
  const [resolvedAttendanceIds, setResolvedAttendanceIds] = useState<string[]>(
    []
  );
  const [selectedSessionId, setSelectedSessionId] = useState(SESSIONS[0].id);
  const [selectedApprovalId, setSelectedApprovalId] = useState(
    SESSIONS.find(session => session.status === "pending_approval")?.id ??
      SESSIONS[0].id
  );
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("all");
  const [evaluationQuery, setEvaluationQuery] = useState("");
  const [evaluationStatusFilter, setEvaluationStatusFilter] = useState("all");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    string | null
  >(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [evaluationReviewStatuses, setEvaluationReviewStatuses] = useState<
    Record<string, EvaluationReviewStatus>
  >({});
  const [evaluationReviewNote, setEvaluationReviewNote] = useState("");

  const selectedSession =
    SESSIONS.find(session => session.id === selectedSessionId) ?? SESSIONS[0];
  const selectedEvaluation = liveMode ? undefined : EVALUATIONS.find(
    evaluation => evaluation.id === selectedEvaluationId
  );
  const selectedEvaluationReviewStatus = selectedEvaluation
    ? (evaluationReviewStatuses[selectedEvaluation.id] ?? "pending")
    : "pending";
  const evaluationReviewEvents: AuditEvent[] = selectedEvaluation
    ? [
        {
          id: `${selectedEvaluation.id}-submitted`,
          title: "تم إرسال التقييم",
          description: selectedEvaluation.comment,
          actor: selectedEvaluation.instructor,
          timestamp: formatDate(selectedEvaluation.sessionDate),
          tone: "pending" as const,
        },
        ...(selectedEvaluationReviewStatus !== "pending"
          ? [
              {
                id: `${selectedEvaluation.id}-decision`,
                title:
                  selectedEvaluationReviewStatus === "approved"
                    ? "تم اعتماد التقييم"
                    : "مطلوب تعديل",
                description:
                  selectedEvaluationReviewStatus === "approved"
                    ? "التقييم جاهز للمشاركة بعد ربط النظام."
                    : "أُعيد للمدرب مع ملاحظة مراجعة.",
                actor: "رئيس المدربين",
                timestamp: "الآن",
                tone:
                  selectedEvaluationReviewStatus === "approved"
                    ? ("approved" as const)
                    : ("rejected" as const),
              },
            ]
          : []),
      ]
    : [];
  const approvedAttendanceIds = useMemo(
    () =>
      decisionHistory
        .filter(decision => decision.decision === "approved")
        .map(decision => decision.sessionId),
    [decisionHistory]
  );
  const visibleSessions = useMemo(
    () =>
      SESSIONS.map(session =>
        approvedAttendanceIds.includes(session.id) &&
        session.status === "pending_approval"
          ? { ...session, status: "completed" as const }
          : session
      ),
    [approvedAttendanceIds]
  );
  const completedSessions = visibleSessions.filter(
    session => session.status === "completed"
  );
  const todaySessions = visibleSessions.filter(
    session => session.date === "2026-09-26"
  );
  const pendingReviewSessions = visibleSessions.filter(
    session =>
      session.status === "pending_approval" &&
      !resolvedAttendanceIds.includes(session.id)
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
    return visibleSessions
      .filter(session => {
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
      })
      .sort((first, second) =>
        `${first.date} ${first.time}`.localeCompare(
          `${second.date} ${second.time}`
        )
      );
  }, [visibleSessions, sessionQuery, sessionStatusFilter]);
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
  const decideEvaluation = (
    id: string,
    status: Exclude<EvaluationReviewStatus, "pending">,
    note = ""
  ) => {
    setEvaluationReviewStatuses(current => ({ ...current, [id]: status }));
    setReviewedIds(current =>
      current.includes(id) ? current : [...current, id]
    );
    setEvaluationReviewNote("");
    setSelectedEvaluationId(null);
    toast.success(
      status === "approved" ? "تم اعتماد التقييم" : "أُعيد التقييم للتعديل",
      { description: note || "تم تسجيل القرار محليًا داخل المعاينة." }
    );
  };
  const recordAttendanceDecision = (
    session: SessionRecord,
    decision: AttendanceDecision["decision"],
    note: string
  ) => {
    const decidedAt = new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    setDecisionHistory(current => [
      {
        id: `DEC-${Date.now()}`,
        sessionId: session.id,
        courseName: session.courseName,
        groupName: session.groupName,
        instructor: session.instructor,
        sessionDate: session.date,
        actor: HEAD_OF_INSTRUCTORS,
        decision,
        note: note.trim(),
        decidedAt,
      },
      ...current,
    ]);
    setResolvedAttendanceIds(current =>
      current.includes(session.id) ? current : [...current, session.id]
    );
    toast.success(
      decision === "approved"
        ? "تم اعتماد الحضور في المعاينة"
        : "تمت إعادة التسجيل للمدرب",
      { description: "القرار والسجل محليان ولا يُحفظان خارج هذه الجلسة." }
    );
  };
  const reopenAttendanceReview = (sessionId: string) => {
    setResolvedAttendanceIds(current => current.filter(id => id !== sessionId));
    toast.success("أُعيد الطلب إلى قائمة المراجعة المحلية", {
      description: "احتفظنا بقرار المراجعة السابق في السجل.",
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
    <RoleDashboardShell
      className="academic-shell"
      roleCode="R03"
      roleLabel="رئيس المدربين"
      scopeLevel="branch"
      scopeLabel="فرع واحد · فريق المدربين والجلسات التابعة"
      branchName={BRANCH}
    >
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
            className={view === "approvals" ? "active" : ""}
            onClick={() => goToView("approvals")}
          >
            <CheckCircle2 size={17} />
            <span>اعتماد الحضور</span>
            <b>{pendingReviewSessions.length}</b>
          </button>
          <button
            className={view === "evaluations" ? "active" : ""}
            onClick={() => goToView("evaluations")}
          >
            <ClipboardCheck size={17} />
            <span>تقييمات الطلاب</span>
            <b>{liveMode ? "LIVE" : followUpEvaluationCount}</b>
          </button>
        </nav>
        <div className="academic-sidebar-divider" />
        <button
          className="academic-nav-link"
          onClick={() => navigate("/academic-programs")}
        >
          <BookOpen size={16} />
          <span>إدارة البرامج والمناهج</span>
          <ChevronLeft size={14} />
        </button>
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
                  ? "إشراف على أداء المدربين والحصص والتقييمات في نطاق الفرع، مع رفع تقرير المجموعة لمدير الفرع."
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
              <button
                className="academic-secondary-button"
                onClick={() =>
                  toast.success("تم تجهيز تقرير المدربين لمدير الفرع", {
                    description:
                      "التقرير التوضيحي يجمع الحضور والتقييمات ونقاط الدعم.",
                  })
                }
              >
                <FileCheck2 size={15} /> تقرير لمدير الفرع
              </button>
            </div>
          </section>

          <div className="academic-demo-banner">
            <span className="academic-demo-icon">
              <AlertCircle size={15} />
            </span>
            <span>
              {liveMode ? "مراجعة التقييمات LIVE من الخادم؛ بقية بيانات الفريق والحصص في هذه الصفحة ما زالت توضيحية." : "بيانات الفريق والحصص والتقييمات توضيحية ومحلية. لا يوجد حفظ فعلي أو اعتماد إداري من هذه المعاينة."}
            </span>
            <b>{liveMode ? "LIVE + DEMO" : "DEMO"}</b>
          </div>
          <RoleScopeCard className="academic-role-scope-card" compact />

          {view === "overview" && (
            <OverviewView
              onNavigate={goToView}
              onOpenEvaluation={openEvaluation}
              reviewedIds={reviewedIds}
              completedSessions={completedSessions}
              todaySessions={todaySessions}
              pendingReviewSessions={pendingReviewSessions}
              decisionHistory={decisionHistory}
              averageScore={averageScore}
              readyEvaluationCount={readyEvaluationCount}
              followUpEvaluationCount={followUpEvaluationCount}
              liveMode={liveMode}
              branch={BRANCH}
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
              summarySessions={visibleSessions}
              selectedSessionId={selectedSessionId}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSessionId}
              onKeyDown={onSessionKeyDown}
            />
          )}
          {view === "approvals" && (
            <AttendanceApprovalsView
              sessions={pendingReviewSessions}
              allSessions={visibleSessions}
              history={decisionHistory}
              resolvedIds={resolvedAttendanceIds}
              selectedSessionId={selectedApprovalId}
              onSelectSession={setSelectedApprovalId}
              onDecision={recordAttendanceDecision}
              onReopen={reopenAttendanceReview}
            />
          )}
          {view === "evaluations" && (
            liveMode ? <EvaluationReviewQueue /> : <EvaluationsView
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
              رئيس المدربين يراجع التقييمات والحضور ويقترح الدعم والتطوير، لكنه
              لا يغيّر الماليات أو حسابات المستخدمين أو قرارات مدير الفرع. أي
              ملاحظة حساسة تُرفع في تقرير واضح بدل اتخاذ إجراء إداري مباشر.
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
            <WorkflowStepper
              title="دورة التقييم"
              description="من إرسال المدرب حتى قرار رئيس المدربين."
              steps={[
                {
                  id: "submitted",
                  label: "أرسل المدرب التقييم",
                  caption: "مكتمل",
                  status: "complete",
                },
                {
                  id: "review",
                  label: "مراجعة رئيس المدربين",
                  caption:
                    selectedEvaluationReviewStatus === "pending"
                      ? "بانتظار القرار"
                      : "تمت المراجعة",
                  status:
                    selectedEvaluationReviewStatus === "pending"
                      ? "current"
                      : "complete",
                },
                {
                  id: "share",
                  label: "المشاركة مع ولي الأمر",
                  caption:
                    selectedEvaluationReviewStatus === "approved"
                      ? "الخطوة التالية"
                      : "بعد الاعتماد",
                  status:
                    selectedEvaluationReviewStatus === "approved"
                      ? "current"
                      : "upcoming",
                },
              ]}
            />
            <AuditTimeline
              events={evaluationReviewEvents}
              emptyLabel="لا يوجد سجل مراجعة بعد."
            />
            {selectedEvaluationReviewStatus === "pending" && (
              <ReasonField
                id="evaluation-review-note"
                label="ملاحظة المراجعة"
                helper="اختيارية للاعتماد؛ مطلوبة عند طلب التعديل"
                value={evaluationReviewNote}
                onChange={setEvaluationReviewNote}
                placeholder="اكتب ما يجب تثبيته أو تعديله قبل المشاركة..."
              />
            )}
            <div className="academic-modal-actions">
              <button
                className="academic-secondary-button"
                onClick={() => setSelectedEvaluationId(null)}
              >
                إغلاق
              </button>
              {selectedEvaluationReviewStatus === "pending" ? (
                <>
                  <button
                    className="academic-secondary-button academic-return-button"
                    disabled={!evaluationReviewNote.trim()}
                    onClick={() =>
                      decideEvaluation(
                        selectedEvaluation.id,
                        "changes_requested",
                        evaluationReviewNote
                      )
                    }
                  >
                    <ArrowLeft size={15} /> طلب تعديل
                  </button>
                  <button
                    className="academic-primary-button"
                    onClick={() =>
                      decideEvaluation(
                        selectedEvaluation.id,
                        "approved",
                        evaluationReviewNote
                      )
                    }
                  >
                    <Check size={15} /> اعتماد التقييم
                  </button>
                </>
              ) : (
                <button
                  className="academic-primary-button"
                  onClick={() => setSelectedEvaluationId(null)}
                >
                  <Eye size={15} /> إغلاق المراجعة
                </button>
              )}
            </div>
            <div className="academic-modal-disclaimer">
              هذه حالة توضيحية محلية؛ الاعتماد الحقيقي يحتاج Evaluation API
              وAudit Log ومشاركة خاضعة للسياسة.
            </div>
          </section>
        </div>
      )}
    </RoleDashboardShell>
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
  decisionHistory,
  averageScore,
  readyEvaluationCount,
  followUpEvaluationCount,
  liveMode,
  branch,
}: {
  onNavigate: (view: WorkspaceView) => void;
  onOpenEvaluation: (id: string) => void;
  reviewedIds: string[];
  completedSessions: SessionRecord[];
  todaySessions: SessionRecord[];
  pendingReviewSessions: SessionRecord[];
  decisionHistory: AttendanceDecision[];
  averageScore: string;
  readyEvaluationCount: number;
  followUpEvaluationCount: number;
  liveMode: boolean;
  branch: string;
}) {
  const avgSessionAttendance = Math.round(
    completedSessions.reduce(
      (sum, session) => sum + (presentRate(session) ?? 0),
      0
    ) / Math.max(1, completedSessions.length)
  );
  const activeCoachCount = COACHES.filter(
    coach => coach.status === "active"
  ).length;
  const groupCount = COACHES.reduce(
    (total, coach) => total + coach.groups.length,
    0
  );
  const stats = [
    {
      label: "مدربون نشطون",
      value: String(activeCoachCount),
      note: "ضمن نطاق الفرع",
      icon: Users,
      tone: "teal",
      view: "team" as const,
    },
    {
      label: "مجموعات أتابعها",
      value: String(groupCount),
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
      <section className="academic-approval-shortcut">
        <span className="academic-approval-shortcut-icon">
          <ClipboardCheck size={18} />
        </span>
        <div className="academic-approval-shortcut-copy">
          <small>مراجعة تسجيل الحضور</small>
          <strong>
            {pendingReviewSessions.length
              ? `${pendingReviewSessions.length} حصص بانتظار الاعتماد`
              : "لا توجد طلبات حضور معلقة"}
          </strong>
          <span>
            {decisionHistory[0]
              ? `آخر قرار: ${decisionHistory[0].decision === "approved" ? "اعتماد" : "إعادة للمدرب"} · ${decisionHistory[0].courseName}`
              : "افحص سجل الطلاب والملاحظات قبل اتخاذ القرار."}
          </span>
        </div>
        <button
          className="academic-secondary-button"
          onClick={() => onNavigate("approvals")}
        >
          فتح قائمة الاعتماد
          {pendingReviewSessions.length > 0 && (
            <b>{pendingReviewSessions.length}</b>
          )}
          <ChevronLeft size={14} />
        </button>
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
          <div className="academic-coach-overview-list">
            {COACHES.map(coach => (
              <article className="academic-coach-overview-item" key={coach.id}>
                <button
                  className="academic-coach-mini-profile"
                  onClick={() => onNavigate("team")}
                >
                  <span className="academic-coach-avatar">
                    {coach.initials}
                  </span>
                  <span className="academic-coach-main">
                    <strong>{coach.name}</strong>
                    <small>
                      {coach.role} · {coach.groups.length} مجموعات
                    </small>
                  </span>
                  <span className="academic-coach-online">
                    <i /> {coach.status === "active" ? "نشط" : "في إجازة"}
                  </span>
                  <ChevronLeft size={14} />
                </button>
                <div className="academic-coach-compact-metrics">
                  <span>
                    <b>{coach.sessionsThisWeek}</b> حصص هذا الأسبوع
                  </span>
                  <span>
                    <b>{coach.attendanceRate}%</b> انتظام الحضور
                  </span>
                  <span>
                    <b>{coach.evaluationRate}%</b> اكتمال التقييم
                  </span>
                </div>
                <div className="academic-group-chips">
                  {coach.groups.map(group => (
                    <span key={group}>
                      <BookOpen size={12} />
                      {group}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <InstructorPerformanceComparison scope="branch" branch={branch} />

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
              <Users size={13} /> {COACHES.length} مدربين في المعاينة
            </span>
            <span>بيانات محلية</span>
          </div>
        </section>

        {liveMode ? (
        <section className="academic-panel academic-evaluation-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">تقييمات حية · من API</span>
              <h2>مراجعة واعتماد التقييمات</h2>
              <p>لا تُعرض درجات تجريبية هنا. افتح قائمة المراجعة للاطلاع على تقييمات المدربين الفعلية.</p>
            </div>
            <button className="academic-review-count" onClick={() => onNavigate("evaluations")}>
              <span>LIVE</span><small>قائمة المراجعة</small><ChevronLeft size={13} />
            </button>
          </div>
          <div className="academic-panel-footer"><span><ShieldCheck size={13} /> لا تظهر النتائج للمستهلك حتى النشر.</span><button onClick={() => onNavigate("evaluations")}>فتح المراجعات <ChevronLeft size={13} /></button></div>
        </section>
        ) : (
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
        )}
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
            <b>{liveMode ? "LIVE" : followUpEvaluationCount}</b>
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
          <strong>
            {COACHES.filter(coach => coach.status === "active").length}
          </strong>
          <span>مدربون نشطون</span>
        </div>
      </section>
      <section className="academic-panel academic-team-table-panel">
        <div className="academic-panel-heading">
          <div>
            <span className="academic-panel-kicker">
              الأعضاء المرتبطون بدور رئيس المدربين
            </span>
            <h2>
              فريق العمل الأكاديمي <small>{COACHES.length} أعضاء</small>
            </h2>
          </div>
          <button
            className="academic-secondary-button"
            onClick={() => onNavigate("sessions")}
          >
            <CalendarCheck size={15} /> تغطية الحصص
          </button>
        </div>
        {COACHES.map(coach => (
          <div className="academic-coach-team-block" key={coach.id}>
            <div className="academic-coach-profile-card">
              <span className="academic-coach-avatar large">
                {coach.initials}
              </span>
              <div className="academic-coach-profile-main">
                <strong>{coach.name}</strong>
                <small>
                  {coach.role} · رقم الموظف <bdi dir="ltr">{coach.id}</bdi>
                </small>
                <span className="academic-coach-online">
                  <i /> {coach.status === "active" ? "نشط" : "في إجازة"}
                </span>
              </div>
              <div className="academic-team-stat">
                <small>مجموعات التدريس</small>
                <strong>{coach.groups.length}</strong>
              </div>
              <div className="academic-team-stat">
                <small>حصص هذا الأسبوع</small>
                <strong>{coach.sessionsThisWeek}</strong>
              </div>
              <div className="academic-team-stat">
                <small>الحضور المسجل</small>
                <strong>{coach.attendanceRate}%</strong>
              </div>
              <button
                className="academic-icon-button"
                aria-label={`عرض حصص ${coach.name}`}
                onClick={() => onNavigate("sessions")}
              >
                <ArrowUpLeft size={16} />
              </button>
            </div>
            <div className="academic-group-list-heading">
              <strong>المجموعات الأكاديمية · {coach.name}</strong>
              <span>{coach.groups.length} مجموعات توضيحية</span>
            </div>
            <div className="academic-group-list">
              {coach.groups.map((group, index) => {
                const groupSession = SESSIONS.find(
                  session =>
                    session.instructor === coach.name &&
                    session.courseName === group
                );
                return (
                  <button key={group} onClick={() => onNavigate("sessions")}>
                    <span className={`academic-group-icon tone-${index % 3}`}>
                      <BookOpen size={16} />
                    </span>
                    <span>
                      <strong>{group}</strong>
                      <small>{groupSession?.groupName ?? "مجموعة موضحة"}</small>
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
          </div>
        ))}
      </section>
      <LockedState
        className="academic-permission-note"
        compact
        title="إدارة الحسابات خارج نطاق R03"
        description="إدارة الدور أو حالة الموظف تظل ضمن صلاحيات مدير الفرع."
        action={
          <button type="button" onClick={() => window.location.assign("/team")}>
            إدارة الفريق <ArrowUpLeft size={13} />
          </button>
        }
      />
    </>
  );
}

function AttendanceApprovalsView({
  sessions,
  allSessions,
  history,
  resolvedIds,
  selectedSessionId,
  onSelectSession,
  onDecision,
  onReopen,
}: {
  sessions: SessionRecord[];
  allSessions: SessionRecord[];
  history: AttendanceDecision[];
  resolvedIds: string[];
  selectedSessionId: string;
  onSelectSession: (id: string) => void;
  onDecision: (
    session: SessionRecord,
    decision: AttendanceDecision["decision"],
    note: string
  ) => void;
  onReopen: (sessionId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const filteredSessions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return sessions.filter(session => {
      const matchesSearch = [
        session.courseName,
        session.groupName,
        session.instructor,
        session.id,
      ].some(value => value.toLocaleLowerCase("ar").includes(needle));
      const matchesInstructor =
        instructorFilter === "all" || session.instructor === instructorFilter;
      const matchesFrom = !dateFrom || session.date >= dateFrom;
      const matchesTo = !dateTo || session.date <= dateTo;
      return matchesSearch && matchesInstructor && matchesFrom && matchesTo;
    });
  }, [dateFrom, dateTo, instructorFilter, query, sessions]);
  const selectedSession =
    filteredSessions.find(session => session.id === selectedSessionId) ??
    filteredSessions[0] ??
    null;
  useEffect(() => {
    setDecisionNote("");
  }, [selectedSession?.id]);
  const filteredHistory = useMemo(
    () =>
      history.filter(item => {
        const matchesInstructor =
          instructorFilter === "all" || item.instructor === instructorFilter;
        const matchesFrom = !dateFrom || item.sessionDate >= dateFrom;
        const matchesTo = !dateTo || item.sessionDate <= dateTo;
        return matchesInstructor && matchesFrom && matchesTo;
      }),
    [dateFrom, dateTo, history, instructorFilter]
  );
  const instructorOptions = COACHES.map(coach => coach.name);
  const approvedCount = filteredHistory.filter(
    item => item.decision === "approved"
  ).length;
  const returnedCount = filteredHistory.filter(
    item => item.decision === "returned"
  ).length;
  const statusLabels: Record<AttendanceEntry["status"], string> = {
    present: "حاضر",
    late: "متأخر",
    absent: "غائب",
    excused: "بعذر",
  };

  return (
    <>
      <section className="academic-approval-summary">
        <div>
          <span className="academic-panel-kicker">
            مراجعة أكاديمية · فرع {BRANCH}
          </span>
          <h2>اعتماد تسجيل الحضور</h2>
          <p>
            راجع أسماء الطلاب والحالات وملاحظة المدرب، ثم اعتمد السجل أو أعده
            للتصحيح. كل القرارات في هذه المعاينة محلية.
          </p>
        </div>
        <div className="academic-approval-summary-stats">
          <span className="waiting">
            <strong>{filteredSessions.length}</strong>
            <small>بانتظار المراجعة</small>
          </span>
          <span className="approved">
            <strong>{approvedCount}</strong>
            <small>قرارات اعتماد</small>
          </span>
          <span className="returned">
            <strong>{returnedCount}</strong>
            <small>إعادات للمدرب</small>
          </span>
        </div>
      </section>

      <div className="academic-approval-layout">
        <section className="academic-panel academic-approval-queue">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">قائمة المراجعة</span>
              <h2>
                طلبات الحضور <small>{filteredSessions.length} طلبات</small>
              </h2>
            </div>
          </div>
          <label className="academic-search academic-approval-search">
            <Search size={15} />
            <input
              aria-label="بحث في طلبات الحضور"
              placeholder="ابحث باسم المدرب أو المجموعة..."
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <div className="academic-approval-filters">
            <label>
              <span>المدرب</span>
              <select
                aria-label="تصفية طلبات الحضور حسب المدرب"
                value={instructorFilter}
                onChange={event => setInstructorFilter(event.target.value)}
              >
                <option value="all">كل مدربي الفرع</option>
                {instructorOptions.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>تاريخ الحصة من</span>
              <input
                aria-label="تصفية الحضور من تاريخ"
                type="date"
                value={dateFrom}
                onChange={event => setDateFrom(event.target.value)}
              />
            </label>
            <label>
              <span>تاريخ الحصة إلى</span>
              <input
                aria-label="تصفية الحضور إلى تاريخ"
                type="date"
                value={dateTo}
                onChange={event => setDateTo(event.target.value)}
              />
            </label>
            {(instructorFilter !== "all" || dateFrom || dateTo || query) && (
              <button
                className="academic-approval-clear-filters"
                onClick={() => {
                  setInstructorFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setQuery("");
                }}
              >
                مسح الفلاتر
              </button>
            )}
          </div>
          <div className="academic-approval-request-list">
            {filteredSessions.map(session => (
              <button
                className={`academic-approval-request ${selectedSession?.id === session.id ? "selected" : ""}`}
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  setDecisionNote("");
                }}
              >
                <span className="academic-approval-request-icon">
                  <ClipboardCheck size={16} />
                </span>
                <span className="academic-approval-request-main">
                  <strong>{session.courseName}</strong>
                  <small>{session.groupName}</small>
                  <small>
                    <UserRound size={11} /> {session.instructor}
                  </small>
                </span>
                <span className="academic-approval-request-meta">
                  <b>{formatDate(session.date)}</b>
                  <small>{session.attendance?.present ?? 0} حاضر</small>
                  <i />
                </span>
              </button>
            ))}
            {filteredSessions.length === 0 && (
              <EmptyState
                className="academic-approval-empty"
                title={
                  sessions.length === 0
                    ? "اكتملت مراجعة كل الطلبات"
                    : "لا توجد طلبات مطابقة"
                }
                description={
                  sessions.length === 0
                    ? "يمكنك مراجعة قراراتك السابقة في سجل القرارات أدناه."
                    : "جرّب كلمة بحث أخرى أو امسح البحث."
                }
                action={
                  query ? (
                    <button type="button" onClick={() => setQuery("")}>
                      مسح البحث
                    </button>
                  ) : undefined
                }
              />
            )}
          </div>
          <div className="academic-table-footer">
            <span>
              <ShieldCheck size={13} /> طلبات هذا الفرع فقط · بيانات توضيحية
            </span>
          </div>
        </section>

        {selectedSession ? (
          <section className="academic-panel academic-approval-detail">
            <div className="academic-approval-detail-top">
              <div className="academic-detail-icon">
                <CalendarCheck size={19} />
              </div>
              <div>
                <span className="academic-panel-kicker">
                  تفاصيل طلب · <bdi dir="ltr">{selectedSession.id}</bdi>
                </span>
                <h2>{selectedSession.courseName}</h2>
                <p>
                  {selectedSession.groupName} · {selectedSession.dateLabel} ·{" "}
                  <bdi dir="ltr">{selectedSession.time}</bdi>
                </p>
              </div>
              <span className="academic-session-status pending_approval">
                بانتظار الاعتماد
              </span>
            </div>
            <div className="academic-approval-coach-note">
              <span>
                <MessageCircle size={14} /> ملاحظة المدرب ·{" "}
                {selectedSession.instructor}
              </span>
              <p>
                {selectedSession.instructorNote ??
                  "لا توجد ملاحظة إضافية مرفقة بهذا التسجيل."}
              </p>
            </div>
            <div className="academic-approval-roster-heading">
              <span>
                <Users size={15} /> سجل الطلاب
              </span>
              <strong>
                {selectedSession.attendance?.present ?? 0} حاضر ·{" "}
                {selectedSession.attendance?.late ?? 0} متأخر ·{" "}
                {selectedSession.attendance?.absent ?? 0} غائب ·{" "}
                {selectedSession.attendance?.excused ?? 0} بعذر
              </strong>
            </div>
            <div className="academic-approval-roster">
              {(selectedSession.attendanceEntries ?? []).map(entry => (
                <div
                  className="academic-approval-student"
                  key={entry.studentId}
                >
                  <span className="academic-approval-student-avatar">
                    {entry.student.slice(0, 1)}
                  </span>
                  <span className="academic-approval-student-main">
                    <strong>{entry.student}</strong>
                    <small>
                      <bdi dir="ltr">{entry.studentId}</bdi>
                      {entry.note ? ` · ${entry.note}` : ""}
                    </small>
                  </span>
                  <span
                    className={`academic-approval-attendance ${entry.status}`}
                  >
                    {entry.status === "late" && entry.lateMinutes
                      ? `${statusLabels[entry.status]} ${entry.lateMinutes} د`
                      : statusLabels[entry.status]}
                  </span>
                </div>
              ))}
              {!selectedSession.attendanceEntries?.length && (
                <div className="academic-approval-no-roster">
                  لا توجد تفاصيل طلاب إضافية في سجل هذه الجلسة.
                </div>
              )}
            </div>
            <label className="academic-approval-note-input">
              <span>ملاحظة المراجعة {" · "} مطلوبة عند الإعادة</span>
              <textarea
                aria-label="ملاحظة قرار مراجعة الحضور"
                placeholder="مثال: يرجى توضيح سبب الغياب قبل إعادة الإرسال..."
                rows={3}
                value={decisionNote}
                onChange={event => setDecisionNote(event.target.value)}
              />
            </label>
            <div className="academic-approval-actions">
              <button
                className="academic-secondary-button return"
                disabled={!decisionNote.trim()}
                onClick={() =>
                  onDecision(selectedSession, "returned", decisionNote)
                }
              >
                <ArrowDownLeft size={15} /> إعادة للمدرب
              </button>
              <button
                className="academic-primary-button approve"
                onClick={() =>
                  onDecision(selectedSession, "approved", decisionNote)
                }
              >
                <Check size={15} /> اعتماد الحضور
              </button>
            </div>
            <div className="academic-approval-local-note">
              <AlertCircle size={13} /> اعتماد توضيحي محلي؛ لا يرسل إشعارًا ولا
              يغيّر سجل الحضور الفعلي.
            </div>
          </section>
        ) : (
          <section className="academic-panel academic-approval-no-selection">
            <CheckCircle2 size={26} />
            <h2>كل الطلبات في هذه القائمة تمت مراجعتها</h2>
            <p>
              افتح سجل القرارات أدناه إذا أردت إعادة طلب إلى قائمة المراجعة.
            </p>
          </section>
        )}
      </div>

      <section className="academic-panel academic-approval-history-panel">
        <div className="academic-panel-heading">
          <div>
            <span className="academic-panel-kicker">
              سجل محلي · خلال المعاينة الحالية
            </span>
            <h2>
              سجل قرارات مراجعة الحضور{" "}
              <small>{filteredHistory.length} قرار</small>
            </h2>
          </div>
          <span className="academic-approval-history-scope">
            <ShieldCheck size={13} /> {HEAD_OF_INSTRUCTORS} · {BRANCH}
          </span>
        </div>
        {filteredHistory.length > 0 ? (
          <div className="academic-approval-history-list">
            {filteredHistory.map(item => {
              const session = allSessions.find(
                candidate => candidate.id === item.sessionId
              );
              const resolved = resolvedIds.includes(item.sessionId);
              return (
                <article
                  className="academic-approval-history-row"
                  key={item.id}
                >
                  <span
                    className={`academic-approval-history-icon ${item.decision}`}
                  >
                    {item.decision === "approved" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <ArrowDownLeft size={16} />
                    )}
                  </span>
                  <div className="academic-approval-history-main">
                    <strong>
                      {item.decision === "approved"
                        ? "تم اعتماد الحضور"
                        : "أُعيد التسجيل إلى المدرب"}
                      <small>{item.courseName}</small>
                    </strong>
                    <span>
                      {item.instructor} · {item.groupName} · بواسطة {item.actor}
                    </span>
                    {item.note && <p>{item.note}</p>}
                  </div>
                  <time>
                    {formatDate(item.sessionDate)} · {item.decidedAt}
                  </time>
                  {session && (
                    <button
                      className="academic-reopen-approval"
                      disabled={!resolved}
                      onClick={() => onReopen(item.sessionId)}
                    >
                      <Eye size={13} />
                      {resolved ? "إعادة للمراجعة" : "مفتوح للمراجعة"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="academic-approval-history-empty">
            <Clock3 size={17} />
            <span>
              {history.length > 0
                ? "لا توجد قرارات مطابقة لفلاتر المدرب والتاريخ."
                : "ستظهر هنا قرارات الاعتماد والإعادة بعد اتخاذها."}
            </span>
          </div>
        )}
        <div className="academic-table-footer">
          <span>
            <ShieldCheck size={13} /> السجل لا يُحفظ بعد إغلاق المعاينة المحلية
          </span>
          <span>لا يوجد اتصال بخدمة اعتماد فعلية</span>
        </div>
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
  summarySessions,
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
  summarySessions: SessionRecord[];
  selectedSessionId: string;
  selectedSession: SessionRecord;
  onSelectSession: (id: string) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLTableRowElement>,
    sessionId: string
  ) => void;
}) {
  const currentCompletedCount = summarySessions.filter(
    session => session.status === "completed"
  ).length;
  const currentPendingCount = summarySessions.filter(
    session => session.status === "pending_approval"
  ).length;
  const currentScheduledCount = summarySessions.filter(
    session => session.status === "scheduled"
  ).length;
  return (
    <>
      <div className="academic-mini-kpis">
        <span>
          <i className="mini-teal" />
          <b>{summarySessions.length}</b> جلسات في العينة
        </span>
        <span>
          <i className="mini-blue" />
          <b>{currentCompletedCount}</b> مكتملة
        </span>
        <span>
          <i className="mini-amber" />
          <b>{currentPendingCount}</b> مراجعة تسجيل
        </span>
        <span>
          <i className="mini-violet" />
          <b>{currentScheduledCount}</b> قادمة
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
