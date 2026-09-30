using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class InMemoryApiTests
{
    [Fact]
    public async Task ProtectedMeEndpoint_RejectsAnonymousRequest()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/me")).StatusCode);
    }

    [Fact]
    public async Task PasswordLogin_RejectsInvalidPassword()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { phone = account.Phone, password = "wrong-password", accountType = "staff" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TenantScopeCheck_AllowsOwnTenantAndRejectsAnotherTenant()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/v1/tenants/{account.TenantId}/scope-check")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/api/v1/tenants/{Guid.NewGuid()}/scope-check")).StatusCode);
    }

    [Fact]
    public async Task StudentList_IsRestrictedToAuthenticatedBranch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var otherBranch = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranch, TenantId = account.TenantId, Name = "Other Branch", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        await TestData.SeedStudentAsync(factory, account.TenantId, account.BranchId, "Visible Student");
        await TestData.SeedStudentAsync(factory, account.TenantId, otherBranch, "Out of Scope Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        using var response = await client.GetAsync("/api/v1/students");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Visible Student", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Out of Scope Student", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ApprovalQueue_RejectsInstructorRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/v1/scheduling/approvals")).StatusCode);
    }

    [Fact]
    public async Task RefreshToken_RotationRejectsReplayOfPreviousToken()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var original = await TestData.LoginAsync(client, account);
        var rotation = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = original.RefreshToken });
        Assert.Equal(HttpStatusCode.OK, rotation.StatusCode);
        var replay = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = original.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesRefreshToken()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var tokens = await TestData.LoginAsync(client, account);
        TestData.Authenticate(client, tokens);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = tokens.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = tokens.RefreshToken })).StatusCode);
    }

    [Fact]
    public async Task AttendanceWrite_RejectsAcademyOwnerRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var response = await client.PutAsJsonAsync($"/api/v1/sessions/{Guid.NewGuid()}/attendance", new { records = new[] { new { studentId = Guid.NewGuid(), status = "PRESENT" } } });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task EvaluationWrite_RejectsAcademyOwnerRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var response = await client.PutAsJsonAsync($"/api/v1/scheduling/sessions/{Guid.NewGuid()}/evaluations", new { items = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SubstitutionRequest_CannotBeSubmittedTwiceForSamePendingSession()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        var sessionId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.AcademySessions.Add(new AcademySession
            {
                Id = sessionId, TenantId = account.TenantId, BranchId = account.BranchId, InstructorId = account.UserId,
                ClassroomId = Guid.NewGuid(), StartAt = DateTimeOffset.UtcNow.AddDays(1), EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1),
                SessionNumber = 1, Status = "SCHEDULED"
            });
            await db.SaveChangesAsync();
        }
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var first = await client.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/substitution-requests", new { reason = "Unavailable" });
        var second = await client.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/substitution-requests", new { reason = "Still unavailable" });
        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}
