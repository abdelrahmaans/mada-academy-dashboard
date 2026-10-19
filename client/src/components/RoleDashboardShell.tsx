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
import {
  RoleScopeProvider,
  type RoleCode,
  type RoleIdentityKind,
  type RoleScopeLevel,
} from "@/contexts/RoleScopeContext";
import { getRoleDefinition } from "@/lib/roleNavigation";
import RoleSidebar from "./RoleSidebar";
import SessionLogoutButton from "./SessionLogoutButton";
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
};

function hasSidebarElement(nodes: ReactNode): boolean {
  return Children.toArray(nodes).some(child => {
    if (!isValidElement(child)) return false;
    if (child.type === "aside") return true;
    const type = child.type as any;
    if (typeof type === "function" || typeof type === "object") {
      if (type?.isSidebar || type?.__madaSidebar) return true;
      const fnName = type?.displayName || type?.name || "";
      if (typeof fnName === "string" && fnName.toLowerCase().includes("sidebar")) return true;
    }
    if (typeof child.props === "object" && child.props !== null) {
      const cls = String((child.props as { className?: string }).className || "");
      if (cls.includes("sidebar")) return true;
      if ("children" in child.props && child.props.children) {
        if (hasSidebarElement(child.props.children as ReactNode)) return true;
      }
    }
    return false;
  });
}

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
  showSessionLogout = false,
  ...props
}: RoleDashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const roleDefinition = getRoleDefinition(roleCode);

  const hasChildrenSidebar = hasSidebarElement(children);
  const shouldRenderSidebar = !hideSidebar && !hasChildrenSidebar;
  const hasAnySidebar = shouldRenderSidebar || hasChildrenSidebar;

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
        if (!hasAnySidebar && name === "app-shell") continue;
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
          mobileNavOpen,
          openMobileNav: () => setMobileNavOpen(true),
          closeMobileNav: () => setMobileNavOpen(false),
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
              {mobileNavOpen && (
                <button
                  type="button"
                  className="mobile-scrim"
                  aria-label="إغلاق القائمة"
                  onClick={() => setMobileNavOpen(false)}
                />
              )}
              <RoleSidebar
                roleCode={roleCode}
                roleLabel={roleLabel}
                tenantName={tenantName}
                branchName={branchName}
                scopeLabel={scopeLabel}
                mobileOpen={mobileNavOpen}
                onCloseMobile={() => setMobileNavOpen(false)}
              />
              <button
                type="button"
                className="shell-mobile-trigger"
                aria-label="فتح القائمة الرئيسية"
                onClick={() => setMobileNavOpen(true)}
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
