# Target .NET Backend Structure

## Important distinction

`backend/MadaAcademy.Api/` is the current functional runtime. `backend/rebuild-scaffold/` is the target structure for the next rebuild phase. The scaffold is intentionally empty until the Phase 0 inventory and project-boundary decision are approved.

## Target solution

```text
backend/
├── AcademyOps.sln
├── src/
│   ├── AcademyOps.Api/
│   ├── AcademyOps.Application/
│   ├── AcademyOps.Domain/
│   ├── AcademyOps.Infrastructure/
│   └── AcademyOps.Contracts/
├── tests/
│   ├── AcademyOps.Domain.Tests/
│   ├── AcademyOps.Application.Tests/
│   ├── AcademyOps.Integration.Tests/
│   ├── AcademyOps.Contract.Tests/
│   └── AcademyOps.Architecture.Tests/
├── scripts/
├── docs/
├── Dockerfile
└── global.json
```

Until the migration is approved, the equivalent planning tree is located at `backend/rebuild-scaffold/` so the current runtime remains safe.

## Dependency direction

```text
Api → Application → Domain
Api → Contracts
Infrastructure → Application + Domain
Contracts → no runtime infrastructure dependency
Domain → no ASP.NET/EF/provider dependency
```

## Project responsibilities

### AcademyOps.Domain

Entities, aggregates, value objects, domain events, policies, state transitions, invariants, and domain errors.

### AcademyOps.Application

Commands, queries, handlers, validators, authorization policies, ports, transaction orchestration, and use-case results.

### AcademyOps.Infrastructure

EF Core, PostgreSQL, migrations, repositories, query implementations, authentication providers, storage, messaging, jobs, observability, and external adapters.

### AcademyOps.Contracts

Versioned API request/response contracts, problem details, pagination, public enums, and OpenAPI-facing models. Persistence entities never cross this boundary.

### AcademyOps.Api

Composition root, endpoint groups, middleware, authentication wiring, OpenAPI, health/readiness, and transport mapping.

## Module boundaries

Identity/Tenancy, Authorization, Academy Operations, Catalog/Scheduling, Attendance/Learning, Finance, Imports, Reporting, Communication, and Platform Administration are modules. A module may expose application contracts; it must not reach into another module's private persistence model.

## Migration rule

Do not move code by namespace replacement alone. For every migration unit, identify behavior, tests, data impact, contract impact, and rollback. A module is migrated only when old and new behavior are reconciled.
