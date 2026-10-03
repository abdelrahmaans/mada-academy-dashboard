# Mada Academy — Project Status

**As of:** 3 October 2026
**Verified Git state:** `feat/p2-operational-reports` at `c887857`, pushed to origin and tracked by [PR #34](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/34).
**Latest delivery PR:** [PR #34 — scoped operational reports and acceptance hardening](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/34), open with all required checks successful.
**Stack:** React + Vite + TypeScript (primary UI); ASP.NET Core 10; EF Core; PostgreSQL 16; JWT access/refresh sessions. Angular is a reference preview only.

## Executive summary

Mada has moved beyond a static prototype: authentication, scoped operational APIs, consumer account links, session/evaluation workflows, finance APIs, and operational reports are persisted and tested. The product is **not fully production-ready end-to-end**: the current P2 delivery still needs final acceptance/merge, production SMS is intentionally unconfigured, password recovery is missing, and finance evidence deployment/storage smoke tests remain outside the currently active work. Per the current execution decision, the stalled Finance follow-up and P1 blocker are left unchanged while P2 acceptance is completed.

## Role-by-role state

| Role | What is implemented | Important gaps / truth to preserve |
|---|---|---|
| **R00 Platform Admin** | Platform shell/navigation exists. | Full platform administration and support workflows are not demonstrated as complete live APIs. |
| **R01 Academy Owner** | Academy bootstrap, tenant-level identity/member/role, branch and classroom foundations exist; LIVE route is guarded from the old demo page, and classroom/resource management preserves useful data on partial failures. | Executive/reporting surfaces still need final acceptance evidence. |
| **R02 Branch Manager** | Branch-scoped student/session/classroom and approval operations are available across implemented backend slices; live route no longer opens the legacy demo, and approvals/classes/schedule remain visible when optional endpoints are forbidden. | Some non-core branch panels remain outside the current P2 slice. |
| **R03 Head Instructors** | Branch-scoped evaluation review queue; publish or request changes; dashboard avoids demo evaluation samples in LIVE evaluation surfaces. | Other overview/team indicators may still be preview/demo data. |
| **R04 Instructor** | Assigned sessions, attendance, evaluation drafts/submission, and relevant workflow actions are connected to APIs. | Broader instructor analytics and non-core surfaces are not all live. |
| **R05 Secretary** | Student workflows, phone-based consumer lookup/linking, consumer invitations, and scoped invoice/payment operations exist; legacy Secretary route is guarded from LIVE sessions. | Finance follow-up is intentionally parked for the current P2 cycle; do not expand permissions without reopening the finance decision. |
| **R06 Accountant** | FinanceDesk is connected to scoped invoice/payment/expense/report APIs with role-aware loading, forbidden, and error states. | Production evidence/storage smoke test and release-gate deployment work remain parked; do not mark Finance fully production-ready from UI checks alone. |
| **R07 Marketing Manager** | Branch scope is aligned in navigation metadata and copy. | Marketing campaign/lead operations are not all backed by live APIs. |
| **R08 Guardian** | Real linked children, scoped consumer operational data, published evaluations, and linked invoice reads; LIVE has explicit empty/error states without demo fallback. | Evidence deployment and any additional finance UX remain outside the active P2 cycle. |
| **R09 Student** | Self-scoped account/student relationship, consumer session data, published evaluations, and explicit LIVE empty/error states without demo fallback. | Broader learning/progress elements remain intentionally limited to persisted session data. |

## Live backend and identity

- JWT authentication supports access/refresh, refresh rotation, logout, and tenant/role/branch claims.
- Operational APIs cover students, sessions, attendance, scheduling/group generation, approvals, and conflict checks.
- Consumer identity supports phone search and linking for existing accounts, plus invitation/acceptance endpoints for parent/student accounts.
- Invitations use random one-time OTPs, expiry/attempt limits, and hashed/HMAC-protected secret material; the real SMS delivery provider is not configured.
- Evaluation workflow is persisted: `DRAFT` → `SUBMITTED` → `PUBLISHED` or `CHANGES_REQUESTED`; consumers receive score/notes only for published evaluations.
- Strict tenant/branch isolation and consumer-link scoping are covered by integration tests for implemented vertical slices.

## CI and verified baseline

At PR #34, all five GitHub checks passed: PostgreSQL/backend integration, frontend typecheck/tests/build, preview comments, and both deployments. Latest local validation on the delivery branch: Vitest **11/11**, `pnpm check`, `pnpm build`, and `git diff --check` passed. CI workflows cover backend/PostgreSQL and frontend checks.

## OTP status

- `DevelopmentSmsMessageSender` is registered only in ASP.NET Development and generates a random code for development/test use.
- Non-Development currently uses `UnconfiguredSmsMessageSender` and fails closed; there is no live SMS. **Do not set production to Development** and do not use a universal fixed OTP.
- User permits a temporary no-cost solution. A restricted staff-assisted pilot is proposed in [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md), but is not implemented or enabled.
- Password recovery is not implemented.

## Next milestone and open issues

The active priority is to complete the P2 acceptance pass for [PR #34](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/34), merge it after review, and preserve the route/demo guards. The Finance follow-up and the blocked P1 task are intentionally parked and must not be restarted during this cycle. The finance design and release gates remain documented in [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md) and [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).

Open implementation blockers and product debt:

1. PR #34 still needs merge/review; its implementation is complete, including partial-failure hardening for Approvals, Classes, Schedule, and AcademyClassrooms.
2. Finance evidence deployment remains gated on backend secrets, authenticated staging upload/download smoke test, and durable backup evidence; see [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).
3. Invoice cancellation/correction/refund and expanded financial workflows remain outside the current slice and must not be implied as supported.
4. Production SMS provider and password recovery are later identity work; interim OTP mode remains opt-in, limited, audited, and never a hard-coded/shared code.
5. Continue targeted acceptance audits only for routes that can still imply unauthorized live persistence; do not reopen parked Finance/P1 work without a new decision.
