import React from "react";
import {
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  KeyRound,
  Megaphone,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  PlatformAcademy,
  PlatformDemoLead,
  PlatformPaymentRecord,
} from "@/lib/apiClient";
import {
  fmtNumber,
  reasonValid,
  STATUS_LABEL,
  SUBSCRIPTION_PLANS,
  TICKET_PRIORITY_LABELS,
  type ReasonModalState,
  type SupportTicket,
} from "./PlatformConsoleTypes";

// ─── MODAL 1: PLAN UPGRADE & BRANCH LIMITS ────────────────────────────────────

export type PlanCode = "starter" | "growth" | "enterprise";

export interface PlanUpgradeModalProps {
  academy: PlatformAcademy | null;
  onClose: () => void;
  selectedPlanCode: PlanCode;
  setSelectedPlanCode: React.Dispatch<React.SetStateAction<PlanCode>>;
  customBranchLimit: number;
  setCustomBranchLimit: (val: number) => void;
  planUpgradeReason: string;
  setPlanUpgradeReason: (val: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export function PlanUpgradeModal({
  academy,
  onClose,
  selectedPlanCode,
  setSelectedPlanCode,
  customBranchLimit,
  setCustomBranchLimit,
  planUpgradeReason,
  setPlanUpgradeReason,
  onSave,
}: PlanUpgradeModalProps) {
  if (!academy) return null;

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-ticket-dialog" dir="rtl">
        <div className="pc-ticket-dialog-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="#0d9488" />
              ترقية وتعديل باقة: {academy.name}
            </h3>
            <small style={{ color: "#64748b" }}>
              كود التينانت: {academy.id} · الفروع الحالية: {academy.branches}
            </small>
          </div>
          <button
            type="button"
            className="pc-ticket-dialog-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSave} style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700 }}>اختر الباقة المستهدفة</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanCode(plan.code);
                    setCustomBranchLimit(plan.branchesLimit);
                  }}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "10px",
                    border:
                      selectedPlanCode === plan.code
                        ? "2px solid #0d9488"
                        : "1px solid #cbd5e1",
                    background:
                      selectedPlanCode === plan.code ? "#f0fdfa" : "#ffffff",
                    textAlign: "center",
                    cursor: "pointer",
                    display: "grid",
                    gap: "4px",
                  }}
                >
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {plan.name.split("(")[0]}
                  </strong>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {fmtNumber(plan.priceAnnual)} ج.م / سنة
                  </span>
                  <small style={{ fontSize: "10px", color: "#0d9488", fontWeight: 700 }}>
                    حد {plan.branchesLimit} فروع
                  </small>
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>الحد الأقصى للفروع المصرح بها للأكاديمية</span>
            <input
              type="number"
              min={1}
              max={99}
              value={customBranchLimit}
              onChange={(e) => setCustomBranchLimit(Number(e.target.value))}
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontWeight: 700,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>
              سبب الترقية / التعديل (إلزامي للتوثيق في سجل التدقيق R00) <span style={{ color: "#dc2626" }}>*</span>
            </span>
            <input
              required
              value={planUpgradeReason}
              onChange={(e) => setPlanUpgradeReason(e.target.value)}
              placeholder="مثال: ترقية لاشتراك سنوي مدفوع بشيك بنكي رقم 4421..."
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
              }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              className="pc-live-link"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="pc-live-primary"
              disabled={!reasonValid(planUpgradeReason)}
            >
              اعتماد الترقية وتحديث الحدود
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MODAL 2: OWNER PASSWORD RECOVERY ─────────────────────────────────────────

export interface OwnerResetResult {
  tenantName: string;
  ownerName: string;
  ownerPhone: string;
  tempPassword: string;
}

export interface OwnerPasswordModalProps {
  resetResult: OwnerResetResult | null;
  onClose: () => void;
}

export function OwnerPasswordModal({ resetResult, onClose }: OwnerPasswordModalProps) {
  if (!resetResult) return null;

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-ticket-dialog" dir="rtl">
        <div className="pc-ticket-dialog-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <KeyRound size={18} color="#059669" />
              تم توليد كلمة مرور مؤقتة لمالك الأكاديمية
            </h3>
            <small style={{ color: "#64748b" }}>
              {resetResult.tenantName} · {resetResult.ownerName}
            </small>
          </div>
          <button
            type="button"
            className="pc-ticket-dialog-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            display: "grid",
            gap: "12px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#166534", lineHeight: "1.7" }}>
            يرجى مشاركة كلمة المرور المؤقتة التالية مع المالك (على هاتفه أو واتساب). سيطلب منه النظام تغييرها فور تسجيل دخوله الأول:
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#ffffff",
              border: "1px dashed #16a34a",
            }}
          >
            <code
              style={{
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "2px",
                color: "#15803d",
              }}
            >
              {resetResult.tempPassword}
            </code>
            <button
              type="button"
              className="pc-live-primary"
              style={{ padding: "6px 12px", fontSize: "11px", gap: "6px" }}
              onClick={() => {
                void navigator.clipboard.writeText(resetResult.tempPassword);
                toast.success("تم نسخ كلمة المرور إلى الحافظة!");
              }}
            >
              <Copy size={13} /> نسخ
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="pc-live-primary"
            onClick={onClose}
          >
            تمت المشاركة وإغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL 3: RECORD SUBSCRIPTION PAYMENT ─────────────────────────────────────

export interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  academies: PlatformAcademy[];
  targetAcademyId: string;
  setTargetAcademyId: (val: string) => void;
  amount: number;
  setAmount: (val: number) => void;
  method: PlatformPaymentRecord["method"];
  setMethod: (val: PlatformPaymentRecord["method"]) => void;
  refCode: string;
  setRefCode: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  onRecordPayment: (e: React.FormEvent) => void;
}

export function RecordPaymentModal({
  open,
  onClose,
  academies,
  targetAcademyId,
  setTargetAcademyId,
  amount,
  setAmount,
  method,
  setMethod,
  refCode,
  setRefCode,
  notes,
  setNotes,
  onRecordPayment,
}: RecordPaymentModalProps) {
  if (!open) return null;

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-ticket-dialog" dir="rtl">
        <div className="pc-ticket-dialog-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={18} color="#059669" />
              تسجيل دفعة اشتراك جديدة
            </h3>
            <small style={{ color: "#64748b" }}>
              توثيق التحويلات البنكية والإيصالات في سجل السداد المالي
            </small>
          </div>
          <button
            type="button"
            className="pc-ticket-dialog-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onRecordPayment} style={{ display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>الأكاديمية المشتركة</span>
            <select
              required
              value={targetAcademyId}
              onChange={(e) => setTargetAcademyId(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
              }}
            >
              <option value="">اختر الأكاديمية</option>
              {academies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.owner || "المسؤول"})
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>المبلغ المسدد (ج.م)</span>
              <input
                type="number"
                required
                min={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>طريقة السداد</span>
              <select
                value={method}
                onChange={(e) =>
                  setMethod(e.target.value as PlatformPaymentRecord["method"])
                }
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                }}
              >
                <option value="BANK_TRANSFER">تحويل بنكي</option>
                <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                <option value="FAWRY">فوري (Fawry)</option>
                <option value="CREDIT_CARD">بطاقة بنكية (Visa/Mastercard)</option>
                <option value="CASH">نقدي (خزينة المنصة)</option>
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>رقم المرجع / التحويل البنكي / الإيصال</span>
            <input
              required
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="مثال: CIB-TXN-8849201 أو رقم عملية إنستاباي..."
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>ملاحظات داخلية</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سداد القسط السنوي للباقة الاحترافية..."
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
              }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            <button
              type="button"
              className="pc-live-link"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="pc-live-primary"
              style={{ background: "#059669", borderColor: "#059669" }}
            >
              تأكيد وحفظ الدفعة في السجل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MODAL 4: TICKET DETAILS & REPLY ──────────────────────────────────────────

export interface TicketDetailModalProps {
  ticket: SupportTicket | null;
  onClose: () => void;
  statusDraft: SupportTicket["status"];
  setStatusDraft: (val: SupportTicket["status"]) => void;
  replyNote: string;
  setReplyNote: (val: string) => void;
  onUpdateTicket: (e: React.FormEvent) => void;
}

export function TicketDetailModal({
  ticket,
  onClose,
  statusDraft,
  setStatusDraft,
  replyNote,
  setReplyNote,
  onUpdateTicket,
}: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-ticket-dialog" dir="rtl">
        <div className="pc-ticket-dialog-head">
          <div>
            <h3>{ticket.subject}</h3>
            <small style={{ color: "#64748b" }}>
              {ticket.id} · {ticket.academyName}
            </small>
          </div>
          <button
            type="button"
            className="pc-ticket-dialog-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "12px",
            background: "#f8fafc",
            borderRadius: "10px",
            fontSize: "12px",
            lineHeight: "1.7",
          }}
        >
          <p style={{ margin: "0 0 6px" }}>
            <strong>صاحب الطلب: </strong>
            {ticket.requesterName} ({ticket.requesterRole}) - هاتف: {ticket.requesterPhone}
          </p>
          <p style={{ margin: "0 0 6px" }}>
            <strong>التصنيف: </strong>
            {ticket.category} · <strong>الأولوية: </strong>
            {TICKET_PRIORITY_LABELS[ticket.priority]?.label || ticket.priority}
          </p>
          <p style={{ margin: "0", color: "#334155" }}>
            <strong>تفاصيل المشكلة: </strong>
            {ticket.description}
          </p>
        </div>

        <form onSubmit={onUpdateTicket} style={{ display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span>تحديث حالة التذكرة</span>
            <select
              value={statusDraft}
              onChange={(e) =>
                setStatusDraft(e.target.value as SupportTicket["status"])
              }
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                font: "inherit",
                fontSize: "12px",
              }}
            >
              <option value="new">تذكرة جديدة</option>
              <option value="inProgress">قيد المتابعة والحل</option>
              <option value="waiting">بانتظار رد العميل</option>
              <option value="resolved">تم الحل وإغلاق التذكرة</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span>ملاحظات المتابعة والرد الداخلي</span>
            <textarea
              rows={3}
              value={replyNote}
              onChange={(e) => setReplyNote(e.target.value)}
              placeholder="اكتب ردك وملاحظات المتابعة مع مسؤول الأكاديمية..."
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                font: "inherit",
                fontSize: "12px",
              }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              className="pc-live-link"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="pc-live-primary"
              style={{ padding: "8px 16px" }}
            >
              حفظ التحديث والرد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MODAL 5: REASON CONFIRMATION ─────────────────────────────────────────────

export interface ReasonConfirmationModalProps {
  modalState: ReasonModalState | null;
  onClose: () => void;
  reasonInput: string;
  setReasonInput: (val: string) => void;
}

export function ReasonConfirmationModal({
  modalState,
  onClose,
  reasonInput,
  setReasonInput,
}: ReasonConfirmationModalProps) {
  if (!modalState) return null;

  const handleConfirm = async () => {
    const r = reasonInput;
    const onConf = modalState.onConfirm;
    onClose();
    setReasonInput("");
    await onConf(r);
  };

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-ticket-dialog" dir="rtl">
        <div className="pc-ticket-dialog-head">
          <h3>{modalState.title}</h3>
          <button
            type="button"
            className="pc-ticket-dialog-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "12px",
            lineHeight: "1.7",
          }}
        >
          {modalState.description}
        </p>
        <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
          <span style={{ fontWeight: 600 }}>
            سبب الإجراء (إلزامي للتوثيق في سجل التدقيق)
          </span>
          <input
            autoFocus
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="اكتب سببًا واضحًا (4 أحرف على الأقل)..."
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              font: "inherit",
              fontSize: "12px",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && reasonValid(reasonInput)) {
                e.preventDefault();
                void handleConfirm();
              }
            }}
          />
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <button
            type="button"
            className="pc-live-link"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="pc-live-primary"
            style={{
              padding: "8px 18px",
              background: modalState.isDestructive ? "#dc2626" : undefined,
              borderColor: modalState.isDestructive ? "#dc2626" : undefined,
            }}
            disabled={!reasonValid(reasonInput)}
            onClick={() => void handleConfirm()}
          >
            {modalState.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL 6: TENANT DIAGNOSTICS & SUPPORT INSPECTION ────────────────────────

export interface TenantDiagnosticsModalProps {
  academy: PlatformAcademy | null;
  onClose: () => void;
  onStartSuperAccess: (academy: PlatformAcademy) => void;
}

export function TenantDiagnosticsModal({
  academy,
  onClose,
  onStartSuperAccess,
}: TenantDiagnosticsModalProps) {
  if (!academy) return null;

  return (
    <div className="pc-live-modal-scrim" onClick={onClose}>
      <div
        className="pc-live-modal"
        style={{ maxWidth: 620 }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span className="pc-live-eyebrow">
              <ShieldCheck size={14} /> فحص ومعاينة الأكاديمية للدعم الفني
            </span>
            <h3 style={{ margin: "4px 0 0", fontSize: 17, color: "#0f172a" }}>
              {academy.name}
            </h3>
            <small style={{ color: "#64748b" }}>
              كود التينانت: <code>{academy.id}</code> · النطاق: {academy.slug || "بدون"}
            </small>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <small style={{ color: "#64748b", display: "block" }}>حالة الاشتراك</small>
            <strong style={{ color: academy.status === "ACTIVE" ? "#0f766e" : academy.status === "TRIAL" ? "#d97706" : "#dc2626" }}>
              {STATUS_LABEL[academy.status] || academy.status}
            </strong>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <small style={{ color: "#64748b", display: "block" }}>الباقة المعتمدة</small>
            <strong style={{ color: "#1e293b" }}>{academy.planName || academy.plan}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <small style={{ color: "#64748b", display: "block" }}>الفروع المصرحة</small>
            <strong style={{ color: "#1e293b" }}>{academy.branches} / {academy.allowedBranches || 3}</strong>
          </div>
        </div>

        <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <strong style={{ color: "#0f766e", fontSize: 13, display: "block", marginBottom: 4 }}>
            بيانات مسؤول الأكاديمية (Owner / R01):
          </strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#134e4a" }}>
            <div>الاسم: <strong>{academy.owner || "غير مسجل"}</strong></div>
            <div>الهاتف: <strong dir="ltr">{academy.ownerPhone || "+201000000002"}</strong></div>
            <div>البريد: <strong>{academy.ownerEmail || "owner@example.com"}</strong></div>
            <div>المستخدمون: <strong>{fmtNumber(academy.users)} موظف</strong></div>
          </div>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong style={{ display: "block", marginBottom: 4 }}>
            🔒 حدود الخصوصية والأمان الفاصلة (Privacy Guard):
          </strong>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            R00 يطلع على البيانات التشغيلية وهيكل الفروع وحسابات الموظفين فقط، ومحجوب برمجياً عن رؤية أسماء وسجلات الطلاب أو سندات قبض أولياء الأمور الداخلية.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            className="pc-live-link"
            onClick={() => {
              const summary = JSON.stringify(academy, null, 2);
              void navigator.clipboard.writeText(summary);
              toast.success("تم نسخ تقرير الفحص الفني للحافظة بنجاح");
            }}
          >
            <Copy size={14} /> نسخ تقرير الفحص الفني
          </button>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="pc-live-primary"
              style={{ background: "#ea580c", borderColor: "#ea580c" }}
              onClick={() => onStartSuperAccess(academy)}
              title="دخول فحص الطوارئ للأكاديمية ومعاينة الشاشات من الداخل"
            >
              <ShieldAlert size={14} /> فحص طارئ (Super Access)
            </button>
            <button
              type="button"
              className="pc-live-primary"
              style={{ background: "#0d9488", borderColor: "#0d9488" }}
              onClick={() => {
                const code = `SUP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                toast.success(`تم إنشاء رمز جلسة الدعم المؤقتة: ${code} (صالح لمدة 15 دقيقة)`);
              }}
            >
              <KeyRound size={15} /> توليد كود جلسة دعم مؤقتة
            </button>
            <button
              type="button"
              className="pc-live-link"
              onClick={onClose}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL 7: BROADCAST ANNOUNCEMENT ──────────────────────────────────────────

export interface BroadcastAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  enrichedAcademiesCount: number;
  broadcastType: "INFO" | "WARNING" | "SUCCESS";
  setBroadcastType: (val: "INFO" | "WARNING" | "SUCCESS") => void;
  broadcastTarget: "ALL" | "PAID" | "TRIAL";
  setBroadcastTarget: (val: "ALL" | "PAID" | "TRIAL") => void;
  broadcastTitle: string;
  setBroadcastTitle: (val: string) => void;
  broadcastMessage: string;
  setBroadcastMessage: (val: string) => void;
  onSendBroadcast: (e: React.FormEvent) => void;
}

export function BroadcastAnnouncementModal({
  open,
  onClose,
  enrichedAcademiesCount,
  broadcastType,
  setBroadcastType,
  broadcastTarget,
  setBroadcastTarget,
  broadcastTitle,
  setBroadcastTitle,
  broadcastMessage,
  setBroadcastMessage,
  onSendBroadcast,
}: BroadcastAnnouncementModalProps) {
  if (!open) return null;

  return (
    <div className="pc-live-modal-scrim" onClick={onClose}>
      <div
        className="pc-live-modal"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <Megaphone size={18} color="#0d9488" />
            بث إشعار أو تنبيه صيانة عام للأكاديميات
          </h3>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 12 }}>
          سيتم إرسال هذا التنبيه فورًا إلى لوحات التحكم الخاصة بمسؤولي الأكاديميات (R01) وتوثيقه في سجل النظام.
        </p>

        <form onSubmit={onSendBroadcast} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
            <span>نوع التنبيه:</span>
            <select
              value={broadcastType}
              onChange={(e) => setBroadcastType(e.target.value as "INFO" | "WARNING" | "SUCCESS")}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
            >
              <option value="INFO">📢 إعلان عام وميزات جديدة</option>
              <option value="WARNING">⚠️ تنبيه صيانة مجدولة للنظام</option>
              <option value="SUCCESS">🎉 ترقية البنية التحتية وتسريع الخدمات</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
            <span>الشريحة المستهدفة:</span>
            <select
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value as "ALL" | "PAID" | "TRIAL")}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
            >
              <option value="ALL">جميع الأكاديميات المسجلة ({enrichedAcademiesCount})</option>
              <option value="PAID">الأكاديميات ذات الاشتراكات النشطة فقط</option>
              <option value="TRIAL">الأكاديميات في الفترة التجريبية فقط</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
            <span>عنوان الإشعار:</span>
            <input
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="مثال: موعد صيانة وتحديث السيرفرات الليلة الساعة 2:00 صباحًا"
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
            />
          </label>

          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
            <span>نص وتفاصيل الإشعار:</span>
            <textarea
              rows={4}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="اكتب تفاصيل التحديث أو الصيانة وتأثيرها المتوقع..."
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="pc-live-link"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="pc-live-primary"
              style={{ padding: "8px 18px" }}
            >
              تأكيد وإرسال البث
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MODAL 8: SUBSCRIPTION RENEWAL REMINDER (WHATSAPP 1-CLICK) ───────────────

export interface WhatsAppReminderModalProps {
  tenant: PlatformAcademy | null;
  onClose: () => void;
}

export function WhatsAppReminderModal({ tenant, onClose }: WhatsAppReminderModalProps) {
  if (!tenant) return null;

  const annualDue =
    tenant.planCode === "enterprise"
      ? "70,000"
      : tenant.planCode === "growth"
      ? "35,000"
      : "15,000";

  return (
    <div className="pc-live-modal-scrim" onClick={onClose}>
      <div
        className="pc-live-modal"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={18} color="#d97706" />
            مطالبة وتذكير تجديد الاشتراك (WhatsApp 1-Click)
          </h3>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px 14px", borderRadius: 10, marginBottom: 14, fontSize: 12 }}>
          <div>الأكاديمية: <strong>{tenant.name}</strong></div>
          <div>المسؤول: <strong>{tenant.owner || "مسؤول الأكاديمية"}</strong> · الهاتف: <strong dir="ltr">{tenant.ownerPhone || "+201000000002"}</strong></div>
          <div>الخطة: <strong>{tenant.planName}</strong> · المستحق السنوي: <strong style={{ color: "#b45309" }}>{annualDue} ج.م</strong></div>
        </div>

        <label style={{ display: "grid", gap: 6, fontSize: 12, marginBottom: 16 }}>
          <span>نص رسالة الواتساب الجاهزة للإرسال:</span>
          <textarea
            rows={5}
            readOnly
            value={`مرحباً م. ${tenant.owner || "مسؤول الأكاديمية"}،\nنود تذكيركم بتجديد اشتراك منصة مدى لأكاديمية (${tenant.name}) لضمان استمرار عمل فروعكم (${tenant.branches} فروع) والخدمات السحابية دون انقطاع.\nقيمة الاشتراك السنوي: ${annualDue} ج.م.\n\nطرق الدفع المعتمدة:\n- إنستاباي: instapay@mada-academy\n- التحويل البنكي: بنك مصر / حساب رقم: 1234567890\n\nيرجى إرسال إيصال السداد لاعتماد التجديد فوراً. شكراً لثقتكم في مدى!`}
            style={{
              padding: "10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: "inherit",
            }}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            className="pc-live-primary"
            style={{ background: "#16a34a", borderColor: "#16a34a" }}
            onClick={() => {
              const text = `مرحباً م. ${tenant.owner || "مسؤول الأكاديمية"}،\nنود تذكيركم بتجديد اشتراك منصة مدى لأكاديمية (${tenant.name}) لضمان استمرار عمل فروعكم والخدمات السحابية دون انقطاع.\nقيمة الاشتراك السنوي: ${annualDue} ج.م.\nإنستاباي: instapay@mada-academy`;
              void navigator.clipboard.writeText(text);
              toast.success("تم نسخ رسالة الواتساب للحافظة بنجاح!");
              const phone = (tenant.ownerPhone || "201000000002").replace(/[^0-9]/g, "");
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
            }}
          >
            <ExternalLink size={15} /> نسخ وفتح واتساب المباشر
          </button>

          <button
            type="button"
            className="pc-live-link"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL 9: EMERGENCY SUPER ACCESS (VIEW-AS) ────────────────────────────────

export interface EmergencyImpersonationModalProps {
  academy: PlatformAcademy | null;
  onClose: () => void;
  impersonationReason: string;
  setImpersonationReason: (val: string) => void;
  onStart: () => void;
}

export function EmergencyImpersonationModal({
  academy,
  onClose,
  impersonationReason,
  setImpersonationReason,
  onStart,
}: EmergencyImpersonationModalProps) {
  if (!academy) return null;

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-ticket-dialog" dir="rtl" style={{ maxWidth: "540px" }}>
        <div className="pc-ticket-dialog-head" style={{ borderBottom: "1px solid #fed7aa", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#ea580c", color: "#fff", display: "grid", placeItems: "center" }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#9a3412" }}>دخول فحص الطوارئ (Super Access · R00)</h3>
              <small style={{ color: "#c2410c" }}>معاينة وحل المشاكل التشغيلية من داخل مساحة الأكاديمية</small>
            </div>
          </div>
          <button
            type="button"
            className="pc-ticket-dialog-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "16px 0", display: "grid", gap: "14px" }}>
          <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px 14px", borderRadius: "8px", fontSize: "12px", lineHeight: "1.7", color: "#92400e" }}>
            <strong>الأكاديمية المستهدفة:</strong> {academy.name} ({academy.id})<br />
            <strong>تنبيه حوكمة وأمان:</strong> ستدخل إلى واجهات التشغيل الخاصة بالأكاديمية في وضع فحص طارئ لمعاينة الخلل وحله. يتم توثيق هذا الإجراء وتوقيت بدئه في سجل التدقيق الأمني (Audit Log).
          </div>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>
              سبب التدخل الطارئ (إلزامي لمكافحة التلاعب) <span style={{ color: "#dc2626" }}>*</span>
            </span>
            <textarea
              rows={3}
              placeholder="مثال: فحص مشكلة شفت الخزينة المعلق، أو معالجة خطأ في رصد درجات الطلاب بناءً على تذكرة الدعم TCK-801..."
              value={impersonationReason}
              onChange={(e) => setImpersonationReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <small style={{ color: "#64748b" }}>
              يجب ألا يقل السبب عن 4 أحرف لضمان توثيق الحوكمة.
            </small>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
          <button
            type="button"
            className="pc-live-link"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="pc-live-primary"
            style={{ background: "#ea580c", borderColor: "#ea580c" }}
            onClick={onStart}
            disabled={!reasonValid(impersonationReason)}
          >
            بدء جلسة فحص الطوارئ والانتقال للمساحة ⬅
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL 10: NEW SUPPORT TICKET ─────────────────────────────────────────────

export interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  academies: PlatformAcademy[];
  academyId: string;
  setAcademyId: (val: string) => void;
  ticketType: "issue" | "suggestion" | "billing";
  setTicketType: (val: "issue" | "suggestion" | "billing") => void;
  category: SupportTicket["category"];
  setCategory: (val: SupportTicket["category"]) => void;
  priority: SupportTicket["priority"];
  setPriority: (val: SupportTicket["priority"]) => void;
  subject: string;
  setSubject: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  onCreateTicket: (e: React.FormEvent) => void;
}

export function NewTicketModal({
  open,
  onClose,
  academies,
  academyId,
  setAcademyId,
  ticketType,
  setTicketType,
  category,
  setCategory,
  priority,
  setPriority,
  subject,
  setSubject,
  description,
  setDescription,
  onCreateTicket,
}: NewTicketModalProps) {
  if (!open) return null;

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-ticket-dialog" dir="rtl" style={{ maxWidth: "560px" }}>
        <div className="pc-ticket-dialog-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="#0d9488" />
              تسجيل تذكرة دعم أو اقتراح ميزة جديدة
            </h3>
            <small style={{ color: "#64748b" }}>
              توثيق البلاغات التقنية ومقترحات التطوير مع جدولتها ومتابعتها
            </small>
          </div>
          <button
            type="button"
            className="pc-ticket-dialog-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onCreateTicket} style={{ display: "grid", gap: "12px", paddingTop: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>الأكاديمية المعنية</span>
              <select
                value={academyId}
                onChange={(e) => setAcademyId(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              >
                {academies.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>نوع المعاملة</span>
              <select
                value={ticketType}
                onChange={(e) => {
                  const t = e.target.value as "issue" | "suggestion" | "billing";
                  setTicketType(t);
                  if (t === "suggestion") setCategory("اقتراح ميزة جديدة");
                  else if (t === "billing") setCategory("اشتراكات وخطط");
                  else setCategory("مشكلة تقنية");
                }}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              >
                <option value="issue">بلاغ عطل أو مشكلة تقنية 🚨</option>
                <option value="suggestion">اقتراح ميزة جديدة أو فكرة 💡</option>
                <option value="billing">استفسار مالي أو باقة 💳</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>التصنيف</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportTicket["category"])}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              >
                <option value="مشكلة تقنية">مشكلة تقنية 🐞</option>
                <option value="اشتراكات وخطط">اشتراكات وخطط 💳</option>
                <option value="اقتراح ميزة جديدة">اقتراح ميزة جديدة 💡</option>
                <option value="تفعيل فروع">تفعيل فروع 🏢</option>
                <option value="استفسار تشغيلي">استفسار تشغيلي ❓</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>الأولوية والأهمية</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SupportTicket["priority"])}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              >
                <option value="high">مرتفعة / حرجة 🔴</option>
                <option value="medium">متوسطة 🟡</option>
                <option value="low">منخفضة 🟢</option>
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>عنوان التذكرة / الاقتراح <span style={{ color: "#dc2626" }}>*</span></span>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: إضافة زر لتصدير كشف الدرجات إلى ملف Excel مباشرة..."
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </label>

          <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>تفاصيل الطلب وسيناريو الاستخدام <span style={{ color: "#dc2626" }}>*</span></span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة بالتفصيل، أو الفائدة التشغيلية للميزة المقترحة..."
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "inherit" }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
            <button
              type="button"
              className="pc-live-link"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="pc-live-primary"
            >
              تسجيل وحفظ التذكرة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MODAL 11: CONVERT LEAD TO LIVE ACADEMY ───────────────────────────────────

export interface ConvertLeadModalProps {
  lead: PlatformDemoLead | null;
  onClose: () => void;
  converting: boolean;
  convertSuccess: {
    academy: { id: string; name: string; slug: string };
    owner: { displayName: string; phone: string; tempPass: string };
  } | null;
  convertForm: {
    name: string;
    slug: string;
    planCode: string;
    branchName: string;
    branchCode: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    ownerPassword: string;
  };
  setConvertForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      slug: string;
      planCode: string;
      branchName: string;
      branchCode: string;
      ownerName: string;
      ownerPhone: string;
      ownerEmail: string;
      ownerPassword: string;
    }>
  >;
  onRegeneratePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSendCredentialsWhatsApp: () => void;
}

export function ConvertLeadModal({
  lead,
  onClose,
  converting,
  convertSuccess,
  convertForm,
  setConvertForm,
  onRegeneratePassword,
  onSubmit,
  onSendCredentialsWhatsApp,
}: ConvertLeadModalProps) {
  if (!lead) return null;

  return (
    <div
      className="pc-ticket-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !converting) onClose();
      }}
    >
      <div className="pc-ticket-dialog" style={{ width: "min(680px, 95vw)" }} dir="rtl">
        <div className="pc-ticket-dialog-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
              <Building2 size={20} color="#2563eb" />
              {convertSuccess ? "تم إنشاء وتفعيل الأكاديمية بنجاح 🚀" : "تحويل طلب المعاينة إلى أكاديمية مفعّلة"}
            </h3>
            <small style={{ color: "#64748b" }}>
              طلب وارد: {lead.academyName} · المعرف: <code>{lead.id}</code>
            </small>
          </div>
          {!converting && (
            <button
              type="button"
              className="pc-ticket-dialog-close"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {convertSuccess ? (
          <div style={{ display: "grid", gap: "16px", padding: "8px 0" }}>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <CheckCircle2 size={32} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: "0 0 4px", color: "#166534", fontSize: "15px" }}>
                  تم تأسيس الأكاديمية وربط التينانت بالكامل!
                </h4>
                <p style={{ margin: 0, color: "#15803d", fontSize: "13px" }}>
                  تم تحديث حالة الطلب تلقائياً إلى (تم التحويل لعميل ✅)، وإضافة الأكاديمية لقائمة المنصة.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                display: "grid",
                gap: "10px",
              }}
            >
              <h5 style={{ margin: 0, color: "#334155", fontSize: "14px" }}>
                بيانات اعتماد مسؤول الأكاديمية (Owner Credentials):
              </h5>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <small style={{ display: "block", color: "#64748b" }}>الأكاديمية والنطاق</small>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>{convertSuccess.academy.name}</strong>
                  <span style={{ display: "block", fontSize: "12px", color: "#2563eb", fontFamily: "monospace" }}>
                    {convertSuccess.academy.slug}
                  </span>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <small style={{ display: "block", color: "#64748b" }}>هاتف تسجيل الدخول</small>
                  <strong style={{ fontSize: "15px", color: "#0f172a", direction: "ltr", display: "inline-block" }}>
                    {convertSuccess.owner.phone}
                  </strong>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <small style={{ display: "block", color: "#64748b" }}>كلمة المرور المؤقتة</small>
                  <strong style={{ fontSize: "15px", color: "#0d9488", fontFamily: "monospace" }}>
                    {convertSuccess.owner.tempPass}
                  </strong>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <small style={{ display: "block", color: "#64748b" }}>رابط الدخول للنظام</small>
                  <span style={{ fontSize: "13px", color: "#475569", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {typeof window !== "undefined" ? window.location.origin : ""}/login
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "8px" }}>
              <button
                type="button"
                className="pc-live-link"
                onClick={() => {
                  const text = `الأكاديمية: ${convertSuccess.academy.name}\nرابط الدخول: ${window.location.origin}/login\nالهاتف: ${convertSuccess.owner.phone}\nكلمة المرور: ${convertSuccess.owner.tempPass}`;
                  void navigator.clipboard.writeText(text);
                  toast.success("تم نسخ بيانات الدخول إلى الحافظة!");
                }}
              >
                <Copy size={14} /> نسخ بيانات الدخول
              </button>
              <button
                type="button"
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "1px solid #15803d",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={onSendCredentialsWhatsApp}
              >
                <MessageCircle size={15} /> إرسال البيانات عبر واتساب 📲
              </button>
              <button
                type="button"
                className="pc-live-primary"
                onClick={onClose}
              >
                إغلاق والعودة
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px" }}>
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#1e40af",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "3px" }}>
                🎯 الاحتياج التشغيلي المسجل: {lead.operationalNeed}
              </div>
              <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                عدد الفروع المطلوبة: <strong>{lead.branchCount} فروع</strong>
                {lead.notes ? ` · ملاحظات: ${lead.notes}` : ""}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  اسم الأكاديمية الرسمي *
                </span>
                <input
                  type="text"
                  required
                  value={convertForm.name}
                  onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
                  placeholder="مثال: أكاديمية الأبطال للسباحة"
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  المعرف الداخلي (Slug) *
                </span>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={convertForm.slug}
                  onChange={(e) => setConvertForm({ ...convertForm, slug: e.target.value })}
                  placeholder="champion-academy"
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  باقة الاشتراك المقترحة *
                </span>
                <select
                  value={convertForm.planCode}
                  onChange={(e) => setConvertForm({ ...convertForm, planCode: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="STARTER">Starter · بداية (فرع واحد)</option>
                  <option value="GROWTH">Growth · نمو (حتى 3 فروع) [موصى به للطلب]</option>
                  <option value="SCALE">Scale · توسع ومؤسسات (فروع غير محدودة)</option>
                </select>
              </label>

              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  اسم الفرع الأساسي الأول *
                </span>
                <input
                  type="text"
                  required
                  value={convertForm.branchName}
                  onChange={(e) => setConvertForm({ ...convertForm, branchName: e.target.value })}
                  placeholder="الفرع الرئيسي"
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  كود الفرع الأساسي *
                </span>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={convertForm.branchCode}
                  onChange={(e) => setConvertForm({ ...convertForm, branchCode: e.target.value.toUpperCase() })}
                  placeholder="MAIN"
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  اسم المسؤول / مالك الأكاديمية *
                </span>
                <input
                  type="text"
                  required
                  value={convertForm.ownerName}
                  onChange={(e) => setConvertForm({ ...convertForm, ownerName: e.target.value })}
                  placeholder="الاسم الثلاثي"
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  البريد الإلكتروني للتواصل *
                </span>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={convertForm.ownerEmail}
                  onChange={(e) => setConvertForm({ ...convertForm, ownerEmail: e.target.value })}
                  placeholder="owner@academy.com"
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  رقم هاتف الدخول والتواصل *
                </span>
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={convertForm.ownerPhone}
                  onChange={(e) => setConvertForm({ ...convertForm, ownerPhone: e.target.value })}
                  placeholder="01012345678"
                />
              </label>
            </div>

            <div>
              <label>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                    كلمة المرور المؤقتة للحساب *
                  </span>
                  <button
                    type="button"
                    onClick={onRegeneratePassword}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <RefreshCw size={12} /> توليد كلمة مرور جديدة
                  </button>
                </div>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={convertForm.ownerPassword}
                  onChange={(e) => setConvertForm({ ...convertForm, ownerPassword: e.target.value })}
                  placeholder="8 خانات على الأقل"
                />
              </label>
              <small style={{ color: "#64748b", display: "block", marginTop: "3px" }}>
                سيتمكن المالك من تغييرها فور تسجيل الدخول من إعدادات حسابه.
              </small>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="pc-live-link"
                disabled={converting}
                onClick={onClose}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="pc-live-primary"
                disabled={converting}
                style={{
                  background: "#2563eb",
                  borderColor: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Building2 size={15} />
                {converting ? "جارٍ تأسيس وتفعيل الأكاديمية..." : "تأكيد التأسيس وتفعيل الأكاديمية 🚀"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── COMPOSITE MODALS CONTAINER ───────────────────────────────────────────────

export interface PlatformConsoleModalsContainerProps {
  // Modal 1
  planModalAcademy: PlatformAcademy | null;
  setPlanModalAcademy: (a: PlatformAcademy | null) => void;
  selectedPlanCode: PlanCode;
  setSelectedPlanCode: React.Dispatch<React.SetStateAction<PlanCode>>;
  customBranchLimit: number;
  setCustomBranchLimit: (val: number) => void;
  planUpgradeReason: string;
  setPlanUpgradeReason: (val: string) => void;
  handleSavePlanUpgrade: (e: React.FormEvent) => void;
  // Modal 2
  ownerResetResult: OwnerResetResult | null;
  setOwnerResetResult: React.Dispatch<React.SetStateAction<OwnerResetResult | null>>;
  // Modal 3
  paymentModalOpen: boolean;
  setPaymentModalOpen: (val: boolean) => void;
  academies: PlatformAcademy[];
  paymentTargetAcademyId: string;
  setPaymentTargetAcademyId: (val: string) => void;
  paymentAmount: number;
  setPaymentAmount: (val: number) => void;
  paymentMethod: PlatformPaymentRecord["method"];
  setPaymentMethod: (val: PlatformPaymentRecord["method"]) => void;
  paymentRef: string;
  setPaymentRef: (val: string) => void;
  paymentNotes: string;
  setPaymentNotes: (val: string) => void;
  handleRecordPayment: (e: React.FormEvent) => void;
  // Modal 4
  selectedTicket: SupportTicket | null;
  setSelectedTicket: (val: SupportTicket | null) => void;
  ticketStatusDraft: SupportTicket["status"];
  setTicketStatusDraft: (val: SupportTicket["status"]) => void;
  ticketReplyNote: string;
  setTicketReplyNote: (val: string) => void;
  handleUpdateTicket: (e: React.FormEvent) => void;
  // Modal 5
  reasonModal: ReasonModalState | null;
  setReasonModal: (val: ReasonModalState | null) => void;
  reasonInput: string;
  setReasonInput: (val: string) => void;
  // Modal 6
  inspectionAcademy: PlatformAcademy | null;
  setInspectionAcademy: (val: PlatformAcademy | null) => void;
  setImpersonationAcademy: (val: PlatformAcademy | null) => void;
  // Modal 7
  broadcastModalOpen: boolean;
  setBroadcastModalOpen: (val: boolean) => void;
  enrichedAcademiesCount: number;
  broadcastType: "INFO" | "WARNING" | "SUCCESS";
  setBroadcastType: (val: "INFO" | "WARNING" | "SUCCESS") => void;
  broadcastTarget: "ALL" | "PAID" | "TRIAL";
  setBroadcastTarget: (val: "ALL" | "PAID" | "TRIAL") => void;
  broadcastTitle: string;
  setBroadcastTitle: (val: string) => void;
  broadcastMessage: string;
  setBroadcastMessage: (val: string) => void;
  handleSendBroadcast: (e: React.FormEvent) => void;
  // Modal 8
  paymentReminderTenant: PlatformAcademy | null;
  setPaymentReminderTenant: (val: PlatformAcademy | null) => void;
  // Modal 9
  impersonationAcademy: PlatformAcademy | null;
  impersonationReason: string;
  setImpersonationReason: (val: string) => void;
  handleStartEmergencyImpersonation: () => void;
  // Modal 10
  newTicketModalOpen: boolean;
  setNewTicketModalOpen: (val: boolean) => void;
  newTicketAcademyId: string;
  setNewTicketAcademyId: (val: string) => void;
  newTicketType: "issue" | "suggestion" | "billing";
  setNewTicketType: (val: "issue" | "suggestion" | "billing") => void;
  newTicketCategory: SupportTicket["category"];
  setNewTicketCategory: (val: SupportTicket["category"]) => void;
  newTicketPriority: SupportTicket["priority"];
  setNewTicketPriority: (val: SupportTicket["priority"]) => void;
  newTicketSubject: string;
  setNewTicketSubject: (val: string) => void;
  newTicketDescription: string;
  setNewTicketDescription: (val: string) => void;
  handleCreateNewTicket: (e: React.FormEvent) => void;
  // Modal 11
  convertLeadModal: PlatformDemoLead | null;
  setConvertLeadModal: (val: PlatformDemoLead | null) => void;
  converting: boolean;
  convertSuccess: { academy: { id: string; name: string; slug: string }; owner: { displayName: string; phone: string; tempPass: string } } | null;
  convertForm: { name: string; slug: string; planCode: string; branchName: string; branchCode: string; ownerName: string; ownerPhone: string; ownerEmail: string; ownerPassword: string };
  setConvertForm: React.Dispatch<React.SetStateAction<{ name: string; slug: string; planCode: string; branchName: string; branchCode: string; ownerName: string; ownerPhone: string; ownerEmail: string; ownerPassword: string }>>;
  handleRegeneratePassword: () => void;
  handleConvertLeadSubmit: (e: React.FormEvent) => void;
  handleSendCredentialsWhatsApp: () => void;
}

export function PlatformConsoleModals(props: PlatformConsoleModalsContainerProps) {
  return (
    <>
      <PlanUpgradeModal
        academy={props.planModalAcademy}
        onClose={() => props.setPlanModalAcademy(null)}
        selectedPlanCode={props.selectedPlanCode}
        setSelectedPlanCode={props.setSelectedPlanCode}
        customBranchLimit={props.customBranchLimit}
        setCustomBranchLimit={props.setCustomBranchLimit}
        planUpgradeReason={props.planUpgradeReason}
        setPlanUpgradeReason={props.setPlanUpgradeReason}
        onSave={props.handleSavePlanUpgrade}
      />

      <OwnerPasswordModal
        resetResult={props.ownerResetResult}
        onClose={() => props.setOwnerResetResult(null)}
      />

      <RecordPaymentModal
        open={props.paymentModalOpen}
        onClose={() => props.setPaymentModalOpen(false)}
        academies={props.academies}
        targetAcademyId={props.paymentTargetAcademyId}
        setTargetAcademyId={props.setPaymentTargetAcademyId}
        amount={props.paymentAmount}
        setAmount={props.setPaymentAmount}
        method={props.paymentMethod}
        setMethod={props.setPaymentMethod}
        refCode={props.paymentRef}
        setRefCode={props.setPaymentRef}
        notes={props.paymentNotes}
        setNotes={props.setPaymentNotes}
        onRecordPayment={props.handleRecordPayment}
      />

      <TicketDetailModal
        ticket={props.selectedTicket}
        onClose={() => props.setSelectedTicket(null)}
        statusDraft={props.ticketStatusDraft}
        setStatusDraft={props.setTicketStatusDraft}
        replyNote={props.ticketReplyNote}
        setReplyNote={props.setTicketReplyNote}
        onUpdateTicket={props.handleUpdateTicket}
      />

      <ReasonConfirmationModal
        modalState={props.reasonModal}
        onClose={() => props.setReasonModal(null)}
        reasonInput={props.reasonInput}
        setReasonInput={props.setReasonInput}
      />

      <TenantDiagnosticsModal
        academy={props.inspectionAcademy}
        onClose={() => props.setInspectionAcademy(null)}
        onStartSuperAccess={(target) => {
          props.setInspectionAcademy(null);
          props.setImpersonationAcademy(target);
          props.setImpersonationReason("");
        }}
      />

      <BroadcastAnnouncementModal
        open={props.broadcastModalOpen}
        onClose={() => props.setBroadcastModalOpen(false)}
        enrichedAcademiesCount={props.enrichedAcademiesCount}
        broadcastType={props.broadcastType}
        setBroadcastType={props.setBroadcastType}
        broadcastTarget={props.broadcastTarget}
        setBroadcastTarget={props.setBroadcastTarget}
        broadcastTitle={props.broadcastTitle}
        setBroadcastTitle={props.setBroadcastTitle}
        broadcastMessage={props.broadcastMessage}
        setBroadcastMessage={props.setBroadcastMessage}
        onSendBroadcast={props.handleSendBroadcast}
      />

      <WhatsAppReminderModal
        tenant={props.paymentReminderTenant}
        onClose={() => props.setPaymentReminderTenant(null)}
      />

      <EmergencyImpersonationModal
        academy={props.impersonationAcademy}
        onClose={() => props.setImpersonationAcademy(null)}
        impersonationReason={props.impersonationReason}
        setImpersonationReason={props.setImpersonationReason}
        onStart={props.handleStartEmergencyImpersonation}
      />

      <NewTicketModal
        open={props.newTicketModalOpen}
        onClose={() => props.setNewTicketModalOpen(false)}
        academies={props.academies}
        academyId={props.newTicketAcademyId}
        setAcademyId={props.setNewTicketAcademyId}
        ticketType={props.newTicketType}
        setTicketType={props.setNewTicketType}
        category={props.newTicketCategory}
        setCategory={props.setNewTicketCategory}
        priority={props.newTicketPriority}
        setPriority={props.setNewTicketPriority}
        subject={props.newTicketSubject}
        setSubject={props.setNewTicketSubject}
        description={props.newTicketDescription}
        setDescription={props.setNewTicketDescription}
        onCreateTicket={props.handleCreateNewTicket}
      />

      <ConvertLeadModal
        lead={props.convertLeadModal}
        onClose={() => props.setConvertLeadModal(null)}
        converting={props.converting}
        convertSuccess={props.convertSuccess}
        convertForm={props.convertForm}
        setConvertForm={props.setConvertForm}
        onRegeneratePassword={props.handleRegeneratePassword}
        onSubmit={props.handleConvertLeadSubmit}
        onSendCredentialsWhatsApp={props.handleSendCredentialsWhatsApp}
      />
    </>
  );
}
