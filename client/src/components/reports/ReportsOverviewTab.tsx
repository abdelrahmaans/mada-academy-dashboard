import React from "react";
import { Activity, Building2, CircleAlert, Users, Wallet } from "lucide-react";
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
    </>
  );
}
