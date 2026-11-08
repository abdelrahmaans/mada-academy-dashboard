# Backend Blueprint

## Solution layout

```text
src/
├── AcademyOps.Api
├── AcademyOps.Application
├── AcademyOps.Domain
├── AcademyOps.Infrastructure
└── AcademyOps.Contracts

tests/
├── AcademyOps.Domain.Tests
├── AcademyOps.Application.Tests
├── AcademyOps.Integration.Tests
├── AcademyOps.Contract.Tests
└── AcademyOps.Architecture.Tests
```

## Feature module template

```text
Features/<Module>/<UseCase>/
├── <UseCase>Command.cs or Query.cs
├── <UseCase>Handler.cs
├── <UseCase>Validator.cs
├── <UseCase>Policy.cs
├── <UseCase>Endpoint.cs
├── <UseCase>Response.cs
└── <UseCase>Tests.cs
```

## Backend modules

### Identity

- Login.
- Refresh.
- Logout.
- Invitation.
- Password recovery.
- Account lockout.
- Session revocation.
- `/me` context projection.

### Tenancy and Administration

- Academy bootstrap.
- Branches.
- Classrooms/resources.
- Memberships.
- Roles/permissions.
- Tenant settings.
- Audit.

### Students and Enrollment

- Student registration.
- Guardian links.
- Student accounts.
- Course offerings/groups.
- Enrollment.
- Waitlist.
- Freeze requests.

### Scheduling

- Recurring schedule preview.
- Session generation.
- Conflict check.
- Session changes.
- Substitution requests.
- Supervision assignments.

### Attendance and Evaluation

- Roll call.
- Attendance correction.
- Session completion.
- Evaluation draft.
- Submit.
- Request changes.
- Publish.
- Consumer projection.

### Finance

- Invoice.
- Invoice lines.
- Payment.
- Payment evidence.
- Reconciliation.
- Expense.
- Expense approval.
- Invoice correction.
- Financial reports.

### Imports

- Upload.
- Preview.
- Row review.
- Commit.
- Expiry.
- Idempotency.
- Audit summary.

### Reporting

- Operational reports.
- Executive reports.
- Finance reports.
- Exports.
- Metric definitions.

## Endpoint rules

- Use resource-oriented paths.
- Keep commands explicit where a state transition occurs: `/publish`, `/approve`, `/reject`, `/submit`, `/complete`.
- Return `409 Conflict` for illegal state or concurrency conflicts.
- Return `404` when revealing record existence would cross a scope boundary.
- Return `403` when the actor is in scope but lacks the action permission.
- Use cursor/page pagination for lists.
- Require idempotency headers for sensitive commands.
- Emit correlation IDs.
- Generate OpenAPI metadata for every endpoint.

## Persistence rules

- EF Core configurations live outside entities.
- Use explicit relationships and foreign keys.
- No generic `SaveChanges` side effects hidden from application code.
- Keep migrations small and reviewable.
- Use PostgreSQL integration tests for transaction and constraint behavior.
- Never expose EF entities through API contracts.

## Storage rules

```text
IPrivateObjectStorage
├── PutAsync(stream, metadata, scope)
├── OpenReadAsync(objectKey, scope)
├── DeleteAsync(objectKey, scope)
└── ExistsAsync(objectKey, scope)
```

All operations validate authorization, object scope, size, content type, hash, retention, and lifecycle.

## Background jobs

Required workers:

- Outbox dispatcher.
- Notification delivery.
- Import expiry cleanup.
- Object reconciliation.
- Report generation.
- Scheduled session generation if enabled.
- Payment/provider reconciliation.

Each job has retry policy, idempotency, dead-letter state, metrics, and an operator replay action.
