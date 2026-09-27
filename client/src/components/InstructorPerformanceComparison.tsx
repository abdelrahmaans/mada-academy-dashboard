import { useMemo, useState } from "react";
import { BookOpen, CalendarDays, MapPin, Star, Users } from "lucide-react";
import {
  ACADEMY_BRANCHES,
  INSTRUCTOR_MONTHLY_PERFORMANCE,
  PERFORMANCE_MONTHS,
  type InstructorMonthlyRecord,
} from "@/lib/instructorPerformance";

type Scope = "branch" | "academy";

type InstructorPerformanceComparisonProps = {
  scope: Scope;
  branch?: string;
  month?: string;
  onMonthChange?: (value: string) => void;
  selectedBranch?: string;
  onBranchChange?: (value: string) => void;
  selectedInstructorId?: string;
  onInstructorChange?: (value: string) => void;
};

type MetricSummary = {
  instructors: number;
  sessions: number;
  attendanceRate: number;
  evaluationCompletionRate: number;
  averageEvaluation: number;
};

function summarize(records: InstructorMonthlyRecord[]): MetricSummary {
  const sessions = records.reduce((sum, record) => sum + record.sessions, 0);
  const weighted = (
    key: "attendanceRate" | "evaluationCompletionRate" | "averageEvaluation"
  ) =>
    sessions
      ? records.reduce(
          (sum, record) => sum + record[key] * record.sessions,
          0
        ) / sessions
      : 0;
  return {
    instructors: new Set(records.map(record => record.instructorId)).size,
    sessions,
    attendanceRate: Math.round(weighted("attendanceRate")),
    evaluationCompletionRate: Math.round(weighted("evaluationCompletionRate")),
    averageEvaluation: Number(weighted("averageEvaluation").toFixed(1)),
  };
}

function deltaText(current: number, previous?: number, suffix = " نقطة") {
  if (previous === undefined) return "— لا توجد مقارنة";
  const delta = Number((current - previous).toFixed(1));
  return `${delta > 0 ? "+" : ""}${delta}${suffix}`;
}

function deltaTone(current: number, previous?: number) {
  if (previous === undefined || current === previous) return "neutral";
  return current > previous ? "positive" : "negative";
}

export default function InstructorPerformanceComparison({
  scope,
  branch,
  month,
  onMonthChange,
  selectedBranch: controlledBranch,
  onBranchChange,
  selectedInstructorId: controlledInstructorId,
  onInstructorChange,
}: InstructorPerformanceComparisonProps) {
  const [internalMonth, setInternalMonth] = useState<string>(
    PERFORMANCE_MONTHS[0].value
  );
  const selectedMonth = month ?? internalMonth;
  const changeMonth = (value: string) => {
    setInternalMonth(value);
    onMonthChange?.(value);
  };
  const [internalInstructorId, setInternalInstructorId] = useState("all");
  const [internalBranch, setInternalBranch] = useState("all");
  const selectedInstructorId = controlledInstructorId ?? internalInstructorId;
  const selectedBranch = controlledBranch ?? internalBranch;
  const changeInstructor = (value: string) => {
    setInternalInstructorId(value);
    onInstructorChange?.(value);
  };
  const changeBranch = (value: string) => {
    setInternalBranch(value);
    onBranchChange?.(value);
    changeInstructor("all");
  };
  const isAcademyScope = scope === "academy";
  const lockedBranch = branch;
  const filterBranch = isAcademyScope
    ? selectedBranch
    : (lockedBranch ?? "all");

  const inScope = useMemo(
    () =>
      INSTRUCTOR_MONTHLY_PERFORMANCE.filter(record => {
        const branchMatches =
          filterBranch === "all" || record.branch === filterBranch;
        const instructorMatches =
          selectedInstructorId === "all" ||
          record.instructorId === selectedInstructorId;
        return branchMatches && instructorMatches;
      }),
    [filterBranch, selectedInstructorId]
  );
  const currentRows = inScope.filter(record => record.month === selectedMonth);
  const selectedMonthIndex = PERFORMANCE_MONTHS.findIndex(
    item => item.value === selectedMonth
  );
  const previousMonth = PERFORMANCE_MONTHS[selectedMonthIndex + 1];
  const previousRows = previousMonth
    ? inScope.filter(record => record.month === previousMonth.value)
    : [];
  const currentSummary = summarize(currentRows);
  const previousSummary = summarize(previousRows);
  const instructorOptions = useMemo(() => {
    const unique = new Map<string, InstructorMonthlyRecord>();
    INSTRUCTOR_MONTHLY_PERFORMANCE.filter(record =>
      filterBranch === "all" ? true : record.branch === filterBranch
    ).forEach(record => unique.set(record.instructorId, record));
    return Array.from(unique.values()).sort((first, second) =>
      first.instructorName.localeCompare(second.instructorName, "ar")
    );
  }, [filterBranch]);

  const getPrevious = (record: InstructorMonthlyRecord) =>
    previousMonth
      ? INSTRUCTOR_MONTHLY_PERFORMANCE.find(
          item =>
            item.instructorId === record.instructorId &&
            item.branch === record.branch &&
            item.month === previousMonth.value
        )
      : undefined;

  return (
    <section
      className={`instructor-performance-panel ${isAcademyScope ? "is-academy-scope" : "is-branch-scope"}`}
      aria-labelledby="instructor-performance-title"
    >
      <div className="instructor-performance-heading">
        <div>
          <span className="instructor-performance-kicker">
            <CalendarDays size={14} /> مقارنة شهرية · بيانات توضيحية
          </span>
          <h2 id="instructor-performance-title">
            {isAcademyScope
              ? "أداء المدربين على مستوى الأكاديمية"
              : "مقارنة أداء المدربين"}
          </h2>
          <p>
            {isAcademyScope
              ? "استعرض كل المدربين عبر الفروع، أو ركّز على فرع ومدرب بعينه."
              : `مقارنة شهرية للمدربين في فرع ${lockedBranch ?? "مدينة نصر"}.`}
          </p>
        </div>
        <span className="instructor-performance-scope-badge">
          {isAcademyScope ? <MapPin size={13} /> : <BookOpen size={13} />}
          {isAcademyScope
            ? selectedBranch === "all"
              ? "كل الفروع"
              : `فرع ${selectedBranch}`
            : `فرع ${lockedBranch ?? "مدينة نصر"}`}
        </span>
      </div>

      <div className="instructor-performance-filters">
        <label>
          <span>الشهر</span>
          <select
            aria-label="اختيار شهر مقارنة أداء المدربين"
            value={selectedMonth}
            onChange={event => changeMonth(event.target.value)}
          >
            {PERFORMANCE_MONTHS.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
        {isAcademyScope && (
          <label>
            <span>الفرع</span>
            <select
              aria-label="تصفية أداء المدربين حسب الفرع"
              value={selectedBranch}
              onChange={event => changeBranch(event.target.value)}
            >
              <option value="all">كل الفروع</option>
              {ACADEMY_BRANCHES.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>المدرب</span>
          <select
            aria-label="تصفية أداء المدربين حسب المدرب"
            value={selectedInstructorId}
            onChange={event => changeInstructor(event.target.value)}
          >
            <option value="all">كل المدربين</option>
            {instructorOptions.map(instructor => (
              <option
                key={instructor.instructorId}
                value={instructor.instructorId}
              >
                {instructor.instructorName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="instructor-performance-kpis">
        <article>
          <span className="performance-kpi-icon teal">
            <Users size={15} />
          </span>
          <small>مدربون ضمن النطاق</small>
          <strong>{currentSummary.instructors}</strong>
        </article>
        <article>
          <span className="performance-kpi-icon blue">
            <BookOpen size={15} />
          </span>
          <small>حصص الشهر</small>
          <strong>{currentSummary.sessions}</strong>
        </article>
        <article>
          <span className="performance-kpi-icon amber">%</span>
          <small>انتظام الحضور</small>
          <strong>{currentSummary.attendanceRate}%</strong>
          <em
            className={deltaTone(
              currentSummary.attendanceRate,
              previousMonth ? previousSummary.attendanceRate : undefined
            )}
          >
            {deltaText(
              currentSummary.attendanceRate,
              previousMonth ? previousSummary.attendanceRate : undefined
            )}
          </em>
        </article>
        <article>
          <span className="performance-kpi-icon violet">✓</span>
          <small>اكتمال التقييمات</small>
          <strong>{currentSummary.evaluationCompletionRate}%</strong>
          <em
            className={deltaTone(
              currentSummary.evaluationCompletionRate,
              previousMonth
                ? previousSummary.evaluationCompletionRate
                : undefined
            )}
          >
            {deltaText(
              currentSummary.evaluationCompletionRate,
              previousMonth
                ? previousSummary.evaluationCompletionRate
                : undefined
            )}
          </em>
        </article>
        <article>
          <span className="performance-kpi-icon amber">
            <Star size={15} />
          </span>
          <small>متوسط التقييم</small>
          <strong>
            <bdi dir="ltr">{currentSummary.averageEvaluation} / ٥</bdi>
          </strong>
          <em
            className={deltaTone(
              currentSummary.averageEvaluation,
              previousMonth ? previousSummary.averageEvaluation : undefined
            )}
          >
            {deltaText(
              currentSummary.averageEvaluation,
              previousMonth ? previousSummary.averageEvaluation : undefined,
              ""
            )}
          </em>
        </article>
      </div>

      <div className="instructor-performance-table-heading">
        <strong>تفاصيل كل مدرب</strong>
        <span>
          {previousMonth
            ? `التغير مقارنة بـ ${previousMonth.label}`
            : "لا توجد فترة سابقة للمقارنة"}
        </span>
      </div>
      {currentRows.length ? (
        <div
          className="instructor-performance-rows"
          role="table"
          aria-label="مقارنة أداء كل مدرب"
        >
          <div className="instructor-performance-row header" role="row">
            <span role="columnheader">المدرب</span>
            {isAcademyScope && <span role="columnheader">الفرع</span>}
            <span role="columnheader">الحصص</span>
            <span role="columnheader">الحضور</span>
            <span role="columnheader">اكتمال التقييم</span>
            <span role="columnheader">متوسط الدرجات</span>
          </div>
          {currentRows.map(record => {
            const previous = getPrevious(record);
            const initials = record.instructorName
              .split(" ")
              .slice(0, 2)
              .map(part => part[0])
              .join("");
            return (
              <div
                className="instructor-performance-row"
                role="row"
                key={`${record.instructorId}-${record.month}`}
              >
                <span className="performance-instructor-cell" role="cell">
                  <i>{initials}</i>
                  <span>
                    <strong>{record.instructorName}</strong>
                    <small>
                      {record.status === "active" ? "نشط" : "في إجازة"} ·{" "}
                      <bdi dir="ltr">{record.instructorId}</bdi>
                    </small>
                  </span>
                </span>
                {isAcademyScope && (
                  <span className="performance-branch-cell" role="cell">
                    <MapPin size={12} /> {record.branch}
                  </span>
                )}
                <span className="performance-metric-cell" role="cell">
                  <small>الحصص</small>
                  <strong>{record.sessions}</strong>
                </span>
                <span className="performance-metric-cell" role="cell">
                  <small>انتظام الحضور</small>
                  <strong>{record.attendanceRate}%</strong>
                  <em
                    className={deltaTone(
                      record.attendanceRate,
                      previous?.attendanceRate
                    )}
                  >
                    {deltaText(record.attendanceRate, previous?.attendanceRate)}
                  </em>
                </span>
                <span className="performance-metric-cell" role="cell">
                  <small>اكتمال التقييم</small>
                  <strong>{record.evaluationCompletionRate}%</strong>
                  <em
                    className={deltaTone(
                      record.evaluationCompletionRate,
                      previous?.evaluationCompletionRate
                    )}
                  >
                    {deltaText(
                      record.evaluationCompletionRate,
                      previous?.evaluationCompletionRate
                    )}
                  </em>
                </span>
                <span className="performance-metric-cell" role="cell">
                  <small>متوسط التقييم</small>
                  <strong>
                    <bdi dir="ltr">{record.averageEvaluation} / ٥</bdi>
                  </strong>
                  <em
                    className={deltaTone(
                      record.averageEvaluation,
                      previous?.averageEvaluation
                    )}
                  >
                    {deltaText(
                      record.averageEvaluation,
                      previous?.averageEvaluation,
                      ""
                    )}
                  </em>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="instructor-performance-empty">
          <Users size={19} />
          <strong>لا توجد بيانات لهذا الاختيار</strong>
          <span>جرّب شهرًا أو فرعًا أو مدربًا آخر.</span>
        </div>
      )}
      <div className="instructor-performance-footnote">
        <span>مقارنة استرشادية محلية فقط</span>
        <span>الحضور والتقييمات ليست سجلات حقيقية أو محفوظة</span>
      </div>
    </section>
  );
}
