using System.Security.Claims;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Platform;

public static class PlatformAdminEndpoints
{
    public static IEndpointRouteBuilder MapMadaPlatformAdminEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/platform").RequireAuthorization("platform-admin");
        api.MapGet("/overview", GetOverviewAsync);
        api.MapGet("/academies", GetAcademiesAsync);
        api.MapPatch("/academies/{tenantId:guid}/status", ChangeTenantStatusAsync);
        api.MapGet("/academies/{tenantId:guid}/members", GetMembersAsync);
        api.MapPost("/users/{userId:guid}/sessions/revoke", RevokeSessionsAsync);
        api.MapGet("/activity", GetActivityAsync);
        return endpoints;
    }

    private static async Task<IResult> GetOverviewAsync(MadaDbContext db, CancellationToken cancellationToken)
    {
        var tenants = await db.Tenants.AsNoTracking().ToListAsync(cancellationToken);
        var users = await db.UserAccounts.AsNoTracking().CountAsync(x => x.AccountType == "staff", cancellationToken);
        var openSessions = await db.RefreshSessions.AsNoTracking().CountAsync(x => x.RevokedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken);
        var activity = await db.AuditEvents.AsNoTracking().CountAsync(cancellationToken);
        return Results.Ok(new { data = new
        {
            academies = tenants.Count,
            activeAcademies = tenants.Count(x => x.Status == "ACTIVE"),
            trialAcademies = tenants.Count(x => x.Status == "TRIAL"),
            attentionAcademies = tenants.Count(x => x.Status is "SETUP" or "PAUSED"),
            staffAccounts = users,
            activeSessions = openSessions,
            auditEvents = activity
        }});
    }

    private static async Task<IResult> GetAcademiesAsync(MadaDbContext db, CancellationToken cancellationToken)
    {
        var academies = await db.Tenants.AsNoTracking().OrderBy(x => x.Name).Select(tenant => new
        {
            id = tenant.Id,
            name = tenant.Name,
            slug = tenant.Slug,
            status = tenant.Status,
            plan = tenant.PlanCode,
            createdAt = tenant.CreatedAt,
            branches = db.Branches.Count(branch => branch.TenantId == tenant.Id),
            users = db.Memberships.Count(member => member.TenantId == tenant.Id && member.Status == "ACTIVE"),
            owner = db.Memberships.Where(member => member.TenantId == tenant.Id && member.RoleCode == "R01_ACADEMY_OWNER" && member.Status == "ACTIVE").Select(member => member.UserAccount!.DisplayName).FirstOrDefault()
        }).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = academies, total = academies.Count } });
    }

    private static async Task<IResult> ChangeTenantStatusAsync(Guid tenantId, TenantStatusRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (request.Status is not ("ACTIVE" or "TRIAL" or "SETUP" or "PAUSED")) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Status must be ACTIVE, TRIAL, SETUP, or PAUSED."] });
        var tenant = await db.Tenants.SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        var previous = tenant.Status;
        tenant.Status = request.Status;
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenant.Id, Action = "PLATFORM_TENANT_STATUS_CHANGED", TargetType = "TENANT", TargetId = tenant.Id.ToString(), Reason = request.Reason?.Trim(), MetadataJson = JsonSerializer.Serialize(new { previous, next = tenant.Status }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { id = tenant.Id, status = tenant.Status } });
    }

    private static async Task<IResult> GetMembersAsync(Guid tenantId, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!await db.Tenants.AnyAsync(x => x.Id == tenantId, cancellationToken)) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        var members = await db.Memberships.AsNoTracking().Include(x => x.UserAccount).Include(x => x.Branch).Where(x => x.TenantId == tenantId).OrderBy(x => x.RoleCode).Select(x => new
        {
            membershipId = x.Id,
            userId = x.UserAccountId,
            name = x.UserAccount!.DisplayName,
            roleCode = x.RoleCode,
            membershipStatus = x.Status,
            userStatus = x.UserAccount.Status,
            lastLoginAt = x.UserAccount.LastLoginAt,
            branch = x.Branch == null ? null : new { x.Branch.Id, x.Branch.Name, x.Branch.Code }
        }).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = members, total = members.Count, tenantId } });
    }

    private static async Task<IResult> RevokeSessionsAsync(Guid userId, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var user = await db.UserAccounts.SingleOrDefaultAsync(x => x.Id == userId && x.AccountType == "staff", cancellationToken);
        if (user is null) return Results.NotFound(new { error = new { code = "STAFF_USER_NOT_FOUND", message = "Staff account was not found." } });
        var sessions = await db.RefreshSessions.Where(x => x.UserAccountId == userId && x.RevokedAt == null).ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        foreach (var session in sessions) session.RevokedAt = now;
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), Action = "PLATFORM_USER_SESSIONS_REVOKED", TargetType = "USER_ACCOUNT", TargetId = userId.ToString(), Reason = "Platform support session revocation" , MetadataJson = JsonSerializer.Serialize(new { revokedCount = sessions.Count }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { userId, revokedCount = sessions.Count } });
    }

    private static async Task<IResult> GetActivityAsync(MadaDbContext db, CancellationToken cancellationToken)
    {
        var events = await db.AuditEvents.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(50).Select(x => new
        {
            id = x.Id,
            action = x.Action,
            targetType = x.TargetType,
            targetId = x.TargetId,
            tenantId = x.TenantId,
            actorUserId = x.ActorUserId,
            reason = x.Reason,
            createdAt = x.CreatedAt,
            tenantName = x.TenantId == null ? null : db.Tenants.Where(tenant => tenant.Id == x.TenantId).Select(tenant => tenant.Name).FirstOrDefault(),
            actorName = x.ActorUserId == null ? null : db.UserAccounts.Where(user => user.Id == x.ActorUserId).Select(user => user.DisplayName).FirstOrDefault()
        }).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = events, total = events.Count } });
    }

    private static Guid? ActorId(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private sealed record TenantStatusRequest(string Status, string? Reason);
}
