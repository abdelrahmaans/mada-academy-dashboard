# Guards, Interceptors, Services, and Reusable Boundaries

## Guards

### AuthGuard

Checks whether an authenticated session exists. It redirects to login but never determines data authorization.

### AuthorizationGuard

Checks route metadata for an expected role/permission and provides a useful forbidden state. The backend repeats the decision.

### ContextGuard

Ensures the route has a valid academy/branch/term context when the feature requires it. It must not invent a context or silently choose an unauthorized branch.

### FeatureGuard

Checks whether a feature is `LIVE`, `PREVIEW`, `BLOCKED`, or `DISABLED`. Preview routes are visually and semantically labeled.

## Interceptors

### AuthTokenInterceptor

Adds the access token. It must never add a refresh token to ordinary API calls.

### RefreshInterceptor

Handles one coordinated refresh attempt for expired access tokens. Concurrent requests share the same refresh operation. Refresh failure clears the session safely.

### CorrelationInterceptor

Adds or propagates a request correlation ID.

### ProblemDetailsInterceptor

Normalizes server problem details into a typed `ApiProblem` without swallowing field errors or conflicts.

### Loading/TelemetryInterceptor

Optional global transport telemetry. It must not create global spinners that block unrelated work.

### RetryInterceptor

Only retries explicitly retryable idempotent requests. Never blindly retries payments, approvals, or destructive mutations.

## Service boundaries

### API services

Thin typed transport wrappers generated from or aligned with OpenAPI. No business workflow orchestration.

### Feature stores

Own feature state, command status, caching, refresh, optimistic policy, and stale-response protection.

### Domain/decision services

Pure TypeScript functions for display rules, permission explanation, status labels, and client-side validation. They never replace backend rules.

### Shared formatting services

One source for Arabic/English date, time, number, currency, phone, ID, and relative-time formatting.

### Dialog/overlay service

A shared overlay boundary with focus trap, Escape, focus return, scroll lock, inert background, mobile full-screen behavior, and typed result.

## Reusable component rules

A component is shared only when:

- It has a stable visual/behavioral contract.
- It is used by at least two features or is a core shell primitive.
- It has accessibility tests.
- It does not import a feature service.
- It accepts data and emits intent rather than mutating domain state.

## Prohibited patterns

- A shared component importing `FinanceApiService`.
- A route guard fetching domain lists.
- An interceptor deciding whether a user can approve an expense.
- A page directly changing localStorage auth tokens.
- A template containing status transition logic.
- A service with every feature endpoint in one class.
- A silent `catch` that substitutes demo data.
