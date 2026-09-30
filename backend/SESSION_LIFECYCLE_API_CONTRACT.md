# Mada Academy — Session Lifecycle API Contract

## 1. Create a regular session

```http
POST /api/v1/scheduling/sessions
Authorization: Bearer <staff-token>
```

The endpoint validates branch scope, classroom availability, instructor membership, course-group ownership, and all scheduling conflicts before saving `AcademySession` and `KitAssignments` in one transaction.

```json
{
  "branchId": "uuid",
  "classroomId": "uuid",
  "instructorId": "uuid",
  "courseOfferingId": "uuid",
  "startAt": "2026-10-06T10:00:00Z",
  "endAt": "2026-10-06T11:00:00Z",
  "sessionNumber": 1,
  "type": "REGULAR",
  "studentIds": [],
  "kits": []
}
```

A conflict returns `409` with code `SCHEDULING_CONFLICT`.

## 2. Create a group and generate all regular sessions

```http
POST /api/v1/scheduling/groups
```

The API creates the `CourseOffering`, active `StudentEnrollments`, and all sessions generated from the date range and weekly days. It validates every generated slot before saving the batch.

```json
{
  "branchId": "uuid",
  "courseTemplateId": "uuid",
  "instructorId": "uuid",
  "classroomId": "uuid",
  "startDate": "2026-10-01",
  "endDate": "2026-12-31",
  "daysOfWeek": [0, 2, 4],
  "startTime": "16:00:00",
  "durationMinutes": 90,
  "maxStudents": 16,
  "studentIds": ["uuid"],
  "finalPricePiastres": 350000
}
```

## 3. Extra and makeup sessions

Instructors submit a request; the session is created as `PENDING_APPROVAL` and is not visible as an active scheduled session until approved.

```http
POST /api/v1/scheduling/session-requests
```

Allowed `type` values: `EXTRA`, `MAKEUP`.

## 4. Instructor substitution

The assigned instructor submits:

```http
POST /api/v1/scheduling/sessions/{sessionId}/substitution-requests
```

Available instructors can volunteer:

```http
POST /api/v1/scheduling/approvals/{approvalId}/proposals
```

Management reviews and selects the substitute:

```http
POST /api/v1/scheduling/approvals/{approvalId}/decision
```

On approval, `AcademySession.SubstituteInstructorId` is set and the substitute inherits the session operational flow for attendance and evaluation.

## 5. Attendance and evaluation

Existing attendance remains available at `/api/v1/sessions/{sessionId}/attendance`.

Instructor or approved substitute evaluation:

```http
PUT /api/v1/scheduling/sessions/{sessionId}/evaluations
```

## 6. Notifications

Workflow events create in-app notifications for the instructor, branch management, head instructors, and academy owner:

```http
GET  /api/v1/scheduling/notifications?unreadOnly=true
POST /api/v1/scheduling/notifications/{notificationId}/read
```

Parent/student account delivery is intentionally kept behind the consumer identity-linking milestone because the current `Student` entity does not yet contain a linked user/guardian account. The session and enrollment records already provide the correct future audience key.
