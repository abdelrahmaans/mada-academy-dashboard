import React from "react";
import { Check, Save } from "lucide-react";
import { LoadingState } from "@/components/FeedbackStates";
import type { AttendanceItem, SessionEvaluationRecord } from "@/lib/apiClient";
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
}: InstructorEvaluationsViewProps) {
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
