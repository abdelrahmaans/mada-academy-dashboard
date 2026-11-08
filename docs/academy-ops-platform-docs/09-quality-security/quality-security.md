# Quality, Security, and Release Confidence

## Quality model

Quality is measured across behavior, security, usability, accessibility, resilience, performance, and operability. A feature that works only on the happy path is not production-ready.

## Test layers

### Domain tests

Pure tests for invariants, transitions, value objects, policies, money arithmetic, scope decisions, and state machines.

### Application tests

Tests for commands/queries, authorization, transaction behavior, idempotency, audit, outbox, and side effects.

### Integration tests

Run against PostgreSQL and real infrastructure-shaped adapters. Test foreign keys, unique constraints, transactions, concurrency, file metadata, and provider failures.

### Contract tests

Verify OpenAPI response shapes, status codes, problem details, pagination, headers, and generated Angular client compatibility.

### E2E tests

Test role journeys from login to outcome. At minimum cover owner, manager, instructor, secretary, accountant, parent, and student.

### Accessibility tests

Combine automated checks with keyboard and screen-reader review. Test focus, dialogs, tables/lists, status messages, target size, contrast, and RTL.

## Security baseline

Use OWASP ASVS 5.0 as the baseline. Security work must include authentication, authorization, session lifecycle, input validation, output encoding, file upload safety, error handling, data protection, logging, privacy, and dependency management.

## Threat model priorities

- Cross-tenant data access.
- Parent/student relationship abuse.
- Token theft and refresh replay.
- Broken object-level authorization.
- Payment manipulation or double submission.
- Unsafe evidence upload.
- Import injection and duplicate commit.
- Over-privileged support/admin accounts.
- PII leakage in logs and exports.
- Notification content leakage.

## Privacy rules

Classify data as public, internal, confidential, or restricted. Student identity, guardian links, evaluations, payment evidence, and staff notes are not public. Exports must be scoped, logged, and purpose-limited.

## Performance budgets

Define budgets before implementation:

- API p95 for common reads.
- API p95 for mutations.
- Maximum page payload.
- Maximum table page size.
- Initial frontend bundle budget.
- Mobile interaction and network budgets.
- Report generation timeout and async threshold.

## Release gates

A release is blocked if:

- Critical/High security findings are open.
- Tenant isolation tests fail.
- Financial invariants fail.
- Database migrations are not rehearsed.
- Backups cannot be restored.
- Error telemetry is missing for new critical workflows.
- Accessibility has a known blocker.
- A feature is presented as live while its API is preview-only.
