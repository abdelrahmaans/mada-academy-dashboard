using System.Globalization;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;

namespace MadaAcademy.Api.Modules.Identity;

public static class ConsumerInvitationEndpoints
{
    private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan InvitationLifetime = TimeSpan.FromDays(7);
    private const int MaxOtpAttempts = 5;
    private const int MaxOtpSends = 3;
    private static readonly TimeSpan OtpResendCooldown = TimeSpan.FromSeconds(60);

    public static IEndpointRouteBuilder MapMadaConsumerInvitationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/v1/students/{studentId:guid}/consumer-invitations", CreateAsync).RequireAuthorization("staff");
        var publicInvitations = endpoints.MapGroup("/api/v1/consumer-invitations");
        publicInvitations.MapPost("/preview", PreviewAsync).RequireRateLimiting("auth-sensitive");
        publicInvitations.MapPost("/resend-code", ResendCodeAsync).RequireRateLimiting("auth-sensitive");
        publicInvitations.MapPost("/accept", AcceptAsync).RequireRateLimiting("auth-sensitive");
        return endpoints;
    }

    private static async Task<IResult> CreateAsync(
        Guid studentId,
        CreateConsumerInvitationRequest request,
        ClaimsPrincipal actor,
        MadaDbContext db,
        ISmsMessageSender sms,
        IConfiguration configuration,
        IHostEnvironment environment,
        JwtOptions jwtOptions,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        if (!CanManageLinks(actor) || !TryScope(actor, out var tenantId, out var branchId)) return Forbidden("CONSUMER_LINK_MANAGEMENT_FORBIDDEN");
        if (request.AccountType is not ("parent" or "student")) return Validation("accountType", "Account type must be parent or student.");

        var student = await FindScopedStudentAsync(db, studentId, tenantId, branchId, cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");

        if (string.IsNullOrWhiteSpace(request.Phone)) return Validation("phone", "Phone number is required.");
        var phone = NormalizePhone(request.Phone);
        if (!Regex.IsMatch(phone, @"^\+[1-9][0-9]{7,14}$", RegexOptions.CultureInvariant))
            return Validation("phone", "Enter a valid international phone number.");
        var relationship = request.Relationship?.Trim();
        if (request.AccountType == "parent" && (string.IsNullOrWhiteSpace(relationship) || relationship.Length > 64))
            return Validation("relationship", "Relationship is required for a parent invitation and must be at most 64 characters.");

        var now = DateTimeOffset.UtcNow;
        if (await db.UserAccounts.AnyAsync(item => item.Phone == phone && item.AccountType == request.AccountType, cancellationToken))
            return Conflict("CONSUMER_ACCOUNT_EXISTS", "An account already exists for this phone. Search and link the existing account instead.");
        var pendingInvitation = await db.ConsumerInvitations.SingleOrDefaultAsync(item => item.Phone == phone && item.AccountType == request.AccountType && item.Status == "PENDING", cancellationToken);
        if (pendingInvitation is not null)
        {
            var lastCodeExpiredAtSendLimit = pendingInvitation.OtpSendCount >= MaxOtpSends && pendingInvitation.OtpExpiresAt <= now;
            if (pendingInvitation.ExpiresAt > now && !lastCodeExpiredAtSendLimit)
                return Conflict("CONSUMER_INVITATION_PENDING", "A pending invitation already exists for this phone. Use its message or wait for it to expire.");
            pendingInvitation.Status = "EXPIRED";
            await db.SaveChangesAsync(cancellationToken);
        }
        if (request.AccountType == "student" && await db.StudentAccountLinks.AnyAsync(item => item.StudentId == studentId, cancellationToken))
            return Conflict("STUDENT_ACCOUNT_ALREADY_LINKED", "This student already has a linked student account.");

        var acceptUrl = BuildAcceptUrl(configuration, environment, null);
        if (acceptUrl is null) return SmsUnavailable();

        var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var code = NewOtpCode();
        var invitation = new ConsumerInvitation
        {
            TenantId = tenantId,
            BranchId = student.BranchId,
            StudentId = student.Id,
            Phone = phone,
            AccountType = request.AccountType,
            Relationship = request.AccountType == "parent" ? relationship : null,
            TokenHash = HashToken(rawToken),
            OtpHash = HashOtp(rawToken, code, jwtOptions),
            OtpExpiresAt = now.Add(OtpLifetime),
            OtpLastSentAt = now,
            OtpAttempts = 0,
            OtpSendCount = 1,
            ExpiresAt = now.Add(InvitationLifetime),
            Status = "PENDING",
            InvitedByUserId = ActorId(actor)
        };
        db.ConsumerInvitations.Add(invitation);
        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(actor), TenantId = tenantId, Action = "CONSUMER_INVITATION_CREATED",
            TargetType = "STUDENT", TargetId = studentId.ToString(),
            MetadataJson = $"{{\"accountType\":\"{request.AccountType}\",\"phoneSuffix\":\"{phone[^4..]}\"}}"
        });
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict("CONSUMER_INVITATION_CONFLICT", "A matching invitation or account was created concurrently. Search for the account and retry if needed.");
        }

        acceptUrl = BuildAcceptUrl(configuration, environment, rawToken)!;
        var message = BuildSmsMessage(acceptUrl, code);
        SmsDeliveryResult delivery;
        try
        {
            delivery = await sms.SendAsync(phone, message, code, cancellationToken);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception exception)
        {
            loggerFactory.CreateLogger("MadaAcademy.ConsumerInvitations").LogWarning("SMS gateway failed while delivering a consumer invitation. ExceptionType={ExceptionType}", exception.GetType().Name);
            delivery = new SmsDeliveryResult(false, "provider-error");
        }
        if (!delivery.Delivered)
        {
            invitation.Status = "DELIVERY_FAILED";
            await db.SaveChangesAsync(cancellationToken);
            return SmsUnavailable();
        }

        return Results.Created("/api/v1/consumer-invitations", new
        {
            data = new
            {
                status = invitation.Status,
                maskedPhone = MaskPhone(phone),
                expiresAt = invitation.ExpiresAt,
                otpExpiresAt = invitation.OtpExpiresAt,
                delivery = delivery.Delivery,
                developmentCode = environment.IsDevelopment() ? delivery.DevelopmentCode : null,
                debugAcceptUrl = environment.IsDevelopment() && delivery.DevelopmentCode is not null ? acceptUrl : null
            }
        });
    }

    private static async Task<IResult> PreviewAsync(
        ConsumerInvitationTokenRequest request,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token)) return InvalidInvitation();
        var invitation = await FindPendingInvitationAsync(db, request.Token, cancellationToken);
        if (invitation is null) return InvalidInvitation();
        return Results.Ok(new
        {
            data = new
            {
                accountType = invitation.AccountType,
                maskedPhone = MaskPhone(invitation.Phone),
                expiresAt = invitation.ExpiresAt,
                otpExpiresAt = invitation.OtpExpiresAt,
                displayNameRequired = invitation.AccountType == "parent"
            }
        });
    }

    private static async Task<IResult> ResendCodeAsync(
        ConsumerInvitationTokenRequest request,
        MadaDbContext db,
        ISmsMessageSender sms,
        IConfiguration configuration,
        IHostEnvironment environment,
        JwtOptions jwtOptions,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token)) return InvalidInvitation();
        var invitation = await FindPendingInvitationAsync(db, request.Token, cancellationToken);
        if (invitation is null) return InvalidInvitation();
        var now = DateTimeOffset.UtcNow;
        if (invitation.OtpSendCount >= MaxOtpSends || invitation.OtpLastSentAt > now.Subtract(OtpResendCooldown))
            return Results.Problem(statusCode: StatusCodes.Status429TooManyRequests, title: "OTP resend limit reached", extensions: new Dictionary<string, object?> { ["code"] = "OTP_RESEND_LIMIT" });

        var acceptUrl = BuildAcceptUrl(configuration, environment, request.Token);
        if (acceptUrl is null) return SmsUnavailable();
        var code = NewOtpCode();
        invitation.OtpHash = HashOtp(request.Token, code, jwtOptions);
        invitation.OtpExpiresAt = now.Add(OtpLifetime);
        invitation.OtpLastSentAt = now;
        invitation.OtpAttempts = 0;
        invitation.OtpSendCount++;
        await db.SaveChangesAsync(cancellationToken);

        SmsDeliveryResult delivery;
        try
        {
            delivery = await sms.SendAsync(invitation.Phone, BuildSmsMessage(acceptUrl, code), code, cancellationToken);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception exception)
        {
            loggerFactory.CreateLogger("MadaAcademy.ConsumerInvitations").LogWarning("SMS gateway failed while resending a consumer invitation code. ExceptionType={ExceptionType}", exception.GetType().Name);
            delivery = new SmsDeliveryResult(false, "provider-error");
        }
        if (!delivery.Delivered) return SmsUnavailable();
        return Results.Ok(new { data = new { maskedPhone = MaskPhone(invitation.Phone), otpExpiresAt = invitation.OtpExpiresAt, delivery = delivery.Delivery, developmentCode = environment.IsDevelopment() ? delivery.DevelopmentCode : null } });
    }

    private static async Task<IResult> AcceptAsync(
        AcceptConsumerInvitationRequest request,
        MadaDbContext db,
        PasswordHashService passwords,
        JwtTokenService jwtTokens,
        JwtOptions jwtOptions,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.Code) || !Regex.IsMatch(request.Code, @"^[0-9]{6}$", RegexOptions.CultureInvariant))
            return InvalidInvitation();
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return Validation("password", "Password must contain at least 8 characters.");
        if (request.Email is { Length: > 320 }) return Validation("email", "Email must be at most 320 characters.");
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            try { _ = new MailAddress(request.Email.Trim()); }
            catch { return Validation("email", "Enter a valid email address."); }
        }

        var invitation = await FindPendingInvitationAsync(db, request.Token, cancellationToken);
        if (invitation is null) return InvalidInvitation();
        if (invitation.OtpAttempts >= MaxOtpAttempts || invitation.OtpExpiresAt <= DateTimeOffset.UtcNow)
            return InvalidInvitation();

        invitation.OtpAttempts++;
        if (!FixedHashEquals(invitation.OtpHash, HashOtp(request.Token, request.Code, jwtOptions)))
        {
            if (invitation.OtpAttempts >= MaxOtpAttempts) invitation.Status = "LOCKED";
            await db.SaveChangesAsync(cancellationToken);
            return InvalidInvitation();
        }

        var student = await db.Students.SingleOrDefaultAsync(item => item.Id == invitation.StudentId && item.TenantId == invitation.TenantId && item.BranchId == invitation.BranchId && item.Status == "ACTIVE", cancellationToken);
        if (student is null || !await db.Branches.AnyAsync(item => item.Id == invitation.BranchId && item.TenantId == invitation.TenantId && item.Status == "ACTIVE", cancellationToken))
        {
            invitation.Status = "CANCELLED";
            await db.SaveChangesAsync(cancellationToken);
            return InvalidInvitation();
        }
        if (await db.UserAccounts.AnyAsync(item => item.Phone == invitation.Phone && item.AccountType == invitation.AccountType, cancellationToken))
        {
            invitation.Status = "CANCELLED";
            await db.SaveChangesAsync(cancellationToken);
            return Conflict("CONSUMER_ACCOUNT_EXISTS", "An account already exists for this phone. Contact the academy to link the existing account.");
        }
        if (invitation.AccountType == "student" && await db.StudentAccountLinks.AnyAsync(item => item.StudentId == invitation.StudentId, cancellationToken))
        {
            invitation.Status = "CANCELLED";
            await db.SaveChangesAsync(cancellationToken);
            return Conflict("STUDENT_ACCOUNT_ALREADY_LINKED", "This student already has a linked student account.");
        }

        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant();
        if (email is not null && await db.UserAccounts.AnyAsync(item => item.Email == email, cancellationToken))
            return Conflict("CONSUMER_EMAIL_EXISTS", "This email is already registered.");
        var displayName = invitation.AccountType == "student" ? student.FullName : request.FullName?.Trim();
        if (string.IsNullOrWhiteSpace(displayName) || displayName.Length > 160)
            return Validation("fullName", "Full name is required and must be at most 160 characters.");

        var account = new UserAccount
        {
            Email = email,
            Phone = invitation.Phone,
            AccountType = invitation.AccountType,
            DisplayName = displayName,
            PasswordHash = passwords.Hash(request.Password),
            Status = "ACTIVE"
        };
        var roleCode = invitation.AccountType == "parent" ? "R08_PARENT" : "R09_STUDENT";
        var membership = new Membership { UserAccountId = account.Id, TenantId = invitation.TenantId, RoleCode = roleCode, ScopeLevel = "TENANT", Status = "ACTIVE" };
        db.UserAccounts.Add(account);
        db.Memberships.Add(membership);
        if (invitation.AccountType == "parent")
            db.GuardianStudentLinks.Add(new GuardianStudentLink { TenantId = invitation.TenantId, StudentId = invitation.StudentId, UserAccountId = account.Id, CreatedByUserId = invitation.InvitedByUserId, Relationship = invitation.Relationship ?? "ولي أمر", Status = "ACTIVE" });
        else
            db.StudentAccountLinks.Add(new StudentAccountLink { TenantId = invitation.TenantId, StudentId = invitation.StudentId, UserAccountId = account.Id, CreatedByUserId = invitation.InvitedByUserId });

        invitation.Status = "ACCEPTED";
        invitation.AcceptedByUserId = account.Id;
        invitation.OtpHash = string.Empty;
        db.AuditEvents.Add(new AuditEvent { ActorUserId = account.Id, TenantId = invitation.TenantId, Action = "CONSUMER_INVITATION_ACCEPTED", TargetType = "CONSUMER_INVITATION", TargetId = invitation.Id.ToString(), MetadataJson = $"{{\"accountType\":\"{invitation.AccountType}\",\"studentId\":\"{student.Id}\"}}" });

        var sessionId = Guid.NewGuid();
        var tokens = jwtTokens.Issue(account, membership, sessionId);
        db.RefreshSessions.Add(new RefreshSession { Id = sessionId, UserAccountId = account.Id, TokenHash = JwtTokenService.HashRefreshToken(tokens.RefreshToken), ExpiresAt = tokens.RefreshTokenExpiresAt });
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict("CONSUMER_ACCOUNT_CONFLICT", "The invitation could not be accepted because the account or student link has changed. Contact the academy.");
        }
        return Results.Ok(new { data = tokens });
    }

    private static async Task<ConsumerInvitation?> FindPendingInvitationAsync(MadaDbContext db, string token, CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(token);
        var invitation = await db.ConsumerInvitations.SingleOrDefaultAsync(item => item.TokenHash == tokenHash, cancellationToken);
        return invitation is { Status: "PENDING" } && invitation.ExpiresAt > DateTimeOffset.UtcNow ? invitation : null;
    }

    private static string? BuildAcceptUrl(IConfiguration configuration, IHostEnvironment environment, string? token)
    {
        var baseUrl = configuration["MADA_FRONTEND_URL"];
        if (string.IsNullOrWhiteSpace(baseUrl) && environment.IsDevelopment()) baseUrl = "http://localhost:5173";
        if (string.IsNullOrWhiteSpace(baseUrl) || !Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) || uri.Scheme is not ("https" or "http") || !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment)) return null;
        if (!environment.IsDevelopment() && uri.Scheme != Uri.UriSchemeHttps) return null;
        return $"{uri.GetLeftPart(UriPartial.Authority)}{uri.AbsolutePath.TrimEnd('/')}/accept-invitation" + (token is null ? string.Empty : $"#token={Uri.EscapeDataString(token)}");
    }

    private static string BuildSmsMessage(string acceptUrl, string code)
        => $"تمت دعوتك لتفعيل حسابك في Mada Academy. افتح الرابط وأدخل رمز التحقق {code}: {acceptUrl} — صالح لمدة 10 دقائق.";

    private static string NewOtpCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6", CultureInfo.InvariantCulture);
    private static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    private static string HashOtp(string token, string code, JwtOptions options)
    {
        var key = Encoding.UTF8.GetBytes(options.SigningKey);
        var value = Encoding.UTF8.GetBytes($"consumer-invite:{token}:{code}");
        return Convert.ToHexString(HMACSHA256.HashData(key, value));
    }
    private static bool FixedHashEquals(string expected, string actual)
    {
        try { return CryptographicOperations.FixedTimeEquals(Convert.FromHexString(expected), Convert.FromHexString(actual)); }
        catch (FormatException) { return false; }
    }
    private static string NormalizePhone(string phone) => OtpChallengeStore.Normalize(ToLatinDigits(phone));
    private static string ToLatinDigits(string value) => new(value.Select(character => character switch
    {
        >= '\u0660' and <= '\u0669' => (char)('0' + character - '\u0660'),
        >= '\u06F0' and <= '\u06F9' => (char)('0' + character - '\u06F0'),
        _ => character
    }).ToArray());
    private static string MaskPhone(string phone) => phone.Length <= 4 ? "••••" : $"•••• {phone[^4..]}";
    private static bool TryScope(ClaimsPrincipal user, out Guid tenantId, out Guid? branchId)
    {
        branchId = Guid.TryParse(user.FindFirstValue("branchId"), out var parsed) ? parsed : null;
        tenantId = Guid.Empty;
        return Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId);
    }
    private static bool CanManageLinks(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R05_SECRETARY");
    private static Guid? ActorId(ClaimsPrincipal user) => Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;
    private static async Task<Student?> FindScopedStudentAsync(MadaDbContext db, Guid studentId, Guid tenantId, Guid? branchId, CancellationToken cancellationToken)
        => await db.Students.SingleOrDefaultAsync(item => item.Id == studentId && item.TenantId == tenantId && (!branchId.HasValue || item.BranchId == branchId.Value), cancellationToken);
    private static IResult Forbidden(string code) => Results.Problem(statusCode: 403, title: code, extensions: new Dictionary<string, object?> { ["code"] = code });
    private static IResult NotFound(string code) => Results.NotFound(new { error = new { code, message = code } });
    private static IResult Conflict(string code, string message) => Results.Conflict(new { error = new { code, message } });
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
    private static IResult InvalidInvitation() => Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invitation or verification code is invalid or expired", extensions: new Dictionary<string, object?> { ["code"] = "INVITATION_INVALID" });
    private static IResult SmsUnavailable() => Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "SMS delivery is not configured", extensions: new Dictionary<string, object?> { ["code"] = "SMS_DELIVERY_UNAVAILABLE" });
}

public sealed record CreateConsumerInvitationRequest(string Phone, string AccountType, string? Relationship = null);
public sealed record ConsumerInvitationTokenRequest(string Token);
public sealed record AcceptConsumerInvitationRequest(string Token, string Code, string? FullName, string? Email, string Password);
