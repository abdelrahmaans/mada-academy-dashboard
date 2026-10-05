import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import EvaluationReviewQueue from "@/components/EvaluationReviewQueue";
import HeadInstructorsLiveOverview, { type HeadInstructorsOverviewData } from "@/components/HeadInstructorsLiveOverview";
import R03HeadInstructorsSidebar from "@/components/R03HeadInstructorsSidebar";
import { LoadingState } from "@/components/FeedbackStates";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type NotificationRecord } from "@/lib/apiClient";
import { mergeR03LiveResults } from "@/lib/liveSurfaceAcceptance";
import "./HeadInstructorsLive.css";

type LiveView = "overview" | "evaluations";

export default function HeadInstructorsLive() {
  const { me, loading: authLoading } = useAuth();
  const [view, setView] = useState<LiveView>("overview");
  const [data, setData] = useState<HeadInstructorsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    <RoleDashboardShell className="app-shell r03-live-shell" showSessionLogout={false} roleCode="R03" roleLabel="رئيس المدربين" scopeLevel="branch" scopeLabel={`فرع واحد · ${branch}`} branchName={branch} tenantName={me.academy?.name} demo={false}>
      <R03HeadInstructorsSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} activePath="/head-instructors" />
      <main className="main-panel" dir="rtl">
        <RoleSurfaceTopbar onMenu={() => setMobileNavOpen(true)} scopeLabel={`فرع ${branch}`} roleLabel="رئيس المدربين" />
        <div className="r03-live-page">
        <header className="r03-live-header">
          <div><span className="r03-live-eyebrow"><span /> لوحة أكاديمية · LIVE</span><h1>إشراف فريق المدربين</h1><p>بيانات فعلية من {branch} · الجلسات ضمن آخر 30 يومًا والقادم 60 يومًا.</p></div>
          <button className="r03-live-refresh" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? "spinning" : ""} /> تحديث البيانات</button>
        </header>
        <RoleScopeCard className="r03-live-scope" compact />
        <nav className="r03-live-tabs" aria-label="أقسام إشراف المدربين">
          <button type="button" className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><Users size={15} /> ملخص الفرع</button>
          <button type="button" className={view === "evaluations" ? "active" : ""} onClick={() => setView("evaluations")}><CheckCircle2 size={15} /> مراجعة التقييمات <b>{data?.evaluations.counts.SUBMITTED ?? "—"}</b></button>
        </nav>
        {loading && <LoadingState label="جارٍ تحميل بيانات الفريق والمجموعات والجلسات والتقييمات…" compact />}
        {!loading && error && <section className="r03-live-error" role="alert"><ShieldCheck size={20} /><div><strong>تعذر عرض لوحة R03 الحية</strong><p>{error} لم يتم استبدال بيانات الخادم ببيانات تجريبية.</p></div><button type="button" onClick={() => void load()}>إعادة المحاولة</button></section>}
        {!loading && !error && warning && <section className="r03-live-error" role="status"><ShieldCheck size={20} /><div><strong>بعض الملحقات غير متاحة</strong><p>{warning} البيانات الأساسية ما زالت معروضة من الخادم.</p></div><button type="button" onClick={() => void load()}>إعادة المحاولة</button></section>}
        {!loading && !error && data && view === "overview" && <HeadInstructorsLiveOverview data={data} upcomingSessions={upcomingSessions} activeGroups={activeGroups} coachCount={coachCount} completedSessions={completedSessions} markingId={markingId} onMarkRead={notification => void markRead(notification)} />}
        {!loading && !error && data && view === "evaluations" && <EvaluationReviewQueue />}
        </div>
      </main>
    </RoleDashboardShell>
  );
}
