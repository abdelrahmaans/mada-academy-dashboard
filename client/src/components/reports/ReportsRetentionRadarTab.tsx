import React from "react";
import { FileSpreadsheet } from "lucide-react";
import type { RetentionRadarResponse } from "@/lib/apiClient";

export interface ReportsRetentionRadarTabProps {
  radar: RetentionRadarResponse | null;
  money: (piastres: number) => string;
  onExportBiCsv: () => void;
}

export function ReportsRetentionRadarTab({
  radar,
  money,
  onExportBiCsv,
}: ReportsRetentionRadarTabProps) {
  return (
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
                <p>
                  تقييم مركب يعتمد على: تتابع الغياب، انخفاض درجات التقييم، وتأخر
                  سداد الفواتير لأكثر من 14 يوماً.
                </p>
              </div>
              <button
                className="button button-secondary button-sm"
                onClick={onExportBiCsv}
              >
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
                    <tr
                      key={item.studentId}
                      className={`radar-row-${item.riskLevel.toLowerCase()}`}
                    >
                      <td>
                        <strong>{item.fullName}</strong>
                      </td>
                      <td>{item.branchName}</td>
                      <td>{item.courseName}</td>
                      <td>
                        <span
                          className={`badge-attendance ${
                            item.attendancePercent < 75
                              ? "badge-danger"
                              : "badge-success"
                          }`}
                        >
                          {item.attendancePercent}%
                        </span>
                      </td>
                      <td>
                        {item.consecutiveAbsences > 0 ? (
                          <strong className="text-danger">
                            {item.consecutiveAbsences} جلسات
                          </strong>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>
                        {item.averageScore !== null
                          ? `${item.averageScore} / 100`
                          : "—"}
                      </td>
                      <td>{money(item.outstandingPiastres)}</td>
                      <td>
                        {item.maxOverdueDays > 0 ? (
                          <span className="text-danger">
                            {item.maxOverdueDays} يوم
                          </span>
                        ) : (
                          <span className="text-muted">مُنتظم</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`risk-tag risk-tag-${item.riskLevel.toLowerCase()}`}
                        >
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
        <div className="reports-live-empty">
          لا توجد بيانات حضور أو تقييمات كافية لبناء الرادار حالياً.
        </div>
      )}
    </section>
  );
}
