import React from "react";
import type { InstructorScorecardItem } from "@/lib/apiClient";

export interface ReportsInstructorsTabProps {
  scorecards: InstructorScorecardItem[] | null;
}

export function ReportsInstructorsTab({
  scorecards,
}: ReportsInstructorsTabProps) {
  return (
    <section className="reports-live-table-panel">
      <div className="reports-live-table-heading">
        <div>
          <h2>بطاقة كفاءة وجودة أداء المدربين (Scorecard)</h2>
          <p>
            تتبع دقة الحضور، ونسبة حضور الطلاب في جلسات المدرب، ومتوسط تقييماتهم.
          </p>
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
                        inst.studentAttendanceRate < 70
                          ? "badge-danger"
                          : "badge-success"
                      }`}
                    >
                      {inst.studentAttendanceRate}%
                    </span>
                  </td>
                  <td>
                    {inst.averageEvaluationScore !== null ? (
                      <strong className="text-primary">
                        {inst.averageEvaluationScore} / 100
                      </strong>
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
        <div className="reports-live-empty">
          لا توجد بيانات جلسات للمدربين حتى الآن.
        </div>
      )}
    </section>
  );
}
