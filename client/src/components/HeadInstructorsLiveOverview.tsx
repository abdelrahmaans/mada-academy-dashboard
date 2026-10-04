import { Bell, BookOpen, CalendarDays, CheckCircle2, Clock3, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import type {
  EvaluationStatusSummary,
  GroupRecord,
  NotificationRecord,
  SchedulingInstructor,
  SessionRecord,
} from "@/lib/apiClient";

export type HeadInstructorsOverviewData = {
  groups: GroupRecord[];
  instructors: SchedulingInstructor[];
  sessions: SessionRecord[];
  evaluations: EvaluationStatusSummary;
  notifications: NotificationRecord[];
};

type Props = {
  data: HeadInstructorsOverviewData;
  upcomingSessions: SessionRecord[];
  activeGroups: GroupRecord[];
  coachCount: number;
  completedSessions: number;
  markingId: string | null;
  onMarkRead: (notification: NotificationRecord) => void;
};

const EVALUATION_STATES = [
  { key: "DRAFT", label: "مسودة", tone: "muted" },
  { key: "SUBMITTED", label: "بانتظار المراجعة", tone: "warning" },
  { key: "CHANGES_REQUESTED", label: "مطلوب تعديل", tone: "danger" },
  { key: "PUBLISHED", label: "منشور للأسرة", tone: "success" },
] as const;

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sessionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: "مجدولة",
    PENDING_APPROVAL: "بانتظار الاعتماد",
    COMPLETED: "مكتملة",
    CANCELLED: "ملغاة",
    RESCHEDULED: "أعيدت جدولتها",
  };
  return labels[status] ?? status;
}

export default function HeadInstructorsLiveOverview({
  data,
  upcomingSessions,
  activeGroups,
  coachCount,
  completedSessions,
  markingId,
  onMarkRead,
}: Props) {
  const evaluationCounts = data.evaluations.counts;

  return (
    <>
      <section className="r03-live-metrics" aria-label="مؤشرات الفرع الحية">
        <Metric icon={<Users size={17} />} label="مدربون نشطون" value={coachCount} hint="عضويات نشطة في الفرع" />
        <Metric icon={<BookOpen size={17} />} label="مجموعات قائمة" value={activeGroups.length} hint="من سجلات البرامج" />
        <Metric icon={<CalendarDays size={17} />} label="جلسات قادمة" value={upcomingSessions.length} hint="ضمن نافذة 60 يومًا" />
        <Metric icon={<Clock3 size={17} />} label="جلسات مكتملة" value={completedSessions} hint="ضمن آخر 30 يومًا" />
      </section>

      <section className="r03-live-panel">
        <PanelHeading icon={<CheckCircle2 size={17} />} title="حالات التقييم" detail="أعداد من قاعدة البيانات؛ لا تظهر التقييمات للمستهلك إلا بعد Published." />
        <div className="r03-status-grid">
          {EVALUATION_STATES.map(state => (
            <article className={`r03-status-card ${state.tone}`} key={state.key}>
              <span>{state.label}</span>
              <strong>{evaluationCounts?.[state.key] ?? 0}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="r03-live-two-col">
        <section className="r03-live-panel">
          <PanelHeading icon={<Users size={17} />} title="فريق الفرع" detail="الأسماء والأدوار من العضويات النشطة." />
          {data.instructors.length === 0 ? (
            <Empty text="لا توجد عضويات تدريب نشطة في هذا الفرع." />
          ) : (
            <div className="r03-live-list">
              {data.instructors.map(instructor => {
                const groupCount = data.groups.filter(group => group.instructorId === instructor.id).length;
                const sessionCount = data.sessions.filter(session => session.instructorId === instructor.id).length;
                return (
                  <article className="r03-live-person" key={`${instructor.id}-${instructor.roleCode}`}>
                    <span className="r03-avatar">{(instructor.name ?? "؟").slice(0, 1)}</span>
                    <span className="r03-person-main">
                      <strong>{instructor.name ?? "اسم غير متاح"}</strong>
                      <small>{instructor.roleCode === "R03_HEAD_INSTRUCTORS" ? "رئيس المدربين" : "مدرب"}</small>
                    </span>
                    <span className="r03-person-stats">{groupCount} مجموعة · {sessionCount} جلسة</span>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="r03-live-panel">
          <PanelHeading icon={<Bell size={17} />} title="تنبيهات غير مقروءة" detail="إشعارات مرتبطة بالحساب من الخادم." />
          {data.notifications.length === 0 ? (
            <Empty text="لا توجد تنبيهات غير مقروءة." />
          ) : (
            <div className="r03-live-list">
              {data.notifications.slice(0, 8).map(notification => (
                <article className="r03-live-notification" key={notification.id}>
                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.body}</p>
                    <small>{dateLabel(notification.createdAt)}</small>
                  </div>
                  <button type="button" disabled={markingId === notification.id} onClick={() => onMarkRead(notification)}>
                    تمت القراءة
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="r03-live-panel">
        <PanelHeading icon={<BookOpen size={17} />} title="المجموعات والبرامج" detail="بيانات CourseOffering المسجلة في الفرع." />
        {data.groups.length === 0 ? (
          <Empty text="لا توجد مجموعات مسجلة في هذا الفرع." />
        ) : (
          <div className="r03-live-table-wrap">
            <table className="r03-live-table">
              <thead>
                <tr><th>البرنامج</th><th>المدرب</th><th>المسجلون</th><th>الفترة</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                {data.groups.map(group => (
                  <tr key={group.id}>
                    <td><strong>{group.courseName}</strong><small>{group.track}</small></td>
                    <td>{group.instructorName ?? "غير محدد"}</td>
                    <td>{group.enrolledStudents} / {group.maxStudents}</td>
                    <td>{dateLabel(group.startDate)} – {dateLabel(group.endDate)}</td>
                    <td><span className="r03-live-pill">{group.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="r03-live-panel">
        <PanelHeading icon={<CalendarDays size={17} />} title="الجلسات القادمة" detail="مواعيد فعلية من جدول الفرع." />
        {upcomingSessions.length === 0 ? (
          <Empty text="لا توجد جلسات قادمة ضمن النافذة المحددة." />
        ) : (
          <div className="r03-live-session-grid">
            {upcomingSessions.map(session => (
              <article className="r03-live-session" key={session.id}>
                <div><strong>{session.courseName ?? "جلسة"}</strong><span className="r03-live-pill">{sessionStatusLabel(session.status)}</span></div>
                <p>{dateTimeLabel(session.startAt)}</p>
                <small>{session.instructorName ?? "مدرب غير محدد"} · {session.classroomName ?? "قاعة غير محددة"}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="r03-live-disclaimer"><ShieldCheck size={15} /> لا تتضمن لوحة R03 الماليات. مؤشرات الإتقان والـcheckpoints غير معروضة لأن مصدرًا حيًا لها غير موجود في عقد البيانات الحالي.</p>
    </>
  );
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: number; hint: string }) {
  return <article className="r03-live-metric"><span>{icon}</span><small>{label}</small><strong>{value}</strong><em>{hint}</em></article>;
}

function PanelHeading({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <header className="r03-live-panel-heading"><span>{icon}</span><div><h2>{title}</h2><p>{detail}</p></div></header>;
}

function Empty({ text }: { text: string }) {
  return <p className="r03-live-empty">{text}</p>;
}
