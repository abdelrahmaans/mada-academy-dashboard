using System.Globalization;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Operations;

public static class BulkImportEndpoints
{
    private const string PreviewAction = "BULK_IMPORT_STUDENT_PREVIEW_CREATED";
    private const string CommitAction = "BULK_IMPORT_STUDENT_COMMITTED";
    private const long MaxCsvBytes = 5 * 1024 * 1024;
    private static readonly TimeSpan PreviewLifetime = TimeSpan.FromHours(24);

    public static IEndpointRouteBuilder MapMadaBulkImportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/imports").RequireAuthorization("staff");
        api.MapPost("/students/preview", PreviewStudentsAsync);
        api.MapPost("/students/csv/preview", PreviewStudentsCsvAsync);
        api.MapPost("/students/commit", CommitStudentsAsync);
        return endpoints;
    }

    private static async Task<IResult> PreviewStudentsAsync(StudentImportPreviewRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        await CreatePreviewAsync(request.Rows, null, user, db, cancellationToken);

    private static async Task<IResult> PreviewStudentsCsvAsync(HttpRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanImport(user)) return ImportForbidden();
        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = ["A non-empty CSV file is required."] });
        if (file.Length > MaxCsvBytes) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = [$"CSV files are limited to {MaxCsvBytes / (1024 * 1024)} MB."] });
        if (!string.Equals(Path.GetExtension(file.FileName), ".csv", StringComparison.OrdinalIgnoreCase)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = ["Only .csv files are accepted."] });

        await using var input = file.OpenReadStream();
        await using var buffer = new MemoryStream();
        await input.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray();
        var fileHash = ComputeHash(bytes);
        var fileName = Path.GetFileName(file.FileName).Trim();
        if (!CsvStudentParser.TryParse(bytes, out var rows, out var errors))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = errors.ToArray() });

        var uploadedAt = DateTimeOffset.UtcNow;
        var source = new SourceFileIdentity(fileName, bytes.Length, fileHash, uploadedAt, uploadedAt.Add(PreviewLifetime));
        return await CreatePreviewAsync(rows, source, user, db, cancellationToken);
    }

    private static async Task<IResult> CreatePreviewAsync(IReadOnlyList<StudentImportRow>? rows, SourceFileIdentity? source, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanImport(user)) return ImportForbidden();
        if (!TryScope(user, out var tenantId, out var branchScope)) return ScopeRequired();
        if (rows is null || rows.Count == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = ["At least one student row is required."] });
        if (rows.Count > 1000) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = ["A preview is limited to 1000 rows. Split larger imports into batches."] });

        var branchIds = rows.Select(row => row.BranchId ?? branchScope).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToArray();
        if (branchIds.Length == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["branchId"] = ["Every row needs a branchId when the account has no branch scope."] });
        if (branchScope.HasValue && branchIds.Any(id => id != branchScope.Value)) return BranchScopeDenied();

        var validBranches = await db.Branches.AsNoTracking().Where(branch => branch.TenantId == tenantId && branch.Status == "ACTIVE" && branchIds.Contains(branch.Id)).Select(branch => branch.Id).ToListAsync(cancellationToken);
        var existingKeys = (await db.Students.AsNoTracking().Where(student => student.TenantId == tenantId && branchIds.Contains(student.BranchId)).Select(student => new { student.BranchId, student.FullName, student.DateOfBirth }).ToListAsync(cancellationToken)).Select(student => StudentKey(student.BranchId, student.FullName, student.DateOfBirth)).ToHashSet(StringComparer.Ordinal);
        var results = ValidateRows(rows, branchScope, validBranches, existingKeys);
        var canonicalRows = JsonSerializer.Serialize(results);
        var previewHash = ComputeHash(Encoding.UTF8.GetBytes(canonicalRows));
        var previewId = Guid.NewGuid();
        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = Actor(user), TenantId = tenantId, BranchId = branchScope, Action = PreviewAction, TargetType = "BULK_IMPORT_PREVIEW", TargetId = previewId.ToString(),
            Reason = source is null ? "Student import preview created; no records were written." : "Student CSV import preview created; no records were written.",
            MetadataJson = JsonSerializer.Serialize(new StoredPreview(previewId, previewHash, "PREVIEWED", results, source))
        });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new StudentImportPreviewResponse(previewId, previewHash, results, results.Count(row => row.Action == "CREATE"), results.Count(row => row.Action == "REVIEW"), "PREVIEW_ONLY", source) });
    }

    private static async Task<IResult> CommitStudentsAsync(StudentImportCommitRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanImport(user)) return ImportForbidden();
        if (!TryScope(user, out var tenantId, out var branchScope)) return ScopeRequired();
        if (request.PreviewId == Guid.Empty || string.IsNullOrWhiteSpace(request.PreviewHash)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["previewId"] = ["A previewId and previewHash from a completed preview are required."] });

        var preview = await db.AuditEvents.SingleOrDefaultAsync(item => item.TenantId == tenantId && item.Action == PreviewAction && item.TargetType == "BULK_IMPORT_PREVIEW" && item.TargetId == request.PreviewId.ToString(), cancellationToken);
        if (preview is null || string.IsNullOrWhiteSpace(preview.MetadataJson)) return Error(404, "PREVIEW_NOT_FOUND", "The import preview was not found in the current tenant.");
        if (branchScope.HasValue && preview.BranchId != branchScope) return BranchScopeDenied();
        var stored = JsonSerializer.Deserialize<StoredPreview>(preview.MetadataJson);
        if (stored is null || stored.PreviewId != request.PreviewId || !CryptographicEquals(stored.Hash, request.PreviewHash)) return Error(409, "PREVIEW_HASH_MISMATCH", "The supplied preview hash does not match the stored preview.");
        if (stored.SourceFile is not null)
        {
            if (stored.SourceFile.ExpiresAt <= DateTimeOffset.UtcNow) return Error(410, "PREVIEW_EXPIRED", "The CSV preview expired. Upload the file again to create a fresh preview.");
            if (!MatchesSourceFile(stored.SourceFile, request.SourceFile)) return Error(409, "SOURCE_FILE_MISMATCH", "The commit must include the same CSV file name, size, and hash used for preview.");
        }
        if (stored.State != "PREVIEWED" || await db.AuditEvents.AnyAsync(item => item.TenantId == tenantId && item.Action == CommitAction && item.TargetId == request.PreviewId.ToString(), cancellationToken)) return Error(409, "PREVIEW_ALREADY_COMMITTED", "This preview has already been committed.");
        if (stored.Rows.Any(row => row.Action != "CREATE")) return Error(409, "PREVIEW_REQUIRES_REVIEW", "Resolve every REVIEW row and create a fresh preview before committing.");

        var branchIds = stored.Rows.Where(row => row.BranchId.HasValue).Select(row => row.BranchId!.Value).Distinct().ToArray();
        if (branchScope.HasValue && branchIds.Any(id => id != branchScope.Value)) return BranchScopeDenied();
        var validBranches = await db.Branches.AsNoTracking().Where(branch => branch.TenantId == tenantId && branch.Status == "ACTIVE" && branchIds.Contains(branch.Id)).Select(branch => branch.Id).ToListAsync(cancellationToken);
        if (stored.Rows.Any(row => !row.BranchId.HasValue || !validBranches.Contains(row.BranchId.Value))) return Error(409, "PREVIEW_STALE", "One or more branches changed or left the current scope after preview.");
        var existingKeys = (await db.Students.AsNoTracking().Where(student => student.TenantId == tenantId && branchIds.Contains(student.BranchId)).Select(student => new { student.BranchId, student.FullName, student.DateOfBirth }).ToListAsync(cancellationToken)).Select(student => StudentKey(student.BranchId, student.FullName, student.DateOfBirth)).ToHashSet(StringComparer.Ordinal);
        var incomingKeys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var row in stored.Rows)
        {
            var key = StudentKey(row.BranchId!.Value, row.FullName, row.DateOfBirth);
            if (!incomingKeys.Add(key) || existingKeys.Contains(key)) return Error(409, "PREVIEW_STALE", "Student data changed after preview; create a fresh preview before committing.");
        }

        var students = stored.Rows.Select(row => new Student { TenantId = tenantId, BranchId = row.BranchId!.Value, FullName = row.FullName, DateOfBirth = row.DateOfBirth, Status = "ACTIVE" }).ToArray();
        db.Students.AddRange(students);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = Actor(user), TenantId = tenantId, BranchId = branchScope, Action = CommitAction, TargetType = "BULK_IMPORT_PREVIEW", TargetId = request.PreviewId.ToString(), Reason = "Student import committed after hash, source-file, expiry, and stale-data validation.", MetadataJson = JsonSerializer.Serialize(new { previewId = request.PreviewId, previewHash = stored.Hash, sourceFile = stored.SourceFile, createdCount = students.Length, state = "COMMITTED" }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new StudentImportCommitResponse(request.PreviewId, stored.Hash, students.Length, "COMMITTED", students.Select(student => student.Id).ToArray()) });
    }

    private static IReadOnlyList<StudentImportPreviewRow> ValidateRows(IReadOnlyList<StudentImportRow> rows, Guid? branchScope, IReadOnlyCollection<Guid> validBranches, IReadOnlySet<string> existingKeys)
    {
        var seenKeys = new HashSet<string>(StringComparer.Ordinal);
        var results = new List<StudentImportPreviewRow>(rows.Count);
        for (var index = 0; index < rows.Count; index++)
        {
            var row = rows[index]; var branchId = row.BranchId ?? branchScope; var normalizedName = row.FullName?.Trim() ?? string.Empty; var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 160) errors.Add("Full name is required and must be at most 160 characters.");
            if (branchId is null || !validBranches.Contains(branchId.Value)) errors.Add("The branch is missing, outside the current scope, or inactive.");
            if (row.DateOfBirth.HasValue && row.DateOfBirth.Value > DateOnly.FromDateTime(DateTime.UtcNow)) errors.Add("Date of birth cannot be in the future.");
            var key = branchId.HasValue ? StudentKey(branchId.Value, normalizedName, row.DateOfBirth) : string.Empty;
            if (key.Length > 0 && existingKeys.Contains(key)) errors.Add("A student with the same name, date of birth, and branch already exists.");
            if (key.Length > 0 && !seenKeys.Add(key)) errors.Add("The same student appears more than once in this import batch.");
            results.Add(new StudentImportPreviewRow(index + 1, branchId, normalizedName, row.DateOfBirth, errors.Count == 0 ? "CREATE" : "REVIEW", errors));
        }
        return results;
    }

    private static bool MatchesSourceFile(SourceFileIdentity expected, SourceFileIdentity? actual) => actual is not null && expected.Name == actual.Name && expected.Size == actual.Size && CryptographicEquals(expected.Hash, actual.Hash);
    private static string StudentKey(Guid branchId, string fullName, DateOnly? dateOfBirth) => $"{branchId:N}|{fullName.Trim().ToUpperInvariant()}|{dateOfBirth?.ToString("yyyy-MM-dd") ?? ""}";
    private static string ComputeHash(byte[] content) => Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
    private static bool CryptographicEquals(string left, string right) => left.Length == right.Length && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(left), Encoding.UTF8.GetBytes(right));
    private static bool CanImport(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R05_SECRETARY");
    private static Guid? Actor(ClaimsPrincipal user) => Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult ImportForbidden() => Error(403, "IMPORT_FORBIDDEN", "Only academy owners, branch managers, and secretaries can import students.");
    private static IResult ScopeRequired() => Error(403, "TENANT_SCOPE_REQUIRED", "The authenticated account has no tenant scope.");
    private static IResult BranchScopeDenied() => Error(403, "BRANCH_SCOPE_DENIED", "A branch-scoped account cannot import rows for another branch.");
    private static IResult Error(int status, string code, string message) => Results.Json(new { error = new { code, message } }, statusCode: status);
    private static bool TryScope(ClaimsPrincipal user, out Guid tenantId, out Guid? branchId) { var tenantOk = Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId); branchId = Guid.TryParse(user.FindFirstValue("branchId"), out var parsed) ? parsed : null; return tenantOk; }

    private sealed record StoredPreview(Guid PreviewId, string Hash, string State, IReadOnlyList<StudentImportPreviewRow> Rows, SourceFileIdentity? SourceFile);
}

internal static class CsvStudentParser
{
    public static bool TryParse(byte[] bytes, out IReadOnlyList<StudentImportRow> rows, out IReadOnlyList<string> errors)
    {
        rows = []; var messages = new List<string>();
        var text = Encoding.UTF8.GetString(bytes).TrimStart('\uFEFF');
        var records = ParseRecords(text);
        if (records.Count == 0) { errors = ["CSV file is empty."]; return false; }
        var header = records[0].Select(value => value.Trim().ToLowerInvariant()).ToArray();
        if (!header.Contains("fullname")) messages.Add("CSV header must include fullName.");
        if (!header.Contains("dateofbirth")) messages.Add("CSV header must include dateOfBirth.");
        if (!header.Contains("branchid")) messages.Add("CSV header must include branchId.");
        if (messages.Count > 0) { errors = messages; return false; }
        var fullNameIndex = Array.IndexOf(header, "fullname"); var dateIndex = Array.IndexOf(header, "dateofbirth"); var branchIndex = Array.IndexOf(header, "branchid");
        var parsed = new List<StudentImportRow>();
        for (var i = 1; i < records.Count; i++)
        {
            var record = records[i]; if (record.All(string.IsNullOrWhiteSpace)) continue;
            var rowNumber = i + 1; var fullName = Value(record, fullNameIndex); var dateText = Value(record, dateIndex); var branchText = Value(record, branchIndex); DateOnly? date = null; Guid? branch = null;
            if (!string.IsNullOrWhiteSpace(dateText))
            {
                if (DateOnly.TryParseExact(dateText, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate)) date = parsedDate;
                else messages.Add($"Row {rowNumber}: dateOfBirth must use yyyy-MM-dd.");
            }
            if (!string.IsNullOrWhiteSpace(branchText))
            {
                if (Guid.TryParse(branchText, out var parsedBranch)) branch = parsedBranch;
                else messages.Add($"Row {rowNumber}: branchId must be a GUID.");
            }
            parsed.Add(new StudentImportRow(fullName, date, branch));
        }
        rows = parsed; errors = messages; return messages.Count == 0;
    }

    private static string Value(IReadOnlyList<string> record, int index) => index < record.Count ? record[index].Trim() : string.Empty;
    private static List<List<string>> ParseRecords(string text)
    {
        var records = new List<List<string>>(); var record = new List<string>(); var value = new StringBuilder(); var quoted = false;
        for (var i = 0; i < text.Length; i++)
        {
            var ch = text[i];
            if (ch == '"') { if (quoted && i + 1 < text.Length && text[i + 1] == '"') { value.Append('"'); i++; } else quoted = !quoted; continue; }
            if (!quoted && ch == ',') { record.Add(value.ToString()); value.Clear(); continue; }
            if (!quoted && (ch == '\n' || ch == '\r')) { if (ch == '\r' && i + 1 < text.Length && text[i + 1] == '\n') i++; record.Add(value.ToString()); value.Clear(); records.Add(record); record = []; continue; }
            value.Append(ch);
        }
        if (value.Length > 0 || record.Count > 0) { record.Add(value.ToString()); records.Add(record); }
        return records;
    }
}

public sealed record StudentImportPreviewRequest(IReadOnlyList<StudentImportRow>? Rows);
public sealed record StudentImportRow(string? FullName, DateOnly? DateOfBirth, Guid? BranchId = null);
public sealed record StudentImportPreviewRow(int RowNumber, Guid? BranchId, string FullName, DateOnly? DateOfBirth, string Action, IReadOnlyList<string> Errors);
public sealed record SourceFileIdentity(string Name, long Size, string Hash, DateTimeOffset UploadedAt, DateTimeOffset ExpiresAt);
public sealed record StudentImportPreviewResponse(Guid PreviewId, string PreviewHash, IReadOnlyList<StudentImportPreviewRow> Rows, int CreateCount, int ReviewCount, string Mode, SourceFileIdentity? SourceFile);
public sealed record StudentImportCommitRequest(Guid PreviewId, string? PreviewHash, SourceFileIdentity? SourceFile = null);
public sealed record StudentImportCommitResponse(Guid PreviewId, string PreviewHash, int CreatedCount, string State, IReadOnlyList<Guid> StudentIds);
