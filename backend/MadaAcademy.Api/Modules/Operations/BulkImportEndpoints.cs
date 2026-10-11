using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Operations;

public static class BulkImportEndpoints
{
    public static IEndpointRouteBuilder MapMadaBulkImportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/imports").RequireAuthorization("staff");
        api.MapPost("/students/preview", PreviewStudentsAsync);
        return endpoints;
    }

    private static async Task<IResult> PreviewStudentsAsync(
        StudentImportPreviewRequest request,
        ClaimsPrincipal user,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        if (!CanImport(user)) return Results.Problem(statusCode: 403, title: "IMPORT_FORBIDDEN", detail: "Only academy owners, branch managers, and secretaries can preview student imports.");
        if (!TryScope(user, out var tenantId, out var branchScope)) return Results.Problem(statusCode: 403, title: "TENANT_SCOPE_REQUIRED", detail: "The authenticated account has no tenant scope.");
        if (request.Rows is null || request.Rows.Count == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = ["At least one student row is required."] });
        if (request.Rows.Count > 1000) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rows"] = ["A preview is limited to 1000 rows. Split larger imports into batches."] });

        var branchIds = request.Rows.Select(row => row.BranchId ?? branchScope).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToArray();
        if (branchIds.Length == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["branchId"] = ["Every row needs a branchId when the account has no branch scope."] });
        if (branchScope.HasValue && branchIds.Any(id => id != branchScope.Value)) return Results.Problem(statusCode: 403, title: "BRANCH_SCOPE_DENIED", detail: "A branch-scoped account cannot preview rows for another branch.");

        var validBranches = await db.Branches.AsNoTracking()
            .Where(branch => branch.TenantId == tenantId && branch.Status == "ACTIVE" && branchIds.Contains(branch.Id))
            .Select(branch => branch.Id)
            .ToListAsync(cancellationToken);
        var existingStudents = await db.Students.AsNoTracking()
            .Where(student => student.TenantId == tenantId && branchIds.Contains(student.BranchId))
            .Select(student => new { student.BranchId, student.FullName, student.DateOfBirth })
            .ToListAsync(cancellationToken);

        var existingKeys = existingStudents
            .Select(student => StudentKey(student.BranchId, student.FullName, student.DateOfBirth))
            .ToHashSet(StringComparer.Ordinal);
        var seenKeys = new HashSet<string>(StringComparer.Ordinal);
        var results = new List<StudentImportPreviewRow>(request.Rows.Count);

        for (var index = 0; index < request.Rows.Count; index++)
        {
            var row = request.Rows[index];
            var rowNumber = index + 1;
            var errors = new List<string>();
            var branchId = row.BranchId ?? branchScope;
            var normalizedName = row.FullName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 160) errors.Add("Full name is required and must be at most 160 characters.");
            if (branchId is null || !validBranches.Contains(branchId.Value)) errors.Add("The branch is missing, outside the current scope, or inactive.");
            if (row.DateOfBirth.HasValue && row.DateOfBirth.Value > DateOnly.FromDateTime(DateTime.UtcNow)) errors.Add("Date of birth cannot be in the future.");

            var key = branchId.HasValue ? StudentKey(branchId.Value, normalizedName, row.DateOfBirth) : string.Empty;
            var duplicateExisting = key.Length > 0 && existingKeys.Contains(key);
            var duplicateBatch = key.Length > 0 && !seenKeys.Add(key);
            if (duplicateExisting) errors.Add("A student with the same name, date of birth, and branch already exists.");
            if (duplicateBatch) errors.Add("The same student appears more than once in this import batch.");

            results.Add(new StudentImportPreviewRow(rowNumber, branchId, normalizedName, row.DateOfBirth, errors.Count == 0 ? "CREATE" : "REVIEW", errors));
        }

        return Results.Ok(new { data = new StudentImportPreviewResponse(results, results.Count(row => row.Action == "CREATE"), results.Count(row => row.Action == "REVIEW"), "PREVIEW_ONLY") });
    }

    private static string StudentKey(Guid branchId, string fullName, DateOnly? dateOfBirth) => $"{branchId:N}|{fullName.Trim().ToUpperInvariant()}|{dateOfBirth?.ToString("yyyy-MM-dd") ?? ""}";
    private static bool CanImport(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R05_SECRETARY");
    private static bool TryScope(ClaimsPrincipal user, out Guid tenantId, out Guid? branchId)
    {
        var tenantOk = Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId);
        branchId = Guid.TryParse(user.FindFirstValue("branchId"), out var parsed) ? parsed : null;
        return tenantOk;
    }
}

public sealed record StudentImportPreviewRequest(IReadOnlyList<StudentImportRow>? Rows);
public sealed record StudentImportRow(string? FullName, DateOnly? DateOfBirth, Guid? BranchId = null);
public sealed record StudentImportPreviewRow(int RowNumber, Guid? BranchId, string FullName, DateOnly? DateOfBirth, string Action, IReadOnlyList<string> Errors);
public sealed record StudentImportPreviewResponse(IReadOnlyList<StudentImportPreviewRow> Rows, int CreateCount, int ReviewCount, string Mode);
