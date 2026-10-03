# Mada Academy — Project Status

**As of:** 3 October 2026
**Verified Git state:** `main` at `1d13815`, pushed to origin after PR #35 merge.
**Latest delivery PR:** [PR #35 — seed and verify the P1 core journey](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/35), merged with all required checks successful.
**Stack:** React + Vite + TypeScript (primary UI); ASP.NET Core 10; EF Core; PostgreSQL 16; JWT access/refresh sessions. Angular is a reference preview only.

## Executive summary

Mada has moved beyond a static prototype: authentication, scoped operational APIs, consumer account links, session/evaluation workflows, finance APIs, and operational reports are persisted and tested. The product is **not fully production-ready end-to-end**: the current P2 delivery still needs final acceptance/merge, production SMS is intentionally unconfigured, password recovery is missing, and finance evidence deployment/storage smoke tests remain outside the currently active work. Per the current execution decision, the stalled Finance follow-up and P1 blocker are left unchanged while P2 acceptance is completed.

## Role-by-role state

| Role | What is implemented | Important gaps / truth to preserve |
|---|---|---|
| **R00 Platform Admin** | Platform shell/navigation exists; live console preserves available overview/academy/role data when one read endpoint fails and gives toast feedback for refresh and load/support failures. | Full platform administration and support workflows are not demonstrated as complete live APIs. |
| **R01 Academy Owner** | Academy bootstrap, tenant-level identity/member/role, branch and classroom foundations exist; LIVE route is guarded from the old demo page, academy roles preserve members/permissions when branch lookup fails, classroom/resource management preserves useful data on partial failures, the executive dashboard gives toast/error feedback for report and audit loading, and the global interceptor now covers 401, 403, and 5xx with automated tests. | Executive/reporting surfaces still need final acceptance evidence. |
| **R02 Branch Manager** | Branch-scoped student/session/classroom and approval operations are available across implemented backend slices; `/branch-operations` now routes authenticated R02 users to the live dashboard instead of the legacy demo, and approvals/classes/schedule remain visible when optional endpoints are forbidden. | Some non-core branch panels remain outside the current P2 slice. |
| **R03 Head Instructors** | Branch-scoped evaluation review queue; publish or request changes; dashboard avoids demo evaluation samples in LIVE evaluation surfaces, keeps core team/group/session data visible when optional endpoints fail, and preserves groups or sessions when one Academic Programs read fails. | Other overview/team indicators may still be preview/demo data. |
| **R04 Instructor** | Assigned sessions, attendance, evaluation drafts/submission, and relevant workflow actions are connected to APIs. | Broader instructor analytics and non-core surfaces are not all live. |
| **R05 Secretary** | Student workflows, phone-based consumer lookup/linking, consumer invitations, and scoped invoice/payment operations exist; legacy Secretary route is guarded from LIVE sessions. | Finance follow-up is intentionally parked for the current P2 cycle; do not expand permissions without reopening the finance decision. |
| **R06 Accountant** | FinanceDesk is connected to scoped invoice/payment/expense/report APIs with role-aware loading, forbidden, and error states. | Production evidence/storage smoke test and release-gate deployment work remain parked; do not mark Finance fully production-ready from UI checks alone. |
| **R07 Marketing Manager** | Branch scope is aligned in navigation metadata and copy. | Marketing campaign/lead operations are not all backed by live APIs. |
| **R08 Guardian** | Real linked children, scoped consumer operational data, published evaluations, and linked invoice reads; LIVE has explicit empty/error states without demo fallback, and invoice failure no longer hides linked children or sessions. | Evidence deployment and any additional finance UX remain outside the active P2 cycle. |
| **R09 Student** | Self-scoped account/student relationship, consumer session data, published evaluations, and explicit LIVE empty/error states without demo fallback; student profile remains visible when session loading fails, with toast and retry feedback. | Broader learning/progress elements remain intentionally limited to persisted session data. |

## Live backend and identity

- JWT authentication supports access/refresh, refresh rotation, logout, and tenant/role/branch claims.
- Operational APIs cover students, sessions, attendance, scheduling/group generation, approvals, and conflict checks.
- Consumer identity supports phone search and linking for existing accounts, plus invitation/acceptance endpoints for parent/student accounts.
- Invitations use random one-time OTPs, expiry/attempt limits, and hashed/HMAC-protected secret material; the real SMS delivery provider is not configured.
- Evaluation workflow is persisted: `DRAFT` → `SUBMITTED` → `PUBLISHED` or `CHANGES_REQUESTED`; consumers receive score/notes only for published evaluations.
- Strict tenant/branch isolation and consumer-link scoping are covered by integration tests for implemented vertical slices.

## CI and verified baseline

At PR #35, all four GitHub checks passed: PostgreSQL/backend integration, preview comments, and both deployments. The backend suite passed **70/70**, while local frontend validation passed Vitest **13/13**, `pnpm check`, `pnpm build`, and `git diff --check`. A local API run now supports `MADA_DATABASE_MODE=memory` plus demo seeding; the R08/R09 preflight verified one linked student per account and the published parent score `88`. Full local backend execution passes **54/54** InMemory tests; the 16 PostgreSQL tests correctly require a disposable `DATABASE_URL` and were not run without one. CI workflows cover backend/PostgreSQL and frontend checks.

## OTP status

- `DevelopmentSmsMessageSender` is registered only in ASP.NET Development and generates a random code for development/test use.
- Non-Development currently uses `UnconfiguredSmsMessageSender` and fails closed; there is no live SMS. **Do not set production to Development** and do not use a universal fixed OTP.
- User permits a temporary no-cost solution. A restricted staff-assisted pilot is proposed in [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md), but is not implemented or enabled.
- Password recovery is not implemented.

## Next milestone and open issues

The P2 consumer final acceptance review is complete for R08/R09 and PR #35 is merged; the seeded accounts, links, attendance, and published evaluation are now repairable and covered by API integration tests. The next phase is the credentialed staging smoke test; its exact checklist is in [CONSUMER_STAGING_SMOKE_TEST.md](CONSUMER_STAGING_SMOKE_TEST.md), and it remains pending until a controlled non-production API URL exists. The Finance follow-up remains intentionally parked. The finance design and release gates remain documented in [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md) and [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).

Open implementation blockers and product debt:

1. Manual R08/R09 browser click-through is the active next-phase gate; automation and seeded data are ready, but no controlled deployed API exists yet.
2. Finance evidence deployment remains gated on backend secrets, authenticated staging upload/download smoke test, and durable backup evidence; see [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).
3. Invoice cancellation/correction/refund and expanded financial workflows remain outside the current slice and must not be implied as supported.
4. Production SMS provider and password recovery are later identity work; interim OTP mode remains opt-in, limited, audited, and never a hard-coded/shared code.
5. Run [CONSUMER_STAGING_SMOKE_TEST.md](CONSUMER_STAGING_SMOKE_TEST.md) against a controlled non-production API; do not reopen parked Finance work without a new decision.
