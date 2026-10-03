using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class OperationalReportApiTests
{
    [Fact]
    public async Task OperationalReport_ReturnsScopedOperationalAndFinanceGaps()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var visibleStudent = new Student { TenantId = manager.TenantId, BranchId = manager.BranchId, FullName = "Visible P2 Student", Status = "ACTIVE" };
        var hiddenBranch = Guid.NewGuid();
        var hiddenStudent = new Student { TenantId = manager.TenantId, BranchId = hiddenBranch, FullName = "Hidden P2 Student", Status = "ACTIVE" };
        var sessionId = Guid.NewGuid();
        var invoiceId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = hiddenBranch, TenantId = manager.TenantId, Name = "Hidden Branch", Code = "HIDDEN" });
            db.Students.AddRange(visibleStudent, hiddenStudent);
            db.StudentEnrollments.Add(new StudentEnrollment { StudentId = visibleStudent.Id, CourseOfferingId = Guid.NewGuid(), FinalPricePiastres = 12_000, Status = "ACTIVE" });
            db.AcademySessions.Add(new AcademySession { Id = sessionId, TenantId = manager.TenantId, BranchId = manager.BranchId, SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddDays(-1), EndAt = DateTimeOffset.UtcNow.AddDays(-1).AddHours(1), InstructorId = manager.UserId, ClassroomId = Guid.NewGuid(), Status = "COMPLETED" });
            db.SessionAttendances.Add(new SessionAttendance { SessionId = sessionId, StudentId = visibleStudent.Id, Status = "PRESENT" });
            db.Invoices.Add(new Invoice { Id = invoiceId, TenantId = manager.TenantId, BranchId = manager.BranchId, StudentId = visibleStudent.Id, InvoiceNumber = "P2-REPORT-0001", TotalPiastres = 12_000, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), CreatedByUserId = manager.UserId });
            db.PaymentTransactions.Add(new PaymentTransaction { TenantId = manager.TenantId, BranchId = manager.BranchId, InvoiceId = invoiceId, AmountPiastres = 4_000, Method = "VISA", RecordedByUserId = manager.UserId });
            db.Expenses.AddRange(
                new Expense { TenantId = manager.TenantId, BranchId = manager.BranchId, Description = "Pending P2 expense", Category = "SUPPLIES", AmountPiastres = 1_000, Status = "PENDING", CreatedByUserId = manager.UserId },
                new Expense { TenantId = manager.TenantId, BranchId = manager.BranchId, Description = "Approved P2 expense", Category = "SUPPLIES", AmountPiastres = 2_000, Status = "APPROVED", CreatedByUserId = manager.UserId });
            db.Invoices.Add(new Invoice { TenantId = manager.TenantId, BranchId = hiddenBranch, StudentId = hiddenStudent.Id, InvoiceNumber = "P2-HIDDEN-0001", TotalPiastres = 99_000, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), CreatedByUserId = manager.UserId });
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, manager));
        var response = await client.GetAsync("/api/v1/reports/operational");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Operational report response missing.");
        var data = json.RootElement.GetProperty("data");
        Assert.Equal(1, data.GetProperty("activeStudents").GetInt32());
        Assert.Equal(1, data.GetProperty("activeEnrollments").GetInt32());
        Assert.Equal(1, data.GetProperty("sessions").GetInt32());
        Assert.Equal(100m, data.GetProperty("attendancePercent").GetDecimal());
        Assert.Equal(1, data.GetProperty("invoiceCount").GetInt32());
        Assert.Equal(12_000, data.GetProperty("totalBilledPiastres").GetInt64());
        Assert.Equal(4_000, data.GetProperty("totalCollectedPiastres").GetInt64());
        Assert.Equal(1, data.GetProperty("paymentsMissingEvidence").GetInt32());
        Assert.Equal(1, data.GetProperty("pendingExpenses").GetInt32());
        Assert.Equal(1, data.GetProperty("approvedExpenses").GetInt32());
        Assert.Equal(2_000, data.GetProperty("approvedExpensesPiastres").GetInt64());
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/v1/reports/operational?branchId={hiddenBranch}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/reports/operational.csv")).StatusCode);
    }
}
