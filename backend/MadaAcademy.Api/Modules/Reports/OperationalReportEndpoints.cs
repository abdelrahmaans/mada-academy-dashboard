using System.Security.Claims;
using System.Text;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Reports;

public static class OperationalReportEndpoints
{
    public static IEndpointRouteBuilder MapMadaOperationalReportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/reports").RequireAuthorization("staff");
        api.MapGet("/operational", GetAsync);
        api.MapGet("/operational.csv", GetCsvAsync);
        return endpoints;
    }

    private static Task<IResult> GetAsync(
        HttpContext context,
        MadaDbContext db,
        DateOnly? from,
        DateOnly? to,
        Guid? branchId,
        CancellationToken cancellationToken)
        => BuildAsync(context, db, from, to, branchId, cancellationToken, csv: false);

    private static Task<IResult> GetCsvAsync(
        HttpContext context,
        MadaDbContext db,
        DateOnly? from,
        DateOnly? to,
        Guid? branchId,
        CancellationToken cancellationToken)
        => BuildAsync(context, db, from, to, branchId, cancellationToken, csv: true);

    private static async Task<IResult> BuildAsync(
        HttpContext context,
        MadaDbContext db,
        DateOnly? from,
        DateOnly? to,
        Guid? branchId,
        CancellationToken cancellationToken,
        bool csv)
    {
        if (!CanRead(context.User)) return Results.Forbid();
        if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");
        if (from.HasValue && to.HasValue && from.Value > to.Value)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["dateRange"] = ["from cannot be after to."] });
        if (to == DateOnly.MaxValue)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["to"] = ["to must be earlier than the maximum supported date."] });

        var isBranchScoped = context.User.IsInRole("R02_BRANCH_MANAGER") || context.User.IsInRole("R06_ACCOUNTANT");
        var claimedBranchId = Guid.TryParse(context.User.FindFirstValue("branchId"), out var parsedBranchId) ? parsedBranchId : (Guid?)null;
        if (isBranchScoped && !claimedBranchId.HasValue) return Results.Forbid();
        if (isBranchScoped && branchId.HasValue && branchId != claimedBranchId) return NotFound();
        var effectiveBranch = branchId ?? (isBranchScoped ? claimedBranchId : null);
        if (effectiveBranch.HasValue && !await db.Branches.AnyAsync(x => x.Id == effectiveBranch && x.TenantId == tenantId, cancellationToken)) return NotFound();

        var students = db.Students.AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Status == "ACTIVE" && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch));
        var studentIds = students.Select(x => x.Id);
        var enrollments = db.StudentEnrollments.AsNoTracking()
            .Where(x => x.Status == "ACTIVE" && studentIds.Contains(x.StudentId));
        var sessions = db.AcademySessions.AsNoTracking()
            .Where(x => x.TenantId == tenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch))
            .Where(x => !from.HasValue || x.StartAt >= StartOfDay(from.Value))
            .Where(x => !to.HasValue || x.StartAt < StartOfDay(to.Value.AddDays(1)));
        var attendance = db.SessionAttendances.AsNoTracking().Where(x => sessions.Select(session => session.Id).Contains(x.SessionId));
        var invoices = db.Invoices.AsNoTracking()
            .Where(x => x.TenantId == tenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch))
            .Where(x => !from.HasValue || x.IssueDate >= from.Value)
            .Where(x => !to.HasValue || x.IssueDate <= to.Value);
        var payments = db.PaymentTransactions.AsNoTracking()
            .Where(x => x.TenantId == tenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch))
            .Where(x => !from.HasValue || x.ReceivedOn >= from.Value)
            .Where(x => !to.HasValue || x.ReceivedOn <= to.Value);
        var expenses = db.Expenses.AsNoTracking()
            .Where(x => x.TenantId == tenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch))
            .Where(x => !from.HasValue || x.SpentOn >= from.Value)
            .Where(x => !to.HasValue || x.SpentOn <= to.Value);

        var totalBilled = await invoices.SumAsync(x => (long?)x.TotalPiastres, cancellationToken) ?? 0;
        var totalCollected = await payments.SumAsync(x => (long?)x.AmountPiastres, cancellationToken) ?? 0;
        var marked = await attendance.CountAsync(x => x.Status != "EXCUSED", cancellationToken);
        var attended = await attendance.CountAsync(x => x.Status == "PRESENT" || x.Status == "LATE", cancellationToken);
        var report = new OperationalReport(
            from,
            to,
            effectiveBranch,
            await students.CountAsync(cancellationToken),
            await enrollments.CountAsync(cancellationToken),
            await sessions.CountAsync(cancellationToken),
            await sessions.CountAsync(x => x.Status == "COMPLETED", cancellationToken),
            marked,
            attended,
            marked == 0 ? null : Math.Round(attended * 100m / marked, 1),
            await invoices.CountAsync(cancellationToken),
            totalBilled,
            totalCollected,
            Math.Max(0, totalBilled - totalCollected),
            await payments.CountAsync(x => x.Method != "CASH" && !db.PaymentEvidences.Any(evidence => evidence.PaymentTransactionId == x.Id), cancellationToken),
            await expenses.CountAsync(x => x.Status == "PENDING", cancellationToken),
            await expenses.CountAsync(x => x.Status == "APPROVED", cancellationToken),
            await expenses.Where(x => x.Status == "APPROVED").SumAsync(x => (long?)x.AmountPiastres, cancellationToken) ?? 0);

        if (csv)
        {
            var builder = new StringBuilder("from,to,branch_id,active_students,active_enrollments,sessions,completed_sessions,attendance_marked,attended,attendance_percent,invoice_count,billed_piastres,collected_piastres,outstanding_piastres,payments_missing_evidence,pending_expenses,approved_expenses,approved_expenses_piastres\n");
            builder.Append(string.Join(',',
                report.From?.ToString("yyyy-MM-dd"), report.To?.ToString("yyyy-MM-dd"), report.BranchId,
                report.ActiveStudents, report.ActiveEnrollments, report.Sessions, report.CompletedSessions,
                report.AttendanceMarkedCount, report.AttendedCount, report.AttendancePercent,
                report.InvoiceCount, report.TotalBilledPiastres, report.TotalCollectedPiastres, report.TotalOutstandingPiastres,
                report.PaymentsMissingEvidence, report.PendingExpenses, report.ApprovedExpenses, report.ApprovedExpensesPiastres)).Append('\n');
            return Results.File(Encoding.UTF8.GetBytes(builder.ToString()), "text/csv; charset=utf-8", $"mada-operational-report-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        return Results.Ok(new { data = report });
    }

    private static bool CanRead(ClaimsPrincipal user)
        => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R06_ACCOUNTANT");

    private static IResult NotFound()
        => Results.NotFound(new { error = new { code = "REPORT_NOT_FOUND", message = "The requested report is outside the current scope." } });

    private static DateTimeOffset StartOfDay(DateOnly date)
        => new(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
}

public sealed record OperationalReport(
    DateOnly? From,
    DateOnly? To,
    Guid? BranchId,
    int ActiveStudents,
    int ActiveEnrollments,
    int Sessions,
    int CompletedSessions,
    int AttendanceMarkedCount,
    int AttendedCount,
    decimal? AttendancePercent,
    int InvoiceCount,
    long TotalBilledPiastres,
    long TotalCollectedPiastres,
    long TotalOutstandingPiastres,
    int PaymentsMissingEvidence,
    int PendingExpenses,
    int ApprovedExpenses,
    long ApprovedExpensesPiastres);
