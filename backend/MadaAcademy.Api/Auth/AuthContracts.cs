using System.Security.Cryptography;

namespace MadaAcademy.Api.Auth;

public sealed record OtpSendRequest(string Phone, string AccountType = "staff");
public sealed record OtpVerifyRequest(string Phone, string Code, string AccountType = "staff");
public sealed record RefreshRequest(string RefreshToken);
public sealed record LogoutRequest(string RefreshToken);
public sealed record DevSeedRequest(string Phone, string Email, string DisplayName, string RoleCode, Guid TenantId, Guid? BranchId);

public sealed record OtpSendResponse(string Delivery, DateTimeOffset ExpiresAt, string? DevelopmentCode);

public sealed class OtpChallengeStore(JwtOptions options)
{
    private readonly Dictionary<string, Challenge> challenges = new(StringComparer.OrdinalIgnoreCase);
    private readonly Lock gate = new();

    public OtpSendResponse Issue(string phone, string accountType)
    {
        var normalized = Normalize(phone);
        var code = options.TestOtpCode ?? Random.Shared.Next(100000, 999999).ToString();
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(options.OtpMinutes);
        lock (gate) challenges[$"{accountType}:{normalized}"] = new Challenge(code, expiresAt, 0);
        return new OtpSendResponse("development://otp", expiresAt, options.TestOtpCode);
    }

    public bool Verify(string phone, string accountType, string code)
    {
        var key = $"{accountType}:{Normalize(phone)}";
        lock (gate)
        {
            if (!challenges.TryGetValue(key, out var challenge) || challenge.ExpiresAt < DateTimeOffset.UtcNow || challenge.Attempts >= 3)
                return false;
            challenge = challenge with { Attempts = challenge.Attempts + 1 };
            challenges[key] = challenge;
            if (!CryptographicOperations.FixedTimeEquals(System.Text.Encoding.UTF8.GetBytes(challenge.Code), System.Text.Encoding.UTF8.GetBytes(code)))
                return false;
            challenges.Remove(key);
            return true;
        }
    }

    public static string Normalize(string phone) => phone.Trim().Replace(" ", string.Empty).Replace("-", string.Empty);
    private sealed record Challenge(string Code, DateTimeOffset ExpiresAt, int Attempts);
}
