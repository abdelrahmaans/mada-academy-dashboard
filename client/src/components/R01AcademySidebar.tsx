import { BarChart3, Building2, GraduationCap, LayoutDashboard, Menu, ShieldCheck, Users, X } from "lucide-react";
import { useLocation } from "wouter";
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
  return <button type="button" className="r1-management-menu" aria-label="فتح القائمة" onClick={onOpen}><Menu size={19} /></button>;
}

export default function R01AcademySidebar({ activePath, mobileOpen, onClose }: R01AcademySidebarProps) {
  const [, navigate] = useLocation();
  const go = (path: string) => { onClose(); navigate(path); };
  return <>
    {mobileOpen && <button type="button" className="r1-management-scrim" aria-label="إغلاق القائمة" onClick={onClose} />}
    <aside className={`r1-management-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="تنقل مسؤول الأكاديمية">
      <div className="r1-management-sidebar-head">
        <button type="button" className="r1-management-brand" onClick={() => go("/executive-dashboard")}>
          <span>مدى</span><div><strong>مسؤول الأكاديمية</strong><small>R01 · Tenant workspace</small></div>
        </button>
        <button type="button" className="r1-management-close" aria-label="إغلاق القائمة" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="r1-management-tenant"><span><Building2 size={18} /></span><div><strong>الأكاديمية الحالية</strong><small>كل فروع الأكاديمية</small></div></div>
      <nav className="r1-management-nav" aria-label="مساحات الأكاديمية">
        <span className="r1-management-caption">إدارة الأكاديمية</span>
        {links.map(({ path, label, icon: Icon }) => <button type="button" key={path} className={activePath === path ? "active" : ""} onClick={() => go(path)}><Icon size={17} /><span>{label}</span></button>)}
      </nav>
      <div className="r1-management-spacer" />
      <div className="r1-management-note"><ShieldCheck size={16} /><span>النطاق الحالي خاص بأكاديميتك فقط، والصلاحيات الفعلية من الـbackend.</span></div>
      <small className="r1-management-version">Mada Academy · R01</small>
    </aside>
  </>;
}
