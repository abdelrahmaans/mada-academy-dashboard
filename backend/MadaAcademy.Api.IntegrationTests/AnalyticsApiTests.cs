using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class AnalyticsApiTests
{
    [Fact]
    public async Task RetentionRadar_DetectsAtRiskStudentsAccurately()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var branch = Guid.NewGuid();

        var stableStudent = new Student { Id = Guid.NewGuid(), TenantId = owner.TenantId, BranchId = branch, FullName = "Tariq Stable", Status = "ACTIVE" };
        var atRiskStudent = new Student { Id = Guid.NewGuid(), TenantId = owner.TenantId, BranchId = branch, FullName = "Kareem AtRisk", Status = "ACTIVE" };

        var courseTemplate = new CourseTemplate { Id = Guid.NewGuid(), TenantId = owner.TenantId, Name = "Data Science Robotics", Track = "robotics", BasePricePiastres = 250_000 };
        var classroom = new Classroom { Id = Guid.NewGuid(), BranchId = branch, Name = "AI Lab", Capacity = 10 };
        var offering = new CourseOffering { Id = Guid.NewGuid(), TenantId = owner.TenantId, BranchId = branch, CourseTemplateId = courseTemplate.Id, InstructorId = owner.UserId, ClassroomId = classroom.Id, MaxStudents = 10, Status = "ACTIVE" };

        var sess1 = new AcademySession { Id = Guid.NewGuid(), TenantId = owner.TenantId, BranchId = branch, CourseOfferingId = offering.Id, SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddDays(-10), EndAt = DateTimeOffset.UtcNow.AddDays(-10).AddHours(1), InstructorId = owner.UserId, ClassroomId = classroom.Id, Status = "COMPLETED" };
        var sess2 = new AcademySession { Id = Guid.NewGuid(), TenantId = owner.TenantId, BranchId = branch, CourseOfferingId = offering.Id, SessionNumber = 2, StartAt = DateTimeOffset.UtcNow.AddDays(-3), EndAt = DateTimeOffset.UtcNow.AddDays(-3).AddHours(1), InstructorId = owner.UserId, ClassroomId = classroom.Id, Status = "COMPLETED" };

        var overdueInvoice = new Invoice { Id = Guid.NewGuid(), TenantId = owner.TenantId, BranchId = branch, StudentId = atRiskStudent.Id, InvoiceNumber = "INV-RISK-01", TotalPiastres = 250_000, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-20)), CreatedByUserId = owner.UserId };

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = branch, TenantId = owner.TenantId, Name = "Main Campus", Code = "CAMPUS" });
            db.CourseTemplates.Add(courseTemplate);
            db.Classrooms.Add(classroom);
            db.CourseOfferings.Add(offering);
            db.Students.AddRange(stableStudent, atRiskStudent);
            db.StudentEnrollments.AddRange(
                new StudentEnrollment { StudentId = stableStudent.Id, CourseOfferingId = offering.Id, FinalPricePiastres = 250_000, Status = "ACTIVE" },
                new StudentEnrollment { StudentId = atRiskStudent.Id, CourseOfferingId = offering.Id, FinalPricePiastres = 250_000, Status = "ACTIVE" }
            );
            db.AcademySessions.AddRange(sess1, sess2);

            // Stable: present at both
            db.SessionAttendances.Add(new SessionAttendance { SessionId = sess1.Id, StudentId = stableStudent.Id, Status = "PRESENT" });
            db.SessionAttendances.Add(new SessionAttendance { SessionId = sess2.Id, StudentId = stableStudent.Id, Status = "PRESENT" });
            db.SessionEvaluations.Add(new SessionEvaluation { SessionId = sess1.Id, StudentId = stableStudent.Id, InstructorId = owner.UserId, Score = 90, Status = "PUBLISHED" });

            // At-Risk: absent at both (2 consecutive absences) + overdue invoice
            db.SessionAttendances.Add(new SessionAttendance { SessionId = sess1.Id, StudentId = atRiskStudent.Id, Status = "ABSENT" });
            db.SessionAttendances.Add(new SessionAttendance { SessionId = sess2.Id, StudentId = atRiskStudent.Id, Status = "ABSENT" });
            db.SessionEvaluations.Add(new SessionEvaluation { SessionId = sess1.Id, StudentId = atRiskStudent.Id, InstructorId = owner.UserId, Score = 55, Status = "PUBLISHED" });

            db.Invoices.Add(overdueInvoice);
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));

        // 1. Retention Radar API
        var radarResponse = await client.GetAsync("/api/v1/reports/analytics/retention-radar");
        Assert.Equal(HttpStatusCode.OK, radarResponse.StatusCode);
        var radarJson = await radarResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Radar response missing.");
        var summary = radarJson.RootElement.GetProperty("data").GetProperty("summary");
        Assert.Equal(2, summary.GetProperty("totalStudents").GetInt32());
        Assert.Equal(1, summary.GetProperty("highRiskCount").GetInt32());
        Assert.Equal(1, summary.GetProperty("lowRiskCount").GetInt32());

        // 2. Instructor Scorecard API
        var scorecardResponse = await client.GetAsync("/api/v1/reports/analytics/instructor-scorecard");
        Assert.Equal(HttpStatusCode.OK, scorecardResponse.StatusCode);

        // 3. Course Profitability API
        var profitResponse = await client.GetAsync("/api/v1/reports/analytics/course-profitability");
        Assert.Equal(HttpStatusCode.OK, profitResponse.StatusCode);
        var profitJson = await profitResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Profit response missing.");
        var items = profitJson.RootElement.GetProperty("data").EnumerateArray().ToList();
        Assert.Single(items);
        Assert.Equal(2, items[0].GetProperty("enrolledCount").GetInt32());

        // 4. BI Feed CSV Export
        var csvResponse = await client.GetAsync("/api/v1/reports/analytics/bi-feed.csv");
        Assert.Equal(HttpStatusCode.OK, csvResponse.StatusCode);
        Assert.Equal("text/csv; charset=utf-8", csvResponse.Content.Headers.ContentType?.ToString());
        var csvContent = await csvResponse.Content.ReadAsStringAsync();
        Assert.Contains("student_id,student_name", csvContent);
        Assert.Contains("Kareem AtRisk", csvContent);
        Assert.Contains("HIGH", csvContent);
    }
}
