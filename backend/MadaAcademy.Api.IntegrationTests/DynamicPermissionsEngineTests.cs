using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Modules.Identity;
using MadaAcademy.Api.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class DynamicPermissionsEngineTests
{
    [Fact]
    public async Task GetRoles_ReturnsRolesWithPermissionDetailsAndDefaults()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));

        var response = await client.GetAsync("/api/v1/academy/roles");
        response.EnsureSuccessStatusCode();

        using var doc = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Empty response");
        var data = doc.RootElement.GetProperty("data");

        Assert.True(data.TryGetProperty("roles", out var rolesElement));
        Assert.True(data.TryGetProperty("permissions", out var permissionsElement));
        Assert.True(data.TryGetProperty("permissionDetails", out var detailsElement));

        var rolesList = rolesElement.EnumerateArray().ToList();
        Assert.Contains(rolesList, r => r.GetProperty("code").GetString() == "R02_BRANCH_MANAGER");
        Assert.Contains(rolesList, r => r.GetProperty("code").GetString() == "R04_INSTRUCTOR");

        var detailsList = detailsElement.EnumerateArray().ToList();
        Assert.Contains(detailsList, d => d.GetProperty("code").GetString() == "students.read" && d.GetProperty("category").GetString() == "الطلاب والتسجيل");
    }

    [Fact]
    public async Task UpdateRolePermissions_AppliesToTenant_AndReflectsInMeEndpoint()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var ownerClient = factory.CreateClient();
        using var staffClient = factory.CreateClient();

        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", owner.TenantId, owner.BranchId);

        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, instructor));

        // Baseline: check instructor initial permissions in /me
        var initialMe = await staffClient.GetFromJsonAsync<JsonDocument>("/api/v1/me");
        var initialPerms = initialMe!.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(x => x.GetString()).ToArray();
        Assert.Equal(RoleCatalog.PermissionsFor("R04_INSTRUCTOR"), initialPerms);

        // Customize instructor permissions for the academy: grant students.read, attendance.read, finance.read
        var customPermissions = new[] { "students.read", "attendance.read", "finance.read" };
        var updateResponse = await ownerClient.PutAsJsonAsync("/api/v1/academy/roles/R04_INSTRUCTOR/permissions", new { permissions = customPermissions });
        updateResponse.EnsureSuccessStatusCode();
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, instructor));

        // Check instructor /me reflects newly granted dynamic permissions
        var updatedMe = await staffClient.GetFromJsonAsync<JsonDocument>("/api/v1/me");
        var updatedPerms = updatedMe!.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(x => x.GetString()).OrderBy(x => x).ToArray();
        Assert.Equal(customPermissions.OrderBy(x => x).ToArray(), updatedPerms);

        // Reset role permissions
        var resetResponse = await ownerClient.DeleteAsync("/api/v1/academy/roles/R04_INSTRUCTOR/permissions");
        resetResponse.EnsureSuccessStatusCode();
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, instructor));

        // Instructor /me should now reflect baseline canonical defaults
        var resetMe = await staffClient.GetFromJsonAsync<JsonDocument>("/api/v1/me");
        var resetPerms = resetMe!.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(x => x.GetString()).ToArray();
        Assert.Equal(RoleCatalog.PermissionsFor("R04_INSTRUCTOR"), resetPerms);
    }

    [Fact]
    public async Task UpdateMemberPermissions_OverridesRole_AndResetRestoresRoleDefaults()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var ownerClient = factory.CreateClient();
        using var staffClient = factory.CreateClient();

        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", owner.TenantId, owner.BranchId);

        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, instructor));

        // Get members list to retrieve membershipId
        var membersResponse = await ownerClient.GetFromJsonAsync<JsonDocument>("/api/v1/academy/members");
        var memberItem = membersResponse!.RootElement.GetProperty("data").GetProperty("items").EnumerateArray()
            .First(m => m.GetProperty("userId").GetString() == instructor.UserId.ToString());
        var membershipId = memberItem.GetProperty("membershipId").GetString();

        // Override this member specifically with a single custom permission
        var memberCustom = new[] { "marketing.read" };
        var memberUpdateRes = await ownerClient.PutAsJsonAsync($"/api/v1/academy/members/{membershipId}/permissions", new { permissions = memberCustom });
        memberUpdateRes.EnsureSuccessStatusCode();
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, instructor));

        // Check member /me
        var memberMe = await staffClient.GetFromJsonAsync<JsonDocument>("/api/v1/me");
        var memberPerms = memberMe!.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(x => x.GetString()).ToArray();
        Assert.Equal(memberCustom, memberPerms);

        // Reset member permissions
        var memberResetRes = await ownerClient.DeleteAsync($"/api/v1/academy/members/{membershipId}/permissions");
        memberResetRes.EnsureSuccessStatusCode();
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, instructor));

        // Check member /me is back to role default
        var afterResetMe = await staffClient.GetFromJsonAsync<JsonDocument>("/api/v1/me");
        var afterResetPerms = afterResetMe!.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(x => x.GetString()).ToArray();
        Assert.Equal(RoleCatalog.PermissionsFor("R04_INSTRUCTOR"), afterResetPerms);
    }

    [Fact]
    public async Task SuspendedMember_IsImmediatelyBlockedFromMeEndpoint()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var ownerClient = factory.CreateClient();
        using var staffClient = factory.CreateClient();

        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", owner.TenantId, owner.BranchId);

        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, instructor));

        // Initially active
        var activeRes = await staffClient.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.OK, activeRes.StatusCode);

        // Owner suspends the member
        var membersResponse = await ownerClient.GetFromJsonAsync<JsonDocument>("/api/v1/academy/members");
        var memberItem = membersResponse!.RootElement.GetProperty("data").GetProperty("items").EnumerateArray()
            .First(m => m.GetProperty("userId").GetString() == instructor.UserId.ToString());
        var membershipId = memberItem.GetProperty("membershipId").GetString();

        var suspendRes = await ownerClient.PatchAsJsonAsync($"/api/v1/academy/members/{membershipId}/status", new { status = "SUSPENDED" });
        suspendRes.EnsureSuccessStatusCode();

        // Staff /me should now be blocked immediately at the auth gate with 401 Unauthorized
        var blockedRes = await staffClient.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.Unauthorized, blockedRes.StatusCode);

        // Owner reactivates the member
        var reactivateRes = await ownerClient.PatchAsJsonAsync($"/api/v1/academy/members/{membershipId}/status", new { status = "ACTIVE" });
        reactivateRes.EnsureSuccessStatusCode();

        // After reactivation, staff can log in again and access /me successfully
        var reauthenticatedTokens = await TestData.LoginAsync(staffClient, instructor);
        TestData.Authenticate(staffClient, reauthenticatedTokens);
        var resumedRes = await staffClient.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.OK, resumedRes.StatusCode);
    }
}
