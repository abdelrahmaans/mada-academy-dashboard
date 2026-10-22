import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  MessageCircle,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Snowflake,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  freezeStorage,
  shiftStorage,
  waitlistStorage,
  type ConvertLeadInput,
  type CreateLeadInput,
  type DirectStudentInput,
  type LeadRecord,
  type SchedulingGroupRecord,
  type StudentRecord,
  type SubscriptionFreezeRequest,
} from "@/lib/apiClient";
import "./SecretaryDeskLive.css";

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم بالحجز",
  REGISTERED: "مسجل رسميًا",
  WAITLISTED: "قائمة انتظار",
  ARCHIVED: "مؤرشف",
};

const CHANNEL_LABELS: Record<string, string> = {
  WALK_IN: "زيارة مباشرة",
  WHATSAPP: "واتساب",
  PHONE: "اتصال هاتفي",
  FACEBOOK: "فيسبوك",
  INSTAGRAM: "إنستغرام",
};

export default function SecretaryDeskLive() {
  const { me } = useAuth();

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [groups, setGroups] = useState<SchedulingGroupRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeTab, setActiveTab] = useState<"pipeline" | "registration" | "followups" | "freezes" | "shifts">("pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as
        | "pipeline"
        | "registration"
        | "followups"
        | "freezes"
        | "shifts";
      const validTabs = ["pipeline", "registration", "followups", "freezes", "shifts"];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const selectTab = (tab: "pipeline" | "registration" | "followups" | "freezes" | "shifts") => {
    setActiveTab(tab);
    window.location.hash = tab === "pipeline" ? "" : tab;
  };

  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeFormData, setFreezeFormData] = useState({
    studentId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "MEDICAL" as const,
    reasonText: "",
  });

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftFormData, setShiftFormData] = useState({
    shiftName: "MORNING" as const,
    cashAmount: "",
    electronicAmount: "",
    totalReceiptsCount: "",
    notes: "",
  });

  // Modal states
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<CreateLeadInput>({
    childName: "",
    parentName: "",
    phone: "",
    channel: "WALK_IN",
    notes: "",
    courseOfferingId: "",
  });

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<LeadRecord | null>(null);
  const [convertData, setConvertData] = useState<ConvertLeadInput>({
    courseOfferingId: "",
    discountPercent: 0,
    createInvoice: true,
  });

  // Direct registration state
  const [directRegistration, setDirectRegistration] = useState<DirectStudentInput>({
    fullName: "",
    phone: "",
    courseOfferingId: "",
    discountPercent: 0,
    createInvoice: true,
  });

  const [serverFreezes, setServerFreezes] = useState<SubscriptionFreezeRequest[]>([]);

  const branchName =
    me?.branches?.find(branch => branch.id === me?.branchId)?.name ??
    me?.branches?.[0]?.name ??
    "فرع الأكاديمية";

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([
      apiClient.listLeads(),
      apiClient.listSchedulingGroups(),
      apiClient.listStudents(),
      apiClient.freezeRequests(),
    ]).then(([leadsRes, groupsRes, studentsRes, freezesRes]) => {
      if (!active) return;
      if (leadsRes.status === "fulfilled") setLeads(leadsRes.value.items);
      if (groupsRes.status === "fulfilled") setGroups(groupsRes.value.items);
      if (studentsRes.status === "fulfilled") setStudents(studentsRes.value.items);
      if (freezesRes.status === "fulfilled") setServerFreezes(freezesRes.value);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const handleCreateLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!newLead.childName.trim() || !newLead.parentName.trim() || !newLead.phone.trim()) {
      toast.error("يرجى كتابة اسم الطفل واسم ولي الأمر ورقم الهاتف");
      return;
    }

    try {
      await apiClient.createLead({
        ...newLead,
        courseOfferingId: newLead.courseOfferingId || undefined,
      });
      toast.success("تم تسجيل طلب الاستفسار والعميل المحتمل بنجاح");
      setNewLeadModalOpen(false);
      setNewLead({
        childName: "",
        parentName: "",
        phone: "",
        channel: "WALK_IN",
        notes: "",
        courseOfferingId: "",
      });
      setRefreshKey(v => v + 1);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر حفظ العميل المحتمل");
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      await apiClient.updateLeadStatus(id, nextStatus);
      setLeads(current =>
        current.map(item => (item.id === id ? { ...item, status: nextStatus as LeadRecord["status"] } : item))
      );
      toast.success(`تم تحديث حالة المتابعة إلى: ${STATUS_LABELS[nextStatus] || nextStatus}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تحديث الحالة");
    }
  };

  const handleConvertLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!convertingLead) return;

    try {
      const result = await apiClient.convertLead(convertingLead.id, {
        courseOfferingId: convertData.courseOfferingId || undefined,
        discountPercent: Number(convertData.discountPercent) || 0,
        createInvoice: convertData.createInvoice,
        joinWaitlistIfFull: true,
      });

      if (result.enrollmentStatus === "WAITLISTED") {
        const matchedGrp = groups.find(g => g.id === convertData.courseOfferingId);
        waitlistStorage.addEntry({
          studentId: result.studentId,
          studentName: result.studentName,
          parentName: convertingLead.parentName || "ولي الأمر",
          phone: convertingLead.phone || "",
          groupId: convertData.courseOfferingId || "",
          courseName: matchedGrp?.courseName || "كورس الأكاديمية",
          branchName: matchedGrp?.branchName || branchName,
          notes: `تحويل من استفسار (${convertingLead.childName}) - إدراج بالانتظار لاكتمال المقاعد.`,
        });
      }

      toast.success(result.enrollmentStatus === "WAITLISTED" ? `تمت إضافة ${result.studentName} إلى قائمة الانتظار` : `تم تحويل ${result.studentName} إلى طالب مسجل بنجاح!`, {
        description: result.invoiceNumber ? `رقم الفاتورة الصادرة: ${result.invoiceNumber}` : result.enrollmentStatus === "WAITLISTED" ? "سيتم تفعيل التسجيل عند توفر مكان في الجروب." : undefined,
      });
      setConvertModalOpen(false);
      setConvertingLead(null);
      setRefreshKey(v => v + 1);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر إتمام التحويل");
    }
  };

  const handleDirectRegistration = async (event: FormEvent) => {
    event.preventDefault();
    if (!directRegistration.fullName.trim()) {
      toast.error("يرجى كتابة اسم الطالب رباعيًا");
      return;
    }

    try {
      const result = await apiClient.registerStudent({
        ...directRegistration,
        courseOfferingId: directRegistration.courseOfferingId || undefined,
        discountPercent: Number(directRegistration.discountPercent) || 0,
        joinWaitlistIfFull: true,
      });

      if (result.enrollmentStatus === "WAITLISTED") {
        const matchedGrp = groups.find(g => g.id === directRegistration.courseOfferingId);
        waitlistStorage.addEntry({
          studentId: result.studentId,
          studentName: result.studentName,
          parentName: directRegistration.fullName.split(" ").slice(1).join(" ") || "ولي الأمر",
          phone: directRegistration.phone || "",
          groupId: directRegistration.courseOfferingId || "",
          courseName: matchedGrp?.courseName || "كورس الأكاديمية",
          branchName: matchedGrp?.branchName || branchName,
          notes: "تسجيل مكتبي فوري - أدرج في قائمة الانتظار لاكتمال مقاعد المجموعة.",
        });
        toast.success(`تم إدراج الطالب ${result.studentName} في قائمة الانتظار بنجاح!`, {
          description: "المجموعة مكتملة السعة. تم حجز أسبقية للطالب وسيتم إشعاره فور توفر مقعد شاغر.",
        });
      } else {
        toast.success(`تم تسجيل الطالب ${result.studentName} بنجاح!`, {
          description: result.invoiceNumber ? `صدرت الفاتورة برقم: ${result.invoiceNumber}` : undefined,
        });
      }

      setDirectRegistration({
        fullName: "",
        phone: "",
        courseOfferingId: "",
        discountPercent: 0,
        createInvoice: true,
      });
      setRefreshKey(v => v + 1);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تسجيل الطالب");
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(item => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const text = `${item.childName} ${item.parentName} ${item.phone} ${item.notes ?? ""}`.toLowerCase();
      const matchesQuery = !searchQuery.trim() || text.includes(searchQuery.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [leads, statusFilter, searchQuery]);

  const activeLeadsCount = leads.filter(l => ["NEW", "CONTACTED", "INTERESTED"].includes(l.status)).length;
  const newLeadsCount = leads.filter(l => l.status === "NEW").length;
  const registeredCount = leads.filter(l => l.status === "REGISTERED").length;

  return (
    <RoleDashboardShell
      className="app-shell secretary-live-shell"
      roleCode="R05"
      roleLabel={me?.roleLabel ?? "السكرتارية والاستقبال"}
      scopeLevel="branch"
      scopeLabel={`فرع ${branchName}`}
      tenantName={me?.academy?.name}
      branchName={branchName}
      demo={false}
    >
      <main className="secretary-live-workspace" dir="rtl">
        <PageHeader
          className="secretary-live-welcome"
          copyClassName="secretary-live-copy"
          actionsClassName="secretary-live-actions"
          eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> مكتب الاستقبال والسكرتارية · بيانات حية مباشرة</span>}
          title="صندوق الاستفسارات ومسار التسجيل"
          description={`إدارة طلبات الالتحاق، ومتابعات أولياء الأمور، وتسجيل الطلاب الجدد في ${branchName} مباشرة في قاعدة البيانات.`}
          actions={
            <div className="secretary-top-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setRefreshKey(v => v + 1)}
                disabled={loading}
              >
                <RefreshCw size={15} /> تحديث
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setNewLeadModalOpen(true)}
              >
                <Plus size={16} /> استفسار جديد
              </button>
            </div>
          }
        />

        <RoleScopeCard className="secretary-scope-card" />

        {/* Live KPI Metric Cards */}
        <section className="secretary-stats-grid" aria-label="مؤشرات الاستقبال والتسجيل">
          <article className="secretary-stat-card stat-teal">
            <span className="stat-icon"><Sparkles size={20} /></span>
            <div>
              <small>استفسارات جديدة</small>
              <strong>{newLeadsCount}</strong>
              <span>بانتظار التواصل الأول</span>
            </div>
          </article>
          <article className="secretary-stat-card stat-blue">
            <span className="stat-icon"><PhoneCall size={20} /></span>
            <div>
              <small>متابعات نشطة</small>
              <strong>{activeLeadsCount}</strong>
              <span>قيد المتابعة والاهتمام</span>
            </div>
          </article>
          <article className="secretary-stat-card stat-amber">
            <span className="stat-icon"><UserCheck size={20} /></span>
            <div>
              <small>تم تحويلهم للتسجيل</small>
              <strong>{registeredCount}</strong>
              <span>طلاب مسجلون من الاستفسارات</span>
            </div>
          </article>
          <article className="secretary-stat-card stat-navy">
            <span className="stat-icon"><GraduationCap size={20} /></span>
            <div>
              <small>المجموعات المتاحة</small>
              <strong>{groups.length}</strong>
              <span>{students.length} طالب نشط بالفرع</span>
            </div>
          </article>
        </section>

        {/* Tab Navigation */}
        <div className="secretary-tabs">
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "pipeline" ? "active" : ""}`}
            onClick={() => selectTab("pipeline")}
          >
            <Users size={17} /> مسار العملاء المحتملين ({leads.length})
          </button>
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "registration" ? "active" : ""}`}
            onClick={() => selectTab("registration")}
          >
            <UserPlus size={17} /> تسجيل طالب فوري
          </button>
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "followups" ? "active" : ""}`}
            onClick={() => selectTab("followups")}
          >
            <Clock size={17} /> متابعات اليوم العاجلة ({activeLeadsCount})
          </button>
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "freezes" ? "active" : ""}`}
            onClick={() => selectTab("freezes")}
          >
            <Snowflake size={17} /> طلبات التجميد والتعويض
          </button>
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "shifts" ? "active" : ""}`}
            onClick={() => selectTab("shifts")}
          >
            <Wallet size={17} /> تقفيل خزينة الوردية
          </button>
        </div>

        {/* TAB 1: Leads Pipeline */}
        {activeTab === "pipeline" && (
          <section className="secretary-panel">
            <div className="secretary-panel-toolbar">
              <div className="search-wrap">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="ابحث باسم الطفل أو ولي الأمر أو الهاتف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-wrap">
                <Filter size={15} />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">جميع الحالات ({leads.length})</option>
                  <option value="NEW">جديد ({newLeadsCount})</option>
                  <option value="CONTACTED">تم التواصل</option>
                  <option value="INTERESTED">مهتم بالحجز</option>
                  <option value="REGISTERED">مسجل رسميًا ({registeredCount})</option>
                  <option value="WAITLISTED">قائمة الانتظار</option>
                  <option value="ARCHIVED">مؤرشف</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="secretary-loading"><RefreshCw size={24} className="spin" /> جارٍ جلب الاستفسارات المباشرة...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="secretary-empty-state">
                <Users size={32} />
                <h3>لا توجد استفسارات مطابقة</h3>
                <p>سجّل استفسارًا جديدًا عند قدوم ولي أمر أو تواصله هاتفيًا.</p>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setNewLeadModalOpen(true)}
                >
                  <Plus size={15} /> إضافة استفسار
                </button>
              </div>
            ) : (
              <div className="secretary-leads-table-wrap">
                <table className="secretary-table">
                  <thead>
                    <tr>
                      <th>اسم الطفل</th>
                      <th>ولي الأمر</th>
                      <th>الهاتف والقناة</th>
                      <th>المجموعة المطلوبة</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className={`lead-row lead-${lead.status.toLowerCase()}`}>
                        <td>
                          <strong>{lead.childName}</strong>
                          {lead.notes && <small className="lead-note">{lead.notes}</small>}
                        </td>
                        <td>{lead.parentName}</td>
                        <td>
                          <div className="lead-phone-cell">
                            <span>{lead.phone}</span>
                            <span className="channel-pill">{CHANNEL_LABELS[lead.channel] || lead.channel}</span>
                          </div>
                        </td>
                        <td>
                          {lead.courseName ? (
                            <span className="course-pill">{lead.courseName}</span>
                          ) : (
                            <span className="muted-text">غير محدد</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge
                            status={
                              lead.status === "REGISTERED"
                                ? "success"
                                : lead.status === "WAITLISTED"
                                ? "info"
                                : lead.status === "INTERESTED"
                                ? "info"
                                : lead.status === "CONTACTED"
                                ? "warning"
                                : lead.status === "NEW"
                                ? "danger"
                                : "neutral"
                            }
                            label={STATUS_LABELS[lead.status] || lead.status}
                          />
                        </td>
                        <td>
                          <div className="lead-actions-cell">
                            {lead.status !== "REGISTERED" && (
                              <button
                                type="button"
                                className="action-btn convert-btn"
                                onClick={() => {
                                  setConvertingLead(lead);
                                  setConvertData({
                                    courseOfferingId: lead.courseOfferingId || groups[0]?.id || "",
                                    discountPercent: 0,
                                    createInvoice: true,
                                  });
                                  setConvertModalOpen(true);
                                }}
                                title="تحويل لتسجيل رسمي"
                              >
                                <UserCheck size={14} /> تسجيل
                              </button>
                            )}
                            {lead.status === "NEW" && (
                              <button
                                type="button"
                                className="action-btn status-btn"
                                onClick={() => handleUpdateStatus(lead.id, "CONTACTED")}
                              >
                                تواصلت
                              </button>
                            )}
                            {lead.status === "CONTACTED" && (
                              <button
                                type="button"
                                className="action-btn status-btn"
                                onClick={() => handleUpdateStatus(lead.id, "INTERESTED")}
                              >
                                مهتم
                              </button>
                            )}
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="action-btn whatsapp-btn"
                              title="محادثة واتساب"
                            >
                              <MessageCircle size={14} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Direct Registration */}
        {activeTab === "registration" && (
          <section className="secretary-panel registration-panel">
            <div className="registration-header">
              <h2>تسجيل طالب جديد فوري</h2>
              <p>تسجيل فوري مع إنشاء ملف الطالب، إضافته للمجموعة، وتوليد الفاتورة التلقائية.</p>
            </div>

            <form onSubmit={handleDirectRegistration} className="registration-form">
              <div className="form-grid">
                <label>
                  <span>اسم الطالب رباعيًا *</span>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف حسام الدين علي"
                    value={directRegistration.fullName}
                    onChange={e => setDirectRegistration({ ...directRegistration, fullName: e.target.value })}
                  />
                </label>

                <label>
                  <span>رقم هاتف ولي الأمر</span>
                  <input
                    type="tel"
                    placeholder="مثال: +201012345678"
                    value={directRegistration.phone}
                    onChange={e => setDirectRegistration({ ...directRegistration, phone: e.target.value })}
                  />
                </label>

                <label>
                  <span>المجموعة التدريبية</span>
                  <select
                    value={directRegistration.courseOfferingId}
                    onChange={e => setDirectRegistration({ ...directRegistration, courseOfferingId: e.target.value })}
                  >
                    <option value="">اختر المجموعة المتاحة...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.courseName} · {g.classroomName} · {g.instructorName} ({g.enrolledStudents}/{g.maxStudents})
                        {g.enrolledStudents >= g.maxStudents ? " [مكتملة السعة 100% - قائمة انتظار]" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {(() => {
                  const selectedGrp = groups.find(g => g.id === directRegistration.courseOfferingId);
                  if (selectedGrp && selectedGrp.enrolledStudents >= selectedGrp.maxStudents) {
                    return (
                      <div
                        className="waitlist-alert-notice"
                        style={{
                          gridColumn: "1 / -1",
                          padding: "10px 14px",
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          borderRadius: "10px",
                          fontSize: "12px",
                          color: "#92400e",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Clock size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                        <span>
                          <strong>تنبيه الطاقة الاستيعابية:</strong> المجموعة المحددة مكتملة العدد ({selectedGrp.enrolledStudents}/{selectedGrp.maxStudents} مقعد). سيتم تسجيل الطالب تلقائياً في <strong>قائمة الانتظار</strong> بالأولوية التالية، مع إمكانية إشعار ولي الأمر فور توفر مقعد شاغر.
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <label>
                  <span>نسبة الخصم المعتمدة (%)</span>
                  <select
                    value={directRegistration.discountPercent}
                    onChange={e => setDirectRegistration({ ...directRegistration, discountPercent: Number(e.target.value) })}
                  >
                    <option value={0}>بدون خصم (السعر كامل)</option>
                    <option value={10}>خصم إخوة (10%)</option>
                    <option value={15}>خصم سداد مبكر (15%)</option>
                    <option value={20}>خصم شريك أو تفوق (20%)</option>
                  </select>
                </label>

                <label>
                  <span>ترشيح بواسطة طالب سفير / إحالة زميل</span>
                  <select
                    value={directRegistration.referredByStudentId ?? ""}
                    onChange={e => setDirectRegistration({ ...directRegistration, referredByStudentId: e.target.value || undefined })}
                  >
                    <option value="">بدون ترشيح (تسجيل مباشر)</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.code || "طالب"})</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={directRegistration.createInvoice}
                    onChange={e => setDirectRegistration({ ...directRegistration, createInvoice: e.target.checked })}
                  />
                  <span>إصدار فاتورة تلقائية فورية بالمبلغ المستحق لحساب المالية</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="button button-primary">
                  <UserPlus size={16} /> اعتماد وتسجيل الطالب الآن
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 3: Today's Followups */}
        {activeTab === "followups" && (
          <section className="secretary-panel followups-panel">
            <div className="followups-header">
              <h2>المتابعات اليومية والاستفسارات العاجلة</h2>
              <p>العملاء المحتملون الذين يحتاجون إلى اتصال أو رسالة لتأكيد الحجز.</p>
            </div>

            <div className="followups-grid">
              {leads
                .filter(l => ["NEW", "CONTACTED", "INTERESTED"].includes(l.status))
                .map(lead => (
                  <article key={lead.id} className="followup-card">
                    <div className="followup-top">
                      <div>
                        <strong>{lead.childName}</strong>
                        <small>ولي الأمر: {lead.parentName}</small>
                      </div>
                      <StatusBadge
                        status={lead.status === "NEW" ? "danger" : lead.status === "INTERESTED" ? "info" : "warning"}
                        label={STATUS_LABELS[lead.status] || lead.status}
                      />
                    </div>

                    <div className="followup-details">
                      <p>{lead.notes || "لا توجد ملاحظات إضافية."}</p>
                      {lead.courseName && <span className="course-pill">{lead.courseName}</span>}
                    </div>

                    <div className="followup-actions">
                      <a href={`tel:${lead.phone}`} className="button button-secondary">
                        <Phone size={14} /> اتصال
                      </a>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="button button-secondary"
                      >
                        <MessageCircle size={14} /> واتساب
                      </a>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => {
                          setConvertingLead(lead);
                          setConvertData({
                            courseOfferingId: lead.courseOfferingId || groups[0]?.id || "",
                            discountPercent: 0,
                            createInvoice: true,
                          });
                          setConvertModalOpen(true);
                        }}
                      >
                        تسجيل رسمي
                      </button>
                    </div>
                  </article>
                ))}
              {leads.filter(l => ["NEW", "CONTACTED", "INTERESTED"].includes(l.status)).length === 0 && (
                <div className="secretary-empty-state">
                  <CheckCircle2 size={32} />
                  <h3>رائع! تم إنجاز جميع المتابعات</h3>
                  <p>لا توجد استفسارات معلقة اليوم.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: Subscription Freezes & Make-up Sessions */}
        {activeTab === "freezes" && (() => {
          const allFreezes = serverFreezes.length > 0 ? serverFreezes : freezeStorage.getRequests();
          const handleSecretaryFreezeSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const student = students.find(s => s.id === freezeFormData.studentId);
            if (!student) {
              toast.error("يرجى اختيار الطالب");
              return;
            }
            if (!freezeFormData.reasonText.trim()) {
              toast.error("يرجى كتابة سبب التجميد بالتفصيل");
              return;
            }
            const group = groups.find(g => g.branchId === student.branchId);
            try {
              const created = await apiClient.createFreezeRequest({
                studentId: student.id,
                courseOfferingId: group?.id,
                startDate: freezeFormData.startDate,
                endDate: freezeFormData.endDate,
                reason: freezeFormData.reason,
                reasonText: freezeFormData.reasonText,
              });
              setServerFreezes(prev => [created, ...prev]);
            } catch {
              freezeStorage.createRequest({
                studentId: student.id,
                studentName: student.fullName,
                courseName: group?.courseName || "برنامج تدريبي",
                branchName: branchName,
                startDate: freezeFormData.startDate,
                endDate: freezeFormData.endDate,
                reason: freezeFormData.reason,
                reasonText: freezeFormData.reasonText,
                submittedByRole: "R05_SECRETARY",
                submittedByName: `${me?.user?.displayName || "موظف الاستقبال"} (السكرتارية)`,
              });
            }
            setFreezeModalOpen(false);
            setFreezeFormData({
              studentId: "",
              startDate: new Date().toISOString().split("T")[0],
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              reason: "MEDICAL",
              reasonText: "",
            });
            setRefreshKey(v => v + 1);
            toast.success(`تم تسجيل طلب التجميد للطالب ${student.fullName} ورفعه لمدير الفرع`);
          };

          return (
            <section className="secretary-panel">
              <div className="secretary-panel-toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>طلبات تجميد الاشتراكات والحصص التعويضية</h2>
                  <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "3px 0 0" }}>تسجيل تجميد فوري للطلاب عبر شباك الاستقبال ومتابعة القرارات المعتمدة.</p>
                </div>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setFreezeModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus size={16} /> تسجيل طلب تجميد بالاستقبال
                </button>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                {allFreezes.map(freeze => {
                  const statusBadge =
                    freeze.status === "APPROVED"
                      ? { label: "معتمد · تم التمديد", bg: "rgba(16, 185, 129, 0.12)", color: "#059669" }
                      : freeze.status === "REJECTED"
                      ? { label: "مرفوض", bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }
                      : { label: "قيد مراجعة مدير الفرع", bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };

                  return (
                    <article
                      key={freeze.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{freeze.studentName}</span>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>({freeze.courseName})</span>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: statusBadge.bg,
                              color: statusBadge.color,
                            }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          مقدم الطلب: {freeze.submittedByName}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155" }}>
                        <strong>السبب:</strong> {freeze.reasonText}
                      </p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "0.82rem", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "8px", marginTop: "4px" }}>
                        <span>فترة التجميد: من <b>{freeze.startDate}</b> إلى <b>{freeze.endDate}</b></span>
                        <span>رصيد التعويض المتاح: <b>{freeze.makeUpCreditsAwarded} حصص</b></span>
                        {freeze.extendedNewEndDate && (
                          <span style={{ color: "#059669", fontWeight: 600 }}>
                            الانتهاء الجديد: {freeze.extendedNewEndDate}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Modal for Secretary to register freeze */}
              {freezeModalOpen && (
                <div className="dialog-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setFreezeModalOpen(false); }}>
                  <section className="dialog-card" role="dialog" aria-modal="true" style={{ maxWidth: "480px" }}>
                    <button className="dialog-close" aria-label="إغلاق" onClick={() => setFreezeModalOpen(false)}>
                      <X size={17} />
                    </button>
                    <div className="team-dialog-heading">
                      <span className="approval-id">R05 · مكتب الاستقبال</span>
                      <h2>تسجيل طلب تجميد اشتراك</h2>
                      <p>تسجيل طلب وارد لشباك الاستقبال ويرفع آليًا لمدير الفرع للاعتماد.</p>
                    </div>

                    <form onSubmit={handleSecretaryFreezeSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>اختر الطالب</label>
                        <select
                          required
                          value={freezeFormData.studentId}
                          onChange={e => setFreezeFormData({ ...freezeFormData, studentId: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="">-- اختر الطالب المسجل --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.fullName} ({s.id})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>من تاريخ</label>
                          <input
                            type="date"
                            required
                            value={freezeFormData.startDate}
                            onChange={e => setFreezeFormData({ ...freezeFormData, startDate: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>إلى تاريخ</label>
                          <input
                            type="date"
                            required
                            value={freezeFormData.endDate}
                            onChange={e => setFreezeFormData({ ...freezeFormData, endDate: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>تصنيف العذر</label>
                        <select
                          value={freezeFormData.reason}
                          onChange={e => setFreezeFormData({ ...freezeFormData, reason: e.target.value as any })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="MEDICAL">ظروف صحية / إجازة مرضية</option>
                          <option value="TRAVEL">سفر ورحلات</option>
                          <option value="EXAMS">امتحانات واختبارات</option>
                          <option value="FAMILY">ظروف أسرية</option>
                          <option value="OTHER">سبب آخر</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>سبب التجميد وملاحظات الاستقبال</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="اكتب سبب طلب ولي الأمر وملاحظة الاستقبال..."
                          value={freezeFormData.reasonText}
                          onChange={e => setFreezeFormData({ ...freezeFormData, reasonText: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                        <button type="button" className="button button-secondary" onClick={() => setFreezeModalOpen(false)}>
                          إلغاء
                        </button>
                        <button type="submit" className="button button-primary">
                          رفع الطلب للمدير
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </section>
          );
        })()}

        {/* TAB 5: Shift Cash Handover */}
        {activeTab === "shifts" && (() => {
          const allShifts = shiftStorage.getHandovers();
          const handleShiftSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const cash = parseFloat(shiftFormData.cashAmount) || 0;
            const electronic = parseFloat(shiftFormData.electronicAmount) || 0;
            const receipts = parseInt(shiftFormData.totalReceiptsCount, 10) || 0;

            if (cash <= 0 && electronic <= 0) {
              toast.error("يرجى إدخال المبالغ المحصلة في الشيفت");
              return;
            }

            const newShift = shiftStorage.submitShift({
              branchName: branchName,
              shiftDate: new Date().toISOString().split("T")[0],
              shiftName: shiftFormData.shiftName,
              submittedByUserId: me?.id || "SEC-01",
              submittedByName: `${me?.user?.displayName || "موظف الاستقبال"} (السكرتارية)`,
              cashAmount: cash,
              electronicAmount: electronic,
              totalReceiptsCount: receipts,
              notes: shiftFormData.notes || undefined,
            });

            setShiftModalOpen(false);
            setShiftFormData({
              shiftName: "MORNING",
              cashAmount: "",
              electronicAmount: "",
              totalReceiptsCount: "",
              notes: "",
            });
            setRefreshKey(v => v + 1);
            toast.success(`تم تقفيل الوردية ${newShift.id} وتوريد إشعار للمحاسب للاستلام`);
          };

          return (
            <section className="secretary-panel">
              <div className="secretary-panel-toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>تقفيل خزينة الشيفت وتسليم العهدة النقدية</h2>
                  <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "3px 0 0" }}>تسليم الكاش والإيصالات المحصلة خلال الوردية للمحاسب المالي رسمياً.</p>
                </div>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setShiftModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus size={16} /> تقفيل وتسليم الوردية الحالية
                </button>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "12px" }}>
                {allShifts.map(shift => {
                  const isAccepted = shift.status === "ACCEPTED";
                  const isPending = shift.status === "SUBMITTED";

                  return (
                    <article
                      key={shift.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{shift.id}</span>
                          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            وردية {shift.shiftName === "MORNING" ? "صباحية" : "مسائية"} · {shift.shiftDate}
                          </span>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: isAccepted ? "rgba(16, 185, 129, 0.12)" : isPending ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                              color: isAccepted ? "#059669" : isPending ? "#d97706" : "#dc2626",
                            }}
                          >
                            {isAccepted ? "تم الاستلام من المحاسب" : isPending ? "بانتظار استلام المحاسب" : "يوجد فرق / عجز"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                          الكاش: {shift.cashAmount.toLocaleString("en-US")} ج.م · الإلكتروني: {shift.electronicAmount.toLocaleString("en-US")} ج.م
                        </span>
                      </div>

                      {shift.notes && (
                        <p style={{ margin: 0, fontSize: "0.86rem", color: "#475569" }}>
                          <strong>ملاحظات:</strong> {shift.notes}
                        </p>
                      )}

                      {shift.receivedByName && (
                        <div style={{ fontSize: "0.8rem", color: "#059669", borderTop: "1px dashed #e2e8f0", paddingTop: "6px" }}>
                          تم استلام النقدية واعتمادها بواسطة: <b>{shift.receivedByName}</b>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Modal for Registering Shift Handover */}
              {shiftModalOpen && (
                <div className="dialog-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShiftModalOpen(false); }}>
                  <section className="dialog-card" role="dialog" aria-modal="true" style={{ maxWidth: "480px" }}>
                    <button className="dialog-close" aria-label="إغلاق" onClick={() => setShiftModalOpen(false)}>
                      <X size={17} />
                    </button>
                    <div className="team-dialog-heading">
                      <span className="approval-id">R05 · تقفيل وردية</span>
                      <h2>تقفيل الخزينة وتسليم عهدة الشباك</h2>
                      <p>حصر النقدية الفعلية وسندات القبض المسددة في الشيفت لإرسالها للمحاسب.</p>
                    </div>

                    <form onSubmit={handleShiftSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>فترة الوردية</label>
                        <select
                          value={shiftFormData.shiftName}
                          onChange={e => setShiftFormData({ ...shiftFormData, shiftName: e.target.value as any })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="MORNING">وردية صباحية (09:00 ص - 03:00 م)</option>
                          <option value="EVENING">وردية مسائية (03:00 م - 09:00 م)</option>
                        </select>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>إجمالي النقدية (الكاش الفعلي)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="مثال: 4500"
                            value={shiftFormData.cashAmount}
                            onChange={e => setShiftFormData({ ...shiftFormData, cashAmount: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>التحصيل الإلكتروني (Visa/IPN)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="مثال: 3200"
                            value={shiftFormData.electronicAmount}
                            onChange={e => setShiftFormData({ ...shiftFormData, electronicAmount: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>عدد إيصالات وسندات القبض</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="مثال: 8"
                          value={shiftFormData.totalReceiptsCount}
                          onChange={e => setShiftFormData({ ...shiftFormData, totalReceiptsCount: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>ملاحظات الوردية إن وجدت</label>
                        <textarea
                          rows={2}
                          placeholder="أي ملاحظات حول المبالغ أو السندات المسلمة..."
                          value={shiftFormData.notes}
                          onChange={e => setShiftFormData({ ...shiftFormData, notes: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                        <button type="button" className="button button-secondary" onClick={() => setShiftModalOpen(false)}>
                          إلغاء
                        </button>
                        <button type="submit" className="button button-primary">
                          تسليم الوردية وإرسال الإشعار
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </section>
          );
        })()}
      </main>

      {/* Modal: New Lead Creation */}
      {newLeadModalOpen && (
        <div className="secretary-modal-backdrop" onClick={() => setNewLeadModalOpen(false)}>
          <div className="secretary-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3><Plus size={18} /> تسجيل عميل محتمل جديد</h3>
              <button type="button" onClick={() => setNewLeadModalOpen(false)} aria-label="إغلاق"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="modal-body">
                <label>
                  <span>اسم الطفل *</span>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عمر طارق عثمان"
                    value={newLead.childName}
                    onChange={e => setNewLead({ ...newLead, childName: e.target.value })}
                  />
                </label>
                <label>
                  <span>اسم ولي الأمر *</span>
                  <input
                    type="text"
                    required
                    placeholder="مثال: طارق عثمان"
                    value={newLead.parentName}
                    onChange={e => setNewLead({ ...newLead, parentName: e.target.value })}
                  />
                </label>
                <label>
                  <span>رقم الهاتف / الواتساب *</span>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: +201012345678"
                    value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                </label>
                <label>
                  <span>قناة الاستفسار</span>
                  <select
                    value={newLead.channel}
                    onChange={e => setNewLead({ ...newLead, channel: e.target.value })}
                  >
                    <option value="WALK_IN">زيارة مباشرة للفرع</option>
                    <option value="WHATSAPP">رسالة واتساب</option>
                    <option value="PHONE">مكالمة هاتفية</option>
                    <option value="FACEBOOK">إعلان فيسبوك</option>
                    <option value="INSTAGRAM">إنستغرام</option>
                  </select>
                </label>
                <label>
                  <span>المجموعة / الكورس المهتم به</span>
                  <select
                    value={newLead.courseOfferingId}
                    onChange={e => setNewLead({ ...newLead, courseOfferingId: e.target.value })}
                  >
                    <option value="">اختر المجموعة (اختياري)...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.courseName} · {g.classroomName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>ملاحظات الاستفسار</span>
                  <textarea
                    rows={3}
                    placeholder="اكتب تفاصيل الاستفسار ومستوى الطفل والمواعيد المفضلة..."
                    value={newLead.notes ?? ""}
                    onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                  />
                </label>
              </div>
              <div className="modal-foot">
                <button type="button" className="button button-secondary" onClick={() => setNewLeadModalOpen(false)}>إلغاء</button>
                <button type="submit" className="button button-primary">حفظ في المسار</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Convert Lead to Enrolled Student */}
      {convertModalOpen && convertingLead && (
        <div className="secretary-modal-backdrop" onClick={() => setConvertModalOpen(false)}>
          <div className="secretary-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3><UserCheck size={18} /> تأكيد تسجيل الطالب رسميًا</h3>
              <button type="button" onClick={() => setConvertModalOpen(false)} aria-label="إغلاق"><X size={18} /></button>
            </div>
            <form onSubmit={handleConvertLead}>
              <div className="modal-body">
                <div className="convert-summary-pill">
                  <strong>{convertingLead.childName}</strong>
                  <span>ولي الأمر: {convertingLead.parentName} · {convertingLead.phone}</span>
                </div>

                <label>
                  <span>تسكين في المجموعة التدريبية *</span>
                  <select
                    value={convertData.courseOfferingId}
                    onChange={e => setConvertData({ ...convertData, courseOfferingId: e.target.value })}
                    required
                  >
                    <option value="">اختر المجموعة...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.courseName} ({g.enrolledStudents}/{g.maxStudents}) · {g.classroomName}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>نسبة الخصم إن وُجد</span>
                  <select
                    value={convertData.discountPercent}
                    onChange={e => setConvertData({ ...convertData, discountPercent: Number(e.target.value) })}
                  >
                    <option value={0}>بدون خصم (السعر كامل)</option>
                    <option value={10}>خصم إخوة (10%)</option>
                    <option value={15}>خصم سداد مبكر (15%)</option>
                    <option value={20}>خصم شريك (20%)</option>
                  </select>
                </label>

                <div className="form-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={convertData.createInvoice}
                      onChange={e => setConvertData({ ...convertData, createInvoice: e.target.checked })}
                    />
                    <span>إصدار فاتورة إلكترونية تلقائية بالمبلغ في قسم المالية</span>
                  </label>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="button button-secondary" onClick={() => setConvertModalOpen(false)}>إلغاء</button>
                <button type="submit" className="button button-primary">تأكيد التسجيل النهائي</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleDashboardShell>
  );
}
