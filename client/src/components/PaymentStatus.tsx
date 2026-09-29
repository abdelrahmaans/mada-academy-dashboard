import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

export type PaymentStatusProps = {
  paid: number;
  partial: number;
  overdue: number;
  unpaid: number;
  onCollect: () => void;
};

export default function PaymentStatus({
  paid,
  partial,
  overdue,
  unpaid,
  onCollect,
}: PaymentStatusProps) {
  return (
    <section className="payment-status-card" aria-label="حالات الفواتير">
      <div className="payment-status-heading">
        <div>
          <span>حالة الفواتير</span>
          <h2>ما يحتاج إجراء اليوم</h2>
        </div>
        <button type="button" onClick={onCollect}>
          تسجيل تحصيل
        </button>
      </div>
      <div className="payment-status-grid">
        <span className="paid">
          <CheckCircle2 size={15} />
          <b>{paid}</b>
          <small>مدفوعة</small>
        </span>
        <span className="partial">
          <Clock3 size={15} />
          <b>{partial}</b>
          <small>جزئي</small>
        </span>
        <span className="overdue">
          <AlertCircle size={15} />
          <b>{overdue}</b>
          <small>متأخرة</small>
        </span>
        <span className="unpaid">
          <Clock3 size={15} />
          <b>{unpaid}</b>
          <small>غير مدفوعة</small>
        </span>
      </div>
      <p>
        <AlertCircle size={13} /> التحصيل يحدّث رصيد الفاتورة فقط؛ أي تصحيح بعد
        الإقفال يمر بطلب موثق.
      </p>
    </section>
  );
}
