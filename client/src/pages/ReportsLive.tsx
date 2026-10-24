import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  CircleAlert,
  Database,
  GraduationCap,
  Menu,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import {
  apiClient,
  type AuthMe,
  type CourseProfitabilityItem,
  type FinanceExpense,
  type FinanceReport,
  type InstructorScorecardItem,
  type OperationalReport,
  type RetentionRadarResponse,
} from "@/lib/apiClient";
import { getRoleHomePath } from "@/lib/roleNavigation";
import { type ReportsTab } from "./ReportsLiveTypes";
import { ReportsOverviewTab } from "@/components/reports/ReportsOverviewTab";
import { ReportsExpensesTab } from "@/components/reports/ReportsExpensesTab";
import { ReportsRetentionRadarTab } from "@/components/reports/ReportsRetentionRadarTab";
import { ReportsCoursesTab } from "@/components/reports/ReportsCoursesTab";
import { ReportsInstructorsTab } from "@/components/reports/ReportsInstructorsTab";
import "./ReportsLive.css";

export default function ReportsLive({ me }: { me: AuthMe }) {
  const [, navigate] = useLocation();
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [operationalReport, setOperationalReport] = useState<OperationalReport | null>(null);
  const [radar, setRadar] = useState<RetentionRadarResponse | null>(null);
  const [scorecards, setScorecards] = useState<InstructorScorecardItem[] | null>(null);
  const [profitability, setProfitability] = useState<CourseProfitabilityItem[] | null>(null);
  const [expenses, setExpenses] = useState<FinanceExpense[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingBi, setExportingBi] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOwner = me.role === "R01_ACADEMY_OWNER";
  const isAccountant = me.role === "R06_ACCOUNTANT" || me.role?.startsWith("R06");
  const roleCode = isOwner ? "R01" : isAccountant ? "R06" : "R02";
  const branchName = me.branches?.find(branch => branch.id === me.branchId)?.name ?? "الفرع المصرح به";
  const scopeLabel = isOwner ? "كل فروع الأكاديمية" : branchName;

  const [activeTab, setActiveTab] = useState<ReportsTab>(
    "overview"
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setReport(null);
    setOperationalReport(null);
    setRadar(null);
    setScorecards(null);
    setProfitability(null);
    setExpenses(null);

    Promise.all([
      apiClient.financeReport(isOwner ? {} : { branchId: me.branchId ?? undefined }),
      isAccountant ? Promise.resolve(null) : apiClient.operationalReport().catch(() => null),
      isAccountant
        ? apiClient.financeExpenses(isOwner ? {} : { branchId: me.branchId ?? undefined }).catch(() => null)
        : Promise.resolve(null),
      apiClient.courseProfitability(isOwner ? undefined : me.branchId ?? undefined).catch(() => null),
      isAccountant ? Promise.resolve(null) : apiClient.retentionRadar(isOwner ? undefined : me.branchId ?? undefined).catch(() => null),
      isAccountant ? Promise.resolve(null) : apiClient.instructorScorecard(isOwner ? undefined : me.branchId ?? undefined).catch(() => null),
    ])
      .then(([finance, operational, expensesData, courseData, radarData, instData]) => {
        if (active) {
          setReport(finance);
          setOperationalReport(operational);
          setExpenses(expensesData?.items ?? null);
          setProfitability(courseData);
          setRadar(radarData);
          setScorecards(instData);
        }
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : "تعذر تحميل التقارير المباشرة.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, isOwner, isAccountant, me.branchId]);

  // Calculations for Expense Breakdown
  const expenseAnalytics = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        totalPiastres: 0,
        approvedPiastres: 0,
        pendingPiastres: 0,
        rejectedPiastres: 0,
        categories: [] as Array<{
          category: string;
          totalPiastres: number;
          count: number;
          percent: number;
        }>,
      };
    }

    let total = 0;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    const catMap: Record<string, { totalPiastres: number; count: number }> = {};

    for (const exp of expenses) {
      const amt = exp.amountPiastres || 0;
      total += amt;
      const st = exp.status?.toLowerCase();
      if (st === "approved") approved += amt;
      else if (st === "rejected") rejected += amt;
      else pending += amt;

      const cat = exp.category || "عام ومصروفات أخرى";
      if (!catMap[cat]) {
        catMap[cat] = { totalPiastres: 0, count: 0 };
      }
      catMap[cat].totalPiastres += amt;
      catMap[cat].count += 1;
    }

    const categories = Object.entries(catMap)
      .map(([category, val]) => ({
        category,
        totalPiastres: val.totalPiastres,
        count: val.count,
        percent: total > 0 ? Math.round((val.totalPiastres / total) * 100) : 0,
      }))
      .sort((a, b) => b.totalPiastres - a.totalPiastres);

    return {
      totalPiastres: total,
      approvedPiastres: approved,
      pendingPiastres: pending,
      rejectedPiastres: rejected,
      categories,
    };
  }, [expenses]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = isAccountant
        ? await apiClient.downloadFinanceReport(isOwner ? {} : { branchId: me.branchId ?? undefined })
        : await apiClient.downloadOperationalReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = isAccountant
        ? `mada-financial-report-${new Date().toISOString().slice(0, 10)}.csv`
        : isOwner
        ? "mada-academy-operational-report.csv"
        : "mada-branch-operational-report.csv";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تصدير التقرير.");
    } finally {
      setExporting(false);
    }
  };

  const exportBiCsv = async () => {
    setExportingBi(true);
    try {
      const blob = await apiClient.downloadBiFeed(isOwner ? undefined : me.branchId ?? undefined);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mada-finance-bi-feed-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تصدير بيانات BI.");
    } finally {
      setExportingBi(false);
    }
  };

  const money = (piastres: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(piastres / 100);

  return (
    <RoleDashboardShell
      className="app-shell reports-live-shell"
      showSessionLogout={false}
      roleCode={roleCode}
      roleLabel={me.roleLabel || (isOwner ? "مسؤول الأكاديمية" : isAccountant ? "المحاسب" : "مدير الفرع")}
      scopeLevel={isOwner ? "tenant" : "branch"}
      scopeLabel={scopeLabel}
      tenantName={me.academy?.name}
      branchName={isOwner ? undefined : branchName}
      demo={false}
      mobileOpen={mobileOpen}
      onCloseMobile={() => setMobileOpen(false)}
    >
      <main className="main-panel">
        {isOwner ? (
          <RoleSurfaceTopbar onMenu={() => setMobileOpen(true)} scopeLabel={scopeLabel} />
        ) : (
          <header className="topbar r02-live-topbar">
            <div className="topbar-right">
              <button
                className="icon-button mobile-menu-button"
                aria-label="فتح القائمة"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={21} />
              </button>
              <div className="r02-live-topbar-scope">
                <span>{me.academy?.name || "أكاديمية مدى"}</span>
                <small>{scopeLabel} · التقارير والتحليلات</small>
              </div>
            </div>
          </header>
        )}

        <div className="workspace reports-live-workspace">
          <PageHeader
            className="welcome-row"
            copyClassName="welcome-copy"
            actionsClassName="welcome-actions"
            eyebrow={
              <span className="eyebrow">
                <i className="eyebrow-dot" />{" "}
                {isAccountant
                  ? `التقارير المالية المجمعة · ${roleCode}`
                  : "تحليلات متقدمة · قراءة تشغيلية ومحلل BI"}
              </span>
            }
            title={
              isAccountant
                ? "التقارير المالية المجمعة وتدفقات المصروفات"
                : isOwner
                ? "مركز التقارير والتحليلات التنفيذية"
                : "التقارير الميدانية والتحليلات"
            }
            description={
              isAccountant
                ? "كشف حركات التحصيل ومطابقة سندات القبض، تصنيف وتحليل بنود المصروفات، وربحية المسارات التدريبية."
                : "بيانات الطلاب والحضور والتقييمات والفواتير والمصروفات مسمعة لحظياً بدون انفصال بين الفروع أو شاشات المتابعة."
            }
            actions={
              <>
                <button
                  className="button button-secondary"
                  onClick={() => setRefreshKey(v => v + 1)}
                  disabled={loading}
                >
                  <RefreshCw size={15} /> تحديث
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => void exportCsv()}
                  disabled={loading || exporting || !report}
                >
                  <ArrowDownToLine size={15} />{" "}
                  {exporting
                    ? "جارٍ التصدير…"
                    : isAccountant
                    ? "تصدير التقرير المالي (CSV)"
                    : "تصدير CSV تشغيلي"}
                </button>
                <button
                  className="button button-primary"
                  onClick={() => void exportBiCsv()}
                  disabled={loading || exportingBi}
                >
                  <Database size={15} /> {exportingBi ? "جارٍ التجهيز…" : "تصدير داتا المحلل (BI Feed)"}
                </button>
              </>
            }
          />

          <RoleScopeCard className="reports-live-scope-card" />

          {/* Navigation Tabs */}
          <nav className="reports-live-nav-tabs" aria-label="أقسام التقارير">
            <button
              className={`reports-live-nav-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <Activity size={16} />{" "}
              {isAccountant ? "المركز المالي وتدفق الفروع" : "نظرة عامة تشغيلية ومالية"}
            </button>

            {isAccountant ? (
              <button
                className={`reports-live-nav-btn ${activeTab === "expenses" ? "active" : ""}`}
                onClick={() => setActiveTab("expenses")}
              >
                <TrendingDown size={16} /> تحليل وبنود المصروفات
                {expenses && expenses.length > 0 && (
                  <span className="radar-badge-pulse" style={{ background: "#0d9488" }}>
                    {expenses.length}
                  </span>
                )}
              </button>
            ) : (
              <button
                className={`reports-live-nav-btn ${activeTab === "radar" ? "active" : ""}`}
                onClick={() => setActiveTab("radar")}
              >
                <ShieldAlert size={16} /> رادار منع تسرب الطلاب
                {radar && radar.summary.highRiskCount > 0 && (
                  <span className="radar-badge-pulse">{radar.summary.highRiskCount}</span>
                )}
              </button>
            )}

            <button
              className={`reports-live-nav-btn ${activeTab === "courses" ? "active" : ""}`}
              onClick={() => setActiveTab("courses")}
            >
              <Building2 size={16} />{" "}
              {isAccountant ? "ربحية المسارات والكورسات" : "ربحية المسارات والقاعات"}
            </button>

            {!isAccountant && (
              <button
                className={`reports-live-nav-btn ${activeTab === "instructors" ? "active" : ""}`}
                onClick={() => setActiveTab("instructors")}
              >
                <GraduationCap size={16} /> بطاقة أداء المدربين
              </button>
            )}
          </nav>

          {loading && (
            <section className="reports-live-state" role="status">
              <span className="reports-live-spinner" /> جارٍ تحميل ومزامنة التقارير المالية…
            </section>
          )}

          {!loading && error && (
            <section className="reports-live-state reports-live-error" role="alert">
              <CircleAlert size={22} />
              <strong>تعذر تحميل التقرير</strong>
              <p>{error}</p>
              <span>تحقق من الاتصال بقاعدة البيانات ثم أعد المحاولة.</span>
              <button className="button button-secondary" onClick={() => setRefreshKey(v => v + 1)}>
                <RefreshCw size={15} /> إعادة المحاولة
              </button>
            </section>
          )}

          {!loading && !error && (
            <>
              {/* TAB 1: OVERVIEW & FINANCIAL POSITION */}
              {activeTab === "overview" && report && (
                <ReportsOverviewTab
                  report={report}
                  operationalReport={operationalReport}
                  isAccountant={isAccountant}
                  isOwner={isOwner}
                  scopeLabel={scopeLabel}
                  money={money}
                />
              )}

              {/* TAB 2 (ACCOUNTANT ONLY): EXPENSES BREAKDOWN */}
              {isAccountant && activeTab === "expenses" && (
                <ReportsExpensesTab
                  expenses={expenses}
                  expenseAnalytics={expenseAnalytics}
                  money={money}
                  onExportCsv={() => void exportCsv()}
                />
              )}

              {/* TAB 2 (OWNER / BRANCH MANAGER ONLY): RETENTION RADAR */}
              {!isAccountant && activeTab === "radar" && (
                <ReportsRetentionRadarTab
                  radar={radar}
                  money={money}
                  onExportBiCsv={() => void exportBiCsv()}
                />
              )}

              {/* TAB 3: COURSE PROFITABILITY */}
              {activeTab === "courses" && (
                <ReportsCoursesTab
                  profitability={profitability}
                  isAccountant={isAccountant}
                  money={money}
                />
              )}

              {/* TAB 4 (OWNER / BRANCH MANAGER ONLY): INSTRUCTOR SCORECARDS */}
              {!isAccountant && activeTab === "instructors" && (
                <ReportsInstructorsTab scorecards={scorecards} />
              )}

              {/* Bottom Quick Links */}
              <section className="reports-live-actions" aria-label="روابط سريعة">
                <button
                  onClick={() => navigate(isAccountant ? "/finance-desk" : getRoleHomePath(roleCode))}
                >
                  <Activity size={17} />
                  <span>{isAccountant ? "العودة إلى المكتب المالي" : "العودة إلى لوحة الدور"}</span>
                  <ArrowLeft size={15} />
                </button>
                <button
                  onClick={() => navigate(isAccountant ? "/finance-desk#expenses" : "/approvals")}
                >
                  <Wallet size={17} />
                  <span>{isAccountant ? "إدارة واعتماد بنود المصروفات" : "مراجعة طلبات المصروفات"}</span>
                  <ArrowLeft size={15} />
                </button>
              </section>
            </>
          )}
        </div>
      </main>
    </RoleDashboardShell>
  );
}

