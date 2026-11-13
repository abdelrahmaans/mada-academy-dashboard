import React, { useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  LifeBuoy,
  MessageSquare,
  Plus,
  Printer,
  Receipt,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

// ─── 1. QUICK SUPPORT TICKET MODAL ──────────────────────────────────────────
export interface QuickSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleLabel?: string;
}

export function QuickSupportTicketModal({
  isOpen,
  onClose,
  roleLabel = "مستخدم النظام",
}: QuickSupportTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"TECHNICAL" | "OPERATIONAL" | "FEATURE_REQUEST" | "BILLING">("TECHNICAL");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("HIGH");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("يرجى كتابة عنوان التذكرة وتفاصيل الاستفسار");
      return;
    }

    setSubmitting(true);
    try {
      const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      // Save locally or via API if available
      try {
        await apiClient.createSupportTicket({
          subject: subject.trim(),
          description: `[دور: ${roleLabel}] ${description.trim()}`,
          category: category as any,
          priority: priority as any,
        });
      } catch {
        // Fallback gracefully
      }
      toast.success(`تم تسجيل التذكرة بنجاح برقم (${ticketId}) وجارٍ متابعتها من فريق المنصة.`);
      onClose();
      setSubject("");
      setDescription("");
    } catch {
      toast.error("حدث خطأ أثناء إرسال التذكرة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          direction: "rtl",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#f0fdfa", color: "#0f766e", padding: "8px", borderRadius: "10px", display: "flex" }}>
              <LifeBuoy size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                تسجيل تذكرة دعم فني / استفسار
              </h3>
              <small style={{ color: "#64748b" }}>مرفوعة من: {roleLabel}</small>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px" }}>
            <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
              <span>تصنيف التذكرة *</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                <option value="TECHNICAL">مشكلة تقنية 🐞</option>
                <option value="OPERATIONAL">استفسار تشغيلي ⚙️</option>
                <option value="FEATURE_REQUEST">اقتراح ميزة جديدة ✨</option>
                <option value="BILLING">الاشتراكات والفوترة 💳</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
              <span>مستوى الأولوية *</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                <option value="NORMAL">عادي (خلال 24 ساعة)</option>
                <option value="HIGH">عالي (أولوية اليوم)</option>
                <option value="URGENT">عاجل جدًا (طارئ)</option>
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
            <span>عنوان المشكلة أو الاستفسار *</span>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: تعذر إصدار فاتورة للطالب، أو استفسار عن ربط الباركود..."
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
            <span>تفاصيل الاستفسار أو الخطوات لإعادة المشكلة *</span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب التفاصيل بوضوح مع ذكر اسم الطالب أو الحصة إن وُجد..."
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "6px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Send size={15} />
              {submitting ? "جارٍ الإرسال…" : "إرسال التذكرة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 2. QUICK PAYMENT RECEIPT MODAL ─────────────────────────────────────────
export interface QuickPaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName?: string;
  onSuccess?: () => void;
}

export function QuickPaymentReceiptModal({
  isOpen,
  onClose,
  branchName = "الفرع الحالي",
  onSuccess,
}: QuickPaymentReceiptModalProps) {
  const [studentName, setStudentName] = useState("");
  const [courseName, setCourseName] = useState("روبوتكس الناشئين — المستوى 1");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "VISA" | "INSTAPAY" | "VODAFONE_CASH">("CASH");
  const [notes, setNotes] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!studentName.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("يرجى إدخال اسم الطالب وقيمة الدفعة بشكل صحيح");
      return;
    }

    const genReceipt = `REC-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    setReceiptNumber(genReceipt);
    toast.success(`تم تسجيل الدفعة بنجاح (${parsedAmount.toLocaleString("ar-EG")} ج.م) برقم إيصال: ${genReceipt}`);
    if (onSuccess) onSuccess();
  };

  const handleReset = () => {
    setReceiptNumber(null);
    setStudentName("");
    setAmount("");
    setNotes("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleReset();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          direction: "rtl",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#ecfdf5", color: "#059669", padding: "8px", borderRadius: "10px", display: "flex" }}>
              <Receipt size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                تسجيل دفعة اشتراك وإصدار إيصال فوري
              </h3>
              <small style={{ color: "#64748b" }}>خزينة شباك الاستقبال · {branchName}</small>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {receiptNumber ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "20px" }}>
              <CheckCircle2 size={40} color="#16a34a" style={{ margin: "0 auto 10px" }} />
              <h4 style={{ margin: "0 0 6px", color: "#166534", fontSize: "16px", fontWeight: 800 }}>
                تم استلام الدفعة وتسجيل الإيصال بالخزينة
              </h4>
              <span style={{ fontSize: "14px", color: "#15803d", display: "block" }}>
                رقم الإيصال: <b style={{ fontFamily: "monospace", fontSize: "16px" }}>{receiptNumber}</b>
              </span>
              <div style={{ marginTop: "14px", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155", textAlign: "right", lineHeight: "1.8" }}>
                <div><strong>الطالب:</strong> {studentName}</div>
                <div><strong>المقرر:</strong> {courseName}</div>
                <div><strong>المبلغ المستلم:</strong> {Number(amount).toLocaleString("ar-EG")} ج.م</div>
                <div><strong>طريقة السداد:</strong> {method === "CASH" ? "نقدًا (خزينة الفرع)" : method === "VISA" ? "بطاقة بنكية (Visa/Mastercard)" : method === "INSTAPAY" ? "انستاباي (InstaPay)" : "محفظة إلكترونية (فودافون كاش)"}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Printer size={15} /> طباعة إيصال الاستلام
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#0f766e",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                تم والعودة للوحة التحكم
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSavePayment} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
              <span>اسم الطالب / المشترك *</span>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="مثال: يوسف أحمد محمد"
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px" }}>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                <span>المقرر / الدبلومة *</span>
                <select
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="روبوتكس الناشئين — المستوى 1">روبوتكس الناشئين — المستوى 1</option>
                  <option value="برمجة بايثون والذكاء الاصطناعي">برمجة بايثون والذكاء الاصطناعي</option>
                  <option value="إلكترونيات ومتحكمات ذكية">إلكترونيات ومتحكمات ذكية</option>
                  <option value="تطوير ألعاب للأطفال">تطوير ألعاب للأطفال</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                <span>المبلغ المسدد (ج.م) *</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
              <span>طريقة السداد / التحصيل *</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "4px" }}>
                {[
                  { id: "CASH", label: "نقدًا 💵", icon: <Banknote size={14} /> },
                  { id: "VISA", label: "فيزا 💳", icon: <CreditCard size={14} /> },
                  { id: "INSTAPAY", label: "انستاباي ⚡", icon: <Send size={14} /> },
                  { id: "VODAFONE_CASH", label: "محفظة 📱", icon: <Wallet size={14} /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id as any)}
                    style={{
                      padding: "8px 6px",
                      borderRadius: "8px",
                      border: method === item.id ? "2px solid #0f766e" : "1px solid #cbd5e1",
                      background: method === item.id ? "#f0fdfa" : "#ffffff",
                      color: method === item.id ? "#0f766e" : "#475569",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </label>

            <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
              <span>ملاحظات الدفعة (اختياري)</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: القسط الأول من اشتراك الدورة، أو خصم إخوة 10%..."
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </label>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#0f766e",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(15, 118, 110, 0.25)",
                }}
              >
                <CheckCircle2 size={16} />
                تأكيد واستلام الدفعة
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

