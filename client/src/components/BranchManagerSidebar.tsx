import { BarChart3, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronLeft, CircleHelp, GraduationCap, LayoutDashboard, Settings, Users, X } from "lucide-react";
import { useLocation } from "wouter";

type Props = { open: boolean; onClose: () => void };

const items = [
  { path: "/", label: "ملخص التشغيل", icon: LayoutDashboard },
  { path: "/students", label: "الطلاب", icon: Users },
  { path: "/schedule", label: "الجدول", icon: CalendarDays },
  { path: "/classes", label: "الحصص والكورسات", icon: BookOpen },
  { path: "/branch-operations", label: "إدارة التشغيل", icon: Settings },
  { path: "/approvals", label: "الموافقات", icon: CheckCircle2 },
  { path: "/reports", label: "التقارير والتحليلات", icon: BarChart3 },
] as const;

export default function BranchManagerSidebar({ open, onClose }: Props) {
  const [location, navigate] = useLocation();
  const go = (path: string) => { onClose(); navigate(path); };

  return (
    <>
      {open && <button className="mobile-scrim" aria-label="إغلاق قائمة مدير الفرع" onClick={onClose} />}
      <aside className={`sidebar r02-live-sidebar ${open ? "sidebar-open" : ""}`} aria-label="تنقل مدير الفرع">
        <div className="sidebar-top">
          <button className="r02-live-brand" type="button" onClick={() => go("/")}>
            <strong>مدى</strong><small>تشغيل الأكاديمية</small>
          </button>
          <button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="academy-switcher">
          <span className="academy-avatar"><Building2 size={20} /></span>
          <span className="academy-meta"><strong>أكاديمية مدى</strong><small>مدير الفرع · R02</small></span>
        </div>
        <div className="nav-caption">مساحة التشغيل</div>
        <nav className="primary-nav">
          {items.slice(0, 5).map(item => {
            const Icon = item.icon;
            const active = location === item.path;
            return <button type="button" key={item.path} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => go(item.path)}><Icon size={19} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="nav-caption nav-caption-spaced">المتابعة والإدارة</div>
        <nav className="primary-nav">
          {items.slice(5).map(item => {
            const Icon = item.icon;
            const active = location === item.path;
            return <button type="button" key={item.path} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => go(item.path)}><Icon size={19} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>محتاج مساعدة؟</strong><span>دليل تشغيل الفرع</span></div><ChevronLeft size={16} /></div>
        <div className="sidebar-version"><GraduationCap size={13} /> مدى · مساحة مدير الفرع</div>
      </aside>
    </>
  );
}
