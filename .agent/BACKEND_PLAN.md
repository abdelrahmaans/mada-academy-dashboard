# Backend .NET Implementation Plan

**Status:** ACTIVE  
**Scope:** Backend only  
**Frontend/mobile:** explicitly deferred  
**Temporary project code:** `AcademyOps`  
**Canonical update owner:** every agent touching backend files must update this plan and the agent log in the same change.

## Working baseline

The current backend under `backend/MadaAcademy.Api/` is the functional baseline. It contains existing authentication, tenant/branch scope, operations, scheduling, finance, reports, storage, and integration tests. The plan below extracts the product truth and moves the implementation toward a modular .NET architecture without breaking behavior accidentally.

## Phase 0 — Repository and behavior freeze

**Goal:** understand the current system before changing structure.

Deliverables:

- Current endpoint inventory.
- Current entity and migration inventory.
- Role/permission/scope matrix.
- State/status dictionary.
- Current API response and error contract.
- Current integration-test map.
- Known mismatches between code, tests, and docs.
- Migration and rollback strategy.

Exit criteria:

- No undocumented sensitive endpoint.
- No unknown tenant/branch boundary in a production path.
- All current contracts classified as keep, change, deprecate, or preview.

## Phase 1 — Solution foundation

**Goal:** establish projects, dependency direction, shared conventions, and test infrastructure.

Create:

- `AcademyOps.Api`.
- `AcademyOps.Application`.
- `AcademyOps.Domain`.
- `AcademyOps.Infrastructure`.
- `AcademyOps.Contracts`.
- Domain, application, integration, contract, and architecture test projects.

Rules:

- Domain has no framework/provider dependency.
- API does not contain business rules.
- Infrastructure implements ports.
- Contracts do not expose persistence entities.
- PostgreSQL integration tests are first-class.

## Phase 2 — Shared kernel and cross-cutting rules

Implement and test:

- Strong IDs or typed identifiers where useful.
- Result/problem-details model.
- Clock and timezone abstraction.
- Pagination and sorting contracts.
- Correlation IDs.
- Audit event model.
- State transition model.
- Idempotency model.
- Concurrency token model.
- Domain errors and application errors.
- Outbox message model.

## Phase 3 — Identity, tenancy, and authorization

Implement:

- User accounts.
- Tenant/academy.
- Branch.
- Membership.
- Role catalog.
- Permission catalog.
- Role overrides.
- Member overrides.
- Invitation lifecycle.
- Access/refresh session lifecycle.
- Tenant and branch scope resolution.
- Consumer relationship scope.
- Supervision/assignment scope.

Acceptance:

- Cross-tenant reads and writes fail safely.
- Cross-branch access fails safely.
- R08/R09 cannot escape relationship/self scope.
- R03 remains read-only for attendance unless an approved decision changes it.
- Session revocation is tested.

## Phase 4 — Academy operations

Implement in this order:

1. Student.
2. Guardian relationship.
3. Course template.
4. Course offering/group.
5. Classroom/resource.
6. Enrollment.
7. Waitlist.
8. Freeze/request workflow.

Every aggregate requires lifecycle, owner, relation rules, indexes, audit actions, and scope tests.

## Phase 5 — Scheduling

Implement:

- Session creation.
- Recurring schedule preview.
- Conflict detection.
- Room/instructor/student availability.
- Reschedule.
- Cancellation.
- Substitution request.
- Supervision assignment.
- Session completion.

Open product decisions must be resolved before finalizing recurrence, holidays, timezone, and exception behavior.

## Phase 6 — Attendance and learning

Implement:

- Attendance statuses.
- Attendance save/submit/lock/correction.
- Session completion invariants.
- Evaluation draft.
- Evaluation submission.
- Request changes.
- Review.
- Publish.
- Consumer visibility projection.
- Correction history.

The current verified baseline is score/notes evaluation. Rubric/mastery/checkpoint behavior remains a separate product decision.

## Phase 7 — Finance

Implement:

- Invoice and invoice lines.
- Invoice finalization.
- Payment transaction.
- Idempotent payment recording.
- Balance calculation.
- Payment evidence.
- Expenses.
- Maker-checker approvals.
- Invoice correction.
- Refund/correction policy.
- Reconciliation.
- Finance reports.

Money uses integer minor units. Payments are append-only. Corrections are governed workflows.

## Phase 8 — Imports and reporting

Implement:

- Import job.
- Upload validation.
- Preview.
- Row-level errors.
- Dependency checks.
- Stale preview detection.
- Idempotent commit.
- Expiry.
- Audit summary.
- Operational read models.
- Executive and finance report queries.

## Phase 9 — Infrastructure hardening

Implement and verify:

- PostgreSQL constraints and indexes.
- Private object storage adapter.
- Durable outbox.
- Background workers.
- Distributed-ready rate limiting or explicit single-instance guard.
- Observability.
- Backup/restore.
- Storage reconciliation.
- Provider failure behavior.
- Security baseline and dependency scanning.

## Phase 10 — Contract closure and cutover

- Generate OpenAPI.
- Generate typed client contract artifacts.
- Run full authorization matrix.
- Run migration rehearsal.
- Reconcile old/new data.
- Run performance and concurrency tests.
- Mark old endpoints deprecated or compatible.
- Deploy staging.
- Run acceptance evidence.
- Define production rollback.

## Current next action

**Next task:** complete Phase 0 by producing the backend endpoint/entity/status/permission inventory from the current code and tests. No new domain implementation should begin until that inventory is reviewed.

## Completion rule

A phase is complete only when its code, tests, API contract, authorization matrix, migration notes, audit behavior, and update log are all present.

## Update protocol

When any agent changes backend work:

1. Read this file.
2. Update the current phase and next action.
3. Add a dated entry to `.agent/BACKEND_AGENT_LOG.md`.
4. Update affected docs/contracts.
5. Run focused tests, then relevant full tests.
6. Record test results and known blockers.
