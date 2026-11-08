# Operations and Delivery

## Environments

### Local

Safe seed data, local provider adapters, no production credentials, deterministic clock where useful.

### Development

Shared integration environment with disposable data and realistic provider contracts.

### Staging

Production-shaped topology, masked data only, migration rehearsal, load checks, backup/restore drill.

### Production

No demo credentials, no destructive seed reset, private secrets, durable audit, durable jobs, monitoring, alerting, and tested rollback.

## CI pipeline

1. Restore dependencies from lockfiles.
2. Run formatting and static analysis.
3. Run domain/application tests.
4. Start PostgreSQL test dependency.
5. Run integration and contract tests.
6. Build backend image.
7. Build Angular web app.
8. Run E2E and accessibility smoke tests.
9. Scan dependencies and container.
10. Publish artifacts with immutable version.

## Deployment rules

- Migrations are reviewed and executed as a controlled release step.
- Expand/contract migrations are required for breaking schema changes.
- Health endpoint checks dependencies needed for readiness.
- Liveness must not fail merely because an optional provider is down.
- Rollback is documented before production deployment.
- Feature flags are used for risky behavior, not as a substitute for authorization.

## Observability

Track:

- Request count, latency, error rate.
- Authorization denials by reason without leaking data.
- State transition failures.
- Payment and import idempotency replays.
- Outbox backlog and dead letters.
- File upload failures and object reconciliation.
- Mobile sync failures.
- Job retry and execution age.

## Backup and recovery

Backup policy must define RPO, RTO, retention, encryption, access, restore testing, and legal deletion behavior. PostgreSQL backups are not enough when private evidence objects are stored separately; object storage must have an independent recovery plan.

## Incident response

Every incident record includes timeline, affected scope, detection, mitigation, data impact, root cause, corrective actions, and verification. Security incidents follow the privacy/security escalation path.

## Operational ownership

Every production capability names an owner, backup owner, alert destination, runbook, dependency list, and rollback action. No “orphan” jobs or provider integrations are allowed.
