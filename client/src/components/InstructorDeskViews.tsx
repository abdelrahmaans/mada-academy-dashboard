import { type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MessageCircle,
  Save,
  Search,
  ShieldCheck,
  Star,
  Target,
  Users,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { type SessionEvaluationStatus } from "@/lib/apiClient";

type AttendanceStatus = "unmarked" | "present" | "absent" | "late" | "excused";
type SessionStatus = "live" | "upcoming" | "completed";
type Student = {
  id: string;
  name: string;
  initials: string;
  age: number;
  parent: string;
};
type Session = {
  id: string;
  branchId?: string;
  branchName?: string;
  title: string;
  level: string;
  day: string;
  time: string;
  room: string;
  status: SessionStatus;
  students: Student[];
  startAt?: string;
  endAt?: string;
};
type Evaluation = {
  scores: Record<string, number>;
  comment: string;
  saved: boolean;
  status: SessionEvaluationStatus;
  reviewNote: string | null;
};
const SESSION_STATUS: Record<SessionStatus, string> = {
  live: "جارية الآن",
  upcoming: "قادمة",
  completed: "مكتملة",
};
const RUBRIC = [
  {
    id: "understanding",
    label: "استيعاب الفكرة",
    hint: "المفاهيم والخطوات الأساسية",
  },
  {
    id: "practice",
    label: "التطبيق العملي",
    hint: "تنفيذ المهمة واستخدام الأدوات",
  },
  {
    id: "collaboration",
    label: "التعاون والمبادرة",
    hint: "المشاركة والتعاون مع الزملاء",
  },
];
function evaluationStatusLabel(status: SessionEvaluationStatus) {
  return status === "PUBLISHED"
    ? "منشور"
    : status === "SUBMITTED"
      ? "قيد المراجعة"
      : status === "CHANGES_REQUESTED"
        ? "مطلوب تعديل"
        : "مسودة";
}

export function TodayView({
  sessions,
  selectedId,
  onOpen,
  onAttendance,
  onEvaluation,
  onRequestSubstitution,
  attendanceUnmarked,
}: {
  sessions: Session[];
  selectedId: string;
  onOpen: (id: string) => void;
  onAttendance: () => void;
  onEvaluation: () => void;
  onRequestSubstitution: (id: string) => void;
  attendanceUnmarked: number;
}) {
  return (
    <>
      <section className="instructor-desk-kpis">
        <Kpi
          icon={<CalendarCheck size={16} />}
          label="جلسة جارية"
          value={sessions.filter(item => item.status === "live").length}
          hint="تحتاج تركيزك الآن"
          tone="teal"
        />
        <Kpi
          icon={<Users size={16} />}
          label="طلاب اليوم"
          value={sessions
            .slice(0, 3)
            .reduce((sum, item) => sum + item.students.length, 0)}
          hint="في جلساتك المسندة"
          tone="blue"
        />
        <Kpi
          icon={<AlertCircle size={16} />}
          label="حضور غير مكتمل"
          value={attendanceUnmarked}
          hint="في الجلسة الجارية"
          tone="amber"
        />
        <Kpi
          icon={<Star size={16} />}
          label="خطوة تالية"
          value="تقييم"
          hint="بعد تأكيد الحضور"
          tone="violet"
        />
      </section>
      <section className="instructor-desk-panel">
        <PanelTitle
          icon={<CalendarDays size={16} />}
          title="جلساتك"
          action={
            <span className="instructor-desk-context">
              <ShieldCheck size={13} /> جلسات مسندة فقط
            </span>
          }
        />
        <div className="desk-session-list">
          {sessions.map(session => (
            <article
              className={`desk-session-card ${session.status} ${session.id === selectedId ? "selected" : ""}`}
              key={session.id}
            >
              <div className="desk-session-time">
                <strong>{session.time.split(" – ")[0]}</strong>
                <small>{session.time.split(" – ")[1]}</small>
              </div>
              <div className="desk-session-main">
                <div>
                  <StatusBadge
                    status={
                      session.status === "live"
                        ? "success"
                        : session.status === "completed"
                          ? "info"
                          : "warning"
                    }
                    label={SESSION_STATUS[session.status]}
                  />
                  <small>{session.day}</small>
                </div>
                <h3>{session.title}</h3>
                <p>
                  {session.level} · {session.room}
                </p>
                <span>
                  <Users size={12} /> {session.students.length} طلاب
                </span>
              </div>
              <div className="desk-session-actions">
                <button
                  className="desk-secondary-action"
                  onClick={() => onRequestSubstitution(session.id)}
                >
                  طلب بديل
                </button>
                <button
                  className={
                    session.status === "live"
                      ? "desk-primary-action"
                      : "desk-secondary-action"
                  }
                  onClick={() => onOpen(session.id)}
                >
                  {session.status === "completed"
                    ? "فتح التفاصيل"
                    : "فتح الجلسة"}
                  <ChevronLeft size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="instructor-desk-next">
        <div>
          <span className="desk-next-icon">
            <Target size={17} />
          </span>
          <div>
            <strong>التدفق المقترح للحصة</strong>
            <small>سجّل الحضور أولًا، ثم أضف التقييم قبل إغلاق الجلسة.</small>
          </div>
        </div>
        <div>
          <button className="desk-secondary-action" onClick={onAttendance}>
            <CalendarCheck size={14} /> تسجيل الحضور
          </button>
          <button className="desk-primary-action" onClick={onEvaluation}>
            <Star size={14} /> إضافة تقييم
          </button>
        </div>
      </section>
    </>
  );
}
export function AttendanceView({
  session,
  sessions,
  selectedId,
  onSession,
  students,
  query,
  setQuery,
  attendance,
  onStatus,
  stats,
  saved,
  onSubmit,
  onNext,
}: {
  session: Session;
  sessions: Session[];
  selectedId: string;
  onSession: (id: string) => void;
  students: Student[];
  query: string;
  setQuery: (value: string) => void;
  attendance: Record<string, AttendanceStatus>;
  onStatus: (id: string, status: AttendanceStatus) => void;
  stats: { present: number; late: number; absent: number; unmarked: number };
  saved: boolean;
  onSubmit: (event: FormEvent) => void;
  onNext: () => void;
}) {
  return (
    <>
      <section className="desk-session-picker">
        <label>
          <span>الجلسة المختارة</span>
          <select
            value={selectedId}
            onChange={event => onSession(event.target.value)}
          >
            {sessions.map(item => (
              <option key={item.id} value={item.id}>
                {item.day} · {item.time} · {item.title}
              </option>
            ))}
          </select>
        </label>
        <div>
          <StatusBadge
            status={session.status === "live" ? "success" : "info"}
            label={SESSION_STATUS[session.status]}
          />
          <small>
            {session.room} · {session.students.length} طلاب
          </small>
        </div>
      </section>
      <section className="instructor-desk-kpis attendance-kpis">
        <Kpi
          icon={<CheckCircle2 size={16} />}
          label="حاضر"
          value={stats.present}
          hint="تسجيل مكتمل"
          tone="teal"
        />
        <Kpi
          icon={<Clock3 size={16} />}
          label="متأخر"
          value={stats.late}
          hint="يمكن إضافة الدقائق"
          tone="blue"
        />
        <Kpi
          icon={<AlertCircle size={16} />}
          label="غائب/بعذر"
          value={stats.absent}
          hint="يظهر في ملخص الجلسة"
          tone="amber"
        />
        <Kpi
          icon={<Users size={16} />}
          label="بدون حالة"
          value={stats.unmarked}
          hint="مطلوب قبل التأكيد"
          tone="violet"
        />
      </section>
      <form
        className="instructor-desk-panel attendance-desk-panel"
        onSubmit={onSubmit}
      >
        <PanelTitle
          icon={<CalendarCheck size={16} />}
          title="كشف الحضور"
          action={
            <label className="desk-search">
              <Search size={13} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="ابحث عن طالب..."
              />
            </label>
          }
        />
        <div className="attendance-desk-table-wrap">
          <table className="attendance-desk-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الحالة</th>
                <th>ملاحظة التشغيل</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const status = attendance[student.id] ?? "unmarked";
                return (
                  <tr key={student.id}>
                    <td>
                      <span className="desk-student">
                        <i>{student.initials}</i>
                        <span>
                          <strong>{student.name}</strong>
                          <small>
                            {student.age} سنة · {student.id}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <select
                        className={`desk-attendance-select ${status}`}
                        value={status}
                        aria-label={`حالة ${student.name}`}
                        onChange={event =>
                          onStatus(
                            student.id,
                            event.target.value as AttendanceStatus
                          )
                        }
                      >
                        <option value="unmarked">لم يسجل</option>
                        <option value="present">حاضر</option>
                        <option value="late">متأخر</option>
                        <option value="absent">غائب</option>
                        <option value="excused">بعذر</option>
                      </select>
                    </td>
                    <td>
                      <span className="desk-muted">
                        {status === "unmarked"
                          ? "بانتظار تسجيلك"
                          : status === "late"
                            ? "أضف دقائق التأخير عند الحاجة"
                            : status === "present"
                              ? "حضور مسجل"
                              : "سيظهر في ملخص الجلسة"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="desk-form-footer">
          <span>
            {saved ? (
              <>
                <CheckCircle2 size={14} /> تم حفظ الحضور ويمكن البدء بالتقييم
              </>
            ) : (
              <>
                <ShieldCheck size={14} /> لن يتم التأكيد قبل اكتمال كل الحالات
              </>
            )}
          </span>
          <div>
            <button
              className="desk-primary-action"
              type="submit"
              disabled={stats.unmarked > 0 && !saved}
            >
              <Save size={14} />{" "}
              {saved ? "تم تأكيد الحضور" : "حفظ وتأكيد الحضور"}
            </button>
            {saved && (
              <button
                type="button"
                className="desk-secondary-action"
                onClick={onNext}
              >
                <Star size={14} /> ابدأ التقييمات
              </button>
            )}
          </div>
        </div>
        {stats.unmarked > 0 && !saved && (
          <p className="desk-validation">
            <AlertCircle size={14} /> سجّل حالة {stats.unmarked} طالب قبل تأكيد
            الحضور.
          </p>
        )}
      </form>
    </>
  );
}
export function EvaluationView({
  session,
  sessions,
  selectedId,
  onSession,
  students,
  selectedStudent,
  selectedStudentId,
  selectedEvaluation,
  onStudent,
  evaluations,
  scores,
  setScores,
  comment,
  setComment,
  onSubmit,
  onSubmitForReview,
}: {
  session: Session;
  sessions: Session[];
  selectedId: string;
  onSession: (id: string) => void;
  students: Student[];
  selectedStudent: Student;
  selectedStudentId: string;
  selectedEvaluation?: Evaluation;
  onStudent: (id: string) => void;
  evaluations: Record<string, Evaluation>;
  scores: Record<string, number>;
  setScores: (value: Record<string, number>) => void;
  comment: string;
  setComment: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onSubmitForReview: () => void;
}) {
  const locked =
    selectedEvaluation?.status === "SUBMITTED" ||
    selectedEvaluation?.status === "PUBLISHED";
  return (
    <>
      <section className="desk-session-picker">
        <label>
          <span>الجلسة</span>
          <select
            value={selectedId}
            onChange={event => onSession(event.target.value)}
          >
            {sessions.map(item => (
              <option key={item.id} value={item.id}>
                {item.day} · {item.title}
              </option>
            ))}
          </select>
        </label>
        <div>
          <BookOpen size={14} />
          <small>{session.level} · التقييم بعد الحضور</small>
        </div>
      </section>
      <div className="evaluation-desk-layout">
        <section className="instructor-desk-panel evaluation-students">
          <PanelTitle
            icon={<Users size={16} />}
            title="طلاب الجلسة"
            action={<span>{students.length} طلاب</span>}
          />
          <div className="desk-student-list">
            {students.map(student => {
              const evaluation = evaluations[`${session.id}:${student.id}`];
              return (
                <button
                  className={student.id === selectedStudentId ? "selected" : ""}
                  key={student.id}
                  onClick={() => onStudent(student.id)}
                >
                  <i>{student.initials}</i>
                  <span>
                    <strong>{student.name}</strong>
                    <small>
                      {evaluation
                        ? evaluationStatusLabel(evaluation.status)
                        : `${student.age} سنة`}
                    </small>
                  </span>
                  {evaluation ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <span className="pending-dot" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
        <form
          className="instructor-desk-panel evaluation-desk-form"
          onSubmit={onSubmit}
        >
          <PanelTitle
            icon={<Star size={16} />}
            title="بطاقة تقييم الطالب"
            action={
              <span className="instructor-desk-context">
                <ShieldCheck size={13} />{" "}
                {selectedEvaluation
                  ? evaluationStatusLabel(selectedEvaluation.status)
                  : "مسودة جديدة"}
              </span>
            }
          />
          <div className="evaluation-selected-student">
            <i>{selectedStudent.initials}</i>
            <div>
              <strong>{selectedStudent.name}</strong>
              <small>
                {selectedStudent.parent} · {session.title}
              </small>
            </div>
          </div>
          {selectedEvaluation?.reviewNote && (
            <div className="desk-validation">
              <AlertCircle size={14} /> ملاحظة المراجع:{" "}
              {selectedEvaluation.reviewNote}
            </div>
          )}
          <div className="desk-rubric-list">
            {RUBRIC.map(item => (
              <label key={item.id}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
                <select
                  disabled={locked}
                  value={scores[item.id] ?? 4}
                  onChange={event =>
                    setScores({
                      ...scores,
                      [item.id]: Number(event.target.value),
                    })
                  }
                >
                  <option value="1">1 · يحتاج دعم</option>
                  <option value="2">2 · بداية</option>
                  <option value="3">3 · جيد</option>
                  <option value="4">4 · متقدم</option>
                  <option value="5">5 · ممتاز</option>
                </select>
              </label>
            ))}
          </div>
          <label className="desk-comment">
            <span>ملاحظة بنّاءة</span>
            <textarea
              disabled={locked}
              value={comment}
              onChange={event => setComment(event.target.value)}
              placeholder="ما الذي أتقنه الطالب؟ وما الخطوة التالية؟"
              rows={4}
            />
          </label>
          <div className="desk-form-footer">
            <span>
              <MessageCircle size={14} /> المسودة خاصة بالمدربين؛ لا تظهر للأسرة
              أو الطالب حتى اعتماد رئيس المدربين.
            </span>
            <div>
              <button
                className="desk-secondary-action"
                type="submit"
                disabled={locked}
              >
                <Save size={14} /> حفظ كمسودة
              </button>
              <button
                className="desk-primary-action"
                type="button"
                onClick={onSubmitForReview}
                disabled={locked}
              >
                <Check size={14} /> إرسال للمراجعة
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
  tone: string;
}) {
  return (
    <article className="instructor-desk-kpi">
      <span className={`instructor-desk-kpi-icon ${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}
function PanelTitle({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="instructor-desk-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
