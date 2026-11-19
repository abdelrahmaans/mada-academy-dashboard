# Mada Academy — Password Authentication Contract

## Primary login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "phone": "+201000000002",
  "password": "your-password",
  "accountType": "staff"
}
```

A successful response returns the same `accessToken`, `refreshToken`, `tokenType`, and `expiresIn` contract used by the existing refresh flow. The backend verifies a PBKDF2 password hash, requires an `ACTIVE` user and an `ACTIVE` membership, then issues a scoped JWT.

## Login protection

- Password login is rate limited per client IP. The default is 20 requests per 60 seconds and returns `429 Too Many Requests` after the limit.
- Active accounts are temporarily locked after 5 failed password attempts. The default lockout duration is 15 minutes.
- A locked account returns `429` with `extensions.code: "LOGIN_LOCKED"`; a correct password does not bypass the lockout.
- Failed-login counters reset after a successful password login.
- Invalid credentials continue to return the same `401 Unauthorized` response for unknown, inactive, and incorrect-password cases.
- Thresholds can be overridden through `AuthenticationSecurity__*` configuration values.

## Password creation

- Academy Bootstrap requires an owner password of at least 8 characters.
- Adding an academy member requires a password of at least 8 characters.
- Passwords are never stored in plaintext; only a PBKDF2 hash is persisted in `UserAccounts.PasswordHash`.
- Academy bootstrap and platform owner recovery mark the account with `MustChangePassword=true`. The temporary password is accepted for the first login, then the authenticated user is routed to `POST /api/v1/auth/change-password` before accessing the workspace.
- Changing the password clears `MustChangePassword` and revokes the user's active refresh sessions; the user signs in again with the new password.
- Demo seed accounts use `Mada@2026` in development only.

## Temporary password change

```http
POST /api/v1/auth/change-password
Authorization: Bearer <temporary-login-access-token>
Content-Type: application/json
```

```json
{
  "currentPassword": "temporary-password",
  "newPassword": "private-password"
}
```

The temporary password is never accepted from a URL or browser storage payload during academy bootstrap. It is entered in the protected bootstrap form and sent only in the HTTPS request body.

## Deferred OTP

`/auth/otp/send` and `/auth/otp/verify` remain in the backend for a later passwordless-login phase, but they are no longer used by the main frontend login screen.
