# Backend-Only Working Rules

## Scope

This phase changes only the .NET backend, database contracts, backend tests, backend documentation, and backend deployment/runtime files. Frontend, mobile, visual design, and logo work are out of scope.

## Architecture rules

1. The backend is organized as a modular monolith first.
2. Domain rules live in Domain/Application code, not in endpoint lambdas.
3. API endpoints translate transport data and invoke use cases.
4. Infrastructure implements ports; it does not define product rules.
5. Contracts are versioned and documented before client assumptions are made.
6. The current runtime is preserved until the replacement has equivalent evidence.

## Model rules

Every model must state its owner, tenant/branch scope, aggregate, lifecycle, relationships, mutability, indexes, PII classification, retention, audit behavior, and migration impact.

Do not create a table because a screen needs it. Create a domain model because a business concept and invariant require it.

## Relationship rules

- Every tenant-owned record must have an explicit tenant boundary.
- Branch-owned records must not point to records in another branch unless the relationship is explicitly tenant-level.
- Student/guardian access must use relationship records, not broad role claims.
- Instructor access must use assignment/session scope.
- Foreign keys and unique constraints are part of the business design.
- Delete behavior must be explicit: restrict, archive, soft-delete, or cascade.

## Operation rules

Every command must define permission, scope, state preconditions, validation, idempotency, concurrency, audit, side effects, notification, and recovery.

State transitions must be explicit. Invalid transitions return a typed conflict. Sensitive actions require reasons or evidence where the product policy says so.

## Security rules

- Never trust tenant, branch, student, role, or account IDs from the client.
- Fail closed when storage, SMS, payment, or audit infrastructure is unavailable for a sensitive operation.
- Do not log secrets or unnecessary PII.
- Do not use development credentials or fixed OTPs outside development/test.
- Do not add a support bypass without audit, reason, scope, and expiry.
- Add allow and deny tests for every permission.

## Finance rules

- Store money as integer minor units.
- Payments are append-only.
- Duplicate commands are idempotent.
- Invoice correction and refund are governed workflows.
- Payment evidence is private and provider-backed.
- Balance calculations are tested with overpayment, duplicate, concurrent, and correction cases.

## Testing rules

At minimum, every new backend workflow needs domain tests, application authorization tests, PostgreSQL integration tests where persistence matters, contract tests, and an audit/side-effect assertion.

Run:

```bash
pnpm backend:restore
pnpm backend:build
pnpm backend:test
```

If the environment cannot run .NET, record that fact and do not claim the feature is verified.

## Agent update rule

Before finishing any task, update:

- `.agent/BACKEND_PLAN.md` if phase or next action changed.
- `.agent/BACKEND_AGENT_LOG.md` with a new append-only entry.
- The affected backend contract or architecture document.
- Test evidence and blockers.
