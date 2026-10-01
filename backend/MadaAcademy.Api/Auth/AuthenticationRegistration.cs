using System.Text;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace MadaAcademy.Api.Auth;

public static class AuthenticationRegistration
{
    public static IServiceCollection AddMadaAuthentication(this IServiceCollection services, JwtOptions options)
    {
        services.AddSingleton(options);
        services.AddSingleton<JwtTokenService>();
        services.AddSingleton<OtpChallengeStore>();
        services.AddSingleton<PasswordHashService>();
        services.AddScoped<AuthService>();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(jwt =>
        {
            jwt.MapInboundClaims = false;
            jwt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = options.Issuer,
                ValidateAudience = true,
                ValidAudience = options.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SigningKey)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                NameClaimType = "sub",
                RoleClaimType = "role"
            };
            jwt.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var principal = context.Principal;
                    if (!Guid.TryParse(principal?.FindFirst("sub")?.Value, out var userId) ||
                        !Guid.TryParse(principal?.FindFirst("tenantId")?.Value, out var tenantId) ||
                        !Guid.TryParse(principal?.FindFirst("sessionId")?.Value, out var sessionId) ||
                        string.IsNullOrWhiteSpace(principal?.FindFirst("role")?.Value))
                    {
                        context.Fail("The token does not contain an active membership scope.");
                        return;
                    }

                    var role = principal!.FindFirst("role")!.Value;
                    var db = context.HttpContext.RequestServices.GetRequiredService<MadaDbContext>();
                    var now = DateTimeOffset.UtcNow;
                    var activeSession = await db.RefreshSessions.AnyAsync(session =>
                        session.Id == sessionId && session.UserAccountId == userId &&
                        session.RevokedAt == null && session.ExpiresAt > now,
                        context.HttpContext.RequestAborted);
                    if (!activeSession)
                    {
                        context.Fail("The session is no longer active.");
                        return;
                    }
                    var activeMembership = await db.Memberships.AnyAsync(item =>
                        item.UserAccountId == userId &&
                        item.TenantId == tenantId &&
                        item.RoleCode == role &&
                        item.Status == "ACTIVE" &&
                        item.UserAccount!.Status == "ACTIVE" &&
                        (role == "R00_PLATFORM_ADMIN" || item.Tenant!.Status != "PAUSED"),
                        context.HttpContext.RequestAborted);
                    if (!activeMembership) context.Fail("The account, membership, or academy is no longer active.");
                }
            };
        });

        services.AddAuthorizationBuilder()
            .AddPolicy("staff", policy => policy.RequireAuthenticatedUser().RequireClaim("accountType", "staff"))
            .AddPolicy("consumer", policy => policy.RequireAuthenticatedUser().RequireClaim("accountType", "parent", "student"))
            .AddPolicy("platform-admin", policy => policy.RequireRole("R00_PLATFORM_ADMIN"))
            .AddPolicy("academy-owner", policy => policy.RequireRole("R01_ACADEMY_OWNER"))
            .AddPolicy("branch-manager", policy => policy.RequireRole("R02_BRANCH_MANAGER"));
        return services;
    }
}
