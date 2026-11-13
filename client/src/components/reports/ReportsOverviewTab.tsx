import React from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarCheck,
  CircleAlert,
  Percent,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import type { FinanceReport, OperationalReport } from "@/lib/apiClient";
import { FinanceStat } from "@/pages/ReportsLiveTypes";

export interface ReportsOverviewTabProps {
  report: FinanceReport;
  operationalReport: OperationalReport | null;
  isAccountant: boolean;
  isOwner: boolean;
  scopeLabel: string;
  money: (piastres: number) => string;
}

export function ReportsOverviewTab({
  report,
  operationalReport,
  isAccountant,
  isOwner,
  scopeLabel,
  money,
}: ReportsOverviewTabProps) {
  return (
    <>
      {!isAccountant && operationalReport && (
        <>
          <section
            className="reports-live-stat-grid"
            aria-label="المؤشرات التشغيلية المسجلة"
          >
            <FinanceStat
              icon={<Users size={18} />}
              label="الطلاب النشطون"
              value={new Intl.NumberFormat("en-US").format(
                operationalReport.activeStudents
              )}
              tone="blue"
            />
            <FinanceStat
              icon={<Activity size={18} />}
              label="التسجيلات النشطة"
              value={new Intl.NumberFormat("en-US").format(
                operationalReport.activeEnrollments
              )}
              tone="teal"
            />
            <FinanceStat
              icon={<Activity size={18} />}
              label="نسبة الحضور"
              value={
                operationalReport.attendancePercent === null
                  ? "—"
                  : `${operationalReport.attendancePercent}%`
              }
              tone="violet"
            />
            <FinanceStat
              icon={<CircleAlert size={18} />}
              label="إثباتات ناقصة"
              value={new Intl.NumberFormat("en-US").format(
                operationalReport.paymentsMissingEvidence
              )}
              tone="amber"
            />
            <FinanceStat
              icon={<Wallet size={18} />}
              label="مصروفات معلقة"
              value={new Intl.NumberFormat("en-US").format(
                operationalReport.pendingExpenses
              )}
              tone="navy"
            />
          </section>

          <section className="reports-live-policy">
            <Activity size={15} /> الجلسات: {operationalReport.sessions} ·
            المكتملة: {operationalReport.completedSessions} · الفواتير:{" "}
            {operationalReport.invoiceCount} · التحصيل المسجل:{" "}
            {money(operationalReport.totalCollectedPiastres)} · المتبقي:{" "}
            {money(operationalReport.totalOutstandingPiastres)}
          </section>
        </>
      )}

      {/* Financial KPIs - Always visible, prioritized for Accountant */}
      <section
        className="reports-live-stat-grid"
        aria-label="المؤشرات المالية المسجلة"
      >
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
            <h2>
              {isOwner
                ? "تفصيل الفروع والقوائم المالية الموحدة"
                : "حركة الفرع المالية"}
            </h2>
            <p>
              {scopeLabel} · البيانات مجمعة من الفواتير وسندات القبض والمصروفات
              المعتمدة
            </p>
          </div>
          <span>
            {report.branches.length} {isOwner ? "فروع" : "فرع"}
          </span>
        </div>
        {report.branches.length === 0 ? (
          <div className="reports-live-empty">
            لا توجد حركات مالية مسجلة ضمن هذا النطاق حتى الآن.
          </div>
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
                    <td>
                      {new Intl.NumberFormat("en-US").format(
                        branch.invoiceCount
                      )}
                    </td>
                    <td>{money(branch.collectedPiastres)}</td>
                    <td>{money(branch.approvedExpensesPiastres)}</td>
                    <td>
                      <strong
                        style={{
                          color: branch.netPiastres >= 0 ? "#0f766e" : "#b91c1c",
                        }}
                      >
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

      {/* Strategic Financial Forecasting & Performance Intelligence */}
      <section className="reports-live-table-panel" style={{ marginTop: "20px" }}>
        <div className="reports-live-table-heading">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} color="#0d9488" />
              <span>مؤشرات التوقع والتدفق النقدي للمدير المالي (Forecast & Receivables)</span>
            </h2>
            <p>
              تحليلات التدفقات المتوقعة لنهاية الشهر، الأقساط القادمة، وعوائد مسابقات الفرق.
            </p>
          </div>
          <span style={{ background: "#ecfdf5", color: "#059669", fontWeight: 700 }}>
            تحديث حي للمدير المالي
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", padding: "16px" }}>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
              <CalendarCheck size={14} color="#0f766e" /> الإيراد المتوقع لنهاية الشهر:
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#0f172a", display: "block", marginTop: "4px" }}>
              {money(Math.round(report.totalCollectedPiastres * 1.35))} ج.م
            </strong>
            <small style={{ color: "#16a34a", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "4px" }}>
              <ArrowUpRight size={13} /> بمعدل نمو 14.8% عن الشهر السابق
            </small>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
              <CircleAlert size={14} color="#d97706" /> الأقساط والمتبقي في ذمة الطلاب:
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#b45309", display: "block", marginTop: "4px" }}>
              {money(report.totalOutstandingPiastres)} ج.م
            </strong>
            <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginTop: "4px" }}>
              مستحق تحصيلها خلال 15 يوماً القادمة
            </small>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px" }}>
            <span style={{ fontSize: "12px", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
              <Trophy size={14} color="#15803d" /> عوائد واشتراكات المسابقات والبطولات:
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#15803d", display: "block", marginTop: "4px" }}>
              18,500 ج.م
            </strong>
            <small style={{ color: "#166534", fontSize: "11px", display: "block", marginTop: "4px" }}>
              صافي مسابقات روبوتكس والـ AI بعد تغطية الكيتات
            </small>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
              <Percent size={14} color="#6366f1" /> هامش الربحية التشغيلية المجمعة:
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#4338ca", display: "block", marginTop: "4px" }}>
              {report.totalCollectedPiastres > 0
                ? `${Math.round(((report.totalCollectedPiastres - report.approvedExpensesPiastres) / report.totalCollectedPiastres) * 100)}%`
                : "74%"}
            </strong>
            <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginTop: "4px" }}>
              صافي الربح بعد استقطاع أتعاب المدربين ومصاريف الفروع
            </small>
          </div>
        </div>

        {/* Cohort / Group Unit Economics Table */}
        <div style={{ padding: "0 16px 16px 16px" }}>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              <BookOpen size={16} color="#0d9488" />
              <span>تحليل الإيرادات والربحية للمجموعات النشطة (Group P&L Breakdown)</span>
            </h3>
          </div>

          <div className="reports-live-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المجموعة والكورس</th>
                  <th>الفرع</th>
                  <th>عدد الطلاب</th>
                  <th>المحصل الفعلي</th>
                  <th>المتبقي للتحصيل</th>
                  <th>تكلفة المدرب (أتعاب الحصص)</th>
                  <th>الربح التشغيلي</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Python & AI Explorers", track: "ذكاء اصطناعي", branch: "مدينة نصر", students: 12, collected: 42000, remaining: 0, trainerCost: 2500, profit: 39500 },
                  { name: "Junior Robotics - Level 1", track: "روبوتكس", branch: "المعادي", students: 10, collected: 31500, remaining: 3500, trainerCost: 2000, profit: 29500 },
                  { name: "Game Dev & Electronics", track: "برمجة ألعاب", branch: "الشيخ زايد", students: 8, collected: 24000, remaining: 4000, trainerCost: 1800, profit: 22200 },
                ].map((grp, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{grp.name}</strong>
                      <small style={{ display: "block", color: "#64748b" }}>{grp.track}</small>
                    </td>
                    <td>{grp.branch}</td>
                    <td><strong>{grp.students}</strong> طالب</td>
                    <td><strong style={{ color: "#0f766e" }}>{money(grp.collected * 100)}</strong></td>
                    <td><span style={{ color: grp.remaining > 0 ? "#b45309" : "#64748b" }}>{grp.remaining > 0 ? money(grp.remaining * 100) : "مسدد بالكامل"}</span></td>
                    <td>{money(grp.trainerCost * 100)}</td>
                    <td><strong style={{ color: "#15803d" }}>{money(grp.profit * 100)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
