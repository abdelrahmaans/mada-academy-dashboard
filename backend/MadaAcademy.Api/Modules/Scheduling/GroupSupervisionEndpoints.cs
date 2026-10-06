using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Scheduling;

public static class GroupSupervisionEndpoints
{
    public static IEndpointRouteBuilder MapGroupSupervisionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/supervision").RequireAuthorization("staff");
        api.MapGet("/branch-groups", ListBranchGroupsAsync);
        api.MapPost("/assignments", CreateAssignmentAsync);
        api.MapDelete("/assignments/{assignmentId:guid}", RevokeAssignmentAsync);
        api.MapGet("/my-groups", ListMyGroupsAsync);
        return endpoints;
    }

    private static async Task<IResult> ListBranchGroupsAsync(ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!IsBranchManager(user) || !TryScope(user, out var tenantId, out var branchId)) return Forbidden("SUPERVISION_MANAGEMENT_FORBIDDEN");
        var now = DateTimeOffset.UtcNow;
        var items = await (from offering in db.CourseOfferings.AsNoTracking()
                           join template in db.CourseTemplates.AsNoTracking() on offering.CourseTemplateId equals template.Id
                           join instructor in db.UserAccounts.AsNoTracking() on offering.InstructorId equals instructor.Id
                           where offering.TenantId == tenantId && offering.BranchId == branchId && offering.Status != "ARCHIVED"
                           orderby template.Name
                           select new
                           {
                               id = offering.Id,
                               courseName = template.Name,
                               instructorId = offering.InstructorId,
                               instructorName = instructor.DisplayName,
                               startDate = offering.StartDate,
                               endDate = offering.EndDate,
                               status = offering.Status,
                               enrolledStudents = db.StudentEnrollments.Count(item => item.CourseOfferingId == offering.Id && item.Status == "ACTIVE"),
                               maxStudents = offering.MaxStudents,
                               assignments = db.GroupSupervisionAssignments.AsNoTracking()
                                   .Where(item => item.CourseOfferingId == offering.Id && item.TenantId == tenantId && item.BranchId == branchId && item.Status == "ACTIVE")
                                   .Join(db.UserAccounts.AsNoTracking(), item => item.SupervisorUserId, account => account.Id, (item, account) => new
                                   {
                                       assignmentId = item.Id,
                                       supervisorUserId = item.SupervisorUserId,
                                       supervisorName = account.DisplayName,
                                       item.CanReadAttendance,
                                       item.CanReviewEvaluations,
                                       item.StartsAt,
                                       item.EndsAt,
                                       isCurrentlyEffective = (!item.StartsAt.HasValue || item.StartsAt <= now) && (!item.EndsAt.HasValue || item.EndsAt > now)
                                   }).ToList()
                           }).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items, total = items.Count, branchId } });
    }

    private static async Task<IResult> CreateAssignmentAsync(
        CreateSupervisionAssignmentRequest request,
        ClaimsPrincipal user,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        if (!IsBranchManager(user) || !TryScope(user, out var tenantId, out var branchId)) return Forbidden("SUPERVISION_MANAGEMENT_FORBIDDEN");
        if (request.CourseOfferingId == Guid.Empty || request.SupervisorUserId == Guid.Empty) return Validation("assignment", "A group and supervisor are required.");
        if (!request.CanReadAttendance && !request.CanReviewEvaluations) return Validation("permissions", "Select at least one supervision permission.");
        var now = DateTimeOffset.UtcNow;
        if (request.EndsAt.HasValue && request.EndsAt <= now) return Validation("endsAt", "The end time must be in the future.");
        if (request.EndsAt.HasValue && request.StartsAt.HasValue && request.EndsAt <= request.StartsAt) return Validation("endsAt", "The end time must be after the start time.");

        var group = await db.CourseOfferings.AsNoTracking().SingleOrDefaultAsync(item => item.Id == request.CourseOfferingId && item.TenantId == tenantId && item.BranchId == branchId && item.Status != "ARCHIVED", cancellationToken);
        if (group is null) return NotFound("GROUP_NOT_FOUND");
        var supervisor = await db.Memberships.AsNoTracking().SingleOrDefaultAsync(item => item.UserAccountId == request.SupervisorUserId && item.TenantId == tenantId && item.BranchId == branchId && item.Status == "ACTIVE" && (item.RoleCode == "R03_HEAD_INSTRUCTORS" || item.RoleCode == "R04_INSTRUCTOR"), cancellationToken);
        if (supervisor is null) return Forbidden("SUPERVISOR_SCOPE_DENIED");
        var existing = await db.GroupSupervisionAssignments
            .Where(item => item.TenantId == tenantId && item.BranchId == branchId && item.CourseOfferingId == group.Id && item.SupervisorUserId == request.SupervisorUserId)
            .OrderByDescending(item => item.Status == "ACTIVE")
            .ThenByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        var existingIsEffective = existing is not null && existing.Status == "ACTIVE" && (!existing.EndsAt.HasValue || existing.EndsAt > now);
        if (existingIsEffective) return Results.Conflict(new { error = new { code = "SUPERVISION_ASSIGNMENT_EXISTS", message = "This supervisor is already assigned to the group." } });

        var assignment = existing ?? new GroupSupervisionAssignment { TenantId = tenantId, BranchId = branchId, CourseOfferingId = group.Id, SupervisorUserId = request.SupervisorUserId, CreatedByUserId = ActorId(user) ?? Guid.Empty };
        assignment.CanReadAttendance = request.CanReadAttendance;
        assignment.CanReviewEvaluations = request.CanReviewEvaluations;
        assignment.StartsAt = request.StartsAt;
        assignment.EndsAt = request.EndsAt;
        assignment.Status = "ACTIVE";
        assignment.RevokedAt = null;
        assignment.RevokedByUserId = null;
        assignment.CreatedByUserId = ActorId(user) ?? assignment.CreatedByUserId;
        if (existing is null) db.GroupSupervisionAssignments.Add(assignment);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(user), TenantId = tenantId, BranchId = branchId, Action = "SUPERVISION_ASSIGNMENT_GRANTED", TargetType = "GROUP_SUPERVISION_ASSIGNMENT", TargetId = assignment.Id.ToString(), Reason = "Branch manager assigned group supervision access.", MetadataJson = $"{{\"groupId\":\"{group.Id}\",\"supervisorUserId\":\"{request.SupervisorUserId}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { assignmentId = assignment.Id, groupId = assignment.CourseOfferingId, supervisorUserId = assignment.SupervisorUserId, assignment.Status, assignment.CanReadAttendance, assignment.CanReviewEvaluations, assignment.StartsAt, assignment.EndsAt } });
    }

    private static async Task<IResult> RevokeAssignmentAsync(Guid assignmentId, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!IsBranchManager(user) || !TryScope(user, out var tenantId, out var branchId)) return Forbidden("SUPERVISION_MANAGEMENT_FORBIDDEN");
        var assignment = await db.GroupSupervisionAssignments.SingleOrDefaultAsync(item => item.Id == assignmentId && item.TenantId == tenantId && item.BranchId == branchId && item.Status == "ACTIVE", cancellationToken);
        if (assignment is null) return NotFound("ASSIGNMENT_NOT_FOUND");
        assignment.Status = "REVOKED";
        assignment.RevokedAt = DateTimeOffset.UtcNow;
        assignment.RevokedByUserId = ActorId(user);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(user), TenantId = tenantId, BranchId = branchId, Action = "SUPERVISION_ASSIGNMENT_REVOKED", TargetType = "GROUP_SUPERVISION_ASSIGNMENT", TargetId = assignment.Id.ToString(), Reason = "Branch manager revoked group supervision access." });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { assignmentId, status = assignment.Status } });
    }

    private static async Task<IResult> ListMyGroupsAsync(ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanReadMyGroups(user) || !TryScope(user, out var tenantId, out var branchId)) return Forbidden("SUPERVISION_READ_FORBIDDEN");
        var now = DateTimeOffset.UtcNow;
        var items = await (from assignment in db.GroupSupervisionAssignments.AsNoTracking()
                           join offering in db.CourseOfferings.AsNoTracking() on assignment.CourseOfferingId equals offering.Id
                           join template in db.CourseTemplates.AsNoTracking() on offering.CourseTemplateId equals template.Id
                           where assignment.TenantId == tenantId && assignment.BranchId == branchId && assignment.SupervisorUserId == ActorId(user) && assignment.Status == "ACTIVE" && offering.TenantId == tenantId && offering.BranchId == branchId && template.TenantId == tenantId && (!assignment.StartsAt.HasValue || assignment.StartsAt <= now) && (!assignment.EndsAt.HasValue || assignment.EndsAt > now)
                           select new { assignmentId = assignment.Id, groupId = offering.Id, courseName = template.Name, offering.StartDate, offering.EndDate, offering.Status, assignment.CanReadAttendance, assignment.CanReviewEvaluations }).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items, total = items.Count, branchId } });
    }

    private static bool IsBranchManager(ClaimsPrincipal user) => user.IsInRole("R02_BRANCH_MANAGER");
    private static bool CanReadMyGroups(ClaimsPrincipal user) => user.IsInRole("R03_HEAD_INSTRUCTORS") || user.IsInRole("R04_INSTRUCTOR");
    private static bool TryScope(ClaimsPrincipal user, out Guid tenantId, out Guid branchId)
    {
        var tenantOk = Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId);
        var branchOk = Guid.TryParse(user.FindFirstValue("branchId"), out branchId);
        return tenantOk && branchOk;
    }
    private static Guid? ActorId(ClaimsPrincipal user) => Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult Forbidden(string code) => Results.Problem(statusCode: 403, title: "Supervision access denied", extensions: new Dictionary<string, object?> { ["code"] = code });
    private static IResult NotFound(string code) => Results.NotFound(new { error = new { code, message = "The requested supervision record was not found." } });
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
}

public sealed record CreateSupervisionAssignmentRequest(Guid SupervisorUserId, Guid CourseOfferingId, bool CanReadAttendance = false, bool CanReviewEvaluations = false, DateTimeOffset? StartsAt = null, DateTimeOffset? EndsAt = null);
