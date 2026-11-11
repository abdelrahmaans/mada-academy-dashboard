import { Building2, CircleDollarSign, CreditCard, Plus } from "lucide-react";
import type { PlatformPaymentRecord } from "@/lib/apiClient";
import { fmtDate, fmtNumber } from "./PlatformConsoleTypes";
import { Metric } from "./PlatformConsoleComponents";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "تحويل بنكي",
  INSTAPAY: "إنستا باي (InstaPay)",
  FAWRY: "فوري (Fawry)",
  CREDIT_CARD: "بطاقة ائتمان",
  CASH: "نقدي",
  VODAFONE_CASH: "فودافون كاش",
};

export interface PlatformConsoleBillingTabProps {
  payments: PlatformPaymentRecord[];
  totalRevenue: number;
  onOpenPaymentModal: () => void;
}

export function PlatformConsoleBillingTab({
  payments,
  totalRevenue,
  onOpenPaymentModal,
}: PlatformConsoleBillingTabProps) {
  const latestPayment = payments[0] ?? null;
  const distinctAcademiesCount = new Set(payments.map((p) => p.tenantId)).size;

  return (
    <>
      <section className="pc-live-metrics" aria-label="ملخص تحصيل الاشتراكات">
        <Metric
          icon={<CircleDollarSign />}
          label="إجمالي التحصيل المسجل"
          value={`${fmtNumber(totalRevenue)} ج.م`}
          note="من سجل دفعات الاشتراكات"
        />
        <Metric
          icon={<CreditCard />}
          label="عدد عمليات السداد"
          value={fmtNumber(payments.length)}
          note="معاملات موثقة في قاعدة البيانات"
        />
        <Metric
          icon={<Building2 />}
          label="أكاديميات مسددة"
          value={fmtNumber(distinctAcademiesCount)}
          note="أكاديميات لها سجل سداد فعلي"
        />
        <Metric
          icon={<CreditCard />}
          label="أحدث دفعة مستلمة"
          value={latestPayment ? `${fmtNumber(latestPayment.amount)} ج.م` : "لا توجد"}
          note={latestPayment ? latestPayment.tenantName : "بانتظار تسجيل أول دفعة"}
        />
      </section>

      <section className="pc-live-card">
        <header>
          <div>
            <h2>سجل التحصيل واشتراكات الأكاديميات</h2>
            <p>
              كشف الدفعات والتحويلات المالية الموثقة لكل أكاديمية في قاعدة بيانات المنصة.
            </p>
          </div>
          <button type="button" className="pc-live-primary" onClick={onOpenPaymentModal}>
            <Plus size={15} /> تسجيل دفعة اشتراك
          </button>
        </header>

        <div className="pc-live-table-wrap">
          <table className="pc-live-table">
            <thead>
              <tr>
                <th>الأكاديمية</th>
                <th>المبلغ (ج.م)</th>
                <th>وسيلة الدفع</th>
                <th>المرجع المالي</th>
                <th>تاريخ الاستلام</th>
                <th>مسجّل بواسطة</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <strong>{payment.tenantName}</strong>
                  </td>
                  <td>
                    <strong style={{ color: "#047857" }}>{fmtNumber(payment.amount)} ج.م</strong>
                  </td>
                  <td>
                    <span className="pc-live-status-tag">
                      {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                    </span>
                  </td>
                  <td>
                    <code>{payment.referenceNumber}</code>
                  </td>
                  <td>
                    <small>{fmtDate(payment.receivedAt)}</small>
                  </td>
                  <td>
                    <small>{payment.recordedByName}</small>
                  </td>
                  <td>
                    <small style={{ color: "#64748b" }}>{payment.notes || "—"}</small>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="pc-live-empty-cell">
                    لا توجد دفعات اشتراك مسجلة حتى الآن. استخدم زر تسجيل دفعة لإضافة أول معاملة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
