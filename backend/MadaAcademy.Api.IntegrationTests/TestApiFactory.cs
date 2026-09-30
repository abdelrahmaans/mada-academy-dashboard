using System.Net.Http.Headers;
using System.Net.Http.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class TestApiFactory(bool useInMemory) : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"mada-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        if (!useInMemory) return;

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<MadaDbContext>();
            services.RemoveAll<DbContextOptions<MadaDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<MadaDbContext>>();
            services.AddDbContext<MadaDbContext>(options => options.UseInMemoryDatabase(_databaseName));
        });
    }
}

public sealed record TestAccount(Guid TenantId, Guid BranchId, Guid UserId, string RoleCode, string Phone, string Password);
public sealed record TokenPair(string AccessToken, string RefreshToken, string TokenType, int ExpiresIn);
public sealed record TokenEnvelope(TokenPair Data);

public static class TestData
{
    public static async Task<TestAccount> CreateAccountAsync(TestApiFactory factory, string roleCode, Guid? tenantId = null, Guid? branchId = null)
    {
        var account = new TestAccount(tenantId ?? Guid.NewGuid(), branchId ?? Guid.NewGuid(), Guid.NewGuid(), roleCode,
            $"+201{Random.Shared.Next(0, 1_000_000_000):D9}", "Correct!Horse2026");
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<MadaAcademy.Api.Auth.PasswordHashService>();
        db.Tenants.Add(new Tenant { Id = account.TenantId, Name = "Test Academy", Slug = $"academy-{account.TenantId:N}" });
        db.Branches.Add(new Branch { Id = account.BranchId, TenantId = account.TenantId, Name = "Test Branch", Code = "MAIN" });
        db.UserAccounts.Add(new UserAccount
        {
            Id = account.UserId,
            Email = $"{account.UserId:N}@example.test",
            Phone = account.Phone,
            DisplayName = "Test User",
            AccountType = "staff",
            PasswordHash = passwordHasher.Hash(account.Password),
            Status = "ACTIVE"
        });
        db.Memberships.Add(new Membership
        {
            UserAccountId = account.UserId,
            TenantId = account.TenantId,
            BranchId = account.BranchId,
            RoleCode = account.RoleCode,
            ScopeLevel = "BRANCH",
            Status = "ACTIVE"
        });
        await db.SaveChangesAsync();
        return account;
    }

    public static async Task<TestAccount> CreateConsumerAccountAsync(TestApiFactory factory, Guid tenantId, string accountType, string roleCode)
    {
        var account = new TestAccount(tenantId, Guid.Empty, Guid.NewGuid(), roleCode,
            $"+202{Random.Shared.Next(0, 1_000_000_000):D9}", "Correct!Horse2026");
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<MadaAcademy.Api.Auth.PasswordHashService>();
        db.UserAccounts.Add(new UserAccount
        {
            Id = account.UserId,
            Email = $"{account.UserId:N}@consumer.example.test",
            Phone = account.Phone,
            DisplayName = "Consumer Test User",
            AccountType = accountType,
            PasswordHash = passwordHasher.Hash(account.Password),
            Status = "ACTIVE"
        });
        await db.SaveChangesAsync();
        return account;
    }

    public static async Task<TokenPair> LoginAsync(HttpClient client, TestAccount account)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            phone = account.Phone,
            password = account.Password,
            accountType = account.RoleCode == "R08_PARENT" ? "parent" : account.RoleCode == "R09_STUDENT" ? "student" : "staff"
        });
        response.EnsureSuccessStatusCode();
        var envelope = await response.Content.ReadFromJsonAsync<TokenEnvelope>();
        return envelope?.Data ?? throw new InvalidOperationException("Login response did not contain token data.");
    }

    public static void Authenticate(HttpClient client, TokenPair tokens)
        => client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokens.AccessToken);

    public static async Task<Guid> SeedStudentAsync(TestApiFactory factory, Guid tenantId, Guid branchId, string name)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var student = new Student { TenantId = tenantId, BranchId = branchId, FullName = name };
        db.Students.Add(student);
        await db.SaveChangesAsync();
        return student.Id;
    }
}
