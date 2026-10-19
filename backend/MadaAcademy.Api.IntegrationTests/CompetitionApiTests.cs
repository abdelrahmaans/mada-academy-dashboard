using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Modules.Competitions;
using MadaAcademy.Api.Modules.Operations;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class CompetitionApiTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task Competitions_CreateAndList_SucceedsWithSummary()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));

        var req = new CreateCompetitionRequest(
            Name: "First LEGO League Cairo 2026",
            Organizer: "FIRST / IEEE",
            Season: "2026/2027",
            Track: "robotics",
            AgeMin: 9,
            AgeMax: 16,
            RegistrationDeadline: DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1)),
            EventDate: DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2)),
            Location: "Cairo Stadium Indoor Hall"
        );

        var res = await client.PostAsJsonAsync("/api/v1/competitions", req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var created = await res.Content.ReadFromJsonAsync<ApiEnvelope<CompetitionDetailItem>>(JsonOptions);
        Assert.NotNull(created?.Data);
        Assert.Equal("First LEGO League Cairo 2026", created.Data.Name);
        Assert.Equal("robotics", created.Data.Track);

        var listRes = await client.GetAsync("/api/v1/competitions");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var list = await listRes.Content.ReadFromJsonAsync<ApiEnvelope<IReadOnlyList<CompetitionSummaryItem>>>(JsonOptions);
        Assert.NotNull(list?.Data);
        Assert.Contains(list.Data, c => c.Id == created.Data.Id && c.Organizer == "FIRST / IEEE");
    }

    [Fact]
    public async Task Teams_CreateAddMember_AndRegisterAwardForHallOfFame()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var branchId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = branchId, TenantId = owner.TenantId, Name = "Dokki Branch", Code = "DOKKI" });
            db.Students.Add(new Student { Id = studentId, TenantId = owner.TenantId, BranchId = branchId, FullName = "Youssef Robotics", Status = "ACTIVE" });
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));

        // 1. Create Competition
        var compReq = new CreateCompetitionRequest(
            Name: "WRO Egypt 2026",
            Organizer: "World Robot Olympiad",
            Track: "robotics"
        );
        var compRes = await client.PostAsJsonAsync("/api/v1/competitions", compReq);
        var comp = (await compRes.Content.ReadFromJsonAsync<ApiEnvelope<CompetitionDetailItem>>(JsonOptions))!.Data;

        // 2. Register Team
        var teamReq = new CreateCompetitionTeamRequest(
            Name: "RoboTitans",
            CoachInstructorId: owner.UserId,
            BranchId: branchId,
            ProjectTitle: "Autonomous Harbor Cleaning Robot"
        );
        var teamRes = await client.PostAsJsonAsync($"/api/v1/competitions/{comp.Id}/teams", teamReq);
        Assert.Equal(HttpStatusCode.OK, teamRes.StatusCode);
        var team = (await teamRes.Content.ReadFromJsonAsync<ApiEnvelope<CompetitionTeamItem>>(JsonOptions))!.Data;
        Assert.Equal("RoboTitans", team.Name);
        Assert.Equal("FORMING", team.Status);

        // 3. Add Student to Team
        var memberReq = new AddTeamMemberRequest(studentId, "LEAD_PROGRAMMER");
        var memberRes = await client.PostAsJsonAsync($"/api/v1/competitions/teams/{team.Id}/members", memberReq);
        Assert.Equal(HttpStatusCode.OK, memberRes.StatusCode);
        var member = (await memberRes.Content.ReadFromJsonAsync<ApiEnvelope<TeamMemberDto>>(JsonOptions))!.Data;
        Assert.Equal("LEAD_PROGRAMMER", member.RoleInTeam);

        // Duplicate member check
        var dupRes = await client.PostAsJsonAsync($"/api/v1/competitions/teams/{team.Id}/members", memberReq);
        Assert.Equal(HttpStatusCode.Conflict, dupRes.StatusCode);

        // 4. Update status to BOOTCAMP
        var statusRes = await client.PatchAsJsonAsync($"/api/v1/competitions/teams/{team.Id}/status", new UpdateTeamStatusRequest("BOOTCAMP"));
        Assert.Equal(HttpStatusCode.OK, statusRes.StatusCode);

        // 5. Register Award
        var awardReq = new CreateAwardRequest(
            TeamId: team.Id,
            Title: "1st Place National Champions - RoboMission",
            Rank: 1,
            IsPublishedToHallOfFame: true
        );
        var awardRes = await client.PostAsJsonAsync("/api/v1/competitions/awards", awardReq);
        Assert.Equal(HttpStatusCode.OK, awardRes.StatusCode);

        // 6. Check Hall of Fame
        var hofRes = await client.GetAsync("/api/v1/competitions/hall-of-fame");
        Assert.Equal(HttpStatusCode.OK, hofRes.StatusCode);
        var hof = await hofRes.Content.ReadFromJsonAsync<ApiEnvelope<IReadOnlyList<HallOfFameCardItem>>>(JsonOptions);
        Assert.NotNull(hof?.Data);
        Assert.Contains(hof.Data, card => card.TeamName == "RoboTitans" && card.Rank == 1 && card.Title.Contains("1st Place"));
    }
}
