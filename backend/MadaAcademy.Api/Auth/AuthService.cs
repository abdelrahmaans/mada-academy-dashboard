using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Auth;

public sealed class AuthService(MadaDbContext db, JwtTokenService tokens, OtpChallengeStore otp, PasswordHashService passwords, AuthSecurityOptions security)
{
    public OtpSendResponse SendOtp(OtpSendRequest request) => otp.Issue(request.Phone, request.AccountType);

    public async Task<AuthTokenResponse?> VerifyOtpAsync(OtpVerifyRequest request, CancellationToken cancellationToken)
    {
        if (!otp.Verify(request.Phone, request.AccountType, request.Code)) return null;
        var phone = OtpChallengeStore.Normalize(request.Phone);
        var user = await db.UserAccounts.SingleOrDefaultAsync(x => x.Phone == phone && x.AccountType == request.AccountType, cancellationToken);
        if (user is null || user.Status != "ACTIVE") return null;
        var membership = await db.Memberships.Where(x => x.UserAccountId == user.Id && x.Status == "ACTIVE" && (x.RoleCode == "R00_PLATFORM_ADMIN" || x.Tenant!.Status != "PAUSED")).OrderBy(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        if (membership is null) return null;

        user.LastLoginAt = DateTimeOffset.UtcNow;
        var sessionId = Guid.NewGuid();
        var response = tokens.Issue(user, membership, sessionId);
        db.RefreshSessions.Add(new RefreshSession
        {
            Id = sessionId,
            UserAccountId = user.Id,
            TokenHash = JwtTokenService.HashRefreshToken(response.RefreshToken),
            ExpiresAt = response.RefreshTokenExpiresAt
        });
        await db.SaveChangesAsync(cancellationToken);
        return response;
    }

    public async Task<PasswordLoginResult> LoginWithPasswordAsync(PasswordLoginRequest request, CancellationToken cancellationToken)
    {
        var phone = OtpChallengeStore.Normalize(request.Phone);
        var user = await db.UserAccounts.SingleOrDefaultAsync(x => x.Phone == phone && x.AccountType == request.AccountType, cancellationToken);
        if (user is null || user.Status != "ACTIVE") return new PasswordLoginResult(null);

        var now = DateTimeOffset.UtcNow;
        if (user.PasswordLockedUntil > now) return new PasswordLoginResult(null, IsLocked: true);
        if (user.PasswordLockedUntil is not null)
        {
            user.PasswordLockedUntil = null;
            user.FailedPasswordAttempts = 0;
        }

        if (!passwords.Verify(request.Password, user.PasswordHash))
        {
            user.FailedPasswordAttempts++;
            if (user.FailedPasswordAttempts >= security.MaxFailedPasswordAttempts)
            {
                user.PasswordLockedUntil = now.AddMinutes(security.LockoutMinutes);
                await db.SaveChangesAsync(cancellationToken);
                return new PasswordLoginResult(null, IsLocked: true);
            }

            await db.SaveChangesAsync(cancellationToken);
            return new PasswordLoginResult(null);
        }

        var membership = await db.Memberships.Where(x => x.UserAccountId == user.Id && x.Status == "ACTIVE" && (x.RoleCode == "R00_PLATFORM_ADMIN" || x.Tenant!.Status != "PAUSED")).OrderBy(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        if (membership is null) return new PasswordLoginResult(null);
        user.LastLoginAt = DateTimeOffset.UtcNow;
        user.FailedPasswordAttempts = 0;
        user.PasswordLockedUntil = null;
        var sessionId = Guid.NewGuid();
        var response = tokens.Issue(user, membership, sessionId);
        db.RefreshSessions.Add(new RefreshSession { Id = sessionId, UserAccountId = user.Id, TokenHash = JwtTokenService.HashRefreshToken(response.RefreshToken), ExpiresAt = response.RefreshTokenExpiresAt });
        await db.SaveChangesAsync(cancellationToken);
        return new PasswordLoginResult(response);
    }

    public async Task<AuthTokenResponse?> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken)
    {
        var hash = JwtTokenService.HashRefreshToken(request.RefreshToken);
        var session = await db.RefreshSessions.Include(x => x.UserAccount).SingleOrDefaultAsync(x => x.TokenHash == hash, cancellationToken);
        if (session is null || session.RevokedAt is not null || session.ExpiresAt <= DateTimeOffset.UtcNow || session.UserAccount is null || session.UserAccount.Status != "ACTIVE") return null;
        var membership = await db.Memberships.Where(x => x.UserAccountId == session.UserAccountId && x.Status == "ACTIVE" && (x.RoleCode == "R00_PLATFORM_ADMIN" || x.Tenant!.Status != "PAUSED")).OrderBy(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        if (membership is null) return null;

        session.RevokedAt = DateTimeOffset.UtcNow;
        var sessionId = Guid.NewGuid();
        var response = tokens.Issue(session.UserAccount, membership, sessionId);
        db.RefreshSessions.Add(new RefreshSession
        {
            Id = sessionId,
            UserAccountId = session.UserAccountId,
            TokenHash = JwtTokenService.HashRefreshToken(response.RefreshToken),
            ExpiresAt = response.RefreshTokenExpiresAt
        });
        await db.SaveChangesAsync(cancellationToken);
        return response;
    }

    public async Task<bool> LogoutAsync(LogoutRequest request, CancellationToken cancellationToken)
    {
        var hash = JwtTokenService.HashRefreshToken(request.RefreshToken);
        var session = await db.RefreshSessions.SingleOrDefaultAsync(x => x.TokenHash == hash, cancellationToken);
        if (session is null) return false;
        session.RevokedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
