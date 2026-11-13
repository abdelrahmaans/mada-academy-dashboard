import { Award, BookOpen, CalendarCheck, CalendarDays, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Course, Offering, Track } from "@/pages/Classes";

type Props = {
  selectedCourse: Course | null;
  selectedOffering: Offering | null;
  trackLabels: Record<Track, string>;
  trackIcons: Record<Track, string>;
  levelLabels: Record<string, string>;
  courseStatusLabels: Record<string, string>;
  offeringStatusLabels: Record<string, string>;
  onCloseCourse: () => void;
  onCloseOffering: () => void;
  onCreateOfferingFromCourse: (courseId: string) => void;
};

export default function ClassesDetailDialogs({
  selectedCourse,
  selectedOffering,
  trackLabels,
  trackIcons,
  levelLabels,
  courseStatusLabels,
  offeringStatusLabels,
  onCloseCourse,
  onCloseOffering,
  onCreateOfferingFromCourse,
}: Props) {
  return (
    <>
      {selectedCourse && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) onCloseCourse();
          }}
        >
          <section
            className="student-dialog academic-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-detail-title"
          >
            <div className="dialog-top">
              <span
                className={`track-mark track-${trackIcons[selectedCourse.track]}`}
              >
                <BookOpen size={19} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={onCloseCourse}
              >
                <X size={18} />
              </button>
            </div>
            <div className="academic-detail-title">
              <div>
                <small>
                  {trackLabels[selectedCourse.track]} · {selectedCourse.id}
                </small>
                <h2 id="course-detail-title">{selectedCourse.name}</h2>
              </div>
              <span
                className={`template-status template-${selectedCourse.status}`}
              >
                <i />
                {courseStatusLabels[selectedCourse.status]}
              </span>
            </div>
            <p className="academic-detail-description">
              {selectedCourse.description}
            </p>
            <div className="detail-grid">
              <div>
                <small>الفئة العمرية</small>
                <strong>{selectedCourse.ageGroup} سنة</strong>
              </div>
              <div>
                <small>المستوى</small>
                <strong>{levelLabels[selectedCourse.level]}</strong>
              </div>
              <div>
                <small>عدد الحصص</small>
                <strong>{selectedCourse.totalSessions} حصة</strong>
              </div>
              <div>
                <small>مدة الحصة</small>
                <strong>{selectedCourse.durationHours} ساعة</strong>
              </div>
              <div>
                <small>السعر الأساسي</small>
                <strong>
                  {new Intl.NumberFormat("ar-EG").format(
                    selectedCourse.basePricePiasters / 100
                  )}{" "}
                  ج.م
                </strong>
              </div>
              <div>
                <small>نوع المسار</small>
                <strong>
                  {selectedCourse.type === "hard"
                    ? "مهارات تقنية"
                    : "مهارات شخصية"}
                </strong>
              </div>
            </div>
            <div className="dialog-info">
              <BookOpen size={15} />
              <span>
                قالب الكورس يحدد المنهج؛ المجموعات تحدد الفرع والمدرب والمواعيد.
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={onCloseCourse}
              >
                إغلاق
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  onCreateOfferingFromCourse(selectedCourse.id);
                }}
              >
                <Plus size={15} /> إنشاء مجموعة
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedOffering && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) onCloseOffering();
          }}
        >
          <section
            className="student-dialog academic-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offering-detail-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <CalendarDays size={20} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={onCloseOffering}
              >
                <X size={18} />
              </button>
            </div>
            <div className="academic-detail-title">
              <div>
                <small>
                  {selectedOffering.id} · {trackLabels[selectedOffering.track]}
                </small>
                <h2 id="offering-detail-title">
                  {selectedOffering.courseName}
                </h2>
              </div>
              <span
                className={`offering-status offering-${selectedOffering.status}`}
              >
                <i />
                {offeringStatusLabels[selectedOffering.status]}
              </span>
            </div>
            <div className="detail-grid">
              <div>
                <small>المدرب</small>
                <strong>{selectedOffering.instructor}</strong>
              </div>
              {selectedOffering.substitute && (
                <div>
                  <small>المدرب البديل</small>
                  <strong>{selectedOffering.substitute}</strong>
                </div>
              )}
              <div>
                <small>الفرع</small>
                <strong>{selectedOffering.branch}</strong>
              </div>
              <div>
                <small>المعمل / القاعة</small>
                <strong>{selectedOffering.classroom}</strong>
              </div>
              <div>
                <small>الأيام والوقت</small>
                <strong>{selectedOffering.schedule}</strong>
              </div>
              <div>
                <small>تاريخ البداية</small>
                <strong dir="ltr">{selectedOffering.startDate}</strong>
              </div>
              <div>
                <small>المقاعد المسجلة</small>
                <strong>
                  {selectedOffering.enrolledStudents} من{" "}
                  {selectedOffering.maxStudents}
                </strong>
              </div>
              <div>
                <small>نوع الحصة</small>
                <strong>حصة منتظمة</strong>
              </div>
            </div>

            {/* Academic Supervision & Head Instructor Feedback */}
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "grid",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Award size={16} color="#16a34a" />
                  <strong style={{ fontSize: "13px", color: "#166534" }}>
                    متابعة رئيس المدربين وجودة المجموعة
                  </strong>
                </div>
                <span
                  style={{
                    background: "#dcfce7",
                    color: "#15803d",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "99px",
                  }}
                >
                  معتمدة ومتابعة
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#14532d",
                  lineHeight: 1.6,
                }}
              >
                <strong>آخر توجيه أكاديمي:</strong> "تمت مراجعة تقييمات الجلسة السابقة؛ أداء ممتاز في شرح أساسيات المسار، ونوصي بالتركيز على مشاريع الفرق العملية."
              </p>
              <small style={{ color: "#166534", fontSize: "11px" }}>
                بواسطة: رئيس المدربين · يمكن لمدير الفرع الاطلاع الدائم على توجيهات وملاحظات الجودة الأكاديمية لكل مجموعة.
              </small>
            </div>
            <div className="dialog-info">
              <CalendarCheck size={15} />
              <span>
                مواعيد الجلسات المنفصلة تُدار من الجدول الأسبوعي، وهذه بيانات
                المجموعة التوضيحية.
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={onCloseOffering}
              >
                إغلاق
              </button>
              <button
                className="button button-primary"
                onClick={() =>
                  toast("تحرير جدول المجموعة سيتاح في المرحلة التالية")
                }
              >
                تعديل الجدول
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
