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
import { apiClient, type SchedulingClassroom } from "@/lib/apiClient";
import { toast } from "sonner";

type Track =
  | "robotics"
  | "coding"
  | "circuits"
  | "ai"
  | "soft_skills"
  | "game_dev";
type CourseStatus = "active" | "on_hold" | "draft" | "archived";
type OfferingStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
type Course = {
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
type Offering = {
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
  const [courses, setCourses] = useState(seedCourses);
  const [offerings, setOfferings] = useState(seedOfferings);
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
  const [offeringBranch, setOfferingBranch] = useState("مدينة نصر");
  const [classroom, setClassroom] = useState("معمل 1");
  const [startDate, setStartDate] = useState("");
  const [maxStudents, setMaxStudents] = useState("12");
  const [scheduleDays, setScheduleDays] = useState<string[]>([
    "السبت",
    "الثلاثاء",
  ]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [liveClassrooms, setLiveClassrooms] = useState<SchedulingClassroom[]>([]);
  const [liveRoomsReady, setLiveRoomsReady] = useState(false);
  useEffect(() => {
    apiClient.schedulingClassrooms().then(response => { setLiveClassrooms(response.items); setLiveRoomsReady(true); }).catch(() => setLiveRoomsReady(false));
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
    setInstructor("");
    setOfferingBranch("مدينة نصر");
    setClassroom("معمل 1");
    setStartDate("");
    setMaxStudents("12");
    setScheduleDays(["السبت", "الثلاثاء"]);
    setStartTime("10:00");
    setEndTime("11:30");
  };

  const addCourse = (event: FormEvent<HTMLFormElement>) => {
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

  const addOffering = (event: FormEvent<HTMLFormElement>) => {
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
    const duplicateRoomSlot = offerings.find(item => item.branch === offeringBranch && item.classroom === classroom.trim() && item.days.some(day => scheduleDays.includes(day)) && startTime < item.endTime && endTime > item.startTime);
    if (duplicateRoomSlot) {
      toast.error("تعارض حجز القاعة", { description: `القاعة محجوزة بالفعل مع «${duplicateRoomSlot.courseName}» في يوم مشترك. غيّر القاعة أو الوقت.` });
      return;
    }
    const course =
      courses.find(item => item.id === offeringCourseId) ?? courses[0];
    const newOffering: Offering = {
      id: `GRP-${String(43 + offerings.length - seedOfferings.length).padStart(3, "0")}`,
      courseId: course.id,
      courseName: course.name,
      track: course.track,
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
            onClick={() => toast("تسجيل الخروج التجريبي")}
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
                  {branches.map(branch => (
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
              <span className="course-stat-label">طلاب في مجموعات العينة</span>
              <div>
                <strong>{String(enrolledTotal).padStart(2, "0")}</strong>
                <span>طالب</span>
              </div>
              <small className="course-neutral">مجموع بيانات تجريبية</small>
            </article>
            <article className="course-stat">
              <span className="course-stat-icon icon-amber">
                <Sparkles size={18} />
              </span>
              <span className="course-stat-label">أماكن متاحة في العينة</span>
              <div>
                <strong>{String(availableSeats).padStart(2, "0")}</strong>
                <span>مقعد</span>
              </div>
              <small>
                <ArrowUpLeft size={13} /> سعة المجموعات النشطة والقادمة
              </small>
            </article>
          </section>

          <section className="panel classes-panel">
            <div className="classes-panel-title">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-teal">
                  {tab === "courses" ? (
                    <BookOpen size={18} />
                  ) : (
                    <CalendarDays size={18} />
                  )}
                </span>
                <div>
                  <h2>المحتوى الأكاديمي</h2>
                  <p>القوالب التعليمية منفصلة عن مجموعات التشغيل والجداول</p>
                </div>
              </div>
              <button
                className="students-more"
                aria-label="المزيد"
                onClick={() => toast("المزيد من خيارات إدارة المحتوى قريبًا")}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="classes-toolbar-top">
              <div
                className="classes-tabs"
                role="tablist"
                aria-label="نوع المحتوى"
              >
                <button
                  role="tab"
                  aria-selected={tab === "courses"}
                  className={
                    tab === "courses" ? "classes-tab active" : "classes-tab"
                  }
                  onClick={() => setTab("courses")}
                >
                  <BookOpen size={15} />
                  الكورسات<span>{courses.length}</span>
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "groups"}
                  className={
                    tab === "groups" ? "classes-tab active" : "classes-tab"
                  }
                  onClick={() => setTab("groups")}
                >
                  <CalendarDays size={15} />
                  المجموعات والحصص<span>{offerings.length}</span>
                </button>
              </div>
              <div className="classes-filters">
                <label className="track-filter">
                  <Sparkles size={14} />
                  <select
                    aria-label="تصفية حسب المسار"
                    value={trackFilter}
                    onChange={event =>
                      setTrackFilter(event.target.value as Track | "all")
                    }
                  >
                    <option value="all">كل المسارات</option>
                    {trackOptions.map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </label>
                {tab === "groups" && (
                  <label className="track-filter">
                    <MapPin size={14} />
                    <select
                      aria-label="تصفية حسب الفرع"
                      value={branchFilter}
                      onChange={event => setBranchFilter(event.target.value)}
                    >
                      {branches.map(branch => (
                        <option key={branch}>{branch}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} />
                  </label>
                )}
                <label className="track-filter status-filter">
                  <Filter size={14} />
                  <select
                    aria-label="تصفية حسب الحالة"
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value)}
                  >
                    <option value="all">كل الحالات</option>
                    {(tab === "courses"
                      ? Object.entries(courseStatusLabels)
                      : Object.entries(offeringStatusLabels)
                    ).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </label>
              </div>
            </div>

            {tab === "courses" ? (
              <>
                <div className="course-list-heading">
                  <span>{filteredCourses.length} كورس في النتائج</span>
                  <span>
                    اختار كورس عشان تشوف التفاصيل أو جهّز مجموعة جديدة
                  </span>
                </div>
                {filteredCourses.length ? (
                  <div className="course-cards-grid">
                    {filteredCourses.map(course => (
                      <article className="course-card" key={course.id}>
                        <div className="course-card-top">
                          <span
                            className={`track-mark track-${trackIcons[course.track]}`}
                          >
                            <BookOpen size={19} />
                          </span>
                          <div className="course-card-actions">
                            <span
                              className={`template-status template-${course.status}`}
                            >
                              <i />
                              {courseStatusLabels[course.status]}
                            </span>
                            <button
                              aria-label={`خيارات ${course.name}`}
                              onClick={() =>
                                toast("إجراءات الكورس قيد التجهيز")
                              }
                            >
                              <MoreHorizontal size={19} />
                            </button>
                          </div>
                        </div>
                        <div className="course-card-title-row">
                          <span className="course-track-name">
                            {trackLabels[course.track]} <i />{" "}
                            {course.type === "hard"
                              ? "مسار تقني"
                              : "مهارات شخصية"}
                          </span>
                          <span className="course-template-id">
                            {course.id}
                          </span>
                        </div>
                        <button
                          className="course-card-title"
                          onClick={() => setSelectedCourse(course)}
                        >
                          {course.name}
                          <ChevronLeft size={16} />
                        </button>
                        <p className="course-description">
                          {course.description}
                        </p>
                        <div className="course-tags">
                          <span>{course.ageGroup} سنة</span>
                          <span>{levelLabels[course.level]}</span>
                          <span>{course.totalSessions} حصة</span>
                        </div>
                        <div className="course-card-bottom">
                          <div>
                            <small>السعر الأساسي</small>
                            <strong>
                              <bdi dir="ltr">
                                {new Intl.NumberFormat("en-US").format(
                                  course.basePricePiasters / 100
                                )}
                              </bdi>{" "}
                              <span>ج.م</span>
                            </strong>
                          </div>
                          <span className="course-duration">
                            <Clock3 size={13} /> {course.durationHours} س / حصة
                          </span>
                          <button
                            className="course-card-open"
                            aria-label={`تفاصيل ${course.name}`}
                            onClick={() => setSelectedCourse(course)}
                          >
                            <ChevronLeft size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="classes-empty">
                    <span>
                      <Search size={19} />
                    </span>
                    <strong>مفيش كورسات مطابقة</strong>
                    <small>جرّب تغير البحث أو اختيارات الفلترة.</small>
                    <button className="text-link" onClick={clearFilters}>
                      مسح الفلاتر
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="groups-table-wrap">
                  <table className="groups-table">
                    <thead>
                      <tr>
                        <th>المجموعة / الكورس</th>
                        <th>المدرب</th>
                        <th>الفرع والمعمل</th>
                        <th>الجدول الأسبوعي</th>
                        <th>المقاعد</th>
                        <th>الحالة</th>
                        <th aria-label="تفاصيل" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOfferings.map(offering => (
                        <tr
                          key={offering.id}
                          onClick={() => setSelectedOffering(offering)}
                        >
                          <td data-label="المجموعة / الكورس">
                            <span
                              className={`group-track track-${trackIcons[offering.track]}`}
                            >
                              <BookOpen size={16} />
                            </span>
                            <span className="group-course-copy">
                              <strong>{offering.courseName}</strong>
                              <small>
                                {offering.id} · {trackLabels[offering.track]}
                              </small>
                            </span>
                          </td>
                          <td data-label="المدرب">
                            <span className="instructor-cell">
                              <i>{offering.instructor[0]}</i>
                              <span>
                                {offering.instructor}
                                {offering.substitute && (
                                  <small>بديل: {offering.substitute}</small>
                                )}
                              </span>
                            </span>
                          </td>
                          <td data-label="الفرع والمعمل">
                            <span className="classroom-cell">
                              <strong>{offering.branch}</strong>
                              <small>
                                <MapPin size={12} /> {offering.classroom}
                              </small>
                            </span>
                          </td>
                          <td data-label="الجدول الأسبوعي">
                            <span className="schedule-cell">
                              <CalendarDays size={14} />
                              {offering.schedule}
                            </span>
                          </td>
                          <td data-label="المقاعد">
                            <span className="capacity-cell">
                              <strong>
                                {offering.enrolledStudents} /{" "}
                                {offering.maxStudents}
                              </strong>
                              <i>
                                <b
                                  style={{
                                    width: `${Math.min(100, (offering.enrolledStudents / offering.maxStudents) * 100)}%`,
                                  }}
                                />
                              </i>
                            </span>
                          </td>
                          <td data-label="الحالة">
                            <span
                              className={`offering-status offering-${offering.status}`}
                            >
                              <i />
                              {offeringStatusLabels[offering.status]}
                            </span>
                          </td>
                          <td data-label="تفاصيل">
                            <button
                              className="student-row-more"
                              aria-label={`تفاصيل ${offering.id}`}
                              onClick={event => {
                                event.stopPropagation();
                                setSelectedOffering(offering);
                              }}
                            >
                              <ChevronLeft size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredOfferings.length && (
                        <tr>
                          <td colSpan={7}>
                            <div className="classes-empty">
                              <span>
                                <Search size={19} />
                              </span>
                              <strong>مفيش مجموعات مطابقة</strong>
                              <small>
                                غيّر الفلترة أو ابحث باسم المدرب أو الكورس.
                              </small>
                              <button
                                className="text-link"
                                onClick={clearFilters}
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
                <div className="groups-footer">
                  <span>
                    عرض <b>{filteredOfferings.length}</b> مجموعات · السعة
                    والإشغال من بيانات العينة
                  </span>
                  <button
                    className="text-link"
                    onClick={() =>
                      toast("تقويم الحصص الأسبوعي سيتاح في المرحلة التالية")
                    }
                  >
                    فتح الجدول الأسبوعي <ChevronLeft size={14} />
                  </button>
                </div>
              </>
            )}
          </section>
          <div className="students-demo-note">
            <Activity size={14} />
            <span>
              المحتوى والجداول والأسعار المعروضة تجريبية. الإضافة والتعديل
              مؤقتان داخل الواجهة ولا تُحفظ في قاعدة بيانات.
            </span>
          </div>
          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>واجهة تجريبية — إصدار 0.1</span>
          </footer>
        </div>
      </main>

      {courseModalOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setCourseModalOpen(false);
              resetCourseForm();
            }
          }}
        >
          <section
            className="student-dialog academic-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-course-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <BookOpen size={21} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => {
                  setCourseModalOpen(false);
                  resetCourseForm();
                }}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="add-course-title">إنشاء قالب كورس</h2>
            <p>عرّف محتوى المسار التعليمي قبل فتح مجموعات للتسجيل.</p>
            <form onSubmit={addCourse}>
              <label className="form-field">
                <span>
                  اسم الكورس <b>*</b>
                </span>
                <input
                  autoFocus
                  value={courseName}
                  onChange={event => setCourseName(event.target.value)}
                  placeholder="مثال: الروبوتات والأنظمة الذكية"
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    المسار <b>*</b>
                  </span>
                  <select
                    value={newTrack}
                    onChange={event => setNewTrack(event.target.value as Track)}
                  >
                    {trackOptions.map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>نوع المسار</span>
                  <select
                    value={newCourseType}
                    onChange={event =>
                      setNewCourseType(event.target.value as "hard" | "soft")
                    }
                  >
                    <option value="hard">تقني (Hard Skills)</option>
                    <option value="soft">مهارات شخصية (Soft Skills)</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>الفئة العمرية</span>
                  <select
                    value={ageGroup}
                    onChange={event => setAgeGroup(event.target.value)}
                  >
                    {["4-6", "7-9", "10-12", "13-15", "16-18"].map(age => (
                      <option key={age} value={age}>
                        {age} سنة
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>المستوى</span>
                  <select
                    value={level}
                    onChange={event =>
                      setLevel(event.target.value as Course["level"])
                    }
                  >
                    {Object.entries(levelLabels).map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    عدد الحصص <b>*</b>
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={totalSessions}
                    onChange={event => setTotalSessions(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>
                    مدة الحصة بالساعات <b>*</b>
                  </span>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={durationHours}
                    onChange={event => setDurationHours(event.target.value)}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>
                  السعر الأساسي بالجنيه <b>*</b>
                </span>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                  placeholder="مثال: 3500"
                  inputMode="decimal"
                />
              </label>
              <div className="dialog-info">
                <Activity size={15} />
                <span>
                  المسودة محلية للعرض فقط؛ سيُضاف ربط الأدوات المطلوبة والمحتوى
                  لاحقًا.
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setCourseModalOpen(false);
                    resetCourseForm();
                  }}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Plus size={16} /> حفظ كمسودة
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {offeringModalOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setOfferingModalOpen(false);
              resetOfferingForm();
            }
          }}
        >
          <section
            className="student-dialog academic-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-offering-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <CalendarDays size={21} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => {
                  setOfferingModalOpen(false);
                  resetOfferingForm();
                }}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="add-offering-title">إضافة مجموعة جديدة</h2>
            <p>اربط قالب الكورس بفرع ومدرب ومعمل ومواعيد أسبوعية.</p>
            <form onSubmit={addOffering}>
              <label className="form-field">
                <span>
                  قالب الكورس <b>*</b>
                </span>
                <select
                  value={offeringCourseId}
                  onChange={event => setOfferingCourseId(event.target.value)}
                >
                  {courses
                    .filter(course => course.status === "active")
                    .map(course => (
                      <option value={course.id} key={course.id}>
                        {course.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    المدرب <b>*</b>
                  </span>
                  <input
                    value={instructor}
                    onChange={event => setInstructor(event.target.value)}
                    placeholder="اسم المدرب"
                  />
                </label>
                <label className="form-field">
                  <span>
                    تاريخ البداية <b>*</b>
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={event => setStartDate(event.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>الفرع</span>
                  <select
                    value={offeringBranch}
                    onChange={event => setOfferingBranch(event.target.value)}
                  >
                    {branches.slice(1).map(branch => (
                      <option key={branch}>{branch}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>
                    المعمل / القاعة <b>*</b>
                  </span>
                  {liveRoomsReady ? <select value={classroom} onChange={event => setClassroom(event.target.value)}>{liveClassrooms.filter(room => room.branchName === offeringBranch).map(room => <option key={room.id}>{room.name}</option>)}</select> : <input value={classroom} onChange={event => setClassroom(event.target.value)} placeholder="معمل 1" />}
                </label>
              </div>
              <fieldset className="weekday-field">
                <legend>
                  أيام المجموعة <b>*</b>
                </legend>
                <div>
                  {[
                    "السبت",
                    "الأحد",
                    "الإثنين",
                    "الثلاثاء",
                    "الأربعاء",
                    "الخميس",
                    "الجمعة",
                  ].map(day => (
                    <button
                      type="button"
                      key={day}
                      className={
                        scheduleDays.includes(day)
                          ? "weekday-chip selected"
                          : "weekday-chip"
                      }
                      aria-pressed={scheduleDays.includes(day)}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="form-row">
                <label className="form-field">
                  <span>من الساعة</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={event => setStartTime(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>إلى الساعة</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={event => setEndTime(event.target.value)}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>الحد الأقصى للطلاب</span>
                <input
                  type="number"
                  min="1"
                  value={maxStudents}
                  onChange={event => setMaxStudents(event.target.value)}
                />
              </label>
              <div className="dialog-info">
                <Activity size={15} />
                <span>المجموعة القادمة ستظهر كعرض تجريبي غير محفوظ.</span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setOfferingModalOpen(false);
                    resetOfferingForm();
                  }}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Plus size={16} /> إضافة المجموعة
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedCourse && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedCourse(null);
          }}
        >
          <section
            className="student-dialog academic-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-detail-title"
          >
            <div className="dialog-top">
              <span
                className={`track-mark track-${trackIcons[selectedCourse.track]}`}
              >
                <BookOpen size={19} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => setSelectedCourse(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="academic-detail-title">
              <div>
                <small>
                  {trackLabels[selectedCourse.track]} · {selectedCourse.id}
                </small>
                <h2 id="course-detail-title">{selectedCourse.name}</h2>
              </div>
              <span
                className={`template-status template-${selectedCourse.status}`}
              >
                <i />
                {courseStatusLabels[selectedCourse.status]}
              </span>
            </div>
            <p className="academic-detail-description">
              {selectedCourse.description}
            </p>
            <div className="detail-grid">
              <div>
                <small>الفئة العمرية</small>
                <strong>{selectedCourse.ageGroup} سنة</strong>
              </div>
              <div>
                <small>المستوى</small>
                <strong>{levelLabels[selectedCourse.level]}</strong>
              </div>
              <div>
                <small>عدد الحصص</small>
                <strong>{selectedCourse.totalSessions} حصة</strong>
              </div>
              <div>
                <small>مدة الحصة</small>
                <strong>{selectedCourse.durationHours} ساعة</strong>
              </div>
              <div>
                <small>السعر الأساسي</small>
                <strong>
                  {new Intl.NumberFormat("ar-EG").format(
                    selectedCourse.basePricePiasters / 100
                  )}{" "}
                  ج.م
                </strong>
              </div>
              <div>
                <small>نوع المسار</small>
                <strong>
                  {selectedCourse.type === "hard"
                    ? "مهارات تقنية"
                    : "مهارات شخصية"}
                </strong>
              </div>
            </div>
            <div className="dialog-info">
              <BookOpen size={15} />
              <span>
                قالب الكورس يحدد المنهج؛ المجموعات تحدد الفرع والمدرب والمواعيد.
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={() => setSelectedCourse(null)}
              >
                إغلاق
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  setOfferingCourseId(selectedCourse.id);
                  setSelectedCourse(null);
                  setOfferingModalOpen(true);
                }}
              >
                <Plus size={15} /> إنشاء مجموعة
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedOffering && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedOffering(null);
          }}
        >
          <section
            className="student-dialog academic-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offering-detail-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <CalendarDays size={20} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => setSelectedOffering(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="academic-detail-title">
              <div>
                <small>
                  {selectedOffering.id} · {trackLabels[selectedOffering.track]}
                </small>
                <h2 id="offering-detail-title">
                  {selectedOffering.courseName}
                </h2>
              </div>
              <span
                className={`offering-status offering-${selectedOffering.status}`}
              >
                <i />
                {offeringStatusLabels[selectedOffering.status]}
              </span>
            </div>
            <div className="detail-grid">
              <div>
                <small>المدرب</small>
                <strong>{selectedOffering.instructor}</strong>
              </div>
              {selectedOffering.substitute && (
                <div>
                  <small>المدرب البديل</small>
                  <strong>{selectedOffering.substitute}</strong>
                </div>
              )}
              <div>
                <small>الفرع</small>
                <strong>{selectedOffering.branch}</strong>
              </div>
              <div>
                <small>المعمل / القاعة</small>
                <strong>{selectedOffering.classroom}</strong>
              </div>
              <div>
                <small>الأيام والوقت</small>
                <strong>{selectedOffering.schedule}</strong>
              </div>
              <div>
                <small>تاريخ البداية</small>
                <strong dir="ltr">{selectedOffering.startDate}</strong>
              </div>
              <div>
                <small>المقاعد المسجلة</small>
                <strong>
                  {selectedOffering.enrolledStudents} من{" "}
                  {selectedOffering.maxStudents}
                </strong>
              </div>
              <div>
                <small>نوع الحصة</small>
                <strong>حصة منتظمة</strong>
              </div>
            </div>
            <div className="dialog-info">
              <CalendarCheck size={15} />
              <span>
                مواعيد الجلسات المنفصلة تُدار من الجدول الأسبوعي، وهذه بيانات
                المجموعة التوضيحية.
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={() => setSelectedOffering(null)}
              >
                إغلاق
              </button>
              <button
                className="button button-primary"
                onClick={() =>
                  toast("تحرير جدول المجموعة سيتاح في المرحلة التالية")
                }
              >
                تعديل الجدول
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ClassesPage;
