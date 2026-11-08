# Backend .NET 10 Specification & API Contracts
**Document ID:** `PLN-04-BACKEND-DOTNET`  
**System Codename:** `Project Apex` (Temporary Working Title)  
**Status:** Canonical Reference Blueprint  
**Language:** English  

---

## 1. Minimal API Endpoint Catalog by Module

Endpoints are organized using ASP.NET Core Endpoint Route Groups, with route-level security, rate limiting, and permission attributes.

### 1.1 Identity, Authentication & Multi-Tenancy

| Method | Route | Permission / Guard | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/staff-login` | Public | Staff email/phone + password login; issues JWT + Refresh Token. |
| `POST` | `/api/v1/auth/consumer-login` | Public | Guardian/Student phone login with OTP verification. |
| `POST` | `/api/v1/auth/refresh-token` | Public | Exchange valid refresh token for a new short-lived access JWT. |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetch current user identity, tenant memberships, and resolved permissions. |
| `GET` | `/api/v1/tenants/roles/matrix` | `roles.read` | Fetch the dynamic role-permission matrix and tenant overrides. |
| `PUT` | `/api/v1/tenants/roles/overrides` | `roles.manage` | Update permission overrides for a specific role within the tenant. |

---

### 1.2 Academic Catalogs & Group Offerings

| Method | Route | Permission / Guard | Description |
|---|---|---|---|
| `GET` | `/api/v1/academics/templates` | `academics.read` | List active course curriculum templates. |
| `POST` | `/api/v1/academics/templates` | `academics.manage` | Create a new course template with default durations and pricing. |
| `GET` | `/api/v1/academics/offerings` | `offerings.read` | List active scheduled groups with occupancy metrics. |
| `POST` | `/api/v1/academics/offerings` | `offerings.manage` | Create scheduled group with primary instructor, room, days, and time slot. |
| `GET` | `/api/v1/academics/offerings/{id}/roster` | `offerings.read` | Get list of enrolled students and waitlisted students for a group. |

---

### 1.3 Scheduling, Attendance & Substitution

| Method | Route | Permission / Guard | Description |
|---|---|---|---|
| `GET` | `/api/v1/scheduling/sessions` | `sessions.read` | Filter sessions by date range, branch, classroom, or instructor. |
| `POST` | `/api/v1/scheduling/check-conflict`| `sessions.manage` | Pre-flight validation verifying zero conflicts in room, instructor, and kits. |
| `GET` | `/api/v1/scheduling/sessions/{id}/attendance` | `attendance.read` | Fetch session student attendance list. |
| `PUT` | `/api/v1/scheduling/sessions/{id}/attendance` | `attendance.write` | Record attendance statuses (Present, Absent, Late, Excused). |
| `POST` | `/api/v1/scheduling/sessions/{id}/complete` | `sessions.execute` | Instructor completes session; freezes attendance; unlocks evaluations. |
| `POST` | `/api/v1/scheduling/sessions/{id}/substitutions` | `substitutions.request` | Request a substitute instructor for a specific session with justification. |

---

### 1.4 Invoicing, Installments & Cash Shifts

| Method | Route | Permission / Guard | Description |
|---|---|---|---|
| `POST` | `/api/v1/finance/enrollment-contract` | `finance.invoices.create` | Generate Master Invoice + Child Installment Invoices for a new enrollment. |
| `GET` | `/api/v1/finance/master-invoices/{id}` | `finance.invoices.read` | Get master invoice details, aggregated settled balance, and child installments. |
| `POST` | `/api/v1/finance/installments/{id}/pay` | `finance.payments.create` | Record payment against an installment (Cash, Card, Transfer); updates master balance. |
| `POST` | `/api/v1/finance/shifts/open` | `shifts.manage` | Open receptionist cash drawer shift with starting float amount. |
| `POST` | `/api/v1/finance/shifts/close` | `shifts.manage` | Submit blind physical cash count and close receptionist shift. |
| `GET` | `/api/v1/finance/shifts/active` | `shifts.read` | Get active shift running cash inflow/outflow tally. |
| `POST` | `/api/v1/finance/invoices/{id}/corrections` | `finance.corrections.request` | Submit invoice correction or credit note request for approval. |

---

### 1.5 Staff Compensation & Payroll Engine

| Method | Route | Permission / Guard | Description |
|---|---|---|---|
| `GET` | `/api/v1/payroll/policies/{staffId}` | `payroll.read` | Get staff compensation policy (Hourly, Fixed, Revenue %, Flat). |
| `PUT` | `/api/v1/payroll/policies/{staffId}` | `payroll.manage` | Configure or update staff compensation rules and rates. |
| `POST` | `/api/v1/payroll/runs/generate` | `payroll.manage` | Calculate and generate draft monthly payroll run for all branch staff. |
| `POST` | `/api/v1/payroll/runs/{id}/approve` | `payroll.approve` | Final sign-off by Academy Owner on generated payroll run. |

---

### 1.6 Academic Quality Gate & Evaluations

| Method | Route | Permission / Guard | Description |
|---|---|---|---|
| `GET` | `/api/v1/evaluations/session/{sessionId}` | `evaluations.read` | Get student evaluation cards for a completed session. |
| `PUT` | `/api/v1/evaluations/{id}` | `evaluations.write` | Instructor saves draft evaluation (scores, notes, badge selection). |
| `POST` | `/api/v1/evaluations/session/{sessionId}/submit` | `evaluations.write` | Submit batch of evaluations for Head Instructor review (`SUBMITTED`). |
| `POST` | `/api/v1/evaluations/{id}/publish` | `evaluations.review` | Head Instructor approves and publishes evaluation to Parent/Student portal. |

---

## 2. CQRS Pipeline Behaviors Implementation

Every request dispatched via MediatR traverses an invariant pipeline:

```csharp
public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : ICommand<TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(validators.Select(v => v.ValidateAsync(context, ct)));
        var failures = validationResults.SelectMany(r => r.Errors).Where(f => f != null).ToList();

        if (failures.Count != 0)
        {
            throw new ValidationAppException(failures.Select(x => new ValidationError(x.PropertyName, x.ErrorMessage)));
        }

        return await next();
    }
}
```

---

## 3. Storage Architecture: S3 / MinIO Integration

Private documents (payment transfer slips, expense receipts, certificates) are managed via `IPrivateObjectStorage`:

```csharp
public interface IPrivateObjectStorage
{
    Task<StorageUploadResult> UploadAsync(Stream stream, string fileName, string contentType, string bucketFolder, CancellationToken ct);
    Task<string> GeneratePreSignedDownloadUrlAsync(string storageKey, TimeSpan expiry, CancellationToken ct);
    Task<bool> VerifySha256IntegrityAsync(string storageKey, string expectedSha256, CancellationToken ct);
    Task DeleteAsync(string storageKey, CancellationToken ct);
}
```

### Storage Security Guarantees:
1. Files are **never stored publicly** on a web server.
2. Direct access URLs are expirable Pre-Signed S3 URLs with a maximum lifespan of 15 minutes.
3. Every uploaded file generates a `SHA-256` hash at write time, stored in `PaymentEvidence` / `ExpenseEvidence` to prove tamper-evidence in audits.

