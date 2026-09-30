using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace MadaAcademy.Api.IntegrationTests;

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class PostgreSqlCollection : ICollectionFixture<PostgreSqlFixture>
{
    public const string Name = "PostgreSQL API integration";
}

public sealed class PostgreSqlFixture : IAsyncLifetime
{
    private const string Schema = "mada_integration_tests";
    private TestApiFactory? _factory;
    public TestApiFactory Factory => _factory ?? throw new InvalidOperationException("PostgreSQL fixture is not initialized.");

    public async Task InitializeAsync()
    {
        var original = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrWhiteSpace(original)) throw new InvalidOperationException("DATABASE_URL must point to the disposable CI PostgreSQL database.");
        var adminBuilder = new NpgsqlConnectionStringBuilder(original) { SearchPath = "public" };
        await using (var connection = new NpgsqlConnection(adminBuilder.ConnectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "DROP SCHEMA IF EXISTS mada_integration_tests CASCADE; CREATE SCHEMA mada_integration_tests;";
            await command.ExecuteNonQueryAsync();
        }

        var appBuilder = new NpgsqlConnectionStringBuilder(original) { SearchPath = Schema };
        Environment.SetEnvironmentVariable("DATABASE_URL", appBuilder.ConnectionString);
        Environment.SetEnvironmentVariable("MADA_DATABASE_MODE", null);
        _factory = new TestApiFactory(useInMemory: false);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (_factory is not null) await _factory.DisposeAsync();
    }
}

[Collection(PostgreSqlCollection.Name)]
public sealed class PostgreSqlApiTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task MigrationHistory_IsAppliedInsideDedicatedSchema()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", db.Database.ProviderName);
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        await db.Database.OpenConnectionAsync();
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = "SELECT current_schema()";
            Assert.Equal("mada_integration_tests", await command.ExecuteScalarAsync());
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsHealthyFromPostgreSqlHost()
    {
        using var client = fixture.Factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/health")).StatusCode);
    }

    [Fact]
    public async Task MeEndpoint_RejectsAnonymousPostgreSqlRequest()
    {
        using var client = fixture.Factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/me")).StatusCode);
    }

    [Fact]
    public async Task PasswordLoginAndMe_ReadPersistedMembership()
    {
        using var client = fixture.Factory.CreateClient();
        var account = await TestData.CreateAccountAsync(fixture.Factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        using var response = await client.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains(account.TenantId.ToString(), json, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("R01_ACADEMY_OWNER", json, StringComparison.Ordinal);
    }

    [Fact]
    public async Task TenantIsolation_DeniesCrossTenantPostgreSqlRequest()
    {
        using var client = fixture.Factory.CreateClient();
        var account = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/api/v1/tenants/{Guid.NewGuid()}/scope-check")).StatusCode);
    }

    [Fact]
    public async Task BranchIsolation_ReturnsOnlyStudentsFromMembershipBranch()
    {
        using var client = fixture.Factory.CreateClient();
        var account = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        var otherBranch = Guid.NewGuid();
        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new MadaAcademy.Api.Persistence.Entities.Branch { Id = otherBranch, TenantId = account.TenantId, Name = "Second Branch", Code = $"B{Guid.NewGuid():N}"[..10] });
            await db.SaveChangesAsync();
        }
        await TestData.SeedStudentAsync(fixture.Factory, account.TenantId, account.BranchId, $"Visible-{Guid.NewGuid():N}");
        var hiddenName = $"Hidden-{Guid.NewGuid():N}";
        await TestData.SeedStudentAsync(fixture.Factory, account.TenantId, otherBranch, hiddenName);
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var json = await client.GetStringAsync("/api/v1/students");
        Assert.DoesNotContain(hiddenName, json, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ConsumerAccountLookup_ExecutesScopedExactPhoneQueryOnPostgreSql()
    {
        using var client = fixture.Factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        var parent = await TestData.CreateConsumerAccountAsync(fixture.Factory, staff.TenantId, "parent", "R08_PARENT");
        var studentId = await TestData.SeedStudentAsync(fixture.Factory, staff.TenantId, staff.BranchId, "PostgreSQL Phone Lookup Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));

        var response = await client.GetAsync($"/api/v1/students/{studentId}/consumer-accounts?accountType=parent&phone={Uri.EscapeDataString(parent.Phone)}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(parent.UserId.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains($"•••• {parent.Phone[^4..]}", body, StringComparison.Ordinal);
        Assert.DoesNotContain(parent.Phone, body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ConsumerInvitation_CreatesAndAcceptsParentAccountOnPostgreSql()
    {
        using var client = fixture.Factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        var studentId = await TestData.SeedStudentAsync(fixture.Factory, staff.TenantId, staff.BranchId, "PostgreSQL Invitation Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));

        using var createResponse = await client.PostAsJsonAsync($"/api/v1/students/{studentId}/consumer-invitations", new
        {
            phone = "+201333333333",
            accountType = "parent",
            relationship = "الأب"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        using var createJson = await createResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Invitation response is empty.");
        var data = createJson.RootElement.GetProperty("data");
        var code = data.GetProperty("developmentCode").GetString() ?? throw new InvalidOperationException("Development OTP was not returned by the test sender.");
        var acceptUrl = data.GetProperty("debugAcceptUrl").GetString() ?? throw new InvalidOperationException("Development invitation URL is missing.");
        var fragment = new Uri(acceptUrl).Fragment;
        Assert.StartsWith("#token=", fragment, StringComparison.Ordinal);
        var token = Uri.UnescapeDataString(fragment["#token=".Length..]);

        using var previewResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/preview", new { token });
        Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);
        using var acceptResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/accept", new
        {
            token,
            code,
            fullName = "والد طالب الاختبار",
            password = "ParentPassword2026!"
        });
        Assert.Equal(HttpStatusCode.OK, acceptResponse.StatusCode);

        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var account = await db.UserAccounts.SingleAsync(item => item.Phone == "+201333333333" && item.AccountType == "parent");
        Assert.Null(account.Email);
        Assert.True(await db.Memberships.AnyAsync(item => item.UserAccountId == account.Id && item.TenantId == staff.TenantId && item.RoleCode == "R08_PARENT"));
        Assert.True(await db.GuardianStudentLinks.AnyAsync(item => item.UserAccountId == account.Id && item.StudentId == studentId));
        Assert.Equal("ACCEPTED", (await db.ConsumerInvitations.SingleAsync()).Status);
    }
}
