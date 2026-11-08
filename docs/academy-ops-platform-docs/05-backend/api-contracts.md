# API and Contract Rules

## API contract source

OpenAPI 3.1 is the canonical transport contract. Generated TypeScript clients are preferred for Angular. Hand-written adapters are permitted only when a provider or legacy compatibility boundary requires them.

## Response envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "...",
    "scope": {
      "tenantId": "...",
      "branchId": "..."
    }
  }
}
```

Lists additionally return pagination:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 100,
    "hasNext": true
  }
}
```

## Problem details

```json
{
  "type": "https://example.com/problems/validation",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Review the highlighted fields.",
  "fieldErrors": [
    {"field": "amount", "code": "AMOUNT_EXCEEDS_BALANCE", "message": "..."}
  ],
  "correlationId": "...",
  "retryable": false
}
```

## Status rules

- `401`: no valid authenticated session.
- `403`: authenticated but action is not allowed.
- `404`: record is missing or outside a protected scope.
- `409`: state/concurrency/idempotency conflict.
- `422`: semantically invalid input.
- `429`: rate limit.
- `503`: provider or dependency unavailable.

## Authentication contract

- Short-lived access token.
- Persisted refresh session.
- Refresh rotation.
- Immediate revocation capability.
- Account and membership status checked on request.
- No sensitive token values in logs.

## Scope contract

The client may request filters. It may not widen authorization by sending arbitrary tenant/branch/student identifiers.

The server resolves:

```text
Authenticated actor
→ active memberships
→ selected/allowed context
→ resource scope
→ relationship/publication rules
```

## Mutation contract

Every sensitive mutation documents:

- Required permission.
- Required scope.
- Current states.
- Idempotency key.
- Concurrency token.
- Audit action.
- Side effects.
- Retry behavior.

## Compatibility

When an API changes:

1. Update OpenAPI.
2. Update generated clients.
3. Update contract tests.
4. Add migration/deprecation notes.
5. Keep a compatibility adapter if an existing shipped client depends on the old contract.

## API naming examples

```text
GET    /api/v1/branches
POST   /api/v1/students
POST   /api/v1/enrollments
POST   /api/v1/scheduling/sessions/preview
POST   /api/v1/scheduling/sessions
POST   /api/v1/sessions/{id}/attendance
POST   /api/v1/evaluations/{id}/submit
POST   /api/v1/evaluations/{id}/publish
POST   /api/v1/invoices/{id}/payments
POST   /api/v1/imports/{type}/preview
POST   /api/v1/imports/{id}/commit
```
