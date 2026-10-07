using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class RefreshTokenRotationTests
{
    [Fact]
    public async Task RefreshRotation_RevokesConsumedTokenAndIssuesDistinctReplacement()
    {
        await using var context = CreateContext();
        var service = await CreateServiceAsync(context);
        var initial = await LoginAsync(service);
        var oldTokenHash = JwtTokenService.HashRefreshToken(initial.RefreshToken);

        var replacement = await service.RefreshAsync(new RefreshRequest(initial.RefreshToken), CancellationToken.None)
            ?? throw new InvalidOperationException("Refresh rotation did not issue a replacement token.");

        Assert.NotEqual(initial.RefreshToken, replacement.RefreshToken);

        var oldSession = await context.RefreshSessions.SingleAsync(item => item.TokenHash == oldTokenHash);
        Assert.NotNull(oldSession.RevokedAt);
        Assert.Equal(2, await context.RefreshSessions.CountAsync());
        Assert.Equal(1, await context.RefreshSessions.CountAsync(item => item.RevokedAt == null));
        Assert.Equal(
            JwtTokenService.HashRefreshToken(replacement.RefreshToken),
            (await context.RefreshSessions.SingleAsync(item => item.RevokedAt == null)).TokenHash);
    }

    [Fact]
    public async Task ReuseOfRotatedRefreshToken_IsRejectedAndDoesNotCreateAnotherSession()
    {
        await using var context = CreateContext();
        var service = await CreateServiceAsync(context);
        var initial = await LoginAsync(service);
        var replacement = await service.RefreshAsync(new RefreshRequest(initial.RefreshToken), CancellationToken.None)
            ?? throw new InvalidOperationException("Refresh rotation did not issue a replacement token.");

        var sessionCountAfterRotation = await context.RefreshSessions.CountAsync();
        var replay = await service.RefreshAsync(new RefreshRequest(initial.RefreshToken), CancellationToken.None);

        Assert.Null(replay);
        Assert.Equal(sessionCountAfterRotation, await context.RefreshSessions.CountAsync());
        Assert.Equal(1, await context.RefreshSessions.CountAsync(item => item.RevokedAt == null));
        Assert.True(await context.RefreshSessions.AnyAsync(item =>
            item.TokenHash == JwtTokenService.HashRefreshToken(initial.RefreshToken) && item.RevokedAt != null));
    }

    [Fact]
    public async Task UnknownRefreshToken_IsRejectedWithoutRevokingOrCreatingAnySession()
    {
        await using var context = CreateContext();
        var service = await CreateServiceAsync(context);
        var initial = await LoginAsync(service);

        var result = await service.RefreshAsync(
            new RefreshRequest("attacker-presented-token-that-was-never-issued"),
            CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(1, await context.RefreshSessions.CountAsync());
        Assert.True(await context.RefreshSessions.AnyAsync(item =>
            item.TokenHash == JwtTokenService.HashRefreshToken(initial.RefreshToken) && item.RevokedAt == null));
    }

    private static MadaDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<MadaDbContext>()
            .UseInMemoryDatabase($"refresh-token-tests-{Guid.NewGuid():N}")
            .Options;
        return new MadaDbContext(options);
    }

    private static async Task<AuthService> CreateServiceAsync(MadaDbContext context)
    {
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "Refresh Test Academy", Slug = $"refresh-{Guid.NewGuid():N}" };
        var branch = new Branch { Id = Guid.NewGuid(), TenantId = tenant.Id, Tenant = tenant, Name = "Refresh Test Branch", Code = "REFRESH" };
        var user = new UserAccount
        {
            Id = Guid.NewGuid(),
            Phone = "+201000000000",
            Email = "refresh-test@example.test",
            DisplayName = "Refresh Test User",
            AccountType = "staff",
            PasswordHash = new PasswordHashService().Hash("Correct!Horse2026"),
            Status = "ACTIVE"
        };
        var membership = new Membership
        {
            UserAccountId = user.Id,
            UserAccount = user,
            TenantId = tenant.Id,
            Tenant = tenant,
            BranchId = branch.Id,
            Branch = branch,
            RoleCode = "R06_ACCOUNTANT",
            ScopeLevel = "BRANCH",
            Status = "ACTIVE"
        };

        context.Tenants.Add(tenant);
        context.Branches.Add(branch);
        context.UserAccounts.Add(user);
        context.Memberships.Add(membership);
        await context.SaveChangesAsync();

        var jwtOptions = new JwtOptions
        {
            Issuer = "refresh-token-tests",
            Audience = "refresh-token-tests",
            SigningKey = "refresh-token-test-signing-key-that-is-long-enough"
        };
        return new AuthService(
            context,
            new JwtTokenService(jwtOptions),
            new OtpChallengeStore(jwtOptions),
            new PasswordHashService(),
            new AuthSecurityOptions());
    }

    private static async Task<AuthTokenResponse> LoginAsync(AuthService service)
    {
        var result = await service.LoginWithPasswordAsync(
            new PasswordLoginRequest("+201000000000", "Correct!Horse2026", "staff"),
            CancellationToken.None);

        return result.Tokens ?? throw new InvalidOperationException("Test login did not issue tokens.");
    }
}
