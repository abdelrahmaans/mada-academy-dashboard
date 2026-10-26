import {
  type ComponentType,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  CreditCard,
  GraduationCap,
  Headphones,
  Home,
  KeyRound,
  Layers3,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldCheck,
  Snowflake,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  type LucideProps,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthorizedNavigation, getRoleDefinition } from "@/lib/roleNavigation";
import type { RoleCode } from "@/contexts/RoleScopeContext";
import SessionLogoutButton from "./SessionLogoutButton";
import SettingsModal from "./SettingsModal";
import { ContactSupportModal } from "./ContactSupportModal";

const ICON_BY_PATH: Record<string, ComponentType<LucideProps>> = {
  "/": LayoutDashboard,
  "/executive-dashboard": LayoutDashboard,
  "/branch-operations": Building2,
  "/students": Users,
  "/classes": BookOpen,
  "/schedule": CalendarDays,
  "/approvals": CheckCircle2,
  "/reports": BarChart3,
  "/team": UserPlus,
  "/head-instructors": Users,
  "/academic-programs": BookOpen,
  "/instructor-desk": GraduationCap,
  "/secretary-desk": CalendarCheck,
  "/finance": Wallet,
  "/finance-desk": Wallet,
  "/finance-desk#collections": CreditCard,
  "/finance-desk#expenses": TrendingDown,
  "/finance-desk#shifts": Banknote,
  "/finance-desk#payroll": UserCheck,
  "/marketing-desk": TrendingUp,
  "/academy-owner": Building2,
  "/academy/branches": MapPin,
  "/academy/classrooms": GraduationCap,
  "/academy/roles": KeyRound,
  "/academy-owner/pnl-retention": TrendingUp,
  "/academy/audit-trail": ShieldCheck,
  "/competitions": Trophy,
  "/platform-console": ShieldCheck,
  "/platform/academies/new": Building2,
  "/family-portal": Users,
  "/family-portal#attendance": CalendarDays,
  "/family-portal#evaluations": Star,
  "/family-portal#invoices": Wallet,
  "/family-portal#freeze": Snowflake,
  "/student-portal": Home,
  "/student-portal#sessions": CalendarDays,
  "/student-portal#progress": Trophy,
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
  roleCode?: RoleCode;
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Extract user's genuine role from auth token if available to prevent role hijacking
  const userRoleCode = me?.role ? (me.role.replace(/_.*$/, "") as RoleCode) : undefined;
  const effectiveRoleCode: RoleCode = userRoleCode || roleCode || "R02";

  const roleDef = useMemo(() => getRoleDefinition(effectiveRoleCode), [effectiveRoleCode]);
  const authorizedNavigation = useMemo(
    () => getAuthorizedNavigation(effectiveRoleCode, me?.permissions),
    [effectiveRoleCode, me?.permissions]
  );
  const AvatarIcon = ROLE_AVATAR_ICONS[effectiveRoleCode] ?? GraduationCap;

  const resolvedTenantName = me?.academy?.name ?? tenantName ?? "أكاديمية مدى";
  const resolvedRoleLabel = me?.roleLabel ?? roleLabel ?? roleDef.label;
  const resolvedScope = branchName ?? scopeLabel ?? roleDef.defaultScopeLabel;

  const [currentHash, setCurrentHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const isItemActive = (path: string) => {
    if (path.includes("#")) {
      const [route, hash] = path.split("#");
      return location === route && currentHash === `#${hash}`;
    }
    if (path === "/") return location === "/" && !currentHash;
    return (location === path || location.startsWith(`${path}/`)) && !currentHash;
  };

  const handleNavigate = (path: string) => {
    if (path.includes("#")) {
      const [route, hash] = path.split("#");
      if (location === route) {
        window.location.hash = hash;
        setCurrentHash(`#${hash}`);
      } else {
        navigate(path);
        setCurrentHash(`#${hash}`);
      }
    } else {
      if (location === path && window.location.hash) {
        window.location.hash = "";
        setCurrentHash("");
      }
      navigate(path);
      setCurrentHash("");
    }
    onCloseMobile?.();
  };

  // Group items into primary and operations/modules if applicable
  const primaryItems = authorizedNavigation.filter((item) => {
    if (effectiveRoleCode === "R08") {
      return ["/family-portal", "/family-portal#attendance", "/family-portal#evaluations"].includes(item.path);
    }
    if (effectiveRoleCode === "R09") {
      return ["/student-portal", "/student-portal#sessions"].includes(item.path);
    }
    if (effectiveRoleCode === "R06") {
      return ["/finance-desk", "/finance-desk#collections", "/finance-desk#expenses"].includes(item.path);
    }
    return !["/approvals", "/reports", "/competitions"].includes(item.path) && !item.path.includes("#");
  });

  const secondaryItems = authorizedNavigation.filter((item) => {
    if (effectiveRoleCode === "R08") {
      return ["/family-portal#invoices", "/family-portal#freeze"].includes(item.path);
    }
    if (effectiveRoleCode === "R09") {
      return ["/student-portal#progress"].includes(item.path);
    }
    if (effectiveRoleCode === "R06") {
      return ["/finance-desk#shifts", "/finance-desk#payroll", "/reports"].includes(item.path);
    }
    return ["/approvals", "/reports", "/competitions"].includes(item.path) || item.path.includes("#");
  });

  const hasGroups = primaryItems.length > 0 && secondaryItems.length > 0;

  const primaryCaption =
    effectiveRoleCode === "R08"
      ? "المتابعة الأكاديمية"
      : effectiveRoleCode === "R09"
      ? "المساحة التعليمية"
      : effectiveRoleCode === "R06"
      ? "المالية والتحصيل"
      : "القائمة الرئيسية";

  const secondaryCaption =
    effectiveRoleCode === "R08"
      ? "الخدمات والماليات"
      : effectiveRoleCode === "R09"
      ? "الإنجازات والتقدم"
      : effectiveRoleCode === "R06"
      ? "العمليات والتقارير"
      : "العمليات والأدوات";

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

      {hasGroups ? (
        <>
          <div className="nav-caption">{primaryCaption}</div>
          <nav className="primary-nav" aria-label={primaryCaption}>
            {primaryItems.map((item) => {
              const Icon = ICON_BY_PATH[item.path] ?? LayoutDashboard;
              const active = isItemActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`nav-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => handleNavigate(item.path)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="nav-caption nav-caption-spaced">{secondaryCaption}</div>
          <nav className="primary-nav" aria-label={secondaryCaption}>
            {secondaryItems.map((item) => {
              const Icon = ICON_BY_PATH[item.path] ?? LayoutDashboard;
              const active = isItemActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`nav-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => handleNavigate(item.path)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      ) : (
        <>
          <div className="nav-caption">القائمة الرئيسية</div>
          <nav className="primary-nav" aria-label="القائمة الرئيسية">
            {authorizedNavigation.map((item) => {
              const Icon = ICON_BY_PATH[item.path] ?? LayoutDashboard;
              const active = isItemActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`nav-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => handleNavigate(item.path)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}

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
          style={{ color: "#0d9488", fontWeight: 700 }}
          onClick={() => {
            setSupportModalOpen(true);
            onCloseMobile?.();
          }}
          aria-label="فتح الدعم الفني وطلب مقابلة"
        >
          <Headphones size={19} />
          <span>الدعم والاجتماعات</span>
        </button>
        <button
          type="button"
          className="nav-link"
          onClick={() => {
            setSettingsOpen(true);
            onCloseMobile?.();
          }}
          aria-label="فتح الإعدادات"
        >
          <Settings size={19} />
          <span>الإعدادات</span>
        </button>
        <SessionLogoutButton className="nav-link" iconSize={19} />
      </div>

      <div className="sidebar-version">
        مدى لإدارة الأكاديميات <span>{effectiveRoleCode}</span>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ContactSupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </aside>
  );
}

RoleSidebar.displayName = "RoleSidebar";
RoleSidebar.isSidebar = true;
RoleSidebar.__madaSidebar = true;


