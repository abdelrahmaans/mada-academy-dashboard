using System.Security.Claims;
using MadaAcademy.Api.Modules.Identity;
using MadaAcademy.Api.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Auth;

public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionAuthorizationHandler(MadaDbContext db) : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var user = context.User;
        if (!Guid.TryParse(user.FindFirstValue("sub"), out var userId) ||
            !Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId) ||
            string.IsNullOrWhiteSpace(user.FindFirstValue("role")))
            return;

        var role = user.FindFirstValue("role")!;
        var tokenBranchId = Guid.TryParse(user.FindFirstValue("branchId"), out var branchId)
            ? branchId
            : (Guid?)null;

        var membership = await db.Memberships.AsNoTracking()
            .Where(item =>
                item.UserAccountId == userId &&
                item.TenantId == tenantId &&
                item.RoleCode == role &&
                item.BranchId == tokenBranchId &&
                item.Status == "ACTIVE" &&
                item.UserAccount!.Status == "ACTIVE" &&
                (role == "R00_PLATFORM_ADMIN" || item.Tenant!.Status != "PAUSED"))
            .Select(item => new { item.RoleCode, item.CustomPermissionsJson })
            .FirstOrDefaultAsync(context.Resource is HttpContext http
                ? http.RequestAborted
                : CancellationToken.None);

        if (membership is null)
            return;

        var tenantOverride = await db.TenantRoleOverrides.AsNoTracking()
            .Where(item => item.TenantId == tenantId && item.RoleCode == membership.RoleCode)
            .Select(item => item.PermissionsJson)
            .FirstOrDefaultAsync(context.Resource is HttpContext http
                ? http.RequestAborted
                : CancellationToken.None);

        var effective = RoleCatalog.ResolveEffectivePermissions(
            membership.RoleCode,
            membership.CustomPermissionsJson,
            tenantOverride);

        if (effective.Contains(requirement.Permission, StringComparer.OrdinalIgnoreCase))
            context.Succeed(requirement);
    }
}

public static class PermissionAuthorizationExtensions
{
    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, string permission)
        where TBuilder : IEndpointConventionBuilder
        => builder.RequireAuthorization($"permission:{permission}");
}
