using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class ExecutiveDashboardApiTests
{
    [Fact]
    public async Task ExecutiveSummary_AggregatesOnlyTenantDataWithinSelectedPeriodAndBranch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var secondBranchId = Guid.NewGuid();
        var foreignTenantId = Guid.NewGuid();
        var foreignBranchId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var previousMonth = today.AddMonths(-1);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.AddRange(
                new Branch { Id = secondBranchId, TenantId = owner.TenantId, Name = "Second Branch", Code = "SECOND" },
                new Branch { Id = foreignBranchId, TenantId = foreignTenantId, Name = "Foreign Branch", Code = "FOREIGN" });
            db.Tenants.Add(new Tenant { Id = foreignTenantId, Name = "Foreign Academy", Slug = $"foreign-{foreignTenantId:N}" });
            await db.SaveChangesAsync();

            var firstStudentId = Guid.NewGuid();
            var inactiveStudentId = Guid.NewGuid();
            var secondStudentId = Guid.NewGuid();
            var foreignStudentId = Guid.NewGuid();
            db.Students.AddRange(
                new Student { Id = firstStudentId, TenantId = owner.TenantId, BranchId = owner.BranchId, FullName = "First Student" },
                new Student { Id = inactiveStudentId, TenantId = owner.TenantId, BranchId = owner.BranchId, FullName = "Inactive Student", Status = "INACTIVE" },
                new Student { Id = secondStudentId, TenantId = owner.TenantId, BranchId = secondBranchId, FullName = "Second Student" },
                new Student { Id = foreignStudentId, TenantId = foreignTenantId, BranchId = foreignBranchId, FullName = "Foreign Student" });
            db.StudentEnrollments.AddRange(
                new StudentEnrollment { StudentId = firstStudentId, CourseOfferingId = Guid.NewGuid() },
                new StudentEnrollment { StudentId = inactiveStudentId, CourseOfferingId = Guid.NewGuid() },
                new StudentEnrollment { StudentId = secondStudentId, CourseOfferingId = Guid.NewGuid() },
                new StudentEnrollment { StudentId = foreignStudentId, CourseOfferingId = Guid.NewGuid() });

            var firstSessionId = Guid.NewGuid();
            var secondSessionId = Guid.NewGuid();
            var otherBranchSessionId = Guid.NewGuid();
            var oldSessionId = Guid.NewGuid();
            db.AcademySessions.AddRange(
                new AcademySession { Id = firstSessionId, TenantId = owner.TenantId, BranchId = owner.BranchId, SessionNumber = 1, StartAt = StartOfDay(today).AddHours(9), EndAt = StartOfDay(today).AddHours(10), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "COMPLETED" },
                new AcademySession { Id = secondSessionId, TenantId = owner.TenantId, BranchId = owner.BranchId, SessionNumber = 2, StartAt = StartOfDay(today).AddHours(11), EndAt = StartOfDay(today).AddHours(12), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "SCHEDULED" },
                new AcademySession { Id = otherBranchSessionId, TenantId = owner.TenantId, BranchId = secondBranchId, SessionNumber = 1, StartAt = StartOfDay(today).AddHours(13), EndAt = StartOfDay(today).AddHours(14), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "COMPLETED" },
                new AcademySession { Id = oldSessionId, TenantId = owner.TenantId, BranchId = owner.BranchId, SessionNumber = 3, StartAt = StartOfDay(previousMonth).AddHours(9), EndAt = StartOfDay(previousMonth).AddHours(10), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "COMPLETED" });
            db.SessionAttendances.AddRange(
                new SessionAttendance { SessionId = firstSessionId, StudentId = firstStudentId, Status = "PRESENT" },
                new SessionAttendance { SessionId = secondSessionId, StudentId = firstStudentId, Status = "ABSENT" },
                new SessionAttendance { SessionId = otherBranchSessionId, StudentId = secondStudentId, Status = "LATE" },
                new SessionAttendance { SessionId = oldSessionId, StudentId = firstStudentId, Status = "PRESENT" });

            var firstInvoiceId = Guid.NewGuid();
            var secondInvoiceId = Guid.NewGuid();
            var foreignInvoiceId = Guid.NewGuid();
            db.Invoices.AddRange(
                new Invoice { Id = firstInvoiceId, TenantId = owner.TenantId, BranchId = owner.BranchId, StudentId = firstStudentId, InvoiceNumber = $"R1-{Guid.NewGuid():N}", TotalPiastres = 10_000, DueDate = today.AddDays(10), CreatedByUserId = owner.UserId },
                new Invoice { Id = secondInvoiceId, TenantId = owner.TenantId, BranchId = secondBranchId, StudentId = secondStudentId, InvoiceNumber = $"R1-{Guid.NewGuid():N}", TotalPiastres = 10_000, DueDate = today.AddDays(10), CreatedByUserId = owner.UserId },
                new Invoice { Id = foreignInvoiceId, TenantId = foreignTenantId, BranchId = foreignBranchId, StudentId = foreignStudentId, InvoiceNumber = $"R1-{Guid.NewGuid():N}", TotalPiastres = 100_000, DueDate = today.AddDays(10), CreatedByUserId = owner.UserId });
            db.PaymentTransactions.AddRange(
                new PaymentTransaction { TenantId = owner.TenantId, BranchId = owner.BranchId, InvoiceId = firstInvoiceId, AmountPiastres = 5_000, Method = "CASH", ReceivedOn = today, RecordedByUserId = owner.UserId },
                new PaymentTransaction { TenantId = owner.TenantId, BranchId = secondBranchId, InvoiceId = secondInvoiceId, AmountPiastres = 2_000, Method = "VISA", ReceivedOn = today, RecordedByUserId = owner.UserId },
                new PaymentTransaction { TenantId = owner.TenantId, BranchId = owner.BranchId, InvoiceId = firstInvoiceId, AmountPiastres = 10_000, Method = "CASH", ReceivedOn = previousMonth, RecordedByUserId = owner.UserId },
                new PaymentTransaction { TenantId = foreignTenantId, BranchId = foreignBranchId, InvoiceId = foreignInvoiceId, AmountPiastres = 100_000, Method = "CASH", ReceivedOn = today, RecordedByUserId = owner.UserId });
            db.Expenses.AddRange(
                new Expense { TenantId = owner.TenantId, BranchId = owner.BranchId, Description = "Approved expense one", Category = "OPERATIONS", AmountPiastres = 1_000, SpentOn = today, CreatedByUserId = owner.UserId, Status = "APPROVED" },
                new Expense { TenantId = owner.TenantId, BranchId = owner.BranchId, Description = "Pending expense", Category = "OPERATIONS", AmountPiastres = 9_000, SpentOn = today, CreatedByUserId = owner.UserId, Status = "PENDING" },
                new Expense { TenantId = owner.TenantId, BranchId = secondBranchId, Description = "Approved expense two", Category = "OPERATIONS", AmountPiastres = 500, SpentOn = today, CreatedByUserId = owner.UserId, Status = "APPROVED" });
            db.ApprovalRequests.AddRange(
                new ApprovalRequest { TenantId = owner.TenantId, BranchId = owner.BranchId, RequestType = "EXPENSE_APPROVAL", TargetType = "EXPENSE", TargetId = Guid.NewGuid().ToString(), SubmittedByRole = "R06_ACCOUNTANT", State = "PENDING" },
                new ApprovalRequest { TenantId = owner.TenantId, BranchId = secondBranchId, RequestType = "SESSION_APPROVAL", TargetType = "SESSION", TargetId = Guid.NewGuid().ToString(), SubmittedByRole = "R04_INSTRUCTOR", State = "PENDING" });
            await db.SaveChangesAsync();
        }

        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));
        var response = await client.GetAsync($"/api/v1/academy/executive-summary?from={today:yyyy-MM-dd}&to={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var data = document.RootElement.GetProperty("data");
        var summary = data.GetProperty("summary");
        Assert.Equal(2, summary.GetProperty("activeStudents").GetInt32());
        Assert.Equal(2, summary.GetProperty("activeEnrollments").GetInt32());
        Assert.Equal(3, summary.GetProperty("sessions").GetInt32());
        Assert.Equal(2, summary.GetProperty("completedSessions").GetInt32());
        Assert.Equal(2, summary.GetProperty("attendedCount").GetInt32());
        Assert.Equal(3, summary.GetProperty("attendanceMarkedCount").GetInt32());
        Assert.Equal(66.7m, summary.GetProperty("attendancePercent").GetDecimal());
        Assert.Equal(7_000, summary.GetProperty("collectedPiastres").GetInt64());
        Assert.Equal(1_500, summary.GetProperty("approvedExpensesPiastres").GetInt64());
        Assert.Equal(5_500, summary.GetProperty("netPiastres").GetInt64());
        Assert.Equal(2, summary.GetProperty("pendingApprovals").GetInt32());
        Assert.Equal(2, data.GetProperty("branches").GetArrayLength());
        Assert.True(data.GetProperty("alerts").GetArrayLength() > 0);
        Assert.DoesNotContain("Foreign Branch", document.RootElement.ToString(), StringComparison.Ordinal);
        Assert.Contains("PaymentTransactions by ReceivedOn", data.GetProperty("dataSources").GetProperty("collections").GetString());

        var branchResponse = await client.GetAsync($"/api/v1/academy/executive-summary?from={today:yyyy-MM-dd}&to={today:yyyy-MM-dd}&branchId={owner.BranchId}");
        Assert.Equal(HttpStatusCode.OK, branchResponse.StatusCode);
        using var branchDocument = JsonDocument.Parse(await branchResponse.Content.ReadAsStringAsync());
        var branchData = branchDocument.RootElement.GetProperty("data");
        Assert.Equal(1, branchData.GetProperty("branches").GetArrayLength());
        Assert.Equal(5_000, branchData.GetProperty("summary").GetProperty("collectedPiastres").GetInt64());
        Assert.Equal(1, branchData.GetProperty("summary").GetProperty("pendingApprovals").GetInt32());

        var foreignBranchResponse = await client.GetAsync($"/api/v1/academy/executive-summary?branchId={foreignBranchId}");
        Assert.Equal(HttpStatusCode.NotFound, foreignBranchResponse.StatusCode);
    }

    [Fact]
    public async Task ExecutiveSummary_IsReadOnlyAndOnlyAvailableToAcademyOwner()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var branchManager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, branchManager));

        Assert.Equal(HttpStatusCode.Forbidden,
            (await client.GetAsync("/api/v1/academy/executive-summary")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await client.GetAsync("/api/v1/academy/executive-activity")).StatusCode);
        Assert.Equal(HttpStatusCode.MethodNotAllowed,
            (await client.PostAsync("/api/v1/academy/executive-summary", content: null)).StatusCode);
    }

    [Fact]
    public async Task ExecutiveActivity_CombinesAuditAndDecisionsWithinTenantBranchAndPeriod()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var otherOwner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var secondBranchId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var auditId = Guid.NewGuid();
        var globalAuditId = Guid.NewGuid();
        var otherBranchAuditId = Guid.NewGuid();
        var foreignAuditId = Guid.NewGuid();
        var decisionId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = secondBranchId, TenantId = owner.TenantId, Name = "Executive Activity Other Branch", Code = "ACTIVITY-OTHER" });
            db.AuditEvents.AddRange(
                new AuditEvent { Id = auditId, TenantId = owner.TenantId, BranchId = owner.BranchId, Action = "PAYMENT_RECORDED", TargetType = "PAYMENT", TargetId = auditId.ToString(), Reason = "payment verified" },
                new AuditEvent { Id = globalAuditId, TenantId = owner.TenantId, Action = "BRANCH_CREATED", TargetType = "BRANCH", TargetId = globalAuditId.ToString() },
                new AuditEvent { Id = otherBranchAuditId, TenantId = owner.TenantId, BranchId = secondBranchId, Action = "OTHER_BRANCH_EVENT", TargetType = "TEST", TargetId = otherBranchAuditId.ToString() },
                new AuditEvent { Id = foreignAuditId, TenantId = otherOwner.TenantId, BranchId = otherOwner.BranchId, Action = "FOREIGN_TENANT_EVENT", TargetType = "TEST", TargetId = foreignAuditId.ToString() });
            db.ApprovalRequests.Add(new ApprovalRequest { Id = decisionId, TenantId = owner.TenantId, BranchId = owner.BranchId, RequestType = "EXPENSE_APPROVAL", TargetType = "EXPENSE", TargetId = "approved-expense", SubmittedByRole = "R06_ACCOUNTANT", State = "APPROVED", Reason = "approved after review", DecidedByUserId = owner.UserId, DecidedAt = DateTimeOffset.UtcNow });
            await db.SaveChangesAsync();
        }

        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));
        using var response = await client.GetAsync($"/api/v1/academy/executive-activity?from={today:yyyy-MM-dd}&to={today:yyyy-MM-dd}&branchId={owner.BranchId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Executive activity response is empty.");
        var items = document.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().ToArray();
        Assert.Contains(items, item => item.GetProperty("id").GetGuid() == auditId && item.GetProperty("source").GetString() == "AUDIT");
        Assert.Contains(items, item => item.GetProperty("id").GetGuid() == globalAuditId);
        Assert.Contains(items, item => item.GetProperty("id").GetGuid() == decisionId && item.GetProperty("source").GetString() == "DECISION" && item.GetProperty("state").GetString() == "APPROVED");
        Assert.DoesNotContain(items, item => item.GetProperty("id").GetGuid() == otherBranchAuditId);
        Assert.DoesNotContain(items, item => item.GetProperty("id").GetGuid() == foreignAuditId);
        Assert.DoesNotContain(document.RootElement.ToString(), "MetadataJson", StringComparison.Ordinal);
    }

    private static DateTimeOffset StartOfDay(DateOnly date)
        => new(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
}
