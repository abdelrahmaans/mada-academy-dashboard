using System.Threading.RateLimiting;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Modules.Competitions;
using MadaAcademy.Api.Modules.Finance;
using MadaAcademy.Api.Modules.Identity;
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
var developmentEndpointsEnabled = DevelopmentEndpointPolicy.ShouldEnable(
    builder.Environment.IsDevelopment(),
    builder.Configuration["MADA_ENABLE_DEV_ENDPOINTS"]);
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
builder.Services.AddMadaPersistence(builder.Configuration, builder.Environment);
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
builder.Services.AddCors(options =>
{
    void ConfigureCors(Microsoft.AspNetCore.Cors.Infrastructure.CorsPolicyBuilder policy)
    {
        var configuredOrigins = CorsOriginResolver.Resolve(builder.Environment.IsDevelopment(), builder.Configuration["MADA_CORS_ORIGINS"] ?? Environment.GetEnvironmentVariable("MADA_CORS_ORIGINS"));
        if (builder.Environment.IsDevelopment() && configuredOrigins.Length == 0)
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        else
            policy.WithOrigins(configuredOrigins).AllowAnyHeader().AllowAnyMethod();
    }

    options.AddDefaultPolicy(ConfigureCors);
    options.AddPolicy("frontend", ConfigureCors);
});

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
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/api/v1/health");
app.MapMadaAcademyIdentityEndpoints();
app.MapMadaConsumerIdentityEndpoints();
app.MapMadaConsumerInvitationEndpoints();
app.MapMadaRoleEndpoints();
app.MapMadaBranchEndpoints();
app.MapMadaBranchBulkImportEndpoints();
app.MapMadaStaffGuardianBulkImportEndpoints();
app.MapMadaCourseGroupBulkImportEndpoints();
app.MapMadaEnrollmentBulkImportEndpoints();
app.MapMadaClassroomEndpoints();
app.MapMadaClassroomResourceEndpoints();
app.MapMadaClassroomSchedulingEndpoints();
app.MapMadaSessionWorkflowEndpoints();
app.MapGroupSupervisionEndpoints();
app.MapMadaOperationalEndpoints();
app.MapMadaFreezeEndpoints();
app.MapMadaBulkImportEndpoints();
app.MapMadaLeadEndpoints();
app.MapMadaMarketingEndpoints();
app.MapMadaFinanceEndpoints();
app.MapMadaExecutiveDashboardEndpoints();
app.MapMadaBillingMeterEndpoints();
app.MapMadaInvoiceCorrectionEndpoints();
app.MapMadaExpenseEndpoints();
app.MapMadaPlatformAdminEndpoints();
app.MapMadaOperationalReportEndpoints();
app.MapMadaExcelReportEndpoints();
app.MapMadaCertificatePdfEndpoints();
app.MapMadaAnalyticsEndpoints();
app.MapMadaCompetitionEndpoints();
app.MapMadaTenantScopeEndpoints();
app.MapMadaDashboardSummaryEndpoints();
app.MapMadaSchedulingConflictEndpoints();

app.MapMadaAuthEndpoints();
if (developmentEndpointsEnabled)
{
    app.MapMadaDevelopmentAuthEndpoints();
    app.MapPost("/api/v1/dev/reset-and-seed", async (MadaDbContext db, CancellationToken cancellationToken) =>
    {
        await DemoDataSeeder.ResetAndSeedAsync(db, cancellationToken);
        return Results.Ok(new
        {
            success = true,
            message = "تم تصفية وتفريغ قاعدة البيانات وإعادة زرع البيانات التجريبية الشاملة بنجاح.",
            defaultPassword = "Mada@2026",
            logins = new[]
            {
                new { role = "R00_PLATFORM_ADMIN", phone = "+201000000001", name = "أ. عبد الرحمن شريف (مسؤول المنصة)" },
                new { role = "R01_ACADEMY_OWNER", phone = "+201000000002", name = "د. أحمد البشبيشي (مالك الأكاديمية)" },
                new { role = "R02_BRANCH_MANAGER", phone = "+201000000003", name = "م. كريم الشناوي (مدير فرع المعادي)" },
                new { role = "R03_HEAD_INSTRUCTORS", phone = "+201000000004", name = "م. مريم حسن (كبير المدربين)" },
                new { role = "R04_INSTRUCTOR", phone = "+201000000010", name = "ك. عمر سامح (مدرب الروبوتكس)" },
                new { role = "R04_SUBSTITUTE", phone = "+201000000013", name = "ك. يوسف عماد (مدرب البرمجة والبديل)" },
                new { role = "R05_SECRETARY", phone = "+201000000005", name = "أ. هبة محمود (سكرتارية المعادي)" },
                new { role = "R06_ACCOUNTANT", phone = "+201000000006", name = "أ. أحمد ممدوح (محاسب المعادي)" },
                new { role = "R07_MEDIA_MANAGER", phone = "+201000000007", name = "أ. سلمى عادل (مسؤول الميديا والتسويق)" },
                new { role = "R08_PARENT", phone = "+201000000011", name = "م. أحمد كمال (ولي أمر يوسف)" },
                new { role = "R09_STUDENT", phone = "+201000000012", name = "لينة عمر (طالبة)" }
            }
        });
    }).AllowAnonymous();
}

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

public partial class Program { }
