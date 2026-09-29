using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Auth;

public sealed class AuthService(MadaDbContext db, JwtTokenService tokens, OtpChallengeStore otp)
{
    public OtpSendResponse SendOtp(OtpSendRequest request) => otp.Issue(request.Phone, request.AccountType);

    public async Task<AuthTokenResponse?> VerifyOtpAsync(OtpVerifyRequest request, CancellationToken cancellationToken)
    {
        if (!otp.Verify(request.Phone, request.AccountType, request.Code)) return null;
        var phone = OtpChallengeStore.Normalize(request.Phone);
        var user = await db.UserAccounts.SingleOrDefaultAsync(x => x.Phone == phone && x.AccountType == request.AccountType, cancellationToken);
        if (user is null || user.Status is "TERMINATED" or "SUSPENDED") return null;
        var membership = await db.Memberships.Where(x => x.UserAccountId == user.Id && x.Status == "ACTIVE").OrderBy(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        if (membership is null) return null;

        user.LastLoginAt = DateTimeOffset.UtcNow;
        var response = tokens.Issue(user, membership);
        db.RefreshSessions.Add(new RefreshSession
        {
            UserAccountId = user.Id,
            TokenHash = JwtTokenService.HashRefreshToken(response.RefreshToken),
            ExpiresAt = response.RefreshTokenExpiresAt
        });
        await db.SaveChangesAsync(cancellationToken);
        return response;
    }

    public async Task<AuthTokenResponse?> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken)
    {
        var hash = JwtTokenService.HashRefreshToken(request.RefreshToken);
        var session = await db.RefreshSessions.Include(x => x.UserAccount).SingleOrDefaultAsync(x => x.TokenHash == hash, cancellationToken);
        if (session is null || session.RevokedAt is not null || session.ExpiresAt <= DateTimeOffset.UtcNow || session.UserAccount is null) return null;
        var membership = await db.Memberships.Where(x => x.UserAccountId == session.UserAccountId && x.Status == "ACTIVE").OrderBy(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        if (membership is null) return null;

        session.RevokedAt = DateTimeOffset.UtcNow;
        var response = tokens.Issue(session.UserAccount, membership);
        db.RefreshSessions.Add(new RefreshSession
        {
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
