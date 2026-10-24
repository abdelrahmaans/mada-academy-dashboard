import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpLeft,
  BookOpen,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/FeedbackStates";
import {
  apiClient,
  type ConsumerAccountLookupRecord,
  type ConsumerInvitationDelivery,
  type ConsumerLinksResponse,
} from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { getRoleDefinition } from "@/lib/roleNavigation";
import type { RoleCode } from "@/contexts/RoleScopeContext";
import {
  type Student,
  type StudentStatus,
  type StudentSource,
  initialStudents,
  branches,
  PAGE_SIZE,
  mapLiveStudent,
  statusLabels,
} from "./StudentsTypes";
import { AddStudentModal, StudentDetailsModal } from "./StudentsModals";

function StudentPage() {
  const [, setLocation] = useLocation();
  const { me } = useAuth();
  const userRoleCode = me?.role ? (me.role.replace(/_.*$/, "") as RoleCode) : undefined;
  const activeRoleCode: RoleCode = userRoleCode || "R02";
  const roleDef = getRoleDefinition(activeRoleCode);
  const branchContext = me?.branchId ? me.branches?.find(b => b.id === me.branchId)?.name : undefined;
  const [students, setStudents] = useState<Student[]>(apiClient.hasSession() ? [] : initialStudents);
  const [dataMode, setDataMode] = useState<"demo" | "live">(apiClient.hasSession() ? "live" : "demo");
  const [dataLoading, setDataLoading] = useState(apiClient.hasSession());
  const [dataError, setDataError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">(
    "all"
  );
  const [branchFilter, setBranchFilter] = useState("كل الفروع");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
  const [consumerLinks, setConsumerLinks] = useState<ConsumerLinksResponse | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [linkPhone, setLinkPhone] = useState("");
  const [lookupResults, setLookupResults] = useState<ConsumerAccountLookupRecord[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationResult, setInvitationResult] = useState<ConsumerInvitationDelivery | null>(null);
  const [linkingAccountId, setLinkingAccountId] = useState<string | null>(null);
  const [linkKind, setLinkKind] = useState<"guardian" | "student">("guardian");
  const [linkRelationship, setLinkRelationship] = useState("ولي أمر");
  const [studentName, setStudentName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [source, setSource] = useState<StudentSource>("walk_in");
  const [newBranch, setNewBranch] = useState("مدينة نصر");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!apiClient.hasSession()) return;
    let cancelled = false;
    setDataLoading(true);
    apiClient.listStudents()
      .then(response => {
        if (cancelled) return;
        setStudents(response.items.map(mapLiveStudent));
        setDataMode("live");
        setDataError(null);
        setPage(1);
      })
      .catch(error => {
        if (cancelled) return;
        setDataMode("live");
        setStudents([]);
        setDataError(error instanceof Error ? error.message : "تعذر الاتصال ببيانات الطلاب");
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setLookupResults(null); setLookupError(null); setLinkPhone("");
    if (dataMode !== "live" || !detailsStudent) { setConsumerLinks(null); setLinksError(null); return; }
    let cancelled = false;
    setLinksLoading(true); setLinksError(null);
    apiClient.studentConsumerLinks(detailsStudent.id)
      .then(result => { if (!cancelled) setConsumerLinks(result); })
      .catch(error => { if (!cancelled) setLinksError(error instanceof Error ? error.message : "تعذر تحميل روابط الحسابات"); })
      .finally(() => { if (!cancelled) setLinksLoading(false); });
    return () => { cancelled = true; };
  }, [dataMode, detailsStudent]);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return students.filter(student => {
      const matchesQuery =
        !needle ||
        [
          student.name,
          student.id,
          student.parentName,
          student.parentPhone,
          student.course,
        ].some(value => value.toLocaleLowerCase("ar").includes(needle));
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const matchesBranch =
        branchFilter === "كل الفروع" || student.branch === branchFilter;
      return matchesQuery && matchesStatus && matchesBranch;
    });
  }, [students, query, statusFilter, branchFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const visibleStudents = filteredStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const branchOptions = dataMode === "live" ? ["كل الفروع", ...Array.from(new Set(students.map(student => student.branch)))] : branches;
  const pausedCount = students.filter(
    student => student.status === "on_hold"
  ).length;
  const monthCount = students.filter(student =>
    student.joined.includes("سبتمبر 2026")
  ).length;

  const resetForm = () => {
    setStudentName("");
    setBirthDate("");
    setGender("male");
    setParentName("");
    setParentPhone("");
    setSource("walk_in");
    setNewBranch("مدينة نصر");
  };

  const submitStudent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dataMode === "live") {
      toast("إضافة الطالب تحتاج endpoint التسجيل", { description: "تم ربط القراءة الحية أولًا؛ لن يتم إيهامك بأن الإضافة حُفظت." });
      return;
    }
    if (
      !studentName.trim() ||
      !birthDate ||
      !parentName.trim() ||
      !parentPhone.trim()
    ) {
      toast.error("أكمل البيانات المطلوبة الأول");
      return;
    }
    const initials = studentName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0])
      .join("");
    const next: Student = {
      id: `MAD-${String(249 + students.length - initialStudents.length).padStart(4, "0")}`,
      name: studentName.trim(),
      birthDate,
      gender,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      relation: "ولي أمر",
      branch: newBranch,
      course: "لم يتم التسجيل في كورس",
      source,
      status: "active",
      joined: "اليوم، سبتمبر 2026",
      initials,
      color: gender === "female" ? "violet" : "teal",
    };
    setStudents(current => [next, ...current]);
    setStatusFilter("all");
    setBranchFilter("كل الفروع");
    setQuery("");
    setPage(1);
    setAddOpen(false);
    resetForm();
    toast.success("اتضاف الطالب بنجاح", {
      description: "تمت الإضافة في بيانات العرض التجريبية فقط.",
    });
  };

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setBranchFilter("كل الفروع");
    setPage(1);
  };

  const searchConsumerAccounts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detailsStudent || !linkPhone.trim()) return;
    setLookupLoading(true); setLookupError(null); setLookupResults(null); setInvitationResult(null);
    try {
      const result = await apiClient.searchConsumerAccounts(detailsStudent.id, linkPhone.trim(), linkKind === "student" ? "student" : "parent");
      setLookupResults(result.items);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "تعذر البحث عن الحساب");
    } finally {
      setLookupLoading(false);
    }
  };

  const inviteConsumerAccount = async () => {
    if (!detailsStudent || !linkPhone.trim()) return;
    setInvitationLoading(true); setLookupError(null); setInvitationResult(null);
    try {
      const result = await apiClient.createConsumerInvitation(detailsStudent.id, {
        phone: linkPhone.trim(),
        accountType: linkKind === "student" ? "student" : "parent",
        relationship: linkKind === "guardian" ? linkRelationship : undefined,
      });
      setInvitationResult(result);
      toast.success("تم إنشاء دعوة الحساب", { description: result.developmentCode ? "رمز الاختبار ظاهر أسفل البحث." : "ستصل الرسالة إذا كان إرسال SMS مفعّلًا في بيئة التشغيل." });
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "تعذر إرسال دعوة الحساب");
    } finally {
      setInvitationLoading(false);
    }
  };

  const linkConsumerAccount = async (account: ConsumerAccountLookupRecord) => {
    if (!detailsStudent) return;
    setLinkingAccountId(account.id);
    try {
      if (account.accountType === "student") await apiClient.linkStudentAccount(detailsStudent.id, account.id);
      else await apiClient.linkGuardian(detailsStudent.id, { userAccountId: account.id, relationship: linkRelationship });
      setConsumerLinks(await apiClient.studentConsumerLinks(detailsStudent.id));
      setLookupResults(null); setLinkPhone("");
      toast.success(account.accountType === "student" ? "تم ربط حساب الطالب" : "تم ربط حساب ولي الأمر");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر ربط الحساب");
    } finally {
      setLinkingAccountId(null);
    }
  };

  const unlinkConsumerAccount = async (kind: "guardian" | "student", accountId: string) => {
    if (!detailsStudent || !window.confirm("هل تريد إزالة هذا الربط؟ سيفقد الحساب وصوله إلى بيانات الطالب عبر بوابته.")) return;
    try {
      if (kind === "student") await apiClient.unlinkStudentAccount(detailsStudent.id);
      else await apiClient.unlinkGuardian(detailsStudent.id, accountId);
      setConsumerLinks(await apiClient.studentConsumerLinks(detailsStudent.id));
      toast.success("تم إلغاء ربط الحساب");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إلغاء الربط");
    }
  };

  return (
    <RoleDashboardShell
      className="app-shell students-shell"
      roleCode={activeRoleCode}
      roleLabel={me?.roleLabel || roleDef.label}
      scopeLevel={roleDef.scopeLevel}
      scopeLabel={roleDef.defaultScopeLabel}
      tenantName={me?.academy?.name}
      branchName={branchContext}
      demo={dataMode === "demo"}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="branch-select-wrap">
              <button
                className={`branch-select ${branchMenuOpen ? "is-open" : ""}`}
                aria-expanded={branchMenuOpen}
                onClick={() => setBranchMenuOpen(open => !open)}
              >
                <span className="branch-icon">
                  <MapPin size={17} />
                </span>
                <span>
                  {branchFilter === "كل الفروع"
                    ? "كل الفروع"
                    : `فرع ${branchFilter}`}
                </span>
                <ChevronDown size={15} />
              </button>
              {branchMenuOpen && (
                <div className="branch-menu">
                  {branches.slice(1).map(branch => (
                    <button
                      key={branch}
                      onClick={() => {
                        setBranchFilter(branch);
                        setBranchMenuOpen(false);
                        setPage(1);
                      }}
                    >
                      <MapPin size={15} />
                      {branch}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setBranchFilter("كل الفروع");
                      setBranchMenuOpen(false);
                      setPage(1);
                    }}
                  >
                    كل الفروع
                  </button>
                </div>
              )}
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                placeholder="ابحث عن طالب أو ولي أمر..."
                aria-label="ابحث عن طالب أو ولي أمر"
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="topbar-left">
            <button
              className="icon-button notification-button"
              aria-label="الإشعارات"
              onClick={() => toast("لا توجد إشعارات جديدة")}
            >
              <span className="notification-dot" />
              <Bell size={18} />
            </button>
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => toast("إعدادات الحساب قيد التجهيز")}
            >
              <span className="profile-copy">
                <strong>أحمد محمود</strong>
                <small>مدير الفرع</small>
              </span>
              <span className="profile-avatar">أم</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="workspace students-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => setLocation("/")}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>الطلاب</span>
          </div>
          <section className="students-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> إدارة قاعدة بيانات الفرع
              </div>
              <h1>الطلاب</h1>
              <p>تابع بيانات الطلاب والتسجيلات وأولياء الأمور من مكان واحد.</p>
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() =>
                  toast("تصدير ملف الطلاب متاح عند ربط البيانات الحقيقية")
                }
              >
                <ArrowDownToLine size={17} /> تصدير القائمة
              </button>
              <button
                className="button button-primary"
                onClick={() => setAddOpen(true)}
              >
                <Plus size={18} /> إضافة طالب
              </button>
            </div>
          </section>

          {dataLoading && <LoadingState label="جارٍ تحميل الطلاب من الـAPI…" compact />}
          {dataError && (
            <ErrorState
              compact
              title="تعذر تحميل الطلاب من الـAPI"
              description={`${dataError} · لم يتم استبدال بيانات الخادم ببيانات تجريبية.`}
            />
          )}


          <section className="student-stats-grid" aria-label="ملخص الطلاب">
            <article className="student-stat">
              <span className="student-stat-icon icon-teal">
                <Users size={18} />
              </span>
              <span className="student-stat-label">إجمالي الطلاب</span>
              <div>
                <strong>{students.length}</strong>
                <span>طالب مسجل</span>
              </div>
              <small>
                <ArrowUpLeft size={13} /> 12 طالب جديد الشهر ده
              </small>
            </article>
            <article className="student-stat">
              <span className="student-stat-icon icon-blue">
                <CheckCircle2 size={18} />
              </span>
              <span className="student-stat-label">طلاب نشطون</span>
              <div>
                <strong>
                  {
                    students.filter(student => student.status === "active")
                      .length
                  }
                </strong>
                <span>طالب</span>
              </div>
              <small className="stat-neutral">في كورس أو مجموعة حاليًا</small>
            </article>
            <article className="student-stat">
              <span className="student-stat-icon icon-amber">
                <UserPlus size={18} />
              </span>
              <span className="student-stat-label">تسجيلات الشهر</span>
              <div>
                <strong>
                  {String(Math.max(14, monthCount)).padStart(2, "0")}
                </strong>
                <span>تسجيل جديد</span>
              </div>
              <small>
                <ArrowUpLeft size={13} /> مقارنة بالشهر الماضي
              </small>
            </article>
            <article className="student-stat">
              <span className="student-stat-icon icon-violet">
                <Clock3 size={18} />
              </span>
              <span className="student-stat-label">موقوفون مؤقتًا</span>
              <div>
                <strong>{String(pausedCount).padStart(2, "0")}</strong>
                <span>طلاب</span>
              </div>
              <small className="stat-neutral">يحتاجون متابعة من الفرع</small>
            </article>
          </section>

          <section className="panel students-panel">
            <div className="students-panel-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-teal">
                  <Users size={18} />
                </span>
                <div>
                  <h2>قائمة الطلاب</h2>
                  <p>{filteredStudents.length} سجل معروض من {dataMode === "live" ? "الـAPI الحقيقي" : "بيانات العينة"}</p>
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
                    count: students.filter(
                      student => student.status === "active"
                    ).length,
                  },
                  { key: "on_hold", label: "موقوف مؤقتًا", count: pausedCount },
                  {
                    key: "graduated",
                    label: "متخرج",
                    count: students.filter(
                      student => student.status === "graduated"
                    ).length,
                  },
                ].map(item => (
                  <button
                    key={item.key}
                    className={
                      statusFilter === item.key
                        ? "filter-tab active"
                        : "filter-tab"
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
                  onClick={() =>
                    toast("استخدم البحث والحالة والفرع لتصفية القائمة")
                  }
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
                      : Math.max(1, Math.floor((Date.now() - birthTime) / 31557600000));
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
                          <span className="student-age">{age === null ? "—" : `${age} سنة`}</span>
                        </td>
                        <td data-label="الفرع">
                          <span className="student-branch">
                            <MapPin size={13} />
                            {student.branch}
                          </span>
                        </td>
                        <td data-label="الحالة">
                          <span
                            className={`student-status status-${student.status}`}
                          >
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
                  {visibleStudents.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
                  {Math.min(page * PAGE_SIZE, filteredStudents.length)}
                </b>{" "}
                من <b>{filteredStudents.length}</b> نتيجة{" "}
                <small>· {dataMode === "live" ? "سجلات حقيقية" : "سجلات تجريبية"}</small>
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
          <div className="students-demo-note">
            <FileText size={14} />
            <span>
              {dataMode === "live"
                ? "الطلاب المعروضون من قاعدة البيانات. بيانات ولي الأمر والكورس التفصيلي ستضاف مع عقود التسجيل والأسرة القادمة."
                : "بيانات الطلاب المعروضة تجريبية ومبنية على حقول الـSchema؛ لا يتم حفظها في قاعدة بيانات."}
            </span>
          </div>
          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>{dataMode === "live" ? "واجهة تشغيلية — بيانات الخادم" : "واجهة تجريبية — إصدار 0.1"}</span>
          </footer>
        </div>
      </main>

      <AddStudentModal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          resetForm();
        }}
        studentName={studentName}
        setStudentName={setStudentName}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
        gender={gender}
        setGender={setGender}
        parentName={parentName}
        setParentName={setParentName}
        parentPhone={parentPhone}
        setParentPhone={setParentPhone}
        newBranch={newBranch}
        setNewBranch={setNewBranch}
        source={source}
        setSource={setSource}
        onSubmit={submitStudent}
        branches={branches}
      />

      <StudentDetailsModal
        detailsStudent={detailsStudent}
        onClose={() => setDetailsStudent(null)}
        dataMode={dataMode}
        consumerLinks={consumerLinks}
        linksLoading={linksLoading}
        linksError={linksError}
        linkKind={linkKind}
        setLinkKind={setLinkKind}
        linkPhone={linkPhone}
        setLinkPhone={setLinkPhone}
        linkRelationship={linkRelationship}
        setLinkRelationship={setLinkRelationship}
        lookupLoading={lookupLoading}
        lookupResults={lookupResults}
        setLookupResults={setLookupResults}
        lookupError={lookupError}
        setLookupError={setLookupError}
        invitationLoading={invitationLoading}
        invitationResult={invitationResult}
        setInvitationResult={setInvitationResult}
        linkingAccountId={linkingAccountId}
        onSearchConsumerAccounts={searchConsumerAccounts}
        onLinkConsumerAccount={linkConsumerAccount}
        onUnlinkConsumerAccount={unlinkConsumerAccount}
        onInviteConsumerAccount={inviteConsumerAccount}
        onNavigateSchedule={() => setLocation("/schedule")}
        onNavigateFinance={() => setLocation("/finance")}
      />
    </RoleDashboardShell>
  );
}

export default StudentPage;
