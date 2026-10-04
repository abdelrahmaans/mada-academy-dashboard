namespace MadaAcademy.Api.Auth;

public static class CorsOriginResolver
{
    public static string[] Resolve(bool isDevelopment, string? rawOrigins)
    {
        var origins = rawOrigins?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [];
        if (!isDevelopment && (origins.Length == 0 || origins.Any(origin => origin == "*")))
            throw new InvalidOperationException("MADA_CORS_ORIGINS must contain explicit origins in non-Development environments.");
        return origins;
    }
}
