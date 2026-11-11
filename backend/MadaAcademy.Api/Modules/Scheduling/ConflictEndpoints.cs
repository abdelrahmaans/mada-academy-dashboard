using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Scheduling;

public static class ConflictEndpoints
{
    public static IEndpointRouteBuilder MapMadaSchedulingConflictEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/v1/scheduling/check-conflict", async (
            ConflictCheckRequest request,
            ConflictService conflicts,
            HttpContext context,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            var isTenantScoped = context.User.IsInRole("R01_ACADEMY_OWNER");
            var isBranchScoped = context.User.IsInRole("R02_BRANCH_MANAGER") || context.User.IsInRole("R03_HEAD_INSTRUCTORS");
            if (!isTenantScoped && !isBranchScoped)
                return Results.Forbid();

            if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId))
                return Results.Forbid();

            if (isBranchScoped && (!Guid.TryParse(context.User.FindFirstValue("branchId"), out var claimedBranchId) || claimedBranchId != request.BranchId))
            {
                return Results.Problem(
                    statusCode: 403,
                    title: "Branch scope denied",
                    extensions: new Dictionary<string, object?> { ["code"] = "BRANCH_SCOPE_DENIED" });
            }

            if (!await db.Branches.AnyAsync(branch => branch.Id == request.BranchId && branch.TenantId == tenantId && branch.Status == "ACTIVE", cancellationToken))
                return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "الفرع غير موجود داخل الأكاديمية." } });

            var result = await conflicts.CheckAsync(request, cancellationToken);
            return result.HasConflict
                ? Results.Conflict(new { error = new { code = "SCHEDULING_CONFLICT", details = result.Conflicts } })
                : Results.Ok(new { data = result });
        }).RequireAuthorization("staff");

        return endpoints;
    }
}

