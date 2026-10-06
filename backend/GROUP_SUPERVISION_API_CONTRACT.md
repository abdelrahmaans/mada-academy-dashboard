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

All three endpoints require `R02_BRANCH_MANAGER` with a tenant and branch scope. Group and supervisor membership are validated against that same scope. Grants and revocations are recorded in the audit log.

`POST /assignments` accepts:

```json
{
  "supervisorUserId": "uuid",
  "courseOfferingId": "uuid",
  "canReadAttendance": true,
  "canReviewEvaluations": false,
  "startsAt": null,
  "endsAt": null
}
```

At least one of `canReadAttendance` and `canReviewEvaluations` must be true. `endsAt`, when provided, must be in the future and later than `startsAt`.

## Supervisor read endpoint

```http
GET /api/v1/supervision/my-groups
```

This endpoint is available to `R03_HEAD_INSTRUCTORS` and `R04_INSTRUCTOR`. It returns only currently effective assignments belonging to the caller, with group identity and the two granted capabilities. It does not expose the branch's full group list or the manager endpoint.

## Capability enforcement

### Attendance and session visibility

When `canReadAttendance` is true, the assigned supervisor may see the group's scheduled sessions in `GET /api/v1/sessions`, inspect a scoped session, and read its attendance. Sessions remain limited by the caller's tenant and branch. A supervisor who is not the session's assigned instructor or approved substitute **cannot** change attendance, complete the session, or create/edit/submit that session's evaluations.

R04's ordinary instructor workflow remains limited to sessions assigned to them directly or as an approved substitute. Supervision adds only the granted read access to the assigned group.

### Evaluation review

When `canReviewEvaluations` is true, an assigned R03 or R04 may read the submitted-evaluation queue and status summary, and may publish or return submitted evaluations **only for that assigned group**. R04 receives no branch-wide review permission from their role alone. The same assignment, tenant, branch, group, active-status, and time-window checks are re-applied when a review decision is submitted.

Evaluation scores and notes remain hidden from parent/student portals until an authorized reviewer publishes them.

## Authorization tests

The integration suite covers manager grant/revoke, R04 assigned-group read-only attendance, denied attendance writes and session completion, review permission limited to explicitly assigned groups, and denial for an unassigned R04.
