using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MadaAcademy.Api.Persistence;

public sealed class MadaDbContextFactory : IDesignTimeDbContextFactory<MadaDbContext>
{
    public MadaDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<MadaDbContext>()
            .UseNpgsql(Environment.GetEnvironmentVariable("DATABASE_URL") ?? "Host=localhost;Port=5432;Database=mada_academy;Username=postgres;Password=postgres")
            .Options;
        return new MadaDbContext(options);
    }
}
