import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpLeft,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock,
  Filter,
  GraduationCap,
  MessageCircle,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type ConvertLeadInput,
  type CreateLeadInput,
  type DirectStudentInput,
  type LeadRecord,
  type SchedulingGroupRecord,
  type StudentRecord,
} from "@/lib/apiClient";
import "./SecretaryDeskLive.css";

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم بالحجز",
  REGISTERED: "مسجل رسميًا",
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
  const [, navigate] = useLocation();

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [groups, setGroups] = useState<SchedulingGroupRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeTab, setActiveTab] = useState<"pipeline" | "registration" | "followups">("pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
    ]).then(([leadsRes, groupsRes, studentsRes]) => {
      if (!active) return;
      if (leadsRes.status === "fulfilled") setLeads(leadsRes.value.items);
      if (groupsRes.status === "fulfilled") setGroups(groupsRes.value.items);
      if (studentsRes.status === "fulfilled") setStudents(studentsRes.value.items);
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
      });
      toast.success(`تم تحويل ${result.studentName} إلى طالب مسجل بنجاح!`, {
        description: result.invoiceNumber ? `رقم الفاتورة الصادرة: ${result.invoiceNumber}` : undefined,
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
      });
      toast.success(`تم تسجيل الطالب ${result.studentName} بنجاح!`, {
        description: result.invoiceNumber ? `صدرت الفاتورة برقم: ${result.invoiceNumber}` : undefined,
      });
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
            onClick={() => setActiveTab("pipeline")}
          >
            <Users size={17} /> مسار العملاء المحتملين ({leads.length})
          </button>
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "registration" ? "active" : ""}`}
            onClick={() => setActiveTab("registration")}
          >
            <UserPlus size={17} /> تسجيل طالب فوري
          </button>
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "followups" ? "active" : ""}`}
            onClick={() => setActiveTab("followups")}
          >
            <Clock size={17} /> متابعات اليوم العاجلة ({activeLeadsCount})
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
                      </option>
                    ))}
                  </select>
                </label>

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
