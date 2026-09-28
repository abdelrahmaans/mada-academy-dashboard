import { createContext, useContext, type ReactNode } from "react";

export type RoleCode =
  | "R00"
  | "R01"
  | "R02"
  | "R03"
  | "R04"
  | "R05"
  | "R06"
  | "R07"
  | "R08"
  | "R09";

export type RoleScopeLevel =
  | "platform"
  | "tenant"
  | "branch"
  | "team"
  | "assigned"
  | "family"
  | "self";

export type RoleIdentityKind = "staff" | "consumer";

export type RoleScopeValue = {
  roleCode: RoleCode;
  roleLabel: string;
  scopeLevel: RoleScopeLevel;
  scopeLabel: string;
  identityKind: RoleIdentityKind;
  tenantName?: string;
  branchName?: string;
  demo: boolean;
};

export type RoleScopeProviderProps = RoleScopeValue & {
  children: ReactNode;
};

const RoleScopeContext = createContext<RoleScopeValue | null>(null);

export function RoleScopeProvider({
  children,
  ...scope
}: RoleScopeProviderProps) {
  return (
    <RoleScopeContext.Provider value={scope}>
      {children}
    </RoleScopeContext.Provider>
  );
}

export function useRoleScope() {
  const scope = useContext(RoleScopeContext);
  if (!scope) {
    throw new Error(
      "useRoleScope must be used inside a RoleScopeProvider. Wrap the role surface with RoleDashboardShell."
    );
  }
  return scope;
}

export function useOptionalRoleScope() {
  return useContext(RoleScopeContext);
}
