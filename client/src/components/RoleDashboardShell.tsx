import {
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  RoleScopeProvider,
  type RoleCode,
  type RoleIdentityKind,
  type RoleScopeLevel,
} from "@/contexts/RoleScopeContext";
import { getRoleDefinition } from "@/lib/roleNavigation";
import SessionLogoutButton from "@/components/SessionLogoutButton";
import "./RoleDashboardShell.css";
import "./RoleFoundation.css";

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
  ...props
}: RoleDashboardShellProps) {
  const classes = ["role-dashboard-shell", className].filter(Boolean).join(" ");
  const roleDefinition = getRoleDefinition(roleCode);

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
      <div
        {...props}
        className={classes}
        dir="rtl"
        aria-label={`مساحة ${roleLabel} — ${scopeLabel}`}
        data-demo={demo ? "true" : "false"}
        data-role-code={roleCode}
        data-role-label={roleDefinition.label}
        data-identity-kind={identityKind}
        data-role-home={roleDefinition.homePath}
        data-scope-level={scopeLevel}
      >
        <>
          <SessionLogoutButton />
          {children}
        </>
      </div>
    </RoleScopeProvider>
  );
}
