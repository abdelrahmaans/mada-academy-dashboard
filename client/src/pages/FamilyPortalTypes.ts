import type { FamilyChild } from "@/components/ChildrenSwitcher";
import type {
  ConsumerSessionRecord,
  ConsumerStudentRecord,
  FinanceInvoice,
} from "@/lib/apiClient";
import { sessionsForStudent } from "@/lib/consumerScope";

export type PortalTab = "overview" | "attendance" | "evaluations" | "invoices" | "freeze";

export type ChildData = FamilyChild & {
  attendance: number | null;
  progress: number | null;
  nextSession: string;
  nextRoom: string;
  hasUpcomingSession: boolean;
  lastEvaluation: string;
  invoiceStatus: string;
  invoiceDue: string;
  sessionRecords?: ConsumerSessionRecord[];
  invoices?: FinanceInvoice[];
};

export const DEMO_CHILDREN: ChildData[] = [
  {
    id: "MAD-0248",
    name: "يوسف أحمد محمد",
    initials: "يا",
    course: "روبوتكس الناشئين — المستوى 1",
    branch: "الفرع الرئيسي",
    color: "teal",
    attendance: 88,
    progress: 75,
    nextSession: "الأحد · ١٠:٠٠ ص",
    nextRoom: "معمل الروبوتكس أ",
    hasUpcomingSession: true,
    lastEvaluation: "بطاقة منشورة · 4.4 / 5",
    invoiceStatus: "سداد جزئي",
    invoiceDue: "متبقي ١,٩٥٠ ج.م · استحقاق ١٥ أكتوبر",
  },
  {
    id: "MAD-0249",
    name: "آدم خالد محمود",
    initials: "اخ",
    course: "مقدمة البرمجة والذكاء الاصطناعي",
    branch: "الفرع الرئيسي",
    color: "violet",
    attendance: 92,
    progress: 60,
    nextSession: "الثلاثاء · ١٢:٠٠ م",
    nextRoom: "معمل الحاسب ب",
    hasUpcomingSession: true,
    lastEvaluation: "بطاقة منشورة · 4.7 / 5",
    invoiceStatus: "مدفوع بالكامل",
    invoiceDue: "لا توجد مستحقات حالية",
  },
];

export function mapFamilyChild(
  student: ConsumerStudentRecord,
  records: ConsumerSessionRecord[],
  index: number
): ChildData {
  const ownSessions = sessionsForStudent(records, student.id);
  const marked = ownSessions.filter(
    (item) => item.attendanceStatus !== "UNMARKED"
  );
  const attended = marked.filter(
    (item) =>
      item.attendanceStatus === "PRESENT" || item.attendanceStatus === "LATE"
  ).length;
  const completed = ownSessions.filter(
    (item) => item.status === "COMPLETED"
  ).length;
  const next = ownSessions
    .filter(
      (item) =>
        new Date(item.startAt).getTime() >= Date.now() &&
        item.status !== "CANCELLED"
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  const lastEvaluation = ownSessions
    .filter((item) => item.score !== null)
    .sort((a, b) => b.startAt.localeCompare(a.startAt))[0];
  const mostRecent = [...ownSessions].sort((a, b) => b.startAt.localeCompare(a.startAt))[0];
  const initials = student.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return {
    id: student.id,
    name: student.name,
    initials,
    color: index % 2 ? "violet" : "teal",
    course: mostRecent?.courseName ?? "لا توجد جلسات مرتبطة",
    branch: student.branchName ?? "غير متاح",
    attendance: marked.length
      ? Math.round((attended / marked.length) * 100)
      : null,
    progress: ownSessions.length
      ? Math.round((completed / ownSessions.length) * 100)
      : null,
    nextSession: next
      ? `${new Date(next.startAt).toLocaleDateString("ar-EG", {
          weekday: "long",
          day: "numeric",
          month: "short",
        })} · ${new Date(next.startAt).toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "لا توجد جلسة قادمة مجدولة",
    nextRoom: next?.classroomName ?? "غير متاح",
    hasUpcomingSession: Boolean(next),
    lastEvaluation: lastEvaluation
      ? `آخر تقييم · ${((lastEvaluation.score ?? 0) / 20).toFixed(1)} / 5`
      : "لا يوجد تقييم منشور",
    invoiceStatus: "جارٍ التحميل",
    invoiceDue: "يتم جلب بيانات الفواتير…",
    sessionRecords: ownSessions,
    invoices: [],
  };
}
