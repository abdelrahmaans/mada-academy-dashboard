# Product Charter

## Product vision

Build a role-aware academy operating system that reduces administrative work, prevents operational mistakes, and gives every participant a clear next action.

The platform should make an academy easier to run, not merely easier to report on.

## Product promise

For every role, the system should provide:

- A clear operating context: academy, branch, academic period, and current scope.
- A focused workspace rather than a generic dashboard.
- Action queues instead of disconnected numbers.
- Safe defaults and deliberate confirmations.
- Explainable access: what the user can do and why.
- Recoverable failures with preserved drafts and clear next steps.
- A consistent experience across desktop, tablet, and mobile.

## Primary customer

An academy owner or operator managing one or more educational, sports, language, arts, technology, or training academies with staff, groups, sessions, students, guardians, payments, and reporting needs.

## Core outcomes

1. Reduce time spent scheduling and correcting sessions.
2. Reduce attendance and evaluation errors.
3. Reduce missed payments and unclear financial ownership.
4. Make role delegation safe and explainable.
5. Give parents and students timely, privacy-safe visibility.
6. Give owners reliable operational and financial insight.
7. Make growth from one branch to multiple branches possible without redesigning the whole system.

## Product principles

### Action-first

Every workspace begins with the tasks the role must complete today. The product may show metrics, but each metric must lead to a useful action.

### Context-first

The active academy, branch, term, group, and relationship are visible before data is shown.

### Permission clarity

Access is not a hidden implementation detail. The product should explain unavailable actions without exposing protected data.

### Progressive commitment

The user can draft, validate, preview, submit, approve, and commit. High-impact changes are never silently applied.

### Operational truth

The system distinguishes live, pending, failed, rejected, locked, preview, and demo states. It never makes unavailable data look successful.

### Mobile by transformation

Mobile is not a smaller desktop. A dense table becomes a focused list, an operational calendar becomes an agenda, and a long form becomes a step-by-step task.

## Success measures

- Time to complete enrollment.
- Time to schedule a conflict-free session.
- Attendance completion rate before session close.
- Evaluation correction rate.
- Payment reconciliation time.
- Number of unauthorized access incidents.
- Permission-request resolution time.
- Parent/student task completion on mobile.
- Failed-job recovery time.
- Support tickets caused by unclear state or permissions.

## Release philosophy

Release vertical slices that are safe and useful. Do not release empty module shells. A vertical slice includes its role, data, actions, error states, audit, tests, and mobile behavior.
