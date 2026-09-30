# Mada Academy — Academy Bootstrap & Me Context API Contract

## 1. Bootstrap an academy

```http
POST /api/v1/platform/academies
Authorization: Bearer <R00 platform admin JWT>
Content-Type: application/json
```

### Request

```json
{
  "name": "أكاديمية مدى",
  "slug": "mada-academy",
  "planCode": "STARTER",
  "primaryBranch": {
    "name": "مدينة نصر",
    "code": "NASR_CITY"
  },
  "owner": {
    "fullName": "أحمد محمود",
    "phone": "01012345678",
    "email": "owner@mada.academy"
  }
}
```

### Behavior

The endpoint creates the following records in one `SaveChanges` unit:

- `Tenant` / academy
- First active `Branch`
- Active staff `UserAccount` for the owner
- Active `Membership` with `R01_ACADEMY_OWNER` and `TENANT` scope
- `AuditEvent` with `ACADEMY_BOOTSTRAPPED`

The owner is ready for OTP login after creation. No password is created or stored.

### Success: `201 Created`

```json
{
  "data": {
    "academy": {
      "id": "...",
      "name": "أكاديمية مدى",
      "slug": "mada-academy",
      "status": "ACTIVE",
      "planCode": "STARTER"
    },
    "primaryBranch": {
      "id": "...",
      "tenantId": "...",
      "name": "مدينة نصر",
      "code": "NASR_CITY",
      "status": "ACTIVE"
    },
    "owner": {
      "id": "...",
      "displayName": "أحمد محمود",
      "email": "owner@mada.academy",
      "phone": "01012345678",
      "role": "R01_ACADEMY_OWNER"
    },
    "nextStep": "OWNER_LOGIN_REQUIRED"
  }
}
```

### Error codes

| HTTP | Code | Meaning |
|---:|---|---|
| 400 | validation problem | Required field, format, or length is invalid |
| 401/403 | authorization | Caller is not an authenticated `R00_PLATFORM_ADMIN` |
| 409 | `ACADEMY_SLUG_EXISTS` | Slug is already used |
| 409 | `OWNER_EMAIL_EXISTS` | Owner email already exists |
| 409 | `OWNER_PHONE_EXISTS` | Owner staff phone already exists |

## 2. Current identity and scope

```http
GET /api/v1/me
Authorization: Bearer <staff JWT>
```

### Success: `200 OK`

```json
{
  "data": {
    "id": "...",
    "accountType": "staff",
    "role": "R01_ACADEMY_OWNER",
    "roleLabel": "مسؤول الأكاديمية",
    "tenantId": "...",
    "branchId": null,
    "scopeLevel": "TENANT",
    "permissions": [
      "academy.read",
      "academy.update",
      "branch.read",
      "branch.create",
      "staff.read",
      "staff.invite",
      "reports.read"
    ],
    "user": {
      "id": "...",
      "displayName": "أحمد محمود",
      "email": "owner@mada.academy",
      "phone": "01012345678"
    },
    "academy": {
      "id": "...",
      "name": "أكاديمية مدى",
      "slug": "mada-academy",
      "status": "ACTIVE",
      "planCode": "STARTER"
    },
    "branches": []
  }
}
```

`branches` is tenant-wide for `R01` and platform-visible memberships, and is reduced to the current branch for branch-scoped roles.
