using System.Text;
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
