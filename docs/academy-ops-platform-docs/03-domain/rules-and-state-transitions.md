# Rules and State Transitions

## Transition contract

Every state transition must define:

- Current state.
- Target state.
- Actor permission.
- Scope requirement.
- Preconditions.
- Required reason or evidence.
- Side effects.
- Audit action.
- Notification behavior.
- Idempotency behavior.
- Recovery path.

## Enrollment

```text
DRAFT → ACTIVE
DRAFT → WAITLISTED
WAITLISTED → ACTIVE
ACTIVE → PAUSED
ACTIVE → CANCELLED
PAUSED → ACTIVE
```

Rules:

- Capacity must be evaluated atomically.
- Waitlist order must be explicit: FIFO or manager-selected.
- Promotion must create a visible event and optional notification.
- Cancellation must preserve history.
- Enrollment must not reference an offering in another tenant or branch.

## Session

```text
DRAFT → PENDING_APPROVAL
DRAFT → CONFIRMED
PENDING_APPROVAL → CONFIRMED
PENDING_APPROVAL → REJECTED
CONFIRMED → IN_PROGRESS
CONFIRMED → CANCELLED
IN_PROGRESS → COMPLETED
COMPLETED → CORRECTION_PENDING
```

Rules:

- Room/instructor/student conflicts are server-authoritative.
- Recurring edits must declare occurrence scope.
- A completed session cannot be silently changed.
- Completion requires attendance policy compliance.
- Rescheduling creates an auditable change, not an invisible overwrite.

## Attendance

```text
NOT_RECORDED → IN_PROGRESS
IN_PROGRESS → RECORDED
RECORDED → LOCKED
LOCKED → CORRECTION_PENDING
CORRECTION_PENDING → LOCKED
```

Supported statuses must be centrally defined, for example `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`, `LEFT_EARLY`, and optional `PARTIAL`.

## Evaluation

```text
DRAFT → SUBMITTED
SUBMITTED → CHANGES_REQUESTED
SUBMITTED → PUBLISHED
CHANGES_REQUESTED → SUBMITTED
PUBLISHED → CORRECTION_REQUESTED
CORRECTION_REQUESTED → PUBLISHED
```

Rules:

- Only the assigned evaluator can edit a draft unless a delegated policy exists.
- Request changes requires a review note.
- Only an authorized reviewer can publish.
- Parents/students see published values only.
- Published records are immutable unless a correction workflow is approved.

## Invoice

```text
DRAFT → OPEN
OPEN → PROCESSING
PROCESSING → PAID
PROCESSING → FAILED
OPEN → VOID
OPEN → UNCOLLECTIBLE
PAID → PARTIALLY_REFUNDED
PAID → REFUNDED
```

Provider state and accounting state may be different. The UI must show both when necessary.

## Expense

```text
DRAFT → PENDING_APPROVAL
PENDING_APPROVAL → APPROVED
PENDING_APPROVAL → REJECTED
APPROVED → PAID
```

The requester must not approve their own governed expense unless an explicit segregation-of-duties policy allows it.

## Invitation

```text
CREATED → SENT
SENT → ACCEPTED
SENT → EXPIRED
SENT → REVOKED
```

An invitation does not grant operational access before acceptance.

## Import

```text
UPLOADED → PREVIEW_READY
PREVIEW_READY → REVIEW_REQUIRED
PREVIEW_READY → COMMITTING
REVIEW_REQUIRED → COMMITTING
COMMITTING → COMMITTED
COMMITTING → FAILED
PREVIEW_READY → EXPIRED
```

A commit is idempotent and rechecks dependencies before writing.

## Side-effect policy

Side effects must be classified:

- `TRANSACTIONAL`: must commit with the business change.
- `OUTBOX`: written in the same transaction and delivered asynchronously.
- `BEST_EFFORT`: may fail but must be visible and retryable.
- `FORBIDDEN`: cannot happen automatically.

Examples:

| Operation | Side effect | Class |
|---|---|---|
| Publish evaluation | Consumer notification | OUTBOX |
| Record payment | Receipt generation | OUTBOX |
| Upload evidence | Object metadata row | TRANSACTIONAL + compensation |
| Cancel session | Parent notification | OUTBOX |
| AI draft | Publish to parent | FORBIDDEN without human approval |
