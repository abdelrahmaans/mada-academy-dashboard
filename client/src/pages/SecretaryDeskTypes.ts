import type {
  CreateLeadInput,
  ConvertLeadInput,
  DirectStudentInput,
  LeadRecord,
  SchedulingGroupRecord,
  StudentRecord,
  SubscriptionFreezeRequest,
} from "@/lib/apiClient";

export type SecretaryTab = "pulse" | "pipeline" | "registration" | "followups" | "freezes" | "shifts";

export interface FreezeFormData {
  studentId: string;
  startDate: string;
  endDate: string;
  reason: "MEDICAL" | "TRAVEL" | "EXAMS" | "FAMILY" | "OTHER";
  reasonText: string;
}

export interface ShiftFormData {
  shiftName: "MORNING" | "EVENING";
  cashAmount: string;
  electronicAmount: string;
  totalReceiptsCount: string;
  notes: string;
}

export const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم بالحجز",
  REGISTERED: "مسجل رسميًا",
  WAITLISTED: "قائمة انتظار",
  ARCHIVED: "مؤرشف",
};

export const CHANNEL_LABELS: Record<string, string> = {
  WALK_IN: "زيارة مباشرة",
  WHATSAPP: "واتساب",
  PHONE: "اتصال هاتفي",
  FACEBOOK: "فيسبوك",
  INSTAGRAM: "إنستغرام",
};
