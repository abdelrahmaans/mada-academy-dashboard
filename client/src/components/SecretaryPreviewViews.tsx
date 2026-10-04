import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpLeft,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  FileCheck2,
  Filter,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Ticket,
  UserRoundPlus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import EnrollmentHandoff from "@/components/EnrollmentHandoff";
import FamilyProfileCard from "@/components/FamilyProfileCard";

export type DeskView = "overview" | "followups" | "registration" | "operations";
export type LeadStatus = "new" | "contacted" | "trial" | "interested" | "cold";
export type Lead = {
  id: string;
  child: string;
  parent: string;
  phone: string;
  course: string;
  source: string;
  status: LeadStatus;
  created: string;
  due: string;
  note: string;
};
export type Offering = {
  id: string;
  course: string;
  instructor: string;
  schedule: string;
  seats: number;
  capacity: number;
  status: "ongoing" | "upcoming";
};

export const LEAD_LABELS: Record<LeadStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  trial: "حصة تجريبية",
  interested: "مهتم",
  cold: "متابعة لاحقًا",
};

export const LEADS: Lead[] = [
  {
    id: "LD-1068",
    child: "سليم أحمد فوزي",
    parent: "أحمد فوزي",
    phone: "01012345068",
    course: "برمجة للمبتدئين",
    source: "صفحة الأكاديمية",
    status: "new",
    created: "اليوم · 09:20 ص",
    due: "اليوم · 04:00 م",
    note: "طلب معرفة مواعيد المجموعة المناسبة.",
  },
  {
    id: "LD-1067",
    child: "ليان محمد عادل",
    parent: "محمد عادل",
    phone: "01123451067",
    course: "روبوتكس مستوى 2",
    source: "ترشيح",
    status: "contacted",
    created: "اليوم · 08:10 ص",
    due: "اليوم · 05:30 م",
    note: "تم إرسال تفاصيل المجموعة؛ بانتظار تأكيد الزيارة.",
  },
  {
    id: "LD-1064",
    child: "آدم شريف حسن",
    parent: "شريف حسن",
    phone: "01109876543",
    course: "دوائر إلكترونية",
    source: "واتساب",
    status: "trial",
    created: "أمس · 03:45 م",
    due: "غدًا · 10:00 ص",
    note: "حصة تجريبية محجوزة مع فرع مدينة نصر.",
  },
  {
    id: "LD-1059",
    child: "ملك حسام الدين",
    parent: "حسام الدين",
    phone: "01087654062",
    course: "مهارات التفكير الإبداعي",
    source: "فعالية",
    status: "cold",
    created: "25 سبتمبر",
    due: "01 أكتوبر",
    note: "ولي الأمر طلب المتابعة بداية الشهر القادم.",
  },
];
export const OFFERINGS: Offering[] = [
  {
    id: "GRP-042",
    course: "روبوتكس مستوى 2",
    instructor: "مريم حسن",
    schedule: "السبت والثلاثاء · 10:00 ص",
    seats: 12,
    capacity: 16,
    status: "ongoing",
  },
  {
    id: "GRP-041",
    course: "برمجة للمبتدئين",
    instructor: "عمر سامح",
    schedule: "الأحد والأربعاء · 12:00 م",
    seats: 8,
    capacity: 12,
    status: "upcoming",
  },
  {
    id: "GRP-039",
    course: "دوائر إلكترونية",
    instructor: "سارة ياسر",
    schedule: "الجمعة · 04:00 م",
    seats: 14,
    capacity: 16,
    status: "upcoming",
  },
];
export const DISCOUNTS = [
  { code: "SIBLINGS15", label: "خصم إخوة معتمد", percent: 15 },
  { code: "CAMPAIGN10", label: "خصم حملة معتمد", percent: 10 },
];


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
export const VIEW_TITLES: Record<DeskView, string> = {
  overview: "ملخص يوم السكرتارية",
  followups: "Inbox المتابعة",
  registration: "التسجيلات والخصومات",
  operations: "مجموعات الفرع",
};
export const VIEW_COPY: Record<DeskView, string> = {
  overview:
    "رتّبي الاستفسارات، المتابعات المتأخرة، والتسجيلات من مساحة عمل واحدة.",
  followups: "كل استفسار له حالة وموعد متابعة وخطوة تالية واضحة.",
  registration: "حوّلي اهتمام الأسرة إلى تسجيل مفهوم السعر والمجموعة والخصم.",
  operations: "راجعي الطاقة المتاحة ومواعيد المجموعات قبل بدء التسجيل.",
};
export function OverviewView({
  leads,
  activeLeads,
  overdue,
  onFollowups,
  onRegistration,
  onOperations,
}: {
  leads: Lead[];
  activeLeads: number;
  overdue: number;
  onFollowups: () => void;
  onRegistration: () => void;
  onOperations: () => void;
}) {
  return (
    <>
      <section className="secretary-desk-kpis">
        <Kpi
          icon={<MessageCircle size={16} />}
          label="استفسارات نشطة"
          value={activeLeads}
          hint="تحتاج خطوة تالية"
          tone="teal"
        />
        <Kpi
          icon={<AlertCircle size={16} />}
          label="متابعات اليوم"
          value={overdue}
          hint="أولوية قبل نهاية اليوم"
          tone="amber"
        />
        <Kpi
          icon={<UserRoundPlus size={16} />}
          label="تسجيلات هذا الأسبوع"
          value="6"
          hint="منها 2 من leads"
          tone="blue"
        />
        <Kpi
          icon={<Wallet size={16} />}
          label="خصومات نشطة"
          value={2}
          hint="استخدام فقط · لا اعتماد"
          tone="violet"
        />
      </section>
      <div className="secretary-desk-grid">
        <section className="secretary-desk-panel">
          <PanelTitle
            icon={<Clock3 size={16} />}
            title="الأولوية الآن"
            action={
              <button className="desk-secondary-action" onClick={onFollowups}>
                فتح الـInbox <ArrowUpLeft size={14} />
              </button>
            }
          />
          <div className="desk-task-list">
            {leads
              .filter(item => item.status === "new" || item.status === "trial")
              .map(item => (
                <article className="desk-task" key={item.id}>
                  <span className={`desk-task-icon ${item.status}`}>
                    <MessageCircle size={15} />
                  </span>
                  <div>
                    <strong>{item.child}</strong>
                    <small>
                      {item.course} · {item.due}
                    </small>
                    <p>{item.note}</p>
                  </div>
                  <span className={`desk-lead-pill ${item.status}`}>
                    {LEAD_LABELS[item.status]}
                  </span>
                </article>
              ))}
          </div>
        </section>
        <section className="secretary-desk-panel">
          <PanelTitle icon={<FileCheck2 size={16} />} title="خطوات سريعة" />
          <div className="desk-quick-actions">
            <button onClick={onFollowups}>
              <MessageCircle size={17} />
              <strong>متابعة أسرة</strong>
              <small>تسجيل اتصال أو موعد</small>
            </button>
            <button onClick={onRegistration}>
              <UserRoundPlus size={17} />
              <strong>تسجيل طالب</strong>
              <small>اختيار مجموعة وخصم نشط</small>
            </button>
            <button onClick={onOperations}>
              <CalendarDays size={17} />
              <strong>مراجعة المجموعات</strong>
              <small>الطاقة والمواعيد المتاحة</small>
            </button>
          </div>
        </section>
      </div>
      <section className="secretary-desk-panel">
        <PanelTitle
          icon={<ShieldCheck size={16} />}
          title="قاعدة الخصم"
          action={
            <span className="secretary-desk-context">
              <Ticket size={13} /> أكواد مفعّلة فقط
            </span>
          }
        />
        <div className="discount-rule">
          <div>
            <strong>SIBLINGS15</strong>
            <small>خصم إخوة معتمد · 15%</small>
          </div>
          <div>
            <strong>CAMPAIGN10</strong>
            <small>خصم حملة معتمد · 10%</small>
          </div>
          <span>
            <AlertCircle size={14} /> الخصم الاستثنائي يرفع كطلب للجهة المخولة
            ولا يُطبق من السكرتارية.
          </span>
        </div>
      </section>
    </>
  );
}
export function FollowupsView({
  leads,
  selectedLead,
  selectedId,
  query,
  setQuery,
  onSelect,
  onStatus,
}: {
  leads: Lead[];
  selectedLead: Lead;
  selectedId: string;
  query: string;
  setQuery: (v: string) => void;
  onSelect: (id: string) => void;
  onStatus: (id: string, status: LeadStatus) => void;
}) {
  return (
    <div className="secretary-desk-followups">
      <section className="secretary-desk-panel">
        <PanelTitle
          icon={<MessageCircle size={16} />}
          title="Inbox المتابعة"
          action={
            <label className="desk-search">
              <Search size={13} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="ابحث بالاسم أو الهاتف..."
              />
            </label>
          }
        />
        <div className="desk-filter-row">
          <button className="active">
            <Filter size={13} /> كل الحالات
          </button>
          <button>اليوم</button>
          <button>متأخرة</button>
        </div>
        <div className="desk-lead-list">
          {leads.map(lead => (
            <button
              className={`desk-lead-row ${lead.id === selectedId ? "selected" : ""}`}
              key={lead.id}
              onClick={() => onSelect(lead.id)}
            >
              <span className={`desk-lead-avatar ${lead.status}`}>
                {lead.child.slice(0, 1)}
              </span>
              <span>
                <strong>{lead.child}</strong>
                <small>
                  {lead.id} · {lead.parent} · {lead.course}
                </small>
              </span>
              <span className={`desk-lead-pill ${lead.status}`}>
                {LEAD_LABELS[lead.status]}
              </span>
              <span className="desk-lead-due">
                <Clock3 size={12} /> {lead.due}
              </span>
            </button>
          ))}
        </div>
      </section>
      <aside className="secretary-desk-panel desk-lead-detail">
        <PanelTitle icon={<UserRoundPlus size={16} />} title="ملف الاستفسار" />
        {selectedLead && (
          <>
            <div className="desk-detail-person">
              <span className={`desk-lead-avatar large ${selectedLead.status}`}>
                {selectedLead.child.slice(0, 1)}
              </span>
              <div>
                <strong>{selectedLead.child}</strong>
                <small>
                  {selectedLead.id} · {selectedLead.source}
                </small>
              </div>
            </div>
            <div className="desk-detail-grid">
              <span>
                ولي الأمر<strong>{selectedLead.parent}</strong>
              </span>
              <span>
                الهاتف<strong dir="ltr">{selectedLead.phone}</strong>
              </span>
              <span>
                البرنامج<strong>{selectedLead.course}</strong>
              </span>
              <span>
                موعد المتابعة<strong>{selectedLead.due}</strong>
              </span>
            </div>
            <p className="desk-detail-note">{selectedLead.note}</p>
            <label className="desk-detail-label">
              تحديث الحالة
              <select
                value={selectedLead.status}
                onChange={event =>
                  onStatus(selectedLead.id, event.target.value as LeadStatus)
                }
              >
                {Object.entries(LEAD_LABELS).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="desk-detail-actions">
              <button
                className="desk-primary-action"
                onClick={() =>
                  toast.success("تم تسجيل محاولة التواصل", {
                    description: "أضيفت للـactivity log المحلي.",
                  })
                }
              >
                <Check size={14} /> تسجيل تواصل
              </button>
              <button
                className="desk-secondary-action"
                onClick={() => toast.success("تم نسخ رسالة المتابعة")}
              >
                نسخ رسالة
              </button>
            </div>
            <button
              className="desk-convert-action"
              onClick={() =>
                toast("سيتم فتح نموذج التسجيل", {
                  description: "يمكن متابعة التحويل من شاشة التسجيلات.",
                })
              }
            >
              <UserRoundPlus size={14} /> تحويل إلى تسجيل
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
export function RegistrationView({
  query,
  setQuery,
  name,
  setName,
  phone,
  setPhone,
  group,
  setGroup,
  discount,
  setDiscount,
  onSubmit,
  offerings,
  onHandoff,
}: {
  query: string;
  setQuery: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  group: string;
  setGroup: (v: string) => void;
  discount: string;
  setDiscount: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  offerings: Offering[];
  onHandoff: () => void;
}) {
  const duplicate =
    query.trim().length > 2 &&
    ["آدم شريف حسن", "ملك حسام الدين"].some(item =>
      item.includes(query.trim())
    );
  const selectedGroup = offerings.find(item => item.id === group);
  const ready = Boolean(
    name.trim() && /^01\d{9}$/.test(phone.trim()) && selectedGroup
  );
  return (
    <div className="secretary-desk-registration">
      <section className="secretary-desk-panel">
        <PanelTitle
          icon={<UserRoundPlus size={16} />}
          title="تسجيل طالب جديد"
          action={
            <span className="secretary-desk-context">
              <ShieldCheck size={13} /> لا توجد فاتورة فعلية
            </span>
          }
        />
        <form className="desk-registration-form" onSubmit={onSubmit}>
          <label>
            اسم الطالب
            <input
              required
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="الاسم رباعي"
            />
          </label>
          <label>
            هاتف ولي الأمر
            <input
              required
              value={phone}
              onChange={event => setPhone(event.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          </label>
          <label>
            المجموعة
            <select
              value={group}
              onChange={event => setGroup(event.target.value)}
            >
              {offerings.map(item => (
                <option key={item.id} value={item.id}>
                  {item.course} · {item.id} · {item.capacity - item.seats} مقاعد
                  متاحة
                </option>
              ))}
            </select>
          </label>
          <label>
            كود الخصم النشط
            <input
              value={discount}
              onChange={event => setDiscount(event.target.value)}
              placeholder="SIBLINGS15 أو CAMPAIGN10"
              dir="ltr"
            />
          </label>
          <div className="desk-price-summary">
            <span>
              سعر المجموعة الأساسي<strong>3,600 جنيه</strong>
            </span>
            <span>
              السعر بعد الخصم
              <strong>
                {discount.toUpperCase() === "SIBLINGS15"
                  ? "3,060"
                  : discount.toUpperCase() === "CAMPAIGN10"
                    ? "3,240"
                    : "3,600"}{" "}
                جنيه
              </strong>
            </span>
          </div>
          <button className="desk-primary-action" type="submit">
            <Check size={14} /> إنشاء تسجيل تجريبي
          </button>
        </form>
        <EnrollmentHandoff
          studentName={name}
          groupName={selectedGroup?.course ?? ""}
          discountCode={discount}
          ready={ready}
          onHandoff={onHandoff}
        />
      </section>
      <FamilyProfileCard
        query={query}
        onQueryChange={setQuery}
        duplicate={duplicate}
        onReviewDuplicate={() => toast("فتح ملف الأسرة التجريبي")}
      />
    </div>
  );
}
export function OperationsView({
  offerings,
  onRegister,
}: {
  offerings: Offering[];
  onRegister: () => void;
}) {
  return (
    <section className="secretary-desk-panel">
      <PanelTitle
        icon={<CalendarDays size={16} />}
        title="مجموعات الفرع والطاقة"
        action={
          <button className="desk-primary-action" onClick={onRegister}>
            <Plus size={14} /> بدء تسجيل
          </button>
        }
      />
      <div className="desk-offerings">
        {offerings.map(item => (
          <article className="desk-offering" key={item.id}>
            <div className="desk-offering-icon">
              <CalendarCheck size={17} />
            </div>
            <div>
              <strong>{item.course}</strong>
              <small>
                {item.id} · {item.instructor} · {item.schedule}
              </small>
            </div>
            <span className={`desk-offering-status ${item.status}`}>
              {item.status === "ongoing" ? "جارية" : "قادمة"}
            </span>
            <div className="desk-capacity">
              <span>
                <b>{item.capacity - item.seats}</b> مقاعد متاحة
              </span>
              <i>
                <em
                  style={{ width: `${(item.seats / item.capacity) * 100}%` }}
                />
              </i>
              <small>
                {item.seats}/{item.capacity} مسجل
              </small>
            </div>
            <button className="desk-secondary-action" onClick={onRegister}>
              تسجيل <ChevronLeft size={13} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
function Kpi({
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
    <article className="secretary-desk-kpi">
      <span className={`secretary-desk-kpi-icon ${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}
function PanelTitle({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="secretary-desk-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
