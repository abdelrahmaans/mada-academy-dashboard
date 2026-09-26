import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpLeft,
  BookOpen,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type StudentStatus = "active" | "on_hold" | "inactive" | "graduated";
type StudentSource = "walk_in" | "landing_page" | "referral" | "social_media" | "event";
type Student = {
  id: string;
  name: string;
  birthDate: string;
  gender: "male" | "female";
  parentName: string;
  parentPhone: string;
  relation: "الأب" | "الأم" | "ولي أمر";
  branch: string;
  course: string;
  source: StudentSource;
  status: StudentStatus;
  joined: string;
  initials: string;
  color: string;
};

const initialStudents: Student[] = [
  { id: "MAD-0248", name: "ياسين محمد علي", birthDate: "2015-05-12", gender: "male", parentName: "محمد علي", parentPhone: "01012345678", relation: "الأب", branch: "مدينة نصر", course: "روبوتكس مستوى 2", source: "landing_page", status: "active", joined: "12 سبتمبر 2026", initials: "يع", color: "teal" },
  { id: "MAD-0247", name: "ليلى أحمد محمود", birthDate: "2014-11-03", gender: "female", parentName: "أحمد محمود", parentPhone: "01123456789", relation: "الأب", branch: "المعادي", course: "برمجة للمبتدئين", source: "referral", status: "active", joined: "10 سبتمبر 2026", initials: "لم", color: "violet" },
  { id: "MAD-0246", name: "عمر خالد إبراهيم", birthDate: "2013-02-18", gender: "male", parentName: "نهى إبراهيم", parentPhone: "01234567890", relation: "الأم", branch: "مدينة نصر", course: "دوائر إلكترونية", source: "walk_in", status: "active", joined: "08 سبتمبر 2026", initials: "عإ", color: "blue" },
  { id: "MAD-0245", name: "ملك حسام الدين", birthDate: "2016-08-24", gender: "female", parentName: "حسام الدين", parentPhone: "01098765432", relation: "الأب", branch: "الشيخ زايد", course: "روبوتكس مستوى 1", source: "social_media", status: "on_hold", joined: "04 سبتمبر 2026", initials: "مح", color: "amber" },
  { id: "MAD-0244", name: "آدم شريف حسن", birthDate: "2012-01-30", gender: "male", parentName: "شريف حسن", parentPhone: "01109876543", relation: "الأب", branch: "مدينة نصر", course: "ذكاء اصطناعي للصغار", source: "event", status: "active", joined: "01 سبتمبر 2026", initials: "آح", color: "navy" },
  { id: "MAD-0243", name: "نور عمرو فؤاد", birthDate: "2015-07-17", gender: "female", parentName: "عمرو فؤاد", parentPhone: "01210987654", relation: "الأب", branch: "المعادي", course: "برمجة الألعاب", source: "landing_page", status: "inactive", joined: "28 أغسطس 2026", initials: "نف", color: "rose" },
  { id: "MAD-0242", name: "سيف مصطفى عادل", birthDate: "2011-10-06", gender: "male", parentName: "مصطفى عادل", parentPhone: "01087654321", relation: "الأب", branch: "الشيخ زايد", course: "الدوائر والروبوتات", source: "referral", status: "active", joined: "25 أغسطس 2026", initials: "سع", color: "teal" },
  { id: "MAD-0241", name: "جنى طارق سعيد", birthDate: "2014-04-09", gender: "female", parentName: "طارق سعيد", parentPhone: "01187654320", relation: "الأب", branch: "مدينة نصر", course: "مهارات التفكير الإبداعي", source: "walk_in", status: "graduated", joined: "20 أغسطس 2026", initials: "جس", color: "violet" },
];

const statusLabels: Record<StudentStatus, string> = {
  active: "نشط",
  on_hold: "موقوف مؤقتًا",
  inactive: "غير نشط",
  graduated: "متخرج",
};
const sourceLabels: Record<StudentSource, string> = {
  walk_in: "زيارة مباشرة",
  landing_page: "صفحة الأكاديمية",
  referral: "ترشيح",
  social_media: "سوشيال ميديا",
  event: "فعالية",
};
const branches = ["كل الفروع", "مدينة نصر", "المعادي", "الشيخ زايد"];
const PAGE_SIZE = 6;

function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="مدى">
      <span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M4 12.5 12.5 8l8.2 4.5v9.4l-8.2 4.6L4 21.9v-9.4Z" fill="currentColor" /><path d="m19.3 12.5 8.2-4.5 8.5 4.5v9.4l-8.5 4.6-8.2-4.6v-9.4Z" fill="currentColor" opacity=".72" /><path d="m11.5 24.1 8.3-4.6 8.2 4.6v8.2l-8.2 4.4-8.3-4.4v-8.2Z" fill="currentColor" opacity=".48" /></svg></span>
      <span className="brand-word">مدى</span>
    </div>
  );
}

function StudentPage() {
  const [, setLocation] = useLocation();
  const [students, setStudents] = useState(initialStudents);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const [branchFilter, setBranchFilter] = useState("كل الفروع");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [source, setSource] = useState<StudentSource>("walk_in");
  const [newBranch, setNewBranch] = useState("مدينة نصر");
  const [page, setPage] = useState(1);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return students.filter((student) => {
      const matchesQuery = !needle || [student.name, student.id, student.parentName, student.parentPhone, student.course].some((value) => value.toLocaleLowerCase("ar").includes(needle));
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      const matchesBranch = branchFilter === "كل الفروع" || student.branch === branchFilter;
      return matchesQuery && matchesStatus && matchesBranch;
    });
  }, [students, query, statusFilter, branchFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const visibleStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pausedCount = students.filter((student) => student.status === "on_hold").length;
  const monthCount = students.filter((student) => student.joined.includes("سبتمبر 2026")).length;

  const comingSoon = (feature: string) => {
    toast("القسم قيد التجهيز", { description: `هنبدأ في تطوير «${feature}» في المرحلة التالية.` });
    setMobileNavOpen(false);
  };

  const resetForm = () => {
    setStudentName(""); setBirthDate(""); setGender("male"); setParentName(""); setParentPhone(""); setSource("walk_in"); setNewBranch("مدينة نصر");
  };

  const submitStudent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentName.trim() || !birthDate || !parentName.trim() || !parentPhone.trim()) {
      toast.error("أكمل البيانات المطلوبة الأول");
      return;
    }
    const initials = studentName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
    const next: Student = {
      id: `MAD-${String(249 + students.length - initialStudents.length).padStart(4, "0")}`,
      name: studentName.trim(), birthDate, gender, parentName: parentName.trim(), parentPhone: parentPhone.trim(),
      relation: "ولي أمر", branch: newBranch, course: "لم يتم التسجيل في كورس", source, status: "active", joined: "اليوم، سبتمبر 2026", initials,
      color: gender === "female" ? "violet" : "teal",
    };
    setStudents((current) => [next, ...current]);
    setStatusFilter("all"); setBranchFilter("كل الفروع"); setQuery(""); setPage(1); setAddOpen(false); resetForm();
    toast.success("اتضاف الطالب بنجاح", { description: "تمت الإضافة في بيانات العرض التجريبية فقط." });
  };

  const clearFilters = () => { setQuery(""); setStatusFilter("all"); setBranchFilter("كل الفروع"); setPage(1); };

  return (
    <div className="app-shell" dir="rtl">
      {mobileNavOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><BrandMark /><button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={() => setMobileNavOpen(false)}><X size={19} /></button></div>
        <div className="academy-switcher"><span className="academy-avatar"><GraduationCap size={20} /></span><span className="academy-meta"><strong>أكاديمية مدى</strong><small>إدارة الأكاديمية</small></span><ChevronDown size={15} className="switcher-chevron" /></div>
        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="primary-nav" aria-label="القائمة الرئيسية">
          <button className="nav-link" onClick={() => setLocation("/")}><LayoutDashboard size={19} /><span>الرئيسية</span></button>
          <button className="nav-link active" aria-current="page"><Users size={19} /><span>الطلاب</span><span className="nav-count">{248 + students.length - initialStudents.length}</span></button>
          <button className="nav-link" onClick={() => setLocation("/schedule")}><CalendarDays size={19} /><span>الجدول</span></button>
          <button className="nav-link" onClick={() => comingSoon("الحصص والكورسات")}><BookOpen size={19} /><span>الحصص والكورسات</span></button>
          <button className="nav-link" onClick={() => comingSoon("المسابقات")}><Sparkles size={19} /><span>المسابقات</span></button>
        </nav>
        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link" onClick={() => comingSoon("المالية والتحصيل")}><Wallet size={19} /><span>المالية والتحصيل</span></button>
          <button className="nav-link" onClick={() => comingSoon("التقارير والتحليلات")}><Activity size={19} /><span>التقارير والتحليلات</span></button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>محتاج مساعدة؟</strong><span>مركز الدعم والإرشادات</span></div><ChevronLeft size={16} /></div>
        <div className="sidebar-bottom"><button className="nav-link" onClick={() => comingSoon("الإعدادات")}><Settings size={19} /><span>الإعدادات</span></button><button className="nav-link" onClick={() => toast("تسجيل الخروج التجريبي")}><LogOut size={19} /><span>تسجيل الخروج</span></button></div>
        <div className="sidebar-version">مدى لإدارة الأكاديميات <span>نسخة تجريبية</span></div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
            <div className="branch-select-wrap">
              <button className={`branch-select ${branchMenuOpen ? "is-open" : ""}`} aria-expanded={branchMenuOpen} onClick={() => setBranchMenuOpen((open) => !open)}><span className="branch-icon"><MapPin size={17} /></span><span>{branchFilter === "كل الفروع" ? "كل الفروع" : `فرع ${branchFilter}`}</span><ChevronDown size={15} /></button>
              {branchMenuOpen && <div className="branch-menu">{branches.slice(1).map((branch) => <button key={branch} onClick={() => { setBranchFilter(branch); setBranchMenuOpen(false); setPage(1); }}><MapPin size={15} />{branch}</button>)}<button onClick={() => { setBranchFilter("كل الفروع"); setBranchMenuOpen(false); setPage(1); }}>كل الفروع</button></div>}
            </div>
            <label className="top-search"><Search size={18} /><input placeholder="ابحث عن طالب أو ولي أمر..." aria-label="ابحث عن طالب أو ولي أمر" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><kbd>⌘ K</kbd></label>
          </div>
          <div className="topbar-left"><button className="icon-button notification-button" aria-label="الإشعارات" onClick={() => toast("لا توجد إشعارات جديدة")}><span className="notification-dot" /><Bell size={18} /></button><span className="topbar-divider" /><button className="profile-button" onClick={() => toast("إعدادات الحساب قيد التجهيز")}><span className="profile-copy"><strong>أحمد محمود</strong><small>مدير الفرع</small></span><span className="profile-avatar">أم</span><ChevronDown size={14} /></button></div>
        </header>

        <div className="workspace students-workspace">
          <div className="students-breadcrumb"><button onClick={() => setLocation("/")}>الرئيسية</button><ChevronLeft size={13} /><span>الطلاب</span></div>
          <section className="students-welcome">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> إدارة قاعدة بيانات الفرع</div><h1>الطلاب</h1><p>تابع بيانات الطلاب والتسجيلات وأولياء الأمور من مكان واحد.</p></div>
            <div className="welcome-actions"><button className="button button-secondary" onClick={() => toast("تصدير ملف الطلاب متاح عند ربط البيانات الحقيقية") }><ArrowDownToLine size={17} /> تصدير القائمة</button><button className="button button-primary" onClick={() => setAddOpen(true)}><Plus size={18} /> إضافة طالب</button></div>
          </section>

          <section className="student-stats-grid" aria-label="ملخص الطلاب">
            <article className="student-stat"><span className="student-stat-icon icon-teal"><Users size={18} /></span><span className="student-stat-label">إجمالي الطلاب</span><div><strong>248</strong><span>طالب مسجل</span></div><small><ArrowUpLeft size={13} /> 12 طالب جديد الشهر ده</small></article>
            <article className="student-stat"><span className="student-stat-icon icon-blue"><CheckCircle2 size={18} /></span><span className="student-stat-label">طلاب نشطون</span><div><strong>218</strong><span>طالب</span></div><small className="stat-neutral">في كورس أو مجموعة حاليًا</small></article>
            <article className="student-stat"><span className="student-stat-icon icon-amber"><UserPlus size={18} /></span><span className="student-stat-label">تسجيلات الشهر</span><div><strong>{String(Math.max(14, monthCount)).padStart(2, "0")}</strong><span>تسجيل جديد</span></div><small><ArrowUpLeft size={13} /> مقارنة بالشهر الماضي</small></article>
            <article className="student-stat"><span className="student-stat-icon icon-violet"><Clock3 size={18} /></span><span className="student-stat-label">موقوفون مؤقتًا</span><div><strong>06</strong><span>طلاب</span></div><small className="stat-neutral">يحتاجون متابعة من الفرع</small></article>
          </section>

          <section className="panel students-panel">
            <div className="students-panel-heading">
              <div className="panel-title-group"><span className="panel-icon panel-icon-teal"><Users size={18} /></span><div><h2>قائمة الطلاب</h2><p>{filteredStudents.length} سجل معروض من بيانات العينة</p></div></div>
              <button className="students-more" aria-label="المزيد" onClick={() => toast("خيارات القائمة قيد التجهيز")}><MoreHorizontal size={20} /></button>
            </div>
            <div className="student-toolbar">
              <div className="student-filter-tabs" role="group" aria-label="فلترة حسب الحالة">
                {[{ key: "all", label: "الكل", count: students.length }, { key: "active", label: "نشط", count: students.filter((student) => student.status === "active").length }, { key: "on_hold", label: "موقوف مؤقتًا", count: pausedCount }, { key: "graduated", label: "متخرج", count: students.filter((student) => student.status === "graduated").length }].map((item) => (
                  <button key={item.key} className={statusFilter === item.key ? "filter-tab active" : "filter-tab"} onClick={() => { setStatusFilter(item.key as StudentStatus | "all"); setPage(1); }}>{item.label}<span>{String(item.count).padStart(2, "0")}</span></button>
                ))}
              </div>
              <div className="student-toolbar-actions">
                <label className="table-search"><Search size={16} /><input placeholder="ابحث بالاسم أو رقم الطالب..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><kbd>/</kbd></label>
                <label className="branch-filter"><MapPin size={14} /><select value={branchFilter} onChange={(event) => { setBranchFilter(event.target.value); setPage(1); }} aria-label="اختيار الفرع">{branches.map((branch) => <option key={branch}>{branch}</option>)}</select><ChevronDown size={13} /></label>
                <button className="filter-button" onClick={() => toast("استخدم البحث والحالة والفرع لتصفية القائمة") }><Filter size={15} /><span>تصفية</span></button>
              </div>
            </div>

            <div className="students-table-wrap">
              <table className="students-table">
                <thead><tr><th>الطالب</th><th>الكورس الحالي</th><th>ولي الأمر</th><th>العمر</th><th>الفرع</th><th>الحالة</th><th>تاريخ التسجيل</th><th aria-label="التفاصيل" /></tr></thead>
                <tbody>
                  {visibleStudents.map((student) => {
                    const age = Math.max(1, Math.floor((Date.now() - new Date(student.birthDate).getTime()) / 31557600000));
                    return <tr key={student.id}>
                      <td data-label="الطالب"><button className="student-identity" onClick={() => setDetailsStudent(student)}><span className={`student-avatar avatar-${student.color}`}>{student.initials}</span><span><strong>{student.name}</strong><small>{student.id}</small></span></button></td>
                      <td data-label="الكورس الحالي"><span className="student-course"><BookOpen size={14} />{student.course}</span></td>
                      <td data-label="ولي الأمر"><span className="guardian-cell"><strong>{student.parentName}</strong><small>{student.relation} · <b dir="ltr">{student.parentPhone}</b></small></span></td>
                      <td data-label="العمر"><span className="student-age">{age} سنة</span></td>
                      <td data-label="الفرع"><span className="student-branch"><MapPin size={13} />{student.branch}</span></td>
                      <td data-label="الحالة"><span className={`student-status status-${student.status}`}><i />{statusLabels[student.status]}</span></td>
                      <td data-label="تاريخ التسجيل"><span className="joined-date">{student.joined}</span></td>
                      <td data-label="التفاصيل"><button className="student-row-more" aria-label={`عرض ملف ${student.name}`} onClick={() => setDetailsStudent(student)}><ChevronLeft size={17} /></button></td>
                    </tr>;
                  })}
                  {visibleStudents.length === 0 && <tr><td colSpan={8}><div className="students-empty"><span className="empty-search-icon"><Search size={20} /></span><strong>ملقيناش نتائج مطابقة</strong><small>جرّب تغير البحث أو الفلاتر عشان تظهر سجلات تانية.</small><button className="text-link" onClick={clearFilters}>مسح الفلاتر <X size={13} /></button></div></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="students-table-footer"><span>عرض <b>{visibleStudents.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filteredStudents.length)}</b> من <b>{filteredStudents.length}</b> نتيجة <small>· سجلات تجريبية</small></span><div className="pagination"><button aria-label="الصفحة السابقة" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronRight size={15} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} className={pageNumber === page ? "current-page" : ""} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}<button aria-label="الصفحة التالية" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}><ChevronLeft size={15} /></button></div></div>
          </section>
          <div className="students-demo-note"><FileText size={14} /><span>بيانات الطلاب المعروضة تجريبية ومبنية على حقول الـSchema؛ لا يتم حفظها في قاعدة بيانات.</span></div>
          <footer className="workspace-footer"><span>© مدى 2026</span><span>واجهة تجريبية — إصدار 0.1</span></footer>
        </div>
      </main>

      {addOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setAddOpen(false); resetForm(); } }}><section className="student-dialog students-form-dialog" role="dialog" aria-modal="true" aria-labelledby="add-student-title"><div className="dialog-top"><span className="dialog-mark"><GraduationCap size={21} /></span><button className="icon-button" aria-label="إغلاق" onClick={() => { setAddOpen(false); resetForm(); }}><X size={18} /></button></div><h2 id="add-student-title">إضافة طالب جديد</h2><p>أدخل بيانات الطالب وولي الأمر لبدء التسجيل في الفرع.</p><form onSubmit={submitStudent}>
        <label className="form-field"><span>اسم الطالب <b>*</b></span><input autoFocus value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="الاسم بالكامل" /></label>
        <div className="form-row"><label className="form-field"><span>تاريخ الميلاد <b>*</b></span><input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label><label className="form-field"><span>النوع</span><select value={gender} onChange={(event) => setGender(event.target.value as "male" | "female")}><option value="male">ذكر</option><option value="female">أنثى</option></select></label></div>
        <div className="form-row"><label className="form-field"><span>اسم ولي الأمر <b>*</b></span><input value={parentName} onChange={(event) => setParentName(event.target.value)} placeholder="اسم ولي الأمر" /></label><label className="form-field"><span>رقم الهاتف <b>*</b></span><input value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" dir="ltr" /></label></div>
        <div className="form-row"><label className="form-field"><span>الفرع</span><select value={newBranch} onChange={(event) => setNewBranch(event.target.value)}>{branches.slice(1).map((branch) => <option key={branch}>{branch}</option>)}</select></label><label className="form-field"><span>مصدر التسجيل</span><select value={source} onChange={(event) => setSource(event.target.value as StudentSource)}>{Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
        <div className="dialog-info"><FileText size={15} /><span>بيانات النموذج محلية للعرض فقط، ولن تُحفظ في قاعدة بيانات.</span></div><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => { setAddOpen(false); resetForm(); }}>إلغاء</button><button type="submit" className="button button-primary"><Plus size={16} /> إضافة الطالب</button></div>
      </form></section></div>}

      {detailsStudent && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsStudent(null); }}><section className="student-dialog student-details-dialog" role="dialog" aria-modal="true" aria-labelledby="student-detail-name"><div className="dialog-top"><span className="dialog-mark"><Users size={20} /></span><button className="icon-button" aria-label="إغلاق" onClick={() => setDetailsStudent(null)}><X size={18} /></button></div><div className="detail-profile"><span className={`student-avatar avatar-${detailsStudent.color}`}>{detailsStudent.initials}</span><div><h2 id="student-detail-name">{detailsStudent.name}</h2><span>{detailsStudent.id} <i /> <span className={`student-status status-${detailsStudent.status}`}><i />{statusLabels[detailsStudent.status]}</span></span></div></div><div className="detail-grid"><div><small>الكورس الحالي</small><strong><BookOpen size={14} />{detailsStudent.course}</strong></div><div><small>الفرع</small><strong><MapPin size={14} />{detailsStudent.branch}</strong></div><div><small>ولي الأمر</small><strong>{detailsStudent.parentName} ({detailsStudent.relation})</strong></div><div><small>هاتف ولي الأمر</small><strong dir="ltr">{detailsStudent.parentPhone}</strong></div><div><small>تاريخ الميلاد</small><strong dir="ltr">{detailsStudent.birthDate}</strong></div><div><small>مصدر التسجيل</small><strong>{sourceLabels[detailsStudent.source]}</strong></div></div><div className="dialog-info"><FileText size={15} /><span>تفاصيل توضيحية للعرض، غير مرتبطة بملف طالب حقيقي.</span></div><div className="dialog-actions"><button className="button button-secondary" onClick={() => setDetailsStudent(null)}>إغلاق</button><button className="button button-primary" onClick={() => toast("تعديل بيانات الطالب قيد التجهيز")}><FileText size={15} /> تعديل البيانات</button></div></section></div>}
    </div>
  );
}

export default StudentPage;
