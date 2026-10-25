using System.Security.Claims;
using MadaAcademy.Api.Auth;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MadaAcademy.Api.Modules.Operations;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class BranchBulkImportEndpoints
{
    private const string PreviewAction = "BULK_IMPORT_BRANCH_PREVIEW_CREATED";
    private const string CommitAction = "BULK_IMPORT_BRANCH_COMMITTED";
    private const long MaxCsvBytes = 5 * 1024 * 1024;
    private static readonly TimeSpan PreviewLifetime = TimeSpan.FromHours(24);

    public static IEndpointRouteBuilder MapMadaBranchBulkImportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/imports/branches").RequireAuthorization("academy-owner");
        api.MapPost("/csv/preview", PreviewCsvAsync).RequirePermission("branch.create");
        api.MapPost("/commit", CommitAsync).RequirePermission("branch.create");
        return endpoints;
    }

    private static async Task<IResult> PreviewCsvAsync(HttpRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return Error(403, "MISSING_ACADEMY_SCOPE", "The authenticated account has no academy scope.");
        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = ["A non-empty CSV file is required."] });
        if (file.Length > MaxCsvBytes) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = ["CSV files are limited to 5 MB."] });
        if (!string.Equals(Path.GetExtension(file.FileName), ".csv", StringComparison.OrdinalIgnoreCase)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = ["Only .csv files are accepted."] });
        await using var input = file.OpenReadStream(); await using var buffer = new MemoryStream(); await input.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray(); var rows = Parse(bytes, out var parseErrors);
        if (parseErrors.Count > 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = parseErrors.ToArray() });
        if (rows.Count == 0 || rows.Count > 1000) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = ["The CSV must contain between 1 and 1000 branch rows."] });
        var existing = await db.Branches.AsNoTracking().Where(item => item.TenantId == tenantId).Select(item => new { item.Name, item.Code }).ToListAsync(cancellationToken);
        var existingCodes = existing.Select(item => item.Code.ToUpperInvariant()).ToHashSet(); var seenCodes = new HashSet<string>();
        var previewRows = rows.Select((row, index) =>
        {
            var errors = new List<string>(); var code = row.Code.Trim().ToUpperInvariant();
            if (row.Name.Trim().Length is < 2 or > 160) errors.Add("Name must be between 2 and 160 characters.");
            if (code.Length is < 2 or > 40 || !System.Text.RegularExpressions.Regex.IsMatch(code, "^[A-Z0-9_-]+$")) errors.Add("Code must contain only English letters, numbers, hyphen, or underscore.");
            if (!seenCodes.Add(code) || existingCodes.Contains(code)) errors.Add("Branch code already exists or appears more than once in this batch.");
            return new BranchImportPreviewRow(index + 1, row.Name.Trim(), code, errors.Count == 0 ? "CREATE" : "REVIEW", errors);
        }).ToArray();
        var source = new SourceFileIdentity(Path.GetFileName(file.FileName).Trim(), bytes.Length, Hash(bytes), DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.Add(PreviewLifetime));
        var previewId = Guid.NewGuid(); var previewHash = Hash(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(previewRows)));
        db.AuditEvents.Add(new AuditEvent { ActorUserId = Actor(principal), TenantId = tenantId, Action = PreviewAction, TargetType = "BULK_IMPORT_BRANCH_PREVIEW", TargetId = previewId.ToString(), Reason = "Branch CSV preview created; no records were written.", MetadataJson = JsonSerializer.Serialize(new StoredPreview(previewId, previewHash, "PREVIEWED", previewRows, source)) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new BranchImportPreviewResponse(previewId, previewHash, previewRows, previewRows.Count(item => item.Action == "CREATE"), previewRows.Count(item => item.Action == "REVIEW"), source) });
    }

    private static async Task<IResult> CommitAsync(BranchImportCommitRequest request, ClaimsPrincipal principal, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Tenant(principal, out var tenantId)) return Error(403, "MISSING_ACADEMY_SCOPE", "The authenticated account has no academy scope.");
        var preview = await db.AuditEvents.SingleOrDefaultAsync(item => item.TenantId == tenantId && item.Action == PreviewAction && item.TargetId == request.PreviewId.ToString(), cancellationToken);
        if (preview?.MetadataJson is null) return Error(404, "PREVIEW_NOT_FOUND", "The branch preview was not found.");
        var stored = JsonSerializer.Deserialize<StoredPreview>(preview.MetadataJson);
        if (stored is null || !string.Equals(stored.Hash, request.PreviewHash, StringComparison.Ordinal)) return Error(409, "PREVIEW_HASH_MISMATCH", "The preview hash does not match.");
        if (stored.Source.ExpiresAt <= DateTimeOffset.UtcNow) return Error(410, "PREVIEW_EXPIRED", "The branch CSV preview expired; upload it again.");
        if (!Matches(stored.Source, request.SourceFile)) return Error(409, "SOURCE_FILE_MISMATCH", "The commit must use the same CSV file identity.");
        if (stored.State != "PREVIEWED" || await db.AuditEvents.AnyAsync(item => item.TenantId == tenantId && item.Action == CommitAction && item.TargetId == request.PreviewId.ToString(), cancellationToken)) return Error(409, "PREVIEW_ALREADY_COMMITTED", "This preview has already been committed.");
        if (stored.Rows.Any(row => row.Action != "CREATE")) return Error(409, "PREVIEW_REQUIRES_REVIEW", "Resolve every REVIEW row before committing.");
        var existingCodes = (await db.Branches.AsNoTracking().Where(item => item.TenantId == tenantId).Select(item => item.Code).ToListAsync(cancellationToken)).Select(code => code.ToUpperInvariant()).ToHashSet();
        if (stored.Rows.Any(row => existingCodes.Contains(row.Code))) return Error(409, "PREVIEW_STALE", "A branch code changed after preview; create a fresh preview.");
        var branches = stored.Rows.Select(row => new Branch { TenantId = tenantId, Name = row.Name, Code = row.Code }).ToArray(); db.Branches.AddRange(branches);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = Actor(principal), TenantId = tenantId, Action = CommitAction, TargetType = "BULK_IMPORT_BRANCH_PREVIEW", TargetId = request.PreviewId.ToString(), Reason = "Branch CSV import committed after identity, expiry, and stale-data validation.", MetadataJson = JsonSerializer.Serialize(new { previewId = request.PreviewId, previewHash = stored.Hash, createdCount = branches.Length, state = "COMMITTED" }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { previewId = request.PreviewId, previewHash = stored.Hash, createdCount = branches.Length, state = "COMMITTED", branchIds = branches.Select(item => item.Id).ToArray() } });
    }

    private static List<BranchImportRow> Parse(byte[] bytes, out List<string> errors)
    {
        errors = []; var lines = Encoding.UTF8.GetString(bytes).TrimStart('\uFEFF').Split('\n').Select(line => line.TrimEnd('\r')).Where(line => !string.IsNullOrWhiteSpace(line)).ToArray();
        if (lines.Length < 2 || !lines[0].Split(',').Select(value => value.Trim().ToLowerInvariant()).SequenceEqual(new[] { "name", "code" })) { errors.Add("CSV header must be name,code."); return []; }
        var rows = new List<BranchImportRow>(); for (var i = 1; i < lines.Length; i++) { var columns = lines[i].Split(','); if (columns.Length != 2) { errors.Add($"Row {i + 1}: expected name,code."); continue; } rows.Add(new BranchImportRow(columns[0], columns[1])); } return rows;
    }
    private static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    private static bool Matches(SourceFileIdentity expected, SourceFileIdentity? actual) => actual is not null && expected.Name == actual.Name && expected.Size == actual.Size && expected.Hash == actual.Hash;
    private static bool Tenant(ClaimsPrincipal principal, out Guid tenantId) => Guid.TryParse(principal.FindFirstValue("tenantId"), out tenantId);
    private static Guid? Actor(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult Error(int status, string code, string message) => Results.Json(new { error = new { code, message } }, statusCode: status);
    private sealed record StoredPreview(Guid PreviewId, string Hash, string State, IReadOnlyList<BranchImportPreviewRow> Rows, SourceFileIdentity Source);
}

public sealed record BranchImportRow(string Name, string Code);
public sealed record BranchImportPreviewRow(int RowNumber, string Name, string Code, string Action, IReadOnlyList<string> Errors);
public sealed record BranchImportPreviewResponse(Guid PreviewId, string PreviewHash, IReadOnlyList<BranchImportPreviewRow> Rows, int CreateCount, int ReviewCount, SourceFileIdentity SourceFile);
public sealed record BranchImportCommitRequest(Guid PreviewId, string PreviewHash, SourceFileIdentity? SourceFile);
