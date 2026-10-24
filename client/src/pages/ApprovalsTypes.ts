import type {
  ApprovalItem,
  ApprovalKind,
  ApprovalStatus,
} from "@/components/ApprovalCard";
import type { NotificationItem } from "@/components/NotificationCenter";
import type {
  ApprovalRequestRecord,
  FinanceExpense,
  InvoiceCorrection,
  NotificationRecord,
  SubscriptionFreezeRequest,
} from "@/lib/apiClient";

export type QueueTab = "all" | ApprovalKind;
export type ApprovalSort = "priority" | "oldest" | "newest";

export const BRANCH_MANAGER_DISCOUNT_LIMIT = 15;

export const INITIAL_REQUESTS: ApprovalItem[] = [
  {
    id: "APR-085",
    kind: "expense",
    title: "مصروف مستلزمات يحتاج تأكيدًا",
    summary: "طلب تأكيد مصروف تشغيلي مسجل من المحاسبة",
    branch: "مدينة نصر",
    requestedBy: "أحمد محمود · المحاسبة",
    submittedAt: "اليوم · 11:10 ص",
    submittedAtSort: "2026-09-26T11:10:00",
    expenseDescription: "مستلزمات معمل الروبوتكس",
    expenseAmount: 3850,
    expenseCategory: "مواد ومستلزمات",
    status: "pending",
  },
  {
    id: "APR-084",
    kind: "discount",
    title: "خصم إخوة يحتاج اعتمادًا",
    summary: "خصم إضافي على تسجيل الأخ الثاني",
    branch: "مدينة نصر",
    requestedBy: "هبة محمود · السكرتارية",
    submittedAt: "اليوم · 10:24 ص",
    submittedAtSort: "2026-09-26T10:24:00",
    student: "آدم شريف حسن",
    course: "ذكاء اصطناعي للصغار",
    invoice: "MAD-NSR-2026-0914",
    discountType: "خصم إخوة",
    discountValue: 15,
    originalAmount: 3600,
    finalAmount: 3060,
    status: "pending",
  },
  {
    id: "APR-083",
    kind: "substitute",
    title: "طلب مدرب بديل لحصة اليوم",
    summary: "تغطية الحصة بسبب غياب المدرب الأساسي",
    branch: "مدينة نصر",
    requestedBy: "مريم حسن · رئيس المدربين",
    submittedAt: "اليوم · 09:05 ص",
    submittedAtSort: "2026-09-26T09:05:00",
    course: "روبوتكس مستوى 2",
    instructor: "عمر سامح",
    substitute: "يوسف عماد",
    sessionDate: "السبت 26 سبتمبر",
    sessionTime: "12:00 – 1:30 م",
    status: "pending",
  },
  {
    id: "APR-082",
    kind: "discount",
    title: "خصم حملة موسمية",
    summary: "طلب تعديل قيمة خصم الحملة المسجل",
    branch: "المعادي",
    requestedBy: "سارة خالد · المحاسبة",
    submittedAt: "أمس · 04:18 م",
    submittedAtSort: "2026-09-25T16:18:00",
    student: "ليلى أحمد محمود",
    course: "برمجة للمبتدئين",
    invoice: "MAD-MAD-2026-0905",
    discountType: "خصم حملة",
    discountValue: 10,
    originalAmount: 2800,
    finalAmount: 2520,
    status: "pending",
  },
  {
    id: "APR-081",
    kind: "substitute",
    title: "طلب مدرب بديل لحصة قادمة",
    summary: "تبديل مؤقت بسبب تعارض في الجدول",
    branch: "مدينة نصر",
    requestedBy: "مريم حسن · رئيس المدربين",
    submittedAt: "أمس · 01:40 م",
    submittedAtSort: "2026-09-25T13:40:00",
    course: "دوائر إلكترونية",
    instructor: "سارة خالد",
    substitute: "هبة محمود",
    sessionDate: "الأحد 27 سبتمبر",
    sessionTime: "02:00 – 03:30 م",
    status: "pending",
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "approval-expense-085",
    kind: "approval",
    title: "مصروف يحتاج اعتمادك",
    description: "مستلزمات معمل الروبوتكس · مدينة نصر · 3,850 ج.م",
    time: "منذ 20 دقيقة",
    unread: true,
    actionLabel: "فتح المصروفات",
  },
  {
    id: "approval-discount-084",
    kind: "approval",
    title: "خصم إخوة بانتظار القرار",
    description: "آدم شريف حسن · خصم 15% ضمن سقف الفرع",
    time: "منذ 45 دقيقة",
    unread: true,
    actionLabel: "فتح الخصومات",
  },
  {
    id: "escalation-discount-policy",
    kind: "escalation",
    title: "تذكير بسياسة التصعيد",
    description: "أي خصم يتجاوز 15% يُرفع للإدارة المركزية.",
    time: "اليوم · 09:00 ص",
    actionLabel: "مراجعة الطلبات",
  },
];

export function approvalFromApi(record: ApprovalRequestRecord): ApprovalItem {
  const isSubstitution = record.requestType === "INSTRUCTOR_SUBSTITUTION";
  const typeName =
    record.requestType === "EXTRA"
      ? "جلسة إضافية"
      : record.requestType === "MAKEUP"
      ? "جلسة تعويضية"
      : "طلب مدرب بديل";
  const start = record.sessionStartAt ? new Date(record.sessionStartAt) : null;
  const end = record.sessionEndAt ? new Date(record.sessionEndAt) : null;
  const time = start
    ? `${start.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      })}${
        end
          ? ` – ${end.toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : ""
      }`
    : undefined;

  return {
    id: record.id,
    kind: isSubstitution ? "substitute" : "session",
    title: typeName,
    summary:
      record.reason ||
      (record.courseName
        ? `${record.courseName} · جلسة ${record.sessionNumber ?? ""}`
        : "طلب تشغيلي مسجل على الخادم"),
    branch: record.branchName ?? record.branchId ?? "كل الفروع",
    requestedBy: record.instructorName ?? record.submittedByRole,
    submittedAt: new Date(record.createdAt).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    submittedAtSort: record.createdAt,
    status: record.state.toLowerCase() as ApprovalStatus,
    decidedAt: record.decidedAt
      ? new Date(record.decidedAt).toLocaleString("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : undefined,
    decidedAtSort: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined,
    decidedBy: record.decidedByUserId ?? undefined,
    decisionNote: record.reason ?? undefined,
    requestType: record.requestType,
    targetId: record.targetId,
    proposedInstructorId: record.proposedInstructorId,
    course: record.courseName ?? undefined,
    instructor: record.instructorName ?? undefined,
    substitute: record.proposedInstructorId ?? undefined,
    sessionDate: start?.toLocaleDateString("ar-EG", { dateStyle: "medium" }),
    sessionTime: time,
    live: true,
  };
}

export function notificationFromApi(record: NotificationRecord): NotificationItem {
  const isApproval =
    record.type.includes("APPROVAL") || record.type.includes("SUBSTITUTION");
  return {
    id: record.id,
    kind: isApproval ? "approval" : "warning",
    title: record.title,
    description: record.body,
    time: new Date(record.createdAt).toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    }),
    unread: !record.isRead,
    actionLabel: isApproval ? "فتح الطلبات" : undefined,
  };
}

export function correctionFromApi(record: InvoiceCorrection): ApprovalItem {
  return {
    id: record.id,
    kind: "correction",
    title: "تصحيح فاتورة يحتاج اعتمادًا",
    summary: record.reason,
    branch: record.branchId,
    requestedBy: "المحاسبة",
    submittedAt: new Date(record.createdAt).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    submittedAtSort: record.createdAt,
    status: record.status.toLowerCase() as ApprovalStatus,
    decidedAt: record.decidedAt
      ? new Date(record.decidedAt).toLocaleString("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : undefined,
    decidedAtSort: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined,
    decidedBy: record.decidedByUserId ?? undefined,
    decisionNote: record.reason,
    targetId: record.id,
    correctionInvoice: record.invoiceNumber ?? record.invoiceId,
    correctionCurrentAmount: Math.round(record.currentTotalPiastres / 100),
    correctionProposedAmount: Math.round(record.proposedTotalPiastres / 100),
    live: true,
  };
}

export function expenseFromApi(record: FinanceExpense): ApprovalItem {
  return {
    id: record.id,
    kind: "expense",
    title: "مصروف يحتاج اعتمادًا",
    summary: record.description,
    branch: record.branchName ?? record.branchId,
    requestedBy: "مقدم الطلب",
    submittedAt: new Date(record.createdAt).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    submittedAtSort: record.createdAt,
    status: record.status.toLowerCase() as ApprovalStatus,
    decidedAt: record.decidedAt
      ? new Date(record.decidedAt).toLocaleString("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : undefined,
    decidedAtSort: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined,
    decidedBy: record.decidedByUserId ?? undefined,
    decisionNote: record.approvalReason ?? undefined,
    expenseDescription: record.description,
    expenseAmount: Math.round(record.amountPiastres / 100),
    expenseCategory: record.category,
    targetId: record.id,
    live: true,
  };
}

export function freezeFromStorage(record: SubscriptionFreezeRequest): ApprovalItem {
  const reasonAr =
    record.reason === "MEDICAL"
      ? "عذر مرضي"
      : record.reason === "TRAVEL"
      ? "سفر ورحلات"
      : record.reason === "EXAMS"
      ? "امتحانات مدرسية"
      : record.reason === "FAMILY"
      ? "ظروف أسرية"
      : "عذر خاص";

  return {
    id: record.id,
    kind: "freeze",
    title: `طلب تجميد اشتراك · ${record.studentName}`,
    summary: `${record.reasonText} (${reasonAr})`,
    branch: record.branchName || "مدينة نصر",
    requestedBy: `${record.submittedByName} · ${
      record.submittedByRole === "R08_PARENT" ? "ولي الأمر" : "السكرتارية"
    }`,
    submittedAt: new Date(record.createdAt).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    submittedAtSort: record.createdAt,
    status: record.status.toLowerCase() as ApprovalStatus,
    decidedAt: record.decidedAt
      ? new Date(record.decidedAt).toLocaleString("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : undefined,
    decidedAtSort: record.decidedAt ? new Date(record.decidedAt).getTime() : undefined,
    decidedBy: record.decidedByName,
    decisionNote: record.decisionNote,
    student: record.studentName,
    course: record.courseName,
    sessionDate: `من ${record.startDate} إلى ${record.endDate}`,
    requestType: `${record.affectedSessionsCount} حصص متأثرة · ${record.makeUpCreditsAwarded} رصيد تعويض`,
    targetId: record.id,
    live: true,
  };
}
