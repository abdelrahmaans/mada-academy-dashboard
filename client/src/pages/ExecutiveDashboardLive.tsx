import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CalendarDays, CheckCircle2, GraduationCap, RefreshCw, Users, Wallet } from "lucide-react";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import { apiClient, type ExecutiveDashboardReport, type ExecutiveMetrics } from "@/lib/apiClient";
import "./ExecutiveDashboardLive.css";

type PeriodOffset = 0 | -1 | -2;

function periodRange(offset: PeriodOffset) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const end = offset === 0
    ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
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
  return <article className={`r1-live-kpi r1-live-kpi-${tone}`}><span className="r1-live-kpi-icon">{icon}</span><div><small>{title}</small><strong>{value}</strong><span>{caption}</span></div></article>;
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

export default function ExecutiveDashboardLive() {
  const [branchId, setBranchId] = useState("ALL");
  const [period, setPeriod] = useState<PeriodOffset>(0);
  const [report, setReport] = useState<ExecutiveDashboardReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const range = useMemo(() => periodRange(period), [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setReport(null);
    apiClient.executiveSummary({ from: range.from, to: range.to, branchId: branchId === "ALL" ? undefined : branchId })
      .then(result => { if (!cancelled) setReport(result); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : "تعذر تحميل التقرير التنفيذي من الخادم."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [branchId, range.from, range.to, retryKey]);

  const selectedBranchName = branchId === "ALL"
    ? "كل الفروع"
    : report?.availableBranches.find(branch => branch.id === branchId)?.name ?? "الفرع المحدد";

  return <RoleDashboardShell className="app-shell executive-dashboard-shell r1-live-shell" roleCode="R01" roleLabel="مسؤول الأكاديمية" scopeLevel="tenant" scopeLabel="كل فروع الأكاديمية" tenantName="الأكاديمية الحالية" branchName={selectedBranchName}>
    <main className="r1-live-page" dir="rtl">
      <PageHeader className="welcome-row" eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> الإدارة التنفيذية · R01 · LIVE</span>} title="لوحة الإدارة التنفيذية" description="مؤشرات تشغيلية ومالية للقراءة فقط، محسوبة من بيانات الأكاديمية ضمن الفرع والفترة المختارين." />
      <RoleScopeCard className="executive-scope-card" />
      <section className="r1-live-controls" aria-label="تصفية التقرير التنفيذي">
        <label><span><Building2 size={16} /> الفرع</span><select value={branchId} onChange={event => setBranchId(event.target.value)}><option value="ALL">كل الفروع</option>{report?.availableBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}{branch.status !== "ACTIVE" ? " · غير نشط" : ""}</option>)}</select></label>
        <label><span><CalendarDays size={16} /> الفترة</span><select value={period} onChange={event => setPeriod(Number(event.target.value) as PeriodOffset)}><option value={0}>{periodRange(0).label} · حتى اليوم</option><option value={-1}>{periodRange(-1).label}</option><option value={-2}>{periodRange(-2).label}</option></select></label>
        <span className="r1-live-period">{range.from} — {range.to}</span>
      </section>

      {loading && <section className="r1-live-state" role="status"><RefreshCw className="r1-live-spin" size={20} /> جارٍ جلب مؤشرات التقرير من الخادم…</section>}
      {!loading && error && <section className="r1-live-state r1-live-error" role="alert"><AlertCircle size={20} /><div><strong>تعذر تحميل مؤشرات R01</strong><span>{error}</span><button type="button" onClick={() => setRetryKey(value => value + 1)}>إعادة المحاولة</button></div></section>}
      {!loading && report && <>
        {report.branchesWithoutStudentData > 0 && <div className="r1-live-warning" role="status"><AlertCircle size={17} /> {integer(report.branchesWithoutStudentData)} فرع بلا طلاب نشطين في البيانات المحفوظة لهذه الفترة/النطاق.</div>}
        <section className="r1-live-panel"><header><div><h2>ملخص الأكاديمية</h2><p>الأرقام تتغير من الخادم مع تغيير الفرع أو الفترة؛ لا يتم استبدال فشل المصدر بأرقام تجريبية.</p></div><span className="r1-live-badge"><i /> بيانات حية</span></header><Metrics metrics={report.summary} /></section>
        <section className="r1-live-panel"><header><div><h2>مقارنة الفروع</h2><p>مجاميع كل فرع من مصادر البيانات نفسها المستخدمة في الملخص.</p></div></header>
          {report.branches.length === 0 ? <p className="r1-live-empty">لا توجد فروع في نطاق الأكاديمية بعد.</p> : <div className="r1-live-table-wrap"><table className="r1-live-table"><thead><tr><th>الفرع</th><th>طلاب نشطون</th><th>الحضور</th><th>الجلسات</th><th>التحصيل</th><th>مصروفات معتمدة</th><th>الصافي</th></tr></thead><tbody>{report.branches.map(branch => <tr key={branch.branchId}><th scope="row"><strong>{branch.branchName}</strong><small>{branch.branchCode} · {branch.branchStatus === "ACTIVE" ? "نشط" : "غير نشط"}</small></th><td>{integer(branch.activeStudents)}</td><td>{branch.attendancePercent === null ? "—" : `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 }).format(branch.attendancePercent)}٪`}</td><td>{integer(branch.sessions)} <small>({integer(branch.completedSessions)} مكتملة)</small></td><td>{money(branch.collectedPiastres)}</td><td>{money(branch.approvedExpensesPiastres)}</td><td>{money(branch.netPiastres)}</td></tr>)}</tbody></table></div>}
        </section>
        <details className="r1-live-sources"><summary>مصادر الأرقام وتعريفها</summary><dl>{Object.entries(report.dataSources).map(([key, source]) => <div key={key}><dt>{key}</dt><dd>{source}</dd></div>)}</dl></details>
        <p className="r1-live-scope-note">نطاق البيانات: Tenant الحالي فقط. لا توفر هذه الشريحة بعد لوحة التنبيهات أو سجل القرار المجمع أو تقارير Leads والدعم؛ لن تعرض بيانات ثابتة مكانها.</p>
      </>}
    </main>
  </RoleDashboardShell>;
}
