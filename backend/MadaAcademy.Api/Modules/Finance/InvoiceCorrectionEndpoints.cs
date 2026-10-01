using System.Security.Claims;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Finance;

public static class InvoiceCorrectionEndpoints
{
    public static IEndpointRouteBuilder MapMadaInvoiceCorrectionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/finance").RequireAuthorization("staff");
        api.MapGet("/invoice-corrections", ListAsync);
        api.MapPost("/invoices/{invoiceId:guid}/correction-requests", CreateAsync);
        api.MapPost("/invoice-corrections/{correctionId:guid}/decision", DecideAsync);
        return endpoints;
    }

    private static async Task<IResult> ListAsync(HttpContext context, MadaDbContext db, string? state, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error)) return error;
        if (!CanRead(context.User)) return Forbidden("INVOICE_CORRECTION_READ_FORBIDDEN");
        var normalized = string.IsNullOrWhiteSpace(state) || state.Equals("ALL", StringComparison.OrdinalIgnoreCase) ? null : state.Trim().ToUpperInvariant();
        if (normalized is not null && normalized is not ("PENDING" or "APPROVED" or "REJECTED")) return Validation("state", "State must be ALL, PENDING, APPROVED, or REJECTED.");
        var requests = await db.InvoiceCorrectionRequests.AsNoTracking()
            .Include(x => x.Invoice).ThenInclude(x => x!.Student)
            .Where(x => x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value) && (normalized == null || x.Status == normalized))
            .OrderByDescending(x => x.CreatedAt).Take(200).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = requests.Select(ToResponse), total = requests.Count } });
    }

    private static async Task<IResult> CreateAsync(Guid invoiceId, CreateInvoiceCorrectionRequest request, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error)) return error;
        if (!CanRequest(context.User)) return Forbidden("INVOICE_CORRECTION_REQUEST_FORBIDDEN");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length > 1000) return Validation("reason", "A correction reason is required and must be at most 1000 characters.");
        if (request.ProposedDueDate < DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))) return Validation("proposedDueDate", "Due date cannot be in the past.");
        var invoice = await db.Invoices.Include(x => x.Lines).Include(x => x.Payments)
            .SingleOrDefaultAsync(x => x.Id == invoiceId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        if (invoice is null) return NotFound("INVOICE_NOT_FOUND");
        if (await db.InvoiceCorrectionRequests.AnyAsync(x => x.InvoiceId == invoiceId && x.Status == "PENDING", cancellationToken)) return Conflict("INVOICE_CORRECTION_ALREADY_PENDING");
        if (request.Lines is null || request.Lines.Count == 0 || request.Lines.Count > 30) return Validation("lines", "At least one and at most 30 correction lines are required.");
        var lines = request.Lines.Select((line, index) => new InvoiceCorrectionLine(line.Description?.Trim() ?? "", line.AmountPiastres)).ToList();
        if (lines.Any(x => string.IsNullOrWhiteSpace(x.Description) || x.Description.Length > 240 || x.AmountPiastres <= 0)) return Validation("lines", "Every line needs a description and a positive amount.");
        var proposedTotal = lines.Sum(x => (long)x.AmountPiastres);
        var paid = invoice.Payments.Sum(x => (long)x.AmountPiastres);
        if (proposedTotal <= 0 || proposedTotal > int.MaxValue) return Validation("lines", "Correction total is invalid or too large.");
        if (proposedTotal < paid) return Conflict("CORRECTION_BELOW_PAID_AMOUNT");
        if (proposedTotal == invoice.TotalPiastres && request.ProposedDueDate == invoice.DueDate) return Conflict("CORRECTION_HAS_NO_CHANGE");
        var approval = new ApprovalRequest { TenantId = invoice.TenantId, BranchId = invoice.BranchId, RequestType = "INVOICE_CORRECTION", TargetType = "INVOICE_CORRECTION", TargetId = Guid.NewGuid().ToString(), SubmittedByRole = context.User.FindFirstValue("role") ?? "STAFF", State = "PENDING", Reason = request.Reason.Trim() };
        var correction = new InvoiceCorrectionRequest { TenantId = invoice.TenantId, BranchId = invoice.BranchId, InvoiceId = invoice.Id, ApprovalRequestId = approval.Id, RequestedByUserId = actorId, CurrentTotalPiastres = invoice.TotalPiastres, CurrentDueDate = invoice.DueDate, ProposedTotalPiastres = (int)proposedTotal, ProposedDueDate = request.ProposedDueDate, ProposedLinesJson = JsonSerializer.Serialize(lines), Reason = request.Reason.Trim(), ApprovalRequest = approval };
        approval.TargetId = correction.Id.ToString();
        db.InvoiceCorrectionRequests.Add(correction);
        db.ApprovalRequests.Add(approval);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = invoice.TenantId, BranchId = invoice.BranchId, Action = "INVOICE_CORRECTION_REQUESTED", TargetType = "INVOICE", TargetId = invoice.Id.ToString(), Reason = correction.Reason, MetadataJson = JsonSerializer.Serialize(new { correction.Id, correction.CurrentTotalPiastres, correction.ProposedTotalPiastres }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/finance/invoice-corrections/{correction.Id}", new { data = ToResponse(correction) });
    }

    private static async Task<IResult> DecideAsync(Guid correctionId, DecideInvoiceCorrectionRequest request, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryScope(context.User, out var scope, out var error)) return error;
        if (request.Decision is not ("APPROVED" or "REJECTED")) return Validation("decision", "Decision must be APPROVED or REJECTED.");
        if (request.Decision == "REJECTED" && (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length > 1000)) return Validation("reason", "A rejection reason is required and must be at most 1000 characters.");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");
        var correction = await db.InvoiceCorrectionRequests.Include(x => x.ApprovalRequest).Include(x => x.Invoice).ThenInclude(x => x!.Lines).Include(x => x.Invoice).ThenInclude(x => x!.Payments)
            .SingleOrDefaultAsync(x => x.Id == correctionId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        if (correction?.ApprovalRequest is null || correction.Invoice is null || correction.Status != "PENDING" || correction.ApprovalRequest.State != "PENDING") return NotFound("INVOICE_CORRECTION_NOT_FOUND");
        if (correction.RequestedByUserId == actorId) return Conflict("INVOICE_CORRECTION_MAKER_CHECKER_REQUIRED");
        if (!CanDecide(context.User)) return Forbidden("INVOICE_CORRECTION_DECISION_FORBIDDEN");
        var next = request.Decision;
        correction.Status = next;
        correction.ApprovalRequest.State = next;
        correction.DecidedByUserId = actorId;
        correction.DecidedAt = DateTimeOffset.UtcNow;
        correction.ApprovalRequest.DecidedByUserId = actorId;
        correction.ApprovalRequest.DecidedAt = correction.DecidedAt;
        correction.ApprovalRequest.Reason = request.Reason?.Trim() ?? correction.ApprovalRequest.Reason;
        if (next == "APPROVED")
        {
            var paid = correction.Invoice.Payments.Sum(x => (long)x.AmountPiastres);
            if (paid > correction.ProposedTotalPiastres) return Conflict("CORRECTION_BELOW_PAID_AMOUNT");
            var lines = JsonSerializer.Deserialize<List<InvoiceCorrectionLine>>(correction.ProposedLinesJson) ?? [];
            var existingLines = correction.Invoice.Lines.OrderBy(x => x.LineNumber).ToList();
            for (var index = 0; index < lines.Count; index++)
            {
                var line = lines[index];
                if (index < existingLines.Count)
                {
                    existingLines[index].LineNumber = index + 1;
                    existingLines[index].Description = line.Description;
                    existingLines[index].AmountPiastres = line.AmountPiastres;
                }
                else
                {
                    db.InvoiceLines.Add(new InvoiceLine { InvoiceId = correction.Invoice.Id, LineNumber = index + 1, Description = line.Description, AmountPiastres = line.AmountPiastres });
                }
            }
            if (existingLines.Count > lines.Count) db.InvoiceLines.RemoveRange(existingLines.Skip(lines.Count));
            correction.Invoice.TotalPiastres = correction.ProposedTotalPiastres;
            correction.Invoice.DueDate = correction.ProposedDueDate;
            correction.Invoice.Status = paid >= correction.Invoice.TotalPiastres ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
        }
        db.StateTransitions.Add(new StateTransitionEvent { AggregateType = "INVOICE_CORRECTION", AggregateId = correction.Id.ToString(), FromState = "PENDING", ToState = next, ActorUserId = actorId, Reason = request.Reason?.Trim() });
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = correction.TenantId, BranchId = correction.BranchId, Action = $"INVOICE_CORRECTION_{next}", TargetType = "INVOICE", TargetId = correction.InvoiceId.ToString(), Reason = request.Reason?.Trim(), MetadataJson = JsonSerializer.Serialize(new { correction.Id, correction.ProposedTotalPiastres, correction.ProposedDueDate }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = ToResponse(correction) });
    }

    private static object ToResponse(InvoiceCorrectionRequest request) => new
    {
        id = request.Id, tenantId = request.TenantId, branchId = request.BranchId, invoiceId = request.InvoiceId,
        invoiceNumber = request.Invoice?.InvoiceNumber, studentName = request.Invoice?.Student?.FullName,
        approvalRequestId = request.ApprovalRequestId, requestedByUserId = request.RequestedByUserId,
        currentTotalPiastres = request.CurrentTotalPiastres, currentDueDate = request.CurrentDueDate,
        proposedTotalPiastres = request.ProposedTotalPiastres, proposedDueDate = request.ProposedDueDate,
        reason = request.Reason, status = request.Status, decidedAt = request.DecidedAt, decidedByUserId = request.DecidedByUserId,
        createdAt = request.CreatedAt
    };

    private static bool CanRead(ClaimsPrincipal user) => CanRequest(user) || CanDecide(user);
    private static bool CanRequest(ClaimsPrincipal user) => user.IsInRole("R05_SECRETARY") || user.IsInRole("R06_ACCOUNTANT");
    private static bool CanDecide(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER");
    private static bool TryScope(ClaimsPrincipal user, out StaffScope scope, out IResult error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId)) { scope = default; error = Forbidden("TENANT_SCOPE_REQUIRED"); return false; }
        var branch = Guid.TryParse(user.FindFirstValue("branchId"), out var branchId) ? branchId : (Guid?)null;
        scope = new StaffScope(tenantId, branch); error = Results.Ok(); return true;
    }
    private static IResult NotFound(string code) => Results.NotFound(new { error = new { code, message = "The requested correction was not found in the current scope." } });
    private static IResult Forbidden(string code) => Results.Problem(statusCode: 403, title: code, extensions: new Dictionary<string, object?> { ["code"] = code });
    private static IResult Conflict(string code) => Results.Conflict(new { error = new { code, message = "The invoice correction could not be completed." } });
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
    private readonly record struct StaffScope(Guid TenantId, Guid? BranchId);
}

public sealed record CreateInvoiceCorrectionRequest(DateOnly ProposedDueDate, IReadOnlyList<InvoiceCorrectionLineRequest> Lines, string Reason);
public sealed record InvoiceCorrectionLineRequest(string Description, int AmountPiastres);
public sealed record DecideInvoiceCorrectionRequest(string Decision, string? Reason = null);
