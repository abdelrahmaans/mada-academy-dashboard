import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Award,
  Users,
  Coins,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  type AttendanceItem,
  type SessionRecord,
} from "@/lib/apiClient";
import type { AttendanceDraft, AttendanceStatus } from "@/pages/InstructorDeskTypes";

export interface GuidedSessionCompletionModalProps {
  session: SessionRecord;
  attendanceRows: AttendanceItem[];
  attendanceDraft: Record<string, AttendanceDraft>;
  counts: {
    present: number;
    late: number;
    absent: number;
    unmarked: number;
  };
  onClose: () => void;
  onCompleted: () => void;
}

export function GuidedSessionCompletionModal({
  session,
  attendanceRows,
  attendanceDraft,
  counts,
  onClose,
  onCompleted,
}: GuidedSessionCompletionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [localDraft, setLocalDraft] = useState<Record<string, AttendanceDraft>>(attendanceDraft);
  const [evaluationsDraft, setEvaluationsDraft] = useState<
    Record<string, { score: number; notes: string }>
  >(() => {
    const initial: Record<string, { score: number; notes: string }> = {};
    attendanceRows.forEach(row => {
      initial[row.studentId] = { score: 90, notes: "مشاركة ممتازة والتزام بالأنشطة العملية." };
    });
    return initial;
  });
  const [skipEvaluations, setSkipEvaluations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localUnmarkedCount = attendanceRows.filter(
    r => (localDraft[r.studentId]?.status ?? "UNMARKED") === "UNMARKED"
  ).length;

  const handleMarkAllPresent = () => {
    const updated = { ...localDraft };
    attendanceRows.forEach(row => {
      if ((updated[row.studentId]?.status ?? "UNMARKED") === "UNMARKED") {
        updated[row.studentId] = { status: "PRESENT", lateMinutes: null };
      }
    });
    setLocalDraft(updated);
  };

  const handleSetQuickScore = (studentId: string, score: number, label: string) => {
    setEvaluationsDraft(current => ({
      ...current,
      [studentId]: {
        score,
        notes: current[studentId]?.notes || label,
      },
    }));
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // 1. Save attendance
      const attendanceRecords = attendanceRows.map(row => {
        const mark = localDraft[row.studentId] ?? { status: "PRESENT", lateMinutes: null };
        return {
          studentId: row.studentId,
          status: (mark.status === "UNMARKED" ? "PRESENT" : mark.status) as Exclude<AttendanceStatus, "UNMARKED">,
          lateMinutes: mark.status === "LATE" ? (mark.lateMinutes ?? 1) : null,
        };
      });
      await apiClient.upsertSessionAttendance(session.id, attendanceRecords);

      // 2. Save evaluations if not skipped
      if (!skipEvaluations && attendanceRows.length > 0) {
        const evalItems = attendanceRows.map(row => ({
          studentId: row.studentId,
          score: evaluationsDraft[row.studentId]?.score ?? 85,
          notes: evaluationsDraft[row.studentId]?.notes?.trim() || "تمت متابعة الحصة وإنجاز المهام.",
        }));
        await apiClient.saveSessionEvaluations(session.id, evalItems);
        // Also submit for review / publishing
        try {
          await apiClient.submitSessionEvaluations(session.id, attendanceRows.map(r => r.studentId));
        } catch {
          // If already submitted or error, ignore
        }
      }

      // 3. Complete session
      await apiClient.completeSession(session.id);

      toast.success("تم إتمام الجلسة وقفل الكشف واحتساب المستحقات بنجاح! 🚀");
      onCompleted();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إتمام الجلسة؛ يرجى مراجعة البيانات.");
      setSubmitting(false);
    }
  };

  return (
    <div className="r04-modal-overlay" onClick={onClose}>
      <div
        className="r04-modal-dialog r04-completion-dialog"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        <div className="r04-modal-header">
          <div>
            <h2>إتمام الجلسة وتوثيق مخرجات التدريب</h2>
            <p>
              {session.courseName ?? `جلسة ${session.sessionNumber}`} · خطوات إرشادية لقفل الكشف وتحديث المستحقات.
            </p>
          </div>
          <button type="button" className="r04-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="r04-wizard-steps">
          <div className={`r04-step-node ${step === 1 ? "active" : step > 1 ? "done" : ""}`}>
            <span className="node-num">1</span>
            <span className="node-title">كشف الحضور ({attendanceRows.length - localUnmarkedCount}/{attendanceRows.length})</span>
          </div>
          <div className="node-divider" />
          <div className={`r04-step-node ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>
            <span className="node-num">2</span>
            <span className="node-title">تقييمات الطلاب</span>
          </div>
          <div className="node-divider" />
          <div className={`r04-step-node ${step === 3 ? "active" : ""}`}>
            <span className="node-num">3</span>
            <span className="node-title">التأكيد واحتساب الرصيد</span>
          </div>
        </div>

        {error && (
          <div className="r04-inline-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="r04-completion-body">
          {step === 1 && (
            <div className="r04-completion-step-content">
              <div className="r04-step-intro">
                <h3>الخطوة 1: مراجعة كشف الحضور والغياب</h3>
                <p>تأكد من تسجيل حالة الحضور لكل طالب قبل الانتقال للتقييم.</p>
                {localUnmarkedCount > 0 ? (
                  <button
                    type="button"
                    className="r04-btn-quick"
                    onClick={handleMarkAllPresent}
                  >
                    <CheckCircle2 size={14} /> تحضير الطلاب المتبقين ({localUnmarkedCount}) كـ "حاضر"
                  </button>
                ) : (
                  <div className="r04-check-badge">
                    <CheckCircle2 size={16} /> تم رصد حالة جميع الطلاب ({attendanceRows.length}) بنجاح
                  </div>
                )}
              </div>

              <div className="r04-students-check-list">
                {attendanceRows.map(student => {
                  const mark = localDraft[student.studentId] ?? { status: "UNMARKED", lateMinutes: null };
                  return (
                    <div key={student.studentId} className="r04-student-check-row">
                      <div className="student-info">
                        <strong>{student.studentName}</strong>
                      </div>
                      <div className="student-actions">
                        <select
                          aria-label={`حالة حضور ${student.studentName}`}
                          value={mark.status}
                          onChange={e =>
                            setLocalDraft(cur => ({
                              ...cur,
                              [student.studentId]: {
                                status: e.target.value as AttendanceStatus,
                                lateMinutes: e.target.value === "LATE" ? 10 : null,
                              },
                            }))
                          }
                        >
                          <option value="UNMARKED">لم يسجل</option>
                          <option value="PRESENT">حاضر</option>
                          <option value="LATE">متأخر</option>
                          <option value="ABSENT">غائب</option>
                          <option value="EXCUSED">بعذر</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="r04-completion-step-content">
              <div className="r04-step-intro">
                <h3>الخطوة 2: رصد التقييمات الفردية لكل طالب</h3>
                <p>
                  التقييمات تنعكس مباشرة في بوابات أولياء الأمور والطلاب بعد الاعتماد وتعزز رضا المشتركين.
                </p>
                <label className="r04-checkbox-label">
                  <input
                    type="checkbox"
                    checked={skipEvaluations}
                    onChange={e => setSkipEvaluations(e.target.checked)}
                  />
                  <span>تخطي رصد التقييمات الآن ورصدها لاحقًا من تبويب التقييمات</span>
                </label>
              </div>

              {!skipEvaluations && (
                <div className="r04-evals-input-list">
                  {attendanceRows.map(student => {
                    const evalItem = evaluationsDraft[student.studentId] ?? {
                      score: 90,
                      notes: "مشاركة ممتازة",
                    };
                    return (
                      <div key={student.studentId} className="r04-eval-student-card">
                        <div className="eval-card-head">
                          <strong>{student.studentName}</strong>
                          <div className="quick-presets">
                            <button
                              type="button"
                              className={evalItem.score === 95 ? "active" : ""}
                              onClick={() => handleSetQuickScore(student.studentId, 95, "أداء استثنائي وتفاعل متميز.")}
                            >
                              ممتاز (95)
                            </button>
                            <button
                              type="button"
                              className={evalItem.score === 85 ? "active" : ""}
                              onClick={() => handleSetQuickScore(student.studentId, 85, "تفاعل جيد جدًا وإنجاز المهام المطلوبة.")}
                            >
                              جيد جدًا (85)
                            </button>
                            <button
                              type="button"
                              className={evalItem.score === 75 ? "active" : ""}
                              onClick={() => handleSetQuickScore(student.studentId, 75, "حضور جيد مع الحاجة للمزيد من التركيز بالأنشطة.")}
                            >
                              جيد (75)
                            </button>
                          </div>
                        </div>

                        <div className="eval-card-inputs">
                          <div className="score-input-wrap">
                            <label>الدرجة (من 100):</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={evalItem.score}
                              onChange={e =>
                                setEvaluationsDraft(cur => ({
                                  ...cur,
                                  [student.studentId]: {
                                    ...cur[student.studentId],
                                    score: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="note-input-wrap">
                            <label>ملاحظة تشجيعية لولي الأمر:</label>
                            <input
                              type="text"
                              value={evalItem.notes}
                              placeholder="أضف ملاحظة توجيهية أو تشجيعية..."
                              onChange={e =>
                                setEvaluationsDraft(cur => ({
                                  ...cur,
                                  [student.studentId]: {
                                    ...cur[student.studentId],
                                    notes: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="r04-completion-step-content step-summary">
              <div className="r04-summary-card">
                <div className="summary-icon">
                  <Sparkles size={32} />
                </div>
                <h3>جاهز لإتمام الجلسة وإقفال الكشف</h3>
                <p>
                  عند الضغط على "تأكيد الإتمام النهائي"، سيتم تحديث حالة الجلسة وإقفال الكشف وإضافة المستحقات.
                </p>

                <div className="r04-summary-grid">
                  <div className="grid-item">
                    <Users size={16} />
                    <span>إجمالي الطلاب المحضّرين:</span>
                    <strong>{attendanceRows.length} طالب</strong>
                  </div>
                  <div className="grid-item">
                    <Award size={16} />
                    <span>التقييمات المرفوعة:</span>
                    <strong>{skipEvaluations ? "مؤجلة" : `${attendanceRows.length} تقييم`}</strong>
                  </div>
                  <div className="grid-item highlight">
                    <Coins size={16} />
                    <span>المستحق المكتسب فورًا:</span>
                    <strong>+200 ج.م</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="r04-modal-footer">
          {step > 1 && (
            <button
              type="button"
              className="r04-btn-secondary"
              onClick={() => setStep((cur => (cur - 1) as 1 | 2))}
              disabled={submitting}
            >
              <ChevronRight size={14} /> السابق
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="r04-btn-primary"
              disabled={step === 1 && localUnmarkedCount > 0}
              onClick={() => setStep((cur => (cur + 1) as 2 | 3))}
            >
              التالي <ChevronLeft size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="r04-btn-finish"
              disabled={submitting}
              onClick={handleFinalSubmit}
            >
              {submitting ? "جارٍ إتمام الجلسة واحتساب المستحقات…" : "تأكيد الإتمام النهائي وقفل الكشف"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
