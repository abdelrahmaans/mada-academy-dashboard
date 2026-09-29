using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.IdentityModel.Tokens;

namespace MadaAcademy.Api.Auth;

public sealed record AuthTokenResponse(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    DateTimeOffset AccessTokenExpiresAt,
    DateTimeOffset RefreshTokenExpiresAt);

public sealed class JwtTokenService(JwtOptions options)
{
    public AuthTokenResponse Issue(UserAccount user, Membership membership)
    {
        var now = DateTimeOffset.UtcNow;
        var accessExpires = now.AddMinutes(options.AccessTokenMinutes);
        var refreshExpires = now.AddDays(options.RefreshTokenDays);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("accountType", user.AccountType),
            new("role", membership.RoleCode),
            new(ClaimTypes.Role, membership.RoleCode),
            new("tenantId", membership.TenantId.ToString()),
            new("scopeLevel", membership.ScopeLevel)
        };

        if (membership.BranchId.HasValue)
            claims.Add(new Claim("branchId", membership.BranchId.Value.ToString()));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(options.Issuer, options.Audience, claims, now.UtcDateTime, accessExpires.UtcDateTime, credentials);
        var accessToken = new JwtSecurityTokenHandler().WriteToken(jwt);

        return new AuthTokenResponse(accessToken, refreshToken, "Bearer", (int)TimeSpan.FromMinutes(options.AccessTokenMinutes).TotalSeconds, accessExpires, refreshExpires);
    }

    public static string HashRefreshToken(string refreshToken)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken))).ToLowerInvariant();
}
