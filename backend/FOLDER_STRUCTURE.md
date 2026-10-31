# Backend Folder Map

## Domain

```text
AcademyOps.Domain/
├── Common/
│   ├── Entity.cs
│   ├── AggregateRoot.cs
│   ├── ValueObject.cs
│   ├── DomainError.cs
│   ├── Result.cs
│   ├── StrongIds/
│   ├── Money/
│   ├── Dates/
│   └── Pagination/
├── Identity/
├── Tenancy/
├── Academy/
│   ├── Students/
│   ├── Guardians/
│   ├── Courses/
│   ├── Groups/
│   └── Enrollments/
├── Scheduling/
│   ├── Sessions/
│   ├── Conflicts/
│   ├── Rooms/
│   └── Substitutions/
├── Learning/
│   ├── Attendance/
│   ├── Evaluations/
│   └── Publication/
├── Finance/
│   ├── Invoices/
│   ├── Payments/
│   ├── Expenses/
│   └── Reconciliation/
├── Governance/
│   ├── Approvals/
│   ├── Audit/
│   └── StateTransitions/
└── Imports/
```

## Application

```text
AcademyOps.Application/
├── Abstractions/
│   ├── IClock.cs
│   ├── ICurrentActor.cs
│   ├── IUnitOfWork.cs
│   ├── IObjectStorage.cs
│   ├── IOutbox.cs
│   └── IIdempotencyStore.cs
├── Behaviors/
│   ├── ValidationBehavior.cs
│   ├── AuthorizationBehavior.cs
│   ├── TransactionBehavior.cs
│   ├── IdempotencyBehavior.cs
│   └── TelemetryBehavior.cs
├── Identity/
├── Tenancy/
├── Operations/
├── Scheduling/
├── Attendance/
├── Evaluations/
├── Finance/
├── Imports/
├── Reporting/
└── Notifications/
```

Each feature slice contains its command/query, handler, validator, policy, response, and tests. Do not create giant module services.

## Infrastructure

```text
AcademyOps.Infrastructure/
├── Persistence/
│   ├── AcademyDbContext.cs
│   ├── Configurations/
│   ├── Migrations/
│   ├── Repositories/
│   └── Queries/
├── Authentication/
├── Authorization/
├── Storage/
├── Messaging/
├── Jobs/
├── Observability/
└── Providers/
```

## API

```text
AcademyOps.Api/
├── Endpoints/
│   ├── Auth/
│   ├── Tenancy/
│   ├── Students/
│   ├── Scheduling/
│   ├── Attendance/
│   ├── Evaluations/
│   ├── Finance/
│   ├── Imports/
│   └── Reports/
├── Middleware/
├── OpenApi/
├── Health/
└── Program.cs
```

## Reusable backend components

Reusable means a stable contract, not a shared dumping ground. Candidate reusable units include `ProblemDetailsMapper`, `ScopeResolver`, `PermissionEvaluator`, `StateTransitionService`, `AuditWriter`, `IdempotencyStore`, `PaginationParser`, `Money`, `ObjectStoragePort`, `OutboxDispatcher`, and `ConcurrencyGuard`.

A reusable unit must be framework-independent where possible, tested in isolation, and documented with failure semantics.

## Test placement

- Domain tests: pure invariants and transitions.
- Application tests: commands, policies, and side effects.
- Integration tests: PostgreSQL, authentication, storage, transactions, and constraints.
- Contract tests: OpenAPI and status/error shapes.
- Architecture tests: dependency direction and forbidden references.
