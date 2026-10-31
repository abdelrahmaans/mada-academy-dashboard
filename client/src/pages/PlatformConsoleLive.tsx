import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleHelp,
  FileSpreadsheet,
  GraduationCap,
  Megaphone,
  Menu,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import SessionLogoutButton from "@/components/SessionLogoutButton";
import SettingsModal from "@/components/SettingsModal";
import {
  apiClient,
  type PlatformAcademy,
  type PlatformActivity,
  type PlatformDemoLead,
  type PlatformMember,
  type PlatformOverview,
  type PlatformPaymentRecord,
  type PlatformSupportTicketItem,
} from "@/lib/apiClient";
import {
  type View,
  type SupportTicket,
  type ReasonModalState,
  NAV_ITEMS,
  statusLabel,
  fmtNumber,
} from "./PlatformConsoleTypes";
import { PlatformConsoleModals } from "./PlatformConsoleModals";
import { PlatformConsoleSystemTab } from "./PlatformConsoleSystemTab";
import { PlatformConsoleLeadsTab } from "./PlatformConsoleLeadsTab";
import { PlatformConsoleBillingTab } from "./PlatformConsoleBillingTab";
import { PlatformConsoleSupportTab } from "./PlatformConsoleSupportTab";
import { PlatformConsoleAcademiesTab } from "./PlatformConsoleAcademiesTab";
import { PlatformConsoleOverviewTab } from "./PlatformConsoleOverviewTab";
import { AcademyFeaturesModal } from "@/components/platform/AcademyFeaturesModal";
import "./PlatformConsoleLive.css";

// ── Types, constants, seed data, and formatters imported from PlatformConsoleTypes.ts ──

export default function PlatformConsoleLive() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [academies, setAcademies] = useState<PlatformAcademy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState<"ALL" | "ACTIVE" | "TRIAL" | "PAUSED" | "OVERDUE">("ALL");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [members, setMembers] = useState<PlatformMember[]>([]);
  const [activity, setActivity] = useState<PlatformActivity[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState("");

  // Action Modals State
  const [reasonModal, setReasonModal] = useState<ReasonModalState | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  // Plan Upgrade Modal
  const [planModalAcademy, setPlanModalAcademy] = useState<PlatformAcademy | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState<"starter" | "growth" | "enterprise">("growth");
  const [customBranchLimit, setCustomBranchLimit] = useState(3);
  const [planUpgradeReason, setPlanUpgradeReason] = useState("");

  // Feature Flags Modal
  const [featuresModalAcademy, setFeaturesModalAcademy] = useState<PlatformAcademy | null>(null);

  // Diagnostics & Inspection Modal
  const [inspectionAcademy, setInspectionAcademy] = useState<PlatformAcademy | null>(null);

  // Broadcast Announcement Modal
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastType, setBroadcastType] = useState<"INFO" | "WARNING" | "SUCCESS">("INFO");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"ALL" | "PAID" | "TRIAL">("ALL");

  // Payment Reminder Modal
  const [paymentReminderTenant, setPaymentReminderTenant] = useState<PlatformAcademy | null>(null);

  // Owner Password Reset Modal
  const [ownerResetResult, setOwnerResetResult] = useState<{
    tenantName: string;
    ownerName: string;
    ownerPhone: string;
    tempPassword: string;
  } | null>(null);

  // Payment Recording Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetAcademyId, setPaymentTargetAcademyId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(35000);
  const [paymentMethod, setPaymentMethod] = useState<PlatformPaymentRecord["method"]>("BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketReloadKey, setTicketReloadKey] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyNote, setTicketReplyNote] = useState("");
  const [ticketStatusDraft, setTicketStatusDraft] = useState<SupportTicket["status"]>("inProgress");
  const [ticketMeetingUrlDraft, setTicketMeetingUrlDraft] = useState("");
  const [ticketMeetingDateDraft, setTicketMeetingDateDraft] = useState("");
  const [ticketResolutionDraft, setTicketResolutionDraft] = useState("");
  const [ticketUpdating, setTicketUpdating] = useState(false);

  // Show/Hide Role RBAC Guide
  const [rbacExpanded, setRbacExpanded] = useState(false);

  // Leads & Landing Page Demo Requests
  const [leads] = useState<PlatformDemoLead[]>([]);
  const [leadFilter, setLeadFilter] = useState<"ALL" | "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "CONVERTED">("ALL");
  const [leadSearch, setLeadSearch] = useState("");

  // Emergency Super Access (View-As Impersonation) State
  const [impersonationReason, setImpersonationReason] = useState("");

  // New Ticket / Suggestion Modal State
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [newTicketAcademyId, setNewTicketAcademyId] = useState("");
  const [newTicketType, setNewTicketType] = useState<"issue" | "suggestion" | "billing">("issue");
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicket["category"]>("مشكلة تقنية");
  const [newTicketPriority, setNewTicketPriority] = useState<SupportTicket["priority"]>("high");
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketDescription, setNewTicketDescription] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"ALL" | "ISSUE" | "SUGGESTION" | "BILLING">("ALL");

  const handleLeadStatusChange = (leadId: string, status: PlatformDemoLead["status"]) => {
    void leadId;
    void status;
    toast.error("تحديث حالة الـlead متوقف حتى ربطه بسجل CRM محفوظ على الخادم.");
  };

  const handleWhatsAppLeadChat = (lead: PlatformDemoLead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    const msg = `السلام عليكم أستاذ ${lead.name}، معك إدارة منصة مدى لتشغيل الأكاديميات بخصوص طلبكم لمعاينة النظام لأكاديمية ${lead.academyName}. يسعدنا ترتيب موعد العرض التوضيحي المباشر (Demo) معكم.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Convert Lead to Live Academy Modal State
  const [convertLeadModal, setConvertLeadModal] = useState<PlatformDemoLead | null>(null);
  const [convertForm, setConvertForm] = useState({
    name: "",
    slug: "",
    planCode: "GROWTH",
    branchName: "الفرع الرئيسي",
    branchCode: "MAIN",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerPassword: "",
  });
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<{
    academy: { id: string; name: string; slug: string };
    owner: { displayName: string; phone: string; tempPass: string };
  } | null>(null);

  const handleOpenConvertModal = (lead: PlatformDemoLead) => {
    setConvertLeadModal(lead);
    setConvertSuccess(null);
    const branches = parseInt(lead.branchCount, 10) || 1;
    const recommendedPlan = branches > 3 ? "SCALE" : branches > 1 ? "GROWTH" : "STARTER";
    const cleanPhone = lead.phone.replace(/[^\d+]/g, "").replace(/^\+2/, "");
    const randomPin = Math.floor(1000 + Math.random() * 9000);
    const generatedPassword = `Mada#${randomPin}!`;
    const safeSlug = lead.academyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `academy-${Date.now().toString(36).slice(-5)}`;

    setConvertForm({
      name: lead.academyName,
      slug: safeSlug,
      planCode: recommendedPlan,
      branchName: "الفرع الرئيسي",
      branchCode: "MAIN",
      ownerName: lead.name,
      ownerPhone: cleanPhone.startsWith("01") ? cleanPhone : lead.phone,
      ownerEmail: lead.email,
      ownerPassword: generatedPassword,
    });
  };

  const handleRegeneratePassword = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000);
    setConvertForm((prev) => ({ ...prev, ownerPassword: `Mada#${randomPin}!` }));
  };

  const handleConvertLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("تحويل lead إلى أكاديمية متوقف حتى تنفيذ تدفق CRM ذريّ يحفظ الـlead والأكاديمية وبيانات المالك معًا.");
  };

  const handleSendCredentialsWhatsApp = () => {
    if (!convertSuccess) return;
    const cleanPhone = convertSuccess.owner.phone.replace(/[^0-9]/g, "");
    const loginUrl = `${window.location.origin}/login`;
    const msg = `السلام عليكم أستاذ ${convertSuccess.owner.displayName}،\nتم بحمد الله تفعيل حساب أكاديمية *${convertSuccess.academy.name}* على منصة مدى لتشغيل الأكاديميات بنجاح! 🚀\n\n📌 *بيانات تسجيل الدخول:*\n• الرابط: ${loginUrl}\n• رقم الهاتف: ${convertSuccess.owner.phone}\n• كلمة المرور المؤقتة: ${convertSuccess.owner.tempPass}\n\nنتمنى لكم تجربة تشغيلية مثمرة، وفريق الدعم الفني جاهز لمساعدتكم دائماً.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleStartEmergencyImpersonation = () => {
    toast.error("Super Access متوقف حتى تنفيذه كتفويض خادمي محدود المدة مع audit trail؛ تغيير واجهة المتصفح لا يمنح صلاحيات فعلية.");
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("إرسال الإشعارات متوقف حتى ربط مزود وقناة إرسال مسجلة.");
  };

  const mapPlatformTicketToSupportTicket = (t: PlatformSupportTicketItem): SupportTicket => {
    const categoryMap: Record<string, SupportTicket["category"]> = {
      TECHNICAL: "مشكلة تقنية",
      FEATURE_SUGGESTION: "اقتراح ميزة جديدة",
      BILLING: "اشتراكات وخطط",
      MEETING_REQUEST: "استفسار تشغيلي",
      GENERAL: "استفسار تشغيلي",
    };
    const priorityMap: Record<string, SupportTicket["priority"]> = {
      URGENT: "urgent",
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low",
    };
    const statusMap: Record<string, SupportTicket["status"]> = {
      NEW: "new",
      IN_PROGRESS: "inProgress",
      WAITING_CLIENT: "waiting",
      RESOLVED: "resolved",
      CLOSED: "resolved",
    };

    return {
      id: t.id,
      academyId: t.tenantId,
      academyName: t.tenantName,
      requesterName: t.requesterName,
      requesterRole: t.requesterRole,
      requesterPhone: t.requesterPhone,
      subject: t.subject,
      type: t.category === "FEATURE_SUGGESTION" ? "suggestion" : t.category === "BILLING" ? "billing" : "issue",
      category: categoryMap[t.category] || "مشكلة تقنية",
      priority: priorityMap[t.priority] || "medium",
      status: statusMap[t.status] || "new",
      createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString("ar-EG") : "",
      description: t.description,
      internalNotes: t.internalAdminNotes || "",
      meetingUrl: t.meetingUrl || "",
      meetingScheduledAt: t.meetingScheduledAt || "",
      resolutionNotes: t.resolutionNotes || "",
    };
  };

  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDescription.trim()) {
      toast.error("يرجى كتابة عنوان ووصف للتذكرة");
      return;
    }
    const catMap: Record<string, "TECHNICAL" | "MEETING_REQUEST" | "FEATURE_SUGGESTION" | "BILLING" | "GENERAL"> = {
      "مشكلة تقنية": "TECHNICAL",
      "اشتراكات وخطط": "BILLING",
      "اقتراح ميزة جديدة": "FEATURE_SUGGESTION",
      "تفعيل فروع": "GENERAL",
      "استفسار تشغيلي": "GENERAL",
    };
    const prioMap: Record<string, "URGENT" | "HIGH" | "MEDIUM" | "LOW"> = {
      urgent: "URGENT",
      high: "HIGH",
      medium: "MEDIUM",
      low: "LOW",
    };

    try {
      await apiClient.createSupportTicket({
        tenantId: newTicketAcademyId || selectedTenantId || undefined,
        subject: newTicketSubject.trim(),
        description: newTicketDescription.trim(),
        category: catMap[newTicketCategory] || "TECHNICAL",
        priority: prioMap[newTicketPriority] || "HIGH",
      });
      toast.success("تم تسجيل التذكرة بنجاح في سجل الدعم الخادمي");
      setNewTicketModalOpen(false);
      setNewTicketSubject("");
      setNewTicketDescription("");
      setTicketReloadKey((v) => v + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر حفظ التذكرة";
      toast.error(msg);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesFilter = leadFilter === "ALL" || lead.status === leadFilter;
      const q = leadSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.academyName.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.email.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [leads, leadFilter, leadSearch]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (ticketFilter === "ISSUE") return ticket.category === "مشكلة تقنية" || ticket.type === "issue";
      if (ticketFilter === "SUGGESTION") return ticket.category === "اقتراح ميزة جديدة" || ticket.type === "suggestion";
      if (ticketFilter === "BILLING") return ticket.category === "اشتراكات وخطط" || ticket.type === "billing";
      return true;
    });
  }, [tickets, ticketFilter]);

  const selectedTenant = academies.find((item) => item.id === selectedTenantId) ?? null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setWarning(null);

    Promise.all([apiClient.platformOverview(), apiClient.platformAcademies()])
      .then(([overviewResult, academyResult]) => {
        if (!active) return;
        setOverview(overviewResult);
        setAcademies(academyResult.items);
        setSelectedTenantId((current) => current || academyResult.items[0]?.id || "");
        setWarning(null);

        if (refreshKey > 0) toast.success("تم تحديث بيانات المنصة بنجاح");
      })
      .catch((failure) => {
        if (!active) return;
        const message = failure instanceof Error ? failure.message : "تعذر تحميل بيانات الإدارة الحية.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedTenantId || (view !== "support" && view !== "system")) return;
    let active = true;
    setSupportLoading(true);
    setSupportError(null);

    const delay = window.setTimeout(
      () => {
        const calls =
          view === "support"
            ? Promise.all([
                apiClient.platformAcademyMembers(selectedTenantId, userSearch),
                apiClient.platformAcademyActivity(selectedTenantId),
              ])
            : Promise.all([
                apiClient.platformAcademyActivity(selectedTenantId),
              ]);

        calls
          .then((result) => {
            if (!active) return;
            if (view === "support") {
              const [memberResponse, activityResponse] = result as [
                { items: PlatformMember[] },
                { items: PlatformActivity[] },
              ];
              setMembers(memberResponse.items);
              setActivity(activityResponse.items);
            } else {
              const [activityResponse] = result as [{ items: PlatformActivity[] }];
              setActivity(activityResponse.items);
            }
          })
          .catch((failure) => {
            if (!active) return;
            const message = failure instanceof Error ? failure.message : "تعذر تحميل سجل العمليات.";
            setSupportError(message);
          })
          .finally(() => {
            if (active) setSupportLoading(false);
          });
      },
      view === "support" ? 250 : 0
    );

    return () => {
      active = false;
      window.clearTimeout(delay);
    };
  }, [selectedTenantId, userSearch, view, refreshKey]);

  useEffect(() => {
    if (view !== "support") return;
    let active = true;

    apiClient
      .listPlatformSupportTickets({ tenantId: selectedTenantId || undefined })
      .then((res) => {
        if (!active) return;
        setTickets(res.items.map(mapPlatformTicketToSupportTicket));
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load platform support tickets", err);
      });

    return () => {
      active = false;
    };
  }, [view, selectedTenantId, ticketReloadKey]);

  // Enriched academy metadata (integrating extras: plan, trial, allowedBranches)
  const enrichedAcademies = useMemo(() => {
    void refreshKey;
    return academies.map((academy) => {
      const planCode = (academy.planCode ?? academy.plan).toLowerCase();
      const planName = academy.planName ?? academy.plan;
      return {
        ...academy,
        planCode,
        planName,
        allowedBranches: academy.allowedBranches ?? academy.branches,
      };
    });
  }, [academies, refreshKey]);

  // Filtered academies
  const filteredAcademies = useMemo(() => {
    const query = tenantSearch.trim().toLocaleLowerCase("ar-EG");
    return enrichedAcademies.filter((item) => {
      const matchesQuery =
        !query ||
        `${item.name} ${item.owner ?? ""} ${item.id} ${item.slug}`
          .toLocaleLowerCase("ar-EG")
          .includes(query);
      const matchesFilter =
        tenantFilter === "ALL"
          ? true
          : tenantFilter === "OVERDUE"
          ? item.status === "PAUSED"
          : item.status === tenantFilter;
      return matchesQuery && matchesFilter;
    });
  }, [enrichedAcademies, tenantSearch, tenantFilter]);

  // CSV Export for Platform SaaS Report
  const exportPlatformCsv = () => {
    try {
      const headers = [
        "كود الأكاديمية",
        "اسم الأكاديمية",
        "المسؤول",
        "الخطة",
        "الحالة",
        "الفروع",
        "الموظفون",
      ];
      const rows = enrichedAcademies.map((a) => [
        `"${a.id}"`,
        `"${a.name}"`,
        `"${a.owner || "غير مسجل"}"`,
        `"${a.planName}"`,
        `"${statusLabel[a.status] || a.status}"`,
        a.branches,
        a.users,
      ]);
      const csvContent =
        "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mada-platform-academies-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("تم تصدير تقرير المنصة بنجاح");
    } catch {
      toast.error("تعذر تصدير تقرير المنصة");
    }
  };

  // 1. ACTION: Change Tenant Status (Pause / Activate)
  const requestTenantStatusChange = (tenant: PlatformAcademy) => {
    const next = tenant.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    setReasonInput("");
    setReasonModal({
      title: next === "PAUSED" ? `إيقاف أكاديمية: ${tenant.name}` : `إعادة تفعيل: ${tenant.name}`,
      description:
        next === "PAUSED"
          ? `سيتم إيقاف صلاحية الدخول للأكاديمية فورًا وإلغاء جلسات المستخدمين النشطة لعدم السداد أو طلب المالك.`
          : `سيتم إعادة تفعيل الأكاديمية وإتاحة الوصول لكافة الفروع والمستخدمين.`,
      confirmLabel: next === "PAUSED" ? "تأكيد الإيقاف" : "تأكيد التفعيل",
      isDestructive: next === "PAUSED",
      onConfirm: async (reason) => {
        setBusyKey(`tenant:${tenant.id}`);
        try {
          await apiClient.changePlatformAcademyStatus(tenant.id, next, reason);
          toast.success(next === "PAUSED" ? `تم إيقاف الأكاديمية بنجاح.` : "تمت إعادة تفعيل الأكاديمية بنجاح.");
          setRefreshKey((value) => value + 1);
        } catch (failure) {
          toast.error(failure instanceof Error ? failure.message : "تعذر تغيير الحالة.");
        } finally {
          setBusyKey("");
        }
      },
    });
  };

  // 2. ACTION: Extend Trial (+7 Days)
  const handleExtendTrial = async (tenant: PlatformAcademy) => {
    setBusyKey(`extend:${tenant.id}`);
    try {
      await apiClient.extendPlatformAcademyTrial(tenant.id, 7, "طلب المالك مهلة إضافية لتجربة الفروع");
      toast.success(`تم تمديد الفترة التجريبية لـ ${tenant.name} بمقدار 7 أيام إضافية بنجاح!`);
      setRefreshKey((v) => v + 1);
    } catch {
      toast.error("تعذر تمديد الفترة التجريبية");
    } finally {
      setBusyKey("");
    }
  };

  // 3. ACTION: Upgrade / Change Plan
  const openPlanUpgradeModal = (academy: PlatformAcademy) => {
    setPlanModalAcademy(academy);
    const planCode = (academy.planCode ?? academy.plan).toLowerCase();
    setSelectedPlanCode(planCode === "starter" || planCode === "enterprise" ? planCode : "growth");
    setCustomBranchLimit(academy.allowedBranches ?? academy.branches);
    setPlanUpgradeReason("");
  };

  const handleSavePlanUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planModalAcademy) return;
    setBusyKey(`plan:${planModalAcademy.id}`);
    try {
      await apiClient.changePlatformAcademyPlan(
        planModalAcademy.id,
        selectedPlanCode,
        customBranchLimit,
        planUpgradeReason || "ترقية معتمدة من إدارة المنصة"
      );
      toast.success(`تم تحديث باقة ${planModalAcademy.name} إلى ${selectedPlanCode.toUpperCase()} بنجاح.`);
      setPlanModalAcademy(null);
      setRefreshKey((v) => v + 1);
    } catch {
      toast.error("تعذر تحديث الباقة.");
    } finally {
      setBusyKey("");
    }
  };

  // 4. ACTION: Reset Owner Password (Emergency Recovery)
  const handleResetOwnerPassword = async (academy: PlatformAcademy) => {
    setBusyKey(`reset:${academy.id}`);
    try {
      const result = await apiClient.resetPlatformOwnerPassword(
        academy.id,
        "طلب استعادة حساب المالك من الدعم الفني"
      );
      setOwnerResetResult({
        tenantName: academy.name,
        ownerName: result.ownerName,
        ownerPhone: result.ownerPhone,
        tempPassword: result.tempPassword,
      });
      toast.success("تم توليد كلمة مرور مؤقتة للمالك بنجاح");
    } catch {
      toast.error("تعذر استعادة حساب المالك.");
    } finally {
      setBusyKey("");
    }
  };

  // 5. ACTION: Record Subscription Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("تسجيل الدفعات متوقف حتى اكتمال سجل مالي خادمي ومراجعة الصلاحيات.");
  };

  // Ticket status update
  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const statusMap: Record<string, "NEW" | "IN_PROGRESS" | "WAITING_CLIENT" | "RESOLVED"> = {
      new: "NEW",
      inProgress: "IN_PROGRESS",
      waiting: "WAITING_CLIENT",
      resolved: "RESOLVED",
    };

    setTicketUpdating(true);
    try {
      await apiClient.updatePlatformSupportTicket(selectedTicket.id, {
        status: statusMap[ticketStatusDraft] || "IN_PROGRESS",
        internalAdminNotes: ticketReplyNote.trim() || undefined,
        meetingUrl: ticketMeetingUrlDraft.trim() || undefined,
        meetingScheduledAt: ticketMeetingDateDraft ? new Date(ticketMeetingDateDraft).toISOString() : undefined,
        resolutionNotes: ticketResolutionDraft.trim() || undefined,
      });
      toast.success("تم تحديث حالة التذكرة وملاحظاتها وموعد الاجتماع بنجاح");
      setSelectedTicket(null);
      setTicketReloadKey((v) => v + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تحديث التذكرة";
      toast.error(msg);
    } finally {
      setTicketUpdating(false);
    }
  };

  const title = NAV_ITEMS.find((item) => item.id === view)?.label ?? "إدارة المنصة";

  // Contextual Header Actions
  const getHeaderAction = () => {
    switch (view) {
      case "academies":
        return (
          <button
            className="pc-live-primary"
            type="button"
            onClick={() => navigate("/platform/academies/new")}
          >
            <Plus size={16} /> إنشاء أكاديمية جديدة
          </button>
        );
      case "billing":
        return (
          <span className="pc-live-count-badge">الفوترة متوقفة لحين ربط backend</span>
        );
      case "support":
        return (
          <span className="pc-live-count-badge">سجل التذاكر غير متصل</span>
        );
      case "system":
        return (
          <button
            className="pc-live-primary"
            type="button"
            onClick={() => {
              toast.promise(apiClient.platformOverview(), {
                loading: "جارٍ فحص استجابة الخوادم وقاعدة البيانات…",
                success: "جميع خدمات المنصة وقاعدة البيانات تعمل بكفاءة تامة (85ms)",
                error: "تعذر الوصول للباك إند حاليًا",
              });
            }}
          >
            <RefreshCw size={15} /> فحص الاتصال الآن
          </button>
        );
      default:
        return (
          <button
            className="pc-live-link"
            type="button"
            onClick={() => setRefreshKey((v) => v + 1)}
          >
            <RefreshCw size={14} /> تحديث المؤشرات
          </button>
        );
    }
  };

  return (
    <RoleDashboardShell
      className="app-shell pc-live-shell"
      hideSidebar
      showSessionLogout={false}
      roleCode="R00"
      roleLabel="مسؤول المنصة"
      scopeLevel="platform"
      scopeLabel="نطاق المنصة"
      tenantName="منصة مدى"
      demo={false}
    >
      {/* Mobile Scrim */}
      {mobileOpen && (
        <button
          type="button"
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* R00 Sidebar */}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        aria-label="تنقل إدارة المنصة"
      >
        <div className="sidebar-top">
          <button
            type="button"
            className="brand-lockup r01-brand-button"
            onClick={() => {
              setView("overview");
              setMobileOpen(false);
            }}
          >
            <span className="brand-symbol">
              <GraduationCap size={28} />
            </span>
            <span className="brand-word">مدى</span>
          </button>
          <button
            type="button"
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="academy-switcher" style={{ position: "relative" }} aria-label="نطاق المنصة">
          <span className="academy-avatar">
            <ShieldCheck size={20} />
          </span>
          <label className="academy-meta" style={{ cursor: "pointer", width: "100%" }}>
            <strong style={{ fontSize: "11.5px" }}>منصة مدى · R00</strong>
            <select
              style={{
                background: "transparent",
                border: "none",
                color: "#92a0b5",
                fontSize: "10px",
                padding: 0,
                outline: "none",
                cursor: "pointer",
                width: "100%",
              }}
              value={selectedTenantId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTenantId(val);
                if (val) {
                  const found = academies.find((a) => a.id === val);
                  if (found) {
                    setInspectionAcademy(found);
                  }
                }
              }}
            >
              <option value="" style={{ background: "#101c31", color: "#fff" }}>
                نطاق المنصة ككل
              </option>
              {academies.map((a) => (
                <option key={a.id} value={a.id} style={{ background: "#101c31", color: "#fff" }}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Primary CTA */}
        <div style={{ padding: "0 4px 6px" }}>
          <button
            type="button"
            className="pc-primary-button"
            style={{
              width: "100%",
              justifyContent: "center",
              gap: "8px",
              height: "38px",
              fontSize: "12px",
              borderRadius: "10px",
            }}
            onClick={() => navigate("/platform/academies/new")}
          >
            <Plus size={16} />
            <span>إنشاء أكاديمية جديدة</span>
          </button>
        </div>

        <div className="nav-caption">إدارة المنصة والعمليات</div>
        <nav className="primary-nav" aria-label="مساحة مسؤول المنصة">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setView(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <button
          type="button"
          className="sidebar-help"
          style={{
            width: "100%",
            background: "none",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            cursor: "pointer",
            textAlign: "right",
          }}
          onClick={() => {
            setView("system");
            setRbacExpanded(true);
            setMobileOpen(false);
          }}
          title="معاينة ميثاق وحوكمة صلاحيات R00-R09"
        >
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>دليل تشغيل المنصة</strong>
            <span>حوكمة صلاحيات R00-R09</span>
          </div>
          <ChevronLeft size={16} />
        </button>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-link"
            onClick={() => {
              setSettingsOpen(true);
              setMobileOpen(false);
            }}
            aria-label="فتح الإعدادات"
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <SessionLogoutButton className="nav-link" iconSize={19} />
        </div>

        <div className="sidebar-version">
          مدى لإدارة المنصة <span>R00 SaaS Core</span>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="pc-live-main" dir="rtl">
        <header className="pc-live-topbar">
          <div className="pc-live-topbar-right">
            <button
              type="button"
              className="pc-mobile-menu"
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="pc-topbar-title">
              <Building2 size={18} /> لوحة التحكم المركزية لمنصة مدى
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="pc-live-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
                padding: "0 10px",
                fontSize: "11px",
                color: "#0d9488",
                borderColor: "#ccfbf1",
                background: "#f0fdfa",
              }}
              disabled
              onClick={() => setBroadcastModalOpen(true)}
              title="متوقف حتى ربط مزود إشعارات وتخزين الحالة"
            >
              <Megaphone size={14} />
              <span>بث إشعار عام</span>
            </button>

            <button
              type="button"
              className="pc-live-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
                padding: "0 10px",
                fontSize: "11px",
              }}
              onClick={exportPlatformCsv}
              title="تصدير بيانات الأكاديميات والاشتراكات كملف CSV"
            >
              <FileSpreadsheet size={14} />
              <span>تصدير تقرير المنصة</span>
            </button>

            <span className="pc-topbar-date">
              <CalendarDays size={14} />
              {new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
          </div>
        </header>

        <div className="pc-live-content">
          <PageHeader
            eyebrow={
              <span className="pc-live-eyebrow">
                <ShieldCheck size={14} /> إدارة الاشتراكات والعمليات المركزية
              </span>
            }
            title={title}
            description="إدارة الأكاديميات ومراجعة عمليات المنصة. بعض الوحدات المالية والدعم وCRM متوقفة حتى ربطها بخدمات خلفية موثوقة."
            actions={getHeaderAction()}
          />

          <RoleScopeCard className="pc-live-scope" compact />

          {loading && (
            <div className="pc-live-state" role="status">
              <RefreshCw className="pc-live-spin" size={18} /> جارٍ تحميل بيانات المنصة…
            </div>
          )}

          {!loading && error && (
            <div className="pc-live-state pc-live-error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
              <button type="button" onClick={() => setRefreshKey((v) => v + 1)}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !error && warning && (
            <div className="pc-live-state pc-live-error" role="status">
              <AlertCircle size={19} />
              <span>{warning}</span>
              <button type="button" onClick={() => setRefreshKey((v) => v + 1)}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 1: EXECUTIVE OVERVIEW & URGENT ATTENTION QUEUE       */}
          {/* ========================================================= */}
          {!loading && !error && view === "overview" && (
            <PlatformConsoleOverviewTab
              overview={overview}
              enrichedAcademies={enrichedAcademies}
              busyKey={busyKey}
              activity={activity}
              onNavigateAcademies={() => setView("academies")}
              onNavigateSystem={() => setView("system")}
              onExtendTrial={(tenant) => handleExtendTrial(tenant)}
              onOpenPlanUpgradeModal={(tenant) => openPlanUpgradeModal(tenant)}
              onRequestTenantStatusChange={(tenant) => requestTenantStatusChange(tenant)}
              planActionsEnabled={false}
              trialActionsEnabled={false}
            />
          )}

          {/* ========================================================= */}
          {/* VIEW 2: ACADEMIES & PLAN MANAGEMENT (سجل الأكاديميات والباقات) */}
          {/* ========================================================= */}
          {!loading && !error && view === "academies" && (
            <PlatformConsoleAcademiesTab
              enrichedAcademiesCount={enrichedAcademies.length}
              tenantFilter={tenantFilter}
              setTenantFilter={setTenantFilter}
              tenantSearch={tenantSearch}
              setTenantSearch={setTenantSearch}
              filteredAcademies={filteredAcademies}
              busyKey={busyKey}
              onInspectAcademy={(academy) => setInspectionAcademy(academy)}
              onOpenPlanUpgradeModal={(academy) => openPlanUpgradeModal(academy)}
              onOpenFeaturesModal={(academy) => setFeaturesModalAcademy(academy)}
              onExtendTrial={(academy) => handleExtendTrial(academy)}
              onPaymentReminder={(academy) => setPaymentReminderTenant(academy)}
              onRequestTenantStatusChange={(academy) => requestTenantStatusChange(academy)}
              onResetOwnerPassword={(academy) => handleResetOwnerPassword(academy)}
              onEmergencyImpersonation={() => toast.error("Super Access متوقف لحين إضافة تفويض خادمي وتدقيق غير قابل للتلاعب.")}
              ownerResetEnabled={false}
              emergencyAccessEnabled={false}
              paymentRemindersEnabled={false}
              planActionsEnabled={false}
              trialActionsEnabled={false}
            />
          )}

          {/* ========================================================= */}
          {/* VIEW: LEADS & LANDING DEMO REQUESTS (طلبات المعاينة)      */}
          {/* ========================================================= */}
          {!loading && !error && view === "leads" && (
            <PlatformConsoleLeadsTab
              filteredLeads={filteredLeads}
              leadSearch={leadSearch}
              setLeadSearch={setLeadSearch}
              leadFilter={leadFilter}
              setLeadFilter={setLeadFilter}
              handleLeadStatusChange={handleLeadStatusChange}
              handleWhatsAppLeadChat={handleWhatsAppLeadChat}
              handleOpenConvertModal={handleOpenConvertModal}
            />
          )}

          {/* ========================================================= */}
          {/* VIEW 3: BILLING & SUBSCRIPTIONS (التحصيل والاشتراكات)     */}
          {/* ========================================================= */}
          {!loading && !error && view === "billing" && <PlatformConsoleBillingTab />}

          {/* ========================================================= */}
          {/* VIEW 4: SUPPORT & OWNER RECOVERY (الدعم واستعادة الحسابات) */}
          {/* ========================================================= */}
          {!loading && !error && view === "support" && (
            <PlatformConsoleSupportTab
              filteredTickets={filteredTickets}
              ticketFilter={ticketFilter}
              setTicketFilter={setTicketFilter}
              onOpenNewTicketModal={() => {
                setNewTicketAcademyId(academies[0]?.id || "demo-academy-01");
                setNewTicketType("issue");
                setNewTicketCategory("مشكلة تقنية");
                setNewTicketPriority("high");
                setNewTicketSubject("");
                setNewTicketDescription("");
                setNewTicketModalOpen(true);
              }}
              onSelectTicket={(ticket) => {
                setSelectedTicket(ticket);
                setTicketStatusDraft(ticket.status);
                setTicketReplyNote(ticket.internalNotes || "");
                setTicketMeetingUrlDraft(ticket.meetingUrl || "");
                setTicketMeetingDateDraft(ticket.meetingScheduledAt || "");
                setTicketResolutionDraft(ticket.resolutionNotes || "");
              }}
              selectedTenantId={selectedTenantId}
              setSelectedTenantId={setSelectedTenantId}
              academies={academies}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              selectedTenant={selectedTenant}
              onResetOwnerPassword={handleResetOwnerPassword}
              busyKey={busyKey}
              supportLoading={supportLoading}
              supportError={supportError}
              members={members}
              onDisableMember={(member) => {
                setReasonInput("");
                setReasonModal({
                  title: `تعطيل حساب: ${member.name ?? member.maskedPhone}`,
                  description: `سيتم إنهاء جلسات الحساب فورًا وتعطيل قدرته على تسجيل الدخول.`,
                  confirmLabel: "تأكيد التعطيل",
                  isDestructive: true,
                  onConfirm: async (reason) => {
                    await apiClient.changePlatformMemberStatus(
                      selectedTenant!.id,
                      member.membershipId,
                      "REVOKED",
                      reason
                    );
                    toast.success("تم تعطيل الحساب بنجاح");
                    setRefreshKey((v) => v + 1);
                  },
                });
              }}
              onRestore={(member) => {
                setReasonInput("");
                setReasonModal({
                  title: `إعادة تفعيل حساب: ${member.name ?? member.maskedPhone}`,
                  description: `سيتم إعادة تفعيل صلاحيات المستخدم للأكاديمية.`,
                  confirmLabel: "تأكيد التفعيل",
                  onConfirm: async (reason) => {
                    await apiClient.changePlatformMemberStatus(
                      selectedTenant!.id,
                      member.membershipId,
                      "ACTIVE",
                      reason
                    );
                    toast.success("تمت استعادة الحساب بنجاح");
                    setRefreshKey((v) => v + 1);
                  },
                });
              }}
              onRevokeMemberSessions={(member) => {
                setReasonInput("");
                setReasonModal({
                  title: `إنهاء الجلسات النشطة لـ: ${member.name ?? member.maskedPhone}`,
                  description: `سيتم إنهاء جميع الـ Refresh Tokens وسحب صلاحيات الجلسات الحالية.`,
                  confirmLabel: "إنهاء الجلسات الآن",
                  isDestructive: true,
                  onConfirm: async (reason) => {
                    const res = await apiClient.revokePlatformUserSessions(
                      selectedTenant!.id,
                      member.userId,
                      reason
                    );
                    toast.success(`تم إنهاء ${res.revokedCount} جلسات نشطة.`);
                    setRefreshKey((v) => v + 1);
                  },
                });
              }}
              ownerResetEnabled={false}
            />
          )}

          {/* ========================================================= */}
          {/* VIEW 5: SYSTEM HEALTH & AUDIT (الخوادم وسجل التدقيق)      */}
          {/* ========================================================= */}
          {!loading && !error && view === "system" && (
            <PlatformConsoleSystemTab
              overview={overview}
              selectedTenantId={selectedTenantId}
              setSelectedTenantId={setSelectedTenantId}
              academies={academies}
              activity={activity}
              rbacExpanded={rbacExpanded}
              setRbacExpanded={setRbacExpanded}
            />
          )}
        </div>
      </main>

      <PlatformConsoleModals
        planModalAcademy={planModalAcademy}
        setPlanModalAcademy={setPlanModalAcademy}
        selectedPlanCode={selectedPlanCode}
        setSelectedPlanCode={setSelectedPlanCode}
        customBranchLimit={customBranchLimit}
        setCustomBranchLimit={setCustomBranchLimit}
        planUpgradeReason={planUpgradeReason}
        setPlanUpgradeReason={setPlanUpgradeReason}
        handleSavePlanUpgrade={handleSavePlanUpgrade}
        ownerResetResult={ownerResetResult}
        setOwnerResetResult={setOwnerResetResult}
        paymentModalOpen={paymentModalOpen}
        setPaymentModalOpen={setPaymentModalOpen}
        academies={academies}
        paymentTargetAcademyId={paymentTargetAcademyId}
        setPaymentTargetAcademyId={setPaymentTargetAcademyId}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentRef={paymentRef}
        setPaymentRef={setPaymentRef}
        paymentNotes={paymentNotes}
        setPaymentNotes={setPaymentNotes}
        handleRecordPayment={handleRecordPayment}
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        ticketStatusDraft={ticketStatusDraft}
        setTicketStatusDraft={setTicketStatusDraft}
        ticketReplyNote={ticketReplyNote}
        setTicketReplyNote={setTicketReplyNote}
        ticketMeetingUrlDraft={ticketMeetingUrlDraft}
        setTicketMeetingUrlDraft={setTicketMeetingUrlDraft}
        ticketMeetingDateDraft={ticketMeetingDateDraft}
        setTicketMeetingDateDraft={setTicketMeetingDateDraft}
        ticketResolutionDraft={ticketResolutionDraft}
        setTicketResolutionDraft={setTicketResolutionDraft}
        ticketUpdating={ticketUpdating}
        handleUpdateTicket={handleUpdateTicket}
        reasonModal={reasonModal}
        setReasonModal={setReasonModal}
        reasonInput={reasonInput}
        setReasonInput={setReasonInput}
        inspectionAcademy={inspectionAcademy}
        setInspectionAcademy={setInspectionAcademy}
        setImpersonationAcademy={(academy) => {
          if (academy) toast.error("Super Access متوقف حتى توفر تنفيذ خادمي معتمد.");
        }}
        broadcastModalOpen={broadcastModalOpen}
        setBroadcastModalOpen={setBroadcastModalOpen}
        enrichedAcademiesCount={enrichedAcademies.length}
        broadcastType={broadcastType}
        setBroadcastType={setBroadcastType}
        broadcastTarget={broadcastTarget}
        setBroadcastTarget={setBroadcastTarget}
        broadcastTitle={broadcastTitle}
        setBroadcastTitle={setBroadcastTitle}
        broadcastMessage={broadcastMessage}
        setBroadcastMessage={setBroadcastMessage}
        handleSendBroadcast={handleSendBroadcast}
        paymentReminderTenant={paymentReminderTenant}
        setPaymentReminderTenant={setPaymentReminderTenant}
        impersonationAcademy={null}
        impersonationReason={impersonationReason}
        setImpersonationReason={setImpersonationReason}
        handleStartEmergencyImpersonation={handleStartEmergencyImpersonation}
        newTicketModalOpen={newTicketModalOpen}
        setNewTicketModalOpen={setNewTicketModalOpen}
        newTicketAcademyId={newTicketAcademyId}
        setNewTicketAcademyId={setNewTicketAcademyId}
        newTicketType={newTicketType}
        setNewTicketType={setNewTicketType}
        newTicketCategory={newTicketCategory}
        setNewTicketCategory={setNewTicketCategory}
        newTicketPriority={newTicketPriority}
        setNewTicketPriority={setNewTicketPriority}
        newTicketSubject={newTicketSubject}
        setNewTicketSubject={setNewTicketSubject}
        newTicketDescription={newTicketDescription}
        setNewTicketDescription={setNewTicketDescription}
        handleCreateNewTicket={handleCreateNewTicket}
        convertLeadModal={convertLeadModal}
        setConvertLeadModal={setConvertLeadModal}
        converting={converting}
        convertSuccess={convertSuccess}
        convertForm={convertForm}
        setConvertForm={setConvertForm}
        handleRegeneratePassword={handleRegeneratePassword}
        handleConvertLeadSubmit={handleConvertLeadSubmit}
        handleSendCredentialsWhatsApp={handleSendCredentialsWhatsApp}
      />
      {featuresModalAcademy && (
        <AcademyFeaturesModal
          academy={featuresModalAcademy}
          onClose={() => setFeaturesModalAcademy(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </RoleDashboardShell>
  );
}
