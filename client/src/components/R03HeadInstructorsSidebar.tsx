import { BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, CircleHelp, GraduationCap, LayoutDashboard, LogOut, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import "./R03HeadInstructorsSidebar.css";

type Props = { open: boolean; onClose: () => void; activePath: "/head-instructors" | "/academic-programs" | "/schedule" };
const ITEMS = [
  { path: "/head-instructors" as const, label: "ملخص الفريق", icon: LayoutDashboard },
  { path: "/academic-programs" as const, label: "البرامج الأكاديمية", icon: BookOpen },
  { path: "/schedule" as const, label: "جدول الفريق", icon: CalendarDays },
];

export default function R03HeadInstructorsSidebar({ open, onClose, activePath }: Props) {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const go = (path: string) => { onClose(); navigate(path); };
  return <>
    {open && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={onClose} />}
    <aside className={`sidebar r03-head-sidebar ${open ? "sidebar-open" : ""}`} aria-label="تنقل رئيس المدربين">
      <div className="sidebar-top"><button className="brand-lockup r03-head-brand" type="button" onClick={() => go("/head-instructors")}><span className="brand-symbol"><GraduationCap size={29} /></span><span className="brand-word">مدى</span></button><button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={onClose}><X size={19} /></button></div>
      <div className="academy-switcher"><span className="academy-avatar"><GraduationCap size={20} /></span><span className="academy-meta"><strong>أكاديمية مدى</strong><small>رئيس المدربين · R03</small></span><ChevronDown size={15} className="switcher-chevron" /></div>
      <div className="nav-caption">الإشراف الأكاديمي</div>
      <nav className="primary-nav" aria-label="الإشراف الأكاديمي">{ITEMS.map(item => { const Icon = item.icon; const active = activePath === item.path; return <button type="button" key={item.path} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => go(item.path)}><Icon size={19} /><span>{item.label}</span></button>; })}</nav>
      <div className="nav-caption nav-caption-spaced">مسارات الإشراف</div>
      <nav className="primary-nav" aria-label="مسارات الإشراف"><button className="nav-link" type="button" onClick={() => go("/head-instructors#evaluations")}><CheckCircle2 size={19} /><span>مراجعة التقييمات</span></button><button className="nav-link" type="button" onClick={() => go("/head-instructors#team")}><Users size={19} /><span>فريق المدربين</span></button></nav>
      <div className="sidebar-spacer" /><div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>محتاج مساعدة؟</strong><span>دليل الإشراف الأكاديمي</span></div><ChevronLeft size={16} /></div>
      <div className="sidebar-bottom"><button className="nav-link" type="button" onClick={() => go("/head-instructors#approvals")}><CheckCircle2 size={19} /><span>اعتماد الحضور</span></button><button className="nav-link" type="button" onClick={() => { void logout().then(() => navigate("/login")); }}><LogOut size={19} /><span>تسجيل الخروج</span></button></div>
      <div className="sidebar-version">مدى لإدارة الأكاديميات <span>R03</span></div>
    </aside>
  </>;
}
