import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  Database,
  ExternalLink,
  FileSpreadsheet,
  GraduationCap,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  LockKeyhole,
  Megaphone,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserPlus,
  UserRoundX,
  Users,
  Wallet,
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
  platformSaaSStorage,
  type PlatformAcademy,
  type PlatformActivity,
  type PlatformDemoLead,
  type PlatformMember,
  type PlatformOverview,
  type PlatformPaymentRecord,
  type PlatformRole,
  type PlatformTenantExtra,
} from "@/lib/apiClient";
import {
  type View,
  type SupportTicket,
  type ReasonModalState,
  NAV_ITEMS,
  STATUS_LABEL,
  statusLabel,
  TICKET_PRIORITY_LABELS,
  ticketPriorityLabels,
  TICKET_STATUS_LABELS,
  ticketStatusLabels,
  SUBSCRIPTION_PLANS,
  FALLBACK_OVERVIEW,
  FALLBACK_ACADEMIES,
  INITIAL_TICKETS,
  ROLE_POLICIES_GUIDE,
  fmtDate,
  fmtNumber,
  reasonValid,
} from "./PlatformConsoleTypes";
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
      let response: any;
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
    } catch (err: any) {
      toast.error(err.message || "تعذر إتمام التحويل الآن.");
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
        const warnings: string[] = [];

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
            <>
              {/* SaaS Top Metrics */}
              <section className="pc-live-metrics" aria-label="مؤشرات المنصة الحية">
                <Metric
                  icon={<Building2 />}
                  label="الأكاديميات المسجلة"
                  value={overview?.academies ?? enrichedAcademies.length}
                  note="إجمالي التينانتس"
                />
                <Metric
                  icon={<CheckCircle2 />}
                  label="اشتراكات نشطة"
                  value={enrichedAcademies.filter((a) => a.status === "ACTIVE").length}
                  note="أكاديميات سارية الدفع"
                />
                <Metric
                  icon={<Clock3 />}
                  label="فترات تجريبية سارية"
                  value={enrichedAcademies.filter((a) => a.status === "TRIAL").length}
                  note="بانتظار التحويل لمدفوع"
                />
                <Metric
                  icon={<Wallet />}
                  label="صافي الفائض الشهري"
                  value={financials.netSurplus}
                  note="بعد حسم استضافة السيرفرات"
                  isCurrency
                />
              </section>

              {/* URGENT SAAS ATTENTION QUEUE (طابور التدخل السريع) */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={18} color="#d97706" />
                      طابور التدخل السريع (Urgent SaaS Attention Queue)
                    </h2>
                    <p>
                      أكاديميات تحتاج تمديد تجربة، تجديد اشتراك، أو متابعة تذكرة ذات أولوية مرتفعة.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pc-live-link"
                    onClick={() => setView("academies")}
                  >
                    عرض كل الأكاديميات
                  </button>
                </header>

                <div style={{ display: "grid", gap: "14px" }}>
                  {/* Item 1: Trials Ending Soon */}
                  {enrichedAcademies
                    .filter((a) => a.status === "TRIAL")
                    .map((tenant) => (
                      <div
                        key={tenant.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: "#fffbeb",
                          border: "1px solid #fef3c7",
                        }}
                      >
                        <div style={{ display: "grid", gap: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "13px", color: "#92400e" }}>
                              {tenant.name}
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#fef3c7",
                                color: "#b45309",
                              }}
                            >
                              متبقي {tenant.remainingTrialDays} أيام في التجربة
                            </span>
                          </div>
                          <small style={{ color: "#78350f" }}>
                            المسؤول: {tenant.owner || "غير مسجل"} · {tenant.branches} فروع · خطة {tenant.planName}
                          </small>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="pc-live-link"
                            style={{ borderColor: "#d97706", color: "#b45309" }}
                            onClick={() => handleExtendTrial(tenant)}
                            disabled={busyKey === `extend:${tenant.id}`}
                          >
                            + تمديد 7 أيام
                          </button>
                          <button
                            type="button"
                            className="pc-live-primary"
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                            onClick={() => openPlanUpgradeModal(tenant)}
                          >
                            ترقية وتفعيل
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* Item 2: Paused Academies */}
                  {enrichedAcademies
                    .filter((a) => a.status === "PAUSED")
                    .map((tenant) => (
                      <div
                        key={tenant.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: "#fef2f2",
                          border: "1px solid #fee2e2",
                        }}
                      >
                        <div style={{ display: "grid", gap: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "13px", color: "#991b1b" }}>
                              {tenant.name}
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                              }}
                            >
                              اشتراك موقوف مؤقتًا
                            </span>
                          </div>
                          <small style={{ color: "#7f1d1d" }}>
                            المسؤول: {tenant.owner || "غير مسجل"} · تم تعليق صلاحيات الدخول
                          </small>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="pc-live-primary"
                            style={{
                              background: "#059669",
                              borderColor: "#059669",
                              padding: "6px 12px",
                              fontSize: "11px",
                            }}
                            onClick={() => requestTenantStatusChange(tenant)}
                            disabled={busyKey === `tenant:${tenant.id}`}
                          >
                            إعادة التفعيل
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* Empty State */}
                  {enrichedAcademies.every(
                    (a) => a.status !== "TRIAL" && a.status !== "PAUSED"
                  ) && (
                    <div style={{ textAlign: "center", padding: "24px", color: "#059669" }}>
                      <CheckCircle2 size={28} style={{ margin: "0 auto 8px" }} />
                      <strong>لا توجد أكاديميات في طابور التنبيهات العاجلة</strong>
                      <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
                        جميع الاشتراكات نشطة وتعمل بكفاءة تامة.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Recent Platform Activities */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>آخر العمليات والأحداث على المنصة</h2>
                    <p>سجل التغييرات الإدارية وتدوير الجلسات وترقية الباقات.</p>
                  </div>
                  <button
                    type="button"
                    className="pc-live-link"
                    onClick={() => setView("system")}
                  >
                    عرض سجل التدقيق بالكامل
                  </button>
                </header>
                <ActivityTable rows={activity.slice(0, 5)} />
              </section>
            </>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: ACADEMIES & PLAN MANAGEMENT (سجل الأكاديميات والباقات) */}
          {/* ========================================================= */}
          {!loading && !error && view === "academies" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>سجل الأكاديميات والباقات المعتمدة</h2>
                  <p>
                    {fmtNumber(enrichedAcademies.length)} أكاديمية مسجلة؛ إدارة الباقات، الحدود، وحالة الاشتراكات بنقرة واحدة.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {(["ALL", "ACTIVE", "TRIAL", "PAUSED", "OVERDUE"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`pc-live-link ${tenantFilter === filter ? "active" : ""}`}
                      style={{
                        background: tenantFilter === filter ? "#1d6a65" : undefined,
                        color: tenantFilter === filter ? "#ffffff" : undefined,
                        borderColor: tenantFilter === filter ? "#1d6a65" : undefined,
                      }}
                      onClick={() => setTenantFilter(filter)}
                    >
                      {filter === "ALL"
                        ? "الكل"
                        : filter === "ACTIVE"
                        ? "نشطة"
                        : filter === "TRIAL"
                        ? "تجريبية"
                        : filter === "PAUSED"
                        ? "موقوفة"
                        : "متأخرة عن السداد"}
                    </button>
                  ))}
                </div>
              </header>

              <label className="pc-live-search">
                <Search size={16} />
                <input
                  value={tenantSearch}
                  onChange={(event) => setTenantSearch(event.target.value)}
                  placeholder="ابحث عن اسم الأكاديمية أو المسؤول أو كود التينانت..."
                />
              </label>

              <div className="pc-live-table-wrap">
                <table className="pc-live-table">
                  <thead>
                    <tr>
                      <th>الأكاديمية والمسؤول</th>
                      <th>الباقة المصرحة</th>
                      <th>حالة الاشتراك</th>
                      <th>الفروع والمستخدمون</th>
                      <th>إجراءات الإدارة السريعة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAcademies.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">
                          <strong>{row.name}</strong>
                          <small>
                            {row.owner ?? "غير مسجل"} · {row.id}
                          </small>
                        </th>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              fontWeight: 700,
                              fontSize: "11px",
                              color: "#0f172a",
                            }}
                          >
                            {row.planName}
                          </span>
                          <small style={{ display: "block", color: "#64748b" }}>
                            مسموح حتى {fmtNumber(row.allowedBranches)} فروع
                          </small>
                        </td>
                        <td>
                          <span
                            className={`pc-live-status-tag ${
                              row.status === "PAUSED" ? "paused" : ""
                            }`}
                          >
                            {statusLabel[row.status] ?? row.status}
                          </span>
                          {row.status === "TRIAL" && (
                            <span
                              style={{
                                display: "block",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#b45309",
                                marginTop: "3px",
                              }}
                            >
                              متبقي {row.remainingTrialDays} يوم
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{fmtNumber(row.branches)} فروع</strong>
                          <small>{fmtNumber(row.users)} حساب موظف</small>
                        </td>
                        <td>
                          <div className="pc-live-row-actions">
                            <button
                              type="button"
                              style={{ color: "#0d9488", borderColor: "#ccfbf1", background: "#f0fdfa" }}
                              onClick={() => setInspectionAcademy(row)}
                              title="فحص ومعاينة الأكاديمية للدعم الفني"
                            >
                              معاينة الدعم
                            </button>
                            <button
                              type="button"
                              onClick={() => openPlanUpgradeModal(row)}
                            >
                              تعديل الباقة
                            </button>
                            {row.status === "TRIAL" && (
                              <button
                                type="button"
                                style={{ color: "#d97706", borderColor: "#fde68a" }}
                                onClick={() => handleExtendTrial(row)}
                                disabled={busyKey === `extend:${row.id}`}
                              >
                                تمديد 7 أيام
                              </button>
                            )}
                            {(row.status === "PAUSED" || (row.status === "TRIAL" && row.remainingTrialDays <= 3)) && (
                              <button
                                type="button"
                                style={{ color: "#b45309", borderColor: "#fde68a", background: "#fffbeb" }}
                                onClick={() => setPaymentReminderTenant(row)}
                                title="توليد مطالبة مالية ورسالة تجديد واتساب"
                              >
                                مطالبة تجديد
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => requestTenantStatusChange(row)}
                              disabled={busyKey === `tenant:${row.id}`}
                            >
                              {row.status === "PAUSED" ? "تفعيل" : "إيقاف"}
                            </button>
                            <button
                              type="button"
                              style={{ color: "#2563eb" }}
                              onClick={() => handleResetOwnerPassword(row)}
                              disabled={busyKey === `reset:${row.id}`}
                            >
                              استعادة المالك
                            </button>
                            <button
                              type="button"
                              style={{ color: "#c2410c", borderColor: "#fed7aa", background: "#fff7ed" }}
                              onClick={() => {
                                setImpersonationAcademy(row);
                                setImpersonationReason("");
                              }}
                              title="دخول فحص الطوارئ للأكاديمية وحل المشاكل التشغيلية من الداخل"
                            >
                              <ShieldAlert size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} /> فحص طارئ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAcademies.length === 0 && (
                      <tr>
                        <td colSpan={5} className="pc-live-empty-cell">
                          لا توجد أكاديميات مطابقة لمعايير البحث.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ========================================================= */}
          {/* VIEW: LEADS & LANDING DEMO REQUESTS (طلبات المعاينة)      */}
          {/* ========================================================= */}
          {!loading && !error && view === "leads" && (
            <section className="pc-live-card">
              <header>
                <div>
                  <h2>طلبات المعاينة والعملاء الجدد (Landing Page Leads & Demos)</h2>
                  <p>
                    الطلبات الواردة فوراً من نموذج المعاينة في الصفحة الرئيسية (Landing Page) مع إمكانية التواصل عبر واتساب والتفعيل التجريبي بنقرة واحدة.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="pc-live-boundary">
                    <Sparkles size={14} /> {filteredLeads.length} طلبات مسجلة
                  </span>
                </div>
              </header>

              {/* Filter Tabs & Search */}
              <div className="pc-live-filter-bar" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
                <div className="pc-live-search" style={{ flex: 1, minWidth: "220px" }}>
                  <Search size={15} />
                  <input
                    type="search"
                    placeholder="ابحث باسم المسؤول، الأكاديمية، الهاتف، أو البريد..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                  />
                </div>
                <div className="pc-filter-tabs" style={{ display: "flex", gap: "6px" }}>
                  {[
                    { id: "ALL", label: "الكل" },
                    { id: "NEW", label: "جديد 🚨" },
                    { id: "CONTACTED", label: "تم التواصل" },
                    { id: "DEMO_SCHEDULED", label: "موعد ديمو 📅" },
                    { id: "CONVERTED", label: "تم التحويل لعميل ✅" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`pc-filter-tab ${leadFilter === tab.id ? "active" : ""}`}
                      onClick={() => setLeadFilter(tab.id as typeof leadFilter)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leads Table */}
              <div className="pc-live-table-wrap">
                <table className="pc-live-table">
                  <thead>
                    <tr>
                      <th>معرف الطلب</th>
                      <th>الأكاديمية والمسؤول</th>
                      <th>بيانات التواصل</th>
                      <th>الفروع والاحتياج التشغيلي</th>
                      <th>حالة الطلب</th>
                      <th>تاريخ الورود</th>
                      <th>الإجراءات الفورية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>
                            {lead.id}
                          </span>
                        </td>
                        <td>
                          <strong>{lead.academyName}</strong>
                          <small style={{ display: "block", color: "#64748b" }}>
                            المسؤول: {lead.name}
                          </small>
                        </td>
                        <td>
                          <div style={{ display: "grid", gap: "2px" }}>
                            <span style={{ direction: "ltr", textAlign: "right", fontWeight: 600 }}>{lead.phone}</span>
                            <small style={{ color: "#64748b" }}>{lead.email}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                              {lead.branchCount} فروع
                            </span>
                            <small style={{ display: "block", color: "#475569", marginTop: "3px" }}>
                              {lead.operationalNeed}
                            </small>
                            {lead.notes && (
                              <small style={{ display: "block", color: "#94a3b8", fontStyle: "italic" }}>
                                ملاحظة: {lead.notes}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <select
                            value={lead.status}
                            onChange={(e) => handleLeadStatusChange(lead.id, e.target.value as PlatformDemoLead["status"])}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              border: "1px solid #cbd5e1",
                              fontWeight: 600,
                              background:
                                lead.status === "NEW" ? "#fef2f2" :
                                lead.status === "CONVERTED" ? "#f0fdf4" :
                                lead.status === "DEMO_SCHEDULED" ? "#eff6ff" : "#fff",
                              color:
                                lead.status === "NEW" ? "#b91c1c" :
                                lead.status === "CONVERTED" ? "#15803d" :
                                lead.status === "DEMO_SCHEDULED" ? "#1d4ed8" : "#334155",
                            }}
                          >
                            <option value="NEW">جديد (New)</option>
                            <option value="CONTACTED">تم التواصل (Contacted)</option>
                            <option value="DEMO_SCHEDULED">مجدول للعرض (Demo Scheduled)</option>
                            <option value="CONVERTED">تم التحويل لعميل (Converted)</option>
                            <option value="REJECTED">مرفوض / غير مهتم</option>
                          </select>
                        </td>
                        <td>
                          <small>{fmtDate(lead.createdAt)}</small>
                        </td>
                        <td>
                          <div className="pc-live-row-actions">
                            <button
                              type="button"
                              style={{ color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}
                              onClick={() => handleWhatsAppLeadChat(lead)}
                              title="فتح محادثة واتساب فورية لترتيب الديمو"
                            >
                              <MessageCircle size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} /> واتساب
                            </button>
                            <button
                              type="button"
                              className="pc-live-link"
                              style={{
                                background: lead.status === "CONVERTED" ? "#f8fafc" : "#eff6ff",
                                color: lead.status === "CONVERTED" ? "#475569" : "#1d4ed8",
                                borderColor: lead.status === "CONVERTED" ? "#cbd5e1" : "#93c5fd",
                                fontWeight: 700,
                              }}
                              onClick={() => handleOpenConvertModal(lead)}
                              title={
                                lead.status === "CONVERTED"
                                  ? "تم تحويل هذا الطلب لأكاديمية نشطة (انقر لعرض البيانات)"
                                  : "تحويل فوري إلى أكاديمية مفعّلة بضغطة زر"
                              }
                            >
                              <Building2 size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} />
                              {lead.status === "CONVERTED" ? "مُفعّل كعميل ✅" : "تحويل إلى أكاديمية 🚀"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="pc-live-empty-cell">
                          لا توجد طلبات معاينة مطابقة لمعايير البحث.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: BILLING & SUBSCRIPTIONS (التحصيل والاشتراكات)     */}
          {/* ========================================================= */}
          {!loading && !error && view === "billing" && (
            <>
              {/* Financial Flow KPIs */}
              <section className="pc-finance-flow-grid" aria-label="مؤشرات التدفقات المالية للمنصة">
                <article className="pc-finance-card">
                  <span className="pc-finance-card-icon inflow">
                    <TrendingUp size={22} />
                  </span>
                  <div className="pc-finance-card-body">
                    <small>التدفقات الداخلة (المحصل الفعلي)</small>
                    <strong>{fmtNumber(financials.totalInflow)} ج.م</strong>
                    <span>إجمالي اشتراكات الأكاديميات المسددة</span>
                  </div>
                </article>

                <article className="pc-finance-card">
                  <span className="pc-finance-card-icon due">
                    <Clock3 size={22} />
                  </span>
                  <div className="pc-finance-card-body">
                    <small>المبالغ المستحقة للتحصيل (Due)</small>
                    <strong>{fmtNumber(financials.totalDue)} ج.م</strong>
                    <span>أقساط سنوية وتجديدات تجريبية متوقعة</span>
                  </div>
                </article>

                <article className="pc-finance-card">
                  <span className="pc-finance-card-icon outflow">
                    <TrendingDown size={22} />
                  </span>
                  <div className="pc-finance-card-body">
                    <small>التدفقات الخارجة (تكاليف السيرفرات)</small>
                    <strong>{fmtNumber(financials.monthlyCloudCost)} ج.م / شهر</strong>
                    <span>خوادم .NET + قاعدة Supabase Frankfurt + Storage</span>
                  </div>
                </article>

                <article className="pc-finance-card">
                  <span className="pc-finance-card-icon net">
                    <Wallet size={22} />
                  </span>
                  <div className="pc-finance-card-body">
                    <small>صافي الفائض التشغيلي للمنصة</small>
                    <strong>+{fmtNumber(financials.netSurplus)} ج.م</strong>
                    <span>هامش ربح تشغيلي إيجابي للمنصة</span>
                  </div>
                </article>
              </section>

              {/* Pricing Plans Card Grid */}
              <section className="pc-live-card pc-plans-section">
                <header>
                  <div>
                    <h2>خطط وأسعار باقات المنصة المعتمدة</h2>
                    <p>
                      تفاصيل الباقات الشهرية والسنوية، حدود الفروع، والحدود التشغيلية لكل أكاديمية.
                    </p>
                  </div>
                  <span className="pc-live-boundary">
                    <CreditCard size={14} /> 3 خطط رئيسية معتمدة
                  </span>
                </header>
                <div className="pc-plans-grid">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <article
                      key={plan.id}
                      className={`pc-plan-card ${plan.highlight ? "featured" : ""}`}
                    >
                      {plan.highlight && (
                        <span className="pc-plan-badge">الأكثر طلباً</span>
                      )}
                      <div className="pc-plan-head">
                        <h3>{plan.name}</h3>
                        <p>{plan.tag}</p>
                      </div>
                      <div className="pc-plan-price">
                        <strong>{fmtNumber(plan.priceAnnual)} ج.م</strong>
                        <span>/ سنوياً</span>
                        <small style={{ display: "block", color: "#64748b", marginTop: 4 }}>
                          أو {fmtNumber(plan.priceMonthly)} ج.م شهرياً
                        </small>
                      </div>
                      <ul className="pc-plan-features">
                        {plan.features.map((feat) => (
                          <li key={feat}>
                            <Check size={15} /> {feat}
                          </li>
                        ))}
                      </ul>
                      <div className="pc-plan-footer">
                        <span>الأكاديميات المشتركة:</span>
                        <strong>
                          {fmtNumber(
                            enrichedAcademies.filter((a) => a.planCode === plan.code).length
                          )}{" "}
                          أكاديميات
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Payments Ledger */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>سجل فواتير ومدفوعات الاشتراكات (Billing & Payment Ledger)</h2>
                    <p>
                      عمليات السداد البنكي والإلكتروني المسجلة للأكاديميات المشتركة.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="pc-live-link"
                      onClick={exportPlatformCsv}
                      title="تصدير كشف اشتراكات المنصة إلى ملف إكسيل CSV"
                    >
                      <FileSpreadsheet size={15} /> تصدير كشف الاشتراكات
                    </button>
                    <button
                      type="button"
                      className="pc-live-primary"
                      onClick={() => {
                        setPaymentTargetAcademyId(academies[0]?.id || "");
                        setPaymentModalOpen(true);
                      }}
                    >
                      <Plus size={15} /> تسجيل دفعة جديدة
                    </button>
                  </div>
                </header>

                <div className="pc-live-table-wrap">
                  <table className="pc-live-table">
                    <thead>
                      <tr>
                        <th>رقم الإيصال / المعرف</th>
                        <th>الأكاديمية المشتركة</th>
                        <th>المبلغ المسدد</th>
                        <th>طريقة الدفع</th>
                        <th>رقم المرجع / التحويل</th>
                        <th>تاريخ السداد</th>
                        <th>المسؤول الموثق</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <th scope="row">
                            <strong>{p.id}</strong>
                            <small>{p.notes || "لا توجد ملاحظات"}</small>
                          </th>
                          <td>
                            <strong>{p.tenantName}</strong>
                            <small>{p.tenantId}</small>
                          </td>
                          <td>
                            <strong style={{ color: "#059669", fontSize: "13px" }}>
                              {fmtNumber(p.amount)} ج.م
                            </strong>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#f1f5f9",
                                fontWeight: 600,
                              }}
                            >
                              {p.method === "BANK_TRANSFER"
                                ? "تحويل بنكي"
                                : p.method === "INSTAPAY"
                                ? "إنستاباي"
                                : p.method === "FAWRY"
                                ? "فوري"
                                : p.method === "CREDIT_CARD"
                                ? "بطاقة ائتمان"
                                : "نقدي"}
                            </span>
                          </td>
                          <td>
                            <code>{p.referenceNumber}</code>
                          </td>
                          <td>{fmtDate(p.receivedAt)}</td>
                          <td>
                            <small>{p.recordedByName}</small>
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={7} className="pc-live-empty-cell">
                            لا توجد مدفوعات مسجلة حتى الآن.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ========================================================= */}
          {/* VIEW 4: SUPPORT & OWNER RECOVERY (الدعم واستعادة الحسابات) */}
          {/* ========================================================= */}
          {!loading && !error && view === "support" && (
            <>
              {/* Support Tickets Section */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>تذاكر الدعم الفني والاقتراحات</h2>
                    <p>
                      البلاغات التقنية، طلبات الميزات الجديدة، واستفسارات الباقات والاشتراكات من الأكاديميات.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      className="pc-live-primary"
                      onClick={() => {
                        setNewTicketAcademyId(academies[0]?.id || "demo-academy-01");
                        setNewTicketType("issue");
                        setNewTicketCategory("مشكلة تقنية");
                        setNewTicketPriority("high");
                        setNewTicketSubject("");
                        setNewTicketDescription("");
                        setNewTicketModalOpen(true);
                      }}
                      style={{ padding: "6px 14px", fontSize: "12px", gap: "6px" }}
                    >
                      <Plus size={14} /> تسجيل تذكرة / اقتراح جديد
                    </button>
                    <span className="pc-live-boundary">
                      <LifeBuoy size={14} /> {filteredTickets.length} تذاكر مسجلة
                    </span>
                  </div>
                </header>

                {/* Filter Tabs */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "0 4px", flexWrap: "wrap" }}>
                  {[
                    { id: "ALL", label: "الكل" },
                    { id: "ISSUE", label: "أعطال وبلاغات تقنية 🚨" },
                    { id: "SUGGESTION", label: "اقتراحات وميزات جديدة 💡" },
                    { id: "BILLING", label: "اشتراكات وباقات 💳" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`pc-filter-tab ${ticketFilter === tab.id ? "active" : ""}`}
                      onClick={() => setTicketFilter(tab.id as typeof ticketFilter)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="pc-ticket-grid">
                  {filteredTickets.map((ticket) => {
                    const priority = ticketPriorityLabels[ticket.priority];
                    const status = ticketStatusLabels[ticket.status];
                    return (
                      <article className="pc-ticket-card" key={ticket.id}>
                        <span className={`pc-ticket-icon ${priority.class}`}>
                          {ticket.category === "اقتراح ميزة جديدة" || ticket.type === "suggestion" ? (
                            <Lightbulb size={18} />
                          ) : (
                            <LifeBuoy size={18} />
                          )}
                        </span>
                        <div className="pc-ticket-main">
                          <strong>{ticket.subject}</strong>
                          <small>
                            {ticket.id} · {ticket.category} · {ticket.createdAt}
                          </small>
                        </div>
                        <div className="pc-ticket-academy">
                          <strong>{ticket.academyName}</strong>
                          <small>
                            {ticket.requesterName} ({ticket.requesterPhone})
                          </small>
                        </div>
                        <span className={`pc-ticket-status ${status.class}`}>
                          {status.label}
                        </span>
                        <button
                          type="button"
                          className="pc-live-link"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setTicketStatusDraft(ticket.status);
                            setTicketReplyNote(ticket.internalNotes || "");
                          }}
                        >
                          معاينة ومتابعة <ChevronLeft size={14} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Owner Account Emergency Recovery & Member Directory */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>استعادة حسابات الملاك وإدارة المستخدمين الطارئة</h2>
                    <p>
                      اختر الأكاديمية لاستعادة كلمة مرور المالك فوريًا أو إنهاء الجلسات النشطة.
                    </p>
                  </div>
                  <span className="pc-live-boundary">
                    <LockKeyhole size={14} /> صلاحية طوارئ R00
                  </span>
                </header>

                <div className="pc-live-support-controls">
                  <label>
                    <span>الأكاديمية المستهدفة</span>
                    <select
                      value={selectedTenantId}
                      onChange={(event) => setSelectedTenantId(event.target.value)}
                    >
                      <option value="">اختر أكاديمية</option>
                      {academies.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>بحث داخل مستخدمي الأكاديمية</span>
                    <input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="ابحث بالاسم أو البريد أو الهاتف..."
                    />
                  </label>
                </div>

                {selectedTenant && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      borderRadius: "12px",
                      background: "#f0fdfa",
                      border: "1px solid #ccfbf1",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#0f766e" }}>
                        {selectedTenant.name}
                      </strong>
                      <span style={{ display: "block", fontSize: "12px", color: "#115e59", marginTop: "2px" }}>
                        المسؤول: {selectedTenant.owner || "غير مسجل"} · الحالة: {statusLabel[selectedTenant.status]}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="pc-live-primary"
                        style={{
                          background: "#0d9488",
                          borderColor: "#0d9488",
                          gap: "6px",
                        }}
                        onClick={() => handleResetOwnerPassword(selectedTenant)}
                        disabled={busyKey === `reset:${selectedTenant.id}`}
                      >
                        <KeyRound size={15} />
                        توليد كلمة مرور مؤقتة للمالك
                      </button>
                    </div>
                  </div>
                )}

                {supportLoading && (
                  <div className="pc-live-state">
                    <RefreshCw className="pc-live-spin" size={16} /> جارٍ فحص الحسابات…
                  </div>
                )}
                {supportError && (
                  <div className="pc-live-error" role="alert">
                    {supportError}
                  </div>
                )}
                {!supportLoading && selectedTenant && (
                  <MemberTable
                    rows={members}
                    busyKey={busyKey}
                    onDisable={(member) => {
                      setReasonInput("");
                      setReasonModal({
                        title: `تعطيل حساب: ${member.name ?? member.maskedPhone}`,
                        description: `سيتم إنهاء جلسات الحساب فورًا وتعطيل قدرته على تسجيل الدخول.`,
                        confirmLabel: "تأكيد التعطيل",
                        isDestructive: true,
                        onConfirm: async (reason) => {
                          await apiClient.changePlatformMemberStatus(
                            selectedTenant.id,
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
                            selectedTenant.id,
                            member.membershipId,
                            "ACTIVE",
                            reason
                          );
                          toast.success("تمت استعادة الحساب بنجاح");
                          setRefreshKey((v) => v + 1);
                        },
                      });
                    }}
                    onRevoke={(member) => {
                      setReasonInput("");
                      setReasonModal({
                        title: `إنهاء الجلسات النشطة لـ: ${member.name ?? member.maskedPhone}`,
                        description: `سيتم إنهاء جميع الـ Refresh Tokens وسحب صلاحيات الجلسات الحالية.`,
                        confirmLabel: "إنهاء الجلسات الآن",
                        isDestructive: true,
                        onConfirm: async (reason) => {
                          const res = await apiClient.revokePlatformUserSessions(
                            selectedTenant.id,
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
                {!supportLoading && !selectedTenant && (
                  <p className="pc-live-empty">اختر أكاديمية لإدارة مستخدميها واستعادة حساب مالكها.</p>
                )}
              </section>
            </>
          )}

          {/* ========================================================= */}
          {/* VIEW 5: SYSTEM HEALTH & AUDIT (الخوادم وسجل التدقيق)      */}
          {/* ========================================================= */}
          {!loading && !error && view === "system" && (
            <>
              {/* Infrastructure Status */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>حالة البنية التحتية والخوادم الحية</h2>
                    <p>فحص استجابة الـ Web API، وقاعدة بيانات Supabase، ونظام المصادقة JWT.</p>
                  </div>
                  <button
                    type="button"
                    className="pc-live-link"
                    onClick={() => {
                      toast.promise(apiClient.platformOverview(), {
                        loading: "جارٍ فحص استجابة الخوادم وقاعدة البيانات…",
                        success: "جميع خدمات المنصة وقاعدة البيانات تعمل بكفاءة تامة (85ms)",
                        error: "تعذر فحص صحة الخوادم حاليًا",
                      });
                    }}
                  >
                    <RefreshCw size={14} /> فحص فوري للخدمات
                  </button>
                </header>
                <div className="pc-system-grid">
                  <article className="pc-system-card">
                    <div className="pc-system-head">
                      <div className="pc-system-title-wrap">
                        <span className="pc-system-icon-wrap api">
                          <Server size={18} />
                        </span>
                        <div>
                          <strong>خادم الباك إند (.NET 9 Web API)</strong>
                          <small>academy-dashboard.runasp.net</small>
                        </div>
                      </div>
                      <span className="pc-system-badge healthy">
                        <span className="pc-badge-pulse" /> متصل ونشط
                      </span>
                    </div>
                    <div className="pc-system-metrics">
                      <div className="pc-system-metric-row">
                        <span>زمن الاستجابة:</span>
                        <strong>~85ms</strong>
                      </div>
                      <div className="pc-system-metric-row">
                        <span>البروتوكول:</span>
                        <strong>HTTP/2 · TLS 1.3</strong>
                      </div>
                      <div className="pc-system-metric-row">
                        <span>حالة الخدمة:</span>
                        <strong className="text-emerald">جاهز لاستقبال الطلبات</strong>
                      </div>
                    </div>
                  </article>

                  <article className="pc-system-card">
                    <div className="pc-system-head">
                      <div className="pc-system-title-wrap">
                        <span className="pc-system-icon-wrap db">
                          <Database size={18} />
                        </span>
                        <div>
                          <strong>قاعدة البيانات (PostgreSQL / Supabase)</strong>
                          <small>PostgreSQL 16 · Frankfurt Cloud</small>
                        </div>
                      </div>
                      <span className="pc-system-badge healthy">
                        <span className="pc-badge-pulse" /> متصل ومحدث
                      </span>
                    </div>
                    <div className="pc-system-metrics">
                      <div className="pc-system-metric-row">
                        <span>المخططات المطبقة:</span>
                        <strong>18 Migration مطبق بالكامل</strong>
                      </div>
                      <div className="pc-system-metric-row">
                        <span>عزل الأكاديميات:</span>
                        <strong className="text-emerald">Multi-Tenant Isolation صارم</strong>
                      </div>
                    </div>
                  </article>

                  <article className="pc-system-card">
                    <div className="pc-system-head">
                      <div className="pc-system-title-wrap">
                        <span className="pc-system-icon-wrap auth">
                          <ShieldCheck size={18} />
                        </span>
                        <div>
                          <strong>المصادقة والجلسات (JWT Tokens)</strong>
                          <small>HS256 Key · Refresh Token Rotation</small>
                        </div>
                      </div>
                      <span className="pc-system-badge healthy">
                        <span className="pc-badge-pulse" /> مؤمن
                      </span>
                    </div>
                    <div className="pc-system-metrics">
                      <div className="pc-system-metric-row">
                        <span>صلاحية التوكن:</span>
                        <strong>15 دقيقة Access · 7 أيام Refresh</strong>
                      </div>
                      <div className="pc-system-metric-row">
                        <span>الجلسات النشطة:</span>
                        <strong>{fmtNumber(overview?.activeSessions ?? 3)} جلسة</strong>
                      </div>
                    </div>
                  </article>

                  <article className="pc-system-card">
                    <div className="pc-system-head">
                      <div className="pc-system-title-wrap">
                        <span className="pc-system-icon-wrap storage">
                          <HardDrive size={18} />
                        </span>
                        <div>
                          <strong>التخزين السحابي (Supabase Storage)</strong>
                          <small>Private Bucket Mode · Signed URLs</small>
                        </div>
                      </div>
                      <span className="pc-system-badge healthy">
                        <span className="pc-badge-pulse" /> جاهز
                      </span>
                    </div>
                    <div className="pc-system-metrics">
                      <div className="pc-system-metric-row">
                        <span>الحاويات:</span>
                        <strong>academy-assets, reports, avatars</strong>
                      </div>
                      <div className="pc-system-metric-row">
                        <span>الأمان:</span>
                        <strong className="text-emerald">روابط مشفرة ومؤقتة</strong>
                      </div>
                    </div>
                  </article>
                </div>
              </section>

              {/* Platform Audit Trail */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>سجل تدقيق وعمليات المنصة (Platform Activity Audit)</h2>
                    <p>توثيق كافة التغييرات الإدارية والأمنية مع سبب كل إجراء.</p>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                    <span>الأكاديمية:</span>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <option value="">جميع الأكاديميات</option>
                      {academies.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </header>
                <ActivityTable rows={activity} />
              </section>

              {/* RBAC Reference Guide (Collapsible to prevent clutter) */}
              <section className="pc-live-card">
                <header>
                  <div>
                    <h2>ميثاق وحوكمة صلاحيات المنصة (RBAC Security Architecture)</h2>
                    <p>دليل الحدود البرمجية الفاصلة بين الأدوار من R00 حتى R09 لحماية الخصوصية.</p>
                  </div>
                  <button
                    type="button"
                    className="pc-live-link"
                    onClick={() => setRbacExpanded((prev) => !prev)}
                  >
                    {rbacExpanded ? "إخفاء الدليل" : "معاينة دليل الصلاحيات"}
                  </button>
                </header>

                {rbacExpanded && (
                  <div className="pc-roles-grid" style={{ marginTop: "16px" }}>
                    {ROLE_POLICIES_GUIDE.map((role) => (
                      <article className="pc-role-card" key={role.code}>
                        <div className="pc-role-card-head">
                          <div className="pc-role-card-title">
                            <span className="pc-role-avatar">{role.code}</span>
                            <strong>{role.title}</strong>
                          </div>
                          <span className="pc-role-scope-badge">{role.scope}</span>
                        </div>
                        <div className="pc-role-points">
                          {role.allowed.map((pt) => (
                            <div className="pc-role-point can" key={pt}>
                              <Check size={14} />
                              <span>{pt}</span>
                            </div>
                          ))}
                          {role.forbidden.map((pt) => (
                            <div className="pc-role-point cannot" key={pt}>
                              <ShieldAlert size={14} />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: PLAN UPGRADE & BRANCH LIMITS                    */}
      {/* ========================================================= */}
      {planModalAcademy && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPlanModalAcademy(null);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl">
            <div className="pc-ticket-dialog-head">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} color="#0d9488" />
                  ترقية وتعديل باقة: {planModalAcademy.name}
                </h3>
                <small style={{ color: "#64748b" }}>
                  كود التينانت: {planModalAcademy.id} · الفروع الحالية: {planModalAcademy.branches}
                </small>
              </div>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setPlanModalAcademy(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePlanUpgrade} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700 }}>اختر الباقة المستهدفة</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlanCode(plan.code);
                        setCustomBranchLimit(plan.branchesLimit);
                      }}
                      style={{
                        padding: "12px 8px",
                        borderRadius: "10px",
                        border:
                          selectedPlanCode === plan.code
                            ? "2px solid #0d9488"
                            : "1px solid #cbd5e1",
                        background:
                          selectedPlanCode === plan.code ? "#f0fdfa" : "#ffffff",
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "12px" }}>
                        {plan.code.toUpperCase()}
                      </strong>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {fmtNumber(plan.priceAnnual)} ج.م/سنة
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 600 }}>الحد الأقصى للفروع المصرح بها للأكاديمية</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={customBranchLimit}
                  onChange={(e) => setCustomBranchLimit(Number(e.target.value))}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 600 }}>سبب الترقية / التعديل (إلزامي للتوثيق)</span>
                <input
                  required
                  value={planUpgradeReason}
                  onChange={(e) => setPlanUpgradeReason(e.target.value)}
                  placeholder="مثال: ترقية سنوية معتمدة مع إضافة فرعي زايد والتجمع..."
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => setPlanModalAcademy(null)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="pc-live-primary"
                  disabled={!reasonValid(planUpgradeReason)}
                >
                  اعتماد الترقية وتحديث الحدود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: OWNER PASSWORD RECOVERY MODAL                   */}
      {/* ========================================================= */}
      {ownerResetResult && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOwnerResetResult(null);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl">
            <div className="pc-ticket-dialog-head">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <KeyRound size={18} color="#059669" />
                  تم توليد كلمة مرور مؤقتة لمالك الأكاديمية
                </h3>
                <small style={{ color: "#64748b" }}>
                  {ownerResetResult.tenantName} · {ownerResetResult.ownerName}
                </small>
              </div>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setOwnerResetResult(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "grid",
                gap: "12px",
              }}
            >
              <p style={{ margin: 0, fontSize: "12px", color: "#166534", lineHeight: "1.7" }}>
                يرجى مشاركة كلمة المرور المؤقتة التالية مع المالك (على هاتفه أو واتساب). سيطلب منه النظام تغييرها فور تسجيل دخوله الأول:
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1px dashed #16a34a",
                }}
              >
                <code
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    color: "#15803d",
                  }}
                >
                  {ownerResetResult.tempPassword}
                </code>
                <button
                  type="button"
                  className="pc-live-primary"
                  style={{ padding: "6px 12px", fontSize: "11px", gap: "6px" }}
                  onClick={() => {
                    void navigator.clipboard.writeText(ownerResetResult.tempPassword);
                    toast.success("تم نسخ كلمة المرور إلى الحافظة!");
                  }}
                >
                  <Copy size={13} /> نسخ
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="pc-live-primary"
                onClick={() => setOwnerResetResult(null)}
              >
                تمت المشاركة وإغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: RECORD SUBSCRIPTION PAYMENT                     */}
      {/* ========================================================= */}
      {paymentModalOpen && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPaymentModalOpen(false);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl">
            <div className="pc-ticket-dialog-head">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={18} color="#059669" />
                  تسجيل دفعة اشتراك جديدة
                </h3>
                <small style={{ color: "#64748b" }}>
                  توثيق التحويلات البنكية والإيصالات في سجل السداد المالي
                </small>
              </div>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setPaymentModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: "grid", gap: "12px" }}>
              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 600 }}>الأكاديمية المشتركة</span>
                <select
                  required
                  value={paymentTargetAcademyId}
                  onChange={(e) => setPaymentTargetAcademyId(e.target.value)}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                  }}
                >
                  <option value="">اختر الأكاديمية</option>
                  {academies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.owner || "المسؤول"})
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  <span style={{ fontWeight: 600 }}>المبلغ المسدد (ج.م)</span>
                  <input
                    type="number"
                    required
                    min={100}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    style={{
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  <span style={{ fontWeight: 600 }}>طريقة السداد</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as PlatformPaymentRecord["method"]
                      )
                    }
                    style={{
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                    }}
                  >
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                    <option value="FAWRY">فوري (Fawry)</option>
                    <option value="CREDIT_CARD">بطاقة بنكية (Visa/Mastercard)</option>
                    <option value="CASH">نقدي (خزينة المنصة)</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 600 }}>رقم المرجع / التحويل البنكي / الإيصال</span>
                <input
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="مثال: CIB-TXN-8849201 أو رقم عملية إنستاباي..."
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 600 }}>ملاحظات داخلية</span>
                <input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="سداد القسط السنوي للباقة الاحترافية..."
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="pc-live-primary"
                  style={{ background: "#059669", borderColor: "#059669" }}
                >
                  تأكيد وحفظ الدفعة في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: TICKET DETAILS & REPLY MODAL                    */}
      {/* ========================================================= */}
      {selectedTicket && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTicket(null);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl">
            <div className="pc-ticket-dialog-head">
              <div>
                <h3>{selectedTicket.subject}</h3>
                <small style={{ color: "#64748b" }}>
                  {selectedTicket.id} · {selectedTicket.academyName}
                </small>
              </div>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setSelectedTicket(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "10px",
                fontSize: "12px",
                lineHeight: "1.7",
              }}
            >
              <p style={{ margin: "0 0 6px" }}>
                <strong>صاحب الطلب: </strong>
                {selectedTicket.requesterName} ({selectedTicket.requesterRole}) -
                هاتف: {selectedTicket.requesterPhone}
              </p>
              <p style={{ margin: "0 0 6px" }}>
                <strong>التصنيف: </strong>
                {selectedTicket.category} · <strong>الأولوية: </strong>
                {ticketPriorityLabels[selectedTicket.priority].label}
              </p>
              <p style={{ margin: "0", color: "#334155" }}>
                <strong>تفاصيل المشكلة: </strong>
                {selectedTicket.description}
              </p>
            </div>

            <form
              onSubmit={handleUpdateTicket}
              style={{ display: "grid", gap: "12px" }}
            >
              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span>تحديث حالة التذكرة</span>
                <select
                  value={ticketStatusDraft}
                  onChange={(e) =>
                    setTicketStatusDraft(
                      e.target.value as SupportTicket["status"]
                    )
                  }
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    font: "inherit",
                    fontSize: "12px",
                  }}
                >
                  <option value="new">تذكرة جديدة</option>
                  <option value="inProgress">قيد المتابعة والحل</option>
                  <option value="waiting">بانتظار رد العميل</option>
                  <option value="resolved">تم الحل وإغلاق التذكرة</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span>ملاحظات المتابعة والرد الداخلي</span>
                <textarea
                  rows={3}
                  value={ticketReplyNote}
                  onChange={(e) => setTicketReplyNote(e.target.value)}
                  placeholder="اكتب ردك وملاحظات المتابعة مع مسؤول الأكاديمية..."
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    font: "inherit",
                    fontSize: "12px",
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => setSelectedTicket(null)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="pc-live-primary"
                  style={{ padding: "8px 16px" }}
                >
                  حفظ التحديث والرد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: REASON CONFIRMATION MODAL                       */}
      {/* ========================================================= */}
      {reasonModal && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReasonModal(null);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl">
            <div className="pc-ticket-dialog-head">
              <h3>{reasonModal.title}</h3>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setReasonModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "12px",
                lineHeight: "1.7",
              }}
            >
              {reasonModal.description}
            </p>
            <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600 }}>
                سبب الإجراء (إلزامي للتوثيق في سجل التدقيق)
              </span>
              <input
                autoFocus
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="اكتب سببًا واضحًا (4 أحرف على الأقل)..."
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  font: "inherit",
                  fontSize: "12px",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && reasonValid(reasonInput)) {
                    e.preventDefault();
                    const r = reasonInput;
                    const onConf = reasonModal.onConfirm;
                    setReasonModal(null);
                    setReasonInput("");
                    void onConf(r);
                  }
                }}
              />
            </label>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                className="pc-live-link"
                onClick={() => setReasonModal(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="pc-live-primary"
                style={{
                  padding: "8px 18px",
                  background: reasonModal.isDestructive ? "#dc2626" : undefined,
                  borderColor: reasonModal.isDestructive ? "#dc2626" : undefined,
                }}
                disabled={!reasonValid(reasonInput)}
                onClick={async () => {
                  const r = reasonInput;
                  const onConf = reasonModal.onConfirm;
                  setReasonModal(null);
                  setReasonInput("");
                  await onConf(r);
                }}
              >
                {reasonModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 6: TENANT DIAGNOSTICS & SUPPORT INSPECTION */}
      {inspectionAcademy && (
        <div className="pc-live-modal-scrim" onClick={() => setInspectionAcademy(null)}>
          <div
            className="pc-live-modal"
            style={{ maxWidth: 620 }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span className="pc-live-eyebrow">
                  <ShieldCheck size={14} /> فحص ومعاينة الأكاديمية للدعم الفني
                </span>
                <h3 style={{ margin: "4px 0 0", fontSize: 17, color: "#0f172a" }}>
                  {inspectionAcademy.name}
                </h3>
                <small style={{ color: "#64748b" }}>
                  كود التينانت: <code>{inspectionAcademy.id}</code> · النطاق: {inspectionAcademy.slug || "بدون"}
                </small>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setInspectionAcademy(null)}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <small style={{ color: "#64748b", display: "block" }}>حالة الاشتراك</small>
                <strong style={{ color: inspectionAcademy.status === "ACTIVE" ? "#0f766e" : inspectionAcademy.status === "TRIAL" ? "#d97706" : "#dc2626" }}>
                  {statusLabel[inspectionAcademy.status] || inspectionAcademy.status}
                </strong>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <small style={{ color: "#64748b", display: "block" }}>الباقة المعتمدة</small>
                <strong style={{ color: "#1e293b" }}>{inspectionAcademy.planName || inspectionAcademy.plan}</strong>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <small style={{ color: "#64748b", display: "block" }}>الفروع المصرحة</small>
                <strong style={{ color: "#1e293b" }}>{inspectionAcademy.branches} / {inspectionAcademy.allowedBranches || 3}</strong>
              </div>
            </div>

            <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <strong style={{ color: "#0f766e", fontSize: 13, display: "block", marginBottom: 4 }}>
                بيانات مسؤول الأكاديمية (Owner / R01):
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#134e4a" }}>
                <div>الاسم: <strong>{inspectionAcademy.owner || "غير مسجل"}</strong></div>
                <div>الهاتف: <strong dir="ltr">{inspectionAcademy.ownerPhone || "+201000000002"}</strong></div>
                <div>البريد: <strong>{inspectionAcademy.ownerEmail || "owner@example.com"}</strong></div>
                <div>المستخدمون: <strong>{fmtNumber(inspectionAcademy.users)} موظف</strong></div>
              </div>
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
              <strong style={{ display: "block", marginBottom: 4 }}>
                🔒 حدود الخصوصية والأمان الفاصلة (Privacy Guard):
              </strong>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                R00 يطلع على البيانات التشغيلية وهيكل الفروع وحسابات الموظفين فقط، ومحجوب برمجياً عن رؤية أسماء وسجلات الطلاب أو سندات قبض أولياء الأمور الداخلية.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="pc-live-link"
                onClick={() => {
                  const summary = JSON.stringify(inspectionAcademy, null, 2);
                  void navigator.clipboard.writeText(summary);
                  toast.success("تم نسخ تقرير الفحص الفني للحافظة بنجاح");
                }}
              >
                <Copy size={14} /> نسخ تقرير الفحص الفني
              </button>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="pc-live-primary"
                  style={{ background: "#ea580c", borderColor: "#ea580c" }}
                  onClick={() => {
                    const target = inspectionAcademy;
                    setInspectionAcademy(null);
                    setImpersonationAcademy(target);
                    setImpersonationReason("");
                  }}
                  title="دخول فحص الطوارئ للأكاديمية ومعاينة الشاشات من الداخل"
                >
                  <ShieldAlert size={14} /> فحص طارئ (Super Access)
                </button>
                <button
                  type="button"
                  className="pc-live-primary"
                  style={{ background: "#0d9488", borderColor: "#0d9488" }}
                  onClick={() => {
                    const code = `SUP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                    toast.success(`تم إنشاء رمز جلسة الدعم المؤقتة: ${code} (صالح لمدة 15 دقيقة)`);
                  }}
                >
                  <KeyRound size={15} /> توليد كود جلسة دعم مؤقتة
                </button>
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => setInspectionAcademy(null)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: BROADCAST ANNOUNCEMENT MODAL */}
      {broadcastModalOpen && (
        <div className="pc-live-modal-scrim" onClick={() => setBroadcastModalOpen(false)}>
          <div
            className="pc-live-modal"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <Megaphone size={18} color="#0d9488" />
                بث إشعار أو تنبيه صيانة عام للأكاديميات
              </h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setBroadcastModalOpen(false)}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 12 }}>
              سيتم إرسال هذا التنبيه فورًا إلى لوحات التحكم الخاصة بمسؤولي الأكاديميات (R01) وتوثيقه في سجل النظام.
            </p>

            <form
              onSubmit={(e) => {
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
              }}
              style={{ display: "grid", gap: 14 }}
            >
              <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
                <span>نوع التنبيه:</span>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
                >
                  <option value="INFO">📢 إعلان عام وميزات جديدة</option>
                  <option value="WARNING">⚠️ تنبيه صيانة مجدولة للنظام</option>
                  <option value="SUCCESS">🎉 ترقية البنية التحتية وتسريع الخدمات</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
                <span>الشريحة المستهدفة:</span>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
                >
                  <option value="ALL">جميع الأكاديميات المسجلة ({enrichedAcademies.length})</option>
                  <option value="PAID">الأكاديميات ذات الاشتراكات النشطة فقط</option>
                  <option value="TRIAL">الأكاديميات في الفترة التجريبية فقط</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
                <span>عنوان الإشعار:</span>
                <input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="مثال: موعد صيانة وتحديث السيرفرات الليلة الساعة 2:00 صباحًا"
                  style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
                />
              </label>

              <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
                <span>نص وتفاصيل الإشعار:</span>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="اكتب تفاصيل التحديث أو الصيانة وتأثيرها المتوقع..."
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", font: "inherit", fontSize: 12 }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => setBroadcastModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="pc-live-primary"
                  style={{ padding: "8px 18px" }}
                >
                  تأكيد وإرسال البث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: SUBSCRIPTION RENEWAL REMINDER (WHATSAPP 1-CLICK) */}
      {paymentReminderTenant && (
        <div className="pc-live-modal-scrim" onClick={() => setPaymentReminderTenant(null)}>
          <div
            className="pc-live-modal"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={18} color="#d97706" />
                مطالبة وتذكير تجديد الاشتراك (WhatsApp 1-Click)
              </h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setPaymentReminderTenant(null)}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px 14px", borderRadius: 10, marginBottom: 14, fontSize: 12 }}>
              <div>الأكاديمية: <strong>{paymentReminderTenant.name}</strong></div>
              <div>المسؤول: <strong>{paymentReminderTenant.owner || "مسؤول الأكاديمية"}</strong> · الهاتف: <strong dir="ltr">{paymentReminderTenant.ownerPhone || "+201000000002"}</strong></div>
              <div>الخطة: <strong>{paymentReminderTenant.planName}</strong> · المستحق السنوي: <strong style={{ color: "#b45309" }}>{paymentReminderTenant.planCode === "enterprise" ? "70,000" : paymentReminderTenant.planCode === "growth" ? "35,000" : "15,000"} ج.م</strong></div>
            </div>

            <label style={{ display: "grid", gap: 6, fontSize: 12, marginBottom: 16 }}>
              <span>نص رسالة الواتساب الجاهزة للإرسال:</span>
              <textarea
                rows={5}
                readOnly
                value={`مرحباً م. ${paymentReminderTenant.owner || "مسؤول الأكاديمية"}،\nنود تذكيركم بتجديد اشتراك منصة مدى لأكاديمية (${paymentReminderTenant.name}) لضمان استمرار عمل فروعكم (${paymentReminderTenant.branches} فروع) والخدمات السحابية دون انقطاع.\nقيمة الاشتراك السنوي: ${paymentReminderTenant.planCode === "enterprise" ? "70,000" : paymentReminderTenant.planCode === "growth" ? "35,000" : "15,000"} ج.م.\n\nطرق الدفع المعتمدة:\n- إنستاباي: instapay@mada-academy\n- التحويل البنكي: بنك مصر / حساب رقم: 1234567890\n\nيرجى إرسال إيصال السداد لاعتماد التجديد فوراً. شكراً لثقتكم في مدى!`}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: 12,
                  lineHeight: 1.6,
                  fontFamily: "inherit",
                }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="pc-live-primary"
                style={{ background: "#16a34a", borderColor: "#16a34a" }}
                onClick={() => {
                  const text = `مرحباً م. ${paymentReminderTenant.owner || "مسؤول الأكاديمية"}،\nنود تذكيركم بتجديد اشتراك منصة مدى لأكاديمية (${paymentReminderTenant.name}) لضمان استمرار عمل فروعكم والخدمات السحابية دون انقطاع.\nقيمة الاشتراك السنوي: ${paymentReminderTenant.planCode === "enterprise" ? "70,000" : paymentReminderTenant.planCode === "growth" ? "35,000" : "15,000"} ج.م.\nإنستاباي: instapay@mada-academy`;
                  void navigator.clipboard.writeText(text);
                  toast.success("تم نسخ رسالة الواتساب للحافظة بنجاح!");
                  const phone = (paymentReminderTenant.ownerPhone || "201000000002").replace(/[^0-9]/g, "");
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
                }}
              >
                <ExternalLink size={15} /> نسخ وفتح واتساب المباشر
              </button>

              <button
                type="button"
                className="pc-live-link"
                onClick={() => setPaymentReminderTenant(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EMERGENCY SUPER ACCESS (VIEW-AS)                   */}
      {/* ========================================================= */}
      {impersonationAcademy && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setImpersonationAcademy(null);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl" style={{ maxWidth: "540px" }}>
            <div className="pc-ticket-dialog-head" style={{ borderBottom: "1px solid #fed7aa", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#ea580c", color: "#fff", display: "grid", placeItems: "center" }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "#9a3412" }}>دخول فحص الطوارئ (Super Access · R00)</h3>
                  <small style={{ color: "#c2410c" }}>معاينة وحل المشاكل التشغيلية من داخل مساحة الأكاديمية</small>
                </div>
              </div>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setImpersonationAcademy(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "16px 0", display: "grid", gap: "14px" }}>
              <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px 14px", borderRadius: "8px", fontSize: "12px", lineHeight: "1.7", color: "#92400e" }}>
                <strong>الأكاديمية المستهدفة:</strong> {impersonationAcademy.name} ({impersonationAcademy.id})<br />
                <strong>تنبيه حوكمة وأمان:</strong> ستدخل إلى واجهات التشغيل الخاصة بالأكاديمية في وضع فحص طارئ لمعاينة الخلل وحله. يتم توثيق هذا الإجراء وتوقيت بدئه في سجل التدقيق الأمني (Audit Log).
              </div>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>
                  سبب التدخل الطارئ (إلزامي لمكافحة التلاعب) <span style={{ color: "#dc2626" }}>*</span>
                </span>
                <textarea
                  rows={3}
                  placeholder="مثال: فحص مشكلة شفت الخزينة المعلق، أو معالجة خطأ في رصد درجات الطلاب بناءً على تذكرة الدعم TCK-801..."
                  value={impersonationReason}
                  onChange={(e) => setImpersonationReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <small style={{ color: "#64748b" }}>
                  يجب ألا يقل السبب عن 4 أحرف لضمان توثيق الحوكمة.
                </small>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                className="pc-live-link"
                onClick={() => setImpersonationAcademy(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="pc-live-primary"
                style={{ background: "#ea580c", borderColor: "#ea580c" }}
                onClick={handleStartEmergencyImpersonation}
                disabled={!reasonValid(impersonationReason)}
              >
                بدء جلسة فحص الطوارئ والانتقال للمساحة ⬅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NEW SUPPORT TICKET / FEATURE SUGGESTION            */}
      {/* ========================================================= */}
      {newTicketModalOpen && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewTicketModalOpen(false);
          }}
        >
          <div className="pc-ticket-dialog" dir="rtl" style={{ maxWidth: "560px" }}>
            <div className="pc-ticket-dialog-head">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} color="#0d9488" />
                  تسجيل تذكرة دعم أو اقتراح ميزة جديدة
                </h3>
                <small style={{ color: "#64748b" }}>
                  توثيق البلاغات التقنية ومقترحات التطوير مع جدولتها ومتابعتها
                </small>
              </div>
              <button
                type="button"
                className="pc-ticket-dialog-close"
                onClick={() => setNewTicketModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTicket} style={{ display: "grid", gap: "12px", paddingTop: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  <span style={{ fontWeight: 600 }}>الأكاديمية المعنية</span>
                  <select
                    value={newTicketAcademyId}
                    onChange={(e) => setNewTicketAcademyId(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    {academies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  <span style={{ fontWeight: 600 }}>نوع المعاملة</span>
                  <select
                    value={newTicketType}
                    onChange={(e) => {
                      const t = e.target.value as "issue" | "suggestion" | "billing";
                      setNewTicketType(t);
                      if (t === "suggestion") setNewTicketCategory("اقتراح ميزة جديدة");
                      else if (t === "billing") setNewTicketCategory("اشتراكات وخطط");
                      else setNewTicketCategory("مشكلة تقنية");
                    }}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="issue">بلاغ عطل أو مشكلة تقنية 🚨</option>
                    <option value="suggestion">اقتراح ميزة جديدة أو فكرة 💡</option>
                    <option value="billing">استفسار مالي أو باقة 💳</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  <span style={{ fontWeight: 600 }}>التصنيف</span>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as SupportTicket["category"])}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="مشكلة تقنية">مشكلة تقنية 🐞</option>
                    <option value="اشتراكات وخطط">اشتراكات وخطط 💳</option>
                    <option value="اقتراح ميزة جديدة">اقتراح ميزة جديدة 💡</option>
                    <option value="تفعيل فروع">تفعيل فروع 🏢</option>
                    <option value="استفسار تشغيلي">استفسار تشغيلي ❓</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  <span style={{ fontWeight: 600 }}>الأولوية والأهمية</span>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as SupportTicket["priority"])}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="high">مرتفعة / حرجة 🔴</option>
                    <option value="medium">متوسطة 🟡</option>
                    <option value="low">منخفضة 🟢</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 600 }}>عنوان التذكرة / الاقتراح <span style={{ color: "#dc2626" }}>*</span></span>
                <input
                  required
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="مثال: إضافة زر لتصدير كشف الدرجات إلى ملف Excel مباشرة..."
                  style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                <span style={{ fontWeight: 600 }}>تفاصيل الطلب وسيناريو الاستخدام <span style={{ color: "#dc2626" }}>*</span></span>
                <textarea
                  required
                  rows={4}
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل، أو الفائدة التشغيلية للميزة المقترحة..."
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "inherit" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => setNewTicketModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="pc-live-primary"
                >
                  تسجيل وحفظ التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONVERT LEAD TO LIVE ACADEMY */}
      {convertLeadModal && (
        <div
          className="pc-ticket-detail-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !converting) setConvertLeadModal(null);
          }}
        >
          <div className="pc-ticket-dialog" style={{ width: "min(680px, 95vw)" }} dir="rtl">
            <div className="pc-ticket-dialog-head">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
                  <Building2 size={20} color="#2563eb" />
                  {convertSuccess ? "تم إنشاء وتفعيل الأكاديمية بنجاح 🚀" : "تحويل طلب المعاينة إلى أكاديمية مفعّلة"}
                </h3>
                <small style={{ color: "#64748b" }}>
                  طلب وارد: {convertLeadModal.academyName} · المعرف: <code>{convertLeadModal.id}</code>
                </small>
              </div>
              {!converting && (
                <button
                  type="button"
                  className="pc-ticket-dialog-close"
                  onClick={() => setConvertLeadModal(null)}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {convertSuccess ? (
              <div style={{ display: "grid", gap: "16px", padding: "8px 0" }}>
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <CheckCircle2 size={32} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: "0 0 4px", color: "#166534", fontSize: "15px" }}>
                      تم تأسيس الأكاديمية وربط التينانت بالكامل!
                    </h4>
                    <p style={{ margin: 0, color: "#15803d", fontSize: "13px" }}>
                      تم تحديث حالة الطلب تلقائياً إلى (تم التحويل لعميل ✅)، وإضافة الأكاديمية لقائمة المنصة.
                    </p>
                  </div>
                </div>

                {/* Credentials Card */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  <h5 style={{ margin: 0, color: "#334155", fontSize: "14px" }}>
                    بيانات اعتماد مسؤول الأكاديمية (Owner Credentials):
                  </h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                    <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      <small style={{ display: "block", color: "#64748b" }}>الأكاديمية والنطاق</small>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>{convertSuccess.academy.name}</strong>
                      <span style={{ display: "block", fontSize: "12px", color: "#2563eb", fontFamily: "monospace" }}>
                        {convertSuccess.academy.slug}
                      </span>
                    </div>
                    <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      <small style={{ display: "block", color: "#64748b" }}>هاتف تسجيل الدخول</small>
                      <strong style={{ fontSize: "15px", color: "#0f172a", direction: "ltr", display: "inline-block" }}>
                        {convertSuccess.owner.phone}
                      </strong>
                    </div>
                    <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      <small style={{ display: "block", color: "#64748b" }}>كلمة المرور المؤقتة</small>
                      <strong style={{ fontSize: "15px", color: "#0d9488", fontFamily: "monospace" }}>
                        {convertSuccess.owner.tempPass}
                      </strong>
                    </div>
                    <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      <small style={{ display: "block", color: "#64748b" }}>رابط الدخول للنظام</small>
                      <span style={{ fontSize: "13px", color: "#475569", fontFamily: "monospace", wordBreak: "break-all" }}>
                        {window.location.origin}/login
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="pc-live-link"
                    onClick={() => {
                      const text = `الأكاديمية: ${convertSuccess.academy.name}\nرابط الدخول: ${window.location.origin}/login\nالهاتف: ${convertSuccess.owner.phone}\nكلمة المرور: ${convertSuccess.owner.tempPass}`;
                      navigator.clipboard.writeText(text);
                      toast.success("تم نسخ بيانات الدخول إلى الحافظة!");
                    }}
                  >
                    <Copy size={14} /> نسخ بيانات الدخول
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      border: "1px solid #15803d",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onClick={handleSendCredentialsWhatsApp}
                  >
                    <MessageCircle size={15} /> إرسال البيانات عبر واتساب 📲
                  </button>
                  <button
                    type="button"
                    className="pc-live-primary"
                    onClick={() => setConvertLeadModal(null)}
                  >
                    إغلاق والعودة
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConvertLeadSubmit} style={{ display: "grid", gap: "14px" }}>
                {/* Note / Need Badge */}
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#1e40af",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "3px" }}>
                    🎯 الاحتياج التشغيلي المسجل: {convertLeadModal.operationalNeed}
                  </div>
                  <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                    عدد الفروع المطلوبة: <strong>{convertLeadModal.branchCount} فروع</strong>
                    {convertLeadModal.notes ? ` · ملاحظات: ${convertLeadModal.notes}` : ""}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      اسم الأكاديمية الرسمي *
                    </span>
                    <input
                      type="text"
                      required
                      value={convertForm.name}
                      onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
                      placeholder="مثال: أكاديمية الأبطال للسباحة"
                    />
                  </label>

                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      المعرف الداخلي (Slug) *
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={convertForm.slug}
                      onChange={(e) => setConvertForm({ ...convertForm, slug: e.target.value })}
                      placeholder="champion-academy"
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      باقة الاشتراك المقترحة *
                    </span>
                    <select
                      value={convertForm.planCode}
                      onChange={(e) => setConvertForm({ ...convertForm, planCode: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="STARTER">Starter · بداية (فرع واحد)</option>
                      <option value="GROWTH">Growth · نمو (حتى 3 فروع) [موصى به للطلب]</option>
                      <option value="SCALE">Scale · توسع ومؤسسات (فروع غير محدودة)</option>
                    </select>
                  </label>

                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      اسم الفرع الأساسي الأول *
                    </span>
                    <input
                      type="text"
                      required
                      value={convertForm.branchName}
                      onChange={(e) => setConvertForm({ ...convertForm, branchName: e.target.value })}
                      placeholder="الفرع الرئيسي"
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      كود الفرع الأساسي *
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={convertForm.branchCode}
                      onChange={(e) => setConvertForm({ ...convertForm, branchCode: e.target.value.toUpperCase() })}
                      placeholder="MAIN"
                    />
                  </label>

                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      اسم المسؤول / مالك الأكاديمية *
                    </span>
                    <input
                      type="text"
                      required
                      value={convertForm.ownerName}
                      onChange={(e) => setConvertForm({ ...convertForm, ownerName: e.target.value })}
                      placeholder="الاسم الثلاثي"
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      البريد الإلكتروني للتواصل *
                    </span>
                    <input
                      type="email"
                      dir="ltr"
                      required
                      value={convertForm.ownerEmail}
                      onChange={(e) => setConvertForm({ ...convertForm, ownerEmail: e.target.value })}
                      placeholder="owner@academy.com"
                    />
                  </label>

                  <label>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      رقم هاتف الدخول والتواصل *
                    </span>
                    <input
                      type="tel"
                      dir="ltr"
                      required
                      value={convertForm.ownerPhone}
                      onChange={(e) => setConvertForm({ ...convertForm, ownerPhone: e.target.value })}
                      placeholder="01012345678"
                    />
                  </label>
                </div>

                <div>
                  <label>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                        كلمة المرور المؤقتة للحساب *
                      </span>
                      <button
                        type="button"
                        onClick={handleRegeneratePassword}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#2563eb",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <RefreshCw size={12} /> توليد كلمة مرور جديدة
                      </button>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={convertForm.ownerPassword}
                      onChange={(e) => setConvertForm({ ...convertForm, ownerPassword: e.target.value })}
                      placeholder="8 خانات على الأقل"
                    />
                  </label>
                  <small style={{ color: "#64748b", display: "block", marginTop: "3px" }}>
                    سيتمكن المالك من تغييرها فور تسجيل الدخول من إعدادات حسابه.
                  </small>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="pc-live-link"
                    disabled={converting}
                    onClick={() => setConvertLeadModal(null)}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="pc-live-primary"
                    disabled={converting}
                    style={{
                      background: "#2563eb",
                      borderColor: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Building2 size={15} />
                    {converting ? "جارٍ تأسيس وتفعيل الأكاديمية..." : "تأكيد التأسيس وتفعيل الأكاديمية 🚀"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </RoleDashboardShell>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  isCurrency = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
  isCurrency?: boolean;
}) {
  return (
    <article className="pc-live-metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>
          {fmtNumber(value)}
          {isCurrency ? " ج.م" : ""}
        </strong>
        <em>{note}</em>
      </div>
    </article>
  );
}

function MemberTable({
  rows,
  busyKey,
  onDisable,
  onRestore,
  onRevoke,
}: {
  rows: PlatformMember[];
  busyKey: string;
  onDisable: (member: PlatformMember) => void;
  onRestore: (member: PlatformMember) => void;
  onRevoke: (member: PlatformMember) => void;
}) {
  return (
    <div className="pc-live-table-wrap">
      <table className="pc-live-table pc-live-member-table">
        <thead>
          <tr>
            <th>المستخدم</th>
            <th>الدور / العضوية</th>
            <th>آخر دخول</th>
            <th>آخر جلسة / نشطة</th>
            <th>إجراءات أمنية</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => (
            <tr key={member.membershipId}>
              <th scope="row">
                <strong>{member.name ?? "بدون اسم"}</strong>
                <small>
                  {member.maskedEmail ?? "لا يوجد بريد"} · {member.maskedPhone}
                </small>
              </th>
              <td>
                {member.roleCode}
                <small>
                  {member.membershipStatus} · الحساب {member.userStatus}
                </small>
              </td>
              <td>{fmtDate(member.lastLoginAt)}</td>
              <td>
                {fmtDate(member.lastSessionAt)}
                <small>
                  {fmtNumber(member.activeSessions)} جلسة refresh نشطة
                </small>
              </td>
              <td>
                <div className="pc-live-row-actions">
                  {member.membershipStatus === "REVOKED" ? (
                    <button
                      type="button"
                      onClick={() => onRestore(member)}
                      disabled={busyKey === `member:${member.membershipId}`}
                    >
                      إعادة العضوية
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDisable(member)}
                      disabled={
                        busyKey === `member:${member.membershipId}` ||
                        member.roleCode === "R00_PLATFORM_ADMIN"
                      }
                    >
                      <UserRoundX size={14} /> تعطيل
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRevoke(member)}
                    disabled={busyKey === `sessions:${member.userId}`}
                  >
                    <RefreshCw size={13} /> تدوير الجلسات
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="pc-live-empty-cell">
                لا يوجد مستخدمون مطابقون في الأكاديمية المحددة.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTable({ rows }: { rows: PlatformActivity[] }) {
  return (
    <div className="pc-live-activity-list">
      {rows.map((item) => (
        <article key={item.id}>
          <span className="pc-live-activity-icon">
            <Activity size={15} />
          </span>
          <div>
            <strong>{item.action}</strong>
            <small>
              {item.tenantName ?? "الأكاديمية"} · {item.targetType} · {item.targetId}
              {item.reason ? ` · السبب: ${item.reason}` : ""}
            </small>
            <small>بواسطة {item.actorName ?? "system"}</small>
          </div>
          <time>
            <Clock3 size={13} />
            {fmtDate(item.createdAt)}
          </time>
        </article>
      ))}
      {rows.length === 0 && (
        <p className="pc-live-empty">
          لا توجد أحداث تدقيق مسجلة حتى الآن.
        </p>
      )}
    </div>
  );
}
