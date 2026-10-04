import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Star,
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
import { ErrorState, LoadingState } from "@/components/FeedbackStates";
import {
  apiClient,
  type AttendanceResponse,
  type NotificationRecord,
  type SessionEvaluationRecord,
  type SessionEvaluationStatus,
  type SessionRecord,
} from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import InstructorDeskLive from "./InstructorDeskLive";
import {
  AttendanceView,
  EvaluationView,
  TodayView,
} from "@/components/InstructorDeskViews";

type DeskView = "today" | "attendance" | "evaluation";
type AttendanceStatus = "unmarked" | "present" | "absent" | "late" | "excused";
type SessionStatus = "live" | "upcoming" | "completed";
type Student = {
  id: string;
  name: string;
  initials: string;
  age: number;
  parent: string;
};
type Session = {
  id: string;
  branchId?: string;
  branchName?: string;
  title: string;
  level: string;
  day: string;
  time: string;
  room: string;
  status: SessionStatus;
  students: Student[];
  startAt?: string;
  endAt?: string;
};
type Evaluation = {
  scores: Record<string, number>;
  comment: string;
  saved: boolean;
  status: SessionEvaluationStatus;
  reviewNote: string | null;
};

const STUDENTS: Student[] = [
  {
    id: "ST-0248",
    name: "ياسين محمد علي",
    initials: "يع",
    age: 11,
    parent: "محمد علي",
  },
  {
    id: "ST-0246",
    name: "عمر خالد إبراهيم",
    initials: "عإ",
    age: 13,
    parent: "نهى إبراهيم",
  },
  {
    id: "ST-0244",
    name: "آدم شريف حسن",
    initials: "آح",
    age: 14,
    parent: "شريف حسن",
  },
  {
    id: "ST-0242",
    name: "سيف مصطفى عادل",
    initials: "سع",
    age: 14,
    parent: "مصطفى عادل",
  },
  {
    id: "ST-0240",
    name: "ملك حسام الدين",
    initials: "مح",
    age: 10,
    parent: "حسام الدين",
  },
];
const SESSIONS: Session[] = [
  {
    id: "SES-401",
    title: "روبوتكس مستوى 2",
    level: "المستوى المتوسط · 10–12 سنة",
    day: "اليوم · السبت 26 سبتمبر",
    time: "12:00 – 01:30 م",
    room: "معمل 1",
    status: "live",
    students: STUDENTS,
  },
  {
    id: "SES-402",
    title: "أساسيات تصميم الروبوت",
    level: "المستوى المتوسط · 10–12 سنة",
    day: "اليوم · السبت 26 سبتمبر",
    time: "03:00 – 04:30 م",
    room: "معمل الروبوتات",
    status: "upcoming",
    students: STUDENTS.slice(0, 4),
  },
  {
    id: "SES-403",
    title: "مشروع الحركة الذكية",
    level: "المستوى المتوسط · 10–12 سنة",
    day: "غدًا · الأحد 27 سبتمبر",
    time: "10:00 – 11:30 ص",
    room: "معمل 2",
    status: "upcoming",
    students: STUDENTS.slice(1),
  },
  {
    id: "SES-404",
    title: "روبوتكس مستوى 2",
    level: "المستوى المتوسط · 10–12 سنة",
    day: "أمس · الجمعة 25 سبتمبر",
    time: "04:00 – 05:30 م",
    room: "معمل 1",
    status: "completed",
    students: STUDENTS.slice(0, 4),
  },
];
const SESSION_STATUS: Record<SessionStatus, string> = {
  live: "جارية الآن",
  upcoming: "قادمة",
  completed: "مكتملة",
};
const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  unmarked: "لم يسجل",
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};
const RUBRIC = [
  {
    id: "understanding",
    label: "استيعاب الفكرة",
    hint: "المفاهيم والخطوات الأساسية",
  },
  {
    id: "practice",
    label: "التطبيق العملي",
    hint: "تنفيذ المهمة واستخدام الأدوات",
  },
  {
    id: "collaboration",
    label: "التعاون والمبادرة",
    hint: "المشاركة والتعاون مع الزملاء",
  },
];
const INITIAL_ATTENDANCE: Record<string, AttendanceStatus> = {
  "ST-0248": "present",
  "ST-0246": "present",
  "ST-0244": "late",
  "ST-0242": "unmarked",
  "ST-0240": "unmarked",
};
function formatLiveTime(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
function formatLiveDay(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}
function mapLiveAttendanceStatus(status: string): AttendanceStatus {
  return status === "PRESENT"
    ? "present"
    : status === "LATE"
      ? "late"
      : status === "ABSENT"
        ? "absent"
        : status === "EXCUSED"
          ? "excused"
          : "unmarked";
}
function mapSavedEvaluation(item: SessionEvaluationRecord): Evaluation {
  const notes = item.notes ?? "";
  const parseRubric = (label: string) =>
    Number(notes.match(new RegExp(`${label}:\\s*(\\d)/5`))?.[1]) ||
    Math.max(1, Math.min(5, Math.round((item.score ?? 80) / 20)));
  return {
    scores: {
      understanding: parseRubric("استيعاب الفكرة"),
      practice: parseRubric("التطبيق العملي"),
      collaboration: parseRubric("التعاون"),
    },
    comment: notes.includes("\n")
      ? notes.slice(notes.indexOf("\n") + 1).trim()
      : notes,
    saved: true,
    status: item.status,
    reviewNote: item.reviewNote,
  };
}
function evaluationStatusLabel(status: SessionEvaluationStatus) {
  return status === "PUBLISHED"
    ? "منشور"
    : status === "SUBMITTED"
      ? "قيد المراجعة"
      : status === "CHANGES_REQUESTED"
        ? "مطلوب تعديل"
        : "مسودة";
}
function mapLiveSession(
  record: SessionRecord,
  attendance: AttendanceResponse
): Session {
  const now = Date.now();
  const start = new Date(record.startAt).getTime();
  const end = new Date(record.endAt).getTime();
  const status: SessionStatus =
    record.status === "COMPLETED"
      ? "completed"
      : start <= now && now <= end
        ? "live"
        : "upcoming";
  return {
    id: record.id,
    branchId: record.branchId,
    branchName: record.branchName ?? undefined,
    title: record.courseName || `جلسة ${record.sessionNumber || "تشغيلية"}`,
    level: record.notes || "جلسة مسندة من النظام",
    day: formatLiveDay(record.startAt),
    time: `${formatLiveTime(record.startAt)} – ${formatLiveTime(record.endAt)}`,
    room: record.classroomName || `قاعة ${record.classroomId.slice(0, 8)}`,
    status,
    startAt: record.startAt,
    endAt: record.endAt,
    students: attendance.items.map(item => ({
      id: item.studentId,
      name: item.studentName,
      initials: item.studentName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join(""),
      age: 0,
      parent: "بيانات ولي الأمر غير متاحة للمدرب",
    })),
  };
}

function InstructorDeskPreview() {
  const [, navigate] = useLocation();
  const { me, logout } = useAuth();
  const [view, setView] = useState<DeskView>("today");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(() =>
    apiClient.hasSession() ? [] : SESSIONS
  );
  const [dataMode, setDataMode] = useState<"demo" | "live">(
    apiClient.hasSession() ? "live" : "demo"
  );
  const [dataLoading, setDataLoading] = useState(apiClient.hasSession());
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState(() =>
    apiClient.hasSession() ? "" : SESSIONS[0].id
  );
  const [selectedStudentId, setSelectedStudentId] = useState(() =>
    apiClient.hasSession() ? "" : STUDENTS[0].id
  );
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >(() => (apiClient.hasSession() ? {} : INITIAL_ATTENDANCE));
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>(
    {}
  );
  const [scores, setScores] = useState<Record<string, number>>({
    understanding: 4,
    practice: 4,
    collaboration: 4,
  });
  const [comment, setComment] = useState("");
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [substitutionSessionId, setSubstitutionSessionId] = useState<
    string | null
  >(null);
  const [substitutionReason, setSubstitutionReason] = useState("");
  const applyAttendance = (response: AttendanceResponse) => {
    setAttendance(
      Object.fromEntries(
        response.items.map(item => [
          item.studentId,
          mapLiveAttendanceStatus(item.status),
        ])
      )
    );
  };
  useEffect(() => {
    if (!apiClient.hasSession()) return;
    let cancelled = false;
    setDataLoading(true);
    setSessions([]);
    apiClient
      .listSessions()
      .then(async response => {
        const loaded = await Promise.all(
          response.items.map(async record => {
            try {
              const attendanceResponse = await apiClient.getSessionAttendance(
                record.id
              );
              return {
                session: mapLiveSession(record, attendanceResponse),
                attendanceResponse,
              };
            } catch {
              const emptyAttendance: AttendanceResponse = {
                sessionId: record.id,
                sessionStatus: record.status,
                items: [],
                total: 0,
              };
              return {
                session: mapLiveSession(record, emptyAttendance),
                attendanceResponse: emptyAttendance,
              };
            }
          })
        );
        if (cancelled) return;
        const nextSessions = loaded.map(item => item.session);
        setSessions(nextSessions);
        if (nextSessions.length) {
          setSelectedSessionId(nextSessions[0].id);
          setSelectedStudentId(nextSessions[0].students[0]?.id ?? "");
          applyAttendance(loaded[0].attendanceResponse);
        }
        setDataMode("live");
        setDataError(null);
      })
      .catch(error => {
        if (cancelled) return;
        setSessions([]);
        setDataError(
          error instanceof Error ? error.message : "تعذر تحميل جلسات المدرب"
        );
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    apiClient
      .listNotifications()
      .then(response => {
        if (!cancelled) setNotifications(response.items);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (dataMode !== "live" || view !== "evaluation" || !selectedSessionId)
      return;
    let cancelled = false;
    apiClient
      .listSessionEvaluations(selectedSessionId)
      .then(response => {
        if (cancelled) return;
        setEvaluations(current => ({
          ...current,
          ...Object.fromEntries(
            response.items.map(item => [
              `${selectedSessionId}:${item.studentId}`,
              mapSavedEvaluation(item),
            ])
          ),
        }));
        const selected = response.items.find(
          item => item.studentId === selectedStudentId
        );
        if (selected) {
          const mapped = mapSavedEvaluation(selected);
          setScores(mapped.scores);
          setComment(mapped.comment);
        }
      })
      .catch(error => {
        if (!cancelled)
          toast.error("تعذر تحميل التقييمات المحفوظة", {
            description:
              error instanceof Error ? error.message : "حاول مرة أخرى",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [dataMode, view, selectedSessionId, selectedStudentId]);
  const selectedSession =
    sessions.find(item => item.id === selectedSessionId) ??
    sessions[0] ??
    SESSIONS[0];
  const selectedStudent =
    selectedSession.students.find(item => item.id === selectedStudentId) ??
    selectedSession.students[0] ??
    STUDENTS[0];
  const visibleStudents = useMemo(
    () =>
      selectedSession.students.filter(
        item =>
          !query.trim() ||
          `${item.name} ${item.id}`
            .toLocaleLowerCase("ar")
            .includes(query.trim().toLocaleLowerCase("ar"))
      ),
    [query, selectedSession]
  );
  const attendanceStats = useMemo(() => {
    const statuses =
      dataMode === "live" && sessions.length === 0
        ? []
        : selectedSession.students.map(
            item => attendance[item.id] ?? "unmarked"
          );
    return {
      present: statuses.filter(status => status === "present").length,
      late: statuses.filter(status => status === "late").length,
      absent: statuses.filter(
        status => status === "absent" || status === "excused"
      ).length,
      unmarked: statuses.filter(status => status === "unmarked").length,
    };
  }, [attendance, selectedSession, dataMode, sessions.length]);
  const selectedEvaluation =
    evaluations[`${selectedSession.id}:${selectedStudent.id}`];
  const selectView = (next: DeskView) => {
    setView(next);
    setMobileOpen(false);
    setQuery("");
  };
  const selectSession = (id: string) => {
    setSelectedSessionId(id);
    setAttendanceSaved(false);
    setView("attendance");
    setQuery("");
    if (dataMode === "live")
      void apiClient
        .getSessionAttendance(id)
        .then(applyAttendance)
        .catch(error =>
          setDataError(
            error instanceof Error ? error.message : "تعذر تحميل الحضور"
          )
        );
  };
  const changeAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance(current => ({ ...current, [studentId]: status }));
    setAttendanceSaved(false);
  };
  const saveAttendance = async (event: FormEvent) => {
    event.preventDefault();
    if (attendanceStats.unmarked > 0) {
      toast.error("أكمل تسجيل كل الطلاب", {
        description: `ما زال ${attendanceStats.unmarked} طالب بدون حالة.`,
      });
      return;
    }
    if (dataMode === "live") {
      try {
        const records = selectedSession.students.map(student => {
          const status = attendance[student.id] ?? "unmarked";
          return {
            studentId: student.id,
            status:
              status === "present"
                ? "PRESENT"
                : status === "late"
                  ? "LATE"
                  : status === "absent"
                    ? "ABSENT"
                    : "EXCUSED",
            lateMinutes: status === "late" ? 1 : null,
          } as const;
        });
        const response = await apiClient.upsertSessionAttendance(
          selectedSession.id,
          records
        );
        applyAttendance(response);
        setAttendanceSaved(true);
        toast.success("تم حفظ الحضور في قاعدة البيانات", {
          description: "تمت إعادة قراءة الحالة من الـAPI الحقيقي.",
        });
      } catch (error) {
        toast.error("تعذر حفظ الحضور", {
          description: error instanceof Error ? error.message : "حاول مرة أخرى",
        });
      }
      return;
    }
    setAttendanceSaved(true);
    toast.success("تم حفظ الحضور للمراجعة", {
      description: "الحفظ محلي في المعاينة فقط.",
    });
  };
  const chooseStudent = (id: string) => {
    setSelectedStudentId(id);
    const saved = evaluations[`${selectedSession.id}:${id}`];
    setScores(
      saved?.scores ?? { understanding: 4, practice: 4, collaboration: 4 }
    );
    setComment(saved?.comment ?? "");
  };
  const saveEvaluation = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) {
      toast.error("أضف ملاحظة بنّاءة قبل حفظ التقييم", {
        description: "اذكر ما أتقنه الطالب والخطوة التالية المقترحة.",
      });
      return;
    }
    const key = `${selectedSession.id}:${selectedStudent.id}`;
    if (dataMode === "live") {
      try {
        const score = Math.round(
          (((scores.understanding ?? 0) +
            (scores.practice ?? 0) +
            (scores.collaboration ?? 0)) /
            3) *
            20
        );
        const notes = `استيعاب الفكرة: ${scores.understanding ?? 0}/5 · التطبيق العملي: ${scores.practice ?? 0}/5 · التعاون: ${scores.collaboration ?? 0}/5\n${comment.trim()}`;
        await apiClient.saveSessionEvaluations(selectedSession.id, [
          { studentId: selectedStudent.id, score, notes },
        ]);
        setEvaluations(current => ({
          ...current,
          [key]: {
            scores,
            comment: comment.trim(),
            saved: true,
            status: "DRAFT",
            reviewNote: current[key]?.reviewNote ?? null,
          },
        }));
        toast.success("تم حفظ التقييم كمسودة خاصة");
      } catch (error) {
        toast.error("تعذر حفظ التقييم", {
          description: error instanceof Error ? error.message : "حاول مرة أخرى",
        });
      }
      return;
    }
    setEvaluations(current => ({
      ...current,
      [key]: {
        scores,
        comment: comment.trim(),
        saved: true,
        status: "DRAFT",
        reviewNote: null,
      },
    }));
    toast.success("تم حفظ التقييم محليًا في بيانات العرض التجريبي.");
  };
  const submitEvaluationForReview = async () => {
    if (!comment.trim()) {
      toast.error("أضف ملاحظة بنّاءة قبل إرسال التقييم للمراجعة.");
      return;
    }
    const key = `${selectedSession.id}:${selectedStudent.id}`;
    const score = Math.round(
      (((scores.understanding ?? 0) +
        (scores.practice ?? 0) +
        (scores.collaboration ?? 0)) /
        3) *
        20
    );
    const notes = `استيعاب الفكرة: ${scores.understanding ?? 0}/5 · التطبيق العملي: ${scores.practice ?? 0}/5 · التعاون: ${scores.collaboration ?? 0}/5\n${comment.trim()}`;
    if (dataMode === "live") {
      try {
        await apiClient.saveSessionEvaluations(selectedSession.id, [
          { studentId: selectedStudent.id, score, notes },
        ]);
        await apiClient.submitSessionEvaluations(selectedSession.id, [
          selectedStudent.id,
        ]);
        setEvaluations(current => ({
          ...current,
          [key]: {
            scores,
            comment: comment.trim(),
            saved: true,
            status: "SUBMITTED",
            reviewNote: null,
          },
        }));
        toast.success("تم إرسال التقييم لرئيس المدربين للمراجعة");
      } catch (error) {
        toast.error("تعذر إرسال التقييم للمراجعة", {
          description: error instanceof Error ? error.message : "حاول مرة أخرى",
        });
      }
      return;
    }
    setEvaluations(current => ({
      ...current,
      [key]: {
        scores,
        comment: comment.trim(),
        saved: true,
        status: "SUBMITTED",
        reviewNote: null,
      },
    }));
    toast.success(
      "تم تسجيل الإرسال في المعاينة فقط؛ لا يظهر للأسرة قبل اعتماد رئيس المدربين."
    );
  };
  const submitSubstitutionRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!substitutionReason.trim() || !substitutionSessionId) {
      toast.error("اكتب سبب طلب البديل أولًا.");
      return;
    }
    if (dataMode === "live") {
      try {
        await apiClient.requestSubstitution(
          substitutionSessionId,
          substitutionReason.trim()
        );
        setSubstitutionSessionId(null);
        setSubstitutionReason("");
        toast.success("تم إرسال طلب المدرب البديل للمراجعة.");
      } catch (error) {
        toast.error("تعذر إرسال طلب البديل", {
          description: error instanceof Error ? error.message : "حاول مرة أخرى",
        });
      }
      return;
    }
    setSubstitutionSessionId(null);
    setSubstitutionReason("");
    toast.success("تم تسجيل الطلب في العرض التجريبي فقط.");
  };
  const proposeSelfForSubstitution = async (
    notification: NotificationRecord
  ) => {
    if (!notification.targetId) return;
    try {
      await apiClient.proposeSubstitute(
        notification.targetId,
        "متاح لتغطية هذه الجلسة."
      );
      await apiClient.markNotificationRead(notification.id);
      setNotifications(current =>
        current.map(item =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
      toast.success("تم إرسال عرضك لتغطية الجلسة.");
    } catch (error) {
      toast.error("تعذر إرسال العرض", {
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
      });
    }
  };
  return (
    <RoleDashboardShell
      className="app-shell instructor-desk-shell"
      roleCode="R04"
      roleLabel="المدرب"
      scopeLevel="assigned"
      scopeLabel="الجلسات والطلاب المسندون"
      tenantName={me?.academy?.name ?? "أكاديمية مدى"}
      branchName={selectedSession.branchName ?? "نطاق الجلسات المسندة"}
    >
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <button
            className="instructor-desk-brand"
            onClick={() => navigate("/instructor-desk")}
          >
            <strong>مدى</strong>
            <small>مساحة المدرب · R04</small>
          </button>
          <button
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="academy-switcher">
          <span className="academy-avatar">
            <GraduationCap size={20} />
          </span>
          <span className="academy-meta">
            <strong>{me?.academy?.name ?? "أكاديمية مدى"}</strong>
            <small>
              {me?.user?.displayName ?? "المدرب"} ·{" "}
              {selectedSession.branchName ?? "نطاق الجلسات المسندة"}
            </small>
          </span>
        </div>
        <div className="nav-caption">مساحة الحصة</div>
        <nav className="primary-nav">
          <button
            className={`nav-link ${view === "today" ? "active" : ""}`}
            onClick={() => selectView("today")}
          >
            <LayoutDashboard size={19} />
            <span>حصصي اليوم</span>
          </button>
          <button
            className={`nav-link ${view === "attendance" ? "active" : ""}`}
            onClick={() => selectView("attendance")}
          >
            <CalendarCheck size={19} />
            <span>تسجيل الحضور</span>
            <span className="nav-count">{attendanceStats.unmarked}</span>
          </button>
          <button
            className={`nav-link ${view === "evaluation" ? "active" : ""}`}
            onClick={() => selectView("evaluation")}
          >
            <Star size={19} />
            <span>التقييمات</span>
            <span className="nav-count">{Object.keys(evaluations).length}</span>
          </button>
        </nav>
        <div className="nav-caption nav-caption-spaced">روابط مساعدة</div>
        <nav className="primary-nav">
          <button
            className="nav-link"
            onClick={() => navigate("/head-instructors")}
          >
            <Users size={19} />
            <span>رئيس المدربين</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/schedule")}>
            <CalendarDays size={19} />
            <span>جدول الفرع</span>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>تحتاج دعمًا؟</strong>
            <span>اطلب مساعدة من رئيس المدربين</span>
          </div>
          <ChevronLeft size={16} />
        </div>
        <div className="sidebar-bottom">
          <button
            className="nav-link"
            onClick={() => toast("الإعدادات قيد التجهيز")}
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => {
              void logout().then(() => navigate("/login"));
            }}
          >
            <LogOut size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="branch-select assigned-branch">
              <span className="branch-icon">
                <MapPin size={17} />
              </span>
              <span>
                جلساتي · {selectedSession.branchName ?? "النطاق المصرح به"}
              </span>
            </div>
          </div>
          <span className="instructor-desk-scope">
            <ShieldCheck size={14} /> وصول محدود للجلسات المسندة
          </span>
        </header>
        <div className="workspace instructor-desk-content">
          <PageHeader
            className="welcome-row"
            copyClassName="welcome-copy"
            actionsClassName="welcome-actions"
            eyebrow={
              <span className="eyebrow">
                <i className="eyebrow-dot" /> مساحة المدرب · R04
              </span>
            }
            title={VIEW_TITLES[view]}
            description={VIEW_COPY[view]}
            actions={
              <span className="instructor-desk-date">
                <CalendarDays size={14} />{" "}
                {new Date().toLocaleDateString("ar-EG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            }
          />
          <RoleScopeCard className="instructor-desk-scope-card" />
          {notifications
            .filter(
              item =>
                item.type === "SUBSTITUTION_APPROVAL_REQUIRED" &&
                !item.isRead &&
                item.targetId
            )
            .map(item => (
              <article className="instructor-desk-banner" key={item.id}>
                <ShieldCheck size={15} />
                <span>
                  <strong>{item.title}:</strong> {item.body}
                </span>
                <button
                  className="desk-primary-action"
                  onClick={() => void proposeSelfForSubstitution(item)}
                >
                  أنا متاح للتغطية
                </button>
              </article>
            ))}
          <div className="instructor-desk-banner">
            <ShieldCheck size={15} />
            <span>
              <strong>نطاقك:</strong> تظهر لك الجلسات والطلاب المسندون إليك فقط.
              لا يمكنك تعديل بيانات التسجيل أو رؤية الماليات.
            </span>
          </div>
          {dataLoading && (
            <LoadingState
              label="جارٍ تحميل الجلسات والحضور من الـAPI…"
              compact
            />
          )}
          {dataError && (
            <ErrorState
              compact
              title="تعذر تحميل جلسات المدرب"
              description={`${dataError} · لم يتم استبدال بيانات الخادم ببيانات تجريبية.`}
            />
          )}
          {!dataLoading && !dataError && dataMode === "live" && (
            <div
              className="role-feedback-state role-feedback-success role-feedback-compact"
              role="status"
            >
              الجلسات والحضور LIVE من PostgreSQL · النطاق مأخوذ من حساب المدرب
            </div>
          )}
          {!dataLoading &&
            dataMode === "live" &&
            !dataError &&
            sessions.length === 0 && (
              <div
                className="role-feedback-state role-feedback-compact"
                role="status"
              >
                لا توجد جلسات مسندة إلى حسابك حاليًا.
              </div>
            )}
          {!dataLoading &&
            (dataMode !== "live" || sessions.length > 0) &&
            view === "today" && (
              <TodayView
                sessions={sessions}
                selectedId={selectedSessionId}
                onOpen={selectSession}
                onAttendance={() => selectView("attendance")}
                onEvaluation={() => selectView("evaluation")}
                onRequestSubstitution={id => setSubstitutionSessionId(id)}
                attendanceUnmarked={attendanceStats.unmarked}
              />
            )}
          {!dataLoading &&
            (dataMode !== "live" || sessions.length > 0) &&
            view === "attendance" && (
              <AttendanceView
                session={selectedSession}
                sessions={sessions}
                selectedId={selectedSessionId}
                onSession={id => {
                  setSelectedSessionId(id);
                  setAttendanceSaved(false);
                  if (dataMode === "live")
                    void apiClient
                      .getSessionAttendance(id)
                      .then(applyAttendance);
                }}
                students={visibleStudents}
                query={query}
                setQuery={setQuery}
                attendance={attendance}
                onStatus={changeAttendance}
                stats={attendanceStats}
                saved={attendanceSaved}
                onSubmit={saveAttendance}
                onNext={() => selectView("evaluation")}
              />
            )}
          {!dataLoading &&
            (dataMode !== "live" || sessions.length > 0) &&
            view === "evaluation" && (
              <EvaluationView
                session={selectedSession}
                sessions={sessions}
                selectedId={selectedSessionId}
                onSession={id => {
                  setSelectedSessionId(id);
                  chooseStudent(
                    sessions.find(item => item.id === id)?.students[0]?.id ?? ""
                  );
                }}
                students={selectedSession.students}
                selectedStudent={selectedStudent}
                selectedStudentId={selectedStudent.id}
                selectedEvaluation={selectedEvaluation}
                onStudent={chooseStudent}
                evaluations={evaluations}
                scores={scores}
                setScores={setScores}
                comment={comment}
                setComment={setComment}
                onSubmit={saveEvaluation}
                onSubmitForReview={() => void submitEvaluationForReview()}
              />
            )}{" "}
        </div>
      </main>
      {substitutionSessionId && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setSubstitutionSessionId(null);
              setSubstitutionReason("");
            }
          }}
        >
          <section
            className="student-dialog academic-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="substitution-request-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <Users size={20} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => {
                  setSubstitutionSessionId(null);
                  setSubstitutionReason("");
                }}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="substitution-request-title">طلب مدرب بديل</h2>
            <p>
              {sessions.find(item => item.id === substitutionSessionId)?.title}{" "}
              · {sessions.find(item => item.id === substitutionSessionId)?.day}
            </p>
            <form onSubmit={submitSubstitutionRequest}>
              <label className="form-field">
                <span>
                  سبب طلب البديل <b>*</b>
                </span>
                <textarea
                  required
                  value={substitutionReason}
                  onChange={event => setSubstitutionReason(event.target.value)}
                  rows={4}
                  placeholder="اكتب سبب طلب تغطية الجلسة..."
                />
              </label>
              <div className="dialog-info">
                <ShieldCheck size={15} />
                <span>
                  سيُرسل الطلب للمراجعة؛ المدرب البديل يتقدم بنفسه عند توفره.
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setSubstitutionSessionId(null);
                    setSubstitutionReason("");
                  }}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  إرسال الطلب
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </RoleDashboardShell>
  );
}
const VIEW_TITLES: Record<DeskView, string> = {
  today: "حصصي اليوم",
  attendance: "تسجيل الحضور",
  evaluation: "تقييم الطلاب",
};
const VIEW_COPY: Record<DeskView, string> = {
  today:
    "ابدأ من الجلسة التالية، ثم أكمل حضور الطلاب والتقييم من نفس مساحة العمل.",
  attendance:
    "سجّل حالة كل طالب في الجلسة المختارة، مع تنبيه واضح قبل التأكيد.",
  evaluation:
    "اكتب تقييمًا بنّاءً لكل طالب واحفظ البطاقة بعد مراجعة معايير الجلسة.",
};
export default function InstructorDesk() {
  return apiClient.hasSession() ? (
    <InstructorDeskLive />
  ) : (
    <InstructorDeskPreview />
  );
}
