using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
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
