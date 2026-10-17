import { Award, BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, CircleHelp, GraduationCap, LogOut, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import "./R03HeadInstructorsSidebar.css";

type Props = { open: boolean; onClose: () => void; activePath?: string };

const R03_ITEMS = [
  { path: "/head-instructors", label: "غرفة الإشراف وفريق المدربين", icon: Users },
  { path: "/head-instructors#evaluations", label: "مراجعة واعتماد التقييمات", icon: CheckCircle2 },
  { path: "/academic-programs", label: "البرامج والمناهج الأكاديمية", icon: BookOpen },
  { path: "/schedule", label: "جدول الحصص والتغطيات", icon: CalendarDays },
  { path: "/head-instructors#rubrics", label: "بنك معايير التقييم", icon: Award },
];

export default function R03HeadInstructorsSidebar({ open, onClose, activePath }: Props) {
  const [location, navigate] = useLocation();
  const { logout } = useAuth();

  const isItemActive = (path: string) => {
    if (activePath && !activePath.includes("#") && path === activePath) return true;
    if (path.includes("#")) {
      const [route, hash] = path.split("#");
      return location === route && window.location.hash === `#${hash}`;
    }
    return location === path && (!window.location.hash || location !== "/head-instructors");
  };

  const go = (target: string) => {
    onClose();
    if (target.includes("#")) {
      const [path, hash] = target.split("#");
      if (location === path) {
        window.location.hash = hash;
      } else {
        navigate(target);
      }
    } else {
      if (location === target && window.location.hash) {
        window.location.hash = "";
      }
      navigate(target);
    }
  };

  return <>
    {open && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={onClose} />}
    <aside className={`sidebar r03-head-sidebar ${open ? "sidebar-open" : ""}`} aria-label="تنقل رئيس المدربين">
      <div className="sidebar-top">
        <button className="brand-lockup r03-head-brand" type="button" onClick={() => go("/head-instructors")}>
          <span className="brand-symbol"><GraduationCap size={29} /></span>
          <span className="brand-word">مدى</span>
        </button>
        <button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={onClose}>
          <X size={19} />
        </button>
      </div>

      <div className="academy-switcher">
        <span className="academy-avatar"><GraduationCap size={20} /></span>
        <span className="academy-meta">
          <strong>أكاديمية مدى</strong>
          <small>رئيس المدربين · R03</small>
        </span>
        <ChevronDown size={15} className="switcher-chevron" />
      </div>

      <div className="nav-caption">الإشراف الأكاديمي والمدربون</div>
      <nav className="primary-nav" aria-label="الإشراف الأكاديمي">
        {R03_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isItemActive(item.path);
          return (
            <button
              type="button"
              key={item.path}
              className={`nav-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => go(item.path)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-help">
        <span className="help-icon"><CircleHelp size={18} /></span>
        <div>
          <strong>محتاج مساعدة؟</strong>
          <span>دليل الإشراف واعتماد التقييمات</span>
        </div>
        <ChevronLeft size={16} />
      </div>

      <div className="sidebar-bottom">
        <button className="nav-link" type="button" onClick={() => go("/schedule")}>
          <CalendarDays size={19} />
          <span>جدول الحصص والتغطية</span>
        </button>
        <button className="nav-link" type="button" onClick={() => { void logout().then(() => navigate("/login")); }}>
          <LogOut size={19} />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      <div className="sidebar-version">
        مدى لإدارة الأكاديميات <span>R03</span>
      </div>
    </aside>
  </>;
}

(R03HeadInstructorsSidebar as unknown as { isSidebar: boolean }).isSidebar = true;
R03HeadInstructorsSidebar.displayName = "R03HeadInstructorsSidebar";
