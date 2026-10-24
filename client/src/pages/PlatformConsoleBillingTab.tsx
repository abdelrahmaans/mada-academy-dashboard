import React from "react";
import {
  Check,
  Clock3,
  CreditCard,
  FileSpreadsheet,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { PlatformPaymentRecord } from "@/lib/apiClient";
import {
  fmtDate,
  fmtNumber,
  SUBSCRIPTION_PLANS,
} from "./PlatformConsoleTypes";

export interface PlatformConsoleBillingTabProps {
  financials: {
    totalInflow: number;
    totalDue: number;
    monthlyCloudCost: number;
    annualCloudCost: number;
    netSurplus: number;
  };
  enrichedAcademies: Array<{ planCode?: string; [key: string]: unknown }>;
  payments: PlatformPaymentRecord[];
  exportPlatformCsv: () => void;
  onOpenPaymentModal: () => void;
}

export function PlatformConsoleBillingTab({
  financials,
  enrichedAcademies,
  payments,
  exportPlatformCsv,
  onOpenPaymentModal,
}: PlatformConsoleBillingTabProps) {
  return (
    <>
      {/* Financial Flow KPIs */}
      <section className="pc-finance-flow-grid" aria-label="مؤشرات التدفقات المالية للمنصة">
        <article className="pc-finance-card">
          <span className="pc-finance-card-icon inflow">
            <TrendingUp size={22} />
          </span>
          <div className="pc-finance-card-body">
            <small>التدفقات الداخلة (المحصل الفعلي)</small>
            <strong>{fmtNumber(financials.totalInflow)} ج.م</strong>
            <span>إجمالي اشتراكات الأكاديميات المسددة</span>
          </div>
        </article>

        <article className="pc-finance-card">
          <span className="pc-finance-card-icon due">
            <Clock3 size={22} />
          </span>
          <div className="pc-finance-card-body">
            <small>المبالغ المستحقة للتحصيل (Due)</small>
            <strong>{fmtNumber(financials.totalDue)} ج.م</strong>
            <span>أقساط سنوية وتجديدات تجريبية متوقعة</span>
          </div>
        </article>

        <article className="pc-finance-card">
          <span className="pc-finance-card-icon outflow">
            <TrendingDown size={22} />
          </span>
          <div className="pc-finance-card-body">
            <small>التدفقات الخارجة (تكاليف السيرفرات)</small>
            <strong>{fmtNumber(financials.monthlyCloudCost)} ج.م / شهر</strong>
            <span>خوادم .NET + قاعدة Supabase Frankfurt + Storage</span>
          </div>
        </article>

        <article className="pc-finance-card">
          <span className="pc-finance-card-icon net">
            <Wallet size={22} />
          </span>
          <div className="pc-finance-card-body">
            <small>صافي الفائض التشغيلي للمنصة</small>
            <strong>+{fmtNumber(financials.netSurplus)} ج.م</strong>
            <span>هامش ربح تشغيلي إيجابي للمنصة</span>
          </div>
        </article>
      </section>

      {/* Pricing Plans Card Grid */}
      <section className="pc-live-card pc-plans-section">
        <header>
          <div>
            <h2>خطط وأسعار باقات المنصة المعتمدة</h2>
            <p>
              تفاصيل الباقات الشهرية والسنوية، حدود الفروع، والحدود التشغيلية لكل أكاديمية.
            </p>
          </div>
          <span className="pc-live-boundary">
            <CreditCard size={14} /> 3 خطط رئيسية معتمدة
          </span>
        </header>
        <div className="pc-plans-grid">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`pc-plan-card ${plan.highlight ? "featured" : ""}`}
            >
              {plan.highlight && (
                <span className="pc-plan-badge">الأكثر طلباً</span>
              )}
              <div className="pc-plan-head">
                <h3>{plan.name}</h3>
                <p>{plan.tag}</p>
              </div>
              <div className="pc-plan-price">
                <strong>{fmtNumber(plan.priceAnnual)} ج.م</strong>
                <span>/ سنوياً</span>
                <small style={{ display: "block", color: "#64748b", marginTop: 4 }}>
                  أو {fmtNumber(plan.priceMonthly)} ج.م شهرياً
                </small>
              </div>
              <ul className="pc-plan-features">
                {plan.features.map((feat) => (
                  <li key={feat}>
                    <Check size={15} /> {feat}
                  </li>
                ))}
              </ul>
              <div className="pc-plan-footer">
                <span>الأكاديميات المشتركة:</span>
                <strong>
                  {fmtNumber(
                    enrichedAcademies.filter((a) => a.planCode === plan.code).length
                  )}{" "}
                  أكاديميات
                </strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Payments Ledger */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2>سجل فواتير ومدفوعات الاشتراكات (Billing & Payment Ledger)</h2>
            <p>
              عمليات السداد البنكي والإلكتروني المسجلة للأكاديميات المشتركة.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="pc-live-link"
              onClick={exportPlatformCsv}
              title="تصدير كشف اشتراكات المنصة إلى ملف إكسيل CSV"
            >
              <FileSpreadsheet size={15} /> تصدير كشف الاشتراكات
            </button>
            <button
              type="button"
              className="pc-live-primary"
              onClick={onOpenPaymentModal}
            >
              <Plus size={15} /> تسجيل دفعة جديدة
            </button>
          </div>
        </header>

        <div className="pc-live-table-wrap">
          <table className="pc-live-table">
            <thead>
              <tr>
                <th>رقم الإيصال / المعرف</th>
                <th>الأكاديمية المشتركة</th>
                <th>المبلغ المسدد</th>
                <th>طريقة الدفع</th>
                <th>رقم المرجع / التحويل</th>
                <th>تاريخ السداد</th>
                <th>المسؤول الموثق</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <th scope="row">
                    <strong>{p.id}</strong>
                    <small>{p.notes || "لا توجد ملاحظات"}</small>
                  </th>
                  <td>
                    <strong>{p.tenantName}</strong>
                    <small>{p.tenantId}</small>
                  </td>
                  <td>
                    <strong style={{ color: "#059669", fontSize: "13px" }}>
                      {fmtNumber(p.amount)} ج.م
                    </strong>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        fontWeight: 600,
                      }}
                    >
                      {p.method === "BANK_TRANSFER"
                        ? "تحويل بنكي"
                        : p.method === "INSTAPAY"
                        ? "إنستاباي"
                        : p.method === "FAWRY"
                        ? "فوري"
                        : p.method === "CREDIT_CARD"
                        ? "بطاقة ائتمان"
                        : "نقدي"}
                    </span>
                  </td>
                  <td>
                    <code>{p.referenceNumber}</code>
                  </td>
                  <td>{fmtDate(p.receivedAt)}</td>
                  <td>
                    <small>{p.recordedByName}</small>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="pc-live-empty-cell">
                    لا توجد مدفوعات مسجلة حتى الآن.
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
