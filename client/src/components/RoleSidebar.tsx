import {
  type ComponentType,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Baby,
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
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthorizedNavigation, getRoleDefinition } from "@/lib/roleNavigation";
import type { RoleCode } from "@/contexts/RoleScopeContext";
import SessionLogoutButton from "./SessionLogoutButton";
import SettingsModal from "./SettingsModal";
import { ContactSupportModal } from "./ContactSupportModal";
import LanguageToggle from "./LanguageToggle";

const ICON_BY_PATH: Record<string, ComponentType<LucideProps>> = {
  "/": LayoutDashboard,
  "/executive-dashboard": LayoutDashboard,
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
  "/nursery-desk": Baby,
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
  const { lang, t } = useLanguage();

  const resolvedTenantName = me?.academy?.name ?? tenantName ?? (lang === "en" ? "Mada Academy" : "أكاديمية مدى");
  const resolvedRoleLabel = t(me?.roleLabel ?? roleLabel ?? roleDef.label);
  const resolvedScope = t(branchName ?? scopeLabel ?? roleDef.defaultScopeLabel);

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
    if (location === path || location.startsWith(`${path}/`)) {
      // If authorized navigation has a specific link matching current hash, defer to it
      if (currentHash) {
        const hasSpecificSubItem = authorizedNavigation.some(
          item => item.path === `${path}${currentHash}`
        );
        if (hasSpecificSubItem) return false;
      }
      return true;
    }
    return false;
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

  // Group items into primary and operations/modules according to role responsibility (SRP)
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
    if (effectiveRoleCode === "R05") {
      return ["/secretary-desk", "/classes", "/finance-desk"].includes(item.path);
    }
    if (effectiveRoleCode === "R01") {
      return ["/executive-dashboard", "/academy-owner/pnl-retention", "/academy/branches"].includes(item.path);
    }
    if (effectiveRoleCode === "R03") {
      return ["/head-instructors", "/instructor-desk"].includes(item.path);
    }
    if (effectiveRoleCode === "R04") {
      return ["/instructor-desk"].includes(item.path);
    }
    return !["/approvals", "/reports", "/competitions", "/team", "/academy/roles", "/academy/audit-trail"].includes(item.path) && !item.path.includes("#");
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
    if (effectiveRoleCode === "R05") {
      return ["/students", "/schedule"].includes(item.path);
    }
    if (effectiveRoleCode === "R01") {
      return ["/academy/roles", "/academy/audit-trail"].includes(item.path);
    }
    if (effectiveRoleCode === "R03") {
      return ["/academic-programs", "/schedule"].includes(item.path);
    }
    if (effectiveRoleCode === "R04") {
      return ["/schedule"].includes(item.path);
    }
    return ["/approvals", "/reports", "/competitions", "/team", "/academy/roles", "/academy/audit-trail"].includes(item.path) || item.path.includes("#");
  });

  const hasGroups = primaryItems.length > 0 && secondaryItems.length > 0;

  const primaryCaption =
    effectiveRoleCode === "R08"
      ? "متابعة الأبناء"
      : effectiveRoleCode === "R09"
      ? "المساحة التعليمية"
      : effectiveRoleCode === "R06"
      ? "الخزينة والتحصيل"
      : effectiveRoleCode === "R05"
      ? "الاستقبال والتسكين"
      : effectiveRoleCode === "R03"
      ? "الإشراف والتدريب"
      : effectiveRoleCode === "R04"
      ? "حصصي المباشرة"
      : effectiveRoleCode === "R01"
      ? "الإدارة العامة"
      : "إدارة الفرع";

  const secondaryCaption =
    effectiveRoleCode === "R08"
      ? "المالية والطلبات"
      : effectiveRoleCode === "R09"
      ? "لوحة الإنجازات"
      : effectiveRoleCode === "R06"
      ? "الدفاتر والتقارير"
      : effectiveRoleCode === "R05"
      ? "الجداول والبيانات"
      : effectiveRoleCode === "R03"
      ? "المناهج والجداول"
      : effectiveRoleCode === "R04"
      ? "الجدول والتغطيات"
      : effectiveRoleCode === "R01"
      ? "الحوكمة والرقابة"
      : "البطولات والموافقات";

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
          <div className="nav-caption">{t(primaryCaption)}</div>
          <nav className="primary-nav" aria-label={t(primaryCaption)}>
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
                  <span>{t(item.label)}</span>
                </button>
              );
            })}
          </nav>

          <div className="nav-caption nav-caption-spaced">{t(secondaryCaption)}</div>
          <nav className="primary-nav" aria-label={t(secondaryCaption)}>
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
                  <span>{t(item.label)}</span>
                </button>
              );
            })}
          </nav>
        </>
      ) : (
        <>
          <div className="nav-caption">{t("القائمة الرئيسية")}</div>
          <nav className="primary-nav" aria-label={t("القائمة الرئيسية")}>
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
                  <span>{t(item.label)}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}

      <div className="sidebar-spacer" />

      <div style={{ padding: "0 12px 10px" }}>
        <LanguageToggle variant="sidebar" />
      </div>

      <div className="sidebar-help" role="note">
        <span className="help-icon">
          <CircleHelp size={18} />
        </span>
        <div>
          <strong>{lang === "en" ? "Need help?" : "محتاج مساعدة؟"}</strong>
          <span>{lang === "en" ? "Support Center & Guides" : "مركز الدعم والإرشادات"}</span>
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
          aria-label={t("topbar.help") || "فتح الدعم الفني"}
        >
          <Headphones size={19} />
          <span>{t("topbar.help") || "الدعم والاجتماعات"}</span>
        </button>
        <button
          type="button"
          className="nav-link"
          onClick={() => {
            setSettingsOpen(true);
            onCloseMobile?.();
          }}
          aria-label={t("topbar.settings") || "فتح الإعدادات"}
        >
          <Settings size={19} />
          <span>{t("topbar.settings") || "الإعدادات"}</span>
        </button>
        <SessionLogoutButton className="nav-link" iconSize={19} />
      </div>

      <div className="sidebar-version">
        {lang === "en" ? "Mada Academy Operations" : "مدى لإدارة الأكاديميات"} <span>{effectiveRoleCode}</span>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ContactSupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </aside>
  );
}

RoleSidebar.displayName = "RoleSidebar";
RoleSidebar.isSidebar = true;
RoleSidebar.__madaSidebar = true;


