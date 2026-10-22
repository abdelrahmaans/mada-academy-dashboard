import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  CircleAlert,
  Database,
  FileSpreadsheet,
  GraduationCap,
  Menu,
  Paperclip,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  Users,
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

  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "radar" | "courses" | "instructors">(
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
                <>
                  {!isAccountant && operationalReport && (
                    <>
                      <section className="reports-live-stat-grid" aria-label="المؤشرات التشغيلية المسجلة">
                        <FinanceStat
                          icon={<Users size={18} />}
                          label="الطلاب النشطون"
                          value={new Intl.NumberFormat("en-US").format(operationalReport.activeStudents)}
                          tone="blue"
                        />
                        <FinanceStat
                          icon={<Activity size={18} />}
                          label="التسجيلات النشطة"
                          value={new Intl.NumberFormat("en-US").format(operationalReport.activeEnrollments)}
                          tone="teal"
                        />
                        <FinanceStat
                          icon={<Activity size={18} />}
                          label="نسبة الحضور"
                          value={operationalReport.attendancePercent === null ? "—" : `${operationalReport.attendancePercent}%`}
                          tone="violet"
                        />
                        <FinanceStat
                          icon={<CircleAlert size={18} />}
                          label="إثباتات ناقصة"
                          value={new Intl.NumberFormat("en-US").format(operationalReport.paymentsMissingEvidence)}
                          tone="amber"
                        />
                        <FinanceStat
                          icon={<Wallet size={18} />}
                          label="مصروفات معلقة"
                          value={new Intl.NumberFormat("en-US").format(operationalReport.pendingExpenses)}
                          tone="navy"
                        />
                      </section>

                      <section className="reports-live-policy">
                        <Activity size={15} /> الجلسات: {operationalReport.sessions} · المكتملة:{" "}
                        {operationalReport.completedSessions} · الفواتير: {operationalReport.invoiceCount} ·
                        التحصيل المسجل: {money(operationalReport.totalCollectedPiastres)} · المتبقي:{" "}
                        {money(operationalReport.totalOutstandingPiastres)}
                      </section>
                    </>
                  )}

                  {/* Financial KPIs - Always visible, prioritized for Accountant */}
                  <section className="reports-live-stat-grid" aria-label="المؤشرات المالية المسجلة">
                    <FinanceStat
                      icon={<Activity size={18} />}
                      label="إجمالي الفواتير الصادرة"
                      value={money(report.totalBilledPiastres)}
                      tone="blue"
                    />
                    <FinanceStat
                      icon={<Wallet size={18} />}
                      label="التحصيل المسجل المقبوض"
                      value={money(report.totalCollectedPiastres)}
                      tone="teal"
                    />
                    <FinanceStat
                      icon={<CircleAlert size={18} />}
                      label="المتبقي على الفواتير"
                      value={money(report.totalOutstandingPiastres)}
                      tone="amber"
                    />
                    <FinanceStat
                      icon={<Building2 size={18} />}
                      label="المصروفات المعتمدة"
                      value={money(report.approvedExpensesPiastres)}
                      tone="violet"
                    />
                    <FinanceStat
                      icon={<Activity size={18} />}
                      label="الصافي بعد المصروفات"
                      value={money(report.netPiastres)}
                      tone="navy"
                    />
                  </section>

                  <section className="reports-live-table-panel">
                    <div className="reports-live-table-heading">
                      <div>
                        <h2>{isOwner ? "تفصيل الفروع والقوائم المالية الموحدة" : "حركة الفرع المالية"}</h2>
                        <p>{scopeLabel} · البيانات مجمعة من الفواتير وسندات القبض والمصروفات المعتمدة</p>
                      </div>
                      <span>{report.branches.length} {isOwner ? "فروع" : "فرع"}</span>
                    </div>
                    {report.branches.length === 0 ? (
                      <div className="reports-live-empty">لا توجد حركات مالية مسجلة ضمن هذا النطاق حتى الآن.</div>
                    ) : (
                      <div className="reports-live-table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>الفرع</th>
                              <th>عدد الفواتير</th>
                              <th>إجمالي التحصيل</th>
                              <th>مصروفات معتمدة</th>
                              <th>الصافي المالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.branches.map(branch => (
                              <tr key={branch.branchId}>
                                <td>
                                  <strong>{branch.branchName}</strong>
                                </td>
                                <td>{new Intl.NumberFormat("en-US").format(branch.invoiceCount)}</td>
                                <td>{money(branch.collectedPiastres)}</td>
                                <td>{money(branch.approvedExpensesPiastres)}</td>
                                <td>
                                  <strong style={{ color: branch.netPiastres >= 0 ? "#0f766e" : "#b91c1c" }}>
                                    {money(branch.netPiastres)}
                                  </strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* TAB 2 (ACCOUNTANT ONLY): EXPENSES BREAKDOWN */}
              {isAccountant && activeTab === "expenses" && (
                <section className="reports-live-expenses-section">
                  {/* Summary Strip */}
                  <div className="expenses-summary-strip">
                    <div className="radar-pill">
                      <span>إجمالي المصروفات المسجلة</span>
                      <strong>{money(expenseAnalytics.totalPiastres)}</strong>
                    </div>
                    <div className="radar-pill radar-pill-low">
                      <span>مصروفات معتمدة للصرف</span>
                      <strong>{money(expenseAnalytics.approvedPiastres)}</strong>
                    </div>
                    <div className="radar-pill radar-pill-medium">
                      <span>بانتظار المراجعة والاعتماد</span>
                      <strong>{money(expenseAnalytics.pendingPiastres)}</strong>
                    </div>
                    <div className="radar-pill radar-pill-high">
                      <span>مصروفات مرفوضة ومستبعدة</span>
                      <strong>{money(expenseAnalytics.rejectedPiastres)}</strong>
                    </div>
                  </div>

                  {/* Category Breakdown Cards */}
                  <div className="reports-live-table-panel" style={{ marginBottom: 16 }}>
                    <div className="reports-live-table-heading">
                      <div>
                        <h2>توزيع المصروفات حسب التصنيف والبنود التشغيلية</h2>
                        <p>بيان بحصص ومبالغ الصرف لكل بند ونسبتها المئوية من إجمالي المصروفات</p>
                      </div>
                      <span>{expenseAnalytics.categories.length} تصنيفات</span>
                    </div>

                    <div style={{ padding: 18 }}>
                      <div className="expenses-category-grid">
                        {expenseAnalytics.categories.map(cat => (
                          <div key={cat.category} className="expenses-category-card">
                            <div className="expenses-category-card-top">
                              <span className="expenses-category-name">{cat.category}</span>
                              <span className="expenses-category-count">{cat.count} بنود</span>
                            </div>
                            <div className="expenses-category-amount">{money(cat.totalPiastres)}</div>
                            <div className="expenses-category-bar-bg">
                              <div
                                className="expenses-category-bar-fill"
                                style={{ width: `${Math.min(100, Math.max(5, cat.percent))}%` }}
                              />
                            </div>
                            <div className="expenses-category-percent">
                              <span>حصة الصرف من الإجمالي</span>
                              <strong>{cat.percent}%</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expenses Detail Table */}
                  <div className="reports-live-table-panel">
                    <div className="reports-live-table-heading">
                      <div>
                        <h2>سجل بنود المصروفات وحالة الاعتماد وسندات الصرف</h2>
                        <p>تفاصيل عمليات الصرف المسجلة ومستندات الإثبات وتاريخ الصرف</p>
                      </div>
                      <button className="button button-secondary button-sm" onClick={() => void exportCsv()}>
                        <FileSpreadsheet size={14} /> تصدير إكسيل المصروفات
                      </button>
                    </div>

                    {!expenses || expenses.length === 0 ? (
                      <div className="reports-live-empty">لا توجد بنود مصروفات مسجلة ضمن هذا النطاق.</div>
                    ) : (
                      <div className="reports-live-table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>البند / الوصف</th>
                              <th>التصنيف</th>
                              <th>الفرع</th>
                              <th>التاريخ</th>
                              <th>المبلغ</th>
                              <th>حالة الاعتماد</th>
                              <th>إثبات الصرف</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.map(exp => {
                              const st = exp.status?.toLowerCase();
                              return (
                                <tr key={exp.id}>
                                  <td>
                                    <strong>{exp.description}</strong>
                                    {exp.approvalReason && (
                                      <small style={{ display: "block", color: "#64748b", marginTop: 2 }}>
                                        ملاحظة: {exp.approvalReason}
                                      </small>
                                    )}
                                  </td>
                                  <td>
                                    <span className="tag-pill">{exp.category || "عام"}</span>
                                  </td>
                                  <td>{exp.branchName || "الفرع المصرح"}</td>
                                  <td>{exp.spentOn || exp.createdAt?.slice(0, 10) || "—"}</td>
                                  <td>
                                    <strong>{money(exp.amountPiastres)}</strong>
                                  </td>
                                  <td>
                                    <span
                                      className={`risk-tag ${
                                        st === "approved"
                                          ? "risk-tag-low"
                                          : st === "rejected"
                                          ? "risk-tag-high"
                                          : "risk-tag-medium"
                                      }`}
                                    >
                                      {st === "approved"
                                        ? "معتمد للصرف ✅"
                                        : st === "rejected"
                                        ? "مرفوض ❌"
                                        : "قيد المراجعة ⏳"}
                                    </span>
                                  </td>
                                  <td>
                                    {exp.evidenceStatus === "ATTACHED" ? (
                                      <span
                                        style={{
                                          color: "#0f766e",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                      >
                                        <Paperclip size={12} /> مرفق سند
                                      </span>
                                    ) : (
                                      <span style={{ color: "#94a3b8", fontSize: 11 }}>بدون إثبات</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* TAB 2 (OWNER / BRANCH MANAGER ONLY): RETENTION RADAR */}
              {!isAccountant && activeTab === "radar" && (
                <section className="reports-live-radar-section">
                  {radar ? (
                    <>
                      <div className="radar-summary-strip">
                        <div className="radar-pill radar-pill-total">
                          <span>إجمالي الطلاب</span>
                          <strong>{radar.summary.totalStudents}</strong>
                        </div>
                        <div className="radar-pill radar-pill-high">
                          <span>خطر تسرب مرتفع (عاجل)</span>
                          <strong>{radar.summary.highRiskCount}</strong>
                        </div>
                        <div className="radar-pill radar-pill-medium">
                          <span>قيد المتابعة الدورية</span>
                          <strong>{radar.summary.mediumRiskCount}</strong>
                        </div>
                        <div className="radar-pill radar-pill-low">
                          <span>سجل منتظم ومستقر</span>
                          <strong>{radar.summary.lowRiskCount}</strong>
                        </div>
                        <div className="radar-pill radar-pill-percent">
                          <span>نسبة المعرضين للخطر</span>
                          <strong>{radar.summary.atRiskPercent}%</strong>
                        </div>
                      </div>

                      <div className="reports-live-table-panel">
                        <div className="reports-live-table-heading">
                          <div>
                            <h2>قائمة الطلاب ومؤشر خطورة التسرب (Churn Radar)</h2>
                            <p>تقييم مركب يعتمد على: تتابع الغياب، انخفاض درجات التقييم، وتأخر سداد الفواتير لأكثر من 14 يوماً.</p>
                          </div>
                          <button className="button button-secondary button-sm" onClick={() => void exportBiCsv()}>
                            <FileSpreadsheet size={14} /> تصدير إكسيل التحليل
                          </button>
                        </div>
                        <div className="reports-live-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>اسم الطالب</th>
                                <th>الفرع</th>
                                <th>المسار / الكورس</th>
                                <th>نسبة الحضور</th>
                                <th>غياب متتالي</th>
                                <th>متوسط التقييم</th>
                                <th>المتبقي المالي</th>
                                <th>تأخر السداد</th>
                                <th>مستوى الخطر</th>
                                <th>التوصية التنفيذية</th>
                              </tr>
                            </thead>
                            <tbody>
                              {radar.items.map(item => (
                                <tr key={item.studentId} className={`radar-row-${item.riskLevel.toLowerCase()}`}>
                                  <td>
                                    <strong>{item.fullName}</strong>
                                  </td>
                                  <td>{item.branchName}</td>
                                  <td>{item.courseName}</td>
                                  <td>
                                    <span
                                      className={`badge-attendance ${
                                        item.attendancePercent < 75 ? "badge-danger" : "badge-success"
                                      }`}
                                    >
                                      {item.attendancePercent}%
                                    </span>
                                  </td>
                                  <td>
                                    {item.consecutiveAbsences > 0 ? (
                                      <strong className="text-danger">{item.consecutiveAbsences} جلسات</strong>
                                    ) : (
                                      <span className="text-muted">0</span>
                                    )}
                                  </td>
                                  <td>{item.averageScore !== null ? `${item.averageScore} / 100` : "—"}</td>
                                  <td>{money(item.outstandingPiastres)}</td>
                                  <td>
                                    {item.maxOverdueDays > 0 ? (
                                      <span className="text-danger">{item.maxOverdueDays} يوم</span>
                                    ) : (
                                      <span className="text-muted">مُنتظم</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`risk-tag risk-tag-${item.riskLevel.toLowerCase()}`}>
                                      {item.riskLevel === "HIGH"
                                        ? "خطر مرتفع ⚠️"
                                        : item.riskLevel === "MEDIUM"
                                        ? "متابعة دورية ⏳"
                                        : "مستقر آمن ✅"}
                                    </span>
                                  </td>
                                  <td className="radar-action-cell">
                                    <small>{item.recommendedAction}</small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="reports-live-empty">لا توجد بيانات حضور أو تقييمات كافية لبناء الرادار حالياً.</div>
                  )}
                </section>
              )}

              {/* TAB 3: COURSE PROFITABILITY */}
              {activeTab === "courses" && (
                <section className="reports-live-table-panel">
                  <div className="reports-live-table-heading">
                    <div>
                      <h2>{isAccountant ? "ربحية المسارات التدريبية والإيرادات" : "مؤشر ربحية المسارات ونسبة إشغال القاعات"}</h2>
                      <p>
                        {isAccountant
                          ? "مقارنة المبالغ المفوترة والمحصلة والمتبقي لكل مسار تدريبي مع نسب إشغال المقاعد."
                          : "يقارن عدد الطلاب المسجلين بالسعة القصوى، والمتحصلات الصافية لكل مجموعة."}
                      </p>
                    </div>
                  </div>
                  {profitability && profitability.length > 0 ? (
                    <div className="reports-live-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>المسار / الكورس</th>
                            <th>التصنيف</th>
                            <th>الفرع</th>
                            <th>القاعة</th>
                            <th>المقاعد المشغولة</th>
                            <th>نسبة الإشغال</th>
                            <th>المفوتر</th>
                            <th>المحصل</th>
                            <th>المتبقي</th>
                            <th>الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profitability.map(item => (
                            <tr key={item.courseOfferingId}>
                              <td>
                                <strong>{item.courseName}</strong>
                              </td>
                              <td>
                                <span className="tag-pill">{item.track}</span>
                              </td>
                              <td>{item.branchName}</td>
                              <td>{item.classroomName}</td>
                              <td>
                                {item.enrolledCount} من {item.capacity}
                              </td>
                              <td>
                                <div className="occupancy-cell">
                                  <span>{item.occupancyPercent}%</span>
                                  <div className="progress-bar-bg">
                                    <div
                                      className="progress-bar-fill"
                                      style={{ width: `${Math.min(100, item.occupancyPercent)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td>{money(item.totalBilledPiastres)}</td>
                              <td>
                                <strong className="text-success">{money(item.totalCollectedPiastres)}</strong>
                              </td>
                              <td>{money(item.outstandingPiastres)}</td>
                              <td>
                                <span className="tag-status">{item.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="reports-live-empty">لا توجد مجموعات تدريبية مسجلة حالياً.</div>
                  )}
                </section>
              )}

              {/* TAB 4 (OWNER / BRANCH MANAGER ONLY): INSTRUCTOR SCORECARDS */}
              {!isAccountant && activeTab === "instructors" && (
                <section className="reports-live-table-panel">
                  <div className="reports-live-table-heading">
                    <div>
                      <h2>بطاقة كفاءة وجودة أداء المدربين (Scorecard)</h2>
                      <p>تتبع دقة الحضور، ونسبة حضور الطلاب في جلسات المدرب، ومتوسط تقييماتهم.</p>
                    </div>
                  </div>
                  {scorecards && scorecards.length > 0 ? (
                    <div className="reports-live-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>المدرب</th>
                            <th>الفرع</th>
                            <th>الجلسات المسندة</th>
                            <th>الجلسات المنجزة</th>
                            <th>نسبة الإنجاز</th>
                            <th>طلبات استبدال</th>
                            <th>نسبة حضور الطلاب</th>
                            <th>متوسط التقييم</th>
                            <th>عدد التقييمات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scorecards.map(inst => (
                            <tr key={inst.instructorId}>
                              <td>
                                <strong>{inst.displayName}</strong>
                              </td>
                              <td>{inst.branchName}</td>
                              <td>{inst.assignedSessions}</td>
                              <td>{inst.completedSessions}</td>
                              <td>
                                <strong>{inst.completionRate}%</strong>
                              </td>
                              <td>{inst.substituteCount}</td>
                              <td>
                                <span
                                  className={`badge-attendance ${
                                    inst.studentAttendanceRate < 70 ? "badge-danger" : "badge-success"
                                  }`}
                                >
                                  {inst.studentAttendanceRate}%
                                </span>
                              </td>
                              <td>
                                {inst.averageEvaluationScore !== null ? (
                                  <strong className="text-primary">{inst.averageEvaluationScore} / 100</strong>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>{inst.totalEvaluationsCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="reports-live-empty">لا توجد بيانات جلسات للمدربين حتى الآن.</div>
                  )}
                </section>
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

function FinanceStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article className={`reports-live-stat reports-live-stat-${tone}`}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}
