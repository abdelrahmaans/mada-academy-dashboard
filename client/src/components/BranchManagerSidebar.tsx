import { BarChart3, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, CircleHelp, GraduationCap, LayoutDashboard, LogOut, Settings, ShieldCheck, Users, Wallet, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

type RoleMode = "R02" | "R06";
type Props = { open: boolean; onClose: () => void; roleCode?: RoleMode };
type Item = { path: string; label: string; icon: typeof LayoutDashboard };

const R02_ITEMS: Item[] = [
  { path: "/", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/students", label: "الطلاب", icon: Users },
  { path: "/schedule", label: "الجدول", icon: CalendarDays },
  { path: "/classes", label: "الحصص والكورسات", icon: BookOpen },
  { path: "/branch-operations", label: "إدارة التشغيل", icon: Settings },
  { path: "/team", label: "الفريق والأدوار", icon: Users },
  { path: "/approvals", label: "الموافقات", icon: CheckCircle2 },
  { path: "/reports", label: "التقارير والتحليلات", icon: BarChart3 },
];
const R06_ITEMS: Item[] = [
  { path: "/finance-desk", label: "المكتب المالي", icon: Wallet },
  { path: "/approvals", label: "الموافقات المالية", icon: CheckCircle2 },
  { path: "/reports", label: "التقارير", icon: BarChart3 },
];

export default function BranchManagerSidebar({ open, onClose, roleCode = "R02" }: Props) {
  const [location, navigate] = useLocation();
  const { logout } = useAuth();
  const isAccountant = roleCode === "R06";
  const items = isAccountant ? R06_ITEMS : R02_ITEMS;
  const go = (path: string) => { onClose(); navigate(path); };
  return <>
    {open && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={onClose} />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label={isAccountant ? "تنقل المحاسب" : "تنقل مدير الفرع"}>
      <div className="sidebar-top"><button className="brand-lockup" type="button" onClick={() => go(isAccountant ? "/finance-desk" : "/")}><span className="brand-symbol"><GraduationCap size={28} /></span><span className="brand-word">مدى</span></button><button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={onClose}><X size={19} /></button></div>
      <div className="academy-switcher"><span className="academy-avatar">{isAccountant ? <Wallet size={20} /> : <Building2 size={20} />}</span><span className="academy-meta"><strong>أكاديمية مدى</strong><small>{isAccountant ? "المحاسب · R06" : "مدير الفرع · R02"}</small></span><ChevronDown size={15} className="switcher-chevron" /></div>
      <div className="nav-caption">{isAccountant ? "المساحة المالية" : "القائمة الرئيسية"}</div>
      <nav className="primary-nav" aria-label={isAccountant ? "المساحة المالية" : "القائمة الرئيسية"}>{items.map(item => { const Icon = item.icon; const active = location === item.path; return <button type="button" key={item.path} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => go(item.path)}><Icon size={19} /><span>{item.label}</span>{item.path === "/students" && <span className="nav-count">248</span>}</button>; })}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>محتاج مساعدة؟</strong><span>{isAccountant ? "سياسة التحصيل والموافقات" : "دليل تشغيل الفرع"}</span></div><ChevronLeft size={16} /></div>
      <div className="sidebar-bottom"><button className="nav-link" onClick={() => go(isAccountant ? "/approvals" : "/team")}><ShieldCheck size={19} /><span>{isAccountant ? "الموافقات" : "إدارة الفريق"}</span></button><button className="nav-link" onClick={() => { void logout().then(() => navigate("/login")); }}><LogOut size={19} /><span>تسجيل الخروج</span></button></div>
      <div className="sidebar-version">مدى لإدارة الأكاديميات <span>{isAccountant ? "R06" : "R02"}</span></div>
    </aside>
  </>;
}
