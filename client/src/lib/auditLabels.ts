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
  SUPERVISION_ASSIGNMENT_GRANTED: { label: "إسناد إشراف أكاديمي", tone: "system" },
  SUPERVISION_ASSIGNMENT_REVOKED: { label: "إلغاء إشراف أكاديمي", tone: "system" },
  SESSION_COMPLETED: { label: "إتمام جلسة تدريبية وتسجيل الحضور", tone: "system" },
  SESSION_CANCELLED: { label: "إلغاء جلسة تدريبية", tone: "system" },
  EVALUATION_REVIEW_REQUESTED: { label: "طلب مراجعة تقييم طالب", tone: "system" },
  EVALUATION_APPROVED: { label: "اعتماد ونشر تقييم طالب", tone: "system" },
  EVALUATION_RETURNED: { label: "إرجاع تقييم للمدرب للتعديل", tone: "system" },
  CERTIFICATE_ISSUED: { label: "إصدار شهادة إتمام برنامج معتمدة", tone: "system" },

  // Marketing & Platform
  LEAD_CREATED: { label: "تسجيل عميل محتمل جديد (Lead)", tone: "marketing" },
  LEAD_STATUS_UPDATED: { label: "تحديث حالة متابعة العميل", tone: "marketing" },
  LEAD_CONVERTED: { label: "تحويل العميل إلى طالب مسجل", tone: "marketing" },
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
  INVOICE: "فاتورة مالية",
  PAYMENT: "سند قبض",
  EXPENSE: "سند صرف",
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
  return AUDIT_TARGET_TYPE_MAP[targetType] ?? targetType.replaceAll("_", " ");
}

/**
 * Formats a raw UUID or ID into a clean friendly display label.
 */
export function formatAuditTargetId(targetId: string, targetType?: string): string {
  if (!targetId) return "—";
  // If it's a UUID, show short clean reference
  if (targetId.length >= 24 && targetId.includes("-")) {
    const short = targetId.slice(-4).toUpperCase();
    return `#${short}`;
  }
  return targetId;
}

export interface FriendlyMetadataEntry {
  keyLabel: string;
  valueDisplay: string;
}

const METADATA_KEY_LABELS: Record<string, string> = {
  status: "الحالة الناتجة",
  note: "ملاحظات وتفاصيل الإجراء",
  notes: "ملاحظات",
  reason: "سبب العملية",
  channel: "قناة التواصل",
  studentName: "اسم الطالب",
  parentName: "اسم ولي الأمر",
  phone: "رقم الهاتف",
  amount: "المبلغ",
  amountPiastres: "المبلغ",
  branchName: "الفرع",
  branchCode: "كود الفرع",
  courseName: "البرنامج التدريبي",
  roleCode: "كود الدور",
  permissionsCount: "عدد الصلاحيات المحدثة",
  previousStatus: "الحالة السابقة",
  newStatus: "الحالة الجديدة",
};

const STATUS_VALUE_LABELS: Record<string, string> = {
  contacted: "تم التواصل هاتفياً",
  pending: "قيد الانتظار",
  completed: "مكتمل بنجاح",
  approved: "معتمد",
  rejected: "مرفوض",
  active: "نشط",
  inactive: "غير نشط",
  resolved: "تم الحل",
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

      const keyLabel = METADATA_KEY_LABELS[rawKey] ?? rawKey;
      let valueDisplay = "";

      if (typeof rawVal === "object") {
        if (Array.isArray(rawVal)) {
          valueDisplay = rawVal.join("، ");
        } else {
          valueDisplay = JSON.stringify(rawVal);
        }
      } else {
        const strVal = String(rawVal);
        if (rawKey === "amountPiastres" && typeof rawVal === "number") {
          valueDisplay = `${(rawVal / 100).toLocaleString("ar-EG")} ج.م`;
        } else {
          valueDisplay = STATUS_VALUE_LABELS[strVal] ?? strVal;
        }
      }

      entries.push({ keyLabel, valueDisplay });
    }
    return entries;
  } catch {
    return [];
  }
}
