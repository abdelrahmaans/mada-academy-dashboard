import {
  ApiRequestError,
  type EvaluationStatusSummary,
  type GroupRecord,
  type NotificationRecord,
  type SchedulingInstructor,
  type SessionRecord,
} from "./apiClient";

export type R03LiveData = {
  groups: GroupRecord[];
  instructors: SchedulingInstructor[];
  sessions: SessionRecord[];
  evaluations: EvaluationStatusSummary;
  notifications: NotificationRecord[];
};

export function executiveFailureMessage(reason: unknown) {
  if (
    reason instanceof ApiRequestError &&
    reason.code === "REPORT_SOURCE_UNAVAILABLE"
  ) {
    const labels: Record<string, string> = {
      branches: "الفروع",
      students: "الطلاب",
      enrollments: "التسجيلات",
      sessions: "الجلسات",
      attendance: "الحضور",
      collections: "التحصيل",
      approvedExpenses: "المصروفات المعتمدة",
      pendingApprovals: "الموافقات",
    };
    return `تعذر قراءة مصدر التقرير: ${labels[reason.source ?? ""] ?? reason.source ?? "غير معروف"}. لم نعرض بدائل تجريبية.`;
  }
  return reason instanceof Error
    ? reason.message
    : "تعذر تحميل التقرير التنفيذي من الخادم.";
}

export function mergeR03LiveResults(
  groupsResult: PromiseSettledResult<{ items: GroupRecord[] }>,
  instructorsResult: PromiseSettledResult<{ items: SchedulingInstructor[] }>,
  sessionsResult: PromiseSettledResult<{ items: SessionRecord[] }>,
  evaluationsResult: PromiseSettledResult<EvaluationStatusSummary>,
  notificationsResult: PromiseSettledResult<{
    items: NotificationRecord[];
    total: number;
  }>,
  branchId: string
) {
  if (
    groupsResult.status !== "fulfilled" ||
    instructorsResult.status !== "fulfilled" ||
    sessionsResult.status !== "fulfilled"
  ) {
    throw new Error(
      "تعذر تحميل بيانات المجموعات أو المدربين أو الجلسات الأساسية."
    );
  }

  const warnings: string[] = [];
  const evaluations =
    evaluationsResult.status === "fulfilled"
      ? evaluationsResult.value
      : {
          branchId,
          counts: {
            DRAFT: 0,
            SUBMITTED: 0,
            CHANGES_REQUESTED: 0,
            PUBLISHED: 0,
          },
        };
  if (evaluationsResult.status === "rejected")
    warnings.push("ملخص التقييمات غير متاح مؤقتًا.");
  const notifications =
    notificationsResult.status === "fulfilled"
      ? notificationsResult.value
      : { items: [], total: 0 };
  if (notificationsResult.status === "rejected")
    warnings.push("التنبيهات غير متاحة مؤقتًا.");

  return {
    data: {
      groups: groupsResult.value.items,
      instructors: instructorsResult.value.items,
      sessions: sessionsResult.value.items,
      evaluations,
      notifications: notifications.items,
    } satisfies R03LiveData,
    warnings,
  };
}
