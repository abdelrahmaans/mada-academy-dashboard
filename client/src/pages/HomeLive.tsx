import { useEffect, useState, type ReactNode } from "react";
import { Activity, ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Menu, RefreshCw, Users } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import BranchManagerSidebar from "@/components/BranchManagerSidebar";
import { apiClient, type AuthMe, type DashboardSummary } from "@/lib/apiClient";
import "./HomeLive.css";

export default function HomeLive({ me }: { me: AuthMe }) {
  const [, navigate] = useLocation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const branchName = me.branches?.find(branch => branch.id === me.branchId)?.name ?? "الفرع المحدد";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiClient.dashboardSummary().then(data => {
      if (active) setSummary(data);
    }).catch(cause => {
      if (active) {
        setSummary(null);
        setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات الفرع.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

  const displayName = me.user?.displayName?.trim() || "مدير الفرع";

  return <RoleDashboardShell className="app-shell r02-home-live-shell" roleCode="R02" roleLabel={me.roleLabel || "مدير الفرع"} scopeLevel="branch" scopeLabel={branchName} tenantName={me.academy?.name} branchName={branchName} demo={false}>
    <BranchManagerSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    <main className="main-panel">
      <header className="topbar r02-live-topbar">
        <button className="icon-button mobile-menu-button" aria-label="فتح قائمة مدير الفرع" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
        <div className="r02-live-topbar-scope"><span>{me.academy?.name || "أكاديمية مدى"}</span><small>{branchName} · بيانات مباشرة</small></div>
      </header>
      <div className="workspace r02-home-live">
        <PageHeader
          className="welcome-row"
          copyClassName="welcome-copy"
          actionsClassName="welcome-actions"
          eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> ملخص التشغيل · بيانات مباشرة</span>}
          title={`أهلًا، ${displayName}`}
          description="مؤشرات الجلسات والطلاب المسجلة لهذا الفرع فقط."
          actions={<button className="button button-secondary" onClick={() => setRefreshKey(value => value + 1)} disabled={loading}><RefreshCw size={16} /> تحديث البيانات</button>}
        />
        <RoleScopeCard className="home-role-scope-card" compact />
        <div className="r02-home-live-source"><Activity size={14} /> المصدر: API الفرع · النطاق مستمد من جلسة المستخدم</div>

        {loading && <section className="r02-live-state" role="status"><span className="r02-live-spinner" /> جارٍ تحميل مؤشرات الفرع…</section>}
        {!loading && error && <section className="r02-live-state r02-live-error" role="alert"><strong>تعذر تحميل لوحة الفرع</strong><p>{error}</p><button className="button button-secondary" onClick={() => setRefreshKey(value => value + 1)}><RefreshCw size={15} /> إعادة المحاولة</button></section>}
        {!loading && !error && summary && <>
          <section className="r02-live-stat-grid" aria-label="مؤشرات الفرع الحية">
            <LiveStat icon={<Users size={18} />} label="الطلاب المسجلون" value={summary.students} suffix="طالب" tone="teal" />
            <LiveStat icon={<BookOpen size={18} />} label="التسجيلات النشطة" value={summary.activeEnrollments} suffix="تسجيل" tone="blue" />
            <LiveStat icon={<CalendarDays size={18} />} label="الجلسات القادمة" value={summary.upcomingSessions} suffix="جلسة" tone="amber" />
            <LiveStat icon={<CheckCircle2 size={18} />} label="الجلسات المكتملة" value={summary.completedSessions} suffix="جلسة" tone="violet" />
          </section>

          <section className="r02-live-panel">
            <div className="r02-live-panel-heading"><div><h2>الجلسات القادمة</h2><p>{branchName} · أقرب الجلسات المسجلة</p></div><span>{summary.upcoming.length} جلسات</span></div>
            {summary.upcoming.length === 0 ? <div className="r02-live-empty">لا توجد جلسات قادمة مسجلة لهذا الفرع.</div> : <div className="r02-live-session-list">{summary.upcoming.map(session => <article key={session.id} className="r02-live-session"><span className="r02-live-session-icon"><CalendarDays size={17} /></span><div><strong>الجلسة رقم {session.sessionNumber}</strong><small>{formatSessionTime(session.startAt)}</small></div><span className="r02-live-session-status">{session.status === "SCHEDULED" ? "مجدولة" : session.status}</span></article>)}</div>}
          </section>

          <section className="r02-live-actions" aria-label="روابط تشغيلية">
            <button onClick={() => navigate("/students")}><Users size={17} /><span>إدارة الطلاب</span><ArrowLeft size={15} /></button>
            <button onClick={() => navigate("/approvals")}><CheckCircle2 size={17} /><span>طلبات الموافقة</span><ArrowLeft size={15} /></button>
            <button onClick={() => navigate("/reports")}><Activity size={17} /><span>التقرير المالي للفرع</span><ArrowLeft size={15} /></button>
          </section>
        </>}
      </div>
    </main>
  </RoleDashboardShell>;
}

function LiveStat({ icon, label, value, suffix, tone }: { icon: ReactNode; label: string; value: number; suffix: string; tone: string }) {
  return <article className={`r02-live-stat r02-live-stat-${tone}`}><span className="r02-live-stat-icon">{icon}</span><div><small>{label}</small><strong>{new Intl.NumberFormat("ar-EG").format(value)} <em>{suffix}</em></strong></div></article>;
}

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "موعد الجلسة غير متاح";
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);
}
