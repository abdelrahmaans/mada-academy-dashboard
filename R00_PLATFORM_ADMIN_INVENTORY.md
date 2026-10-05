# Mada Academy — R00 Platform Admin Action Inventory

**Date:** 5 October 2026  
**Scope:** `R00_PLATFORM_ADMIN` platform console and platform-gated API routes  
**Authority:** Backend authorization and persisted API behavior; frontend guards are presentation only.

## Boundary

R00 is a **platform-scoped support and academy-bootstrap role**. It is not a tenant/branch operator and must not be used to read student, consumer, attendance, evaluation, or finance records. Every support mutation must identify the target academy and persist an actor, reason, target, and outcome in `AuditEvent`.

The live UI is Arabic-first/RTL and explicitly labels the surface `LIVE`; it does not substitute demo data when a live read fails. The platform console may display operational support metadata, but member email and phone values are masked in the API response.

## Action inventory

| Surface / action | Route | Classification | Backend authorization | Scope / isolation | Audit requirement and current evidence |
|---|---|---|---|---|---|
| Platform overview metrics | `GET /api/v1/platform/overview` | **LIVE** | `platform-admin` policy (`R00_PLATFORM_ADMIN`) | Platform-wide aggregate counts only: tenants, staff, sessions, audit events | Read-only; covered indirectly by protected-route tests. Verify no tenant detail is returned. |
| Academy list | `GET /api/v1/platform/academies` | **LIVE** | `platform-admin` | Platform-wide academy metadata; no student/finance detail | Read-only; returns academy/branch/member counts and owner display name. Protected access is covered. |
| Create academy | `POST /api/v1/platform/academies` | **LIVE, contract drift** | `platform-admin` | Creates one tenant, primary branch, R01 owner membership; no cross-tenant input | Writes `ACADEMY_BOOTSTRAPPED` with actor and tenant. Needs a dedicated integration test and contract correction. **Drift:** implementation and UI require an owner password, while `backend/ACADEMY_BOOTSTRAP_API_CONTRACT.md` says no password is created/stored. |
| Read platform role definition | `GET /api/v1/platform/roles` | **LIVE** | `platform-admin` | Returns only the controlled R00 definition | Read-only; confirms `CONTROLLED_OUT_OF_BAND` and `canSelfAssign=false`; covered by integration test. |
| Change academy status | `PATCH /api/v1/platform/academies/{tenantId}/status` | **LIVE** | `platform-admin` | Target is selected by `tenantId`; PAUSED revokes active refresh sessions for members of that tenant | Requires reason (4+ chars); writes `PLATFORM_TENANT_STATUS_CHANGED`; PAUSED flow and audit are covered. Re-activation is not separately asserted. |
| Search academy members | `GET /api/v1/platform/academies/{tenantId}/members` | **LIVE** | `platform-admin` | Query is constrained by `Membership.TenantId`; identity contact fields are masked | Read-only; cross-tenant membership is not returned. Search and masking are covered. |
| Change member status | `PATCH /api/v1/platform/academies/{tenantId}/members/{membershipId}/status` | **LIVE** | `platform-admin` | Membership lookup requires both route tenant and membership tenant; R00 membership is protected from support mutation | Requires reason; REVOKED revokes the target user's active sessions; writes `PLATFORM_MEMBER_STATUS_CHANGED`; cross-tenant and revoke behavior are covered. Reactivation and protected-R00 cases need explicit tests. |
| Revoke user sessions | `POST /api/v1/platform/academies/{tenantId}/users/{userId}/sessions/revoke` | **LIVE** | `platform-admin` | Requires a membership in the selected tenant before revoking that user's staff sessions | Requires reason; writes `PLATFORM_USER_SESSIONS_REVOKED`; target isolation and preservation of actor session are covered. |
| Academy activity | `GET /api/v1/platform/academies/{tenantId}/activity` | **LIVE** | `platform-admin` | Audit events filtered to the selected tenant | Read-only; tenant activity and actor identity are returned. Covered as part of member support flow. |
| Platform activity | `GET /api/v1/platform/activity` | **LIVE** | `platform-admin` | Last 100 platform-wide audit events | Read-only; no mutation. Needs an explicit integration assertion that non-R00 tenant activity is visible only as audit metadata, not business records. |
| Role assignment / R00 self-assignment | No R00 route | **NOT AVAILABLE** | R01 role APIs reject non-assignable roles; R00 is controlled out of band | No tenant owner can grant R00; R00 support cannot assign itself or another R00 | Explicitly represented by role metadata and protected-member branch; negative coverage is now in `PlatformAdminApiTests`. |
| Academy archive/delete | No route | **NOT AVAILABLE** | No endpoint or persistence workflow | Must not be implied by `academy.archive` permission text | Remove or rename the advertised permission until an archive contract, state model, audit, and tests exist. |
| Billing/plan changes | No route | **NOT AVAILABLE** | No endpoint | `plan` is displayed as metadata only; no billing mutation exists | No UI action is exposed. Do not describe plan changes as supported. |
| Student, parent, attendance, evaluation, finance, storage, or backup support | No R00 route | **NOT AVAILABLE** | No R00-specific read/write contract | Must remain outside platform support scope | The live console explicitly states that detailed financial and student records are not in scope. |
| Marketing campaign/lead management | No R00 route | **PREVIEW / NOT AVAILABLE** | No live API contract | No tenant/branch support workflow exists | Existing marketing surfaces remain preview/local and must not be linked as R00 live capability. |

## Acceptance checklist

### Authorization

- [x] Anonymous callers receive `401` on platform routes.
- [x] Tenant roles receive `403` and cannot mutate platform state.
- [x] R00 is required by the backend policy; frontend route guards are not the security boundary.
- [x] R01 role management cannot assign `R00_PLATFORM_ADMIN`.
- [x] Explicit integration coverage for protected R00 membership mutation and R00 assignment rejection.

### Isolation and privacy

- [x] Academy member queries require the route `tenantId`.
- [x] Member status changes require both membership ID and tenant ID.
- [x] Session revocation requires membership in the selected tenant.
- [x] Member phone and email are masked in platform support responses.
- [ ] Add explicit tests for platform overview/activity response shape so platform aggregates cannot grow into business-record disclosure.

### Auditability

- [x] Status changes require a non-empty reason of at least four characters.
- [x] Tenant status, member status, and session revocation write action, actor, target, tenant, reason, and metadata.
- [x] Academy bootstrap writes `ACADEMY_BOOTSTRAPPED`.
- [x] Dedicated bootstrap and reactivation audit assertions.

### LIVE/DEMO truth

- [x] `PlatformConsoleLive` uses API data and `demo={false}`.
- [x] Optional read failures preserve available data and show a warning.
- [x] No R00 support mutation is presented as a local-only demo action.
- [x] Unsupported archive, billing, and detailed-record support actions are not exposed as live controls.

## Follow-up decisions

1. Correct `ACADEMY_BOOTSTRAP_API_CONTRACT.md` to match the implemented password-based owner onboarding, or deliberately redesign bootstrap around OTP before calling the action contract-complete. Do not silently choose between these authentication models.
2. Remove `academy.archive` from the R00 permission advertisement until an archive workflow exists, or create a separate contract/implementation/test change for it.
3. Add explicit platform overview/activity response-shape assertions before declaring the R00 surface acceptance-complete.
4. Keep production CORS, distributed rate-limit evidence, private storage, backup/restore, and staging acceptance as separate production gates.
