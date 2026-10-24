import type { StudentRecord } from "@/lib/apiClient";

export type StudentStatus = "active" | "on_hold" | "inactive" | "graduated";
export type StudentSource =
  | "walk_in"
  | "landing_page"
  | "referral"
  | "social_media"
  | "event";

export type Student = {
  id: string;
  name: string;
  birthDate: string;
  gender: "male" | "female";
  parentName: string;
  parentPhone: string;
  relation: "الأب" | "الأم" | "ولي أمر";
  branch: string;
  course: string;
  source: StudentSource;
  status: StudentStatus;
  joined: string;
  initials: string;
  color: string;
};

export type StudentJourneySummary = {
  attendance: string;
  attendanceNote: string;
  nextSession: string;
  nextSessionNote: string;
  payment: string;
  paymentNote: string;
  progress: number;
};

export const statusLabels: Record<StudentStatus, string> = {
  active: "نشط",
  on_hold: "موقوف مؤقتًا",
  inactive: "غير نشط",
  graduated: "متخرج",
};

export const sourceLabels: Record<StudentSource, string> = {
  walk_in: "زيارة مباشرة",
  landing_page: "صفحة الأكاديمية",
  referral: "ترشيح",
  social_media: "سوشيال ميديا",
  event: "فعالية",
};

export const branches = ["كل الفروع", "مدينة نصر", "المعادي", "الشيخ زايد"];
export const PAGE_SIZE = 6;

export const LIVE_BRANCH_LABELS: Record<string, string> = {
  "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": "مدينة نصر",
  "cccccccc-cccc-cccc-cccc-cccccccccccc": "مصر الجديدة",
};

export function mapLiveStudent(record: StudentRecord): Student {
  const status: StudentStatus =
    record.status === "ACTIVE"
      ? "active"
      : record.status === "SUSPENDED"
      ? "on_hold"
      : record.status === "GRADUATED"
      ? "graduated"
      : "inactive";
  const initials = record.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return {
    id: record.id,
    name: record.fullName,
    birthDate: record.dateOfBirth ?? "—",
    gender: "male",
    parentName: "غير متاح من عقد الطلاب الحالي",
    parentPhone: "—",
    relation: "ولي أمر",
    branch:
      LIVE_BRANCH_LABELS[record.branchId] ?? `فرع ${record.branchId.slice(0, 8)}`,
    course:
      record.activeEnrollmentCount > 0
        ? "يوجد تسجيل نشط"
        : "لم يتم التسجيل في كورس",
    source: "walk_in",
    status,
    joined: "من قاعدة البيانات",
    initials,
    color: status === "active" ? "teal" : "amber",
  };
}

export function getStudentJourney(student: Student): StudentJourneySummary {
  if (student.course === "لم يتم التسجيل في كورس") {
    return {
      attendance: "—",
      attendanceNote: "لا توجد جلسات مسجلة",
      nextSession: "غير محددة",
      nextSessionNote: "يحتاج تسجيل في مجموعة",
      payment: "لا توجد فاتورة",
      paymentNote: "سيظهر بعد التسجيل",
      progress: 0,
    };
  }

  if (student.status === "graduated") {
    return {
      attendance: "94%",
      attendanceNote: "انتظام ممتاز",
      nextSession: "اكتمل المسار",
      nextSessionNote: "جاهز للشهادة",
      payment: "مدفوع بالكامل",
      paymentNote: "لا توجد مستحقات",
      progress: 100,
    };
  }

  if (student.status === "on_hold") {
    return {
      attendance: "71%",
      attendanceNote: "يحتاج متابعة",
      nextSession: "موقوف مؤقتًا",
      nextSessionNote: "راجع حالة التسجيل",
      payment: "قسط مستحق",
      paymentNote: "يحتاج تواصل مع الأسرة",
      progress: 46,
    };
  }

  return {
    attendance: student.id.endsWith("248") ? "88%" : "86%",
    attendanceNote: "من آخر ٨ جلسات",
    nextSession: "الأحد · ١٢:٠٠ م",
    nextSessionNote: "معمل ١ · الجلسة ٩",
    payment: student.id.endsWith("247") ? "قسطان متبقيان" : "مدفوع حتى أكتوبر",
    paymentNote: student.id.endsWith("247")
      ? "أقرب استحقاق ١ أكتوبر"
      : "آخر تحصيل ١ سبتمبر",
    progress: student.id.endsWith("248") ? 72 : 64,
  };
}

export const initialStudents: Student[] = [
  {
    id: "MAD-0248",
    name: "ياسين محمد علي",
    birthDate: "2015-05-12",
    gender: "male",
    parentName: "محمد علي",
    parentPhone: "01012345678",
    relation: "الأب",
    branch: "مدينة نصر",
    course: "روبوتكس مستوى 2",
    source: "landing_page",
    status: "active",
    joined: "12 سبتمبر 2026",
    initials: "يع",
    color: "teal",
  },
  {
    id: "MAD-0247",
    name: "ليلى أحمد محمود",
    birthDate: "2014-11-03",
    gender: "female",
    parentName: "أحمد محمود",
    parentPhone: "01123456789",
    relation: "الأب",
    branch: "المعادي",
    course: "برمجة للمبتدئين",
    source: "referral",
    status: "active",
    joined: "10 سبتمبر 2026",
    initials: "لم",
    color: "blue",
  },
  {
    id: "MAD-0246",
    name: "عمر خالد حسن",
    birthDate: "2016-02-18",
    gender: "male",
    parentName: "خالد حسن",
    parentPhone: "01234567890",
    relation: "الأب",
    branch: "الشيخ زايد",
    course: "الذكاء الاصطناعي للناشئين",
    source: "social_media",
    status: "on_hold",
    joined: "5 سبتمبر 2026",
    initials: "عخ",
    color: "amber",
  },
  {
    id: "MAD-0245",
    name: "مريم إبراهيم السيد",
    birthDate: "2013-08-24",
    gender: "female",
    parentName: "إبراهيم السيد",
    parentPhone: "01098765432",
    relation: "الأب",
    branch: "مدينة نصر",
    course: "روبوتكس مستوى 1",
    source: "event",
    status: "active",
    joined: "2 سبتمبر 2026",
    initials: "ما",
    color: "teal",
  },
  {
    id: "MAD-0244",
    name: "حمزة طارق عثمان",
    birthDate: "2015-09-30",
    gender: "male",
    parentName: "طارق عثمان",
    parentPhone: "01187654321",
    relation: "الأب",
    branch: "مدينة نصر",
    course: "برمجة الألعاب",
    source: "walk_in",
    status: "active",
    joined: "1 سبتمبر 2026",
    initials: "حط",
    color: "teal",
  },
  {
    id: "MAD-0243",
    name: "نور فادي كمال",
    birthDate: "2012-07-15",
    gender: "female",
    parentName: "فادي كمال",
    parentPhone: "01298765432",
    relation: "الأب",
    branch: "المعادي",
    course: "برمجة الألعاب",
    source: "landing_page",
    status: "inactive",
    joined: "28 أغسطس 2026",
    initials: "نف",
    color: "rose",
  },
  {
    id: "MAD-0242",
    name: "سيف مصطفى عادل",
    birthDate: "2011-10-06",
    gender: "male",
    parentName: "مصطفى عادل",
    parentPhone: "01087654321",
    relation: "الأب",
    branch: "الشيخ زايد",
    course: "الدوائر والروبوتات",
    source: "referral",
    status: "active",
    joined: "25 أغسطس 2026",
    initials: "سع",
    color: "teal",
  },
  {
    id: "MAD-0241",
    name: "جنى طارق سعيد",
    birthDate: "2014-04-09",
    gender: "female",
    parentName: "طارق سعيد",
    parentPhone: "01187654320",
    relation: "الأب",
    branch: "مدينة نصر",
    course: "مهارات التفكير الإبداعي",
    source: "walk_in",
    status: "graduated",
    joined: "20 أغسطس 2026",
    initials: "جس",
    color: "violet",
  },
];
