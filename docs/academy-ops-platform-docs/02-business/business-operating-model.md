# Business Operating Model

## Operating model

The academy is managed as a set of connected operating loops:

```text
Lead → Registration → Enrollment → Scheduling → Session Delivery
→ Attendance → Evaluation → Review/Publish → Parent/Student Visibility
→ Invoice → Payment → Reconciliation → Reporting
```

A successful platform keeps the loops connected while allowing each team to operate in its own workspace.

## Business areas

### Academy governance

Owns branches, roles, permissions, policies, terms, schedules, classrooms, pricing, and auditability.

### Admissions and registration

Captures a lead or walk-in request, registers the student, links guardians, selects an offering, confirms capacity, and creates an enrollment or waitlist record.

### Academic operations

Maintains course templates, groups, instructor assignment, room resources, recurring sessions, attendance, evaluations, and intervention signals.

### Finance

Creates invoices, records offline or provider-backed payments, stores evidence, handles expenses, performs corrections, reconciles balances, and reports to owners.

### Family and student experience

Provides relationship-scoped visibility into sessions, attendance, published evaluations, invoices, and approved requests.

### Marketing

Captures and qualifies leads, attributes campaigns, assigns ownership, follows up, and converts qualified leads into registration. This area remains a decision gate until its lifecycle and data contract are finalized.

## Operating rules

1. One operational record has one clear owner at each stage.
2. A record may be visible to many roles but mutable only by authorized roles.
3. Every handoff has a state, actor, timestamp, and next action.
4. Every financial or publication decision is auditable.
5. A failure must preserve the user's work and expose recovery.
6. Cross-module side effects must be reliable or explicitly marked pending.
7. Reports must state whether they are live operational views or reconciled financial views.

## Key handoffs

| Handoff | Producer | Consumer | Required evidence |
|---|---|---|---|
| Lead to registration | Secretary/Marketing | Secretary/Branch Manager | lead source, contact, consent, dedupe decision |
| Registration to enrollment | Secretary | Branch Manager/Operations | student identity, offering, capacity, guardian link |
| Enrollment to session | Scheduling | Instructor | valid offering, roster, room, instructor, time |
| Session to attendance | Instructor | Operations/Head Instructor | attendance state, save/submit status |
| Attendance to evaluation | Instructor | Head Instructor | evaluation draft/submission |
| Evaluation to family | Head Instructor | Parent/Student | published state and visibility policy |
| Enrollment to invoice | Finance | Parent/Student | invoice lines, due date, enrollment reference |
| Payment to reconciliation | Secretary/Accountant | Owner/Reports | immutable payment, evidence, reconciliation state |
| Expense to approval | Staff | Manager/Owner/Accountant | amount, reason, evidence, decision |

## KPIs

### Operational

- Active enrollments.
- Session completion rate.
- Attendance completion before lock.
- Conflict rate.
- Instructor substitution resolution time.
- Waitlist conversion rate.

### Academic

- Evaluation submission rate.
- Request-changes rate.
- Publication delay.
- Student progress trend.
- At-risk or missing-work count.

### Financial

- Outstanding balance.
- Collection rate.
- Failed/processing payment count.
- Reconciliation age.
- Correction rate.
- Expense approval age.

### Product health

- Time to first useful action.
- Permission confusion events.
- Failed mutation recovery rate.
- Mobile completion rate.
- Support contacts by workflow.
