using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Modules.Scheduling;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using MadaAcademy.Api.Persistence.Seeding;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var jwtOptions = JwtOptions.Load(builder.Configuration, builder.Environment);

builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddMadaPersistence(builder.Configuration);
builder.Services.AddMadaAuthentication(jwtOptions);
builder.Services.AddScoped<ConflictService>();
builder.Services.AddSingleton<IAuditSink, DevelopmentAuditSink>();
builder.Services.AddCors(options => options.AddPolicy("frontend", policy =>
{
    var configuredOrigins = Environment.GetEnvironmentVariable("MADA_CORS_ORIGINS")?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    if (builder.Environment.IsDevelopment() && (configuredOrigins is null || configuredOrigins.Length == 0))
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    else
        policy.WithOrigins(configuredOrigins ?? []).AllowAnyHeader().AllowAnyMethod();
}));

var app = builder.Build();

if (IsEnabled("MADA_APPLY_MIGRATIONS") || IsEnabled("MADA_SEED_DEMO_DATA"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var database = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
    await database.Database.MigrateAsync();
    if (IsEnabled("MADA_SEED_DEMO_DATA"))
        await DemoDataSeeder.SeedAsync(database);
}

app.UseExceptionHandler();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/api/v1/health");

app.MapPost("/api/v1/auth/otp/send", (OtpSendRequest request, AuthService auth) =>
{
    if (string.IsNullOrWhiteSpace(request.Phone) || request.AccountType is not ("staff" or "parent" or "student"))
        return Results.BadRequest(new { error = new { code = "INVALID_OTP_REQUEST", message = "Phone and accountType are required." } });
    return Results.Ok(new { data = auth.SendOtp(request) });
});

app.MapPost("/api/v1/auth/otp/verify", async (OtpVerifyRequest request, AuthService auth, CancellationToken cancellationToken) =>
{
    var tokens = await auth.VerifyOtpAsync(request, cancellationToken);
    return tokens is null
        ? Results.Unauthorized()
        : Results.Ok(new { data = tokens });
});

app.MapPost("/api/v1/auth/refresh", async (RefreshRequest request, AuthService auth, CancellationToken cancellationToken) =>
{
    var tokens = await auth.RefreshAsync(request, cancellationToken);
    return tokens is null
        ? Results.Unauthorized()
        : Results.Ok(new { data = tokens });
});

app.MapPost("/api/v1/auth/logout", async (LogoutRequest request, AuthService auth, CancellationToken cancellationToken) =>
{
    await auth.LogoutAsync(request, cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/v1/auth/dev/seed", async (DevSeedRequest request, MadaDbContext db, CancellationToken cancellationToken) =>
    {
        var tenant = await db.Tenants.FindAsync([request.TenantId], cancellationToken);
        if (tenant is null)
        {
            tenant = new Tenant { Id = request.TenantId, Name = "Mada Demo Academy", Slug = $"demo-{request.TenantId:N}" };
            db.Tenants.Add(tenant);
        }

        Branch? branch = null;
        if (request.BranchId.HasValue)
        {
            branch = await db.Branches.FindAsync([request.BranchId.Value], cancellationToken);
            if (branch is null)
            {
                branch = new Branch { Id = request.BranchId.Value, TenantId = tenant.Id, Name = "Main Branch", Code = "MAIN" };
                db.Branches.Add(branch);
            }
        }

        var phone = OtpChallengeStore.Normalize(request.Phone);
        var user = await db.UserAccounts.SingleOrDefaultAsync(x => x.Phone == phone && x.AccountType == "staff", cancellationToken);
        if (user is null)
        {
            user = new UserAccount { Email = request.Email, Phone = phone, DisplayName = request.DisplayName, AccountType = "staff", Status = "ACTIVE" };
            db.UserAccounts.Add(user);
        }
        else
        {
            user.Email = request.Email;
            user.DisplayName = request.DisplayName;
            user.Status = "ACTIVE";
        }

        var membership = await db.Memberships.SingleOrDefaultAsync(x => x.UserAccountId == user.Id && x.TenantId == tenant.Id && x.BranchId == request.BranchId && x.RoleCode == request.RoleCode, cancellationToken);
        if (membership is null)
            db.Memberships.Add(new Membership { UserAccountId = user.Id, TenantId = tenant.Id, BranchId = request.BranchId, RoleCode = request.RoleCode, ScopeLevel = request.BranchId.HasValue ? "BRANCH" : "TENANT" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { userId = user.Id, tenantId = tenant.Id, branchId = branch?.Id, roleCode = request.RoleCode } });
    });

    app.MapPost("/api/v1/audit/dev", async (AuditInput input, IAuditSink sink) =>
    {
        await sink.AppendAsync(input);
        return Results.Accepted(value: new { data = input, mode = "development-only" });
    });
}

app.MapGet("/api/v1/me", (HttpContext context) =>
{
    var user = context.User;
    return Results.Ok(new
    {
        data = new
        {
            id = user.FindFirstValue("sub"),
            accountType = user.FindFirstValue("accountType"),
            role = user.FindFirstValue("role"),
            tenantId = user.FindFirstValue("tenantId"),
            branchId = user.FindFirstValue("branchId"),
            scopeLevel = user.FindFirstValue("scopeLevel")
        }
    });
}).RequireAuthorization("staff");

app.MapGet("/api/v1/tenants/{tenantId:guid}/scope-check", (Guid tenantId, HttpContext context) =>
{
    var isPlatformAdmin = context.User.IsInRole("R00_PLATFORM_ADMIN");
    var tokenTenantId = context.User.FindFirstValue("tenantId");
    if (!isPlatformAdmin && !string.Equals(tokenTenantId, tenantId.ToString(), StringComparison.OrdinalIgnoreCase))
        return Results.Problem(statusCode: 403, title: "Tenant scope denied", extensions: new Dictionary<string, object?> { ["code"] = "TENANT_SCOPE_DENIED" });
    return Results.Ok(new { data = new { tenantId, access = "allowed", role = context.User.FindFirstValue("role") } });
}).RequireAuthorization("staff");

app.MapGet("/api/v1/dashboard/summary", async (HttpContext context, MadaDbContext db, CancellationToken cancellationToken) =>
{
    if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId))
        return Results.Problem(statusCode: 403, title: "Missing tenant scope");
    var branchClaim = context.User.FindFirstValue("branchId");
    var hasBranchScope = Guid.TryParse(branchClaim, out var branchId);
    var students = db.Students.Where(x => x.TenantId == tenantId);
    var enrollments = db.StudentEnrollments.Where(x => x.StudentId != Guid.Empty).Join(students, x => x.StudentId, x => x.Id, (enrollment, _) => enrollment);
    var sessions = db.AcademySessions.Where(x => x.TenantId == tenantId && (!hasBranchScope || x.BranchId == branchId));
    var upcoming = await sessions.Where(x => x.StartAt > DateTimeOffset.UtcNow && x.Status != "CANCELLED").OrderBy(x => x.StartAt).Take(5).Select(x => new { x.Id, x.SessionNumber, x.StartAt, x.Status }).ToListAsync(cancellationToken);
    return Results.Ok(new
    {
        data = new
        {
            students = await students.CountAsync(cancellationToken),
            activeEnrollments = await enrollments.CountAsync(x => x.Status == "ACTIVE", cancellationToken),
            upcomingSessions = await sessions.CountAsync(x => x.StartAt > DateTimeOffset.UtcNow && x.Status != "CANCELLED", cancellationToken),
            completedSessions = await sessions.CountAsync(x => x.Status == "COMPLETED", cancellationToken),
            branchCount = hasBranchScope ? 1 : await db.Branches.CountAsync(x => x.TenantId == tenantId && x.Status == "ACTIVE", cancellationToken),
            upcoming
        }
    });
}).RequireAuthorization("staff");

app.MapPost("/api/v1/scheduling/check-conflict", async (ConflictCheckRequest request, ConflictService conflicts, HttpContext context, CancellationToken cancellationToken) =>
{
    if (!context.User.IsInRole("R02_BRANCH_MANAGER") && !context.User.IsInRole("R03_HEAD_INSTRUCTORS"))
        return Results.Forbid();
    var result = await conflicts.CheckAsync(request, cancellationToken);
    return result.HasConflict
        ? Results.Conflict(new { error = new { code = "SCHEDULING_CONFLICT", details = result.Conflicts } })
        : Results.Ok(new { data = result });
}).RequireAuthorization("staff");

app.Run();

static bool IsEnabled(string name) => string.Equals(Environment.GetEnvironmentVariable(name), "true", StringComparison.OrdinalIgnoreCase);

public sealed record AuditInput(string Action, string TargetType, string TargetId, string? TenantId, string? BranchId, string? Reason);
public interface IAuditSink { Task AppendAsync(AuditInput input); }
public sealed class DevelopmentAuditSink : IAuditSink
{
    private readonly List<AuditInput> _events = [];
    public Task AppendAsync(AuditInput input) { _events.Add(input); return Task.CompletedTask; }
}

public static class StateTransitions
{
    public static bool IsAllowed(string from, string to) => (from, to) switch
    {
        ("DRAFT", "PENDING") => true,
        ("PENDING", "APPROVED") => true,
        ("PENDING", "REJECTED") => true,
        ("PENDING", "ESCALATED") => true,
        ("LOCKED", "CORRECTION_PENDING") => true,
        ("CORRECTION_PENDING", "APPROVED") => true,
        ("CORRECTION_PENDING", "REJECTED") => true,
        _ => false
    };
}

public static class DevTokenFingerprint
{
    public static string Sha256(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
