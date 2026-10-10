import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, CircleHelp, Megaphone, Plus, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type LeadRecord } from "@/lib/apiClient";

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

  const branches = me?.branches ?? [];
  const branchName = (id: string) => branches.find(branch => branch.id === id)?.name ?? "فرع مصرح به";

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.listLeads();
      setLeads(response.items);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "تعذر تحميل الـLeads";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadLeads(); }, []);

  const visibleLeads = useMemo(() => leads.filter(lead => {
    const matchesBranch = !branchId || lead.branchId === branchId;
    const needle = query.trim().toLocaleLowerCase("ar");
    const matchesQuery = !needle || `${lead.childName} ${lead.parentName} ${lead.phone} ${lead.channel}`.toLocaleLowerCase("ar").includes(needle);
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

  return (
    <RoleDashboardShell className="app-shell marketing-desk-shell" roleCode="R07" roleLabel="مسؤول التسويق" scopeLevel="branch" scopeLabel="Leads التسويق داخل النطاق المصرح" tenantName={me?.academy?.name ?? "أكاديمية مدى"} branchName={branchId ? branchName(branchId) : "كل الفروع المصرح بها"} demo={false}>
      <main className="main-panel">
        <div className="workspace marketing-desk-content">
          <PageHeader className="welcome-row" copyClassName="welcome-copy" actionsClassName="welcome-actions" eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> مسؤول التسويق · R07 · LIVE</span>} title="سير عمل الـMarketing Leads" description="أنشئ الـLead، تابعه، وقِس التحويل من بيانات محفوظة في PostgreSQL ضمن نطاقك." actions={<span className="marketing-date"><CalendarDays size={14} /> اليوم · {branchId ? branchName(branchId) : "كل الفروع"}</span>} />
          <RoleScopeCard className="marketing-scope-card" />
          <div className="marketing-banner"><ShieldCheck size={15} /><span><strong>حدود R07:</strong> هذه الشاشة تعرض metadata التسويقية فقط. الـBackend هو مصدر الحقيقة ويفرض tenant/branch scope؛ لا توجد بيانات مالية أو تقييمات.</span></div>
          {error && <div className="role-feedback-state role-feedback-error" role="alert"><strong>تعذر الاتصال بالـMarketing API</strong><span>{error}</span><button className="button button-secondary" type="button" onClick={() => void loadLeads()}>إعادة المحاولة</button></div>}
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
              {loading ? <div className="role-feedback-state role-feedback-loading">جارٍ تحميل الـLeads من الـAPI…</div> : <div className="marketing-lead-list">{visibleLeads.map(lead => <article className="marketing-lead-row" key={lead.id}><span className="marketing-lead-avatar">{lead.childName.slice(0, 1)}</span><div><strong>{lead.childName}</strong><small>{lead.parentName} · {lead.phone}</small></div><div><strong>{lead.channel}</strong><small>{branchName(lead.branchId)} · {formatDate(lead.createdAt)}</small></div><label className="marketing-lead-next">الحالة<select value={lead.status} onChange={event => void updateStatus(lead, event.target.value as LeadRecord["status"])}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><span className={`marketing-status ${STATUS_TONE[lead.status]}`}>{STATUS_LABEL[lead.status]}</span></article>)}{!visibleLeads.length && <div className="role-feedback-state role-feedback-empty">لا توجد Leads مطابقة للنطاق أو البحث.</div>}</div>}
            </section>
            <section className="marketing-panel"><PanelTitle icon={<Plus size={16} />} title="إضافة Lead" action={<span className="marketing-context">حفظ فعلي</span>} /><form className="marketing-form" onSubmit={createLead}><label>اسم الطفل<input value={childName} onChange={event => setChildName(event.target.value)} placeholder="الاسم بالكامل" /></label><label>اسم ولي الأمر<input value={parentName} onChange={event => setParentName(event.target.value)} placeholder="ولي الأمر" /></label><label>الهاتف<input dir="ltr" value={phone} onChange={event => setPhone(event.target.value)} placeholder="01xxxxxxxxx" /></label><label>المصدر<select value={channel} onChange={event => setChannel(event.target.value)}><option>INSTAGRAM</option><option>FACEBOOK</option><option>GOOGLE</option><option>LANDING_PAGE</option><option>WALK_IN</option></select></label><button className="marketing-primary" type="submit" disabled={saving}><Plus size={14} /> {saving ? "جارٍ الحفظ…" : "حفظ الـLead"}</button><p><ShieldCheck size={13} /> سيتم حفظ السجل داخل tenant/branch scope، ويمكن للسكرتارية متابعة التحويل من مسارها.</p></form></section>
          </div>
          <div className="marketing-banner"><CircleHelp size={15} /><span><strong>حالة النطاق:</strong> الـLeads أصبحت live ومحفوظة ومقاسة. الحملات وتقويم المحتوى ما زالا يحتاجان نموذج Backend مستقلًا قبل إزالة آخر بيانات Preview.</span></div>
        </div>
      </main>
    </RoleDashboardShell>
  );
}

function PanelTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) { return <header className="marketing-panel-title"><span className="marketing-panel-icon">{icon}</span><h2>{title}</h2>{action && <div>{action}</div>}</header>; }
function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint: string }) { return <article className="marketing-kpi"><span className="marketing-kpi-icon teal">{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{hint}</em></div></article>; }
