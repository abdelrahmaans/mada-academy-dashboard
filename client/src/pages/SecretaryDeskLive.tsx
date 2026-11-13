import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Clock,
  GraduationCap,
  LifeBuoy,
  PhoneCall,
  Plus,
  Receipt,
  RefreshCw,
  Snowflake,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import QuickActionsBar from "@/components/QuickActionsBar";
import { QuickPaymentReceiptModal, QuickSupportTicketModal } from "@/components/QuickActionModals";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  mapServerShiftHistoryToHandover,
  type ConvertLeadInput,
  type CreateLeadInput,
  type DirectStudentInput,
  type EvaluationReviewRecord,
  type LeadRecord,
  type SchedulingGroupRecord,
  type ShiftCashHandover,
  type StudentRecord,
  type SubscriptionFreezeRequest,
} from "@/lib/apiClient";
import {
  type SecretaryTab,
  type FreezeFormData,
  type ShiftFormData,
  STATUS_LABELS,
} from "./SecretaryDeskTypes";
import {
  NewLeadModal,
  ConvertLeadModal,
  FreezeRequestModal,
  ShiftHandoverModal,
} from "./SecretaryDeskModals";
import { SecretaryPipelineTab } from "./SecretaryPipelineTab";
import { SecretaryRegistrationTab } from "./SecretaryRegistrationTab";
import { SecretaryFollowupsTab } from "./SecretaryFollowupsTab";
import { SecretaryFreezesTab } from "./SecretaryFreezesTab";
import { SecretaryShiftsTab } from "./SecretaryShiftsTab";
import { SecretaryPulseTab } from "./SecretaryPulseTab";
import { SecretaryGroupsTab } from "./SecretaryGroupsTab";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { Calendar, Layers } from "lucide-react";
import "./SecretaryDeskLive.css";

export default function SecretaryDeskLive() {
  const { me } = useAuth();

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [groups, setGroups] = useState<SchedulingGroupRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeTab, setActiveTab] = useState<SecretaryTab>("pulse");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as SecretaryTab;
      const validTabs: SecretaryTab[] = ["pulse", "pipeline", "groups", "registration", "followups", "freezes", "shifts"];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      } else if (!window.location.hash || window.location.hash === "#") {
        setActiveTab("pulse");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const selectTab = (tab: SecretaryTab) => {
    setActiveTab(tab);
    window.location.hash = tab === "pulse" ? "" : tab;
  };

  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeFormData, setFreezeFormData] = useState<FreezeFormData>({
    studentId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "MEDICAL",
    reasonText: "",
  });

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftFormData, setShiftFormData] = useState<ShiftFormData>({
    shiftName: "MORNING",
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
  const [serverShifts, setServerShifts] = useState<ShiftCashHandover[]>([]);
  const [evaluationReviews, setEvaluationReviews] = useState<EvaluationReviewRecord[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  const branchName =
    me?.branches?.find((branch) => branch.id === me?.branchId)?.name ??
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
      apiClient.listCashierShiftsHistory(),
      apiClient.listEvaluationReviews(),
    ]).then(([leadsRes, groupsRes, studentsRes, freezesRes, shiftsRes, reviewsRes]) => {
      if (!active) return;
      if (leadsRes.status === "fulfilled") setLeads(leadsRes.value.items);
      if (groupsRes.status === "fulfilled") setGroups(groupsRes.value.items);
      if (studentsRes.status === "fulfilled") setStudents(studentsRes.value.items);
      if (freezesRes.status === "fulfilled") setServerFreezes(freezesRes.value);
      if (shiftsRes.status === "fulfilled" && shiftsRes.value?.items) {
        setServerShifts(shiftsRes.value.items.map(mapServerShiftHistoryToHandover));
      }
      if (reviewsRes.status === "fulfilled" && reviewsRes.value?.items) {
        setEvaluationReviews(reviewsRes.value.items);
      }
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
      setRefreshKey((v) => v + 1);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر حفظ العميل المحتمل");
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      await apiClient.updateLeadStatus(id, nextStatus);
      setLeads((current) =>
        current.map((item) => (item.id === id ? { ...item, status: nextStatus as LeadRecord["status"] } : item))
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

      toast.success(
        result.enrollmentStatus === "WAITLISTED"
          ? `تمت إضافة ${result.studentName} إلى قائمة الانتظار`
          : `تم تحويل ${result.studentName} إلى طالب مسجل بنجاح!`,
        {
          description: result.invoiceNumber
            ? `رقم الفاتورة الصادرة: ${result.invoiceNumber}`
            : result.enrollmentStatus === "WAITLISTED"
            ? "سيتم تفعيل التسجيل عند توفر مكان في الجروب."
            : undefined,
        }
      );
      setConvertModalOpen(false);
      setConvertingLead(null);
      setRefreshKey((v) => v + 1);
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
      setRefreshKey((v) => v + 1);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تسجيل الطالب");
    }
  };

  const handleSecretaryFreezeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === freezeFormData.studentId);
    if (!student) {
      toast.error("يرجى اختيار الطالب");
      return;
    }
    if (!freezeFormData.reasonText.trim()) {
      toast.error("يرجى كتابة سبب التجميد بالتفصيل");
      return;
    }
    const group = groups.find((g) => g.branchId === student.branchId);
    try {
      const created = await apiClient.createFreezeRequest({
        studentId: student.id,
        courseOfferingId: group?.id,
        startDate: freezeFormData.startDate,
        endDate: freezeFormData.endDate,
        reason: freezeFormData.reason,
        reasonText: freezeFormData.reasonText,
      });
      setServerFreezes((prev) => [created, ...prev]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تسجيل طلب التجميد على الخادم");
      return;
    }
    setFreezeModalOpen(false);
    setFreezeFormData({
      studentId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      reason: "MEDICAL",
      reasonText: "",
    });
    setRefreshKey((v) => v + 1);
    toast.success(`تم تسجيل طلب التجميد للطالب ${student.fullName} ورفعه لمدير الفرع`);
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(shiftFormData.cashAmount) || 0;
    const electronic = parseFloat(shiftFormData.electronicAmount) || 0;
    const receipts = parseInt(shiftFormData.totalReceiptsCount, 10) || 0;

    if (cash <= 0 && electronic <= 0) {
      toast.error("يرجى إدخال المبالغ المحصلة في الشيفت");
      return;
    }

    const shiftLabel = shiftFormData.shiftName === "MORNING" ? "الوردية الصباحية" : "الوردية المسائية";
    try {
      await apiClient.closeoutCashierShift({
        countedCashPiastres: Math.round(cash * 100),
        electronicPiastres: Math.round(electronic * 100),
        totalReceiptsCount: receipts,
        shiftName: shiftLabel,
        shiftDate: new Date().toISOString().split("T")[0],
        notes: shiftFormData.notes || `تقفيل ${shiftLabel}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إغلاق الوردية على الخادم");
      return;
    }

    setShiftModalOpen(false);
    setShiftFormData({
      shiftName: "MORNING",
      cashAmount: "",
      electronicAmount: "",
      totalReceiptsCount: "",
      notes: "",
    });
    setRefreshKey((v) => v + 1);
    toast.success("تم تقفيل الوردية وتسجيلها للمحاسب للاستلام والمطابقة");
  };

  const openConvertModal = (lead: LeadRecord) => {
    setConvertingLead(lead);
    setConvertData({
      courseOfferingId: lead.courseOfferingId || groups[0]?.id || "",
      discountPercent: 0,
      createInvoice: true,
    });
    setConvertModalOpen(true);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const text = `${item.childName} ${item.parentName} ${item.phone} ${item.notes ?? ""}`.toLowerCase();
      const matchesQuery = !searchQuery.trim() || text.includes(searchQuery.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [leads, statusFilter, searchQuery]);

  const activeLeadsCount = leads.filter((l) => ["NEW", "CONTACTED", "INTERESTED"].includes(l.status)).length;
  const newLeadsCount = leads.filter((l) => l.status === "NEW").length;
  const registeredCount = leads.filter((l) => l.status === "REGISTERED").length;

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
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="secretary-live-workspace" dir="rtl">
        <RoleSurfaceTopbar
          onMenu={() => setMobileNavOpen(true)}
          scopeLabel={`فرع ${branchName}`}
          roleLabel="السكرتارية والاستقبال"
        />
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
                onClick={() => setRefreshKey((v) => v + 1)}
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
        <QuickActionsBar
          actions={[
            { id: "r05-new-lead", label: "تسجيل استفسار جديد", icon: <Plus size={14} />, onClick: () => setNewLeadModalOpen(true), tone: "primary" },
            { id: "r05-payment", label: "تسجيل دفعة اشتراك / إيصال فوري", icon: <Receipt size={14} />, onClick: () => setPaymentModalOpen(true) },
            { id: "r05-freeze", label: "طلب تجميد اشتراك", icon: <Snowflake size={14} />, onClick: () => setFreezeModalOpen(true) },
            { id: "r05-shift", label: "تقفيل عهدة الوردية", icon: <Wallet size={14} />, onClick: () => setShiftModalOpen(true) },
            { id: "r05-ticket", label: "تسجيل تذكرة دعم / استفسار للمنصة", icon: <LifeBuoy size={14} />, onClick: () => setTicketModalOpen(true) },
          ]}
        />

        {/* Live KPI Metric Cards */}
        <section className="secretary-stats-grid" aria-label="مؤشرات الاستقبال والتسجيل">
          <article className="secretary-stat-card stat-teal" onClick={() => selectTab("pipeline")} style={{ cursor: "pointer" }}>
            <span className="stat-icon"><Sparkles size={20} /></span>
            <div>
              <small>استفسارات جديدة</small>
              <strong>{newLeadsCount}</strong>
              <span>بانتظار التواصل الأول</span>
            </div>
          </article>
          <article className="secretary-stat-card stat-blue" onClick={() => selectTab("followups")} style={{ cursor: "pointer" }}>
            <span className="stat-icon"><PhoneCall size={20} /></span>
            <div>
              <small>متابعات نشطة</small>
              <strong>{activeLeadsCount}</strong>
              <span>قيد المتابعة والاهتمام</span>
            </div>
          </article>
          <article className="secretary-stat-card stat-amber" onClick={() => selectTab("pipeline")} style={{ cursor: "pointer" }}>
            <span className="stat-icon"><UserCheck size={20} /></span>
            <div>
              <small>تم تحويلهم للتسجيل</small>
              <strong>{registeredCount}</strong>
              <span>طلاب مسجلون من الاستفسارات</span>
            </div>
          </article>
          <article className="secretary-stat-card stat-navy" onClick={() => selectTab("groups")} style={{ cursor: "pointer" }}>
            <span className="stat-icon"><GraduationCap size={20} /></span>
            <div>
              <small>المجموعات المتاحة</small>
              <strong>{groups.length}</strong>
              <span>{students.length} طالب نشط بالفرع (انقر للعرض)</span>
            </div>
          </article>
        </section>

        {/* Tab Navigation */}
        <div className="secretary-tabs">
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "pulse" ? "active" : ""}`}
            onClick={() => selectTab("pulse")}
          >
            <Calendar size={17} /> جدول اليوم (Daily Pulse)
          </button>
          <button
            type="button"
            className={`secretary-tab-btn ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => selectTab("groups")}
          >
            <Layers size={17} /> المجموعات المتاحة والشعب ({groups.length})
          </button>
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

        {/* TAB 0: Today's Pulse */}
        {activeTab === "pulse" && (
          <SecretaryPulseTab
            groups={groups}
            onDirectRegister={(offeringId) => {
              if (offeringId) {
                setDirectRegistration(cur => ({ ...cur, courseOfferingId: offeringId }));
              }
              selectTab("registration");
            }}
          />
        )}

        {/* TAB 0.5: Groups & Classes */}
        {activeTab === "groups" && (
          <SecretaryGroupsTab
            groups={groups}
            onDirectRegister={(offeringId) => {
              if (offeringId) {
                setDirectRegistration((cur) => ({ ...cur, courseOfferingId: offeringId }));
              }
              selectTab("registration");
            }}
          />
        )}

        {/* TAB 1: Leads Pipeline */}
        {activeTab === "pipeline" && (
          <SecretaryPipelineTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            leads={leads}
            filteredLeads={filteredLeads}
            newLeadsCount={newLeadsCount}
            registeredCount={registeredCount}
            loading={loading}
            groups={groups}
            onOpenNewLeadModal={() => setNewLeadModalOpen(true)}
            onOpenConvertModal={openConvertModal}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* TAB 2: Direct Registration */}
        {activeTab === "registration" && (
          <SecretaryRegistrationTab
            directRegistration={directRegistration}
            setDirectRegistration={setDirectRegistration}
            groups={groups}
            students={students}
            onSubmit={handleDirectRegistration}
          />
        )}

        {/* TAB 3: Today's Followups */}
        {activeTab === "followups" && (
          <SecretaryFollowupsTab
            leads={leads}
            groups={groups}
            onOpenConvertModal={openConvertModal}
            onOpenNewLeadModal={() => setNewLeadModalOpen(true)}
          />
        )}

        {/* TAB 4: Subscription Freezes & Make-up Sessions */}
        {activeTab === "freezes" && (
          <SecretaryFreezesTab
            serverFreezes={serverFreezes}
            evaluationReviews={evaluationReviews}
            onOpenFreezeModal={() => setFreezeModalOpen(true)}
          />
        )}

        {/* TAB 5: Shift Cash Handover */}
        {activeTab === "shifts" && (
          <SecretaryShiftsTab
            shifts={serverShifts}
            onOpenShiftModal={() => setShiftModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <NewLeadModal
        isOpen={newLeadModalOpen}
        onClose={() => setNewLeadModalOpen(false)}
        newLead={newLead}
        setNewLead={setNewLead}
        onSubmit={handleCreateLead}
        groups={groups}
      />

      <ConvertLeadModal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        convertingLead={convertingLead}
        convertData={convertData}
        setConvertData={setConvertData}
        onSubmit={handleConvertLead}
        groups={groups}
      />

      <FreezeRequestModal
        isOpen={freezeModalOpen}
        onClose={() => setFreezeModalOpen(false)}
        freezeFormData={freezeFormData}
        setFreezeFormData={setFreezeFormData}
        onSubmit={handleSecretaryFreezeSubmit}
        students={students}
      />

      <ShiftHandoverModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        shiftFormData={shiftFormData}
        setShiftFormData={setShiftFormData}
        onSubmit={handleShiftSubmit}
      />

      <QuickPaymentReceiptModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        branchName={branchName}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <QuickSupportTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        roleLabel="السكرتارية والاستقبال · R05"
      />
    </RoleDashboardShell>
  );
}
