using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Persistence;

public static class PersistenceRegistration
{
    public static IServiceCollection AddMadaPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var databaseMode = configuration["MADA_DATABASE_MODE"] ?? Environment.GetEnvironmentVariable("MADA_DATABASE_MODE");
        if (string.Equals(databaseMode, "memory", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<MadaDbContext>(options => options.UseInMemoryDatabase("mada-auth-test"));
            return services;
        }

        var configuredConnection = configuration.GetConnectionString("Default");
        var connectionString = !string.IsNullOrWhiteSpace(configuredConnection)
            ? configuredConnection
            : Environment.GetEnvironmentVariable("DATABASE_URL")
                ?? "Host=localhost;Port=5432;Database=mada_academy;Username=postgres;Password=postgres";

        services.AddDbContext<MadaDbContext>(options => options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure(3)));
        return services;
    }
}
