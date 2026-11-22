import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Activity,
  ArrowDownToLine,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { QuickSupportTicketModal } from "@/components/QuickActionModals";
import {
  apiClient,
  type ExecutiveActivityItem,
  type ExecutiveDashboardReport,
} from "@/lib/apiClient";
import { executiveFailureMessage } from "@/lib/liveSurfaceAcceptance";
import {
  formatAuditAction,
  formatAuditTargetType,
  formatAuditTargetId,
} from "@/lib/auditLabels";
import "./ExecutiveDashboardLive.css";

type PeriodOffset = 0 | -1 | -2;

function periodRange(offset: PeriodOffset) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const end =
    offset === 0
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  const label = new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    label,
  };
}

function money(piastres: number) {
  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      piastres / 100
    ) + " ج.م"
  );
}

function integer(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function occurredAt(value: string) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [showFullTable, setShowFullTable] = useState(false);

  const range = useMemo(() => periodRange(period), [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setReport(null);
    apiClient
      .executiveSummary({
        from: range.from,
        to: range.to,
        branchId: branchId === "ALL" ? undefined : branchId,
      })
      .then((result) => {
        if (cancelled) return;
        setReport(result);
        if (retryKey > 0) toast.success("تم تحديث لوحة الإدارة التنفيذية");
      })
      .catch((reason) => {
        if (cancelled) return;
        const message = executiveFailureMessage(reason);
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, range.from, range.to, retryKey]);

  useEffect(() => {
    let cancelled = false;
    setActivityLoading(true);
    setActivityError(null);
    apiClient
      .executiveActivity({
        from: range.from,
        to: range.to,
        branchId: branchId === "ALL" ? undefined : branchId,
      })
      .then((result) => {
        if (!cancelled) setActivity(result.items);
      })
      .catch((reason) => {
        if (cancelled) return;
        const message = executiveFailureMessage(reason);
        setActivityError(message);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, range.from, range.to, retryKey]);

  const selectedBranchName =
    branchId === "ALL"
      ? "كل الفروع"
      : report?.availableBranches.find((branch) => branch.id === branchId)?.name ??
        "الفرع المحدد";

  const retry = () => setRetryKey((value) => value + 1);

  // Live data only: unavailable reports must never be replaced by design/demo values.
  const branchPulseData = useMemo(() => {
    if (report && report.branches && report.branches.length > 0) {
      return report.branches.map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
        branchCode: b.branchCode,
        managerName: (b as { managerName?: string }).managerName || "مدير الفرع",
        activeStudents: b.activeStudents ?? 0,
        attendancePercent:
          b.attendancePercent !== null && b.attendancePercent !== undefined
            ? Math.round(b.attendancePercent)
            : 0,
        collectedPiastres: b.collectedPiastres ?? 0,
        approvedExpensesPiastres: b.approvedExpensesPiastres ?? 0,
        netPiastres: b.netPiastres ?? 0,
        trend: (b as { trend?: string }).trend || "0%",
        isPositiveTrend: !((b as { trend?: string }).trend?.startsWith("-")),
      }));
    }

    return [];
  }, [report]);

  // Aggregate stats come only from the server response.
  const activeStudentsVal =
    report?.summary?.activeStudents !== undefined && report?.summary?.activeStudents !== null
      ? integer(report.summary.activeStudents)
      : "—";

  const attendanceRateVal =
    report?.summary?.attendancePercent !== null &&
    report?.summary?.attendancePercent !== undefined
      ? `${Math.round(report.summary.attendancePercent)}%`
      : "—";

  const totalCollectedVal =
    report?.summary?.collectedPiastres !== undefined && report?.summary?.collectedPiastres !== null
      ? money(report.summary.collectedPiastres)
      : "—";

  const netCollectionsVal =
    report?.summary?.netPiastres !== undefined && report?.summary?.netPiastres !== null
      ? money(report.summary.netPiastres)
      : "—";

  const exportBoardRollup = () => {
    const listToExport = branchPulseData.length > 0 ? branchPulseData : [];
    const headers = [
      "الفرع",
      "كود الفرع",
      "الطلاب النشطون",
      "نسبة الحضور",
      "التحصيل (ج.م)",
    ];
    const rows = listToExport.map((b) => [
      b.branchName,
      b.branchCode,
      b.activeStudents,
      `${b.attendancePercent}%`,
      b.collectedPiastres / 100,
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `executive-board-report-${range.from}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير تقرير مجلس الإدارة بنجاح");
  };

  return (
    <RoleDashboardShell
      className="app-shell executive-dashboard-shell"
      roleCode="R01"
      roleLabel="مسؤول الأكاديمية"
      scopeLevel="tenant"
      scopeLabel="كل فروع الأكاديمية"
      tenantName="أكاديمية مدى"
      branchName={selectedBranchName}
      demo={false}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel">
        <RoleSurfaceTopbar
          onMenu={() => setMobileNavOpen(true)}
          scopeLabel={selectedBranchName}
        />

        <div className="workspace r1-live-page" dir="rtl">
          {/* 1. Scope & Filter Controls Bar */}
          <section
            className="r1-controls-bar"
            aria-label="نطاق وتصفية لوحة الإدارة التنفيذية"
          >
            <div className="r1-scope-pill">
              <ShieldCheck size={15} />
              <span>نطاق الأكاديمية فقط · Tenant Scope</span>
            </div>

            <div className="r1-filters-group">
              <label className="r1-select-pill">
                <span>
                  <Building2 size={15} color="#0d9488" />
                  <span>الفرع: {selectedBranchName === "كل الفروع" ? "كل الفروع (مجمع)" : selectedBranchName}</span>
                </span>
                <ChevronDown size={14} color="#64748b" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  aria-label="تحديد الفرع"
                >
                  <option value="ALL">كل الفروع (مجمع)</option>
                  {report?.availableBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="r1-select-pill">
                <span>
                  <CalendarDays size={15} color="#0d9488" />
                  <span>{range.label}</span>
                </span>
                <ChevronDown size={14} color="#64748b" />
                <select
                  value={period}
                  onChange={(e) =>
                    setPeriod(Number(e.target.value) as PeriodOffset)
                  }
                  aria-label="تحديد الفترة المحاسبية"
                >
                  <option value={0}>{periodRange(0).label}</option>
                  <option value={-1}>{periodRange(-1).label}</option>
                  <option value={-2}>{periodRange(-2).label}</option>
                </select>
              </label>
            </div>
          </section>

          {/* 2. Welcome & Title Section */}
          <header className="r1-header-section">
            <div>
              <div className="r1-eyebrow">
                <i className="r1-eyebrow-dot" />
                <span>
                  الإدارة التنفيذية · R01 · {range.label} · {selectedBranchName}
                </span>
              </div>
              <h1 className="r1-title">لوحة الإدارة التنفيذية</h1>
              <p className="r1-subtitle">
                رؤية واحدة لأداء الأكاديمية، الفروع، النمو، التشغيل، والماليات.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className="r1-link-btn"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  color: "#0f766e",
                  display: "inline-flex",
                  gap: "6px",
                  alignItems: "center",
                }}
                onClick={exportBoardRollup}
              >
                <ArrowDownToLine size={15} />
                <span>تصدير تقرير مجلس الإدارة (CSV)</span>
              </button>
            </div>
          </header>

          {/* Error Banner if API fails */}
          {!loading && error && (
            <div
              style={{
                background: "#fffaf8",
                border: "1px solid #fed7aa",
                borderRadius: "14px",
                padding: "14px 18px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#9a3412" }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: "13px" }}>
                  <strong>تنبيه اتصال:</strong> {error}
                </span>
              </div>
              <button
                type="button"
                onClick={retry}
                style={{
                  background: "#ea580c",
                  color: "#fff",
                  border: 0,
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* 3. Four KPI Metric Cards Grid */}
          <section className="r1-kpi-grid" aria-label="المؤشرات الرئيسية">
            {/* Card 1: Active Students */}
            <article className="r1-kpi-card">
              <div className="r1-kpi-head">
                <span className="r1-kpi-label">طلاب نشطون</span>
                <span className="r1-kpi-icon-box r1-kpi-icon-teal">
                  <Users size={18} />
                </span>
              </div>
              <div className="r1-kpi-value">{activeStudentsVal}</div>
              <div className="r1-kpi-caption">عبر نطاق كل الفروع</div>
            </article>

            {/* Card 2: Attendance Rate */}
            <article className="r1-kpi-card">
              <div className="r1-kpi-head">
                <span className="r1-kpi-label">متوسط الحضور</span>
                <span className="r1-kpi-icon-box r1-kpi-icon-green">
                  <CheckCircle2 size={18} />
                </span>
              </div>
              <div className="r1-kpi-value">{attendanceRateVal}</div>
              <div className="r1-kpi-caption positive">هدف الأكاديمية 85% ✓</div>
            </article>

            {/* Card 3: Total Collections */}
            <article className="r1-kpi-card">
              <div className="r1-kpi-head">
                <span className="r1-kpi-label">إجمالي التحصيل</span>
                <span className="r1-kpi-icon-box r1-kpi-icon-purple">
                  <Wallet size={18} />
                </span>
              </div>
              <div className="r1-kpi-value">{totalCollectedVal}</div>
              <div className="r1-kpi-caption">هذا الشهر (صافي: {netCollectionsVal})</div>
            </article>

            {/* Card 4: Active Leads */}
            <article className="r1-kpi-card">
              <div className="r1-kpi-head">
                <span className="r1-kpi-label">Leads نشطة</span>
                <span className="r1-kpi-icon-box r1-kpi-icon-amber">
                  <TrendingUp size={18} />
                </span>
              </div>
              <div className="r1-kpi-value">—</div>
              <div className="r1-kpi-caption">
                بيانات العملاء المحتملين غير متاحة في هذا التقرير
              </div>
            </article>
          </section>

          {/* 4. Lower Two-Column Section */}
          <div className="r1-main-columns">
            {/* Right Column: Branch Operational Pulse */}
            <section
              className="r1-panel-card"
              aria-label="نبض الفروع التشغيلي"
            >
              <div className="r1-panel-header">
                <h2 className="r1-panel-title">
                  <BarChart3 size={19} color="#0d9488" />
                  <span>نبض الفروع التشغيلي</span>
                </h2>
                <button
                  type="button"
                  className="r1-link-btn"
                  onClick={() => setShowFullTable((prev) => !prev)}
                >
                  <span>{showFullTable ? "إخفاء التفاصيل" : "مقارنة كاملة"}</span>
                  <ChevronLeft size={14} />
                </button>
              </div>

              <div className="r1-branch-list">
                {branchPulseData.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                    <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                      لا توجد فروع مسجلة بعد
                    </p>
                    <p style={{ fontSize: "13px" }}>
                      قم بإضافة فروع الأكاديمية لمتابعة مؤشرات الحضور والتحصيل التشغيلي.
                    </p>
                  </div>
                ) : (
                  branchPulseData.map((branch) => (
                    <article key={branch.branchId} className="r1-branch-row">
                      <div className="r1-branch-info">
                        <span className="r1-branch-icon">
                          <Building2 size={18} />
                        </span>
                        <div className="r1-branch-meta">
                          <strong>{branch.branchName}</strong>
                          <small>
                            {branch.managerName} · {branch.activeStudents} طالب
                          </small>
                        </div>
                      </div>

                      <div className="r1-branch-attendance">
                        <div className="r1-branch-att-label">
                          <span>حضور {branch.attendancePercent}%</span>
                        </div>
                        <div className="r1-progress-track">
                          <div
                            className={`r1-progress-bar ${
                              branch.attendancePercent >= 85
                                ? "r1-progress-green"
                                : "r1-progress-amber"
                            }`}
                            style={{
                              width: `${Math.min(100, branch.attendancePercent)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="r1-branch-finance">
                        <span className="r1-branch-rev">
                          {money(branch.collectedPiastres)}
                        </span>
                        <span
                          className={`r1-trend-badge ${
                            branch.isPositiveTrend ? "positive" : "negative"
                          }`}
                        >
                          {branch.trend}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* Left Column: Urgent Decisions & Alerts */}
            <section
              className="r1-panel-card"
              aria-label="قرارات اليوم العاجلة"
            >
              <div className="r1-panel-header">
                <h2 className="r1-panel-title">
                  <Bell size={18} color="#f59e0b" />
                  <span>قرارات اليوم العاجلة</span>
                </h2>
                <span className="r1-panel-counter">
                  {activity.length} عناصر
                </span>
              </div>
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                {activityError ? (
                  <p>{activityError}</p>
                ) : activityLoading ? (
                  <p>جارٍ تحميل التنبيهات الفعلية…</p>
                ) : activity.length === 0 ? (
                  <p>لا توجد تنبيهات أو قرارات مسجلة في الفترة المحددة.</p>
                ) : (
                  <p>تم تحميل {activity.length} عناصر فعلية من سجل النشاط.</p>
                )}
              </div>
            </section>
          </div>

          {/* Full Comparison Table (collapsible or toggleable) */}
          {showFullTable && (
            <section
              className="r1-table-card"
              aria-label="جدول مقارنة الفروع المفصل"
            >
              <div className="r1-panel-header">
                <h3 className="r1-panel-title">
                  <BarChart3 size={18} color="#0d9488" />
                  <span>مقارنة الفروع المالية والتشغيلية الكاملة</span>
                </h3>
                <button
                  type="button"
                  className="r1-link-btn"
                  onClick={exportBoardRollup}
                >
                  <ArrowDownToLine size={14} /> تصدير CSV
                </button>
              </div>
              <div className="r1-table-wrap">
                <table className="r1-data-table">
                  <thead>
                    <tr>
                      <th>الفرع</th>
                      <th>كود الفرع</th>
                      <th>طلاب نشطون</th>
                      <th>نسبة الحضور</th>
                      <th>إجمالي التحصيل</th>
                      <th>المصروفات</th>
                      <th>صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchPulseData.map((branch) => (
                      <tr key={branch.branchId}>
                        <td>
                          <strong>{branch.branchName}</strong>
                        </td>
                        <td>
                          <code>{branch.branchCode}</code>
                        </td>
                        <td>{branch.activeStudents}</td>
                        <td>{branch.attendancePercent}%</td>
                        <td>{money(branch.collectedPiastres)}</td>
                        <td>{money(branch.approvedExpensesPiastres)}</td>
                        <td>
                          <strong style={{ color: "#0d9488" }}>
                            {money(branch.netPiastres)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Audit Trail & Governance Decisions */}
          <section className="r1-panel-card" style={{ marginTop: "20px" }}>
            <div className="r1-panel-header">
              <h2 className="r1-panel-title">
                <Activity size={18} color="#0d9488" />
                <span>سجل التدقيق والقرارات التنفيذية</span>
              </h2>
              <button
                type="button"
                className="r1-link-btn"
                onClick={retry}
                aria-label="تحديث سجل التدقيق"
              >
                <RefreshCw size={14} /> تحديث
              </button>
            </div>
            {activityLoading && (
              <div style={{ padding: "16px", color: "#64748b", fontSize: "12px" }}>
                جارٍ تحميل أحدث القرارات وأحداث التدقيق...
              </div>
            )}
            {!activityLoading && activity.length === 0 && (
              <div style={{ padding: "16px", color: "#94a3b8", fontSize: "12px", textAlign: "center" }}>
                لا توجد أحداث تدقيق مسجلة للفترة المحددة.
              </div>
            )}
            {!activityLoading && activity.length > 0 && (
              <div style={{ display: "grid", gap: "8px" }}>
                {activity.slice(0, 5).map((item) => (
                  <div
                    key={`${item.source}-${item.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "10px 14px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                        {formatAuditAction(item.action).label} ·{" "}
                        {formatAuditTargetType(item.targetType)}
                      </strong>
                      <small style={{ display: "block", color: "#64748b" }}>
                        المستهدف: {formatAuditTargetId(item.targetId)} · بواسطة{" "}
                        {item.actorName ?? "النظام"}
                      </small>
                    </div>
                    <time style={{ color: "#94a3b8", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {occurredAt(item.occurredAt)}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Support Ticket Modal */}
      <QuickSupportTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        roleLabel="الإدارة التنفيذية · R01"
      />

    </RoleDashboardShell>
  );
}
