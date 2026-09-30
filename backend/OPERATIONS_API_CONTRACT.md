# Mada Academy — Students, Sessions & Attendance API Contract

Base path: `/api/v1`

All endpoints below require a valid staff JWT. `tenantId` and `branchId` are always taken from the authenticated token; the client cannot widen its scope by sending them in the request body.

## Scope behavior

- Tenant-scoped staff see records for their tenant.
- Branch-scoped staff see records for their branch only.
- A record outside the authenticated scope is not returned.
- `R02_BRANCH_MANAGER`, `R03_HEAD_INSTRUCTORS`, and `R04_INSTRUCTOR` may write attendance.
- Other staff roles may read attendance but receive `403 ATTENDANCE_WRITE_FORBIDDEN` on writes.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/students` | List students in the authenticated tenant/branch scope |
| `GET` | `/sessions` | List sessions, optionally filtered by `from`, `to`, and `status` |
| `GET` | `/sessions/{sessionId}` | Read one session in scope |
| `GET` | `/sessions/{sessionId}/attendance` | Read enrolled students and attendance state |
| `PUT` | `/sessions/{sessionId}/attendance` | Upsert attendance for enrolled students |

## Response envelope

Successful responses use:

```json
{
  "data": {}
}
```

List responses include `items`, `total`, `scopeLevel`, and `branchId` where applicable.

### `GET /students`

Returns student items with:

```json
{
  "id": "guid",
  "branchId": "guid",
  "fullName": "string",
  "dateOfBirth": "YYYY-MM-DD|null",
  "status": "ACTIVE",
  "activeEnrollmentCount": 1
}
```

### `GET /sessions`

Optional query parameters:

- `from`: ISO-8601 date/time; includes sessions ending at or after this value.
- `to`: ISO-8601 date/time; includes sessions starting at or before this value.
- `status`: exact status filter, normalized to uppercase.

Session items include `id`, `branchId`, `courseOfferingId`, `sessionNumber`, `startAt`, `endAt`, `instructorId`, `classroomId`, `type`, `status`, `notes`, and `completedAt`.

### `GET /sessions/{sessionId}/attendance`

Returns enrolled students for the session. Students without a saved record are returned with `status: "UNMARKED"`.

Supported statuses:

```text
PRESENT | LATE | ABSENT | EXCUSED | UNMARKED (read-only derived state)
```

### `PUT /sessions/{sessionId}/attendance`

Request:

```json
{
  "records": [
    { "studentId": "guid", "status": "PRESENT" },
    { "studentId": "guid", "status": "LATE", "lateMinutes": 12 }
  ]
}
```

Rules:

- At least one record is required.
- A student can appear only once per request.
- Students must be actively enrolled in the session's course offering.
- `lateMinutes` is required and positive for `LATE`.
- `lateMinutes` is not allowed for other statuses.
- Attendance cannot be changed for `CANCELLED` or `COMPLETED` sessions.
- Existing records are updated; missing records are inserted.

## Error contract

Errors use ASP.NET Problem Details with a stable `title` and `extensions.code`:

| Status | Code | Meaning |
|---:|---|---|
| `400` | `INVALID_DATE_RANGE` | `from` is after `to` |
| `400` | `ATTENDANCE_REQUIRED` | No attendance records were submitted |
| `400` | `DUPLICATE_STUDENT` | Same student was submitted more than once |
| `401` | — | Missing or invalid/expired JWT |
| `403` | `TENANT_SCOPE_REQUIRED` | Token has no tenant scope |
| `403` | `ATTENDANCE_WRITE_FORBIDDEN` | Role cannot write attendance |
| `404` | `SESSION_NOT_FOUND` | Session is missing or outside the current scope |
| `409` | `SESSION_NOT_EDITABLE` | Session is cancelled or completed |
| `422` | `INVALID_ATTENDANCE_STATUS` | Unsupported status |
| `422` | `INVALID_LATE_MINUTES` | Invalid late-minute combination |
| `422` | `STUDENT_NOT_ENROLLED` | Student is not active in the session offering |
