using System.Data;
using System.Security.Claims;
using System.Text.Json;
using System.Text;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using MadaAcademy.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Finance;

public static class FinanceEndpoints
{
    private static readonly HashSet<string> PaymentMethods = ["CASH", "VISA", "INSTAPAY", "VODAFONE_CASH"];
    private static readonly SemaphoreSlim InMemoryPaymentGate = new(1, 1);
    private static readonly HashSet<string> EvidenceTypes = ["application/pdf", "image/jpeg", "image/png"];
    private const long MaxEvidenceBytes = 10 * 1024 * 1024;

    public static IEndpointRouteBuilder MapMadaFinanceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/finance").RequireAuthorization("staff");
        api.MapGet("/invoices", ListInvoicesAsync);
        api.MapGet("/reports/summary", ReportsSummaryAsync);
        api.MapGet("/reports/summary.csv", ReportsCsvAsync);
        api.MapGet("/invoices/{invoiceId:guid}", GetInvoiceAsync);
        api.MapPost("/invoices", CreateInvoiceAsync);
        api.MapPost("/invoices/{invoiceId:guid}/payments", CreatePaymentAsync);
        api.MapPost("/payments/{paymentId:guid}/evidence", UploadEvidenceAsync);
        api.MapGet("/payments/{paymentId:guid}/evidence", DownloadEvidenceAsync);

        endpoints.MapGet("/api/v1/consumer/invoices", ListConsumerInvoicesAsync).RequireAuthorization("consumer");
        return endpoints;
    }

    private static async Task<IResult> ListInvoicesAsync(HttpContext context, MadaDbContext db, string? query, string? status, Guid? studentId, CancellationToken cancellationToken)
    {
        if (!TryStaffScope(context.User, out var scope, out var error)) return error;
        if (!CanReadInvoices(context.User)) return Forbidden("INVOICE_READ_FORBIDDEN");
        var invoices = await db.Invoices.AsNoTracking()
            .Include(x => x.Student).Include(x => x.Payments).Include(x => x.Lines)
            .Where(x => x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value))
            .Where(x => !studentId.HasValue || x.StudentId == studentId.Value)
            .Where(x => string.IsNullOrWhiteSpace(status) || x.Status == status!.Trim().ToUpperInvariant())
            .Where(x => string.IsNullOrWhiteSpace(query) || x.InvoiceNumber.Contains(query!) || x.Student!.FullName.Contains(query!))
            .OrderByDescending(x => x.IssueDate).ThenByDescending(x => x.CreatedAt).Take(200).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = invoices.Select(ToResponse), total = invoices.Count } });
    }

    private static async Task<IResult> GetInvoiceAsync(Guid invoiceId, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryStaffScope(context.User, out var scope, out var error)) return error;
        if (!CanReadInvoices(context.User)) return Forbidden("INVOICE_READ_FORBIDDEN");
        var invoice = await db.Invoices.AsNoTracking().Include(x => x.Student).Include(x => x.Payments).ThenInclude(x => x.Evidence).Include(x => x.Lines)
            .SingleOrDefaultAsync(x => x.Id == invoiceId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        return invoice is null ? NotFound("INVOICE_NOT_FOUND") : Results.Ok(new { data = ToResponse(invoice) });
    }

    private static async Task<IResult> CreateInvoiceAsync(CreateInvoiceRequest request, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryStaffScope(context.User, out var scope, out var error)) return error;
        if (!CanWriteInvoices(context.User)) return Forbidden("INVOICE_CREATE_FORBIDDEN");
        if (request.Lines is null || request.Lines.Count == 0 || request.Lines.Count > 30) return Validation("lines", "At least one and at most 30 invoice lines are required.");
        if (request.DueDate < DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))) return Validation("dueDate", "Due date cannot be in the past.");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");
        var student = await db.Students.SingleOrDefaultAsync(x => x.Id == request.StudentId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value) && x.Status == "ACTIVE", cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");
        StudentEnrollment? enrollment = null;
        if (request.EnrollmentId.HasValue)
        {
            enrollment = await db.StudentEnrollments.SingleOrDefaultAsync(x => x.Id == request.EnrollmentId.Value && x.StudentId == student.Id, cancellationToken);
            if (enrollment is null) return NotFound("ENROLLMENT_NOT_FOUND");
        }
        var lines = request.Lines.Select((line, index) => new InvoiceLine { LineNumber = index + 1, Description = line.Description.Trim(), AmountPiastres = line.AmountPiastres }).ToList();
        if (lines.Any(x => string.IsNullOrWhiteSpace(x.Description) || x.Description.Length > 240 || x.AmountPiastres <= 0)) return Validation("lines", "Every line needs a description and a positive amount.");
        var total = lines.Sum(x => (long)x.AmountPiastres);
        if (total > int.MaxValue) return Validation("lines", "Invoice total is too large.");
        var invoice = new Invoice { TenantId = scope.TenantId, BranchId = student.BranchId, StudentId = student.Id, EnrollmentId = enrollment?.Id, InvoiceNumber = await NextInvoiceNumberAsync(db, student.BranchId, cancellationToken), TotalPiastres = (int)total, IssueDate = DateOnly.FromDateTime(DateTime.UtcNow), DueDate = request.DueDate, CreatedByUserId = actorId, Lines = lines };
        db.Invoices.Add(invoice);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = scope.TenantId, BranchId = student.BranchId, Action = "INVOICE_CREATED", TargetType = "INVOICE", TargetId = invoice.Id.ToString(), MetadataJson = JsonSerializer.Serialize(new { invoice.TotalPiastres, invoice.StudentId }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/finance/invoices/{invoice.Id}", new { data = ToResponse(invoice) });
    }

    private static async Task<IResult> CreatePaymentAsync(Guid invoiceId, CreatePaymentRequest request, HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryStaffScope(context.User, out var scope, out var error)) return error;
        if (!CanWritePayments(context.User)) return Forbidden("PAYMENT_CREATE_FORBIDDEN");
        if (!PaymentMethods.Contains(request.Method?.Trim().ToUpperInvariant() ?? "")) return Validation("method", "Method must be CASH, VISA, INSTAPAY, or VODAFONE_CASH.");
        if (request.AmountPiastres <= 0) return Validation("amountPiastres", "Payment amount must be positive.");
        if (request.ExternalReference?.Length > 120 || request.Note?.Length > 500) return Validation("payment", "Reference or note is too long.");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");

        await InMemoryPaymentGate.WaitAsync(cancellationToken);
        try
        {
            if (db.Database.IsRelational())
            {
                await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
                var result = await SavePaymentAsync(invoiceId, request, scope, actorId, db, cancellationToken);
                if (result is not null) return result;
                await transaction.CommitAsync(cancellationToken);
            }
            else
            {
                var result = await SavePaymentAsync(invoiceId, request, scope, actorId, db, cancellationToken);
                if (result is not null) return result;
            }
        }
        finally { InMemoryPaymentGate.Release(); }
        var payment = await db.PaymentTransactions.AsNoTracking().Include(x => x.Evidence).Where(x => x.RecordedByUserId == actorId && x.InvoiceId == invoiceId).OrderByDescending(x => x.CreatedAt).FirstAsync(cancellationToken);
        return Results.Created($"/api/v1/finance/payments/{payment.Id}", new { data = new { payment = ToPaymentResponse(payment), invoiceId } });
    }

    private static async Task<IResult?> SavePaymentAsync(Guid invoiceId, CreatePaymentRequest request, StaffScope scope, Guid actorId, MadaDbContext db, CancellationToken cancellationToken)
    {
        var invoice = await db.Invoices.Include(x => x.Payments).SingleOrDefaultAsync(x => x.Id == invoiceId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        if (invoice is null) return NotFound("INVOICE_NOT_FOUND");
        var paid = invoice.Payments.Sum(x => (long)x.AmountPiastres);
        if (paid + request.AmountPiastres > invoice.TotalPiastres) return Conflict("PAYMENT_EXCEEDS_BALANCE");
        var payment = new PaymentTransaction { TenantId = invoice.TenantId, BranchId = invoice.BranchId, InvoiceId = invoice.Id, AmountPiastres = request.AmountPiastres, Method = request.Method.Trim().ToUpperInvariant(), ReceivedOn = request.ReceivedOn ?? DateOnly.FromDateTime(DateTime.UtcNow), ExternalReference = request.ExternalReference?.Trim(), Note = request.Note?.Trim(), RecordedByUserId = actorId };
        invoice.Status = paid + request.AmountPiastres == invoice.TotalPiastres ? "PAID" : "PARTIAL";
        db.PaymentTransactions.Add(payment);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = invoice.TenantId, BranchId = invoice.BranchId, Action = "PAYMENT_RECORDED", TargetType = "PAYMENT", TargetId = payment.Id.ToString(), MetadataJson = JsonSerializer.Serialize(new { payment.AmountPiastres, payment.Method, invoice.Id }) });
        await db.SaveChangesAsync(cancellationToken);
        return null;
    }

    private static async Task<IResult> UploadEvidenceAsync(Guid paymentId, HttpContext context, MadaDbContext db, IPrivateObjectStorage storage, CancellationToken cancellationToken)
    {
        if (!TryStaffScope(context.User, out var scope, out var error)) return error;
        if (!CanReadEvidence(context.User)) return Forbidden("EVIDENCE_UPLOAD_FORBIDDEN");
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var actorId)) return Forbidden("ACTOR_REQUIRED");
        var payment = await db.PaymentTransactions.Include(x => x.Evidence).SingleOrDefaultAsync(x => x.Id == paymentId && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
        if (payment is null) return NotFound("PAYMENT_NOT_FOUND");
        if (payment.Evidence is not null) return Conflict("EVIDENCE_ALREADY_ATTACHED");
        var form = await context.Request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return Validation("file", "A file is required.");
        if (file.Length > MaxEvidenceBytes || !EvidenceTypes.Contains(file.ContentType.ToLowerInvariant())) return Validation("file", "Only PDF, JPG, and PNG files up to 10 MB are allowed.");
        await using var input = file.OpenReadStream();
        var stored = await storage.PutAsync(input, file.ContentType.ToLowerInvariant(), file.Length, cancellationToken);
        var evidence = new PaymentEvidence { PaymentTransactionId = payment.Id, StorageKey = stored.Key, DisplayFileName = SafeFileName(file.FileName), ContentType = stored.ContentType, SizeBytes = stored.SizeBytes, Sha256 = stored.Sha256, UploadedByUserId = actorId };
        db.PaymentEvidences.Add(evidence);
        db.AuditEvents.Add(new AuditEvent { ActorUserId = actorId, TenantId = payment.TenantId, BranchId = payment.BranchId, Action = "PAYMENT_EVIDENCE_ATTACHED", TargetType = "PAYMENT", TargetId = payment.Id.ToString(), MetadataJson = JsonSerializer.Serialize(new { stored.ContentType, stored.SizeBytes, stored.Sha256 }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { paymentId, status = "ATTACHED", fileName = evidence.DisplayFileName, contentType = stored.ContentType, sizeBytes = stored.SizeBytes } });
    }

    private static async Task<IResult> DownloadEvidenceAsync(Guid paymentId, HttpContext context, MadaDbContext db, IPrivateObjectStorage storage, CancellationToken cancellationToken)
    {
        var isStaff = context.User.HasClaim("accountType", "staff");
        if (!isStaff && !context.User.HasClaim("accountType", "parent") && !context.User.HasClaim("accountType", "student")) return Results.Unauthorized();
        var payment = await db.PaymentTransactions.Include(x => x.Evidence).Include(x => x.Invoice).SingleOrDefaultAsync(x => x.Id == paymentId, cancellationToken);
        if (payment?.Evidence is null || payment.Invoice is null) return NotFound("EVIDENCE_NOT_FOUND");
        if (isStaff)
        {
            if (!TryStaffScope(context.User, out var scope, out var error)) return error;
            if (scope.TenantId != payment.TenantId || scope.BranchId.HasValue && scope.BranchId.Value != payment.BranchId || !CanReadEvidence(context.User)) return NotFound("EVIDENCE_NOT_FOUND");
        }
        else
        {
            if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var userId)) return NotFound("EVIDENCE_NOT_FOUND");
            var accountType = context.User.FindFirstValue("accountType");
            var linked = accountType == "parent"
                ? await db.GuardianStudentLinks.AnyAsync(x => x.TenantId == payment.TenantId && x.UserAccountId == userId && x.StudentId == payment.Invoice.StudentId && x.Status == "ACTIVE", cancellationToken)
                : await db.StudentAccountLinks.AnyAsync(x => x.TenantId == payment.TenantId && x.UserAccountId == userId && x.StudentId == payment.Invoice.StudentId, cancellationToken);
            if (!linked) return NotFound("EVIDENCE_NOT_FOUND");
        }
        var stream = await storage.OpenReadAsync(payment.Evidence.StorageKey, cancellationToken);
        return stream is null ? NotFound("EVIDENCE_NOT_FOUND") : Results.File(stream, payment.Evidence.ContentType, payment.Evidence.DisplayFileName, enableRangeProcessing: true);
    }

    private static async Task<IResult> ListConsumerInvoicesAsync(HttpContext context, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(context.User.FindFirstValue("sub"), out var userId) || !Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId)) return Forbidden("CONSUMER_SCOPE_REQUIRED");
        var accountType = context.User.FindFirstValue("accountType");
        var studentIds = accountType == "parent"
            ? db.GuardianStudentLinks.Where(x => x.TenantId == tenantId && x.UserAccountId == userId && x.Status == "ACTIVE").Select(x => x.StudentId)
            : db.StudentAccountLinks.Where(x => x.TenantId == tenantId && x.UserAccountId == userId).Select(x => x.StudentId);
        var invoices = await db.Invoices.AsNoTracking().Include(x => x.Student).Include(x => x.Lines).Include(x => x.Payments).ThenInclude(x => x.Evidence)
            .Where(x => x.TenantId == tenantId && studentIds.Contains(x.StudentId)).OrderByDescending(x => x.IssueDate).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = invoices.Select(ToResponse), total = invoices.Count } });
    }

    private static async Task<IResult> ReportsSummaryAsync(HttpContext context, MadaDbContext db, DateOnly? from, DateOnly? to, Guid? branchId, CancellationToken cancellationToken)
    {
        if (!TryStaffScope(context.User, out var scope, out var error)) return error;
        if (!CanReadFinancialReports(context.User)) return Forbidden("FINANCE_REPORT_READ_FORBIDDEN");
        if (from.HasValue && to.HasValue && from.Value > to.Value) return Validation("dateRange", "from cannot be after to.");
        if (branchId.HasValue && scope.BranchId.HasValue && branchId.Value != scope.BranchId.Value) return NotFound("REPORT_NOT_FOUND");
        var effectiveBranch = branchId ?? scope.BranchId;
        var invoices = await db.Invoices.AsNoTracking().Include(x => x.Payments).Include(x => x.Branch).Where(x => x.TenantId == scope.TenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch.Value) && (!from.HasValue || x.IssueDate >= from.Value) && (!to.HasValue || x.IssueDate <= to.Value)).ToListAsync(cancellationToken);
        var expenses = await db.Expenses.AsNoTracking().Include(x => x.Branch).Where(x => x.TenantId == scope.TenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch.Value) && x.Status == "APPROVED" && (!from.HasValue || x.SpentOn >= from.Value) && (!to.HasValue || x.SpentOn <= to.Value)).ToListAsync(cancellationToken);
        var report = BuildReport(invoices, expenses, from, to);
        return Results.Ok(new { data = report });
    }

    private static async Task<IResult> ReportsCsvAsync(HttpContext context, MadaDbContext db, DateOnly? from, DateOnly? to, Guid? branchId, CancellationToken cancellationToken)
    {
        if (!TryStaffScope(context.User, out var scope, out var error)) return error;
        if (!CanReadFinancialReports(context.User)) return Forbidden("FINANCE_REPORT_READ_FORBIDDEN");
        if (from.HasValue && to.HasValue && from.Value > to.Value) return Validation("dateRange", "from cannot be after to.");
        if (branchId.HasValue && scope.BranchId.HasValue && branchId.Value != scope.BranchId.Value) return NotFound("REPORT_NOT_FOUND");
        var effectiveBranch = branchId ?? scope.BranchId;
        var invoices = await db.Invoices.AsNoTracking().Include(x => x.Payments).Include(x => x.Branch).Where(x => x.TenantId == scope.TenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch.Value) && (!from.HasValue || x.IssueDate >= from.Value) && (!to.HasValue || x.IssueDate <= to.Value)).ToListAsync(cancellationToken);
        var expenses = await db.Expenses.AsNoTracking().Include(x => x.Branch).Where(x => x.TenantId == scope.TenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch.Value) && x.Status == "APPROVED" && (!from.HasValue || x.SpentOn >= from.Value) && (!to.HasValue || x.SpentOn <= to.Value)).ToListAsync(cancellationToken);
        var builder = new StringBuilder("branch_id,branch_name,invoice_count,collected_piastres,approved_expenses_piastres,net_piastres\n");
        foreach (var branch in BuildReport(invoices, expenses, from, to).Branches) builder.Append(string.Join(',', branch.BranchId, Csv(branch.BranchName), branch.InvoiceCount, branch.CollectedPiastres, branch.ApprovedExpensesPiastres, branch.NetPiastres)).Append('\n');
        return Results.File(Encoding.UTF8.GetBytes(builder.ToString()), "text/csv; charset=utf-8", $"mada-financial-report-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static FinancialReport BuildReport(List<Invoice> invoices, List<Expense> expenses, DateOnly? from, DateOnly? to)
    {
        var totalBilled = invoices.Sum(x => (long)x.TotalPiastres);
        var totalCollected = invoices.SelectMany(x => x.Payments).Where(x => (!from.HasValue || x.ReceivedOn >= from.Value) && (!to.HasValue || x.ReceivedOn <= to.Value)).Sum(x => (long)x.AmountPiastres);
        var totalExpenses = expenses.Sum(x => (long)x.AmountPiastres);
        var branches = invoices.Select(x => new { x.BranchId, BranchName = x.Branch?.Name ?? x.BranchId.ToString() }).Concat(expenses.Select(x => new { x.BranchId, BranchName = x.Branch?.Name ?? x.BranchId.ToString() })).GroupBy(x => new { x.BranchId, x.BranchName }).Select(group => { var branchInvoices = invoices.Where(x => x.BranchId == group.Key.BranchId).ToList(); var branchExpenses = expenses.Where(x => x.BranchId == group.Key.BranchId).Sum(x => (long)x.AmountPiastres); var branchCollected = branchInvoices.SelectMany(x => x.Payments).Where(x => (!from.HasValue || x.ReceivedOn >= from.Value) && (!to.HasValue || x.ReceivedOn <= to.Value)).Sum(x => (long)x.AmountPiastres); return new FinancialReportBranch(group.Key.BranchId, group.Key.BranchName, branchInvoices.Count, branchCollected, branchExpenses, branchCollected - branchExpenses); }).OrderBy(x => x.BranchName).ToList();
        return new FinancialReport(from, to, totalBilled, totalCollected, Math.Max(0, totalBilled - totalCollected), totalExpenses, totalCollected - totalExpenses, branches);
    }

    private static string Csv(string value) => value.Contains(',') || value.Contains('"') ? $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"" : value;
    private sealed record FinancialReport(DateOnly? From, DateOnly? To, long TotalBilledPiastres, long TotalCollectedPiastres, long TotalOutstandingPiastres, long ApprovedExpensesPiastres, long NetPiastres, IReadOnlyList<FinancialReportBranch> Branches);
    private sealed record FinancialReportBranch(Guid BranchId, string BranchName, int InvoiceCount, long CollectedPiastres, long ApprovedExpensesPiastres, long NetPiastres);

    private static async Task<string> NextInvoiceNumberAsync(MadaDbContext db, Guid branchId, CancellationToken cancellationToken)
    {
        var prefix = $"MAD-{branchId.ToString("N")[..6].ToUpperInvariant()}-{DateTime.UtcNow:yyyyMMdd}";
        var count = await db.Invoices.CountAsync(x => x.InvoiceNumber.StartsWith(prefix), cancellationToken);
        return $"{prefix}-{count + 1:D4}-{Guid.NewGuid():N}"[..48];
    }

    private static object ToResponse(Invoice invoice)
    {
        var paid = invoice.Payments.Sum(x => (long)x.AmountPiastres);
        var status = paid >= invoice.TotalPiastres ? "PAID" : paid > 0 ? "PARTIAL" : invoice.DueDate < DateOnly.FromDateTime(DateTime.UtcNow) ? "OVERDUE" : "UNPAID";
        return new { id = invoice.Id, invoiceNumber = invoice.InvoiceNumber, tenantId = invoice.TenantId, branchId = invoice.BranchId, studentId = invoice.StudentId, studentName = invoice.Student?.FullName, enrollmentId = invoice.EnrollmentId, issueDate = invoice.IssueDate, dueDate = invoice.DueDate, totalPiastres = invoice.TotalPiastres, paidPiastres = paid, remainingPiastres = Math.Max(0, invoice.TotalPiastres - paid), status, lines = invoice.Lines.OrderBy(x => x.LineNumber).Select(x => new { x.Description, x.AmountPiastres }), payments = invoice.Payments.OrderByDescending(x => x.CreatedAt).Select(ToPaymentResponse) };
    }

    private static object ToPaymentResponse(PaymentTransaction payment) => new { id = payment.Id, invoiceId = payment.InvoiceId, amountPiastres = payment.AmountPiastres, method = payment.Method, receivedOn = payment.ReceivedOn, externalReference = payment.ExternalReference, note = payment.Note, createdAt = payment.CreatedAt, evidenceStatus = payment.Evidence is null ? "NOT_ATTACHED" : "ATTACHED", evidenceFileName = payment.Evidence?.DisplayFileName };
    private static bool CanReadInvoices(ClaimsPrincipal user) => user.IsInRole("R05_SECRETARY") || user.IsInRole("R06_ACCOUNTANT");
    private static bool CanReadFinancialReports(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R06_ACCOUNTANT");
    private static bool CanWriteInvoices(ClaimsPrincipal user) => user.IsInRole("R05_SECRETARY") || user.IsInRole("R06_ACCOUNTANT");
    private static bool CanWritePayments(ClaimsPrincipal user) => user.IsInRole("R05_SECRETARY") || user.IsInRole("R06_ACCOUNTANT");
    private static bool CanReadEvidence(ClaimsPrincipal user) => user.IsInRole("R05_SECRETARY") || user.IsInRole("R06_ACCOUNTANT");
    private static bool TryStaffScope(ClaimsPrincipal user, out StaffScope scope, out IResult error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId)) { scope = default; error = Forbidden("TENANT_SCOPE_REQUIRED"); return false; }
        var branch = Guid.TryParse(user.FindFirstValue("branchId"), out var branchId) ? branchId : (Guid?)null;
        scope = new StaffScope(tenantId, branch); error = Results.Ok(); return true;
    }
    private static IResult NotFound(string code) => Results.NotFound(new { error = new { code, message = "The requested financial record was not found in the current scope." } });
    private static IResult Forbidden(string code) => Results.Problem(statusCode: 403, title: code, extensions: new Dictionary<string, object?> { ["code"] = code });
    private static IResult Conflict(string code) => Results.Conflict(new { error = new { code, message = "The financial operation could not be completed." } });
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
    private static string SafeFileName(string name) => Path.GetFileName(name).Replace("\"", "", StringComparison.Ordinal).Trim() switch { { Length: > 0 } safe => safe.Length > 180 ? safe[..180] : safe, _ => "evidence" };
    private readonly record struct StaffScope(Guid TenantId, Guid? BranchId);
}

public sealed record CreateInvoiceRequest(Guid StudentId, DateOnly DueDate, IReadOnlyList<CreateInvoiceLineRequest> Lines, Guid? EnrollmentId = null);
public sealed record CreateInvoiceLineRequest(string Description, int AmountPiastres);
public sealed record CreatePaymentRequest(int AmountPiastres, string Method, DateOnly? ReceivedOn = null, string? ExternalReference = null, string? Note = null);
