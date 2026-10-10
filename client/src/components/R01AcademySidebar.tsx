import { BarChart3, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, CircleHelp, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, Wallet, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import "./R01AcademySidebar.css";
import "./AcademyManagement.css";
import { getRoleDefinition } from "@/lib/roleNavigation";

type Props = { activePath: string; mobileOpen: boolean; onClose: () => void };

type Item = { path: string; label: string; icon: typeof LayoutDashboard };

const R01_ICON_BY_PATH: Record<string, Item["icon"]> = {
  "/executive-dashboard": LayoutDashboard,
  "/academy-owner": Building2,
  "/academy-owner/branches": Building2,
  "/academy-owner/tickets": CircleHelp,
  "/academy-owner/reports": BarChart3,
  "/academy/branches": Building2,
  "/academy/classrooms": GraduationCap,
  "/academy/roles": Users,
  "/reports": BarChart3,
};
const R01_ITEMS: Item[] = getRoleDefinition("R01").navigation.map(item => ({
  path: item.path,
  label: item.label,
  icon: R01_ICON_BY_PATH[item.path] ?? LayoutDashboard,
}));

export function R01MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return <button type="button" className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={onOpen}><Menu size={21} /></button>;
}

export default function R01AcademySidebar({ activePath, mobileOpen, onClose }: Props) {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const go = (path: string) => { onClose(); navigate(path); };
  return <>
    {mobileOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={onClose} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="تنقل مسؤول الأكاديمية">
      <div className="sidebar-top">
        <button type="button" className="brand-lockup r01-brand-button" onClick={() => go("/executive-dashboard")}><span className="brand-symbol"><GraduationCap size={28} /></span><span className="brand-word">مدى</span></button>
        <button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={onClose}><X size={19} /></button>
      </div>
      <div className="academy-switcher"><span className="academy-avatar"><Building2 size={20} /></span><span className="academy-meta"><strong>أكاديمية مدى</strong><small>مسؤول الأكاديمية · R01</small></span><ChevronDown size={15} className="switcher-chevron" /></div>
      <div className="nav-caption">مساحة مسؤول الأكاديمية</div>
      <nav className="primary-nav" aria-label="مساحة مسؤول الأكاديمية">
        {R01_ITEMS.map(item => { const Icon = item.icon; const active = activePath === item.path; return <button type="button" key={item.path} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => go(item.path)}><Icon size={19} /><span>{item.label}</span></button>; })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>محتاج مساعدة؟</strong><span>دليل مسؤول الأكاديمية</span></div><ChevronLeft size={16} /></div>
      <div className="sidebar-bottom"><button className="nav-link" onClick={() => go("/academy/roles")}><ShieldCheck size={19} /><span>إعدادات الصلاحيات</span></button><button className="nav-link" onClick={() => { void logout().then(() => navigate("/login")); }}><LogOut size={19} /><span>تسجيل الخروج</span></button></div>
      <div className="sidebar-version">مدى لإدارة الأكاديميات <span>R01</span></div>
    </aside>
  </>;
}
