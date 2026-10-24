import React, { useState } from "react";
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileCheck2,
  Printer,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import type { ShiftCashHandover } from "@/lib/apiClient";
import { Kpi, PanelTitle, money } from "./FinanceShared";

export function ShiftsView({
  handovers,
  onAccept,
  accountantName: _accountantName,
}: {
  handovers: ShiftCashHandover[];
  onAccept: (id: string, notes?: string) => void;
  accountantName: string;
}) {
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<ShiftCashHandover | null>(null);
  const [handoverNoteInput, setHandoverNoteInput] = useState<string>("تم استلام النقدية بالكامل ومطابقة السندات مع الدرج");

  const pendingTotalCash = handovers
    .filter(h => h.status === "SUBMITTED")
    .reduce((sum, h) => sum + h.cashAmount, 0);

  const pendingCount = handovers.filter(h => h.status === "SUBMITTED").length;

  return (
    <section className="finance-desk-panel">
      <PanelTitle
        icon={<Banknote size={18} />}
        title="استلام عهدة ورديات الاستقبال (الكاش)"
        action={
          <span className="finance-count-badge">
            {pendingCount} ورديات بانتظار الاستلام
          </span>
        }
      />

      {/* Side by side 3 KPI Cards */}
      <div className="finance-desk-kpi-grid">
        <Kpi
          icon={<Banknote size={20} />}
          label="إجمالي كاش بانتظار التوريد للخزينة"
          value={<>{money(pendingTotalCash)} <bdi>ج.م</bdi></>}
          hint="نقدية في شباك الاستقبال"
          tone="amber"
        />
        <Kpi
          icon={<CheckCircle2 size={20} />}
          label="ورديات معتمدة بالكامل"
          value={handovers.filter(h => h.status === "ACCEPTED").length}
          hint="تم توريدها لحساب الخزينة"
          tone="teal"
        />
        <Kpi
          icon={<AlertCircle size={20} />}
          label="ورديات بها فروقات / عجز"
          value={handovers.filter(h => h.status === "DISCREPANCY").length}
          hint="تحتاج تسوية فورية"
          tone="blue"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {handovers.map(shift => {
          const isPending = shift.status === "SUBMITTED";
          const isAccepted = shift.status === "ACCEPTED";

          return (
            <article
              key={shift.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{shift.id}</span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    وردية {shift.shiftName === "MORNING" ? "صباحية" : "مسائية"} · {shift.shiftDate} · فرع {shift.branchName}
                  </span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: isAccepted ? "rgba(16, 185, 129, 0.12)" : isPending ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: isAccepted ? "#059669" : isPending ? "#d97706" : "#dc2626",
                    }}
                  >
                    {isAccepted ? "تم الاستلام والمطابقة ✓" : isPending ? "بانتظار استلام المحاسب" : "يوجد فرق / عجز"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShiftForDetails(shift);
                      setHandoverNoteInput(shift.notes || "تم استلام النقدية بالكامل ومطابقة السندات مع الدرج");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Eye size={14} /> عرض تفاصيل الوردية والسندات
                  </button>

                  {isPending && (
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        background: "#0d9488",
                        color: "#fff",
                        border: 0,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => {
                        const note = window.prompt("ملاحظة الاستلام (اختياري):", "تم استلام النقدية بالكامل ومطابقة السندات");
                        onAccept(shift.id, note || undefined);
                      }}
                    >
                      <Check size={14} /> استلام وتوريد للخزينة
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", background: "rgba(248, 250, 252, 0.8)", padding: "12px", borderRadius: "8px" }}>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>النقدية في الخزينة (الكاش)</small>
                  <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{money(shift.cashAmount)} ج.م</strong>
                </div>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>التحصيل الإلكتروني (Visa/InstaPay)</small>
                  <strong style={{ fontSize: "1.05rem", color: "#475569" }}>{money(shift.electronicAmount)} ج.م</strong>
                </div>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>عدد سندات القبض</small>
                  <strong style={{ fontSize: "1.05rem", color: "#475569" }}>{shift.totalReceiptsCount} إيصالات</strong>
                </div>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>مسؤول الشيفت (الاستقبال)</small>
                  <strong style={{ fontSize: "0.92rem", color: "#334155" }}>{shift.submittedByName}</strong>
                </div>
              </div>

              {shift.notes && (
                <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                  <strong>الملاحظات:</strong> {shift.notes}
                </div>
              )}

              {shift.receivedByName && (
                <div style={{ fontSize: "0.78rem", color: "#059669", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
                  تم الاستلام والاعتماد بواسطة: <b>{shift.receivedByName}</b>{shift.receivedAt ? ` في ${new Date(shift.receivedAt).toLocaleString("ar-EG")}` : ""}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Shift Detailed Breakdown Modal */}
      {selectedShiftForDetails && (
        <div className="finance-modal-backdrop" onClick={() => setSelectedShiftForDetails(null)}>
          <div className="finance-modal-content" onClick={e => e.stopPropagation()} dir="rtl">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#e0f2fe", color: "#0369a1", display: "grid", placeItems: "center" }}>
                  <Banknote size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    محضر وتفاصيل وردية الاستقبال: {selectedShiftForDetails.id}
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    وردية {selectedShiftForDetails.shiftName === "MORNING" ? "صباحية" : "مسائية"} · {selectedShiftForDetails.shiftDate} · فرع {selectedShiftForDetails.branchName} · مسؤول الوردية: {selectedShiftForDetails.submittedByName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetails(null)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Shift Breakdown Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "18px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>رصيد بداية الدرج (Float):</span>
                <strong style={{ fontSize: "1rem", color: "#334155" }}>{money(selectedShiftForDetails.openingFloat || 500)} ج.م</strong>
              </div>
              <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#0f766e", display: "block" }}>كاش محصل بالسندات:</span>
                <strong style={{ fontSize: "1.05rem", color: "#0d9488" }}>{money(selectedShiftForDetails.cashAmount)} ج.م</strong>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#1d4ed8", display: "block" }}>إلكتروني (Visa/IPN):</span>
                <strong style={{ fontSize: "1.05rem", color: "#2563eb" }}>{money(selectedShiftForDetails.electronicAmount)} ج.م</strong>
              </div>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#b45309", display: "block" }}>النقدية الفعلية للتسليم:</span>
                <strong style={{ fontSize: "1.05rem", color: "#d97706" }}>{money(selectedShiftForDetails.cashAmount)} ج.م</strong>
              </div>
            </div>

            {/* Receipts List */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                  سجل سندات القبض التفصيلية المسجلة بالوردية ({selectedShiftForDetails.receipts?.length || selectedShiftForDetails.totalReceiptsCount} إيصال):
                </strong>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: "0.8rem", textAlign: "right", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                      <th style={{ padding: "8px 12px" }}>رقم السند</th>
                      <th style={{ padding: "8px 12px" }}>اسم الطالب</th>
                      <th style={{ padding: "8px 12px" }}>الخدمة / الكورس</th>
                      <th style={{ padding: "8px 12px" }}>طريقة الدفع</th>
                      <th style={{ padding: "8px 12px" }}>المبلغ</th>
                      <th style={{ padding: "8px 12px" }}>التوقيت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedShiftForDetails.receipts && selectedShiftForDetails.receipts.length > 0) ? (
                      selectedShiftForDetails.receipts.map(r => (
                        <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700 }}>{r.receiptNumber}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: "#0f172a" }}>{r.studentName}</td>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>{r.courseName}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ fontSize: "0.72rem", padding: "2px 6px", borderRadius: "4px", background: r.paymentMethod === "CASH" ? "#ecfdf5" : "#eff6ff", color: r.paymentMethod === "CASH" ? "#047857" : "#1d4ed8" }}>
                              {r.paymentMethod === "CASH" ? "نقدي" : r.paymentMethod}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0f172a" }}>{money(r.amount)} ج.م</td>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>{r.time}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                          تم تسجيل {selectedShiftForDetails.totalReceiptsCount} سندات قبض نقدية وإلكترونية بإجمالي {money(selectedShiftForDetails.cashAmount + selectedShiftForDetails.electronicAmount)} ج.م.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Handover & Acceptance Notes */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                ملاحظات استلام ومطابقة الخزينة:
              </label>
              <input
                type="text"
                value={handoverNoteInput}
                onChange={e => setHandoverNoteInput(e.target.value)}
                style={{ width: "100%", height: "36px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.82rem", outline: 0 }}
                placeholder="أدخل أي ملاحظات حول الفروقات أو العجز..."
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetails(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
              >
                إغلاق
              </button>
              {selectedShiftForDetails.status === "SUBMITTED" && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept(selectedShiftForDetails.id, handoverNoteInput || undefined);
                    setSelectedShiftForDetails(null);
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: 0,
                    background: "#0d9488",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Check size={16} />
                  <span>تأكيد استلام العهدة وتوريدها للخزينة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

