namespace MadaAcademy.Api.Auth;

public sealed class RateLimitTopologyOptions
{
    public const string SingleInstanceMode = "single-instance";

    public required string Mode { get; init; }
    public required int ExpectedInstanceCount { get; init; }

    public static RateLimitTopologyOptions Load(IConfiguration configuration, IHostEnvironment environment)
    {
        var mode = configuration["MADA_RATE_LIMIT_MODE"]?.Trim().ToLowerInvariant() ?? SingleInstanceMode;
        if (mode != SingleInstanceMode)
            throw new InvalidOperationException("MADA_RATE_LIMIT_MODE must be 'single-instance' until a shared distributed limiter is implemented and verified.");

        var rawExpectedCount = configuration["MADA_RATE_LIMIT_EXPECTED_INSTANCES"];
        if (string.IsNullOrWhiteSpace(rawExpectedCount))
            rawExpectedCount = "1";
        if (!int.TryParse(rawExpectedCount, out var expectedInstanceCount))
            throw new InvalidOperationException("MADA_RATE_LIMIT_EXPECTED_INSTANCES must be a whole number.");
        if (expectedInstanceCount < 1)
            throw new InvalidOperationException("MADA_RATE_LIMIT_EXPECTED_INSTANCES must be at least 1.");
        if (!environment.IsDevelopment() && expectedInstanceCount > 1)
            throw new InvalidOperationException("The current in-memory rate limiter supports one production instance only; do not scale horizontally until a shared limiter is configured and verified.");

        return new RateLimitTopologyOptions
        {
            Mode = mode,
            ExpectedInstanceCount = expectedInstanceCount
        };
    }
}
