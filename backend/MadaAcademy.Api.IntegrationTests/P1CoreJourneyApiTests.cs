using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Seeding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class P1CoreJourneyApiTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid MainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid HelioStudentId = Guid.Parse("70000000-0000-0000-0000-000000000007");
    private static readonly Guid MainSessionId = Guid.Parse("50000000-0000-0000-0000-000000000002");
    private static readonly Guid LinaStudentId = Guid.Parse("70000000-0000-0000-0000-000000000002");

    [Fact]
    public async Task SeededCoreJourney_CanSubmitPublishAndExposeOnlyLinkedConsumerData()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            await DemoDataSeeder.SeedAsync(db);
        }

        var instructor = SeededAccount("10000000-0000-0000-0000-000000000010", "R04_INSTRUCTOR", "+201000000010", MainBranchId);
        var reviewer = SeededAccount("10000000-0000-0000-0000-000000000004", "R03_HEAD_INSTRUCTORS", "+201000000004", MainBranchId);
        var manager = SeededAccount("10000000-0000-0000-0000-000000000003", "R02_BRANCH_MANAGER", "+201000000003", MainBranchId);
        var parent = SeededAccount("10000000-0000-0000-0000-000000000011", "R08_PARENT", "+201000000011", Guid.Empty);
        var student = SeededAccount("10000000-0000-0000-0000-000000000012", "R09_STUDENT", "+201000000012", Guid.Empty);

        using var instructorClient = factory.CreateClient();
        TestData.Authenticate(instructorClient, await TestData.LoginAsync(instructorClient, instructor));
        using var reviewerClient = factory.CreateClient();
        TestData.Authenticate(reviewerClient, await TestData.LoginAsync(reviewerClient, reviewer));
        using var parentClient = factory.CreateClient();
        TestData.Authenticate(parentClient, await TestData.LoginAsync(parentClient, parent));
        using var studentClient = factory.CreateClient();
        TestData.Authenticate(studentClient, await TestData.LoginAsync(studentClient, student));
        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));

        var crossBranchStudentResponse = await managerClient.GetAsync($"/api/v1/students/{HelioStudentId}/consumer-links");
        Assert.Equal(HttpStatusCode.NotFound, crossBranchStudentResponse.StatusCode);

        var save = await instructorClient.PutAsJsonAsync($"/api/v1/scheduling/sessions/{MainSessionId}/evaluations", new
        {
            items = new[] { new { studentId = LinaStudentId, score = 91, notes = "تطبيق ممتاز في الجلسة التجريبية" } }
        });
        Assert.Equal(HttpStatusCode.OK, save.StatusCode);

        var submit = await instructorClient.PostAsJsonAsync($"/api/v1/scheduling/sessions/{MainSessionId}/evaluations/submit", new
        {
            studentIds = new[] { LinaStudentId }
        });
        Assert.Equal(HttpStatusCode.OK, submit.StatusCode);

        using var queueResponse = await reviewerClient.GetAsync("/api/v1/scheduling/evaluation-reviews");
        Assert.Equal(HttpStatusCode.OK, queueResponse.StatusCode);
        using var queueJson = await queueResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Review queue response is empty.");
        var queueItems = queueJson.RootElement.GetProperty("data").GetProperty("items");
        var queued = queueItems.EnumerateArray().Single(item => item.GetProperty("studentId").GetGuid() == LinaStudentId);
        var evaluationId = queued.GetProperty("id").GetGuid();

        var publish = await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{evaluationId}/decision", new { decision = "PUBLISH" });
        Assert.Equal(HttpStatusCode.OK, publish.StatusCode);

        var parentStudents = await parentClient.GetStringAsync("/api/v1/consumer/me/students");
        Assert.Contains("Youssef Ahmed", parentStudents, StringComparison.Ordinal);
        Assert.DoesNotContain("Lina Omar", parentStudents, StringComparison.Ordinal);
        var parentSessions = await parentClient.GetStringAsync("/api/v1/consumer/me/sessions");
        Assert.Contains("Youssef Ahmed", parentSessions, StringComparison.Ordinal);
        Assert.Contains("88", parentSessions, StringComparison.Ordinal);
        Assert.DoesNotContain("91", parentSessions, StringComparison.Ordinal);

        var studentStudents = await studentClient.GetStringAsync("/api/v1/consumer/me/students");
        Assert.Contains("Lina Omar", studentStudents, StringComparison.Ordinal);
        Assert.DoesNotContain("Youssef Ahmed", studentStudents, StringComparison.Ordinal);
        var studentSessions = await studentClient.GetStringAsync("/api/v1/consumer/me/sessions");
        Assert.Contains("Lina Omar", studentSessions, StringComparison.Ordinal);
        Assert.Contains("91", studentSessions, StringComparison.Ordinal);
        Assert.DoesNotContain("Youssef Ahmed", studentSessions, StringComparison.Ordinal);
    }

    private static TestAccount SeededAccount(string userId, string roleCode, string phone, Guid branchId)
        => new(TenantId, branchId, Guid.Parse(userId), roleCode, phone, "Mada@2026");
}
