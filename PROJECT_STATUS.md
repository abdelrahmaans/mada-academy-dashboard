# Mada Academy — Project Status

**As of:** 4 October 2026
**Verified Git state:** `main` includes PR #46 and is pushed to origin.
**Latest delivery PR:** [PR #46 — CI, security safeguards, and legacy cleanup](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/46), merged successfully.
**Stack:** React + Vite + TypeScript; ASP.NET Core 10; EF Core; PostgreSQL 16; JWT access/refresh sessions.

## Executive summary

Mada has moved beyond a static prototype: authentication, scoped operational APIs, consumer account links, session/evaluation workflows, finance APIs, and operational reports are persisted and tested. The **Finance code/local acceptance slice is complete**; production readiness still requires private-storage secret injection, authenticated storage smoke test, durable backup/restore evidence, and deployed staging acceptance. Production SMS is intentionally unconfigured and password recovery is missing.

## Role-by-role state

| Role | What is implemented | Important gaps / truth to preserve |
|---|---|---|
| **R00 Platform Admin** | Platform shell/navigation exists; live console preserves available overview/academy/role data when one read endpoint fails and gives toast feedback for refresh and load/support failures. | Full platform administration and support workflows are not demonstrated as complete live APIs. |
| **R01 Academy Owner** | Academy bootstrap, tenant-level identity/member/role, branch and classroom foundations exist; LIVE route is guarded from the old demo page, academy roles preserve members/permissions when branch lookup fails, classroom/resource management preserves useful data on partial failures, the executive dashboard gives toast/error feedback for report and audit loading, and the global interceptor now covers 401, 403, and 5xx with automated tests. | Local acceptance evidence is documented; deployed staging acceptance remains open. |
| **R02 Branch Manager** | Branch-scoped student/session/classroom and approval operations are available across implemented backend slices; `/branch-operations` now routes authenticated R02 users to the live dashboard instead of the legacy demo, and approvals/classes/schedule remain visible when optional endpoints are forbidden. | Some non-core branch panels remain outside the current P2 slice. |
| **R03 Head Instructors** | Branch-scoped evaluation review queue; publish or request changes; dashboard avoids demo evaluation samples in LIVE evaluation surfaces, keeps core team/group/session data visible when optional endpoints fail, and preserves groups or sessions when one Academic Programs read fails. | Unsupported mastery/checkpoint analytics remain explicitly outside the LIVE contract. |
| **R04 Instructor** | Assigned sessions, attendance, evaluation drafts/submission, and relevant workflow actions are connected to APIs; loading/error/retry behavior is separated from unsupported analytics. | Broader instructor analytics and non-core surfaces are not all live. |
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

The current merged baseline includes PR #41 (UI/flow hardening), PR #42 (optional analytics and evidence filename fix), and PR #46 (CI/security/legacy cleanup). Local frontend validation is green: Vitest **18/18**, `pnpm check`, `pnpm build`, `git diff --check`, and browser E2E **7/7** using Chromium. Backend CI and integration evidence are recorded in the GitHub checks and backend integration-test suite; no real deployment secrets are stored in Git.

## LIVE acceptance evidence — 4 October 2026

The auditable R01/R03/R04 endpoint, role/scope, failure, empty-state, and preview-boundary checklist is maintained in [LIVE_ACCEPTANCE_EVIDENCE.md](LIVE_ACCEPTANCE_EVIDENCE.md). It documents local evidence only; staging and production acceptance are separate gates.

## UI / Flow / Architecture review — 4 October 2026

تمت مراجعة R00–R09. أُضيفت route guards صريحة حسب الدور، حماية للـworkspace والأسطح التشغيلية، فصل LIVE/DEMO في الأغلفة الحية، stylesheet مشترك RTL/responsive، تصميم Academy Bootstrap، وE2E للـanonymous redirect والعزل والخروج.

- `pnpm check`: PASS
- `pnpm test`: PASS — 18/18 in the current frontend suite
- `pnpm build`: PASS
- الجولة الأولى من E2E: 6/7، وتم تعديل assertion العزل لقبول الرفض الصريح أو العودة الآمنة إلى login.
- Marketing ما زال Preview/local ويحتاج API قبل اعتباره LIVE.
- Production storage/secrets/staging/backup-restore وFinance pending states ما زالت مفتوحة.

التفاصيل الكاملة في [UI_FLOW_REVIEW_STATUS.md](UI_FLOW_REVIEW_STATUS.md).

Follow-up fixes prepared after PR #41: analytics is now loaded only when both optional environment values exist, so local builds no longer emit placeholder URL warnings; expense evidence downloads now preserve and use the uploaded/API filename. Full local validation remains green: 18/18 unit tests, build, and 7/7 browser E2E.

## OTP status

- `DevelopmentSmsMessageSender` is registered only in ASP.NET Development and generates a random code for development/test use.
- Non-Development currently uses `UnconfiguredSmsMessageSender` and fails closed; there is no live SMS. **Do not set production to Development** and do not use a universal fixed OTP.
- User permits a temporary no-cost solution. A restricted staff-assisted pilot is proposed in [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md), but is not implemented or enabled.
- Password recovery is not implemented.

## Authentication and proxy security boundaries

- Password login has persisted lockout and an in-memory per-instance IP limiter; OTP, invitation, and consumer phone lookup routes require separate IP-based limits.
- The API must call forwarded-header middleware before rate limiting, and only trusts `X-Forwarded-For`/`X-Forwarded-Proto` from IPs listed in `MADA_TRUSTED_PROXIES`.
- `MADA_TRUSTED_PROXIES` is intentionally unset by default; arbitrary forwarded headers must never be trusted.
- Multi-instance/distributed limiter behavior is not yet production evidence. A shared limiter or documented single-instance constraint is required before horizontal scaling.
- Five failed password attempts can lock a known account for the configured window. This is an explicit availability/security trade-off and requires monitoring and recovery procedures before production.

## Next milestone and open issues

The P1/P2 consumer acceptance and Finance local acceptance are complete. The next phase is production-readiness evidence: deploy the API using [backend/Dockerfile](backend/Dockerfile), configure the server-only Supabase key, run authenticated private-bucket upload/download smoke using [scripts/staging-smoke.sh](scripts/staging-smoke.sh), define durable object backup/restore, and run deployed API/frontend staging acceptance. The complete sequence is in [PRE_PRODUCTION_RUNBOOK.md](PRE_PRODUCTION_RUNBOOK.md); finance design and release gates remain in [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md) and [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).

Open implementation blockers and product debt:

1. Finance production evidence deployment remains gated on backend secrets, authenticated staging upload/download smoke test, and durable backup evidence; see [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md).
2. Invoice cancellation/correction/refund and expanded financial workflows remain outside the current slice and must not be implied as supported.
3. Production SMS provider and password recovery are later identity work; interim OTP mode remains opt-in, limited, audited, and never a hard-coded/shared code.
4. Run [CONSUMER_STAGING_SMOKE_TEST.md](CONSUMER_STAGING_SMOKE_TEST.md) against a controlled non-production API when deployment is authorized; local E2E is already automated in `e2e/critical-flows.spec.ts`.
5. `deploy-pages.yml` publishes a static frontend to GitHub Pages. It is intentionally not a production API deployment; LIVE screens require `VITE_API_URL` to point to an accessible HTTPS API, otherwise the published site is only a preview shell or shows its explicit unavailable/empty states.
6. Large-page decomposition remains incremental. The current open refactor PRs cover Head Instructors, Schedule, Students, Platform Console, Approvals, and Instructor Desk; they are not part of `main` until reviewed and merged.
7. `client/src/components/Map.tsx` and `ManusDialog.tsx` have no operational imports outside their own files in the current source inventory. They remain pending deletion in a separate cleanup PR to avoid mixing legacy removal with behavior/security changes.

## Frontend coverage and architecture debt

- The frontend unit suite currently has 5 test files covering 18 tests; it does not yet provide broad page-level mutation or authorization coverage.
- Finance mutation and consumer scope behavior remain primarily covered by backend integration tests and the critical browser flow; dedicated frontend tests are still a follow-up.
- PostgreSQL coverage is separate from the InMemory E2E path. CI backend integration coverage is required for persistence-specific regressions; local sandbox runs without the .NET SDK cannot reproduce those tests.
