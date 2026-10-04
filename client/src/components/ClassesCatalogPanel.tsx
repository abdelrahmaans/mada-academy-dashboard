import { BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, Clock3, Filter, MapPin, MoreHorizontal, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Course, Offering, Track } from "@/pages/Classes";

type Props = {
  tab: "courses" | "groups";
  setTab: (tab: "courses" | "groups") => void;
  courses: Course[];
  offerings: Offering[];
  filteredCourses: Course[];
  filteredOfferings: Offering[];
  trackFilter: Track | "all";
  setTrackFilter: (value: Track | "all") => void;
  branchFilter: string;
  setBranchFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  trackOptions: Array<[Track, string]>;
  branches: string[];
  trackLabels: Record<Track, string>;
  trackIcons: Record<Track, string>;
  levelLabels: Record<string, string>;
  courseStatusLabels: Record<string, string>;
  offeringStatusLabels: Record<string, string>;
  liveMode: boolean;
  clearFilters: () => void;
  setSelectedCourse: (course: Course) => void;
  setSelectedOffering: (offering: Offering) => void;
};

export default function ClassesCatalogPanel({
  tab, setTab, courses, offerings, filteredCourses, filteredOfferings, trackFilter, setTrackFilter, branchFilter, setBranchFilter, statusFilter, setStatusFilter, trackOptions, branches, trackLabels, trackIcons, levelLabels, courseStatusLabels, offeringStatusLabels, liveMode, clearFilters, setSelectedCourse, setSelectedOffering,
}: Props) {
  return (
          <section className="panel classes-panel">
            <div className="classes-panel-title">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-teal">
                  {tab === "courses" ? (
                    <BookOpen size={18} />
                  ) : (
                    <CalendarDays size={18} />
                  )}
                </span>
                <div>
                  <h2>المحتوى الأكاديمي</h2>
                  <p>القوالب التعليمية منفصلة عن مجموعات التشغيل والجداول</p>
                </div>
              </div>
              <button
                className="students-more"
                aria-label="المزيد"
                onClick={() => toast("المزيد من خيارات إدارة المحتوى قريبًا")}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="classes-toolbar-top">
              <div
                className="classes-tabs"
                role="tablist"
                aria-label="نوع المحتوى"
              >
                <button
                  role="tab"
                  aria-selected={tab === "courses"}
                  className={
                    tab === "courses" ? "classes-tab active" : "classes-tab"
                  }
                  onClick={() => setTab("courses")}
                >
                  <BookOpen size={15} />
                  الكورسات<span>{courses.length}</span>
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "groups"}
                  className={
                    tab === "groups" ? "classes-tab active" : "classes-tab"
                  }
                  onClick={() => setTab("groups")}
                >
                  <CalendarDays size={15} />
                  المجموعات والحصص<span>{offerings.length}</span>
                </button>
              </div>
              <div className="classes-filters">
                <label className="track-filter">
                  <Sparkles size={14} />
                  <select
                    aria-label="تصفية حسب المسار"
                    value={trackFilter}
                    onChange={event =>
                      setTrackFilter(event.target.value as Track | "all")
                    }
                  >
                    <option value="all">كل المسارات</option>
                    {trackOptions.map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </label>
                {tab === "groups" && (
                  <label className="track-filter">
                    <MapPin size={14} />
                    <select
                      aria-label="تصفية حسب الفرع"
                      value={branchFilter}
                      onChange={event => setBranchFilter(event.target.value)}
                    >
                      {branches.map(branch => (
                        <option key={branch}>{branch}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} />
                  </label>
                )}
                <label className="track-filter status-filter">
                  <Filter size={14} />
                  <select
                    aria-label="تصفية حسب الحالة"
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value)}
                  >
                    <option value="all">كل الحالات</option>
                    {(tab === "courses"
                      ? Object.entries(courseStatusLabels)
                      : Object.entries(offeringStatusLabels)
                    ).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </label>
              </div>
            </div>

            {tab === "courses" ? (
              <>
                <div className="course-list-heading">
                  <span>{filteredCourses.length} كورس في النتائج</span>
                  <span>
                    اختار كورس عشان تشوف التفاصيل أو جهّز مجموعة جديدة
                  </span>
                </div>
                {filteredCourses.length ? (
                  <div className="course-cards-grid">
                    {filteredCourses.map(course => (
                      <article className="course-card" key={course.id}>
                        <div className="course-card-top">
                          <span
                            className={`track-mark track-${trackIcons[course.track]}`}
                          >
                            <BookOpen size={19} />
                          </span>
                          <div className="course-card-actions">
                            <span
                              className={`template-status template-${course.status}`}
                            >
                              <i />
                              {courseStatusLabels[course.status]}
                            </span>
                            <button
                              aria-label={`خيارات ${course.name}`}
                              onClick={() =>
                                toast("إجراءات الكورس قيد التجهيز")
                              }
                            >
                              <MoreHorizontal size={19} />
                            </button>
                          </div>
                        </div>
                        <div className="course-card-title-row">
                          <span className="course-track-name">
                            {trackLabels[course.track]} <i />{" "}
                            {course.type === "hard"
                              ? "مسار تقني"
                              : "مهارات شخصية"}
                          </span>
                          <span className="course-template-id">
                            {course.id}
                          </span>
                        </div>
                        <button
                          className="course-card-title"
                          onClick={() => setSelectedCourse(course)}
                        >
                          {course.name}
                          <ChevronLeft size={16} />
                        </button>
                        <p className="course-description">
                          {course.description}
                        </p>
                        <div className="course-tags">
                          <span>{course.ageGroup} سنة</span>
                          <span>{levelLabels[course.level]}</span>
                          <span>{course.totalSessions} حصة</span>
                        </div>
                        <div className="course-card-bottom">
                          <div>
                            <small>السعر الأساسي</small>
                            <strong>
                              <bdi dir="ltr">
                                {new Intl.NumberFormat("en-US").format(
                                  course.basePricePiasters / 100
                                )}
                              </bdi>{" "}
                              <span>ج.م</span>
                            </strong>
                          </div>
                          <span className="course-duration">
                            <Clock3 size={13} /> {course.durationHours} س / حصة
                          </span>
                          <button
                            className="course-card-open"
                            aria-label={`تفاصيل ${course.name}`}
                            onClick={() => setSelectedCourse(course)}
                          >
                            <ChevronLeft size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="classes-empty">
                    <span>
                      <Search size={19} />
                    </span>
                    <strong>مفيش كورسات مطابقة</strong>
                    <small>جرّب تغير البحث أو اختيارات الفلترة.</small>
                    <button className="text-link" onClick={clearFilters}>
                      مسح الفلاتر
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="groups-table-wrap">
                  <table className="groups-table">
                    <thead>
                      <tr>
                        <th>المجموعة / الكورس</th>
                        <th>المدرب</th>
                        <th>الفرع والمعمل</th>
                        <th>الجدول الأسبوعي</th>
                        <th>المقاعد</th>
                        <th>الحالة</th>
                        <th aria-label="تفاصيل" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOfferings.map(offering => (
                        <tr
                          key={offering.id}
                          onClick={() => setSelectedOffering(offering)}
                        >
                          <td data-label="المجموعة / الكورس">
                            <span
                              className={`group-track track-${trackIcons[offering.track]}`}
                            >
                              <BookOpen size={16} />
                            </span>
                            <span className="group-course-copy">
                              <strong>{offering.courseName}</strong>
                              <small>
                                {offering.id} · {trackLabels[offering.track]}
                              </small>
                            </span>
                          </td>
                          <td data-label="المدرب">
                            <span className="instructor-cell">
                              <i>{offering.instructor[0]}</i>
                              <span>
                                {offering.instructor}
                                {offering.substitute && (
                                  <small>بديل: {offering.substitute}</small>
                                )}
                              </span>
                            </span>
                          </td>
                          <td data-label="الفرع والمعمل">
                            <span className="classroom-cell">
                              <strong>{offering.branch}</strong>
                              <small>
                                <MapPin size={12} /> {offering.classroom}
                              </small>
                            </span>
                          </td>
                          <td data-label="الجدول الأسبوعي">
                            <span className="schedule-cell">
                              <CalendarDays size={14} />
                              {offering.schedule}
                            </span>
                          </td>
                          <td data-label="المقاعد">
                            <span className="capacity-cell">
                              <strong>
                                {offering.enrolledStudents} /{" "}
                                {offering.maxStudents}
                              </strong>
                              <i>
                                <b
                                  style={{
                                    width: `${Math.min(100, (offering.enrolledStudents / offering.maxStudents) * 100)}%`,
                                  }}
                                />
                              </i>
                            </span>
                          </td>
                          <td data-label="الحالة">
                            <span
                              className={`offering-status offering-${offering.status}`}
                            >
                              <i />
                              {offeringStatusLabels[offering.status]}
                            </span>
                          </td>
                          <td data-label="تفاصيل">
                            <button
                              className="student-row-more"
                              aria-label={`تفاصيل ${offering.id}`}
                              onClick={event => {
                                event.stopPropagation();
                                setSelectedOffering(offering);
                              }}
                            >
                              <ChevronLeft size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredOfferings.length && (
                        <tr>
                          <td colSpan={7}>
                            <div className="classes-empty">
                              <span>
                                <Search size={19} />
                              </span>
                              <strong>مفيش مجموعات مطابقة</strong>
                              <small>
                                غيّر الفلترة أو ابحث باسم المدرب أو الكورس.
                              </small>
                              <button
                                className="text-link"
                                onClick={clearFilters}
                              >
                                مسح الفلاتر
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="groups-footer">
                  <span>
                    عرض <b>{filteredOfferings.length}</b> مجموعات · {liveMode ? "السعة والإشغال من الخادم" : "السعة والإشغال من بيانات العينة"}
                  </span>
                  <button
                    className="text-link"
                    onClick={() =>
                      toast("تقويم الحصص الأسبوعي سيتاح في المرحلة التالية")
                    }
                  >
                    فتح الجدول الأسبوعي <ChevronLeft size={14} />
                  </button>
                </div>
              </>
            )}
          </section>
  );
}
