using System.Security.Cryptography;
using System.Text;
using MadaAcademy.Api.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddMadaPersistence(builder.Configuration);
builder.Services.AddSingleton<IAuditSink, DevelopmentAuditSink>();

var app = builder.Build();
app.UseExceptionHandler();
app.MapHealthChecks("/api/v1/health");
app.MapGet("/api/v1/diagnostics/persistence", (IConfiguration configuration) =>
{
    var configured = !string.IsNullOrWhiteSpace(configuration.GetConnectionString("Default"))
        || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DATABASE_URL"));
    return Results.Ok(new { data = new { provider = "postgresql", configured, migrations = "InitialIdentityAndGovernance_created_not_applied" } });
});

app.MapGet("/api/v1/me", (HttpRequest request) =>
{
    var authorization = request.Headers.Authorization.ToString();
    if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        return Results.Problem(statusCode: 401, title: "Authentication required", extensions: new Dictionary<string, object?> { ["code"] = "UNAUTHORIZED" });

    return Results.Ok(new { data = new { message = "Auth contract placeholder: JWT/OTP is the next milestone" } });
});

if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/v1/audit/dev", async (AuditInput input, IAuditSink sink) =>
    {
        await sink.AppendAsync(input);
        return Results.Accepted(value: new { data = input, mode = "development-only" });
    });
}

app.Run();

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
