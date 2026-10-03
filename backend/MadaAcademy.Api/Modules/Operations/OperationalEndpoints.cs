using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Operations;

public static class OperationalEndpoints
{
    public static IEndpointRouteBuilder MapMadaOperationalEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var operations = endpoints.MapGroup("/api/v1").RequireAuthorization("staff");

        operations.MapGet("/students", async Task<Results<Ok<ApiEnvelope<StudentListResponse>>, ProblemHttpResult>> (
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;

            var query = db.Students.AsNoTracking()
                .Where(student => student.TenantId == scope.TenantId)
                .Where(student => scope.BranchId == null || student.BranchId == scope.BranchId.Value);

            if (user.IsInRole("R04_INSTRUCTOR") && Guid.TryParse(user.FindFirstValue("sub"), out var instructorId))
                query = query.Where(student => db.StudentEnrollments.Any(enrollment => enrollment.StudentId == student.Id && enrollment.Status == "ACTIVE" && db.AcademySessions.Any(session => session.CourseOfferingId == enrollment.CourseOfferingId && session.TenantId == scope.TenantId && (scope.BranchId == null || session.BranchId == scope.BranchId.Value) && (session.InstructorId == instructorId || session.SubstituteInstructorId == instructorId))));

            var students = await query
                .OrderBy(student => student.FullName)
                .Select(student => new StudentListItem(
                    student.Id,
                    student.BranchId,
                    student.FullName,
                    student.DateOfBirth,
                    student.Status,
                    db.StudentEnrollments.Count(enrollment => enrollment.StudentId == student.Id && enrollment.Status == "ACTIVE")))
                .ToListAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<StudentListResponse>(
                new StudentListResponse(students, students.Count, scope.ScopeLevel, scope.BranchId)));
        });

        operations.MapGet("/sessions", async Task<Results<Ok<ApiEnvelope<SessionListResponse>>, ProblemHttpResult>> (
            ClaimsPrincipal user,
            MadaDbContext db,
            DateTimeOffset? from,
            DateTimeOffset? to,
            string? status,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            if (from.HasValue && to.HasValue && from > to)
                return Problem(400, "INVALID_DATE_RANGE", "The from date must be before the to date.");

            var query = db.AcademySessions.AsNoTracking()
                .Where(session => session.TenantId == scope.TenantId)
                .Where(session => scope.BranchId == null || session.BranchId == scope.BranchId.Value);

            if (user.IsInRole("R04_INSTRUCTOR") && Guid.TryParse(user.FindFirstValue("sub"), out var instructorId))
                query = query.Where(session => session.InstructorId == instructorId || session.SubstituteInstructorId == instructorId);
            if (from.HasValue) query = query.Where(session => session.EndAt >= from.Value);
            if (to.HasValue) query = query.Where(session => session.StartAt <= to.Value);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(session => session.Status == status.ToUpperInvariant());

            var sessions = await ProjectSessions(db, query)
                .OrderBy(session => session.StartAt)
                .ToListAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<SessionListResponse>(
                new SessionListResponse(sessions, sessions.Count, scope.ScopeLevel, scope.BranchId)));
        });

        operations.MapGet("/sessions/{sessionId:guid}", async Task<Results<Ok<ApiEnvelope<SessionDetails>>, ProblemHttpResult>> (
            Guid sessionId,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;

            var scopedSessions = db.AcademySessions.AsNoTracking()
                .Where(item => item.Id == sessionId)
                .Where(item => item.TenantId == scope.TenantId)
                .Where(item => scope.BranchId == null || item.BranchId == scope.BranchId.Value);
            if (user.IsInRole("R04_INSTRUCTOR"))
            {
                if (!Guid.TryParse(user.FindFirstValue("sub"), out var instructorId)) return Problem(404, "SESSION_NOT_FOUND", "The session was not found in the current scope.");
                scopedSessions = scopedSessions.Where(item => item.InstructorId == instructorId || item.SubstituteInstructorId == instructorId);
            }
            var session = await ProjectSessions(db, scopedSessions).SingleOrDefaultAsync(cancellationToken);

            return session is null
                ? Problem(404, "SESSION_NOT_FOUND", "The session was not found in the current scope.")
                : TypedResults.Ok(new ApiEnvelope<SessionDetails>(session));
        });

        operations.MapGet("/sessions/{sessionId:guid}/attendance", async Task<Results<Ok<ApiEnvelope<AttendanceResponse>>, ProblemHttpResult>> (
            Guid sessionId,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            var session = await FindScopedSession(db, sessionId, scope, cancellationToken);
            if (session is null) return Problem(404, "SESSION_NOT_FOUND", "The session was not found in the current scope.");

            if (!IsAssignedInstructor(user, session)) return Problem(404, "SESSION_NOT_FOUND", "The session was not found in the current scope.");

            var rows = await LoadAttendance(db, session, cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<AttendanceResponse>(
                new AttendanceResponse(session.Id, session.Status, rows, rows.Count)));
        });

        operations.MapPut("/sessions/{sessionId:guid}/attendance", async Task<Results<Ok<ApiEnvelope<AttendanceResponse>>, ProblemHttpResult>> (
            Guid sessionId,
            AttendanceUpsertRequest request,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!CanWriteAttendance(user))
                return Problem(403, "ATTENDANCE_WRITE_FORBIDDEN", "Only instructors, head instructors, or branch managers can record attendance.");
            var records = request.Records;
            if (records is null || records.Count == 0)
                return Problem(400, "ATTENDANCE_REQUIRED", "At least one attendance record is required.");
            if (records.Select(record => record.StudentId).Distinct().Count() != records.Count)
                return Problem(400, "DUPLICATE_STUDENT", "Each student may appear only once in an attendance request.");

            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            var session = await FindScopedSession(db, sessionId, scope, cancellationToken);
            if (session is null) return Problem(404, "SESSION_NOT_FOUND", "The session was not found in the current scope.");

            if (!IsAssignedInstructor(user, session)) return Problem(404, "SESSION_NOT_FOUND", "The session was not found in the current scope.");
            if (session.Status is "CANCELLED" or "COMPLETED")
                return Problem(409, "SESSION_NOT_EDITABLE", "Attendance can only be recorded for an active scheduled session.");

            foreach (var record in records)
            {
                if (string.IsNullOrWhiteSpace(record.Status) || !AttendanceStatuses.Contains(record.Status.ToUpperInvariant()))
                    return Problem(422, "INVALID_ATTENDANCE_STATUS", "Status must be PRESENT, LATE, ABSENT, or EXCUSED.");
                if (record.Status.Equals("LATE", StringComparison.OrdinalIgnoreCase) && record.LateMinutes is <= 0)
                    return Problem(422, "INVALID_LATE_MINUTES", "Late attendance requires a positive lateMinutes value.");
                if (!record.Status.Equals("LATE", StringComparison.OrdinalIgnoreCase) && record.LateMinutes is not null)
                    return Problem(422, "INVALID_LATE_MINUTES", "lateMinutes is only allowed for LATE attendance.");
            }

            var studentIds = records.Select(record => record.StudentId).ToArray();
            var enrolledStudentIds = await db.StudentEnrollments
                .Where(enrollment => enrollment.CourseOfferingId == session.CourseOfferingId && enrollment.Status == "ACTIVE" && studentIds.Contains(enrollment.StudentId))
                .Select(enrollment => enrollment.StudentId)
                .ToListAsync(cancellationToken);
            var invalidStudent = studentIds.FirstOrDefault(studentId => !enrolledStudentIds.Contains(studentId));
            if (invalidStudent != Guid.Empty)
                return Problem(422, "STUDENT_NOT_ENROLLED", $"Student {invalidStudent} is not enrolled in this session.");

            var existing = await db.SessionAttendances
                .Where(attendance => attendance.SessionId == sessionId && studentIds.Contains(attendance.StudentId))
                .ToDictionaryAsync(attendance => attendance.StudentId, cancellationToken);
            foreach (var record in records)
            {
                if (existing.TryGetValue(record.StudentId, out var attendance))
                {
                    attendance.Status = record.Status.ToUpperInvariant();
                    attendance.LateMinutes = record.LateMinutes;
                    attendance.UpdatedAt = DateTimeOffset.UtcNow;
                }
                else
                {
                    db.SessionAttendances.Add(new SessionAttendance
                    {
                        SessionId = sessionId,
                        StudentId = record.StudentId,
                        Status = record.Status.ToUpperInvariant(),
                        LateMinutes = record.LateMinutes
                    });
                }
            }
            await db.SaveChangesAsync(cancellationToken);

            var rows = await LoadAttendance(db, session, cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<AttendanceResponse>(
                new AttendanceResponse(session.Id, session.Status, rows, rows.Count)));
        });

        operations.MapPost("/sessions/{sessionId:guid}/complete", async Task<Results<Ok<ApiEnvelope<SessionCompletionResponse>>, ProblemHttpResult>> (
            Guid sessionId,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!user.IsInRole("R04_INSTRUCTOR"))
                return Problem(403, "SESSION_COMPLETION_FORBIDDEN", "Only an instructor can complete an assigned session.");
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            var session = await FindScopedSession(db, sessionId, scope, cancellationToken);
            if (session is null || !IsAssignedInstructor(user, session))
                return Problem(404, "SESSION_NOT_FOUND", "The session was not found in the current scope.");
            if (session.Status is "COMPLETED" or "CANCELLED")
                return Problem(409, "SESSION_NOT_COMPLETABLE", "The session is already complete or cancelled.");
            if (session.Status is not ("SCHEDULED" or "IN_PROGRESS"))
                return Problem(409, "SESSION_NOT_COMPLETABLE", "Only scheduled or in-progress sessions can be completed.");
            var now = DateTimeOffset.UtcNow;
            if (session.EndAt > now)
                return Problem(409, "SESSION_NOT_ENDED", "A session can only be completed after its scheduled end time.");

            var attendance = await LoadAttendanceCore(db, session, cancellationToken);
            if (attendance.Count == 0 || attendance.Any(item => item.Status == "UNMARKED"))
                return Problem(409, "ATTENDANCE_INCOMPLETE", "Record attendance for every enrolled student before completing the session.");
            if (!Guid.TryParse(user.FindFirstValue("sub"), out var actorId))
                return Problem(403, "SESSION_COMPLETION_FORBIDDEN", "The authenticated instructor identity is missing.");

            var previousStatus = session.Status;
            session.Status = "COMPLETED";
            session.CompletedAt = now;
            db.StateTransitions.Add(new StateTransitionEvent
            {
                AggregateType = "SESSION",
                AggregateId = session.Id.ToString(),
                FromState = previousStatus,
                ToState = "COMPLETED",
                ActorUserId = actorId,
                Reason = "Instructor completed the session after recording attendance."
            });
            db.AuditEvents.Add(new AuditEvent
            {
                ActorUserId = actorId,
                TenantId = session.TenantId,
                BranchId = session.BranchId,
                Action = "SESSION_COMPLETED",
                TargetType = "SESSION",
                TargetId = session.Id.ToString(),
                Reason = "Instructor completed the session after recording attendance."
            });
            await db.SaveChangesAsync(cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<SessionCompletionResponse>(new SessionCompletionResponse(session.Id, session.Status, now)));
        });

        return endpoints;
    }

    private static IQueryable<SessionDetails> ProjectSessions(MadaDbContext db, IQueryable<AcademySession> query) => query
        .Select(session => new SessionDetails(
            session.Id,
            session.BranchId,
            session.CourseOfferingId,
            session.SessionNumber,
            session.StartAt,
            session.EndAt,
            session.InstructorId,
            session.ClassroomId,
            session.Type,
            session.Status,
            session.Notes,
            session.CompletedAt,
            db.UserAccounts.Where(item => item.Id == session.InstructorId).Select(item => item.DisplayName).FirstOrDefault(),
            db.Classrooms.Where(item => item.Id == session.ClassroomId).Select(item => item.Name).FirstOrDefault(),
            db.Branches.Where(item => item.Id == session.BranchId).Select(item => item.Name).FirstOrDefault(),
            db.CourseOfferings.Where(item => item.Id == session.CourseOfferingId).Join(db.CourseTemplates, offering => offering.CourseTemplateId, course => course.Id, (_, course) => course.Name).FirstOrDefault()));

    private static async Task<AcademySession?> FindScopedSession(MadaDbContext db, Guid sessionId, Scope scope, CancellationToken cancellationToken) =>
        await db.AcademySessions.SingleOrDefaultAsync(session =>
            session.Id == sessionId && session.TenantId == scope.TenantId &&
            (scope.BranchId == null || session.BranchId == scope.BranchId.Value), cancellationToken);

    private static bool IsAssignedInstructor(ClaimsPrincipal user, AcademySession session) =>
        !user.IsInRole("R04_INSTRUCTOR") ||
        (Guid.TryParse(user.FindFirstValue("sub"), out var actorId) &&
         (session.InstructorId == actorId || session.SubstituteInstructorId == actorId));

    private static async Task<List<AttendanceItem>> LoadAttendance(MadaDbContext db, AcademySession session, CancellationToken cancellationToken) =>
        await LoadAttendanceCore(db, session, cancellationToken);

    private static async Task<List<AttendanceItem>> LoadAttendanceCore(MadaDbContext db, AcademySession session, CancellationToken cancellationToken)
    {
        var roster = await db.StudentEnrollments.AsNoTracking()
            .Where(enrollment => enrollment.CourseOfferingId == session.CourseOfferingId && enrollment.Status == "ACTIVE")
            .Join(db.Students.AsNoTracking(), enrollment => enrollment.StudentId, student => student.Id,
                (_, student) => new { student.Id, student.FullName })
            .OrderBy(student => student.FullName)
            .Select(student => new RosterStudent(student.Id, student.FullName))
            .ToListAsync(cancellationToken);
        var attendance = await db.SessionAttendances.AsNoTracking()
            .Where(item => item.SessionId == session.Id)
            .ToDictionaryAsync(item => item.StudentId, cancellationToken);
        return roster.Select(student => attendance.TryGetValue(student.Id, out var mark)
            ? new AttendanceItem(student.Id, student.FullName, mark.Status, mark.LateMinutes, mark.UpdatedAt)
            : new AttendanceItem(student.Id, student.FullName, "UNMARKED", null, null)).ToList();
    }

    private static bool CanWriteAttendance(ClaimsPrincipal user) =>
        user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R03_HEAD_INSTRUCTORS") || user.IsInRole("R04_INSTRUCTOR");

    private static bool TryGetScope(ClaimsPrincipal user, out Scope scope, out ProblemHttpResult error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
        {
            scope = default;
            error = Problem(403, "TENANT_SCOPE_REQUIRED", "The authenticated account has no tenant scope.");
            return false;
        }
        var branchClaim = user.FindFirstValue("branchId");
        scope = new Scope(tenantId, Guid.TryParse(branchClaim, out var branchId) ? branchId : null, user.FindFirstValue("scopeLevel") ?? "unknown");
        error = default!;
        return true;
    }

    private static ProblemHttpResult Problem(int status, string code, string detail) =>
        TypedResults.Problem(statusCode: status, title: code, detail: detail,
            extensions: new Dictionary<string, object?> { ["code"] = code });

    private static readonly HashSet<string> AttendanceStatuses = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];
    private sealed record RosterStudent(Guid Id, string FullName);
    private readonly record struct Scope(Guid TenantId, Guid? BranchId, string ScopeLevel);
}

public sealed record ApiEnvelope<T>(T Data);
public sealed record StudentListResponse(IReadOnlyList<StudentListItem> Items, int Total, string ScopeLevel, Guid? BranchId);
public sealed record StudentListItem(Guid Id, Guid BranchId, string FullName, DateOnly? DateOfBirth, string Status, int ActiveEnrollmentCount);
public sealed record SessionListResponse(IReadOnlyList<SessionDetails> Items, int Total, string ScopeLevel, Guid? BranchId);
public sealed record SessionDetails(Guid Id, Guid BranchId, Guid? CourseOfferingId, int SessionNumber, DateTimeOffset StartAt, DateTimeOffset EndAt, Guid InstructorId, Guid ClassroomId, string Type, string Status, string? Notes, DateTimeOffset? CompletedAt, string? InstructorName = null, string? ClassroomName = null, string? BranchName = null, string? CourseName = null);
public sealed record AttendanceResponse(Guid SessionId, string SessionStatus, IReadOnlyList<AttendanceItem> Items, int Total);
public sealed record AttendanceItem(Guid StudentId, string StudentName, string Status, int? LateMinutes, DateTimeOffset? UpdatedAt);
public sealed record AttendanceUpsertRequest(IReadOnlyList<AttendanceRecordRequest>? Records);
public sealed record AttendanceRecordRequest(Guid StudentId, string Status, int? LateMinutes = null);
public sealed record SessionCompletionResponse(Guid SessionId, string Status, DateTimeOffset CompletedAt);
