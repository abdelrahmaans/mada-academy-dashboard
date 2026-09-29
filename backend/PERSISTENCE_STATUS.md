# Mada Academy Backend — Persistence Status

## Current milestone

أضفنا أول persistence foundation باستخدام:

- EF Core `10.0.1`.
- PostgreSQL provider `Npgsql.EntityFrameworkCore.PostgreSQL 10.0.0`.
- `MadaDbContext` داخل Modular Monolith.
- Design-time factory جاهز للمigrations.
- Migration أولى منشأة: `InitialIdentityAndGovernance`.

## Entities included

### Identity & tenancy

- `Tenant`
- `Branch`
- `UserAccount`
- `Membership`
- `Invitation`
- `RefreshSession`

### Governance & workflows

- `AuditEvent`
- `ApprovalRequest`
- `StateTransitionEvent`

## Important rules

- `RoleCode` values follow the frontend Role Registry: `R00` → `R09`.
- Memberships have `TenantId`, optional `BranchId`, `RoleCode`, and `ScopeLevel`.
- Branch and tenant relations are explicit; no global data access by default.
- Invitations and refresh sessions store token hashes, not raw tokens.
- Audit and state transition records are append-oriented.
- Migration موجودة في السورس لكنها لا تُطبّق تلقائيًا عند startup بعد.
- No real auth or feature endpoints are connected yet.

## Local configuration

Set `DATABASE_URL` or `ConnectionStrings:Default` when PostgreSQL is available. Without it, the API still builds and starts; the provider is configured with a local development fallback but no database connection is attempted by the health endpoint.

## Next backend slice

```text
EF migration 0001
→ seed minimal tenant/branch/roles
→ auth user lookup
→ policy/scope middleware
→ /api/v1/me from database
→ Angular API client
```
