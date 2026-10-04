import type { Dispatch, FormEvent, SetStateAction } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import type { Student, StudentSource, StudentStatus } from "@/pages/Students";

export function StudentsTableSection({
  students,
  filteredStudents,
  visibleStudents,
  dataMode,
  statusFilter,
  setStatusFilter,
  pausedCount,
  query,
  setQuery,
  branchFilter,
  setBranchFilter,
  branchOptions,
  setPage,
  page,
  pageCount,
  pageSize,
  setDetailsStudent,
  clearFilters,
  statusLabels,
}: {
  students: Student[];
  filteredStudents: Student[];
  visibleStudents: Student[];
  dataMode: "demo" | "live";
  statusFilter: StudentStatus | "all";
  setStatusFilter: (value: StudentStatus | "all") => void;
  pausedCount: number;
  query: string;
  setQuery: (value: string) => void;
  branchFilter: string;
  setBranchFilter: (value: string) => void;
  branchOptions: string[];
  setPage: Dispatch<SetStateAction<number>>;
  page: number;
  pageCount: number;
  pageSize: number;
  setDetailsStudent: (student: Student) => void;
  clearFilters: () => void;
  statusLabels: Record<StudentStatus, string>;
}) {
  return (
    <section className="panel students-panel">
      <div className="students-panel-heading">
        <div className="panel-title-group">
          <span className="panel-icon panel-icon-teal">
            <Users size={18} />
          </span>
          <div>
            <h2>قائمة الطلاب</h2>
            <p>
              {filteredStudents.length} سجل معروض من{" "}
              {dataMode === "live" ? "الـAPI الحقيقي" : "بيانات العينة"}
            </p>
          </div>
        </div>
        <button
          className="students-more"
          aria-label="المزيد"
          onClick={() => toast("خيارات القائمة قيد التجهيز")}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="student-toolbar">
        <div
          className="student-filter-tabs"
          role="group"
          aria-label="فلترة حسب الحالة"
        >
          {[
            { key: "all", label: "الكل", count: students.length },
            {
              key: "active",
              label: "نشط",
              count: students.filter(student => student.status === "active")
                .length,
            },
            { key: "on_hold", label: "موقوف مؤقتًا", count: pausedCount },
            {
              key: "graduated",
              label: "متخرج",
              count: students.filter(student => student.status === "graduated")
                .length,
            },
          ].map(item => (
            <button
              key={item.key}
              className={
                statusFilter === item.key ? "filter-tab active" : "filter-tab"
              }
              onClick={() => {
                setStatusFilter(item.key as StudentStatus | "all");
                setPage(1);
              }}
            >
              {item.label}
              <span>{String(item.count).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        <div className="student-toolbar-actions">
          <label className="table-search">
            <Search size={16} />
            <input
              placeholder="ابحث بالاسم أو رقم الطالب..."
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            <kbd>/</kbd>
          </label>
          <label className="branch-filter">
            <MapPin size={14} />
            <select
              value={branchFilter}
              onChange={event => {
                setBranchFilter(event.target.value);
                setPage(1);
              }}
              aria-label="اختيار الفرع"
            >
              {branchOptions.map(branch => (
                <option key={branch}>{branch}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
          <button
            className="filter-button"
            onClick={() => toast("استخدم البحث والحالة والفرع لتصفية القائمة")}
          >
            <Filter size={15} />
            <span>تصفية</span>
          </button>
        </div>
      </div>

      <div className="students-table-wrap">
        <table className="students-table">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>الكورس الحالي</th>
              <th>ولي الأمر</th>
              <th>العمر</th>
              <th>الفرع</th>
              <th>الحالة</th>
              <th>تاريخ التسجيل</th>
              <th aria-label="التفاصيل" />
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map(student => {
              const birthTime = new Date(student.birthDate).getTime();
              const age = Number.isNaN(birthTime)
                ? null
                : Math.max(
                    1,
                    Math.floor((Date.now() - birthTime) / 31557600000)
                  );
              return (
                <tr key={student.id}>
                  <td data-label="الطالب">
                    <button
                      className="student-identity"
                      onClick={() => setDetailsStudent(student)}
                    >
                      <span
                        className={`student-avatar avatar-${student.color}`}
                      >
                        {student.initials}
                      </span>
                      <span>
                        <strong>{student.name}</strong>
                        <small>{student.id}</small>
                      </span>
                    </button>
                  </td>
                  <td data-label="الكورس الحالي">
                    <span className="student-course">
                      <BookOpen size={14} />
                      {student.course}
                    </span>
                  </td>
                  <td data-label="ولي الأمر">
                    <span className="guardian-cell">
                      <strong>{student.parentName}</strong>
                      <small>
                        {student.relation} ·{" "}
                        <b dir="ltr">{student.parentPhone}</b>
                      </small>
                    </span>
                  </td>
                  <td data-label="العمر">
                    <span className="student-age">
                      {age === null ? "—" : `${age} سنة`}
                    </span>
                  </td>
                  <td data-label="الفرع">
                    <span className="student-branch">
                      <MapPin size={13} />
                      {student.branch}
                    </span>
                  </td>
                  <td data-label="الحالة">
                    <span className={`student-status status-${student.status}`}>
                      <i />
                      {statusLabels[student.status]}
                    </span>
                  </td>
                  <td data-label="تاريخ التسجيل">
                    <span className="joined-date">{student.joined}</span>
                  </td>
                  <td data-label="التفاصيل">
                    <button
                      className="student-row-more"
                      aria-label={`عرض ملف ${student.name}`}
                      onClick={() => setDetailsStudent(student)}
                    >
                      <ChevronLeft size={17} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {visibleStudents.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="students-empty">
                    <span className="empty-search-icon">
                      <Search size={20} />
                    </span>
                    <strong>ملقيناش نتائج مطابقة</strong>
                    <small>
                      جرّب تغير البحث أو الفلاتر عشان تظهر سجلات تانية.
                    </small>
                    <button className="text-link" onClick={clearFilters}>
                      مسح الفلاتر <X size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="students-table-footer">
        <span>
          عرض{" "}
          <b>
            {visibleStudents.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, filteredStudents.length)}
          </b>{" "}
          من <b>{filteredStudents.length}</b> نتيجة{" "}
          <small>
            · {dataMode === "live" ? "سجلات حقيقية" : "سجلات تجريبية"}
          </small>
        </span>
        <div className="pagination">
          <button
            aria-label="الصفحة السابقة"
            disabled={page <= 1}
            onClick={() => setPage(current => current - 1)}
          >
            <ChevronRight size={15} />
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(
            pageNumber => (
              <button
                key={pageNumber}
                className={pageNumber === page ? "current-page" : ""}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            )
          )}
          <button
            aria-label="الصفحة التالية"
            disabled={page >= pageCount}
            onClick={() => setPage(current => current + 1)}
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function AddStudentDialog({
  studentName,
  birthDate,
  gender,
  parentName,
  parentPhone,
  source,
  newBranch,
  branches,
  sourceLabels,
  setStudentName,
  setBirthDate,
  setGender,
  setParentName,
  setParentPhone,
  setSource,
  setNewBranch,
  onClose,
  onSubmit,
}: {
  studentName: string;
  birthDate: string;
  gender: "male" | "female";
  parentName: string;
  parentPhone: string;
  source: StudentSource;
  newBranch: string;
  branches: string[];
  sourceLabels: Record<StudentSource, string>;
  setStudentName: (value: string) => void;
  setBirthDate: (value: string) => void;
  setGender: (value: "male" | "female") => void;
  setParentName: (value: string) => void;
  setParentPhone: (value: string) => void;
  setSource: (value: StudentSource) => void;
  setNewBranch: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="student-dialog students-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
      >
        <div className="dialog-top">
          <span className="dialog-mark">
            <GraduationCap size={21} />
          </span>
          <button
            className="icon-button"
            aria-label="إغلاق"
            onClick={() => {
              onClose();
            }}
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="add-student-title">إضافة طالب جديد</h2>
        <p>أدخل بيانات الطالب وولي الأمر لبدء التسجيل في الفرع.</p>
        <form onSubmit={onSubmit}>
          <label className="form-field">
            <span>
              اسم الطالب <b>*</b>
            </span>
            <input
              autoFocus
              value={studentName}
              onChange={event => setStudentName(event.target.value)}
              placeholder="الاسم بالكامل"
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>
                تاريخ الميلاد <b>*</b>
              </span>
              <input
                type="date"
                value={birthDate}
                onChange={event => setBirthDate(event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>النوع</span>
              <select
                value={gender}
                onChange={event =>
                  setGender(event.target.value as "male" | "female")
                }
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>
                اسم ولي الأمر <b>*</b>
              </span>
              <input
                value={parentName}
                onChange={event => setParentName(event.target.value)}
                placeholder="اسم ولي الأمر"
              />
            </label>
            <label className="form-field">
              <span>
                رقم الهاتف <b>*</b>
              </span>
              <input
                value={parentPhone}
                onChange={event => setParentPhone(event.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                dir="ltr"
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>الفرع</span>
              <select
                value={newBranch}
                onChange={event => setNewBranch(event.target.value)}
              >
                {branches.slice(1).map(branch => (
                  <option key={branch}>{branch}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>مصدر التسجيل</span>
              <select
                value={source}
                onChange={event =>
                  setSource(event.target.value as StudentSource)
                }
              >
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dialog-info">
            <FileText size={15} />
            <span>
              بيانات النموذج محلية للعرض فقط، ولن تُحفظ في قاعدة بيانات.
            </span>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                onClose();
              }}
            >
              إلغاء
            </button>
            <button type="submit" className="button button-primary">
              <Plus size={16} /> إضافة الطالب
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
