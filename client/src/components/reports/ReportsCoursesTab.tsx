import React from "react";
import type { CourseProfitabilityItem } from "@/lib/apiClient";

export interface ReportsCoursesTabProps {
  profitability: CourseProfitabilityItem[] | null;
  isAccountant: boolean;
  money: (piastres: number) => string;
}

export function ReportsCoursesTab({
  profitability,
  isAccountant,
  money,
}: ReportsCoursesTabProps) {
  return (
    <section className="reports-live-table-panel">
      <div className="reports-live-table-heading">
        <div>
          <h2>
            {isAccountant
              ? "ربحية المسارات التدريبية والإيرادات"
              : "مؤشر ربحية المسارات ونسبة إشغال القاعات"}
          </h2>
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
                          style={{
                            width: `${Math.min(100, item.occupancyPercent)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>{money(item.totalBilledPiastres)}</td>
                  <td>
                    <strong className="text-success">
                      {money(item.totalCollectedPiastres)}
                    </strong>
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
        <div className="reports-live-empty">
          لا توجد مجموعات تدريبية مسجلة حالياً.
        </div>
      )}
    </section>
  );
}
