# Mobile Readiness

## Strategy

The first mobile deliverable is a responsive Angular application with task-specific transformations. When native distribution is needed, package the same application with Capacitor rather than building a separate business implementation.

## Mobile users

The highest-value mobile workflows are likely:

- Instructor: today’s sessions, roster, attendance, evaluation draft, completion.
- Parent: next session, attendance, published evaluation, invoice status.
- Student: schedule, progress, required actions.
- Secretary: quick registration, lead follow-up, payment evidence capture.
- Manager: approvals, exceptions, daily branch overview.

## Mobile information architecture

Mobile navigation should expose five destinations at most in the primary bar. Additional modules appear in a role-aware “More” area. The active context remains visible and switchable without hiding the current role.

## Responsive transformations

A desktop table becomes a list with a clear primary field, status, key metadata, and one primary action. A calendar grid becomes an agenda grouped by day. A side panel becomes a bottom sheet or full-screen task. Bulk actions become selection mode. Long forms become step-based flows with preserved drafts.

## Native capability boundary

Native plugins must be wrapped behind interfaces:

```text
DeviceCameraPort
FilePickerPort
PushNotificationPort
BiometricAuthPort
SharePort
DeepLinkPort
```

The feature must still work on the web when a native capability is unavailable. The UI clearly explains the fallback.

## Offline policy

Offline support is not assumed for every workflow. It must be approved per operation.

Safe candidates:

- Read-only cached schedule.
- Read-only student roster.
- Draft evaluation text.
- Draft attendance that requires server reconciliation.

Unsafe by default:

- Payment commit.
- Invoice correction.
- Permission changes.
- Evaluation publication.
- Approval decisions without a conflict strategy.

Any offline mutation requires a local operation ID, encrypted local storage policy, conflict resolution, expiry, and a visible sync state.

## Mobile security

- Never store long-lived secrets in plain local storage.
- Clear sensitive cached data on logout or account switch.
- Protect screenshots/clipboard only where policy requires it.
- Use device authentication only as an additional gate, not as the complete server authorization model.
- Test deep links against tenant/branch scope.

## Mobile acceptance

Each mobile workflow must be tested on narrow viewport, keyboard open, slow network, offline/reconnect, expired token, permission denial, interrupted upload, and rotated orientation where supported.
