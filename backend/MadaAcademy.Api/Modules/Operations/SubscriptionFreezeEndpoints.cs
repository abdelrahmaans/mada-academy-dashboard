using System.Security.Claims;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Operations;

public static class SubscriptionFreezeEndpoints
{
    public static IEndpointRouteBuilder MapMadaFreezeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var staffGroup = endpoints.MapGroup("/api/v1/operations/freeze-requests").RequireAuthorization("staff");

        // 1. List freeze requests (Staff)
        staffGroup.MapGet("", async Task<Results<Ok<ApiEnvelope<IReadOnlyList<FreezeRequestItem>>>, ProblemHttpResult>> (
            string? status, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var query = db.SubscriptionFreezeRequests.AsNoTracking()
                .Where(x => x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value));

            if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "ALL", StringComparison.OrdinalIgnoreCase))
                query = query.Where(x => x.Status == status.Trim().ToUpperInvariant());

            var items = await (from f in query
                               join s in db.Students.AsNoTracking() on f.StudentId equals s.Id
                               join b in db.Branches.AsNoTracking() on f.BranchId equals b.Id
                               join o in db.CourseOfferings.AsNoTracking() on f.CourseOfferingId equals o.Id into offeringJoin
                               from o in offeringJoin.DefaultIfEmpty()
                               join t in db.CourseTemplates.AsNoTracking() on o.CourseTemplateId equals t.Id into templateJoin
                               from t in templateJoin.DefaultIfEmpty()
                               orderby f.CreatedAt descending
                               select new FreezeRequestItem(
                                   f.Id,
                                   f.StudentId,
                                   s.FullName,
                                   f.BranchId,
                                   b.Name,
                                   f.CourseOfferingId,
                                   t != null ? t.Name : "الدورة التدريبية",
                                   f.StartDate,
                                   f.EndDate,
                                   f.Reason,
                                   f.ReasonText,
                                   f.Status,
                                   f.SubmittedByRole,
                                   f.SubmittedByName ?? "مستخدم",
                                   f.AffectedSessionsCount,
                                   f.MakeUpCreditsAwarded,
                                   f.DecidedByName,
                                   f.DecisionNote,
                                   f.DecidedAt,
                                   f.CreatedAt
                               )).ToListAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<IReadOnlyList<FreezeRequestItem>>(items));
        });

        // 2. Submit freeze request (Staff)
        staffGroup.MapPost("", async Task<Results<Ok<ApiEnvelope<FreezeRequestItem>>, ProblemHttpResult>> (
            CreateFreezeRequestDto request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var student = await db.Students.FirstOrDefaultAsync(x => x.Id == request.StudentId && x.TenantId == scope.TenantId, cancellationToken);
            if (student is null) return Problem(404, "STUDENT_NOT_FOUND", "Student not found in current academy.");

            var branchId = student.BranchId;
            var start = request.StartDate;
            var end = request.EndDate;
            if (start > end) return Problem(400, "INVALID_DATES", "Start date must be before or equal to end date.");

            var diffDays = Math.Max(1, end.DayNumber - start.DayNumber + 1);
            var affected = Math.Max(1, (int)Math.Ceiling(diffDays / 7.0));

            var freeze = new SubscriptionFreezeRequest
            {
                TenantId = scope.TenantId,
                BranchId = branchId,
                StudentId = student.Id,
                CourseOfferingId = request.CourseOfferingId,
                StartDate = start,
                EndDate = end,
                Reason = string.IsNullOrWhiteSpace(request.Reason) ? "TRAVEL" : request.Reason.Trim().ToUpperInvariant(),
                ReasonText = request.ReasonText?.Trim(),
                Status = "PENDING",
                SubmittedByRole = user.FindFirstValue("role") ?? "R05_SECRETARY",
                SubmittedByName = user.FindFirstValue("name") ?? user.FindFirstValue("displayName") ?? "موظف الأكاديمية",
                AffectedSessionsCount = affected,
                MakeUpCreditsAwarded = affected
            };

            db.SubscriptionFreezeRequests.Add(freeze);
            await db.SaveChangesAsync(cancellationToken);

            var branchName = await db.Branches.Where(b => b.Id == branchId).Select(b => b.Name).FirstOrDefaultAsync(cancellationToken) ?? "الفرع";
            string courseName = "الدورة التدريبية";
            if (request.CourseOfferingId.HasValue)
            {
                courseName = await (from o in db.CourseOfferings
                                    join t in db.CourseTemplates on o.CourseTemplateId equals t.Id
                                    where o.Id == request.CourseOfferingId.Value
                                    select t.Name).FirstOrDefaultAsync(cancellationToken) ?? courseName;
            }

            var item = new FreezeRequestItem(
                freeze.Id, freeze.StudentId, student.FullName, freeze.BranchId, branchName,
                freeze.CourseOfferingId, courseName, freeze.StartDate, freeze.EndDate,
                freeze.Reason, freeze.ReasonText, freeze.Status, freeze.SubmittedByRole,
                freeze.SubmittedByName, freeze.AffectedSessionsCount, freeze.MakeUpCreditsAwarded,
                null, null, null, freeze.CreatedAt);

            return TypedResults.Ok(new ApiEnvelope<FreezeRequestItem>(item));
        });

        // 3. Decide freeze request (Branch Manager / Academy Owner)
        staffGroup.MapPost("/{id:guid}/decision", async Task<Results<Ok<ApiEnvelope<FreezeRequestItem>>, ProblemHttpResult>> (
            Guid id, DecideFreezeRequestDto request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanDecideFreeze(user))
                return Problem(403, "FORBIDDEN", "Only branch managers and academy owners can decide freeze requests.");
            if (!TryGetScope(user, out var scope, out var error)) return error;

            var freeze = await db.SubscriptionFreezeRequests.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
            if (freeze is null) return Problem(404, "FREEZE_NOT_FOUND", "Freeze request not found.");

            var decision = request.Decision?.Trim().ToUpperInvariant();
            if (decision != "APPROVED" && decision != "REJECTED")
                return Problem(400, "INVALID_DECISION", "Decision must be APPROVED or REJECTED.");

            freeze.Status = decision;
            freeze.DecidedByUserId = Guid.TryParse(user.FindFirstValue("sub"), out var uid) ? uid : null;
            freeze.DecidedByName = user.FindFirstValue("name") ?? user.FindFirstValue("displayName") ?? "مدير الفرع";
            freeze.DecisionNote = request.Note?.Trim() ?? (decision == "APPROVED" ? "تم الاعتماد وتمديد فترة الكورس" : "تم رفض الطلب لعدم استيفاء الشروط");
            freeze.DecidedAt = DateTimeOffset.UtcNow;

            // If approved and CourseOfferingId is present, update StudentEnrollment status to FROZEN
            if (decision == "APPROVED" && freeze.CourseOfferingId.HasValue)
            {
                var enrollment = await db.StudentEnrollments.FirstOrDefaultAsync(x => x.StudentId == freeze.StudentId && x.CourseOfferingId == freeze.CourseOfferingId.Value, cancellationToken);
                if (enrollment is not null)
                {
                    enrollment.Status = "FROZEN";
                }
            }

            db.AuditEvents.Add(new AuditEvent
            {
                TenantId = scope.TenantId,
                BranchId = freeze.BranchId,
                ActorUserId = freeze.DecidedByUserId,
                Action = "SUBSCRIPTION_FREEZE_DECISION",
                TargetType = "STUDENT",
                TargetId = freeze.StudentId.ToString(),
                Reason = freeze.DecisionNote,
                MetadataJson = JsonSerializer.Serialize(new { freezeId = freeze.Id, decision, freeze.StartDate, freeze.EndDate })
            });

            await db.SaveChangesAsync(cancellationToken);

            var student = await db.Students.Where(s => s.Id == freeze.StudentId).Select(s => s.FullName).FirstOrDefaultAsync(cancellationToken) ?? "Student";
            var branch = await db.Branches.Where(b => b.Id == freeze.BranchId).Select(b => b.Name).FirstOrDefaultAsync(cancellationToken) ?? "Branch";

            var item = new FreezeRequestItem(
                freeze.Id, freeze.StudentId, student, freeze.BranchId, branch,
                freeze.CourseOfferingId, "الدورة التدريبية", freeze.StartDate, freeze.EndDate,
                freeze.Reason, freeze.ReasonText, freeze.Status, freeze.SubmittedByRole,
                freeze.SubmittedByName ?? "مستخدم", freeze.AffectedSessionsCount, freeze.MakeUpCreditsAwarded,
                freeze.DecidedByName, freeze.DecisionNote, freeze.DecidedAt, freeze.CreatedAt);

            return TypedResults.Ok(new ApiEnvelope<FreezeRequestItem>(item));
        });

        // 4. Consumer / Family Portal freeze endpoints
        var consumerGroup = endpoints.MapGroup("/api/v1/consumer/freeze-requests").RequireAuthorization("consumer");

        consumerGroup.MapGet("", async Task<Results<Ok<ApiEnvelope<IReadOnlyList<FreezeRequestItem>>>, ProblemHttpResult>> (
            ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId) ||
                !Guid.TryParse(user.FindFirstValue("sub"), out var userAccountId))
            {
                return Problem(403, "CONSUMER_SCOPE_REQUIRED", "Consumer identity required.");
            }

            // Find linked student ids for this guardian or student
            var studentIds = await db.GuardianStudentLinks.AsNoTracking()
                .Where(x => x.TenantId == tenantId && x.UserAccountId == userAccountId && x.Status == "ACTIVE")
                .Select(x => x.StudentId)
                .Union(db.StudentAccountLinks.AsNoTracking().Where(x => x.TenantId == tenantId && x.UserAccountId == userAccountId).Select(x => x.StudentId))
                .Distinct()
                .ToListAsync(cancellationToken);

            var items = await (from f in db.SubscriptionFreezeRequests.AsNoTracking()
                               where f.TenantId == tenantId && studentIds.Contains(f.StudentId)
                               join s in db.Students.AsNoTracking() on f.StudentId equals s.Id
                               join b in db.Branches.AsNoTracking() on f.BranchId equals b.Id
                               orderby f.CreatedAt descending
                               select new FreezeRequestItem(
                                   f.Id,
                                   f.StudentId,
                                   s.FullName,
                                   f.BranchId,
                                   b.Name,
                                   f.CourseOfferingId,
                                   "الدورة التدريبية",
                                   f.StartDate,
                                   f.EndDate,
                                   f.Reason,
                                   f.ReasonText,
                                   f.Status,
                                   f.SubmittedByRole,
                                   f.SubmittedByName ?? "ولي الأمر",
                                   f.AffectedSessionsCount,
                                   f.MakeUpCreditsAwarded,
                                   f.DecidedByName,
                                   f.DecisionNote,
                                   f.DecidedAt,
                                   f.CreatedAt
                               )).ToListAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<IReadOnlyList<FreezeRequestItem>>(items));
        });

        consumerGroup.MapPost("", async Task<Results<Ok<ApiEnvelope<FreezeRequestItem>>, ProblemHttpResult>> (
            CreateFreezeRequestDto request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId) ||
                !Guid.TryParse(user.FindFirstValue("sub"), out var userAccountId))
            {
                return Problem(403, "CONSUMER_SCOPE_REQUIRED", "Consumer identity required.");
            }

            var isLinked = await db.GuardianStudentLinks.AnyAsync(x => x.TenantId == tenantId && x.UserAccountId == userAccountId && x.StudentId == request.StudentId && x.Status == "ACTIVE", cancellationToken) ||
                           await db.StudentAccountLinks.AnyAsync(x => x.TenantId == tenantId && x.UserAccountId == userAccountId && x.StudentId == request.StudentId, cancellationToken);

            if (!isLinked) return Problem(403, "STUDENT_NOT_LINKED", "You are not authorized to submit requests for this student.");

            var student = await db.Students.FirstOrDefaultAsync(x => x.Id == request.StudentId && x.TenantId == tenantId, cancellationToken);
            if (student is null) return Problem(404, "STUDENT_NOT_FOUND", "Student not found.");

            var diffDays = Math.Max(1, request.EndDate.DayNumber - request.StartDate.DayNumber + 1);
            var affected = Math.Max(1, (int)Math.Ceiling(diffDays / 7.0));

            var freeze = new SubscriptionFreezeRequest
            {
                TenantId = tenantId,
                BranchId = student.BranchId,
                StudentId = student.Id,
                CourseOfferingId = request.CourseOfferingId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Reason = string.IsNullOrWhiteSpace(request.Reason) ? "TRAVEL" : request.Reason.Trim().ToUpperInvariant(),
                ReasonText = request.ReasonText?.Trim(),
                Status = "PENDING",
                SubmittedByRole = "R08_PARENT",
                SubmittedByName = user.FindFirstValue("displayName") ?? "ولي الأمر",
                AffectedSessionsCount = affected,
                MakeUpCreditsAwarded = affected
            };

            db.SubscriptionFreezeRequests.Add(freeze);
            await db.SaveChangesAsync(cancellationToken);

            var branchName = await db.Branches.Where(b => b.Id == student.BranchId).Select(b => b.Name).FirstOrDefaultAsync(cancellationToken) ?? "الفرع";

            var item = new FreezeRequestItem(
                freeze.Id, freeze.StudentId, student.FullName, freeze.BranchId, branchName,
                freeze.CourseOfferingId, "الدورة التدريبية", freeze.StartDate, freeze.EndDate,
                freeze.Reason, freeze.ReasonText, freeze.Status, freeze.SubmittedByRole,
                freeze.SubmittedByName, freeze.AffectedSessionsCount, freeze.MakeUpCreditsAwarded,
                null, null, null, freeze.CreatedAt);

            return TypedResults.Ok(new ApiEnvelope<FreezeRequestItem>(item));
        });

        return endpoints;
    }

    private static bool CanDecideFreeze(ClaimsPrincipal user) =>
        user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER");

    private static bool TryGetScope(ClaimsPrincipal user, out Scope scope, out ProblemHttpResult error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
        {
            scope = default;
            error = Problem(403, "TENANT_SCOPE_REQUIRED", "The authenticated account has no tenant scope.");
            return false;
        }

        var isTenantWide = user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R00_PLATFORM_ADMIN") ||
                           string.Equals(user.FindFirstValue("scopeLevel"), "TENANT", StringComparison.OrdinalIgnoreCase);

        var branchClaim = user.FindFirstValue("branchId");
        Guid? branchId = isTenantWide ? null : (Guid.TryParse(branchClaim, out var bId) ? bId : null);
        scope = new Scope(tenantId, branchId);
        error = default!;
        return true;
    }

    private static ProblemHttpResult Problem(int status, string code, string detail) =>
        TypedResults.Problem(statusCode: status, title: code, detail: detail, extensions: new Dictionary<string, object?> { ["code"] = code });

    private readonly record struct Scope(Guid TenantId, Guid? BranchId);
}

public sealed record FreezeRequestItem(
    Guid Id,
    Guid StudentId,
    string StudentName,
    Guid BranchId,
    string BranchName,
    Guid? CourseOfferingId,
    string CourseName,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason,
    string? ReasonText,
    string Status,
    string SubmittedByRole,
    string SubmittedByName,
    int AffectedSessionsCount,
    int MakeUpCreditsAwarded,
    string? DecidedByName,
    string? DecisionNote,
    DateTimeOffset? DecidedAt,
    DateTimeOffset CreatedAt);

public sealed record CreateFreezeRequestDto(
    Guid StudentId,
    DateOnly StartDate,
    DateOnly EndDate,
    string? Reason = "TRAVEL",
    string? ReasonText = null,
    Guid? CourseOfferingId = null);

public sealed record DecideFreezeRequestDto(string Decision, string? Note = null);
