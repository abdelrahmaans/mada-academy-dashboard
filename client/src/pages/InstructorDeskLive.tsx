import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  RefreshCw,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { LoadingState } from "@/components/FeedbackStates";
import EvaluationReviewQueue from "@/components/EvaluationReviewQueue";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { InstructorSessionsView } from "@/components/instructor/InstructorSessionsView";
import { InstructorSupervisionView } from "@/components/instructor/InstructorSupervisionView";
import { InstructorAttendanceView } from "@/components/instructor/InstructorAttendanceView";
import { InstructorEvaluationsView } from "@/components/instructor/InstructorEvaluationsView";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type AttendanceItem,
  type MySupervisionGroup,
  type SessionEvaluationRecord,
  type SessionRecord,
  type MyInstructorEarnings,
} from "@/lib/apiClient";
import { InstructorEarningsCard } from "@/components/instructor/InstructorEarningsCard";
import { GuidedSessionCompletionModal } from "@/components/instructor/GuidedSessionCompletionModal";
import { SubstitutionRequestModal } from "@/components/instructor/SubstitutionRequestModal";
import "./InstructorDeskLive.css";

import {
  type InstructorView,
  type AttendanceStatus,
  type AttendanceDraft,
  formatDate,
  formatTime,
  evaluationLabel,
  mapAttendance,
} from "./InstructorDeskTypes";

export type {
  InstructorView,
  AttendanceStatus,
  AttendanceDraft,
};

export {
  formatDate,
  formatTime,
  evaluationLabel,
  mapAttendance,
};

type View = InstructorView;

export default function InstructorDeskLive() {
  const { me, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>("sessions");
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [supervisionGroups, setSupervisionGroups] = useState<MySupervisionGroup[]>([]);
  const [supervisionError, setSupervisionError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceRows, setAttendanceRows] = useState<AttendanceItem[]>([]);
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, AttendanceDraft>
  >({});
  const [attendanceRetryKey, setAttendanceRetryKey] = useState(0);
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
  const [earnings, setEarnings] = useState<MyInstructorEarnings | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);

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
      const [sessionsResult, supervisionResult, earningsResult] = await Promise.allSettled([
        apiClient.listSessions({ from, to }),
        apiClient.mySupervisionGroups(),
        apiClient.myInstructorEarnings(),
      ]);
      if (earningsResult.status === "fulfilled") {
        setEarnings(earningsResult.value);
        setEarningsLoading(false);
      }
      if (supervisionResult.status === "fulfilled") {
        setSupervisionGroups(supervisionResult.value.items);
        setSupervisionError(null);
        if (!supervisionResult.value.items.some(item => item.canReadEvaluations || item.canDecideEvaluations)) {
          setView(current => current === "review" ? "sessions" : current);
        }
      } else {
        setSupervisionGroups([]);
        setSupervisionError(supervisionResult.reason instanceof Error ? supervisionResult.reason.message : "تعذر تحميل تكليفات متابعة الجروبات.");
      }
      if (sessionsResult.status === "rejected") throw sessionsResult.reason;
      const response = sessionsResult.value;
      setSessions(response.items);
      setSelectedSessionId(current =>
        response.items.some(item => item.id === current)
          ? current
          : (response.items[0]?.id ?? "")
      );
    } catch (cause) {
      setSessions([]);
      setSelectedSessionId("");
      setSupervisionGroups([]);
      setSupervisionError(null);
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
  const isOwnSession = Boolean(selectedSession && me && (selectedSession.instructorId === me.id || selectedSession.substituteInstructorId === me.id));
  const canReadAssignedEvaluations = supervisionGroups.some(item => item.canReadEvaluations || item.canDecideEvaluations);

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
  }, [selectedSessionId, attendanceRetryKey]);

  useEffect(() => {
    if (!selectedSessionId || view !== "evaluations" || !isOwnSession) {
      setEvaluations([]);
      setEvaluationError(null);
      setEvaluationLoading(false);
      return;
    }
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
  }, [selectedSessionId, view, isOwnSession]);

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
      demo={false}
      branchName={branch}
      tenantName={me.academy?.name}
    >
      <main className="r04-live-page" dir="rtl">
        <header className="r04-live-header">
          <div>
            <span className="r04-live-eyebrow">
              <span /> مساحة المدرب
            </span>
            <h1>جلساتي وسير العمل</h1>
            <p>
              حصصك، إضافةً إلى جروبات المتابعة التي فوّضك مدير الفرع بها؛ تظل
              الكتابة مقتصرة على حصصك المسندة مباشرةً.
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
        <InstructorEarningsCard
          earnings={earnings}
          loading={earningsLoading}
          onRefresh={() => void loadSessions()}
        />
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
            disabled={!isOwnSession}
            onClick={() => setView("evaluations")}
          >
            <Star size={15} /> التقييمات <b>{evaluations.length}</b>
          </button>
          <button
            type="button"
            className={view === "supervision" ? "active" : ""}
            onClick={() => setView("supervision")}
          >
            <Users size={15} /> مجموعات أتابعها <b>{supervisionGroups.length}</b>
          </button>
          {canReadAssignedEvaluations && (
            <button
              type="button"
              className={view === "review" ? "active" : ""}
              onClick={() => setView("review")}
            >
              <ShieldCheck size={15} /> مراجعة التقييمات
            </button>
          )}
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
        {!loading && !error && sessions.length === 0 && (view === "sessions" || view === "attendance" || view === "evaluations") && (
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
          <InstructorSessionsView
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            branch={branch}
            currentUserId={me?.id}
          />
        )}
        {!loading && !error && view === "supervision" && (
          <InstructorSupervisionView
            supervisionGroups={supervisionGroups}
            supervisionError={supervisionError}
            sessions={sessions}
            onRetry={() => void loadSessions()}
            onViewAttendance={(sessionId) => {
              setSelectedSessionId(sessionId);
              setView("attendance");
            }}
          />
        )}
        {!loading && !error && view === "review" && canReadAssignedEvaluations && (
          <EvaluationReviewQueue />
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
                  {!isOwnSession && (
                    <p className="r04-live-supervision-label">
                      جروب متابعة مفوض · عرض دون تعديل
                    </p>
                  )}
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
                  <button
                    type="button"
                    onClick={() => setAttendanceRetryKey(value => value + 1)}
                  >
                    إعادة المحاولة
                  </button>
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
                  <InstructorAttendanceView
                    selectedSession={selectedSession}
                    isOwnSession={isOwnSession}
                    attendanceRows={attendanceRows}
                    attendanceDraft={attendanceDraft}
                    counts={counts}
                    savingAttendance={savingAttendance}
                    completing={completing}
                    completionAllowed={completionAllowed}
                    completionError={completionError}
                    onUpdateAttendance={updateAttendance}
                    onUpdateLateMinutes={(studentId, minutes) => {
                      setAttendanceDirty(true);
                      setAttendanceDraft(current => ({
                        ...current,
                        [studentId]: {
                          ...current[studentId],
                          lateMinutes: minutes,
                        },
                      }));
                    }}
                    onSaveAttendance={() => void saveAttendance()}
                    onCompleteSession={() => setCompletionModalOpen(true)}
                    onRequestSubstitute={() => setSubstituteModalOpen(true)}
                  />
                )}
              {!attendanceLoading &&
                !attendanceError &&
                attendanceRows.length > 0 &&
                view === "evaluations" &&
                isOwnSession && (
                  <InstructorEvaluationsView
                    evaluationLoading={evaluationLoading}
                    evaluationError={evaluationError}
                    attendanceRows={attendanceRows}
                    evaluations={evaluations}
                    selectedStudentId={selectedStudentId}
                    selectedEvaluation={selectedEvaluation}
                    score={score}
                    notes={notes}
                    savingEvaluation={savingEvaluation}
                    onSelectStudent={setSelectedStudentId}
                    onScoreChange={setScore}
                    onNotesChange={setNotes}
                    onSaveEvaluation={(submit) => void saveEvaluation(submit)}
                  />
                )}
            </section>
          )}
        <p className="r04-live-footnote">
          <ShieldCheck size={15} /> النطاق يأتي من الخادم: حصصك والجروبات المفوضة
          لحسابك فقط؛ صلاحيات الكتابة والاعتماد تخضع للتكليف والصلاحيات الخلفية.
        </p>

        {completionModalOpen && selectedSession && (
          <GuidedSessionCompletionModal
            session={selectedSession}
            attendanceRows={attendanceRows}
            attendanceDraft={attendanceDraft}
            counts={counts}
            onClose={() => setCompletionModalOpen(false)}
            onCompleted={() => {
              void loadSessions();
            }}
          />
        )}

        {substituteModalOpen && selectedSession && (
          <SubstitutionRequestModal
            session={selectedSession}
            onClose={() => setSubstituteModalOpen(false)}
            onSuccess={() => {
              void loadSessions();
            }}
          />
        )}
      </main>
    </RoleDashboardShell>
  );
}
