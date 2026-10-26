/**
 * PlatformConsoleTypes.ts
 * Shared types, constants, and utilities for the R00 Platform Console.
 * Extracted from PlatformConsoleLive.tsx to reduce file size and improve maintainability.
 */

import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  PlatformAcademy,
  PlatformOverview,
} from "@/lib/apiClient";

// ─── View types ────────────────────────────────────────────────────────────────

/** The 6 consolidated high-impact views for R00 (Super Admin) */
export type View =
  | "overview"   // لوحة التحكم والتنبيهات العاجلة
  | "academies"  // سجل الأكاديميات والباقات وإدارة الفروع
  | "leads"      // طلبات المعاينة والعملاء الجدد
  | "billing"    // فواتير الاشتراكات والتحصيل المالي
  | "support"    // مركز التذاكر والاقتراحات
  | "system";    // الخوادم وسجل التدقيق الأمني

export interface NavItem {
  id: View;
  label: string;
  icon: typeof Building2;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "overview",  label: "لوحة التحكم والتنبيهات", icon: LayoutDashboard },
  { id: "academies", label: "سجل الأكاديميات والباقات", icon: Building2 },
  { id: "leads",     label: "طلبات المعاينة (Leads)", icon: Sparkles },
  { id: "billing",   label: "التحصيل والاشتراكات", icon: CreditCard },
  { id: "support",   label: "التذاكر والاقتراحات", icon: LifeBuoy },
  { id: "system",    label: "الخوادم وسجل التدقيق", icon: ShieldCheck },
];

// ─── Support Ticket types ──────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  academyId: string;
  academyName: string;
  requesterName: string;
  requesterRole: string;
  requesterPhone: string;
  subject: string;
  type?: "issue" | "suggestion" | "billing";
  category: "اشتراكات وخطط" | "مشكلة تقنية" | "اقتراح ميزة جديدة" | "تفعيل فروع" | "استفسار تشغيلي";
  priority: "urgent" | "high" | "medium" | "low";
  status: "new" | "inProgress" | "waiting" | "resolved";
  createdAt: string;
  description: string;
  internalNotes?: string;
  meetingUrl?: string;
  meetingScheduledAt?: string;
  resolutionNotes?: string;
}

export interface ReasonModalState {
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: (reason: string) => Promise<void>;
}

// ─── Label maps ────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "نشط",
  TRIAL: "تجريبي",
  SETUP: "إعداد",
  PAUSED: "موقوف",
  OVERDUE: "متأخر",
};

export const TICKET_PRIORITY_LABELS: Record<
  SupportTicket["priority"],
  { label: string; class: string }
> = {
  urgent: { label: "عاجل جدًا", class: "urgent" },
  high:   { label: "أولوية عالية", class: "high" },
  medium: { label: "أولوية متوسطة", class: "medium" },
  low:    { label: "عادي", class: "low" },
};

export const TICKET_STATUS_LABELS: Record<
  SupportTicket["status"],
  { label: string; class: string }
> = {
  new:        { label: "تذكرة جديدة", class: "new" },
  inProgress: { label: "قيد المتابعة", class: "inProgress" },
  waiting:    { label: "بانتظار العميل", class: "waiting" },
  resolved:   { label: "تم الحل", class: "resolved" },
};

// ─── Formatters ────────────────────────────────────────────────────────────────

export const fmtDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export const fmtNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export const reasonValid = (reason: string) => reason.trim().length >= 4;

// ─── Subscription Plans ────────────────────────────────────────────────────────

export const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    code: "starter" as const,
    name: "الباقة الأساسية (Starter)",
    tag: "للأكاديميات والأنشطة الفردية",
    priceMonthly: 1500,
    priceAnnual: 15000,
    branchesLimit: 1,
    features: [
      "فرع واحد مصرح",
      "حتى 100 طالب نشط",
      "2 حساب إداري وإشراف",
      "جداول الحصص وتسجيل الحضور",
      "إصدار الفواتير وسندات القبض",
    ],
    highlight: false,
  },
  {
    id: "growth",
    code: "growth" as const,
    name: "باقة النمو الاحترافية (Growth)",
    tag: "الأكثر طلباً للأكاديميات المتنامية",
    priceMonthly: 3500,
    priceAnnual: 35000,
    branchesLimit: 3,
    features: [
      "حتى 3 فروع مصرحة",
      "حتى 500 طالب نشط",
      "حسابات غير محدودة لكل الفروع",
      "بوابة الأسرة وولي الأمر (R08)",
      "تقارير تنفيذية ومتابعة تحصيل فروع",
      "إشراف أكاديمي واعتماد تقييمات",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    code: "enterprise" as const,
    name: "باقة المؤسسات (Enterprise)",
    tag: "للمجموعات الكبرى وسلاسل الفروع",
    priceMonthly: 7000,
    priceAnnual: 70000,
    branchesLimit: 99,
    features: [
      "فروع غير محدودة",
      "عدد طلاب غير محدود",
      "خوادم مخصصة وعزل بيانات كامل",
      "نطاق ودومين مخصص للأكاديمية",
      "دعم فني وتدريب مباشر على مدار الساعة",
      "تكامل API مخصص مع أجهزة الحضور والأنظمة البنكية",
    ],
    highlight: false,
  },
] as const;

// ─── Fallback / Seed data ──────────────────────────────────────────────────────

export const FALLBACK_OVERVIEW: PlatformOverview = {
  academies: 4,
  activeAcademies: 3,
  trialAcademies: 1,
  attentionAcademies: 0,
  staffAccounts: 48,
  activeSessions: 18,
  auditEvents: 142,
};

export const FALLBACK_ACADEMIES: PlatformAcademy[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "أكاديمية مدى النموذجية",
    slug: "mada-demo-academy",
    status: "ACTIVE",
    plan: "GROWTH",
    branches: 3,
    users: 42,
    owner: "أحمد محمود (المالك)",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "أكاديمية الرواد الدولية",
    slug: "alrowad-academy",
    status: "ACTIVE",
    plan: "ENTERPRISE",
    branches: 4,
    users: 65,
    owner: "مها صالح",
    createdAt: "2026-02-01T12:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "أكاديمية مسار المستقبل",
    slug: "masar-academy",
    status: "TRIAL",
    plan: "STARTER",
    branches: 1,
    users: 12,
    owner: "كريم حسن",
    createdAt: "2026-03-10T14:30:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "نادي الأبطال للسباحة واللياقة",
    slug: "champions-club",
    status: "SETUP",
    plan: "GROWTH",
    branches: 2,
    users: 19,
    owner: "يوسف حسان",
    createdAt: "2026-04-05T09:15:00Z",
  },
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "TCK-801",
    academyId: "demo-academy-01",
    academyName: "أكاديمية مدى النموذجية",
    requesterName: "م. محمد فوزي",
    requesterRole: "مسؤول الأكاديمية · R01",
    requesterPhone: "+201000000002",
    subject: "طلب ترقية باقة الأكاديمية وإضافة فرعين جدد",
    category: "اشتراكات وخطط",
    priority: "high",
    status: "new",
    createdAt: "17 أكتوبر 2026",
    description:
      "نود توسيع نطاق الأكاديمية لفرعي الشيخ زايد والتجمع الخامس وتفعيل صلاحية الفروع المتعددة على اشتراكنا السنوي.",
    internalNotes: "بانتظار تأكيد استلام التحويل البنكي للباقة السنوية.",
  },
  {
    id: "TCK-794",
    academyId: "demo-academy-02",
    academyName: "أكاديمية الفرسان الرياضية",
    requesterName: "كابتن أحمد مجدي",
    requesterRole: "مدير الفرع · R02",
    requesterPhone: "+201011223344",
    subject: "استفسار عن ربط أجهزة البصمة بنظام الحضور الذاتي",
    category: "مشكلة تقنية",
    priority: "medium",
    status: "inProgress",
    createdAt: "16 أكتوبر 2026",
    description:
      "هل تدعم واجهة تسجيل الحضور الربط المباشر مع أجهزة ZKTeco لبصمة حمام السباحة؟",
    internalNotes: "تم توضيح آلية الـ Webhook وAPI الجلسات للمدير التقني لديهم.",
  },
  {
    id: "TCK-789",
    academyId: "demo-academy-03",
    academyName: "مركز مسار لتعليم الروبوتكس",
    requesterName: "أ/ سارة المهدي",
    requesterRole: "مسؤول الحسابات · R06",
    requesterPhone: "+201099887766",
    subject: "طلب تصدير كشوفات الإيرادات الضريبية للربع الثالث",
    category: "استفسار تشغيلي",
    priority: "low",
    status: "resolved",
    createdAt: "14 أكتوبر 2026",
    description:
      "تم استخراج التقارير الربع سنوية وتأكيد مطابقة أرقام الفواتير.",
    internalNotes: "تم حل المشكلة وتوفير كشف الـ CSV المخصص.",
  },
];

export const statusLabel = STATUS_LABEL;
export const ticketPriorityLabels = TICKET_PRIORITY_LABELS;
export const ticketStatusLabels = TICKET_STATUS_LABELS;

export interface RolePolicyGuideItem {
  code: string;
  title: string;
  scope: string;
  allowed: string[];
  forbidden: string[];
}

export const ROLE_POLICIES_GUIDE: RolePolicyGuideItem[] = [
  {
    code: "R00",
    title: "مسؤول المنصة المركزي (Super Admin)",
    scope: "المنصة بالكامل (Multi-Tenant)",
    allowed: [
      "إنشاء الأكاديميات وإيقافها ومتابعة الخطط والاشتراكات",
      "مراقبة صحة الخوادم وقواعد البيانات والبنية التحتية",
      "إدارة جلسات مستخدمي المنصة وسحب الصلاحيات الطارئة",
      "معاينة سجل العمليات والتدقيق (Platform Audit Log)",
    ],
    forbidden: [
      "ممنوع التدخل في العمليات الداخلية للطلاب والدرجات والتقييمات",
      "محجوب عن بيانات الطلاب العائلية والفواتير التفصيلية للعملاء",
    ],
  },
  {
    code: "R01",
    title: "مالك ومسؤول الأكاديمية (Academy Owner)",
    scope: "نطاق الأكاديمية وفروعها بالكامل",
    allowed: [
      "رؤية ومقارنة مؤشرات كل الفروع من لوحة واحدة",
      "تعيين وتفويض مديري الفروع ورؤساء المدربين",
      "إدارة السياسة المالية والتحصيل والمصروفات المعتمدة",
      "تحديد باقات الحصص وتخصيص قاعات الفروع",
    ],
    forbidden: [
      "ممنوع رؤية أو الوصول لبيانات أي أكاديمية أخرى على المنصة",
    ],
  },
  {
    code: "R02",
    title: "مدير الفرع (Branch Manager)",
    scope: "فرع واحد محدد فقط",
    allowed: [
      "تشغيل الفرع اليومي والجداول ومجموعات الطلاب والقاعات",
      "الموافقة على طلبات المدربين البدلاء والإجازات",
      "متابعة تحصيل فواتير الفرع وحضور وغياب الطلاب",
    ],
    forbidden: [
      "ممنوع منعاً باتاً فتح أو رؤية بيانات أي فرع آخر",
      "لا يملك صلاحية تغيير خطة اشتراك الأكاديمية مع المنصة",
    ],
  },
  {
    code: "R03",
    title: "رئيس المدربين (Head Instructor)",
    scope: "البرامج الأكاديمية والمدربين في الفرع",
    allowed: [
      "إشراف فني على المناهج والخطط التدريبية ومستويات الفرق",
      "مراجعة تقييمات الطلاب قبل اعتمادها ونشرها لأولياء الأمور",
      "توزيع الحصص وجدولة المدربين البدلاء",
    ],
    forbidden: [
      "محجوب عن إجمالي ماليات الفرع ورواتب المدربين الآخرين",
    ],
  },
  {
    code: "R04",
    title: "المدرب (Instructor / Coach)",
    scope: "الحصص والمجموعات المكلف بتدريبها فقط",
    allowed: [
      "تسجيل حضور وغياب الطلاب في حصصه المباشرة",
      "إدخال تقييمات الطلاب الفنية ورفع الملاحظات",
      "تقديم طلب اعتذار عن حصة واقتراح مدرب بديل",
    ],
    forbidden: [
      "ممنوع رؤية أي فواتير أو أرقام اشتراكات الطلاب المالية",
    ],
  },
  {
    code: "R05",
    title: "موظف الاستقبال والمبيعات (Front Desk)",
    scope: "استقبال الفرع وتسجيل الطلاب",
    allowed: [
      "تسجيل الطلاب الجدد ومطابقة كشوف الحضور",
      "استلام طلبات تجميد الاشتراكات ورفعها للاعتماد",
      "تسليم عهدة الشفت اليومية نقدًا وإلكترونيًا لمدير الفرع",
    ],
    forbidden: [
      "ممنوع اعتماد درجات أو تقييمات أكاديمية للطلاب",
    ],
  },
  {
    code: "R06",
    title: "المحاسب المالي (Finance Desk)",
    scope: "ماليات الفرع / الأكاديمية المعتمدة",
    allowed: [
      "إصدار الفواتير وسندات القبض ومتابعة التحصيل",
      "صرف رواتب المدربين بناء على عدد الحصص المنجزة فعليًا",
      "تسجيل المصروفات التشغيلية واستلام إغلاق شفتات الخزينة",
    ],
    forbidden: [
      "محجوب عن تعديل الجداول الأكاديمية وتوزيع المدربين",
    ],
  },
  {
    code: "R07",
    title: "مسؤول التسويق (Marketing Desk)",
    scope: "الحملات والعملاء المحتملين (Leads)",
    allowed: [
      "إدارة بيانات الـ Leads ومصادر استقطاب الطلاب",
      "قياس معدلات التحويل من مهتم إلى مسجل",
      "جدولة الحملات الإعلانية ومتابعة فعالية القنوات",
    ],
    forbidden: [
      "محجوب عن السجلات الأكاديمية والدرجات والماليات الداخلية",
    ],
  },
  {
    code: "R08",
    title: "بوابة الأسرة وولي الأمر (Family Portal)",
    scope: "ملفات أبنائه المسجلين فقط",
    allowed: [
      "متابعة سجل حضور وغياب أبنائه وتقارير أدائهم",
      "معرفة مواعيد الحصص القادمة وجدول الفصول",
      "الاطلاع على الفواتير المستحقة وسداد الأقساط أونلاين",
      "تقديم طلبات تجميد الاشتراك إلكترونيًا",
    ],
    forbidden: [
      "محجوب تماماً عن أي طالب أو أسرة أخرى في الأكاديمية",
    ],
  },
  {
    code: "R09",
    title: "بوابة الطالب (Student Portal)",
    scope: "ملفه الشخصي والتعليمي فقط",
    allowed: [
      "الاطلاع على جدول حصصه والملاحظات والواجبات",
      "معاينة نقاط تقدمه وشارات التفوق والشهادات",
    ],
    forbidden: [
      "محجوب عن الفواتير وعن بيانات أي طالب آخر",
    ],
  },
];

