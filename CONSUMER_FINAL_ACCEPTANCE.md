# Consumer Final Acceptance Review — 3 October 2026

## Scope

Reviewed the authenticated consumer routes:

- `/family-portal` — R08 Guardian
- `/student-portal` — R09 Student

The review focused on live/demo boundaries, partial failures, empty states, retry feedback, and the shared API interceptor.

## Acceptance results

| Area | R08 Family | R09 Student | Result |
|---|---|---|---|
| LIVE route is selected only with an authenticated session | `demo={!liveMode}` and live API loading | `demo={!liveMode}` and live API loading | Pass |
| Demo fixtures are not used in LIVE initialization | `CHILDREN` only initializes without a session | `DEMO_SESSIONS` only initializes without a session | Pass |
| Core data loading | Children and sessions are isolated from invoices | Student profile is isolated from sessions | Pass |
| Partial failure | Invoice/session failures preserve linked children | Session failure preserves the student profile | Pass |
| Loading state | Core and invoice loading are explicit | Core loading is explicit | Pass |
| Empty state | No linked children, no attendance, no evaluation, and no invoices are explicit | No linked profile and no sessions are explicit | Pass |
| Error feedback | Inline alert, toast, and Retry for core/invoice/session failures | Inline alert, toast, and Retry for profile/session failures | Pass |
| No Demo fallback after LIVE failure | Error/empty state remains live; fixtures are not substituted | Error/empty state remains live; fixtures are not substituted | Pass |
| Scope boundary | Consumer-linked children/invoices only | Self-scoped student/session data only | Pass |

## Finding fixed during review

FamilyPortal's core-data error state had no Retry action. It now exposes the same Retry control used by the session and invoice partial-failure states.

## Verification

- Static consumer acceptance assertions: **passed**
- Vitest: **13/13 passed**
- `pnpm check`: passed
- `pnpm build`: passed
- `git diff --check`: passed
- Shared interceptor tests cover structured **403** and **500** API events; the global bridge also covers **401**.

## Limit

This is a source-level and CI acceptance review. A live authenticated staging click-through still depends on available R08/R09 credentials and staging data; it is not claimed here as a substitute for that manual smoke test.
