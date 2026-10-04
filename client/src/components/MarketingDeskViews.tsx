import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  Bell,
  ChevronLeft,
  FileText,
  Image,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import CampaignWorkflow from "@/components/CampaignWorkflow";
import MarketingLeadHandoff from "@/components/MarketingLeadHandoff";

export type View = "overview" | "campaigns" | "content" | "leads";
export type CampaignStatus =
  | "draft"
  | "in_review"
  | "active"
  | "paused"
  | "completed";
export type ContentStatus = "draft" | "in_review" | "approved" | "scheduled";
export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "trial"
  | "enrolled";
export type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: CampaignStatus;
  leads: number;
  conversions: number;
  spend: number;
  branch: string;
  owner: string;
  updated: string;
};
export type ContentItem = {
  id: string;
  title: string;
  type: string;
  status: ContentStatus;
  campaign: string;
  due: string;
  platform: string;
};
export type Lead = {
  id: string;
  name: string;
  source: string;
  campaign: string;
  branch: string;
  status: LeadStatus;
  lastTouch: string;
  nextAction: string;
};
export const CAMPAIGNS: Campaign[] = [
  {
    id: "CMP-024",
    name: "عودة المدارس · سبتمبر",
    channel: "Meta Ads",
    status: "active",
    leads: 42,
    conversions: 11,
    spend: 18500,
    branch: "كل الفروع",
    owner: "فريق التسويق",
    updated: "منذ 2 ساعة",
  },
  {
    id: "CMP-021",
    name: "ورشة الروبوتات التجريبية",
    channel: "Instagram",
    status: "active",
    leads: 28,
    conversions: 7,
    spend: 9400,
    branch: "مدينة نصر",
    owner: "مريم حسن",
    updated: "أمس",
  },
  {
    id: "CMP-018",
    name: "حملة أولياء الأمور",
    channel: "Google",
    status: "in_review",
    leads: 16,
    conversions: 0,
    spend: 6200,
    branch: "المعادي",
    owner: "مريم حسن",
    updated: "منذ 3 أيام",
  },
  {
    id: "CMP-012",
    name: "محتوى صيفي 2026",
    channel: "Organic",
    status: "completed",
    leads: 34,
    conversions: 9,
    spend: 0,
    branch: "كل الفروع",
    owner: "فريق المحتوى",
    updated: "10 سبتمبر",
  },
];
export const CONTENT: ContentItem[] = [
  {
    id: "AST-108",
    title: "فيديو تجربة طالب في الروبوتات",
    type: "فيديو",
    status: "in_review",
    campaign: "ورشة الروبوتات التجريبية",
    due: "اليوم",
    platform: "Instagram",
  },
  {
    id: "AST-107",
    title: "Carousel: 5 مهارات يتعلمها الطفل",
    type: "تصميم",
    status: "approved",
    campaign: "عودة المدارس · سبتمبر",
    due: "غدًا",
    platform: "Facebook",
  },
  {
    id: "AST-105",
    title: "Landing copy · أولياء الأمور",
    type: "نص",
    status: "scheduled",
    campaign: "حملة أولياء الأمور",
    due: "28 سبتمبر",
    platform: "Website",
  },
  {
    id: "AST-101",
    title: "رسالة بريدية · بداية المجموعة",
    type: "بريد",
    status: "draft",
    campaign: "عودة المدارس · سبتمبر",
    due: "30 سبتمبر",
    platform: "Email",
  },
];
export const INITIAL_LEADS: Lead[] = [
  {
    id: "MKT-208",
    name: "سليم أحمد فوزي",
    source: "Instagram",
    campaign: "ورشة الروبوتات التجريبية",
    branch: "مدينة نصر",
    status: "new",
    lastTouch: "اليوم",
    nextAction: "إرسال معلومات الورشة",
  },
  {
    id: "MKT-204",
    name: "ليان محمد عادل",
    source: "Google",
    campaign: "حملة أولياء الأمور",
    branch: "المعادي",
    status: "contacted",
    lastTouch: "أمس",
    nextAction: "متابعة غدًا",
  },
  {
    id: "MKT-201",
    name: "آدم شريف حسن",
    source: "Facebook",
    campaign: "عودة المدارس · سبتمبر",
    branch: "مدينة نصر",
    status: "interested",
    lastTouch: "أمس",
    nextAction: "تحويل للسكرتارية",
  },
  {
    id: "MKT-197",
    name: "ملك حسام الدين",
    source: "Landing Page",
    campaign: "عودة المدارس · سبتمبر",
    branch: "الشيخ زايد",
    status: "trial",
    lastTouch: "22 سبتمبر",
    nextAction: "تأكيد الحصة التجريبية",
  },
];
export const CAMPAIGN_LABEL: Record<CampaignStatus, string> = {
  draft: "مسودة",
  in_review: "قيد المراجعة",
  active: "نشطة",
  paused: "متوقفة",
  completed: "مكتملة",
};
export const CONTENT_LABEL: Record<ContentStatus, string> = {
  draft: "مسودة",
  in_review: "مراجعة",
  approved: "معتمد",
  scheduled: "مجدول",
};
export const LEAD_LABEL: Record<LeadStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  trial: "حصة تجريبية",
  enrolled: "تم التسجيل",
};
export const VIEW_TITLE: Record<View, string> = {
  overview: "لوحة التسويق",
  campaigns: "الحملات التسويقية",
  content: "تقويم المحتوى",
  leads: "Marketing Leads",
};
export const VIEW_COPY: Record<View, string> = {
  overview: "تابع الحملات والمحتوى ومصادر التحويل من مساحة تسويقية واحدة.",
  campaigns: "أنشئ الحملات، راجع حالتها، وقارن مصادر الـLeads والتحويل.",
  content: "حوّل خطة المحتوى إلى أصول واضحة بحالة وموعد ومنصة نشر.",
  leads: "تابع الـmarketing leads دون كشف بيانات أكاديمية أو مالية غير لازمة.",
};
function money(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
export function Overview({
  campaignLeads,
  conversions,
  spend,
  conversionRate,
  onView,
  campaigns,
}: {
  campaignLeads: number;
  conversions: number;
  spend: number;
  conversionRate: number;
  onView: (view: View) => void;
  campaigns: Campaign[];
}) {
  return (
    <>
      <section className="marketing-kpis">
        <Kpi
          icon={<Target size={16} />}
          label="حملات نشطة"
          value="2"
          hint="من 4 حملات"
          tone="violet"
        />
        <Kpi
          icon={<Users size={16} />}
          label="Marketing Leads"
          value={campaignLeads}
          hint="من كل المصادر"
          tone="teal"
        />
        <Kpi
          icon={<TrendingUp size={16} />}
          label="تحويلات"
          value={conversions}
          hint={`${conversionRate}% conversion rate`}
          tone="blue"
        />
        <Kpi
          icon={<BarChart3 size={16} />}
          label="إنفاق توضيحي"
          value={`${money(spend)} ج.م`}
          hint="لا توجد بيانات تحصيل"
          tone="amber"
        />
      </section>
      <CampaignWorkflow
        status="in_review"
        campaignName="حملة أولياء الأمور · Google"
      />
      <div className="marketing-grid">
        <section className="marketing-panel">
          <PanelTitle
            icon={<Megaphone size={16} />}
            title="نبض الحملات"
            action={
              <button
                className="marketing-secondary"
                onClick={() => onView("campaigns")}
              >
                فتح الحملات <ChevronLeft size={13} />
              </button>
            }
          />
          <div className="marketing-campaign-list">
            {campaigns.slice(0, 3).map(item => (
              <article className="marketing-campaign-row" key={item.id}>
                <span className={`marketing-campaign-icon ${item.status}`}>
                  <Target size={15} />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.channel} · {item.branch} · {item.updated}
                  </small>
                </div>
                <span className={`marketing-status ${item.status}`}>
                  {CAMPAIGN_LABEL[item.status]}
                </span>
                <span className="marketing-campaign-result">
                  <b>{item.leads}</b>
                  <small>lead</small>
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className="marketing-panel">
          <PanelTitle icon={<Bell size={16} />} title="ما يحتاج مراجعة" />
          <div className="marketing-review-list">
            <button onClick={() => onView("content")}>
              <span className="marketing-review-icon amber">
                <FileText size={15} />
              </span>
              <span>
                <strong>أصلان بانتظار المراجعة</strong>
                <small>محتوى يحتاج اعتماد branding</small>
              </span>
              <ChevronLeft size={13} />
            </button>
            <button onClick={() => onView("campaigns")}>
              <span className="marketing-review-icon violet">
                <Target size={15} />
              </span>
              <span>
                <strong>حملة في مرحلة المراجعة</strong>
                <small>حملة أولياء الأمور · Google</small>
              </span>
              <ChevronLeft size={13} />
            </button>
            <button onClick={() => onView("leads")}>
              <span className="marketing-review-icon teal">
                <Users size={15} />
              </span>
              <span>
                <strong>4 Leads تحتاج خطوة تالية</strong>
                <small>جديد أو مهتم أو حصة تجريبية</small>
              </span>
              <ChevronLeft size={13} />
            </button>
          </div>
        </section>
      </div>
      <section className="marketing-panel marketing-funnel">
        <PanelTitle
          icon={<TrendingUp size={16} />}
          title="مسار التحويل"
          action={
            <span className="marketing-context">
              {campaignLeads} lead · {conversions} تحويل
            </span>
          }
        />
        <div className="marketing-funnel-row">
          <Funnel label="الوصول" value="18,400" width="100%" tone="violet" />
          <Funnel label="Leads" value={campaignLeads} width="42%" tone="blue" />
          <Funnel label="مهتم" value="19" width="25%" tone="teal" />
          <Funnel label="تحويل" value={conversions} width="14%" tone="amber" />
        </div>
      </section>
    </>
  );
}
export function Campaigns({
  query,
  setQuery,
  name,
  setName,
  channel,
  setChannel,
  onCreate,
  items,
}: {
  query: string;
  setQuery: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  channel: string;
  setChannel: (v: string) => void;
  onCreate: (event: FormEvent) => void;
  items: Campaign[];
}) {
  const filteredItems = items.filter(
    item =>
      !query.trim() ||
      `${item.name} ${item.channel} ${item.branch}`
        .toLocaleLowerCase("ar")
        .includes(query.toLocaleLowerCase("ar"))
  );
  return (
    <div className="marketing-two-col">
      <section className="marketing-panel">
        <PanelTitle
          icon={<Target size={16} />}
          title="الحملات"
          action={
            <label className="marketing-search">
              <Search size={13} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="ابحث عن حملة..."
              />
            </label>
          }
        />
        <div className="marketing-table-list">
          {filteredItems.map(item => (
            <article className="marketing-table-row" key={item.id}>
              <span className={`marketing-campaign-icon ${item.status}`}>
                <Target size={15} />
              </span>
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.id} · {item.channel} · {item.branch} · {item.owner}
                </small>
              </div>
              <span>
                <b>{item.leads}</b>
                <small>leads</small>
              </span>
              <span>
                <b>{item.conversions}</b>
                <small>تحويل</small>
              </span>
              <span className={`marketing-status ${item.status}`}>
                {CAMPAIGN_LABEL[item.status]}
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className="marketing-panel">
        <PanelTitle
          icon={<Plus size={16} />}
          title="إنشاء حملة"
          action={<span className="marketing-context">تبدأ كمسودة</span>}
        />
        <form className="marketing-form" onSubmit={onCreate}>
          <label>
            اسم الحملة
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="مثال: ورشة أكتوبر"
            />
          </label>
          <label>
            القناة
            <select
              value={channel}
              onChange={event => setChannel(event.target.value)}
            >
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Google</option>
              <option>Email</option>
              <option>Organic</option>
            </select>
          </label>
          <label>
            الهدف
            <select>
              <option>جمع Leads</option>
              <option>زيادة الوعي</option>
              <option>تحويلات تسجيل</option>
            </select>
          </label>
          <button className="marketing-primary" type="submit">
            <Plus size={14} /> حفظ كمسودة
          </button>
          <p>
            <ShieldCheck size={13} /> أي branding approval يمر بحالة مراجعة قبل
            النشر.
          </p>
        </form>
      </section>
    </div>
  );
}
export function Content({
  title,
  setTitle,
  onCreate,
  items,
}: {
  title: string;
  setTitle: (v: string) => void;
  onCreate: (event: FormEvent) => void;
  items: ContentItem[];
}) {
  return (
    <div className="marketing-two-col">
      <section className="marketing-panel">
        <PanelTitle
          icon={<Image size={16} />}
          title="تقويم المحتوى"
          action={
            <span className="marketing-context">{items.length} أصول</span>
          }
        />
        <div className="marketing-content-list">
          {items.map(item => (
            <article className="marketing-content-row" key={item.id}>
              <span className="marketing-content-icon">
                <FileText size={15} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.id} · {item.type} · {item.platform} · {item.campaign}
                </small>
              </div>
              <span>
                <small>الموعد</small>
                <b>{item.due}</b>
              </span>
              <span className={`marketing-status ${item.status}`}>
                {CONTENT_LABEL[item.status]}
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className="marketing-panel">
        <PanelTitle icon={<Sparkles size={16} />} title="إضافة أصل محتوى" />
        <form className="marketing-form" onSubmit={onCreate}>
          <label>
            عنوان الأصل
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="مثال: منشور تجربة طالب"
            />
          </label>
          <label>
            النوع
            <select>
              <option>تصميم</option>
              <option>فيديو</option>
              <option>نص</option>
              <option>بريد</option>
            </select>
          </label>
          <label>
            المنصة
            <select>
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Website</option>
              <option>Email</option>
            </select>
          </label>
          <button className="marketing-primary" type="submit">
            <Plus size={14} /> إضافة للمراجعة
          </button>
          <p>
            <AlertCircle size={13} /> الأصل يظهر مسودة حتى يمر بمراجعة الهوية.
          </p>
        </form>
      </section>
    </div>
  );
}
export function Leads({
  leads,
  query,
  setQuery,
  onStatus,
  onHandoff,
}: {
  leads: Lead[];
  query: string;
  setQuery: (v: string) => void;
  onStatus: (id: string, status: LeadStatus) => void;
  onHandoff: (leadName: string) => void;
}) {
  return (
    <section className="marketing-panel">
      <PanelTitle
        icon={<Users size={16} />}
        title="Marketing Leads"
        action={
          <label className="marketing-search">
            <Search size={13} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="اسم أو مصدر أو حملة..."
            />
          </label>
        }
      />
      <div className="marketing-leads-note">
        <ShieldCheck size={14} /> تعرض هذه الشاشة metadata التسويقية فقط؛
        التفاصيل التشغيلية تنتقل إلى R05 بعد التحويل.
      </div>
      <div className="marketing-lead-list">
        {leads.map(item => (
          <article className="marketing-lead-row" key={item.id}>
            <span className="marketing-lead-avatar">
              {item.name.slice(0, 1)}
            </span>
            <div>
              <strong>{item.name}</strong>
              <small>
                {item.id} · {item.branch} · {item.source}
              </small>
            </div>
            <div>
              <strong>{item.campaign}</strong>
              <small>آخر تواصل: {item.lastTouch}</small>
            </div>
            <span className={`marketing-status ${item.status}`}>
              {LEAD_LABEL[item.status]}
            </span>
            <label className="marketing-lead-next">
              الخطوة التالية
              <select
                value={item.status}
                onChange={event =>
                  onStatus(item.id, event.target.value as LeadStatus)
                }
              >
                {Object.entries(LEAD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <MarketingLeadHandoff
              leadName={item.name}
              status={item.status}
              onHandoff={() => onHandoff(item.name)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
export function NavButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button className={`nav-link ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
}
export function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
  tone: string;
}) {
  return (
    <article className="marketing-kpi">
      <span className={`marketing-kpi-icon ${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}
export function Funnel({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: ReactNode;
  width: string;
  tone: string;
}) {
  return (
    <span className="marketing-funnel-item">
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
      <i>
        <em className={tone} style={{ width }} />
      </i>
    </span>
  );
}
export function PanelTitle({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="marketing-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
