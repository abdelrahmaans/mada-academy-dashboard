import { useState, useMemo } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock,
  DollarSign,
  Download,
  Filter,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  PhoneCall,
  PieChart,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  BRANCH_NAMES,
  PNL_PERIODS,
  pnlAndRetentionStorage,
  type AtRiskStudent,
  type BranchPnLRecord,
  type BranchRetentionRecord,
} from "@/lib/pnlRetentionData";

type SubTab = "pnl" | "retention" | "at_risk";

export default function BranchMultiUnitPnLView({
  initialBranch = "كل الفروع",
  onNavigateToBranch,
}: {
  initialBranch?: string;
  onNavigateToBranch?: (branchName: string) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState<string>(PNL_PERIODS[0].value);
  const [selectedBranch, setSelectedBranch] = useState<string>(initialBranch);
  const [activeTab, setActiveTab] = useState<SubTab>("pnl");
  const [searchRiskQuery, setSearchRiskQuery] = useState("");
  const [riskSeverityFilter, setRiskSeverityFilter] = useState<string>("all");
  const [atRiskList, setAtRiskList] = useState<AtRiskStudent[]>(() => pnlAndRetentionStorage.getAtRiskStudents());
  const [selectedRiskStudent, setSelectedRiskStudent] = useState<AtRiskStudent | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Load PnL data
  const { list: pnlList, totals: pnlTotals } = useMemo(
    () => pnlAndRetentionStorage.getPnL(selectedMonth, selectedBranch),
    [selectedMonth, selectedBranch]
  );

  // Load Retention data
  const { list: retentionList, aggregate: retentionAggregate } = useMemo(
    () => pnlAndRetentionStorage.getRetention(selectedMonth, selectedBranch),
    [selectedMonth, selectedBranch]
  );

  // Filtered at-risk students
  const filteredAtRisk = useMemo(() => {
    return atRiskList.filter(student => {
      const branchMatches = selectedBranch === "كل الفروع" || student.branch === selectedBranch;
      const severityMatches = riskSeverityFilter === "all" || student.riskSeverity === riskSeverityFilter;
      const textMatches = !searchRiskQuery.trim() ||
        `${student.name} ${student.id} ${student.track}`.toLowerCase().includes(searchRiskQuery.toLowerCase());
      return branchMatches && severityMatches && textMatches;
    });
  }, [atRiskList, selectedBranch, riskSeverityFilter, searchRiskQuery]);

  const handleUpdateStudentStatus = (id: string, status: AtRiskStudent["status"]) => {
    const updated = pnlAndRetentionStorage.updateStudentStatus(id, status, actionNote.trim() || undefined);
    setAtRiskList(updated);
    setSelectedRiskStudent(null);
    setActionNote("");
    if (status === "contacted") {
      toast.success("تم تسجيل التواصل مع ولي الأمر بنجاح", { description: "تم تحديث بطاقة الطالب في رادار الإنذار المبكر." });
    } else if (status === "retained") {
      toast.success("تم بنجاح حماية الاشتراك وتأكيد الاستمرار!", { description: "تم تسجيل الإجراء ضمن مؤشرات الاستبقاء." });
    } else if (status === "lost") {
      toast.warning("تم تسجيل عدم التجديد وتحديث سجل التسرب.");
    }
  };

  const handleExportCSV = () => {
    pnlAndRetentionStorage.downloadCSV(selectedMonth);
    toast.success("تم تصدير ملف P&L والاستبقاء المجمع بصيغة CSV");
  };

  const formatEGP = (amount: number) => {
    return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="multi-unit-pnl-container" dir="rtl">
      {/* Top Controls & Navigation Header */}
      <header className="pnl-header-toolbar">
        <div className="pnl-filter-group">
          <label className="pnl-control-field">
            <span className="pnl-control-label"><Calendar size={14} /> الفترة المحاسبية</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="pnl-select"
            >
              {PNL_PERIODS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <label className="pnl-control-field">
            <span className="pnl-control-label"><Building2 size={14} /> نطاق الفرع</span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="pnl-select"
            >
              <option value="كل الفروع">كل فروع الأكاديمية (مجمع)</option>
              {BRANCH_NAMES.map(b => (
                <option key={b} value={b}>فرع {b}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="pnl-action-group">
          <button
            type="button"
            className="pnl-btn pnl-btn-secondary"
            onClick={() => setShowInsightsModal(true)}
          >
            <Lightbulb size={16} className="text-amber-500" />
            <span>توصيات الإدارة التنفيذية</span>
          </button>
          <button
            type="button"
            className="pnl-btn pnl-btn-primary"
            onClick={handleExportCSV}
          >
            <Download size={16} />
            <span>تصدير تقرير P&L (CSV)</span>
          </button>
        </div>
      </header>

      {/* Top 4 Executive KPI Cards */}
      <section className="pnl-kpis-grid" aria-label="المؤشرات التنفيذية المجمعة">
        <article className="pnl-kpi-card tone-emerald">
          <div className="pnl-kpi-top">
            <span className="pnl-kpi-badge"><TrendingUp size={14} /> +5.7%</span>
            <span className="pnl-kpi-icon"><Wallet size={20} /></span>
          </div>
          <div className="pnl-kpi-body">
            <small>إجمالي إيرادات الأكاديمية</small>
            <strong>{formatEGP(pnlTotals.totalRevenue)}</strong>
            <p>منها {formatEGP(pnlTotals.tuitionRevenue)} اشتراكات برامج منتظمة</p>
          </div>
        </article>

        <article className="pnl-kpi-card tone-blue">
          <div className="pnl-kpi-top">
            <span className="pnl-kpi-badge"><ShieldCheck size={14} /> معتمد</span>
            <span className="pnl-kpi-icon"><Building2 size={20} /></span>
          </div>
          <div className="pnl-kpi-body">
            <small>المصروفات التشغيلية الكلية</small>
            <strong>{formatEGP(pnlTotals.totalExpenses)}</strong>
            <p>أجور المدربين {formatEGP(pnlTotals.trainerPayroll)} ({((pnlTotals.trainerPayroll / pnlTotals.totalExpenses) * 100).toFixed(0)}% من المصروفات)</p>
          </div>
        </article>

        <article className="pnl-kpi-card tone-teal">
          <div className="pnl-kpi-top">
            <span className="pnl-kpi-badge highlight">هامش {pnlTotals.netMarginPercent}%</span>
            <span className="pnl-kpi-icon"><DollarSign size={20} /></span>
          </div>
          <div className="pnl-kpi-body">
            <small>صافي الأرباح التشغيلية (EBITDA)</small>
            <strong className="text-emerald-700">{formatEGP(pnlTotals.netProfit)}</strong>
            <p>متوسط ربح لكل طالب {pnlTotals.profitPerStudent} ج.م شهرياً</p>
          </div>
        </article>

        <article className="pnl-kpi-card tone-violet">
          <div className="pnl-kpi-top">
            <span className={`pnl-kpi-badge ${retentionAggregate.retentionRate >= 88 ? "highlight" : "warning"}`}>
              هدف 88%
            </span>
            <span className="pnl-kpi-icon"><Users size={20} /></span>
          </div>
          <div className="pnl-kpi-body">
            <small>معدل استبقاء الطلاب (Retention)</small>
            <strong>{retentionAggregate.retentionRate}%</strong>
            <p>معدل التسرب (Churn): {retentionAggregate.churnRate}% · {filteredAtRisk.length} في رادار الخطر</p>
          </div>
        </article>
      </section>

      {/* Navigation Sub-Tabs */}
      <nav className="pnl-tabs-nav" aria-label="أقسام التقرير المالي">
        <button
          type="button"
          className={`pnl-tab-btn ${activeTab === "pnl" ? "active" : ""}`}
          onClick={() => setActiveTab("pnl")}
        >
          <BarChart3 size={16} />
          <span>قائمة الأرباح والخسائر (P&L Breakdown)</span>
        </button>
        <button
          type="button"
          className={`pnl-tab-btn ${activeTab === "retention" ? "active" : ""}`}
          onClick={() => setActiveTab("retention")}
        >
          <UserCheck size={16} />
          <span>تحليلات استبقاء الطلاب وفئات التسرب</span>
        </button>
        <button
          type="button"
          className={`pnl-tab-btn ${activeTab === "at_risk" ? "active" : ""}`}
          onClick={() => setActiveTab("at_risk")}
        >
          <ShieldAlert size={16} />
          <span>رادار الإنذار المبكر للطلاب ({filteredAtRisk.length})</span>
          {filteredAtRisk.filter(s => s.riskSeverity === "critical").length > 0 && (
            <span className="pnl-tab-badge-critical">
              {filteredAtRisk.filter(s => s.riskSeverity === "critical").length} حرج
            </span>
          )}
        </button>
      </nav>

      {/* TAB 1: P&L STATEMENT */}
      {activeTab === "pnl" && (
        <section className="pnl-tab-content">
          <div className="pnl-panel-card">
            <header className="pnl-panel-head">
              <div>
                <h3>قائمة الأرباح والخسائر المقارنة للفروع</h3>
                <p>تفصيل بنود الإيرادات والمصروفات المباشرة والتشغيلية لكل وحدة وهوامش الربحية المعتمدة.</p>
              </div>
              <span className="pnl-scope-indicator">
                <ShieldCheck size={14} /> نطاق الأكاديمية (Tenant Scope)
              </span>
            </header>

            <div className="pnl-table-responsive">
              <table className="pnl-data-table">
                <thead>
                  <tr>
                    <th>الفرع / المدير</th>
                    <th>الطلاب</th>
                    <th>إيرادات الاشتراكات</th>
                    <th>تدريب خاص وكيتس</th>
                    <th>إجمالي الإيراد</th>
                    <th>رواتب المدربين</th>
                    <th>إيجار ومرافق</th>
                    <th>تسويق ومستهلكات</th>
                    <th>إجمالي المصروفات</th>
                    <th>صافي الربح</th>
                    <th>الهامش %</th>
                    <th>ربح/طالب</th>
                  </tr>
                </thead>
                <tbody>
                  {pnlList.map(b => (
                    <tr key={b.branchId}>
                      <td className="branch-name-cell">
                        <strong>فرع {b.branchName}</strong>
                        <small>{b.manager} · {b.city}</small>
                      </td>
                      <td className="font-semibold">{b.activeStudents}</td>
                      <td>{formatEGP(b.tuitionRevenue)}</td>
                      <td>{formatEGP(b.privateCoachingRevenue + b.kitsAndRegistrationRevenue + b.competitionRevenue)}</td>
                      <td className="font-bold text-teal-800">{formatEGP(b.totalRevenue)}</td>
                      <td>{formatEGP(b.trainerPayroll)}</td>
                      <td>{formatEGP(b.facilityLease + b.utilitiesAndNet)}</td>
                      <td>{formatEGP(b.marketingAndAds + b.equipmentAndSupplies + b.adminAndMisc)}</td>
                      <td className="font-semibold text-rose-700">{formatEGP(b.totalExpenses)}</td>
                      <td className="font-bold text-emerald-700">{formatEGP(b.netProfit)}</td>
                      <td>
                        <span className={`pnl-margin-badge ${b.netMarginPercent >= 65 ? "high" : "medium"}`}>
                          {b.netMarginPercent}%
                        </span>
                      </td>
                      <td className="font-medium text-slate-700">{b.profitPerStudent} ج.م</td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="pnl-totals-row">
                    <td>
                      <strong>{pnlTotals.branchName}</strong>
                      <small>تجميعي شامل لكافة الفروع</small>
                    </td>
                    <td className="font-bold">{pnlTotals.activeStudents}</td>
                    <td className="font-bold">{formatEGP(pnlTotals.tuitionRevenue)}</td>
                    <td className="font-bold">{formatEGP(pnlTotals.privateCoachingRevenue + pnlTotals.kitsAndRegistrationRevenue + pnlTotals.competitionRevenue)}</td>
                    <td className="font-extrabold text-teal-900">{formatEGP(pnlTotals.totalRevenue)}</td>
                    <td className="font-bold">{formatEGP(pnlTotals.trainerPayroll)}</td>
                    <td className="font-bold">{formatEGP(pnlTotals.facilityLease + pnlTotals.utilitiesAndNet)}</td>
                    <td className="font-bold">{formatEGP(pnlTotals.marketingAndAds + pnlTotals.equipmentAndSupplies + pnlTotals.adminAndMisc)}</td>
                    <td className="font-bold text-rose-800">{formatEGP(pnlTotals.totalExpenses)}</td>
                    <td className="font-extrabold text-emerald-900">{formatEGP(pnlTotals.netProfit)}</td>
                    <td>
                      <span className="pnl-margin-badge high font-bold">
                        {pnlTotals.netMarginPercent}%
                      </span>
                    </td>
                    <td className="font-bold text-emerald-800">{pnlTotals.profitPerStudent} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual Contribution & Unit Economics */}
            <div className="pnl-insights-split">
              <div className="pnl-sub-card">
                <h4><PieChart size={16} /> مساهمة الفروع في دخل وأرباح الأكاديمية</h4>
                <div className="pnl-bars-container">
                  {pnlList.map(b => (
                    <div key={b.branchId} className="pnl-bar-item">
                      <div className="pnl-bar-header">
                        <span>فرع {b.branchName}</span>
                        <strong>{b.revenueContributionPercent}% من الإيرادات ({formatEGP(b.totalRevenue)})</strong>
                      </div>
                      <div className="pnl-progress-track">
                        <div
                          className="pnl-progress-fill"
                          style={{ width: `${b.revenueContributionPercent}%` }}
                        />
                      </div>
                      <small>صافي الربح: {formatEGP(b.netProfit)} · هامش الربح الصافي: {b.netMarginPercent}%</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pnl-sub-card">
                <h4><DollarSign size={16} /> اقتصاديات الوحدة لكل طالب (Unit Economics)</h4>
                <div className="unit-economics-grid">
                  <div className="unit-card">
                    <small>متوسط إيراد الطالب (ARPU)</small>
                    <strong>{pnlTotals.revenuePerStudent} ج.م</strong>
                    <span>شهرياً شامل كافة الخدمات</span>
                  </div>
                  <div className="unit-card">
                    <small>تكلفة خدمة الطالب</small>
                    <strong className="text-rose-600">{pnlTotals.costPerStudent} ج.م</strong>
                    <span>تشمل التدريب والمقرات</span>
                  </div>
                  <div className="unit-card">
                    <small>صافي ربحية الطالب</small>
                    <strong className="text-emerald-600">{pnlTotals.profitPerStudent} ج.م</strong>
                    <span>عائد استثماري متميز</span>
                  </div>
                </div>
                <div className="pnl-note-banner">
                  <Lightbulb size={16} className="text-amber-600" />
                  <span>فرع المعادي يحقق أعلى ربحية للطالب (386 ج.م) بفضل ضبط الإيجار وكثافة قاعات التدريب.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: RETENTION & CHURN COHORTS */}
      {activeTab === "retention" && (
        <section className="pnl-tab-content">
          <div className="pnl-panel-card">
            <header className="pnl-panel-head">
              <div>
                <h3>تحليلات استبقاء الطلاب ومعدلات تجديد الاشتراكات</h3>
                <p>مقارنة استبقاء الطلاب بين الفروع ومتابعة التسرب حسب التخصص والأشهر السابقة.</p>
              </div>
              <span className="pnl-scope-indicator">
                <Users size={14} /> إجمالي الطلاب: {retentionAggregate.totalStudents} طالب
              </span>
            </header>

            {/* Branch Retention Comparison Cards */}
            <div className="retention-branches-grid">
              {retentionList.map(r => (
                <div key={r.branchId} className={`retention-branch-card status-${r.status}`}>
                  <div className="retention-card-head">
                    <div>
                      <h4>فرع {r.branchName}</h4>
                      <span className="retention-status-tag">
                        {r.status === "top_performer" && "⭐ الأفضل استبقاءً"}
                        {r.status === "healthy" && "✅ أداء صحي ومستقر"}
                        {r.status === "needs_attention" && "⚠️ يحتاج تدخل ومتابعة"}
                      </span>
                    </div>
                    <div className="retention-rate-circle">
                      <strong>{r.retentionRate}%</strong>
                      <small>استبقاء</small>
                    </div>
                  </div>

                  <div className="retention-mini-metrics">
                    <div>
                      <small>تجديد في الموعد</small>
                      <b>{r.renewalOnTimeRate}%</b>
                    </div>
                    <div>
                      <small>تسرب (عدم تجديد)</small>
                      <b className="text-rose-600">{r.churnRate}% ({r.churnedStudents})</b>
                    </div>
                    <div>
                      <small>اشتراكات مجمدة</small>
                      <b>{r.frozenStudents}</b>
                    </div>
                    <div>
                      <small>وافدون جدد</small>
                      <b className="text-emerald-600">+{r.newEnrollments}</b>
                    </div>
                  </div>

                  {/* Tracks breakdown */}
                  <div className="retention-tracks-list">
                    <h5>الاستبقاء حسب المسار التعليمي:</h5>
                    {r.tracks.map(t => (
                      <div key={t.track} className="retention-track-row">
                        <span>{t.trackLabel}</span>
                        <div className="retention-track-bar">
                          <div className="track-bar-fill" style={{ width: `${t.retentionRate}%` }} />
                        </div>
                        <strong>{t.retentionRate}%</strong>
                      </div>
                    ))}
                  </div>

                  <div className="retention-card-footer">
                    <small>الطلاب المعرضين للتسرب حالياً: <b>{r.atRiskCount} طلاب</b></small>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        setSelectedBranch(r.branchName);
                        setActiveTab("at_risk");
                      }}
                    >
                      فتح رادار الفرع <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 4-Month Cohort Trend */}
            <div className="cohort-trend-panel">
              <h4><TrendingUp size={16} /> اتجاه استبقاء الطلاب خلال آخر 4 أشهر (Cohort Monthly Trend)</h4>
              <div className="cohort-timeline">
                {retentionList[0]?.trend.map((tr, idx) => (
                  <div key={tr.month} className="cohort-timeline-item">
                    <span className="cohort-month-label">{tr.monthLabel}</span>
                    <div className="cohort-rate-box">
                      <strong className="text-teal-800">{tr.retentionRate}%</strong>
                      <small>استبقاء</small>
                    </div>
                    <span className="cohort-churn-hint">تسرب: {tr.churnRate}%</span>
                    <span className="cohort-student-count">{tr.activeCount} طالب نشط</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: AT-RISK RADAR */}
      {activeTab === "at_risk" && (
        <section className="pnl-tab-content">
          <div className="pnl-panel-card">
            <header className="pnl-panel-head">
              <div>
                <h3>رادار التدخل المبكر وحماية الاشتراكات (At-Risk Churn Prevention)</h3>
                <p>قائمة ذكية بالطلاب المعرضين لخطر عدم التجديد بسبب تراجع الحضور أو انتهاء الباقة أو غياب متكرر.</p>
              </div>
              <span className="pnl-scope-indicator">
                <ShieldAlert size={14} className="text-rose-600" />
                {filteredAtRisk.length} طلاب بحاجة لإجراء فوري
              </span>
            </header>

            {/* Search & Severity Filters */}
            <div className="pnl-filter-bar">
              <label className="pnl-search-input">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب أو الكود أو المسار..."
                  value={searchRiskQuery}
                  onChange={e => setSearchRiskQuery(e.target.value)}
                />
              </label>

              <div className="pnl-severity-filters">
                <button
                  type="button"
                  className={`severity-btn ${riskSeverityFilter === "all" ? "active" : ""}`}
                  onClick={() => setRiskSeverityFilter("all")}
                >
                  الكل ({atRiskList.length})
                </button>
                <button
                  type="button"
                  className={`severity-btn critical ${riskSeverityFilter === "critical" ? "active" : ""}`}
                  onClick={() => setRiskSeverityFilter("critical")}
                >
                  حرج ({atRiskList.filter(s => s.riskSeverity === "critical").length})
                </button>
                <button
                  type="button"
                  className={`severity-btn warning ${riskSeverityFilter === "warning" ? "active" : ""}`}
                  onClick={() => setRiskSeverityFilter("warning")}
                >
                  تنبيه متوسط ({atRiskList.filter(s => s.riskSeverity === "warning").length})
                </button>
              </div>
            </div>

            {/* At-Risk Table */}
            <div className="pnl-table-responsive">
              <table className="pnl-data-table at-risk-table">
                <thead>
                  <tr>
                    <th>الطالب / الكود</th>
                    <th>الفرع</th>
                    <th>المسار / المستوى</th>
                    <th>نسبة الحضور</th>
                    <th>متبقي بالاشتراك</th>
                    <th>مؤشر الخطر والسبب</th>
                    <th>الحالة الحالية</th>
                    <th>الإجراء المقترح</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtRisk.map(student => (
                    <tr key={student.id} className={`risk-row ${student.riskSeverity}`}>
                      <td>
                        <strong>{student.name}</strong>
                        <small className="font-mono text-slate-500">{student.id}</small>
                      </td>
                      <td>فرع {student.branch}</td>
                      <td>{student.track}</td>
                      <td>
                        <span className={`attendance-tag ${student.attendanceRate < 60 ? "low" : "mid"}`}>
                          {student.attendanceRate}%
                        </span>
                      </td>
                      <td>
                        <span className="days-tag">
                          <Clock size={12} /> {student.daysRemainingInSub} أيام
                        </span>
                      </td>
                      <td className="risk-reason-cell">
                        <span className={`risk-badge ${student.riskSeverity}`}>
                          {student.riskSeverity === "critical" && "خطر حرج"}
                          {student.riskSeverity === "warning" && "إنذار متوسط"}
                          {student.riskSeverity === "moderate" && "ملاحظة"}
                        </span>
                        <p>{student.riskReason}</p>
                      </td>
                      <td>
                        <span className={`status-pill ${student.status}`}>
                          {student.status === "pending" && "بانتظار الإجراء"}
                          {student.status === "contacted" && "تم التواصل"}
                          {student.status === "retained" && "تم التجديد بنجاح"}
                          {student.status === "lost" && "تسرب"}
                        </span>
                        {student.lastContactNote && (
                          <small className="contact-note-hint">ملاحظة: {student.lastContactNote}</small>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="action-btn-take"
                          onClick={() => {
                            setSelectedRiskStudent(student);
                            setActionNote(student.lastContactNote || "");
                          }}
                        >
                          <PhoneCall size={13} />
                          <span>اتخاذ إجراء</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAtRisk.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400">
                        لا يوجد طلاب تنطبق عليهم معايير التصفية المحددة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Modal: At-Risk Action Dialog */}
      {selectedRiskStudent && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setSelectedRiskStudent(null)}>
          <div className="student-dialog pnl-action-dialog" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-top">
              <span className="dialog-mark"><PhoneCall size={20} /></span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedRiskStudent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <h2>إجراء حماية الاشتراك · {selectedRiskStudent.name}</h2>
            <p className="dialog-meta">
              كود: {selectedRiskStudent.id} · فرع {selectedRiskStudent.branch} · {selectedRiskStudent.track}
            </p>

            <div className="dialog-body-box">
              <div className="risk-summary-callout">
                <AlertCircle size={16} className="text-amber-600" />
                <div>
                  <strong>سبب التنبيه:</strong>
                  <p>{selectedRiskStudent.riskReason}</p>
                </div>
              </div>

              <div className="suggested-action-callout">
                <Sparkles size={16} className="text-teal-600" />
                <div>
                  <strong>الخطة المقترحة من النظام:</strong>
                  <p>{selectedRiskStudent.suggestedAction}</p>
                </div>
              </div>

              <label className="form-field">
                <span>ملاحظات مكالمة ولي الأمر والنتيجة:</span>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder="سجل ما تم الاتفاق عليه مع الأسرة (تقديم جلسة تعويضية، رغبة بالتجديد، تعديل الموعد...)"
                />
              </label>

              <div className="quick-action-triggers">
                <span>تحديث حالة الطالب:</span>
                <div className="triggers-row">
                  <button
                    type="button"
                    className="trigger-btn btn-contacted"
                    onClick={() => handleUpdateStudentStatus(selectedRiskStudent.id, "contacted")}
                  >
                    <PhoneCall size={14} />
                    <span>تم التواصل (قيد المتابعة)</span>
                  </button>
                  <button
                    type="button"
                    className="trigger-btn btn-retained"
                    onClick={() => handleUpdateStudentStatus(selectedRiskStudent.id, "retained")}
                  >
                    <CheckCircle2 size={14} />
                    <span>تم التجديد بنجاح</span>
                  </button>
                  <button
                    type="button"
                    className="trigger-btn btn-lost"
                    onClick={() => handleUpdateStudentStatus(selectedRiskStudent.id, "lost")}
                  >
                    <UserMinus size={14} />
                    <span>اعتذار عن الاستمرار</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Executive Insights Dialog */}
      {showInsightsModal && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setShowInsightsModal(false)}>
          <div className="student-dialog pnl-insights-dialog" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-top">
              <span className="dialog-mark"><Lightbulb size={20} className="text-amber-500" /></span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowInsightsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <h2>تقرير الذكاء التنفيذي لقرارات الإدارة</h2>
            <p className="dialog-meta">
              تحليل مالي وتشغيلي مقارن لفروع الأكاديمية الثلاثة للفترة {PNL_PERIODS.find(p => p.value === selectedMonth)?.label}
            </p>

            <div className="insights-cards-list">
              <div className="insight-item-card tone-warning">
                <h4>1. فرع الشيخ زايد: ضغط تكلفة الطالب وتراجع الاستبقاء</h4>
                <p>
                  تكلفة الطالب في فرع الشيخ زايد تصل إلى <strong>263 ج.م</strong> مقارنة بـ <strong>155 ج.م</strong> بمدينة نصر.
                  السبب الرئيسي هو الإيجار المرتفع (10,500 ج.م) مع طاقة استيعابية مشغولة بنسبة 57% فقط.
                  إضافة إلى ذلك، نسبة التسرب بالفرع <strong>14.2%</strong> (أعلى من هدف الأكاديمية 12%).
                </p>
                <div className="insight-recommendation">
                  <strong>التوصية التنفيذية:</strong> تكثيف حملات الـ Leads لملء مقاعد المعامل المتاحة، والتدخل في مسار الدوائر الإلكترونية الذي سجل أعلى نسبة تسرب (22.2%) بتعيين مدرب مساعد.
                </div>
              </div>

              <div className="insight-item-card tone-success">
                <h4>2. فرع المعادي: أعلى كفاءة ربحية وأفضل تجديد في الموعد</h4>
                <p>
                  فرع المعادي يحقق أعلى ربح صافي لكل طالب (<strong>386 ج.م</strong>) مع أعلى نسبة تجديد في الموعد (<strong>91.0%</strong>).
                  إدارة المواعيد والمجموعات بالفرع تمثل نموذجاً معيارياً للأكاديمية.
                </p>
                <div className="insight-recommendation">
                  <strong>التوصية التنفيذية:</strong> دراسة نقل تجربة المعادي في إدارة أولياء الأمور إلى فرع الشيخ زايد.
                </div>
              </div>

              <div className="insight-item-card tone-info">
                <h4>3. فرع مدينة نصر: القوة الدافعة لإيرادات الأكاديمية</h4>
                <p>
                  يساهم الفرع بـ <strong>42.5%</strong> من إجمالي دخل الأكاديمية بفضل 248 طالباً نشطاً واستبقاء استثنائي في الروبوتكس والذكاء الاصطناعي (<strong>94.8%</strong>).
                </p>
                <div className="insight-recommendation">
                  <strong>التوصية التنفيذية:</strong> فتح قاعة تدريب إضافية لاستيعاب قوائم الانتظار المتزايدة في الروبوتكس.
                </div>
              </div>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowInsightsModal(false)}
              >
                فهمت التوصيات وسأتابع التنفيذ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
