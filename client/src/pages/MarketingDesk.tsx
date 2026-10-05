import { useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleHelp,
  Filter,
  Image,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Megaphone,
  Play,
  Settings,
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import SessionLogoutButton from "@/components/SessionLogoutButton";

import {
  CAMPAIGNS,
  CONTENT,
  INITIAL_LEADS,
  VIEW_COPY,
  VIEW_TITLE,
  Campaigns,
  Content,
  Leads,
  NavButton,
  Overview,
  type LeadStatus,
  type View,
} from "@/components/MarketingDeskViews";

export default function MarketingDesk() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState("سبتمبر 2026");
  const [branch, setBranch] = useState("كل الفروع");
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [content, setContent] = useState(CONTENT);
  const [campaignName, setCampaignName] = useState("");
  const [campaignChannel, setCampaignChannel] = useState("Instagram");
  const [contentTitle, setContentTitle] = useState("");
  const filteredLeads = useMemo(
    () =>
      leads.filter(
        item =>
          (branch === "كل الفروع" || item.branch === branch) &&
          (!query.trim() ||
            `${item.name} ${item.source} ${item.campaign}`
              .toLocaleLowerCase("ar")
              .includes(query.trim().toLocaleLowerCase("ar")))
      ),
    [branch, leads, query]
  );
  const campaignLeads = campaigns.reduce((sum, item) => sum + item.leads, 0);
  const campaignConversions = campaigns.reduce(
    (sum, item) => sum + item.conversions,
    0
  );
  const spend = CAMPAIGNS.reduce((sum, item) => sum + item.spend, 0);
  const conversionRate = Math.round(
    (campaignConversions / campaignLeads) * 100
  );
  const selectView = (next: View) => {
    setView(next);
    setMobileOpen(false);
    setQuery("");
  };
  const createCampaign = (event: FormEvent) => {
    event.preventDefault();
    if (!campaignName.trim()) {
      toast.error("اكتب اسم الحملة");
      return;
    }
    setCampaigns(current => [
      {
        id: `CMP-${String(current.length + 25).padStart(3, "0")}`,
        name: campaignName.trim(),
        channel: campaignChannel,
        status: "draft",
        leads: 0,
        conversions: 0,
        spend: 0,
        branch: "كل الفروع",
        owner: "مريم حسن",
        updated: "الآن",
      },
      ...current,
    ]);
    toast.success("تم حفظ الحملة كمسودة", {
      description: `${campaignName} · ${campaignChannel} · الحالة: مسودة`,
    });
    setCampaignName("");
  };
  const createContent = (event: FormEvent) => {
    event.preventDefault();
    if (!contentTitle.trim()) {
      toast.error("اكتب عنوان الأصل");
      return;
    }
    setContent(current => [
      {
        id: `AST-${String(current.length + 109).padStart(3, "0")}`,
        title: contentTitle.trim(),
        type: "نص",
        status: "draft",
        campaign: "بدون حملة",
        due: "غير محدد",
        platform: "Website",
      },
      ...current,
    ]);
    toast.success("تمت إضافة أصل المحتوى للمراجعة", {
      description: `${contentTitle} · الحالة: مسودة`,
    });
    setContentTitle("");
  };
  const changeLeadStatus = (id: string, status: LeadStatus) =>
    setLeads(current =>
      current.map(item =>
        item.id === id
          ? {
              ...item,
              status,
              nextAction:
                status === "interested" ? "تحويل للسكرتارية" : item.nextAction,
            }
          : item
      )
    );
  return (
    <RoleDashboardShell
      className="app-shell marketing-desk-shell"
      roleCode="R07"
      roleLabel="مسؤول التسويق"
      scopeLevel="branch"
      scopeLabel="تسويق الفرع المصرح به"
      tenantName="أكاديمية مدى"
      branchName={branch}
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
            className="marketing-brand"
            onClick={() => navigate("/marketing-desk")}
          >
            <strong>مدى</strong>
            <small>التسويق والحملات · R07</small>
          </button>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="academy-switcher">
          <span className="academy-avatar">
            <Megaphone size={20} />
          </span>
          <span className="academy-meta">
            <strong>أكاديمية مدى</strong>
            <small>مريم حسن · تسويق</small>
          </span>
        </div>
        <div className="nav-caption">المساحة التسويقية</div>
        <nav className="primary-nav">
          <NavButton
            active={view === "overview"}
            onClick={() => selectView("overview")}
            icon={<LayoutDashboard size={19} />}
            label="ملخص التسويق"
          />
          <NavButton
            active={view === "campaigns"}
            onClick={() => selectView("campaigns")}
            icon={<Target size={19} />}
            label="الحملات"
            count={campaigns.filter(item => item.status === "active").length}
          />
          <NavButton
            active={view === "content"}
            onClick={() => selectView("content")}
            icon={<Image size={19} />}
            label="تقويم المحتوى"
            count={content.filter(item => item.status === "in_review").length}
          />
          <NavButton
            active={view === "leads"}
            onClick={() => selectView("leads")}
            icon={<Users size={19} />}
            label="Marketing Leads"
            count={filteredLeads.length}
          />
        </nav>
        <div className="nav-caption nav-caption-spaced">روابط أخرى</div>
        <nav className="primary-nav">
          <button
            className="nav-link"
            onClick={() => toast("البيانات الأكاديمية التفصيلية خارج نطاق R07")}
          >
            <BarChart3 size={19} />
            <span>تقارير التحويل</span>
          </button>
          <button
            className="nav-link"
            onClick={() => toast("ارفع تذكرة دعم من نطاق التسويق")}
          >
            <CircleHelp size={19} />
            <span>الدعم</span>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>محتاج مساعدة؟</strong>
            <span>دليل الحملات والمحتوى</span>
          </div>
          <ChevronLeft size={16} />
        </div>
        <div className="sidebar-bottom">
          <button
            className="nav-link"
            onClick={() => toast("إعدادات التسويق قيد التجهيز")}
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <SessionLogoutButton className="nav-link" iconSize={19} />
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <label className="marketing-filter">
              <MapPin size={15} />
              <select
                value={branch}
                onChange={event => setBranch(event.target.value)}
              >
                <option>كل الفروع</option>
                <option>مدينة نصر</option>
                <option>المعادي</option>
                <option>الشيخ زايد</option>
              </select>
            </label>
            <label className="marketing-filter">
              <CalendarDays size={15} />
              <select
                value={period}
                onChange={event => setPeriod(event.target.value)}
              >
                <option>سبتمبر 2026</option>
                <option>أغسطس 2026</option>
                <option>يوليو 2026</option>
              </select>
            </label>
          </div>
          <span className="marketing-scope">
            <ShieldCheck size={14} /> Leads ومحتوى تسويقي فقط
          </span>
        </header>
        <div className="workspace marketing-desk-content">
          <PageHeader
            className="welcome-row"
            copyClassName="welcome-copy"
            actionsClassName="welcome-actions"
            eyebrow={
              <span className="eyebrow">
                <i className="eyebrow-dot" /> مسؤول التسويق · R07
              </span>
            }
            title={VIEW_TITLE[view]}
            description={VIEW_COPY[view]}
            actions={
              <span className="marketing-date">
                <CalendarDays size={14} /> {period} · {branch}
              </span>
            }
          />
          <RoleScopeCard className="marketing-scope-card" />
          <div className="marketing-banner">
            <ShieldCheck size={15} />
            <span>
              <strong>حدود R07:</strong> تظهر بيانات المصدر والحملة والـlead
              اللازمة للتسويق فقط. لا توجد ماليات أو تقييمات أو بيانات طالب
              حساسة.
            </span>
          </div>
          {view === "overview" && (
            <Overview
              campaignLeads={campaignLeads}
              conversions={campaignConversions}
              spend={spend}
              conversionRate={conversionRate}
              onView={selectView}
              campaigns={campaigns}
            />
          )}
          {view === "campaigns" && (
            <Campaigns
              query={query}
              setQuery={setQuery}
              name={campaignName}
              setName={setCampaignName}
              channel={campaignChannel}
              setChannel={setCampaignChannel}
              onCreate={createCampaign}
              items={campaigns}
            />
          )}
          {view === "content" && (
            <Content
              title={contentTitle}
              setTitle={setContentTitle}
              onCreate={createContent}
              items={content}
            />
          )}
          {view === "leads" && (
            <Leads
              leads={filteredLeads}
              query={query}
              setQuery={setQuery}
              onStatus={changeLeadStatus}
              onHandoff={lead =>
                toast.success("تم تجهيز التحويل إلى R05", {
                  description: `${lead} · سيحتاج إنشاء سجل lead في النظام الفعلي.`,
                })
              }
            />
          )}
        </div>
      </main>
    </RoleDashboardShell>
  );
}
