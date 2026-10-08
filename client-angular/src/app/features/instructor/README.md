# R04 Instructor

## Current slice

This feature is the first Angular R04 vertical slice. It uses the shared auth guard, authorization guard, endpoint policy interceptor, standalone lazy routing, typed models, and separate API/data orchestration services.

Implemented API methods:

- `GET /api/v1/students` — backend returns only students enrolled in sessions assigned to the authenticated instructor.
- `GET /api/v1/sessions` — backend filters by `InstructorId` or `SubstituteInstructorId` and JWT tenant/branch scope.
- `GET /api/v1/sessions/{sessionId}` — assigned-session record lookup.
- `GET/PUT /api/v1/sessions/{sessionId}/attendance` — assigned-session attendance read/write; backend validates enrollment, status, editability, and scope.
- `POST /api/v1/sessions/{sessionId}/complete` — typed data-access method; backend requires R04, assignment, completed attendance, and scheduled end time.
- `GET/PUT/POST /api/v1/scheduling/sessions/{sessionId}/evaluations*` — draft/save/submit evaluator flow.
- `POST /api/v1/scheduling/sessions/{sessionId}/substitution-requests` — assigned instructor substitution request.

The client does not send `tenantId` or `branchId` to widen a query. Endpoint contexts are advisory and backend authorization remains authoritative.

## Current UI boundary

The route `/instructor` is LIVE-oriented and displays real API loading/error/empty states and attendance mutation. Evaluation and substitution methods are wired in data-access for the next UI slice; no demo data is shown when API calls fail.

## Required acceptance

- Assigned instructor can see only own/substitute sessions and enrolled students.
- Another instructor's session returns no data / `404 SESSION_NOT_FOUND`.
- Attendance write rejects incomplete/invalid records and completed/cancelled sessions.
- Evaluation writes remain limited to assigned instructor and allowed state transitions.
- Completion requires all attendance and session end time.
- Substitution request cannot be duplicated and cannot target another instructor's session.
