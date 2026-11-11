using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Reports;

public static class DashboardSummaryEndpoints
{
    public static IEndpointRouteBuilder MapMadaDashboardSummaryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/dashboard/summary", async (HttpContext context, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!context.User.IsInRole("R01_ACADEMY_OWNER") && !context.User.IsInRole("R02_BRANCH_MANAGER"))
                return Results.Forbid();

            if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId))
                return Results.Problem(statusCode: 403, title: "Missing tenant scope");

            var hasBranchScope = context.User.IsInRole("R02_BRANCH_MANAGER");
            var branchId = Guid.TryParse(context.User.FindFirstValue("branchId"), out var parsedBranchId)
                ? parsedBranchId
                : (Guid?)null;
            if (hasBranchScope && !branchId.HasValue)
                return Results.Forbid();

            var scopedBranchId = branchId.GetValueOrDefault();
            var students = db.Students.Where(x => x.TenantId == tenantId && (!hasBranchScope || x.BranchId == scopedBranchId));
            var enrollments = db.StudentEnrollments
                .Where(x => x.StudentId != Guid.Empty)
                .Join(students, x => x.StudentId, x => x.Id, (enrollment, _) => enrollment);
            var sessions = db.AcademySessions.Where(x => x.TenantId == tenantId && (!hasBranchScope || x.BranchId == scopedBranchId));

            var upcoming = await sessions
                .Where(x => x.StartAt > DateTimeOffset.UtcNow && x.Status != "CANCELLED")
                .OrderBy(x => x.StartAt)
                .Take(5)
                .Select(x => new { x.Id, x.SessionNumber, x.StartAt, x.Status })
                .ToListAsync(cancellationToken);

            return Results.Ok(new
            {
                data = new
                {
                    students = await students.CountAsync(cancellationToken),
                    activeEnrollments = await enrollments.CountAsync(x => x.Status == "ACTIVE", cancellationToken),
                    upcomingSessions = await sessions.CountAsync(x => x.StartAt > DateTimeOffset.UtcNow && x.Status != "CANCELLED", cancellationToken),
                    completedSessions = await sessions.CountAsync(x => x.Status == "COMPLETED", cancellationToken),
                    branchCount = hasBranchScope ? 1 : await db.Branches.CountAsync(x => x.TenantId == tenantId && x.Status == "ACTIVE", cancellationToken),
                    upcoming
                }
            });
        }).RequireAuthorization("staff");

        return endpoints;
    }
}

