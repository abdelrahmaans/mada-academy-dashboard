using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class PlatformAdminApiTests
{
    [Fact]
    public async Task PlatformEndpoints_RequirePlatformAdminRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var anonymousClient = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonymousClient.GetAsync("/api/v1/platform/overview")).StatusCode);

        using var academyClient = factory.CreateClient();
        var academyOwner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var accountant = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        TestData.Authenticate(academyClient, await TestData.LoginAsync(academyClient, academyOwner));

        Assert.Equal(HttpStatusCode.Forbidden,
            (await academyClient.GetAsync("/api/v1/platform/overview")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await academyClient.GetAsync("/api/v1/platform/academies")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await academyClient.PatchAsJsonAsync(
                $"/api/v1/platform/academies/{academyOwner.TenantId}/status",
                new { status = "PAUSED", reason = "Unauthorized attempt" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await academyClient.PostAsync(
                $"/api/v1/platform/users/{accountant.UserId}/sessions/revoke",
                content: null)).StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal("ACTIVE", (await db.Tenants.SingleAsync(item => item.Id == academyOwner.TenantId)).Status);
        Assert.Empty(await db.AuditEvents.Where(item => item.Action.StartsWith("PLATFORM_")).ToListAsync());
    }

    [Fact]
    public async Task PlatformAdmin_CanChangeAcademyStatusAndChangeIsAudited()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var academyOwner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));

        var academiesResponse = await client.GetAsync("/api/v1/platform/academies");
        Assert.Equal(HttpStatusCode.OK, academiesResponse.StatusCode);
        var academiesJson = await academiesResponse.Content.ReadAsStringAsync();
        Assert.Contains(academyOwner.TenantId.ToString(), academiesJson, StringComparison.OrdinalIgnoreCase);

        var changeResponse = await client.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{academyOwner.TenantId}/status",
            new { status = "PAUSED", reason = "Support review" });
        Assert.Equal(HttpStatusCode.OK, changeResponse.StatusCode);
        Assert.Contains("PAUSED", await changeResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        var invalidResponse = await client.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{academyOwner.TenantId}/status",
            new { status = "DELETED", reason = "Invalid transition" });
        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var tenant = await db.Tenants.SingleAsync(item => item.Id == academyOwner.TenantId);
        Assert.Equal("PAUSED", tenant.Status);

        var auditEvent = await db.AuditEvents.SingleAsync(item =>
            item.Action == "PLATFORM_TENANT_STATUS_CHANGED" && item.TargetId == academyOwner.TenantId.ToString());
        Assert.Equal(platformAdmin.UserId, auditEvent.ActorUserId);
        Assert.Equal(academyOwner.TenantId, auditEvent.TenantId);
        Assert.Equal("Support review", auditEvent.Reason);
        Assert.Contains("ACTIVE", auditEvent.MetadataJson, StringComparison.Ordinal);
        Assert.Contains("PAUSED", auditEvent.MetadataJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task PlatformAdmin_CanRevokeAnotherUsersSessionsWithoutRevokingOwnSession()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var targetUser = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));

        var targetSessionId = Guid.NewGuid();
        using (var seedScope = factory.Services.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.RefreshSessions.Add(new RefreshSession
            {
                Id = targetSessionId,
                UserAccountId = targetUser.UserId,
                TokenHash = $"test-{Guid.NewGuid():N}",
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(1)
            });
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsync(
            $"/api/v1/platform/users/{targetUser.UserId}/sessions/revoke",
            content: null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var responseJson = await response.Content.ReadAsStringAsync();
        using var responseDocument = JsonDocument.Parse(responseJson);
        Assert.Equal(1, responseDocument.RootElement.GetProperty("data").GetProperty("revokedCount").GetInt32());

        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var targetSession = await verifyDb.RefreshSessions.SingleAsync(item => item.Id == targetSessionId);
        Assert.NotNull(targetSession.RevokedAt);
        Assert.True(await verifyDb.RefreshSessions.AnyAsync(item =>
            item.UserAccountId == platformAdmin.UserId && item.RevokedAt == null));

        var auditEvent = await verifyDb.AuditEvents.SingleAsync(item =>
            item.Action == "PLATFORM_USER_SESSIONS_REVOKED" && item.TargetId == targetUser.UserId.ToString());
        Assert.Equal(platformAdmin.UserId, auditEvent.ActorUserId);
        Assert.Contains("1", auditEvent.MetadataJson, StringComparison.Ordinal);
    }
}
