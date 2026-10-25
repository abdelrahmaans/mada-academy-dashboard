import React, { useState } from "react";
import { UserMinus, AlertCircle, X, Send, Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { apiClient, type SessionRecord } from "@/lib/apiClient";
import { formatDate, formatTime } from "@/pages/InstructorDeskTypes";

export interface SubstitutionRequestModalProps {
  session: SessionRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubstitutionRequestModal({
  session,
  onClose,
  onSuccess,
}: SubstitutionRequestModalProps) {
  const [reasonCategory, setReasonCategory] = useState("ظرف صحي طارئ");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    "ظرف صحي طارئ",
    "سفر أو التزام أكاديمي",
    "ظرف عائلي مفاجئ",
    "تضارب مواعيد ملح",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = details.trim()
      ? `${reasonCategory} · ${details.trim()}`
      : reasonCategory;

    setLoading(true);
    setError(null);
    try {
      await apiClient.requestSubstitution(session.id, finalReason);
      toast.success("تم إرسال طلب البديل بنجاح لإدارة الفرع! سيتم إشعارك فور تعيين بديل.");
      onSuccess();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إرسال طلب البديل.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="r04-modal-overlay" onClick={onClose}>
      <div
        className="r04-modal-dialog r04-substitute-dialog"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        <div className="r04-modal-header">
          <div>
            <h2>طلب اعتذار وتعيين مدرب بديل</h2>
            <p>إشعار إدارة الفرع لتوفير مدرب بديل لتغطية الجلسة المجدولة.</p>
          </div>
          <button type="button" className="r04-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="r04-substitute-session-box">
            <div className="box-title">
              <strong>{session.courseName ?? `جلسة ${session.sessionNumber}`}</strong>
              <span className="session-badge">حصة رقم {session.sessionNumber}</span>
            </div>
            <div className="box-meta">
              <span>
                <Calendar size={13} /> {formatDate(session.startAt)}
              </span>
              <span>
                <Clock size={13} /> {formatTime(session.startAt)} – {formatTime(session.endAt)}
              </span>
              <span>
                <MapPin size={13} /> {session.classroomName ?? "قاعة الفرع"}
              </span>
            </div>
          </div>

          {error && (
            <div className="r04-inline-alert error" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="r04-form-group">
            <label>سبب الاعتذار الرئيسي:</label>
            <div className="r04-reason-presets">
              {presets.map(item => (
                <button
                  type="button"
                  key={item}
                  className={`r04-preset-btn ${reasonCategory === item ? "active" : ""}`}
                  onClick={() => setReasonCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="r04-form-group">
            <label>تفاصيل إضافية للمدير الأكاديمي (اختياري):</label>
            <textarea
              rows={3}
              value={details}
              placeholder="اكتب أي توضيحات لمدير الفرع لمساعدته في التنسيق مع المدرب البديل..."
              onChange={e => setDetails(e.target.value)}
            />
          </div>

          <p className="r04-substitute-note">
            ملاحظة: عند اعتماد المدرب البديل من إدارة الفرع، يتم نقل الجلسة وسجل الحضور وكافة المستحقات المالية تلقائيًا إلى المدرب البديل.
          </p>

          <div className="r04-modal-footer">
            <button
              type="button"
              className="r04-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="r04-btn-finish"
              disabled={loading}
            >
              <Send size={14} /> {loading ? "جارٍ الإرسال…" : "إرسال طلب البديل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
