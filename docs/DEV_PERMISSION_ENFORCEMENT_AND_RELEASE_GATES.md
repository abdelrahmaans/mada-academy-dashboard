# Dev Permission Enforcement and Release Gates

**Branch:** `dev` only
**Scope:** server-side authorization, security regression coverage, and release-readiness gates

## What is now enforced server-side

The backend now has one authorization handler for dynamic permissions. It resolves the active membership again from the database on each authorized request, combines member-level permissions, tenant role overrides, and role defaults, and evaluates a named permission policy. A valid `staff` claim or a visible frontend control is not sufficient by itself.

The permission policies are applied to the highest-risk route families:

- Students, enrollments, sessions, attendance, and session completion.
- Invoices, payments, cashier actions, payroll views, payment evidence, and expenses.
- Marketing campaigns and content.
- Analytics and operational reports.
- Academy roles, members, branch management, bulk branch import, classrooms, and classroom resources.

Tenant and branch filtering remains inside the endpoint handlers. Permission policy is an additional gate, not a replacement for tenant, branch, assignment, linked-record, or workflow checks.

## Regression coverage

`DynamicPermissionsEngineTests.StaffRoleWithoutStudentsPermission_IsDeniedUntilPermissionIsGranted` proves that:

1. An instructor remains authenticated and belongs to the `staff` account type.
2. The instructor is still denied `GET /api/v1/students` without `students.read`.
3. Granting `students.read` to that membership and issuing a new token allows the request.

The existing session-revocation, stale-branch-token, cross-branch import, tenant-scope, and consumer-link tests remain part of the backend suite.

## Verification commands

From the repository root:

```bash
pnpm check
pnpm test -- --runInBand
pnpm build

dotnet test backend/MadaAcademy.sln --configuration Release
```

The sandbox used for this change does not include the .NET SDK; backend compilation and integration tests must therefore be confirmed by the `Backend Integration Tests` GitHub workflow on `dev`.

## Release gates still requiring a real staging environment

These are intentionally not marked complete by local tests:

1. Deploy the exact `dev` commit to a staging API and frontend with PostgreSQL, production-like JWT settings, CORS, and secrets.
2. Run `scripts/staging-smoke.sh` with non-production staging credentials.
3. Run `scripts/private-storage-smoke.sh` against a staging payment using a non-sensitive fixture.
4. Run `scripts/backup-restore-verify.sh` against a staging PostgreSQL database and an isolated restore database.
5. Back up private Storage objects independently; a PostgreSQL dump does not contain Storage API objects.
6. Record commit SHA, API URL, frontend URL, database migration result, storage result, backup target, restore result, RPO/RTO, and timestamp in the release evidence.

No production claim should be made until those checks are executed against deployed infrastructure. `main` is not part of this work and remains unchanged.
