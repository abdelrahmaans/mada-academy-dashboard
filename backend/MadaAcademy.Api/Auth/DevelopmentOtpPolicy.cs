namespace MadaAcademy.Api.Auth;

public static class DevelopmentOtpPolicy
{
    public static void EnsureTestOtpOnlyInDevelopment(bool isDevelopment, string? testOtpCode)
    {
        if (!isDevelopment && !string.IsNullOrWhiteSpace(testOtpCode))
            throw new InvalidOperationException("MADA_AUTH_TEST_OTP is only allowed in the Development environment.");
    }
}
