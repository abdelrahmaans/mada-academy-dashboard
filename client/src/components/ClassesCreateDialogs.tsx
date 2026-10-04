import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Activity, BookOpen, CalendarDays, Plus, X } from "lucide-react";
import type {
  SchedulingClassroom,
  SchedulingInstructor,
  StudentRecord,
} from "@/lib/apiClient";
import type { Course, Track } from "@/pages/Classes";

type Setter<T> = Dispatch<SetStateAction<T>>;

export type ClassesCreateDialogsProps = {
  courseModalOpen: boolean;
  offeringModalOpen: boolean;
  setCourseModalOpen: Setter<boolean>;
  setOfferingModalOpen: Setter<boolean>;
  resetCourseForm: () => void;
  resetOfferingForm: () => void;
  addCourse: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  addOffering: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  liveMode: boolean;
  courseName: string;
  setCourseName: Setter<string>;
  newTrack: Track;
  setNewTrack: Setter<Track>;
  newCourseType: "hard" | "soft";
  setNewCourseType: Setter<"hard" | "soft">;
  ageGroup: string;
  setAgeGroup: Setter<string>;
  level: Course["level"];
  setLevel: Setter<Course["level"]>;
  totalSessions: string;
  setTotalSessions: Setter<string>;
  durationHours: string;
  setDurationHours: Setter<string>;
  price: string;
  setPrice: Setter<string>;
  trackOptions: Array<[Track, string]>;
  levelLabels: Record<string, string>;
  courses: Course[];
  offeringCourseId: string;
  setOfferingCourseId: Setter<string>;
  instructor: string;
  setInstructor: Setter<string>;
  selectedInstructorId: string;
  setSelectedInstructorId: Setter<string>;
  liveInstructors: SchedulingInstructor[];
  startDate: string;
  setStartDate: Setter<string>;
  offeringBranch: string;
  setOfferingBranch: Setter<string>;
  offeringBranchId: string;
  setOfferingBranchId: Setter<string>;
  liveClassrooms: SchedulingClassroom[];
  classroom: string;
  setClassroom: Setter<string>;
  selectedClassroomId: string;
  setSelectedClassroomId: Setter<string>;
  branches: string[];
  scheduleDays: string[];
  toggleDay: (day: string) => void;
  startTime: string;
  setStartTime: Setter<string>;
  endTime: string;
  setEndTime: Setter<string>;
  maxStudents: string;
  setMaxStudents: Setter<string>;
  liveStudents: StudentRecord[];
  selectedStudentIds: string[];
  setSelectedStudentIds: Setter<string[]>;
};

export function ClassesCreateDialogs({
  courseModalOpen,
  offeringModalOpen,
  setCourseModalOpen,
  setOfferingModalOpen,
  resetCourseForm,
  resetOfferingForm,
  addCourse,
  addOffering,
  liveMode,
  courseName,
  setCourseName,
  newTrack,
  setNewTrack,
  newCourseType,
  setNewCourseType,
  ageGroup,
  setAgeGroup,
  level,
  setLevel,
  totalSessions,
  setTotalSessions,
  durationHours,
  setDurationHours,
  price,
  setPrice,
  trackOptions,
  levelLabels,
  courses,
  offeringCourseId,
  setOfferingCourseId,
  instructor,
  setInstructor,
  selectedInstructorId,
  setSelectedInstructorId,
  liveInstructors,
  startDate,
  setStartDate,
  offeringBranch,
  setOfferingBranch,
  offeringBranchId,
  setOfferingBranchId,
  liveClassrooms,
  classroom,
  setClassroom,
  selectedClassroomId,
  setSelectedClassroomId,
  branches,
  scheduleDays,
  toggleDay,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  maxStudents,
  setMaxStudents,
  liveStudents,
  selectedStudentIds,
  setSelectedStudentIds,
}: ClassesCreateDialogsProps) {
  return (
    <>
      {courseModalOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setCourseModalOpen(false);
              resetCourseForm();
            }
          }}
        >
          <section
            className="student-dialog academic-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-course-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <BookOpen size={21} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => {
                  setCourseModalOpen(false);
                  resetCourseForm();
                }}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="add-course-title">إنشاء قالب كورس</h2>
            <p>عرّف محتوى المسار التعليمي قبل فتح مجموعات للتسجيل.</p>
            <form onSubmit={addCourse}>
              <label className="form-field">
                <span>
                  اسم الكورس <b>*</b>
                </span>
                <input
                  autoFocus
                  value={courseName}
                  onChange={event => setCourseName(event.target.value)}
                  placeholder="مثال: الروبوتات والأنظمة الذكية"
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    المسار <b>*</b>
                  </span>
                  <select
                    value={newTrack}
                    onChange={event => setNewTrack(event.target.value as Track)}
                  >
                    {trackOptions.map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>نوع المسار</span>
                  <select
                    value={newCourseType}
                    onChange={event =>
                      setNewCourseType(event.target.value as "hard" | "soft")
                    }
                  >
                    <option value="hard">تقني (Hard Skills)</option>
                    <option value="soft">مهارات شخصية (Soft Skills)</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>الفئة العمرية</span>
                  <select
                    value={ageGroup}
                    onChange={event => setAgeGroup(event.target.value)}
                  >
                    {["4-6", "7-9", "10-12", "13-15", "16-18"].map(age => (
                      <option key={age} value={age}>
                        {age} سنة
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>المستوى</span>
                  <select
                    value={level}
                    onChange={event =>
                      setLevel(event.target.value as Course["level"])
                    }
                  >
                    {Object.entries(levelLabels).map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    عدد الحصص <b>*</b>
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={totalSessions}
                    onChange={event => setTotalSessions(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>
                    مدة الحصة بالساعات <b>*</b>
                  </span>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={durationHours}
                    onChange={event => setDurationHours(event.target.value)}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>
                  السعر الأساسي بالجنيه <b>*</b>
                </span>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                  placeholder="مثال: 3500"
                  inputMode="decimal"
                />
              </label>
              <div className="dialog-info">
                <Activity size={15} />
                <span>
                  {liveMode
                    ? "سيحفظ الخادم قالب الكورس كمسودة قابلة للاستخدام في إنشاء المجموعات."
                    : "المسودة محلية للعرض فقط؛ لا تُحفظ في قاعدة البيانات."}
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setCourseModalOpen(false);
                    resetCourseForm();
                  }}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Plus size={16} /> حفظ كمسودة
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {offeringModalOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setOfferingModalOpen(false);
              resetOfferingForm();
            }
          }}
        >
          <section
            className="student-dialog academic-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-offering-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <CalendarDays size={21} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => {
                  setOfferingModalOpen(false);
                  resetOfferingForm();
                }}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="add-offering-title">إضافة مجموعة جديدة</h2>
            <p>اربط قالب الكورس بفرع ومدرب ومعمل ومواعيد أسبوعية.</p>
            <form onSubmit={addOffering}>
              <label className="form-field">
                <span>
                  قالب الكورس <b>*</b>
                </span>
                <select
                  value={offeringCourseId}
                  onChange={event => setOfferingCourseId(event.target.value)}
                >
                  {courses
                    .filter(course => liveMode || course.status === "active")
                    .map(course => (
                      <option value={course.id} key={course.id}>
                        {course.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>
                    المدرب <b>*</b>
                  </span>
                  {liveMode ? (
                    <select
                      value={selectedInstructorId}
                      onChange={event => {
                        const selected = liveInstructors.find(
                          item => item.id === event.target.value
                        );
                        setSelectedInstructorId(event.target.value);
                        setInstructor(selected?.name ?? "");
                      }}
                    >
                      <option value="">اختر مدربًا</option>
                      {liveInstructors
                        .filter(
                          item =>
                            !item.branchId || item.branchId === offeringBranchId
                        )
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name ?? item.id}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      value={instructor}
                      onChange={event => setInstructor(event.target.value)}
                      placeholder="اسم المدرب"
                    />
                  )}
                </label>
                <label className="form-field">
                  <span>
                    تاريخ البداية <b>*</b>
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={event => setStartDate(event.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>الفرع</span>
                  <select
                    value={liveMode ? offeringBranchId : offeringBranch}
                    onChange={event => {
                      if (!liveMode) {
                        setOfferingBranch(event.target.value);
                        return;
                      }
                      const selected = liveClassrooms.find(
                        room => room.branchId === event.target.value
                      );
                      const nextRoom = liveClassrooms.find(
                        room =>
                          room.branchId === event.target.value &&
                          room.status === "AVAILABLE"
                      );
                      setOfferingBranchId(event.target.value);
                      setOfferingBranch(selected?.branchName ?? "");
                      setSelectedClassroomId(nextRoom?.id ?? "");
                      setClassroom(nextRoom?.name ?? "");
                      setSelectedStudentIds(current =>
                        current.filter(id =>
                          liveStudents.some(
                            student =>
                              student.id === id &&
                              student.branchId === event.target.value
                          )
                        )
                      );
                    }}
                  >
                    {(liveMode
                      ? Array.from(
                          new Map(
                            liveClassrooms.map(room => [
                              room.branchId,
                              room.branchName,
                            ])
                          ).entries()
                        ).map(([id, name]) => ({ id, name }))
                      : branches.slice(1).map(name => ({ id: name, name }))
                    ).map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>
                    المعمل / القاعة <b>*</b>
                  </span>
                  {liveMode ? (
                    <select
                      value={selectedClassroomId}
                      onChange={event => {
                        const selected = liveClassrooms.find(
                          room => room.id === event.target.value
                        );
                        setSelectedClassroomId(event.target.value);
                        setClassroom(selected?.name ?? "");
                        if (selected)
                          setMaxStudents(
                            String(
                              Math.min(Number(maxStudents), selected.capacity)
                            )
                          );
                      }}
                    >
                      <option value="">اختر قاعة متاحة</option>
                      {liveClassrooms
                        .filter(
                          room =>
                            room.branchId === offeringBranchId &&
                            room.status === "AVAILABLE"
                        )
                        .map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} · سعة {room.capacity}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      value={classroom}
                      onChange={event => setClassroom(event.target.value)}
                      placeholder="معمل 1"
                    />
                  )}
                </label>
              </div>
              <fieldset className="weekday-field">
                <legend>
                  أيام المجموعة <b>*</b>
                </legend>
                <div>
                  {[
                    "السبت",
                    "الأحد",
                    "الإثنين",
                    "الثلاثاء",
                    "الأربعاء",
                    "الخميس",
                    "الجمعة",
                  ].map(day => (
                    <button
                      type="button"
                      key={day}
                      className={
                        scheduleDays.includes(day)
                          ? "weekday-chip selected"
                          : "weekday-chip"
                      }
                      aria-pressed={scheduleDays.includes(day)}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="form-row">
                <label className="form-field">
                  <span>من الساعة</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={event => setStartTime(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>إلى الساعة</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={event => setEndTime(event.target.value)}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>الحد الأقصى للطلاب</span>
                <input
                  type="number"
                  min="1"
                  value={maxStudents}
                  onChange={event => setMaxStudents(event.target.value)}
                />
              </label>
              {liveMode && (
                <fieldset className="weekday-field">
                  <legend>إضافة طلاب للمجموعة (اختياري)</legend>
                  <div className="consumer-student-picks">
                    {liveStudents
                      .filter(student => student.branchId === offeringBranchId)
                      .map(student => (
                        <label key={student.id}>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={event =>
                              setSelectedStudentIds(current =>
                                event.target.checked
                                  ? [...current, student.id]
                                  : current.filter(id => id !== student.id)
                              )
                            }
                          />
                          {student.fullName}
                        </label>
                      ))}
                    {!liveStudents.some(
                      student => student.branchId === offeringBranchId
                    ) && (
                      <small>لا يوجد طلاب نشطون في هذا الفرع للاختيار.</small>
                    )}
                  </div>
                </fieldset>
              )}
              <div className="dialog-info">
                <Activity size={15} />
                <span>
                  {liveMode
                    ? "سيُنشئ الخادم المجموعة والجلسات الأسبوعية ويربط الطلاب المحددين."
                    : "المجموعة القادمة ستظهر كعرض تجريبي غير محفوظ."}
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setOfferingModalOpen(false);
                    resetOfferingForm();
                  }}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Plus size={16} /> إضافة المجموعة
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
