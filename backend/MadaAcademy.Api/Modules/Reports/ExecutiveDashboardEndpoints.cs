using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Reports;

public static class ExecutiveDashboardEndpoints
{
    public static IEndpointRouteBuilder MapMadaExecutiveDashboardEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/academy/executive-summary", GetSummaryAsync)
            .RequireAuthorization("academy-owner");
        endpoints.MapGet("/api/v1/academy/executive-activity", GetActivityAsync)
            .RequireAuthorization("academy-owner");
        return endpoints;
    }

    private static async Task<IResult> GetSummaryAsync(
        ClaimsPrincipal principal,
        MadaDbContext db,
        DateOnly? from,
        DateOnly? to,
        Guid? branchId,
        ILogger<Program> logger,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope", extensions: new Dictionary<string, object?> { ["code"] = "MISSING_ACADEMY_SCOPE" });
        if (from.HasValue && to.HasValue && from.Value > to.Value)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["dateRange"] = ["from cannot be after to."] });
        if (to == DateOnly.MaxValue)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["to"] = ["to must be earlier than the maximum supported date."] });

        var activeSource = "branches";
        try
        {
        var allBranches = await db.Branches.AsNoTracking()
            .Where(branch => branch.TenantId == tenantId)
            .OrderBy(branch => branch.Name)
            .Select(branch => new ExecutiveBranchOption(branch.Id, branch.Name, branch.Code, branch.Status))
            .ToListAsync(cancellationToken);
        if (branchId.HasValue && allBranches.All(branch => branch.Id != branchId.Value))
            return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "The requested branch was not found in the current academy." } });

        var selectedBranches = branchId.HasValue
            ? allBranches.Where(branch => branch.Id == branchId.Value).ToArray()
            : allBranches.ToArray();
        var branchIds = selectedBranches.Select(branch => branch.Id).ToArray();
        var sessionStart = from.HasValue ? StartOfDay(from.Value) : (DateTimeOffset?)null;
        var sessionEnd = to.HasValue ? StartOfDay(to.Value.AddDays(1)) : (DateTimeOffset?)null;

        activeSource = "students";
        var students = await db.Students.AsNoTracking()
            .Where(student => student.TenantId == tenantId && branchIds.Contains(student.BranchId) && student.Status == "ACTIVE")
            .GroupBy(student => student.BranchId)
            .Select(group => new { BranchId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.BranchId, item => item.Count, cancellationToken);

        activeSource = "enrollments";
        var enrollments = await db.StudentEnrollments.AsNoTracking()
            .Join(db.Students.AsNoTracking(), enrollment => enrollment.StudentId, student => student.Id, (enrollment, student) => new { enrollment, student })
            .Where(item => item.student.TenantId == tenantId && branchIds.Contains(item.student.BranchId) && item.student.Status == "ACTIVE" && item.enrollment.Status == "ACTIVE")
            .GroupBy(item => item.student.BranchId)
            .Select(group => new { BranchId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.BranchId, item => item.Count, cancellationToken);

        activeSource = "sessions";
        var sessionsQuery = db.AcademySessions.AsNoTracking()
            .Where(session => session.TenantId == tenantId && branchIds.Contains(session.BranchId))
            .Where(session => !sessionStart.HasValue || session.StartAt >= sessionStart.Value)
            .Where(session => !sessionEnd.HasValue || session.StartAt < sessionEnd.Value);
        var sessions = await sessionsQuery
            .GroupBy(session => session.BranchId)
            .Select(group => new
            {
                BranchId = group.Key,
                Total = group.Count(),
                Completed = group.Count(session => session.Status == "COMPLETED")
            })
            .ToDictionaryAsync(item => item.BranchId, cancellationToken);

        activeSource = "attendance";
        var attendance = await (
                from mark in db.SessionAttendances.AsNoTracking()
                join session in sessionsQuery on mark.SessionId equals session.Id
                group mark by session.BranchId into attendanceGroup
                select new
                {
                    BranchId = attendanceGroup.Key,
                    Marked = attendanceGroup.Count(mark => mark.Status != "EXCUSED"),
                    Attended = attendanceGroup.Count(mark => mark.Status == "PRESENT" || mark.Status == "LATE")
                })
            .ToDictionaryAsync(item => item.BranchId, cancellationToken);

        activeSource = "collections";
        var collected = await db.PaymentTransactions.AsNoTracking()
            .Where(payment => payment.TenantId == tenantId && branchIds.Contains(payment.BranchId))
            .Where(payment => !from.HasValue || payment.ReceivedOn >= from.Value)
            .Where(payment => !to.HasValue || payment.ReceivedOn <= to.Value)
            .GroupBy(payment => payment.BranchId)
            .Select(group => new { BranchId = group.Key, Amount = group.Sum(payment => (long)payment.AmountPiastres) })
            .ToDictionaryAsync(item => item.BranchId, item => item.Amount, cancellationToken);

        activeSource = "approvedExpenses";
        var approvedExpenses = await db.Expenses.AsNoTracking()
            .Where(expense => expense.TenantId == tenantId && branchIds.Contains(expense.BranchId) && expense.Status == "APPROVED")
            .Where(expense => !from.HasValue || expense.SpentOn >= from.Value)
            .Where(expense => !to.HasValue || expense.SpentOn <= to.Value)
            .GroupBy(expense => expense.BranchId)
            .Select(group => new { BranchId = group.Key, Amount = group.Sum(expense => (long)expense.AmountPiastres) })
            .ToDictionaryAsync(item => item.BranchId, item => item.Amount, cancellationToken);

        activeSource = "pendingApprovals";
        var pendingApprovals = await db.ApprovalRequests.AsNoTracking()
            .Where(request => request.TenantId == tenantId && request.BranchId.HasValue && branchIds.Contains(request.BranchId.Value) && request.State == "PENDING")
            .GroupBy(request => request.BranchId!.Value)
            .Select(group => new { BranchId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.BranchId, item => item.Count, cancellationToken);

        var summaries = selectedBranches.Select(branch =>
        {
            var session = sessions.GetValueOrDefault(branch.Id);
            var attendanceCount = attendance.GetValueOrDefault(branch.Id)?.Marked ?? 0;
            var attendedCount = attendance.GetValueOrDefault(branch.Id)?.Attended ?? 0;
            var collectedAmount = collected.GetValueOrDefault(branch.Id);
            var expenseAmount = approvedExpenses.GetValueOrDefault(branch.Id);
            return new ExecutiveBranchMetrics(
                branch.Id,
                branch.Name,
                branch.Code,
                branch.Status,
                students.GetValueOrDefault(branch.Id),
                enrollments.GetValueOrDefault(branch.Id),
                session?.Total ?? 0,
                session?.Completed ?? 0,
                attendedCount,
                attendanceCount,
                attendanceCount == 0 ? null : Math.Round(attendedCount * 100m / attendanceCount, 1),
                collectedAmount,
                expenseAmount,
                collectedAmount - expenseAmount,
                pendingApprovals.GetValueOrDefault(branch.Id));
        }).ToArray();

        var totalAttendance = summaries.Sum(item => item.AttendanceMarkedCount);
        var totalAttended = summaries.Sum(item => item.AttendedCount);
        var summary = new ExecutiveMetrics(
            summaries.Sum(item => item.ActiveStudents),
            summaries.Sum(item => item.ActiveEnrollments),
            summaries.Sum(item => item.Sessions),
            summaries.Sum(item => item.CompletedSessions),
            totalAttended,
            totalAttendance,
            totalAttendance == 0 ? null : Math.Round(totalAttended * 100m / totalAttendance, 1),
            summaries.Sum(item => item.CollectedPiastres),
            summaries.Sum(item => item.ApprovedExpensesPiastres),
            summaries.Sum(item => item.NetPiastres),
            summaries.Sum(item => item.PendingApprovals));

        var alerts = summaries.SelectMany(item =>
        {
            var items = new List<ExecutiveAlert>();
            if (item.ActiveStudents == 0) items.Add(new ExecutiveAlert("NO_ACTIVE_STUDENTS", "warning", "لا يوجد طلاب نشطون", $"فرع {item.BranchName} لا يحتوي على طلاب نشطين في السجل.", item.BranchId, item.BranchName));
            if (item.PendingApprovals > 0) items.Add(new ExecutiveAlert("PENDING_APPROVALS", "warning", "موافقات تحتاج مراجعة", $"يوجد {item.PendingApprovals} طلب موافقة معلق في فرع {item.BranchName}.", item.BranchId, item.BranchName));
            if (item.Sessions > 0 && item.AttendanceMarkedCount == 0) items.Add(new ExecutiveAlert("NO_ATTENDANCE_MARKS", "warning", "لا توجد علامات حضور", $"الجلسات في فرع {item.BranchName} لا تحتوي على علامات حضور للفترة المختارة.", item.BranchId, item.BranchName));
            return items;
        }).ToArray();

        return Results.Ok(new
        {
            data = new
            {
                tenantId,
                from,
                to,
                selectedBranchId = branchId,
                availableBranches = allBranches,
                summary,
                branches = summaries,
                branchesWithoutStudentData = summaries.Count(item => item.ActiveStudents == 0),
                alerts,
                dataSources = new
                {
                    students = "Students (ACTIVE)",
                    enrollments = "StudentEnrollments (ACTIVE)",
                    sessions = "AcademySessions",
                    attendance = "SessionAttendances joined to AcademySessions",
                    collections = "PaymentTransactions by ReceivedOn",
                    approvedExpenses = "Expenses (APPROVED) by SpentOn",
                    pendingApprovals = "ApprovalRequests (PENDING)"
                }
            }
        });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Executive summary failed while reading source {Source} for tenant {TenantId}.", activeSource, tenantId);
            return Results.Json(new { error = new { code = "REPORT_SOURCE_UNAVAILABLE", source = activeSource, message = "The executive report could not read one of its data sources." } }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<IResult> GetActivityAsync(
        ClaimsPrincipal principal,
        MadaDbContext db,
        DateOnly? from,
        DateOnly? to,
        Guid? branchId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope", extensions: new Dictionary<string, object?> { ["code"] = "MISSING_ACADEMY_SCOPE" });
        if (from.HasValue && to.HasValue && from.Value > to.Value)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["dateRange"] = ["from cannot be after to."] });
        if (to == DateOnly.MaxValue)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["to"] = ["to must be earlier than the maximum supported date."] });
        if (branchId.HasValue && !await db.Branches.AnyAsync(item => item.Id == branchId.Value && item.TenantId == tenantId, cancellationToken))
            return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "The requested branch was not found in the current academy." } });

        var fromUtc = from.HasValue ? StartOfDay(from.Value) : (DateTimeOffset?)null;
        var toUtcExclusive = to.HasValue ? StartOfDay(to.Value.AddDays(1)) : (DateTimeOffset?)null;
        var auditEvents = await db.AuditEvents.AsNoTracking()
            .Where(item => item.TenantId == tenantId && (!branchId.HasValue || !item.BranchId.HasValue || item.BranchId == branchId))
            .Where(item => !fromUtc.HasValue || item.CreatedAt >= fromUtc.Value)
            .Where(item => !toUtcExclusive.HasValue || item.CreatedAt < toUtcExclusive.Value)
            .OrderByDescending(item => item.CreatedAt)
            .Take(100)
            .Select(item => new ExecutiveActivityItem(item.Id, "AUDIT", item.Action, item.TargetType, item.TargetId, item.BranchId, item.ActorUserId,
                item.ActorUserId == null ? null : db.UserAccounts.Where(user => user.Id == item.ActorUserId).Select(user => user.DisplayName).FirstOrDefault(),
                item.CreatedAt, item.Reason, null))
            .ToListAsync(cancellationToken);

        var decisions = await db.ApprovalRequests.AsNoTracking()
            .Where(item => item.TenantId == tenantId && item.State != "PENDING" && (!branchId.HasValue || !item.BranchId.HasValue || item.BranchId == branchId))
            .Where(item => !fromUtc.HasValue || (item.DecidedAt ?? item.UpdatedAt) >= fromUtc.Value)
            .Where(item => !toUtcExclusive.HasValue || (item.DecidedAt ?? item.UpdatedAt) < toUtcExclusive.Value)
            .OrderByDescending(item => item.DecidedAt ?? item.UpdatedAt)
            .Take(100)
            .Select(item => new ExecutiveActivityItem(item.Id, "DECISION", item.RequestType, item.TargetType, item.TargetId, item.BranchId, item.DecidedByUserId,
                item.DecidedByUserId == null ? null : db.UserAccounts.Where(user => user.Id == item.DecidedByUserId).Select(user => user.DisplayName).FirstOrDefault(),
                item.DecidedAt ?? item.UpdatedAt, item.Reason, item.State))
            .ToListAsync(cancellationToken);

        var items = auditEvents.Concat(decisions).OrderByDescending(item => item.OccurredAt).Take(100).ToArray();
        return Results.Ok(new { data = new { tenantId, items, total = items.Length } });
    }

    private static DateTimeOffset StartOfDay(DateOnly date)
        => new(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
}

public sealed record ExecutiveBranchOption(Guid Id, string Name, string Code, string Status);
public sealed record ExecutiveAlert(string Code, string Severity, string Title, string Detail, Guid? BranchId, string? BranchName);
public sealed record ExecutiveActivityItem(Guid Id, string Source, string Action, string TargetType, string TargetId, Guid? BranchId, Guid? ActorUserId, string? ActorName, DateTimeOffset OccurredAt, string? Reason, string? State);

public sealed record ExecutiveBranchMetrics(
    Guid BranchId,
    string BranchName,
    string BranchCode,
    string BranchStatus,
    int ActiveStudents,
    int ActiveEnrollments,
    int Sessions,
    int CompletedSessions,
    int AttendedCount,
    int AttendanceMarkedCount,
    decimal? AttendancePercent,
    long CollectedPiastres,
    long ApprovedExpensesPiastres,
    long NetPiastres,
    int PendingApprovals);

public sealed record ExecutiveMetrics(
    int ActiveStudents,
    int ActiveEnrollments,
    int Sessions,
    int CompletedSessions,
    int AttendedCount,
    int AttendanceMarkedCount,
    decimal? AttendancePercent,
    long CollectedPiastres,
    long ApprovedExpensesPiastres,
    long NetPiastres,
    int PendingApprovals);
