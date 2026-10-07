# Mada Academy — Agent Context

**Current baseline:** `main` at `7377df2` (4 October 2026)
**Repository:** `abdelrahmaans/mada-academy-dashboard`

## What this product is

Mada Academy is an Arabic-first, RTL academy operations system. It covers academy/branch setup, students, classes, schedules, attendance, evaluations, approvals, recorded finance transactions, and linked family/student portals.

The primary stack is:

- **Frontend:** React + Vite in `client/`
- **Backend:** ASP.NET Core in `backend/MadaAcademy.Api/`
- **Database:** PostgreSQL + EF Core migrations
- **Tests:** Vitest, Playwright, and ASP.NET integration tests

## Read this before coding

1. `PROJECT_STATUS.md` — current product truth and known gaps.
2. `NEXT_PHASE_PLAN.md` — current priorities and acceptance criteria.
3. `../docs/UI_FLOW_REVIEW_STATUS.md` — current route/style/live-demo boundaries.
4. `../docs/PRE_PRODUCTION_RUNBOOK.md` — environment and release procedure.
5. `backend/README.md` and `backend/DATABASE_STATUS.md` — backend/database setup.
6. The relevant backend contract under `backend/*_CONTRACT.md`.

Do not use old delivery history as current truth. The repository intentionally keeps only current status, plans, contracts, and operational runbooks in the main documentation surface.

## Role map

| Role | Route | Scope |
|---|---|---|
| R00 Platform Admin | `/platform-console` | Platform |
| R01 Academy Owner | `/executive-dashboard` | Academy/tenant |
| R02 Branch Manager | `/` | Branch |
| R03 Head Instructors | `/head-instructors` | Branch/team |
| R04 Instructor | `/instructor-desk` | Assigned sessions/students |
| R05 Secretary | `/secretary-desk` | Branch/scoped operations |
| R06 Accountant | `/finance-desk` | Branch finance |
| R07 Marketing Manager | `/marketing-desk` | Branch marketing; not fully live |
| R08 Parent/Guardian | `/family-portal` | Linked children only |
| R09 Student | `/student-portal` | Own linked student account |

Route mapping and guards are in `client/src/App.tsx`; role home mapping is in `client/src/pages/Login.tsx`.

## Non-negotiable rules

- Preserve Arabic-first labels, RTL layout, and the existing Mada visual system.
- Backend authorization is authoritative; frontend navigation is not security.
- Derive tenant, branch, permissions, and consumer access from the authenticated identity.
- Check every referenced student, enrollment, invoice, payment, evaluation, session, and file against that scope.
- R08/R09 receive evaluation scores/notes only after publication.
- LIVE screens must not silently show demo data.
- Finance methods (cash, Visa, InstaPay, Vodafone Cash) are recorded external payments; the app does not process those payments.
- Marketing is not fully API-backed LIVE yet.
- Never commit secrets, real passwords, tokens, OTPs, payment evidence, database dumps, or `.env` files.

## Where to look in code

- Routes/providers: `client/src/App.tsx`, `client/src/main.tsx`
- Auth/session: `client/src/contexts/AuthContext.tsx`, `client/src/lib/apiClient.ts`
- Route guard: `client/src/components/ProtectedRoute.tsx`
- Theme: `client/src/components/MadaTheme.css`, `client/src/styles/role-surfaces.css`
- Login: `client/src/pages/Login.tsx`, `client/src/pages/Login.css`
- Backend startup: `backend/MadaAcademy.Api/Program.cs`
- Auth: `backend/MadaAcademy.Api/Auth/`
- Persistence: `backend/MadaAcademy.Api/Persistence/`
- Domain endpoints: `backend/MadaAcademy.Api/Modules/`
- API tests: `backend/MadaAcademy.Api.IntegrationTests/`
- Browser flows: `e2e/critical-flows.spec.ts`

## Current reality

Completed vertical slices include authentication/JWT, role and scope guards, students, sessions, attendance, evaluations and publication, approvals, Finance invoice/payment/expense records, linked consumer reads, shared styling, and browser E2E.

Known boundaries are production secret/storage configuration, deployed staging smoke, backup/restore, real SMS delivery, password recovery, finer Finance pending states, and fully live Marketing APIs. These are documented in `PROJECT_STATUS.md` and `NEXT_PHASE_PLAN.md`.

## Validation

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

Use a disposable PostgreSQL database for integration tests. Never point tests at production or a shared academy database.

## Safe Agent workflow

1. Read this file, `PROJECT_STATUS.md`, and `NEXT_PHASE_PLAN.md`.
2. Inspect the relevant contract, endpoint, entity, frontend client, page, and test together.
3. Preserve current scope/security and visual conventions.
4. Add tests for behavior and authorization changes.
5. Run the validation commands.
6. Work on a focused branch and open a PR against `main`.
7. Update only current status/plan files when the truth changes.
