# Document Control and Traceability

## Requirement traceability

Every requirement should map to:

```text
Requirement
→ Product outcome
→ Business rule
→ Domain entity/transition
→ API use case
→ Frontend feature/action
→ Tests
→ Telemetry
→ Documentation
```

## Required metadata for every future document

```text
Status:
Owner:
Last reviewed:
Applies to:
Related decisions:
Related modules:
Open questions:
```

## Change impact checklist

Before changing an entity or workflow, inspect:

- Database schema and migration.
- API contract and generated client.
- Role/permission matrix.
- State transitions.
- Audit/event behavior.
- Notifications.
- Reports and exports.
- Angular route and feature store.
- Mobile transformation.
- E2E and accessibility tests.
- Support/runbook impact.

## Source-of-truth hierarchy

When documents conflict, use this order:

1. Approved decision record.
2. Executable domain/application tests.
3. Database constraints and migration behavior.
4. API contract tests.
5. Current implementation.
6. Product documentation.
7. UI mockup or visual reference.

A lower-level source cannot silently override a higher-level decision. Conflicts become decision-log entries.
