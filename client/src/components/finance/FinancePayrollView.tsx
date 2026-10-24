import React, { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Calculator,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Lock,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import type { TrainerPayrollRecord } from "@/lib/apiClient";
import { Kpi, PanelTitle, money } from "./FinanceShared";

export function PayrollView({
  payrolls,
  onApprove,
  onPay,
  onUpdateAdjustments,
}: {
  payrolls: TrainerPayrollRecord[];
  onApprove: (id: string) => void;
  onPay: (id: string, method: string, reference?: string) => void;
  onUpdateAdjustments?: (id: string, bonus: number, bonusReason: string, deduction: number, deductionReason: string) => void;
}) {
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerPayrollRecord | null>(null);
  const [detailsTab, setDetailsTab] = useState<"sessions" | "slip">("sessions");
  const [bonusInput, setBonusInput] = useState<number>(0);
  const [bonusReasonInput, setBonusReasonInput] = useState<string>("");
  const [deductionInput, setDeductionInput] = useState<number>(0);
  const [deductionReasonInput, setDeductionReasonInput] = useState<string>("");

  // Payout Form Modal state
  const [payoutTarget, setPayoutTarget] = useState<TrainerPayrollRecord | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<string>("INSTAPAY");
  const [payoutReference, setPayoutReference] = useState<string>("");
  const [payoutNotes, setPayoutNotes] = useState<string>("");

  const totalNetPayable = payrolls
    .filter(p => p.status !== "PAID")
    .reduce((sum, p) => sum + p.netPayable, 0);

  const totalSessionsCompleted = payrolls.reduce((sum, p) => sum + p.completedSessionsCount, 0);

  const handleOpenTrainerDetails = (item: TrainerPayrollRecord) => {
    setSelectedTrainer(item);
    setDetailsTab("sessions");
    setBonusInput(item.bonusAmount || 0);
    setBonusReasonInput(item.bonusReason || "");
    setDeductionInput(item.deductionAmount || 0);
    setDeductionReasonInput(item.deductionReason || "");
  };

  const handleSaveAdjustments = () => {
    if (!selectedTrainer) return;
    if (selectedTrainer.status === "APPROVED" || selectedTrainer.status === "PAID") return;
    onUpdateAdjustments?.(selectedTrainer.id, Number(bonusInput) || 0, bonusReasonInput, Number(deductionInput) || 0, deductionReasonInput);
    const newNet = (selectedTrainer.completedSessionsCount * selectedTrainer.ratePerSession) + selectedTrainer.baseSalary + (Number(bonusInput) || 0) - (Number(deductionInput) || 0);
    setSelectedTrainer({
      ...selectedTrainer,
      bonusAmount: Number(bonusInput) || 0,
      bonusReason: bonusReasonInput,
      deductionAmount: Number(deductionInput) || 0,
      deductionReason: deductionReasonInput,
      netPayable: Math.max(0, newNet),
    });
  };

  const handleOpenPayoutForm = (item: TrainerPayrollRecord) => {
    setPayoutTarget(item);
    setPayoutMethod("INSTAPAY");
    setPayoutReference(`IPN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayoutNotes("");
  };

  const handleConfirmPayout = (e: FormEvent) => {
    e.preventDefault();
    if (!payoutTarget) return;
    const ref = payoutReference.trim() || `REC-${Date.now().toString().slice(-6)}`;
    onPay(payoutTarget.id, payoutMethod, ref);
    if (selectedTrainer?.id === payoutTarget.id) {
      setSelectedTrainer({
        ...selectedTrainer,
        status: "PAID",
        paymentMethod: payoutMethod,
        paymentReference: ref,
        paidAt: new Date().toISOString(),
      });
    }
    setPayoutTarget(null);
  };

  return (
    <section className="finance-desk-panel">
      <PanelTitle
        icon={<UserCheck size={18} />}
        title="مصاريف ومستحقات المدربين"
        action={
          <span className="finance-count-badge">
            شهر أكتوبر 2026
          </span>
        }
      />

      {/* Side by side 3 KPI Cards */}
      <div className="finance-desk-kpi-grid">
        <Kpi
          icon={<Wallet size={20} />}
          label="إجمالي مستحقات بانتظار الصرف"
          value={<>{money(totalNetPayable)} <bdi>ج.م</bdi></>}
          hint="صافي مستحقات المدربين"
          tone="amber"
        />
        <Kpi
          icon={<Clock3 size={20} />}
          label="إجمالي الحصص المنفذة المعتمدة"
          value={`${totalSessionsCompleted} حصة`}
          hint="مرصودة من سجلات الحضور"
          tone="teal"
        />
        <Kpi
          icon={<CheckCircle2 size={20} />}
          label="الرواتب والمسيرات المسددة"
          value={payrolls.filter(p => p.status === "PAID").length}
          hint="تم تسليمها للمدربين"
          tone="blue"
        />
      </div>

      {/* Table in full-width responsive horizontal container */}
      <div className="finance-table-wrapper">
        <table className="finance-desk-table">
          <thead>
            <tr>
              <th>كود المسير</th>
              <th>المدرب</th>
              <th>الحصص المنفذة</th>
              <th>سعر الحصة</th>
              <th>الأساسي / البدلات</th>
              <th>الاستقطاعات</th>
              <th>الصافي المستحق</th>
              <th>الحالة</th>
              <th>الإجراءات والتفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map(item => {
              const statusBadge =
                item.status === "PAID"
                  ? { label: "تم الصرف", bg: "rgba(16, 185, 129, 0.12)", color: "#059669" }
                  : item.status === "APPROVED"
                  ? { label: "معتمد للصرف", bg: "rgba(14, 165, 233, 0.12)", color: "#0284c7" }
                  : { label: "مسودة قيد التدقيق", bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };

              return (
                <tr key={item.id}>
                  <td>
                    <span className="finance-payroll-code">{item.id}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{item.instructorName}</strong>
                  </td>
                  <td>
                    <span className="finance-count-badge">{item.completedSessionsCount} حصة</span>
                  </td>
                  <td>
                    <span>{money(item.ratePerSession)} ج.م</span>
                  </td>
                  <td>
                    <span>{money(item.baseSalary + item.bonusAmount)} ج.م</span>
                    {item.bonusAmount > 0 && (
                      <div>
                        <span className="finance-bonus-tag" title={item.bonusReason}>
                          +{money(item.bonusAmount)} بونص
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    {item.deductionAmount > 0 ? (
                      <span className="finance-deduction-tag" title={item.deductionReason}>
                        -{money(item.deductionAmount)} خصم
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong className="finance-net-payable">{money(item.netPayable)} ج.م</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        display: "inline-block",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenTrainerDetails(item)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "7px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: "#f8fafc",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Eye size={14} /> تفاصيل الحساب والحصص
                      </button>

                      {item.status === "SUBMITTED" && (
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ padding: "5px 12px", fontSize: "0.8rem", whiteSpace: "nowrap", fontWeight: 700 }}
                          onClick={() => onApprove(item.id)}
                        >
                          <Check size={14} /> اعتماد المسير
                        </button>
                      )}

                      {item.status === "APPROVED" && (
                        <button
                          type="button"
                          className="button button-primary"
                          style={{
                            padding: "5px 12px",
                            fontSize: "0.8rem",
                            background: "#0d9488",
                            color: "#fff",
                            whiteSpace: "nowrap",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                          onClick={() => handleOpenPayoutForm(item)}
                        >
                          <CreditCard size={14} /> صرف الراتب
                        </button>
                      )}

                      {item.status === "PAID" && (
                        <span style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 600, background: "#ecfdf5", padding: "4px 8px", borderRadius: "6px", border: "1px solid #a7f3d0", whiteSpace: "nowrap" }}>
                          ✓ مسدد ({item.paymentMethod})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trainer Detailed Breakdown & Adjustments Modal */}
      {selectedTrainer && (
        <div className="finance-modal-backdrop" onClick={() => setSelectedTrainer(null)}>
          <div className="finance-modal-content" onClick={e => e.stopPropagation()} dir="rtl" style={{ maxWidth: "780px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f0fdfa", color: "#0f766e", display: "grid", placeItems: "center" }}>
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    كشف حساب ومستحقات المدرب: {selectedTrainer.instructorName}
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    كود المسير: <bdi>{selectedTrainer.id}</bdi> · شهر أكتوبر 2026 · معدل الحصة: {money(selectedTrainer.ratePerSession)} ج.م
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrainer(null)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="finance-modal-tabs">
              <button
                type="button"
                className={`finance-modal-tab-btn ${detailsTab === "sessions" ? "active" : ""}`}
                onClick={() => setDetailsTab("sessions")}
              >
                <CalendarDays size={15} /> سجل الجلسات والحصص المعتمدة ({selectedTrainer.completedSessionsCount} حصة)
              </button>
              <button
                type="button"
                className={`finance-modal-tab-btn ${detailsTab === "slip" ? "active" : ""}`}
                onClick={() => setDetailsTab("slip")}
              >
                <FileText size={15} /> الفاتورة وسند الاستحقاق المالي
              </button>
            </div>

            {/* TAB 1: SESSIONS LEDGER */}
            {detailsTab === "sessions" && (
              <>
                {/* Financial Summary Strip */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>الحصص المنفذة:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                        {selectedTrainer.completedSessionsCount} × {selectedTrainer.ratePerSession} = {money(selectedTrainer.completedSessionsCount * selectedTrainer.ratePerSession)} ج.م
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>الراتب الأساسي:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{money(selectedTrainer.baseSalary)} ج.م</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#059669", display: "block" }}>المكافآت (بونص):</span>
                      <strong style={{ fontSize: "0.95rem", color: "#059669" }}>+{money(selectedTrainer.bonusAmount)} ج.م</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#dc2626", display: "block" }}>الاستقطاعات:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#dc2626" }}>-{money(selectedTrainer.deductionAmount)} ج.م</strong>
                    </div>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#166534", display: "block", fontWeight: 600 }}>الصافي المستحق:</span>
                      <strong style={{ fontSize: "1.15rem", color: "#15803d" }}>{money(selectedTrainer.netPayable)} ج.م</strong>
                    </div>
                  </div>

                  {/* Adjustments Editor (Bonus & Deductions) with Locked State */}
                  <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#334155" }}>
                        تعديل المكافآت والاستقطاعات (قبل الاعتماد النهائي):
                      </span>
                      {selectedTrainer.status !== "SUBMITTED" && (
                        <span style={{ fontSize: "0.74rem", color: "#b45309", background: "#fef3c7", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                          <Lock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> المسير معتمد ومقفل للتعديل
                        </span>
                      )}
                    </div>

                    {selectedTrainer.status === "SUBMITTED" ? (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                          <div>
                            <label style={{ fontSize: "0.75rem", color: "#059669", display: "block", marginBottom: "3px", fontWeight: 600 }}>مبلغ المكافأة (ج.م):</label>
                            <input
                              type="number"
                              value={bonusInput}
                              onChange={e => setBonusInput(Number(e.target.value) || 0)}
                              style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.82rem" }}
                            />
                            <input
                              type="text"
                              placeholder="سبب المكافأة (مثال: تميز في تحضير المشروعات)"
                              value={bonusReasonInput}
                              onChange={e => setBonusReasonInput(e.target.value)}
                              style={{ width: "100%", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", padding: "0 8px", fontSize: "0.75rem", marginTop: "4px" }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "0.75rem", color: "#dc2626", display: "block", marginBottom: "3px", fontWeight: 600 }}>مبلغ الاستقطاع / الخصم (ج.م):</label>
                            <input
                              type="number"
                              value={deductionInput}
                              onChange={e => setDeductionInput(Number(e.target.value) || 0)}
                              style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.82rem" }}
                            />
                            <input
                              type="text"
                              placeholder="سبب الخصم (مثال: تأخير عن بدء الحصة)"
                              value={deductionReasonInput}
                              onChange={e => setDeductionReasonInput(e.target.value)}
                              style={{ width: "100%", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", padding: "0 8px", fontSize: "0.75rem", marginTop: "4px" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={handleSaveAdjustments}
                            style={{
                              background: "#334155",
                              color: "#fff",
                              border: 0,
                              borderRadius: "6px",
                              padding: "5px 12px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Calculator size={13} /> تطبيق التعديل وتحديث الصافي
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="payroll-locked-banner">
                        <Lock size={15} />
                        <span>
                          <strong>المسير معتمد نهائياً ومقفل:</strong> المكافآت والخصومات مسجلة وموثقة رسمياً في القيود المالية ولا يمكن تعديلها بعد اعتماد المسير لضمان سلامة التدقيق والمطابقة.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sessions Table */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CalendarDays size={15} className="text-teal-600" />
                    <span>سجل الحصص المنفذة المعتمدة تفصيلياً ({selectedTrainer.sessions?.length || selectedTrainer.completedSessionsCount} حصة):</span>
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", maxHeight: "280px", overflowY: "auto" }}>
                    <table style={{ width: "100%", fontSize: "0.78rem", textAlign: "right", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "8px 10px" }}>كود الحصة</th>
                          <th style={{ padding: "8px 10px" }}>الكورس والمجموعة</th>
                          <th style={{ padding: "8px 10px" }}>التاريخ والوقت</th>
                          <th style={{ padding: "8px 10px" }}>القاعة</th>
                          <th style={{ padding: "8px 10px" }}>الحضور</th>
                          <th style={{ padding: "8px 10px" }}>الحالة</th>
                          <th style={{ padding: "8px 10px" }}>المستحق</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrainer.sessions && selectedTrainer.sessions.length > 0 ? (
                          selectedTrainer.sessions.map(s => (
                            <tr key={s.sessionId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: 700 }}>{s.sessionId}</td>
                              <td style={{ padding: "8px 10px", fontWeight: 600, color: "#0f172a" }}>{s.courseName} · {s.groupName}</td>
                              <td style={{ padding: "8px 10px", color: "#475569" }}>{s.date} ({s.time})</td>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{s.room}</td>
                              <td style={{ padding: "8px 10px", color: "#0f766e", fontWeight: 600 }}>{s.attendanceCount} طلاب</td>
                              <td style={{ padding: "8px 10px" }}>
                                <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", background: "#ecfdf5", color: "#059669", fontWeight: 600 }}>
                                  معتمدة من رئيس المدربين
                                </span>
                              </td>
                              <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0f172a" }}>{money(s.rate)} ج.م</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                              تم استيراد واعتماد {selectedTrainer.completedSessionsCount} حصة من سجلات حضور الطلاب بواسطة رئيس المدربين.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: FINANCIAL SALARY SLIP / INVOICE VIEW */}
            {detailsTab === "slip" && (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "20px", background: "#ffffff", marginBottom: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f766e", paddingBottom: "12px", marginBottom: "16px" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f766e", fontWeight: 800 }}>أكاديمية مدى للروبوتكس والذكاء الاصطناعي</h2>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>سند استحقاق مسير مالي وأتعاب تدريب · قسم الحسابات</span>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>رقم السند المالي:</span>
                    <strong style={{ fontFamily: "monospace", fontSize: "0.95rem", color: "#0f172a" }}>{selectedTrainer.id}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "2px" }}>شهر: أكتوبر 2026</span>
                  </div>
                </div>

                {/* Trainer Meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.82rem" }}>
                  <div>اسم المدرب: <strong>{selectedTrainer.instructorName}</strong></div>
                  <div>الفرع المعتمد: <strong>مدينة نصر</strong></div>
                  <div>كود المدرب: <strong>{selectedTrainer.instructorId}</strong></div>
                  <div>تاريخ الإصدار: <strong>{new Date().toISOString().slice(0, 10)}</strong></div>
                </div>

                {/* Items Breakdown Table */}
                <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse", marginBottom: "16px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#334155" }}>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>البند المالي</th>
                      <th style={{ padding: "8px 10px", textAlign: "center" }}>التفاصيل والمعدل</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>المبلغ المستحق</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>أتعاب الحصص المعملية المنفذة</td>
                      <td style={{ padding: "10px", textAlign: "center", color: "#64748b" }}>{selectedTrainer.completedSessionsCount} حصة × {money(selectedTrainer.ratePerSession)} ج.م</td>
                      <td style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>{money(selectedTrainer.completedSessionsCount * selectedTrainer.ratePerSession)} ج.م</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>الراتب الأساسي / البدلات الثابتة</td>
                      <td style={{ padding: "10px", textAlign: "center", color: "#64748b" }}>راتب إشرافي أساسي</td>
                      <td style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>{money(selectedTrainer.baseSalary)} ج.م</td>
                    </tr>
                    {selectedTrainer.bonusAmount > 0 && (
                      <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f0fdf4" }}>
                        <td style={{ padding: "10px", fontWeight: 600, color: "#166534" }}>مكافأة تميز وحوافز</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "#166534" }}>{selectedTrainer.bonusReason || "مكافأة معتمدة"}</td>
                        <td style={{ padding: "10px", textAlign: "left", fontWeight: 700, color: "#166534" }}>+{money(selectedTrainer.bonusAmount)} ج.م</td>
                      </tr>
                    )}
                    {selectedTrainer.deductionAmount > 0 && (
                      <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#fef2f2" }}>
                        <td style={{ padding: "10px", fontWeight: 600, color: "#991b1b" }}>استقطاعات وخصومات</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "#991b1b" }}>{selectedTrainer.deductionReason || "استقطاع غياب أو تأخير"}</td>
                        <td style={{ padding: "10px", textAlign: "left", fontWeight: 700, color: "#991b1b" }}>-{money(selectedTrainer.deductionAmount)} ج.م</td>
                      </tr>
                    )}
                    <tr style={{ background: "#f8fafc", fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: "12px 10px", fontSize: "0.95rem", color: "#0f172a" }}>الصافي النهائي المعتمد للصرف:</td>
                      <td style={{ padding: "12px 10px", textAlign: "left", fontSize: "1.1rem", color: "#0f766e" }}>{money(selectedTrainer.netPayable)} ج.م</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Stamp */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {selectedTrainer.status === "PAID" ? (
                      <span style={{ color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={16} /> تم سداد وصرف الراتب بالكامل عبر {selectedTrainer.paymentMethod} (مرجع: {selectedTrainer.paymentReference})
                      </span>
                    ) : selectedTrainer.status === "APPROVED" ? (
                      <span style={{ color: "#0284c7", fontWeight: 700 }}>
                        ✓ معتمد نهائياً للصرف وجاهز لتسجيل الإيصال المالي
                      </span>
                    ) : (
                      <span style={{ color: "#d97706", fontWeight: 600 }}>
                        ⏳ مسودة قيد التدقيق لدى المحاسبة ومدير الفرع
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Printer size={14} /> طباعة السند المالي
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons in Modal */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setSelectedTrainer(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
              >
                إغلاق
              </button>

              {selectedTrainer.status === "SUBMITTED" && (
                <button
                  type="button"
                  onClick={() => {
                    onApprove(selectedTrainer.id);
                    setSelectedTrainer({ ...selectedTrainer, status: "APPROVED" });
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: 0,
                    background: "#0284c7",
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
                  <span>اعتماد المسير المالي</span>
                </button>
              )}

              {selectedTrainer.status === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => handleOpenPayoutForm(selectedTrainer)}
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
                  <CreditCard size={16} />
                  <span>صرف الراتب وتوثيق السند ({money(selectedTrainer.netPayable)} ج.م)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Payout Modal Form */}
      {payoutTarget && (
        <div className="finance-modal-backdrop" onClick={() => setPayoutTarget(null)}>
          <div className="finance-modal-content" onClick={e => e.stopPropagation()} dir="rtl" style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#f0fdf4", color: "#0d9488", display: "grid", placeItems: "center" }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    صرف مستحقات الراتب المعتمدة
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    المدرب: <strong>{payoutTarget.instructorName}</strong> · كود: <bdi>{payoutTarget.id}</bdi>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayoutTarget(null)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="payout-form-card">
              {/* Financial Calculation Summary Box */}
              <div className="payout-callout-box">
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#166534", display: "block" }}>
                    إجمالي المستحق المعتمد للصرف ({payoutTarget.completedSessionsCount} حصة):
                  </span>
                  <div style={{ fontSize: "0.76rem", color: "#15803d", marginTop: "2px" }}>
                    حصص: {money(payoutTarget.completedSessionsCount * payoutTarget.ratePerSession)} ج.م
                    {payoutTarget.bonusAmount > 0 && ` + بونص: ${money(payoutTarget.bonusAmount)}`}
                    {payoutTarget.deductionAmount > 0 && ` - خصم: ${money(payoutTarget.deductionAmount)}`}
                  </div>
                </div>
                <strong style={{ fontSize: "1.35rem", color: "#0f766e", fontWeight: 800 }}>
                  {money(payoutTarget.netPayable)} ج.م
                </strong>
              </div>

              {/* Payment Method */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                طريقة الصرف والتحويل *
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                  style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem", background: "#fff" }}
                >
                  <option value="INSTAPAY">تحويل لحظي InstaPay (IPN)</option>
                  <option value="CASH">صرف نقدًا من خزينة الفرع</option>
                  <option value="VODAFONE_CASH">محفظة فودافون كاش / إلكترونية</option>
                  <option value="BANK_TRANSFER">تحويل بنكي رسمي (IBAN)</option>
                </select>
              </label>

              {/* Reference Number */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                رقم الإيصال أو مرجع العملية البنكية *
                <input
                  type="text"
                  required
                  placeholder="مثال: IPN-984210 أو سند صرف 204"
                  value={payoutReference}
                  onChange={e => setPayoutReference(e.target.value)}
                  style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem" }}
                />
              </label>

              {/* Notes */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                ملاحظات الصرف والتوثيق (اختياري)
                <input
                  type="text"
                  placeholder="مثال: تم إرسال إشعار التحويل للمدرب عبر واتساب"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem" }}
                />
              </label>

              {/* Attestation Note */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px", fontSize: "0.78rem", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} className="text-teal-600" />
                <span>أقر أنا المحاسب المسؤول بصرف المبلغ المعتمد أعلاه وتوثيق السند في الخزينة والقيود المالية.</span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setPayoutTarget(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: 0,
                    background: "#0d9488",
                    color: "#fff",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>تأكيد صرف الراتب وتوثيق السند ({money(payoutTarget.netPayable)} ج.م)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
