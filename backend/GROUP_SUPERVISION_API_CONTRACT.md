# Group Supervision API Contract

## Purpose and role boundaries

Group supervision is a **per-group assignment**, not a role change. A branch manager (`R02_BRANCH_MANAGER`) grants or revokes an assignment for an active `R03_HEAD_INSTRUCTORS` or `R04_INSTRUCTOR` membership in that same tenant and branch. The assignment is effective only while its status is `ACTIVE` and its optional time window includes the current time.

A supervisor can read only assignments for their own user ID, tenant, and branch. The backend remains authoritative; UI visibility is not an access-control boundary.

## Manager endpoints

```http
GET    /api/v1/supervision/branch-groups
POST   /api/v1/supervision/assignments
DELETE /api/v1/supervision/assignments/{assignmentId}
```

All three endpoints require `R02_BRANCH_MANAGER` with a tenant and branch scope. Group and supervisor membership are validated against that same scope. Grants and revocations are recorded in the audit log; grant metadata includes the selected capability values.

`POST /assignments` accepts:

```json
{
  "supervisorUserId": "uuid",
  "courseOfferingId": "uuid",
  "canReadAttendance": true,
  "canReadEvaluations": true,
  "canDecideEvaluations": false,
  "startsAt": null,
  "endsAt": null
}
```

At least one of `canReadAttendance`, `canReadEvaluations`, and `canDecideEvaluations` must be true. These are independently grantable: `canReadEvaluations` is read-only, while `canDecideEvaluations` grants the visibility needed for the evaluation decision queue plus permission to publish or return; it does not grant attendance access. `endsAt`, when provided, must be in the future and later than `startsAt`.

All capability flags default to `false` at the API boundary. A manager must explicitly select each permission; an omitted permission is never inferred or granted.

The schema migration preserves the former `CanReviewEvaluations` grant as `CanReadEvaluations` only. `CanDecideEvaluations` is added as `false`, so existing assignments do not retain publishing/return authority implicitly; a branch manager must explicitly grant that decision capability.

## Supervisor read endpoint

```http
GET /api/v1/supervision/my-groups
```

This endpoint is available to `R03_HEAD_INSTRUCTORS` and `R04_INSTRUCTOR`. It returns only currently effective assignments belonging to the caller, with group identity and the granted attendance-read, evaluation-read, and evaluation-decision capabilities. It does not expose the branch's full group list or the manager endpoint.

## Capability enforcement

### Attendance and session visibility

When `canReadAttendance` is true, the assigned supervisor may see the group's scheduled sessions in `GET /api/v1/sessions`, inspect a scoped session, and read its attendance. Sessions remain limited by the caller's tenant and branch. A supervisor who is not the session's assigned instructor or approved substitute **cannot** change attendance, complete the session, or create/edit/submit that session's evaluations.

R04's ordinary instructor workflow remains limited to sessions assigned to them directly or as an approved substitute. Supervision adds only the granted read access to the assigned group.

### Evaluation review

When `canReadEvaluations` is true, an assigned R03 or R04 may read submitted evaluation scores/notes and status summary **only for that assigned group**; read-only assignments cannot make either decision. `canDecideEvaluations` is a separate grant that provides the evaluation queue visibility needed to publish results to consumers or return a submission to the instructor. Queue items include a per-item `canDecide` flag for UI affordances, but the API independently rechecks the decision permission, assignment, tenant, branch, group, active status, and time window when a decision is submitted. R04 receives no branch-wide review permission from their role alone.

Evaluation scores and notes remain hidden from parent/student portals until an authorized reviewer publishes them.

## Authorization tests

The integration suite covers manager grant/revoke, R04 assigned-group read-only attendance, denied attendance writes and session completion, read-only evaluation access with denied decisions, decision access limited to explicitly assigned groups, and denial for an unassigned R04.
