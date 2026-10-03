import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, RefreshCw, ShieldCheck, Target } from "lucide-react";
import { LoadingState } from "@/components/FeedbackStates";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type GroupRecord, type SessionRecord } from "@/lib/apiClient";
import "./AcademicProgramsLive.css";

type ProgramLiveView = "groups" | "sessions" | "progress";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function AcademicProgramsLive() {
  const { me, loading: authLoading } = useAuth();
  const [view, setView] = useState<ProgramLiveView>("groups");
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me?.branchId) {
      setGroups([]);
      setSessions([]);
      setLoading(false);
      setError("لا يوجد فرع مسند للحساب؛ لم يتم عرض بيانات تجريبية.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const [groupResponse, sessionResponse] = await Promise.all([
        apiClient.listGroups(),
        apiClient.listSessions({ from, to }),
      ]);
      setGroups(groupResponse.items);
      setSessions(sessionResponse.items);
    } catch (cause) {
      setGroups([]);
      setSessions([]);
      setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات البرامج من الخادم.");
    } finally {
      setLoading(false);
    }
  }, [me?.branchId]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const branch = me?.branches?.find(item => item.id === me.branchId)?.name ?? "الفرع المسند";
  const upcoming = useMemo(() => sessions.filter(item => item.status !== "CANCELLED" && new Date(item.startAt).getTime() >= Date.now()), [sessions]);
  const completed = useMemo(() => sessions.filter(item => item.status === "COMPLETED"), [sessions]);

  if (authLoading) return <LoadingState label="جارٍ التحقق من نطاق الحساب…" />;
  if (!me || me.role !== "R03_HEAD_INSTRUCTORS") return <main className="r03-program-live" dir="rtl"><section className="r03-program-error" role="alert"><strong>هذه الصفحة مخصصة لرئيس المدربين.</strong><p>بيانات البرامج لم تُحمّل.</p></section></main>;

  return (
    <RoleDashboardShell className="r03-program-shell" roleCode="R03" roleLabel="رئيس المدربين" scopeLevel="branch" scopeLabel={`فرع واحد · ${branch}`} branchName={branch} tenantName={me.academy?.name}>
      <main className="r03-program-live" dir="rtl">
        <header className="r03-program-header"><div><span className="r03-program-kicker"><span /> البرامج الأكاديمية · LIVE</span><h1>برامج الفرع وجلساته</h1><p>المجموعات والجلسات الفعلية من قواعد بيانات الفرع؛ لا تتضمن أسعارًا أو عمليات مالية.</p></div><button type="button" className="r03-program-refresh" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> تحديث</button></header>
        <RoleScopeCard className="r03-program-scope" compact />
        <nav className="r03-program-tabs" aria-label="بيانات البرامج"><button type="button" className={view === "groups" ? "active" : ""} onClick={() => setView("groups")}><BookOpen size={15} /> مجموعات البرامج</button><button type="button" className={view === "sessions" ? "active" : ""} onClick={() => setView("sessions")}><CalendarDays size={15} /> الجلسات</button><button type="button" className={view === "progress" ? "active" : ""} onClick={() => setView("progress")}><Target size={15} /> تقدم الطلاب</button></nav>
        {loading && <LoadingState label="جارٍ تحميل مجموعات البرامج والجلسات…" compact />}
        {!loading && error && <section className="r03-program-error" role="alert"><strong>تعذر تحميل بيانات البرامج الحية</strong><p>{error} لم يتم عرض بيانات توضيحية بدلًا منها.</p><button type="button" onClick={() => void load()}>إعادة المحاولة</button></section>}
        {!loading && !error && view === "groups" && <section className="r03-program-panel"><div className="r03-program-panel-head"><div><h2>مجموعات البرامج</h2><p>{groups.length} مجموعة ضمن نطاق الفرع المسند.</p></div><span className="r03-program-count">{groups.filter(item => item.status === "ACTIVE" || item.status === "UPCOMING").length} نشطة/قادمة</span></div>{groups.length === 0 ? <Empty text="لا توجد مجموعات مسجلة في هذا الفرع." /> : <div className="r03-program-table-wrap"><table className="r03-program-table"><thead><tr><th>البرنامج</th><th>المدرب</th><th>المسجلون</th><th>المدة</th><th>الحالة</th></tr></thead><tbody>{groups.map(group => <tr key={group.id}><td><strong>{group.courseName}</strong><small>{group.track} · {group.classroomName}</small></td><td>{group.instructorName ?? "غير محدد"}</td><td>{group.enrolledStudents} / {group.maxStudents}</td><td>{dateLabel(group.startDate)} – {dateLabel(group.endDate)}</td><td><span className="r03-program-state">{group.status}</span></td></tr>)}</tbody></table></div>}</section>}
        {!loading && !error && view === "sessions" && <section className="r03-program-panel"><div className="r03-program-panel-head"><div><h2>جدول الجلسات</h2><p>{completed.length} مكتملة · {upcoming.length} قادمة ضمن آخر 30 يومًا والقادم 60 يومًا.</p></div></div>{sessions.length === 0 ? <Empty text="لا توجد جلسات ضمن الفترة المحددة." /> : <div className="r03-program-session-list">{sessions.map(session => <article className="r03-program-session" key={session.id}><div><strong>{session.courseName ?? "جلسة"}</strong><span className="r03-program-state">{session.status}</span></div><p>{dateTimeLabel(session.startAt)}</p><small>{session.instructorName ?? "مدرب غير محدد"} · {session.classroomName ?? "قاعة غير محددة"}</small></article>)}</div>}</section>}
        {!loading && !error && view === "progress" && <section className="r03-program-panel r03-progress-unavailable"><Target size={24} /><h2>مؤشرات الإتقان والـcheckpoints غير متاحة كبيانات حية</h2><p>الـAPI الحالية لا تحفظ إكمال الوحدات أو درجات الإتقان أو checkpoints للطلاب. لذلك أخفينا أرقام المعاينة في الجلسات المسجلة بدل تقديمها كحقائق.</p><span>البيانات الحية المتاحة الآن: {groups.length} مجموعة · {sessions.length} جلسة ضمن الفترة.</span></section>}
        <p className="r03-program-footnote"><ShieldCheck size={15} /> مصدر بيانات هذه الصفحة: scheduling/groups وsessions APIs، بنطاق الفرع من هوية الحساب.</p>
      </main>
    </RoleDashboardShell>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="r03-program-empty">{text}</p>;
}
