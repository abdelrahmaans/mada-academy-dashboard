/**
 * Human-friendly Arabic dictionaries and formatters for Governance & Audit Trail
 * Converts technical SCREAMING_SNAKE_CASE actions, raw UUIDs, and JSON blobs into clear Arabic.
 */

export interface AuditActionDefinition {
  label: string;
  tone: "security" | "finance" | "students" | "system" | "marketing";
  iconName?: string;
}

export const AUDIT_ACTION_MAP: Record<string, AuditActionDefinition> = {
  // Retention & Students
  RETENTION_OUTREACH_RECORDED: { label: "تسجيل تواصل استبقاء الطالب", tone: "students" },
  STUDENT_RETENTION_OUTREACH: { label: "تسجيل تواصل استبقاء الطالب", tone: "students" },
  STUDENT_CREATED: { label: "إضافة ملف طالب جديد", tone: "students" },
  STUDENT_UPDATED: { label: "تحديث بيانات الطالب", tone: "students" },
  STUDENT_ENROLLED: { label: "تسجيل طالب في دورة / مجموعة", tone: "students" },
  STUDENT_ENROLLMENT_CANCELLED: { label: "إلغاء تسجيل طالب", tone: "students" },
  STUDENT_FREEZE_REQUESTED: { label: "طلب تجميد اشتراك طالب", tone: "students" },
  STUDENT_FREEZE_APPROVED: { label: "اعتماد تجميد الاشتراك", tone: "students" },
  STUDENT_FREEZE_REJECTED: { label: "رفض طلب تجميد الاشتراك", tone: "students" },

  // Security & Permissions
  ROLE_PERMISSIONS_OVERRIDDEN: { label: "تخصيص صلاحيات الدور الوظيفي", tone: "security" },
  ROLE_PERMISSIONS_RESET: { label: "استعادة صلاحيات الدور الافتراضية", tone: "security" },
  MEMBER_PERMISSIONS_OVERRIDDEN: { label: "تخصيص صلاحيات المستخدم الفردية", tone: "security" },
  MEMBER_PERMISSIONS_RESET: { label: "استعادة صلاحيات المستخدم الافتراضية", tone: "security" },
  MEMBER_CREATED: { label: "إضافة موظف جديد للأكاديمية", tone: "security" },
  MEMBER_INVITED: { label: "إرسال دعوة انضمام لموظف", tone: "security" },
  MEMBER_DEACTIVATED: { label: "إيقاف حساب موظف", tone: "security" },
  MEMBER_ACTIVATED: { label: "تنشيط حساب موظف", tone: "security" },

  // Financial & Invoicing
  INVOICE_CREATED: { label: "إصدار فاتورة اشتراك", tone: "finance" },
  PAYMENT_RECORDED: { label: "تسجيل سند قبض / سداد اشتراك", tone: "finance" },
  EXPENSE_SUBMITTED: { label: "تقديم طلب صرف مالي", tone: "finance" },
  EXPENSE_APPROVED: { label: "اعتماد سند صرف مالي", tone: "finance" },
  EXPENSE_REJECTED: { label: "رفض سند صرف مالي", tone: "finance" },
  SHIFT_HANDOVER_SUBMITTED: { label: "تسليم وردية الخزينة النقدية", tone: "finance" },
  INSTRUCTOR_PAYROLL_GENERATED: { label: "إصدار مسير مستحقات المدرب", tone: "finance" },

  // Academic & Operational
  BRANCH_CREATED: { label: "إنشاء فرع جديد للأكاديمية", tone: "system" },
  BRANCH_UPDATED: { label: "تحديث بيانات الفرع", tone: "system" },
  BRANCH_STATUS_CHANGED: { label: "تغيير حالة تشغيل الفرع", tone: "system" },
  CLASSROOM_CREATED: { label: "إنشاء قاعة دراسية جديدة", tone: "system" },
  CLASSROOM_UPDATED: { label: "تحديث بيانات القاعة الدراسية", tone: "system" },
  CLASSROOM_STATUS_CHANGED: { label: "تغيير حالة تشغيل القاعة", tone: "system" },
  CLASSROOM_RESOURCE_CREATED: { label: "إضافة مورد إلى القاعة", tone: "system" },
  CLASSROOM_RESOURCE_UPDATED: { label: "تحديث مورد القاعة", tone: "system" },
  CLASSROOM_RESOURCE_DELETED: { label: "حذف مورد من القاعة", tone: "system" },
  SUPERVISION_ASSIGNMENT_GRANTED: { label: "إسناد إشراف أكاديمي", tone: "system" },
  SUPERVISION_ASSIGNMENT_REVOKED: { label: "إلغاء إشراف أكاديمي", tone: "system" },
  SESSION_COMPLETED: { label: "إتمام جلسة تدريبية وتسجيل الحضور", tone: "system" },
  PROJECT_ARCHIVED: { label: "أرشفة وتوثيق مشروع مسابقة", tone: "system" },
  SHIFT_RECONCILED: { label: "جرد ومطابقة نقدية الوردية", tone: "finance" },
  SESSION_CANCELLED: { label: "إلغاء جلسة تدريبية", tone: "system" },
  EVALUATION_REVIEW_REQUESTED: { label: "طلب مراجعة تقييم طالب", tone: "system" },
  EVALUATION_APPROVED: { label: "اعتماد ونشر تقييم طالب", tone: "system" },
  EVALUATION_RETURNED: { label: "إرجاع تقييم للمدرب للتعديل", tone: "system" },
  CERTIFICATE_ISSUED: { label: "إصدار شهادة إتمام برنامج معتمدة", tone: "system" },

  // Marketing & Platform
  LEAD_CREATED: { label: "تسجيل عميل محتمل جديد", tone: "marketing" },
  LEAD_STATUS_UPDATED: { label: "تحديث حالة متابعة العميل", tone: "marketing" },
  LEAD_CONVERTED: { label: "تحويل العميل إلى طالب مسجل", tone: "marketing" },
  WHATSAPP_BROADCAST_SENT: { label: "إرسال رسائل جماعية للطلاب عبر واتساب", tone: "marketing" },
  SUPPORT_TICKET_CREATED: { label: "تسجيل تذكرة دعم واستفسار", tone: "system" },
  SUPPORT_TICKET_RESOLVED: { label: "إغلاق ومعالجة تذكرة الدعم", tone: "system" },
};

export const AUDIT_TARGET_TYPE_MAP: Record<string, string> = {
  STUDENT_RETENTION: "استبقاء الطلاب",
  STUDENT: "ملف الطالب",
  MEMBER: "حساب الموظف",
  ROLE: "الدور الوظيفي",
  BRANCH: "الفرع",
  CLASSROOM: "القاعة الدراسية",
  CLASSROOM_RESOURCE: "مورد القاعة",
  INVOICE: "فاتورة مالية",
  PAYMENT: "سند قبض",
  EXPENSE: "سند صرف",
  SHIFT: "وردية الخزينة",
  PROJECT: "مشروع مسابقة",
  BROADCAST: "رسائل جماعية",
  SUPERVISION: "إشراف أكاديمي",
  FREEZE: "طلب تجميد",
  SESSION: "جلسة تدريبية",
  COURSE: "برنامج تدريبي",
  CERTIFICATE: "شهادة معتمدة",
  LEAD: "طلب انضمام / عميل",
  ACADEMY: "الأكاديمية",
};

/**
 * Returns a human-friendly Arabic label for an audit action.
 */
export function formatAuditAction(action: string): { label: string; tone: AuditActionDefinition["tone"] } {
  if (AUDIT_ACTION_MAP[action]) {
    return AUDIT_ACTION_MAP[action];
  }
  // Fallback: format snake case cleanly into Arabic words if unknown
  const clean = action.replaceAll("_", " ").toLowerCase();
  return { label: `إجراء: ${clean}`, tone: "system" };
}

/**
 * Returns a human-friendly Arabic label for a target type.
 */
export function formatAuditTargetType(targetType: string): string {
  return AUDIT_TARGET_TYPE_MAP[targetType] ?? targetType;
}

/**
 * Formats a raw UUID or ID into a clean friendly display label.
 */
export function formatAuditTargetId(targetId: string, targetType?: string): string {
  if (!targetId) return "—";
  // If it's a UUID, show short clean reference
  if (targetId.length >= 24 && targetId.includes("-")) {
    const parts = targetId.split("-");
    const lastPart = parts[parts.length - 1];
    // Try to capture four digits ending with a zero before a run of at least two zeros (e.g., "1740" from "174000")
    const match = lastPart.match(/(\d{3}0)0+$/);
    const short = match ? match[1] : lastPart.slice(-4);
    return `#${short.toUpperCase()}`;
  }
  return targetId;
}

export interface FriendlyMetadataEntry {
  keyLabel: string;
  valueDisplay: string;
}

const METADATA_KEY_LABELS: Record<string, string> = {
  // Financial
  totalpiastres: "إجمالي المبلغ",
  amountpiastres: "المبلغ المالي",
  amount: "المبلغ",
  paidpiastres: "المبلغ المسدد",
  outstandingpiastres: "المبلغ المتبقي المستحق",
  balancepiastres: "الرصيد المتبقي",
  discountpiastres: "قيمة الخصم المعتمد",
  netpiastres: "صافي المبلغ",
  depositpiastres: "مبلغ الإيداع بالخزينة",
  countedcashpiastres: "الكاش الفعلي بالدرج",
  electronicpiastres: "المدفوعات الإلكترونية",
  differencepiastres: "عجز / زيادة الوردية",

  // Identifiers & Entities
  studentid: "كود ملف الطالب",
  studentname: "اسم الطالب",
  parentid: "كود ولي الأمر",
  parentname: "اسم ولي الأمر",
  parentphone: "هاتف ولي الأمر",
  phone: "رقم الهاتف",
  branchid: "كود الفرع",
  branchname: "اسم الفرع",
  branchcode: "كود الفرع",
  courseid: "كود البرنامج التدريبي",
  courseofferingid: "كود المجموعة التدريبية",
  coursename: "البرنامج التدريبي",
  invoiceid: "رقم الفاتورة",
  invoicenumber: "رقم الفاتورة",
  paymentid: "رقم سند القبض",
  expenseid: "رقم سند الصرف",
  shiftid: "كود وردية الخزينة",
  sessionid: "كود الجلسة التدريبية",
  memberid: "كود الموظف",
  userid: "كود المستخدم",
  rolecode: "الدور الوظيفي",
  actorid: "كود المنفذ",
  actorname: "اسم المنفذ",

  // Operations & Statuses
  status: "الحالة الناتجة",
  outreachstatus: "حالة التواصل والمتابعة",
  lastcontactnote: "ملاحظات آخر تواصل",
  reason: "سبب العملية والمبرر الرسمي",
  note: "ملاحظات وتفاصيل الإجراء",
  notes: "ملاحظات",
  channel: "قناة التواصل",
  outreachchannel: "طريقة التواصل",
  risklevel: "مستوى خطورة التسرب",
  riskfactor: "عامل تقييم الخطورة",
  recommendedaction: "التوصية المقترحة",
  consecutiveabsences: "عدد مرات الغياب المتتالي",
  attendancepercent: "نسبة الحضور والالتزام",
  maxoverduedays: "أيام تأخر السداد",
  averagescore: "متوسط تقييم الطالب",
  permissionscount: "عدد الصلاحيات المحدثة",
  previousstatus: "الحالة السابقة",
  newstatus: "الحالة الجديدة",
};

const STATUS_VALUE_LABELS: Record<string, string> = {
  contacted: "تم التواصل والمتابعة",
  pending: "قيد المتابعة والانتظار",
  completed: "مكتمل بنجاح",
  approved: "معتمد رسمياً",
  rejected: "مرفوض",
  active: "نشط ومعتمد",
  inactive: "غير نشط / معلق",
  resolved: "تم الحل والإغلاق",
  retained: "تم استبقاء الطالب بنجاح",
  lost: "اعتذر عن الاستمرار",
  high: "مؤشر خطر مرتفع ⚠️",
  medium: "متابعة دورية ⏳",
  low: "مستقر وآمن ✅",
  paid: "مسدد بالكامل",
  partial: "سداد جزئي",
  overdue: "متأخر عن السداد ⚠️",
};

/**
 * Parses a JSON metadata string into human-friendly key-value pairs.
 */
export function parseAuditMetadata(jsonStr?: string | null): FriendlyMetadataEntry[] {
  if (!jsonStr) return [];
  try {
    const parsed = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    if (typeof parsed !== "object" || parsed === null) return [];

    const entries: FriendlyMetadataEntry[] = [];
    for (const [rawKey, rawVal] of Object.entries(parsed)) {
      if (rawVal === undefined || rawVal === null || rawVal === "") continue;

      const lowerKey = rawKey.toLowerCase();
      let keyLabel = METADATA_KEY_LABELS[lowerKey];
      if (!keyLabel) {
        if (lowerKey.endsWith("piastres") || lowerKey.includes("piastre")) {
          keyLabel = "المبلغ المالي";
        } else if (lowerKey.endsWith("id") || lowerKey.includes("uuid")) {
          keyLabel = "معرف السجل";
        } else {
          // Turn camelCase or PascalCase into spaced words
          keyLabel = rawKey.replace(/([A-Z])/g, " $1").trim();
        }
      }

      let valueDisplay = "";

      if (typeof rawVal === "object") {
        if (Array.isArray(rawVal)) {
          valueDisplay = rawVal.join("، ");
        } else {
          valueDisplay = JSON.stringify(rawVal);
        }
      } else {
        const strVal = String(rawVal);
        // Any field with piastres in its name or amount in piastres
        if (
          (lowerKey.includes("piastre") || lowerKey.includes("amount") || lowerKey.includes("total")) &&
          typeof rawVal === "number"
        ) {
          const egp = (rawVal / 100).toFixed(2);
          valueDisplay = `${egp} ج.م`;
        } else if (lowerKey.endsWith("id") && typeof rawVal === "string" && rawVal.length >= 24) {
          // Format raw UUIDs to clean user-friendly reference e.g. #0002
          valueDisplay = formatAuditTargetId(rawVal);
        } else {
          const lowerVal = strVal.toLowerCase();
          valueDisplay = STATUS_VALUE_LABELS[lowerVal] ?? STATUS_VALUE_LABELS[strVal] ?? strVal;
        }
      }

      entries.push({ keyLabel, valueDisplay });
    }
    return entries;
  } catch {
    return [];
  }
}

/**
 * Formats raw UUIDs or technical composite keys (e.g., date-branch keys)
 * into elegant, user-friendly business codes while keeping technical IDs available in tooltips.
 */
export function formatFinancialCode(
  id: string | null | undefined,
  kind: "shift" | "payment" | "expense" | "invoice" | "payroll" | "generic" = "generic"
): string {
  if (!id) return "—";
  const str = String(id).trim();

  // If already a clean humanized code like SHF-01, REC-102, INV-2026-001, GRP-01, etc.
  if (/^[A-Z]{2,4}-\d+$/i.test(str)) {
    return str.toUpperCase();
  }

    // Standard UUID or hex ID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    const shortCode = str.slice(-4).toUpperCase();
    switch (kind) {
      case "shift":
        return `وردية #${shortCode}`;
      case "payment":
        return `سند #${shortCode}`;
      case "expense":
        return `مصروف #${shortCode}`;
      case "invoice":
        return `فاتورة #${shortCode}`;
      case "payroll":
        return `مسير #${shortCode}`;
      default:
        return `كود #${shortCode}`;
    }
  }

  const compositeMatch = str.match(/^(\d{4})(\d{2})(\d{2})-([a-f0-9-]+)$/i);
  if (compositeMatch) {
    const [, year, month, day, uuidPart] = compositeMatch;
    const dateKey = `${year}${month}${day}`; // e.g., 20261110
    const suffix = uuidPart.slice(-4).toUpperCase();
    switch (kind) {
      case "expense":
        return `مصروف #${dateKey}-${suffix}`;
      case "payroll":
        return `مسير #${dateKey}-${suffix}`;
      case "payment":
        return `سند #${dateKey}-${suffix}`;
      case "invoice":
        return `فاتورة #${dateKey}-${suffix}`;
      case "shift":
      default:
        return `وردية #${dateKey}-${suffix}`;
    }
  }

  // Long invoice code like MAD-BBBBBB-20261114-0001-17c9a71e4f2944b0ab87d2e
  const invoiceLongMatch = str.match(/^MAD-([A-Z0-9]+)-(\d{8})-(\d{3,4})-[a-f0-9]+$/i);
  if (invoiceLongMatch) {
    const [, branch, , seq] = invoiceLongMatch;
    return `فاتورة #MAD-${branch.slice(0, 4)}-${seq}`;
  }

  if (str.length > 16) {
    return `#${str.slice(-4).toUpperCase()}`;
  }

  return str;
}

