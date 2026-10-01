# Mada Academy — Start Here for the Next Agent

**Snapshot date:** 1 October 2026
**Verified base:** `main` at `92bec875` (`feat: add evaluation review and publication workflow`, merged PR #18).
**Product:** Arabic-first, RTL academy operations system. **React + Vite is the main frontend**; `client-angular/` is a reference preview, not the default implementation.

> This repository handoff is the current entry point. The project-shared handoff/archive dated 30 September 2026 predates PR #18 and contains stale next-step text; use this file and current repository source as truth.

## Read these first

1. [PROJECT_STATUS.md](PROJECT_STATUS.md) — per-role state, live/demo split, validations, and known gaps.
2. [MADA_MASTER.md](MADA_MASTER.md) — project history and latest checkpoint.
3. [BACKEND_STATUS.md](BACKEND_STATUS.md) — backend capabilities and limits.
4. [NEXT_PHASE_PLAN.md](NEXT_PHASE_PLAN.md) — prioritized next work, dependencies, open issues, and acceptance criteria.
5. [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md) — detailed financial workflow and API/UI contract.
6. [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md) — proposed no-cost, staff-assisted pilot and security limitations.
7. Contracts: [backend/OPERATIONS_API_CONTRACT.md](backend/OPERATIONS_API_CONTRACT.md), [backend/SESSION_LIFECYCLE_API_CONTRACT.md](backend/SESSION_LIFECYCLE_API_CONTRACT.md), [backend/ROLES_PERMISSIONS_API_CONTRACT.md](backend/ROLES_PERMISSIONS_API_CONTRACT.md), [backend/PASSWORD_AUTH_CONTRACT.md](backend/PASSWORD_AUTH_CONTRACT.md), and [backend/DATABASE_STATUS.md](backend/DATABASE_STATUS.md).

## Suggested source files for the next milestone

- Roles/permissions: `backend/MadaAcademy.Api/Modules/Identity/RoleCatalog.cs`, `backend/MadaAcademy.Api/Modules/Identity/AcademyIdentityEndpoints.cs`, `client/src/lib/roleNavigation.ts`.
- Persistence: `backend/MadaAcademy.Api/Persistence/MadaDbContext.cs` and `backend/MadaAcademy.Api/Persistence/Entities/`.
- API conventions: `backend/MadaAcademy.Api/Modules/Identity/ConsumerIdentityEndpoints.cs`, `backend/MadaAcademy.Api/Modules/Identity/ConsumerInvitationEndpoints.cs`, `backend/MadaAcademy.Api/Modules/Scheduling/SessionWorkflowEndpoints.cs`, and `client/src/lib/apiClient.ts`.
- UI: `client/src/pages/FinanceDesk.tsx`, `client/src/pages/Finance.tsx`, and `client/src/pages/FamilyPortal.tsx`.
- Auth/OTP: `backend/MadaAcademy.Api/Auth/`, `backend/MadaAcademy.Api/Program.cs`, `client/src/contexts/AuthContext.tsx`.
- Integration tests: `backend/MadaAcademy.Api.IntegrationTests/`.

## Next agent task

Implement the next approved workstream: **persisted invoices/payments, private payment-evidence upload, and read-only financial data for linked families/students**. Support R05 secretary and R06 accountant through narrow branch-scoped permissions. The user specified cash, Visa, InstaPay, and Vodafone Cash; these record payments made outside the app and do not authorize payment processing.

The user permits a temporary OTP approach before a real SMS provider is selected. Follow `OTP_MVP_TEMPORARY_PLAN.md`: no fixed/shared code, no production Development environment, and only a feature-flagged, tightly limited, auditable staff-assisted pilot. This option is a proposal and has **not yet been implemented or enabled**.

## Non-negotiable product/security rules

- Preserve Arabic-first labels, RTL layout, and Mada design tokens.
- Backend authorization is authoritative; role navigation is not a security boundary.
- Derive tenant/branch from the authenticated identity and check every referenced student, enrollment, invoice, payment, and file against it.
- Consumer access must derive from active `GuardianStudentLink` / `StudentAccountLink`; never trust a client UUID alone.
- In LIVE mode do not render demo financial, evaluation, attendance, or student data as real. Explicitly label genuine demos.
- R08/R09 receive evaluation scores/notes only after publication.
- Never commit secrets, real OTPs, tokens, payment evidence, or generated runtime files.
- Do not add an SMS/payment/storage vendor without explicit cost/hosting decision. Production SMS currently fails closed.

## Validation baseline and commands

At the verified PR #18 checkpoint: backend integration tests **29/29**, Vitest **5/5**, `pnpm check`, `pnpm build`, and EF pending-model check passed. CI covers backend/PostgreSQL and frontend checks.

```bash
pnpm check
pnpm test
pnpm build
export DOTNET_ROOT=/home/ubuntu/.dotnet
export PATH=/home/ubuntu/.dotnet:/home/ubuntu/.dotnet/tools:$PATH
dotnet build backend/MadaAcademy.sln --configuration Release
dotnet test backend/MadaAcademy.sln --configuration Release
dotnet ef migrations has-pending-model-changes \
  --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj
git diff --check
```

Use a disposable PostgreSQL 16 database for PostgreSQL integration tests; do not point tests at the academy working database. Implement on a feature branch and open a PR against `main`.
