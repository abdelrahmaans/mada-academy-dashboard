using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class ClassroomResourceEndpoints
{
    private static readonly string[] AllowedKinds = ["SEATING", "EQUIPMENT"];
    private static readonly string[] AllowedStatuses = ["AVAILABLE", "MAINTENANCE", "INACTIVE"];

    public static IEndpointRouteBuilder MapMadaClassroomResourceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/academy").RequireAuthorization("academy-owner");
        api.MapGet("/classrooms/{classroomId:guid}/resources", ListAsync);
        api.MapPost("/classrooms/{classroomId:guid}/resources", CreateAsync);
        api.MapPut("/classrooms/{classroomId:guid}/resources/{resourceId:guid}", UpdateAsync);
        api.MapDelete("/classrooms/{classroomId:guid}/resources/{resourceId:guid}", DeleteAsync);
        return endpoints;
    }

    private static async Task<IResult> ListAsync(Guid classroomId, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        var owned = await OwnedClassroom(classroomId, principal, db, cancellationToken);
        if (owned is null) return NotFound();
        var resources = await db.ClassroomResources.AsNoTracking().Where(item => item.ClassroomId == classroomId).OrderBy(item => item.Kind).ThenBy(item => item.Name).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = resources, total = resources.Count, classroom = new { owned.Id, owned.Name, owned.BranchId } } });
    }

    private static async Task<IResult> CreateAsync(Guid classroomId, ClassroomResourceRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        var owned = await OwnedClassroom(classroomId, principal, db, cancellationToken);
        if (owned is null) return NotFound();
        var validation = Validate(request);
        if (validation is not null) return validation;
        var kind = request.Kind.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (await db.ClassroomResources.AnyAsync(item => item.ClassroomId == classroomId && item.Kind == kind && item.Name == name, cancellationToken)) return Conflict("RESOURCE_EXISTS", "هذا المورد موجود بالفعل داخل القاعة.");
        var resource = new ClassroomResource { ClassroomId = classroomId, Kind = kind, Name = name, Quantity = request.Quantity, Status = request.Status.Trim().ToUpperInvariant(), Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim() };
        db.ClassroomResources.Add(resource);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/academy/classrooms/{classroomId}/resources/{resource.Id}", new { data = resource });
    }

    private static async Task<IResult> UpdateAsync(Guid classroomId, Guid resourceId, ClassroomResourceRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        var owned = await OwnedClassroom(classroomId, principal, db, cancellationToken);
        if (owned is null) return NotFound();
        var resource = await db.ClassroomResources.SingleOrDefaultAsync(item => item.Id == resourceId && item.ClassroomId == classroomId, cancellationToken);
        if (resource is null) return NotFound();
        var validation = Validate(request);
        if (validation is not null) return validation;
        var kind = request.Kind.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (await db.ClassroomResources.AnyAsync(item => item.ClassroomId == classroomId && item.Kind == kind && item.Name == name && item.Id != resourceId, cancellationToken)) return Conflict("RESOURCE_EXISTS", "هذا المورد موجود بالفعل داخل القاعة.");
        resource.Kind = kind; resource.Name = name; resource.Quantity = request.Quantity; resource.Status = request.Status.Trim().ToUpperInvariant(); resource.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = resource });
    }

    private static async Task<IResult> DeleteAsync(Guid classroomId, Guid resourceId, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        var owned = await OwnedClassroom(classroomId, principal, db, cancellationToken);
        if (owned is null) return NotFound();
        var resource = await db.ClassroomResources.SingleOrDefaultAsync(item => item.Id == resourceId && item.ClassroomId == classroomId, cancellationToken);
        if (resource is null) return NotFound();
        db.ClassroomResources.Remove(resource); await db.SaveChangesAsync(cancellationToken); return Results.NoContent();
    }

    private static IResult? Validate(ClassroomResourceRequest request)
    {
        var kind = request.Kind.Trim().ToUpperInvariant();
        if (!AllowedKinds.Contains(kind, StringComparer.Ordinal)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["kind"] = ["نوع المورد يجب أن يكون SEATING أو EQUIPMENT."] });
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length is < 2 or > 120) return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["اسم المورد مطلوب."] });
        if (request.Quantity is < 1 or > 10000) return Results.ValidationProblem(new Dictionary<string, string[]> { ["quantity"] = ["الكمية يجب أن تكون بين 1 و10000."] });
        var status = request.Status.Trim().ToUpperInvariant();
        if (!AllowedStatuses.Contains(status, StringComparer.Ordinal)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["الحالة غير صالحة."] });
        return null;
    }

    private static async Task<Classroom?> OwnedClassroom(Guid classroomId, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal.FindFirstValue("tenantId"), out var tenantId)) return null;
        return await db.Classrooms.SingleOrDefaultAsync(room => room.Id == classroomId && db.Branches.Any(branch => branch.Id == room.BranchId && branch.TenantId == tenantId), cancellationToken);
    }
    private static IResult NotFound() => Results.NotFound(new { error = new { code = "CLASSROOM_NOT_FOUND", message = "القاعة غير موجودة داخل الأكاديمية." } });
    private static IResult Conflict(string code, string message) => Results.Conflict(new { error = new { code, message } });
}

public sealed record ClassroomResourceRequest(string Kind, string Name, int Quantity, string Status, string? Notes);
