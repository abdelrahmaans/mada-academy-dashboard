# Mada Academy — Project Status

**As of:** 3 October 2026
**Verified Git state:** `main` at `bc01cb3`, pushed to origin after PR #37 merge.
**Latest delivery PR:** [PR #37 — enable local consumer smoke run](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/37), merged with all required checks successful.
**Stack:** React + Vite + TypeScript (primary UI); ASP.NET Core 10; EF Core; PostgreSQL 16; JWT access/refresh sessions. Angular is a reference preview only.

## Executive summary

Mada has moved beyond a static prototype: authentication, scoped operational APIs, consumer account links, session/evaluation workflows, finance APIs, and operational reports are persisted and tested. The **Finance code/local acceptance slice is complete**; production readiness still requires private-storage secret injection, authenticated storage smoke test, durable backup/restore evidence, and deployed staging acceptance. Production SMS is intentionally unconfigured and password recovery is missing.

## Role-by-role state

| Role | What is implemented | Important gaps / truth to preserve |
|---|---|---|
| **R00 Platform Admin** | Platform shell/navigation exists; live console preserves available overview/academy/role data when one read endpoint fails and gives toast feedback for refresh and load/support failures. | Full platform administration and support workflows are not demonstrated as complete live APIs. |
| **R01 Academy Owner** | Academy bootstrap, tenant-level identity/member/role, branch and classroom foundations exist; LIVE route is guarded from the old demo page, academy roles preserve members/permissions when branch lookup fails, classroom/resource management preserves useful data on partial failures, the executive dashboard gives toast/error feedback for report and audit loading, and the global interceptor now covers 401, 403, and 5xx with automated tests. | Executive/reporting surfaces still need final acceptance evidence. |
| **R02 Branch Manager** | Branch-scoped student/session/classroom and approval operations are available across implemented backend slices; `/branch-operations` now routes authenticated R02 users to the live dashboard instead of the legacy demo, and approvals/classes/schedule remain visible when optional endpoints are forbidden. | Some non-core branch panels remain outside the current P2 slice. |
| **R03 Head Instructors** | Branch-scoped evaluation review queue; publish or request changes; dashboard avoids demo evaluation samples in LIVE evaluation surfaces, keeps core team/group/session data visible when optional endpoints fail, and preserves groups or sessions when one Academic Programs read fails. | Other overview/team indicators may still be preview/demo data. |
| **R04 Instructor** | Assigned sessions, attendance, evaluation drafts/submission, and relevant workflow actions are connected to APIs. | Broader instructor analytics and non-core surfaces are not all live. |
| **R05 Secretary** | Student workflows, phone-based consumer lookup/linking, consumer invitations, and scoped invoice/payment operations exist; legacy Secretary route is guarded from LIVE sessions. | Production evidence/storage and deployed staging remain open; no broad `finance.write`. |
| **R06 Accountant** | FinanceDesk is connected to scoped invoice/payment/expense/report APIs with role-aware loading, forbidden, and error states; local browser E2E passes. | Production evidence/storage and deployed staging remain open. |
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

At PR #37, all four GitHub checks passed, including PostgreSQL/backend integration and both frontend deployments. The backend suite passed **70/70** in CI; local frontend validation passed Vitest, `pnpm check`, `pnpm build`, and `git diff --check`. Local Finance and invoice-correction tests pass **11/11**; local InMemory backend tests pass **54/54**; browser E2E passes **3/3** for R06/R08/R09 using Chromium. The local API preflight verified linked scope and published score `88`.

## OTP status

- `DevelopmentSmsMessageSender` is registered only in ASP.NET Development and generates a random code for development/test use.
- Non-Development currently uses `UnconfiguredSmsMessageSender` and fails closed; there is no live SMS. **Do not set production to Development** and do not use a universal fixed OTP.
- User permits a temporary no-cost solution. A restricted staff-assisted pilot is proposed in [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md), but is not implemented or enabled.
- Password recovery is not implemented.

## Next milestone and open issues

The P1/P2 consumer acceptance and Finance local acceptance are complete. The next phase is production-readiness evidence: configure the server-only Supabase key, run authenticated private-bucket upload/download smoke, define durable object backup/restore, and run deployed API/frontend staging acceptance. The finance design and release gates remain documented in [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md) and [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).

Open implementation blockers and product debt:

1. Finance production evidence deployment remains gated on backend secrets, authenticated staging upload/download smoke test, and durable backup evidence; see [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).
3. Invoice cancellation/correction/refund and expanded financial workflows remain outside the current slice and must not be implied as supported.
4. Production SMS provider and password recovery are later identity work; interim OTP mode remains opt-in, limited, audited, and never a hard-coded/shared code.
5. Run [CONSUMER_STAGING_SMOKE_TEST.md](CONSUMER_STAGING_SMOKE_TEST.md) against a controlled non-production API when deployment is authorized; local E2E is already automated in `e2e/critical-flows.spec.ts`.
