import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, CircleHelp, Megaphone, Plus, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type LeadRecord, type MarketingCampaignRecord, type MarketingContentRecord } from "@/lib/apiClient";

const STATUS_LABEL: Record<LeadRecord["status"], string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم",
  REGISTERED: "تم التسجيل",
  ARCHIVED: "مؤرشف",
};

const STATUS_TONE: Record<LeadRecord["status"], string> = {
  NEW: "new",
  CONTACTED: "contacted",
  INTERESTED: "interested",
  REGISTERED: "enrolled",
  ARCHIVED: "archived",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value));
}

export default function MarketingDesk() {
  const { me } = useAuth();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [branchId, setBranchId] = useState("");
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("INSTAGRAM");
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<MarketingCampaignRecord[]>([]);
  const [content, setContent] = useState<MarketingContentRecord[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignChannel, setCampaignChannel] = useState("INSTAGRAM");
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("POST");
  const [contentPlatform, setContentPlatform] = useState("INSTAGRAM");
  const [contentCampaignId, setContentCampaignId] = useState("");

  const branches = me?.branches ?? [];
  const branchName = (id: string) => branches.find(branch => branch.id === id)?.name ?? "فرع مصرح به";

  const loadMarketing = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadResponse, campaignResponse, contentResponse] = await Promise.all([
        apiClient.listLeads(), apiClient.listMarketingCampaigns(), apiClient.listMarketingContent(),
      ]);
      setLeads(leadResponse.items);
      setCampaigns(campaignResponse);
      setContent(contentResponse);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "تعذر تحميل الـLeads";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMarketing(); }, []);

  const visibleLeads = useMemo(() => leads.filter(lead => {
    const matchesBranch = !branchId || lead.branchId === branchId;
    const needle = query.trim().toLocaleLowerCase("ar");
    const matchesQuery = !needle || `${lead.childName} ${lead.parentName} ${lead.phone} ${lead.channel} ${lead.notes ?? ""}`.toLocaleLowerCase("ar").includes(needle);
    return matchesBranch && matchesQuery;
  }), [branchId, leads, query]);

  const metrics = useMemo(() => ({
    total: visibleLeads.length,
    active: visibleLeads.filter(lead => ["NEW", "CONTACTED", "INTERESTED"].includes(lead.status)).length,
    interested: visibleLeads.filter(lead => lead.status === "INTERESTED").length,
    registered: visibleLeads.filter(lead => lead.status === "REGISTERED").length,
  }), [visibleLeads]);

  const createLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!childName.trim() || !parentName.trim() || !phone.trim()) {
      toast.error("أكمل اسم الطفل وولي الأمر ورقم الهاتف");
      return;
    }
    setSaving(true);
    try {
      const created = await apiClient.createLead({
        childName: childName.trim(), parentName: parentName.trim(), phone: phone.trim(), channel,
        branchId: branchId || undefined,
        campaignId: selectedCampaignId || undefined,
      });
      setLeads(current => [created, ...current]);
      setChildName(""); setParentName(""); setPhone("");
      toast.success("تم حفظ الـLead في النظام");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر حفظ الـLead");
    } finally { setSaving(false); }
  };

  const updateStatus = async (lead: LeadRecord, status: LeadRecord["status"]) => {
    try {
      const updated = await apiClient.updateLeadStatus(lead.id, status);
      setLeads(current => current.map(item => item.id === updated.id ? updated : item));
      toast.success("تم حفظ حالة الـLead");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تحديث الحالة"); }
  };

  const createCampaign = async (event: FormEvent) => {
    event.preventDefault();
    if (!campaignName.trim()) return toast.error("اكتب اسم الحملة");
    try {
      const created = await apiClient.createMarketingCampaign({ name: campaignName.trim(), channel: campaignChannel, branchId: branchId || undefined });
      setCampaigns(current => [created, ...current]); setCampaignName(""); toast.success("تم حفظ الحملة");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر حفظ الحملة"); }
  };

  const createContent = async (event: FormEvent) => {
    event.preventDefault();
    if (!contentTitle.trim()) return toast.error("اكتب عنوان المحتوى");
    try {
      const created = await apiClient.createMarketingContent({ title: contentTitle.trim(), contentType, platform: contentPlatform, campaignId: contentCampaignId || undefined, branchId: branchId || undefined });
      setContent(current => [created, ...current]); setContentTitle(""); toast.success("تم حفظ عنصر المحتوى");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر حفظ المحتوى"); }
  };

  const updateCampaignStatus = async (item: MarketingCampaignRecord, status: MarketingCampaignRecord["status"]) => {
    try { const updated = await apiClient.updateMarketingCampaignStatus(item.id, status); setCampaigns(current => current.map(x => x.id === updated.id ? updated : x)); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تحديث الحملة"); }
  };

  const updateContentStatus = async (item: MarketingContentRecord, status: MarketingContentRecord["status"]) => {
    try { const updated = await apiClient.updateMarketingContentStatus(item.id, status); setContent(current => current.map(x => x.id === updated.id ? updated : x)); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تحديث المحتوى"); }
  };

  return (
    <RoleDashboardShell className="app-shell marketing-desk-shell" roleCode="R07" roleLabel="مسؤول التسويق" scopeLevel="branch" scopeLabel="الحملات والمحتوى والـLeads داخل النطاق المصرح" tenantName={me?.academy?.name ?? "أكاديمية مدى"} branchName={branchId ? branchName(branchId) : "كل الفروع المصرح بها"} demo={false}>
      <main className="main-panel">
        <div className="workspace marketing-desk-content">
          <PageHeader className="welcome-row" copyClassName="welcome-copy" actionsClassName="welcome-actions" eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> مسؤول التسويق · R07 · LIVE</span>} title="سير عمل التسويق والـLeads" description="أنشئ الحملات والمحتوى والـLeads، تابع الحالات، وقِس التحويل من بيانات محفوظة في PostgreSQL ضمن نطاقك." actions={<span className="marketing-date"><CalendarDays size={14} /> اليوم · {branchId ? branchName(branchId) : "كل الفروع"}</span>} />
          <RoleScopeCard className="marketing-scope-card" />
          <div className="marketing-banner"><ShieldCheck size={15} /><span><strong>حدود R07:</strong> الـBackend هو مصدر الحقيقة ويفرض tenant/branch scope؛ هذه الشاشة لا تعرض بيانات مالية أو تقييمات، ولا تنشر مباشرة على القنوات الخارجية.</span></div>
          {error && <div className="role-feedback-state role-feedback-error" role="alert"><strong>تعذر الاتصال بالـMarketing API</strong><span>{error}</span><button className="button button-secondary" type="button" onClick={() => void loadMarketing()}>إعادة المحاولة</button></div>}
          <section className="marketing-kpis">
            <Kpi icon={<Users size={16} />} label="كل الـLeads" value={metrics.total} hint="من المصدر المحفوظ" />
            <Kpi icon={<TrendingUp size={16} />} label="قيد المتابعة" value={metrics.active} hint="NEW · CONTACTED · INTERESTED" />
            <Kpi icon={<Megaphone size={16} />} label="مهتمون" value={metrics.interested} hint="جاهزون لخطوة تالية" />
            <Kpi icon={<CheckCircle2 size={16} />} label="تم التسجيل" value={metrics.registered} hint="تحويل محفوظ" />
          </section>
          <div className="marketing-two-col">
            <section className="marketing-panel">
              <PanelTitle icon={<Users size={16} />} title="سجل الـLeads الحي" action={<label className="marketing-search"><Search size={13} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث بالاسم أو الهاتف أو المصدر..." /></label>} />
              <div className="marketing-filters"><label>الفرع<select value={branchId} onChange={event => setBranchId(event.target.value)}><option value="">كل الفروع المصرح بها</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label></div>
              {loading ? <div className="role-feedback-state role-feedback-loading">جارٍ تحميل الـLeads من الـAPI…</div> : <div className="marketing-lead-list">{visibleLeads.map(lead => <article className="marketing-lead-row" key={lead.id}><span className="marketing-lead-avatar">{lead.childName.slice(0, 1)}</span><div><strong>{lead.childName}</strong><small>{lead.channel === "LANDING_DEMO" ? `الأكاديمية: ${lead.parentName}` : lead.parentName} · {lead.phone}</small>{lead.channel === "LANDING_DEMO" && lead.notes && <small className="marketing-demo-details">{lead.notes}</small>}</div><div><strong>{lead.channel === "LANDING_DEMO" ? "طلب Demo للنظام" : lead.channel}</strong><small>{branchName(lead.branchId)} · {formatDate(lead.createdAt)}</small></div><label className="marketing-lead-next">الحالة<select value={lead.status} onChange={event => void updateStatus(lead, event.target.value as LeadRecord["status"])}>{Object.entries(STATUS_LABEL).filter(([value]) => lead.channel !== "LANDING_DEMO" || value !== "REGISTERED").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><span className={`marketing-status ${STATUS_TONE[lead.status]}`}>{STATUS_LABEL[lead.status]}</span></article>)}{!visibleLeads.length && <div className="role-feedback-state role-feedback-empty">لا توجد Leads مطابقة للنطاق أو البحث.</div>}</div>}
            </section>
              <section className="marketing-panel"><PanelTitle icon={<Plus size={16} />} title="إضافة Lead" action={<span className="marketing-context">حفظ فعلي</span>} /><form className="marketing-form" onSubmit={createLead}><label>اسم الطفل<input value={childName} onChange={event => setChildName(event.target.value)} placeholder="الاسم بالكامل" /></label><label>اسم ولي الأمر<input value={parentName} onChange={event => setParentName(event.target.value)} placeholder="ولي الأمر" /></label><label>الهاتف<input dir="ltr" value={phone} onChange={event => setPhone(event.target.value)} placeholder="01xxxxxxxxx" /></label><label>المصدر<select value={channel} onChange={event => setChannel(event.target.value)}><option>INSTAGRAM</option><option>FACEBOOK</option><option>GOOGLE</option><option>LANDING_PAGE</option><option>WALK_IN</option></select></label><label>الحملة<select value={selectedCampaignId} onChange={event => setSelectedCampaignId(event.target.value)}><option value="">بدون حملة</option>{campaigns.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="marketing-primary" type="submit" disabled={saving}><Plus size={14} /> {saving ? "جارٍ الحفظ…" : "حفظ الـLead"}</button><p><ShieldCheck size={13} /> سيتم حفظ السجل داخل tenant/branch scope، ويمكن للسكرتارية متابعة التحويل من مسارها.</p></form></section>
          </div>
          <section className="marketing-two-col">
            <section className="marketing-panel"><PanelTitle icon={<Megaphone size={16} />} title="الحملات المحفوظة" action={<span className="marketing-context">{campaigns.length} حملة</span>} /><form className="marketing-form" onSubmit={createCampaign}><label>اسم الحملة<input value={campaignName} onChange={event => setCampaignName(event.target.value)} placeholder="عودة المدارس" /></label><label>القناة<select value={campaignChannel} onChange={event => setCampaignChannel(event.target.value)}><option>INSTAGRAM</option><option>FACEBOOK</option><option>GOOGLE</option><option>ORGANIC</option></select></label><button className="marketing-primary" type="submit"><Plus size={14} /> حفظ الحملة</button></form><div className="marketing-lead-list">{campaigns.map(item => <article className="marketing-lead-row" key={item.id}><div><strong>{item.name}</strong><small>{item.channel} · {item.leads} Leads · {item.conversions} تسجيل</small></div><label className="marketing-lead-next">الحالة<select value={item.status} onChange={event => void updateCampaignStatus(item, event.target.value as MarketingCampaignRecord["status"])}>{["DRAFT", "IN_REVIEW", "ACTIVE", "PAUSED", "COMPLETED"].map(status => <option key={status}>{status}</option>)}</select></label></article>)}</div></section>
            <section className="marketing-panel"><PanelTitle icon={<CalendarDays size={16} />} title="تقويم المحتوى" action={<span className="marketing-context">{content.length} عنصر</span>} /><form className="marketing-form" onSubmit={createContent}><label>عنوان المحتوى<input value={contentTitle} onChange={event => setContentTitle(event.target.value)} placeholder="فيديو تجربة طالب" /></label><label>النوع<select value={contentType} onChange={event => setContentType(event.target.value)}><option>POST</option><option>VIDEO</option><option>EMAIL</option><option>DESIGN</option><option>LANDING_COPY</option></select></label><label>المنصة<select value={contentPlatform} onChange={event => setContentPlatform(event.target.value)}><option>INSTAGRAM</option><option>FACEBOOK</option><option>WEBSITE</option><option>EMAIL</option></select></label><label>الحملة<select value={contentCampaignId} onChange={event => setContentCampaignId(event.target.value)}><option value="">بدون حملة</option>{campaigns.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="marketing-primary" type="submit"><Plus size={14} /> حفظ المحتوى</button></form><div className="marketing-lead-list">{content.map(item => <article className="marketing-lead-row" key={item.id}><div><strong>{item.title}</strong><small>{item.contentType} · {item.platform}</small></div><label className="marketing-lead-next">الحالة<select value={item.status} onChange={event => void updateContentStatus(item, event.target.value as MarketingContentRecord["status"])}>{["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"].map(status => <option key={status}>{status}</option>)}</select></label></article>)}</div></section>
          </section>
          <div className="marketing-banner"><CircleHelp size={15} /><span><strong>حالة النطاق:</strong> الحملات والمحتوى والـLeads أصبحت محفوظة ومقاسة داخل tenant/branch scope. الـBackend هو مصدر الحقيقة.</span></div>
        </div>
      </main>
    </RoleDashboardShell>
  );
}

function PanelTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) { return <header className="marketing-panel-title"><span className="marketing-panel-icon">{icon}</span><h2>{title}</h2>{action && <div>{action}</div>}</header>; }
function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint: string }) { return <article className="marketing-kpi"><span className="marketing-kpi-icon teal">{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{hint}</em></div></article>; }
