import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Filter,
  Instagram,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import QuickActionsBar from "@/components/QuickActionsBar";
import { QuickSupportTicketModal } from "@/components/QuickActionModals";
import RoleScopeCard from "@/components/RoleScopeCard";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type LeadRecord,
  type MarketingCampaignRecord,
  type MarketingContentRecord,
} from "@/lib/apiClient";
import "./MarketingDesk.css";

const STATUS_LABEL: Record<string, string> = {
  NEW: "استفسار جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم بالانضمام",
  INTERVIEW_SCHEDULED: "محجوز مقابلة / تحديد مستوى",
  READY_TO_ENROLL: "جاهز للتسكين في الفرع",
  REGISTERED: "تم التسجيل والتحويل",
  WAITLISTED: "قائمة انتظار",
  NOTIFIED: "تم إشعاره",
  CANCELLED: "ملغي",
  ARCHIVED: "مؤرشف",
};

const STATUS_TONE: Record<string, string> = {
  NEW: "new",
  CONTACTED: "contacted",
  INTERESTED: "interested",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  READY_TO_ENROLL: "ready_to_enroll",
  REGISTERED: "registered",
  WAITLISTED: "waitlisted",
  NOTIFIED: "contacted",
  CANCELLED: "archived",
  ARCHIVED: "archived",
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function MarketingDesk() {
  const { me } = useAuth();
  const [activeTab, setActiveTab] = useState<"leads" | "content-notes" | "campaigns">("leads");
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [branchId, setBranchId] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [notesStatusFilter, setNotesStatusFilter] = useState<"ALL" | "TO_DO" | "IN_PROGRESS" | "DONE">("ALL");

  // Data
  const [campaigns, setCampaigns] = useState<MarketingCampaignRecord[]>([]);
  const [content, setContent] = useState<MarketingContentRecord[]>([]);

  // Modals
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Forms
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("INSTAGRAM");
  const [leadBranch, setLeadBranch] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [savingLead, setSavingLead] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteType, setNoteType] = useState("POST");
  const [notePlatform, setNotePlatform] = useState("INSTAGRAM");
  const [noteDueDate, setNoteDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [savingNote, setSavingNote] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [campaignChannel, setCampaignChannel] = useState("INSTAGRAM");
  const [savingCampaign, setSavingCampaign] = useState(false);

  const branches = me?.branches ?? [];
  const branchName = (id?: string | null) =>
    branches.find(b => b.id === id)?.name ?? "الفرع الرئيسي";

  const loadMarketing = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadResponse, campaignResponse, contentResponse] = await Promise.all([
        apiClient.listLeads().catch(() => ({ items: [], total: 0, overdue: 0, active: 0 })),
        apiClient.listMarketingCampaigns().catch(() => []),
        apiClient.listMarketingContent().catch(() => []),
      ]);
      setLeads(leadResponse.items || []);
      setCampaigns(campaignResponse || []);
      setContent(contentResponse || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات التسويق");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMarketing();
  }, []);

  // Filtered Leads
  const visibleLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchBranch = !branchId || lead.branchId === branchId;
      const needle = query.trim().toLocaleLowerCase("ar");
      const matchQuery =
        !needle ||
        `${lead.childName} ${lead.parentName} ${lead.phone} ${lead.channel} ${lead.notes ?? ""}`
          .toLocaleLowerCase("ar")
          .includes(needle);
      const matchStage = stageFilter === "ALL" || lead.status === stageFilter;
      return matchBranch && matchQuery && matchStage;
    });
  }, [leads, branchId, query, stageFilter]);

  // Overall KPIs
  const metrics = useMemo(() => {
    const total = visibleLeads.length;
    const active = visibleLeads.filter(l => ["NEW", "CONTACTED", "INTERESTED"].includes(l.status)).length;
    const interview = visibleLeads.filter(l => l.notes?.includes("مقابلة") || l.notes?.includes("إنترفيو")).length;
    const readyOrEnrolled = visibleLeads.filter(
      l => l.status === "REGISTERED" || l.notes?.includes("جاهز للتسكين")
    ).length;
    return { total, active, interview, readyOrEnrolled };
  }, [visibleLeads]);

  // Branch Performance Breakdown
  const branchBreakdown = useMemo(() => {
    const branchMap = new Map<string, { name: string; total: number; interview: number; ready: number }>();
    branches.forEach(b => {
      branchMap.set(b.id, { name: b.name, total: 0, interview: 0, ready: 0 });
    });

    leads.forEach(l => {
      const b = branchMap.get(l.branchId);
      if (b) {
        b.total++;
        if (l.notes?.includes("مقابلة") || l.notes?.includes("إنترفيو")) b.interview++;
        if (l.status === "REGISTERED" || l.notes?.includes("جاهز للتسكين")) b.ready++;
      }
    });

    return Array.from(branchMap.values());
  }, [branches, leads]);

  // Lead Lifecycle Actions
  const handleUpdateLeadStatus = async (lead: LeadRecord, newStatus: LeadRecord["status"], extraNote?: string) => {
    try {
      const updatedNotes = extraNote
        ? `${lead.notes ? `${lead.notes} | ` : ""}${extraNote}`
        : lead.notes;

      const res = await apiClient.updateLeadStatus(lead.id, newStatus);
      setLeads(current =>
        current.map(item => (item.id === lead.id ? { ...res, notes: updatedNotes } : item))
      );
      toast.success(`تم تحديث حالة الـLead إلى: ${STATUS_LABEL[newStatus] || newStatus}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تحديث الحالة");
    }
  };

  const handleScheduleInterview = async (lead: LeadRecord) => {
    const dateInput = prompt("أدخل موعد المقابلة واختبار تحديد المستوى (مثال: السبت 4:00 مساءً):", "السبت القادم 4:00 م");
    if (!dateInput) return;
    await handleUpdateLeadStatus(lead, "INTERESTED", `[موعد المقابلة: ${dateInput}]`);
  };

  const handleMarkReadyForIntake = async (lead: LeadRecord) => {
    await handleUpdateLeadStatus(
      lead,
      "REGISTERED",
      `[محول للسكرتارية: جاهز للتسكين الفوري بالفرع · بواسطة التسويق]`
    );
    toast.success("تم إحالة الطالب للسكرتارية بنجاح! سيظهر في قائمة الطلاب الجدد للتسكين الفوري.");
  };

  const handleCreateLead = async (e: FormEvent) => {
    e.preventDefault();
    if (!childName.trim() || !parentName.trim() || !phone.trim()) {
      toast.error("يرجى ملء اسم الطفل وولي الأمر ورقم الهاتف");
      return;
    }
    setSavingLead(true);
    try {
      const created = await apiClient.createLead({
        childName: childName.trim(),
        parentName: parentName.trim(),
        phone: phone.trim(),
        channel,
        branchId: leadBranch || branchId || undefined,
        notes: leadNotes.trim() ? leadNotes.trim() : undefined,
      });
      setLeads(current => [created, ...current]);
      setChildName("");
      setParentName("");
      setPhone("");
      setLeadNotes("");
      setLeadModalOpen(false);
      toast.success("تم حفظ الـLead بنجاح وربطه بالفرع والنظام!");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر إضافة الـLead");
    } finally {
      setSavingLead(false);
    }
  };

  // Content To-Do Notes Actions
  const handleCreateContentNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      toast.error("اكتب عنوان الفكرة أو منشور المحتوى");
      return;
    }
    setSavingNote(true);
    try {
      const created = await apiClient.createMarketingContent({
        title: noteTitle.trim(),
        contentType: noteType,
        platform: notePlatform,
        branchId: branchId || undefined,
      });
      setContent(current => [created, ...current]);
      setNoteTitle("");
      setContentModalOpen(false);
      toast.success("تمت إضافة الفكرة إلى أجندة المحتوى والمهام!");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر حفظ عنصر المحتوى");
    } finally {
      setSavingNote(false);
    }
  };

  const handleToggleContentStatus = async (item: MarketingContentRecord) => {
    const nextStatus: MarketingContentRecord["status"] =
      item.status === "PUBLISHED"
        ? "DRAFT"
        : item.status === "DRAFT"
        ? "IN_REVIEW"
        : "PUBLISHED";

    try {
      const updated = await apiClient.updateMarketingContentStatus(item.id, nextStatus);
      setContent(current => current.map(x => (x.id === updated.id ? updated : x)));
      toast.success(
        nextStatus === "PUBLISHED"
          ? "رائع! تم تحديد المحتوى كـ 'تم النشر بنجاح' ✓"
          : "تم تحديث حالة مهمة المحتوى"
      );
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تحديث الحالة");
    }
  };

  const handleCreateCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) return toast.error("اكتب اسم الحملة الإعلانية");
    setSavingCampaign(true);
    try {
      const created = await apiClient.createMarketingCampaign({
        name: campaignName.trim(),
        channel: campaignChannel,
        branchId: branchId || undefined,
      });
      setCampaigns(current => [created, ...current]);
      setCampaignName("");
      toast.success("تم تسجيل الحملة التسويقية بنجاح!");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر حفظ الحملة");
    } finally {
      setSavingCampaign(false);
    }
  };

  return (
    <RoleDashboardShell
      className="app-shell marketing-desk-shell"
      roleCode="R07"
      roleLabel="مسؤول التسويق والإعلام"
      scopeLevel="branch"
      scopeLabel={branchId ? branchName(branchId) : "كل فروع الأكاديمية"}
      tenantName={me?.academy?.name ?? "أكاديمية مدى للروبوتكس"}
      branchName={branchId ? branchName(branchId) : "كل الفروع المصرح بها"}
      demo={false}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel">
        <RoleSurfaceTopbar
          onMenu={() => setMobileNavOpen(true)}
          scopeLabel={branchId ? branchName(branchId) : "كل الفروع"}
          roleLabel="مسؤول التسويق"
        />

        <div className="workspace marketing-desk-content" dir="rtl">
          {/* Header */}
          <PageHeader
            className="welcome-row"
            copyClassName="welcome-copy"
            actionsClassName="welcome-actions"
            eyebrow={
              <span className="eyebrow">
                <i className="eyebrow-dot" /> مسؤول التسويق وإدارة الـLeads · R07
              </span>
            }
            title="إدارة التسويق واستقطاب الطلاب والـLeads"
            description="متابعة مسار العملاء المحتملين وتوزيع الفروع، وأجندة أفكار ومهام المحتوى، ونسب التحويل الفعلية."
            actions={
              <span className="marketing-date">
                <CalendarDays size={14} /> اليوم · {branchId ? branchName(branchId) : "نطاق الأكاديمية"}
              </span>
            }
          />

          <RoleScopeCard className="marketing-scope-card" />

          {/* Quick Actions Bar */}
          <QuickActionsBar
            title="إجراءات التسويق السريعة"
            actions={[
              {
                id: "r07-add-lead",
                label: "+ تسجيل Lead جديد فوري",
                icon: <UserPlus size={14} />,
                onClick: () => setLeadModalOpen(true),
                tone: "primary",
              },
              {
                id: "r07-add-note",
                label: "+ إضافة فكرة / نوت محتوى",
                icon: <Sparkles size={14} />,
                onClick: () => setContentModalOpen(true),
              },
              {
                id: "r07-ticket-modal",
                label: "تسجيل تذكرة دعم للإدارة",
                icon: <LifeBuoy size={14} />,
                onClick: () => setTicketModalOpen(true),
              },
              {
                id: "r07-refresh",
                label: "تحديث ومزامنة البيانات",
                icon: <RefreshCw size={14} />,
                onClick: () => void loadMarketing(),
              },
            ]}
          />

          {/* Luxury Navigation Tabs */}
          <div className="marketing-nav-tabs" role="tablist">
            <button
              type="button"
              className={`marketing-nav-tab ${activeTab === "leads" ? "active" : ""}`}
              onClick={() => setActiveTab("leads")}
            >
              <Users size={16} />
              <span>مسار الـLeads وليدز الفروع</span>
              <span className="tab-badge">{visibleLeads.length}</span>
            </button>

            <button
              type="button"
              className={`marketing-nav-tab ${activeTab === "content-notes" ? "active" : ""}`}
              onClick={() => setActiveTab("content-notes")}
            >
              <CalendarDays size={16} />
              <span>أجندة المحتوى والمهام (To-Do Notes)</span>
              <span className="tab-badge">{content.length}</span>
            </button>

            <button
              type="button"
              className={`marketing-nav-tab ${activeTab === "campaigns" ? "active" : ""}`}
              onClick={() => setActiveTab("campaigns")}
            >
              <Megaphone size={16} />
              <span>الحملات الإعلانية الممولة</span>
              <span className="tab-badge">{campaigns.length}</span>
            </button>
          </div>

          {/* TAB 1: LEADS & INTAKE PIPELINE */}
          {activeTab === "leads" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* KPIs */}
              <div className="marketing-kpi-grid">
                <article className="marketing-stat-card">
                  <div className="marketing-stat-icon teal">
                    <Users size={24} />
                  </div>
                  <div className="marketing-stat-info">
                    <span className="stat-label">إجمالي الـLeads</span>
                    <strong className="stat-value">{metrics.total}</strong>
                    <span className="stat-hint">استفسارات واردة عبر كافة القنوات</span>
                  </div>
                </article>

                <article className="marketing-stat-card">
                  <div className="marketing-stat-icon blue">
                    <TrendingUp size={24} />
                  </div>
                  <div className="marketing-stat-info">
                    <span className="stat-label">قيد التواصل والمتابعة</span>
                    <strong className="stat-value">{metrics.active}</strong>
                    <span className="stat-hint">جارٍ التواصل الهاتفي والردود</span>
                  </div>
                </article>

                <article className="marketing-stat-card">
                  <div className="marketing-stat-icon amber">
                    <Target size={24} />
                  </div>
                  <div className="marketing-stat-info">
                    <span className="stat-label">محجوز مقابلة / تحديد مستوى</span>
                    <strong className="stat-value">{metrics.interview}</strong>
                    <span className="stat-hint">تم تحديد موعد للحضور بالفرع</span>
                  </div>
                </article>

                <article className="marketing-stat-card">
                  <div className="marketing-stat-icon emerald">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="marketing-stat-info">
                    <span className="stat-label">جاهز للتسكين / تم التحويل</span>
                    <strong className="stat-value">{metrics.readyOrEnrolled}</strong>
                    <span className="stat-hint">محول للسكرتارية لتسكينه في مجموعة</span>
                  </div>
                </article>
              </div>

              {/* Branch Leads Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Compass size={18} color="#0f766e" />
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                    توزيع ومتابعة الـLeads عبر فروع الأكاديمية
                  </h3>
                </div>
                <div className="marketing-branches-strip">
                  {branchBreakdown.map((b, idx) => (
                    <div key={idx} className="marketing-branch-card">
                      <div className="marketing-branch-card-header">
                        <strong>فرع {b.name}</strong>
                        <span>{b.total} ليدز إجمالي</span>
                      </div>
                      <div className="marketing-branch-metrics">
                        <div>
                          <small>إجمالي الفرع</small>
                          <strong>{b.total}</strong>
                        </div>
                        <div>
                          <small>حجز مقابلة</small>
                          <strong style={{ color: "#d97706" }}>{b.interview}</strong>
                        </div>
                        <div>
                          <small>جاهز للتسكين</small>
                          <strong style={{ color: "#059669" }}>{b.ready}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="marketing-toolbar">
                <div className="marketing-search-box">
                  <Search size={18} color="#94a3b8" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="ابحث باسم الطالب، ولي الأمر، رقم الهاتف، أو المنصة..."
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="marketing-filters-group">
                  <select value={branchId} onChange={e => setBranchId(e.target.value)}>
                    <option value="">كل الفروع المصرح بها</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        فرع {branch.name}
                      </option>
                    ))}
                  </select>

                  <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                    <option value="ALL">كل مراحل المتابعة</option>
                    <option value="NEW">استفسار جديد</option>
                    <option value="CONTACTED">تم التواصل</option>
                    <option value="INTERESTED">مهتم بالانضمام</option>
                    <option value="REGISTERED">تم التحويل / التسكين</option>
                    <option value="WAITLISTED">قائمة انتظار</option>
                  </select>
                </div>
              </div>

              {/* Leads List */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  جارٍ تحميل وتحديث سجل الـLeads من السيرفر…
                </div>
              ) : visibleLeads.length === 0 ? (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px dashed #cbd5e1",
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  <Users size={36} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>
                    لا توجد Leads مطابقة لهذا البحث أو الفلتر
                  </h4>
                  <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>
                    اضغط على "+ تسجيل Lead جديد فوري" لإضافة عميل محتمل جديد وتوجيهه للفرع.
                  </p>
                </div>
              ) : (
                <div className="marketing-leads-list">
                  {visibleLeads.map(lead => {
                    const isReady = lead.status === "REGISTERED" || lead.notes?.includes("جاهز للتسكين");
                    const hasInterview = lead.notes?.includes("موعد المقابلة") || lead.notes?.includes("إنترفيو");

                    return (
                      <article key={lead.id} className="marketing-lead-card">
                        <div className="marketing-lead-primary">
                          <div className="marketing-lead-avatar">
                            {lead.childName ? lead.childName.trim().charAt(0) : "ط"}
                          </div>
                          <div className="marketing-lead-meta">
                            <strong>{lead.childName}</strong>
                            <span>
                              <span>ولي الأمر: {lead.parentName}</span>
                              <span>·</span>
                              <span dir="ltr">{lead.phone}</span>
                              <span>·</span>
                              <span>{branchName(lead.branchId)}</span>
                              <span>·</span>
                              <span
                                className={`marketing-channel-badge ${
                                  lead.channel?.toLowerCase().includes("insta")
                                    ? "instagram"
                                    : lead.channel?.toLowerCase().includes("face")
                                    ? "facebook"
                                    : lead.channel?.toLowerCase().includes("whats")
                                    ? "whatsapp"
                                    : "google"
                                }`}
                              >
                                {lead.channel || "سوشيال ميديا"}
                              </span>
                            </span>
                            {lead.notes && (
                              <div
                                style={{
                                  fontSize: "0.78rem",
                                  color: "#0f766e",
                                  background: "#f0fdfa",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  marginTop: "4px",
                                  width: "fit-content",
                                }}
                              >
                                {lead.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="marketing-lead-stage-col">
                          <span
                            className={`marketing-stage-badge ${
                              isReady
                                ? "ready_to_enroll"
                                : hasInterview
                                ? "interview_scheduled"
                                : STATUS_TONE[lead.status] || "new"
                            }`}
                          >
                            {isReady
                              ? "جاهز للتسكين بالفرع ✓"
                              : hasInterview
                              ? "محجوز مقابلة 📅"
                              : STATUS_LABEL[lead.status] || lead.status}
                          </span>
                        </div>

                        <div className="marketing-lead-actions">
                          <button
                            type="button"
                            className="lead-action-btn"
                            onClick={() => window.open(`tel:${lead.phone}`)}
                            title="اتصال سريع"
                          >
                            <Phone size={14} /> اتصال
                          </button>

                          <button
                            type="button"
                            className="lead-action-btn highlight"
                            onClick={() => handleScheduleInterview(lead)}
                          >
                            <CalendarDays size={14} /> حجز مقابلة
                          </button>

                          {!isReady && (
                            <button
                              type="button"
                              className="lead-action-btn primary"
                              onClick={() => handleMarkReadyForIntake(lead)}
                            >
                              <UserCheck size={14} /> تحويل للتسكين 🚀
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTENT & CALENDAR TO-DO NOTES */}
          {activeTab === "content-notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                    أجندة المحتوى وحملات الأكاديمية (Content To-Do Notes)
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                    نوتس تفاعلية لتحديد الأفكار والمنشورات والريلز المطلوبة، ومتابعة ما تم تنفيذه وما هو قيد التنفيذ.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="lead-action-btn primary"
                    onClick={() => setContentModalOpen(true)}
                  >
                    <Plus size={16} /> إضافة فكرة / نوت محتوى
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs for Notes */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { key: "ALL", label: "كل الأفكار والمهام", count: content.length },
                  { key: "TO_DO", label: "مخططة (To Do)", count: content.filter(c => c.status === "DRAFT").length },
                  {
                    key: "IN_PROGRESS",
                    label: "قيد التصوير والإنتاج",
                    count: content.filter(c => c.status === "IN_REVIEW" || c.status === "SCHEDULED").length,
                  },
                  {
                    key: "DONE",
                    label: "تم النشر بنجاح ✓",
                    count: content.filter(c => c.status === "PUBLISHED" || c.status === "APPROVED").length,
                  },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setNotesStatusFilter(tab.key as any)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      border: "1px solid",
                      borderColor: notesStatusFilter === tab.key ? "#0f766e" : "#e2e8f0",
                      background: notesStatusFilter === tab.key ? "#f0fdfa" : "#ffffff",
                      color: notesStatusFilter === tab.key ? "#0f766e" : "#475569",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "1px 6px",
                        borderRadius: "8px",
                        background: notesStatusFilter === tab.key ? "#ccfbf1" : "#f1f5f9",
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Notes Grid */}
              {content.length === 0 ? (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px dashed #cbd5e1",
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  <Sparkles size={36} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>
                    لا توجد نوتس محتوى مسجلة بعد
                  </h4>
                  <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>
                    اضغط على "+ إضافة فكرة / نوت محتوى" لتدوين أفكار الفيديوهات والمنشورات المطلوبة.
                  </p>
                </div>
              ) : (
                <div className="marketing-notes-grid">
                  {content
                    .filter(c => {
                      if (notesStatusFilter === "TO_DO") return c.status === "DRAFT";
                      if (notesStatusFilter === "IN_PROGRESS")
                        return c.status === "IN_REVIEW" || c.status === "SCHEDULED";
                      if (notesStatusFilter === "DONE")
                        return c.status === "PUBLISHED" || c.status === "APPROVED";
                      return true;
                    })
                    .map(item => {
                      const isDone = item.status === "PUBLISHED" || item.status === "APPROVED";
                      const isInProgress = item.status === "IN_REVIEW" || item.status === "SCHEDULED";

                      return (
                        <div
                          key={item.id}
                          className={`marketing-note-card ${isDone ? "published" : ""}`}
                        >
                          <div className="marketing-note-card-top">
                            <h3>{item.title}</h3>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: isDone ? "#dcfce7" : isInProgress ? "#fef3c7" : "#f1f5f9",
                                color: isDone ? "#15803d" : isInProgress ? "#b45309" : "#475569",
                              }}
                            >
                              {isDone ? "تم النشر ✓" : isInProgress ? "قيد التنفيذ ⏳" : "مخططة 📝"}
                            </span>
                          </div>

                          <div className="marketing-note-meta-row">
                            <span className="marketing-channel-badge">{item.platform || "Instagram"}</span>
                            <span>·</span>
                            <span>النوع: {item.contentType || "منشور"}</span>
                            <span>·</span>
                            <span>تاريخ النشر: {item.dueDate ? formatDate(item.dueDate) : "قريبًا"}</span>
                          </div>

                          <div className="marketing-note-actions">
                            <button
                              type="button"
                              className={`note-toggle-btn ${
                                isDone ? "done" : isInProgress ? "in-progress" : "to-do"
                              }`}
                              onClick={() => handleToggleContentStatus(item)}
                            >
                              {isDone ? (
                                <>
                                  <Check size={14} /> تم النشر بنجاح
                                </>
                              ) : isInProgress ? (
                                <>
                                  <Clock size={14} /> قيد الإنتاج (اضغط للاعتماد)
                                </>
                              ) : (
                                <>
                                  <Clock size={14} /> فكرة مخططة (اضغط لبدء العمل)
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CAMPAIGNS */}
          {activeTab === "campaigns" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                      الحملات الإعلانية النشطة والممولة
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                      تتبع مصادر التمويل والحملات الموسمية ومعدلات تحويل كل حملة إلى طلاب مسجلين.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleCreateCampaign}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr auto",
                    gap: "12px",
                    background: "#f8fafc",
                    padding: "14px",
                    borderRadius: "12px",
                  }}
                >
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    placeholder="اسم الحملة الإعلانية (مثال: عودة المدارس - معسكر الروبوت)"
                    style={{
                      height: "42px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontFamily: "inherit",
                    }}
                  />
                  <select
                    value={campaignChannel}
                    onChange={e => setCampaignChannel(e.target.value)}
                    style={{
                      height: "42px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontFamily: "inherit",
                    }}
                  >
                    <option value="INSTAGRAM">Instagram Ads</option>
                    <option value="FACEBOOK">Facebook Ads</option>
                    <option value="TIKTOK">TikTok Ads</option>
                    <option value="GOOGLE">Google Search</option>
                    <option value="ORGANIC">تفاعل عضوي (Organic)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={savingCampaign}
                    className="lead-action-btn primary"
                    style={{ height: "42px" }}
                  >
                    <Plus size={16} /> {savingCampaign ? "جارٍ الحفظ…" : "تسجيل الحملة"}
                  </button>
                </form>

                <div className="marketing-leads-list">
                  {campaigns.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{item.name}</strong>
                        <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>
                          القناة: {item.channel} · النتائج: {item.leads} Leads · {item.conversions} تحويل مسجل
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: item.status === "ACTIVE" ? "#f0fdf4" : "#f1f5f9",
                          color: item.status === "ACTIVE" ? "#16a34a" : "#475569",
                        }}
                      >
                        {item.status === "ACTIVE"
                          ? "حملة نشطة 🚀"
                          : item.status === "PAUSED"
                          ? "متوقفة مؤقتًا"
                          : item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE LEAD MODAL */}
      {leadModalOpen && (
        <div className="marketing-modal-backdrop" onClick={() => setLeadModalOpen(false)}>
          <div className="marketing-modal-card" onClick={e => e.stopPropagation()}>
            <div className="marketing-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "#f0fdfa",
                    color: "#0f766e",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2>تسجيل Lead جديد فوري</h2>
                  <small style={{ color: "#64748b" }}>إضافة بيانات العميل المحتمل وتوجيهه لفرع الأكاديمية</small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLeadModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="marketing-modal-form">
              <label>
                اسم الطفل / الطالب *
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  placeholder="مثال: يوسف حسام علي"
                />
              </label>

              <label>
                اسم ولي الأمر *
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  placeholder="مثال: حسام علي"
                />
              </label>

              <label>
                رقم هاتف ولي الأمر (واتساب) *
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01012345678"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  الفرع المستهدف *
                  <select value={leadBranch} onChange={e => setLeadBranch(e.target.value)}>
                    <option value="">اختر الفرع الأقرب</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  مصدر الاستفسار *
                  <select value={channel} onChange={e => setChannel(e.target.value)}>
                    <option value="INSTAGRAM">إنستجرام (Instagram)</option>
                    <option value="FACEBOOK">فيسبوك (Facebook)</option>
                    <option value="WHATSAPP">واتساب مباشر</option>
                    <option value="WALK_IN">زيارة مقر الفرع</option>
                    <option value="LANDING_PAGE">الموقع الإلكتروني</option>
                  </select>
                </label>
              </div>

              <label>
                ملاحظات أو الكورس المهتم به
                <textarea
                  rows={2}
                  value={leadNotes}
                  onChange={e => setLeadNotes(e.target.value)}
                  placeholder="مثال: يفضل مواعيد مسائية، مهتم بدبلومة الروبوتكس أو الذكاء الاصطناعي..."
                />
              </label>

              <div className="marketing-modal-footer">
                <button
                  type="button"
                  className="lead-action-btn"
                  onClick={() => setLeadModalOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" disabled={savingLead} className="lead-action-btn primary">
                  {savingLead ? "جارٍ الحفظ…" : "حفظ الـLead في الفرع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CONTENT NOTE MODAL */}
      {contentModalOpen && (
        <div className="marketing-modal-backdrop" onClick={() => setContentModalOpen(false)}>
          <div className="marketing-modal-card" onClick={e => e.stopPropagation()}>
            <div className="marketing-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "#fdf2f8",
                    color: "#be185d",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2>إضافة فكرة / نوت محتوى</h2>
                  <small style={{ color: "#64748b" }}>تدوين الأفكار والمحتوى المخطط للأكاديمية</small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContentModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateContentNote} className="marketing-modal-form">
              <label>
                عنوان الفكرة أو المنشور *
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="مثال: ريلز مشروع روبوت تفادي العوائق للطالب يوسف"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  نوع المحتوى *
                  <select value={noteType} onChange={e => setNoteType(e.target.value)}>
                    <option value="REEL">فيديو ريلز / شورتس 🎬</option>
                    <option value="POST">منشور صور / بوست 🖼️</option>
                    <option value="STORY">ستوري يومي 📱</option>
                    <option value="BROADCAST">رسالة واتساب برودكاست 💬</option>
                    <option value="EVENT">ورشة عمل مجانية / إيفنت 🎪</option>
                  </select>
                </label>

                <label>
                  المنصة المستهدفة *
                  <select value={notePlatform} onChange={e => setNotePlatform(e.target.value)}>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="ALL">كل المنصات</option>
                  </select>
                </label>
              </div>

              <label>
                تاريخ النشر المستهدف
                <input
                  type="date"
                  value={noteDueDate}
                  onChange={e => setNoteDueDate(e.target.value)}
                />
              </label>

              <div className="marketing-modal-footer">
                <button
                  type="button"
                  className="lead-action-btn"
                  onClick={() => setContentModalOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" disabled={savingNote} className="lead-action-btn primary">
                  {savingNote ? "جارٍ الحفظ…" : "حفظ النوت بالأجندة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SUPPORT TICKET MODAL */}
      <QuickSupportTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        roleLabel="مسؤول التسويق والإعلام · R07"
      />
    </RoleDashboardShell>
  );
}
