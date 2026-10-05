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
                $"/api/v1/platform/academies/{accountant.TenantId}/users/{accountant.UserId}/sessions/revoke",
                JsonContent.Create(new { reason = "Unauthorized attempt" }))).StatusCode);

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
        using var ownerClient = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var academyOwner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));
        var ownerTokens = await TestData.LoginAsync(ownerClient, academyOwner);
        TestData.Authenticate(ownerClient, ownerTokens);

        var academiesResponse = await client.GetAsync("/api/v1/platform/academies");
        Assert.Equal(HttpStatusCode.OK, academiesResponse.StatusCode);
        var academiesJson = await academiesResponse.Content.ReadAsStringAsync();
        Assert.Contains(academyOwner.TenantId.ToString(), academiesJson, StringComparison.OrdinalIgnoreCase);

        var changeResponse = await client.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{academyOwner.TenantId}/status",
            new { status = "PAUSED", reason = "Support review" });
        Assert.Equal(HttpStatusCode.OK, changeResponse.StatusCode);
        Assert.Contains("PAUSED", await changeResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Unauthorized, (await ownerClient.GetAsync("/api/v1/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await ownerClient.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = ownerTokens.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/login", new { phone = academyOwner.Phone, password = academyOwner.Password, accountType = "staff" })).StatusCode);

        var invalidResponse = await client.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{academyOwner.TenantId}/status",
            new { status = "DELETED", reason = "Invalid transition" });
        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var tenant = await db.Tenants.SingleAsync(item => item.Id == academyOwner.TenantId);
        Assert.Equal("PAUSED", tenant.Status);
        Assert.All(await db.RefreshSessions.Where(item => item.UserAccountId == academyOwner.UserId).ToListAsync(), session => Assert.NotNull(session.RevokedAt));

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
        using var targetClient = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var targetUser = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));
        TestData.Authenticate(targetClient, await TestData.LoginAsync(targetClient, targetUser));

        Guid targetSessionId;
        using (var seedScope = factory.Services.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<MadaDbContext>();
            targetSessionId = await db.RefreshSessions.Where(item => item.UserAccountId == targetUser.UserId && item.RevokedAt == null).Select(item => item.Id).SingleAsync();
        }

        var response = await client.PostAsync(
            $"/api/v1/platform/academies/{targetUser.TenantId}/users/{targetUser.UserId}/sessions/revoke",
            JsonContent.Create(new { reason = "Security review" }));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var responseJson = await response.Content.ReadAsStringAsync();
        using var responseDocument = JsonDocument.Parse(responseJson);
        Assert.Equal(1, responseDocument.RootElement.GetProperty("data").GetProperty("revokedCount").GetInt32());
        Assert.Equal(HttpStatusCode.Unauthorized, (await targetClient.GetAsync("/api/v1/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/me")).StatusCode);

        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var targetSession = await verifyDb.RefreshSessions.SingleAsync(item => item.Id == targetSessionId);
        Assert.NotNull(targetSession.RevokedAt);
        Assert.True(await verifyDb.RefreshSessions.AnyAsync(item =>
            item.UserAccountId == platformAdmin.UserId && item.RevokedAt == null));

        var auditEvent = await verifyDb.AuditEvents.SingleAsync(item =>
            item.Action == "PLATFORM_USER_SESSIONS_REVOKED" && item.TargetId == targetUser.UserId.ToString());
        Assert.Equal(platformAdmin.UserId, auditEvent.ActorUserId);
        Assert.Equal(targetUser.TenantId, auditEvent.TenantId);
        Assert.Equal("Security review", auditEvent.Reason);
        Assert.Contains("1", auditEvent.MetadataJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task PlatformAdmin_CanSearchAndDisableMemberWithinTenant_WithAuditAndImmediateAccessRevocation()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var platformClient = factory.CreateClient();
        using var memberClient = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var unrelatedOwner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(platformClient, await TestData.LoginAsync(platformClient, platformAdmin));
        TestData.Authenticate(memberClient, await TestData.LoginAsync(memberClient, owner));

        Guid membershipId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            membershipId = await db.Memberships.Where(item => item.TenantId == owner.TenantId && item.UserAccountId == owner.UserId).Select(item => item.Id).SingleAsync();
        }

        using var searchResponse = await platformClient.GetAsync($"/api/v1/platform/academies/{owner.TenantId}/members?search={Uri.EscapeDataString(owner.Phone)}");
        Assert.Equal(HttpStatusCode.OK, searchResponse.StatusCode);
        using var membersDocument = await searchResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Member search response is empty.");
        var member = membersDocument.RootElement.GetProperty("data").GetProperty("items")[0];
        Assert.Equal(owner.UserId, member.GetProperty("userId").GetGuid());
        Assert.True(member.GetProperty("activeSessions").GetInt32() >= 1);
        Assert.True(member.GetProperty("lastLoginAt").ValueKind == JsonValueKind.String);
        Assert.DoesNotContain(owner.Phone, member.GetProperty("maskedPhone").GetString(), StringComparison.Ordinal);

        using var crossTenantResponse = await platformClient.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{unrelatedOwner.TenantId}/members/{membershipId}/status",
            new { status = "REVOKED", reason = "Security review" });
        Assert.Equal(HttpStatusCode.NotFound, crossTenantResponse.StatusCode);

        using var disableResponse = await platformClient.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{owner.TenantId}/members/{membershipId}/status",
            new { status = "REVOKED", reason = "Security review" });
        Assert.Equal(HttpStatusCode.OK, disableResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await memberClient.GetAsync("/api/v1/me")).StatusCode);

        using var activityResponse = await platformClient.GetAsync($"/api/v1/platform/academies/{owner.TenantId}/activity");
        Assert.Equal(HttpStatusCode.OK, activityResponse.StatusCode);
        using var activityDocument = await activityResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Tenant activity response is empty.");
        var activity = activityDocument.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().First(item => item.GetProperty("action").GetString() == "PLATFORM_MEMBER_STATUS_CHANGED");
        Assert.Equal(owner.TenantId, activity.GetProperty("tenantId").GetGuid());
        Assert.Equal("Security review", activity.GetProperty("reason").GetString());
        Assert.Equal(platformAdmin.UserId, activity.GetProperty("actorUserId").GetGuid());
    }

    [Fact]
    public async Task PlatformRoles_AreListedWithoutSelfAssignmentOrTenantPrivilegeEscalation()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));

        using var rolesResponse = await client.GetAsync("/api/v1/platform/roles");
        Assert.Equal(HttpStatusCode.OK, rolesResponse.StatusCode);
        using var rolesDocument = await rolesResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Platform role response is empty.");
        var role = rolesDocument.RootElement.GetProperty("data").GetProperty("items")[0];
        Assert.Equal("R00_PLATFORM_ADMIN", role.GetProperty("code").GetString());
        Assert.False(role.GetProperty("canSelfAssign").GetBoolean());
        Assert.Equal("CONTROLLED_OUT_OF_BAND", role.GetProperty("assignmentMode").GetString());
        var permissions = role.GetProperty("permissions").EnumerateArray().Select(item => item.GetString()).ToArray();
        Assert.DoesNotContain("academy.archive", permissions);
    }

    [Fact]
    public async Task PlatformOverviewAndActivityExposeOnlyPlatformMetadata()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));

        using var overviewResponse = await client.GetAsync("/api/v1/platform/overview");
        Assert.Equal(HttpStatusCode.OK, overviewResponse.StatusCode);
        using var overview = await overviewResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Platform overview response is empty.");
        var overviewData = overview.RootElement.GetProperty("data");
        foreach (var property in new[] { "academies", "activeAcademies", "trialAcademies", "attentionAcademies", "staffAccounts", "activeSessions", "auditEvents" })
            Assert.True(overviewData.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.Number, $"Missing numeric overview property: {property}");
        Assert.False(overviewData.TryGetProperty("students", out _));
        Assert.False(overviewData.TryGetProperty("invoices", out _));

        using var activityResponse = await client.GetAsync("/api/v1/platform/activity");
        Assert.Equal(HttpStatusCode.OK, activityResponse.StatusCode);
        using var activity = await activityResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Platform activity response is empty.");
        var activityData = activity.RootElement.GetProperty("data");
        Assert.True(activityData.GetProperty("items").ValueKind == JsonValueKind.Array);
        Assert.True(activityData.GetProperty("total").ValueKind == JsonValueKind.Number);
        Assert.DoesNotContain("invoice", activity.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("amount", activity.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("student", activity.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PlatformAdmin_CanBootstrapAcademyAndBootstrapIsAudited()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));

        using var response = await client.PostAsJsonAsync("/api/v1/platform/academies", new
        {
            name = "أكاديمية الاختبار",
            slug = "bootstrap-test-academy",
            planCode = "GROWTH",
            primaryBranch = new { name = "الفرع الرئيسي", code = "MAIN" },
            owner = new { fullName = "مالك الاختبار", phone = "01099999999", email = "bootstrap-owner@test.local", password = "OwnerPassword2026!" }
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var document = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Bootstrap response is empty.");
        var academyId = document.RootElement.GetProperty("data").GetProperty("academy").GetProperty("id").GetGuid();
        var ownerId = document.RootElement.GetProperty("data").GetProperty("owner").GetProperty("id").GetGuid();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.True(await db.Branches.AnyAsync(item => item.TenantId == academyId && item.Code == "MAIN"));
        Assert.True(await db.Memberships.AnyAsync(item => item.TenantId == academyId && item.UserAccountId == ownerId && item.RoleCode == "R01_ACADEMY_OWNER"));
        var audit = await db.AuditEvents.SingleAsync(item => item.Action == "ACADEMY_BOOTSTRAPPED" && item.TenantId == academyId);
        Assert.Equal(platformAdmin.UserId, audit.ActorUserId);
    }

    [Fact]
    public async Task PlatformAdmin_CanReactivatePausedAcademyAndBothTransitionsAreAudited()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, platformAdmin));

        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{owner.TenantId}/status",
            new { status = "PAUSED", reason = "Pause for review" })).StatusCode);
        var response = await client.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{owner.TenantId}/status",
            new { status = "ACTIVE", reason = "Review completed" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal("ACTIVE", (await db.Tenants.SingleAsync(item => item.Id == owner.TenantId)).Status);
        var transitions = await db.AuditEvents.Where(item => item.TenantId == owner.TenantId && item.Action == "PLATFORM_TENANT_STATUS_CHANGED").ToListAsync();
        Assert.Equal(2, transitions.Count);
        Assert.Contains(transitions, item => item.Reason == "Review completed" && item.MetadataJson?.Contains("ACTIVE", StringComparison.Ordinal) == true);
    }

    [Fact]
    public async Task PlatformAdmin_CannotMutateR00Membership_AndOwnerCannotAssignR00()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var platformClient = factory.CreateClient();
        using var ownerClient = factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(platformClient, await TestData.LoginAsync(platformClient, platformAdmin));
        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));

        Guid platformMembershipId;
        using (var seedScope = factory.Services.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<MadaDbContext>();
            platformMembershipId = await db.Memberships.Where(item => item.UserAccountId == platformAdmin.UserId && item.RoleCode == "R00_PLATFORM_ADMIN").Select(item => item.Id).SingleAsync();
        }

        var protectedResponse = await platformClient.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{platformAdmin.TenantId}/members/{platformMembershipId}/status",
            new { status = "REVOKED", reason = "Attempted support change" });
        Assert.Equal(HttpStatusCode.Conflict, protectedResponse.StatusCode);

        var assignResponse = await ownerClient.PostAsJsonAsync("/api/v1/academy/members", new
        {
            fullName = "محاولة تعيين",
            email = "r00-attempt@test.local",
            phone = "01088888888",
            password = "MemberPassword2026!",
            roleCode = "R00_PLATFORM_ADMIN"
        });
        Assert.Equal(HttpStatusCode.BadRequest, assignResponse.StatusCode);

        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Empty(await verifyDb.AuditEvents.Where(item => item.Action == "PLATFORM_MEMBER_STATUS_CHANGED" && item.TargetId == platformMembershipId.ToString()).ToListAsync());
    }
}
