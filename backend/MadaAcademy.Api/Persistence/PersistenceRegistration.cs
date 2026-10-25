using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Persistence;

public static class PersistenceRegistration
{
    public static IServiceCollection AddMadaPersistence(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var databaseMode = configuration["MADA_DATABASE_MODE"] ?? Environment.GetEnvironmentVariable("MADA_DATABASE_MODE");
        if (string.Equals(databaseMode, "memory", StringComparison.OrdinalIgnoreCase))
        {
            if (environment.IsProduction())
                throw new InvalidOperationException("InMemory database mode is not allowed in Production.");
            services.AddDbContext<MadaDbContext>(options => options.UseInMemoryDatabase("mada-auth-test"));
            return services;
        }

        var configuredConnection = configuration.GetConnectionString("Default");
        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (environment.IsProduction() &&
            string.IsNullOrWhiteSpace(configuredConnection) && string.IsNullOrWhiteSpace(databaseUrl))
            throw new InvalidOperationException("A PostgreSQL connection string is required in Production.");

        var connectionString = !string.IsNullOrWhiteSpace(configuredConnection)
            ? configuredConnection
            : databaseUrl
                ?? "Host=localhost;Port=5432;Database=mada_academy;Username=postgres;Password=postgres";

        services.AddDbContext<MadaDbContext>(options => options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure(3)));
        return services;
    }
}
