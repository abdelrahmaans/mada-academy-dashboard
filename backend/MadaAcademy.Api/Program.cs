using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Modules.Identity;
using MadaAcademy.Api.Modules.Finance;
using MadaAcademy.Api.Modules.Operations;
using MadaAcademy.Api.Modules.Platform;
using MadaAcademy.Api.Modules.Reports;
using MadaAcademy.Api.Modules.Scheduling;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using MadaAcademy.Api.Persistence.Seeding;
using MadaAcademy.Api.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);
var jwtOptions = JwtOptions.Load(builder.Configuration, builder.Environment);
var authSecurityOptions = AuthSecurityOptions.Load(builder.Configuration);
var rateLimitTopology = RateLimitTopologyOptions.Load(builder.Configuration, builder.Environment);
var trustedProxyAddresses = LoadTrustedProxyAddresses(builder.Configuration);

builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("password-login", context => RateLimitPartition.GetFixedWindowLimiter(
        GetClientAddress(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = authSecurityOptions.LoginPermitLimit,
            Window = TimeSpan.FromSeconds(authSecurityOptions.LoginWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("auth-sensitive", context => RateLimitPartition.GetFixedWindowLimiter(
        GetClientAddress(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = authSecurityOptions.SensitivePermitLimit,
            Window = TimeSpan.FromSeconds(authSecurityOptions.SensitiveWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("consumer-lookup", context => RateLimitPartition.GetFixedWindowLimiter(
        GetClientAddress(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = authSecurityOptions.ConsumerLookupPermitLimit,
            Window = TimeSpan.FromSeconds(authSecurityOptions.ConsumerLookupWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("public-lead", context => RateLimitPartition.GetFixedWindowLimiter(
        GetClientAddress(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
    foreach (var address in trustedProxyAddresses)
        options.KnownProxies.Add(address);
});
builder.Services.AddMadaPersistence(builder.Configuration);
var storageMode = builder.Configuration["Mada:PrivateStorageMode"] ?? Environment.GetEnvironmentVariable("MADA_PRIVATE_STORAGE_MODE") ?? (builder.Environment.IsDevelopment() ? "local" : "disabled");
builder.Services.AddHttpClient<SupabasePrivateObjectStorage>();
if (string.Equals(storageMode, "supabase", StringComparison.OrdinalIgnoreCase)) builder.Services.AddSingleton<IPrivateObjectStorage, SupabasePrivateObjectStorage>();
else if (string.Equals(storageMode, "local", StringComparison.OrdinalIgnoreCase) && builder.Environment.IsDevelopment()) builder.Services.AddSingleton<IPrivateObjectStorage, LocalPrivateObjectStorage>();
else builder.Services.AddSingleton<IPrivateObjectStorage, UnavailablePrivateObjectStorage>();
builder.Services.AddMadaAuthentication(jwtOptions);
builder.Services.AddSingleton(authSecurityOptions);
builder.Services.AddSingleton(rateLimitTopology);
if (builder.Environment.IsDevelopment()) builder.Services.AddSingleton<ISmsMessageSender, DevelopmentSmsMessageSender>();
else builder.Services.AddSingleton<ISmsMessageSender, UnconfiguredSmsMessageSender>();
builder.Services.AddScoped<ConflictService>();
builder.Services.AddSingleton<IAuditSink, DevelopmentAuditSink>();
builder.Services.AddCors(options => options.AddPolicy("frontend", policy =>
{
    var configuredOrigins = CorsOriginResolver.Resolve(builder.Environment.IsDevelopment(), builder.Configuration["MADA_CORS_ORIGINS"] ?? Environment.GetEnvironmentVariable("MADA_CORS_ORIGINS"));
    if (builder.Environment.IsDevelopment() && configuredOrigins.Length == 0)
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    else
        policy.WithOrigins(configuredOrigins).AllowAnyHeader().AllowAnyMethod();
}));

var app = builder.Build();

var seedDemoData = IsEnabled("MADA_SEED_DEMO_DATA");
if (seedDemoData && !app.Environment.IsDevelopment())
    throw new InvalidOperationException("MADA_SEED_DEMO_DATA is only allowed in the Development environment.");

if (IsEnabled("MADA_APPLY_MIGRATIONS") || seedDemoData)
{
    await using var scope = app.Services.CreateAsyncScope();
    var database = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
    if (database.Database.IsRelational())
        await database.Database.MigrateAsync();
    if (seedDemoData)
        await DemoDataSeeder.SeedAsync(database);
}

app.UseExceptionHandler();
app.UseForwardedHeaders();
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/api/v1/health");
app.MapMadaAcademyIdentityEndpoints();
app.MapMadaConsumerIdentityEndpoints();
app.MapMadaConsumerInvitationEndpoints();
app.MapMadaRoleEndpoints();
app.MapMadaBranchEndpoints();
app.MapMadaClassroomEndpoints();
app.MapMadaClassroomResourceEndpoints();
app.MapMadaClassroomSchedulingEndpoints();
app.MapMadaSessionWorkflowEndpoints();
app.MapGroupSupervisionEndpoints();
app.MapMadaOperationalEndpoints();
app.MapMadaLeadEndpoints();
app.MapMadaFinanceEndpoints();
app.MapMadaExecutiveDashboardEndpoints();
app.MapMadaInvoiceCorrectionEndpoints();
app.MapMadaExpenseEndpoints();
app.MapMadaPlatformAdminEndpoints();
app.MapMadaOperationalReportEndpoints();

app.MapMadaAuthEndpoints();
if (app.Environment.IsDevelopment())
    app.MapMadaDevelopmentAuthEndpoints();

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
    if (!context.User.IsInRole("R01_ACADEMY_OWNER") && !context.User.IsInRole("R02_BRANCH_MANAGER")) return Results.Forbid();
    if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId)) return Results.Problem(statusCode: 403, title: "Missing tenant scope");
    var hasBranchScope = context.User.IsInRole("R02_BRANCH_MANAGER");
    var branchId = Guid.TryParse(context.User.FindFirstValue("branchId"), out var parsedBranchId) ? parsedBranchId : (Guid?)null;
    if (hasBranchScope && !branchId.HasValue) return Results.Forbid();
    var scopedBranchId = branchId.GetValueOrDefault();
    var students = db.Students.Where(x => x.TenantId == tenantId && (!hasBranchScope || x.BranchId == scopedBranchId));
    var enrollments = db.StudentEnrollments.Where(x => x.StudentId != Guid.Empty).Join(students, x => x.StudentId, x => x.Id, (enrollment, _) => enrollment);
    var sessions = db.AcademySessions.Where(x => x.TenantId == tenantId && (!hasBranchScope || x.BranchId == scopedBranchId));
    var upcoming = await sessions.Where(x => x.StartAt > DateTimeOffset.UtcNow && x.Status != "CANCELLED").OrderBy(x => x.StartAt).Take(5).Select(x => new { x.Id, x.SessionNumber, x.StartAt, x.Status }).ToListAsync(cancellationToken);
    return Results.Ok(new { data = new { students = await students.CountAsync(cancellationToken), activeEnrollments = await enrollments.CountAsync(x => x.Status == "ACTIVE", cancellationToken), upcomingSessions = await sessions.CountAsync(x => x.StartAt > DateTimeOffset.UtcNow && x.Status != "CANCELLED", cancellationToken), completedSessions = await sessions.CountAsync(x => x.Status == "COMPLETED", cancellationToken), branchCount = hasBranchScope ? 1 : await db.Branches.CountAsync(x => x.TenantId == tenantId && x.Status == "ACTIVE", cancellationToken), upcoming } });
}).RequireAuthorization("staff");

app.MapPost("/api/v1/scheduling/check-conflict", async (ConflictCheckRequest request, ConflictService conflicts, HttpContext context, MadaDbContext db, CancellationToken cancellationToken) =>
{
    var isTenantScoped = context.User.IsInRole("R01_ACADEMY_OWNER");
    var isBranchScoped = context.User.IsInRole("R02_BRANCH_MANAGER") || context.User.IsInRole("R03_HEAD_INSTRUCTORS");
    if (!isTenantScoped && !isBranchScoped) return Results.Forbid();
    if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId)) return Results.Forbid();
    if (isBranchScoped && (!Guid.TryParse(context.User.FindFirstValue("branchId"), out var claimedBranchId) || claimedBranchId != request.BranchId))
        return Results.Problem(statusCode: 403, title: "Branch scope denied", extensions: new Dictionary<string, object?> { ["code"] = "BRANCH_SCOPE_DENIED" });
    if (!await db.Branches.AnyAsync(branch => branch.Id == request.BranchId && branch.TenantId == tenantId && branch.Status == "ACTIVE", cancellationToken))
        return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "الفرع غير موجود داخل الأكاديمية." } });
    var result = await conflicts.CheckAsync(request, cancellationToken);
    return result.HasConflict ? Results.Conflict(new { error = new { code = "SCHEDULING_CONFLICT", details = result.Conflicts } }) : Results.Ok(new { data = result });
}).RequireAuthorization("staff");

app.Run();

static bool IsEnabled(string name) => string.Equals(Environment.GetEnvironmentVariable(name), "true", StringComparison.OrdinalIgnoreCase);
static IReadOnlyList<System.Net.IPAddress> LoadTrustedProxyAddresses(IConfiguration configuration)
{
    var raw = configuration["MADA_TRUSTED_PROXIES"] ?? Environment.GetEnvironmentVariable("MADA_TRUSTED_PROXIES");
    if (string.IsNullOrWhiteSpace(raw)) return [];

    var addresses = new List<System.Net.IPAddress>();
    foreach (var value in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    {
        if (!System.Net.IPAddress.TryParse(value, out var address))
            throw new InvalidOperationException($"MADA_TRUSTED_PROXIES contains an invalid IP address: '{value}'.");
        addresses.Add(address);
    }
    return addresses;
}
static string GetClientAddress(HttpContext context) => context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
public sealed record AuditInput(string Action, string TargetType, string TargetId, string? TenantId, string? BranchId, string? Reason);
public interface IAuditSink { Task AppendAsync(AuditInput input); }
public sealed class DevelopmentAuditSink : IAuditSink { private readonly List<AuditInput> _events = []; public Task AppendAsync(AuditInput input) { _events.Add(input); return Task.CompletedTask; } }
public static class StateTransitions
{
    public static bool IsAllowed(string from, string to) => (from, to) switch
    {
        ("DRAFT", "PENDING") => true, ("PENDING", "APPROVED") => true, ("PENDING", "REJECTED") => true, ("PENDING", "ESCALATED") => true, ("LOCKED", "CORRECTION_PENDING") => true, ("CORRECTION_PENDING", "APPROVED") => true, ("CORRECTION_PENDING", "REJECTED") => true, _ => false
    };
}
public static class DevTokenFingerprint { public static string Sha256(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant(); }

public partial class Program { }
