using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class GroupSupervisionApiTests
{
    [Fact]
    public async Task BranchManagerCanAssignGroupAndR03OnlySeesAssignedGroup()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var supervisor = await TestData.CreateAccountAsync(factory, "R03_HEAD_INSTRUCTORS", manager.TenantId, manager.BranchId);
        Guid groupId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate { TenantId = manager.TenantId, Name = "Robotics Group", TotalSessions = 8, SessionDurationHours = 1, BasePricePiastres = 0 };
            var classroom = new Classroom { BranchId = manager.BranchId, Name = "Room 1", Capacity = 12 };
            db.AddRange(template, classroom);
            await db.SaveChangesAsync();
            var group = new CourseOffering { TenantId = manager.TenantId, BranchId = manager.BranchId, CourseTemplateId = template.Id, InstructorId = supervisor.UserId, ClassroomId = classroom.Id, StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), Status = "ACTIVE", MaxStudents = 12 };
            db.CourseOfferings.Add(group);
            await db.SaveChangesAsync();
            groupId = group.Id;
        }

        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        var denied = await managerClient.GetAsync("/api/v1/supervision/my-groups");
        Assert.Equal(HttpStatusCode.Forbidden, denied.StatusCode);
        var grant = await managerClient.PostAsJsonAsync("/api/v1/supervision/assignments", new { supervisorUserId = supervisor.UserId, courseOfferingId = groupId, canReadAttendance = true, canReviewEvaluations = true });
        Assert.Equal(HttpStatusCode.OK, grant.StatusCode);
        var grantJson = await grant.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Grant response missing.");
        var assignmentId = grantJson.RootElement.GetProperty("data").GetProperty("assignmentId").GetGuid();

        using var supervisorClient = factory.CreateClient();
        TestData.Authenticate(supervisorClient, await TestData.LoginAsync(supervisorClient, supervisor));
        var groups = await supervisorClient.GetAsync("/api/v1/scheduling/groups");
        Assert.Equal(HttpStatusCode.OK, groups.StatusCode);
        var groupsJson = await groups.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Groups response missing.");
        Assert.Equal(1, groupsJson.RootElement.GetProperty("data").GetProperty("total").GetInt32());
        Assert.Equal(HttpStatusCode.Forbidden, (await supervisorClient.GetAsync("/api/v1/supervision/branch-groups")).StatusCode);

        var revoke = await managerClient.DeleteAsync($"/api/v1/supervision/assignments/{assignmentId}");
        Assert.Equal(HttpStatusCode.OK, revoke.StatusCode);
        var afterRevoke = await supervisorClient.GetAsync("/api/v1/scheduling/groups");
        Assert.Equal(HttpStatusCode.OK, afterRevoke.StatusCode);
        var afterRevokeJson = await afterRevoke.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Groups response missing after revoke.");
        Assert.Equal(0, afterRevokeJson.RootElement.GetProperty("data").GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task BranchManagerCanAssignR04ReadOnlyGroupSupervisionWithinAssignedGroup()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var groupInstructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);
        var supervisor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);
        Guid supervisedGroupId;
        Guid supervisedSessionId;
        Guid supervisedStudentId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate { TenantId = manager.TenantId, Name = "Assigned Robotics", TotalSessions = 8, SessionDurationHours = 1, BasePricePiastres = 0 };
            var otherTemplate = new CourseTemplate { TenantId = manager.TenantId, Name = "Unassigned Robotics", TotalSessions = 8, SessionDurationHours = 1, BasePricePiastres = 0 };
            var classroom = new Classroom { BranchId = manager.BranchId, Name = "Supervisor Room", Capacity = 12 };
            db.AddRange(template, otherTemplate, classroom);
            await db.SaveChangesAsync();
            var supervisedGroup = new CourseOffering { TenantId = manager.TenantId, BranchId = manager.BranchId, CourseTemplateId = template.Id, InstructorId = groupInstructor.UserId, ClassroomId = classroom.Id, StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), Status = "ACTIVE", MaxStudents = 12 };
            var unassignedGroup = new CourseOffering { TenantId = manager.TenantId, BranchId = manager.BranchId, CourseTemplateId = otherTemplate.Id, InstructorId = groupInstructor.UserId, ClassroomId = classroom.Id, StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), Status = "ACTIVE", MaxStudents = 12 };
            db.CourseOfferings.AddRange(supervisedGroup, unassignedGroup);
            await db.SaveChangesAsync();
            supervisedGroupId = supervisedGroup.Id;
            supervisedSessionId = Guid.NewGuid();
            supervisedStudentId = Guid.NewGuid();
            var unassignedStudentId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;
            db.Students.AddRange(
                new Student { Id = supervisedStudentId, TenantId = manager.TenantId, BranchId = manager.BranchId, FullName = "Supervised Student" },
                new Student { Id = unassignedStudentId, TenantId = manager.TenantId, BranchId = manager.BranchId, FullName = "Unassigned Student" });
            db.StudentEnrollments.AddRange(
                new StudentEnrollment { StudentId = supervisedStudentId, CourseOfferingId = supervisedGroup.Id, Status = "ACTIVE" },
                new StudentEnrollment { StudentId = unassignedStudentId, CourseOfferingId = unassignedGroup.Id, Status = "ACTIVE" });
            db.AcademySessions.AddRange(
                new AcademySession { Id = supervisedSessionId, TenantId = manager.TenantId, BranchId = manager.BranchId, CourseOfferingId = supervisedGroup.Id, SessionNumber = 1, StartAt = now.AddMinutes(30), EndAt = now.AddMinutes(90), InstructorId = groupInstructor.UserId, ClassroomId = classroom.Id, Status = "SCHEDULED" },
                new AcademySession { TenantId = manager.TenantId, BranchId = manager.BranchId, CourseOfferingId = unassignedGroup.Id, SessionNumber = 1, StartAt = now.AddHours(2), EndAt = now.AddHours(3), InstructorId = groupInstructor.UserId, ClassroomId = classroom.Id, Status = "SCHEDULED" });
            db.SessionAttendances.Add(new SessionAttendance { SessionId = supervisedSessionId, StudentId = supervisedStudentId, Status = "PRESENT" });
            await db.SaveChangesAsync();
        }

        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        var grant = await managerClient.PostAsJsonAsync("/api/v1/supervision/assignments", new { supervisorUserId = supervisor.UserId, courseOfferingId = supervisedGroupId, canReadAttendance = true, canReviewEvaluations = false });
        Assert.Equal(HttpStatusCode.OK, grant.StatusCode);
        using var grantJson = await grant.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Grant response missing.");
        var assignmentId = grantJson.RootElement.GetProperty("data").GetProperty("assignmentId").GetGuid();

        using var supervisorClient = factory.CreateClient();
        TestData.Authenticate(supervisorClient, await TestData.LoginAsync(supervisorClient, supervisor));
        using var myGroups = await supervisorClient.GetAsync("/api/v1/supervision/my-groups");
        Assert.Equal(HttpStatusCode.OK, myGroups.StatusCode);
        using var myGroupsJson = await myGroups.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("My groups response missing.");
        var assignedGroups = myGroupsJson.RootElement.GetProperty("data").GetProperty("items");
        Assert.Single(assignedGroups.EnumerateArray());
        Assert.Equal(supervisedGroupId, assignedGroups[0].GetProperty("groupId").GetGuid());
        Assert.True(assignedGroups[0].GetProperty("canReadAttendance").GetBoolean());
        Assert.False(assignedGroups[0].GetProperty("canReviewEvaluations").GetBoolean());

        using var sessions = await supervisorClient.GetAsync("/api/v1/sessions");
        Assert.Equal(HttpStatusCode.OK, sessions.StatusCode);
        using var sessionsJson = await sessions.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Sessions response missing.");
        var visibleSessions = sessionsJson.RootElement.GetProperty("data").GetProperty("items");
        Assert.Single(visibleSessions.EnumerateArray());
        Assert.Equal(supervisedSessionId, visibleSessions[0].GetProperty("id").GetGuid());
        Assert.Equal(HttpStatusCode.OK, (await supervisorClient.GetAsync($"/api/v1/sessions/{supervisedSessionId}")).StatusCode);

        using var attendance = await supervisorClient.GetAsync($"/api/v1/sessions/{supervisedSessionId}/attendance");
        Assert.Equal(HttpStatusCode.OK, attendance.StatusCode);
        using var attendanceJson = await attendance.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Attendance response missing.");
        Assert.Equal(supervisedStudentId, attendanceJson.RootElement.GetProperty("data").GetProperty("items")[0].GetProperty("studentId").GetGuid());

        var attemptedWrite = await supervisorClient.PutAsJsonAsync($"/api/v1/sessions/{supervisedSessionId}/attendance", new { records = new[] { new { studentId = supervisedStudentId, status = "ABSENT" } } });
        Assert.Equal(HttpStatusCode.NotFound, attemptedWrite.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await supervisorClient.PostAsync($"/api/v1/sessions/{supervisedSessionId}/complete", content: null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await supervisorClient.GetAsync("/api/v1/scheduling/groups")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await supervisorClient.GetAsync("/api/v1/supervision/branch-groups")).StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            Assert.Equal("PRESENT", await db.SessionAttendances.Where(item => item.SessionId == supervisedSessionId && item.StudentId == supervisedStudentId).Select(item => item.Status).SingleAsync());
        }

        Assert.Equal(HttpStatusCode.OK, (await managerClient.DeleteAsync($"/api/v1/supervision/assignments/{assignmentId}")).StatusCode);
        using var groupsAfterRevoke = await supervisorClient.GetAsync("/api/v1/supervision/my-groups");
        Assert.Equal(0, (await groupsAfterRevoke.Content.ReadFromJsonAsync<JsonDocument>())!.RootElement.GetProperty("data").GetProperty("total").GetInt32());
        using var sessionsAfterRevoke = await supervisorClient.GetAsync("/api/v1/sessions");
        Assert.Equal(0, (await sessionsAfterRevoke.Content.ReadFromJsonAsync<JsonDocument>())!.RootElement.GetProperty("data").GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task ExpiredAssignmentCanBeRenewedAndPastEndTimeIsRejected()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var supervisor = await TestData.CreateAccountAsync(factory, "R03_HEAD_INSTRUCTORS", manager.TenantId, manager.BranchId);
        var groupId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate { TenantId = manager.TenantId, Name = "Expired Access Group", TotalSessions = 4, SessionDurationHours = 1, BasePricePiastres = 0 };
            var classroom = new Classroom { BranchId = manager.BranchId, Name = "Room Expired", Capacity = 12 };
            db.AddRange(template, classroom);
            await db.SaveChangesAsync();
            var group = new CourseOffering { Id = groupId, TenantId = manager.TenantId, BranchId = manager.BranchId, CourseTemplateId = template.Id, InstructorId = supervisor.UserId, ClassroomId = classroom.Id, StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), Status = "ACTIVE", MaxStudents = 12 };
            db.CourseOfferings.Add(group);
            db.GroupSupervisionAssignments.Add(new GroupSupervisionAssignment { TenantId = manager.TenantId, BranchId = manager.BranchId, SupervisorUserId = supervisor.UserId, CourseOfferingId = groupId, EndsAt = now.AddMinutes(-1), CreatedByUserId = manager.UserId });
            await db.SaveChangesAsync();
        }

        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        using var branchGroups = await managerClient.GetAsync("/api/v1/supervision/branch-groups");
        Assert.Equal(HttpStatusCode.OK, branchGroups.StatusCode);
        using var branchGroupsJson = await branchGroups.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Branch groups response missing.");
        Assert.False(branchGroupsJson.RootElement.GetProperty("data").GetProperty("items")[0].GetProperty("assignments")[0].GetProperty("isCurrentlyEffective").GetBoolean());

        var invalid = await managerClient.PostAsJsonAsync("/api/v1/supervision/assignments", new { supervisorUserId = supervisor.UserId, courseOfferingId = groupId, endsAt = now.AddMinutes(-1) });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        var renewal = await managerClient.PostAsJsonAsync("/api/v1/supervision/assignments", new { supervisorUserId = supervisor.UserId, courseOfferingId = groupId, endsAt = now.AddHours(1) });
        Assert.Equal(HttpStatusCode.OK, renewal.StatusCode);
        using var supervisorClient = factory.CreateClient();
        TestData.Authenticate(supervisorClient, await TestData.LoginAsync(supervisorClient, supervisor));
        using var groups = await supervisorClient.GetAsync("/api/v1/scheduling/groups");
        Assert.Equal(HttpStatusCode.OK, groups.StatusCode);
        using var groupsJson = await groups.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Groups response missing after renewal.");
        Assert.Equal(1, groupsJson.RootElement.GetProperty("data").GetProperty("total").GetInt32());
    }
}
