import type { AuthIdentity } from "../../auth/types";
import type { SessionRecord } from "../../api/apiClient";
import { hasPermission } from "../../authorization/routeAccess";

export function isDirectlyAssigned(
  identity: AuthIdentity,
  session: SessionRecord
) {
  return (
    session.instructorId === identity.id ||
    session.substituteInstructorId === identity.id
  );
}

export function canEditAttendance(
  identity: AuthIdentity,
  session: SessionRecord
) {
  return (
    hasPermission(identity, "attendance.write") &&
    isDirectlyAssigned(identity, session) &&
    !["COMPLETED", "CANCELLED"].includes(session.status.toUpperCase())
  );
}

export function canWriteEvaluations(
  identity: AuthIdentity,
  session: SessionRecord
) {
  return (
    hasPermission(identity, "evaluations.write") &&
    isDirectlyAssigned(identity, session)
  );
}
