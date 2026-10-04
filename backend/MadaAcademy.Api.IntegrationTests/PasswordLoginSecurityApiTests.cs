using System.Net;
using System.Net.Http.Json;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class PasswordLoginSecurityApiTests
{
    [Fact]
    public async Task PasswordLogin_LocksAfterFiveFailures_AndDoesNotRevealAccountState()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");

        for (var attempt = 1; attempt <= 4; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/v1/auth/login", new
            {
                phone = account.Phone,
                password = "Wrong!Password2026",
                accountType = "staff"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        using var lockoutResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            phone = account.Phone,
            password = "Wrong!Password2026",
            accountType = "staff"
        });
        Assert.Equal(HttpStatusCode.TooManyRequests, lockoutResponse.StatusCode);
        Assert.Contains("LOGIN_LOCKED", await lockoutResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        using var correctWhileLocked = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            phone = account.Phone,
            password = account.Password,
            accountType = "staff"
        });
        Assert.Equal(HttpStatusCode.TooManyRequests, correctWhileLocked.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var lockedUser = await db.UserAccounts.SingleAsync(item => item.Id == account.UserId);
        Assert.Equal(5, lockedUser.FailedPasswordAttempts);
        Assert.True(lockedUser.PasswordLockedUntil > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task PasswordLogin_SuccessResetsFailedAttempts()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");

        for (var attempt = 1; attempt <= 2; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/v1/auth/login", new
            {
                phone = account.Phone,
                password = "Wrong!Password2026",
                accountType = "staff"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        using var success = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            phone = account.Phone,
            password = account.Password,
            accountType = "staff"
        });
        Assert.Equal(HttpStatusCode.OK, success.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var user = await db.UserAccounts.SingleAsync(item => item.Id == account.UserId);
        Assert.Equal(0, user.FailedPasswordAttempts);
        Assert.Null(user.PasswordLockedUntil);
    }

    [Fact]
    public async Task PasswordLogin_RateLimitsRequestsPerClientIp()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var request = new
        {
            phone = "+2010999999999",
            password = "Wrong!Password2026",
            accountType = "staff"
        };

        HttpResponseMessage? lastResponse = null;
        for (var attempt = 1; attempt <= 21; attempt++)
        {
            lastResponse?.Dispose();
            lastResponse = await client.PostAsJsonAsync("/api/v1/auth/login", request);
        }

        using var finalResponse = lastResponse ?? throw new InvalidOperationException("The login rate-limit loop produced no response.");
        Assert.Equal(HttpStatusCode.TooManyRequests, finalResponse.StatusCode);
    }

    [Fact]
    public async Task Refresh_RateLimitsSensitiveRequestsPerClientIp()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();

        for (var attempt = 1; attempt <= 30; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/v1/auth/refresh", new
            {
                refreshToken = "invalid-refresh-token"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        using var limited = await client.PostAsJsonAsync("/api/v1/auth/refresh", new
        {
            refreshToken = "invalid-refresh-token"
        });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
    }
}
