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
        data-demo={demo ? "true" : "false"}
        data-role-code={roleCode}
        data-scope-level={scopeLevel}
      >
        {children}
      </div>
    </RoleScopeProvider>
  );
}
