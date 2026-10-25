using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class BillingMeterApiTests
{
    [Fact]
    public async Task BillingMeter_RequiresAcademyOwnerRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var anonymousClient = factory.CreateClient();

        var anonResponse = await anonymousClient.GetAsync("/api/v1/academy/billing-meter");
        Assert.Equal(HttpStatusCode.Unauthorized, anonResponse.StatusCode);

        using var accountantClient = factory.CreateClient();
        var accountant = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        TestData.Authenticate(accountantClient, await TestData.LoginAsync(accountantClient, accountant));

        var accountantResponse = await accountantClient.GetAsync("/api/v1/academy/billing-meter");
        Assert.Equal(HttpStatusCode.Forbidden, accountantResponse.StatusCode);
    }

    [Fact]
    public async Task BillingMeter_ReturnsCorrectLimitsAndUsageForStarterPlan()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();

        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));

        var response = await client.GetAsync("/api/v1/academy/billing-meter");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");

        Assert.Equal(owner.TenantId.ToString(), data.GetProperty("tenantId").GetString());
        Assert.Equal("STARTER", data.GetProperty("planCode").GetString());
        Assert.True(data.GetProperty("canUpgrade").GetBoolean());
        Assert.Equal("GROWTH", data.GetProperty("recommendedPlan").GetString());

        var students = data.GetProperty("students");
        Assert.Equal(100, students.GetProperty("limit").GetInt32());
        Assert.False(students.GetProperty("isLimitExceeded").GetBoolean());

        var branches = data.GetProperty("branches");
        Assert.Equal(1, branches.GetProperty("limit").GetInt32());

        var staff = data.GetProperty("staff");
        Assert.Equal(5, staff.GetProperty("limit").GetInt32());
    }

    [Fact]
    public async Task PlatformAdmin_CanChangeTenantPlan_AndMeterReflectsNewLimits()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var platformClient = factory.CreateClient();
        using var ownerClient = factory.CreateClient();

        var admin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");

        TestData.Authenticate(platformClient, await TestData.LoginAsync(platformClient, admin));
        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));

        // 1. Change plan to GROWTH
        var changePlanResponse = await platformClient.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{owner.TenantId}/plan",
            new
            {
                planCode = "GROWTH",
                branchesLimit = 3,
                reason = "Upgraded to Growth package on commercial subscription renewal"
            });

        Assert.Equal(HttpStatusCode.OK, changePlanResponse.StatusCode);

        // 2. Verify Audit Event in Database
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var tenant = await db.Tenants.SingleAsync(t => t.Id == owner.TenantId);
        Assert.Equal("GROWTH", tenant.PlanCode);

        var auditEvent = await db.AuditEvents
            .FirstOrDefaultAsync(a => a.Action == "PLATFORM_TENANT_PLAN_CHANGED" && a.TargetId == owner.TenantId.ToString());
        Assert.NotNull(auditEvent);
        Assert.Contains("Upgraded to Growth package", auditEvent.Reason);

        // 3. Verify that Billing Meter now reflects GROWTH limits (500 students, 3 branches, 25 staff)
        var meterResponse = await ownerClient.GetAsync("/api/v1/academy/billing-meter");
        Assert.Equal(HttpStatusCode.OK, meterResponse.StatusCode);

        var json = await meterResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");

        Assert.Equal("GROWTH", data.GetProperty("planCode").GetString());
        Assert.Equal("باقة النمو الاحترافية (Growth)", data.GetProperty("planName").GetString());
        Assert.Equal(500, data.GetProperty("students").GetProperty("limit").GetInt32());
        Assert.Equal(3, data.GetProperty("branches").GetProperty("limit").GetInt32());
        Assert.Equal(25, data.GetProperty("staff").GetProperty("limit").GetInt32());
    }

    [Fact]
    public async Task PlatformAdmin_ChangeTenantPlan_ValidatesInput()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var platformClient = factory.CreateClient();

        var admin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(platformClient, await TestData.LoginAsync(platformClient, admin));

        // Invalid plan code
        var invalidPlan = await platformClient.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{owner.TenantId}/plan",
            new { planCode = "INVALID_PLAN", reason = "Valid reason text" });
        Assert.Equal(HttpStatusCode.BadRequest, invalidPlan.StatusCode);

        // Short reason (< 4 chars)
        var shortReason = await platformClient.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{owner.TenantId}/plan",
            new { planCode = "GROWTH", reason = "no" });
        Assert.Equal(HttpStatusCode.BadRequest, shortReason.StatusCode);
    }
}
