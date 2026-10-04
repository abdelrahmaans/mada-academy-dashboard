import type { FormEvent } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import type {
  Session,
  SessionForm,
  SessionStatus,
  SessionType,
} from "@/pages/Schedule";

export type ScheduleDay = {
  name: string;
  date: Date;
  iso: string;
  index: number;
};
export type ScheduleFilterTab = { key: "all" | SessionStatus; label: string };

export function ScheduleCalendar({
  weekStart,
  days,
  visibleDays,
  matchingSessions,
  filteredTabs,
  statusFilter,
  setStatusFilter,
  instructors,
  instructorFilter,
  setInstructorFilter,
  reviewCount,
  view,
  setView,
  selectedDay,
  weekOffset,
  shiftSelection,
  setWeekOffset,
  setSelectedDay,
  setDetailsSession,
  formatDate,
  addDays,
  minutesFromTime,
  timeLabel,
  statusLabels,
  firstHour,
  lastHour,
  hourHeight,
}: {
  weekStart: Date;
  days: ScheduleDay[];
  visibleDays: ScheduleDay[];
  matchingSessions: Session[];
  filteredTabs: ScheduleFilterTab[];
  statusFilter: "all" | SessionStatus;
  setStatusFilter: (value: "all" | SessionStatus) => void;
  instructors: string[];
  instructorFilter: string;
  setInstructorFilter: (value: string) => void;
  reviewCount: number;
  view: "week" | "day";
  setView: (value: "week" | "day") => void;
  selectedDay: number;
  weekOffset: number;
  shiftSelection: (direction: -1 | 1) => void;
  setWeekOffset: (value: number) => void;
  setSelectedDay: (value: number) => void;
  setDetailsSession: (session: Session) => void;
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string;
  addDays: (date: Date, amount: number) => Date;
  minutesFromTime: (value: string) => number;
  timeLabel: (value: string) => string;
  statusLabels: Record<SessionStatus, string>;
  firstHour: number;
  lastHour: number;
  hourHeight: number;
}) {
  return (
    <section
      className="panel schedule-board-panel"
      aria-label="الجدول الأسبوعي للحصص"
    >
      <div className="schedule-board-heading">
        <div className="panel-title-group">
          <span className="panel-icon panel-icon-teal">
            <CalendarDays size={18} />
          </span>
          <div>
            <h2>مواعيد الحصص</h2>
            <p>عرض أسبوعي — السبت إلى الجمعة</p>
          </div>
        </div>
        <div className="schedule-date-tools">
          <button
            className="button button-secondary schedule-today"
            onClick={() => {
              setWeekOffset(0);
              setSelectedDay(0);
            }}
          >
            اليوم
          </button>
          <div className="schedule-nav-arrows">
            <button
              aria-label={view === "week" ? "الأسبوع السابق" : "اليوم السابق"}
              onClick={() => shiftSelection(-1)}
            >
              <ChevronRight size={17} />
            </button>
            <button
              aria-label={view === "week" ? "الأسبوع التالي" : "اليوم التالي"}
              onClick={() => shiftSelection(1)}
            >
              <ChevronLeft size={17} />
            </button>
          </div>
          <strong className="schedule-range">
            {formatDate(weekStart, { day: "numeric", month: "long" })} —{" "}
            {formatDate(addDays(weekStart, 6), {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
        </div>
      </div>

      <div className="schedule-toolbar">
        <div
          className="schedule-filter-tabs"
          role="tablist"
          aria-label="تصفية حسب حالة الحصة"
        >
          {filteredTabs.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={statusFilter === tab.key}
              className={`schedule-filter-tab ${statusFilter === tab.key ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              {tab.key === "pending_approval" && reviewCount > 0 && (
                <span>{reviewCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="schedule-toolbar-controls">
          <label className="schedule-select">
            <Users size={15} />
            <select
              aria-label="فلترة حسب الكوتش"
              value={instructorFilter}
              onChange={event => setInstructorFilter(event.target.value)}
            >
              {instructors.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
          <div
            className="schedule-view-switch"
            role="tablist"
            aria-label="طريقة عرض الجدول"
          >
            <button
              role="tab"
              aria-selected={view === "week"}
              className={view === "week" ? "active" : ""}
              onClick={() => setView("week")}
            >
              أسبوع
            </button>
            <button
              role="tab"
              aria-selected={view === "day"}
              className={view === "day" ? "active" : ""}
              onClick={() => setView("day")}
            >
              يوم
            </button>
          </div>
        </div>
      </div>

      <section
        className="schedule-mobile-day-picker"
        aria-label="اختيار يوم الأسبوع"
      >
        {days.map(day => (
          <button
            key={day.iso}
            className={selectedDay === day.index ? "active" : ""}
            onClick={() => {
              setSelectedDay(day.index);
              setView("day");
            }}
          >
            <span>{day.name.slice(0, 2)}</span>
            <strong>{formatDate(day.date, { day: "numeric" })}</strong>
          </button>
        ))}
      </section>
      <div className="schedule-calendar-scroll" aria-label="تقويم الحصص">
        <div
          className={`schedule-calendar ${view === "day" ? "is-day-view" : ""}`}
        >
          <div className="calendar-header-row">
            <div className="calendar-time-heading">
              <span>التوقيت</span>
            </div>
            {visibleDays.map(day => (
              <button
                key={day.iso}
                className={`calendar-day-heading ${day.index === selectedDay ? "selected" : ""}`}
                onClick={() => setSelectedDay(day.index)}
              >
                <span>{day.name}</span>
                <strong>{formatDate(day.date, { day: "numeric" })}</strong>
                <small>{formatDate(day.date, { month: "short" })}</small>
                {day.index === 0 && weekOffset === 0 && <i>اليوم</i>}
              </button>
            ))}
          </div>
          <div className="calendar-body-row">
            <div className="calendar-time-rail">
              {Array.from(
                { length: lastHour - firstHour },
                (_, index) => firstHour + index
              ).map(hour => (
                <div className="calendar-time-label" key={hour}>
                  <span>{String(hour % 12 || 12).padStart(2, "0")}:00</span>
                  <small>{hour < 12 ? "ص" : "م"}</small>
                </div>
              ))}
            </div>
            {visibleDays.map(day => {
              const daySessions = matchingSessions.filter(
                session => session.date === day.iso
              );
              return (
                <div className="calendar-day-track" key={day.iso}>
                  {daySessions.map(session => {
                    const start = minutesFromTime(session.startTime);
                    const top =
                      ((start - firstHour * 60) / 60) * hourHeight + 4;
                    const height = Math.max(
                      62,
                      (session.duration / 60) * hourHeight - 8
                    );
                    const inView =
                      start >= firstHour * 60 && start < lastHour * 60;
                    if (!inView) return null;
                    return (
                      <button
                        key={session.id}
                        className={`calendar-session-card tone-${session.type} state-${session.status}`}
                        style={{ top, height }}
                        onClick={() => setDetailsSession(session)}
                        aria-label={`${session.title}، ${timeLabel(session.startTime)}، ${session.instructor}`}
                      >
                        <span className="session-card-time">
                          <Clock3 size={11} />
                          {timeLabel(session.startTime)}
                        </span>
                        <strong>{session.title}</strong>
                        <small>
                          {session.instructor} <i /> {session.room}
                        </small>
                        {height > 88 && (
                          <span className="session-card-status">
                            {statusLabels[session.status]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {daySessions.length === 0 && (
                    <div className="calendar-day-empty">
                      <span>لا توجد حصص مطابقة</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="schedule-board-footer">
        <span>
          <i className="legend-status legend-scheduled" /> قادمة
        </span>
        <span>
          <i className="legend-status legend-live" /> جارية
        </span>
        <span>
          <i className="legend-status legend-review" /> تحتاج مراجعة
        </span>
        <small>
          <Clock3 size={13} /> ساعات العرض من 9 ص إلى 6 م
        </small>
      </div>
    </section>
  );
}

export function ScheduleDetailsDialog({
  session,
  onClose,
  onCancel,
  onEdit,
  statusLabels,
  dayNames,
  fromISODate,
  formatDate,
  timeLabel,
  typeLabels,
}: {
  session: Session;
  onClose: () => void;
  onCancel: (session: Session) => void;
  onEdit: (session: Session) => void;
  statusLabels: Record<SessionStatus, string>;
  dayNames: string[];
  fromISODate: (value: string) => Date;
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string;
  timeLabel: (value: string) => string;
  typeLabels: Record<SessionType, string>;
}) {
  return (
    <>
      {session && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <section
            className="student-dialog schedule-details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-details-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <CalendarDays size={20} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => onClose()}
              >
                <X size={18} />
              </button>
            </div>
            <div className="schedule-detail-heading">
              <h2 id="schedule-details-title">{session.title}</h2>
              <span
                className={`schedule-status-badge status-${session.status}`}
              >
                <i />
                {statusLabels[session.status]}
              </span>
            </div>
            <p className="schedule-detail-subtitle">{session.level}</p>
            <div className="schedule-detail-grid">
              <div>
                <small>اليوم والتاريخ</small>
                <strong>
                  <CalendarDays size={14} />
                  {
                    dayNames[
                      fromISODate(session.date).getDay() === 6
                        ? 0
                        : (fromISODate(session.date).getDay() + 1) % 7
                    ]
                  }
                  ،{" "}
                  {formatDate(fromISODate(session.date), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
              </div>
              <div>
                <small>وقت الحصة</small>
                <strong>
                  <Clock3 size={14} />
                  <span dir="ltr">
                    {timeLabel(session.startTime)} · {session.duration} دقيقة
                  </span>
                </strong>
              </div>
              <div>
                <small>الكوتش</small>
                <strong>
                  <Users size={14} />
                  {session.instructor}
                </strong>
              </div>
              <div>
                <small>القاعة والفرع</small>
                <strong>
                  <MapPin size={14} />
                  {session.room} · {session.branch}
                </strong>
              </div>
              <div>
                <small>تسجيل الطلاب</small>
                <strong>
                  <CheckCircle2 size={14} />
                  <span dir="ltr">
                    {session.enrolled} / {session.capacity}
                  </span>
                </strong>
              </div>
              <div>
                <small>نوع الحصة</small>
                <strong>
                  <BookOpen size={14} />
                  {typeLabels[session.type]}
                </strong>
              </div>
            </div>
            <div className="dialog-info">
              <AlertCircle size={15} />
              <span>تفاصيل هذه الحصة توضيحية ولا تمثل سجلًا حقيقيًا.</span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={() => onCancel(session)}
                disabled={session.status === "cancelled"}
              >
                إلغاء الحصة
              </button>
              <button
                className="button button-primary"
                onClick={() => onEdit(session)}
              >
                <Check size={15} /> تعديل الحصة
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function ScheduleFormDialog({
  dialogMode,
  form,
  liveMode,
  liveBranches,
  liveInstructors,
  liveClassrooms,
  selectedLiveRooms,
  branchOptions,
  instructorOptions,
  roomOptions,
  typeLabels,
  setForm,
  onClose,
  onSubmit,
}: {
  dialogMode: "add" | "edit";
  form: SessionForm;
  liveMode: boolean;
  liveBranches: Array<{ id: string; name: string }>;
  liveInstructors: Array<{
    id: string;
    name: string | null;
    branchId: string | null;
  }>;
  liveClassrooms: Array<{
    id: string;
    branchId: string;
    name: string;
    status: string;
  }>;
  selectedLiveRooms: Array<{
    id: string;
    branchId: string;
    name: string;
    status: string;
  }>;
  branchOptions: string[];
  instructorOptions: string[];
  roomOptions: string[];
  typeLabels: Record<SessionType, string>;
  setForm: (updater: (current: SessionForm) => SessionForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      {dialogMode && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <section
            className="student-dialog schedule-form-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-form-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <CalendarDays size={20} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="schedule-form-title">
              {dialogMode === "edit" ? "تعديل الحصة" : "إضافة حصة للجدول"}
            </h2>
            <p>
              {liveMode
                ? "سيتم حفظ جلسة جديدة على الخادم بعد التحقق من الصلاحية والتعارض."
                : "وضع العرض التجريبي: التغييرات تُحفظ محليًا فقط."}
            </p>
            <form onSubmit={onSubmit}>
              <label className="form-field">
                <span>
                  اسم الحصة <b>*</b>
                </span>
                <input
                  required
                  value={form.title}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="مثال: روبوتكس مستوى 1"
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    التاريخ <b>*</b>
                  </span>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form-field">
                  <span>
                    بداية الحصة <b>*</b>
                  </span>
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    الكوتش <b>*</b>
                  </span>
                  <select
                    value={
                      liveMode ? (form.instructorId ?? "") : form.instructor
                    }
                    onChange={event => {
                      const selected = liveInstructors.find(
                        item => item.id === event.target.value
                      );
                      setForm(current => ({
                        ...current,
                        instructorId: liveMode ? event.target.value : undefined,
                        instructor: selected?.name ?? event.target.value,
                      }));
                    }}
                  >
                    {liveMode && <option value="">اختر مدربًا</option>}
                    {(liveMode
                      ? liveInstructors
                          .filter(
                            item =>
                              !item.branchId || item.branchId === form.branchId
                          )
                          .map(item => ({
                            value: item.id,
                            label: item.name ?? item.id,
                          }))
                      : instructorOptions.map(item => ({
                          value: item,
                          label: item,
                        }))
                    ).map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>
                    القاعة <b>*</b>
                  </span>
                  <select
                    value={liveMode ? (form.classroomId ?? "") : form.room}
                    onChange={event => {
                      const selected = liveClassrooms.find(
                        item => item.id === event.target.value
                      );
                      setForm(current => ({
                        ...current,
                        classroomId: liveMode ? event.target.value : undefined,
                        room: selected?.name ?? event.target.value,
                      }));
                    }}
                  >
                    {liveMode && <option value="">اختر قاعة متاحة</option>}
                    {(liveMode
                      ? selectedLiveRooms.map(item => ({
                          value: item.id,
                          label: item.name,
                        }))
                      : roomOptions.map(item => ({ value: item, label: item }))
                    ).map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>الفرع</span>
                  <select
                    value={liveMode ? (form.branchId ?? "") : form.branch}
                    onChange={event => {
                      const selected = liveBranches.find(
                        item => item.id === event.target.value
                      );
                      const nextRoom = liveClassrooms.find(
                        room =>
                          room.branchId === event.target.value &&
                          room.status === "AVAILABLE"
                      );
                      setForm(current => ({
                        ...current,
                        branchId: liveMode ? event.target.value : undefined,
                        branch: selected?.name ?? event.target.value,
                        classroomId: nextRoom?.id,
                        room: nextRoom?.name ?? current.room,
                      }));
                    }}
                  >
                    {(liveMode
                      ? liveBranches.map(item => ({
                          value: item.id,
                          label: item.name,
                        }))
                      : branchOptions.map(item => ({
                          value: item,
                          label: item,
                        }))
                    ).map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>المدة</span>
                  <select
                    value={form.duration}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        duration: Number(event.target.value),
                      }))
                    }
                  >
                    <option value={60}>60 دقيقة</option>
                    <option value={90}>90 دقيقة</option>
                    <option value={120}>120 دقيقة</option>
                    <option value={180}>180 دقيقة</option>
                  </select>
                </label>
              </div>
              <label className="form-field">
                <span>نوع الحصة</span>
                <select
                  value={form.type}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      type: event.target.value as SessionType,
                    }))
                  }
                >
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="dialog-info">
                <AlertCircle size={15} />
                <span>
                  المحاكاة تمنع تداخل المواعيد محليًا حسب الكوتش أو القاعة فقط.
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={onClose}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Plus size={16} />
                  {dialogMode === "edit" ? "حفظ التعديل" : "إضافة للجدول"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
