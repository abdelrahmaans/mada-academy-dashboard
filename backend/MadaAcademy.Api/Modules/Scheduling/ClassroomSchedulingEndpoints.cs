using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Scheduling;

public static class ClassroomSchedulingEndpoints
{
    public static IEndpointRouteBuilder MapMadaClassroomSchedulingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/scheduling/classrooms", ListAsync).RequireAuthorization("staff");
        return endpoints;
    }

    private static async Task<IResult> ListAsync(Guid? branchId, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal.FindFirstValue("tenantId"), out var tenantId)) return Results.Forbid();
        Guid? tokenBranch = Guid.TryParse(principal.FindFirstValue("branchId"), out var parsedBranch) ? parsedBranch : null;
        var requestedBranch = branchId ?? tokenBranch;
        if (tokenBranch.HasValue && requestedBranch.HasValue && requestedBranch != tokenBranch) return Results.Forbid();
        var branches = db.Branches.AsNoTracking().Where(branch => branch.TenantId == tenantId && branch.Status == "ACTIVE" && (!requestedBranch.HasValue || branch.Id == requestedBranch.Value));
        var rows = await db.Classrooms.AsNoTracking().Join(branches, room => room.BranchId, branch => branch.Id, (room, branch) => new { room.Id, room.BranchId, branchName = branch.Name, branchCode = branch.Code, room.Name, room.Capacity, room.Status }).Where(room => room.Status == "AVAILABLE").OrderBy(room => room.branchName).ThenBy(room => room.Name).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = rows, total = rows.Count, branchId = requestedBranch } });
    }
}
