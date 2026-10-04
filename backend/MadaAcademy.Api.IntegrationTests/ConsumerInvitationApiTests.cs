using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class ConsumerInvitationApiTests
{
    [Fact]
    public async Task ParentInvitation_UsesDevelopmentOtpAndCreatesPhoneOnlyAccountAfterAcceptance()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var studentId = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Student One");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));

        using var createResponse = await client.PostAsJsonAsync($"/api/v1/students/{studentId}/consumer-invitations", new
        {
            phone = "٠١٠١٢٣٤٥٦٧٨",
            accountType = "parent",
            relationship = "الأم"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<CreatedInvitationEnvelope>();
        Assert.NotNull(created?.Data.DevelopmentCode);
        Assert.NotNull(created?.Data.DebugAcceptUrl);
        var code = created!.Data.DevelopmentCode!;
        var token = ReadToken(created.Data.DebugAcceptUrl!);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var invitation = await db.ConsumerInvitations.SingleAsync();
            Assert.Equal("+201012345678", invitation.Phone);
            Assert.Equal("PENDING", invitation.Status);
            Assert.NotEqual(code, invitation.OtpHash);
            Assert.Equal(staff.TenantId, invitation.TenantId);
            Assert.Equal(staff.BranchId, invitation.BranchId);
        }

        using var previewResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/preview", new { token });
        Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);
        var previewBody = await previewResponse.Content.ReadAsStringAsync();
        Assert.Contains("•••• 5678", previewBody, StringComparison.Ordinal);
        Assert.DoesNotContain(studentId.ToString(), previewBody, StringComparison.Ordinal);

        var wrongCode = code == "000000" ? "000001" : "000000";
        using var wrongResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/accept", new
        {
            token,
            code = wrongCode,
            fullName = "والدة الطالب",
            password = "ParentPassword2026!"
        });
        Assert.Equal(HttpStatusCode.BadRequest, wrongResponse.StatusCode);

        using var acceptResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/accept", new
        {
            token,
            code,
            fullName = "والدة الطالب",
            password = "ParentPassword2026!"
        });
        Assert.Equal(HttpStatusCode.OK, acceptResponse.StatusCode);
        var tokens = await acceptResponse.Content.ReadFromJsonAsync<TokenEnvelope>();
        Assert.NotNull(tokens?.Data.AccessToken);
        TestData.Authenticate(client, tokens!.Data);
        using var studentsResponse = await client.GetAsync("/api/v1/consumer/me/students");
        Assert.Equal(HttpStatusCode.OK, studentsResponse.StatusCode);
        Assert.Contains("Student One", await studentsResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var account = await db.UserAccounts.SingleAsync(item => item.Phone == "+201012345678" && item.AccountType == "parent");
            Assert.Null(account.Email);
            Assert.Equal("ACTIVE", account.Status);
            Assert.True(await db.Memberships.AnyAsync(item => item.UserAccountId == account.Id && item.TenantId == staff.TenantId && item.RoleCode == "R08_PARENT" && item.ScopeLevel == "TENANT"));
            Assert.True(await db.GuardianStudentLinks.AnyAsync(item => item.UserAccountId == account.Id && item.StudentId == studentId && item.Relationship == "الأم"));
            Assert.Equal("ACCEPTED", (await db.ConsumerInvitations.SingleAsync()).Status);
        }

        using var replayResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/accept", new
        {
            token,
            code,
            fullName = "والدة الطالب",
            password = "ParentPassword2026!"
        });
        Assert.Equal(HttpStatusCode.BadRequest, replayResponse.StatusCode);
    }

    [Fact]
    public async Task ConsumerInvitation_EnforcesBranchScopeAndRolePermissions()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var managerClient = factory.CreateClient();
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var otherBranchId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranchId, TenantId = manager.TenantId, Name = "Other Branch", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        var outOfScopeStudentId = await TestData.SeedStudentAsync(factory, manager.TenantId, otherBranchId, "Out of Scope");
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        using var scopeResponse = await managerClient.PostAsJsonAsync($"/api/v1/students/{outOfScopeStudentId}/consumer-invitations", new
        {
            phone = "+201234567890",
            accountType = "parent",
            relationship = "الأب"
        });
        Assert.Equal(HttpStatusCode.NotFound, scopeResponse.StatusCode);

        using var instructorClient = factory.CreateClient();
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);
        TestData.Authenticate(instructorClient, await TestData.LoginAsync(instructorClient, instructor));
        using var roleResponse = await instructorClient.PostAsJsonAsync($"/api/v1/students/{outOfScopeStudentId}/consumer-invitations", new
        {
            phone = "+201234567891",
            accountType = "parent",
            relationship = "الأب"
        });
        Assert.Equal(HttpStatusCode.Forbidden, roleResponse.StatusCode);
    }

    [Fact]
    public async Task ConsumerInvitation_LocksAfterFiveInvalidOtpAttempts()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var studentId = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Student Two");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));
        using var createResponse = await client.PostAsJsonAsync($"/api/v1/students/{studentId}/consumer-invitations", new
        {
            phone = "+201111111111",
            accountType = "parent",
            relationship = "الأب"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<CreatedInvitationEnvelope>();
        var token = ReadToken(created!.Data.DebugAcceptUrl!);
        var wrongCode = created.Data.DevelopmentCode == "999999" ? "999998" : "999999";

        for (var attempt = 0; attempt < 5; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/v1/consumer-invitations/accept", new
            {
                token,
                code = wrongCode,
                fullName = "والد الطالب",
                password = "ParentPassword2026!"
            });
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            Assert.Equal("LOCKED", (await db.ConsumerInvitations.SingleAsync()).Status);
            Assert.False(await db.UserAccounts.AnyAsync(item => item.Phone == "+201111111111"));
        }
    }

    [Fact]
    public async Task ConsumerInvitation_FailsClosedWhenSmsProviderIsNotConfigured()
    {
        using var factory = new TestApiFactory(useInMemory: true, unconfigureSms: true);
        using var client = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var studentId = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "No SMS Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));

        using var response = await client.PostAsJsonAsync($"/api/v1/students/{studentId}/consumer-invitations", new
        {
            phone = "+201222222222",
            accountType = "parent",
            relationship = "الأم"
        });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("developmentCode", body, StringComparison.OrdinalIgnoreCase);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal("DELIVERY_FAILED", (await db.ConsumerInvitations.SingleAsync()).Status);
        Assert.False(await db.UserAccounts.AnyAsync(item => item.Phone == "+201222222222"));
    }

    [Fact]
    public async Task ConsumerInvitationPreview_RateLimitsSensitiveRequestsPerClientIp()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();

        for (var attempt = 0; attempt < 30; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/v1/consumer-invitations/preview", new { token = "invalid-token" });
            Assert.NotEqual(HttpStatusCode.TooManyRequests, response.StatusCode);
        }

        using var limited = await client.PostAsJsonAsync("/api/v1/consumer-invitations/preview", new { token = "invalid-token" });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
    }

    [Fact]
    public async Task ConsumerLookup_RateLimitsRequestsPerClientIp()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var studentId = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Lookup Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));

        for (var attempt = 0; attempt < 60; attempt++)
        {
            using var response = await client.GetAsync($"/api/v1/students/{studentId}/consumer-accounts?accountType=parent&phone=%2B201011112222");
            Assert.NotEqual(HttpStatusCode.TooManyRequests, response.StatusCode);
        }

        using var limited = await client.GetAsync($"/api/v1/students/{studentId}/consumer-accounts?accountType=parent&phone=%2B201011112222");
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
    }

    [Fact]
    public async Task OtpSend_RateLimitsSensitiveRequestsPerClientIp()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();

        for (var attempt = 0; attempt < 30; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/v1/auth/otp/send", new { phone = "+201099999999", accountType = "staff" });
            Assert.NotEqual(HttpStatusCode.TooManyRequests, response.StatusCode);
        }

        using var limited = await client.PostAsJsonAsync("/api/v1/auth/otp/send", new { phone = "+201099999999", accountType = "staff" });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
    }

    private static string ReadToken(string url)
    {
        var fragment = new Uri(url).Fragment;
        Assert.StartsWith("#token=", fragment, StringComparison.Ordinal);
        return Uri.UnescapeDataString(fragment["#token=".Length..]);
    }

    private sealed record CreatedInvitationEnvelope(CreatedInvitationData Data);
    private sealed record CreatedInvitationData(string Status, string MaskedPhone, DateTimeOffset ExpiresAt, DateTimeOffset OtpExpiresAt, string Delivery, string? DevelopmentCode, string? DebugAcceptUrl);
}
