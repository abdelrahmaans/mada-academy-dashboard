import {
  createContext,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactNode,
  Children,
  isValidElement,
} from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ForceChangePasswordModal } from "@/components/auth/ForceChangePasswordModal";
import { AcademyWelcomeOnboardingModal } from "@/components/onboarding/AcademyWelcomeOnboardingModal";
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

export const useRoleShell = () => useContext(RoleShellContext);

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

  const { me, reload } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(() => {
    try {
      return Boolean(
        me?.user?.mustChangePassword ||
        localStorage.getItem("mada_must_change_password") === "true"
      );
    } catch {
      return false;
    }
  });

  const isNewAcademy = Boolean(
    me?.academy?.id &&
    me?.tenantId !== "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
  );

  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      if (!isNewAcademy) return false;
      return !localStorage.getItem(`mada_onboarded_${me?.tenantId}`);
    } catch {
      return false;
    }
  });

  const handlePasswordChanged = async () => {
    setMustChangePassword(false);
    await reload?.();
    if (isNewAcademy && !localStorage.getItem(`mada_onboarded_${me?.tenantId}`)) {
      setShowOnboarding(true);
    }
  };

  const handleCloseOnboarding = () => {
    if (me?.tenantId) {
      try {
        localStorage.setItem(`mada_onboarded_${me.tenantId}`, "true");
      } catch {}
    }
    setShowOnboarding(false);
  };

  const handleOpenMobile = () => {
    setInternalMobileNavOpen(true);
  };
  const handleCloseMobile = () => {
    setInternalMobileNavOpen(false);
    onCloseMobile?.();
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
          <ForceChangePasswordModal
            isOpen={mustChangePassword}
            userPhone={me?.user?.phone}
            onSuccess={handlePasswordChanged}
          />
          <AcademyWelcomeOnboardingModal
            isOpen={!mustChangePassword && showOnboarding}
            academyName={me?.academy?.name || tenantName || "أكاديميتك"}
            onClose={handleCloseOnboarding}
          />
        </div>
      </RoleShellContext.Provider>
    </RoleScopeProvider>
  );
}
