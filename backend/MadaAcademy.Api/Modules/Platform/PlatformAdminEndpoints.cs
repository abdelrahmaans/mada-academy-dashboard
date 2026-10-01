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
        api.MapGet("/roles", () => GetPlatformRoles());
        api.MapPatch("/academies/{tenantId:guid}/status", ChangeTenantStatusAsync);
        api.MapGet("/academies/{tenantId:guid}/members", GetMembersAsync);
        api.MapPatch("/academies/{tenantId:guid}/members/{membershipId:guid}/status", ChangeMemberStatusAsync);
        api.MapPost("/academies/{tenantId:guid}/users/{userId:guid}/sessions/revoke", RevokeSessionsAsync);
        api.MapGet("/academies/{tenantId:guid}/activity", GetAcademyActivityAsync);
        api.MapGet("/activity", GetPlatformActivityAsync);
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
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4) return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for every support action."] });
        var tenant = await db.Tenants.SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        var previous = tenant.Status;
        tenant.Status = request.Status;
        var revokedSessions = 0;
        if (tenant.Status == "PAUSED" && previous != "PAUSED")
        {
            var tenantUserIds = db.Memberships.Where(item => item.TenantId == tenant.Id).Select(item => item.UserAccountId);
            var sessions = await db.RefreshSessions.Where(item => tenantUserIds.Contains(item.UserAccountId) && item.RevokedAt == null).ToListAsync(cancellationToken);
            var now = DateTimeOffset.UtcNow;
            foreach (var session in sessions) session.RevokedAt = now;
            revokedSessions = sessions.Count;
        }
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenant.Id, Action = "PLATFORM_TENANT_STATUS_CHANGED", TargetType = "TENANT", TargetId = tenant.Id.ToString(), Reason = request.Reason.Trim(), MetadataJson = JsonSerializer.Serialize(new { previous, next = tenant.Status, revokedSessions }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { id = tenant.Id, status = tenant.Status, revokedSessions } });
    }

    private static async Task<IResult> GetMembersAsync(Guid tenantId, MadaDbContext db, string? search, CancellationToken cancellationToken)
    {
        if (!await db.Tenants.AnyAsync(x => x.Id == tenantId, cancellationToken)) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        var normalizedSearch = search?.Trim();
        if (normalizedSearch?.Length > 120) return Results.ValidationProblem(new Dictionary<string, string[]> { ["search"] = ["Search text must be 120 characters or less."] });
        var now = DateTimeOffset.UtcNow;
        var members = await db.Memberships.AsNoTracking().Where(x => x.TenantId == tenantId)
            .Where(x => string.IsNullOrEmpty(normalizedSearch) ||
                (x.UserAccount!.DisplayName != null && x.UserAccount.DisplayName.Contains(normalizedSearch)) ||
                (x.UserAccount!.Email != null && x.UserAccount.Email.Contains(normalizedSearch)) ||
                x.UserAccount!.Phone.Contains(normalizedSearch))
            .OrderBy(x => x.RoleCode).Select(x => new
        {
            membershipId = x.Id,
            userId = x.UserAccountId,
            name = x.UserAccount!.DisplayName,
            email = x.UserAccount.Email,
            phone = x.UserAccount.Phone,
            roleCode = x.RoleCode,
            membershipStatus = x.Status,
            userStatus = x.UserAccount.Status,
            lastLoginAt = x.UserAccount.LastLoginAt,
            activeSessions = db.RefreshSessions.Count(session => session.UserAccountId == x.UserAccountId && session.RevokedAt == null && session.ExpiresAt > now),
            lastSessionAt = db.RefreshSessions.Where(session => session.UserAccountId == x.UserAccountId).OrderByDescending(session => session.CreatedAt).Select(session => (DateTimeOffset?)session.CreatedAt).FirstOrDefault(),
            branch = x.Branch == null ? null : new { x.Branch.Id, x.Branch.Name, x.Branch.Code }
        }).ToListAsync(cancellationToken);
        var items = members.Select(member => new
        {
            member.membershipId,
            member.userId,
            member.name,
            maskedEmail = MaskEmail(member.email),
            maskedPhone = MaskPhone(member.phone),
            member.roleCode,
            member.membershipStatus,
            member.userStatus,
            member.lastLoginAt,
            member.activeSessions,
            member.lastSessionAt,
            member.branch
        });
        return Results.Ok(new { data = new { items, total = members.Count, tenantId } });
    }

    private static async Task<IResult> ChangeMemberStatusAsync(Guid tenantId, Guid membershipId, MemberStatusRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (request.Status is not ("ACTIVE" or "REVOKED")) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Status must be ACTIVE or REVOKED."] });
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4) return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for every support action."] });
        var membership = await db.Memberships.Include(item => item.UserAccount).SingleOrDefaultAsync(item => item.Id == membershipId && item.TenantId == tenantId, cancellationToken);
        if (membership?.UserAccount is null) return Results.NotFound(new { error = new { code = "TENANT_MEMBER_NOT_FOUND", message = "Member was not found in the selected academy." } });
        if (membership.RoleCode == "R00_PLATFORM_ADMIN") return Results.Conflict(new { error = new { code = "PLATFORM_ROLE_PROTECTED", message = "Platform administrator assignments are managed outside tenant support." } });
        if (request.Status == "ACTIVE" && membership.UserAccount.Status != "ACTIVE") return Results.Conflict(new { error = new { code = "USER_ACCOUNT_NOT_ACTIVE", message = "The account is disabled globally and must be reviewed through the account recovery process." } });
        var previous = membership.Status;
        membership.Status = request.Status;
        var sessions = request.Status == "REVOKED"
            ? await db.RefreshSessions.Where(item => item.UserAccountId == membership.UserAccountId && item.RevokedAt == null).ToListAsync(cancellationToken)
            : [];
        var now = DateTimeOffset.UtcNow;
        foreach (var session in sessions) session.RevokedAt = now;
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "PLATFORM_MEMBER_STATUS_CHANGED", TargetType = "MEMBERSHIP", TargetId = membershipId.ToString(), Reason = request.Reason.Trim(), MetadataJson = JsonSerializer.Serialize(new { userId = membership.UserAccountId, previous, next = membership.Status, revokedSessions = sessions.Count }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { membershipId, userId = membership.UserAccountId, status = membership.Status, revokedSessions = sessions.Count } });
    }

    private static async Task<IResult> RevokeSessionsAsync(Guid tenantId, Guid userId, SupportReasonRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4) return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for every support action."] });
        var targetExists = await db.Memberships.AnyAsync(item => item.TenantId == tenantId && item.UserAccountId == userId, cancellationToken);
        if (!targetExists) return Results.NotFound(new { error = new { code = "TENANT_MEMBER_NOT_FOUND", message = "User was not found in the selected academy." } });
        var user = await db.UserAccounts.SingleOrDefaultAsync(item => item.Id == userId && item.AccountType == "staff", cancellationToken);
        if (user is null) return Results.NotFound(new { error = new { code = "STAFF_USER_NOT_FOUND", message = "Staff account was not found." } });
        var sessions = await db.RefreshSessions.Where(item => item.UserAccountId == userId && item.RevokedAt == null).ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        foreach (var session in sessions) session.RevokedAt = now;
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "PLATFORM_USER_SESSIONS_REVOKED", TargetType = "USER_ACCOUNT", TargetId = userId.ToString(), Reason = request.Reason.Trim(), MetadataJson = JsonSerializer.Serialize(new { revokedCount = sessions.Count }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { userId, tenantId, revokedCount = sessions.Count } });
    }

    private static IResult GetPlatformRoles() => Results.Ok(new { data = new
    {
        items = new[]
        {
            new
            {
                code = "R00_PLATFORM_ADMIN",
                label = "مسؤول المنصة",
                scope = "PLATFORM",
                permissions = new[] { "platform.read", "academy.create", "academy.read", "academy.archive", "support.member.search", "support.sessions.revoke", "support.membership.disable", "audit.read" },
                assignmentMode = "CONTROLLED_OUT_OF_BAND",
                canSelfAssign = false
            }
        }
    }});

    private static async Task<IResult> GetAcademyActivityAsync(Guid tenantId, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!await db.Tenants.AnyAsync(item => item.Id == tenantId, cancellationToken)) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        return await GetActivityAsync(db, cancellationToken, tenantId);
    }

    private static async Task<IResult> GetPlatformActivityAsync(MadaDbContext db, CancellationToken cancellationToken) => await GetActivityAsync(db, cancellationToken, null);

    private static async Task<IResult> GetActivityAsync(MadaDbContext db, CancellationToken cancellationToken, Guid? tenantId)
    {
        var query = db.AuditEvents.AsNoTracking().AsQueryable();
        if (tenantId.HasValue) query = query.Where(item => item.TenantId == tenantId.Value);
        var events = await query.OrderByDescending(x => x.CreatedAt).Take(100).Select(x => new
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

    private static string MaskPhone(string value) => value.Length <= 4 ? "••••" : $"•••• {value[^4..]}";
    private static string? MaskEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var separator = value.IndexOf('@');
        if (separator <= 0) return "••••";
        var visible = value[..Math.Min(1, separator)];
        return $"{visible}••••{value[separator..]}";
    }

    private static Guid? ActorId(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private sealed record TenantStatusRequest(string Status, string? Reason);
    private sealed record MemberStatusRequest(string Status, string? Reason);
    private sealed record SupportReasonRequest(string? Reason);
}
