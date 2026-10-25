using System.Net.Mail;
using System.Security.Claims;
using System.Text.Json;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class RoleEndpoints
{
    public static IEndpointRouteBuilder MapMadaRoleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/academy").RequireAuthorization("academy-owner");
        api.MapGet("/roles", GetRolesAsync);
        api.MapPut("/roles/{roleCode}/permissions", UpdateRolePermissionsAsync);
        api.MapDelete("/roles/{roleCode}/permissions", ResetRolePermissionsAsync);
        api.MapGet("/members", GetMembersAsync);
        api.MapPost("/members", AddMemberAsync);
        api.MapPut("/members/{membershipId:guid}/role", ChangeRoleAsync);
        api.MapPut("/members/{membershipId:guid}/permissions", UpdateMemberPermissionsAsync);
        api.MapDelete("/members/{membershipId:guid}/permissions", ResetMemberPermissionsAsync);
        api.MapPatch("/members/{membershipId:guid}/status", ChangeStatusAsync);
        return endpoints;
    }

    private static async Task<IResult> GetRolesAsync(
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();

        var overrides = await db.TenantRoleOverrides.AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .ToDictionaryAsync(x => x.RoleCode, x => x.PermissionsJson, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var roles = RoleCatalog.All.Select(role =>
        {
            var isCustomized = overrides.TryGetValue(role.Code, out var overrideJson);
            var effective = RoleCatalog.ResolveEffectivePermissions(role.Code, null, overrideJson);
            return new
            {
                code = role.Code,
                label = role.Label,
                scopeLevel = role.ScopeLevel,
                description = role.Description,
                permissions = effective,
                defaultPermissions = role.Permissions,
                isCustomized,
                assignableByAcademyOwner = role.AssignableByAcademyOwner
            };
        }).ToArray();

        return Results.Ok(new
        {
            data = new
            {
                roles,
                permissions = RoleCatalog.PermissionCatalog,
                permissionDetails = RoleCatalog.PermissionDetails
            }
        });
    }

    private static async Task<IResult> UpdateRolePermissionsAsync(
        string roleCode,
        UpdatePermissionsRequest request,
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        var role = RoleCatalog.Find(roleCode);
        if (role is null) return Results.NotFound(new { error = new { code = "ROLE_NOT_FOUND", message = "Role was not found." } });
        if (!role.AssignableByAcademyOwner)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["roleCode"] = ["Academy owner permissions cannot be altered."] });

        var allowed = RoleCatalog.PermissionCatalog.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var sanitized = (request.Permissions ?? [])
            .Where(p => allowed.Contains(p))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var json = JsonSerializer.Serialize(sanitized);
        var existing = await db.TenantRoleOverrides
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.RoleCode == role.Code, cancellationToken);

        if (existing is null)
        {
            db.TenantRoleOverrides.Add(new TenantRoleOverride
            {
                TenantId = tenantId,
                RoleCode = role.Code,
                PermissionsJson = json
            });
        }
        else
        {
            existing.PermissionsJson = json;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await RevokeSessionsAsync(
            db,
            await db.Memberships
                .Where(item => item.TenantId == tenantId && item.RoleCode == role.Code)
                .Select(item => item.UserAccountId)
                .ToArrayAsync(cancellationToken),
            cancellationToken);

        db.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenantId,
            Action = "ROLE_PERMISSIONS_UPDATED",
            TargetType = "ROLE",
            TargetId = role.Code,
            MetadataJson = $"{{\"role\":\"{role.Code}\",\"count\":{sanitized.Length}}}"
        });

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new
        {
            data = new
            {
                roleCode = role.Code,
                permissions = sanitized,
                defaultPermissions = role.Permissions,
                isCustomized = true
            }
        });
    }

    private static async Task<IResult> ResetRolePermissionsAsync(
        string roleCode,
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        var role = RoleCatalog.Find(roleCode);
        if (role is null) return Results.NotFound(new { error = new { code = "ROLE_NOT_FOUND", message = "Role was not found." } });

        var existing = await db.TenantRoleOverrides
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.RoleCode == role.Code, cancellationToken);

        if (existing is not null)
        {
            db.TenantRoleOverrides.Remove(existing);
            db.Add(new AuditEvent
            {
                ActorUserId = ActorId(principal),
                TenantId = tenantId,
                Action = "ROLE_PERMISSIONS_RESET",
                TargetType = "ROLE",
                TargetId = role.Code,
                MetadataJson = $"{{\"role\":\"{role.Code}\"}}"
            });
            await db.SaveChangesAsync(cancellationToken);
        }

        return Results.Ok(new
        {
            data = new
            {
                roleCode = role.Code,
                permissions = role.Permissions,
                defaultPermissions = role.Permissions,
                isCustomized = false
            }
        });
    }

    private static async Task<IResult> GetMembersAsync(
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();

        var overrides = await db.TenantRoleOverrides.AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .ToDictionaryAsync(x => x.RoleCode, x => x.PermissionsJson, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var members = await db.Memberships.AsNoTracking()
            .Include(item => item.UserAccount)
            .Include(item => item.Branch)
            .Where(item => item.TenantId == tenantId && item.Status != "REVOKED" && item.UserAccount != null)
            .OrderBy(item => item.RoleCode)
            .ThenBy(item => item.UserAccount!.DisplayName)
            .ToListAsync(cancellationToken);

        var items = members.Select(item =>
        {
            overrides.TryGetValue(item.RoleCode, out var overrideJson);
            var effective = RoleCatalog.ResolveEffectivePermissions(item.RoleCode, item.CustomPermissionsJson, overrideJson);
            string[]? custom = null;
            if (!string.IsNullOrWhiteSpace(item.CustomPermissionsJson))
            {
                try { custom = JsonSerializer.Deserialize<string[]>(item.CustomPermissionsJson); }
                catch { }
            }

            return new
            {
                membershipId = item.Id,
                userId = item.UserAccountId,
                name = item.UserAccount!.DisplayName,
                email = item.UserAccount.Email,
                phone = item.UserAccount.Phone,
                userStatus = item.UserAccount.Status,
                roleCode = item.RoleCode,
                scopeLevel = item.ScopeLevel,
                membershipStatus = item.Status,
                branch = item.Branch == null ? null : new { item.Branch.Id, item.Branch.Name, item.Branch.Code },
                customPermissions = custom,
                effectivePermissions = effective,
                hasCustomPermissions = custom is not null
            };
        }).ToList();

        return Results.Ok(new { data = new { items, total = items.Count, tenantId } });
    }

    private static async Task<IResult> AddMemberAsync(
        AddMemberRequest request,
        MadaDbContext db,
        ClaimsPrincipal principal,
        PasswordHashService passwords,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        var role = RoleCatalog.Find(request.RoleCode);
        if (role is null || !role.AssignableByAcademyOwner)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["roleCode"] = ["This role cannot be assigned by an academy owner."] });
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["member"] = ["Full name, email, and phone are required."] });
        try { _ = new MailAddress(request.Email); }
        catch { return Results.ValidationProblem(new Dictionary<string, string[]> { ["email"] = ["A valid email is required."] }); }

        var email = request.Email.Trim().ToLowerInvariant();
        var phone = OtpChallengeStore.Normalize(request.Phone);
        if (await db.UserAccounts.AnyAsync(item => item.Email == email, cancellationToken))
            return Results.Conflict(new { error = new { code = "MEMBER_EMAIL_EXISTS", message = "This email is already registered." } });
        if (await db.UserAccounts.AnyAsync(item => item.Phone == phone && item.AccountType == "staff", cancellationToken))
            return Results.Conflict(new { error = new { code = "MEMBER_PHONE_EXISTS", message = "This phone is already registered." } });

        var branch = await ResolveBranchAsync(db, tenantId, role, request.BranchId, cancellationToken);
        if (branch is null && role.ScopeLevel == "BRANCH")
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["branchId"] = ["A valid active branch is required for this role."] });

        var user = new UserAccount
        {
            Email = email,
            Phone = phone,
            DisplayName = request.FullName.Trim(),
            AccountType = "staff",
            PasswordHash = passwords.Hash(request.Password),
            Status = "ACTIVE"
        };
        var membership = new Membership
        {
            UserAccountId = user.Id,
            TenantId = tenantId,
            BranchId = branch?.Id,
            RoleCode = role.Code,
            ScopeLevel = role.ScopeLevel,
            Status = "ACTIVE"
        };
        db.Add(user);
        db.Add(membership);
        db.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "MEMBER_CREATED", TargetType = "MEMBERSHIP", TargetId = membership.Id.ToString(), MetadataJson = $"{{\"role\":\"{role.Code}\",\"userId\":\"{user.Id}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/academy/members/{membership.Id}", new { data = new { membershipId = membership.Id, userId = user.Id, name = user.DisplayName, email = user.Email, phone = user.Phone, userStatus = user.Status, roleCode = role.Code, scopeLevel = role.ScopeLevel, membershipStatus = membership.Status, branch = branch == null ? null : new { branch.Id, branch.Name, branch.Code } } });
    }

    private static async Task<IResult> ChangeRoleAsync(
        Guid membershipId,
        ChangeRoleRequest request,
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        var role = RoleCatalog.Find(request.RoleCode);
        if (role is null || !role.AssignableByAcademyOwner)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["roleCode"] = ["This role cannot be assigned by an academy owner."] });
        var membership = await db.Memberships.Include(item => item.UserAccount).SingleOrDefaultAsync(item => item.Id == membershipId && item.TenantId == tenantId, cancellationToken);
        if (membership?.UserAccount is null) return Results.NotFound(new { error = new { code = "MEMBERSHIP_NOT_FOUND", message = "Member was not found in this academy." } });
        if (membership.UserAccountId == ActorId(principal)) return Results.Conflict(new { error = new { code = "CANNOT_CHANGE_SELF", message = "You cannot change your own academy owner role." } });
        var branch = await ResolveBranchAsync(db, tenantId, role, request.BranchId, cancellationToken);
        if (branch is null && role.ScopeLevel == "BRANCH") return Results.ValidationProblem(new Dictionary<string, string[]> { ["branchId"] = ["A valid active branch is required for this role."] });
        membership.RoleCode = role.Code;
        membership.ScopeLevel = role.ScopeLevel;
        membership.BranchId = branch?.Id;
        await RevokeSessionsAsync(db, [membership.UserAccountId], cancellationToken);
        db.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "MEMBER_ROLE_CHANGED", TargetType = "MEMBERSHIP", TargetId = membership.Id.ToString(), MetadataJson = $"{{\"role\":\"{role.Code}\",\"userId\":\"{membership.UserAccountId}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { membershipId = membership.Id, roleCode = membership.RoleCode, scopeLevel = membership.ScopeLevel, branch = branch == null ? null : new { branch.Id, branch.Name, branch.Code } } });
    }

    private static async Task<IResult> UpdateMemberPermissionsAsync(
        Guid membershipId,
        UpdatePermissionsRequest request,
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        var membership = await db.Memberships.Include(item => item.UserAccount)
            .SingleOrDefaultAsync(item => item.Id == membershipId && item.TenantId == tenantId, cancellationToken);
        if (membership?.UserAccount is null)
            return Results.NotFound(new { error = new { code = "MEMBERSHIP_NOT_FOUND", message = "Member was not found in this academy." } });
        if (membership.UserAccountId == ActorId(principal))
            return Results.Conflict(new { error = new { code = "CANNOT_CHANGE_SELF", message = "You cannot override your own academy owner permissions." } });

        var allowed = RoleCatalog.PermissionCatalog.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var sanitized = (request.Permissions ?? [])
            .Where(p => allowed.Contains(p))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        membership.CustomPermissionsJson = JsonSerializer.Serialize(sanitized);
        await RevokeSessionsAsync(db, [membership.UserAccountId], cancellationToken);
        db.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenantId,
            Action = "MEMBER_PERMISSIONS_UPDATED",
            TargetType = "MEMBERSHIP",
            TargetId = membership.Id.ToString(),
            MetadataJson = $"{{\"membershipId\":\"{membership.Id}\",\"count\":{sanitized.Length}}}"
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new
        {
            data = new
            {
                membershipId = membership.Id,
                customPermissions = sanitized,
                effectivePermissions = sanitized,
                hasCustomPermissions = true
            }
        });
    }

    private static async Task<IResult> ResetMemberPermissionsAsync(
        Guid membershipId,
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        var membership = await db.Memberships.Include(item => item.UserAccount)
            .SingleOrDefaultAsync(item => item.Id == membershipId && item.TenantId == tenantId, cancellationToken);
        if (membership?.UserAccount is null)
            return Results.NotFound(new { error = new { code = "MEMBERSHIP_NOT_FOUND", message = "Member was not found in this academy." } });

        membership.CustomPermissionsJson = null;
        await RevokeSessionsAsync(db, [membership.UserAccountId], cancellationToken);
        db.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenantId,
            Action = "MEMBER_PERMISSIONS_RESET",
            TargetType = "MEMBERSHIP",
            TargetId = membership.Id.ToString(),
            MetadataJson = $"{{\"membershipId\":\"{membership.Id}\"}}"
        });
        await db.SaveChangesAsync(cancellationToken);

        var tenantOverride = await db.TenantRoleOverrides.AsNoTracking()
            .FirstOrDefaultAsync(item => item.TenantId == tenantId && item.RoleCode == membership.RoleCode, cancellationToken);
        var effective = RoleCatalog.ResolveEffectivePermissions(membership.RoleCode, null, tenantOverride?.PermissionsJson);

        return Results.Ok(new
        {
            data = new
            {
                membershipId = membership.Id,
                customPermissions = (string[]?)null,
                effectivePermissions = effective,
                hasCustomPermissions = false
            }
        });
    }

    private static async Task<IResult> ChangeStatusAsync(
        Guid membershipId,
        ChangeStatusRequest request,
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        if (request.Status is not ("ACTIVE" or "SUSPENDED" or "REVOKED"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Status must be ACTIVE, SUSPENDED, or REVOKED."] });
        var membership = await db.Memberships.Include(item => item.UserAccount).SingleOrDefaultAsync(item => item.Id == membershipId && item.TenantId == tenantId, cancellationToken);
        if (membership?.UserAccount is null) return Results.NotFound(new { error = new { code = "MEMBERSHIP_NOT_FOUND", message = "Member was not found in this academy." } });
        if (membership.UserAccountId == ActorId(principal)) return Results.Conflict(new { error = new { code = "CANNOT_CHANGE_SELF", message = "You cannot suspend or revoke your own account." } });
        membership.Status = request.Status;
        if (request.Status == "SUSPENDED")
        {
            membership.UserAccount.Status = "SUSPENDED";
            var sessions = await db.RefreshSessions
                .Where(s => s.UserAccountId == membership.UserAccountId && s.RevokedAt == null)
                .ToListAsync(cancellationToken);
            foreach (var s in sessions) s.RevokedAt = DateTimeOffset.UtcNow;
        }
        if (request.Status == "ACTIVE" && membership.UserAccount.Status == "SUSPENDED") membership.UserAccount.Status = "ACTIVE";
        db.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "MEMBER_STATUS_CHANGED", TargetType = "MEMBERSHIP", TargetId = membership.Id.ToString(), MetadataJson = $"{{\"status\":\"{request.Status}\",\"userId\":\"{membership.UserAccountId}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { membershipId = membership.Id, membership.Status, userStatus = membership.UserAccount.Status } });
    }

    private static async Task<Branch?> ResolveBranchAsync(MadaDbContext db, Guid tenantId, RoleDefinition role, Guid? branchId, CancellationToken cancellationToken)
    {
        if (role.ScopeLevel != "BRANCH") return null;
        if (!branchId.HasValue) return null;
        return await db.Branches.SingleOrDefaultAsync(item => item.Id == branchId.Value && item.TenantId == tenantId && item.Status == "ACTIVE", cancellationToken);
    }

    private static async Task RevokeSessionsAsync(MadaDbContext db, IReadOnlyCollection<Guid> userIds, CancellationToken cancellationToken)
    {
        if (userIds.Count == 0) return;
        var sessions = await db.RefreshSessions
            .Where(item => userIds.Contains(item.UserAccountId) && item.RevokedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var session in sessions) session.RevokedAt = DateTimeOffset.UtcNow;
    }

    private static bool TryTenant(ClaimsPrincipal principal, out Guid tenantId) => Guid.TryParse(principal.FindFirstValue("tenantId"), out tenantId);
    private static Guid? ActorId(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult ScopeError() => Results.Problem(statusCode: 403, title: "Missing academy scope", extensions: new Dictionary<string, object?> { ["code"] = "MISSING_ACADEMY_SCOPE" });
}

public sealed record AddMemberRequest(string FullName, string Email, string Phone, string Password, string RoleCode, Guid? BranchId);
public sealed record ChangeRoleRequest(string RoleCode, Guid? BranchId);
public sealed record ChangeStatusRequest(string Status);
public sealed record UpdatePermissionsRequest(string[]? Permissions);
