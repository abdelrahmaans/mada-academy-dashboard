import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Save,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { LoadingState } from "@/components/FeedbackStates";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type AttendanceItem,
  type SessionEvaluationRecord,
  type SessionRecord,
} from "@/lib/apiClient";
import "./InstructorDeskLive.css";

type View = "sessions" | "attendance" | "evaluations";
type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | "UNMARKED";
type AttendanceDraft = { status: AttendanceStatus; lateMinutes: number | null };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
function statusLabel(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: "مجدولة",
    IN_PROGRESS: "جارية",
    COMPLETED: "مكتملة",
    CANCELLED: "ملغاة",
    PENDING_APPROVAL: "بانتظار الاعتماد",
  };
  return labels[status] ?? status;
}
function attendanceLabel(status: AttendanceStatus) {
  const labels: Record<AttendanceStatus, string> = {
    PRESENT: "حاضر",
    LATE: "متأخر",
    ABSENT: "غائب",
    EXCUSED: "بعذر",
    UNMARKED: "لم يسجل",
  };
  return labels[status];
}
function evaluationLabel(status?: string) {
  if (status === "PUBLISHED") return "منشور للأسرة";
  if (status === "SUBMITTED") return "بانتظار مراجعة رئيس المدربين";
  if (status === "CHANGES_REQUESTED") return "مطلوب تعديل";
  return status === "DRAFT" ? "مسودة محفوظة" : "لم يُحفظ بعد";
}
function mapAttendance(items: AttendanceItem[]) {
  return Object.fromEntries(
    items.map(item => [
      item.studentId,
      {
        status: item.status as AttendanceStatus,
        lateMinutes: item.lateMinutes,
      },
    ])
  ) as Record<string, AttendanceDraft>;
}

export default function InstructorDeskLive() {
  const { me, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>("sessions");
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceRows, setAttendanceRows] = useState<AttendanceItem[]>([]);
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, AttendanceDraft>
  >({});
  const [evaluations, setEvaluations] = useState<SessionEvaluationRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [score, setScore] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!me?.branchId || me.role !== "R04_INSTRUCTOR") {
      setSessions([]);
      setSelectedSessionId("");
      setLoading(false);
      setError(
        "لا يوجد نطاق جلسات صالح لهذا الحساب؛ لم يتم عرض بيانات تجريبية."
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const to = new Date(
        now.getTime() + 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      const response = await apiClient.listSessions({ from, to });
      setSessions(response.items);
      setSelectedSessionId(current =>
        response.items.some(item => item.id === current)
          ? current
          : (response.items[0]?.id ?? "")
      );
    } catch (cause) {
      setSessions([]);
      setSelectedSessionId("");
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر تحميل الجلسات المسندة من الخادم."
      );
    } finally {
      setLoading(false);
    }
  }, [me?.branchId, me?.role]);

  useEffect(() => {
    if (!authLoading) void loadSessions();
  }, [authLoading, loadSessions]);

  const selectedSession =
    sessions.find(item => item.id === selectedSessionId) ?? null;

  useEffect(() => {
    if (!selectedSessionId) {
      setAttendanceRows([]);
      setAttendanceDraft({});
      setAttendanceDirty(false);
      setAttendanceError(null);
      return;
    }
    let cancelled = false;
    setAttendanceLoading(true);
    setAttendanceError(null);
    setCompletionError(null);
    setAttendanceRows([]);
    setAttendanceDraft({});
    setAttendanceDirty(false);
    setSelectedStudentId("");
    apiClient
      .getSessionAttendance(selectedSessionId)
      .then(response => {
        if (cancelled) return;
        setAttendanceRows(response.items);
        setAttendanceDraft(mapAttendance(response.items));
        setAttendanceDirty(false);
        setSelectedStudentId(current =>
          response.items.some(item => item.studentId === current)
            ? current
            : (response.items[0]?.studentId ?? "")
        );
      })
      .catch(cause => {
        if (!cancelled) {
          setAttendanceRows([]);
          setAttendanceDraft({});
          setAttendanceDirty(false);
          setAttendanceError(
            cause instanceof Error ? cause.message : "تعذر تحميل كشف الحضور."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId || view !== "evaluations") return;
    let cancelled = false;
    setEvaluationLoading(true);
    setEvaluationError(null);
    setEvaluations([]);
    apiClient
      .listSessionEvaluations(selectedSessionId)
      .then(response => {
        if (cancelled) return;
        setEvaluations(response.items);
      })
      .catch(cause => {
        if (!cancelled) {
          setEvaluations([]);
          setEvaluationError(
            cause instanceof Error ? cause.message : "تعذر تحميل التقييمات."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setEvaluationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, view]);

  const selectedEvaluation = evaluations.find(
    item => item.studentId === selectedStudentId
  );
  useEffect(() => {
    setScore(selectedEvaluation?.score ?? "");
    setNotes(selectedEvaluation?.notes ?? "");
  }, [
    selectedStudentId,
    selectedEvaluation?.score,
    selectedEvaluation?.notes,
    selectedSessionId,
  ]);

  const counts = useMemo(() => {
    const statuses = attendanceRows.map(
      item => attendanceDraft[item.studentId]?.status ?? "UNMARKED"
    );
    return {
      present: statuses.filter(item => item === "PRESENT").length,
      late: statuses.filter(item => item === "LATE").length,
      absent: statuses.filter(item => item === "ABSENT" || item === "EXCUSED")
        .length,
      unmarked: statuses.filter(item => item === "UNMARKED").length,
    };
  }, [attendanceDraft, attendanceRows]);
  const completionAllowed = Boolean(
    selectedSession &&
      (selectedSession.status === "SCHEDULED" ||
        selectedSession.status === "IN_PROGRESS") &&
      Date.parse(selectedSession.endAt) <= Date.now() &&
      attendanceRows.length > 0 &&
      counts.unmarked === 0 &&
      !attendanceDirty
  );
  const branch =
    me?.branches?.find(item => item.id === me.branchId)?.name ??
    "الجلسات المسندة";

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceDraft(current => ({
      ...current,
      [studentId]: {
        status,
        lateMinutes:
          status === "LATE" ? (current[studentId]?.lateMinutes ?? 1) : null,
      },
    }));
    setAttendanceDirty(true);
  };
  const saveAttendance = async () => {
    if (!selectedSession || attendanceRows.length === 0 || counts.unmarked > 0)
      return;
    setSavingAttendance(true);
    setAttendanceError(null);
    try {
      const records = attendanceRows.map(item => {
        const mark = attendanceDraft[item.studentId];
        return {
          studentId: item.studentId,
          status: mark.status as Exclude<AttendanceStatus, "UNMARKED">,
          lateMinutes: mark.status === "LATE" ? (mark.lateMinutes ?? 1) : null,
        };
      });
      const response = await apiClient.upsertSessionAttendance(
        selectedSession.id,
        records
      );
      setAttendanceRows(response.items);
      setAttendanceDraft(mapAttendance(response.items));
      setAttendanceDirty(false);
    } catch (cause) {
      setAttendanceError(
        cause instanceof Error ? cause.message : "تعذر حفظ الحضور."
      );
    } finally {
      setSavingAttendance(false);
    }
  };
  const completeSession = async () => {
    if (!selectedSession || !completionAllowed) return;
    setCompleting(true);
    setCompletionError(null);
    try {
      const response = await apiClient.completeSession(selectedSession.id);
      setSessions(current =>
        current.map(item =>
          item.id === response.sessionId
            ? {
                ...item,
                status: response.status,
                completedAt: response.completedAt,
              }
            : item
        )
      );
    } catch (cause) {
      setCompletionError(
        cause instanceof Error ? cause.message : "تعذر إتمام الجلسة."
      );
    } finally {
      setCompleting(false);
    }
  };
  const saveEvaluation = async (submit: boolean) => {
    if (!selectedSession || !selectedStudentId || score === "" || !notes.trim())
      return;
    setSavingEvaluation(true);
    setEvaluationError(null);
    try {
      await apiClient.saveSessionEvaluations(selectedSession.id, [
        { studentId: selectedStudentId, score, notes: notes.trim() },
      ]);
      if (submit)
        await apiClient.submitSessionEvaluations(selectedSession.id, [
          selectedStudentId,
        ]);
      const refreshed = await apiClient.listSessionEvaluations(
        selectedSession.id
      );
      setEvaluations(refreshed.items);
    } catch (cause) {
      setEvaluationError(
        cause instanceof Error
          ? cause.message
          : "تعذر حفظ التقييم أو إرساله للمراجعة."
      );
    } finally {
      setSavingEvaluation(false);
    }
  };

  if (authLoading) return <LoadingState label="جارٍ التحقق من حساب المدرب…" />;
  if (!me || me.role !== "R04_INSTRUCTOR")
    return (
      <main className="r04-live-page" dir="rtl">
        <section className="r04-live-alert" role="alert">
          <strong>هذه الصفحة مخصصة للمدرب.</strong>
          <p>لم يتم تحميل أو عرض بيانات تجريبية.</p>
        </section>
      </main>
    );

  return (
    <RoleDashboardShell
      className="r04-live-shell"
      roleCode="R04"
      roleLabel="المدرب"
      scopeLevel="assigned"
      scopeLabel="الجلسات والطلاب المسندون فقط"
      branchName={branch}
      tenantName={me.academy?.name}
    >
      <main className="r04-live-page" dir="rtl">
        <header className="r04-live-header">
          <div>
            <span className="r04-live-eyebrow">
              <span /> مساحة المدرب · LIVE
            </span>
            <h1>جلساتي وسير العمل</h1>
            <p>
              الجلسات والطلاب والتقييمات الفعلية المسندة إلى حسابك؛ لا تتضمن
              بيانات مالية.
            </p>
          </div>
          <button
            type="button"
            className="r04-live-refresh"
            onClick={() => void loadSessions()}
            disabled={loading}
          >
            <RefreshCw size={15} /> تحديث الجلسات
          </button>
        </header>
        <RoleScopeCard className="r04-live-scope" compact />
        <nav className="r04-live-tabs" aria-label="مساحة المدرب">
          <button
            type="button"
            className={view === "sessions" ? "active" : ""}
            onClick={() => setView("sessions")}
          >
            <CalendarDays size={15} /> حصصي
          </button>
          <button
            type="button"
            className={view === "attendance" ? "active" : ""}
            onClick={() => setView("attendance")}
          >
            <CalendarCheck size={15} /> الحضور <b>{counts.unmarked}</b>
          </button>
          <button
            type="button"
            className={view === "evaluations" ? "active" : ""}
            onClick={() => setView("evaluations")}
          >
            <Star size={15} /> التقييمات <b>{evaluations.length}</b>
          </button>
        </nav>
        {loading && (
          <LoadingState label="جارٍ تحميل الجلسات المسندة…" compact />
        )}
        {!loading && error && (
          <section className="r04-live-alert" role="alert">
            <strong>تعذر تحميل مساحة المدرب الحية</strong>
            <p>{error} لم يتم استبدال بيانات الخادم ببيانات توضيحية.</p>
            <button type="button" onClick={() => void loadSessions()}>
              إعادة المحاولة
            </button>
          </section>
        )}
        {!loading && !error && sessions.length === 0 && (
          <section className="r04-live-panel">
            <div className="r04-live-empty">
              <CalendarDays size={24} />
              <strong>لا توجد جلسات مسندة إليك في هذه الفترة.</strong>
              <span>
                يتم تحديد نطاق الجلسات من الخادم بناءً على حساب المدرب.
              </span>
            </div>
          </section>
        )}
        {!loading && !error && sessions.length > 0 && view === "sessions" && (
          <section className="r04-live-panel">
            <div className="r04-live-panel-head">
              <div>
                <h2>الجلسات المسندة</h2>
                <p>{sessions.length} جلسة ضمن آخر 30 يومًا والقادم 60 يومًا.</p>
              </div>
            </div>
            <div className="r04-live-session-list">
              {sessions.map(session => (
                <button
                  type="button"
                  className={`r04-live-session ${session.id === selectedSessionId ? "selected" : ""}`}
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <span className="r04-live-session-icon">
                    <CalendarCheck size={17} />
                  </span>
                  <span className="r04-live-session-main">
                    <strong>
                      {session.courseName ?? `جلسة ${session.sessionNumber}`}
                    </strong>
                    <small>
                      {session.branchName ?? branch} ·{" "}
                      {session.classroomName ?? "قاعة غير محددة"}
                    </small>
                    <small>
                      {formatDate(session.startAt)} ·{" "}
                      {formatTime(session.startAt)}–{formatTime(session.endAt)}
                    </small>
                  </span>
                  <span
                    className={`r04-live-status ${session.status === "COMPLETED" ? "completed" : ""}`}
                  >
                    {statusLabel(session.status)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
        {!loading &&
          !error &&
          sessions.length > 0 &&
          (view === "attendance" || view === "evaluations") &&
          selectedSession && (
            <section className="r04-live-panel">
              <div className="r04-live-panel-head r04-live-detail-head">
                <div>
                  <h2>
                    {selectedSession.courseName ??
                      `جلسة ${selectedSession.sessionNumber}`}
                  </h2>
                  <p>
                    {selectedSession.branchName ?? branch} ·{" "}
                    {formatDate(selectedSession.startAt)} ·{" "}
                    {formatTime(selectedSession.startAt)}–
                    {formatTime(selectedSession.endAt)}
                  </p>
                </div>
                <label className="r04-live-select">
                  <span>اختيار الجلسة</span>
                  <select
                    value={selectedSessionId}
                    onChange={event => setSelectedSessionId(event.target.value)}
                  >
                    {sessions.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.courseName ?? `جلسة ${item.sessionNumber}`} ·{" "}
                        {formatDate(item.startAt)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {attendanceLoading && (
                <LoadingState
                  label="جارٍ تحميل كشف الطلاب من الخادم…"
                  compact
                />
              )}
              {attendanceError && (
                <section className="r04-live-alert" role="alert">
                  <strong>تعذر تحميل أو حفظ بيانات الحضور</strong>
                  <p>{attendanceError} لم يتم عرض قائمة طلاب تجريبية.</p>
                </section>
              )}
              {!attendanceLoading &&
                !attendanceError &&
                attendanceRows.length === 0 && (
                  <div className="r04-live-empty">
                    <Users size={22} />
                    <strong>لا يوجد طلاب مسجلون في هذه الجلسة.</strong>
                    <span>
                      لا يمكن حفظ الحضور أو إتمام جلسة بلا قائمة طلاب حية.
                    </span>
                  </div>
                )}
              {!attendanceLoading &&
                !attendanceError &&
                attendanceRows.length > 0 &&
                view === "attendance" && (
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
                                      selectedSession.status === "COMPLETED" ||
                                      selectedSession.status === "CANCELLED"
                                    }
                                    onChange={event =>
                                      updateAttendance(
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
                                        selectedSession.status ===
                                          "COMPLETED" ||
                                        selectedSession.status === "CANCELLED"
                                      }
                                      onChange={event => {
                                        setAttendanceDirty(true);
                                        setAttendanceDraft(current => ({
                                          ...current,
                                          [student.studentId]: {
                                            ...current[student.studentId],
                                            lateMinutes: Math.max(
                                              1,
                                              Number(event.target.value) || 1
                                            ),
                                          },
                                        }));
                                      }}
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
                    <div className="r04-live-actions">
                      <button
                        type="button"
                        className="r04-live-primary"
                        onClick={() => void saveAttendance()}
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
                        onClick={() => void completeSession()}
                        disabled={!completionAllowed || completing}
                      >
                        {completing ? "جارٍ الإتمام…" : "إتمام الجلسة"}
                      </button>
                    </div>
                    <p className="r04-live-helper">
                      يتاح إتمام الجلسة بعد وقت انتهائها وبعد حفظ حالة كل طالب.
                      عند الإتمام يُقفل كشف الحضور.
                    </p>
                    {completionError && (
                      <p className="r04-live-inline-error" role="alert">
                        {completionError}
                      </p>
                    )}
                  </>
                )}
              {!attendanceLoading &&
                !attendanceError &&
                attendanceRows.length > 0 &&
                view === "evaluations" && (
                  <>
                    {evaluationLoading && (
                      <LoadingState
                        label="جارٍ تحميل تقييمات الطلاب…"
                        compact
                      />
                    )}
                    {evaluationError && (
                      <section className="r04-live-alert" role="alert">
                        <strong>تعذر تحميل التقييمات</strong>
                        <p>{evaluationError}</p>
                      </section>
                    )}
                    {!evaluationLoading && !evaluationError && (
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
                                  student.studentId === selectedStudentId
                                    ? "selected"
                                    : ""
                                }
                                onClick={() =>
                                  setSelectedStudentId(student.studentId)
                                }
                              >
                                <span>{student.studentName.slice(0, 1)}</span>
                                <strong>{student.studentName}</strong>
                                <small>
                                  {evaluationLabel(evaluation?.status)}
                                </small>
                              </button>
                            );
                          })}
                        </div>
                        <div className="r04-live-evaluation-form">
                          <h3>مسودة تقييم</h3>
                          <p>
                            تُحفظ المسودة خاصةً بالمدرب، ولا تظهر للأسرة إلا بعد
                            مراجعة رئيس المدربين ونشرها.
                          </p>
                          {selectedEvaluation?.reviewNote && (
                            <div className="r04-live-review-note">
                              <strong>ملاحظة المراجع:</strong>{" "}
                              {selectedEvaluation.reviewNote}
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
                                setScore(
                                  event.target.value === ""
                                    ? ""
                                    : Math.max(
                                        0,
                                        Math.min(
                                          100,
                                          Number(event.target.value)
                                        )
                                      )
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
                              onChange={event => setNotes(event.target.value)}
                              placeholder="اكتب ما أتقنه الطالب والخطوة التالية المقترحة…"
                            />
                          </label>
                          <div className="r04-live-eval-state">
                            الحالة:{" "}
                            {evaluationLabel(selectedEvaluation?.status)}
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
                              onClick={() => void saveEvaluation(false)}
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
                              onClick={() => void saveEvaluation(true)}
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
                    )}
                  </>
                )}
            </section>
          )}
        <p className="r04-live-footnote">
          <ShieldCheck size={15} /> النطاق يأتي من الخادم: الجلسات المسندة إلى
          حسابك فقط. لا تُعرض بيانات معاينة أو أسعار في هذا العرض.
        </p>
      </main>
    </RoleDashboardShell>
  );
}
