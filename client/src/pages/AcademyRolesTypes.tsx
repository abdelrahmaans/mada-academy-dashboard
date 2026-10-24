import React from "react";
import { Users } from "lucide-react";
import type { AcademyRoleDefinition } from "@/lib/apiClient";

export type RoleTab = "members" | "matrix";

export interface NewMemberForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleCode: string;
  branchId: string;
}

export const roleLabel = (roles: AcademyRoleDefinition[], code: string): string =>
  roles.find((role) => role.code === code)?.label ?? code;

export const isBranchRole = (roles: AcademyRoleDefinition[], code: string): boolean =>
  roles.find((role) => role.code === code)?.scopeLevel === "BRANCH";

export function PanelTitle({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="academy-roles-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <small>{note}</small>
    </div>
  );
}

export function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="academy-role-metric">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="academy-roles-empty">
      <Users size={22} />
      <span>{text}</span>
    </div>
  );
}
