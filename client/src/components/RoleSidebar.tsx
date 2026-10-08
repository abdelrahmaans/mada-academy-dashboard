import {
  type ComponentType,
  useMemo,
} from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  CircleHelp,
  GraduationCap,
  KeyRound,
  Layers3,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
  type LucideProps,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDefinition } from "@/lib/roleNavigation";
import type { RoleCode } from "@/contexts/RoleScopeContext";
import SessionLogoutButton from "./SessionLogoutButton";

const ICON_BY_PATH: Record<string, ComponentType<LucideProps>> = {
  "/": LayoutDashboard,
  "/executive-dashboard": LayoutDashboard,
  "/branch-operations": Building2,
  "/students": Users,
  "/classes": BookOpen,
  "/schedule": CalendarDays,
  "/approvals": ShieldCheck,
  "/reports": BarChart3,
  "/team": UserPlus,
  "/head-instructors": Users,
  "/academic-programs": BookOpen,
  "/instructor-desk": GraduationCap,
  "/secretary-desk": CalendarCheck,
  "/finance": Wallet,
  "/finance-desk": Wallet,
  "/marketing-desk": TrendingUp,
  "/academy-owner": Building2,
  "/academy/branches": MapPin,
  "/academy/classrooms": GraduationCap,
  "/academy/roles": KeyRound,
  "/platform-console": ShieldCheck,
  "/family-portal": Users,
  "/student-portal": GraduationCap,
  "/workspace": Layers3,
};

const ROLE_AVATAR_ICONS: Record<RoleCode, ComponentType<LucideProps>> = {
  R00: ShieldCheck,
  R01: Building2,
  R02: GraduationCap,
  R03: Users,
  R04: GraduationCap,
  R05: CalendarCheck,
  R06: Wallet,
  R07: TrendingUp,
  R08: Users,
  R09: GraduationCap,
};

function BrandLockup() {
  return (
    <div className="brand-lockup" aria-label="مدى">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M4 12.5 12.5 8l8.2 4.5v9.4l-8.2 4.6L4 21.9v-9.4Z"
            fill="currentColor"
            opacity=".98"
          />
          <path
            d="m19.3 12.5 8.2-4.5 8.5 4.5v9.4l-8.5 4.6-8.2-4.6v-9.4Z"
            fill="currentColor"
            opacity=".72"
          />
          <path
            d="m11.5 24.1 8.3-4.6 8.2 4.6v8.2l-8.2 4.4-8.3-4.4v-8.2Z"
            fill="currentColor"
            opacity=".48"
          />
        </svg>
      </span>
      <span className="brand-word">مدى</span>
    </div>
  );
}

export type RoleSidebarProps = {
  roleCode: RoleCode;
  roleLabel?: string;
  tenantName?: string;
  branchName?: string;
  scopeLabel?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export default function RoleSidebar({
  roleCode,
  roleLabel,
  tenantName,
  branchName,
  scopeLabel,
  mobileOpen = false,
  onCloseMobile,
}: RoleSidebarProps) {
  const [location, navigate] = useLocation();
  const { me } = useAuth();
  const roleDef = useMemo(() => getRoleDefinition(roleCode), [roleCode]);
  const AvatarIcon = ROLE_AVATAR_ICONS[roleCode] ?? GraduationCap;

  const resolvedTenantName = me?.academy?.name ?? tenantName ?? "أكاديمية مدى";
  const resolvedRoleLabel = me?.roleLabel ?? roleLabel ?? roleDef.label;
  const resolvedScope = branchName ?? scopeLabel ?? roleDef.defaultScopeLabel;

  const isItemActive = (path: string) => {
    if (path === "/") return location === "/";
    return location === path || location.startsWith(`${path}/`);
  };

  return (
    <aside
      className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      dir="rtl"
      aria-label={`شريط تنقل ${resolvedRoleLabel}`}
    >
      <div className="sidebar-top">
        <BrandLockup />
        {onCloseMobile && (
          <button
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={onCloseMobile}
          >
            <X size={19} />
          </button>
        )}
      </div>

      <div className="academy-switcher" aria-label="نطاق الأكاديمية والفرع">
        <span className="academy-avatar">
          <AvatarIcon size={20} />
        </span>
        <span className="academy-meta">
          <strong>{resolvedTenantName}</strong>
          <small>
            {resolvedRoleLabel} · {resolvedScope}
          </small>
        </span>
      </div>

      <div className="nav-caption">القائمة الرئيسية</div>
      <nav className="primary-nav" aria-label="القائمة الرئيسية">
        {roleDef.navigation.map(item => {
          const Icon = ICON_BY_PATH[item.path] ?? LayoutDashboard;
          const active = isItemActive(item.path);
          return (
            <button
              key={item.path}
              type="button"
              className={`nav-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                navigate(item.path);
                onCloseMobile?.();
              }}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-help" role="note">
        <span className="help-icon">
          <CircleHelp size={18} />
        </span>
        <div>
          <strong>محتاج مساعدة؟</strong>
          <span>مركز الدعم والإرشادات</span>
        </div>
        <ChevronLeft size={16} />
      </div>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="nav-link"
          onClick={() => {
            toast.info("الإعدادات قيد التجهيز في المرحلة التالية");
            onCloseMobile?.();
          }}
        >
          <Settings size={19} />
          <span>الإعدادات</span>
        </button>
        <SessionLogoutButton className="nav-link" iconSize={19} />
      </div>
    </aside>
  );
}
