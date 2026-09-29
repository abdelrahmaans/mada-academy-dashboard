using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Persistence;

public static class PersistenceRegistration
{
    public static IServiceCollection AddMadaPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=mada_academy;Username=postgres;Password=postgres";

        services.AddDbContext<MadaDbContext>(options => options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure(3)));
        return services;
    }
}
