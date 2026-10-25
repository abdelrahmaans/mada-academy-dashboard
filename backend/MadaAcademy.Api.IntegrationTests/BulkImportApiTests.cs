using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class BulkImportApiTests
{
    [Fact]
    public async Task Secretary_CanPreviewCsv_AndCommitOnlyWithMatchingSourceFileIdentity()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));
        const string csv = "fullName,dateOfBirth,branchId\nCSV Imported Student,2012-03-04,\n";
        using var form = new MultipartFormDataContent();
        using var content = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes(csv));
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/csv");
        form.Add(content, "file", "students.csv");

        using var previewResponse = await client.PostAsync("/api/v1/imports/students/csv/preview", form);
        Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);
        using var previewJson = await previewResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("CSV preview response is empty.");
        var data = previewJson.RootElement.GetProperty("data");
        var previewId = data.GetProperty("previewId").GetGuid();
        var previewHash = data.GetProperty("previewHash").GetString()!;
        var source = data.GetProperty("sourceFile");
        Assert.Equal("students.csv", source.GetProperty("name").GetString());
        Assert.Equal(System.Text.Encoding.UTF8.GetByteCount(csv), source.GetProperty("size").GetInt64());
        Assert.True(source.GetProperty("expiresAt").GetDateTimeOffset() > DateTimeOffset.UtcNow);

        using var mismatch = await client.PostAsJsonAsync("/api/v1/imports/students/commit", new
        {
            previewId,
            previewHash,
            sourceFile = new { name = "renamed.csv", size = source.GetProperty("size").GetInt64(), hash = source.GetProperty("hash").GetString(), uploadedAt = source.GetProperty("uploadedAt").GetDateTimeOffset(), expiresAt = source.GetProperty("expiresAt").GetDateTimeOffset() }
        });
        Assert.Equal(HttpStatusCode.Conflict, mismatch.StatusCode);

        using var commit = await client.PostAsJsonAsync("/api/v1/imports/students/commit", new
        {
            previewId,
            previewHash,
            sourceFile = new { name = source.GetProperty("name").GetString(), size = source.GetProperty("size").GetInt64(), hash = source.GetProperty("hash").GetString(), uploadedAt = source.GetProperty("uploadedAt").GetDateTimeOffset(), expiresAt = source.GetProperty("expiresAt").GetDateTimeOffset() }
        });
        Assert.Equal(HttpStatusCode.OK, commit.StatusCode);
    }

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

    [Fact]
    public async Task GuardianCommit_RejectsPreviewRowsMovedToAnotherBranch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        var otherBranchId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranchId, TenantId = secretary.TenantId, Name = "Other Branch", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        var ownStudentId = await TestData.SeedStudentAsync(factory, secretary.TenantId, secretary.BranchId, "Own Branch Student");
        var otherStudentId = await TestData.SeedStudentAsync(factory, secretary.TenantId, otherBranchId, "Other Branch Student");

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));
        var csv = $"studentId,phone,displayName,relationship,email\n{ownStudentId},+201000000099,Imported Guardian,Parent,parent@example.test\n";
        using var form = new MultipartFormDataContent();
        using var content = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes(csv));
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/csv");
        form.Add(content, "file", "guardians.csv");

        using var previewResponse = await client.PostAsync("/api/v1/imports/guardians/csv/preview", form);
        previewResponse.EnsureSuccessStatusCode();
        using var previewJson = await previewResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Guardian preview response is empty.");
        var previewData = previewJson.RootElement.GetProperty("data");
        var previewId = previewData.GetProperty("previewId").GetGuid();
        var previewHash = previewData.GetProperty("previewHash").GetString()!;
        var source = previewData.GetProperty("sourceFile");

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var audit = await db.AuditEvents.SingleAsync(item => item.Action == "BULK_IMPORT_GUARDIAN_PREVIEW_CREATED" && item.TargetId == previewId.ToString());
            audit.MetadataJson = audit.MetadataJson!.Replace(ownStudentId.ToString(), otherStudentId.ToString(), StringComparison.OrdinalIgnoreCase);
            await db.SaveChangesAsync();
        }

        using var commitResponse = await client.PostAsJsonAsync("/api/v1/imports/guardians/commit", new
        {
            previewId,
            previewHash,
            sourceFile = new
            {
                name = source.GetProperty("name").GetString(),
                size = source.GetProperty("size").GetInt64(),
                hash = source.GetProperty("hash").GetString(),
                uploadedAt = source.GetProperty("uploadedAt").GetDateTimeOffset(),
                expiresAt = source.GetProperty("expiresAt").GetDateTimeOffset()
            }
        });

        Assert.Equal(HttpStatusCode.Conflict, commitResponse.StatusCode);
        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.False(await verifyDb.UserAccounts.AnyAsync(item => item.Phone == "+201000000099"));
    }
}
