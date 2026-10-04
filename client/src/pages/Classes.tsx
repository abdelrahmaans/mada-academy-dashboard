import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpLeft,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  apiClient,
  type CourseTemplateRecord,
  type GroupRecord,
  type SchedulingClassroom,
  type SchedulingInstructor,
  type StudentRecord,
} from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ClassesCatalogPanel from "@/components/ClassesCatalogPanel";
import ClassesDetailDialogs from "@/components/ClassesDetailDialogs";
import { ClassesCreateDialogs } from "@/components/ClassesCreateDialogs";

export type Track =
  | "robotics"
  | "coding"
  | "circuits"
  | "ai"
  | "soft_skills"
  | "game_dev";
type CourseStatus = "active" | "on_hold" | "draft" | "archived";
type OfferingStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type Course = {
  id: string;
  name: string;
  track: Track;
  type: "hard" | "soft";
  ageGroup: string;
  level: "beginner" | "intermediate" | "advanced";
  totalSessions: number;
  durationHours: number;
  basePricePiasters: number;
  status: CourseStatus;
  description: string;
};
export type Offering = {
  id: string;
  courseId: string;
  courseName: string;
  track: Track;
  instructor: string;
  substitute?: string;
  branch: string;
  classroom: string;
  startDate: string;
  schedule: string;
  days: string[];
  startTime: string;
  endTime: string;
  status: OfferingStatus;
  maxStudents: number;
  enrolledStudents: number;
};

type TabKey = "courses" | "groups";

const trackLabels: Record<Track, string> = {
  robotics: "روبوتكس",
  coding: "برمجة",
  circuits: "دوائر إلكترونية",
  ai: "ذكاء اصطناعي",
  soft_skills: "مهارات شخصية",
  game_dev: "تطوير ألعاب",
};
const levelLabels = {
  beginner: "تمهيدي",
  intermediate: "متوسط",
  advanced: "متقدم",
};
const courseStatusLabels: Record<CourseStatus, string> = {
  active: "نشط",
  on_hold: "موقوف مؤقتًا",
  draft: "مسودة",
  archived: "مؤرشف",
};
const offeringStatusLabels: Record<OfferingStatus, string> = {
  upcoming: "قادم",
  ongoing: "جارية",
  completed: "مكتملة",
  cancelled: "ملغاة",
};
const branches = ["كل الفروع", "مدينة نصر", "المعادي", "الشيخ زايد"];

const seedCourses: Course[] = [
  {
    id: "CRS-018",
    name: "روبوتكس مستوى 2",
    track: "robotics",
    type: "hard",
    ageGroup: "10–12",
    level: "intermediate",
    totalSessions: 12,
    durationHours: 1.5,
    basePricePiasters: 360000,
    status: "active",
    description: "تصميم وبرمجة الروبوتات باستخدام المستشعرات والمحركات.",
  },
  {
    id: "CRS-017",
    name: "برمجة للمبتدئين",
    track: "coding",
    type: "hard",
    ageGroup: "7–9",
    level: "beginner",
    totalSessions: 10,
    durationHours: 1.25,
    basePricePiasters: 280000,
    status: "active",
    description: "مدخل ممتع للتفكير المنطقي وبناء أول البرامج.",
  },
  {
    id: "CRS-016",
    name: "دوائر إلكترونية",
    track: "circuits",
    type: "hard",
    ageGroup: "13–15",
    level: "advanced",
    totalSessions: 14,
    durationHours: 2,
    basePricePiasters: 420000,
    status: "active",
    description: "فهم الدوائر والمكونات وبناء مشروعات إلكترونية.",
  },
  {
    id: "CRS-015",
    name: "ذكاء اصطناعي للصغار",
    track: "ai",
    type: "hard",
    ageGroup: "10–12",
    level: "beginner",
    totalSessions: 8,
    durationHours: 1.5,
    basePricePiasters: 320000,
    status: "draft",
    description: "اكتشاف مبادئ الذكاء الاصطناعي من خلال أنشطة مبسطة.",
  },
  {
    id: "CRS-014",
    name: "مهارات التفكير الإبداعي",
    track: "soft_skills",
    type: "soft",
    ageGroup: "7–9",
    level: "intermediate",
    totalSessions: 6,
    durationHours: 1,
    basePricePiasters: 180000,
    status: "active",
    description: "تدريبات عملية على حل المشكلات والعمل التعاوني.",
  },
  {
    id: "CRS-013",
    name: "برمجة الألعاب",
    track: "game_dev",
    type: "hard",
    ageGroup: "13–15",
    level: "intermediate",
    totalSessions: 12,
    durationHours: 1.5,
    basePricePiasters: 390000,
    status: "on_hold",
    description: "إنشاء لعبة ثنائية الأبعاد من الفكرة إلى التجربة.",
  },
];

const seedOfferings: Offering[] = [
  {
    id: "GRP-042",
    courseId: "CRS-018",
    courseName: "روبوتكس مستوى 2",
    track: "robotics",
    instructor: "مريم حسن",
    branch: "مدينة نصر",
    classroom: "معمل 1",
    startDate: "2026-09-05",
    schedule: "السبت والثلاثاء · 10:00 ص",
    days: ["السبت", "الثلاثاء"],
    startTime: "10:00",
    endTime: "11:30",
    status: "ongoing",
    maxStudents: 16,
    enrolledStudents: 12,
  },
  {
    id: "GRP-041",
    courseId: "CRS-017",
    courseName: "برمجة للمبتدئين",
    track: "coding",
    instructor: "عمر سامح",
    branch: "مدينة نصر",
    classroom: "معمل 2",
    startDate: "2026-09-12",
    schedule: "الأحد والأربعاء · 12:00 م",
    days: ["الأحد", "الأربعاء"],
    startTime: "12:00",
    endTime: "13:15",
    status: "upcoming",
    maxStudents: 12,
    enrolledStudents: 8,
  },
  {
    id: "GRP-040",
    courseId: "CRS-016",
    courseName: "دوائر إلكترونية",
    track: "circuits",
    instructor: "سارة خالد",
    substitute: "محمود فوزي",
    branch: "المعادي",
    classroom: "معمل 3",
    startDate: "2026-09-07",
    schedule: "الإثنين والخميس · 02:00 م",
    days: ["الإثنين", "الخميس"],
    startTime: "14:00",
    endTime: "16:00",
    status: "ongoing",
    maxStudents: 14,
    enrolledStudents: 11,
  },
  {
    id: "GRP-039",
    courseId: "CRS-014",
    courseName: "مهارات التفكير الإبداعي",
    track: "soft_skills",
    instructor: "ندى عادل",
    branch: "الشيخ زايد",
    classroom: "قاعة 2",
    startDate: "2026-08-15",
    schedule: "الجمعة · 11:00 ص",
    days: ["الجمعة"],
    startTime: "11:00",
    endTime: "12:00",
    status: "completed",
    maxStudents: 15,
    enrolledStudents: 13,
  },
  {
    id: "GRP-038",
    courseId: "CRS-013",
    courseName: "برمجة الألعاب",
    track: "game_dev",
    instructor: "كريم عاطف",
    branch: "المعادي",
    classroom: "معمل 2",
    startDate: "2026-09-19",
    schedule: "السبت والإثنين · 04:00 م",
    days: ["السبت", "الإثنين"],
    startTime: "16:00",
    endTime: "17:30",
    status: "upcoming",
    maxStudents: 12,
    enrolledStudents: 6,
  },
];

const trackIcons: Record<Track, string> = {
  robotics: "robotics",
  coding: "coding",
  circuits: "circuits",
  ai: "ai",
  soft_skills: "soft",
  game_dev: "games",
};
const formatArabicTime = (value: string) => {
  const [hoursRaw, minutesRaw] = value.split(":").map(Number);
  const hour = hoursRaw % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(minutesRaw).padStart(2, "0")} ${hoursRaw >= 12 ? "م" : "ص"}`;
};
const apiWeekdays = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
const normalizeTrack = (value: string): Track =>
  Object.keys(trackLabels).includes(value) ? (value as Track) : "robotics";
const courseFromApi = (course: CourseTemplateRecord): Course => ({
  id: course.id,
  name: course.name,
  track: normalizeTrack(course.track),
  type: course.type === "soft" ? "soft" : "hard",
  ageGroup: course.ageGroup,
  level:
    course.level === "intermediate" || course.level === "advanced"
      ? course.level
      : "beginner",
  totalSessions: course.totalSessions,
  durationHours: Number(course.sessionDurationHours),
  basePricePiasters: course.basePricePiastres,
  status:
    course.status === "ARCHIVED"
      ? "archived"
      : course.status === "ACTIVE"
        ? "active"
        : "draft",
  description: "قالب كورس محفوظ على الخادم.",
});
const offeringFromApi = (group: GroupRecord): Offering => {
  let scheduleData: {
    daysOfWeek?: number[];
    startTime?: string;
    durationMinutes?: number;
  } = {};
  try {
    scheduleData = JSON.parse(group.weeklyScheduleJson) as typeof scheduleData;
  } catch {
    /* leave an honest empty schedule label */
  }
  const days = (scheduleData.daysOfWeek ?? [])
    .map(day => apiWeekdays[day])
    .filter((day): day is string => Boolean(day));
  const startTime = (scheduleData.startTime ?? "09:00").slice(0, 5);
  const duration = scheduleData.durationMinutes ?? 60;
  const [hours, minutes] = startTime.split(":").map(Number);
  const endMinutes = hours * 60 + minutes + duration;
  const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  const today = new Date().toISOString().slice(0, 10);
  const status: OfferingStatus =
    group.endDate < today
      ? "completed"
      : group.startDate <= today
        ? "ongoing"
        : "upcoming";
  return {
    id: group.id,
    courseId: group.courseTemplateId,
    courseName: group.courseName,
    track: normalizeTrack(group.track),
    instructor: group.instructorName ?? group.instructorId,
    branch: group.branchName,
    classroom: group.classroomName,
    startDate: group.startDate,
    schedule: `${days.join(" و") || "جدول غير محدد"} · ${formatArabicTime(startTime)}`,
    days,
    startTime,
    endTime,
    status,
    maxStudents: group.maxStudents,
    enrolledStudents: group.enrolledStudents,
  };
};

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

function ClassesPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [courses, setCourses] = useState(seedCourses);
  const [offerings, setOfferings] = useState(seedOfferings);
  const [liveMode, setLiveMode] = useState(() => apiClient.hasSession());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("courses");
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<Track | "all">("all");
  const [branchFilter, setBranchFilter] = useState("كل الفروع");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [offeringModalOpen, setOfferingModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(
    null
  );
  const [courseName, setCourseName] = useState("");
  const [newTrack, setNewTrack] = useState<Track>("robotics");
  const [newCourseType, setNewCourseType] = useState<"hard" | "soft">("hard");
  const [ageGroup, setAgeGroup] = useState("10-12");
  const [level, setLevel] = useState<Course["level"]>("beginner");
  const [totalSessions, setTotalSessions] = useState("10");
  const [durationHours, setDurationHours] = useState("1.5");
  const [price, setPrice] = useState("");
  const [offeringCourseId, setOfferingCourseId] = useState(seedCourses[0].id);
  const [instructor, setInstructor] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [offeringBranch, setOfferingBranch] = useState("مدينة نصر");
  const [offeringBranchId, setOfferingBranchId] = useState("");
  const [classroom, setClassroom] = useState("معمل 1");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxStudents, setMaxStudents] = useState("12");
  const [scheduleDays, setScheduleDays] = useState<string[]>([
    "السبت",
    "الثلاثاء",
  ]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [liveClassrooms, setLiveClassrooms] = useState<SchedulingClassroom[]>(
    []
  );
  const [liveRoomsReady, setLiveRoomsReady] = useState(false);
  const [liveInstructors, setLiveInstructors] = useState<
    SchedulingInstructor[]
  >([]);
  const [liveStudents, setLiveStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  useEffect(() => {
    if (!apiClient.hasSession()) {
      setLiveMode(false);
      return;
    }
    setLiveMode(true);
    setCourses([]);
    setOfferings([]);
    setLoadError(null);
    Promise.allSettled([
      apiClient.courseTemplates(),
      apiClient.listGroups(),
      apiClient.schedulingClassrooms(),
      apiClient.schedulingInstructors(),
      apiClient.listStudents(),
    ]).then(
      ([
        courseResult,
        groupResult,
        roomResult,
        instructorResult,
        studentResult,
      ]) => {
        if (
          courseResult.status === "rejected" ||
          groupResult.status === "rejected"
        ) {
          setCourses([]);
          setOfferings([]);
          setLiveClassrooms([]);
          setLiveInstructors([]);
          setLiveStudents([]);
          setLiveRoomsReady(false);
          const cause =
            courseResult.status === "rejected"
              ? courseResult.reason
              : groupResult.status === "rejected"
                ? groupResult.reason
                : "تعذر تحميل بيانات الكورسات والمجموعات من الخادم.";
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "تعذر تحميل الكورسات والمجموعات من الخادم."
          );
          return;
        }

        const mappedCourses = courseResult.value.items.map(courseFromApi);
        setCourses(mappedCourses);
        setOfferings(groupResult.value.items.map(offeringFromApi));

        const rooms =
          roomResult.status === "fulfilled" ? roomResult.value.items : [];
        const instructors =
          instructorResult.status === "fulfilled"
            ? instructorResult.value.items
            : [];
        const students =
          studentResult.status === "fulfilled" ? studentResult.value.items : [];
        setLiveClassrooms(rooms);
        setLiveInstructors(instructors);
        setLiveStudents(students);
        setOfferingCourseId(mappedCourses[0]?.id ?? "");
        const firstRoom = rooms.find(room => room.status === "AVAILABLE");
        if (firstRoom) {
          setOfferingBranchId(firstRoom.branchId);
          setOfferingBranch(firstRoom.branchName);
          setSelectedClassroomId(firstRoom.id);
          setClassroom(firstRoom.name);
        }
        const firstInstructor = instructors[0];
        if (firstInstructor) {
          setSelectedInstructorId(firstInstructor.id);
          setInstructor(firstInstructor.name ?? "");
        }
        setLiveRoomsReady(roomResult.status === "fulfilled");

        const optionalFailure = [
          roomResult,
          instructorResult,
          studentResult,
        ].find(result => result.status === "rejected");
        if (optionalFailure?.status === "rejected") {
          setLoadError(
            "تم تحميل الكورسات والمجموعات؛ بعض بيانات إنشاء المجموعة غير متاحة لصلاحيات الحساب الحالية."
          );
        }
      }
    );
  }, []);

  const filteredCourses = useMemo(
    () =>
      courses.filter(course => {
        const query = search.trim().toLocaleLowerCase("ar");
        const matchesQuery =
          !query ||
          `${course.name} ${course.id} ${trackLabels[course.track]}`
            .toLocaleLowerCase("ar")
            .includes(query);
        const matchesTrack =
          trackFilter === "all" || course.track === trackFilter;
        const matchesStatus =
          statusFilter === "all" || course.status === statusFilter;
        return matchesQuery && matchesTrack && matchesStatus;
      }),
    [courses, search, trackFilter, statusFilter]
  );

  const filteredOfferings = useMemo(
    () =>
      offerings.filter(offering => {
        const query = search.trim().toLocaleLowerCase("ar");
        const matchesQuery =
          !query ||
          `${offering.courseName} ${offering.instructor} ${offering.classroom} ${offering.id}`
            .toLocaleLowerCase("ar")
            .includes(query);
        const matchesTrack =
          trackFilter === "all" || offering.track === trackFilter;
        const matchesBranch =
          branchFilter === "كل الفروع" || offering.branch === branchFilter;
        const matchesStatus =
          statusFilter === "all" || offering.status === statusFilter;
        return matchesQuery && matchesTrack && matchesBranch && matchesStatus;
      }),
    [offerings, search, trackFilter, branchFilter, statusFilter]
  );

  const activeCourses = courses.filter(
    course => course.status === "active"
  ).length;
  const activeGroups = offerings.filter(
    offering => offering.status === "ongoing" || offering.status === "upcoming"
  ).length;
  const enrolledTotal = offerings.reduce(
    (sum, offering) => sum + offering.enrolledStudents,
    0
  );
  const availableSeats = offerings.reduce(
    (sum, offering) => sum + offering.maxStudents - offering.enrolledStudents,
    0
  );

  const notifySoon = (name: string) => {
    toast("القسم قيد التجهيز", {
      description: `سيُستكمل «${name}» في المرحلة التالية.`,
    });
    setMobileNavOpen(false);
  };
  const resetCourseForm = () => {
    setCourseName("");
    setNewTrack("robotics");
    setNewCourseType("hard");
    setAgeGroup("10-12");
    setLevel("beginner");
    setTotalSessions("10");
    setDurationHours("1.5");
    setPrice("");
  };
  const resetOfferingForm = () => {
    setOfferingCourseId(courses[0]?.id ?? "");
    const firstRoom = liveClassrooms.find(room => room.status === "AVAILABLE");
    const firstInstructor = liveInstructors[0];
    setInstructor(firstInstructor?.name ?? "");
    setSelectedInstructorId(firstInstructor?.id ?? "");
    setOfferingBranch(firstRoom?.branchName ?? "مدينة نصر");
    setOfferingBranchId(firstRoom?.branchId ?? "");
    setClassroom(firstRoom?.name ?? "معمل 1");
    setSelectedClassroomId(firstRoom?.id ?? "");
    setStartDate("");
    setMaxStudents("12");
    setScheduleDays(["السبت", "الثلاثاء"]);
    setStartTime("10:00");
    setEndTime("11:30");
    setSelectedStudentIds([]);
  };

  const addCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !courseName.trim() ||
      Number(totalSessions) < 1 ||
      Number(durationHours) <= 0 ||
      Number(price) <= 0
    ) {
      toast.error("راجع بيانات الكورس المطلوبة");
      return;
    }
    if (liveMode) {
      try {
        const saved = await apiClient.createCourseTemplate({
          name: courseName.trim(),
          track: newTrack,
          type: newCourseType,
          ageGroup,
          level,
          totalSessions: Number(totalSessions),
          sessionDurationHours: Number(durationHours),
          basePricePiastres: Math.round(Number(price) * 100),
        });
        const course = courseFromApi(saved);
        setCourses(current => [course, ...current]);
        setTab("courses");
        setTrackFilter("all");
        setStatusFilter("all");
        setSearch("");
        setCourseModalOpen(false);
        resetCourseForm();
        toast.success("تم حفظ قالب الكورس على الخادم كمسودة.");
      } catch (cause) {
        toast.error("تعذر حفظ قالب الكورس", {
          description:
            cause instanceof Error ? cause.message : "فشل الاتصال بالخادم.",
        });
      }
      return;
    }
    const course: Course = {
      id: `CRS-${String(19 + courses.length - seedCourses.length).padStart(3, "0")}`,
      name: courseName.trim(),
      track: newTrack,
      type: newCourseType,
      ageGroup,
      level,
      totalSessions: Number(totalSessions),
      durationHours: Number(durationHours),
      basePricePiasters: Math.round(Number(price) * 100),
      status: "draft",
      description: "كورس جديد — أضف وصف المحتوى قبل نشره.",
    };
    setCourses(current => [course, ...current]);
    setTab("courses");
    setTrackFilter("all");
    setStatusFilter("all");
    setSearch("");
    setCourseModalOpen(false);
    resetCourseForm();
    toast.success("تمت إضافة الكورس كمسودة", {
      description: "اتضاف لبيانات العرض التجريبية فقط.",
    });
  };

  const addOffering = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !offeringCourseId ||
      !instructor.trim() ||
      !startDate ||
      !scheduleDays.length ||
      Number(maxStudents) < 1
    ) {
      toast.error("أكمل بيانات المجموعة والجدول");
      return;
    }
    if (endTime <= startTime) {
      toast.error("وقت نهاية الحصة لازم يكون بعد بدايتها");
      return;
    }
    const course = courses.find(item => item.id === offeringCourseId);
    if (liveMode) {
      const room = liveClassrooms.find(
        item =>
          item.id === selectedClassroomId &&
          item.branchId === offeringBranchId &&
          item.status === "AVAILABLE"
      );
      const selectedInstructor = liveInstructors.find(
        item => item.id === selectedInstructorId
      );
      if (!course || !room || !selectedInstructor || !offeringBranchId) {
        toast.error(
          "اختر قالب كورس، مدربًا، فرعًا وقاعة نشطة من بيانات الخادم."
        );
        return;
      }
      const startMinutes =
        Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
      const endMinutes =
        Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));
      const durationMinutes = (endMinutes - startMinutes + 1440) % 1440;
      if (durationMinutes <= 0) {
        toast.error("مدة المجموعة غير صالحة.");
        return;
      }
      const weekdays = scheduleDays
        .map(day => apiWeekdays.indexOf(day))
        .filter(day => day >= 0);
      const cursor = new Date(`${startDate}T00:00:00`);
      let scheduled = 0;
      let endDate = startDate;
      let guard = 0;
      while (scheduled < course.totalSessions && guard < 730) {
        if (weekdays.includes(cursor.getDay())) {
          scheduled += 1;
          endDate = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        }
        cursor.setDate(cursor.getDate() + 1);
        guard += 1;
      }
      if (scheduled < course.totalSessions) {
        toast.error("تعذر حساب تاريخ نهاية المجموعة.");
        return;
      }
      try {
        const response = await apiClient.createGroup({
          branchId: offeringBranchId,
          courseTemplateId: course.id,
          instructorId: selectedInstructor.id,
          classroomId: room.id,
          startDate,
          endDate,
          daysOfWeek: weekdays,
          startTime,
          durationMinutes,
          maxStudents: Number(maxStudents),
          studentIds: selectedStudentIds,
          finalPricePiastres: course.basePricePiasters,
        });
        setOfferingModalOpen(false);
        resetOfferingForm();
        toast.success("تم حفظ المجموعة وتوليد جلساتها على الخادم.", {
          description: `${response.sessionsCreated} جلسة · ${response.studentCount} طالب`,
        });
        try {
          setOfferings(
            (await apiClient.listGroups()).items.map(offeringFromApi)
          );
        } catch (refreshError) {
          setLoadError(
            refreshError instanceof Error
              ? refreshError.message
              : "تم الحفظ، لكن تعذر تحديث القائمة."
          );
        }
      } catch (cause) {
        toast.error("تعذر حفظ المجموعة", {
          description:
            cause instanceof Error ? cause.message : "فشل الاتصال بالخادم.",
        });
      }
      return;
    }
    const duplicateRoomSlot = offerings.find(
      item =>
        item.branch === offeringBranch &&
        item.classroom === classroom.trim() &&
        item.days.some(day => scheduleDays.includes(day)) &&
        startTime < item.endTime &&
        endTime > item.startTime
    );
    if (duplicateRoomSlot) {
      toast.error("تعارض حجز القاعة", {
        description: `القاعة محجوزة بالفعل مع «${duplicateRoomSlot.courseName}» في يوم مشترك. غيّر القاعة أو الوقت.`,
      });
      return;
    }
    const localCourse = course ?? courses[0];
    const newOffering: Offering = {
      id: `GRP-${String(43 + offerings.length - seedOfferings.length).padStart(3, "0")}`,
      courseId: localCourse.id,
      courseName: localCourse.name,
      track: localCourse.track,
      instructor: instructor.trim(),
      branch: offeringBranch,
      classroom: classroom.trim() || "قاعة 1",
      startDate,
      schedule: `${scheduleDays.join(" و")} · ${formatArabicTime(startTime)}`,
      days: scheduleDays,
      startTime,
      endTime,
      status: "upcoming",
      maxStudents: Number(maxStudents),
      enrolledStudents: 0,
    };
    setOfferings(current => [newOffering, ...current]);
    setTab("groups");
    setTrackFilter("all");
    setBranchFilter("كل الفروع");
    setStatusFilter("all");
    setSearch("");
    setOfferingModalOpen(false);
    resetOfferingForm();
    toast.success("تمت إضافة المجموعة", {
      description: "المجموعة مضافة في بيانات العرض التجريبية فقط.",
    });
  };

  const toggleDay = (day: string) =>
    setScheduleDays(days =>
      days.includes(day) ? days.filter(item => item !== day) : [...days, day]
    );
  const clearFilters = () => {
    setSearch("");
    setTrackFilter("all");
    setStatusFilter("all");
    setBranchFilter("كل الفروع");
  };
  const trackOptions = Object.entries(trackLabels) as [Track, string][];
  const currentCount =
    tab === "courses" ? filteredCourses.length : filteredOfferings.length;
  const liveBranchNames = Array.from(
    new Set(liveClassrooms.map(room => room.branchName))
  );

  return (
    <div className="app-shell" dir="rtl">
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
          <button className="nav-link" onClick={() => setLocation("/")}>
            <LayoutDashboard size={19} />
            <span>الرئيسية</span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/students")}>
            <Users size={19} />
            <span>الطلاب</span>
            <span className="nav-count">248</span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/schedule")}>
            <CalendarDays size={19} />
            <span>الجدول</span>
          </button>
          <button className="nav-link active" aria-current="page">
            <BookOpen size={19} />
            <span>الحصص والكورسات</span>
          </button>
          <button className="nav-link" onClick={() => notifySoon("المسابقات")}>
            <Sparkles size={19} />
            <span>المسابقات</span>
          </button>
        </nav>
        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link" onClick={() => setLocation("/finance")}>
            <Wallet size={19} />
            <span>المالية والتحصيل</span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/team")}>
            <Users size={19} />
            <span>الفريق والأدوار</span>
          </button>
          <button
            className="nav-link"
            onClick={() => setLocation("/approvals")}
          >
            <CheckCircle2 size={19} />
            <span>الموافقات</span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/reports")}>
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
          <button className="nav-link" onClick={() => notifySoon("الإعدادات")}>
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => {
              void logout().then(() => setLocation("/login"));
            }}
          >
            <LogOut size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
        <div className="sidebar-version">
          مدى لإدارة الأكاديميات <span>نسخة تجريبية</span>
        </div>
      </aside>

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
                <span>
                  {branchFilter === "كل الفروع"
                    ? "كل الفروع"
                    : `فرع ${branchFilter}`}
                </span>
                <ChevronDown size={15} />
              </button>
              {branchMenuOpen && (
                <div className="branch-menu">
                  {(liveMode
                    ? ["كل الفروع", ...liveBranchNames]
                    : branches
                  ).map(branch => (
                    <button
                      key={branch}
                      className={branchFilter === branch ? "selected" : ""}
                      onClick={() => {
                        setBranchFilter(branch);
                        setBranchMenuOpen(false);
                      }}
                    >
                      {branch === "كل الفروع" ? (
                        <Users size={15} />
                      ) : (
                        <MapPin size={15} />
                      )}
                      {branch}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                aria-label="ابحث عن كورس أو مدرب"
                placeholder="ابحث عن كورس أو مدرب..."
                value={search}
                onChange={event => setSearch(event.target.value)}
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
              <span className="notification-dot" />
              <Bell size={18} />
            </button>
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => toast("إعدادات الحساب قيد التجهيز")}
            >
              <span className="profile-copy">
                <strong>أحمد محمود</strong>
                <small>مدير الفرع</small>
              </span>
              <span className="profile-avatar">أم</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="workspace classes-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => setLocation("/")}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>الحصص والكورسات</span>
          </div>
          <section className="students-welcome classes-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> المسارات التعليمية · إدارة
                الجداول
              </div>
              <h1>الحصص والكورسات</h1>
              <p>نظّم محتوى الكورسات، المجموعات، وجداول حصص الفروع.</p>
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() =>
                  toast("تنزيل التقرير سيتاح عند ربط البيانات الفعلية")
                }
              >
                <ArrowDownToLine size={17} /> تصدير
              </button>
              <button
                className="button button-primary"
                onClick={() =>
                  tab === "courses"
                    ? setCourseModalOpen(true)
                    : setOfferingModalOpen(true)
                }
              >
                <Plus size={18} />
                {tab === "courses" ? "إضافة كورس" : "إضافة مجموعة"}
              </button>
            </div>
          </section>
          <div className="students-demo-note" role="status">
            <strong>
              {liveMode ? "بيانات الأكاديمية الحية" : "DEMO · بيانات توضيحية"}
            </strong>
            <span>
              {liveMode
                ? "الكورسات والمجموعات تُقرأ من الـAPI؛ إنشاء القوالب والمجموعات يُحفظ على الخادم."
                : "الإضافات في هذه الصفحة محلية للعرض التجريبي فقط."}
            </span>
          </div>
          {loadError && (
            <div className="students-demo-note" role="alert">
              <strong>تعذر تحميل بيانات الأكاديمية</strong>
              <span>{loadError}</span>
            </div>
          )}

          <section
            className="course-stats-grid"
            aria-label="ملخص الكورسات والمجموعات"
          >
            <article className="course-stat">
              <span className="course-stat-icon icon-teal">
                <BookOpen size={18} />
              </span>
              <span className="course-stat-label">قوالب كورسات نشطة</span>
              <div>
                <strong>{String(activeCourses).padStart(2, "0")}</strong>
                <span>من {courses.length} كورسات</span>
              </div>
              <small>
                <CheckCircle2 size={13} /> قابلة للتسجيل
              </small>
            </article>
            <article className="course-stat">
              <span className="course-stat-icon icon-blue">
                <CalendarCheck size={18} />
              </span>
              <span className="course-stat-label">مجموعات جارية أو قادمة</span>
              <div>
                <strong>{String(activeGroups).padStart(2, "0")}</strong>
                <span>مجموعة</span>
              </div>
              <small className="course-neutral">في الفروع المسجلة</small>
            </article>
            <article className="course-stat">
              <span className="course-stat-icon icon-violet">
                <Users size={18} />
              </span>
              <span className="course-stat-label">
                {liveMode ? "طلاب في المجموعات" : "طلاب في مجموعات العينة"}
              </span>
              <div>
                <strong>{String(enrolledTotal).padStart(2, "0")}</strong>
                <span>طالب</span>
              </div>
              <small className="course-neutral">
                {liveMode ? "إجمالي المسجلين بالخادم" : "مجموع بيانات تجريبية"}
              </small>
            </article>
            <article className="course-stat">
              <span className="course-stat-icon icon-amber">
                <Sparkles size={18} />
              </span>
              <span className="course-stat-label">
                {liveMode ? "أماكن متاحة" : "أماكن متاحة في العينة"}
              </span>
              <div>
                <strong>{String(availableSeats).padStart(2, "0")}</strong>
                <span>مقعد</span>
              </div>
              <small>
                <ArrowUpLeft size={13} /> سعة المجموعات النشطة والقادمة
              </small>
            </article>
          </section>

          <ClassesCatalogPanel
            tab={tab}
            setTab={setTab}
            courses={courses}
            offerings={offerings}
            filteredCourses={filteredCourses}
            filteredOfferings={filteredOfferings}
            trackFilter={trackFilter}
            setTrackFilter={setTrackFilter}
            branchFilter={branchFilter}
            setBranchFilter={setBranchFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            trackOptions={trackOptions}
            branches={branches}
            trackLabels={trackLabels}
            trackIcons={trackIcons}
            levelLabels={levelLabels}
            courseStatusLabels={courseStatusLabels}
            offeringStatusLabels={offeringStatusLabels}
            liveMode={liveMode}
            clearFilters={clearFilters}
            setSelectedCourse={setSelectedCourse}
            setSelectedOffering={setSelectedOffering}
          />
          <div className="students-demo-note">
            <Activity size={14} />
            <span>
              {liveMode
                ? "إنشاء قوالب الكورسات والمجموعات يُحفظ في قاعدة البيانات. تعديل/أرشفة القوالب والمجموعات غير متاح بعد."
                : "المحتوى والجداول والأسعار المعروضة تجريبية. الإضافة مؤقتة داخل الواجهة ولا تُحفظ في قاعدة بيانات."}
            </span>
          </div>
          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>
              {liveMode
                ? "واجهة مرتبطة بـAPI — إصدار 0.1"
                : "واجهة تجريبية — إصدار 0.1"}
            </span>
          </footer>
        </div>
      </main>

      <ClassesCreateDialogs
        courseModalOpen={courseModalOpen}
        offeringModalOpen={offeringModalOpen}
        setCourseModalOpen={setCourseModalOpen}
        setOfferingModalOpen={setOfferingModalOpen}
        resetCourseForm={resetCourseForm}
        resetOfferingForm={resetOfferingForm}
        addCourse={addCourse}
        addOffering={addOffering}
        liveMode={liveMode}
        courseName={courseName}
        setCourseName={setCourseName}
        newTrack={newTrack}
        setNewTrack={setNewTrack}
        newCourseType={newCourseType}
        setNewCourseType={setNewCourseType}
        ageGroup={ageGroup}
        setAgeGroup={setAgeGroup}
        level={level}
        setLevel={setLevel}
        totalSessions={totalSessions}
        setTotalSessions={setTotalSessions}
        durationHours={durationHours}
        setDurationHours={setDurationHours}
        price={price}
        setPrice={setPrice}
        trackOptions={trackOptions}
        levelLabels={levelLabels}
        courses={courses}
        offeringCourseId={offeringCourseId}
        setOfferingCourseId={setOfferingCourseId}
        instructor={instructor}
        setInstructor={setInstructor}
        selectedInstructorId={selectedInstructorId}
        setSelectedInstructorId={setSelectedInstructorId}
        liveInstructors={liveInstructors}
        startDate={startDate}
        setStartDate={setStartDate}
        offeringBranch={offeringBranch}
        setOfferingBranch={setOfferingBranch}
        offeringBranchId={offeringBranchId}
        setOfferingBranchId={setOfferingBranchId}
        liveClassrooms={liveClassrooms}
        classroom={classroom}
        setClassroom={setClassroom}
        selectedClassroomId={selectedClassroomId}
        setSelectedClassroomId={setSelectedClassroomId}
        branches={branches}
        scheduleDays={scheduleDays}
        toggleDay={toggleDay}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        maxStudents={maxStudents}
        setMaxStudents={setMaxStudents}
        liveStudents={liveStudents}
        selectedStudentIds={selectedStudentIds}
        setSelectedStudentIds={setSelectedStudentIds}
      />

      <ClassesDetailDialogs
        selectedCourse={selectedCourse}
        selectedOffering={selectedOffering}
        trackLabels={trackLabels}
        trackIcons={trackIcons}
        levelLabels={levelLabels}
        courseStatusLabels={courseStatusLabels}
        offeringStatusLabels={offeringStatusLabels}
        onCloseCourse={() => setSelectedCourse(null)}
        onCloseOffering={() => setSelectedOffering(null)}
        onCreateOfferingFromCourse={courseId => {
          setOfferingCourseId(courseId);
          setSelectedCourse(null);
          setOfferingModalOpen(true);
        }}
      />
    </div>
  );
}

export default ClassesPage;
