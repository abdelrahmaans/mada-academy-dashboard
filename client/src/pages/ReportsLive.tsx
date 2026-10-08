import { useEffect, useState, type ReactNode } from "react";
import { Activity, ArrowDownToLine, ArrowLeft, Building2, CircleAlert, Menu, RefreshCw, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import BranchManagerSidebar from "@/components/BranchManagerSidebar";
import R01AcademySidebar from "@/components/R01AcademySidebar";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { apiClient, type AuthMe, type FinanceReport, type OperationalReport } from "@/lib/apiClient";
import "./ReportsLive.css";

export default function ReportsLive({ me }: { me: AuthMe }) {
  const [, navigate] = useLocation();
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [operationalReport, setOperationalReport] = useState<OperationalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isOwner = me.role === "R01_ACADEMY_OWNER";
  const roleCode = isOwner ? "R01" : me.role === "R06_ACCOUNTANT" ? "R06" : "R02";
  const branchName = me.branches?.find(branch => branch.id === me.branchId)?.name ?? "الفرع المصرح به";
  const scopeLabel = isOwner ? "كل فروع الأكاديمية" : branchName;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setReport(null);
    setOperationalReport(null);
    Promise.all([apiClient.financeReport(), apiClient.operationalReport()]).then(([finance, operational]) => {
      if (active) {
        setReport(finance);
        setOperationalReport(operational);
      }
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
      const blob = await apiClient.downloadOperationalReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = isOwner ? "mada-academy-operational-report.csv" : "mada-branch-operational-report.csv";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تصدير التقرير المالي.");
    } finally {
      setExporting(false);
    }
  };

  const money = (piastres: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(piastres / 100);

  return <RoleDashboardShell className="app-shell reports-live-shell" showSessionLogout={false} roleCode={roleCode} roleLabel={me.roleLabel || (isOwner ? "مسؤول الأكاديمية" : "مدير الفرع")} scopeLevel={isOwner ? "tenant" : "branch"} scopeLabel={scopeLabel} tenantName={me.academy?.name} branchName={isOwner ? undefined : branchName} demo={false}>
    {isOwner ? <R01AcademySidebar activePath="/reports" mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /> : <BranchManagerSidebar roleCode={me.role === "R06_ACCOUNTANT" ? "R06" : "R02"} open={mobileOpen} onClose={() => setMobileOpen(false)} />}
    <main className="main-panel">
      {isOwner ? <RoleSurfaceTopbar onMenu={() => setMobileOpen(true)} scopeLabel={scopeLabel} /> : <header className="topbar r02-live-topbar"><div className="topbar-right"><button className="icon-button mobile-menu-button" aria-label="فتح قائمة مدير الفرع" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="r02-live-topbar-scope"><span>{me.academy?.name || "أكاديمية مدى"}</span><small>{scopeLabel} · تقرير مباشر</small></div></div></header>}
      <div className="workspace reports-live-workspace">
        <PageHeader
          className="welcome-row"
          copyClassName="welcome-copy"
          actionsClassName="welcome-actions"
          eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> تقارير تشغيلية · قراءة فقط · بيانات مباشرة</span>}
          title={isOwner ? "التقرير التشغيلي للأكاديمية" : "التقرير التشغيلي للفرع"}
          description="مؤشرات الحصص والطلاب والإيرادات والمصروفات محسوبة مباشرة من بيانات الخادم."
          actions={<>
            <button className="button button-secondary" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}><RefreshCw size={15} /> تحديث</button>
            <button className="button button-primary" onClick={() => void exportCsv()} disabled={exporting || loading}><ArrowDownToLine size={15} /> {exporting ? "جارٍ التصدير…" : "تصدير CSV"}</button>
          </>}
        />
        <RoleScopeCard className="reports-role-scope-card" compact />
        <div className="reports-live-source"><Activity size={14} /> المصدر: API التقارير · النطاق مستمد من جلسة المستخدم ولا يعتمد على أرقام تجريبية.</div>

        {loading && <section className="reports-live-state" role="status"><span className="reports-live-spinner" /> جارٍ تحميل التقرير…</section>}
        {!loading && error && <section className="reports-live-state reports-live-error" role="alert"><strong>تعذر تحميل التقرير</strong><p>{error}</p><button className="button button-secondary" onClick={() => setRefreshKey(k => k + 1)}><RefreshCw size={15} /> إعادة المحاولة</button></section>}
        {!loading && !error && report && operationalReport && <>
          <section className="reports-live-grid" aria-label="مؤشرات التقرير">
            <ReportStat icon={<Wallet size={18} />} label="إجمالي الإيرادات" value={money(report.revenuePiastres)} sub="المبالغ المسجلة" tone="teal" />
            <ReportStat icon={<ArrowLeft size={18} />} label="المصروفات المعتمدة" value={money(report.expensesPiastres)} sub="حسب نطاق الحساب" tone="amber" />
            <ReportStat icon={<Building2 size={18} />} label="صافي التدفق" value={money(report.netPiastres)} sub="الإيرادات - المصروفات" tone="blue" />
            <ReportStat icon={<Activity size={18} />} label="الحصص المنفذة" value={new Intl.NumberFormat("ar-EG").format(operationalReport.sessionsCompleted)} sub="جلسة مكتملة" tone="violet" />
          </section>

          <section className="reports-live-panel">
            <header className="reports-live-panel-header"><div><h2>ملخص تشغيلي</h2><p>{scopeLabel} · الفترة المحسوبة من الخادم</p></div></header>
            <div className="reports-live-summary-rows">
              <div className="reports-live-row"><span>عدد الطلاب النشطين</span><strong>{new Intl.NumberFormat("ar-EG").format(operationalReport.studentsCount)} طالب</strong></div>
              <div className="reports-live-row"><span>نسبة حضور الجلسات</span><strong>{Math.round(operationalReport.attendanceRate)}%</strong></div>
              <div className="reports-live-row"><span>الطلبات المعلقة للاعتماد</span><strong>{new Intl.NumberFormat("ar-EG").format(operationalReport.pendingApprovals)} طلب</strong></div>
            </div>
          </section>
        </>}
      </div>
    </main>
  </RoleDashboardShell>;
}

function ReportStat({ icon, label, value, sub, tone }: { icon: ReactNode; label: string; value: string; sub: string; tone: string }) {
  return <article className={`reports-live-stat reports-live-stat-${tone}`}><span className="reports-live-stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{sub}</em></div></article>;
}
