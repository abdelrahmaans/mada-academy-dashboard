# Distributed Rate-Limit Decision

**Decision date:** 5 October 2026
**Current status:** single-instance production gate implemented; distributed mode remains unavailable.

## Current decision

Mada currently uses ASP.NET Core's in-memory fixed-window limiter. It is safe for one API instance only because each process has an independent bucket. Until a shared limiter is implemented and verified, production must declare:

```text
MADA_RATE_LIMIT_MODE=single-instance
MADA_RATE_LIMIT_EXPECTED_INSTANCES=1
```

The API startup guard fails closed when:

- `MADA_RATE_LIMIT_MODE` is anything other than `single-instance`;
- `MADA_RATE_LIMIT_EXPECTED_INSTANCES` is less than 1; or
- a non-Development environment declares more than one expected instance.

This prevents an unverified horizontal deployment from weakening login, OTP, invitation, or consumer-lookup limits. It does **not** claim distributed evidence; it is an explicit operational constraint.

## Why this is the right current solution

- No new paid service or vendor is required.
- Existing rate-limit behavior and contracts remain unchanged.
- The current API can be deployed as one instance with a reverse proxy and trusted proxy configuration.
- Misconfigured horizontal scaling fails during startup instead of silently using per-instance limits.

## Required future change before horizontal scaling

Do not switch this guard to distributed mode until a shared store/limiter implementation has:

1. A documented failure policy when the shared store is unavailable.
2. Atomic fixed-window or token-bucket operations across concurrent instances.
3. Key design covering client IP, forwarded-proxy trust, endpoint policy, and window boundaries.
4. Integration tests against the selected store with two API instances.
5. Load evidence showing limits are enforced globally, not once per instance.
6. Operational monitoring, TTL cleanup, network security, and secret rotation.
7. A rollback plan that returns to a single-instance deployment without weakening limits.

The next architecture decision should select a shared store only when the hosting target and operational ownership are known. Redis-compatible storage is a possible future implementation, but it is intentionally not added in this change.
