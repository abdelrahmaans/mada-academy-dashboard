using System.Security.Claims;
using System.Text;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Reports;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapMadaAnalyticsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/reports/analytics").RequireAuthorization("staff");

        api.MapGet("/retention-radar", GetRetentionRadarAsync);
        api.MapGet("/instructor-scorecard", GetInstructorScorecardAsync);
        api.MapGet("/course-profitability", GetCourseProfitabilityAsync);
        api.MapGet("/bi-feed.csv", GetBiFeedCsvAsync);

        return endpoints;
    }

    private static async Task<IResult> GetRetentionRadarAsync(
        ClaimsPrincipal user,
        MadaDbContext db,
        Guid? branchId,
        CancellationToken cancellationToken)
    {
        if (!CanReadAnalytics(user)) return Results.Forbid();
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");

        var effectiveBranch = ResolveEffectiveBranch(user, branchId);
        if (effectiveBranch.HasValue && !await db.Branches.AnyAsync(x => x.Id == effectiveBranch && x.TenantId == tenantId, cancellationToken))
            return Results.NotFound(new { error = new { code = "BRANCH_NOT_FOUND", message = "The requested branch was not found." } });

        var studentsQuery = db.Students.AsNoTracking()
            .Where(s => s.TenantId == tenantId && s.Status == "ACTIVE" && (!effectiveBranch.HasValue || s.BranchId == effectiveBranch));

        var enrolledStudents = await (
            from s in studentsQuery
            join e in db.StudentEnrollments.AsNoTracking().Where(x => x.Status == "ACTIVE") on s.Id equals e.StudentId
            join co in db.CourseOfferings.AsNoTracking() on e.CourseOfferingId equals co.Id
            join ct in db.CourseTemplates.AsNoTracking() on co.CourseTemplateId equals ct.Id
            join b in db.Branches.AsNoTracking() on s.BranchId equals b.Id
            select new
            {
                StudentId = s.Id,
                s.FullName,
                s.DateOfBirth,
                BranchId = s.BranchId,
                BranchName = b.Name,
                EnrollmentId = e.Id,
                CourseOfferingId = co.Id,
                CourseName = ct.Name,
                e.FinalPricePiastres
            }
        ).ToListAsync(cancellationToken);

        var studentIds = enrolledStudents.Select(x => x.StudentId).Distinct().ToList();

        // 1. Fetch attendance records
        var attendances = await (
            from a in db.SessionAttendances.AsNoTracking()
            join sess in db.AcademySessions.AsNoTracking() on a.SessionId equals sess.Id
            where studentIds.Contains(a.StudentId) && sess.TenantId == tenantId
            orderby sess.StartAt descending
            select new
            {
                a.StudentId,
                a.SessionId,
                a.Status,
                sess.StartAt,
                sess.CourseOfferingId
            }
        ).ToListAsync(cancellationToken);

        // 2. Fetch evaluation scores
        var evaluations = await (
            from ev in db.SessionEvaluations.AsNoTracking()
            where studentIds.Contains(ev.StudentId) && ev.Score.HasValue
            select new
            {
                ev.StudentId,
                Score = ev.Score!.Value,
                ev.SubmittedAt
            }
        ).ToListAsync(cancellationToken);

        // 3. Fetch invoices & payments
        var invoices = await (
            from inv in db.Invoices.AsNoTracking()
            where studentIds.Contains(inv.StudentId) && inv.TenantId == tenantId
            select new
            {
                inv.StudentId,
                inv.Id,
                inv.TotalPiastres,
                inv.Status,
                inv.DueDate,
                PaidPiastres = db.PaymentTransactions.Where(p => p.InvoiceId == inv.Id).Sum(p => (int?)p.AmountPiastres) ?? 0
            }
        ).ToListAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var radarItems = new List<RetentionRadarItem>();

        foreach (var student in enrolledStudents)
        {
            var studentAtt = attendances.Where(x => x.StudentId == student.StudentId).ToList();
            var totalSessionsMarked = studentAtt.Count;
            var presentCount = studentAtt.Count(x => x.Status == "PRESENT" || x.Status == "LATE");
            var absentCount = studentAtt.Count(x => x.Status == "ABSENT");

            // Consecutive absences from latest backwards
            int consecutiveAbsences = 0;
            foreach (var att in studentAtt.OrderByDescending(x => x.StartAt))
            {
                if (att.Status == "ABSENT") consecutiveAbsences++;
                else break;
            }

            decimal attendancePercent = totalSessionsMarked > 0
                ? Math.Round((decimal)presentCount * 100m / totalSessionsMarked, 1)
                : 100m;

            var studentEvals = evaluations.Where(x => x.StudentId == student.StudentId).ToList();
            decimal? avgScore = studentEvals.Count > 0
                ? Math.Round((decimal)studentEvals.Average(x => x.Score), 1)
                : null;

            var studentInvoices = invoices.Where(x => x.StudentId == student.StudentId).ToList();
            var totalBilled = studentInvoices.Sum(x => x.TotalPiastres);
            var totalPaid = studentInvoices.Sum(x => x.PaidPiastres);
            var outstanding = Math.Max(0, totalBilled - totalPaid);

            var overdueInvoices = studentInvoices.Where(x => x.DueDate < today && x.PaidPiastres < x.TotalPiastres).ToList();
            var maxOverdueDays = overdueInvoices.Count > 0
                ? overdueInvoices.Max(x => today.DayNumber - x.DueDate.DayNumber)
                : 0;

            // Risk Scoring Engine
            string riskLevel = "LOW";
            var riskFactors = new List<string>();
            string recommendedAction = "حالة الطالب مستقرة ولا تتطلب تدخلاً.";

            if (consecutiveAbsences >= 2)
            {
                riskLevel = "HIGH";
                riskFactors.Add($"غياب {consecutiveAbsences} جلسات متتالية");
            }
            else if (totalSessionsMarked >= 3 && attendancePercent < 60)
            {
                riskLevel = "HIGH";
                riskFactors.Add($"نسبة الحضور منخفضة جداً ({attendancePercent}%)");
            }

            if (maxOverdueDays > 14 && outstanding > 0)
            {
                riskLevel = "HIGH";
                riskFactors.Add($"متأخرات مالية مستحقة منذ {maxOverdueDays} يوماً");
            }
            else if (maxOverdueDays > 5 && outstanding > 0 && riskLevel != "HIGH")
            {
                riskLevel = "MEDIUM";
                riskFactors.Add($"قسط متأخر منذ {maxOverdueDays} يوماً");
            }

            if (avgScore.HasValue && avgScore.Value < 70)
            {
                if (riskLevel == "LOW") riskLevel = "MEDIUM";
                riskFactors.Add($"متوسط التقييم منخفض ({avgScore.Value}/100)");
            }

            if (riskLevel == "HIGH")
            {
                recommendedAction = "تواصل عاجل مع ولي الأمر لتدارك الغياب المتكرر وتسوية المتأخرات.";
            }
            else if (riskLevel == "MEDIUM")
            {
                recommendedAction = "متابعة دورية من السكرتارية وتقديم دعم أكاديمي أو تذكير لطيف بالسداد.";
            }

            radarItems.Add(new RetentionRadarItem(
                student.StudentId,
                student.FullName,
                student.BranchId,
                student.BranchName,
                student.CourseOfferingId,
                student.CourseName,
                totalSessionsMarked,
                attendancePercent,
                consecutiveAbsences,
                avgScore,
                totalBilled,
                totalPaid,
                outstanding,
                maxOverdueDays,
                riskLevel,
                riskFactors.Count > 0 ? string.Join(" · ", riskFactors) : "سجل ممتاز",
                recommendedAction
            ));
        }

        var highRiskCount = radarItems.Count(x => x.RiskLevel == "HIGH");
        var mediumRiskCount = radarItems.Count(x => x.RiskLevel == "MEDIUM");
        var lowRiskCount = radarItems.Count(x => x.RiskLevel == "LOW");

        return Results.Ok(new
        {
            data = new
            {
                summary = new
                {
                    totalStudents = radarItems.Count,
                    highRiskCount,
                    mediumRiskCount,
                    lowRiskCount,
                    atRiskPercent = radarItems.Count > 0 ? Math.Round((highRiskCount + mediumRiskCount) * 100m / radarItems.Count, 1) : 0m
                },
                items = radarItems.OrderByDescending(x => x.RiskLevel == "HIGH")
                                  .ThenByDescending(x => x.RiskLevel == "MEDIUM")
                                  .ThenByDescending(x => x.ConsecutiveAbsences)
                                  .ToList()
            }
        });
    }

    private static async Task<IResult> GetInstructorScorecardAsync(
        ClaimsPrincipal user,
        MadaDbContext db,
        Guid? branchId,
        CancellationToken cancellationToken)
    {
        if (!CanReadAnalytics(user)) return Results.Forbid();
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");

        var effectiveBranch = ResolveEffectiveBranch(user, branchId);

        var instructors = await (
            from m in db.Memberships.AsNoTracking()
            join u in db.UserAccounts.AsNoTracking() on m.UserAccountId equals u.Id
            join b in db.Branches.AsNoTracking() on m.BranchId equals b.Id into branchJoin
            from b in branchJoin.DefaultIfEmpty()
            where m.TenantId == tenantId && (m.RoleCode == "R04_INSTRUCTOR" || m.RoleCode == "R03_HEAD_INSTRUCTORS")
            where !effectiveBranch.HasValue || m.BranchId == effectiveBranch
            select new
            {
                InstructorId = u.Id,
                u.DisplayName,
                u.Email,
                u.Phone,
                BranchId = m.BranchId,
                BranchName = b != null ? b.Name : "عام"
            }
        ).Distinct().ToListAsync(cancellationToken);

        var sessions = await db.AcademySessions.AsNoTracking()
            .Where(x => x.TenantId == tenantId && (!effectiveBranch.HasValue || x.BranchId == effectiveBranch))
            .Select(x => new
            {
                x.Id,
                x.InstructorId,
                x.SubstituteInstructorId,
                x.Status,
                x.StartAt
            })
            .ToListAsync(cancellationToken);

        var evaluations = await db.SessionEvaluations.AsNoTracking()
            .Where(x => x.Score.HasValue)
            .Select(x => new { x.InstructorId, Score = x.Score!.Value })
            .ToListAsync(cancellationToken);

        var attendances = await (
            from a in db.SessionAttendances.AsNoTracking()
            join sess in db.AcademySessions.AsNoTracking() on a.SessionId equals sess.Id
            where sess.TenantId == tenantId && (!effectiveBranch.HasValue || sess.BranchId == effectiveBranch)
            select new { sess.InstructorId, a.Status }
        ).ToListAsync(cancellationToken);

        var scorecards = new List<InstructorScorecardItem>();

        foreach (var inst in instructors)
        {
            var instSessions = sessions.Where(s => s.InstructorId == inst.InstructorId).ToList();
            var totalAssigned = instSessions.Count;
            var completed = instSessions.Count(s => s.Status == "COMPLETED");
            var substituteCount = instSessions.Count(s => s.SubstituteInstructorId.HasValue);

            var instAtt = attendances.Where(a => a.InstructorId == inst.InstructorId).ToList();
            var totalStudentMarks = instAtt.Count;
            var presentStudentMarks = instAtt.Count(a => a.Status == "PRESENT" || a.Status == "LATE");
            decimal studentAttendanceRate = totalStudentMarks > 0
                ? Math.Round((decimal)presentStudentMarks * 100m / totalStudentMarks, 1)
                : 100m;

            var instEvals = evaluations.Where(e => e.InstructorId == inst.InstructorId).ToList();
            decimal? avgScore = instEvals.Count > 0
                ? Math.Round((decimal)instEvals.Average(e => e.Score), 1)
                : null;

            scorecards.Add(new InstructorScorecardItem(
                inst.InstructorId,
                inst.DisplayName,
                inst.BranchId,
                inst.BranchName,
                totalAssigned,
                completed,
                totalAssigned > 0 ? Math.Round((decimal)completed * 100m / totalAssigned, 1) : 100m,
                substituteCount,
                studentAttendanceRate,
                avgScore,
                instEvals.Count
            ));
        }

        return Results.Ok(new { data = scorecards.OrderByDescending(x => x.CompletedSessions).ThenByDescending(x => x.StudentAttendanceRate).ToList() });
    }

    private static async Task<IResult> GetCourseProfitabilityAsync(
        ClaimsPrincipal user,
        MadaDbContext db,
        Guid? branchId,
        CancellationToken cancellationToken)
    {
        if (!CanReadAnalytics(user)) return Results.Forbid();
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");

        var effectiveBranch = ResolveEffectiveBranch(user, branchId);

        var offerings = await (
            from co in db.CourseOfferings.AsNoTracking()
            join ct in db.CourseTemplates.AsNoTracking() on co.CourseTemplateId equals ct.Id
            join b in db.Branches.AsNoTracking() on co.BranchId equals b.Id
            join cr in db.Classrooms.AsNoTracking() on co.ClassroomId equals cr.Id
            where co.TenantId == tenantId && (!effectiveBranch.HasValue || co.BranchId == effectiveBranch)
            select new
            {
                OfferingId = co.Id,
                CourseName = ct.Name,
                Track = ct.Track,
                BranchId = co.BranchId,
                BranchName = b.Name,
                ClassroomName = cr.Name,
                co.MaxStudents,
                co.Status,
                co.StartDate,
                co.EndDate
            }
        ).ToListAsync(cancellationToken);

        var items = new List<CourseProfitabilityItem>();

        foreach (var off in offerings)
        {
            var enrolledCount = await db.StudentEnrollments.AsNoTracking()
                .CountAsync(x => x.CourseOfferingId == off.OfferingId && x.Status == "ACTIVE", cancellationToken);

            var studentIds = await db.StudentEnrollments.AsNoTracking()
                .Where(x => x.CourseOfferingId == off.OfferingId && x.Status == "ACTIVE")
                .Select(x => x.StudentId)
                .ToListAsync(cancellationToken);

            var invoices = await db.Invoices.AsNoTracking()
                .Where(x => studentIds.Contains(x.StudentId) && x.TenantId == tenantId)
                .Select(x => new
                {
                    x.Id,
                    x.TotalPiastres,
                    PaidPiastres = db.PaymentTransactions.Where(p => p.InvoiceId == x.Id).Sum(p => (int?)p.AmountPiastres) ?? 0
                })
                .ToListAsync(cancellationToken);

            var totalBilled = invoices.Sum(x => x.TotalPiastres);
            var totalCollected = invoices.Sum(x => x.PaidPiastres);
            var occupancyPercent = off.MaxStudents > 0
                ? Math.Round((decimal)enrolledCount * 100m / off.MaxStudents, 1)
                : 0m;

            items.Add(new CourseProfitabilityItem(
                off.OfferingId,
                off.CourseName,
                off.Track,
                off.BranchId,
                off.BranchName,
                off.ClassroomName,
                enrolledCount,
                off.MaxStudents,
                occupancyPercent,
                totalBilled,
                totalCollected,
                Math.Max(0, totalBilled - totalCollected),
                off.Status
            ));
        }

        return Results.Ok(new { data = items.OrderByDescending(x => x.TotalCollectedPiastres).ToList() });
    }

    private static async Task<IResult> GetBiFeedCsvAsync(
        ClaimsPrincipal user,
        MadaDbContext db,
        Guid? branchId,
        CancellationToken cancellationToken)
    {
        if (!CanReadAnalytics(user)) return Results.Forbid();
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");

        var effectiveBranch = ResolveEffectiveBranch(user, branchId);

        var rawRadarResult = await GetRetentionRadarAsync(user, db, effectiveBranch, cancellationToken);
        // Build clean Star Schema Dimensional CSV for Data Analysts
        var sb = new StringBuilder();
        sb.AppendLine("student_id,student_name,branch_id,branch_name,course_name,sessions_marked,attendance_percent,consecutive_absences,avg_evaluation_score,total_billed_egp,total_collected_egp,outstanding_egp,overdue_days,risk_level,risk_factor,recommended_action");

        var studentsQuery = db.Students.AsNoTracking()
            .Where(s => s.TenantId == tenantId && s.Status == "ACTIVE" && (!effectiveBranch.HasValue || s.BranchId == effectiveBranch));

        var enrolledStudents = await (
            from s in studentsQuery
            join e in db.StudentEnrollments.AsNoTracking().Where(x => x.Status == "ACTIVE") on s.Id equals e.StudentId
            join co in db.CourseOfferings.AsNoTracking() on e.CourseOfferingId equals co.Id
            join ct in db.CourseTemplates.AsNoTracking() on co.CourseTemplateId equals ct.Id
            join b in db.Branches.AsNoTracking() on s.BranchId equals b.Id
            select new
            {
                StudentId = s.Id,
                s.FullName,
                BranchId = s.BranchId,
                BranchName = b.Name,
                CourseName = ct.Name
            }
        ).ToListAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var s in enrolledStudents)
        {
            var studentAtt = await (
                from a in db.SessionAttendances.AsNoTracking()
                join sess in db.AcademySessions.AsNoTracking() on a.SessionId equals sess.Id
                where a.StudentId == s.StudentId && sess.TenantId == tenantId
                orderby sess.StartAt descending
                select new { a.Status, sess.StartAt }
            ).ToListAsync(cancellationToken);

            var totalMarked = studentAtt.Count;
            var attended = studentAtt.Count(x => x.Status == "PRESENT" || x.Status == "LATE");
            decimal attPercent = totalMarked > 0 ? Math.Round((decimal)attended * 100m / totalMarked, 1) : 100m;

            int consecAbsent = 0;
            foreach (var a in studentAtt.OrderByDescending(x => x.StartAt))
            {
                if (a.Status == "ABSENT") consecAbsent++;
                else break;
            }

            var evals = await db.SessionEvaluations.AsNoTracking()
                .Where(x => x.StudentId == s.StudentId && x.Score.HasValue)
                .Select(x => x.Score!.Value)
                .ToListAsync(cancellationToken);
            decimal? avgScore = evals.Count > 0 ? Math.Round((decimal)evals.Average(), 1) : null;

            var invoices = await (
                from inv in db.Invoices.AsNoTracking()
                where inv.StudentId == s.StudentId && inv.TenantId == tenantId
                select new
                {
                    inv.Id,
                    inv.TotalPiastres,
                    inv.DueDate,
                    Paid = db.PaymentTransactions.Where(p => p.InvoiceId == inv.Id).Sum(p => (int?)p.AmountPiastres) ?? 0
                }
            ).ToListAsync(cancellationToken);

            var billed = invoices.Sum(x => x.TotalPiastres) / 100m;
            var collected = invoices.Sum(x => x.Paid) / 100m;
            var outstanding = Math.Max(0, billed - collected);
            var maxOverdue = invoices.Where(x => x.DueDate < today && x.Paid < x.TotalPiastres).Select(x => today.DayNumber - x.DueDate.DayNumber).DefaultIfEmpty(0).Max();

            string risk = "LOW";
            string factor = "سجل ممتاز";
            string action = "حالة مستقرة";

            if (consecAbsent >= 2 || (totalMarked >= 3 && attPercent < 60) || (maxOverdue > 14 && outstanding > 0))
            {
                risk = "HIGH";
                factor = consecAbsent >= 2 ? $"غياب {consecAbsent} متتالي" : (maxOverdue > 14 ? "متأخرات مالية" : "حضور منخفض");
                action = "تواصل عاجل مع ولي الأمر";
            }
            else if (attPercent < 80 || (avgScore.HasValue && avgScore.Value < 70) || (maxOverdue > 5 && outstanding > 0))
            {
                risk = "MEDIUM";
                factor = attPercent < 80 ? "انخفاض طفيف بالحضور" : "تأخر سداد قسط";
                action = "متابعة دورية وتذكير بالسداد";
            }

            sb.AppendLine(string.Join(',',
                s.StudentId,
                EscapeCsv(s.FullName),
                s.BranchId,
                EscapeCsv(s.BranchName),
                EscapeCsv(s.CourseName),
                totalMarked,
                attPercent,
                consecAbsent,
                avgScore?.ToString() ?? "",
                billed.ToString("F2"),
                collected.ToString("F2"),
                outstanding.ToString("F2"),
                maxOverdue,
                risk,
                EscapeCsv(factor),
                EscapeCsv(action)
            ));
        }

        return Results.File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv; charset=utf-8", $"mada-analyst-bi-feed-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static string EscapeCsv(string value) => $"\"{value.Replace("\"", "\"\"")}\"";

    private static bool CanReadAnalytics(ClaimsPrincipal user) =>
        user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") ||
        user.IsInRole("R03_HEAD_INSTRUCTORS") || user.IsInRole("R06_ACCOUNTANT") ||
        user.IsInRole("R00_PLATFORM_ADMIN");

    private static Guid? ResolveEffectiveBranch(ClaimsPrincipal user, Guid? requestedBranchId)
    {
        var isBranchScoped = user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R06_ACCOUNTANT") || user.IsInRole("R03_HEAD_INSTRUCTORS");
        var claimedBranchId = Guid.TryParse(user.FindFirstValue("branchId"), out var parsed) ? parsed : (Guid?)null;
        return isBranchScoped ? claimedBranchId : requestedBranchId;
    }
}

public sealed record RetentionRadarItem(
    Guid StudentId,
    string FullName,
    Guid BranchId,
    string BranchName,
    Guid CourseOfferingId,
    string CourseName,
    int TotalSessionsMarked,
    decimal AttendancePercent,
    int ConsecutiveAbsences,
    decimal? AverageScore,
    int TotalBilledPiastres,
    int TotalPaidPiastres,
    int OutstandingPiastres,
    int MaxOverdueDays,
    string RiskLevel,
    string RiskFactor,
    string RecommendedAction
);

public sealed record InstructorScorecardItem(
    Guid InstructorId,
    string DisplayName,
    Guid? BranchId,
    string BranchName,
    int AssignedSessions,
    int CompletedSessions,
    decimal CompletionRate,
    int SubstituteCount,
    decimal StudentAttendanceRate,
    decimal? AverageEvaluationScore,
    int TotalEvaluationsCount
);

public sealed record CourseProfitabilityItem(
    Guid CourseOfferingId,
    string CourseName,
    string Track,
    Guid BranchId,
    string BranchName,
    string ClassroomName,
    int EnrolledCount,
    int Capacity,
    decimal OccupancyPercent,
    int TotalBilledPiastres,
    int TotalCollectedPiastres,
    int OutstandingPiastres,
    string Status
);
