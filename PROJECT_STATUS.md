# Mada Academy — Project Status

**As of:** 1 October 2026
**Verified Git base:** `main` / `origin/main`, commit `92bec875` (`feat: add evaluation review and publication workflow`).
**Latest merged feature:** [PR #18](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/18).
**Stack:** React + Vite + TypeScript (primary UI); ASP.NET Core 10; EF Core; PostgreSQL 16; JWT access/refresh sessions. Angular is a reference preview only.

## Executive summary

Mada has moved beyond a static prototype: authentication, scoped operational APIs, consumer account links, and session/evaluation workflows are persisted and tested. The product is **not fully production-ready end-to-end**: several role dashboards still use demo state, billing has no backend, production SMS is intentionally unconfigured, password recovery is missing, and file uploads/storage for payment evidence do not exist.

## Role-by-role state

| Role | What is implemented | Important gaps / truth to preserve |
|---|---|---|
| **R00 Platform Admin** | Platform shell/navigation exists. | Full platform administration and support workflows are not demonstrated as complete live APIs. |
| **R01 Academy Owner** | Academy bootstrap, tenant-level identity/member/role, branch and classroom foundations exist. | Executive/reporting surfaces are not all proven live; billing visibility policy is still open. |
| **R02 Branch Manager** | Branch-scoped student/session/classroom and approval operations are available across implemented backend slices. | Not every branch-dashboard panel has a live data source; remaining route/API coverage needs an audit. |
| **R03 Head Instructors** | Branch-scoped evaluation review queue; publish or request changes; dashboard avoids demo evaluation samples in LIVE evaluation surfaces. | Other overview/team indicators may still be preview/demo data. |
| **R04 Instructor** | Assigned sessions, attendance, evaluation drafts/submission, and relevant workflow actions are connected to APIs. | Broader instructor analytics and non-core surfaces are not all live. |
| **R05 Secretary** | Student workflows, phone-based consumer lookup/linking, and consumer invitation entry point exist. | No finance permission today. Invoice/payment operations require narrow new permissions, not blanket `finance.write`. |
| **R06 Accountant** | Finance/FinanceDesk screens and role shell exist. | Screens are prototype/demo state; there are no persisted invoice/payment APIs, no real receipt upload, and reports/expenses remain unbacked. |
| **R07 Marketing Manager** | Branch scope is aligned in navigation metadata and copy. | Marketing campaign/lead operations are not all backed by live APIs. |
| **R08 Guardian** | Real linked children and scoped consumer operational data; only published evaluations may be returned. | No family invoice/payment API yet. LIVE hides demo financial amounts rather than exposing them. |
| **R09 Student** | Self-scoped account/student relationship and consumer session data; published evaluations only. | No student invoice/payment API; broader learning/progress elements need individual LIVE/demo audit. |

## Live backend and identity

- JWT authentication supports access/refresh, refresh rotation, logout, and tenant/role/branch claims.
- Operational APIs cover students, sessions, attendance, scheduling/group generation, approvals, and conflict checks.
- Consumer identity supports phone search and linking for existing accounts, plus invitation/acceptance endpoints for parent/student accounts.
- Invitations use random one-time OTPs, expiry/attempt limits, and hashed/HMAC-protected secret material; the real SMS delivery provider is not configured.
- Evaluation workflow is persisted: `DRAFT` → `SUBMITTED` → `PUBLISHED` or `CHANGES_REQUESTED`; consumers receive score/notes only for published evaluations.
- Strict tenant/branch isolation and consumer-link scoping are covered by integration tests for implemented vertical slices.

## CI and verified baseline

At PR #18 merge, all GitHub checks passed. Latest recorded local validation: backend integration suite **29/29** on PostgreSQL 16 + InMemory, Vitest **5/5**, `pnpm check`, `pnpm build`, EF pending-model check, and `git diff --check` passed. CI workflows cover backend/PostgreSQL and frontend checks.

## OTP status

- `DevelopmentSmsMessageSender` is registered only in ASP.NET Development and generates a random code for development/test use.
- Non-Development currently uses `UnconfiguredSmsMessageSender` and fails closed; there is no live SMS. **Do not set production to Development** and do not use a universal fixed OTP.
- User permits a temporary no-cost solution. A restricted staff-assisted pilot is proposed in [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md), but is not implemented or enabled.
- Password recovery is not implemented.

## Next milestone and open issues

The next priority is the finance vertical slice described in [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md): issue student invoices, record payments by cash/Visa/InstaPay/Vodafone Cash, attach private evidence when available, and expose only linked students' data to Family/Student portals.

Open implementation blockers and product debt:

1. No `Invoice`, `PaymentTransaction`, or payment-evidence persistence/API exists.
2. R05 has no financial permissions; define narrow invoice/payment permissions and map them in both backend and UI.
3. No secure, durable, private file-storage implementation exists. Evidence filenames in prototypes are not uploads.
4. Define the hosting-compatible storage target before enabling real evidence uploads; never use public links or ephemeral disk.
5. Family Portal currently has no live billing endpoint; preserve the demo-data guard.
6. Decide whether R01/R02 get read-only financial oversight; current proposal is R01 tenant read-only, R02 branch read-only, no posting rights.
7. Invoice cancellation/correction/refund and expense workflows remain outside the first finance slice and must not be implied as supported.
8. Production SMS provider and password recovery are later identity work; interim OTP mode must remain opt-in, limited, audited, and never a hard-coded/shared code.
9. Continue auditing remaining dashboard routes and demo fallbacks so UI navigation does not imply authorization or live persistence.
