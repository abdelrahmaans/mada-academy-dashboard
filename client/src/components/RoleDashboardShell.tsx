import {
  createContext,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactNode,
  Children,
  isValidElement,
} from "react";
import { Menu, ShieldAlert } from "lucide-react";
import {
  RoleScopeProvider,
  type RoleCode,
  type RoleIdentityKind,
  type RoleScopeLevel,
} from "@/contexts/RoleScopeContext";
import { getRoleDefinition } from "@/lib/roleNavigation";
import RoleSidebar from "./RoleSidebar";
import "./RoleDashboardShell.css";
import "./RoleFoundation.css";

type RoleShellContextValue = {
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
};

const RoleShellContext = createContext<RoleShellContextValue>({
  mobileNavOpen: false,
  openMobileNav: () => {},
  closeMobileNav: () => {},
});

const useRoleShell = () => useContext(RoleShellContext);
void useRoleShell;

type RoleDashboardShellProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  children: ReactNode;
  roleCode: RoleCode;
  roleLabel: string;
  scopeLevel: RoleScopeLevel;
  scopeLabel: string;
  identityKind?: RoleIdentityKind;
  tenantName?: string;
  branchName?: string;
  demo?: boolean;
  hideSidebar?: boolean;
  showSessionLogout?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export default function RoleDashboardShell({
  children,
  className,
  roleCode,
  roleLabel,
  scopeLevel,
  scopeLabel,
  identityKind = "staff",
  tenantName,
  branchName,
  demo = true,
  hideSidebar = false,
  showSessionLogout: _showSessionLogout = false,
  mobileOpen,
  onCloseMobile,
  ...props
}: RoleDashboardShellProps) {
  const [internalMobileNavOpen, setInternalMobileNavOpen] = useState(false);
  const isMobileNavOpen = mobileOpen !== undefined ? mobileOpen : internalMobileNavOpen;
  const roleDefinition = getRoleDefinition(roleCode);

  const handleOpenMobile = () => {
    setInternalMobileNavOpen(true);
  };
  const handleCloseMobile = () => {
    setInternalMobileNavOpen(false);
    onCloseMobile?.();
  };

  const [impersonationSession] = useState<{
    tenantId: string;
    tenantName: string;
    reason: string;
    startedAt: number;
  } | null>(() => {
    try {
      const raw = sessionStorage.getItem("mada_emergency_impersonation");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const handleEndImpersonation = () => {
    try {
      sessionStorage.removeItem("mada_emergency_impersonation");
      window.location.href = "/platform";
    } catch {
      window.location.href = "/platform";
    }
  };

  let hasChildrenSidebar = false;
  Children.forEach(children, child => {
    if (isValidElement(child)) {
      if (
        child.type === "aside" ||
        (typeof child.type === "string" && child.type === "aside") ||
        (child.props as { className?: string })?.className?.includes("sidebar")
      ) {
        hasChildrenSidebar = true;
      }
    }
  });

  const isCustomShellWithSidebar =
    className?.includes("pc-live-shell") ||
    className?.includes("platform-console") ||
    hasChildrenSidebar;

  const shouldRenderSidebar = !hideSidebar;
  const hasAnySidebar = shouldRenderSidebar || isCustomShellWithSidebar;

  const classList = ["role-dashboard-shell"];
  if (hasAnySidebar) {
    classList.push("app-shell");
    classList.push("has-sidebar");
  } else {
    classList.push("no-sidebar");
  }
  if (className) {
    for (const name of className.split(/\s+/)) {
      if (name && !classList.includes(name)) {
        classList.push(name);
      }
    }
  }
  const resolvedClasses = classList.join(" ");

  return (
    <RoleScopeProvider
      roleCode={roleCode}
      roleLabel={roleLabel}
      scopeLevel={scopeLevel}
      scopeLabel={scopeLabel}
      identityKind={identityKind}
      tenantName={tenantName}
      branchName={branchName}
      demo={demo}
    >
      <RoleShellContext.Provider
        value={{
          mobileNavOpen: isMobileNavOpen,
          openMobileNav: handleOpenMobile,
          closeMobileNav: handleCloseMobile,
        }}
      >
        <div
          {...props}
          className={resolvedClasses}
          dir="rtl"
          aria-label={`مساحة ${roleLabel} — ${scopeLabel}`}
          data-demo={demo ? "true" : "false"}
          data-role-code={roleCode}
          data-role-label={roleDefinition.label}
          data-identity-kind={identityKind}
          data-role-home={roleDefinition.homePath}
          data-role-back={roleDefinition.backPath}
          data-scope-level={scopeLevel}
        >
          {impersonationSession && (
            <aside
              className="emergency-impersonation-banner"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 99999,
                background: "linear-gradient(90deg, #9a3412 0%, #ea580c 100%)",
                color: "#ffffff",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                fontWeight: 600,
                boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                width: "100%",
                gridColumn: "1 / -1",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={16} />
                <span>
                  <strong>جلسة فحص طارئة نشطة (Super Access · R00):</strong> سياق ({impersonationSession.tenantName}) لفحص المشاكل التشغيلية.
                  {impersonationSession.reason ? ` · السبب: ${impersonationSession.reason}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={handleEndImpersonation}
                style={{
                  background: "#ffffff",
                  color: "#9a3412",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                إنهاء فحص الطوارئ والعودة للمنصة ⬅
              </button>
            </aside>
          )}
          {/* Logout is exclusively located in the sidebar navigation */}
          {shouldRenderSidebar && (
            <>
              {isMobileNavOpen && (
                <button
                  type="button"
                  className="mobile-scrim"
                  aria-label="إغلاق القائمة"
                  onClick={handleCloseMobile}
                />
              )}
              <RoleSidebar
                roleCode={roleCode}
                roleLabel={roleLabel}
                tenantName={tenantName}
                branchName={branchName}
                scopeLabel={scopeLabel}
                mobileOpen={isMobileNavOpen}
                onCloseMobile={handleCloseMobile}
              />
              <button
                type="button"
                className="shell-mobile-trigger"
                aria-label="فتح القائمة الرئيسية"
                onClick={handleOpenMobile}
              >
                <Menu size={22} />
              </button>
            </>
          )}
          {children}
        </div>
      </RoleShellContext.Provider>
    </RoleScopeProvider>
  );
}
