# Target Architecture

## Architectural decision

Start with a modular monolith. Do not split into microservices until a real scaling, ownership, or failure-isolation requirement exists.

## Layers

```text
API / Transport
    ↓
Application / Use Cases
    ↓
Domain / Rules and Aggregates
    ↓
Infrastructure / EF Core, PostgreSQL, providers, jobs
```

The Domain layer must not depend on HTTP, EF Core, Angular, storage providers, or external SDKs.

## Modules

### Identity and Tenancy

Accounts, memberships, invitations, active sessions, tenant status, role metadata, permission resolution.

### Authorization and Scope

Actor context, tenant/branch scope, direct/inherited permissions, resource ownership, supervision, consumer links, publication visibility.

### Academy Operations

Students, guardians, registration, enrollments, waitlists, freezes, front-desk operations.

### Catalog and Scheduling

Course templates, offerings/groups, rooms, resources, sessions, recurrence, conflicts, substitutions, supervision.

### Attendance and Learning

Attendance, completion, evaluation, review, publication, correction, progress.

### Finance

Invoices, lines, payments, evidence, expenses, corrections, reconciliation, reports.

### Imports

Preview/commit engine and module-specific row validators.

### Communication

In-app notifications, email/SMS/push outbox, preferences, delivery attempts.

### Reporting

Operational read models, executive metrics, finance reports, exports, definitions.

### Platform Administration

Tenant lifecycle, support-safe diagnostics, plan/policy metadata, session revocation.

## Request flow

```text
HTTP request
→ authentication
→ actor context resolution
→ authorization policy
→ validation
→ command/query handler
→ domain rules
→ transaction
→ audit/state transition/outbox
→ response contract
```

## Read flow

```text
HTTP query
→ actor/context policy
→ scoped query service
→ projection/read model
→ pagination/filter/sort
→ contract DTO
```

## Transaction boundaries

Use one transaction for:

- Enrollment plus capacity decision.
- Session generation plus conflict claims.
- Payment plus invoice balance transition.
- Approval decision plus target transition.
- Evaluation publish plus publication visibility.
- Import commit plus all domain rows and audit summary.

## Cross-cutting infrastructure

- Correlation ID.
- Structured logging with PII redaction.
- Problem details.
- Audit writer.
- Outbox writer and worker.
- Idempotency store.
- Concurrency control.
- Pagination.
- File validation/storage.
- Feature flags.
- Health/readiness.
- Metrics and tracing.

## Failure isolation

Optional read models may fail without removing the primary workspace. Mutations must never return success if the business transaction did not commit. External side effects may be pending, but the UI must show pending and retry state.

## Architecture tests

The solution must include tests that prevent:

- Domain referencing Infrastructure.
- API handlers writing directly to DbContext outside application boundaries.
- UI code depending on provider SDKs.
- Cross-module access to private entities without a public application contract.
- Shared components importing feature services.
