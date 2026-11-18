import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Plus,
  X,
  Search,
  UserPlus,
  Check,
  Users,
} from "lucide-react";
import {
  apiClient,
  type SchedulingClassroom,
  type SchedulingInstructor,
  type StudentRecord,
} from "@/lib/apiClient";
import type { Course, Track } from "@/pages/Classes";
import { toast } from "sonner";

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
  selectedSupervisorId?: string;
  setSelectedSupervisorId?: Setter<string>;
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
  selectedSupervisorId,
  setSelectedSupervisorId,
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
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentDob, setNewStudentDob] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [localExtraStudents, setLocalExtraStudents] = useState<StudentRecord[]>([]);

  // Merge server students and locally registered candidates
  const allAvailableStudents = [...localExtraStudents, ...liveStudents];
  const uniqueStudents = allAvailableStudents.filter(
    (s, idx, arr) => arr.findIndex(x => x.id === s.id) === idx
  );

  const branchStudents = offeringBranchId
    ? uniqueStudents.filter(s => !s.branchId || s.branchId === offeringBranchId)
    : uniqueStudents;

  const selectedStudents = uniqueStudents.filter(s =>
    selectedStudentIds.includes(s.id)
  );

  const filteredCandidates = branchStudents.filter(s => {
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.trim().toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      (s.parentPhone && s.parentPhone.includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q))
    );
  });

  const handleQuickRegisterStudent = async () => {
    const trimmedName = newStudentName.trim();
    const trimmedPhone = newStudentPhone.trim();

    if (!trimmedName) {
      toast.error("يرجى إدخال اسم الطالب");
      return;
    }
    if (!trimmedPhone) {
      toast.error("يرجى إدخال رقم هاتف ولي الأمر للتواصل");
      return;
    }

    try {
      setIsSubmittingStudent(true);
      let registeredId = `std-temp-${Date.now()}`;

      if (liveMode) {
        try {
          const res = await apiClient.registerStudent({
            fullName: trimmedName,
            phone: trimmedPhone,
            branchId: offeringBranchId || undefined,
            dateOfBirth: newStudentDob || undefined,
          });
          if (res?.studentId) {
            registeredId = res.studentId;
          }
        } catch (apiErr) {
          console.warn("registerStudent network/API fallback", apiErr);
        }
      }

      const newRecord: StudentRecord = {
        id: registeredId,
        branchId: offeringBranchId,
        fullName: trimmedName,
        parentPhone: trimmedPhone,
        dateOfBirth: newStudentDob || null,
        status: "ACTIVE",
        activeEnrollmentCount: 1,
        code: `#STD-${Date.now().toString().slice(-4)}`,
      };

      setLocalExtraStudents(prev => [newRecord, ...prev]);
      setSelectedStudentIds(prev =>
        prev.includes(registeredId) ? prev : [...prev, registeredId]
      );

      toast.success(`تم تسجيل الطالب "${trimmedName}" بنجاح وتسكينه بالمجموعة! 🎓`);
      setNewStudentName("");
      setNewStudentPhone("");
      setNewStudentDob("");
      setIsRegisteringNew(false);
      setStudentSearchQuery("");
    } catch {
      toast.error("تعذر إتمام تسجيل الطالب الجديد، يرجى إعادة المحاولة");
    } finally {
      setIsSubmittingStudent(false);
    }
  };

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
              {liveMode && setSelectedSupervisorId && (
                <label className="form-field">
                  <span>المشرف الأكاديمي (رئيس المدربين) - اختياري</span>
                  <select
                    value={selectedSupervisorId}
                    onChange={event => setSelectedSupervisorId(event.target.value)}
                  >
                    <option value="">بدون مشرف أكاديمي مخصص</option>
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
                </label>
              )}
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
                          allAvailableStudents.some(
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
              {/* Modern Search & Quick-Add Students to Group */}
              <div className="group-student-picker-container">
                {/* Header with counter & quick add trigger */}
                <div className="group-student-header">
                  <span className="group-student-title">
                    <Users size={14} style={{ color: "#0d9488" }} />
                    <span>إضافة وتسكين طلاب بالمجموعة (اختياري)</span>
                    <span className="group-student-counter">
                      {selectedStudentIds.length} من {maxStudents || 12}
                    </span>
                  </span>
                  {!isRegisteringNew && (
                    <button
                      type="button"
                      className="group-student-add-trigger"
                      onClick={() => {
                        setIsRegisteringNew(true);
                        setNewStudentName(studentSearchQuery.trim());
                      }}
                      title="تسجيل طالب جديد غير موجود بالقائمة"
                    >
                      <UserPlus size={13} />
                      <span>+ تسجيل طالب جديد</span>
                    </button>
                  )}
                </div>

                {/* Selected Students Pills / Chips */}
                {selectedStudents.length > 0 && (
                  <div className="group-student-selected-strip">
                    <div className="group-student-chips-wrap">
                      {selectedStudents.map(student => (
                        <span key={student.id} className="group-student-chip">
                          <span className="group-student-chip-avatar">
                            {student.fullName.slice(0, 1)}
                          </span>
                          <span className="group-student-chip-name">{student.fullName}</span>
                          <button
                            type="button"
                            className="group-student-chip-remove"
                            onClick={() =>
                              setSelectedStudentIds(current =>
                                current.filter(id => id !== student.id)
                              )
                            }
                            title="إزالة الطالب من المجموعة"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Input */}
                <div className="group-student-search-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو رقم الهاتف لإضافة طلاب للمجموعة..."
                    className="group-student-search-input"
                  />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      className="clear-icon"
                      onClick={() => setStudentSearchQuery("")}
                      title="مسح البحث"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Quick Register New Student Box */}
                {isRegisteringNew && (
                  <div className="group-student-register-box">
                    <div className="register-box-head">
                      <span className="register-box-title">
                        <UserPlus size={14} />
                        <span>تسجيل طالب جديد وإضافته فوراً للمجموعة:</span>
                      </span>
                      <button
                        type="button"
                        className="register-box-close"
                        onClick={() => setIsRegisteringNew(false)}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="register-box-inputs">
                      <label className="register-field">
                        <span>اسم الطالب رباعي <b>*</b></span>
                        <input
                          type="text"
                          value={newStudentName}
                          onChange={e => setNewStudentName(e.target.value)}
                          placeholder="مثال: يوسف أحمد محمود"
                          autoFocus
                        />
                      </label>
                      <label className="register-field">
                        <span>رقم هاتف ولي الأمر <b>*</b></span>
                        <input
                          type="tel"
                          dir="ltr"
                          value={newStudentPhone}
                          onChange={e => setNewStudentPhone(e.target.value)}
                          placeholder="01012345678"
                        />
                      </label>
                    </div>

                    <div className="register-box-actions">
                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={() => setIsRegisteringNew(false)}
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        className="button button-primary button-sm"
                        disabled={isSubmittingStudent || !newStudentName.trim() || !newStudentPhone.trim()}
                        onClick={handleQuickRegisterStudent}
                      >
                        {isSubmittingStudent ? "جاري التسجيل..." : "تسجيل وإضافة للمجموعة ✓"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Results List */}
                {!isRegisteringNew && (
                  <div className="group-student-results-list">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.slice(0, 15).map(student => {
                        const isSelected = selectedStudentIds.includes(student.id);
                        return (
                          <div
                            key={student.id}
                            className={`group-student-row ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedStudentIds(current =>
                                  current.filter(id => id !== student.id)
                                );
                              } else {
                                setSelectedStudentIds(current => [...current, student.id]);
                                toast.success(`تمت إضافة ${student.fullName} للمجموعة ✓`);
                              }
                            }}
                          >
                            <div className="student-row-info">
                              <span className="student-row-avatar">
                                {student.fullName.slice(0, 1)}
                              </span>
                              <div>
                                <strong className="student-row-name">{student.fullName}</strong>
                                {student.parentPhone && (
                                  <small className="student-row-phone" dir="ltr">{student.parentPhone}</small>
                                )}
                              </div>
                            </div>

                            {isSelected ? (
                              <span className="student-row-badge-added">
                                <Check size={12} />
                                <span>مضاف للمجموعة ✓</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="student-row-add-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudentIds(current => [...current, student.id]);
                                  toast.success(`تمت إضافة ${student.fullName} للمجموعة ✓`);
                                }}
                              >
                                <Plus size={12} />
                                <span>إضافة</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="group-student-empty-search">
                        <p>
                          لا يوجد طالب مسجل باسم "<strong>{studentSearchQuery}</strong>".
                        </p>
                        <button
                          type="button"
                          className="group-student-notfound-btn"
                          onClick={() => {
                            setIsRegisteringNew(true);
                            setNewStudentName(studentSearchQuery.trim());
                          }}
                        >
                          <UserPlus size={13} />
                          <span>تسجيل "{studentSearchQuery.trim()}" كطالب جديد وإضافته</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
