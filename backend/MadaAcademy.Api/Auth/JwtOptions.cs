namespace MadaAcademy.Api.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Auth:Jwt";
    public string Issuer { get; set; } = "mada-academy-api";
    public string Audience { get; set; } = "mada-academy-web";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
    public int OtpMinutes { get; set; } = 10;
    public string? TestOtpCode { get; set; }

    public static JwtOptions Load(IConfiguration configuration, IHostEnvironment environment)
    {
        var options = new JwtOptions();
        configuration.GetSection(SectionName).Bind(options);
        options.SigningKey = Environment.GetEnvironmentVariable("MADA_JWT_SIGNING_KEY")
            ?? options.SigningKey;
        options.TestOtpCode = Environment.GetEnvironmentVariable("MADA_AUTH_TEST_OTP")
            ?? options.TestOtpCode;

        if (string.IsNullOrWhiteSpace(options.SigningKey))
        {
            if (!environment.IsDevelopment())
                throw new InvalidOperationException("MADA_JWT_SIGNING_KEY is required outside Development.");
            options.SigningKey = "development-only-mada-jwt-key-change-before-production-2026";
        }

        if (options.SigningKey.Length < 32)
            throw new InvalidOperationException("JWT signing key must be at least 32 characters.");

        return options;
    }
}
