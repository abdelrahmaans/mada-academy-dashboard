# Mada Academy — Project Status

**As of:** 8 October 2026
**Verified Git state:** `main` at `c2d9954` includes PR #88, the live-shell/Leads updates, Railway/Render/Docker/staging-smoke configuration, and the merged Angular R06 Finance slices; it is pushed to origin.
**Latest delivery PRs:** [PR #89 — R06-A Finance read parity](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/89) and [PR #90 — R06-B Finance mutations/evidence](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/90) are merged successfully with passing CI.
**Stack:** React + Vite + TypeScript; ASP.NET Core 10; EF Core; PostgreSQL 16; JWT access/refresh sessions.

## Parallel Angular client — foundation and shared UI (non-LIVE)

An isolated `client-angular/` workspace has Angular 21.2, standalone routing, strict TypeScript, SCSS, Vitest, and zoneless change detection. In addition to shared UI and the auth shell (`/login`, `/workspace`), it now contains accepted LIVE-parity slices for R02, R03, R04, R05, R06 Finance, R08 (`/family-portal`), and R09 (`/student-portal`). R06 covers scoped reads, invoice/payment/expense mutations, payment evidence, single-flight protection, and Angular R06 E2E coverage. R08 and R09 enforce linked/self scope through backend contracts, expose published evaluations only, and keep LIVE states separate from DEMO fallback. Backend authorization and scope remain authoritative; Angular is not a full replacement for React. Production storage/staging gates remain separate. The final route-by-role closure record is [`ANGULAR_PARITY_MATRIX.md`](../ANGULAR_PARITY_MATRIX.md); architecture and security boundaries are in [`ANGULAR_FRONTEND_GUIDE.md`](../ANGULAR_FRONTEND_GUIDE.md).

## Executive summary

Mada has moved beyond a static prototype: authentication, scoped operational APIs, consumer account links, session/evaluation workflows, finance APIs, and operational reports are persisted and tested. The **Finance code/local acceptance slice is complete**; production readiness still requires private-storage secret injection, authenticated storage smoke test, durable backup/restore evidence, and deployed staging acceptance. Production SMS is intentionally unconfigured and password recovery is missing.

## Role-by-role state

| Role | What is implemented | Important gaps / truth to preserve |
|---|---|---|
| **R00 Platform Admin** | Live platform support inventory is documented in [R00_PLATFORM_ADMIN_INVENTORY.md](../docs/R00_PLATFORM_ADMIN_INVENTORY.md): overview, academy list/bootstrap, status support, masked member search, membership/session support, roles, and tenant/platform audit reads. Backend policy, tenant-paired lookups, reason requirements, audit writes, explicit response-shape privacy assertions, and LIVE no-demo behavior are implemented and tested. Bootstrap contract is aligned with password-based owner onboarding, and unsupported archive permission advertisement was removed. | Full platform administration is not supported: archive/delete, billing, and detailed student/finance/consumer support remain unavailable. |
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

The current merged baseline includes PR #88 for Angular R08 plus PRs #89 and #90 for Angular Finance R06. Their CI passed the relevant Angular Playwright, critical Playwright, Frontend Checks, and Vercel checks. R06/R08/R09 acceptance covers scoped access, published evaluations where applicable, partial failures, and no-Demo LIVE behavior. No real deployment secrets are stored in Git.

## LIVE acceptance evidence — 4 October 2026

The auditable R01/R03/R04 endpoint, role/scope, failure, empty-state, and preview-boundary checklist is maintained in [LIVE_ACCEPTANCE_EVIDENCE.md](../docs/LIVE_ACCEPTANCE_EVIDENCE.md). It documents local evidence only; staging and production acceptance are separate gates.

## UI / Flow / Architecture review — 4 October 2026

تمت مراجعة R00–R09. أُضيفت route guards صريحة حسب الدور، حماية للـworkspace والأسطح التشغيلية، فصل LIVE/DEMO في الأغلفة الحية، stylesheet مشترك RTL/responsive، تصميم Academy Bootstrap، وE2E للـanonymous redirect والعزل والخروج.

- `pnpm check`: PASS
- `pnpm test`: PASS — 24/24 in the current frontend suite
- `pnpm build`: PASS
- الجولة الأولى من E2E: 6/7، وتم تعديل assertion العزل لقبول الرفض الصريح أو العودة الآمنة إلى login.
- Marketing ما زال Preview/local ويحتاج API قبل اعتباره LIVE.
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
- PostgreSQL coverage is separate from the InMemory E2E path. CI backend integration coverage is required for persistence-specific regressions; local sandbox runs without the .NET SDK cannot reproduce those tests.
