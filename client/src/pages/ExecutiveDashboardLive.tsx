import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Activity, BarChart3, Building2, CalendarDays, CheckCircle2, GraduationCap, LayoutDashboard, Menu, RefreshCw, ShieldCheck, Users, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import R01AcademySidebar from "@/components/R01AcademySidebar";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { apiClient, type ExecutiveActivityItem, type ExecutiveDashboardReport, type ExecutiveMetrics } from "@/lib/apiClient";
import { executiveFailureMessage } from "@/lib/liveSurfaceAcceptance";
import "./ExecutiveDashboardLive.css";

type PeriodOffset = 0 | -1 | -2;

function periodRange(offset: PeriodOffset) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const end = offset === 0 ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  const label = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), label };
}

function money(piastres: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(piastres / 100);
}

function integer(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

function Kpi({ icon, title, value, caption, tone }: { icon: React.ReactNode; title: string; value: string; caption: string; tone: "blue" | "teal" | "violet" | "amber" }) {
  return <article className={`r1-live-kpi r1-live-kpi-${tone}`}><span className={`r1-live-kpi-icon`}>{icon}</span><div><small>{title}</small><strong>{value}</strong><span>{caption}</span></div></article>;
}

function Metrics({ metrics }: { metrics: ExecutiveMetrics }) {
  return <>
    <div className="r1-live-kpis">
      <Kpi icon={<Users size={19} />} title="طلاب نشطون" value={integer(metrics.activeStudents)} caption="من سجلات الطلاب النشطة" tone="teal" />
      <Kpi icon={<CalendarDays size={19} />} title="الجلسات" value={integer(metrics.sessions)} caption={`${integer(metrics.completedSessions)} مكتملة في الفترة`} tone="blue" />
      <Kpi icon={<CheckCircle2 size={19} />} title="الحضور" value={metrics.attendancePercent === null ? "—" : `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 }).format(metrics.attendancePercent)}٪`} caption={metrics.attendanceMarkedCount ? `${integer(metrics.attendedCount)} حضورًا من ${integer(metrics.attendanceMarkedCount)} علامة غير معذورة` : "لا توجد علامات حضور للفترة"} tone="violet" />
      <Kpi icon={<Wallet size={19} />} title="التحصيل" value={money(metrics.collectedPiastres)} caption="حسب تاريخ استلام الدفعات" tone="amber" />
      <Kpi icon={<GraduationCap size={19} />} title="مصروفات معتمدة" value={money(metrics.approvedExpensesPiastres)} caption="لا تشمل المصروفات المعلقة أو المرفوضة" tone="blue" />
      <Kpi icon={<Wallet size={19} />} title="صافي الحركة" value={money(metrics.netPiastres)} caption="التحصيل ناقص المصروفات المعتمدة" tone="teal" />
    </div>
    <div className="r1-live-support-row"><span>تسجيلات نشطة: <strong>{integer(metrics.activeEnrollments)}</strong></span><span>موافقات معلقة: <strong>{integer(metrics.pendingApprovals)}</strong></span></div>
  </>;
}

function occurredAt(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ExecutiveDashboardLive() {
  const [branchId, setBranchId] = useState("ALL");
  const [period, setPeriod] = useState<PeriodOffset>(0);
  const [report, setReport] = useState<ExecutiveDashboardReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [activity, setActivity] = useState<ExecutiveActivityItem[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const range = useMemo(() => periodRange(period), [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setReport(null);
    apiClient.executiveSummary({ from: range.from, to: range.to, branchId: branchId === "ALL" ? undefined : branchId })
      .then(result => {
        if (cancelled) return;
        setReport(result);
        if (retryKey > 0) toast.success("تم تحديث لوحة الإدارة التنفيذية");
      })
      .catch(reason => {
        if (cancelled) return;
        const message = executiveFailureMessage(reason);
        setError(message);
        toast.error(message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [branchId, range.from, range.to, retryKey]);

  useEffect(() => {
    let cancelled = false;
    setActivityLoading(true);
    setActivityError(null);
    apiClient.executiveActivity({ from: range.from, to: range.to, branchId: branchId === "ALL" ? undefined : branchId })
      .then(result => { if (!cancelled) setActivity(result.items); })
      .catch(reason => {
        if (cancelled) return;
        const message = executiveFailureMessage(reason);
        setActivityError(message);
        toast.error(`تعذر تحميل سجل التدقيق: ${message}`);
      })
      .finally(() => { if (!cancelled) setActivityLoading(false); });
    return () => { cancelled = true; };
  }, [branchId, range.from, range.to, retryKey]);

  const selectedBranchName = branchId === "ALL" ? "كل الفروع" : report?.availableBranches.find(branch => branch.id === branchId)?.name ?? "الفرع المحدد";
  const retry = () => setRetryKey(value => value + 1);

  return <RoleDashboardShell className="app-shell executive-dashboard-shell r1-live-shell" roleCode="R01" roleLabel="مسؤول الأكاديمية" scopeLevel="tenant" scopeLabel="كل فروع الأكاديمية" tenantName="الأكاديمية الحالية" branchName={selectedBranchName}>
    <R01AcademySidebar activePath="/executive-dashboard" mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    <main className="main-panel">
      <RoleSurfaceTopbar onMenu={() => setMobileNavOpen(true)} scopeLabel={selectedBranchName} />
      <div className="workspace r1-live-page" dir="rtl">
      <PageHeader className="welcome-row" eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> الإدارة التنفيذية · R01 · LIVE</span>} title="لوحة الإدارة التنفيذية" description="مؤشرات تشغيلية ومالية للقراءة فقط، محسوبة من بيانات الأكاديمية ضمن الفرع والفترة المختارين." />
      <RoleScopeCard className="executive-scope-card" />
      <section className="r1-live-controls" aria-label="تصفية التقرير التنفيذي">
        <label><span><Building2 size={16} /> الفرع</span><select value={branchId} onChange={event => setBranchId(event.target.value)}><option value="ALL">كل الفروع</option>{report?.availableBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}{branch.status !== "ACTIVE" ? " · غير نشط" : ""}</option>)}</select></label>
        <label><span><CalendarDays size={16} /> الفترة</span><select value={period} onChange={event => setPeriod(Number(event.target.value) as PeriodOffset)}><option value={0}>{periodRange(0).label} · حتى اليوم</option><option value={-1}>{periodRange(-1).label}</option><option value={-2}>{periodRange(-2).label}</option></select></label>
        <span className="r1-live-period">{range.from} — {range.to}</span>
      </section>

      {loading && <section className="r1-live-state" role="status"><RefreshCw className="r1-live-spin" size={20} /> جارٍ جلب مؤشرات التقرير من الخادم…</section>}
      {!loading && error && <section className="r1-live-state r1-live-error" role="alert"><AlertCircle size={20} /><div><strong>تعذر تحميل مؤشرات R01</strong><span>{error}</span><button type="button" onClick={retry}>إعادة المحاولة</button></div></section>}
      {!loading && report && <>
        {report.branchesWithoutStudentData > 0 && <div className="r1-live-warning" role="status"><AlertCircle size={17} /> {integer(report.branchesWithoutStudentData)} فرع بلا طلاب نشطين ضمن بيانات الأكاديمية الحالية.</div>}
        <section className="r1-live-panel"><header><div><h2>ملخص الأكاديمية</h2><p>الأرقام تتغير من الخادم مع تغيير الفرع أو الفترة؛ لا يتم استبدال فشل المصدر بأرقام تجريبية.</p></div><span className="r1-live-badge"><i /> بيانات حية</span></header><Metrics metrics={report.summary} /></section>
        <section className="r1-live-panel"><header><div><h2>التنبيهات التشغيلية</h2><p>تنبيهات مشتقة من مؤشرات الفروع والطلبات المحفوظة؛ لا تُستخدم thresholds تخمينية.</p></div></header>{report.alerts.length === 0 ? <p className="r1-live-empty">لا توجد تنبيهات من القواعد الحالية للفترة والنطاق المختارين.</p> : <div className="r1-live-alert-list">{report.alerts.map((alert, index) => <article key={`${alert.code}-${alert.branchId ?? index}`}><AlertCircle size={16} /><div><strong>{alert.title}</strong><span>{alert.detail}</span></div></article>)}</div>}</section>
        <section className="r1-live-panel"><header><div><h2>مقارنة الفروع</h2><p>مجاميع كل فرع من مصادر البيانات نفسها المستخدمة في الملخص.</p></div></header>{report.branches.length === 0 ? <p className="r1-live-empty">لا توجد فروع في نطاق الأكاديمية بعد.</p> : <div className="r1-live-table-wrap"><table className="r1-live-table"><thead><tr><th>الفرع</th><th>طلاب نشطون</th><th>الحضور</th><th>الجلسات</th><th>التحصيل</th><th>مصروفات معتمدة</th><th>الصافي</th></tr></thead><tbody>{report.branches.map(branch => <tr key={branch.branchId}><th scope="row"><strong>{branch.branchName}</strong><small>{branch.branchCode} · {branch.branchStatus === "ACTIVE" ? "نشط" : "غير نشط"}</small></th><td>{integer(branch.activeStudents)}</td><td>{branch.attendancePercent === null ? "—" : `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 }).format(branch.attendancePercent)}٪`}</td><td>{integer(branch.sessions)} <small>({integer(branch.completedSessions)} مكتملة)</small></td><td>{money(branch.collectedPiastres)}</td><td>{money(branch.approvedExpensesPiastres)}</td><td>{money(branch.netPiastres)}</td></tr>)}</tbody></table></div>}</section>
        <details className="r1-live-sources"><summary>مصادر الأرقام وتعريفها</summary><dl>{Object.entries(report.dataSources).map(([key, source]) => <div key={key}><dt>{key}</dt><dd>{source}</dd></div>)}</dl></details>
      </>}

      <section className="r1-live-panel r1-live-activity-panel"><header><div><h2><Activity size={17} /> سجل التدقيق والقرارات</h2><p>أحداث الأكاديمية وقرارات الموافقات ضمن الفترة والفرع الحاليين.</p></div><button type="button" onClick={retry} aria-label="تحديث سجل التدقيق">تحديث</button></header>
        {activityLoading && <div className="r1-live-activity-state" role="status"><RefreshCw className="r1-live-spin" size={16} /> جارٍ تحميل السجل…</div>}
        {!activityLoading && activityError && <div className="r1-live-warning" role="alert"><AlertCircle size={16} /><span>تعذر تحميل سجل التدقيق: {activityError}</span><button type="button" onClick={retry}>إعادة المحاولة</button></div>}
        {!activityLoading && !activityError && activity.length === 0 && <p className="r1-live-empty">لا توجد أحداث تدقيق أو قرارات مسجلة لهذه الفترة والنطاق.</p>}
        {!activityLoading && !activityError && activity.length > 0 && <div className="r1-live-activity-list">{activity.map(item => <article key={`${item.source}-${item.id}`}><span className={`r1-live-activity-type ${item.source === "DECISION" ? "decision" : "audit"}`}>{item.source === "DECISION" ? "قرار" : "تدقيق"}</span><div><strong>{item.action} · {item.targetType}</strong><small>المستهدف: {item.targetId}{item.state ? ` · الحالة: ${item.state}` : ""}</small>{item.reason && <small>السبب: {item.reason}</small>}<small>بواسطة {item.actorName ?? "system"}</small></div><time>{occurredAt(item.occurredAt)}</time></article>)}</div>}
        <small className="r1-live-audit-source">المصادر: AuditEvents + ApprovalRequests. لا يتم إرجاع metadata أو بيانات الاتصال.</small>
      </section>
      <p className="r1-live-scope-note">بيانات القراءة فقط داخل Tenant الحالي؛ لا تتيح هذه اللوحة إنشاء دفعات أو اعتماد مصروفات.</p>
      </div>
    </main>
  </RoleDashboardShell>;
}
