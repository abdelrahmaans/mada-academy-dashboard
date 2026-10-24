import type { AttendanceItem } from "@/lib/apiClient";

export type InstructorView = "sessions" | "attendance" | "evaluations" | "supervision" | "review";
export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | "UNMARKED";
export type AttendanceDraft = { status: AttendanceStatus; lateMinutes: number | null };

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function evaluationLabel(status?: string): string {
  if (status === "PUBLISHED") return "منشور للأسرة";
  if (status === "SUBMITTED") return "بانتظار مراجعة رئيس المدربين";
  if (status === "CHANGES_REQUESTED") return "مطلوب تعديل";
  return status === "DRAFT" ? "مسودة محفوظة" : "لم يُحفظ بعد";
}

export function mapAttendance(items: AttendanceItem[]): Record<string, AttendanceDraft> {
  return Object.fromEntries(
    items.map((item) => [
      item.studentId,
      {
        status: item.status as AttendanceStatus,
        lateMinutes: item.lateMinutes,
      },
    ])
  ) as Record<string, AttendanceDraft>;
}
