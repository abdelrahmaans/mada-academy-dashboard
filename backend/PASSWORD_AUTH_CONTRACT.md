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

## Password creation

- Academy Bootstrap requires an owner password of at least 8 characters.
- Adding an academy member requires a password of at least 8 characters.
- Passwords are never stored in plaintext; only a PBKDF2 hash is persisted in `UserAccounts.PasswordHash`.
- Demo seed accounts use `Mada@2026` in development only.

## Deferred OTP

`/auth/otp/send` and `/auth/otp/verify` remain in the backend for a later passwordless-login phase, but they are no longer used by the main frontend login screen.
