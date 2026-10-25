import React, { useEffect, useState } from "react";
import {
  UserCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  UserX,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  type AvailableSubstituteItem,
  type SessionRecord,
} from "@/lib/apiClient";
import { formatDate, formatTime } from "@/pages/InstructorDeskTypes";

export interface BranchSubstituteModalProps {
  session: SessionRecord;
  onClose: () => void;
  onAssigned: () => void;
}

export function BranchSubstituteModal({
  session,
  onClose,
  onAssigned,
}: BranchSubstituteModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<AvailableSubstituteItem[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    const fetchSubstitutes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.getAvailableSubstitutes(session.id);
        if (active) {
          setCandidates(response.items);
          const firstAvailable = response.items.find(i => i.isAvailable);
          if (firstAvailable) setSelectedInstructorId(firstAvailable.instructorId);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "تعذر جلب قائمة المدربين المتاحين.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchSubstitutes();
    return () => {
      active = false;
    };
  }, [session.id]);

  const filteredCandidates = candidates.filter(item =>
    item.displayName.toLowerCase().includes(search.toLowerCase()) ||
    item.phone.includes(search)
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructorId) {
      setError("يرجى اختيار مدرب بديل من القائمة.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.assignSubstitute(session.id, {
        substituteInstructorId: selectedInstructorId,
        reason: reason.trim() || "تم التكليف كمدرب بديل من إدارة الفرع",
      });
      toast.success("تم تعيين المدرب البديل بنجاح وتحويل الحصة لجدوله ومستحقاته! 🎉");
      onAssigned();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تعيين المدرب البديل.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="r04-modal-overlay" onClick={onClose}>
      <div
        className="r04-modal-dialog r04-assign-substitute-dialog"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        <div className="r04-modal-header">
          <div>
            <h2>تعيين مدرب بديل للجلسة</h2>
            <p>فحص التعارضات اللحظي واختيار مدرب متاح في هذا التوقيت.</p>
          </div>
          <button type="button" className="r04-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

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
            <span>المدرب الأساسي: {session.instructorName ?? "غير محدد"}</span>
          </div>
        </div>

        {error && (
          <div className="r04-inline-alert error" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAssign}>
          <div className="r04-form-group">
            <label>البحث في مدربي الفرع:</label>
            <div className="r04-search-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="r04-substitute-candidates-list">
            {loading ? (
              <div className="r04-loading-hint">جارٍ فحص التوفر والتعارضات للمدربين…</div>
            ) : filteredCandidates.length === 0 ? (
              <div className="r04-empty-hint">لا يوجد مدربون آخرون مسجلون في هذا الفرع.</div>
            ) : (
              filteredCandidates.map(inst => (
                <label
                  key={inst.instructorId}
                  className={`r04-candidate-card ${
                    selectedInstructorId === inst.instructorId ? "selected" : ""
                  } ${!inst.isAvailable ? "unavailable" : ""}`}
                >
                  <input
                    type="radio"
                    name="substitute"
                    value={inst.instructorId}
                    disabled={!inst.isAvailable}
                    checked={selectedInstructorId === inst.instructorId}
                    onChange={() => setSelectedInstructorId(inst.instructorId)}
                  />
                  <div className="candidate-body">
                    <div className="candidate-head">
                      <strong>{inst.displayName}</strong>
                      {inst.isAvailable ? (
                        <span className="avail-badge ready">
                          <CheckCircle2 size={12} /> متاح بدون تعارض
                        </span>
                      ) : (
                        <span className="avail-badge busy">
                          <UserX size={12} /> غير متاح (تعارض في الجدول)
                        </span>
                      )}
                    </div>
                    <div className="candidate-sub">
                      <span>
                        <Phone size={11} /> {inst.phone}
                      </span>
                      <span>· الدور: {inst.roleCode === "R03_HEAD_INSTRUCTORS" ? "رئيس مدربين" : "مدرب"}</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="r04-form-group" style={{ marginTop: "12px" }}>
            <label>ملاحظات التكليف (اختياري):</label>
            <input
              type="text"
              placeholder="اكتب أي تعليمات للمدرب البديل..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <div className="r04-modal-footer">
            <button
              type="button"
              className="r04-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="r04-btn-finish"
              disabled={submitting || !selectedInstructorId}
            >
              <UserCheck size={14} /> {submitting ? "جارٍ التكليف والتحديث…" : "اعتماد وتكليف المدرب البديل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
