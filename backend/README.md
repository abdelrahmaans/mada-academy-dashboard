# Backend

ASP.NET Core 10 API for Mada Academy. The backend is the authority for authentication, authorization, tenant/academy scope, branch scope, consumer links, persistence, and audit behavior.

## Project map

| Area | Location | Responsibility |
|---|---|---|
| API host | `MadaAcademy.Api/Program.cs` | Startup, middleware, endpoint registration, rate limiting, and environment checks |
| Authentication | `MadaAcademy.Api/Auth/` | JWT access/refresh sessions, password login, hashing, CORS, SMS boundary, and security options |
| Domain modules | `MadaAcademy.Api/Modules/` | Identity, Finance, Operations, Platform, Reports, and Scheduling endpoints |
| Persistence | `MadaAcademy.Api/Persistence/` | EF Core context, entities, migrations, registration, and development seeding |
| Private storage | `MadaAcademy.Api/Storage/` | Server-side evidence storage abstraction and fail-closed provider integration |
| Integration tests | `MadaAcademy.Api.IntegrationTests/` | InMemory, PostgreSQL, authorization, isolation, and workflow tests |
| Operations | `scripts/` | Migration and controlled demo-seed commands |

## API contracts

Read the relevant contract before changing an endpoint or authorization rule:

- [`OPERATIONS_API_CONTRACT.md`](OPERATIONS_API_CONTRACT.md) — operational workflows and scope
- [`ROLES_PERMISSIONS_API_CONTRACT.md`](ROLES_PERMISSIONS_API_CONTRACT.md) — roles and permissions
- [`SESSION_LIFECYCLE_API_CONTRACT.md`](SESSION_LIFECYCLE_API_CONTRACT.md) — session lifecycle
- [`PASSWORD_AUTH_CONTRACT.md`](PASSWORD_AUTH_CONTRACT.md) — password authentication and security behavior
- [`ACADEMY_BOOTSTRAP_API_CONTRACT.md`](ACADEMY_BOOTSTRAP_API_CONTRACT.md) — academy owner onboarding
- [`DATABASE_STATUS.md`](DATABASE_STATUS.md) — PostgreSQL, migrations, and test setup

## Security rules

Backend authorization is authoritative. Every endpoint must derive tenant, branch, permissions, and consumer access from the authenticated identity and re-check referenced records in that scope. R08/R09 may access only linked records, and evaluation scores/notes are returned to consumers only after publication.

Finance records are scoped by academy/branch and preserve invoice/payment ownership and audit behavior. Payment methods represent external collections; the API does not process card or wallet payments. Private evidence storage must remain server-only and fail-closed until production secrets, persistence, backup, and authenticated staging smoke evidence are complete.

## Validation

From the repository root:

```bash
pnpm backend:restore
pnpm backend:build
pnpm backend:test
```

Use a disposable PostgreSQL database for PostgreSQL integration tests. Do not point tests at production or a shared academy database, and do not commit `.env` files, secrets, tokens, OTPs, payment evidence, or database dumps.
