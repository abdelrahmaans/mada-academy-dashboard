# Working Rules

These rules are mandatory unless a signed decision record explicitly overrides them.

## Product and scope rules

1. Every feature must name its user, job, desired outcome, allowed scope, lifecycle, failure states, and success metric.
2. A screen is not a feature. The feature includes API contract, domain rules, permissions, audit behavior, loading/error/empty states, tests, and documentation.
3. Every feature must be classified as `LIVE`, `PREVIEW`, `DEPRECATED`, or `BLOCKED`.
4. No preview or fixture data may appear on a live surface without a visible preview label.
5. A role must see its next useful actions first. Metrics without an action path are secondary.
6. New permissions require an access matrix entry and at least one allow and one deny test.
7. New entities require an ownership/scope statement, retention statement, relations, indexes, and migration plan.

## Backend rules

1. ASP.NET Core is the source of truth for authorization and business rules.
2. Do not trust tenant, branch, student, role, or account identifiers from the browser without resolving them against the authenticated actor.
3. Every mutation must define idempotency, concurrency behavior, state transition, audit action, and notification side effects.
4. Money is stored in integer minor units. Never use floating point for financial amounts.
5. Payments and audit records are append-only unless a dedicated correction workflow exists.
6. EF Core migrations must be reviewed and tested against PostgreSQL. In-memory tests cannot be the only database evidence.
7. External side effects use ports/adapters and an outbox or compensating strategy.
8. No production secrets, demo credentials, seed reset routes, or development storage providers may be enabled in production.
9. No endpoint may be merged without a contract test and a scope/permission test.
10. Public error responses must not leak cross-tenant record existence.

## Frontend rules

1. Angular is the target client and uses standalone components, strict TypeScript, typed services, and feature boundaries.
2. Components render state and emit intent; they do not own domain rules or direct authorization decisions.
3. API calls belong in feature data-access services, not templates or reusable visual components.
4. Guards improve navigation UX; they never replace backend authorization.
5. Interceptors handle cross-cutting transport concerns only: auth token, correlation, errors, retry, and telemetry.
6. Every asynchronous feature models loading, empty, error, forbidden, partial, conflict, success, and stale states where applicable.
7. Do not clear useful data because an optional request failed.
8. Do not use global mutable state when a feature store or route-scoped state is sufficient.
9. Keep the first useful action visible and reachable on mobile.
10. Accessibility and RTL are acceptance criteria, not polish tasks.

## Code review rules

A pull request must answer:

- What user problem is solved?
- What role and scope can use it?
- Which domain rule changed?
- Which entities/relations changed?
- Which endpoint contract changed?
- What are the negative paths?
- What is reusable?
- What was deliberately not implemented?
- What tests prove the behavior?
- What migration, deployment, backup, or rollback concern exists?

## Software Lead gates

The software lead may block a change that:

- Adds a page without a domain/API contract.
- Duplicates a shared component or sidebar.
- Adds role checks only in the frontend.
- Uses untyped strings for a new lifecycle.
- Adds an unbounded query or unpaginated table.
- Introduces a provider dependency without an adapter.
- Mixes preview data with live data.
- Bypasses audit/idempotency for a consequential action.
- Introduces an accessibility regression.
- Changes the temporary project identity without a decision record.

## Definition of Done

A feature is done only when code, tests, API documentation, authorization matrix, UI states, accessibility checks, telemetry, migration, deployment notes, and product acceptance are aligned.
