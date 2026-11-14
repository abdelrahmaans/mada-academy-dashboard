import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  User,
  Calendar,
  AlertTriangle,
  CreditCard,
  Sparkles,
  Phone,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import "./WhatsAppNotificationModal.css";

export type WhatsAppTemplateType =
  | "ABSENCE"
  | "INSTALLMENT_REMINDER"
  | "INTERVIEW_CONFIRMATION"
  | "ONBOARDING_WELCOME"
  | "CUSTOM";

export interface WhatsAppRecipientData {
  studentName: string;
  parentName: string;
  phone: string;
  courseName?: string;
  branchName?: string;
  amountDue?: number;
  sessionDate?: string;
  sessionTime?: string;
  interviewDate?: string;
  interviewTime?: string;
  groupName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recipient: WhatsAppRecipientData | null;
  defaultTemplate?: WhatsAppTemplateType;
}

export function WhatsAppNotificationModal({
  isOpen,
  onClose,
  recipient,
  defaultTemplate = "ABSENCE",
}: Props) {
  const [template, setTemplate] = useState<WhatsAppTemplateType>(defaultTemplate);
  const [messageText, setMessageText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultTemplate) setTemplate(defaultTemplate);
  }, [defaultTemplate]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Generate template message based on recipient data
  useEffect(() => {
    if (!recipient) return;

    const parent = recipient.parentName || "ولي الأمر الفاضل";
    const student = recipient.studentName || "الطالب";
    const course = recipient.courseName || "الكورس";
    const branch = recipient.branchName || "الفرع";
    const amount = recipient.amountDue ? `${recipient.amountDue.toLocaleString("ar-EG")} ج.م` : "";
    const date = recipient.sessionDate || "اليوم";

    switch (template) {
      case "ABSENCE":
        setMessageText(
          `السلام عليكم ورحمة الله وبركاته، أ/ ${parent} المحترم.\n\n` +
          `تحية طيبة من إدارة أكاديمية مَدى.\n` +
          `نحيط سيادتكم علماً بتغيب البطل/ة (${student}) عن حصة كورس (${course}) المقررة بتاريخ (${date}) بفرع ${branch}.\n\n` +
          `حرصاً على المستوى الأكاديمي، يرجى التنسيق معنا لترتيب حصة تعويضية للمحتوى المشروح.\n\n` +
          `مع خالص الشكر والتقدير،\n` +
          `إدارة أكاديمية مَدى للتعليم التقني والابتكار 🌟`
        );
        break;

      case "INSTALLMENT_REMINDER":
        setMessageText(
          `السلام عليكم أ/ ${parent}، نرجو أن تكونوا بأفضل حال.\n\n` +
          `تذكير ودي من الإدارة المالية بأكاديمية مَدى بموعد سداد قسط الاشتراك لكورس (${course}) الخاص بالطالب/ة (${student}).\n\n` +
          `المبلغ المستحق: ${amount || "المحدد بالاشتراك"}\n` +
          `يمكنكم السداد نقداً أو عبر الفيزا بالفرع (${branch})، أو عبر التحويل البنكي ومحافظ الدفع الإلكتروني.\n\n` +
          `شاكرين تعاونكم الدائم لدعم تميز أبنائنا 🚀`
        );
        break;

      case "INTERVIEW_CONFIRMATION":
        setMessageText(
          `أهلاً بحضرتك أ/ ${parent}، سعداء جداً بتواصلكم مع أكاديمية مَدى.\n\n` +
          `يسعدنا تأكيد موعد المقابلة واختبار تحديد المستوى التفاعلي للبطل/ة (${student}):\n` +
          `🗓️ التاريخ: ${recipient.interviewDate || "المحدد"}\n` +
          `⏰ التوقيت: ${recipient.interviewTime || "المحدد"}\n` +
          `📍 المقر: أكاديمية مدى - فرع ${branch}\n\n` +
          `نتطلع للقائكم ونتمنى للبطل رحلة تعليمية ملهمة وممتعة معنا! 💡`
        );
        break;

      case "ONBOARDING_WELCOME":
        setMessageText(
          `ألف مبروك! مرحباً بالبطل/ة (${student}) في عائلة أكاديمية مَدى 🌟\n\n` +
          `أ/ ${parent}، تم بنجاح تسكين واكتمال إجراءات التسجيل في كورس (${course}) - ${recipient.groupName || "المجموعة المعتمدة"} بفرع ${branch}.\n\n` +
          `سيبدأ التدريب العملي في الموعد المحدد، وفريق المدربين متحمس لبدء المشاريع البرمجية والروبوتات مع البطل.\n\n` +
          `أهلاً بكم في المستقبل 🤖✨`
        );
        break;

      case "CUSTOM":
        if (!messageText) {
          setMessageText(
            `السلام عليكم أ/ ${parent}، تحياتنا من أكاديمية مَدى بخصوص الطالب (${student}) بفرع ${branch}: `
          );
        }
        break;
    }
  }, [template, recipient]);

  if (!isOpen || !recipient) return null;

  const sanitizePhone = (raw: string) => {
    let clean = raw.replace(/\D/g, "");
    if (clean.startsWith("01")) {
      clean = `2${clean}`;
    } else if (clean.startsWith("1") && clean.length === 10) {
      clean = `20${clean}`;
    }
    return clean;
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = sanitizePhone(recipient.phone);
    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error("رقم الهاتف غير صالح للمراسلة عبر واتساب");
      return;
    }
    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("تم فتح واتساب لإرسال الرسالة بنجاح!");
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      toast.success("تم نسخ نص الرسالة إلى الحافظة!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر نسخ النص");
    }
  };

  return (
    <div
      className="dialog-backdrop whatsapp-modal-backdrop"
      role="presentation"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="whatsapp-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="whatsapp-modal-header">
          <div className="whatsapp-header-info">
            <div className="whatsapp-icon-wrap">
              <MessageCircle size={22} />
            </div>
            <div>
              <h3>إرسال إشعار واتساب فوري لولي الأمر</h3>
              <p>
                مراسلة ولي الأمر ({recipient.parentName}) للطالب/ة ({recipient.studentName}) مباشرة
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="إغلاق"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Templates Selector */}
        <div className="whatsapp-templates-bar">
          <button
            type="button"
            className={`template-pill ${template === "ABSENCE" ? "active" : ""}`}
            onClick={() => setTemplate("ABSENCE")}
          >
            <AlertTriangle size={14} />
            <span>إشعار غياب</span>
          </button>

          <button
            type="button"
            className={`template-pill ${template === "INSTALLMENT_REMINDER" ? "active" : ""}`}
            onClick={() => setTemplate("INSTALLMENT_REMINDER")}
          >
            <CreditCard size={14} />
            <span>تذكير بقسط</span>
          </button>

          <button
            type="button"
            className={`template-pill ${template === "INTERVIEW_CONFIRMATION" ? "active" : ""}`}
            onClick={() => setTemplate("INTERVIEW_CONFIRMATION")}
          >
            <Calendar size={14} />
            <span>تأكيد مقابلة</span>
          </button>

          <button
            type="button"
            className={`template-pill ${template === "ONBOARDING_WELCOME" ? "active" : ""}`}
            onClick={() => setTemplate("ONBOARDING_WELCOME")}
          >
            <Sparkles size={14} />
            <span>ترحيب وتسكين</span>
          </button>

          <button
            type="button"
            className={`template-pill ${template === "CUSTOM" ? "active" : ""}`}
            onClick={() => setTemplate("CUSTOM")}
          >
            <span>رسالة مخصصة</span>
          </button>
        </div>

        {/* Message Editor */}
        <div className="whatsapp-editor-section">
          <div className="editor-top-label">
            <span>نص الرسالة المجهز:</span>
            <span className="phone-preview">
              <Phone size={13} /> {recipient.phone}
            </span>
          </div>

          <textarea
            className="whatsapp-textarea"
            rows={7}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder="اكتب نص الرسالة هنا..."
          />
        </div>

        {/* WhatsApp Preview Bubble */}
        <div className="whatsapp-bubble-preview">
          <div className="whatsapp-bubble-header">
            <span>معاينة الرسالة كما ستظهر لولي الأمر في واتساب:</span>
          </div>
          <div className="chat-bubble">
            <div className="chat-text">{messageText}</div>
            <div className="chat-time">
              {new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} ✓✓
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="whatsapp-modal-footer">
          <button
            type="button"
            className="whatsapp-action-btn secondary"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "تم النسخ" : "نسخ النص"}</span>
          </button>

          <button
            type="button"
            className="whatsapp-action-btn primary"
            onClick={handleSendWhatsApp}
          >
            <Send size={16} />
            <span>فتح وإرسال عبر واتساب الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
}
