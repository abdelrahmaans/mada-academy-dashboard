import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  X,
} from "lucide-react";
import { toast } from "sonner";
import R03HeadInstructorsSidebar from "@/components/R03HeadInstructorsSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  apiClient,
  type SchedulingClassroom,
  type SchedulingInstructor,
  type SessionRecord,
} from "@/lib/apiClient";
import {
  ScheduleCalendar,
  ScheduleDetailsDialog,
  ScheduleFormDialog,
} from "@/components/ScheduleViews";
import SessionLogoutButton from "@/components/SessionLogoutButton";

export type SessionStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "pending_approval"
  | "cancelled"
  | "rescheduled";
export type SessionType =
  | "regular"
  | "competition_training"
  | "competition_day";
export type Session = {
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
  branchId?: string;
  classroomId?: string;
  instructorId?: string;
};
type SessionTemplate = Omit<Session, "date" | "status"> & {
  day: number;
  baseStatus?: SessionStatus;
};
export type SessionForm = Pick<
  Session,
  | "date"
  | "startTime"
  | "duration"
  | "title"
  | "level"
  | "instructor"
  | "room"
  | "branch"
  | "type"
> & { branchId?: string; classroomId?: string; instructorId?: string };

function sessionFromApi(record: SessionRecord): Session {
  const start = new Date(record.startAt);
  const end = new Date(record.endAt);
  const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const duration = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 60000)
  );
  const status: SessionStatus =
    record.status === "COMPLETED"
      ? "completed"
      : record.status === "CANCELLED"
        ? "cancelled"
        : record.status === "PENDING_APPROVAL"
          ? "pending_approval"
          : "scheduled";
  const type: SessionType =
    record.type === "COMPETITION_TRAINING"
      ? "competition_training"
      : record.type === "COMPETITION_DAY"
        ? "competition_day"
        : "regular";
  return {
    id: record.id,
    date,
    startTime,
    duration,
    title: record.courseName || `جلسة رقم ${record.sessionNumber}`,
    level: record.notes || "جلسة مسجلة على النظام",
    instructor: record.instructorName || record.instructorId,
    room: record.classroomName || record.classroomId,
    branch: record.branchName || record.branchId,
    enrolled: 0,
    capacity: 0,
    status,
    type,
    branchId: record.branchId,
    classroomId: record.classroomId,
    instructorId: record.instructorId,
  };
}

const DAY_NAMES = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];
const BRANCHES = ["مدينة نصر", "المعادي", "الشيخ زايد"];
const INSTRUCTORS = [
  "مريم حسن",
  "عمر سامح",
  "سارة خالد",
  "يوسف عماد",
  "هبة محمود",
  "كريم عادل",
];
const ROOMS = ["معمل 1", "معمل 2", "معمل الروبوتات", "قاعة الإبداع"];
const BASE_DATE = new Date(2026, 8, 26, 12, 0, 0);
const FIRST_HOUR = 9;
const LAST_HOUR = 18;
const HOUR_HEIGHT = 72;

const TEMPLATES: SessionTemplate[] = [
  {
    id: "s1",
    day: 0,
    startTime: "09:00",
    duration: 60,
    title: "روبوتكس مستوى 1",
    level: "المستوى التمهيدي · 7–9 سنوات",
    instructor: "يوسف عماد",
    room: "معمل الروبوتات",
    branch: "مدينة نصر",
    enrolled: 10,
    capacity: 14,
    type: "regular",
    baseStatus: "completed",
  },
  {
    id: "s2",
    day: 0,
    startTime: "12:00",
    duration: 90,
    title: "روبوتكس مستوى 2",
    level: "المستوى المتوسط · 10–12 سنة",
    instructor: "مريم حسن",
    room: "معمل 1",
    branch: "مدينة نصر",
    enrolled: 12,
    capacity: 16,
    type: "regular",
    baseStatus: "ongoing",
  },
  {
    id: "s3",
    day: 0,
    startTime: "12:00",
    duration: 90,
    title: "برمجة للمبتدئين",
    level: "المستوى التمهيدي · 7–9 سنوات",
    instructor: "عمر سامح",
    room: "معمل 2",
    branch: "مدينة نصر",
    enrolled: 8,
    capacity: 12,
    type: "regular",
  },
  {
    id: "s4",
    day: 0,
    startTime: "14:00",
    duration: 90,
    title: "دوائر إلكترونية",
    level: "المستوى المتقدم · 13–15 سنة",
    instructor: "سارة خالد",
    room: "معمل 1",
    branch: "المعادي",
    enrolled: 11,
    capacity: 14,
    type: "regular",
  },
  {
    id: "s5",
    day: 0,
    startTime: "16:00",
    duration: 90,
    title: "برمجة الألعاب",
    level: "المستوى المتوسط · 10–12 سنة",
    instructor: "كريم عادل",
    room: "قاعة الإبداع",
    branch: "الشيخ زايد",
    enrolled: 9,
    capacity: 12,
    type: "regular",
  },
  {
    id: "s6",
    day: 1,
    startTime: "10:00",
    duration: 90,
    title: "الذكاء الاصطناعي للصغار",
    level: "المستوى التمهيدي · 10–12 سنة",
    instructor: "هبة محمود",
    room: "معمل 2",
    branch: "المعادي",
    enrolled: 10,
    capacity: 14,
    type: "regular",
  },
  {
    id: "s7",
    day: 1,
    startTime: "12:00",
    duration: 90,
    title: "روبوتكس مستوى 1",
    level: "المستوى التمهيدي · 7–9 سنوات",
    instructor: "مريم حسن",
    room: "معمل الروبوتات",
    branch: "مدينة نصر",
    enrolled: 13,
    capacity: 16,
    type: "regular",
  },
  {
    id: "s8",
    day: 1,
    startTime: "15:00",
    duration: 60,
    title: "مهارات التفكير الإبداعي",
    level: "مهارات حياتية · 10–12 سنة",
    instructor: "هبة محمود",
    room: "قاعة الإبداع",
    branch: "الشيخ زايد",
    enrolled: 7,
    capacity: 12,
    type: "regular",
  },
  {
    id: "s9",
    day: 2,
    startTime: "11:00",
    duration: 90,
    title: "دوائر إلكترونية",
    level: "المستوى المتقدم · 13–15 سنة",
    instructor: "سارة خالد",
    room: "معمل 1",
    branch: "مدينة نصر",
    enrolled: 9,
    capacity: 14,
    type: "regular",
  },
  {
    id: "s10",
    day: 2,
    startTime: "13:00",
    duration: 90,
    title: "أساسيات البرمجة",
    level: "المستوى التمهيدي · 7–9 سنوات",
    instructor: "عمر سامح",
    room: "معمل 2",
    branch: "المعادي",
    enrolled: 8,
    capacity: 12,
    type: "regular",
  },
  {
    id: "s11",
    day: 3,
    startTime: "10:00",
    duration: 90,
    title: "روبوتكس مستوى 2",
    level: "المستوى المتوسط · 10–12 سنة",
    instructor: "مريم حسن",
    room: "معمل الروبوتات",
    branch: "مدينة نصر",
    enrolled: 12,
    capacity: 16,
    type: "regular",
  },
  {
    id: "s12",
    day: 3,
    startTime: "14:00",
    duration: 120,
    title: "تدريب مسابقة الروبوتات",
    level: "تدريب منافسات · 13–15 سنة",
    instructor: "يوسف عماد",
    room: "معمل 1",
    branch: "الشيخ زايد",
    enrolled: 8,
    capacity: 10,
    type: "competition_training",
    baseStatus: "pending_approval",
  },
  {
    id: "s13",
    day: 4,
    startTime: "10:00",
    duration: 90,
    title: "برمجة للمبتدئين",
    level: "المستوى التمهيدي · 7–9 سنوات",
    instructor: "عمر سامح",
    room: "معمل 2",
    branch: "مدينة نصر",
    enrolled: 10,
    capacity: 12,
    type: "regular",
  },
  {
    id: "s14",
    day: 4,
    startTime: "12:00",
    duration: 90,
    title: "الذكاء الاصطناعي للصغار",
    level: "المستوى المتوسط · 10–12 سنة",
    instructor: "هبة محمود",
    room: "قاعة الإبداع",
    branch: "المعادي",
    enrolled: 11,
    capacity: 14,
    type: "regular",
  },
  {
    id: "s15",
    day: 5,
    startTime: "11:00",
    duration: 90,
    title: "برمجة الألعاب",
    level: "المستوى المتوسط · 10–12 سنة",
    instructor: "كريم عادل",
    room: "معمل 2",
    branch: "الشيخ زايد",
    enrolled: 8,
    capacity: 12,
    type: "regular",
  },
  {
    id: "s16",
    day: 5,
    startTime: "15:00",
    duration: 90,
    title: "دوائر إلكترونية",
    level: "المستوى المتقدم · 13–15 سنة",
    instructor: "سارة خالد",
    room: "معمل 1",
    branch: "مدينة نصر",
    enrolled: 12,
    capacity: 14,
    type: "regular",
  },
  {
    id: "s17",
    day: 6,
    startTime: "10:00",
    duration: 180,
    title: "يوم المسابقة الشهرية",
    level: "فعالية أكاديمية · جميع المستويات",
    instructor: "يوسف عماد",
    room: "قاعة الإبداع",
    branch: "مدينة نصر",
    enrolled: 24,
    capacity: 30,
    type: "competition_day",
  },
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
      if (week > 0 && (status === "completed" || status === "ongoing"))
        status = "scheduled";
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
      <span className="brand-word">مدى</span>
    </div>
  );
}

function SchedulePage() {
  const [, navigate] = useLocation();
  const { me } = useAuth();
  const [liveMode, setLiveMode] = useState(() => apiClient.hasSession());
  const [loading, setLoading] = useState(() => apiClient.hasSession());
  const [sessions, setSessions] = useState<Session[]>(() => apiClient.hasSession() ? [] : seededSessions());
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("كل الفروع");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [view, setView] = useState<"week" | "day">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 780px)").matches
      ? "day"
      : "week"
  );
  const [statusFilter, setStatusFilter] = useState<"all" | SessionStatus>(
    "all"
  );
  const [instructorFilter, setInstructorFilter] = useState("الكل");
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsSession, setDetailsSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveClassrooms, setLiveClassrooms] = useState<SchedulingClassroom[]>(
    []
  );
  const [liveClassroomsReady, setLiveClassroomsReady] = useState(false);
  const [liveInstructors, setLiveInstructors] = useState<
    SchedulingInstructor[]
  >([]);
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
  useEffect(() => {
    if (!apiClient.hasSession()) {
      setLiveMode(false);
      setLoading(false);
      setSessions(seededSessions());
      return;
    }
    setLiveMode(true);
    setLoading(true);
    setLoadError(null);
    Promise.allSettled([
      apiClient.listSessions(),
      apiClient.schedulingClassrooms(),
      apiClient.schedulingInstructors(),
    ]).then(([sessionResult, classroomResult, instructorResult]) => {
      if (sessionResult.status === "rejected") {
        setLiveClassrooms([]);
        setLiveInstructors([]);
        setLiveClassroomsReady(false);
        setSessions([]);
        const cause = sessionResult.reason;
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "تعذر تحميل جلسات الجدول من الخادم."
        );
        return;
      }

      setSessions(sessionResult.value.items.map(sessionFromApi));
      const classrooms =
        classroomResult.status === "fulfilled"
          ? classroomResult.value.items
          : [];
      const instructors =
        instructorResult.status === "fulfilled"
          ? instructorResult.value.items
          : [];
      setLiveClassrooms(classrooms);
      setLiveInstructors(instructors);
      setLiveClassroomsReady(classroomResult.status === "fulfilled");

      const optionalFailure = [classroomResult, instructorResult].find(
        result => result.status === "rejected"
      );
      if (optionalFailure?.status === "rejected") {
        setLoadError(
          "تم تحميل جلسات الجدول؛ بعض بيانات إنشاء الجلسة غير متاحة لصلاحيات الحساب الحالية."
        );
      }
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const liveBranches = Array.from(
    new Map(
      liveClassrooms.map(room => [room.branchId, room.branchName])
    ).entries()
  ).map(([id, name]) => ({ id, name }));
  const selectedLiveRooms = liveClassrooms.filter(
    room => room.branchId === form.branchId && room.status === "AVAILABLE"
  );

  const weekStart = useMemo(
    () => addDays(BASE_DATE, weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(
    () =>
      DAY_NAMES.map((name, index) => {
        const date = addDays(weekStart, index);
        return { name, date, iso: toISODate(date), index };
      }),
    [weekStart]
  );
  const visibleDays = view === "day" ? [days[selectedDay]] : days;
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const weekRecords = sessions.filter(session =>
    days.some(day => day.iso === session.date)
  );
  const matchingSessions = useMemo(
    () =>
      weekRecords.filter(session => {
        const textMatch =
          !normalizedQuery ||
          [
            session.title,
            session.level,
            session.instructor,
            session.room,
            session.branch,
            session.startTime,
          ].some(value =>
            value.toLocaleLowerCase("ar").includes(normalizedQuery)
          );
        const branchMatch = branch === "كل الفروع" || session.branch === branch;
        const instructorMatch =
          instructorFilter === "الكل" ||
          session.instructor === instructorFilter;
        const statusMatch =
          statusFilter === "all" || session.status === statusFilter;
        const dayMatch =
          view !== "day" || session.date === days[selectedDay].iso;
        return (
          textMatch && branchMatch && instructorMatch && statusMatch && dayMatch
        );
      }),
    [
      weekRecords,
      normalizedQuery,
      branch,
      instructorFilter,
      statusFilter,
      view,
      days,
      selectedDay,
    ]
  );
  const instructors = useMemo(
    () => [
      "الكل",
      ...Array.from(new Set(weekRecords.map(session => session.instructor))),
    ],
    [weekRecords]
  );
  const todayCount = sessions.filter(
    session => session.date === days[0].iso
  ).length;
  const weekCount = weekRecords.length;
  const reviewCount = weekRecords.filter(
    session => session.status === "pending_approval"
  ).length;
  const roomCount = new Set(weekRecords.map(session => session.room)).size;

  const comingSoon = (label: string) => {
    toast("القسم قيد التجهيز", {
      description: `هنبدأ في تطوير «${label}» في المرحلة التالية.`,
    });
    setMobileNavOpen(false);
  };

  const shiftSelection = (direction: -1 | 1) => {
    if (view === "week") {
      setWeekOffset(offset => offset + direction);
      return;
    }
    if (selectedDay + direction < 0) {
      setWeekOffset(offset => offset - 1);
      setSelectedDay(6);
    } else if (selectedDay + direction > 6) {
      setWeekOffset(offset => offset + 1);
      setSelectedDay(0);
    } else {
      setSelectedDay(day => day + direction);
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
    const defaultRoom =
      liveClassrooms.find(room => room.branchName === branch) ??
      liveClassrooms[0];
    const defaultInstructor = liveInstructors[0];
    setEditingId(null);
    setForm({
      date,
      startTime: "16:00",
      duration: 90,
      title: "",
      level: "المستوى التمهيدي",
      instructor: defaultInstructor?.name ?? INSTRUCTORS[0],
      instructorId: defaultInstructor?.id,
      room: defaultRoom?.name ?? ROOMS[0],
      classroomId: defaultRoom?.id,
      branch:
        defaultRoom?.branchName ??
        (branch === "كل الفروع" ? BRANCHES[0] : branch),
      branchId: defaultRoom?.branchId,
      type: "regular",
    });
    setDialogMode("add");
  };

  const openEditDialog = (session: Session) => {
    if (liveMode) {
      toast.info("تعديل الجلسة من الجدول غير متاح عبر الـAPI الحالي", {
        description: "لن يتم حفظ أي تعديل محلي على جلسة خادمية.",
      });
      return;
    }
    setEditingId(session.id);
    setForm({
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
      title: session.title,
      level: session.level,
      instructor: session.instructor,
      room: session.room,
      branch: session.branch,
      type: session.type,
    });
    setDetailsSession(null);
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingId(null);
  };

  const handleSessionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (liveMode) {
      if (dialogMode === "edit") {
        toast.error("لا يتوفر endpoint لتعديل الجلسة بعد.");
        return;
      }
      const liveRoom = liveClassrooms.find(
        room => room.id === form.classroomId
      );
      const liveInstructor = liveInstructors.find(
        instructor => instructor.id === form.instructorId
      );
      if (!liveRoom || !liveInstructor) {
        toast.error("اختر مدربًا وقاعة متاحة من بيانات الأكاديمية الحية.");
        return;
      }
      const startsAt = new Date(`${form.date}T${form.startTime}:00`);
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + Number(form.duration));
      try {
        const response = await apiClient.createSession({
          branchId: liveRoom.branchId,
          classroomId: liveRoom.id,
          instructorId: liveInstructor.id,
          startAt: startsAt.toISOString(),
          endAt: endsAt.toISOString(),
          sessionNumber: 1,
          type: form.type.toUpperCase(),
          notes: form.title.trim(),
        });
        const created: Session = {
          ...form,
          id: response.sessionId,
          title: form.title.trim(),
          instructor: liveInstructor.name ?? liveInstructor.id,
          room: liveRoom.name,
          branch: liveRoom.branchName,
          branchId: liveRoom.branchId,
          classroomId: liveRoom.id,
          instructorId: liveInstructor.id,
          duration: Number(form.duration),
          enrolled: 0,
          capacity: liveRoom.capacity,
          status: "scheduled",
        };
        setSessions(current => [created, ...current]);
        const chosenDate = fromISODate(form.date);
        setWeekOffset(
          Math.floor(
            (chosenDate.getTime() - BASE_DATE.getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        );
        setSelectedDay((chosenDate.getDay() + 1) % 7);
        toast.success("تم حفظ الجلسة على الخادم", {
          description: `رقم الجلسة: ${response.sessionNumber} · ${response.status}`,
        });
        closeDialog();
      } catch (cause) {
        toast.error("تعذر حفظ الجلسة", {
          description:
            cause instanceof Error ? cause.message : "فشل الاتصال بالخادم.",
        });
      }
      return;
    }
    const start = minutesFromTime(form.startTime);
    const end = start + Number(form.duration);
    const conflict = sessions.find(session => {
      if (
        session.id === editingId ||
        session.date !== form.date ||
        session.status === "cancelled"
      )
        return false;
      const sessionStart = minutesFromTime(session.startTime);
      const sessionEnd = sessionStart + session.duration;
      const overlaps = start < sessionEnd && sessionStart < end;
      return (
        overlaps &&
        ((session.room === form.room && session.branch === form.branch) ||
          session.instructor === form.instructor)
      );
    });
    if (conflict) {
      const resource =
        conflict.room === form.room
          ? `قاعة ${form.room}`
          : `جدول الكوتش ${form.instructor}`;
      toast.error("في تعارض محتمل في الجدول", {
        description: `الحصة تتداخل مع «${conflict.title}» في ${resource}. غيّر الوقت أو المورد قبل الحفظ.`,
      });
      return;
    }
    if (dialogMode === "edit" && editingId) {
      setSessions(current =>
        current.map(session =>
          session.id === editingId
            ? { ...session, ...form, duration: Number(form.duration) }
            : session
        )
      );
      toast.success("اتحدّثت بيانات الحصة", {
        description: "التغيير محفوظ محليًا في العرض التجريبي فقط.",
      });
    } else {
      const created: Session = {
        id: `local-${Date.now()}`,
        ...form,
        duration: Number(form.duration),
        enrolled: 0,
        capacity: 16,
        status: "scheduled",
      };
      setSessions(current => [created, ...current]);
      const targetDay = days.find(day => day.iso === form.date);
      const chosenDate = fromISODate(form.date);
      setWeekOffset(
        Math.floor(
          (chosenDate.getTime() - BASE_DATE.getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      );
      setSelectedDay(targetDay?.index ?? (chosenDate.getDay() + 1) % 7);
      toast.success("اتضافت الحصة", {
        description: "اتضافت لبيانات العرض التجريبية، من غير حفظ على خادم.",
      });
    }
    closeDialog();
  };

  const cancelSession = (session: Session) => {
    if (liveMode) {
      toast.info("إلغاء الجلسة غير متاح من هذه الشاشة", {
        description:
          "لا يوجد endpoint إلغاء في الـAPI الحالي؛ لم يتغير سجل الخادم.",
      });
      return;
    }
    setSessions(current =>
      current.map(item =>
        item.id === session.id ? { ...item, status: "cancelled" } : item
      )
    );
    setDetailsSession(null);
    toast.success("اتعلّمت الحصة كملغاة", {
      description: "التغيير محلي للعرض التجريبي فقط.",
    });
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
      {me?.role === "R03_HEAD_INSTRUCTORS" ? <R03HeadInstructorsSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} activePath="/schedule" /> : <>
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <BrandMark />
          <button
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="academy-switcher">
          <span className="academy-avatar">
            <GraduationCap size={20} />
          </span>
          <span className="academy-meta">
            <strong>أكاديمية مدى</strong>
            <small>إدارة الأكاديمية</small>
          </span>
          <ChevronDown size={15} className="switcher-chevron" />
        </div>
        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="primary-nav" aria-label="القائمة الرئيسية">
          <button className="nav-link" onClick={() => navigate("/")}>
            <LayoutDashboard size={19} />
            <span>الرئيسية</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/students")}>
            <Users size={19} />
            <span>الطلاب</span>
            <span className="nav-count">248</span>
          </button>
          <button className="nav-link active" aria-current="page">
            <CalendarDays size={19} />
            <span>الجدول</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/classes")}>
            <BookOpen size={19} />
            <span>الحصص والكورسات</span>
          </button>
          <button className="nav-link" onClick={() => comingSoon("المسابقات")}>
            <Sparkles size={19} />
            <span>المسابقات</span>
          </button>
        </nav>
        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link" onClick={() => navigate("/team")}>
            <Users size={19} />
            <span>الفريق والأدوار</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/approvals")}>
            <CheckCircle2 size={19} />
            <span>الموافقات</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/reports")}>
            <Activity size={19} />
            <span>التقارير والتحليلات</span>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>محتاج مساعدة؟</strong>
            <span>مركز الدعم والإرشادات</span>
          </div>
          <ChevronLeft size={16} />
        </div>
        <div className="sidebar-bottom">
          <button className="nav-link" onClick={() => comingSoon("الإعدادات")}>
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <SessionLogoutButton className="nav-link" iconSize={19} />
        </div>
        <div className="sidebar-version">
          مدى لإدارة الأكاديميات <span>نسخة تجريبية</span>
        </div>
      </aside>

      </>}

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="branch-select-wrap">
              <button
                className={`branch-select ${branchMenuOpen ? "is-open" : ""}`}
                aria-expanded={branchMenuOpen}
                onClick={() => setBranchMenuOpen(open => !open)}
              >
                <span className="branch-icon">
                  <MapPin size={17} />
                </span>
                <span>{branch === "كل الفروع" ? branch : `فرع ${branch}`}</span>
                <ChevronDown size={15} />
              </button>
              {branchMenuOpen && (
                <div className="branch-menu">
                  <button
                    className={branch === "كل الفروع" ? "selected" : ""}
                    onClick={() => {
                      setBranch("كل الفروع");
                      setBranchMenuOpen(false);
                    }}
                  >
                    كل الفروع
                  </button>
                  {(liveMode
                    ? liveBranches.map(item => item.name)
                    : BRANCHES
                  ).map(item => (
                    <button
                      className={branch === item ? "selected" : ""}
                      key={item}
                      onClick={() => {
                        setBranch(item);
                        setBranchMenuOpen(false);
                      }}
                    >
                      <MapPin size={15} />
                      فرع {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="ابحث عن حصة أو كوتش..."
                aria-label="ابحث عن حصة أو كوتش"
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="topbar-left">
            <button
              className="icon-button notification-button"
              aria-label="الإشعارات"
              onClick={() => toast("لا توجد إشعارات جديدة")}
            >
              <Bell size={18} />
            </button>
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => toast("إعدادات الحساب قيد التجهيز")}
            >
              <span className="profile-copy">
                <strong>{me?.user?.displayName?.trim() || "أحمد محمود"}</strong>
                <small>{me?.roleLabel || (liveMode ? "مدير الفرع" : "مدير الفرع")}</small>
              </span>
              <span className="profile-avatar">{me?.user?.displayName ? me.user.displayName.trim().slice(0, 2) : "أم"}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="workspace schedule-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => navigate("/")}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>الجدول</span>
          </div>
          <section className="students-welcome schedule-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> تخطيط الحصص والفصول
              </div>
              <h1>الجدول</h1>
              <p>نظّم حصص الأسبوع وتابع الكوتشيز والقاعات من شاشة واحدة.</p>
              <div className="students-demo-note" role="status">
                <strong>
                  {liveMode ? "بيانات حية من الخادم" : "DEMO · بيانات توضيحية"}
                </strong>
                <span>
                  {liveMode
                    ? "الحفظ ينشئ جلسة جديدة على الـAPI؛ التعديل والإلغاء غير متاحين من هذه الشاشة."
                    : "الإضافات والتعديلات محلية للعرض التجريبي فقط."}
                </span>
              </div>
              {loadError && (
                <div className="students-demo-note" role="alert">
                  <strong>تعذر تحميل الجدول</strong>
                  <span>{loadError}</span>
                </div>
              )}
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() =>
                  toast("التصدير متاح بعد ربط بيانات الجدول الحقيقية")
                }
              >
                <ArrowRightLeft size={16} /> مشاركة العرض
              </button>
              <button className="button button-primary" onClick={openAddDialog}>
                <Plus size={18} /> إضافة حصة
              </button>
            </div>
          </section>

          <section className="schedule-stats" aria-label="ملخص الجدول">
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-teal">
                <CalendarDays size={17} />
              </span>
              <div>
                <small>حصص هذا الأسبوع</small>
                <strong>{loading ? "..." : weekCount}</strong>
              </div>
              <span className="schedule-stat-note">
                في {branch === "كل الفروع" ? "كل الفروع" : branch}
              </span>
            </article>
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-blue">
                <Clock3 size={17} />
              </span>
              <div>
                <small>حصص السبت</small>
                <strong>{loading ? "..." : todayCount}</strong>
              </div>
              <span className="schedule-stat-note">26 سبتمبر</span>
            </article>
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-amber">
                <AlertCircle size={17} />
              </span>
              <div>
                <small>تحتاج مراجعة</small>
                <strong>{loading ? "..." : reviewCount}</strong>
              </div>
              <span className="schedule-stat-note">موافقة مطلوبة</span>
            </article>
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-violet">
                <MapPin size={17} />
              </span>
              <div>
                <small>قاعات مستخدمة</small>
                <strong>{loading ? "..." : roomCount}</strong>
              </div>
              <span className="schedule-stat-note">هذا الأسبوع</span>
            </article>
          </section>

          <ScheduleCalendar
            weekStart={weekStart}
            days={days}
            visibleDays={visibleDays}
            matchingSessions={matchingSessions}
            filteredTabs={filteredTabs}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            instructors={instructors}
            instructorFilter={instructorFilter}
            setInstructorFilter={setInstructorFilter}
            reviewCount={reviewCount}
            view={view}
            setView={setView}
            selectedDay={selectedDay}
            weekOffset={weekOffset}
            shiftSelection={shiftSelection}
            setWeekOffset={setWeekOffset}
            setSelectedDay={setSelectedDay}
            setDetailsSession={setDetailsSession}
            formatDate={formatDate}
            addDays={addDays}
            minutesFromTime={minutesFromTime}
            timeLabel={timeLabel}
            statusLabels={STATUS_LABELS}
            firstHour={FIRST_HOUR}
            lastHour={LAST_HOUR}
            hourHeight={HOUR_HEIGHT}
          />
          <div className="students-demo-note">
            <AlertCircle size={14} />
            <span>
              بيانات الحصص والكوتشيز والقاعات المعروضة توضيحية ومولّدة للعرض
              فقط؛ لا تتصل بقاعدة بيانات. فحص التعارض داخل النموذج محلي ومبدئي.
            </span>
          </div>
          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>واجهة تجريبية — إصدار 0.1</span>
          </footer>
        </div>
      </main>
      {detailsSession && (
        <ScheduleDetailsDialog
          session={detailsSession}
          onClose={() => setDetailsSession(null)}
          onCancel={cancelSession}
          onEdit={openEditDialog}
          statusLabels={STATUS_LABELS}
          dayNames={DAY_NAMES}
          fromISODate={fromISODate}
          formatDate={formatDate}
          timeLabel={timeLabel}
          typeLabels={TYPE_LABELS}
        />
      )}
      {dialogMode && (
        <ScheduleFormDialog
          dialogMode={dialogMode}
          form={form}
          liveMode={liveMode}
          liveBranches={liveBranches}
          liveInstructors={liveInstructors}
          liveClassrooms={liveClassrooms}
          selectedLiveRooms={selectedLiveRooms}
          branchOptions={BRANCHES}
          instructorOptions={INSTRUCTORS}
          roomOptions={ROOMS}
          typeLabels={TYPE_LABELS}
          setForm={setForm}
          onClose={closeDialog}
          onSubmit={handleSessionSubmit}
        />
      )}
    </div>
  );
}

export default SchedulePage;
