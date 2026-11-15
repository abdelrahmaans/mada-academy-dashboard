import React, { useState, useEffect, useMemo } from "react";
import {
  MessageCircle,
  X,
  Send,
  Users,
  Calendar,
  AlertTriangle,
  CreditCard,
  Sparkles,
  Phone,
  Copy,
  Check,
  CheckCircle2,
  Filter,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import "./WhatsAppBroadcastModal.css";

export type BroadcastCategory = "GROUP" | "ABSENT_TODAY" | "OVERDUE_FEES" | "CUSTOM_LIST";

export interface BroadcastStudent {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  groupName?: string;
  branchName?: string;
  absentDate?: string;
  amountDue?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: BroadcastCategory;
  availableGroups?: Array<{ id: string; name: string }>;
  studentsList?: BroadcastStudent[];
  branchName?: string;
}

export function WhatsAppBroadcastModal({
  isOpen,
  onClose,
  initialCategory = "GROUP",
  availableGroups = [
    { id: "grp-1", name: "روبوتكس مستوى 2 · السبت 12:00 م" },
    { id: "grp-2", name: "أساسيات بايثون والذكاء الاصطناعي · الأحد 04:00 م" },
    { id: "grp-3", name: "معسكر إعداد بطولة WRO 2026 · الجمعة 02:00 م" },
  ],
  studentsList = [
    {
      id: "st-1",
      studentName: "ياسين محمد علي",
      parentName: "أ. محمد علي",
      phone: "+201011223344",
      groupName: "روبوتكس مستوى 2 · السبت 12:00 م",
      branchName: "مدينة نصر",
    },
    {
      id: "st-2",
      studentName: "عمر خالد إبراهيم",
      parentName: "د. نهى إبراهيم",
      phone: "+201012345678",
      groupName: "روبوتكس مستوى 2 · السبت 12:00 م",
      branchName: "مدينة نصر",
    },
    {
      id: "st-3",
      studentName: "آدم شريف حسن",
      parentName: "م. شريف حسن",
      phone: "+201099887766",
      groupName: "روبوتكس مستوى 2 · السبت 12:00 م",
      branchName: "مدينة نصر",
    },
    {
      id: "st-4",
      studentName: "سيف مصطفى عادل",
      parentName: "أ. مصطفى عادل",
      phone: "+201022334455",
      groupName: "روبوتكس مستوى 2 · السبت 12:00 م",
      branchName: "مدينة نصر",
    },
    {
      id: "st-5",
      studentName: "ملك حسام الدين",
      parentName: "د. حسام الدين",
      phone: "+201012345673",
      groupName: "روبوتكس مستوى 2 · السبت 12:00 م",
      branchName: "مدينة نصر",
    },
  ],
  branchName = "مدينة نصر",
}: Props) {
  const [category, setCategory] = useState<BroadcastCategory>(initialCategory);
  const [selectedGroupId, setSelectedGroupId] = useState(availableGroups[0]?.id || "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [sentStudentIds, setSentStudentIds] = useState<Set<string>>(new Set());
  const [templateType, setTemplateType] = useState<"SESSION_REMINDER" | "ABSENCE" | "INSTALLMENT" | "CUSTOM">("SESSION_REMINDER");
  const [customMessage, setCustomMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize selected students
  useEffect(() => {
    if (isOpen) {
      setSelectedStudentIds(studentsList.map((s) => s.id));
      setSentStudentIds(new Set());
      setCurrentIndex(0);
    }
  }, [isOpen, studentsList]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const activeGroup = useMemo(() => {
    return availableGroups.find((g) => g.id === selectedGroupId)?.name || "مجموعة الروبوتكس";
  }, [availableGroups, selectedGroupId]);

  const sanitizePhone = (raw: string) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = "2" + p;
    if (!p.startsWith("20") && p.length === 10) p = "20" + p;
    return p;
  };

  const getPersonalizedMessage = (st: BroadcastStudent) => {
    if (templateType === "SESSION_REMINDER") {
      return `مرحباً ${st.parentName}،
تحية طيبة من أكاديمية مدى للروبوتكس 🤖
نود تذكيركم بموعد الحصة القادمة للطالب البطل *${st.studentName}* في مجموعة (${st.groupName || activeGroup}) بفرع ${st.branchName || branchName}.
يرجى الحضور قبل الموعد بـ 10 دقائق لضمان تجهيز حقيبة الروبوت.
نتمنى له حصة مليئة بالابتكار والإبداع! ✨`;
    }

    if (templateType === "ABSENCE") {
      return `مرحباً ${st.parentName}،
تحية طيبة من أكاديمية مدى للروبوتكس.
نحيطكم علماً بغياب الطالب المتميز *${st.studentName}* عن حصة اليوم.
حرصاً على مستواه الأكاديمي واستمرار تسلسل المشروعات، يرجى التواصل مع إدارة الفرع لتحديد موعد حصة التعويض المجانية.
دمتم ودام أبناؤنا بخير 🌟`;
    }

    if (templateType === "INSTALLMENT") {
      return `مرحباً ${st.parentName}،
تحية طيبة من إدارة الحسابات بأكاديمية مدى للروبوتكس.
نود تذكيركم بحلول موعد سداد القسط الأكاديمي للطالب *${st.studentName}*.
يمكنكم السداد في مقر الفرع أو إلكترونياً عبر تطبيق إنستاباي أو المحافظ الإلكترونية.
شاكرين لكم حسن تعاونكم الدائم معنا 🌸`;
    }

    // Custom
    let text = customMessage || "إشعار هام من أكاديمية مدى للروبوتكس لأولياء الأمور الكرام.";
    text = text.replace(/\{student\}/g, st.studentName);
    text = text.replace(/\{parent\}/g, st.parentName);
    text = text.replace(/\{group\}/g, st.groupName || activeGroup);
    text = text.replace(/\{branch\}/g, st.branchName || branchName);
    return text;
  };

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === studentsList.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(studentsList.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSendSingle = (st: BroadcastStudent) => {
    const clean = sanitizePhone(st.phone);
    const msg = encodeURIComponent(getPersonalizedMessage(st));
    const url = `https://web.whatsapp.com/send?phone=${clean}&text=${msg}`;
    window.open(url, "_blank");

    setSentStudentIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => next.add(id));
      next.add(st.id);
      return next;
    });
    toast.success(`تم فتح شات الواتساب للطالب ${st.studentName} بنجاح!`);
  };

  const handleSendNext = () => {
    const pending = studentsList.filter(
      (s) => selectedStudentIds.includes(s.id) && !sentStudentIds.has(s.id)
    );

    if (pending.length === 0) {
      toast.info("تم إرسال الرسائل لجميع الطلاب المحددين في القائمة ✓");
      return;
    }

    const nextStudent = pending[0];
    handleSendSingle(nextStudent);
  };

  const handleCopyAllPhones = () => {
    const phones = studentsList
      .filter((s) => selectedStudentIds.includes(s.id))
      .map((s) => s.phone)
      .join(", ");

    navigator.clipboard.writeText(phones);
    toast.success("تم نسخ جميع أرقام هواتف أولياء الأمور إلى الحافظة!");
  };

  return (
    <div
      className="dialog-backdrop whatsapp-broadcast-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="academic-dialog whatsapp-broadcast-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcast-modal-title"
      >
        {/* Top Header */}
        <div className="dialog-top">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="whatsapp-broadcast-icon-box">
              <MessageCircle size={22} />
            </span>
            <div>
              <h2 id="broadcast-modal-title" style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
                محرك رسائل الواتساب الجماعية (Batch WhatsApp Broadcast)
              </h2>
              <small style={{ color: "#64748b" }}>
                إرسال رسائل مخصصة بأسماء الطلاب وأولياء أمور المجموعة بضغطة زر
              </small>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className="whatsapp-broadcast-body" dir="rtl">
          {/* Top Controls: Category & Group Picker */}
          <div className="broadcast-controls-strip">
            <div className="broadcast-category-selector">
              <button
                type="button"
                className={`broadcast-cat-pill ${category === "GROUP" ? "active" : ""}`}
                onClick={() => setCategory("GROUP")}
              >
                <Users size={14} /> بث لمجموعة دراسية
              </button>
              <button
                type="button"
                className={`broadcast-cat-pill ${category === "ABSENT_TODAY" ? "active" : ""}`}
                onClick={() => {
                  setCategory("ABSENT_TODAY");
                  setTemplateType("ABSENCE");
                }}
              >
                <AlertTriangle size={14} /> غياب حصص اليوم
              </button>
              <button
                type="button"
                className={`broadcast-cat-pill ${category === "OVERDUE_FEES" ? "active" : ""}`}
                onClick={() => {
                  setCategory("OVERDUE_FEES");
                  setTemplateType("INSTALLMENT");
                }}
              >
                <CreditCard size={14} /> تذكير الأقساط
              </button>
            </div>

            {category === "GROUP" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>المجموعة:</span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="broadcast-group-select"
                >
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Two-Column Layout: Students Roster & Message Preview */}
          <div className="broadcast-grid-layout">
            {/* Left: Students Roster with Selection */}
            <div className="broadcast-students-panel">
              <div className="broadcast-panel-head">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.length === studentsList.length && studentsList.length > 0}
                    onChange={toggleSelectAll}
                    id="select-all-broadcast"
                  />
                  <label htmlFor="select-all-broadcast" style={{ fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                    تحديد الكل ({selectedStudentIds.length} / {studentsList.length} طالب)
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAllPhones}
                  className="broadcast-copy-btn"
                  title="نسخ جميع أرقام هواتف أولياء الأمور"
                >
                  <Copy size={13} /> نسخ الأرقام
                </button>
              </div>

              <div className="broadcast-students-list">
                {studentsList.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.id);
                  const isSent = sentStudentIds.has(st.id);

                  return (
                    <div
                      key={st.id}
                      className={`broadcast-student-row ${isSelected ? "selected" : ""} ${isSent ? "sent" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectStudent(st.id)}
                      />

                      <div className="broadcast-st-info">
                        <strong className="broadcast-st-name">{st.studentName}</strong>
                        <span className="broadcast-st-parent">
                          {st.parentName} · <bdi dir="ltr">{st.phone}</bdi>
                        </span>
                      </div>

                      <div className="broadcast-st-action">
                        {isSent ? (
                          <span className="broadcast-sent-badge">
                            <CheckCircle2 size={13} /> تم الإرسال
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendSingle(st)}
                            className="broadcast-single-send-btn"
                            title="إرسال الآن عبر واتساب ويب"
                          >
                            <Send size={12} /> إرسال
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Message Templates & Live Preview */}
            <div className="broadcast-message-panel">
              <div className="broadcast-templates-tabs">
                <button
                  type="button"
                  className={templateType === "SESSION_REMINDER" ? "active" : ""}
                  onClick={() => setTemplateType("SESSION_REMINDER")}
                >
                  تذكير بالحصة
                </button>
                <button
                  type="button"
                  className={templateType === "ABSENCE" ? "active" : ""}
                  onClick={() => setTemplateType("ABSENCE")}
                >
                  إشعار غياب
                </button>
                <button
                  type="button"
                  className={templateType === "INSTALLMENT" ? "active" : ""}
                  onClick={() => setTemplateType("INSTALLMENT")}
                >
                  تذكير قسط
                </button>
                <button
                  type="button"
                  className={templateType === "CUSTOM" ? "active" : ""}
                  onClick={() => setTemplateType("CUSTOM")}
                >
                  رسالة مخصصة
                </button>
              </div>

              {templateType === "CUSTOM" && (
                <div style={{ marginBottom: "10px" }}>
                  <textarea
                    rows={3}
                    placeholder="اكتب نص الرسالة... يمكنك استخدام: {student} لاسم الطالب، {parent} لاسم ولي الأمر، {group} للمجموعة"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              )}

              {/* Chat Bubble Preview */}
              <div className="broadcast-preview-card">
                <div className="broadcast-preview-header">
                  <span className="whatsapp-dot" />
                  <strong>معاينة نص الرسالة للطالب الأول باللائحة:</strong>
                </div>

                <div className="broadcast-chat-bubble">
                  {studentsList[0] ? (
                    <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6" }}>
                      {getPersonalizedMessage(studentsList[0])}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#64748b" }}>لا يوجد طلاب محددون</p>
                  )}
                  <span className="chat-bubble-time">الآن · مصلحة الأكاديمية</span>
                </div>
              </div>

              {/* Sequential Dispatch Bar */}
              <div className="broadcast-dispatch-actions">
                <button
                  type="button"
                  onClick={handleSendNext}
                  className="button button-primary broadcast-send-next-btn"
                  disabled={selectedStudentIds.length === 0}
                >
                  <Send size={16} />
                  <span>
                    إرسال للطالب التالي (
                    {
                      studentsList.filter(
                        (s) => selectedStudentIds.includes(s.id) && !sentStudentIds.has(s.id)
                      ).length
                    }{" "}
                    متبقي) 🚀
                  </span>
                </button>

                <small style={{ color: "#64748b", fontSize: "11px", textAlign: "center" }}>
                  يتم فتح نافذة WhatsApp Web لكل طالب على حدة مع رسالته المخصصة تلقائياً لمنع حظر الحسابات.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
