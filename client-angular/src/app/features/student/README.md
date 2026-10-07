# Angular R09 — Student Portal

## Scope

This slice adds the Angular read-only Student Portal at `/student-portal` for `R09_STUDENT`.

- `GET /api/v1/consumer/me/students` supplies the backend-linked student profile.
- `GET /api/v1/consumer/me/sessions` supplies sessions, attendance, and published evaluation fields.
- The client does not send `studentId`, `tenantId`, or `branchId` to select scope.
- The backend remains authoritative through `consumer` authorization and `StudentAccountLink` checks.

## LIVE boundary

The page has no demo fixtures. Empty profiles, empty sessions, forbidden responses, and API failures remain explicit live states. A session failure preserves the linked student profile and offers retry; a profile failure does not render invented student or session data.

## Role boundary

The route is guarded for `R09_STUDENT`. This is navigation UX only; API authorization and student-link ownership are enforced by the backend.
