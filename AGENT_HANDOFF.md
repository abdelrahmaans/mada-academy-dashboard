# Mada Academy — Complete Agent Handoff

**Snapshot:** 4 October 2026  
**Verified branch:** `main`  
**Verified commit:** `8b76844` — merged PR #44  
**Repository:** `abdelrahmaans/mada-academy-dashboard`

## 1. Product in one paragraph

Mada Academy is an Arabic-first, RTL academy operating system. It manages academy/branch operations, students, classes, schedules, attendance, evaluations, approvals, finance records, family/student consumer portals, role-based access, and session lifecycle workflows. The main product is the React + Vite frontend backed by an ASP.NET Core API and PostgreSQL persistence. `client-angular/` is a reference/preview implementation, not the primary frontend.

This is an operations and record-keeping system. Finance payment methods such as cash, Visa, InstaPay, and Vodafone Cash represent payments recorded outside the application; the product does not process card or wallet payments.

## 2. Canonical reading order

Read these files before changing code:

1. `PROJECT_STATUS.md` — current role-by-role truth and known gaps.
2. `NEXT_PHASE_PLAN.md` — current priority, dependencies, and acceptance criteria.
3. `DOCUMENTATION_INDEX.md` — complete documentation map and source-of-truth rules.
4. `UI_FLOW_REVIEW_STATUS.md` — route, auth, role isolation, styling, and E2E review.
5. `PRE_PRODUCTION_RUNBOOK.md` — local/staging/production preparation procedure.
6. `CONSUMER_FINAL_ACCEPTANCE.md` and `CONSUMER_STAGING_SMOKE_TEST.md` — R08/R09 acceptance.
7. `FINANCE_RELEASE_GATE.md` and `INVOICES_PAYMENTS_MVP_PLAN.md` — Finance scope and release gate.
8. `MADA_MASTER.md` — chronological delivery history; historical entries are not automatically current truth.
9. `BACKEND_STATUS.md` and `backend/DATABASE_STATUS.md` — backend/persistence status.
10. Backend contracts under `backend/*_CONTRACT.md` — intended API behavior.

## 3. Architecture

```text
React/Vite client (client/src)
        |
        | VITE_API_URL / local API default
        v
ASP.NET Core API (backend/MadaAcademy.Api)
        |
        v
PostgreSQL + EF Core migrations / seed

server/ is a small local/server scaffold used by the Vite application environment;
it is not a replacement for the ASP.NET production API.
```

### Frontend entry points

- `client/src/main.tsx` — React bootstrap, providers, global styles, optional analytics.
- `client/src/App.tsx` — route table, route guards, lazy pages, API error feedback.
- `client/src/contexts/AuthContext.tsx` — session loading, login, logout, `/me` refresh.
- `client/src/lib/apiClient.ts` — API contracts, tokens, interceptors, request behavior.
- `client/src/components/ProtectedRoute.tsx` — client route guard; backend authorization remains authoritative.
- `client/src/components/MadaTheme.css` — shared visual tokens and global theme convergence.
- `client/src/styles/role-surfaces.css` — shared RTL/responsive surfaces, cards, forms, tables, states.
- `client/src/pages/Login.tsx` + `client/src/pages/Login.css` — current Login design and auth entry.

### Backend entry points

- `backend/MadaAcademy.Api/Program.cs` — application registration, middleware, routes, persistence and seed startup.
- `backend/MadaAcademy.Api/Auth/` — JWT, password hashing, auth contracts, SMS abstraction.
- `backend/MadaAcademy.Api/Modules/` — feature endpoints grouped by domain.
- `backend/MadaAcademy.Api/Persistence/MadaDbContext.cs` — EF Core model and relationships.
- `backend/MadaAcademy.Api/Persistence/Entities/` — persisted domain entities.
- `backend/MadaAcademy.Api/Persistence/Migrations/` — database migrations.
- `backend/MadaAcademy.Api/Storage/` — private object storage abstraction and Supabase implementation.
- `backend/MadaAcademy.Api.IntegrationTests/` — API/integration/authorization tests.

## 4. Roles and default destinations

| Code | Role | Frontend destination | Scope |
|---|---|---|---|
| R00 | Platform Admin | `/platform-console` | Platform-wide |
| R01 | Academy Owner | `/executive-dashboard` | Academy/tenant |
| R02 | Branch Manager | `/` | Branch |
| R03 | Head Instructors | `/head-instructors` | Branch/team |
| R04 | Instructor | `/instructor-desk` | Assigned sessions/students |
| R05 | Secretary | `/secretary-desk` | Branch and scoped operations |
| R06 | Accountant | `/finance-desk` | Branch finance |
| R07 | Media/Marketing Manager | `/marketing-desk` | Branch marketing; not fully live |
| R08 | Parent/Guardian | `/family-portal` | Linked children only |
| R09 | Student | `/student-portal` | Own account/student link |

The role-to-home mapping is in `client/src/pages/Login.tsx`. The route table and role guards are in `client/src/App.tsx`. Never treat frontend navigation as a security boundary: backend authorization and tenant/branch/link checks are mandatory.

## 5. Important product rules

- Arabic-first labels and RTL layout must be preserved.
- Use existing Mada theme tokens before adding new colors or visual systems.
- Backend identity determines tenant, branch, role, permissions, and consumer links.
- Never trust a client-supplied UUID as proof of access.
- Every referenced student, enrollment, invoice, payment, evaluation, session, and file must be checked against the authenticated scope.
- R08/R09 can read evaluation scores/notes only after publication.
- LIVE screens must not silently display demo finance, student, attendance, or evaluation data.
- Marketing is still partially local/preview and must not be described as fully LIVE.
- Production storage/secrets, deployed staging smoke, backup/restore, SMS delivery, and password recovery remain release concerns unless the status files say otherwise.
- Never commit real secrets, service-role keys, real passwords, OTPs, tokens, payment evidence, generated runtime files, or `.env` files.

## 6. Current verified baseline

The current `main` includes:

- PR #41: route guards, role isolation, live/demo hardening, shared role surfaces, Academy Bootstrap styling, and route/logout E2E.
- PR #42: optional analytics loading and expense evidence filename preservation.
- PR #43: documentation source-of-truth cleanup and documentation index.
- PR #44: complete responsive Login visual system and accessibility improvements.

Verified locally before PR #44:

```bash
pnpm check
pnpm test                 # 13/13
pnpm build
git diff --check
```

Verified in GitHub for PR #44: **4/4 checks passed**, including frontend checks and deployment previews.

The existing browser E2E suite is in `e2e/critical-flows.spec.ts` and covers Finance mutations, consumer flows, anonymous redirect, role isolation, and logout. Run it with `pnpm e2e` when the local API and Vite prerequisites are available.

## 7. Local setup

### Frontend

```bash
pnpm install
cp .env.example .env.local   # only if local overrides are needed
pnpm dev --host 0.0.0.0 --port 5173
```

The frontend uses `VITE_API_URL`. Do not put server-only secrets in Vite environment variables.

### Backend

Requirements: .NET SDK matching `backend/global.json`, PostgreSQL 16 for PostgreSQL integration, and a disposable test database for tests.

```bash
export DOTNET_ROOT=/home/ubuntu/.dotnet
export PATH=/home/ubuntu/.dotnet:/home/ubuntu/.dotnet/tools:$PATH
dotnet restore backend/MadaAcademy.sln
dotnet build backend/MadaAcademy.sln --configuration Release
dotnet test backend/MadaAcademy.sln --configuration Release
```

For database setup and migrations, read `backend/DATABASE_STATUS.md` and use:

```bash
backend/scripts/apply-migrations.sh
backend/scripts/seed-demo.sh
```

Both require `DATABASE_URL`; neither embeds production secrets.

### Full validation

```bash
pnpm check
pnpm test
pnpm build
pnpm e2e
export DOTNET_ROOT=/home/ubuntu/.dotnet
export PATH=/home/ubuntu/.dotnet:/home/ubuntu/.dotnet/tools:$PATH
dotnet test backend/MadaAcademy.sln --configuration Release
git diff --check
```

Do not point integration tests at the academy's production or shared working database.

## 8. What is complete vs not complete

### Implemented vertical slices

- Password/JWT authentication, refresh rotation, logout, and `/me`.
- Role/permission and tenant/branch isolation for implemented domains.
- Students, sessions, classes, schedules, attendance, evaluations, review/publication workflow, approvals, and operational reports.
- Finance invoices, recorded payments, expenses, reports, correction flows, and evidence contract at the API/UI level.
- Linked family/student reads for sessions, published evaluations, and invoices.
- Shared role styling, Login styling, route guards, error/loading/empty/forbidden states, and local browser E2E.

### Explicit open or limited areas

- R07 Marketing campaign/lead operations are not fully backed by live APIs.
- Some legacy/demo pages remain in the source and must not be confused with LIVE routes.
- Finance mutation pending/disabled states can still be refined further.
- Production private storage configuration and server-only Supabase secret deployment are not part of this source package.
- Production secrets, deployed staging smoke, backup/restore, real SMS provider, and password recovery need separate release decisions.

## 9. Safe workflow for a new Agent

1. Clone the repository and read this file plus `PROJECT_STATUS.md` and `NEXT_PHASE_PLAN.md`.
2. Confirm the current branch is based on `main`; fetch latest origin.
3. Inspect the relevant contract, endpoint, entity, frontend client, page, and test before editing.
4. Preserve Arabic/RTL and the existing visual tokens.
5. Add or update tests for every behavior change, especially scope and role isolation.
6. Run frontend and backend validation before opening a PR.
7. Update `PROJECT_STATUS.md` and `NEXT_PHASE_PLAN.md` when current truth or next actions change.
8. Append delivery history to `MADA_MASTER.md`; do not rewrite old history as if it were current.
9. Open a focused feature/fix/docs branch and PR against `main`.
10. Never claim a surface is LIVE based only on a page rendering; require API-backed evidence and tests.

## 10. Files to send to another Agent

### Preferred option

Send the entire Git repository through GitHub by giving the Agent:

```text
gh repo clone abdelrahmaans/mada-academy-dashboard
```

Then tell it to read `AGENT_HANDOFF.md` first.

### If sending a ZIP

Include all tracked source and documentation files, especially:

- `AGENT_HANDOFF.md`, `AGENT_START_HERE.md`, `DOCUMENTATION_INDEX.md`.
- `PROJECT_STATUS.md`, `NEXT_PHASE_PLAN.md`, `UI_FLOW_REVIEW_STATUS.md`, `PRE_PRODUCTION_RUNBOOK.md`.
- `FINANCE_RELEASE_GATE.md`, `INVOICES_PAYMENTS_MVP_PLAN.md`, consumer acceptance files, and `OTP_MVP_TEMPORARY_PLAN.md`.
- `backend/` source, migrations, contracts, tests, `Dockerfile`, and example env files.
- `client/`, `server/`, `shared/`, `e2e/`, `scripts/`, `.github/workflows/`, and root config/lock files.

Do **not** include:

- `node_modules/`, `.pnpm-store/`, `dist/`, `build/`, `coverage/`.
- `backend/**/bin/`, `backend/**/obj/`, `test-results/`, `playwright-report/`.
- `.env`, `.env.local`, `.env.production.local`, database dumps, logs, browser/session artifacts.
- Any real Supabase key, JWT secret, password, OTP, token, payment evidence, or private storage file.

The committed `.env.example`, `backend/.env.example`, and `backend/.env.production.example` are safe templates and are the only environment files to share.
