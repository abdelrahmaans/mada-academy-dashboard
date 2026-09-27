import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import InstructorPerformanceComparison from "@/components/InstructorPerformanceComparison";
import {
  ACADEMY_BRANCHES,
  INSTRUCTOR_MONTHLY_PERFORMANCE,
  PERFORMANCE_MONTHS,
} from "@/lib/instructorPerformance";

export default function AcademyOwner() {
  const [, navigate] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [month, setMonth] = useState<string>(PERFORMANCE_MONTHS[0].value);
  const [branch, setBranch] = useState("all");
  const [instructorId, setInstructorId] = useState("all");
  const branchLabel = branch === "all" ? "كل الفروع" : `فرع ${branch}`;
  const monthLabel =
    PERFORMANCE_MONTHS.find(item => item.value === month)?.label ?? "";
  const summary = useMemo(() => {
    const records = INSTRUCTOR_MONTHLY_PERFORMANCE.filter(
      record =>
        record.month === month &&
        (branch === "all" || record.branch === branch) &&
        (instructorId === "all" || record.instructorId === instructorId)
    );
    return {
      instructors: new Set(records.map(record => record.instructorId)).size,
      branches: new Set(records.map(record => record.branch)).size,
      sessions: records.reduce((sum, record) => sum + record.sessions, 0),
      attendance: records.length
        ? Math.round(
            records.reduce(
              (sum, record) => sum + record.attendanceRate * record.sessions,
              0
            ) / records.reduce((sum, record) => sum + record.sessions, 0)
          )
        : 0,
    };
  }, [branch, instructorId, month]);

  return (
    <div className="academy-owner-shell" dir="rtl">
      {mobileNavOpen && (
        <button
          className="academy-owner-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        className={`academy-owner-sidebar ${mobileNavOpen ? "is-open" : ""}`}
      >
        <div className="academy-owner-brand">
          <span className="academy-owner-mark" aria-hidden="true">
            مدى
          </span>
          <div>
            <strong>مدى</strong>
            <small>نظرة الأكاديمية</small>
          </div>
          <button
            className="academy-owner-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="academy-owner-user">
          <span className="academy-owner-user-avatar">أم</span>
          <span>
            <strong>أحمد محمود</strong>
            <small>رئيس الأكاديمية · معاينة</small>
          </span>
        </div>
        <span className="academy-owner-nav-caption">نطاق الأكاديمية</span>
        <nav className="academy-owner-nav" aria-label="تنقل رئيس الأكاديمية">
          <button
            className="active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <LayoutDashboard size={17} />
            نظرة عامة
          </button>
          <button
            onClick={() => {
              document
                .getElementById("academy-instructor-performance")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
              setMobileNavOpen(false);
            }}
          >
            <BarChart3 size={17} />
            أداء المدربين
          </button>
        </nav>
        <div className="academy-owner-sidebar-spacer" />
        <div className="academy-owner-scope-card">
          <MapPin size={15} />
          <span>
            <small>نطاق العرض</small>
            <strong>{branchLabel}</strong>
          </span>
        </div>
        <button className="academy-owner-back" onClick={() => navigate("/")}>
          <ArrowRight size={15} /> العودة إلى لوحة مدير الفرع
        </button>
        <div className="academy-owner-sidebar-footer">
          نسخة تجريبية · بيانات محلية
        </div>
      </aside>

      <main className="academy-owner-main">
        <header className="academy-owner-topbar">
          <button
            className="academy-owner-menu"
            aria-label="فتح القائمة"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={19} />
          </button>
          <span className="academy-owner-scope-pill">
            <Building2 size={15} /> أكاديمية مدى · {branchLabel}
          </span>
          <span className="academy-owner-demo-pill">
            <i /> نظرة أكاديمية شاملة
          </span>
        </header>

        <div className="academy-owner-content">
          <div className="academy-owner-breadcrumb">
            <span>مساحات الأدوار</span>
            <ChevronLeft size={13} />
            <strong>رئيس الأكاديمية</strong>
          </div>
          <section className="academy-owner-welcome">
            <div>
              <span className="academy-owner-eyebrow">
                <i /> متابعة على مستوى الأكاديمية
              </span>
              <h1>أداء الأكاديمية والمدربين</h1>
              <p>
                مقارنة موحّدة لأداء كل مدرب وفروع الأكاديمية، مع الحفاظ على فصل
                هذه النظرة عن مهام مدير الفرع اليومية.
              </p>
            </div>
            <div className="academy-owner-welcome-meta">
              <span>
                <CalendarIcon /> {monthLabel}
              </span>
              <span>
                <ShieldCheck size={14} /> للعرض فقط
              </span>
            </div>
          </section>

          <div className="academy-owner-demo-banner" role="note">
            <span>DEMO</span>
            بيانات الأداء التوضيحية محلية وغير مرتبطة بسجلات حضور أو تقييمات
            حقيقية.
          </div>

          <section
            className="academy-owner-summary-grid"
            aria-label="ملخص الأكاديمية للشهر المختار"
          >
            <article>
              <span className="owner-summary-icon teal">
                <Users size={17} />
              </span>
              <small>مدربون في العينة</small>
              <strong>{summary.instructors}</strong>
              <span>
                {branchLabel}
                {instructorId !== "all" ? " · مدرب محدد" : ""}
              </span>
            </article>
            <article>
              <span className="owner-summary-icon blue">
                <MapPin size={17} />
              </span>
              <small>فروع ممثلة في النطاق</small>
              <strong>{summary.branches}</strong>
              <span>{ACADEMY_BRANCHES.length} فروع توضيحية متاحة</span>
            </article>
            <article>
              <span className="owner-summary-icon amber">
                <BookOpen size={17} />
              </span>
              <small>حصص الشهر</small>
              <strong>{summary.sessions}</strong>
              <span>{monthLabel}</span>
            </article>
            <article>
              <span className="owner-summary-icon violet">%</span>
              <small>انتظام الحضور</small>
              <strong>{summary.attendance}%</strong>
              <span>متوسط موزون بعدد الحصص</span>
            </article>
          </section>

          <div
            id="academy-instructor-performance"
            className="academy-owner-anchor"
          >
            <InstructorPerformanceComparison
              scope="academy"
              month={month}
              onMonthChange={setMonth}
              selectedBranch={branch}
              onBranchChange={setBranch}
              selectedInstructorId={instructorId}
              onInstructorChange={setInstructorId}
            />
          </div>

          <footer className="academy-owner-footnote">
            <GraduationCap size={16} />
            <p>
              رئيس الأكاديمية يرى مقارنة أداء المدربين عبر فروع مدى. لا تعرض هذه
              الصفحة بيانات مالية أو تسمح بتعديل سجلات الفروع.
            </p>
            <button onClick={() => navigate("/team")}>
              معاينة فريق الفرع <ChevronLeft size={14} />
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}

function CalendarIcon() {
  return <span aria-hidden="true">▦</span>;
}
