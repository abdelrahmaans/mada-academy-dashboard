import React, { useState } from "react";
import {
  X,
  Phone,
  MessageCircle,
  Calendar,
  CalendarDays,
  UserCheck,
  Clock,
  MapPin,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  ExternalLink,
} from "lucide-react";
import type { LeadRecord } from "@/lib/apiClient";
import "./LeadDetailsModal.css";

interface Props {
  isOpen: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  branchName?: string;
  onScheduleInterview: (lead: LeadRecord) => void;
  onMarkReadyForIntake: (lead: LeadRecord) => void;
  onAddNote: (lead: LeadRecord, note: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "استفسار جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم بالانضمام",
  INTERVIEW_SCHEDULED: "محجوز مقابلة / تحديد مستوى",
  READY_TO_ENROLL: "جاهز للتسكين بالفرع",
  REGISTERED: "تم التسجيل والتحويل",
  WAITLISTED: "قائمة انتظار",
  NOTIFIED: "تم إشعاره",
  CANCELLED: "ملغي",
  ARCHIVED: "مؤرشف",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#f0fdfa", color: "#0d9488" },
  CONTACTED: { bg: "#eff6ff", color: "#2563eb" },
  INTERESTED: { bg: "#fef3c7", color: "#d97706" },
  READY_TO_ENROLL: { bg: "#f0fdf4", color: "#16a34a" },
  REGISTERED: { bg: "#f5f3ff", color: "#7c3aed" },
  WAITLISTED: { bg: "#fff7ed", color: "#c2410c" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626" },
  ARCHIVED: { bg: "#f1f5f9", color: "#64748b" },
};

export function LeadDetailsModal({
  isOpen,
  lead,
  onClose,
  branchName = "الفرع الرئيسي",
  onScheduleInterview,
  onMarkReadyForIntake,
  onAddNote,
}: Props) {
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  if (!isOpen || !lead) return null;

  const statusStyle = STATUS_COLORS[lead.status] || { bg: "#f1f5f9", color: "#475569" };
  const statusLabel = STATUS_LABELS[lead.status] || lead.status;
  const isReady = lead.status === "REGISTERED" || Boolean(lead.notes?.includes("جاهز للتسكين"));
  const hasInterview = lead.notes?.includes("موعد المقابلة") || lead.notes?.includes("إنترفيو");

  const handleSendWhatsApp = () => {
    let cleanPhone = lead.phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "2" + cleanPhone;
    if (!cleanPhone.startsWith("20") && cleanPhone.length === 10) cleanPhone = "20" + cleanPhone;
    const msg = encodeURIComponent(
      `أهلاً بحضرتك أ. ${lead.parentName}، تحية طيبة من أكاديمية مدى للروبوتكس والذكاء الاصطناعي 🤖 بخصوص البطل *${lead.childName}*. يسعدنا تواصلكم معنا للرد على كافة استفساراتكم.`
    );
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`, "_blank");
  };

  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await onAddNote(lead, newNote.trim());
      setNewNote("");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div
      className="lead-details-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="lead-details-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-details-title"
      >
        {/* Header */}
        <div className="lead-details-header">
          <div className="lead-details-avatar-row">
            <div className="lead-details-avatar">
              {lead.childName ? lead.childName.trim().charAt(0) : "ط"}
            </div>
            <div>
              <div className="lead-details-title-row">
                <h3 id="lead-details-title">{lead.childName}</h3>
                <span
                  className="lead-details-status-badge"
                  style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                  {statusLabel}
                </span>
                {isReady && (
                  <span className="lead-details-ready-chip">
                    <CheckCircle2 size={12} /> جاهز للتسكين
                  </span>
                )}
              </div>
              <p className="lead-details-subtitle">
                معرف العميل: <b dir="ltr">LEAD-{lead.id.slice(0, 8).toUpperCase()}</b> · ولي الأمر: <strong>{lead.parentName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            className="lead-details-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="lead-details-body">
          {/* Quick Info Grid */}
          <div className="lead-details-grid">
            <div className="lead-info-box">
              <span className="lead-info-label">
                <Phone size={13} /> هاتف التواصل
              </span>
              <div className="lead-phone-row">
                <strong dir="ltr">{lead.phone}</strong>
                <div className="lead-phone-actions">
                  <button
                    type="button"
                    className="lead-mini-action-btn phone"
                    onClick={() => window.open(`tel:${lead.phone}`)}
                    title="اتصال هاتفي"
                  >
                    <Phone size={12} /> اتصال
                  </button>
                  <button
                    type="button"
                    className="lead-mini-action-btn whatsapp"
                    onClick={handleSendWhatsApp}
                    title="محادثة واتساب"
                  >
                    <MessageCircle size={12} /> واتساب
                  </button>
                </div>
              </div>
            </div>

            <div className="lead-info-box">
              <span className="lead-info-label">
                <MapPin size={13} /> الفرع المسند
              </span>
              <strong>{branchName}</strong>
            </div>

            <div className="lead-info-box">
              <span className="lead-info-label">
                <Tag size={13} /> قناة الاستقطاب (Source)
              </span>
              <span className="lead-source-tag">
                {lead.channel || "سوشيال ميديا وإعلانات"}
              </span>
            </div>

            <div className="lead-info-box">
              <span className="lead-info-label">
                <Clock size={13} /> تاريخ التسجيل
              </span>
              <strong>
                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("ar-EG", { dateStyle: "medium" }) : "اليوم"}
              </strong>
            </div>
          </div>

          {/* Interview Details (If Scheduled) */}
          {hasInterview && (
            <div className="lead-interview-banner">
              <div className="lead-interview-icon">
                <CalendarDays size={20} />
              </div>
              <div>
                <strong>موعد المقابلة واختبار تحديد المستوى محجوز 📅</strong>
                <p>
                  {lead.notes}
                </p>
              </div>
            </div>
          )}

          {/* Notes and History */}
          <div className="lead-notes-section">
            <div className="lead-section-title">
              <FileText size={15} />
              <span>سجل الملاحظات والمتابعات</span>
            </div>

            <div className="lead-notes-display">
              {lead.notes ? (
                <p className="lead-notes-text">{lead.notes}</p>
              ) : (
                <p className="lead-notes-empty">لا توجد ملاحظات مسجلة بعد لهذا العميل.</p>
              )}
            </div>

            {/* Quick Add Note Form */}
            <form onSubmit={handleSaveNoteSubmit} className="lead-add-note-form">
              <input
                type="text"
                placeholder="إضافة تحديث أو ملخص مكالمة للعميل…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={savingNote}
              />
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="lead-note-submit-btn"
              >
                <Send size={14} />
                <span>{savingNote ? "جارٍ الحفظ…" : "حفظ"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="lead-details-footer">
          <div className="lead-footer-left">
            <button
              type="button"
              className="lead-footer-btn outline"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle size={15} />
              <span>محادثة واتساب</span>
            </button>

            <button
              type="button"
              className="lead-footer-btn highlight"
              onClick={() => {
                onClose();
                onScheduleInterview(lead);
              }}
            >
              <CalendarDays size={15} />
              <span>{hasInterview ? "تعديل موعد المقابلة" : "حجز مقابلة واختبار"}</span>
            </button>
          </div>

          <div className="lead-footer-right">
            {!isReady && (
              <button
                type="button"
                className="lead-footer-btn primary"
                onClick={() => {
                  onClose();
                  onMarkReadyForIntake(lead);
                }}
              >
                <UserCheck size={15} />
                <span>تحويل للتسكين بالفرع 🚀</span>
              </button>
            )}

            <button
              type="button"
              className="lead-footer-btn secondary"
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
