using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class SessionCompletionApiTests
{
    [Fact]
    public async Task AssignedInstructor_CompletesEndedSessionAfterAttendance_AndWritesAudit()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        var (sessionId, studentId) = await SeedSessionAsync(factory, instructor, marked: true, ended: true);
        TestData.Authenticate(client, await TestData.LoginAsync(client, instructor));

        using var response = await client.PostAsync($"/api/v1/sessions/{sessionId}/complete", content: null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Completion response is empty.");
        var data = json.RootElement.GetProperty("data");
        Assert.Equal(sessionId, data.GetProperty("sessionId").GetGuid());
        Assert.Equal("COMPLETED", data.GetProperty("status").GetString());
        Assert.True(data.GetProperty("completedAt").GetDateTimeOffset() <= DateTimeOffset.UtcNow);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var session = await db.AcademySessions.SingleAsync(item => item.Id == sessionId);
            Assert.Equal("COMPLETED", session.Status);
            Assert.NotNull(session.CompletedAt);
            var transition = await db.StateTransitions.SingleAsync(item => item.AggregateType == "SESSION" && item.AggregateId == sessionId.ToString());
            Assert.Equal("SCHEDULED", transition.FromState);
            Assert.Equal("COMPLETED", transition.ToState);
            Assert.Equal(instructor.UserId, transition.ActorUserId);
            var audit = await db.AuditEvents.SingleAsync(item => item.Action == "SESSION_COMPLETED" && item.TargetId == sessionId.ToString());
            Assert.Equal(instructor.UserId, audit.ActorUserId);
            Assert.Equal(instructor.TenantId, audit.TenantId);
            Assert.Equal(instructor.BranchId, audit.BranchId);
        }

        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsync($"/api/v1/sessions/{sessionId}/complete", content: null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PutAsJsonAsync($"/api/v1/sessions/{sessionId}/attendance", new { records = new[] { new { studentId, status = "PRESENT" } } })).StatusCode);
    }

    [Fact]
    public async Task Completion_RequiresAttendanceForEveryEnrolledStudent()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        var (sessionId, _) = await SeedSessionAsync(factory, instructor, marked: false, ended: true);
        TestData.Authenticate(client, await TestData.LoginAsync(client, instructor));

        using var response = await client.PostAsync($"/api/v1/sessions/{sessionId}/complete", content: null);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ATTENDANCE_INCOMPLETE", body, StringComparison.Ordinal);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal("SCHEDULED", (await db.AcademySessions.SingleAsync(item => item.Id == sessionId)).Status);
        Assert.Empty(await db.StateTransitions.Where(item => item.AggregateType == "SESSION" && item.AggregateId == sessionId.ToString()).ToListAsync());
    }

    [Fact]
    public async Task Completion_RequiresSessionToHaveEnded()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        var (sessionId, _) = await SeedSessionAsync(factory, instructor, marked: true, ended: false);
        TestData.Authenticate(client, await TestData.LoginAsync(client, instructor));

        using var response = await client.PostAsync($"/api/v1/sessions/{sessionId}/complete", content: null);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Contains("SESSION_NOT_ENDED", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Completion_IsHiddenFromUnassignedInstructorAndForbiddenToOtherRoles()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var assigned = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        var otherInstructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", assigned.TenantId, assigned.BranchId);
        var (sessionId, _) = await SeedSessionAsync(factory, otherInstructor, marked: true, ended: true);
        using var otherClient = factory.CreateClient();
        TestData.Authenticate(otherClient, await TestData.LoginAsync(otherClient, assigned));
        Assert.Equal(HttpStatusCode.NotFound, (await otherClient.PostAsync($"/api/v1/sessions/{sessionId}/complete", content: null)).StatusCode);

        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER", assigned.TenantId, assigned.BranchId);
        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        Assert.Equal(HttpStatusCode.Forbidden, (await managerClient.PostAsync($"/api/v1/sessions/{sessionId}/complete", content: null)).StatusCode);
    }

    private static async Task<(Guid SessionId, Guid StudentId)> SeedSessionAsync(TestApiFactory factory, TestAccount instructor, bool marked, bool ended)
    {
        var studentId = Guid.NewGuid();
        var offeringId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var startAt = ended ? now.AddHours(-2) : now.AddMinutes(30);
        var endAt = ended ? now.AddHours(-1) : now.AddHours(1);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        db.Students.Add(new Student { Id = studentId, TenantId = instructor.TenantId, BranchId = instructor.BranchId, FullName = "R04 Completion Student" });
        db.CourseOfferings.Add(new CourseOffering
        {
            Id = offeringId,
            TenantId = instructor.TenantId,
            BranchId = instructor.BranchId,
            CourseTemplateId = Guid.NewGuid(),
            InstructorId = instructor.UserId,
            ClassroomId = Guid.NewGuid(),
            StartDate = DateOnly.FromDateTime(now.UtcDateTime),
            EndDate = DateOnly.FromDateTime(now.UtcDateTime.AddDays(7)),
            MaxStudents = 8
        });
        db.StudentEnrollments.Add(new StudentEnrollment { StudentId = studentId, CourseOfferingId = offeringId, Status = "ACTIVE" });
        db.AcademySessions.Add(new AcademySession
        {
            Id = sessionId,
            TenantId = instructor.TenantId,
            BranchId = instructor.BranchId,
            CourseOfferingId = offeringId,
            SessionNumber = 1,
            StartAt = startAt,
            EndAt = endAt,
            InstructorId = instructor.UserId,
            ClassroomId = Guid.NewGuid(),
            Status = "SCHEDULED"
        });
        if (marked) db.SessionAttendances.Add(new SessionAttendance { SessionId = sessionId, StudentId = studentId, Status = "PRESENT" });
        await db.SaveChangesAsync();
        return (sessionId, studentId);
    }
}
