# Patterns, SOLID, and Clean Code Rules

## Core patterns

### Vertical Slice
Organize code around user-facing use cases. Each slice owns its request, handler, validator, endpoint, response, authorization requirement, and tests.

### CQRS
Separate reads and mutations. Queries may use optimized projections; commands enforce domain rules and transactions.

### Aggregate and Domain Policy
Aggregates protect invariants. Policies answer reusable business questions such as `CanPublishEvaluation` or `CanAllocatePayment`.

### State Machine
Every governed lifecycle has explicit allowed transitions. Invalid transitions return a conflict problem, not a generic server error.

### Specification
Reusable scope and eligibility specifications compose query and authorization constraints without copying predicates.

### Outbox
Write business change and pending external event in one transaction. A worker delivers the event with retry and deduplication.

### Adapter and Strategy
External providers implement ports. Provider changes do not alter domain logic.

### Decorator / Pipeline Behavior
Cross-cutting concerns such as logging, validation, authorization, idempotency, transaction handling, and metrics wrap application handlers.

### Factory
Use factories for complex aggregates such as recurring sessions, imports, invoices, and seeded test scenarios.

### Anti-corruption layer
When importing legacy data or integrating payment/SMS/storage providers, map external terminology to the internal domain model at a boundary.

## SOLID application

- **Single Responsibility:** one class has one reason to change.
- **Open/Closed:** new providers, statuses, or role presets extend strategies/policies instead of modifying stable core behavior.
- **Liskov Substitution:** every storage or messaging adapter obeys the same failure, security, and size guarantees.
- **Interface Segregation:** feature-specific ports instead of giant services.
- **Dependency Inversion:** domain/application depend on abstractions.

## Clean code rules

1. Prefer intention-revealing names over comments.
2. Keep methods small enough to understand without scrolling across business branches.
3. Avoid boolean parameter combinations that hide meaning; use commands or value objects.
4. Do not use `Guid.Empty` as a business state.
5. Do not pass tenant/branch IDs as arbitrary strings when a scoped context exists.
6. Do not use raw status strings in new code.
7. Do not catch exceptions without a recovery or translation strategy.
8. Do not log passwords, tokens, OTPs, payment evidence, or unnecessary PII.
9. Do not return entities directly from APIs.
10. Do not write business logic in controllers/endpoints or Angular templates.
11. Do not use `any` in TypeScript except at a typed integration boundary with a reason.
12. Do not duplicate page-level filters, status labels, currency formatting, or permission predicates.
13. Prefer immutable request/response records.
14. Make side effects explicit in the handler.
15. Use cancellation tokens for every I/O operation.
16. Paginate every unbounded collection.
17. Define time zone and clock behavior; do not call system time throughout domain logic.
18. Use a test clock for state transitions and due dates.
19. Use a single error/problem model across modules.
20. Make invalid states hard to represent.

## Naming

```text
Command: CreateSessionCommand
Handler: CreateSessionHandler
Validator: CreateSessionValidator
Policy: CanCreateSessionPolicy
Repository: ICourseOfferingRepository
Query: GetBranchScheduleQuery
Projection: BranchScheduleRow
Endpoint: MapCreateSessionEndpoint
```

## Testing rules

Every domain rule has:

- Happy path test.
- Unauthorized actor test.
- Wrong tenant/branch test.
- Invalid state test.
- Duplicate/retry test where applicable.
- Concurrency test where applicable.
- Audit/side-effect assertion.
