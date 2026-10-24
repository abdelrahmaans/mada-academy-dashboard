import type { SessionRecord } from "@/lib/apiClient";

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

export type SessionTemplate = Omit<Session, "date" | "status"> & {
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

export type ScheduleDay = {
  name: string;
  date: Date;
  iso: string;
  index: number;
};

export type ScheduleFilterTab = { key: "all" | SessionStatus; label: string };

export function sessionFromApi(record: SessionRecord): Session {
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

export const DAY_NAMES = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

export const BRANCHES = ["مدينة نصر", "المعادي", "الشيخ زايد"];

export const INSTRUCTORS = [
  "مريم حسن",
  "عمر سامح",
  "سارة خالد",
  "يوسف عماد",
  "هبة محمود",
  "كريم عادل",
];

export const ROOMS = ["معمل 1", "معمل 2", "معمل الروبوتات", "قاعة الإبداع"];

export const BASE_DATE = new Date(2026, 8, 26, 12, 0, 0);
export const FIRST_HOUR = 9;
export const LAST_HOUR = 18;
export const HOUR_HEIGHT = 72;

export const TEMPLATES: SessionTemplate[] = [
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

export const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "قادمة",
  ongoing: "جارية الآن",
  completed: "مكتملة",
  pending_approval: "تحتاج مراجعة",
  cancelled: "ملغاة",
  rescheduled: "أعيدت جدولتها",
};

export const TYPE_LABELS: Record<SessionType, string> = {
  regular: "حصة منتظمة",
  competition_training: "تدريب مسابقة",
  competition_day: "يوم مسابقة",
};

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", options).format(date);
}

export function minutesFromTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeLabel(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "م" : "ص";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function seededSessions(): Session[] {
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
