using System.Net.Mail;
using System.Security.Claims;
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
        api.MapGet("/roles", GetRoles);
        api.MapGet("/members", GetMembersAsync);
        api.MapPost("/members", AddMemberAsync);
        api.MapPut("/members/{membershipId:guid}/role", ChangeRoleAsync);
        api.MapPatch("/members/{membershipId:guid}/status", ChangeStatusAsync);
        return endpoints;
    }

    private static IResult GetRoles()
        => Results.Ok(new { data = new { roles = RoleCatalog.All, permissions = RoleCatalog.PermissionCatalog } });

    private static async Task<IResult> GetMembersAsync(
        MadaDbContext db,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        if (!TryTenant(principal, out var tenantId)) return ScopeError();
        var members = await db.Memberships.AsNoTracking()
            .Include(item => item.UserAccount)
            .Include(item => item.Branch)
            .Where(item => item.TenantId == tenantId && item.Status != "REVOKED" && item.UserAccount != null)
            .OrderBy(item => item.RoleCode)
            .ThenBy(item => item.UserAccount!.DisplayName)
            .Select(item => new
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
                branch = item.Branch == null ? null : new { item.Branch.Id, item.Branch.Name, item.Branch.Code }
            })
            .ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = members, total = members.Count, tenantId } });
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
        db.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "MEMBER_ROLE_CHANGED", TargetType = "MEMBERSHIP", TargetId = membership.Id.ToString(), MetadataJson = $"{{\"role\":\"{role.Code}\",\"userId\":\"{membership.UserAccountId}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { membershipId = membership.Id, roleCode = membership.RoleCode, scopeLevel = membership.ScopeLevel, branch = branch == null ? null : new { branch.Id, branch.Name, branch.Code } } });
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
        if (request.Status == "SUSPENDED") membership.UserAccount.Status = "SUSPENDED";
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

    private static bool TryTenant(ClaimsPrincipal principal, out Guid tenantId) => Guid.TryParse(principal.FindFirstValue("tenantId"), out tenantId);
    private static Guid? ActorId(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult ScopeError() => Results.Problem(statusCode: 403, title: "Missing academy scope", extensions: new Dictionary<string, object?> { ["code"] = "MISSING_ACADEMY_SCOPE" });
}

public sealed record AddMemberRequest(string FullName, string Email, string Phone, string Password, string RoleCode, Guid? BranchId);
public sealed record ChangeRoleRequest(string RoleCode, Guid? BranchId);
public sealed record ChangeStatusRequest(string Status);
