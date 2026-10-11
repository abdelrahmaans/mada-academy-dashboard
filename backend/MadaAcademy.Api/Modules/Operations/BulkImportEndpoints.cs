using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Operations;

public static class BulkImportEndpoints
{
    private const string PreviewAction = "BULK_IMPORT_STUDENT_PREVIEW_CREATED";
    private const string CommitAction = "BULK_IMPORT_STUDENT_COMMITTED";

    public static IEndpointRouteBuilder MapMadaBulkImportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/imports").RequireAuthorization("staff");
        api.MapPost("/students/preview", PreviewStudentsAsync);
        api.MapPost("/students/commit", CommitStudentsAsync);
        return endpoints;
    }

    private static async Task<IResult> PreviewStudentsAsync(
        StudentImportPreviewRequest request,
        ClaimsPrincipal user,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        if (!CanImport(user)) return ImportForbidden();
        if (!TryScope(user, out var tenantId, out var branchScope)) return ScopeRequired();
        if (request.Rows is null || request.Rows.Count == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = ["At least one student row is required."] });
        if (request.Rows.Count > 1000) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = ["A preview is limited to 1000 rows. Split larger imports into batches."] });

        var branchIds = request.Rows.Select(row => row.BranchId ?? branchScope).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToArray();
        if (branchIds.Length == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["branchId"] = ["Every row needs a branchId when the account has no branch scope."] });
        if (branchScope.HasValue && branchIds.Any(id => id != branchScope.Value)) return BranchScopeDenied();

        var validBranches = await db.Branches.AsNoTracking()
            .Where(branch => branch.TenantId == tenantId && branch.Status == "ACTIVE" && branchIds.Contains(branch.Id))
            .Select(branch => branch.Id)
            .ToListAsync(cancellationToken);
        var existingKeys = (await db.Students.AsNoTracking()
                .Where(student => student.TenantId == tenantId && branchIds.Contains(student.BranchId))
                .Select(student => new { student.BranchId, student.FullName, student.DateOfBirth })
                .ToListAsync(cancellationToken))
            .Select(student => StudentKey(student.BranchId, student.FullName, student.DateOfBirth))
            .ToHashSet(StringComparer.Ordinal);

        var results = ValidateRows(request.Rows, branchScope, validBranches, existingKeys);
        var canonicalRows = JsonSerializer.Serialize(results);
        var previewHash = ComputeHash(canonicalRows);
        var previewId = Guid.NewGuid();
        var actorId = Actor(user);
        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = actorId,
            TenantId = tenantId,
            BranchId = branchScope,
            Action = PreviewAction,
            TargetType = "BULK_IMPORT_PREVIEW",
            TargetId = previewId.ToString(),
            Reason = "Student import preview created; no records were written.",
            MetadataJson = JsonSerializer.Serialize(new StoredPreview(previewId, previewHash, "PREVIEWED", results))
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { data = new StudentImportPreviewResponse(previewId, previewHash, results, results.Count(row => row.Action == "CREATE"), results.Count(row => row.Action == "REVIEW"), "PREVIEW_ONLY") });
    }

    private static async Task<IResult> CommitStudentsAsync(
        StudentImportCommitRequest request,
        ClaimsPrincipal user,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        if (!CanImport(user)) return ImportForbidden();
        if (!TryScope(user, out var tenantId, out var branchScope)) return ScopeRequired();
        if (request.PreviewId == Guid.Empty || string.IsNullOrWhiteSpace(request.PreviewHash))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["previewId"] = ["A previewId and previewHash from a completed preview are required."] });

        var preview = await db.AuditEvents.SingleOrDefaultAsync(item => item.TenantId == tenantId && item.Action == PreviewAction && item.TargetType == "BULK_IMPORT_PREVIEW" && item.TargetId == request.PreviewId.ToString(), cancellationToken);
        if (preview is null || string.IsNullOrWhiteSpace(preview.MetadataJson)) return Results.NotFound(new { error = new { code = "PREVIEW_NOT_FOUND", message = "The import preview was not found in the current tenant." } });
        if (branchScope.HasValue && preview.BranchId != branchScope) return BranchScopeDenied();

        var stored = JsonSerializer.Deserialize<StoredPreview>(preview.MetadataJson);
        if (stored is null || stored.PreviewId != request.PreviewId || !CryptographicEquals(stored.Hash, request.PreviewHash))
            return Results.Conflict(new { error = new { code = "PREVIEW_HASH_MISMATCH", message = "The supplied preview hash does not match the stored preview." } });
        if (stored.State != "PREVIEWED") return Results.Conflict(new { error = new { code = "PREVIEW_ALREADY_COMMITTED", message = "This preview has already been committed." } });
        if (await db.AuditEvents.AnyAsync(item => item.TenantId == tenantId && item.Action == CommitAction && item.TargetId == request.PreviewId.ToString(), cancellationToken))
            return Results.Conflict(new { error = new { code = "PREVIEW_ALREADY_COMMITTED", message = "This preview has already been committed." } });
        if (stored.Rows.Any(row => row.Action != "CREATE"))
            return Results.Conflict(new { error = new { code = "PREVIEW_REQUIRES_REVIEW", message = "Resolve every REVIEW row and create a fresh preview before committing." } });

        var branchIds = stored.Rows.Where(row => row.BranchId.HasValue).Select(row => row.BranchId!.Value).Distinct().ToArray();
        if (branchScope.HasValue && branchIds.Any(id => id != branchScope.Value)) return BranchScopeDenied();
        var validBranches = await db.Branches.AsNoTracking()
            .Where(branch => branch.TenantId == tenantId && branch.Status == "ACTIVE" && branchIds.Contains(branch.Id))
            .Select(branch => branch.Id)
            .ToListAsync(cancellationToken);
        if (stored.Rows.Any(row => !row.BranchId.HasValue || !validBranches.Contains(row.BranchId.Value)))
            return Results.Conflict(new { error = new { code = "PREVIEW_STALE", message = "One or more branches changed or left the current scope after preview." } });

        var existingKeys = (await db.Students.AsNoTracking()
                .Where(student => student.TenantId == tenantId && branchIds.Contains(student.BranchId))
                .Select(student => new { student.BranchId, student.FullName, student.DateOfBirth })
                .ToListAsync(cancellationToken))
            .Select(student => StudentKey(student.BranchId, student.FullName, student.DateOfBirth))
            .ToHashSet(StringComparer.Ordinal);
        var incomingKeys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var row in stored.Rows)
        {
            var key = StudentKey(row.BranchId!.Value, row.FullName, row.DateOfBirth);
            if (!incomingKeys.Add(key) || existingKeys.Contains(key))
                return Results.Conflict(new { error = new { code = "PREVIEW_STALE", message = "Student data changed after preview; create a fresh preview before committing." } });
        }

        var actorId = Actor(user);
        var students = stored.Rows.Select(row => new Student
        {
            TenantId = tenantId,
            BranchId = row.BranchId!.Value,
            FullName = row.FullName,
            DateOfBirth = row.DateOfBirth,
            Status = "ACTIVE"
        }).ToArray();
        db.Students.AddRange(students);
        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = actorId,
            TenantId = tenantId,
            BranchId = branchScope,
            Action = CommitAction,
            TargetType = "BULK_IMPORT_PREVIEW",
            TargetId = request.PreviewId.ToString(),
            Reason = "Student import committed after hash and stale-data validation.",
            MetadataJson = JsonSerializer.Serialize(new { previewId = request.PreviewId, previewHash = stored.Hash, createdCount = students.Length, state = "COMMITTED" })
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { data = new StudentImportCommitResponse(request.PreviewId, stored.Hash, students.Length, "COMMITTED", students.Select(student => student.Id).ToArray()) });
    }

    private static IReadOnlyList<StudentImportPreviewRow> ValidateRows(IReadOnlyList<StudentImportRow> rows, Guid? branchScope, IReadOnlyCollection<Guid> validBranches, IReadOnlySet<string> existingKeys)
    {
        var seenKeys = new HashSet<string>(StringComparer.Ordinal);
        var results = new List<StudentImportPreviewRow>(rows.Count);
        for (var index = 0; index < rows.Count; index++)
        {
            var row = rows[index];
            var branchId = row.BranchId ?? branchScope;
            var normalizedName = row.FullName?.Trim() ?? string.Empty;
            var errors = new List<string>();
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

    private static string StudentKey(Guid branchId, string fullName, DateOnly? dateOfBirth) => $"{branchId:N}|{fullName.Trim().ToUpperInvariant()}|{dateOfBirth?.ToString("yyyy-MM-dd") ?? ""}";
    private static string ComputeHash(string canonicalRows) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalRows))).ToLowerInvariant();
    private static bool CryptographicEquals(string left, string right) => left.Length == right.Length && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(left), Encoding.UTF8.GetBytes(right));
    private static bool CanImport(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R05_SECRETARY");
    private static Guid? Actor(ClaimsPrincipal user) => Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult ImportForbidden() => Results.Problem(statusCode: 403, title: "IMPORT_FORBIDDEN", detail: "Only academy owners, branch managers, and secretaries can import students.");
    private static IResult ScopeRequired() => Results.Problem(statusCode: 403, title: "TENANT_SCOPE_REQUIRED", detail: "The authenticated account has no tenant scope.");
    private static IResult BranchScopeDenied() => Results.Problem(statusCode: 403, title: "BRANCH_SCOPE_DENIED", detail: "A branch-scoped account cannot import rows for another branch.");
    private static bool TryScope(ClaimsPrincipal user, out Guid tenantId, out Guid? branchId)
    {
        var tenantOk = Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId);
        branchId = Guid.TryParse(user.FindFirstValue("branchId"), out var parsed) ? parsed : null;
        return tenantOk;
    }

    private sealed record StoredPreview(Guid PreviewId, string Hash, string State, IReadOnlyList<StudentImportPreviewRow> Rows);
}

public sealed record StudentImportPreviewRequest(IReadOnlyList<StudentImportRow>? Rows);
public sealed record StudentImportRow(string? FullName, DateOnly? DateOfBirth, Guid? BranchId = null);
public sealed record StudentImportPreviewRow(int RowNumber, Guid? BranchId, string FullName, DateOnly? DateOfBirth, string Action, IReadOnlyList<string> Errors);
public sealed record StudentImportPreviewResponse(Guid PreviewId, string PreviewHash, IReadOnlyList<StudentImportPreviewRow> Rows, int CreateCount, int ReviewCount, string Mode);
public sealed record StudentImportCommitRequest(Guid PreviewId, string? PreviewHash);
public sealed record StudentImportCommitResponse(Guid PreviewId, string PreviewHash, int CreatedCount, string State, IReadOnlyList<Guid> StudentIds);
