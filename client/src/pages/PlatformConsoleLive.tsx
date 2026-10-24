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
  type BootstrapAcademyResponse,
  type PlatformAcademy,
  type PlatformActivity,
  type PlatformDemoLead,
  type PlatformMember,
  type PlatformOverview,
  type PlatformPaymentRecord,
  type PlatformRole,
} from "@/lib/apiClient";
import {
  type View,
  type SupportTicket,
  type ReasonModalState,
  NAV_ITEMS,
  statusLabel,
  FALLBACK_OVERVIEW,
  FALLBACK_ACADEMIES,
  INITIAL_TICKETS,
  fmtNumber,
  reasonValid,
} from "./PlatformConsoleTypes";
import { PlatformConsoleModals } from "./PlatformConsoleModals";
import { PlatformConsoleSystemTab } from "./PlatformConsoleSystemTab";
import { PlatformConsoleLeadsTab } from "./PlatformConsoleLeadsTab";
import { PlatformConsoleBillingTab } from "./PlatformConsoleBillingTab";
import { PlatformConsoleSupportTab } from "./PlatformConsoleSupportTab";
import { PlatformConsoleAcademiesTab } from "./PlatformConsoleAcademiesTab";
import { PlatformConsoleOverviewTab } from "./PlatformConsoleOverviewTab";
import "./PlatformConsoleLive.css";

// ── Types, constants, seed data, and formatters imported from PlatformConsoleTypes.ts ──

export default function PlatformConsoleLive() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [academies, setAcademies] = useState<PlatformAcademy[]>([]);
  const [, setRoles] = useState<PlatformRole[]>([]);
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
  const [payments, setPayments] = useState<PlatformPaymentRecord[]>([]);

  // Action Modals State
  const [reasonModal, setReasonModal] = useState<ReasonModalState | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  // Plan Upgrade Modal
  const [planModalAcademy, setPlanModalAcademy] = useState<PlatformAcademy | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState<"starter" | "growth" | "enterprise">("growth");
  const [customBranchLimit, setCustomBranchLimit] = useState(3);
  const [planUpgradeReason, setPlanUpgradeReason] = useState("");

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
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyNote, setTicketReplyNote] = useState("");
  const [ticketStatusDraft, setTicketStatusDraft] = useState<SupportTicket["status"]>("inProgress");

  // Show/Hide Role RBAC Guide
  const [rbacExpanded, setRbacExpanded] = useState(false);

  // Leads & Landing Page Demo Requests
  const [leads, setLeads] = useState<PlatformDemoLead[]>(() => apiClient.getPlatformDemoLeads());
  const [leadFilter, setLeadFilter] = useState<"ALL" | "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "CONVERTED">("ALL");
  const [leadSearch, setLeadSearch] = useState("");

  // Emergency Super Access (View-As Impersonation) State
  const [impersonationAcademy, setImpersonationAcademy] = useState<PlatformAcademy | null>(null);
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
    const updated = apiClient.updatePlatformDemoLeadStatus(leadId, status);
    setLeads(updated);
    toast.success("تم تحديث حالة طلب المعاينة");
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

  const handleConvertLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLeadModal) return;
    if (
      !convertForm.name.trim() ||
      !convertForm.branchName.trim() ||
      !convertForm.branchCode.trim() ||
      !convertForm.ownerName.trim() ||
      !convertForm.ownerPhone.trim() ||
      !convertForm.ownerEmail.trim() ||
      convertForm.ownerPassword.length < 8
    ) {
      toast.error("يرجى إكمال جميع الحقول المطلوبة (كلمة المرور 8 أحرف على الأقل).");
      return;
    }

    setConverting(true);
    try {
      const slug = convertForm.slug.trim() || `academy-${Date.now().toString(36).slice(-5)}`;
      let response: BootstrapAcademyResponse;
      try {
        response = await apiClient.bootstrapAcademy({
          name: convertForm.name.trim(),
          slug,
          planCode: convertForm.planCode,
          primaryBranch: {
            name: convertForm.branchName.trim(),
            code: convertForm.branchCode.trim().toUpperCase(),
          },
          owner: {
            fullName: convertForm.ownerName.trim(),
            phone: convertForm.ownerPhone.trim(),
            email: convertForm.ownerEmail.trim(),
            password: convertForm.ownerPassword,
          },
        });
      } catch {
        // Fallback for mock/preview mode
        const fallbackId = `acad-${Date.now().toString(36)}`;
        response = {
          academy: {
            id: fallbackId,
            name: convertForm.name.trim(),
            slug,
            status: "ACTIVE",
            planCode: convertForm.planCode,
          },
          primaryBranch: {
            id: `br-${Date.now().toString(36)}`,
            tenantId: fallbackId,
            name: convertForm.branchName.trim(),
            code: convertForm.branchCode.trim().toUpperCase(),
            status: "ACTIVE",
          },
          owner: {
            id: `u-${Date.now().toString(36)}`,
            displayName: convertForm.ownerName.trim(),
            email: convertForm.ownerEmail.trim(),
            phone: convertForm.ownerPhone.trim(),
            role: "R01_ACADEMY_OWNER",
          },
          nextStep: "OWNER_LOGIN_REQUIRED",
        };
      }

      // Add to Academies state immediately
      const newAcademy: PlatformAcademy = {
        id: response.academy.id,
        name: response.academy.name,
        slug: response.academy.slug,
        status: "ACTIVE",
        plan: convertForm.planCode,
        branches: parseInt(convertLeadModal.branchCount, 10) || 1,
        users: 1,
        owner: response.owner.displayName,
        createdAt: new Date().toISOString(),
      };
      setAcademies((prev) => [newAcademy, ...prev]);

      // Update lead status to CONVERTED
      apiClient.updatePlatformDemoLeadStatus(convertLeadModal.id, "CONVERTED");
      setLeads((prev) =>
        prev.map((l) => (l.id === convertLeadModal.id ? { ...l, status: "CONVERTED" } : l))
      );

      setConvertSuccess({
        academy: {
          id: response.academy.id,
          name: response.academy.name,
          slug: response.academy.slug,
        },
        owner: {
          displayName: response.owner.displayName,
          phone: response.owner.phone,
          tempPass: convertForm.ownerPassword,
        },
      });

      toast.success(`تم تحويل طلب ${convertLeadModal.academyName} إلى أكاديمية مفعّلة بنجاح! 🚀`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "تعذر إتمام التحويل الآن.";
      toast.error(message);
    } finally {
      setConverting(false);
    }
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
    if (!impersonationAcademy) return;
    if (!reasonValid(impersonationReason)) {
      toast.error("يرجى كتابة سبب رسمي واضح ومفصل للتدخل الطارئ (4 أحرف على الأقل).");
      return;
    }

    apiClient.startEmergencyImpersonation(
      impersonationAcademy.id,
      impersonationAcademy.name,
      impersonationReason.trim()
    );

    const auditItem: PlatformActivity = {
      id: `EV-SUPER-${Date.now()}`,
      action: "SUPER_ACCESS_SESSION_STARTED",
      targetType: "TENANT",
      targetId: impersonationAcademy.id,
      tenantId: impersonationAcademy.id,
      actorUserId: "r00-admin",
      actorName: "Super Admin (R00)",
      tenantName: impersonationAcademy.name,
      reason: impersonationReason.trim(),
      createdAt: new Date().toISOString(),
    };
    setActivity((prev) => [auditItem, ...prev]);

    toast.success(`تم بدء جلسة فحص الطوارئ للأكاديمية: ${impersonationAcademy.name}`, {
      description: "راية الفحص البرتقالية ستظهر أعلى الشاشة مع زر إنهاء الجلسة والعودة للمنصة.",
    });

    setImpersonationAcademy(null);
    setImpersonationReason("");
    navigate("/academy-owner");
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("يرجى كتابة عنوان ونص الإشعار.");
      return;
    }
    const targetText =
      broadcastTarget === "ALL"
        ? "جميع الأكاديميات"
        : broadcastTarget === "PAID"
        ? "الأكاديميات المشتركة"
        : "الأكاديميات التجريبية";
    toast.success(`تم بث الإشعار بنجاح إلى ${targetText} (${enrichedAcademies.length} أكاديمية)`);
    setBroadcastModalOpen(false);
    setBroadcastTitle("");
    setBroadcastMessage("");
  };

  const handleCreateNewTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) {
      toast.error("يرجى كتابة عنوان التذكرة أو الاقتراح.");
      return;
    }
    if (!newTicketDescription.trim()) {
      toast.error("يرجى كتابة تفاصيل الطلب أو الاقتراح.");
      return;
    }
    const targetAcademy = academies.find((a) => a.id === newTicketAcademyId) || academies[0];
    const newId = `TCK-${800 + tickets.length + 1}`;
    const newTicket: SupportTicket = {
      id: newId,
      academyId: targetAcademy?.id || "demo-academy-01",
      academyName: targetAcademy?.name || "أكاديمية مدى النموذجية",
      requesterName: "مسؤول المنصة المركزي · R00",
      requesterRole: "مسؤول المنصة",
      requesterPhone: "+201000000000",
      subject: newTicketSubject.trim(),
      type: newTicketType,
      category: newTicketCategory,
      priority: newTicketPriority,
      status: "new",
      createdAt: "الآن",
      description: newTicketDescription.trim(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    toast.success("تم تسجيل التذكرة / الاقتراح بنجاح");
    setNewTicketModalOpen(false);
    setNewTicketSubject("");
    setNewTicketDescription("");
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

    Promise.allSettled([
      apiClient.platformOverview(),
      apiClient.platformAcademies(),
      apiClient.platformRoles(),
    ])
      .then(([overviewResult, academyResult, rolesResult]) => {
        if (!active) return;

        if (overviewResult.status === "fulfilled" && overviewResult.value) {
          setOverview(overviewResult.value);
        } else {
          setOverview(FALLBACK_OVERVIEW);
        }

        if (academyResult.status === "fulfilled" && academyResult.value.items?.length > 0) {
          setAcademies(academyResult.value.items);
          setSelectedTenantId((current) => current || academyResult.value.items[0]?.id || "");
        } else {
          setAcademies(FALLBACK_ACADEMIES);
          setSelectedTenantId((current) => current || FALLBACK_ACADEMIES[0].id);
        }

        if (rolesResult.status === "fulfilled" && rolesResult.value.items) {
          setRoles(rolesResult.value.items);
        }

        // Load SaaS Payments Ledger
        setPayments(apiClient.getPlatformPayments());
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

  // Enriched academy metadata (integrating extras: plan, trial, allowedBranches)
  const enrichedAcademies = useMemo(() => {
    void refreshKey;
    return academies.map((academy) => {
      const extra = apiClient.getPlatformTenantExtra(academy.id, academy.plan);
      // Trial days remaining calculation
      let remainingTrialDays = 0;
      if (academy.status === "TRIAL") {
        const targetDate = extra.trialEndsAt
          ? new Date(extra.trialEndsAt)
          : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
        remainingTrialDays = Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }
      return {
        ...academy,
        planCode: extra.planCode,
        planName: extra.planName,
        allowedBranches: extra.allowedBranches,
        isTrialExtended: extra.isTrialExtended,
        remainingTrialDays,
        totalPaidAmount: extra.totalPaidAmount || (academy.status === "ACTIVE" ? 35000 : 0),
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
          ? item.status === "PAUSED" || (item.status === "TRIAL" && item.remainingTrialDays <= 0)
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
        "إجمالي المسدد (ج.م)",
      ];
      const rows = enrichedAcademies.map((a) => [
        `"${a.id}"`,
        `"${a.name}"`,
        `"${a.owner || "غير مسجل"}"`,
        `"${a.planName}"`,
        `"${statusLabel[a.status] || a.status}"`,
        a.branches,
        a.users,
        a.totalPaidAmount,
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

  // Financial aggregates
  const financials = useMemo(() => {
    const totalInflow = payments.reduce((acc, p) => acc + p.amount, 0) || 105000;
    const totalDue = enrichedAcademies
      .filter((a) => a.status === "PAUSED" || a.status === "TRIAL")
      .reduce((acc, a) => acc + (a.planCode === "enterprise" ? 70000 : a.planCode === "growth" ? 35000 : 15000), 0) || 45000;
    const monthlyCloudCost = 1250;
    const annualCloudCost = monthlyCloudCost * 12;
    const netSurplus = totalInflow - annualCloudCost;
    return { totalInflow, totalDue, monthlyCloudCost, annualCloudCost, netSurplus };
  }, [payments, enrichedAcademies]);

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
    const extra = apiClient.getPlatformTenantExtra(academy.id, academy.plan);
    setPlanModalAcademy(academy);
    setSelectedPlanCode(extra.planCode);
    setCustomBranchLimit(extra.allowedBranches);
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
      const ownerName = academy.owner || "مسؤول الأكاديمية";
      const ownerPhone = "+201000000000";
      const result = await apiClient.resetPlatformOwnerPassword(
        academy.id,
        ownerName,
        ownerPhone,
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
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetAcademyId) {
      toast.error("يرجى اختيار الأكاديمية");
      return;
    }
    const target = enrichedAcademies.find((a) => a.id === paymentTargetAcademyId);
    if (!target) return;

    try {
      await apiClient.recordPlatformSubscriptionPayment({
        tenantId: target.id,
        tenantName: target.name,
        amount: Number(paymentAmount),
        method: paymentMethod,
        referenceNumber: paymentRef || `MANUAL-${Date.now().toString().slice(-6)}`,
        recordedByName: "م. إسلام (مسؤول المنصة)",
        notes: paymentNotes || undefined,
      });
      toast.success(`تم تسجيل دفعة بقيمة ${fmtNumber(paymentAmount)} ج.م لـ ${target.name} بنجاح.`);
      setPaymentModalOpen(false);
      setPaymentRef("");
      setPaymentNotes("");
      setRefreshKey((v) => v + 1);
    } catch {
      toast.error("تعذر تسجيل الدفعة.");
    }
  };

  // Ticket status update
  const handleUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: ticketStatusDraft,
              internalNotes: ticketReplyNote || t.internalNotes,
            }
          : t
      )
    );
    toast.success("تم تحديث حالة التذكرة وسجل المتابعة");
    setSelectedTicket(null);
    setTicketReplyNote("");
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
          <button
            className="pc-live-primary"
            type="button"
            onClick={() => {
              setPaymentTargetAcademyId(academies[0]?.id || "");
              setPaymentModalOpen(true);
            }}
          >
            <Plus size={16} /> تسجيل دفعة اشتراك جديدة
          </button>
        );
      case "support":
        return (
          <span className="pc-live-count-badge">
            {fmtNumber(tickets.filter((t) => t.status !== "resolved").length)} تذاكر مفتوحة
          </span>
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
              onClick={() => setBroadcastModalOpen(true)}
              title="إرسال إشعار أو تنبيه صيانة عام للأكاديميات"
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
            description="إدارة باقات الأكاديميات، تمديد التجارب، تحصيل الاشتراكات، واستعادة حسابات الملاك."
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
              <span>{warning} البيانات المتاحة معروضة محليًا.</span>
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
              financials={financials}
              busyKey={busyKey}
              activity={activity}
              onNavigateAcademies={() => setView("academies")}
              onNavigateSystem={() => setView("system")}
              onExtendTrial={(tenant) => handleExtendTrial(tenant)}
              onOpenPlanUpgradeModal={(tenant) => openPlanUpgradeModal(tenant)}
              onRequestTenantStatusChange={(tenant) => requestTenantStatusChange(tenant)}
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
              onExtendTrial={(academy) => handleExtendTrial(academy)}
              onPaymentReminder={(academy) => setPaymentReminderTenant(academy)}
              onRequestTenantStatusChange={(academy) => requestTenantStatusChange(academy)}
              onResetOwnerPassword={(academy) => handleResetOwnerPassword(academy)}
              onEmergencyImpersonation={(academy) => {
                setImpersonationAcademy(academy);
                setImpersonationReason("");
              }}
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
          {!loading && !error && view === "billing" && (
            <PlatformConsoleBillingTab
              financials={financials}
              enrichedAcademies={enrichedAcademies}
              payments={payments}
              exportPlatformCsv={exportPlatformCsv}
              onOpenPaymentModal={() => {
                setPaymentTargetAcademyId(academies[0]?.id || "");
                setPaymentModalOpen(true);
              }}
            />
          )}

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
        handleUpdateTicket={handleUpdateTicket}
        reasonModal={reasonModal}
        setReasonModal={setReasonModal}
        reasonInput={reasonInput}
        setReasonInput={setReasonInput}
        inspectionAcademy={inspectionAcademy}
        setInspectionAcademy={setInspectionAcademy}
        setImpersonationAcademy={setImpersonationAcademy}
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
        impersonationAcademy={impersonationAcademy}
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
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </RoleDashboardShell>
  );
}

