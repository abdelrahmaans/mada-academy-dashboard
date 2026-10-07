# Student and Registration API Contract

## Scope

These endpoints support the R05 Secretary and R02 Branch Manager branch workflows. The backend derives `tenantId` and `branchId` from the authenticated claims; clients must not send scope identifiers to widen access.

The backend remains authoritative for role checks, tenant/branch ownership, active status, duplicate enrollment, capacity, and audit events.

## Student records

### `POST /api/v1/students`

Allowed roles: `R02_BRANCH_MANAGER`, `R05_SECRETARY` (`students.create`). The authenticated user must have a branch scope.

```json
{
  "fullName": "اسم الطالب",
  "dateOfBirth": "2014-05-12"
}
```

The server creates an `ACTIVE` student in the authenticated branch and emits `STUDENT_CREATED`.

### `PUT /api/v1/students/{studentId}`

Allowed roles: `R02_BRANCH_MANAGER`, `R05_SECRETARY`. The target student must belong to the authenticated tenant and branch. The operation updates only `fullName` and `dateOfBirth` and emits `STUDENT_UPDATED`.

## Enrollments

### `GET /api/v1/students/{studentId}/enrollments`

Allowed staff roles with student visibility. The response contains only enrollments whose student, offering, tenant, and branch match the authenticated scope.

### `POST /api/v1/students/{studentId}/enrollments`

Allowed roles: `R02_BRANCH_MANAGER`, `R05_SECRETARY` (`students.create`).

```json
{
  "courseOfferingId": "guid",
  "finalPricePiastres": 35000
}
```

The server verifies:

- student is active and belongs to the authenticated branch;
- offering belongs to the same tenant and branch and is not archived/cancelled;
- no active duplicate enrollment exists;
- active enrollment count is below group capacity;
- final price is non-negative.

The operation emits `STUDENT_ENROLLED`.

### `DELETE /api/v1/students/{studentId}/enrollments/{enrollmentId}`

Allowed roles: `R02_BRANCH_MANAGER`, `R05_SECRETARY`. This is a reversible business-state transition to `CANCELLED`, not a hard delete, and emits `STUDENT_ENROLLMENT_CANCELLED`.

## Errors

- `403 STUDENT_WRITE_FORBIDDEN` / `STUDENT_ENROLLMENT_READ_FORBIDDEN`
- `404 STUDENT_NOT_FOUND`, `GROUP_NOT_FOUND`, or `ENROLLMENT_NOT_FOUND`
- `409 STUDENT_ALREADY_ENROLLED` or `GROUP_CAPACITY_REACHED`
- `422` validation responses for invalid names, dates, or prices

## LIVE/DEMO boundary

Angular R05 uses these live endpoints and does not fall back to seeded/demo students or groups after an API failure. The existing payment/invoice workflows remain separate and continue to enforce their own ownership and audit contracts.
