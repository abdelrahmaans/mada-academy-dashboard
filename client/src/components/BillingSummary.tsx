import { ArrowUpLeft, FileText, Wallet } from "lucide-react";

export type BillingSummaryProps = {
  billed: number;
  collected: number;
  receivables: number;
  overdue: number;
  formatMoney: (value: number) => string;
  onOpenInvoices: () => void;
};

export default function BillingSummary({
  billed,
  collected,
  receivables,
  overdue,
  formatMoney,
  onOpenInvoices,
}: BillingSummaryProps) {
  const ratio = billed ? Math.round((collected / billed) * 100) : 0;
  return (
    <section className="billing-summary" aria-label="ملخص الفوترة والتحصيل">
      <div className="billing-summary-heading">
        <div>
          <span className="billing-summary-kicker">
            R06 · Financials & Billing
          </span>
          <h2>دورة الفوترة والتحصيل</h2>
          <p>
            من فاتورة التسجيل حتى المتبقي والتأخرات، في ملخص واحد قابل للمراجعة.
          </p>
        </div>
        <button type="button" onClick={onOpenInvoices}>
          <FileText size={14} /> فتح كل الفواتير <ArrowUpLeft size={13} />
        </button>
      </div>
      <div className="billing-summary-meter">
        <div>
          <span>نسبة التحصيل</span>
          <strong>{ratio}%</strong>
        </div>
        <i>
          <em style={{ width: `${ratio}%` }} />
        </i>
        <small>
          <bdi dir="ltr">{formatMoney(collected)}</bdi> محصل من{" "}
          <bdi dir="ltr">{formatMoney(billed)}</bdi> إجمالي الفواتير
        </small>
      </div>
      <div className="billing-summary-values">
        <span>
          <Wallet size={14} />
          <small>المستحق</small>
          <bdi dir="ltr">{formatMoney(receivables)} ج.م</bdi>
        </span>
        <span>
          <small>المتأخرات</small>
          <bdi dir="ltr">{formatMoney(overdue)} ج.م</bdi>
        </span>
      </div>
    </section>
  );
}
