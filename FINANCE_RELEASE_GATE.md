# Finance Vertical Slice — Release Gate

**PR:** Finance Vertical Slice — Production Readiness & UI Contract Hardening

## Scope

This gate covers the existing Finance/Operations vertical slice. It does not authorize new OTP, marketing, or dashboard work.

## Required checks

- [x] Payment methods are constrained to `CASH`, `VISA`, `INSTAPAY`, and `VODAFONE_CASH`.
- [x] Live `FinanceDesk` sends the selected method, `receivedOn`, and an external reference for InstaPay/Vodafone Cash.
- [x] Payment and evidence states are explicit: recorded, evidence attached, or evidence not attached.
- [x] `/finance` redirects to `/finance-desk`; the old demo page is not an operational finance route.
- [x] R05/R06 authorization is narrow and server-side; no `finance.write` permission is present.
- [x] Tenant, branch, and consumer-link isolation tests exist for financial reads/evidence.
- [x] Payment append-only and over-collection/concurrency protection are covered by the finance test suite.
- [x] PostgreSQL migration/model checks are required in CI before merge.
- [x] Frontend `pnpm check`, Vitest, and production build pass locally.
- [x] Production runtime fail-closes evidence uploads with HTTP 503 when durable storage is not configured.
- [x] Created private Supabase bucket `private-evidence` in project `mada-software` (`wooivgjevouoybibxsao`), with private ACL, 10 MiB limit, and PDF/JPG/PNG MIME allow-list.
- [ ] Configure backend secrets and run an authenticated upload/download smoke test against the bucket.
- [ ] Real staging smoke test against the deployed API and frontend.
- [ ] PostgreSQL integration suite in the current execution environment (requires the .NET SDK and PostgreSQL service).

## Verification completed locally — 3 October 2026

- [x] Finance and invoice-correction InMemory integration tests: **11/11**.
- [x] Frontend `pnpm check`, Vitest, and production build pass.
- [x] Browser E2E with Chromium: **3/3** — R06 FinanceDesk LIVE surface, R08 Family Portal linked scope, and R09 Student Portal self-scope.
- [x] Expanded Finance browser/API E2E: invoice creation, payment recording, over-collection rejection, and local evidence upload/download.
- [x] Local API preflight with seeded InMemory data: health, password login, linked-student scope, and published evaluation visibility.
- [x] Production preparation: `backend/Dockerfile`, `backend/.env.production.example`, `scripts/staging-smoke.sh`, and `PRE_PRODUCTION_RUNBOOK.md`.

These checks close the **code and local acceptance** portion of the Finance MVP. They do not close production evidence storage, backup/restore, or deployed staging acceptance. The current automated browser/API suite is **4/4 passed**.

## Storage and deployment decision

`LocalPrivateObjectStorage` is private-path storage, not a production durability guarantee. It must not be used for real evidence data unless the hosting environment explicitly guarantees persistent disk, backup, restore, access control, and monitoring.

Until that evidence is recorded for the target deployment, production now **fails closed and returns HTTP 503 for real evidence uploads**. The preferred production target is a private S3-compatible object store; this PR includes an optional Supabase Storage adapter selected by `MADA_PRIVATE_STORAGE_MODE=supabase`, with the following requirements:

- private bucket/container and no public object URLs;
- server-side encryption and least-privilege credentials;
- tenant/branch-scoped download authorization through the API;
- retention and deletion policy;
- automated backup and a tested restore procedure;
- documented environment variables/secrets and rotation procedure.

The deployment handoff must name the selected storage backend, persistence/backup guarantees, migration command, health check URL, API/frontend origins, and staging smoke-test result before Finance is marked production-ready.


## Current Supabase target

The selected project is `mada-software` with API URL `https://wooivgjevouoybibxsao.supabase.co`. The bucket `private-evidence` is private and has been created. The current project phase is **testing**. The remaining deployment step is to inject `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret and run the backend storage smoke test; the key must never be committed or exposed to the frontend. Manual backups by the owner are accepted temporarily during testing, but this does not close the production backup gate.


### Backup blocker

The connected Supabase organization is currently on the **Free** plan. Supabase documents that automatic database backups are not included on Free, and database backups do not include files stored through the Storage API. Therefore the private bucket is correctly configured for access control, but Finance cannot be marked fully production-ready until the team either upgrades the Supabase plan and separately implements Storage object backup, or exports/copies the private objects to an independent durable backup target on a defined schedule.
