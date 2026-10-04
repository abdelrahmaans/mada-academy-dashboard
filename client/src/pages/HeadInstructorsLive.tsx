import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, BookOpen, CalendarDays, CheckCircle2, Clock3, RefreshCw, ShieldCheck, Users } from "lucide-react";
import EvaluationReviewQueue from "@/components/EvaluationReviewQueue";
import { LoadingState } from "@/components/FeedbackStates";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type EvaluationStatusSummary, type GroupRecord, type NotificationRecord, type SchedulingInstructor, type SessionRecord } from "@/lib/apiClient";
import { mergeR03LiveResults } from "@/lib/liveSurfaceAcceptance";
import "./HeadInstructorsLive.css";

type LiveData = {
  groups: GroupRecord[];
  instructors: SchedulingInstructor[];
  sessions: SessionRecord[];
  evaluations: EvaluationStatusSummary;
  notifications: NotificationRecord[];
};

type LiveView = "overview" | "evaluations";

const EVALUATION_STATES = [
  { key: "DRAFT", label: "مسودة", tone: "muted" },
  { key: "SUBMITTED", label: "بانتظار المراجعة", tone: "warning" },
  { key: "CHANGES_REQUESTED", label: "مطلوب تعديل", tone: "danger" },
  { key: "PUBLISHED", label: "منشور للأسرة", tone: "success" },
] as const;

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
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

export default function HeadInstructorsLive() {
  const { me, loading: authLoading } = useAuth();
  const [view, setView] = useState<LiveView>("overview");
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me?.branchId) {
      setData(null);
      setLoading(false);
      setError("حساب رئيس المدربين لا يحتوي على فرع مسند؛ لم يتم عرض بيانات توضيحية.");
      return;
    }
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const [groupsResult, instructorsResult, sessionsResult, evaluationsResult, notificationsResult] = await Promise.allSettled([
        apiClient.listGroups(),
        apiClient.schedulingInstructors(me.branchId),
        apiClient.listSessions({ from, to }),
        apiClient.evaluationStatusSummary(),
        apiClient.listNotifications(true),
      ]);
      const merged = mergeR03LiveResults(groupsResult, instructorsResult, sessionsResult, evaluationsResult, notificationsResult, me.branchId);
      setData(merged.data);
      setWarning(merged.warnings.length > 0 ? merged.warnings.join(" ") : null);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات الفرع من الخادم.");
    } finally {
      setLoading(false);
    }
  }, [me?.branchId]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const branch = me?.branches?.find(item => item.id === me.branchId)?.name ?? "الفرع المسند";
  const upcomingSessions = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    return data.sessions.filter(item => item.status !== "CANCELLED" && new Date(item.startAt).getTime() >= now).slice(0, 12);
  }, [data]);
  const activeGroups = data?.groups.filter(item => item.status === "ACTIVE" || item.status === "UPCOMING") ?? [];
  const coachCount = data?.instructors.filter(item => item.roleCode === "R04_INSTRUCTOR").length ?? 0;
  const completedSessions = data?.sessions.filter(item => item.status === "COMPLETED").length ?? 0;
  const evaluationCounts = data?.evaluations.counts;

  const markRead = async (notification: NotificationRecord) => {
    setMarkingId(notification.id);
    try {
      await apiClient.markNotificationRead(notification.id);
      setData(current => current ? { ...current, notifications: current.notifications.filter(item => item.id !== notification.id) } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحديث حالة التنبيه.");
    } finally {
      setMarkingId(null);
    }
  };

  if (authLoading) return <LoadingState label="جارٍ التحقق من نطاق الحساب…" />;
  if (!me || me.role !== "R03_HEAD_INSTRUCTORS") {
    return <main className="r03-live-page" dir="rtl"><section className="r03-live-error" role="alert"><ShieldCheck size={20} /><div><strong>هذه الصفحة مخصصة لرئيس المدربين.</strong><p>لم يتم تحميل أو عرض بيانات تجريبية.</p></div></section></main>;
  }

  return (
    <RoleDashboardShell className="r03-live-shell" roleCode="R03" roleLabel="رئيس المدربين" scopeLevel="branch" scopeLabel={`فرع واحد · ${branch}`} branchName={branch} tenantName={me.academy?.name} demo={false}>
      <main className="r03-live-page" dir="rtl">
        <header className="r03-live-header">
          <div><span className="r03-live-eyebrow"><span /> لوحة أكاديمية · LIVE</span><h1>إشراف فريق المدربين</h1><p>بيانات فعلية من {branch} · الجلسات ضمن آخر 30 يومًا والقادم 60 يومًا.</p></div>
          <button className="r03-live-refresh" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? "spinning" : ""} /> تحديث البيانات</button>
        </header>
        <RoleScopeCard className="r03-live-scope" compact />
        <nav className="r03-live-tabs" aria-label="أقسام إشراف المدربين">
          <button type="button" className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><Users size={15} /> ملخص الفرع</button>
          <button type="button" className={view === "evaluations" ? "active" : ""} onClick={() => setView("evaluations")}><CheckCircle2 size={15} /> مراجعة التقييمات <b>{evaluationCounts?.SUBMITTED ?? "—"}</b></button>
        </nav>
        {loading && <LoadingState label="جارٍ تحميل بيانات الفريق والمجموعات والجلسات والتقييمات…" compact />}
        {!loading && error && <section className="r03-live-error" role="alert"><ShieldCheck size={20} /><div><strong>تعذر عرض لوحة R03 الحية</strong><p>{error} لم يتم استبدال بيانات الخادم ببيانات تجريبية.</p></div><button type="button" onClick={() => void load()}>إعادة المحاولة</button></section>}
        {!loading && !error && warning && <section className="r03-live-error" role="status"><ShieldCheck size={20} /><div><strong>بعض الملحقات غير متاحة</strong><p>{warning} البيانات الأساسية ما زالت معروضة من الخادم.</p></div><button type="button" onClick={() => void load()}>إعادة المحاولة</button></section>}
        {!loading && !error && data && view === "overview" && (
          <>
            <section className="r03-live-metrics" aria-label="مؤشرات الفرع الحية">
              <Metric icon={<Users size={17} />} label="مدربون نشطون" value={coachCount} hint="عضويات نشطة في الفرع" />
              <Metric icon={<BookOpen size={17} />} label="مجموعات قائمة" value={activeGroups.length} hint="من سجلات البرامج" />
              <Metric icon={<CalendarDays size={17} />} label="جلسات قادمة" value={upcomingSessions.length} hint="ضمن نافذة 60 يومًا" />
              <Metric icon={<Clock3 size={17} />} label="جلسات مكتملة" value={completedSessions} hint="ضمن آخر 30 يومًا" />
            </section>
            <section className="r03-live-panel">
              <PanelHeading icon={<CheckCircle2 size={17} />} title="حالات التقييم" detail="أعداد من قاعدة البيانات؛ لا تظهر التقييمات للمستهلك إلا بعد Published." />
              <div className="r03-status-grid">{EVALUATION_STATES.map(state => <article className={`r03-status-card ${state.tone}`} key={state.key}><span>{state.label}</span><strong>{evaluationCounts?.[state.key] ?? 0}</strong></article>)}</div>
            </section>
            <section className="r03-live-two-col">
              <section className="r03-live-panel">
                <PanelHeading icon={<Users size={17} />} title="فريق الفرع" detail="الأسماء والأدوار من العضويات النشطة." />
                {data.instructors.length === 0 ? <Empty text="لا توجد عضويات تدريب نشطة في هذا الفرع." /> : <div className="r03-live-list">{data.instructors.map(instructor => {
                  const groupCount = data.groups.filter(group => group.instructorId === instructor.id).length;
                  const sessionCount = data.sessions.filter(session => session.instructorId === instructor.id).length;
                  return <article className="r03-live-person" key={`${instructor.id}-${instructor.roleCode}`}><span className="r03-avatar">{(instructor.name ?? "؟").slice(0, 1)}</span><span className="r03-person-main"><strong>{instructor.name ?? "اسم غير متاح"}</strong><small>{instructor.roleCode === "R03_HEAD_INSTRUCTORS" ? "رئيس المدربين" : "مدرب"}</small></span><span className="r03-person-stats">{groupCount} مجموعة · {sessionCount} جلسة</span></article>;
                })}</div>}
              </section>
              <section className="r03-live-panel">
                <PanelHeading icon={<Bell size={17} />} title="تنبيهات غير مقروءة" detail="إشعارات مرتبطة بالحساب من الخادم." />
                {data.notifications.length === 0 ? <Empty text="لا توجد تنبيهات غير مقروءة." /> : <div className="r03-live-list">{data.notifications.slice(0, 8).map(notification => <article className="r03-live-notification" key={notification.id}><div><strong>{notification.title}</strong><p>{notification.body}</p><small>{dateLabel(notification.createdAt)}</small></div><button type="button" disabled={markingId === notification.id} onClick={() => void markRead(notification)}>تمت القراءة</button></article>)}</div>}
              </section>
            </section>
            <section className="r03-live-panel">
              <PanelHeading icon={<BookOpen size={17} />} title="المجموعات والبرامج" detail="بيانات CourseOffering المسجلة في الفرع." />
              {data.groups.length === 0 ? <Empty text="لا توجد مجموعات مسجلة في هذا الفرع." /> : <div className="r03-live-table-wrap"><table className="r03-live-table"><thead><tr><th>البرنامج</th><th>المدرب</th><th>المسجلون</th><th>الفترة</th><th>الحالة</th></tr></thead><tbody>{data.groups.map(group => <tr key={group.id}><td><strong>{group.courseName}</strong><small>{group.track}</small></td><td>{group.instructorName ?? "غير محدد"}</td><td>{group.enrolledStudents} / {group.maxStudents}</td><td>{dateLabel(group.startDate)} – {dateLabel(group.endDate)}</td><td><span className="r03-live-pill">{group.status}</span></td></tr>)}</tbody></table></div>}
            </section>
            <section className="r03-live-panel">
              <PanelHeading icon={<CalendarDays size={17} />} title="الجلسات القادمة" detail="مواعيد فعلية من جدول الفرع." />
              {upcomingSessions.length === 0 ? <Empty text="لا توجد جلسات قادمة ضمن النافذة المحددة." /> : <div className="r03-live-session-grid">{upcomingSessions.map(session => <article className="r03-live-session" key={session.id}><div><strong>{session.courseName ?? "جلسة"}</strong><span className="r03-live-pill">{sessionStatusLabel(session.status)}</span></div><p>{dateTimeLabel(session.startAt)}</p><small>{session.instructorName ?? "مدرب غير محدد"} · {session.classroomName ?? "قاعة غير محددة"}</small></article>)}</div>}
            </section>
            <p className="r03-live-disclaimer"><ShieldCheck size={15} /> لا تتضمن لوحة R03 الماليات. مؤشرات الإتقان والـcheckpoints غير معروضة لأن مصدرًا حيًا لها غير موجود في عقد البيانات الحالي.</p>
          </>
        )}
        {!loading && !error && data && view === "evaluations" && <EvaluationReviewQueue />}
      </main>
    </RoleDashboardShell>
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
