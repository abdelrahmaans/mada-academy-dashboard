using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class EvaluationReviewApiTests
{
    [Fact]
    public async Task EvaluationReview_OnlyR03PublishesAndConsumersSeePublishedResults()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var managerClient = factory.CreateClient();
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);
        var reviewer = await TestData.CreateAccountAsync(factory, "R03_HEAD_INSTRUCTORS", manager.TenantId, manager.BranchId);
        var parent = await TestData.CreateConsumerAccountAsync(factory, manager.TenantId, "parent", "R08_PARENT");
        var (sessionId, studentId) = await SeedSessionAsync(factory, manager.TenantId, manager.BranchId, instructor.UserId, "Evaluation Child", "Robotics", false);
        var otherBranchId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranchId, TenantId = manager.TenantId, Name = "Other Branch", Code = $"B{Guid.NewGuid():N}"[..10] });
            await db.SaveChangesAsync();
        }
        var otherInstructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, otherBranchId);
        var (otherSessionId, otherStudentId) = await SeedSessionAsync(factory, manager.TenantId, otherBranchId, otherInstructor.UserId, "Hidden Branch Child", "Other Robotics", true);

        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        Assert.Equal(HttpStatusCode.OK, (await managerClient.PostAsJsonAsync($"/api/v1/students/{studentId}/guardians", new { userAccountId = parent.UserId, relationship = "Guardian" })).StatusCode);

        using var instructorClient = factory.CreateClient();
        TestData.Authenticate(instructorClient, await TestData.LoginAsync(instructorClient, instructor));
        var crossBranchEvaluationId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var offeringId = await db.AcademySessions.Where(item => item.Id == sessionId).Select(item => item.CourseOfferingId!.Value).SingleAsync();
            db.StudentEnrollments.Add(new StudentEnrollment { StudentId = otherStudentId, CourseOfferingId = offeringId, FinalPricePiastres = 0, Status = "ACTIVE" });
            db.SessionEvaluations.Add(new SessionEvaluation { Id = crossBranchEvaluationId, SessionId = sessionId, StudentId = otherStudentId, InstructorId = instructor.UserId, Score = 70, Notes = "Cross-branch record must stay hidden", Status = "SUBMITTED", SubmittedAt = DateTimeOffset.UtcNow });
            await db.SaveChangesAsync();
        }
        var crossBranchStudent = await instructorClient.PutAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations", new { items = new[] { new { studentId = otherStudentId, score = 70, notes = "Wrong branch" } } });
        Assert.Equal(HttpStatusCode.BadRequest, crossBranchStudent.StatusCode);
        var save = await instructorClient.PutAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations", new { items = new[] { new { studentId, score = 80, notes = "التطبيق العملي: 4/5\nملاحظة أصلية" } } });
        Assert.Equal(HttpStatusCode.OK, save.StatusCode);

        using var parentClient = factory.CreateClient();
        TestData.Authenticate(parentClient, await TestData.LoginAsync(parentClient, parent));
        var sessionsBeforeSubmit = await parentClient.GetStringAsync("/api/v1/consumer/me/sessions");
        Assert.Contains("\"score\":null", sessionsBeforeSubmit, StringComparison.Ordinal);
        Assert.DoesNotContain("ملاحظة أصلية", sessionsBeforeSubmit, StringComparison.Ordinal);

        Assert.Equal(HttpStatusCode.OK, (await instructorClient.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations/submit", new { studentIds = new[] { studentId } })).StatusCode);
        var sessionsWhileSubmitted = await parentClient.GetStringAsync("/api/v1/consumer/me/sessions");
        Assert.Contains("\"score\":null", sessionsWhileSubmitted, StringComparison.Ordinal);

        using var instructorReviewClient = factory.CreateClient();
        TestData.Authenticate(instructorReviewClient, await TestData.LoginAsync(instructorReviewClient, instructor));
        Assert.Equal(HttpStatusCode.Forbidden, (await instructorReviewClient.GetAsync("/api/v1/scheduling/evaluation-reviews")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await instructorReviewClient.GetAsync("/api/v1/scheduling/evaluation-status-summary")).StatusCode);

        using var reviewerClient = factory.CreateClient();
        TestData.Authenticate(reviewerClient, await TestData.LoginAsync(reviewerClient, reviewer));
        using var queueResponse = await reviewerClient.GetAsync("/api/v1/scheduling/evaluation-reviews");
        Assert.Equal(HttpStatusCode.OK, queueResponse.StatusCode);
        using var queueJson = await queueResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Review queue response is empty.");
        var queueItems = queueJson.RootElement.GetProperty("data").GetProperty("items");
        Assert.Equal(1, queueItems.GetArrayLength());
        var evaluationId = queueItems[0].GetProperty("id").GetGuid();
        Assert.Equal(studentId, queueItems[0].GetProperty("studentId").GetGuid());
        using (var statusResponse = await reviewerClient.GetAsync("/api/v1/scheduling/evaluation-status-summary"))
        {
            Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);
            using var statusJson = await statusResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Evaluation status summary response is empty.");
            var counts = statusJson.RootElement.GetProperty("data").GetProperty("counts");
            Assert.Equal(1, counts.GetProperty("SUBMITTED").GetInt32());
            Assert.Equal(0, counts.GetProperty("PUBLISHED").GetInt32());
        }
        Assert.Equal(HttpStatusCode.NotFound, (await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{crossBranchEvaluationId}/decision", new { decision = "PUBLISH" })).StatusCode);
        using var branchLeakResponse = await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{Guid.NewGuid()}/decision", new { decision = "PUBLISH" });
        Assert.Equal(HttpStatusCode.NotFound, branchLeakResponse.StatusCode);
        using var otherBranchEval = factory.Services.CreateScope();
        var dbCheck = otherBranchEval.ServiceProvider.GetRequiredService<MadaDbContext>();
        var otherEvaluationId = await dbCheck.SessionEvaluations.Where(item => item.SessionId == otherSessionId && item.StudentId == otherStudentId).Select(item => item.Id).SingleAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{otherEvaluationId}/decision", new { decision = "PUBLISH" })).StatusCode);

        var missingNote = await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{evaluationId}/decision", new { decision = "REQUEST_CHANGES", note = " " });
        Assert.Equal(HttpStatusCode.BadRequest, missingNote.StatusCode);
        var returned = await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{evaluationId}/decision", new { decision = "REQUEST_CHANGES", note = "أضف خطوة تالية محددة." });
        Assert.Equal(HttpStatusCode.OK, returned.StatusCode);
        var changeNotice = await instructorClient.GetStringAsync("/api/v1/scheduling/notifications?unreadOnly=true");
        Assert.Contains("EVALUATION_CHANGES_REQUESTED", changeNotice, StringComparison.Ordinal);
        using (var statusResponse = await reviewerClient.GetAsync("/api/v1/scheduling/evaluation-status-summary"))
        {
            using var statusJson = await statusResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Evaluation status summary response is empty.");
            var counts = statusJson.RootElement.GetProperty("data").GetProperty("counts");
            Assert.Equal(1, counts.GetProperty("CHANGES_REQUESTED").GetInt32());
            Assert.Equal(0, counts.GetProperty("SUBMITTED").GetInt32());
        }
        var sessionsAfterReturn = await parentClient.GetStringAsync("/api/v1/consumer/me/sessions");
        Assert.Contains("\"score\":null", sessionsAfterReturn, StringComparison.Ordinal);

        var editableDraft = await instructorClient.PutAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations", new { items = new[] { new { studentId, score = 90, notes = "استيعاب الفكرة: 5/5\nتقدم واضح" } } });
        Assert.Equal(HttpStatusCode.OK, editableDraft.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await instructorClient.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations/submit", new { studentIds = new[] { studentId } })).StatusCode);
        var resubmissionNotice = await reviewerClient.GetStringAsync("/api/v1/scheduling/notifications?unreadOnly=true");
        Assert.Contains("EVALUATION_SUBMITTED", resubmissionNotice, StringComparison.Ordinal);
        using var publishResponse = await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{evaluationId}/decision", new { decision = "PUBLISH" });
        Assert.Equal(HttpStatusCode.OK, publishResponse.StatusCode);
        var published = await parentClient.GetStringAsync("/api/v1/consumer/me/sessions");
        Assert.Contains("\"score\":90", published, StringComparison.Ordinal);
        Assert.Contains("تقدم واضح", published, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Conflict, (await instructorClient.PutAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations", new { items = new[] { new { studentId, score = 95, notes = "Should not replace published grade" } } })).StatusCode);
        var publishedNotice = await instructorClient.GetStringAsync("/api/v1/scheduling/notifications?unreadOnly=true");
        Assert.Contains("EVALUATION_PUBLISHED", publishedNotice, StringComparison.Ordinal);
        using (var statusResponse = await reviewerClient.GetAsync("/api/v1/scheduling/evaluation-status-summary"))
        {
            using var statusJson = await statusResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Evaluation status summary response is empty.");
            var counts = statusJson.RootElement.GetProperty("data").GetProperty("counts");
            Assert.Equal(1, counts.GetProperty("PUBLISHED").GetInt32());
            Assert.Equal(0, counts.GetProperty("SUBMITTED").GetInt32());
        }
        using (var auditScope = factory.Services.CreateScope())
        {
            var db = auditScope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var transitions = await db.StateTransitions.Where(item => item.AggregateType == "SESSION_EVALUATION" && item.AggregateId == evaluationId.ToString()).OrderBy(item => item.CreatedAt).ToListAsync();
            Assert.Equal(new[] { "SUBMITTED", "CHANGES_REQUESTED", "SUBMITTED", "PUBLISHED" }, transitions.Select(item => item.ToState));
            Assert.Contains(transitions, item => item.ToState == "CHANGES_REQUESTED" && item.ActorUserId == reviewer.UserId && item.Reason == "أضف خطوة تالية محددة.");
            Assert.Contains(transitions, item => item.ToState == "PUBLISHED" && item.ActorUserId == reviewer.UserId);
        }
    }

    private static async Task<(Guid SessionId, Guid StudentId)> SeedSessionAsync(TestApiFactory factory, Guid tenantId, Guid branchId, Guid instructorId, string studentName, string courseName, bool seedSubmittedEvaluation)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var studentId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var offeringId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var classroomId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        db.Students.Add(new Student { Id = studentId, TenantId = tenantId, BranchId = branchId, FullName = studentName });
        db.CourseTemplates.Add(new CourseTemplate { Id = templateId, TenantId = tenantId, Name = courseName, TotalSessions = 8, SessionDurationHours = 1, BasePricePiastres = 0 });
        db.Classrooms.Add(new Classroom { Id = classroomId, BranchId = branchId, Name = $"Room-{Guid.NewGuid():N}"[..13], Capacity = 12 });
        db.CourseOfferings.Add(new CourseOffering { Id = offeringId, TenantId = tenantId, BranchId = branchId, CourseTemplateId = templateId, InstructorId = instructorId, ClassroomId = classroomId, StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), MaxStudents = 12 });
        db.StudentEnrollments.Add(new StudentEnrollment { StudentId = studentId, CourseOfferingId = offeringId, FinalPricePiastres = 0, Status = "ACTIVE" });
        db.AcademySessions.Add(new AcademySession { Id = sessionId, TenantId = tenantId, BranchId = branchId, CourseOfferingId = offeringId, SessionNumber = 1, StartAt = now.AddDays(-1), EndAt = now.AddDays(-1).AddHours(1), InstructorId = instructorId, ClassroomId = classroomId, Status = "COMPLETED" });
        if (seedSubmittedEvaluation) db.SessionEvaluations.Add(new SessionEvaluation { Id = Guid.NewGuid(), SessionId = sessionId, StudentId = studentId, InstructorId = instructorId, Score = 55, Notes = "Branch B sample", Status = "SUBMITTED", SubmittedAt = now });
        await db.SaveChangesAsync();
        return (sessionId, studentId);
    }
}
