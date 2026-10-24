import type { CourseTemplateRecord, GroupRecord } from "@/lib/apiClient";

export type Track =
  | "robotics"
  | "coding"
  | "circuits"
  | "ai"
  | "soft_skills"
  | "game_dev";

export type CourseStatus = "active" | "on_hold" | "draft" | "archived";
export type OfferingStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

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

export type TabKey = "courses" | "groups" | "waitlist";

export const trackLabels: Record<Track, string> = {
  robotics: "روبوتكس",
  coding: "برمجة",
  circuits: "دوائر إلكترونية",
  ai: "ذكاء اصطناعي",
  soft_skills: "مهارات شخصية",
  game_dev: "تطوير ألعاب",
};

export const levelLabels = {
  beginner: "تمهيدي",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export const courseStatusLabels: Record<CourseStatus, string> = {
  active: "نشط",
  on_hold: "موقوف مؤقتًا",
  draft: "مسودة",
  archived: "مؤرشف",
};

export const offeringStatusLabels: Record<OfferingStatus, string> = {
  upcoming: "قادم",
  ongoing: "جارية",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export const branches = ["كل الفروع", "مدينة نصر", "المعادي", "الشيخ زايد"];

export const seedCourses: Course[] = [
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

export const seedOfferings: Offering[] = [
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

export const trackIcons: Record<Track, string> = {
  robotics: "robotics",
  coding: "coding",
  circuits: "circuits",
  ai: "ai",
  soft_skills: "soft",
  game_dev: "games",
};

export const formatArabicTime = (value: string): string => {
  const [hoursRaw, minutesRaw] = value.split(":").map(Number);
  const hour = hoursRaw % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(minutesRaw).padStart(2, "0")} ${hoursRaw >= 12 ? "م" : "ص"}`;
};

export const apiWeekdays = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export const normalizeTrack = (value: string): Track =>
  Object.keys(trackLabels).includes(value) ? (value as Track) : "robotics";

export const courseFromApi = (course: CourseTemplateRecord): Course => ({
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

export const offeringFromApi = (group: GroupRecord): Offering => {
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
