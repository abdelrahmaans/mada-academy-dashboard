import { BarChart3, Building2, ChevronLeft, CircleHelp, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import "./R01AcademySidebar.css";

type R01AcademySidebarProps = {
  activePath: string;
  mobileOpen: boolean;
  onClose: () => void;
};

const links = [
  { path: "/executive-dashboard", label: "اللوحة التنفيذية", icon: LayoutDashboard },
  { path: "/academy-owner", label: "إدارة الأكاديمية", icon: Building2 },
  { path: "/academy/branches", label: "إدارة الفروع", icon: Building2 },
  { path: "/academy/classrooms", label: "القاعات الدراسية", icon: GraduationCap },
  { path: "/academy/roles", label: "المستخدمون والصلاحيات", icon: Users },
  { path: "/reports", label: "التقارير", icon: BarChart3 },
] as const;

export function R01MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return <button type="button" className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={onOpen}><Menu size={21} /></button>;
}

export default function R01AcademySidebar({ activePath, mobileOpen, onClose }: R01AcademySidebarProps) {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const go = (path: string) => { onClose(); navigate(path); };
  return <>
    {mobileOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={onClose} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <button className="r01-academy-brand" onClick={() => go("/executive-dashboard")}><span className="brand-symbol"><GraduationCap size={30} /></span><span><strong>مدى</strong><small>مسؤول الأكاديمية · R01</small></span></button>
        <button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={onClose}><X size={19} /></button>
      </div>
      <div className="academy-switcher"><span className="academy-avatar"><Building2 size={20} /></span><span className="academy-meta"><strong>أكاديمية مدى</strong><small>كل فروع الأكاديمية · Tenant</small></span></div>
      <div className="nav-caption">إدارة الأكاديمية</div>
      <nav className="primary-nav">
        {links.map(({ path, label, icon: Icon }) => <button type="button" key={path} className={`nav-link ${activePath === path ? "active" : ""}`} onClick={() => go(path)}><Icon size={19} /><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>تحتاج دعمًا؟</strong><span>مركز مساعدة الأكاديمية</span></div><ChevronLeft size={16} /></div>
      <div className="sidebar-bottom"><button className="nav-link" onClick={() => go("/academy/roles")}><ShieldCheck size={19} /><span>إعدادات الصلاحيات</span></button><button className="nav-link" onClick={() => { void logout().then(() => navigate("/login")); }}><LogOut size={19} /><span>تسجيل الخروج</span></button></div>
    </aside>
  </>;
}
