# Mada Academy — Project Status

**As of:** 25 October 2026
**Verified Git state:** branch `fix/dev-readiness-20261024` is pushed and PR [#113](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/113) is open against `dev`, based on `origin/dev` at `de21282` (including the newer billing-meter and waitlist-promotion slices). Backend, frontend, Playwright R08/critical-flow, and Vercel Preview checks passed on code commit `dfe6448`; no staging/production migration or deployment was performed. PR #112 (`feat/dynamic-permissions-engine`) remains historical context for previously delivered permissions/audit/landing work; verify live remote refs before future release actions.
**Current delivery:** the local dev-readiness patch hardens development-only endpoints, aligns EF model/migration state, fixes user-facing false-success behavior, removes unsupported demo-derived data from LIVE R08/R09 surfaces, and extends local regression/CI coverage. The previously delivered dynamic permissions engine, audit trail, and landing redesign remain part of the project baseline.
**Canonical quick snapshot:** [`docs/REPOSITORY_CURRENT_STATE.md`](../docs/REPOSITORY_CURRENT_STATE.md).
**Stack:** React + Vite + TypeScript; ASP.NET Core 10; EF Core; PostgreSQL 16; JWT access/refresh sessions.

## Latest local validation — 25 October 2026

- Backend: **133/133** integration tests passed against a disposable local PostgreSQL database with .NET SDK **10.0.401**; no staging or production database was touched.
- React: **69/69** Vitest tests, `pnpm check`, and `pnpm build` passed.
- Playwright: **19/19** `critical-flows.spec.ts` tests passed, including R08/R09 scoping/empty/error states and the regression that proves failed live freeze APIs neither display seeded localStorage data nor report successful submission.
- Angular: **78/78** unit tests, production build, and **2/2** Angular R08 Playwright tests passed; the R08 E2E now covers both linked siblings and verifies selected-child evaluation isolation. Landing typecheck/build passed.
- `pnpm lint`: **0 errors, 118 warnings** remain repository-wide; `git diff --check` passed.
- Still pending: applying the migration to staging, authenticated staging smoke tests, and backup/restore proof. SMS provider, external backup integration, and distributed rate limiting remain paused while the core is stabilized; these remain release-readiness gates.

**Security follow-up:** [Issue #98 — rotate historical Supabase/PostgreSQL credentials](https://github.com/abdelrahmaans/mada-academy-dashboard/issues/98) tracks provider credential rotation, environment/log audit, optional Git history purge, and re-scanning. The current working tree is sanitized; rotation and history rewriting require explicit account/repository authorization and are not performed automatically.

## Parallel Angular client — foundation and shared UI (non-LIVE)

An isolated `client-angular/` workspace has Angular 21.2, standalone routing, strict TypeScript, SCSS, Vitest, and zoneless change detection. In addition to shared UI and the auth shell (`/login`, `/workspace`), it now contains accepted LIVE-parity slices for R02, R03, R04, R05, R06 Finance, R08 (`/family-portal`), and R09 (`/student-portal`). R06 covers scoped reads, invoice/payment/expense mutations, payment evidence, single-flight protection, and Angular R06 E2E coverage. R08 and R09 enforce linked/self scope through backend contracts, expose published evaluations only, and keep LIVE states separate from DEMO fallback. Backend authorization and scope remain authoritative; Angular is not a full replacement for React. Production storage/staging gates remain separate. The final route-by-role closure record is [`ANGULAR_PARITY_MATRIX.md`](../ANGULAR_PARITY_MATRIX.md); architecture and security boundaries are in [`ANGULAR_FRONTEND_GUIDE.md`](../ANGULAR_FRONTEND_GUIDE.md).

## Executive summary

Mada has moved beyond a static prototype: authentication, scoped operational APIs, consumer account links, session/evaluation workflows, finance APIs, dynamic permissions matrix, granular route guards, enterprise audit trails, and operational reports are persisted and tested. The **Dynamic Permissions and Governance slice is complete**; production readiness requires live staging/Vercel deployment setup, private-storage secret injection, durable backup/restore evidence, and deployed staging acceptance. Production SMS is intentionally unconfigured and password recovery is missing.

## Role-by-role state

| Role | What is implemented | Important gaps / truth to preserve |
|---|---|---|
| **R00 Platform Admin** | Live platform support inventory is documented in [R00_PLATFORM_ADMIN_INVENTORY.md](../docs/R00_PLATFORM_ADMIN_INVENTORY.md): overview, academy list/bootstrap, status support, masked member search, membership/session support, roles, and tenant/platform audit reads. Backend policy, tenant-paired lookups, reason requirements, audit writes, explicit response-shape privacy assertions, and LIVE no-demo behavior are implemented and tested. Bootstrap contract is aligned with password-based owner onboarding, and unsupported archive permission advertisement was removed. | Full platform administration is not supported: archive/delete, billing, and detailed student/finance/consumer support remain unavailable. |
| **R01 Academy Owner** | Academy bootstrap, tenant-level identity/member/role, dynamic permissions engine (role and member overrides with instant session revocation), interactive permissions matrix UI (`AcademyRoles.tsx`), compound indexing and full audit trail endpoint + UI (`AcademyAuditTrail.tsx`), branch and classroom management exist; LIVE routes are guarded, and navigation dynamically adapts to assigned permissions. | Local acceptance evidence is verified; deployed staging acceptance remains open. |
| **R02 Branch Manager** | Branch-scoped student/session/classroom and approval operations are available across implemented backend slices; `/branch-operations` routes authenticated R02 users to the live dashboard, navigation items are filtered by permissions, and approvals/classes/schedule remain visible when optional endpoints are forbidden. | Some non-core branch panels remain outside the current P2 slice. |
| **R03 Head Instructors** | Branch-scoped evaluation review queue; publish or request changes; dashboard avoids demo evaluation samples in LIVE evaluation surfaces, keeps core team/group/session data visible when optional endpoints fail, and preserves groups or sessions when one Academic Programs read fails. | Unsupported mastery/checkpoint analytics remain explicitly outside the LIVE contract. |
| **R04 Instructor** | Assigned sessions, attendance, evaluation drafts/submission, and relevant workflow actions are connected to APIs; loading/error/retry behavior is separated from unsupported analytics. | Broader instructor analytics and non-core surfaces are not all live. |
| **R05 Secretary** | Student workflows, phone-based consumer lookup/linking, consumer invitations, and scoped invoice/payment operations exist; legacy Secretary route is guarded from LIVE sessions. | Production evidence/storage and deployed staging remain open; no broad `finance.write`. |
| **R06 Accountant** | FinanceDesk is connected to scoped invoice/payment/expense/report APIs with role-aware loading, forbidden, and error states; local browser E2E passes. | Production evidence/storage and deployed staging remain open. |
| **R07 Marketing Manager** | Branch-scoped Leads, Campaigns, and Content Items are now modeled as persisted PostgreSQL workflows with status changes and campaign lead/conversion metrics; the React desk uses the shared RoleSidebar and typed API client. | Migration and authenticated staging acceptance remain open; campaign/content publishing is workflow tracking, not direct social-channel publishing. |
| **R08 Guardian** | Real linked children, scoped consumer operational data, published evaluations, and linked invoice reads; LIVE has explicit empty/error states without demo fallback, and invoice failure no longer hides linked children or sessions. | Evidence deployment and any additional finance UX remain outside the active P2 cycle. |
| **R09 Student** | Self-scoped account/student relationship, consumer session data, published evaluations, and explicit LIVE empty/error states without demo fallback; student profile remains visible when session loading fails, with toast and retry feedback. | Broader learning/progress elements remain intentionally limited to persisted session data. |

## Live backend and identity

- JWT authentication supports access/refresh, refresh rotation, logout, and tenant/role/branch claims.
- Dynamic permissions engine supports tenant role overrides and member-level overrides with instant suspension and session revocation.
- Operational APIs cover students, sessions, attendance, scheduling/group generation, approvals, and conflict checks.
- Consumer identity supports phone search and linking for existing accounts, plus invitation/acceptance endpoints for parent/student accounts.
- Invitations use random one-time OTPs, expiry/attempt limits, and hashed/HMAC-protected secret material; the real SMS delivery provider is not configured.
- Evaluation workflow is persisted: `DRAFT` → `SUBMITTED` → `PUBLISHED` or `CHANGES_REQUESTED`; consumers receive score/notes only for published evaluations.
- Strict tenant/branch isolation and consumer-link scoping are covered by integration tests for implemented vertical slices.

## CI and verified baseline

The current baseline is verified with 100% success rate:
- `dotnet test` (InMemory): 109/109 passed (Backend Integration tests).
- `pnpm test`: 64/64 passed (Frontend Vitest tests).
- `pnpm check`: passed (0 TypeScript errors).
- `pnpm lint`: passed (0 errors with ESLint 9 Flat Config).
- `pnpm build`: passed in 5.72s (60% build time reduction via CSS modularization & dead code removal).
- `@mada/landing build`: passed.
No real deployment secrets are stored in Git.

## LIVE acceptance evidence — 13 October 2026

The auditable R01/R03/R04 endpoint, role/scope, failure, empty-state, and preview-boundary checklist is maintained in [LIVE_ACCEPTANCE_EVIDENCE.md](../docs/LIVE_ACCEPTANCE_EVIDENCE.md). It documents local evidence only; staging and production acceptance are separate gates.

## UI / Flow / Architecture review — 13 October 2026

تمت مراجعة R00–R09 والصلاحيات الديناميكية. أُضيفت route guards صريحة حسب الدور والصلاحيات (`permission` و `anyOfPermissions`)، حماية للـworkspace والأسطح التشغيلية، فلترة القوائم الجانبية، شاشة 403 عربية، تمييز الدور الحالي في `WorkspaceHub`، وسجل تدقيق الأكاديمية التفاعلي.

- `pnpm check`: PASS (0 errors)
- `pnpm test`: PASS — 63/63 across 8 frontend test files
- `dotnet test`: PASS — 100/100 backend integration tests
- `pnpm build`: PASS
- `@mada/landing build`: PASS
- Production storage/secrets/staging/backup-restore ما زالت مفتوحة؛ حالات Finance pending وsingle-flight مغطاة في الشريحة المدموجة.

التفاصيل الكاملة في [UI_FLOW_REVIEW_STATUS.md](../docs/UI_FLOW_REVIEW_STATUS.md).

Follow-up fixes prepared after PR #41: analytics is now loaded only when both optional environment values exist, so local builds no longer emit placeholder URL warnings; expense evidence downloads now preserve and use the uploaded/API filename. Full local validation remains green: 18/18 unit tests, build, and 7/7 browser E2E.

## OTP status

- `DevelopmentSmsMessageSender` is registered only in ASP.NET Development and generates a random code for development/test use.
- Non-Development currently uses `UnconfiguredSmsMessageSender` and fails closed; there is no live SMS. **Do not set production to Development** and do not use a universal fixed OTP.
- User permits a temporary no-cost solution. A restricted staff-assisted pilot is proposed in [OTP_MVP_TEMPORARY_PLAN.md](../docs/OTP_MVP_TEMPORARY_PLAN.md), but is not implemented or enabled.
- Password recovery is not implemented.

## Authentication and proxy security boundaries

- Password login has persisted lockout and an in-memory per-instance IP limiter; OTP, invitation, and consumer phone lookup routes require separate IP-based limits.
- The API must call forwarded-header middleware before rate limiting, and only trusts `X-Forwarded-For`/`X-Forwarded-Proto` from IPs listed in `MADA_TRUSTED_PROXIES`.
- `MADA_TRUSTED_PROXIES` is intentionally unset by default; arbitrary forwarded headers must never be trusted.
- The current in-memory limiter now has an explicit single-instance production guard (`MADA_RATE_LIMIT_MODE=single-instance`, `MADA_RATE_LIMIT_EXPECTED_INSTANCES=1`); startup rejects unsupported distributed mode or more than one expected production instance. This is an operational constraint, not distributed evidence. Shared-limiter implementation and two-instance/load evidence remain open before horizontal scaling.
- Five failed password attempts can lock a known account for the configured window. This is an explicit availability/security trade-off and requires monitoring and recovery procedures before production.

## Next milestone and open issues

### Product direction — academy SaaS and enrollment metering

- The product decision is now monthly multi-academy SaaS for children's Programming/Robotics/STEM/Languages academies and similar branch/group/instructor businesses.
- Subscription packaging counts active students, branches, and staff/instructors; guardians and students are not staff seats.
- An active student means a student with an `ACTIVE` enrollment in a current group. Waitlisted, completed, held, historical-only, and marketing-only records do not count.
- Trial uses the academy's real imported data with full product access, then requires an explicit paid conversion; it is not a Demo-data-only trial.
- Group-full conversion now supports `WAITLISTED` enrollment without issuing an enrollment invoice; promotion to `ACTIVE` remains the next implementation slice.
- Waitlist promotion is now implemented through the scoped activation endpoint with capacity re-check and `STUDENT_ENROLLMENT_ACTIVATED` audit evidence; it does not create an invoice yet.
- Executive and operational student metrics now count distinct students with an `ACTIVE` enrollment instead of all student records.
- Bulk Import is now merged through PRs #101–#106. The chain covers student, branch, staff, guardian/link, course-template, group/session, and enrollment CSV Preview + Commit contracts.
- Every merged CSV slice uses tenant/branch scope checks, durable `previewId`/SHA-256 validation, sanitized source-file identity, 24-hour expiry, stale-data recheck, row-level review blocking, idempotent double-commit protection, and audit evidence.
- Staff import is invitation-first: it creates `INVITED` staff and invitation hashes without accepting or storing passwords. Guardian import creates parent accounts and `GuardianStudentLink` records.
- Group import creates `CourseOffering` and generated `AcademySession` rows. Enrollment import evaluates rows in CSV order, assigns `ACTIVE` until capacity, assigns later valid rows `WAITLISTED`, creates no invoices, and rejects capacity/dependency changes at commit.
- Latest merged contracts: [BULK_IMPORT_CONTRACT.md](../backend/BULK_IMPORT_CONTRACT.md), [STAFF_GUARDIAN_BULK_IMPORT_CONTRACT.md](../backend/STAFF_GUARDIAN_BULK_IMPORT_CONTRACT.md), [COURSE_GROUP_BULK_IMPORT_CONTRACT.md](../backend/COURSE_GROUP_BULK_IMPORT_CONTRACT.md), and [ENROLLMENT_BULK_IMPORT_CONTRACT.md](../backend/ENROLLMENT_BULK_IMPORT_CONTRACT.md).
- The living product reference is [BUSINESS_PRODUCT_DIRECTION_2026-10-11.md](../docs/BUSINESS_PRODUCT_DIRECTION_2026-10-11.md).

### Phase 1 authorization contract — completed locally on `chore/phase1-authorization-contracts`

- Resolved the R03 attendance contract: R03 is read-only, limited to active supervision assignments with attendance access; R04 remains limited to assigned/substitute sessions for writes.
- Added integration coverage for assigned R03 read access and denied R03 attendance writes.
- Strengthened R05 finance boundary coverage: R05 may create invoices/payments but never receives generic `finance.write` or accountant-only expense/report permissions.
- Added route-registry contract coverage for role home paths, navigation paths, and finance navigation boundaries.
- Local frontend validation passed: Vitest **58/58**, `pnpm check`, `pnpm build`, and `git diff --check`.
- Historical note: backend integration tests were unavailable at that checkpoint; the current sandbox now has .NET SDK 10.0.401 and the latest PostgreSQL-backed run is 133/133 as recorded above. GitHub checks are still required before merge.

The P1/P2 consumer acceptance, Finance local acceptance, first page-decomposition wave, frontend scope/finance tests, refresh-token reuse test, auth module extraction, R00 follow-ups, and the single-instance limiter guard are complete. Production-readiness evidence remains open: a shared limiter with two-instance/load evidence before horizontal scaling, private-bucket upload/download smoke, durable object backup/restore, and deployed API/frontend staging acceptance.

Open implementation blockers and product debt:

1. Finance production evidence deployment remains gated on backend secrets, authenticated staging upload/download smoke test, and durable backup evidence; see [FINANCE_RELEASE_GATE.md](../docs/FINANCE_RELEASE_GATE.md).
2. Invoice cancellation/correction/refund and expanded financial workflows remain outside the current slice and must not be implied as supported.
3. Production SMS provider and password recovery are later identity work; interim OTP mode remains opt-in, limited, audited, and never a hard-coded/shared code.
4. Run [CONSUMER_STAGING_SMOKE_TEST.md](../docs/CONSUMER_STAGING_SMOKE_TEST.md) against a controlled non-production API when deployment is authorized; local E2E is already automated in `e2e/critical-flows.spec.ts`.
5. `deploy-pages.yml` publishes a static frontend to GitHub Pages. It is intentionally not a production API deployment; LIVE screens require `VITE_API_URL` to point to an accessible HTTPS API, otherwise the published site is only a preview shell or shows its explicit unavailable/empty states.
6. The first decomposition wave is merged for Head Instructors (#55), Schedule (#56), Platform Console (#58), Marketing/legacy cleanup (#62), Classes (#63), and Team (#64). Students (#57), Approvals (#59), and Instructor Desk (#60) were closed because the proposed extraction did not materially reduce the page size; they require a smaller, higher-value split before reopening.
7. `client/src/components/Map.tsx` and `ManusDialog.tsx` were confirmed unused and removed in merged PR #62.
8. PR #69 (refresh-token rotation reuse test) is merged. Backend integration and Playwright passed; the known external Vercel `client-angular` rate-limit failure is not a repository failure.
9. R00 action inventory is documented. Bootstrap contract alignment, explicit negative/edge-case tests, platform response-shape assertions, and removal of the unimplemented `academy.archive` permission are complete.

## Frontend coverage and architecture debt

- The frontend suite and Angular Finance/R08/R09 suites provide the accepted local component, mutation, scope, and browser coverage documented in [ANGULAR_PARITY_MATRIX.md](../ANGULAR_PARITY_MATRIX.md); broad parity beyond the listed routes is intentionally not claimed.
- Production storage, backup/restore, and deployed staging evidence remain separate from local frontend acceptance.
- PostgreSQL coverage is separate from the InMemory E2E path. This branch has a local PostgreSQL-backed result of 133/133; CI backend integration coverage and deployed staging acceptance remain required before merge/release.
