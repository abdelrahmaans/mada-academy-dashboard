using System.Security.Claims;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using MadaAcademy.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Finance;

public static class ExpenseEndpoints
{
    private static readonly HashSet<string> Categories = ["OPERATIONS", "SUPPLIES", "INSTRUCTOR_PAY", "EVENTS", "OTHER"];
    private static readonly HashSet<string> EvidenceTypes = ["application/pdf", "image/jpeg", "image/png"];
    private const long MaxEvidenceBytes = 10 * 1024 * 1024;

    public static IEndpointRouteBuilder MapMadaExpenseEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/finance/expenses").RequireAuthorization("staff");
        api.MapGet("", ListAsync);
        api.MapGet("/{expenseId:guid}", GetAsync);
        api.MapPost("", CreateAsync);
        api.MapPost("/{expenseId:guid}/approve", ApproveAsync);
        api.MapPost("/{expenseId:guid}/reject", RejectAsync);
        api.MapPost("/{expenseId:guid}/evidence", UploadEvidenceAsync);
        api.MapGet("/{expenseId:guid}/evidence", DownloadEvidenceAsync);
        return endpoints;
    }

    private static async Task<IResult> ListAsync(HttpContext context, MadaDbContext db, string? status, Guid? branchId, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error) || !CanRead(context.User)) return error ?? Forbidden("EXPENSE_READ_FORBIDDEN");
        var normalized = string.IsNullOrWhiteSpace(status) || status.Equals("ALL", StringComparison.OrdinalIgnoreCase) ? null : status.Trim().ToUpperInvariant();
        if (normalized is not null && normalized is not ("PENDING" or "APPROVED" or "REJECTED")) return Validation("status", "Status must be ALL, PENDING, APPROVED, or REJECTED.");
        if (branchId.HasValue && scope.BranchId.HasValue && branchId.Value != scope.BranchId.Value) return NotFound("EXPENSE_NOT_FOUND");
        var effectiveBranch = branchId ?? scope.BranchId;
        var expenses = await db.Expenses.AsNoTracking().Include(x => x.Evidence).Include(x => x.Branch)
            .Where(x => x.TenantId == scope.TenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch.Value) && (normalized == null || x.Status == normalized))
            .OrderByDescending(x => x.SpentOn).ThenByDescending(x => x.CreatedAt).Take(300).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = expenses.Select(ToResponse), total = expenses.Count } });
    }

    private static async Task<IResult> GetAsync(Guid expenseId, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error) || !CanRead(context.User)) return error ?? Forbidden("EXPENSE_READ_FORBIDDEN");
        var expense = await db.Expenses.AsNoTracking().Include(x => x.Evidence).Include(x => x.ApprovalRequest).Include(x => x.Branch)
            .SingleOrDefaultAsync(x => x.Id == expenseId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        return expense is null ? NotFound("EXPENSE_NOT_FOUND") : Results.Ok(new { data = ToResponse(expense) });
    }

    private static async Task<IResult> CreateAsync(CreateExpenseRequest request, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error) || !CanWrite(context.User)) return error ?? Forbidden("EXPENSE_WRITE_FORBIDDEN");
        if (!scope.BranchId.HasValue) return Validation("branchId", "An expense must belong to a branch.");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");
        if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Trim().Length > 500) return Validation("description", "Description is required and must be at most 500 characters.");
        var category = request.Category?.Trim().ToUpperInvariant() ?? "";
        if (!Categories.Contains(category)) return Validation("category", "Category must be OPERATIONS, SUPPLIES, INSTRUCTOR_PAY, EVENTS, or OTHER.");
        if (request.AmountPiastres <= 0) return Validation("amountPiastres", "Amount must be positive.");
        if (request.AmountPiastres > int.MaxValue) return Validation("amountPiastres", "Amount is too large.");
        if (request.SpentOn > DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1))) return Validation("spentOn", "Spent date cannot be in the future.");
        if (!await db.Branches.AnyAsync(x => x.Id == scope.BranchId.Value && x.TenantId == scope.TenantId && x.Status == "ACTIVE", cancellationToken)) return NotFound("BRANCH_NOT_FOUND");
        var approval = new ApprovalRequest { TenantId = scope.TenantId, BranchId = scope.BranchId, RequestType = "EXPENSE_APPROVAL", TargetType = "EXPENSE", TargetId = Guid.NewGuid().ToString(), SubmittedByRole = context.User.FindFirstValue("role") ?? "STAFF", State = "PENDING", Reason = request.Note?.Trim() };
        var expense = new Expense { TenantId = scope.TenantId, BranchId = scope.BranchId.Value, Description = request.Description.Trim(), Category = category, AmountPiastres = request.AmountPiastres, SpentOn = request.SpentOn ?? DateOnly.FromDateTime(DateTime.UtcNow), Status = "PENDING", CreatedByUserId = actorId, ApprovalRequest = approval };
        approval.TargetId = expense.Id.ToString();
        db.Expenses.Add(expense);
        db.ApprovalRequests.Add(approval);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = scope.TenantId, BranchId = scope.BranchId, Action = "EXPENSE_SUBMITTED", TargetType = "EXPENSE", TargetId = expense.Id.ToString(), Reason = request.Note, MetadataJson = JsonSerializer.Serialize(new { expense.AmountPiastres, expense.Category }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/finance/expenses/{expense.Id}", new { data = ToResponse(expense) });
    }

    private static async Task<IResult> ApproveAsync(Guid expenseId, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
        => await DecideAsync(expenseId, true, null, context, db, cancellationToken);

    private static async Task<IResult> RejectAsync(Guid expenseId, RejectExpenseRequest request, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
        => await DecideAsync(expenseId, false, request.Reason, context, db, cancellationToken);

    private static async Task<IResult> DecideAsync(Guid expenseId, bool approve, string? reason, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error) || !CanApprove(context.User)) return error ?? Forbidden("EXPENSE_APPROVAL_FORBIDDEN");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");
        if (!approve && (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 500)) return Validation("reason", "A rejection reason is required and must be at most 500 characters.");
        var expense = await db.Expenses.Include(x => x.ApprovalRequest).SingleOrDefaultAsync(x => x.Id == expenseId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        if (expense?.ApprovalRequest is null || expense.Status != "PENDING" || expense.ApprovalRequest.State != "PENDING") return NotFound("EXPENSE_NOT_FOUND");
        if (expense.CreatedByUserId == actorId) return Conflict("EXPENSE_MAKER_CHECKER_REQUIRED");
        var next = approve ? "APPROVED" : "REJECTED";
        expense.Status = next;
        expense.ApprovalRequest.State = next;
        expense.ApprovalRequest.DecidedByUserId = actorId;
        expense.ApprovalRequest.DecidedAt = DateTimeOffset.UtcNow;
        expense.ApprovalRequest.Reason = reason?.Trim() ?? expense.ApprovalRequest.Reason;
        db.StateTransitions.Add(new StateTransitionEvent { AggregateType = "EXPENSE", AggregateId = expense.Id.ToString(), FromState = "PENDING", ToState = next, ActorUserId = actorId, Reason = reason });
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = expense.TenantId, BranchId = expense.BranchId, Action = $"EXPENSE_{next}", TargetType = "EXPENSE", TargetId = expense.Id.ToString(), Reason = reason });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = ToResponse(expense) });
    }

    private static async Task<IResult> UploadEvidenceAsync(Guid expenseId, HttpContext context, MadaDbContext db, IPrivateObjectStorage storage, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error) || !CanWrite(context.User)) return error ?? Forbidden("EXPENSE_EVIDENCE_FORBIDDEN");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");
        var expense = await db.Expenses.Include(x => x.Evidence).SingleOrDefaultAsync(x => x.Id == expenseId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        if (expense is null) return NotFound("EXPENSE_NOT_FOUND");
        if (expense.Evidence is not null) return Conflict("EVIDENCE_ALREADY_ATTACHED");
        var form = await context.Request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return Validation("file", "A file is required.");
        if (file.Length > MaxEvidenceBytes || !EvidenceTypes.Contains(file.ContentType.ToLowerInvariant())) return Validation("file", "Only PDF, JPG, and PNG files up to 10 MB are allowed.");
        await using var input = file.OpenReadStream();
        var stored = await storage.PutAsync(input, file.ContentType.ToLowerInvariant(), file.Length, cancellationToken);
        var evidence = new ExpenseEvidence { ExpenseId = expense.Id, StorageKey = stored.Key, DisplayFileName = SafeFileName(file.FileName), ContentType = stored.ContentType, SizeBytes = stored.SizeBytes, Sha256 = stored.Sha256, UploadedByUserId = actorId };
        db.ExpenseEvidences.Add(evidence);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = expense.TenantId, BranchId = expense.BranchId, Action = "EXPENSE_EVIDENCE_ATTACHED", TargetType = "EXPENSE", TargetId = expense.Id.ToString(), MetadataJson = JsonSerializer.Serialize(new { stored.ContentType, stored.SizeBytes, stored.Sha256 }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { expenseId, status = "ATTACHED", fileName = evidence.DisplayFileName, contentType = stored.ContentType, sizeBytes = stored.SizeBytes } });
    }

    private static async Task<IResult> DownloadEvidenceAsync(Guid expenseId, HttpContext context, MadaDbContext db, IPrivateObjectStorage storage, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error) || !CanRead(context.User)) return error ?? Forbidden("EXPENSE_READ_FORBIDDEN");
        var expense = await db.Expenses.AsNoTracking().Include(x => x.Evidence).SingleOrDefaultAsync(x => x.Id == expenseId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        if (expense?.Evidence is null) return NotFound("EVIDENCE_NOT_FOUND");
        var stream = await storage.OpenReadAsync(expense.Evidence.StorageKey, cancellationToken);
        return stream is null ? NotFound("EVIDENCE_NOT_FOUND") : Results.File(stream, expense.Evidence.ContentType, expense.Evidence.DisplayFileName, enableRangeProcessing: true);
    }

    private static object ToResponse(Expense expense) => new { id = expense.Id, tenantId = expense.TenantId, branchId = expense.BranchId, branchName = expense.Branch?.Name, description = expense.Description, category = expense.Category, amountPiastres = expense.AmountPiastres, spentOn = expense.SpentOn, status = expense.Status, createdByUserId = expense.CreatedByUserId, approvalRequestId = expense.ApprovalRequestId ?? expense.ApprovalRequest?.Id, approvalReason = expense.ApprovalRequest?.Reason, decidedAt = expense.ApprovalRequest?.DecidedAt, decidedByUserId = expense.ApprovalRequest?.DecidedByUserId, evidenceStatus = expense.Evidence is null ? "NOT_ATTACHED" : "ATTACHED", evidenceFileName = expense.Evidence?.DisplayFileName };
    private static bool CanRead(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R05_SECRETARY") || user.IsInRole("R06_ACCOUNTANT");
    private static bool CanWrite(ClaimsPrincipal user) => user.IsInRole("R05_SECRETARY") || user.IsInRole("R06_ACCOUNTANT");
    private static bool CanApprove(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R06_ACCOUNTANT");
    private static bool TryScope(ClaimsPrincipal user, out ExpenseScope scope, out IResult? error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId)) { scope = default; error = Forbidden("TENANT_SCOPE_REQUIRED"); return false; }
        var branch = Guid.TryParse(user.FindFirstValue("branchId"), out var branchId) ? branchId : (Guid?)null;
        scope = new ExpenseScope(tenantId, branch); error = null; return true;
    }
    private static IResult NotFound(string code) => Results.NotFound(new { error = new { code, message = "The requested expense was not found in the current scope." } });
    private static IResult Forbidden(string code) => Results.Problem(statusCode: 403, title: code, extensions: new Dictionary<string, object?> { ["code"] = code });
    private static IResult Conflict(string code) => Results.Conflict(new { error = new { code, message = "The expense operation could not be completed." } });
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
    private static string SafeFileName(string name) => Path.GetFileName(name).Replace("\"", "", StringComparison.Ordinal).Trim() switch { { Length: > 0 } safe => safe.Length > 180 ? safe[..180] : safe, _ => "evidence" };
    private readonly record struct ExpenseScope(Guid TenantId, Guid? BranchId);
}

public sealed record CreateExpenseRequest(string Description, string Category, int AmountPiastres, DateOnly? SpentOn = null, string? Note = null);
public sealed record RejectExpenseRequest(string Reason);
