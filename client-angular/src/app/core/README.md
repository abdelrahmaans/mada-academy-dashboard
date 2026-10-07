# Core foundation

Keep cross-cutting, UI-agnostic concerns here: API transport, auth/session, route guards, interceptors, configuration, and shared domain primitives. Do not place role-specific page logic here.

Rules:
- Backend authorization remains authoritative; guards are navigation UX only.
- Derive tenant, branch, permissions, and consumer links from authenticated `/me`, never from editable route/query/local storage values.
- Keep API contracts explicit and typed; preserve structured status/code errors and the `{ data: ... }` response envelope where returned.
- Decide token persistence and refresh concurrency as a dedicated security design before implementing auth. Never persist passwords or OTPs; never log credentials/tokens.
- Add unit tests for API error/refresh behavior and integration tests remain authoritative for scope/security.
