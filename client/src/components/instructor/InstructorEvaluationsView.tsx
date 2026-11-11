import React, { useEffect, useState } from "react";
import { Check, Save, Sparkles } from "lucide-react";
import { LoadingState } from "@/components/FeedbackStates";
import type {
  AttendanceItem,
  DisciplineRubric,
  SessionEvaluationRecord,
} from "@/lib/apiClient";
import { evaluationLabel } from "@/pages/InstructorDeskTypes";

export interface InstructorEvaluationsViewProps {
  evaluationLoading: boolean;
  evaluationError: string | null;
  attendanceRows: AttendanceItem[];
  evaluations: SessionEvaluationRecord[];
  selectedStudentId: string;
  selectedEvaluation?: SessionEvaluationRecord;
  score: number | "";
  notes: string;
  savingEvaluation: boolean;
  onSelectStudent: (studentId: string) => void;
  onScoreChange: (score: number | "") => void;
  onNotesChange: (notes: string) => void;
  onSaveEvaluation: (submitForReview: boolean) => void;
  activeRubric?: DisciplineRubric | null;
}

export function InstructorEvaluationsView({
  evaluationLoading,
  evaluationError,
  attendanceRows,
  evaluations,
  selectedStudentId,
  selectedEvaluation,
  score,
  notes,
  savingEvaluation,
  onSelectStudent,
  onScoreChange,
  onNotesChange,
  onSaveEvaluation,
  activeRubric,
}: InstructorEvaluationsViewProps) {
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!activeRubric?.criteria?.length) return;
    setCriterionScores(
      Object.fromEntries(activeRubric.criteria.map(c => [c.id || c.key, 4]))
    );
  }, [activeRubric?.id, selectedStudentId]);

  const applyRubricScore = () => {
    if (!activeRubric?.criteria?.length) return;
    const totalWeight = activeRubric.criteria.reduce((sum, c) => sum + (c.weightPercent || 0), 0);
    const weighted = activeRubric.criteria.reduce((acc, c) => {
      const val = criterionScores[c.id || c.key] ?? 4;
      const max = c.maxScore || activeRubric.scaleMax || 5;
      const ratio = Math.min(1, Math.max(0, val / max));
      const weight = totalWeight > 0 ? (c.weightPercent ?? 0) / totalWeight : 1 / activeRubric.criteria.length;
      return acc + ratio * weight * 100;
    }, 0);
    onScoreChange(Math.round(weighted));
  };
  if (evaluationLoading) {
    return <LoadingState label="جارٍ تحميل تقييمات الطلاب…" compact />;
  }

  if (evaluationError) {
    return (
      <section className="r04-live-alert" role="alert">
        <strong>تعذر تحميل التقييمات</strong>
        <p>{evaluationError}</p>
      </section>
    );
  }

  return (
    <div className="r04-live-evaluation-layout">
      <div className="r04-live-student-list">
        <h3>طلاب الجلسة</h3>
        {attendanceRows.map(student => {
          const evaluation = evaluations.find(
            item => item.studentId === student.studentId
          );
          return (
            <button
              type="button"
              key={student.studentId}
              className={
                student.studentId === selectedStudentId ? "selected" : ""
              }
              onClick={() => onSelectStudent(student.studentId)}
            >
              <span>{student.studentName.slice(0, 1)}</span>
              <strong>{student.studentName}</strong>
              <small>{evaluationLabel(evaluation?.status)}</small>
            </button>
          );
        })}
      </div>
      <div className="r04-live-evaluation-form">
        <h3>مسودة تقييم</h3>
        <p>
          تُحفظ المسودة خاصةً بالمدرب، ولا تظهر للأسرة إلا بعد مراجعة رئيس المدربين
          ونشرها.
        </p>
        {selectedEvaluation?.reviewNote && (
          <div className="r04-live-review-note">
            <strong>ملاحظة المراجع:</strong> {selectedEvaluation.reviewNote}
          </div>
        )}
        {activeRubric && activeRubric.criteria.length > 0 && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px",
              display: "grid",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div>
                <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>
                  معايير التقييم المعتمدة: {activeRubric.title}
                </strong>
                <small style={{ display: "block", color: "#64748b", fontSize: "11px" }}>
                  المسار: {activeRubric.trackLabel}
                </small>
              </div>
              <button
                type="button"
                className="r04-live-primary"
                style={{ padding: "5px 10px", fontSize: "11px", height: "auto" }}
                disabled={
                  selectedEvaluation?.status === "SUBMITTED" ||
                  selectedEvaluation?.status === "PUBLISHED"
                }
                onClick={applyRubricScore}
              >
                <Sparkles size={12} /> احتساب النتيجة تلقائيًا
              </button>
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              {activeRubric.criteria.map(c => {
                const key = c.id || c.key;
                const val = criterionScores[key] ?? 4;
                const max = c.maxScore || activeRubric.scaleMax || 5;
                return (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "12px",
                      background: "#ffffff",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span>
                      <strong>{c.label}</strong> ({c.weightPercent}%)
                      {c.hint && (
                        <small style={{ display: "block", color: "#64748b", fontSize: "10.5px" }}>
                          {c.hint}
                        </small>
                      )}
                    </span>
                    <select
                      style={{ width: "92px", padding: "4px 6px", fontSize: "12px" }}
                      value={val}
                      disabled={
                        selectedEvaluation?.status === "SUBMITTED" ||
                        selectedEvaluation?.status === "PUBLISHED"
                      }
                      onChange={e =>
                        setCriterionScores(prev => ({
                          ...prev,
                          [key]: Number(e.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: max }, (_, idx) => idx + 1).map(n => (
                        <option key={n} value={n}>
                          {n} / {max}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        <label>
          النتيجة من 100
          <input
            type="number"
            min="0"
            max="100"
            value={score}
            disabled={
              selectedEvaluation?.status === "SUBMITTED" ||
              selectedEvaluation?.status === "PUBLISHED"
            }
            onChange={event =>
              onScoreChange(
                event.target.value === ""
                  ? ""
                  : Math.max(0, Math.min(100, Number(event.target.value)))
              )
            }
          />
        </label>
        <label>
          ملاحظة بنّاءة
          <textarea
            rows={5}
            value={notes}
            disabled={
              selectedEvaluation?.status === "SUBMITTED" ||
              selectedEvaluation?.status === "PUBLISHED"
            }
            onChange={event => onNotesChange(event.target.value)}
            placeholder="اكتب ما أتقنه الطالب والخطوة التالية المقترحة…"
          />
        </label>
        <div className="r04-live-eval-state">
          الحالة: {evaluationLabel(selectedEvaluation?.status)}
        </div>
        <div className="r04-live-actions">
          <button
            type="button"
            className="r04-live-primary"
            disabled={
              savingEvaluation ||
              score === "" ||
              !notes.trim() ||
              selectedEvaluation?.status === "SUBMITTED" ||
              selectedEvaluation?.status === "PUBLISHED"
            }
            onClick={() => onSaveEvaluation(false)}
          >
            <Save size={14} /> حفظ المسودة
          </button>
          <button
            type="button"
            className="r04-live-complete"
            disabled={
              savingEvaluation ||
              score === "" ||
              !notes.trim() ||
              selectedEvaluation?.status === "SUBMITTED" ||
              selectedEvaluation?.status === "PUBLISHED"
            }
            onClick={() => onSaveEvaluation(true)}
          >
            <Check size={14} /> إرسال للمراجعة
          </button>
        </div>
        {evaluationError && (
          <p className="r04-live-inline-error" role="alert">
            {evaluationError}
          </p>
        )}
      </div>
    </div>
  );
}
