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
- [ ] Configure and smoke-test a real Supabase private bucket (or another S3-compatible provider) in staging.
- [ ] Real staging smoke test against the deployed API and frontend.
- [ ] PostgreSQL integration suite in the current execution environment (requires the .NET SDK and PostgreSQL service).

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
