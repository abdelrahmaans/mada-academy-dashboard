using System.Security.Claims;
using System.Text.RegularExpressions;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class BranchEndpoints
{
    public static IEndpointRouteBuilder MapMadaBranchEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/academy").RequireAuthorization("academy-owner");
        api.MapGet("/branches", ListAsync);
        api.MapPost("/branches", CreateAsync);
        api.MapPut("/branches/{branchId:guid}", UpdateAsync);
        api.MapPatch("/branches/{branchId:guid}/status", ChangeStatusAsync);
        return endpoints;
    }

    private static async Task<IResult> ListAsync(ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        var branches = await db.Branches.AsNoTracking().Where(item => item.TenantId == tenantId).OrderBy(item => item.Name).ToListAsync(cancellationToken);
        var branchIds = branches.Select(item => item.Id).ToArray();
        var members = await db.Memberships.AsNoTracking().Where(item => item.BranchId.HasValue && branchIds.Contains(item.BranchId.Value) && item.Status != "REVOKED").GroupBy(item => item.BranchId!.Value).Select(group => new { Id = group.Key, Count = group.Count() }).ToDictionaryAsync(item => item.Id, item => item.Count, cancellationToken);
        var students = await db.Students.AsNoTracking().Where(item => branchIds.Contains(item.BranchId)).GroupBy(item => item.BranchId).Select(group => new { Id = group.Key, Count = group.Count() }).ToDictionaryAsync(item => item.Id, item => item.Count, cancellationToken);
        return Results.Ok(new { data = new { items = branches.Select(branch => new { branch.Id, branch.TenantId, branch.Name, branch.Code, branch.Status, membersCount = members.GetValueOrDefault(branch.Id), studentsCount = students.GetValueOrDefault(branch.Id), branch.CreatedAt }).ToArray(), total = branches.Count, tenantId } });
    }

    private static async Task<IResult> CreateAsync(CreateBranchRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        var validation = Validate(request.Name, request.Code);
        if (validation is not null) return validation;
        var code = request.Code.Trim().ToUpperInvariant();
        if (await db.Branches.AnyAsync(item => item.TenantId == tenantId && item.Code == code, cancellationToken)) return Conflict("BRANCH_CODE_EXISTS", "كود الفرع مستخدم بالفعل داخل الأكاديمية.");
        var branch = new Branch { TenantId = tenantId, Name = request.Name.Trim(), Code = code };
        db.Branches.Add(branch);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = Actor(principal), TenantId = tenantId, Action = "BRANCH_CREATED", TargetType = "BRANCH", TargetId = branch.Id.ToString(), MetadataJson = $"{{\"code\":\"{code}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/academy/branches/{branch.Id}", new { data = new { branch.Id, branch.TenantId, branch.Name, branch.Code, branch.Status, membersCount = 0, studentsCount = 0, branch.CreatedAt } });
    }

    private static async Task<IResult> UpdateAsync(Guid branchId, UpdateBranchRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        var validation = Validate(request.Name, request.Code);
        if (validation is not null) return validation;
        var branch = await db.Branches.SingleOrDefaultAsync(item => item.Id == branchId && item.TenantId == tenantId, cancellationToken);
        if (branch is null) return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "الفرع غير موجود داخل الأكاديمية." } });
        var code = request.Code.Trim().ToUpperInvariant();
        if (await db.Branches.AnyAsync(item => item.TenantId == tenantId && item.Code == code && item.Id != branchId, cancellationToken)) return Conflict("BRANCH_CODE_EXISTS", "كود الفرع مستخدم بالفعل داخل الأكاديمية.");
        branch.Name = request.Name.Trim(); branch.Code = code;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { branch.Id, branch.TenantId, branch.Name, branch.Code, branch.Status } });
    }

    private static async Task<IResult> ChangeStatusAsync(Guid branchId, ChangeBranchStatusRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        if (request.Status is not ("ACTIVE" or "INACTIVE")) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Status must be ACTIVE or INACTIVE."] });
        var branch = await db.Branches.SingleOrDefaultAsync(item => item.Id == branchId && item.TenantId == tenantId, cancellationToken);
        if (branch is null) return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "الفرع غير موجود داخل الأكاديمية." } });
        branch.Status = request.Status;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { branch.Id, branch.Status } });
    }

    private static IResult? Validate(string name, string code)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length is < 2 or > 160) return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["اسم الفرع مطلوب ويتراوح بين حرفين و160 حرفًا."] });
        if (string.IsNullOrWhiteSpace(code) || code.Trim().Length is < 2 or > 40 || !Regex.IsMatch(code.Trim(), "^[A-Za-z0-9_-]+$")) return Results.ValidationProblem(new Dictionary<string, string[]> { ["code"] = ["كود الفرع يجب أن يكون إنجليزيًا وأرقامًا و- أو _ فقط."] });
        return null;
    }

    private static bool Tenant(ClaimsPrincipal principal, out Guid tenantId) => Guid.TryParse(principal.FindFirstValue("tenantId"), out tenantId);
    private static Guid? Actor(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult ScopeError() => Results.Problem(statusCode: 403, title: "Missing academy scope", extensions: new Dictionary<string, object?> { ["code"] = "MISSING_ACADEMY_SCOPE" });
    private static IResult Conflict(string code, string message) => Results.Conflict(new { error = new { code, message } });
}

public sealed record CreateBranchRequest(string Name, string Code);
public sealed record UpdateBranchRequest(string Name, string Code);
public sealed record ChangeBranchStatusRequest(string Status);
