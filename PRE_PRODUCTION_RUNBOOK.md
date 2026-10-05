# Mada Academy — Pre-production Runbook

**Purpose:** close the remaining deployment gates without putting secrets in Git or the browser.

## 1. Build and run the API

The repository now includes `backend/Dockerfile` for the ASP.NET API. The container listens on port `8080` and exposes:

```text
GET /api/v1/health
```

Use PostgreSQL for staging/production. Do not set `MADA_DATABASE_MODE=memory` outside local tests.

## 2. Required API environment

Start from [backend/.env.production.example](backend/.env.production.example) and configure these in the hosting provider's secret manager:

- `ASPNETCORE_ENVIRONMENT=Production`
- `MADA_FRONTEND_URL=https://<frontend-host>`
- `DATABASE_URL`
- `MADA_JWT_SIGNING_KEY` — random, at least 32 characters
- `MADA_PRIVATE_STORAGE_MODE=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never `VITE_*`, never committed
- `SUPABASE_STORAGE_BUCKET=private-evidence`

The frontend receives only `VITE_API_URL`. It must never receive the Supabase service-role key.

## 2.1 Rate-limit topology gate

The current rate limiter is in-memory and supports one API instance only. Configure the API host with:

```text
MADA_RATE_LIMIT_MODE=single-instance
MADA_RATE_LIMIT_EXPECTED_INSTANCES=1
```

The API fails during startup if production declares distributed mode or more than one expected instance. Do not horizontally scale until the evidence and future requirements in [DISTRIBUTED_RATE_LIMIT_DECISION.md](DISTRIBUTED_RATE_LIMIT_DECISION.md) are complete.

## 3. Storage and database gate

Before real evidence is accepted:

1. Confirm the `private-evidence` bucket is private.
2. Confirm PDF/JPG/PNG and 10 MiB limits.
3. Run authenticated upload and download using a staff account.
4. Confirm an unrelated branch/consumer receives 404/403 and no public object URL exists.
5. Define object retention and an independent backup/export schedule.
6. Perform and record one restore test.
7. Run the PostgreSQL migration and integration suite against the target database.

Until this passes, the API must remain fail-closed for real evidence uploads.

## 4. Staging smoke

Run the repository script against the deployed API:

```bash
API_BASE_URL=https://<api-host>/api/v1 \
STAFF_PHONE='<staging staff phone>' \
STAFF_PASSWORD='<staging staff password>' \
PARENT_PHONE='<staging parent phone>' \
PARENT_PASSWORD='<staging parent password>' \
./scripts/staging-smoke.sh
```

The script checks health, staff login, `/me`, staff finance invoices, and optionally linked parent invoices. It does not print credentials or tokens.

## 5. Frontend acceptance

Set `VITE_API_URL=https://<api-host>/api/v1`, deploy the frontend, and run:

```bash
pnpm check
pnpm test
pnpm build
pnpm e2e
```

The local E2E suite covers:

- R06 FinanceDesk LIVE state.
- R06 invoice creation, payment, over-collection rejection, and evidence upload/download.
- R08 linked-child finance scope.
- R09 student self-scope.

## 6. Release decision

Mark the MVP **production-ready** only when all of these are recorded in `FINANCE_RELEASE_GATE.md`:

- API deployed with PostgreSQL.
- Server-only secrets configured.
- Private evidence upload/download smoke passed.
- Backup and restore test passed.
- Staging smoke passed.
- Frontend points to the deployed API.
- No Demo fallback is visible in authenticated LIVE routes.

Still outside this MVP: real payment processing, official tax invoicing, password recovery, and production SMS delivery.
