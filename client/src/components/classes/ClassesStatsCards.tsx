import React from "react";
import {
  ArrowUpLeft,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react";

export interface ClassesStatsCardsProps {
  loading: boolean;
  liveMode: boolean;
  activeCourses: number;
  totalCourses: number;
  activeGroups: number;
  enrolledTotal: number;
  availableSeats: number;
}

export function ClassesStatsCards({
  loading,
  liveMode,
  activeCourses,
  totalCourses,
  activeGroups,
  enrolledTotal,
  availableSeats,
}: ClassesStatsCardsProps) {
  return (
    <section
      className="course-stats-grid"
      aria-label="ملخص الكورسات والمجموعات"
    >
      <article className="course-stat">
        <span className="course-stat-icon icon-teal">
          <BookOpen size={18} />
        </span>
        <span className="course-stat-label">قوالب كورسات نشطة</span>
        <div>
          <strong>
            {loading ? "..." : String(activeCourses).padStart(2, "0")}
          </strong>
          <span>من {totalCourses} كورسات</span>
        </div>
        <small>
          <CheckCircle2 size={13} /> قابلة للتسجيل
        </small>
      </article>

      <article className="course-stat">
        <span className="course-stat-icon icon-blue">
          <CalendarCheck size={18} />
        </span>
        <span className="course-stat-label">مجموعات جارية أو قادمة</span>
        <div>
          <strong>
            {loading ? "..." : String(activeGroups).padStart(2, "0")}
          </strong>
          <span>مجموعة</span>
        </div>
        <small className="course-neutral">في الفروع المسجلة</small>
      </article>

      <article className="course-stat">
        <span className="course-stat-icon icon-violet">
          <Users size={18} />
        </span>
        <span className="course-stat-label">
          {liveMode ? "طلاب في المجموعات" : "طلاب في مجموعات العينة"}
        </span>
        <div>
          <strong>
            {loading ? "..." : String(enrolledTotal).padStart(2, "0")}
          </strong>
          <span>طالب</span>
        </div>
        <small className="course-neutral">
          {liveMode ? "إجمالي المسجلين بالخادم" : "مجموع بيانات تجريبية"}
        </small>
      </article>

      <article className="course-stat">
        <span className="course-stat-icon icon-amber">
          <Sparkles size={18} />
        </span>
        <span className="course-stat-label">
          {liveMode ? "أماكن متاحة" : "أماكن متاحة في العينة"}
        </span>
        <div>
          <strong>{String(availableSeats).padStart(2, "0")}</strong>
          <span>مقعد</span>
        </div>
        <small>
          <ArrowUpLeft size={13} /> سعة المجموعات النشطة والقادمة
        </small>
      </article>
    </section>
  );
}
