# Engineering Standards, Clean Code & Leadership Rules
**Document ID:** `PLN-10-ENGINEERING-STANDARDS`  
**System Codename:** `Project Apex` (Temporary Working Title)  
**Status:** Canonical Reference Blueprint  
**Language:** English  

---

## 1. Backend .NET Engineering Standards

All contributors must adhere to strict software leadership rules enforced via `.editorconfig` and CI/CD analyzers:

### 1.1 Language & Nullability
* **C# 13 Strict Mode:** `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` are active on all projects.
* **Zero Null Propagation:** Never pass unvalidated `null` arguments across domain boundaries; utilize C# nullable reference types and explicit guard clauses:
  ```csharp
  ArgumentNullException.ThrowIfNull(command);
  ```

### 1.2 Domain Model Purity & Invariants
* **Private Setters:** Entity state can only be mutated through explicit domain methods (e.g., `session.CompleteSession(...)`), never by public property setters.
* **No Leaky Entities:** EF Core entities must **never** be returned from API endpoints. Always project to strongly-typed DTOs (`record CreateSessionResponse(...)`).
* **Result Pattern over Throwing Exceptions for Business Flow:**
  - Standard business rule failures return `Result<T>` with error details.
  - Exceptions are reserved strictly for exceptional infrastructural failures (e.g., database network drop, S3 outage).

### 1.3 Asynchronous Execution & Cancellation
* Every I/O-bound method (database query, network call, file stream) must be asynchronous and accept a `CancellationToken ct = default`.
* Never use `.Result` or `.Wait()`; thread pool starvation will block deployment.

---

## 2. Frontend Angular Engineering Standards

### 2.1 TypeScript Strictness & Zero-`any` Policy
* `"noImplicitAny": true` and `"strictNullChecks": true` are non-negotiable.
* Using `any` is a pull-request rejection gate. Use `unknown` with type guards or define strongly-typed interfaces.

### 2.2 Reactivity & Memory Safety
* Prefer Angular **Signals** (`signal()`, `computed()`) over raw RxJS subjects for local UI state.
* For async streams, always prevent memory leaks by using the `takeUntilDestroyed()` operator within injection contexts.
* Explicitly set `changeDetection: ChangeDetectionStrategy.OnPush` on all components.

### 2.3 Component Single Responsibility
* Components must not exceed **250 lines of code**. Large screens must be decomposed into dumb presentational child components and smart container components.
* Business logic, math calculations, and HTTP calls belong inside injectable `Services`, never inside component controllers.

---

## 3. Pull Request & Definition of Done (DoD) Checklist

Before any feature branch is merged into `main`:
1. **Compilation:** `dotnet build --no-restore` and `ng build` succeed with 0 warnings.
2. **Automated Tests:**
   - Integration tests covering the endpoint using `WebApplicationFactory` and real PostgreSQL Testcontainers pass.
   - Unit tests covering the core business rules pass.
3. **Audit Event Verification:** Every write operation emits a verified `AuditEvent` record.
4. **Tenant Isolation Verification:** Verified that the new query contains mandatory `TenantId` filtering.
5. **No Hard-Coded Credentials or URLs:** All connections, keys, and tokens originate from environment variables or KeyVault.

