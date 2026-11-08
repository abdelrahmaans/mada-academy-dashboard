# Technical Stack & High-Level Architecture
**Document ID:** `PLN-03-TECH-STACK-ARCH`  
**System Codename:** `Project Apex` (Temporary Working Title)  
**Status:** Canonical Reference Blueprint  
**Language:** English  

---

## 1. Selected Technology Stack & Justification

The technology choices reflect enterprise stability, high throughput, strict type safety, and modern software engineering paradigms:

```mermaid
graph TD
    subgraph Client Tier
        Ang["Angular 19/20 (Standalone + Signals)"]
        Mobile["Mobile Apps (Flutter / React Native / iOS / Android)"]
    end

    subgraph Edge & Security
        Nginx["Reverse Proxy / Cloudflare Edge"]
        RateLimit["Distributed Token-Bucket Rate Limiter"]
    end

    subgraph Backend Application (.NET 10)
        Api["ASP.NET Core 10 Web API (Minimal Endpoints)"]
        MediatR["CQRS Pipeline (MediatR + FluentValidation)"]
        Domain["Domain Core (Entities, Value Objects, Domain Events)"]
        Rules["Dynamic Rules & State Engine"]
    end

    subgraph Persistence & Infrastructure
        EFCore["Entity Framework Core 10 (Npgsql)"]
        Postgres[("PostgreSQL 16+ (Multi-Tenant Schema / RLS)")]
        Redis[("Redis Cluster (Cache & Distributed Lock)")]
        Storage["Private S3 Object Storage (MinIO / AWS S3 / Cloudflare R2)"]
    end

    Client Tier --> Edge & Security
    Edge & Security --> Backend Application
    Backend Application --> Persistence & Infrastructure
```

### 1.1 Backend Stack: Modern .NET 10 (C# 13)
* **Framework:** ASP.NET Core 10 Web API (Native AOT compatible, high-speed routing).
* **Pattern:** Clean Architecture + Domain-Driven Design (DDD) + CQRS.
* **ORM & Database Client:** Entity Framework Core 10 with Npgsql provider.
* **Command & Query Handling:** MediatR 12+ with strongly-typed Pipeline Behaviors.
* **Validation:** FluentValidation 11+ executing as an automated mediator pre-processor.
* **Security & Tokens:** ASP.NET Core JWT Bearer with custom ClaimsPrincipal transformations and BCrypt password hashing.
* **Observability & Logging:** Serilog structured JSON logging with OpenTelemetry tracing.

### 1.2 Frontend Stack: Angular 19/20
* **Architecture:** 100% Standalone Components (No NgModules), modern functional routers, and Signals-first reactive state.
* **State Management:** Angular Signals & `@ngrx/signals` (SignalStore) for lightweight, predictable local and shared state.
* **Styling & Design Tokens:** Tailwind CSS v4 paired with custom Design Tokens (HSL-based, supporting RTL Arabic and LTR English seamlessly).
* **Component Primitives:** Angular CDK (Overlay, Dialog, Portal, DragDrop) and Lucide Icons.
* **Forms & Validation:** Reactive Forms with custom async validators mirroring backend rules.
* **HTTP & Communication:** `provideHttpClient(withInterceptors([authInterceptor, tenantInterceptor, errorInterceptor]))`.

### 1.3 Infrastructure & Storage
* **Relational Database:** PostgreSQL 16+ utilizing connection pooling (PgBouncer) and multi-tenant schema isolation.
* **Cache & Distributed State:** Redis for token blacklist, distributed rate-limiting, and frequent catalog cache.
* **Object Storage:** Cloud-agnostic `IPrivateObjectStorage` interface wrapping MinIO (local/on-premise) and S3/R2 (cloud) with SHA-256 integrity verification and pre-signed expirable download links.

---

## 2. Clean Architecture Layer Breakdown

The backend codebase is structured into four isolated assemblies, enforcing unidirectional dependencies (Inward Dependency Rule):

```text
src/
├── ProjectApex.Domain/                # Pure Core (Zero 3rd-party dependencies)
│   ├── Common/                       # BaseEntity, ValueObject, IDomainEvent, Result<T>
│   ├── Entities/                     # Rich Domain Entities with private setters & invariant methods
│   ├── Enums/                        # Strongly typed Domain Enums
│   ├── Events/                       # Domain Events (e.g. SessionCompletedDomainEvent)
│   └── Exceptions/                   # DomainException, BusinessRuleViolationException
│
├── ProjectApex.Application/           # Orchestration & Use-Cases
│   ├── Common/                       # Interfaces (IDbContext, IStorage, ICurrentUserService)
│   ├── Behaviors/                    # PipelineBehaviors: Validation, Logging, UnitOfWork
│   ├── Modules/
│   │   ├── Identity/                 # Commands, Queries, Handlers, DTOs, Validators
│   │   ├── Academics/                # Course, Offering, Classroom, Kit Handlers
│   │   ├── Scheduling/               # Session, Attendance, Substitution Handlers
│   │   ├── Evaluations/              # Evaluation Composer, Review, Publish Handlers
│   │   ├── Finance/                  # Master Invoice, Installment, Payment Handlers
│   │   ├── Payroll/                  # Staff Compensation, Monthly Settlement Handlers
│   │   ├── CRM/                      # Lead Pipeline, Follow-up Handlers
│   │   └── Platform/                 # Tenant Onboarding, Plan Quota Handlers
│   └── Rules/                        # Modular Business Rule Specifications
│
├── ProjectApex.Infrastructure/        # External Systems & Adapters
│   ├── Persistence/                  # EfCoreDbContext, Entity Configurations, Migrations
│   ├── Storage/                      # S3 / MinIO Private Storage Service
│   ├── Identity/                     # JwtTokenService, PasswordHasher (BCrypt)
│   ├── Notifications/                # SMS Gateway Adapter, Email, Push Notifications
│   └── BackgroundJobs/               # Hangfire / Quartz for recurring payroll & reminder runs
│
└── ProjectApex.Api/                   # Presentation & HTTP Host
    ├── Endpoints/                    # Modular Fast Minimal API Route Definitions
    ├── Middleware/                   # TenantResolutionMiddleware, GlobalExceptionMiddleware
    ├── Filters/                      # Endpoint Permission Authorization Filters
    ├── Program.cs                    # Dependency Injection, Configuration, Host Lifecycle
    └── appsettings.json              # Structured Configuration & Connection Strings
```

---

## 3. Multi-Tenancy Isolation Blueprint

Data isolation between academies is absolute and enforced at the infrastructure boundary:

### 3.1 Tenant Identification Pipeline
1. Incoming HTTP request reaches `TenantResolutionMiddleware`.
2. The middleware extracts the `TenantId` and `BranchId` from:
   - **Primary:** Verified JWT Claims (`tenant_id`, `branch_id`, `scope_level`).
   - **Fallback (Public/Bootstrap):** Subdomain header (`X-Tenant-Slug` or `Host: academy-name.domain.com`).
3. The extracted context is registered in the scoped `ICurrentTenantContext`.

### 3.2 Global Query Filter Enforcement in EF Core
Every entity inheriting from `ITenantScopedEntity` automatically participates in EF Core Global Query Filters:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
    {
        if (typeof(ITenantScopedEntity).IsAssignableFrom(entityType.ClrType))
        {
            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var filter = Expression.Lambda(
                Expression.Equal(
                    Expression.Property(parameter, nameof(ITenantScopedEntity.TenantId)),
                    Expression.Property(Expression.Constant(_tenantContext), nameof(ICurrentTenantContext.TenantId))
                ),
                parameter
            );
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }
}
```

This guarantees that even if a developer forgets a `.Where(x => x.TenantId == tenantId)` in a custom query, the database query engine **never** leaks data across tenant boundaries.

