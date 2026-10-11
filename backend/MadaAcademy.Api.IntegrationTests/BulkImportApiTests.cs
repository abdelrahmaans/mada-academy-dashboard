using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class BulkImportApiTests
{
    [Fact]
    public async Task Secretary_CanPreviewAndCommitStudents_WithPreviewHash()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        using var previewResponse = await client.PostAsJsonAsync("/api/v1/imports/students/preview", new
        {
            rows = new[] { new { fullName = "Imported Student", dateOfBirth = "2014-05-12" } }
        });
        Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);
        using var previewJson = await previewResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Preview response is empty.");
        var previewData = previewJson.RootElement.GetProperty("data");
        var previewId = previewData.GetProperty("previewId").GetGuid();
        var previewHash = previewData.GetProperty("previewHash").GetString();
        Assert.False(string.IsNullOrWhiteSpace(previewHash));
        Assert.Equal("PREVIEW_ONLY", previewData.GetProperty("mode").GetString());
        Assert.Equal(1, previewData.GetProperty("createCount").GetInt32());

        using var commitResponse = await client.PostAsJsonAsync("/api/v1/imports/students/commit", new { previewId, previewHash });
        Assert.Equal(HttpStatusCode.OK, commitResponse.StatusCode);
        using var commitJson = await commitResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Commit response is empty.");
        Assert.Equal("COMMITTED", commitJson.RootElement.GetProperty("data").GetProperty("state").GetString());
        Assert.Equal(1, commitJson.RootElement.GetProperty("data").GetProperty("createdCount").GetInt32());

        using var verifyScope = factory.Services.CreateScope();
        var db = verifyScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.True(await db.Students.AnyAsync(student => student.TenantId == secretary.TenantId && student.FullName == "Imported Student"));
        Assert.True(await db.AuditEvents.AnyAsync(item => item.Action == "BULK_IMPORT_STUDENT_COMMITTED" && item.TargetId == previewId.ToString()));

        using var secondCommit = await client.PostAsJsonAsync("/api/v1/imports/students/commit", new { previewId, previewHash });
        Assert.Equal(HttpStatusCode.Conflict, secondCommit.StatusCode);
    }

    [Fact]
    public async Task Commit_RejectsTamperedPreviewHash_WithoutWriting()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        using var previewResponse = await client.PostAsJsonAsync("/api/v1/imports/students/preview", new
        {
            rows = new[] { new { fullName = "Hash Protected Student", dateOfBirth = "2013-04-10" } }
        });
        using var previewJson = await previewResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Preview response is empty.");
        var previewId = previewJson.RootElement.GetProperty("data").GetProperty("previewId").GetGuid();

        using var commitResponse = await client.PostAsJsonAsync("/api/v1/imports/students/commit", new { previewId, previewHash = "tampered" });
        Assert.Equal(HttpStatusCode.Conflict, commitResponse.StatusCode);
        using var verifyScope = factory.Services.CreateScope();
        var db = verifyScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.False(await db.Students.AnyAsync(student => student.FullName == "Hash Protected Student"));
    }
}
