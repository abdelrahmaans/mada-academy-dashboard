using System.Security.Claims;

namespace MadaAcademy.Api.Modules.Identity;

public static class TenantScopeEndpoints
{
    public static IEndpointRouteBuilder MapMadaTenantScopeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/tenants/{tenantId:guid}/scope-check", (Guid tenantId, HttpContext context) =>
        {
            var isPlatformAdmin = context.User.IsInRole("R00_PLATFORM_ADMIN");
            var tokenTenantId = context.User.FindFirstValue("tenantId");
            if (!isPlatformAdmin && !string.Equals(tokenTenantId, tenantId.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return Results.Problem(
                    statusCode: 403,
                    title: "Tenant scope denied",
                    extensions: new Dictionary<string, object?> { ["code"] = "TENANT_SCOPE_DENIED" });
            }

            return Results.Ok(new
            {
                data = new
                {
                    tenantId,
                    access = "allowed",
                    role = context.User.FindFirstValue("role")
                }
            });
        }).RequireAuthorization("staff");

        return endpoints;
    }
}

