import React, { useState } from "react";
import {
  Coins,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  FileSpreadsheet,
  X,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import type { MyInstructorEarnings } from "@/lib/apiClient";
import { formatDate, formatTime } from "@/pages/InstructorDeskTypes";

export interface InstructorEarningsCardProps {
  earnings: MyInstructorEarnings | null;
  loading: boolean;
  onRefresh: () => void;
}

export function InstructorEarningsCard({
  earnings,
  loading,
  onRefresh,
}: InstructorEarningsCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (loading && !earnings) {
    return (
      <div className="r04-earnings-hero loading">
        <div className="r04-earnings-skeleton">جارٍ تحميل بيانات المستحقات المالية…</div>
      </div>
    );
  }

  if (!earnings) return null;

  return (
    <>
      <section className="r04-earnings-hero">
        <div className="r04-earnings-head">
          <div className="r04-earnings-badge">
            <Coins size={16} />
            <span>كشف المستحقات المالية للمدرب · شهر {earnings.month}</span>
          </div>
          <button
            type="button"
            className="r04-earnings-details-btn"
            onClick={() => setModalOpen(true)}
          >
            <FileSpreadsheet size={14} />
            <span>عرض تفاصيل الحصص ({earnings.sessions.length})</span>
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="r04-earnings-metrics">
          <div className="r04-metric-card primary">
            <div className="r04-metric-label">
              <CheckCircle2 size={15} />
              <span>المستحقات المكتسبة</span>
            </div>
            <div className="r04-metric-value">
              <strong>{earnings.accruedEgp.toLocaleString("ar-EG")}</strong>
              <small>ج.م</small>
            </div>
            <div className="r04-metric-sub">
              تم تنفيذ {earnings.completedSessionsCount} حصة معتمدة
            </div>
          </div>

          <div className="r04-metric-card">
            <div className="r04-metric-label">
              <CalendarDays size={15} />
              <span>الحصص المتبقية المجدولة</span>
            </div>
            <div className="r04-metric-value">
              <strong>{earnings.upcomingSessionsCount}</strong>
              <small>حصص</small>
            </div>
            <div className="r04-metric-sub">
              بمعدل {earnings.ratePerSessionEgp} ج.م / حصة
            </div>
          </div>

          <div className="r04-metric-card highlight">
            <div className="r04-metric-label">
              <TrendingUp size={15} />
              <span>المتوقع بنهاية الشهر</span>
            </div>
            <div className="r04-metric-value">
              <strong>{earnings.projectedTotalEgp.toLocaleString("ar-EG")}</strong>
              <small>ج.م</small>
            </div>
            <div className="r04-metric-sub">
              إجمالي {earnings.completedSessionsCount + earnings.upcomingSessionsCount} حصة متوقعة
            </div>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="r04-modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="r04-modal-dialog r04-earnings-dialog"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            <div className="r04-modal-header">
              <div>
                <h2>تفاصيل مستحقات الحصص المنفذة</h2>
                <p>
                  شهر {earnings.month} · الحساب يعتمد الحصص المكتملة فعليًا سواء كمدرب أساسي أو كبديل.
                </p>
              </div>
              <button
                type="button"
                className="r04-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="r04-earnings-dialog-summary">
              <div>
                <span>إجمالي الحصص:</span>
                <strong>{earnings.completedSessionsCount} حصة</strong>
              </div>
              <div>
                <span>سعر الحصة:</span>
                <strong>{earnings.ratePerSessionEgp} ج.م</strong>
              </div>
              <div>
                <span>المبلغ المستحق:</span>
                <strong className="earned-text">{earnings.accruedEgp.toLocaleString("ar-EG")} ج.م</strong>
              </div>
            </div>

            <div className="r04-earnings-table-wrap">
              {earnings.sessions.length === 0 ? (
                <div className="r04-empty-hint">
                  لم يتم إتمام أي حصة بعد خلال هذا الشهر. عند إتمام أول جلسة ستظهر هنا وتضاف مستحقاتها فورًا.
                </div>
              ) : (
                <table className="r04-earnings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>المجموعة / الدورة</th>
                      <th>تاريخ ووقت الجلسة</th>
                      <th>الدور</th>
                      <th>المستحق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.sessions.map((item, idx) => (
                      <tr key={item.sessionId}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{item.courseName}</strong>
                          <span className="sub-tag">حصة رقم {item.sessionNumber}</span>
                        </td>
                        <td>
                          <div>{formatDate(item.startAt)}</div>
                          <small>{formatTime(item.startAt)}</small>
                        </td>
                        <td>
                          {item.isSubstitute ? (
                            <span className="r04-badge substitute">مدرب بديل</span>
                          ) : (
                            <span className="r04-badge primary">مدرب أساسي</span>
                          )}
                        </td>
                        <td>
                          <strong className="earned-val">+{item.earnedEgp} ج.م</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="r04-modal-footer">
              <button
                type="button"
                className="r04-btn-close"
                onClick={() => setModalOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
