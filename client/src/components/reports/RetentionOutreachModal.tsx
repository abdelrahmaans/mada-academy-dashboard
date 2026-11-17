import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  MessageCircle,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  User,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient, type RetentionRadarItem } from "@/lib/apiClient";
import "./RetentionOutreachModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: RetentionRadarItem | null;
  onSavedOutreach?: (studentId: string, status: string, note: string) => void;
  onOpenStudentHub?: (studentId: string, studentName: string) => void;
}

export function RetentionOutreachModal({
  isOpen,
  onClose,
  item,
  onSavedOutreach,
  onOpenStudentHub,
}: Props) {
  const [status, setStatus] = useState<"pending" | "contacted" | "retained" | "lost">("contacted");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateType, setTemplateType] = useState<"ABSENCE" | "PAYMENT" | "ACADEMIC">("ABSENCE");

  if (!isOpen || !item) return null;

  // Auto-detect template recommendation based on risk
  const defaultTemplate = item.consecutiveAbsences >= 2
    ? "ABSENCE"
    : item.outstandingPiastres > 0
    ? "PAYMENT"
    : "ACADEMIC";

  const getWhatsAppMessage = (type: "ABSENCE" | "PAYMENT" | "ACADEMIC") => {
    switch (type) {
      case "ABSENCE":
        return `مرحباً بحضرتك يا فندم، تحية طيبة من إدارة أكاديمية مدى للروبوتكس فرع ${item.branchName} 🤖\nحابين نطمئن على بطلنا الغالي *${item.fullName}* نظراً لغيابه عن آخر جلسات كورس *${item.courseName}*.\nحرصاً منا على استيعابه لكامل مشاريع الروبوتكس، يسعدنا ترتيب جلسة تعويضية مجانية (Make-up Session) هذا الأسبوع في الموعد الأنسب لحضرتكم.\nبانتظار تأكيدكم لمساعدة البطل على التميز والتفوق! ✨`;
      case "PAYMENT":
        return `مرحباً بحضرتك، تحية طيبة من أكاديمية مدى للروبوتكس والذكاء الاصطناعي 🌟\nبخصوص اشتراك الطالب المتميز *${item.fullName}* في كورس *${item.courseName}*، نود تذكيركم بلطف بالمتبقي المستحق (${(item.outstandingPiastres / 100).toLocaleString()} ج.م).\nيمكنكم السداد بسهولة عبر إنستاباي (InstaPay) أو بخزينة الفرع بـ ${item.branchName}.\nشاكرين تعاونكم المستمر معنا.`;
      case "ACADEMIC":
        return `مرحباً بحضرتك، إدارة أكاديمية مدى للروبوتكس والذكاء الاصطناعي فرع ${item.branchName} تتمنى لكم يوماً سعيداً 🚀\nنتابع باهتمام تطور مهارات الطالب *${item.fullName}* في كورس *${item.courseName}*، ويسر كوتش الدورة تقديم جلسة دعم فني ومراجعة إضافية للمفاهيم العملية لتعزيز ثقته وأدائه العملي بالمشاريع.\nيسعدنا تحديد موعد الجلسة بما يناسب جدولكم.`;
    }
  };

  const handleLaunchWhatsApp = () => {
    const rawMsg = getWhatsAppMessage(templateType);
    const encoded = encodeURIComponent(rawMsg);
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, "_blank");
    toast.success("تم فتح تطبيق واتساب لمراسلة ولي الأمر مباشرة!");
  };

  const handleSaveOutreach = async () => {
    try {
      setIsSubmitting(true);
      await apiClient.recordRetentionOutreach(item.studentId, {
        status,
        note: note.trim() || undefined,
      });
      toast.success("تم تسجيل إجراء التواصل وتحديث حالة المتابعة بنجاح!");
      if (onSavedOutreach) {
        onSavedOutreach(item.studentId, status, note);
      }
      onClose();
    } catch {
      toast.error("تعذر تسجيل إجراء المتابعة، يرجى المحاولة لاحقاً");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="outreach-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="outreach-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="outreach-title"
      >
        {/* Header */}
        <div className="outreach-header">
          <div className="outreach-title-row">
            <div className={`outreach-risk-badge risk-${item.riskLevel.toLowerCase()}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="outreach-name-row">
                <h3 id="outreach-title">{item.fullName}</h3>
                <span className={`outreach-tag-${item.riskLevel.toLowerCase()}`}>
                  {item.riskLevel === "HIGH"
                    ? "مؤشر خطر مرتفع ⚠️"
                    : item.riskLevel === "MEDIUM"
                    ? "متابعة وتفقد ⏳"
                    : "مستقر آمن ✅"}
                </span>
                <span className="outreach-branch-tag">فرع {item.branchName}</span>
              </div>
              <p className="outreach-subtitle">
                الدورة: <strong>{item.courseName}</strong> · التوصية: {item.recommendedAction}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="outreach-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Operations Bar (العمليات أولاً بشكل سهل وسريع) */}
        <div className="outreach-action-strip">
          <div className="outreach-quick-buttons">
            <button
              type="button"
              className="outreach-btn whatsapp"
              onClick={handleLaunchWhatsApp}
            >
              <MessageCircle size={15} />
              <span>مراسلة واتساب لولي الأمر</span>
            </button>

            {onOpenStudentHub && (
              <button
                type="button"
                className="outreach-btn hub"
                onClick={() => {
                  onClose();
                  onOpenStudentHub(item.studentId, item.fullName);
                }}
              >
                <User size={15} />
                <span>فتح هاب بيانات الطالب 360° 👁️</span>
              </button>
            )}
          </div>
        </div>

        {/* Risk Indicators Summary */}
        <div className="outreach-metrics-grid">
          <div className="outreach-metric-box">
            <span>نسبة الحضور:</span>
            <strong style={{ color: item.attendancePercent < 75 ? "#dc2626" : "#16a34a" }}>
              {item.attendancePercent}%
            </strong>
          </div>
          <div className="outreach-metric-box">
            <span>غياب متتالي:</span>
            <strong style={{ color: item.consecutiveAbsences > 0 ? "#dc2626" : "#475569" }}>
              {item.consecutiveAbsences} جلسات
            </strong>
          </div>
          <div className="outreach-metric-box">
            <span>المتبقي المالي:</span>
            <strong style={{ color: item.outstandingPiastres > 0 ? "#b45309" : "#16a34a" }}>
              {(item.outstandingPiastres / 100).toLocaleString()} ج.م
            </strong>
          </div>
          <div className="outreach-metric-box">
            <span>تأخر السداد:</span>
            <strong style={{ color: item.maxOverdueDays > 0 ? "#dc2626" : "#16a34a" }}>
              {item.maxOverdueDays > 0 ? `${item.maxOverdueDays} يوم` : "مُنتظم ✓"}
            </strong>
          </div>
        </div>

        {/* WhatsApp Templates Chooser */}
        <div className="outreach-section">
          <label className="outreach-label">
            <Sparkles size={14} color="#0d9488" />
            <span>اختر قالب رسالة التواصل المقترح:</span>
          </label>
          <div className="outreach-template-chips">
            <button
              type="button"
              className={`template-chip ${templateType === "ABSENCE" ? "active" : ""}`}
              onClick={() => setTemplateType("ABSENCE")}
            >
              جلسة تعويضية وتفقد غياب
            </button>
            <button
              type="button"
              className={`template-chip ${templateType === "PAYMENT" ? "active" : ""}`}
              onClick={() => setTemplateType("PAYMENT")}
            >
              تذكير مرن بسداد القسط
            </button>
            <button
              type="button"
              className={`template-chip ${templateType === "ACADEMIC" ? "active" : ""}`}
              onClick={() => setTemplateType("ACADEMIC")}
            >
              دعم فني وتطوير مستوى
            </button>
          </div>
          <div className="outreach-preview-box">
            <pre className="outreach-preview-text">{getWhatsAppMessage(templateType)}</pre>
          </div>
        </div>

        {/* Record Outreach Action */}
        <div className="outreach-section">
          <label className="outreach-label">
            <ShieldCheck size={14} color="#0d9488" />
            <span>تسجيل وتوثيق نتيجة التواصل (Outreach Log):</span>
          </label>

          <div className="outreach-status-selector">
            <label className={`status-option ${status === "contacted" ? "selected" : ""}`}>
              <input
                type="radio"
                name="outreach-status"
                value="contacted"
                checked={status === "contacted"}
                onChange={() => setStatus("contacted")}
              />
              <span>تم التواصل والمتابعة</span>
            </label>
            <label className={`status-option ${status === "retained" ? "selected" : ""}`}>
              <input
                type="radio"
                name="outreach-status"
                value="retained"
                checked={status === "retained"}
                onChange={() => setStatus("retained")}
              />
              <span>تم الاحتفاظ بالطالب وحل المشكلة ✓</span>
            </label>
            <label className={`status-option ${status === "pending" ? "selected" : ""}`}>
              <input
                type="radio"
                name="outreach-status"
                value="pending"
                checked={status === "pending"}
                onChange={() => setStatus("pending")}
              />
              <span>قيد الانتظار</span>
            </label>
            <label className={`status-option ${status === "lost" ? "selected" : ""}`}>
              <input
                type="radio"
                name="outreach-status"
                value="lost"
                checked={status === "lost"}
                onChange={() => setStatus("lost")}
              />
              <span>اعتذر عن الاستمرار</span>
            </label>
          </div>

          <textarea
            className="outreach-notes-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب ملاحظات التواصل (مثال: تم التحدث مع والدة الطالب وتم الاتفاق على حضور جلسة تعويضية الجمعة القادمة الساعة 4 عصراً)..."
          />
        </div>

        {/* Footer */}
        <div className="outreach-footer">
          <button
            type="button"
            className="outreach-cancel-btn"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="outreach-submit-btn"
            disabled={isSubmitting}
            onClick={handleSaveOutreach}
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ نتيجة التواصل وتحديث الرادار ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
