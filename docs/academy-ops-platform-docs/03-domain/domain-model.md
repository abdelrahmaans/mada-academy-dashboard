# Domain Model

## Modeling rules

Every entity must document:

- Identity.
- Owning tenant and branch.
- Aggregate owner.
- Lifecycle.
- Mutability.
- Relationships.
- PII classification.
- Audit requirements.
- Retention/deletion behavior.
- Indexes and uniqueness rules.

## Core entities

### Tenant

Represents an academy organization. Owns branches, memberships, policies, settings, and tenant-level reports.

### Branch

Represents a campus or operating unit within a tenant. Owns classrooms, groups, sessions, local staff scope, and branch operations.

### UserAccount

Represents an authenticated account. Identity is separate from academy membership. One user may have memberships in multiple tenants or branches.

### Membership

Connects a user to a tenant/branch and role. Contains scope level, status, effective dates, and optional custom permissions.

### Student

Represents the learner as an academy record. A student can have multiple enrollments and guardian relationships.

### GuardianStudentLink

Represents a relationship between a guardian account and a student. It controls consumer visibility and must be lifecycle-managed.

### CourseTemplate

Tenant-level reusable academic definition: name, duration, default pricing, standard rules, and description.

### CourseOffering / Group

Branch-level operating instance of a course. Owns capacity, schedule, instructor assignment, classroom policy, enrollment, and generated sessions.

### Classroom / ClassroomResource

Bookable physical or virtual resources. Resources have availability, capacity, features, and branch ownership.

### AcademySession

A single scheduled learning event. References its offering/group, instructor, classroom, students, attendance, evaluations, and completion state.

### StudentEnrollment

Connects a student to an offering. Contains enrollment status, start/end dates, capacity decision, waitlist position, and cancellation reason.

### SessionAttendance

A student/session record with attendance status, notes, actor, and correction/lock semantics.

### SessionEvaluation

A student/session academic evaluation. Has draft, submit, review, request-changes, publish, and correction semantics.

### Invoice / InvoiceLine

Invoice is an immutable financial document after finalization. Lines describe the commercial basis.

### PaymentTransaction

Append-only payment record. Stores integer minor-unit amount, method, reference, actor, idempotency key, and reconciliation status.

### PaymentEvidence

Private file metadata attached to a payment. The object itself is stored through a provider port.

### Expense

Branch-scoped expense with amount, reason, evidence, approval, and status.

### ApprovalRequest

Generic governed decision linked to a target aggregate. Contains requester, decision maker, reason, state, and transitions.

### AuditEvent

Append-only security and business history event. Must include actor, tenant, branch, action, target, reason, correlation ID, and timestamp.

### ImportJob / ImportPreviewRow

Durable preview/commit workflow for CSV or future structured imports.

## Relationship rules

```text
Tenant 1—N Branch
Tenant 1—N Membership
UserAccount 1—N Membership
Branch 1—N Classroom
Branch 1—N CourseOffering
CourseTemplate 1—N CourseOffering
CourseOffering 1—N AcademySession
CourseOffering 1—N StudentEnrollment
Student 1—N StudentEnrollment
AcademySession 1—N SessionAttendance
Student 1—N SessionAttendance
AcademySession 1—N SessionEvaluation
Student 1—N SessionEvaluation
Student 1—N GuardianStudentLink
Invoice 1—N InvoiceLine
Invoice 1—N PaymentTransaction
PaymentTransaction 1—0..1 PaymentEvidence
Aggregate 1—N ApprovalRequest / AuditEvent / StateTransitionEvent
```

## Aggregate recommendations

### Identity aggregate

Tenant, membership, account status, and invitations must be changed through application commands. Direct updates are prohibited.

### Offering aggregate

Group/offering owns capacity, schedule policy, instructors, and enrollment decisions. Sessions are generated from it but may carry explicit exceptions.

### Session aggregate

Session owns roster snapshot, room/instructor conflict claims, attendance lock, completion, and session-level evaluation availability.

### Evaluation aggregate

Evaluation owns its lifecycle and visibility. Publication is a governed transition.

### Invoice aggregate

Invoice owns lines and finalization. Payments are separate append-only records; corrections use a governed request.

### Import aggregate

Preview, validation, review, commit, expiration, and idempotent replay belong together.

## Data integrity requirements

- Add explicit foreign keys for core relationships.
- Prevent cross-tenant or cross-branch references.
- Use unique indexes for natural identifiers and idempotency keys.
- Use optimistic concurrency tokens where multiple staff can edit.
- Use serializable or explicit locking for capacity and financial allocation decisions.
- Never delete audit history through ordinary business operations.
