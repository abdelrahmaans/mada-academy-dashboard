import React, { useState } from "react";
import {
  X,
  Plus,
  ShieldCheck,
  UserCheck,
  FileText,
  Wallet,
  CalendarDays,
  Snowflake,
  RotateCcw,
  Star,
  MapPin,
} from "lucide-react";
import type { ApprovalKind } from "./ApprovalCard";

interface CreateApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  branches?: Array<{ id: string; name: string }>;
  defaultRequestedBy?: string;
  onSubmit: (data: {
    kind: ApprovalKind;
    title: string;
    summary: string;
    requestedBy: string;
    branchId?: string;
    branchName?: string;
    student?: string;
    course?: string;
    invoice?: string;
    discountType?: string;
    discountValue?: number;
    originalAmount?: number;
    finalAmount?: number;
    instructor?: string;
    substitute?: string;
    expenseDescription?: string;
    expenseAmount?: number;
    expenseCategory?: string;
    sessionDate?: string;
    sessionTime?: string;
    correctionCurrentAmount?: number;
    correctionProposedAmount?: number;
    correctionInvoice?: string;
    evaluationScore?: number;
    evaluationNotes?: string;
  }) => void;
}

export function CreateApprovalModal({
  isOpen,
  onClose,
  branchName,
  branches = [],
  defaultRequestedBy = "السكرتارية / المحاسبة",
  onSubmit,
}: CreateApprovalModalProps) {
  const [targetBranchId, setTargetBranchId] = useState<string>(() => {
    const found = branches.find((b) => b.name === branchName);
    return found ? found.id : branches[0]?.id || "";
  });
  const [kind, setKind] = useState<ApprovalKind>("substitute");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [requestedBy, setRequestedBy] = useState(defaultRequestedBy);

  // Substitute fields
  const [course, setCourse] = useState("");
  const [instructor, setInstructor] = useState("");
  const [substitute, setSubstitute] = useState("");
  const [sessionDate, setSessionDate] = useState("اليوم");
  const [sessionTime, setSessionTime] = useState("04:00 – 05:30 م");

  // Discount & Student fields
  const [student, setStudent] = useState("");
  const [invoice, setInvoice] = useState("");
  const [discountType, setDiscountType] = useState("خصم إخوة");
  const [discountValue, setDiscountValue] = useState(10);
  const [originalAmount, setOriginalAmount] = useState(3000);

  // Expense fields
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(1500);
  const [expenseCategory, setExpenseCategory] = useState("مستلزمات تدريب ومعامل");

  // Evaluation fields
  const [evaluationScore, setEvaluationScore] = useState<number>(85);
  const [evaluationNotes, setEvaluationNotes] = useState("");

  if (!isOpen) return null;

  const currentBranchName =
    branches.find((b) => b.id === targetBranchId)?.name || branchName || "الفرع الرئيسي";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const computedTitle =
      title.trim() ||
      (kind === "substitute"
        ? `طلب مدرب بديل · ${course || "حصة تدريبية"}`
        : kind === "discount"
        ? `طلب خصم ${discountValue}% · ${student || "طالب"}`
        : kind === "expense"
        ? `تأكيد مصروف · ${expenseDescription || "تشغيلي"}`
        : kind === "freeze"
        ? `طلب تجميد اشتراك · ${student || "طالب"}`
        : kind === "session"
        ? `طلب حصة تعويضية · ${course || "مجموعة"}`
        : kind === "evaluation"
        ? `طلب مراجعة تقييم · ${student || "طالب"}`
        : `طلب تصحيح فاتورة · ${invoice || "فاتورة"}`);

    const computedSummary =
      summary.trim() ||
      (kind === "substitute"
        ? `تغطية الحصة بواسطة المدرب البديل (${substitute || "مدرب متاح"})`
        : kind === "discount"
        ? `${discountType} بقيمة ${discountValue}% على فاتورة الدورة`
        : kind === "expense"
        ? `صرف مبلغ ${expenseAmount} ج.م لبند ${expenseCategory}`
        : kind === "freeze"
        ? `طلب تجميد مؤقت لاشتراك الطالب ${student}`
        : kind === "session"
        ? `حصة إضافية أو تعويضية للمجموعة`
        : kind === "evaluation"
        ? evaluationNotes || `مراجعة نتيجة تقييم الطالب في ${course || "المادة"} (الدرجة: ${evaluationScore})`
        : `تعديل قيمة الفاتورة المسجلة`);

    onSubmit({
      kind,
      title: computedTitle,
      summary: computedSummary,
      requestedBy: requestedBy.trim() || defaultRequestedBy,
      branchId: targetBranchId || undefined,
      branchName: currentBranchName,
      student: student.trim() || undefined,
      course: course.trim() || undefined,
      invoice: invoice.trim() || undefined,
      discountType,
      discountValue: Number(discountValue) || undefined,
      originalAmount: Number(originalAmount) || undefined,
      finalAmount: Math.round(originalAmount * (1 - (discountValue || 0) / 100)),
      instructor: instructor.trim() || undefined,
      substitute: substitute.trim() || undefined,
      expenseDescription: expenseDescription.trim() || undefined,
      expenseAmount: Number(expenseAmount) || undefined,
      expenseCategory,
      sessionDate,
      sessionTime,
      evaluationScore: kind === "evaluation" ? Number(evaluationScore) : undefined,
      evaluationNotes: kind === "evaluation" ? evaluationNotes.trim() || undefined : undefined,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "580px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#f0fdfa",
                color: "#0d9488",
              }}
            >
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                إنشاء طلب اعتماد ومراجعة جديد
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                النطاق التشغيلي: {branchName || "الفرع المصرح"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto", display: "grid", gap: "16px" }}>
          {/* Branch Selection (if multiple branches available) */}
          {branches.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                فرع الأكاديمية المستهدف:
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    backgroundColor: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 600,
                  }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Request Kind Selection */}
          <div>
            <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              نوع الطلب المطلوب مراجعته:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[
                { id: "substitute" as const, label: "مدرب بديل", icon: UserCheck },
                { id: "evaluation" as const, label: "مراجعة تقييم", icon: Star },
                { id: "freeze" as const, label: "تجميد اشتراك", icon: Snowflake },
                { id: "session" as const, label: "حصة تعويضية", icon: CalendarDays },
                { id: "discount" as const, label: "خصم مالي", icon: FileText },
                { id: "expense" as const, label: "مصروف تشغيلي", icon: Wallet },
                { id: "correction" as const, label: "تصحيح فاتورة", icon: RotateCcw },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = kind === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setKind(tab.id)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: "10px",
                      border: `1px solid ${isSelected ? "#0d9488" : "#e2e8f0"}`,
                      background: isSelected ? "#f0fdfa" : "#ffffff",
                      color: isSelected ? "#0f766e" : "#475569",
                      fontSize: "0.82rem",
                      fontWeight: isSelected ? 800 : 600,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Form Fields */}
          {kind === "substitute" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  اسم الكورس / المجموعة التدريبية
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: روبوتكس مستوى 2 (Group A)"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  المدرب الأساسي الغائب
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم المدرب"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  المدرب البديل المقترح
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم المدرب البديل"
                  value={substitute}
                  onChange={(e) => setSubstitute(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  تاريخ الحصة
                </label>
                <input
                  type="text"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  توقيت الحصة
                </label>
                <input
                  type="text"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>
          )}

          {kind === "discount" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  اسم الطالب
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم الطالب"
                  value={student}
                  onChange={(e) => setStudent(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  الكورس
                </label>
                <input
                  type="text"
                  placeholder="الكورس التدريبي"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  نوع الخصم
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="خصم إخوة">خصم إخوة</option>
                  <option value="خصم تسديد مبكر">خصم تسديد مبكر</option>
                  <option value="خصم تفوق أكاديمي">خصم تفوق أكاديمي</option>
                  <option value="خصم استثنائي لإدارة الفرع">خصم استثنائي لإدارة الفرع</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  نسبة الخصم %
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>
          )}

          {kind === "expense" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  وصف المصروف
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء حساسات روبوت ومستلزمات معمل"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  المبلغ (ج.م)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  البند / التصنيف
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="مستلزمات تدريب ومعامل">مستلزمات تدريب ومعامل</option>
                  <option value="صيانة وتشغيل">صيانة وتشغيل</option>
                  <option value="ضيافة وفعاليات">ضيافة وفعاليات</option>
                  <option value="أدوات مكتبية ومطبوعات">أدوات مكتبية ومطبوعات</option>
                </select>
              </div>
            </div>
          )}

          {kind === "evaluation" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  اسم الطالب
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف أحمد"
                  value={student}
                  onChange={(e) => setStudent(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  الكورس / المادة
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: روبوتكس مستوى 1"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  اسم المدرب
                </label>
                <input
                  type="text"
                  placeholder="المدرب القائم بالتقييم"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  الدرجة / التقييم المستحق
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={evaluationScore}
                  onChange={(e) => setEvaluationScore(Number(e.target.value))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  سبب طلب المراجعة أو استفسار ولي الأمر
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب تفاصيل طلب المراجعة أو استفسار ولي الأمر حول التقييم..."
                  value={evaluationNotes}
                  onChange={(e) => setEvaluationNotes(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {(kind === "freeze" || kind === "session" || kind === "correction") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  {kind === "freeze" ? "اسم الطالب" : kind === "session" ? "اسم الكورس / المجموعة" : "رقم الفاتورة"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={kind === "freeze" ? "اسم الطالب المراد تجميد حسابه" : kind === "session" ? "الكورس والموعد المطلوب" : "رقم الفاتورة المراد تصحيحها"}
                  value={student || course || invoice}
                  onChange={(e) => {
                    if (kind === "freeze") setStudent(e.target.value);
                    else if (kind === "session") setCourse(e.target.value);
                    else setInvoice(e.target.value);
                  }}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>
          )}

          {/* Requested By Field */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              مقدم الطلب (الجهة الطالبة)
            </label>
            <input
              type="text"
              required
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              placeholder="مثال: منى خالد · السكرتارية"
              style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              style={{
                padding: "9px 20px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                color: "#ffffff",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)",
              }}
            >
              <Plus size={16} />
              <span>إرسال الطلب للمراجعة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
