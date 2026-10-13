using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class RolePermissionsApiTests
{
    [Fact]
    public async Task MeReturnsDistinctR03ReadReviewAndR04AssignedWritePermissions()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var headInstructor = await TestData.CreateAccountAsync(factory, "R03_HEAD_INSTRUCTORS");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", headInstructor.TenantId, headInstructor.BranchId);

        using var r03Client = factory.CreateClient();
        TestData.Authenticate(r03Client, await TestData.LoginAsync(r03Client, headInstructor));
        using var r03Response = await r03Client.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.OK, r03Response.StatusCode);
        using var r03Json = await r03Response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("R03 identity response is empty.");
        var r03Permissions = r03Json.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(item => item.GetString()).ToHashSet(StringComparer.Ordinal);
        Assert.Contains("sessions.read", r03Permissions);
        Assert.Contains("attendance.read", r03Permissions);
        Assert.Contains("evaluations.review", r03Permissions);
        Assert.DoesNotContain("attendance.write", r03Permissions);
        Assert.DoesNotContain("evaluations.write", r03Permissions);

        using var r04Client = factory.CreateClient();
        TestData.Authenticate(r04Client, await TestData.LoginAsync(r04Client, instructor));
        using var r04Response = await r04Client.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.OK, r04Response.StatusCode);
        using var r04Json = await r04Response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("R04 identity response is empty.");
        var r04Permissions = r04Json.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(item => item.GetString()).ToHashSet(StringComparer.Ordinal);
        Assert.Contains("sessions.assigned.read", r04Permissions);
        Assert.Contains("attendance.read", r04Permissions);
        Assert.Contains("attendance.write", r04Permissions);
        Assert.Contains("evaluations.write", r04Permissions);
        Assert.DoesNotContain("evaluations.review", r04Permissions);
        Assert.DoesNotContain("sessions.read", r04Permissions);
    }

    [Theory]
    [InlineData("R01_ACADEMY_OWNER")]
    [InlineData("R07_MEDIA_MANAGER")]
    public async Task SessionReadEndpointsDenyStaffRolesWithoutSessionReadPermission(string roleCode)
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var account = await TestData.CreateAccountAsync(factory, roleCode);
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/v1/sessions")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/api/v1/sessions/{Guid.NewGuid()}")).StatusCode);
    }
}
