import {
  Activity,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export type RoleCode = "R02" | "R03" | "R04" | "R05" | "R06" | "R07";
export type StaffStatus = "active" | "on_leave" | "terminated";
export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: Exclude<RoleCode, "R02">;
  branch: string;
  status: StaffStatus;
  joined: string;
  headOfInstructorsId?: string;
};
export type RoleInfo = {
  code: RoleCode;
  name: string;
  english: string;
  description: string;
  icon: typeof ShieldCheck;
  tone: "teal" | "blue" | "amber" | "violet" | "navy";
  scope: string[];
  assignable: boolean;
};

export const ROLES: RoleInfo[] = [
  {
    code: "R02",
    name: "مدير الفرع",
    english: "Branch Admin",
    description: "إدارة تشغيل الفرع والفريق",
    icon: ShieldCheck,
    tone: "navy",
    scope: ["لوحة الفرع", "الفريق", "الموافقات", "التقارير"],
    assignable: false,
  },
  {
    code: "R03",
    name: "رئيس المدربين",
    english: "Head of Instructors",
    description: "إشراف أكاديمي على المدربين",
    icon: GraduationCap,
    tone: "violet",
    scope: ["الجدول والحصص", "متابعة المدربين", "تقييمات الطلاب"],
    assignable: true,
  },
  {
    code: "R04",
    name: "مدرب",
    english: "Instructor",
    description: "تنفيذ الحصص ومتابعة الطلاب",
    icon: BookOpen,
    tone: "teal",
    scope: ["جدولي", "قوائم طلاب مجموعاتي", "الحضور والتقييم"],
    assignable: true,
  },
  {
    code: "R05",
    name: "سكرتارية",
    english: "Secretary",
    description: "التسجيل والتواصل التشغيلي",
    icon: Users,
    tone: "blue",
    scope: ["ملفات الطلاب", "طلبات التسجيل", "متابعة أولياء الأمور"],
    assignable: true,
  },
  {
    code: "R06",
    name: "محاسب",
    english: "Accountant",
    description: "التحصيل والمصروفات والمرتبات",
    icon: Wallet,
    tone: "amber",
    scope: ["الفواتير والتحصيل", "المصروفات", "مسيرات الرواتب"],
    assignable: true,
  },
  {
    code: "R07",
    name: "مسؤول التسويق",
    english: "Media Manager",
    description: "صفحة الأكاديمية والمهتمون",
    icon: Activity,
    tone: "blue",
    scope: ["صفحة الأكاديمية", "طلبات الاهتمام", "المحتوى التسويقي"],
    assignable: true,
  },
];
export const ROLE_BY_CODE = Object.fromEntries(
  ROLES.map(role => [role.code, role])
) as Record<RoleCode, RoleInfo>;
export const STATUS_LABELS: Record<StaffStatus, string> = {
  active: "نشط",
  on_leave: "إجازة",
  terminated: "موقوف",
};
