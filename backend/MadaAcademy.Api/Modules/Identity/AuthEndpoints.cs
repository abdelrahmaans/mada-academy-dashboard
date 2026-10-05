using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapMadaAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/otp/send", (OtpSendRequest request, AuthService auth) =>
        {
            if (string.IsNullOrWhiteSpace(request.Phone) || request.AccountType is not ("staff" or "parent" or "student"))
                return Results.BadRequest(new { error = new { code = "INVALID_OTP_REQUEST", message = "Phone and accountType are required." } });
            return Results.Ok(new { data = auth.SendOtp(request) });
        }).RequireRateLimiting("auth-sensitive");

        app.MapPost("/api/v1/auth/otp/verify", async (OtpVerifyRequest request, AuthService auth, CancellationToken cancellationToken) =>
        {
            var tokens = await auth.VerifyOtpAsync(request, cancellationToken);
            return tokens is null ? Results.Unauthorized() : Results.Ok(new { data = tokens });
        }).RequireRateLimiting("auth-sensitive");

        app.MapPost("/api/v1/auth/login", async (PasswordLoginRequest request, AuthService auth, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.Password) || request.AccountType is not ("staff" or "parent" or "student"))
                return Results.BadRequest(new { error = new { code = "INVALID_LOGIN_REQUEST", message = "Phone, password, and a supported accountType (staff, parent, or student) are required." } });
            var result = await auth.LoginWithPasswordAsync(request, cancellationToken);
            if (result.IsLocked) return Results.Problem(statusCode: StatusCodes.Status429TooManyRequests, title: "Login temporarily unavailable", extensions: new Dictionary<string, object?> { ["code"] = "LOGIN_LOCKED" });
            return result.Tokens is null ? Results.Unauthorized() : Results.Ok(new { data = result.Tokens });
        }).RequireRateLimiting("password-login");

        app.MapPost("/api/v1/auth/refresh", async (RefreshRequest request, AuthService auth, CancellationToken cancellationToken) =>
        {
            var tokens = await auth.RefreshAsync(request, cancellationToken);
            return tokens is null ? Results.Unauthorized() : Results.Ok(new { data = tokens });
        }).RequireRateLimiting("auth-sensitive");

        app.MapPost("/api/v1/auth/logout", async (LogoutRequest request, AuthService auth, CancellationToken cancellationToken) =>
        {
            await auth.LogoutAsync(request, cancellationToken);
            return Results.NoContent();
        }).RequireAuthorization();

        return app;
    }

    public static void MapMadaDevelopmentAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/dev/seed", async (DevSeedRequest request, MadaDbContext db, PasswordHashService passwords, CancellationToken cancellationToken) =>
        {
            var tenant = await db.Tenants.FindAsync([request.TenantId], cancellationToken);
            if (tenant is null)
            {
                tenant = new Tenant { Id = request.TenantId, Name = "Mada Demo Academy", Slug = $"demo-{request.TenantId:N}" };
                db.Tenants.Add(tenant);
            }
            Branch? branch = null;
            if (request.BranchId.HasValue)
            {
                branch = await db.Branches.FindAsync([request.BranchId.Value], cancellationToken);
                if (branch is null)
                {
                    branch = new Branch { Id = request.BranchId.Value, TenantId = tenant.Id, Name = "Main Branch", Code = "MAIN" };
                    db.Branches.Add(branch);
                }
            }
            var phone = OtpChallengeStore.Normalize(request.Phone);
            var user = await db.UserAccounts.SingleOrDefaultAsync(x => x.Phone == phone && x.AccountType == "staff", cancellationToken);
            if (user is null)
            {
                user = new UserAccount { Email = request.Email, Phone = phone, DisplayName = request.DisplayName, AccountType = "staff", Status = "ACTIVE" };
                db.UserAccounts.Add(user);
            }
            else
            {
                user.Email = request.Email; user.DisplayName = request.DisplayName; user.Status = "ACTIVE";
            }
            if (string.IsNullOrWhiteSpace(user.PasswordHash)) user.PasswordHash = passwords.Hash("Mada@2026");
            var membership = await db.Memberships.SingleOrDefaultAsync(x => x.UserAccountId == user.Id && x.TenantId == tenant.Id && x.BranchId == request.BranchId && x.RoleCode == request.RoleCode, cancellationToken);
            if (membership is null)
                db.Memberships.Add(new Membership { UserAccountId = user.Id, TenantId = tenant.Id, BranchId = request.BranchId, RoleCode = request.RoleCode, ScopeLevel = request.BranchId.HasValue ? "BRANCH" : "TENANT" });
            await db.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { data = new { userId = user.Id, tenantId = tenant.Id, branchId = branch?.Id, roleCode = request.RoleCode } });
        });
    }
}
