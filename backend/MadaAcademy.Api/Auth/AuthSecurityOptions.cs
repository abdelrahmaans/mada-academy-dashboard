namespace MadaAcademy.Api.Auth;

public sealed class AuthSecurityOptions
{
    public int LoginPermitLimit { get; set; } = 20;
    public int LoginWindowSeconds { get; set; } = 60;
    public int SensitivePermitLimit { get; set; } = 30;
    public int SensitiveWindowSeconds { get; set; } = 60;
    public int ConsumerLookupPermitLimit { get; set; } = 60;
    public int ConsumerLookupWindowSeconds { get; set; } = 60;
    public int MaxFailedPasswordAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;

    public static AuthSecurityOptions Load(IConfiguration configuration)
    {
        var options = new AuthSecurityOptions();
        configuration.GetSection("AuthenticationSecurity").Bind(options);
        options.LoginPermitLimit = Math.Max(1, options.LoginPermitLimit);
        options.LoginWindowSeconds = Math.Max(1, options.LoginWindowSeconds);
        options.SensitivePermitLimit = Math.Max(1, options.SensitivePermitLimit);
        options.SensitiveWindowSeconds = Math.Max(1, options.SensitiveWindowSeconds);
        options.ConsumerLookupPermitLimit = Math.Max(1, options.ConsumerLookupPermitLimit);
        options.ConsumerLookupWindowSeconds = Math.Max(1, options.ConsumerLookupWindowSeconds);
        options.MaxFailedPasswordAttempts = Math.Max(1, options.MaxFailedPasswordAttempts);
        options.LockoutMinutes = Math.Max(1, options.LockoutMinutes);
        return options;
    }
}
