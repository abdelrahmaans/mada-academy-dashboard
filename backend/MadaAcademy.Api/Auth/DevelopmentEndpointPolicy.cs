namespace MadaAcademy.Api.Auth;

public static class DevelopmentEndpointPolicy
{
    public static bool ShouldEnable(bool isDevelopment, string? configuredValue)
    {
        if (string.IsNullOrWhiteSpace(configuredValue)) return isDevelopment;
        if (!bool.TryParse(configuredValue, out var requested))
            throw new InvalidOperationException("MADA_ENABLE_DEV_ENDPOINTS must be a boolean value.");
        if (requested && !isDevelopment)
            throw new InvalidOperationException("MADA_ENABLE_DEV_ENDPOINTS cannot enable development endpoints outside Development.");
        return isDevelopment && requested;
    }
}
