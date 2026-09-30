using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class ClassroomEndpoints
{
    private static readonly string[] AllowedStatuses = ["AVAILABLE", "MAINTENANCE", "INACTIVE"];

    public static IEndpointRouteBuilder MapMadaClassroomEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/academy").RequireAuthorization("academy-owner");
        api.MapGet("/classrooms", ListAsync);
        api.MapPost("/classrooms", CreateAsync);
        api.MapPut("/classrooms/{classroomId:guid}", UpdateAsync);
        api.MapPatch("/classrooms/{classroomId:guid}/status", ChangeStatusAsync);
        return endpoints;
    }

    private static async Task<IResult> ListAsync(Guid? branchId, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        var branchIds = await db.Branches.AsNoTracking().Where(branch => branch.TenantId == tenantId && (!branchId.HasValue || branch.Id == branchId.Value)).Select(branch => branch.Id).ToListAsync(cancellationToken);
        if (branchId.HasValue && branchIds.Count == 0) return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "الفرع غير موجود داخل الأكاديمية." } });
        var classrooms = await db.Classrooms.AsNoTracking().Where(room => branchIds.Contains(room.BranchId)).OrderBy(room => room.BranchId).ThenBy(room => room.Name).ToListAsync(cancellationToken);
        var ids = classrooms.Select(room => room.Id).ToArray();
        var sessionCounts = await db.AcademySessions.AsNoTracking().Where(session => ids.Contains(session.ClassroomId) && session.Status != "CANCELLED").GroupBy(session => session.ClassroomId).Select(group => new { Id = group.Key, Count = group.Count() }).ToDictionaryAsync(item => item.Id, item => item.Count, cancellationToken);
        var offeringCounts = await db.CourseOfferings.AsNoTracking().Where(offering => ids.Contains(offering.ClassroomId) && offering.Status != "ARCHIVED").GroupBy(offering => offering.ClassroomId).Select(group => new { Id = group.Key, Count = group.Count() }).ToDictionaryAsync(item => item.Id, item => item.Count, cancellationToken);
        var branches = await db.Branches.AsNoTracking().Where(branch => branchIds.Contains(branch.Id)).ToDictionaryAsync(branch => branch.Id, cancellationToken);
        return Results.Ok(new { data = new { items = classrooms.Select(room => new { room.Id, room.BranchId, branch = new { branches[room.BranchId].Name, branches[room.BranchId].Code }, room.Name, room.Capacity, room.Status, sessionsCount = sessionCounts.GetValueOrDefault(room.Id), offeringsCount = offeringCounts.GetValueOrDefault(room.Id), room.CreatedAt, room.UpdatedAt }).ToArray(), total = classrooms.Count, tenantId, branchId } });
    }

    private static async Task<IResult> CreateAsync(CreateClassroomRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        var validation = Validate(request.Name, request.Capacity);
        if (validation is not null) return validation;
        var branch = await db.Branches.SingleOrDefaultAsync(item => item.Id == request.BranchId && item.TenantId == tenantId, cancellationToken);
        if (branch is null) return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "الفرع غير موجود داخل الأكاديمية." } });
        if (branch.Status != "ACTIVE") return Conflict("BRANCH_INACTIVE", "لا يمكن إضافة قاعة إلى فرع غير نشط.");
        var name = request.Name.Trim();
        if (await db.Classrooms.AnyAsync(item => item.BranchId == request.BranchId && item.Name == name, cancellationToken)) return Conflict("CLASSROOM_NAME_EXISTS", "اسم القاعة مستخدم بالفعل داخل هذا الفرع.");
        var classroom = new Classroom { BranchId = branch.Id, Name = name, Capacity = request.Capacity };
        db.Classrooms.Add(classroom);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = Actor(principal), TenantId = tenantId, Action = "CLASSROOM_CREATED", TargetType = "CLASSROOM", TargetId = classroom.Id.ToString(), MetadataJson = $"{{\"branchId\":\"{branch.Id}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/academy/classrooms/{classroom.Id}", new { data = new { classroom.Id, classroom.BranchId, branch = new { branch.Name, branch.Code }, classroom.Name, classroom.Capacity, classroom.Status, sessionsCount = 0, offeringsCount = 0, classroom.CreatedAt, classroom.UpdatedAt } });
    }

    private static async Task<IResult> UpdateAsync(Guid classroomId, UpdateClassroomRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        var validation = Validate(request.Name, request.Capacity);
        if (validation is not null) return validation;
        var classroom = await db.Classrooms.SingleOrDefaultAsync(item => item.Id == classroomId, cancellationToken);
        if (classroom is null) return Results.NotFound(new { error = new { code = "CLASSROOM_NOT_FOUND", message = "القاعة غير موجودة." } });
        var ownsBranch = await db.Branches.AnyAsync(branch => branch.Id == classroom.BranchId && branch.TenantId == tenantId, cancellationToken);
        if (!ownsBranch) return Results.NotFound(new { error = new { code = "CLASSROOM_NOT_FOUND", message = "القاعة غير موجودة داخل الأكاديمية." } });
        var name = request.Name.Trim();
        if (await db.Classrooms.AnyAsync(item => item.BranchId == classroom.BranchId && item.Name == name && item.Id != classroomId, cancellationToken)) return Conflict("CLASSROOM_NAME_EXISTS", "اسم القاعة مستخدم بالفعل داخل هذا الفرع.");
        classroom.Name = name; classroom.Capacity = request.Capacity;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { classroom.Id, classroom.BranchId, classroom.Name, classroom.Capacity, classroom.Status, classroom.UpdatedAt } });
    }

    private static async Task<IResult> ChangeStatusAsync(Guid classroomId, ChangeClassroomStatusRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return ScopeError();
        var status = request.Status.Trim().ToUpperInvariant();
        if (!AllowedStatuses.Contains(status, StringComparer.Ordinal)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["الحالة يجب أن تكون AVAILABLE أو MAINTENANCE أو INACTIVE."] });
        var classroom = await db.Classrooms.SingleOrDefaultAsync(item => item.Id == classroomId, cancellationToken);
        if (classroom is null || !await db.Branches.AnyAsync(branch => branch.Id == classroom.BranchId && branch.TenantId == tenantId, cancellationToken)) return Results.NotFound(new { error = new { code = "CLASSROOM_NOT_FOUND", message = "القاعة غير موجودة داخل الأكاديمية." } });
        classroom.Status = status;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { classroom.Id, classroom.Status, classroom.UpdatedAt } });
    }

    private static IResult? Validate(string name, int capacity)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length is < 2 or > 120) return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["اسم القاعة مطلوب ويتراوح بين حرفين و120 حرفًا."] });
        if (capacity is < 1 or > 500) return Results.ValidationProblem(new Dictionary<string, string[]> { ["capacity"] = ["السعة يجب أن تكون بين 1 و500 طالب."] });
        return null;
    }

    private static bool Tenant(ClaimsPrincipal principal, out Guid tenantId) => Guid.TryParse(principal.FindFirstValue("tenantId"), out tenantId);
    private static Guid? Actor(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult ScopeError() => Results.Problem(statusCode: 403, title: "Missing academy scope", extensions: new Dictionary<string, object?> { ["code"] = "MISSING_ACADEMY_SCOPE" });
    private static IResult Conflict(string code, string message) => Results.Conflict(new { error = new { code, message } });
}

public sealed record CreateClassroomRequest(Guid BranchId, string Name, int Capacity);
public sealed record UpdateClassroomRequest(string Name, int Capacity);
public sealed record ChangeClassroomStatusRequest(string Status);
