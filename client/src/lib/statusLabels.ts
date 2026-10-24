/**
 * statusLabels.ts
 * Centralized Arabic translation map for all backend enum strings.
 * Prevents raw English enum values from appearing in the UI.
 *
 * Usage:
 *   import { groupStatusLabel, attendanceStatusLabel } from "@/lib/statusLabels";
 *   {groupStatusLabel(group.status)}
 */

// ─── Group / Course Status ─────────────────────────────────────────────────────

const GROUP_STATUS_AR: Record<string, string> = {
  ACTIVE:     "نشط",
  UPCOMING:   "قادم",
  COMPLETED:  "مكتمل",
  PAUSED:     "موقوف",
  CANCELLED:  "ملغى",
  DRAFT:      "مسودة",
};

export const groupStatusLabel = (status: string | undefined | null): string =>
  GROUP_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Attendance Status ─────────────────────────────────────────────────────────

const ATTENDANCE_STATUS_AR: Record<string, string> = {
  PRESENT:  "حاضر",
  ABSENT:   "غائب",
  LATE:     "متأخر",
  EXCUSED:  "معذور",
  UNMARKED: "لم يُسجَّل",
};

export const attendanceStatusLabel = (status: string | undefined | null): string =>
  ATTENDANCE_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Academy / Tenant Status ───────────────────────────────────────────────────

const ACADEMY_STATUS_AR: Record<string, string> = {
  ACTIVE:   "نشط",
  TRIAL:    "تجريبي",
  SETUP:    "إعداد",
  PAUSED:   "موقوف",
  OVERDUE:  "متأخر في السداد",
  INACTIVE: "غير نشط",
};

export const academyStatusLabel = (status: string | undefined | null): string =>
  ACADEMY_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Branch Status ─────────────────────────────────────────────────────────────

const BRANCH_STATUS_AR: Record<string, string> = {
  ACTIVE:   "نشط",
  INACTIVE: "موقوف",
  SETUP:    "إعداد",
};

export const branchStatusLabel = (status: string | undefined | null): string =>
  BRANCH_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Student Status ────────────────────────────────────────────────────────────

const STUDENT_STATUS_AR: Record<string, string> = {
  ACTIVE:     "طالب نشط",
  INACTIVE:   "غير نشط",
  GRADUATED:  "متخرج",
  SUSPENDED:  "موقوف",
  ON_HOLD:    "تجميد مؤقت",
};

export const studentStatusLabel = (status: string | undefined | null): string =>
  STUDENT_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Marketing Campaign Status ─────────────────────────────────────────────────

const CAMPAIGN_STATUS_AR: Record<string, string> = {
  DRAFT:      "مسودة",
  IN_REVIEW:  "تحت المراجعة",
  ACTIVE:     "نشطة",
  PAUSED:     "موقوفة",
  COMPLETED:  "منتهية",
};

export const campaignStatusLabel = (status: string | undefined | null): string =>
  CAMPAIGN_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Content Status ────────────────────────────────────────────────────────────

const CONTENT_STATUS_AR: Record<string, string> = {
  DRAFT:      "مسودة",
  IN_REVIEW:  "تحت المراجعة",
  APPROVED:   "معتمد",
  SCHEDULED:  "مجدول",
  PUBLISHED:  "منشور",
};

export const contentStatusLabel = (status: string | undefined | null): string =>
  CONTENT_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Session Status ────────────────────────────────────────────────────────────

const SESSION_STATUS_AR: Record<string, string> = {
  SCHEDULED:         "مجدولة",
  IN_PROGRESS:       "جارية",
  COMPLETED:         "مكتملة",
  CANCELLED:         "ملغاة",
  PENDING_APPROVAL:  "بانتظار الاعتماد",
  RESCHEDULED:       "معادة الجدولة",
  UPCOMING:          "قادمة",
};

export const sessionStatusLabel = (status: string | undefined | null): string =>
  SESSION_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Finance / Invoice Status ──────────────────────────────────────────────────

const INVOICE_STATUS_AR: Record<string, string> = {
  PAID:           "مسدد بالكامل",
  PARTIAL:        "سداد جزئي",
  UNPAID:         "غير مسدد",
  OVERDUE:        "متأخر في السداد",
  DRAFT:          "مسودة",
  CANCELLED:      "ملغاة",
};

export const invoiceStatusLabel = (status: string | undefined | null): string =>
  INVOICE_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Approval / Request Status ─────────────────────────────────────────────────

const APPROVAL_STATUS_AR: Record<string, string> = {
  PENDING:   "بانتظار الموافقة",
  APPROVED:  "معتمد",
  REJECTED:  "مرفوض",
  CANCELLED: "ملغى",
};

export const approvalStatusLabel = (status: string | undefined | null): string =>
  APPROVAL_STATUS_AR[status ?? ""] ?? status ?? "—";

// ─── Evaluation Status ─────────────────────────────────────────────────────────

const EVALUATION_STATUS_AR: Record<string, string> = {
  DRAFT:             "مسودة",
  SUBMITTED:         "بانتظار المراجعة",
  CHANGES_REQUESTED: "مطلوب تعديل",
  PUBLISHED:         "منشور للأسرة",
};

export const evaluationStatusLabel = (status: string | undefined | null): string =>
  EVALUATION_STATUS_AR[status ?? ""] ?? status ?? "—";

