import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Settings,
  ShieldCheck,
  UserRoundPlus,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import EnrollmentHandoff from "@/components/EnrollmentHandoff";
import FamilyProfileCard from "@/components/FamilyProfileCard";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import SecretaryDeskLive from "./SecretaryDeskLive";
import { DISCOUNTS, LEAD_LABELS, LEADS, OFFERINGS, type Lead, type LeadStatus, type Offering, OverviewView, FollowupsView, RegistrationView, OperationsView, NavButton, VIEW_COPY, VIEW_TITLES } from "@/components/SecretaryPreviewViews";

type DeskView = "overview" | "followups" | "registration" | "operations";
function SecretaryDeskPreview() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<DeskView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(LEADS[0].id);
  const [leads, setLeads] = useState(LEADS);
  const [leadQuery, setLeadQuery] = useState("");
  const [registrationQuery, setRegistrationQuery] = useState("");
  const [registrationName, setRegistrationName] = useState("");
  const [registrationPhone, setRegistrationPhone] = useState("");
  const [registrationGroup, setRegistrationGroup] = useState(OFFERINGS[0].id);
  const [discountCode, setDiscountCode] = useState("");
  const [offerings, setOfferings] = useState(OFFERINGS);
  const selectedLead =
    leads.find(item => item.id === selectedLeadId) ?? leads[0];
  const activeLeads = leads.filter(item =>
    ["new", "contacted", "interested"].includes(item.status)
  );
  const overdue = leads.filter(item => item.status === "new").length;
  const filteredLeads = useMemo(
    () =>
      leads.filter(
        item =>
          !leadQuery.trim() ||
          `${item.child} ${item.parent} ${item.phone} ${item.id}`
            .toLocaleLowerCase("ar")
            .includes(leadQuery.trim().toLocaleLowerCase("ar"))
      ),
    [leadQuery, leads]
  );
  const selectView = (next: DeskView) => {
    setView(next);
    setMobileOpen(false);
  };
  const updateStatus = (id: string, status: LeadStatus) => {
    setLeads(current =>
      current.map(item => (item.id === id ? { ...item, status } : item))
    );
    toast.success("تم تحديث حالة المتابعة", {
      description: "التحديث محلي في المعاينة.",
    });
  };
  const registerStudent = (event: FormEvent) => {
    event.preventDefault();
    if (
      !registrationName.trim() ||
      !/^01\d{9}$/.test(registrationPhone.trim())
    ) {
      toast.error("راجع اسم الطالب ورقم ولي الأمر");
      return;
    }
    const discount = DISCOUNTS.find(
      item => item.code === discountCode.trim().toUpperCase()
    );
    if (discountCode.trim() && !discount) {
      toast.error("كود الخصم غير معتمد", {
        description: "استخدمي كودًا نشطًا من قائمة الخصومات فقط.",
      });
      return;
    }
    const selectedOffering = offerings.find(
      item => item.id === registrationGroup
    );
    if (
      !selectedOffering ||
      selectedOffering.seats >= selectedOffering.capacity
    ) {
      toast.error("المجموعة ممتلئة أو غير متاحة", {
        description: "اختر مجموعة بها مقعد متاح قبل إنشاء التسجيل.",
      });
      return;
    }
    toast.success("تم إنشاء تسجيل تجريبي", {
      description: `${registrationName} · ${discount ? `${discount.label} ${discount.percent}%` : "بدون خصم"} · لا توجد فاتورة فعلية.`,
    });
    setOfferings(current =>
      current.map(item =>
        item.id === registrationGroup
          ? { ...item, seats: item.seats + 1 }
          : item
      )
    );
    setRegistrationName("");
    setRegistrationPhone("");
  };
  return (
    <RoleDashboardShell
      className="app-shell secretary-desk-shell"
      roleCode="R05"
      roleLabel="السكرتارية"
      scopeLevel="branch"
      scopeLabel="خدمة الأسر وتسجيل الفرع"
      tenantName="أكاديمية مدى"
      branchName="فرع مدينة نصر"
    >
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <button
            className="secretary-desk-brand"
            onClick={() => navigate("/secretary-desk")}
          >
            <strong>مدى</strong>
            <small>خدمة العملاء والتسجيل · R05</small>
          </button>
          <button
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="academy-switcher">
          <span className="academy-avatar">
            <Users size={20} />
          </span>
          <span className="academy-meta">
            <strong>أكاديمية مدى</strong>
            <small>هبة محمود · مدينة نصر</small>
          </span>
        </div>
        <div className="nav-caption">مساحة العمل</div>
        <nav className="primary-nav">
          <NavButton
            active={view === "overview"}
            onClick={() => selectView("overview")}
            icon={<LayoutDashboard size={19} />}
            label="ملخص اليوم"
          />
          <NavButton
            active={view === "followups"}
            onClick={() => selectView("followups")}
            icon={<MessageCircle size={19} />}
            label="Inbox المتابعة"
            count={activeLeads.length}
          />
          <NavButton
            active={view === "registration"}
            onClick={() => selectView("registration")}
            icon={<UserRoundPlus size={19} />}
            label="التسجيلات"
          />
          <NavButton
            active={view === "operations"}
            onClick={() => selectView("operations")}
            icon={<CalendarDays size={19} />}
            label="مجموعات الفرع"
          />
        </nav>
        <div className="nav-caption nav-caption-spaced">روابط أخرى</div>
        <nav className="primary-nav">
          <button
            className="nav-link"
            onClick={() => navigate("/academy-owner")}
          >
            <ShieldCheck size={19} />
            <span>تصعيد للإدارة</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/students")}>
            <Users size={19} />
            <span>ملفات الطلاب</span>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>محتاج مساعدة؟</strong>
            <span>إرشادات التسجيل والخصم</span>
          </div>
          <ChevronLeft size={16} />
        </div>
        <div className="sidebar-bottom">
          <button
            className="nav-link"
            onClick={() => toast("الإعدادات قيد التجهيز")}
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => toast("تم تسجيل الخروج التجريبي")}
          >
            <LogOut size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="branch-select assigned-branch">
              <span className="branch-icon">
                <MapPin size={17} />
              </span>
              <span>خدمة فرع مدينة نصر</span>
            </div>
          </div>
          <span className="secretary-desk-scope">
            <ShieldCheck size={14} /> نطاق الفرع فقط
          </span>
        </header>
        <div className="workspace secretary-desk-content">
          <PageHeader
            className="welcome-row"
            copyClassName="welcome-copy"
            actionsClassName="welcome-actions"
            eyebrow={
              <span className="eyebrow">
                <i className="eyebrow-dot" /> خدمة العملاء والتسجيل · R05
              </span>
            }
            title={VIEW_TITLES[view]}
            description={VIEW_COPY[view]}
            actions={
              <span className="secretary-desk-date">
                <CalendarDays size={14} /> السبت 26 سبتمبر 2026
              </span>
            }
          />
          <RoleScopeCard className="secretary-desk-scope-card" />
          <div className="secretary-desk-banner">
            <ShieldCheck size={15} />
            <span>
              <strong>حدود الدور:</strong> متابعة الاستفسارات، التسجيل في
              المجموعات المتاحة، واستخدام أكواد الخصم النشطة فقط. لا يتم تسجيل
              تحصيل مالي أو اعتماد خصم استثنائي.
            </span>
          </div>
          {view === "overview" && (
            <OverviewView
              leads={leads}
              activeLeads={activeLeads.length}
              overdue={overdue}
              onFollowups={() => selectView("followups")}
              onRegistration={() => selectView("registration")}
              onOperations={() => selectView("operations")}
            />
          )}
          {view === "followups" && (
            <FollowupsView
              leads={filteredLeads}
              selectedLead={selectedLead}
              selectedId={selectedLeadId}
              query={leadQuery}
              setQuery={setLeadQuery}
              onSelect={setSelectedLeadId}
              onStatus={updateStatus}
            />
          )}
          {view === "registration" && (
            <RegistrationView
              query={registrationQuery}
              setQuery={setRegistrationQuery}
              name={registrationName}
              setName={setRegistrationName}
              phone={registrationPhone}
              setPhone={setRegistrationPhone}
              group={registrationGroup}
              setGroup={setRegistrationGroup}
              discount={discountCode}
              setDiscount={setDiscountCode}
              onSubmit={registerStudent}
              offerings={offerings}
              onHandoff={() =>
                toast.success("تم تجهيز ملخص التسليم للمالية", {
                  description: "سيحتاج إنشاء الفاتورة إلى صلاحية R06 وربط API.",
                })
              }
            />
          )}
          {view === "operations" && (
            <OperationsView
              offerings={offerings}
              onRegister={() => selectView("registration")}
            />
          )}
        </div>
      </main>
    </RoleDashboardShell>
  );
}
export default function SecretaryDesk() {
  const { me, loading } = useAuth();
  if (loading) {
    return (
      <main className="secretary-live-loading" role="status" dir="rtl">
        جارٍ التحقق من جلسة السكرتارية…
      </main>
    );
  }
  return me ? <SecretaryDeskLive /> : <SecretaryDeskPreview />;
}
