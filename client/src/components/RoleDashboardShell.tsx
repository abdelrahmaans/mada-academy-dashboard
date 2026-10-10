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
    if (typeof child.type === "function") {
      const fnName = child.type.name || (child.type as { displayName?: string }).displayName || "";
      if (fnName.toLowerCase().includes("sidebar")) return true;
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
  showSessionLogout = true,
  ...props
}: RoleDashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const roleDefinition = getRoleDefinition(roleCode);

  const existingSidebar = hideSidebar || hasSidebarElement(children);

  const classList = ["role-dashboard-shell"];
  if (!hideSidebar) {
    classList.push("app-shell");
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
          {showSessionLogout && <SessionLogoutButton />}
          {!existingSidebar && (
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
