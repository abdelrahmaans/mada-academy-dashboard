import { Building2, MapPin, ShieldCheck, Users } from "lucide-react";
import { useRoleScope } from "@/contexts/RoleScopeContext";

type RoleScopeCardProps = {
  className?: string;
  compact?: boolean;
};

export default function RoleScopeCard({
  className,
  compact = false,
}: RoleScopeCardProps) {
  const scope = useRoleScope();
  const Icon = scope.scopeLevel === "platform" ? ShieldCheck : Building2;
  const classes = [
    "role-scope-card",
    compact ? "role-scope-card-compact" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} aria-label={`نطاق ${scope.roleLabel}`}>
      <span className="role-scope-icon" aria-hidden="true">
        <Icon size={compact ? 15 : 17} />
      </span>
      <div className="role-scope-copy">
        <span className="role-scope-kicker">الدور والنطاق</span>
        <strong>
          {scope.roleCode} · {scope.roleLabel}
        </strong>
        <span>
          {scope.scopeLabel}
          {scope.branchName &&
          scope.branchName !== scope.scopeLabel &&
          scope.scopeLevel !== "branch"
            ? ` · ${scope.branchName}`
            : ""}
        </span>
      </div>
      {!compact && (
        <span className="role-scope-boundary">
          <MapPin size={14} aria-hidden="true" />
          {scope.identityKind === "consumer" ? "بيانات شخصية" : "نطاق مصرح"}
        </span>
      )}
      {scope.demo && (
        <span className="role-scope-demo">
          <Users size={12} aria-hidden="true" /> DEMO
        </span>
      )}
    </aside>
  );
}
