using System.Security.Claims;
using MadaAcademy.Api.Modules.Identity;

namespace MadaAcademy.Api.Auth;

/// <summary>
/// Resolves permissions from the same server-side role catalog returned by /me.
/// Object-level scope and assignment checks must still be applied by each endpoint.
/// </summary>
public static class RolePermissionAuthorization
{
    public static bool HasPermission(ClaimsPrincipal user, string permission) =>
        RoleCatalog.All.Any(role =>
            user.IsInRole(role.Code) &&
            role.Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase));
}
