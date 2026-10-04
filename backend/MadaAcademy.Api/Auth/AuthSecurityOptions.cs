namespace MadaAcademy.Api.Auth;

public sealed class AuthSecurityOptions
{
    public int LoginPermitLimit { get; set; } = 20;
    public int LoginWindowSeconds { get; set; } = 60;
    public int MaxFailedPasswordAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;

    public static AuthSecurityOptions Load(IConfiguration configuration)
    {
        var options = new AuthSecurityOptions();
        configuration.GetSection("AuthenticationSecurity").Bind(options);
        options.LoginPermitLimit = Math.Max(1, options.LoginPermitLimit);
        options.LoginWindowSeconds = Math.Max(1, options.LoginWindowSeconds);
        options.MaxFailedPasswordAttempts = Math.Max(1, options.MaxFailedPasswordAttempts);
        options.LockoutMinutes = Math.Max(1, options.LockoutMinutes);
        return options;
    }
}
