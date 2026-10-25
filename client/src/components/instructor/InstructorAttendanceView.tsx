import React from "react";
import { CheckCircle2, Clock3, Save, Users, UserMinus } from "lucide-react";
import type { AttendanceItem, SessionRecord } from "@/lib/apiClient";
import type { AttendanceDraft, AttendanceStatus } from "@/pages/InstructorDeskTypes";

export interface InstructorAttendanceViewProps {
  selectedSession: SessionRecord;
  isOwnSession: boolean;
  attendanceRows: AttendanceItem[];
  attendanceDraft: Record<string, AttendanceDraft>;
  counts: {
    present: number;
    late: number;
    absent: number;
    unmarked: number;
  };
  savingAttendance: boolean;
  completing: boolean;
  completionAllowed: boolean;
  completionError: string | null;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus) => void;
  onUpdateLateMinutes: (studentId: string, minutes: number) => void;
  onSaveAttendance: () => void;
  onCompleteSession: () => void;
  onRequestSubstitute?: () => void;
}

export function InstructorAttendanceView({
  selectedSession,
  isOwnSession,
  attendanceRows,
  attendanceDraft,
  counts,
  savingAttendance,
  completing,
  completionAllowed,
  completionError,
  onUpdateAttendance,
  onUpdateLateMinutes,
  onSaveAttendance,
  onCompleteSession,
  onRequestSubstitute,
}: InstructorAttendanceViewProps) {
  return (
    <>
      <div className="r04-live-attendance-summary">
        <span>
          <CheckCircle2 size={15} /> حاضر: {counts.present}
        </span>
        <span>
          <Clock3 size={15} /> متأخر: {counts.late}
        </span>
        <span>
          <Users size={15} /> غائب/بعذر: {counts.absent}
        </span>
        <span className={counts.unmarked ? "needs-action" : ""}>
          غير مسجل: {counts.unmarked}
        </span>
      </div>
      <div className="r04-live-table-wrap">
        <table className="r04-live-table">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>الحالة</th>
              <th>دقائق التأخير</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRows.map(student => {
              const mark = attendanceDraft[student.studentId] ?? {
                status: "UNMARKED" as const,
                lateMinutes: null,
              };
              return (
                <tr key={student.studentId}>
                  <td>
                    <strong>{student.studentName}</strong>
                  </td>
                  <td>
                    <select
                      aria-label={`حضور ${student.studentName}`}
                      value={mark.status}
                      disabled={
                        !isOwnSession ||
                        selectedSession.status === "COMPLETED" ||
                        selectedSession.status === "CANCELLED"
                      }
                      onChange={event =>
                        onUpdateAttendance(
                          student.studentId,
                          event.target.value as AttendanceStatus
                        )
                      }
                    >
                      <option value="UNMARKED">لم يسجل</option>
                      <option value="PRESENT">حاضر</option>
                      <option value="LATE">متأخر</option>
                      <option value="ABSENT">غائب</option>
                      <option value="EXCUSED">بعذر</option>
                    </select>
                  </td>
                  <td>
                    {mark.status === "LATE" ? (
                      <input
                        aria-label={`دقائق تأخير ${student.studentName}`}
                        type="number"
                        min="1"
                        value={mark.lateMinutes ?? 1}
                        disabled={
                          !isOwnSession ||
                          selectedSession.status === "COMPLETED" ||
                          selectedSession.status === "CANCELLED"
                        }
                        onChange={event =>
                          onUpdateLateMinutes(
                            student.studentId,
                            Math.max(1, Number(event.target.value) || 1)
                          )
                        }
                      />
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isOwnSession ? (
        <>
          <div className="r04-live-actions">
            <button
              type="button"
              className="r04-live-primary"
              onClick={onSaveAttendance}
              disabled={
                savingAttendance ||
                counts.unmarked > 0 ||
                selectedSession.status === "COMPLETED" ||
                selectedSession.status === "CANCELLED"
              }
            >
              <Save size={14} />{" "}
              {savingAttendance ? "جارٍ الحفظ…" : "حفظ الحضور"}
            </button>
            <button
              type="button"
              className="r04-live-complete"
              onClick={onCompleteSession}
              disabled={!completionAllowed || completing}
            >
              {completing ? "جارٍ الإتمام…" : "إتمام الجلسة (إرشادي)"}
            </button>
            {onRequestSubstitute && selectedSession.status === "SCHEDULED" && (
              <button
                type="button"
                className="r04-live-substitute-btn"
                onClick={onRequestSubstitute}
              >
                <UserMinus size={14} /> طلب اعتذار / بديل
              </button>
            )}
          </div>
          <p className="r04-live-helper">
            يتاح إتمام الجلسة بعد وقت انتهائها وبعد حفظ حالة كل طالب. عند الإتمام
            يُقفل كشف الحضور وتضاف المستحقات فورًا.
          </p>
          {completionError && (
            <p className="r04-live-inline-error" role="alert">
              {completionError}
            </p>
          )}
        </>
      ) : (
        <p className="r04-live-supervision-note">
          تكليفك لهذا الجروب يتيح قراءة الحضور فقط؛ لا يمكنك تعديل الحضور أو إتمام
          جلسات مدرب آخر.
        </p>
      )}
    </>
  );
}
