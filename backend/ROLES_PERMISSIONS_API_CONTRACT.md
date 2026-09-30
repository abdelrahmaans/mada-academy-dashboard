# Mada Academy — Login, Roles & Permissions API Contract

## Authentication flow

1. `POST /api/v1/auth/otp/send` with `{ "phone": "...", "accountType": "staff" }`.
2. In development, the response can include `developmentCode`.
3. `POST /api/v1/auth/otp/verify` with `{ "phone": "...", "code": "...", "accountType": "staff" }`.
4. Store `accessToken` and `refreshToken` in the frontend session store.
5. Call `GET /api/v1/me` to load role, academy, scope, branches, and permissions.
6. Use `POST /api/v1/auth/refresh` when the access token expires.
7. Use `POST /api/v1/auth/logout` to revoke the refresh session.

Only `ACTIVE` staff accounts can verify OTP or refresh a session. Suspended or revoked members are denied on the next authentication/refresh attempt.

## Academy roles catalog

```http
GET /api/v1/academy/roles
Authorization: Bearer <R01 token>
```

Returns the assignable roles and their permission keys. R01 cannot grant `R00_PLATFORM_ADMIN`.

## Academy members

```http
GET /api/v1/academy/members
Authorization: Bearer <R01 token>
```

Returns active and suspended memberships within the JWT tenant scope, including user identity, role, membership status, and branch.

## Add a member

```http
POST /api/v1/academy/members
Authorization: Bearer <R01 token>
Content-Type: application/json
```

```json
{
  "fullName": "مريم حسن",
  "email": "mariam@mada.academy",
  "phone": "01012345678",
  "roleCode": "R04_INSTRUCTOR",
  "branchId": "..."
}
```

The MVP creates an `ACTIVE` staff account and membership so the member can authenticate by OTP immediately. Duplicate email/phone returns `409`.

## Change role and scope

```http
PUT /api/v1/academy/members/{membershipId}/role
Authorization: Bearer <R01 token>
```

```json
{ "roleCode": "R02_BRANCH_MANAGER", "branchId": "..." }
```

Branch roles require an active branch belonging to the current academy. An owner cannot change their own R01 membership.

## Suspend / activate / revoke

```http
PATCH /api/v1/academy/members/{membershipId}/status
Authorization: Bearer <R01 token>
```

```json
{ "status": "SUSPENDED" }
```

Allowed statuses: `ACTIVE`, `SUSPENDED`, `REVOKED`. Every role and status mutation creates an `AuditEvent`.
