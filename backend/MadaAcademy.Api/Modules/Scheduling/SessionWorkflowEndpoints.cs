using System.Data;
using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace MadaAcademy.Api.Modules.Scheduling;

public static class SessionWorkflowEndpoints
{
    private static readonly string[] SessionRequestTypes = ["EXTRA", "MAKEUP"];

    public static IEndpointRouteBuilder MapMadaSessionWorkflowEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var scheduling = endpoints.MapGroup("/api/v1/scheduling").RequireAuthorization("staff");
        scheduling.MapGet("/course-templates", ListCourseTemplatesAsync);
        scheduling.MapPost("/course-templates", CreateCourseTemplateAsync);
        scheduling.MapGet("/groups", ListGroupsAsync);
        scheduling.MapGet("/instructors", ListInstructorsAsync);
        scheduling.MapPost("/sessions", CreateSessionAsync);
        scheduling.MapPost("/groups", CreateGroupAsync);
        scheduling.MapPost("/session-requests", RequestSessionAsync);
        scheduling.MapPost("/sessions/{sessionId:guid}/substitution-requests", RequestSubstitutionAsync);
        scheduling.MapPost("/approvals/{approvalId:guid}/proposals", ProposeSubstituteAsync);
        scheduling.MapGet("/approvals", ListApprovalsAsync);
        scheduling.MapPost("/approvals/{approvalId:guid}/decision", DecideApprovalAsync);
        scheduling.MapPut("/sessions/{sessionId:guid}/evaluations", UpsertEvaluationsAsync);
        scheduling.MapGet("/notifications", ListNotificationsAsync);
        scheduling.MapPost("/notifications/{notificationId:guid}/read", MarkNotificationReadAsync);
        return endpoints;
    }

    private static async Task<IResult> ListCourseTemplatesAsync(ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanCreateGroup(user) || !Scope(user, out var tenantId, out _)) return Forbidden("SCHEDULING_READ_FORBIDDEN");
        var items = await db.CourseTemplates.AsNoTracking()
            .Where(item => item.TenantId == tenantId && item.Status != "ARCHIVED")
            .OrderBy(item => item.Name)
            .Select(item => new { item.Id, item.Name, item.Track, item.Type, item.AgeGroup, item.Level, item.TotalSessions, item.SessionDurationHours, item.BasePricePiastres, item.Status })
            .ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items, total = items.Count } });
    }

    private static async Task<IResult> CreateCourseTemplateAsync(CreateCourseTemplateRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanCreateGroup(user) || !Scope(user, out var tenantId, out _)) return Forbidden("SCHEDULING_WRITE_FORBIDDEN");
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 160 || request.TotalSessions < 1 || request.SessionDurationHours <= 0 || request.BasePricePiastres < 0)
            return Validation("course", "Name, positive session count and duration, and a non-negative price are required.");
        var course = new CourseTemplate
        {
            TenantId = tenantId,
            Name = request.Name.Trim(),
            Track = string.IsNullOrWhiteSpace(request.Track) ? "general" : request.Track.Trim().ToLowerInvariant(),
            Type = string.IsNullOrWhiteSpace(request.Type) ? "hard" : request.Type.Trim().ToLowerInvariant(),
            AgeGroup = string.IsNullOrWhiteSpace(request.AgeGroup) ? "all" : request.AgeGroup.Trim(),
            Level = string.IsNullOrWhiteSpace(request.Level) ? "beginner" : request.Level.Trim().ToLowerInvariant(),
            TotalSessions = request.TotalSessions,
            SessionDurationHours = request.SessionDurationHours,
            BasePricePiastres = request.BasePricePiastres,
            Status = "DRAFT"
        };
        db.CourseTemplates.Add(course);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/scheduling/course-templates/{course.Id}", new { data = new { course.Id, course.Name, course.Track, course.Type, course.AgeGroup, course.Level, course.TotalSessions, course.SessionDurationHours, course.BasePricePiastres, course.Status } });
    }

    private static async Task<IResult> ListGroupsAsync(ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanCreateGroup(user) || !Scope(user, out var tenantId, out var branchScope)) return Forbidden("SCHEDULING_READ_FORBIDDEN");
        var items = await (from offering in db.CourseOfferings.AsNoTracking()
                           join template in db.CourseTemplates.AsNoTracking() on offering.CourseTemplateId equals template.Id
                           join branch in db.Branches.AsNoTracking() on offering.BranchId equals branch.Id
                           join classroom in db.Classrooms.AsNoTracking() on offering.ClassroomId equals classroom.Id
                           join instructor in db.UserAccounts.AsNoTracking() on offering.InstructorId equals instructor.Id
                           where offering.TenantId == tenantId && (!branchScope.HasValue || offering.BranchId == branchScope.Value)
                           orderby offering.StartDate descending
                           select new
                           {
                               offering.Id, offering.CourseTemplateId, courseName = template.Name, track = template.Track,
                               branchId = offering.BranchId, branchName = branch.Name,
                               instructorId = offering.InstructorId, instructorName = instructor.DisplayName,
                               classroomId = offering.ClassroomId, classroomName = classroom.Name,
                               startDate = offering.StartDate, endDate = offering.EndDate,
                               weeklyScheduleJson = offering.WeeklyScheduleJson, offering.Status, offering.MaxStudents,
                               enrolledStudents = db.StudentEnrollments.Count(enrollment => enrollment.CourseOfferingId == offering.Id && enrollment.Status == "ACTIVE")
                           }).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items, total = items.Count } });
    }

    private static async Task<IResult> ListInstructorsAsync(ClaimsPrincipal user, MadaDbContext db, Guid? branchId, CancellationToken cancellationToken)
    {
        if (!CanCreateGroup(user) || !Scope(user, out var tenantId, out var branchScope)) return Forbidden("SCHEDULING_READ_FORBIDDEN");
        if (branchScope.HasValue && branchId.HasValue && branchScope != branchId) return Forbidden("BRANCH_SCOPE_DENIED");
        var selectedBranch = branchScope ?? branchId;
        var items = await db.Memberships.AsNoTracking()
            .Where(item => item.TenantId == tenantId && item.Status == "ACTIVE" &&
                (item.RoleCode == "R03_HEAD_INSTRUCTORS" || item.RoleCode == "R04_INSTRUCTOR") &&
                (!selectedBranch.HasValue || item.BranchId == null || item.BranchId == selectedBranch) &&
                item.UserAccount != null && item.UserAccount.AccountType == "staff" && item.UserAccount.Status == "ACTIVE")
            .OrderBy(item => item.UserAccount!.DisplayName)
            .Select(item => new { id = item.UserAccountId, name = item.UserAccount!.DisplayName, item.RoleCode, item.BranchId })
            .Distinct()
            .ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items, total = items.Count, branchId = selectedBranch } });
    }

    private static async Task<IResult> CreateSessionAsync(CreateSessionRequest request, ClaimsPrincipal user, MadaDbContext db, ConflictService conflicts, CancellationToken cancellationToken)
    {
        if (!CanCreateGroup(user)) return Results.Forbid();
        if (!Scope(user, out var tenantId, out var branchScope)) return Forbidden("TENANT_SCOPE_REQUIRED");
        if (branchScope.HasValue && branchScope != request.BranchId) return Forbidden("BRANCH_SCOPE_DENIED");
        if (request.EndAt <= request.StartAt) return Validation("time", "EndAt must be after StartAt.");
        var classroom = await db.Classrooms.SingleOrDefaultAsync(item => item.Id == request.ClassroomId && item.BranchId == request.BranchId && item.Status == "AVAILABLE", cancellationToken);
        if (classroom is null) return Conflict("CLASSROOM_UNAVAILABLE", "The selected classroom is not available.");
        if (!await IsActiveStaffMember(db, request.InstructorId, tenantId, request.BranchId, cancellationToken)) return Validation("instructorId", "The instructor is not active in this branch.");
        if (request.CourseOfferingId.HasValue && !await db.CourseOfferings.AnyAsync(item => item.Id == request.CourseOfferingId && item.TenantId == tenantId && item.BranchId == request.BranchId, cancellationToken)) return Validation("courseOfferingId", "The group does not belong to this branch.");
        var conflict = await conflicts.CheckAsync(new ConflictCheckRequest(request.BranchId, request.InstructorId, request.ClassroomId, request.Kits ?? [], request.StudentIds ?? [], request.StartAt, request.EndAt), cancellationToken);
        if (conflict.HasConflict) return Results.Conflict(new { error = new { code = "SCHEDULING_CONFLICT", details = conflict.Conflicts } });
        await using var transaction = await BeginTransactionAsync(db, cancellationToken);
        var session = new AcademySession { TenantId = tenantId, BranchId = request.BranchId, CourseOfferingId = request.CourseOfferingId, SessionNumber = request.SessionNumber, StartAt = request.StartAt, EndAt = request.EndAt, InstructorId = request.InstructorId, ClassroomId = request.ClassroomId, Type = string.IsNullOrWhiteSpace(request.Type) ? "REGULAR" : request.Type.ToUpperInvariant(), Status = "SCHEDULED", Notes = request.Notes };
        db.AcademySessions.Add(session);
        foreach (var kit in request.Kits ?? []) db.KitAssignments.Add(new KitAssignment { SessionId = session.Id, KitId = kit.KitId, QuantityUsed = kit.Quantity });
        await db.SaveChangesAsync(cancellationToken);
        await NotifyStaffAsync(db, tenantId, request.BranchId, request.InstructorId, "SESSION_CREATED", "تم إنشاء جلسة", "تم حفظ جلسة جديدة في الجدول.", "SESSION", session.Id.ToString(), cancellationToken);
        await db.SaveChangesAsync(cancellationToken); await CommitAsync(transaction, cancellationToken);
        return Results.Created($"/api/v1/scheduling/sessions/{session.Id}", new { data = new { sessionId = session.Id, status = session.Status, sessionNumber = session.SessionNumber, startAt = session.StartAt, endAt = session.EndAt, classroomId = session.ClassroomId, instructorId = session.InstructorId } });
    }

    private static async Task<IResult> CreateGroupAsync(CreateGroupRequest request, ClaimsPrincipal user, MadaDbContext db, ConflictService conflicts, CancellationToken cancellationToken)
    {
        if (!CanCreateGroup(user)) return Results.Forbid();
        if (!Scope(user, out var tenantId, out var branchScope)) return Forbidden("TENANT_SCOPE_REQUIRED");
        if (branchScope.HasValue && branchScope != request.BranchId) return Forbidden("BRANCH_SCOPE_DENIED");
        if (request.StartDate > request.EndDate || request.DaysOfWeek is null || request.DaysOfWeek.Count == 0 || request.DurationMinutes is < 15 or > 480)
            return Validation("schedule", "The date range, days, and duration are invalid.");
        var branch = await db.Branches.SingleOrDefaultAsync(item => item.Id == request.BranchId && item.TenantId == tenantId && item.Status == "ACTIVE", cancellationToken);
        var template = await db.CourseTemplates.SingleOrDefaultAsync(item => item.Id == request.CourseTemplateId && item.TenantId == tenantId && item.Status != "ARCHIVED", cancellationToken);
        var classroom = await db.Classrooms.SingleOrDefaultAsync(item => item.Id == request.ClassroomId && item.BranchId == request.BranchId && item.Status == "AVAILABLE", cancellationToken);
        if (branch is null) return NotFound("BRANCH_NOT_FOUND");
        if (template is null) return NotFound("COURSE_TEMPLATE_NOT_FOUND");
        if (classroom is null) return Conflict("CLASSROOM_UNAVAILABLE", "The selected classroom is not available in this branch.");
        if (!await IsActiveStaffMember(db, request.InstructorId, tenantId, request.BranchId, cancellationToken)) return Validation("instructorId", "The instructor is not an active member of this branch.");
        var studentIds = (request.StudentIds ?? []).Distinct().ToArray();
        if (studentIds.Length > request.MaxStudents || request.MaxStudents < 1 || request.MaxStudents > classroom.Capacity) return Validation("studentIds", "The group size exceeds the classroom or group capacity.");
        var validStudents = await db.Students.Where(student => student.TenantId == tenantId && student.BranchId == request.BranchId && student.Status == "ACTIVE" && studentIds.Contains(student.Id)).Select(student => student.Id).ToListAsync(cancellationToken);
        if (validStudents.Count != studentIds.Length) return Validation("studentIds", "All students must belong to the selected active branch.");
        var sessionDrafts = GenerateSessions(request);
        if (sessionDrafts.Count == 0) return Validation("daysOfWeek", "No sessions could be generated from the selected range.");
        await using var transaction = await BeginTransactionAsync(db, cancellationToken);
        foreach (var draft in sessionDrafts)
        {
            var conflict = await conflicts.CheckAsync(new ConflictCheckRequest(request.BranchId, request.InstructorId, request.ClassroomId, [], studentIds, draft.StartAt, draft.EndAt), cancellationToken);
            if (conflict.HasConflict) return Results.Conflict(new { error = new { code = "SCHEDULING_CONFLICT", details = conflict.Conflicts, sessionStart = draft.StartAt, sessionEnd = draft.EndAt } });
        }
        var offering = new CourseOffering { TenantId = tenantId, BranchId = request.BranchId, CourseTemplateId = template.Id, InstructorId = request.InstructorId, ClassroomId = classroom.Id, StartDate = request.StartDate, EndDate = request.EndDate, WeeklyScheduleJson = System.Text.Json.JsonSerializer.Serialize(new { daysOfWeek = request.DaysOfWeek, startTime = request.StartTime, durationMinutes = request.DurationMinutes }), Status = "ACTIVE", MaxStudents = request.MaxStudents };
        db.CourseOfferings.Add(offering);
        foreach (var studentId in studentIds) db.StudentEnrollments.Add(new StudentEnrollment { StudentId = studentId, CourseOfferingId = offering.Id, FinalPricePiastres = request.FinalPricePiastres, Status = "ACTIVE" });
        foreach (var draft in sessionDrafts) db.AcademySessions.Add(new AcademySession { TenantId = tenantId, BranchId = request.BranchId, CourseOfferingId = offering.Id, SessionNumber = draft.Number, StartAt = draft.StartAt, EndAt = draft.EndAt, InstructorId = request.InstructorId, ClassroomId = request.ClassroomId, Type = "REGULAR", Status = "SCHEDULED", Notes = request.Notes });
        await db.SaveChangesAsync(cancellationToken);
        await NotifyStaffAsync(db, tenantId, request.BranchId, request.InstructorId, "GROUP_CREATED", "تم إنشاء مجموعة جديدة", $"تم إنشاء مجموعة {template.Name} وتوليد {sessionDrafts.Count} جلسة.", "COURSE_OFFERING", offering.Id.ToString(), cancellationToken);
        await CommitAsync(transaction, cancellationToken);
        return Results.Created($"/api/v1/scheduling/groups/{offering.Id}", new { data = new { groupId = offering.Id, courseTemplateId = template.Id, sessionsCreated = sessionDrafts.Count, studentCount = studentIds.Length, classroomId = request.ClassroomId, instructorId = request.InstructorId } });
    }

    private static async Task<IResult> RequestSessionAsync(RequestSessionRequest request, ClaimsPrincipal user, MadaDbContext db, ConflictService conflicts, CancellationToken cancellationToken)
    {
        if (!CanCreateGroup(user) && !IsInstructor(user)) return Forbidden("SESSION_REQUEST_FORBIDDEN");
        if (!SessionRequestTypes.Contains(request.Type.ToUpperInvariant())) return Validation("type", "Type must be EXTRA or MAKEUP.");
        if (!Scope(user, out var tenantId, out var branchScope)) return Forbidden("TENANT_SCOPE_REQUIRED");
        if (branchScope.HasValue && branchScope != request.BranchId) return Forbidden("BRANCH_SCOPE_DENIED");
        var actorId = Actor(user); if (!actorId.HasValue) return Forbidden("ACTOR_REQUIRED");
        var instructorId = IsInstructor(user) ? actorId.Value : request.InstructorId ?? actorId.Value;
        if (!await IsActiveStaffMember(db, instructorId, tenantId, request.BranchId, cancellationToken)) return Validation("instructorId", "Instructor is not active in this branch.");
        var classroom = await db.Classrooms.SingleOrDefaultAsync(item => item.Id == request.ClassroomId && item.BranchId == request.BranchId && item.Status == "AVAILABLE", cancellationToken);
        if (classroom is null) return Conflict("CLASSROOM_UNAVAILABLE", "The selected classroom is not available.");
        if (request.EndAt <= request.StartAt) return Validation("time", "EndAt must be after StartAt.");
        var conflict = await conflicts.CheckAsync(new ConflictCheckRequest(request.BranchId, instructorId, request.ClassroomId, [], request.StudentIds ?? [], request.StartAt, request.EndAt), cancellationToken);
        if (conflict.HasConflict) return Results.Conflict(new { error = new { code = "SCHEDULING_CONFLICT", details = conflict.Conflicts } });
        var session = new AcademySession { TenantId = tenantId, BranchId = request.BranchId, CourseOfferingId = request.CourseOfferingId, SessionNumber = request.SessionNumber, StartAt = request.StartAt, EndAt = request.EndAt, InstructorId = instructorId, ClassroomId = request.ClassroomId, Type = request.Type.ToUpperInvariant(), Status = "PENDING_APPROVAL", Notes = request.Notes };
        db.AcademySessions.Add(session);
        var approval = new ApprovalRequest { TenantId = tenantId, BranchId = request.BranchId, RequestType = request.Type.ToUpperInvariant(), TargetType = "SESSION", TargetId = session.Id.ToString(), SubmittedByRole = user.FindFirstValue("role") ?? "STAFF", Reason = request.Reason };
        db.ApprovalRequests.Add(approval);
        await db.SaveChangesAsync(cancellationToken);
        await NotifyStaffAsync(db, tenantId, request.BranchId, null, "SESSION_APPROVAL_REQUIRED", "طلب جلسة يحتاج موافقة", $"يوجد طلب جلسة {request.Type} جديد للمراجعة.", "APPROVAL_REQUEST", approval.Id.ToString(), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Accepted($"/api/v1/scheduling/approvals/{approval.Id}", new { data = new { approvalId = approval.Id, sessionId = session.Id, state = approval.State, type = session.Type } });
    }

    private static async Task<IResult> RequestSubstitutionAsync(Guid sessionId, SubstitutionRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!IsInstructor(user)) return Forbidden("INSTRUCTOR_REQUIRED");
        if (!Scope(user, out var tenantId, out var branchScope)) return Forbidden("TENANT_SCOPE_REQUIRED");
        var actorId = Actor(user); if (!actorId.HasValue) return Forbidden("ACTOR_REQUIRED");
        var session = await db.AcademySessions.SingleOrDefaultAsync(item => item.Id == sessionId && item.TenantId == tenantId && (!branchScope.HasValue || item.BranchId == branchScope.Value), cancellationToken);
        if (session is null) return NotFound("SESSION_NOT_FOUND");
        if (session.InstructorId != actorId.Value) return Forbidden("ONLY_ASSIGNED_INSTRUCTOR");
        if (session.Status is "COMPLETED" or "CANCELLED") return Conflict("SESSION_NOT_EDITABLE", "This session cannot be substituted.");
        var existing = await db.ApprovalRequests.AnyAsync(item => item.TargetType == "SESSION" && item.TargetId == sessionId.ToString() && item.RequestType == "INSTRUCTOR_SUBSTITUTION" && item.State == "PENDING", cancellationToken);
        if (existing) return Conflict("SUBSTITUTION_ALREADY_PENDING", "A substitution request is already pending.");
        var approval = new ApprovalRequest { TenantId = tenantId, BranchId = session.BranchId, RequestType = "INSTRUCTOR_SUBSTITUTION", TargetType = "SESSION", TargetId = session.Id.ToString(), SubmittedByRole = user.FindFirstValue("role") ?? "R04_INSTRUCTOR", Reason = request.Reason };
        db.ApprovalRequests.Add(approval); await db.SaveChangesAsync(cancellationToken);
        await NotifyStaffAsync(db, tenantId, session.BranchId, null, "SUBSTITUTION_APPROVAL_REQUIRED", "طلب بديل يحتاج موافقة", "المدرب الأساسي يطلب بديلًا لهذه الجلسة.", "APPROVAL_REQUEST", approval.Id.ToString(), cancellationToken); await db.SaveChangesAsync(cancellationToken);
        return Results.Accepted(null, new { data = new { approvalId = approval.Id, sessionId, state = approval.State } });
    }

    private static async Task<IResult> ProposeSubstituteAsync(Guid approvalId, SubstituteProposalRequest request, ClaimsPrincipal user, MadaDbContext db, ConflictService conflicts, CancellationToken cancellationToken)
    {
        if (!IsInstructor(user) || !Scope(user, out var tenantId, out var branchScope)) return Forbidden("INSTRUCTOR_REQUIRED");
        var actorId = Actor(user); if (!actorId.HasValue) return Forbidden("ACTOR_REQUIRED");
        var approval = await db.ApprovalRequests.SingleOrDefaultAsync(item => item.Id == approvalId && item.TenantId == tenantId && item.RequestType == "INSTRUCTOR_SUBSTITUTION" && item.State == "PENDING", cancellationToken);
        if (approval is null) return NotFound("APPROVAL_NOT_FOUND");
        var session = await db.AcademySessions.SingleOrDefaultAsync(item => item.Id.ToString() == approval.TargetId && (!branchScope.HasValue || item.BranchId == branchScope.Value), cancellationToken);
        if (session is null || session.InstructorId == actorId.Value) return Forbidden("INVALID_SUBSTITUTE");
        var already = await db.SessionSubstitutionProposals.AnyAsync(item => item.ApprovalRequestId == approvalId && item.ProposedInstructorId == actorId.Value, cancellationToken);
        if (already) return Conflict("PROPOSAL_ALREADY_SENT", "You already proposed yourself for this session.");
        var conflict = await conflicts.CheckAsync(new ConflictCheckRequest(session.BranchId, actorId.Value, session.ClassroomId, [], [], session.StartAt, session.EndAt), cancellationToken);
        if (conflict.HasConflict) return Conflict("INSTRUCTOR_UNAVAILABLE", "You have a scheduling conflict at this time.");
        db.SessionSubstitutionProposals.Add(new SessionSubstitutionProposal { ApprovalRequestId = approvalId, SessionId = session.Id, ProposedInstructorId = actorId.Value, SubmittedByUserId = actorId.Value, Message = request.Message });
        await db.SaveChangesAsync(cancellationToken);
        await NotifyStaffAsync(db, tenantId, session.BranchId, null, "SUBSTITUTE_PROPOSAL_RECEIVED", "مدرب متاح للجلسة", "وصل عرض من مدرب متاح لتغطية الجلسة.", "APPROVAL_REQUEST", approvalId.ToString(), cancellationToken); await db.SaveChangesAsync(cancellationToken);
        return Results.Accepted(null, new { data = new { approvalId, proposedInstructorId = actorId.Value } });
    }

    private static async Task<IResult> ListApprovalsAsync(ClaimsPrincipal user, MadaDbContext db, string? state, CancellationToken cancellationToken)
    {
        if (!CanDecide(user) || !Scope(user, out var tenantId, out var branchScope)) return Forbidden("APPROVAL_REVIEW_FORBIDDEN");
        var normalizedState = string.IsNullOrWhiteSpace(state) || state.Equals("ALL", StringComparison.OrdinalIgnoreCase) ? null : state.Trim().ToUpperInvariant();
        if (normalizedState is not null && normalizedState is not ("PENDING" or "APPROVED" or "REJECTED")) return Validation("state", "State must be ALL, PENDING, APPROVED, or REJECTED.");
        var approvals = await db.ApprovalRequests.AsNoTracking()
            .Where(item => item.TenantId == tenantId && (!branchScope.HasValue || item.BranchId == branchScope.Value) && (normalizedState == null || item.State == normalizedState))
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);
        var approvalIds = approvals.Select(item => item.Id).ToArray();
        var proposals = await db.SessionSubstitutionProposals.AsNoTracking()
            .Where(item => approvalIds.Contains(item.ApprovalRequestId) && item.State == "PENDING")
            .GroupBy(item => item.ApprovalRequestId)
            .Select(group => new { ApprovalId = group.Key, InstructorId = group.Select(item => item.ProposedInstructorId).FirstOrDefault() })
            .ToDictionaryAsync(item => item.ApprovalId, item => (Guid?)item.InstructorId, cancellationToken);
        var targetSessionIds = approvals.Where(item => item.TargetType == "SESSION").Select(item => Guid.TryParse(item.TargetId, out var id) ? id : Guid.Empty).Where(id => id != Guid.Empty).Distinct().ToArray();
        var sessionContext = await db.AcademySessions.AsNoTracking().Where(item => item.TenantId == tenantId && targetSessionIds.Contains(item.Id))
            .Select(item => new
            {
                item.Id, item.StartAt, item.EndAt, item.SessionNumber,
                branchName = db.Branches.Where(branch => branch.Id == item.BranchId).Select(branch => branch.Name).FirstOrDefault(),
                instructorName = db.UserAccounts.Where(account => account.Id == item.InstructorId).Select(account => account.DisplayName).FirstOrDefault(),
                courseName = db.CourseOfferings.Where(offering => offering.Id == item.CourseOfferingId).Join(db.CourseTemplates, offering => offering.CourseTemplateId, course => course.Id, (_, course) => course.Name).FirstOrDefault()
            }).ToDictionaryAsync(item => item.Id, cancellationToken);
        var branchIds = approvals.Where(item => item.BranchId.HasValue).Select(item => item.BranchId!.Value).Distinct().ToArray();
        var branchNames = await db.Branches.AsNoTracking().Where(item => branchIds.Contains(item.Id)).ToDictionaryAsync(item => item.Id, item => item.Name, cancellationToken);
        var items = approvals.Select(item =>
        {
            var hasTarget = Guid.TryParse(item.TargetId, out var targetId);
            sessionContext.TryGetValue(hasTarget ? targetId : Guid.Empty, out var context);
            return new
            {
                item.Id, item.TenantId, item.BranchId, item.RequestType, item.TargetType, item.TargetId,
                item.SubmittedByRole, item.State, item.Reason, item.CreatedAt, item.DecidedAt, item.DecidedByUserId,
                proposedInstructorId = proposals.GetValueOrDefault(item.Id),
                branchName = item.BranchId.HasValue ? branchNames.GetValueOrDefault(item.BranchId.Value) : null,
                sessionStartAt = context?.StartAt,
                sessionEndAt = context?.EndAt,
                sessionNumber = context?.SessionNumber,
                courseName = context?.courseName,
                instructorName = context?.instructorName
            };
        }).ToList();
        return Results.Ok(new { data = new { items, total = items.Count } });
    }

    private static async Task<IResult> DecideApprovalAsync(Guid approvalId, ApprovalDecision request, ClaimsPrincipal user, MadaDbContext db, ConflictService conflicts, CancellationToken cancellationToken)
    {
        if (!CanDecide(user) || !Scope(user, out var tenantId, out var branchScope)) return Forbidden("APPROVAL_REVIEW_FORBIDDEN");
        var approval = await db.ApprovalRequests.SingleOrDefaultAsync(item => item.Id == approvalId && item.TenantId == tenantId && item.State == "PENDING" && (!branchScope.HasValue || item.BranchId == branchScope.Value), cancellationToken);
        if (approval is null) return NotFound("APPROVAL_NOT_FOUND");
        var actorId = Actor(user); var decision = request.Decision.Trim().ToUpperInvariant(); if (decision is not ("APPROVED" or "REJECTED")) return Validation("decision", "Decision must be APPROVED or REJECTED.");
        var session = await db.AcademySessions.SingleOrDefaultAsync(item => item.Id.ToString() == approval.TargetId && item.TenantId == tenantId, cancellationToken);
        if (session is null) return NotFound("SESSION_NOT_FOUND");
        Guid? selectedInstructor = null;
        if (approval.RequestType == "INSTRUCTOR_SUBSTITUTION" && decision == "APPROVED")
        {
            selectedInstructor = request.AssignedInstructorId;
            if (!selectedInstructor.HasValue) selectedInstructor = await db.SessionSubstitutionProposals.Where(item => item.ApprovalRequestId == approvalId && item.State == "PENDING").Select(item => (Guid?)item.ProposedInstructorId).FirstOrDefaultAsync(cancellationToken);
            if (!selectedInstructor.HasValue) return Validation("assignedInstructorId", "Choose an available substitute instructor.");
            var conflict = await conflicts.CheckAsync(new ConflictCheckRequest(session.BranchId, selectedInstructor.Value, session.ClassroomId, [], [], session.StartAt, session.EndAt), cancellationToken);
            if (conflict.HasConflict) return Conflict("INSTRUCTOR_UNAVAILABLE", "The selected substitute is no longer available.");
            session.SubstituteInstructorId = selectedInstructor.Value;
            session.Status = "SCHEDULED";
        }
        else session.Status = decision == "APPROVED" ? "SCHEDULED" : "CANCELLED";
        approval.State = decision; approval.DecidedByUserId = actorId; approval.DecidedAt = DateTimeOffset.UtcNow; approval.Reason = request.Reason ?? approval.Reason;
        var proposals = await db.SessionSubstitutionProposals.Where(item => item.ApprovalRequestId == approvalId).ToListAsync(cancellationToken); foreach (var proposal in proposals) proposal.State = selectedInstructor == proposal.ProposedInstructorId ? "SELECTED" : decision == "APPROVED" ? "NOT_SELECTED" : "REJECTED";
        db.StateTransitions.Add(new StateTransitionEvent { AggregateType = "APPROVAL_REQUEST", AggregateId = approval.Id.ToString(), FromState = "PENDING", ToState = decision, ActorUserId = actorId, Reason = request.Reason });
        await db.SaveChangesAsync(cancellationToken);
        await NotifyStaffAsync(db, tenantId, session.BranchId, session.InstructorId, "APPROVAL_DECIDED", decision == "APPROVED" ? "تمت الموافقة على الطلب" : "تم رفض الطلب", approval.RequestType == "INSTRUCTOR_SUBSTITUTION" && selectedInstructor.HasValue ? "تم اعتماد المدرب البديل للجلسة." : $"تم { (decision == "APPROVED" ? "اعتماد" : "رفض") } طلب الجلسة.", "SESSION", session.Id.ToString(), cancellationToken); await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { approvalId, state = approval.State, sessionId = session.Id, sessionStatus = session.Status, substituteInstructorId = session.SubstituteInstructorId } });
    }

    private static async Task<IResult> UpsertEvaluationsAsync(Guid sessionId, EvaluationBatchRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!IsInstructor(user) || !Scope(user, out var tenantId, out var branchScope)) return Forbidden("EVALUATION_WRITE_FORBIDDEN");
        var actorId = Actor(user); if (!actorId.HasValue) return Forbidden("ACTOR_REQUIRED");
        var session = await db.AcademySessions.SingleOrDefaultAsync(item => item.Id == sessionId && item.TenantId == tenantId && (!branchScope.HasValue || item.BranchId == branchScope.Value) && (item.InstructorId == actorId.Value || item.SubstituteInstructorId == actorId.Value), cancellationToken);
        if (session is null) return NotFound("SESSION_NOT_FOUND");
        var ids = request.Items.Select(item => item.StudentId).Distinct().ToArray(); var enrolled = await db.StudentEnrollments.Where(item => item.CourseOfferingId == session.CourseOfferingId && item.Status == "ACTIVE" && ids.Contains(item.StudentId)).Select(item => item.StudentId).ToListAsync(cancellationToken); if (enrolled.Count != ids.Length) return Validation("items", "All evaluated students must be enrolled in the group.");
        var current = await db.SessionEvaluations.Where(item => item.SessionId == sessionId && ids.Contains(item.StudentId)).ToDictionaryAsync(item => item.StudentId, cancellationToken);
        foreach (var item in request.Items) { if (item.Score is < 0 or > 100) return Validation("score", "Score must be between 0 and 100."); if (current.TryGetValue(item.StudentId, out var evaluation)) { evaluation.Score = item.Score; evaluation.Notes = item.Notes; evaluation.InstructorId = actorId.Value; } else db.SessionEvaluations.Add(new SessionEvaluation { SessionId = sessionId, StudentId = item.StudentId, InstructorId = actorId.Value, Score = item.Score, Notes = item.Notes }); }
        await db.SaveChangesAsync(cancellationToken); return Results.Ok(new { data = new { sessionId, saved = request.Items.Count } });
    }

    private static async Task<IResult> ListNotificationsAsync(ClaimsPrincipal user, MadaDbContext db, bool unreadOnly, CancellationToken cancellationToken)
    {
        if (!Actor(user).HasValue) return Forbidden("ACTOR_REQUIRED"); var id = Actor(user)!.Value; var rows = await db.InAppNotifications.AsNoTracking().Where(item => item.RecipientUserId == id && (!unreadOnly || !item.IsRead)).OrderByDescending(item => item.CreatedAt).Take(100).ToListAsync(cancellationToken); return Results.Ok(new { data = new { items = rows, total = rows.Count } });
    }
    private static async Task<IResult> MarkNotificationReadAsync(Guid notificationId, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Actor(user).HasValue) return Forbidden("ACTOR_REQUIRED"); var row = await db.InAppNotifications.SingleOrDefaultAsync(item => item.Id == notificationId && item.RecipientUserId == Actor(user)!.Value, cancellationToken); if (row is null) return NotFound("NOTIFICATION_NOT_FOUND"); row.IsRead = true; await db.SaveChangesAsync(cancellationToken); return Results.NoContent();
    }

    private static List<SessionDraft> GenerateSessions(CreateGroupRequest request)
    {
        var days = request.DaysOfWeek.Distinct().ToHashSet(); var result = new List<SessionDraft>(); var number = 1; var date = request.StartDate;
        while (date <= request.EndDate) { if (days.Contains((int)date.DayOfWeek)) { var start = new DateTimeOffset(date.ToDateTime(request.StartTime), TimeSpan.Zero); result.Add(new SessionDraft(number++, start, start.AddMinutes(request.DurationMinutes))); } date = date.AddDays(1); }
        return result;
    }
    private static async Task<IDbContextTransaction?> BeginTransactionAsync(MadaDbContext db, CancellationToken token) => db.Database.IsRelational() ? await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, token) : null;
    private static async Task CommitAsync(IDbContextTransaction? transaction, CancellationToken token) { if (transaction is not null) await transaction.CommitAsync(token); }
    private static async Task<bool> IsActiveStaffMember(MadaDbContext db, Guid userId, Guid tenantId, Guid branchId, CancellationToken token) => await db.Memberships.AnyAsync(item => item.UserAccountId == userId && item.TenantId == tenantId && (item.BranchId == branchId || item.BranchId == null) && item.Status == "ACTIVE", token);
    private static async Task NotifyStaffAsync(MadaDbContext db, Guid tenantId, Guid branchId, Guid? directRecipient, string type, string title, string body, string targetType, string targetId, CancellationToken token)
    { var recipients = await db.Memberships.Where(item => item.TenantId == tenantId && item.Status == "ACTIVE" && (item.BranchId == branchId || item.BranchId == null) && (directRecipient == null || item.UserAccountId == directRecipient.Value || item.RoleCode == "R01_ACADEMY_OWNER" || item.RoleCode == "R02_BRANCH_MANAGER" || item.RoleCode == "R03_HEAD_INSTRUCTORS")).Select(item => item.UserAccountId).Distinct().ToListAsync(token); foreach (var recipient in recipients) db.InAppNotifications.Add(new InAppNotification { TenantId = tenantId, BranchId = branchId, RecipientUserId = recipient, Type = type, Title = title, Body = body, TargetType = targetType, TargetId = targetId }); }
    private static bool Scope(ClaimsPrincipal user, out Guid tenantId, out Guid? branchId) { var ok = Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId); branchId = Guid.TryParse(user.FindFirstValue("branchId"), out var parsed) ? parsed : null; return ok; }
    private static Guid? Actor(ClaimsPrincipal user) => Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;
    private static bool IsInstructor(ClaimsPrincipal user) => user.IsInRole("R04_INSTRUCTOR") || user.IsInRole("R03_HEAD_INSTRUCTORS");
    private static bool CanCreateGroup(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R03_HEAD_INSTRUCTORS");
    private static bool CanDecide(ClaimsPrincipal user) => user.IsInRole("R00_PLATFORM_ADMIN") || user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R03_HEAD_INSTRUCTORS");
    private static IResult NotFound(string code) => Results.NotFound(new { error = new { code, message = code } });
    private static IResult Conflict(string code, string message) => Results.Conflict(new { error = new { code, message } });
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
    private static IResult Forbidden(string code) => Results.Problem(statusCode: 403, title: code, extensions: new Dictionary<string, object?> { ["code"] = code });

    private sealed record SessionDraft(int Number, DateTimeOffset StartAt, DateTimeOffset EndAt);
}

public sealed record CreateGroupRequest(Guid BranchId, Guid CourseTemplateId, Guid InstructorId, Guid ClassroomId, DateOnly StartDate, DateOnly EndDate, IReadOnlyList<int> DaysOfWeek, TimeOnly StartTime, int DurationMinutes, int MaxStudents, IReadOnlyList<Guid>? StudentIds = null, int FinalPricePiastres = 0, string? Notes = null);
public sealed record CreateCourseTemplateRequest(string Name, string Track, string Type, string AgeGroup, string Level, int TotalSessions, decimal SessionDurationHours, int BasePricePiastres);
public sealed record CreateSessionRequest(Guid BranchId, Guid ClassroomId, Guid InstructorId, DateTimeOffset StartAt, DateTimeOffset EndAt, int SessionNumber, Guid? CourseOfferingId = null, string? Type = "REGULAR", string? Notes = null, IReadOnlyList<Guid>? StudentIds = null, IReadOnlyList<KitRequest>? Kits = null);
public sealed record RequestSessionRequest(string Type, Guid BranchId, Guid ClassroomId, DateTimeOffset StartAt, DateTimeOffset EndAt, int SessionNumber, IReadOnlyList<Guid>? StudentIds = null, Guid? CourseOfferingId = null, Guid? InstructorId = null, string? Reason = null, string? Notes = null);
public sealed record SubstitutionRequest(string Reason);
public sealed record SubstituteProposalRequest(string? Message);
public sealed record ApprovalDecision(string Decision, Guid? AssignedInstructorId = null, string? Reason = null);
public sealed record EvaluationBatchRequest(IReadOnlyList<EvaluationItem> Items);
public sealed record EvaluationItem(Guid StudentId, int? Score, string? Notes);
