import { BarChart3, Building2, ChevronLeft, CircleHelp, GraduationCap, LayoutDashboard, LogOut, Settings2, ShieldCheck, TrendingUp, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import "./R01AcademySidebar.css";

type R01AcademySidebarProps = {
  activePath: string;
  mobileOpen: boolean;
  onClose: () => void;
  onOwnerView?: (view: "branches" | "tickets" | "reports") => void;
};

const links = [
  { path: "/academy-owner", label: "نظرة عامة", icon: LayoutDashboard, view: undefined },
  { path: "/executive-dashboard", label: "لوحة الإدارة التنفيذية", icon: TrendingUp, view: undefined },
  { path: "/academy-owner?view=branches", label: "الفروع والأداء", icon: Building2, view: "branches" },
  { path: "/academy-owner?view=tickets", label: "مركز التذاكر", icon: CircleHelp, view: "tickets" },
  { path: "/academy-owner?view=reports", label: "التقارير المجمعة", icon: BarChart3, view: "reports" },
  { path: "/academy/branches", label: "إدارة الفروع", icon: Building2, view: undefined },
  { path: "/academy/classrooms", label: "القاعات الدراسية", icon: GraduationCap, view: undefined },
  { path: "/academy/roles", label: "المستخدمون والصلاحيات", icon: Users, view: undefined },
  { path: "/reports", label: "التقرير التشغيلي المباشر", icon: BarChart3, view: undefined },
] as const;

export function R01MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return <button type="button" className="academy-owner-menu" aria-label="فتح القائمة" onClick={onOpen}><span aria-hidden="true"><LayoutDashboard size={19} /></span></button>;
}

export default function R01AcademySidebar({ activePath, mobileOpen, onClose, onOwnerView }: R01AcademySidebarProps) {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const go = (path: string) => { onClose(); navigate(path); };
  return <>
    {mobileOpen && <button className="academy-owner-scrim" aria-label="إغلاق القائمة" onClick={onClose} />}
    <aside className={`academy-owner-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="تنقل مسؤول الأكاديمية">
      <div className="academy-owner-brand"><button type="button" className="r01-owner-brand-button" onClick={() => go("/academy-owner")}><span className="academy-owner-mark">مدى</span><span><strong>مدى</strong><small>نظرة الأكاديمية</small></span></button><button className="academy-owner-close" aria-label="إغلاق القائمة" onClick={onClose}><X size={18} /></button></div>
      <div className="academy-owner-user"><span className="academy-owner-user-avatar">أم</span><span><strong>أحمد محمود</strong><small>رئيس الأكاديمية · R01</small></span></div>
      <span className="academy-owner-nav-caption">نطاق الأكاديمية</span>
      <nav className="academy-owner-nav" aria-label="تنقل رئيس الأكاديمية">
        {links.map(({ path, label, icon: Icon, view }) => <button type="button" key={path} className={activePath === path ? "active" : ""} onClick={() => { if (view && onOwnerView) { onClose(); onOwnerView(view); } else go(path); }}><Icon size={17} /><span>{label}</span></button>)}
      </nav>
      <div className="academy-owner-sidebar-spacer" />
      <div className="academy-owner-scope-card"><CircleHelp size={15} /><span><small>نطاق العرض</small><strong>كل فروع الأكاديمية</strong></span></div>
      <button className="academy-owner-back" onClick={() => go("/academy-owner")}><ChevronLeft size={15} /> العودة إلى نظرة الأكاديمية</button>
      <div className="academy-owner-sidebar-footer"><ShieldCheck size={13} /> بيانات وصلاحيات معزولة حسب الأكاديمية</div>
      <button className="r01-owner-logout" onClick={() => { void logout().then(() => navigate("/login")); }}><LogOut size={14} /> تسجيل الخروج</button>
    </aside>
  </>;
}
