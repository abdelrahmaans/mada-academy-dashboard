using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace MadaAcademy.Api.IntegrationTests;

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class PostgreSqlCollection : ICollectionFixture<PostgreSqlFixture>
{
    public const string Name = "PostgreSQL API integration";
}

public sealed class PostgreSqlFixture : IAsyncLifetime
{
    private const string Schema = "mada_integration_tests";
    private TestApiFactory? _factory;
    public TestApiFactory Factory => _factory ?? throw new InvalidOperationException("PostgreSQL fixture is not initialized.");

    public async Task InitializeAsync()
    {
        var original = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrWhiteSpace(original)) throw new InvalidOperationException("DATABASE_URL must point to the disposable CI PostgreSQL database.");
        var adminBuilder = new NpgsqlConnectionStringBuilder(original) { SearchPath = "public" };
        await using (var connection = new NpgsqlConnection(adminBuilder.ConnectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "DROP SCHEMA IF EXISTS mada_integration_tests CASCADE; CREATE SCHEMA mada_integration_tests;";
            await command.ExecuteNonQueryAsync();
        }

        var appBuilder = new NpgsqlConnectionStringBuilder(original) { SearchPath = Schema };
        Environment.SetEnvironmentVariable("DATABASE_URL", appBuilder.ConnectionString);
        Environment.SetEnvironmentVariable("MADA_DATABASE_MODE", null);
        _factory = new TestApiFactory(useInMemory: false);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (_factory is not null) await _factory.DisposeAsync();
    }
}

[Collection(PostgreSqlCollection.Name)]
public sealed class PostgreSqlApiTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task MigrationHistory_IsAppliedInsideDedicatedSchema()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", db.Database.ProviderName);
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        await db.Database.OpenConnectionAsync();
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = "SELECT current_schema()";
            Assert.Equal("mada_integration_tests", await command.ExecuteScalarAsync());
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsHealthyFromPostgreSqlHost()
    {
        using var client = fixture.Factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/health")).StatusCode);
    }

    [Fact]
    public async Task MeEndpoint_RejectsAnonymousPostgreSqlRequest()
    {
        using var client = fixture.Factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/me")).StatusCode);
    }

    [Fact]
    public async Task PasswordLoginAndMe_ReadPersistedMembership()
    {
        using var client = fixture.Factory.CreateClient();
        var account = await TestData.CreateAccountAsync(fixture.Factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        using var response = await client.GetAsync("/api/v1/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains(account.TenantId.ToString(), json, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("R01_ACADEMY_OWNER", json, StringComparison.Ordinal);
    }

    [Fact]
    public async Task TenantIsolation_DeniesCrossTenantPostgreSqlRequest()
    {
        using var client = fixture.Factory.CreateClient();
        var account = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/api/v1/tenants/{Guid.NewGuid()}/scope-check")).StatusCode);
    }

    [Fact]
    public async Task BranchIsolation_ReturnsOnlyStudentsFromMembershipBranch()
    {
        using var client = fixture.Factory.CreateClient();
        var account = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        var otherBranch = Guid.NewGuid();
        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new MadaAcademy.Api.Persistence.Entities.Branch { Id = otherBranch, TenantId = account.TenantId, Name = "Second Branch", Code = $"B{Guid.NewGuid():N}"[..10] });
            await db.SaveChangesAsync();
        }
        await TestData.SeedStudentAsync(fixture.Factory, account.TenantId, account.BranchId, $"Visible-{Guid.NewGuid():N}");
        var hiddenName = $"Hidden-{Guid.NewGuid():N}";
        await TestData.SeedStudentAsync(fixture.Factory, account.TenantId, otherBranch, hiddenName);
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var json = await client.GetStringAsync("/api/v1/students");
        Assert.DoesNotContain(hiddenName, json, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ConsumerAccountLookup_ExecutesScopedExactPhoneQueryOnPostgreSql()
    {
        using var client = fixture.Factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        var parent = await TestData.CreateConsumerAccountAsync(fixture.Factory, staff.TenantId, "parent", "R08_PARENT");
        var studentId = await TestData.SeedStudentAsync(fixture.Factory, staff.TenantId, staff.BranchId, "PostgreSQL Phone Lookup Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));

        var response = await client.GetAsync($"/api/v1/students/{studentId}/consumer-accounts?accountType=parent&phone={Uri.EscapeDataString(parent.Phone)}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(parent.UserId.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains($"•••• {parent.Phone[^4..]}", body, StringComparison.Ordinal);
        Assert.DoesNotContain(parent.Phone, body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ConsumerInvitation_CreatesAndAcceptsParentAccountOnPostgreSql()
    {
        using var client = fixture.Factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        var studentId = await TestData.SeedStudentAsync(fixture.Factory, staff.TenantId, staff.BranchId, "PostgreSQL Invitation Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, staff));

        using var createResponse = await client.PostAsJsonAsync($"/api/v1/students/{studentId}/consumer-invitations", new
        {
            phone = "+201333333333",
            accountType = "parent",
            relationship = "الأب"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        using var createJson = await createResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Invitation response is empty.");
        var data = createJson.RootElement.GetProperty("data");
        var code = data.GetProperty("developmentCode").GetString() ?? throw new InvalidOperationException("Development OTP was not returned by the test sender.");
        var acceptUrl = data.GetProperty("debugAcceptUrl").GetString() ?? throw new InvalidOperationException("Development invitation URL is missing.");
        var fragment = new Uri(acceptUrl).Fragment;
        Assert.StartsWith("#token=", fragment, StringComparison.Ordinal);
        var token = Uri.UnescapeDataString(fragment["#token=".Length..]);

        using var previewResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/preview", new { token });
        Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);
        using var acceptResponse = await client.PostAsJsonAsync("/api/v1/consumer-invitations/accept", new
        {
            token,
            code,
            fullName = "والد طالب الاختبار",
            password = "ParentPassword2026!"
        });
        Assert.Equal(HttpStatusCode.OK, acceptResponse.StatusCode);

        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var account = await db.UserAccounts.SingleAsync(item => item.Phone == "+201333333333" && item.AccountType == "parent");
        Assert.Null(account.Email);
        Assert.True(await db.Memberships.AnyAsync(item => item.UserAccountId == account.Id && item.TenantId == staff.TenantId && item.RoleCode == "R08_PARENT"));
        Assert.True(await db.GuardianStudentLinks.AnyAsync(item => item.UserAccountId == account.Id && item.StudentId == studentId));
        Assert.Equal("ACCEPTED", (await db.ConsumerInvitations.SingleAsync()).Status);
    }

    [Fact]
    public async Task EvaluationReviewAndConsumerPublication_WorkOnPostgreSql()
    {
        using var managerClient = fixture.Factory.CreateClient();
        var manager = await TestData.CreateAccountAsync(fixture.Factory, "R02_BRANCH_MANAGER");
        var instructor = await TestData.CreateAccountAsync(fixture.Factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);
        var reviewer = await TestData.CreateAccountAsync(fixture.Factory, "R03_HEAD_INSTRUCTORS", manager.TenantId, manager.BranchId);
        var parent = await TestData.CreateConsumerAccountAsync(fixture.Factory, manager.TenantId, "parent", "R08_PARENT");
        var studentId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var offeringId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var classroomId = Guid.NewGuid();
        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Students.Add(new Student { Id = studentId, TenantId = manager.TenantId, BranchId = manager.BranchId, FullName = "PostgreSQL Evaluation Student" });
            db.CourseTemplates.Add(new CourseTemplate { Id = templateId, TenantId = manager.TenantId, Name = "PostgreSQL Robotics", TotalSessions = 8, SessionDurationHours = 1, BasePricePiastres = 0 });
            db.Classrooms.Add(new Classroom { Id = classroomId, BranchId = manager.BranchId, Name = $"Room-{Guid.NewGuid():N}"[..13], Capacity = 12 });
            db.CourseOfferings.Add(new CourseOffering { Id = offeringId, TenantId = manager.TenantId, BranchId = manager.BranchId, CourseTemplateId = templateId, InstructorId = instructor.UserId, ClassroomId = classroomId, StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), MaxStudents = 12 });
            db.StudentEnrollments.Add(new StudentEnrollment { StudentId = studentId, CourseOfferingId = offeringId, FinalPricePiastres = 0, Status = "ACTIVE" });
            db.AcademySessions.Add(new AcademySession { Id = sessionId, TenantId = manager.TenantId, BranchId = manager.BranchId, CourseOfferingId = offeringId, SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddDays(-1), EndAt = DateTimeOffset.UtcNow.AddHours(-23), InstructorId = instructor.UserId, ClassroomId = classroomId, Status = "COMPLETED" });
            await db.SaveChangesAsync();
        }

        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        Assert.Equal(HttpStatusCode.OK, (await managerClient.PostAsJsonAsync($"/api/v1/students/{studentId}/guardians", new { userAccountId = parent.UserId, relationship = "Guardian" })).StatusCode);
        using var instructorClient = fixture.Factory.CreateClient();
        TestData.Authenticate(instructorClient, await TestData.LoginAsync(instructorClient, instructor));
        Assert.Equal(HttpStatusCode.OK, (await instructorClient.PutAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations", new { items = new[] { new { studentId, score = 88, notes = "اتقان ممتاز" } } })).StatusCode);

        using var parentClient = fixture.Factory.CreateClient();
        TestData.Authenticate(parentClient, await TestData.LoginAsync(parentClient, parent));
        Assert.Contains("\"score\":null", await parentClient.GetStringAsync("/api/v1/consumer/me/sessions"), StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.OK, (await instructorClient.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations/submit", new { studentIds = new[] { studentId } })).StatusCode);

        using var reviewerClient = fixture.Factory.CreateClient();
        TestData.Authenticate(reviewerClient, await TestData.LoginAsync(reviewerClient, reviewer));
        using var queueResponse = await reviewerClient.GetAsync("/api/v1/scheduling/evaluation-reviews");
        Assert.Equal(HttpStatusCode.OK, queueResponse.StatusCode);
        using var queue = await queueResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Review queue response is empty.");
        var item = queue.RootElement.GetProperty("data").GetProperty("items")[0];
        var evaluationId = item.GetProperty("id").GetGuid();
        Assert.Equal(studentId, item.GetProperty("studentId").GetGuid());
        Assert.Equal(HttpStatusCode.OK, (await reviewerClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{evaluationId}/decision", new { decision = "PUBLISH" })).StatusCode);
        var published = await parentClient.GetStringAsync("/api/v1/consumer/me/sessions");
        Assert.Contains("\"score\":88", published, StringComparison.Ordinal);
        Assert.Contains("اتقان ممتاز", published, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ExecutiveDashboard_AggregatesTenantMetricsOnPostgreSql()
    {
        using var client = fixture.Factory.CreateClient();
        var owner = await TestData.CreateAccountAsync(fixture.Factory, "R01_ACADEMY_OWNER");
        var studentId = await TestData.SeedStudentAsync(fixture.Factory, owner.TenantId, owner.BranchId, "Executive Dashboard Student");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sessionId = Guid.NewGuid();
        var invoiceId = Guid.NewGuid();
        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.StudentEnrollments.Add(new StudentEnrollment { StudentId = studentId, CourseOfferingId = Guid.NewGuid(), FinalPricePiastres = 5_000, Status = "ACTIVE" });
            db.AcademySessions.Add(new AcademySession { Id = sessionId, TenantId = owner.TenantId, BranchId = owner.BranchId, SessionNumber = 1, StartAt = DateTimeOffset.UtcNow, EndAt = DateTimeOffset.UtcNow.AddHours(1), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "COMPLETED" });
            db.SessionAttendances.Add(new SessionAttendance { SessionId = sessionId, StudentId = studentId, Status = "PRESENT" });
            db.Invoices.Add(new Invoice { Id = invoiceId, TenantId = owner.TenantId, BranchId = owner.BranchId, StudentId = studentId, InvoiceNumber = $"R1-{Guid.NewGuid():N}", TotalPiastres = 5_000, IssueDate = today, DueDate = today.AddDays(10), CreatedByUserId = owner.UserId });
            db.PaymentTransactions.Add(new PaymentTransaction { TenantId = owner.TenantId, BranchId = owner.BranchId, InvoiceId = invoiceId, AmountPiastres = 2_000, Method = "CASH", ReceivedOn = today, RecordedByUserId = owner.UserId });
            db.Expenses.Add(new Expense { TenantId = owner.TenantId, BranchId = owner.BranchId, Description = "Approved executive test expense", Category = "OPERATIONS", AmountPiastres = 500, SpentOn = today, CreatedByUserId = owner.UserId, Status = "APPROVED" });
            db.ApprovalRequests.Add(new ApprovalRequest { TenantId = owner.TenantId, BranchId = owner.BranchId, RequestType = "TEST", TargetType = "TEST", TargetId = Guid.NewGuid().ToString(), SubmittedByRole = "R06_ACCOUNTANT", State = "PENDING" });
            await db.SaveChangesAsync();
        }

        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));
        using var response = await client.GetAsync($"/api/v1/academy/executive-summary?from={today:yyyy-MM-dd}&to={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Executive report response is empty.");
        var summary = document.RootElement.GetProperty("data").GetProperty("summary");
        Assert.Equal(1, summary.GetProperty("activeStudents").GetInt32());
        Assert.Equal(1, summary.GetProperty("activeEnrollments").GetInt32());
        Assert.Equal(1, summary.GetProperty("sessions").GetInt32());
        Assert.Equal(2_000, summary.GetProperty("collectedPiastres").GetInt64());
        Assert.Equal(500, summary.GetProperty("approvedExpensesPiastres").GetInt64());
        Assert.Equal(100m, summary.GetProperty("attendancePercent").GetDecimal());
        Assert.Equal(1, summary.GetProperty("pendingApprovals").GetInt32());
    }

    [Fact]
    public async Task PlatformSupportAndExecutiveActivity_ExecuteScopedQueriesOnPostgreSql()
    {
        using var platformClient = fixture.Factory.CreateClient();
        using var ownerClient = fixture.Factory.CreateClient();
        var platformAdmin = await TestData.CreateAccountAsync(fixture.Factory, "R00_PLATFORM_ADMIN");
        var owner = await TestData.CreateAccountAsync(fixture.Factory, "R01_ACADEMY_OWNER");
        var secondBranchId = Guid.NewGuid();
        var visibleAuditId = Guid.NewGuid();
        var branchlessAuditId = Guid.NewGuid();
        var hiddenAuditId = Guid.NewGuid();
        var decisionId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        Guid membershipId;

        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = secondBranchId, TenantId = owner.TenantId, Name = "PostgreSQL Other Branch", Code = $"B{Guid.NewGuid():N}"[..10] });
            db.AuditEvents.AddRange(
                new AuditEvent { Id = visibleAuditId, TenantId = owner.TenantId, BranchId = owner.BranchId, Action = "PLATFORM_TEST_VISIBLE", TargetType = "TEST", TargetId = visibleAuditId.ToString(), Reason = "Visible branch audit" },
                new AuditEvent { Id = branchlessAuditId, TenantId = owner.TenantId, Action = "PLATFORM_TEST_TENANT", TargetType = "TEST", TargetId = branchlessAuditId.ToString() },
                new AuditEvent { Id = hiddenAuditId, TenantId = owner.TenantId, BranchId = secondBranchId, Action = "PLATFORM_TEST_HIDDEN", TargetType = "TEST", TargetId = hiddenAuditId.ToString() });
            db.ApprovalRequests.Add(new ApprovalRequest { Id = decisionId, TenantId = owner.TenantId, BranchId = owner.BranchId, RequestType = "POSTGRESQL_DECISION", TargetType = "TEST", TargetId = "decision", SubmittedByRole = "R06_ACCOUNTANT", State = "APPROVED", Reason = "Approved by owner", DecidedByUserId = owner.UserId, DecidedAt = DateTimeOffset.UtcNow });
            membershipId = await db.Memberships.Where(item => item.TenantId == owner.TenantId && item.UserAccountId == owner.UserId).Select(item => item.Id).SingleAsync();
            await db.SaveChangesAsync();
        }

        TestData.Authenticate(platformClient, await TestData.LoginAsync(platformClient, platformAdmin));
        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));

        using var membersResponse = await platformClient.GetAsync($"/api/v1/platform/academies/{owner.TenantId}/members?search={Uri.EscapeDataString(owner.Phone)}");
        Assert.Equal(HttpStatusCode.OK, membersResponse.StatusCode);
        using var membersDocument = await membersResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Platform member query response is empty.");
        var member = membersDocument.RootElement.GetProperty("data").GetProperty("items")[0];
        Assert.Equal(owner.UserId, member.GetProperty("userId").GetGuid());
        Assert.True(member.GetProperty("activeSessions").GetInt32() >= 1);
        Assert.DoesNotContain(owner.Phone, member.GetProperty("maskedPhone").GetString(), StringComparison.Ordinal);

        using var activityResponse = await ownerClient.GetAsync($"/api/v1/academy/executive-activity?from={today:yyyy-MM-dd}&to={today:yyyy-MM-dd}&branchId={owner.BranchId}");
        Assert.Equal(HttpStatusCode.OK, activityResponse.StatusCode);
        using var activityDocument = await activityResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Executive activity query response is empty.");
        var activityItems = activityDocument.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().ToArray();
        Assert.Contains(activityItems, item => item.GetProperty("id").GetGuid() == visibleAuditId);
        Assert.Contains(activityItems, item => item.GetProperty("id").GetGuid() == branchlessAuditId);
        Assert.Contains(activityItems, item => item.GetProperty("id").GetGuid() == decisionId && item.GetProperty("source").GetString() == "DECISION");
        Assert.DoesNotContain(activityItems, item => item.GetProperty("id").GetGuid() == hiddenAuditId);

        using var disableResponse = await platformClient.PatchAsJsonAsync(
            $"/api/v1/platform/academies/{owner.TenantId}/members/{membershipId}/status",
            new { status = "REVOKED", reason = "PostgreSQL security review" });
        Assert.Equal(HttpStatusCode.OK, disableResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await ownerClient.GetAsync("/api/v1/me")).StatusCode);
        using var platformActivityResponse = await platformClient.GetAsync($"/api/v1/platform/academies/{owner.TenantId}/activity");
        Assert.Equal(HttpStatusCode.OK, platformActivityResponse.StatusCode);
        Assert.Contains("PLATFORM_MEMBER_STATUS_CHANGED", await platformActivityResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }
}
