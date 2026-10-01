import { useEffect, useState, type ReactNode } from "react";
import { Activity, ArrowDownToLine, ArrowLeft, Building2, CircleAlert, RefreshCw, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { apiClient, type AuthMe, type FinanceReport } from "@/lib/apiClient";
import "./ReportsLive.css";

export default function ReportsLive({ me }: { me: AuthMe }) {
  const [, navigate] = useLocation();
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const isOwner = me.role === "R01_ACADEMY_OWNER";
  const roleCode = isOwner ? "R01" : "R02";
  const branchName = me.branches?.find(branch => branch.id === me.branchId)?.name ?? "الفرع المصرح به";
  const scopeLabel = isOwner ? "كل فروع الأكاديمية" : branchName;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setReport(null);
    apiClient.financeReport().then(data => {
      if (active) setReport(data);
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : "تعذر تحميل ملخص المالية.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await apiClient.downloadFinanceReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = isOwner ? "mada-academy-finance-summary.csv" : "mada-branch-finance-summary.csv";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تصدير التقرير المالي.");
    } finally {
      setExporting(false);
    }
  };

  const money = (piastres: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(piastres / 100);

  return <RoleDashboardShell className="app-shell reports-live-shell" roleCode={roleCode} roleLabel={me.roleLabel || (isOwner ? "مسؤول الأكاديمية" : "مدير الفرع")} scopeLevel={isOwner ? "tenant" : "branch"} scopeLabel={scopeLabel} tenantName={me.academy?.name} branchName={isOwner ? undefined : branchName} demo={false}>
    <main className="main-panel">
      <div className="workspace reports-live-workspace">
        <PageHeader
          className="welcome-row"
          copyClassName="welcome-copy"
          actionsClassName="welcome-actions"
          eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> تقارير مالية · قراءة فقط · بيانات مباشرة</span>}
          title={isOwner ? "الملخص المالي للأكاديمية" : "الملخص المالي للفرع"}
          description="إجماليات الحركات المسجلة في قاعدة البيانات حتى الآن؛ لا توجد أرقام تقديرية أو عينات تجريبية في هذا العرض."
          actions={<><button className="button button-secondary" onClick={() => setRefreshKey(value => value + 1)} disabled={loading}><RefreshCw size={15} /> تحديث</button><button className="button button-secondary" onClick={() => void exportCsv()} disabled={loading || exporting || !report}><ArrowDownToLine size={15} /> {exporting ? "جارٍ التصدير…" : "تصدير CSV"}</button></>}
        />
        <RoleScopeCard className="reports-live-scope-card" />
        <div className="reports-live-policy"><Wallet size={15} /> قراءة مالية فقط ضمن النطاق الممنوح؛ تسجيل التحصيل وتعديل الفواتير غير متاحين لهذا الدور.</div>

        {loading && <section className="reports-live-state" role="status"><span className="reports-live-spinner" /> جارٍ تحميل التقرير المالي…</section>}
        {!loading && error && <section className="reports-live-state reports-live-error" role="alert"><CircleAlert size={22} /><strong>تعذر تحميل التقرير المالي</strong><p>{error}</p><span>لم نعرض أرقامًا تجريبية. تحقق من الاتصال والصلاحية ثم أعد المحاولة.</span><button className="button button-secondary" onClick={() => setRefreshKey(value => value + 1)}><RefreshCw size={15} /> إعادة المحاولة</button></section>}
        {!loading && !error && report && <>
          <section className="reports-live-stat-grid" aria-label="المؤشرات المالية المسجلة">
            <FinanceStat icon={<Activity size={18} />} label="إجمالي الفواتير" value={money(report.totalBilledPiastres)} tone="blue" />
            <FinanceStat icon={<Wallet size={18} />} label="التحصيل المسجل" value={money(report.totalCollectedPiastres)} tone="teal" />
            <FinanceStat icon={<CircleAlert size={18} />} label="المتبقي على الفواتير" value={money(report.totalOutstandingPiastres)} tone="amber" />
            <FinanceStat icon={<Building2 size={18} />} label="المصروفات المعتمدة" value={money(report.approvedExpensesPiastres)} tone="violet" />
            <FinanceStat icon={<Activity size={18} />} label="الصافي بعد المصروفات" value={money(report.netPiastres)} tone="navy" />
          </section>
          <section className="reports-live-table-panel">
            <div className="reports-live-table-heading"><div><h2>{isOwner ? "تفصيل الفروع" : "حركة الفرع"}</h2><p>{scopeLabel} · البيانات مجمعة من الفواتير والمدفوعات والمصروفات المعتمدة</p></div><span>{report.branches.length} {isOwner ? "فروع" : "فرع"}</span></div>
            {report.branches.length === 0 ? <div className="reports-live-empty">لا توجد حركات مالية مسجلة ضمن هذا النطاق حتى الآن.</div> : <div className="reports-live-table-wrap"><table><thead><tr><th>الفرع</th><th>عدد الفواتير</th><th>التحصيل</th><th>مصروفات معتمدة</th><th>الصافي</th></tr></thead><tbody>{report.branches.map(branch => <tr key={branch.branchId}><td><strong>{branch.branchName}</strong></td><td>{new Intl.NumberFormat("ar-EG").format(branch.invoiceCount)}</td><td>{money(branch.collectedPiastres)}</td><td>{money(branch.approvedExpensesPiastres)}</td><td><strong>{money(branch.netPiastres)}</strong></td></tr>)}</tbody></table></div>}
          </section>
          <section className="reports-live-actions" aria-label="روابط تشغيلية"><button onClick={() => navigate(isOwner ? "/executive-dashboard" : "/")}><Activity size={17} /><span>العودة إلى لوحة الدور</span><ArrowLeft size={15} /></button><button onClick={() => navigate("/approvals")}><Wallet size={17} /><span>مراجعة طلبات المصروفات</span><ArrowLeft size={15} /></button></section>
        </>}
      </div>
    </main>
  </RoleDashboardShell>;
}

function FinanceStat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return <article className={`reports-live-stat reports-live-stat-${tone}`}><span>{icon}</span><small>{label}</small><strong>{value}</strong></article>;
}
