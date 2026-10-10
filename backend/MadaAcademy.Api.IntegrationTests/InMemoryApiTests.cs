using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Modules.Identity;
using MadaAcademy.Api.Modules.Scheduling;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class InMemoryApiTests
{
    [Fact]
    public async Task ProtectedMeEndpoint_RejectsAnonymousRequest()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/me")).StatusCode);
    }

    [Fact]
    public async Task PasswordLogin_RejectsInvalidPassword()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { phone = account.Phone, password = "wrong-password", accountType = "staff" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MeEndpoint_ExposesTheCanonicalPermissionsForEveryStaffRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);

        foreach (var role in RoleCatalog.All.Select(item => item.Code))
        {
            using var client = factory.CreateClient();
            var account = await TestData.CreateAccountAsync(factory, role);
            TestData.Authenticate(client, await TestData.LoginAsync(client, account));

            using var response = await client.GetAsync("/api/v1/me");
            response.EnsureSuccessStatusCode();
            using var document = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("The /me response is empty.");
            var actual = document.RootElement.GetProperty("data").GetProperty("permissions").EnumerateArray().Select(item => item.GetString()).ToArray();

            Assert.Equal(RoleCatalog.PermissionsFor(role), actual);
        }
    }

    [Fact]
    public async Task TenantScopeCheck_AllowsOwnTenantAndRejectsAnotherTenant()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/v1/tenants/{account.TenantId}/scope-check")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/api/v1/tenants/{Guid.NewGuid()}/scope-check")).StatusCode);
    }

    [Fact]
    public async Task StudentList_IsRestrictedToAuthenticatedBranch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var otherBranch = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranch, TenantId = account.TenantId, Name = "Other Branch", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        await TestData.SeedStudentAsync(factory, account.TenantId, account.BranchId, "Visible Student");
        await TestData.SeedStudentAsync(factory, account.TenantId, otherBranch, "Out of Scope Student");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        using var response = await client.GetAsync("/api/v1/students");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Visible Student", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Out of Scope Student", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task DashboardSummary_IsBranchScopedForR02AndDeniedToUnrelatedStaff()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER", manager.TenantId, manager.BranchId);
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);
        var otherBranchId = Guid.NewGuid();
        var ownStudentId = Guid.NewGuid();
        var otherStudentId = Guid.NewGuid();
        var ownSessionId = Guid.NewGuid();
        var otherSessionId = Guid.NewGuid();
        int activeTenantBranchCount;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranchId, TenantId = manager.TenantId, Name = "Other Branch", Code = "OTHER" });
            db.Students.AddRange(
                new Student { Id = ownStudentId, TenantId = manager.TenantId, BranchId = manager.BranchId, FullName = "Branch A Dashboard Student" },
                new Student { Id = otherStudentId, TenantId = manager.TenantId, BranchId = otherBranchId, FullName = "Branch B Dashboard Student" });
            db.AcademySessions.AddRange(
                new AcademySession { Id = ownSessionId, TenantId = manager.TenantId, BranchId = manager.BranchId, SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddDays(1), EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "SCHEDULED" },
                new AcademySession { Id = otherSessionId, TenantId = manager.TenantId, BranchId = otherBranchId, SessionNumber = 2, StartAt = DateTimeOffset.UtcNow.AddDays(2), EndAt = DateTimeOffset.UtcNow.AddDays(2).AddHours(1), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "SCHEDULED" });
            await db.SaveChangesAsync();
            activeTenantBranchCount = await db.Branches.CountAsync(branch => branch.TenantId == manager.TenantId && branch.Status == "ACTIVE");
        }

        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        using var managerResponse = await managerClient.GetAsync("/api/v1/dashboard/summary");
        Assert.Equal(HttpStatusCode.OK, managerResponse.StatusCode);
        using var managerJson = await managerResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Manager dashboard response is empty.");
        var managerData = managerJson.RootElement.GetProperty("data");
        Assert.Equal(1, managerData.GetProperty("students").GetInt32());
        Assert.Equal(1, managerData.GetProperty("branchCount").GetInt32());
        Assert.Equal(1, managerData.GetProperty("upcomingSessions").GetInt32());
        Assert.DoesNotContain(otherStudentId.ToString(), managerJson.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(otherSessionId.ToString(), managerJson.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);

        using var ownerClient = factory.CreateClient();
        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));
        using var ownerResponse = await ownerClient.GetAsync("/api/v1/dashboard/summary");
        Assert.Equal(HttpStatusCode.OK, ownerResponse.StatusCode);
        using var ownerJson = await ownerResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Owner dashboard response is empty.");
        var ownerData = ownerJson.RootElement.GetProperty("data");
        Assert.Equal(2, ownerData.GetProperty("students").GetInt32());
        Assert.Equal(activeTenantBranchCount, ownerData.GetProperty("branchCount").GetInt32());
        Assert.Equal(2, ownerData.GetProperty("upcomingSessions").GetInt32());

        using var instructorClient = factory.CreateClient();
        TestData.Authenticate(instructorClient, await TestData.LoginAsync(instructorClient, instructor));
        Assert.Equal(HttpStatusCode.Forbidden, (await instructorClient.GetAsync("/api/v1/dashboard/summary")).StatusCode);
    }

    [Fact]
    public async Task BranchManager_CannotSeeOrDecideSessionApprovalFromAnotherBranch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var otherBranchId = Guid.NewGuid();
        var ownSessionId = Guid.NewGuid();
        var otherSessionId = Guid.NewGuid();
        var ownApprovalId = Guid.NewGuid();
        var otherApprovalId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranchId, TenantId = manager.TenantId, Name = "Other Branch", Code = "OTHER" });
            db.AcademySessions.AddRange(
                new AcademySession { Id = ownSessionId, TenantId = manager.TenantId, BranchId = manager.BranchId, SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddDays(1), EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "PENDING_APPROVAL" },
                new AcademySession { Id = otherSessionId, TenantId = manager.TenantId, BranchId = otherBranchId, SessionNumber = 2, StartAt = DateTimeOffset.UtcNow.AddDays(2), EndAt = DateTimeOffset.UtcNow.AddDays(2).AddHours(1), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), Status = "PENDING_APPROVAL" });
            db.ApprovalRequests.AddRange(
                new ApprovalRequest { Id = ownApprovalId, TenantId = manager.TenantId, BranchId = manager.BranchId, RequestType = "EXTRA", TargetType = "SESSION", TargetId = ownSessionId.ToString(), SubmittedByRole = "R04_INSTRUCTOR", State = "PENDING", Reason = "Own branch request" },
                new ApprovalRequest { Id = otherApprovalId, TenantId = manager.TenantId, BranchId = otherBranchId, RequestType = "EXTRA", TargetType = "SESSION", TargetId = otherSessionId.ToString(), SubmittedByRole = "R04_INSTRUCTOR", State = "PENDING", Reason = "Other branch request" });
            await db.SaveChangesAsync();
        }
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, manager));

        using var queueResponse = await client.GetAsync("/api/v1/scheduling/approvals?state=PENDING");
        Assert.Equal(HttpStatusCode.OK, queueResponse.StatusCode);
        var queueBody = await queueResponse.Content.ReadAsStringAsync();
        Assert.Contains(ownApprovalId.ToString(), queueBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(otherApprovalId.ToString(), queueBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Other branch request", queueBody, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync($"/api/v1/scheduling/approvals/{otherApprovalId}/decision", new { decision = "APPROVED", reason = "Not in this branch." })).StatusCode);
    }

    [Fact]
    public async Task ConflictCheck_EnforcesBranchAndTenantScope()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER", manager.TenantId, manager.BranchId);
        var otherBranchId = Guid.NewGuid();
        var foreignTenantId = Guid.NewGuid();
        var foreignBranchId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var instructorId = Guid.NewGuid();
        var classroomId = Guid.NewGuid();
        var startAt = DateTimeOffset.UtcNow.AddDays(3);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.AddRange(
                new Branch { Id = otherBranchId, TenantId = manager.TenantId, Name = "Other Academy Branch", Code = "OTHER" },
                new Branch { Id = foreignBranchId, TenantId = foreignTenantId, Name = "Foreign Branch", Code = "FOREIGN" });
            db.Tenants.Add(new Tenant { Id = foreignTenantId, Name = "Foreign Academy", Slug = $"foreign-{foreignTenantId:N}" });
            db.AcademySessions.Add(new AcademySession { Id = sessionId, TenantId = manager.TenantId, BranchId = otherBranchId, SessionNumber = 1, StartAt = startAt, EndAt = startAt.AddHours(1), InstructorId = instructorId, ClassroomId = classroomId, Status = "SCHEDULED" });
            await db.SaveChangesAsync();
        }
        ConflictCheckRequest Request(Guid branchId) => new(branchId, instructorId, classroomId, [], [], startAt, startAt.AddHours(1));

        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        using var denied = await managerClient.PostAsJsonAsync("/api/v1/scheduling/check-conflict", Request(otherBranchId));
        Assert.Equal(HttpStatusCode.Forbidden, denied.StatusCode);
        Assert.Contains("BRANCH_SCOPE_DENIED", await denied.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.DoesNotContain(sessionId.ToString(), await denied.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);

        using var ownerClient = factory.CreateClient();
        TestData.Authenticate(ownerClient, await TestData.LoginAsync(ownerClient, owner));
        using var allowed = await ownerClient.PostAsJsonAsync("/api/v1/scheduling/check-conflict", Request(otherBranchId));
        Assert.Equal(HttpStatusCode.Conflict, allowed.StatusCode);
        Assert.Contains(sessionId.ToString(), await allowed.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
        Assert.Equal(HttpStatusCode.NotFound, (await ownerClient.PostAsJsonAsync("/api/v1/scheduling/check-conflict", Request(foreignBranchId))).StatusCode);
    }

    [Fact]
    public async Task ApprovalQueue_RejectsInstructorRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/v1/scheduling/approvals")).StatusCode);
    }

    [Fact]
    public async Task RefreshToken_RotationRejectsReplayOfPreviousToken()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var original = await TestData.LoginAsync(client, account);
        var rotation = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = original.RefreshToken });
        Assert.Equal(HttpStatusCode.OK, rotation.StatusCode);
        var rotated = await rotation.Content.ReadFromJsonAsync<TokenEnvelope>();
        var rotatedTokens = rotated?.Data ?? throw new InvalidOperationException("Refresh response did not contain token data.");
        Assert.NotEqual(original.RefreshToken, rotatedTokens.RefreshToken);

        TestData.Authenticate(client, rotatedTokens);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/me")).StatusCode);

        var replay = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = original.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var sessions = await db.RefreshSessions.Where(item => item.UserAccountId == account.UserId).ToListAsync();
        Assert.Equal(2, sessions.Count);
        Assert.Contains(sessions, item => item.TokenHash == JwtTokenService.HashRefreshToken(original.RefreshToken) && item.RevokedAt is not null);
        Assert.Contains(sessions, item => item.TokenHash == JwtTokenService.HashRefreshToken(rotatedTokens.RefreshToken) && item.RevokedAt is null);
    }

    [Fact]
    public async Task Logout_RevokesRefreshToken()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var tokens = await TestData.LoginAsync(client, account);
        TestData.Authenticate(client, tokens);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = tokens.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = tokens.RefreshToken })).StatusCode);
    }

    [Fact]
    public async Task AttendanceWrite_RejectsAcademyOwnerRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var response = await client.PutAsJsonAsync($"/api/v1/sessions/{Guid.NewGuid()}/attendance", new { records = new[] { new { studentId = Guid.NewGuid(), status = "PRESENT" } } });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task EvaluationWrite_RejectsAcademyOwnerRole()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var response = await client.PutAsJsonAsync($"/api/v1/scheduling/sessions/{Guid.NewGuid()}/evaluations", new { items = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SubstitutionRequest_CannotBeSubmittedTwiceForSamePendingSession()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        var sessionId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.AcademySessions.Add(new AcademySession
            {
                Id = sessionId, TenantId = account.TenantId, BranchId = account.BranchId, InstructorId = account.UserId,
                ClassroomId = Guid.NewGuid(), StartAt = DateTimeOffset.UtcNow.AddDays(1), EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1),
                SessionNumber = 1, Status = "SCHEDULED"
            });
            await db.SaveChangesAsync();
        }
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var first = await client.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/substitution-requests", new { reason = "Unavailable" });
        var second = await client.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/substitution-requests", new { reason = "Still unavailable" });
        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task InstructorReads_AreLimitedToSessionsAndStudentsAssignedToThatInstructor()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR");
        var assignedStudentId = Guid.NewGuid();
        var otherStudentId = Guid.NewGuid();
        var assignedOfferingId = Guid.NewGuid();
        var otherOfferingId = Guid.NewGuid();
        var assignedSessionId = Guid.NewGuid();
        var otherSessionId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Students.AddRange(
                new Student { Id = assignedStudentId, TenantId = account.TenantId, BranchId = account.BranchId, FullName = "Assigned Student" },
                new Student { Id = otherStudentId, TenantId = account.TenantId, BranchId = account.BranchId, FullName = "Other Instructor Student" });
            db.CourseOfferings.AddRange(
                new CourseOffering { Id = assignedOfferingId, TenantId = account.TenantId, BranchId = account.BranchId, CourseTemplateId = Guid.NewGuid(), InstructorId = account.UserId, ClassroomId = Guid.NewGuid(), StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), MaxStudents = 8 },
                new CourseOffering { Id = otherOfferingId, TenantId = account.TenantId, BranchId = account.BranchId, CourseTemplateId = Guid.NewGuid(), InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), MaxStudents = 8 });
            db.StudentEnrollments.AddRange(
                new StudentEnrollment { StudentId = assignedStudentId, CourseOfferingId = assignedOfferingId },
                new StudentEnrollment { StudentId = otherStudentId, CourseOfferingId = otherOfferingId });
            db.AcademySessions.AddRange(
                new AcademySession { Id = assignedSessionId, TenantId = account.TenantId, BranchId = account.BranchId, CourseOfferingId = assignedOfferingId, InstructorId = account.UserId, ClassroomId = Guid.NewGuid(), SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddDays(1), EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1) },
                new AcademySession { Id = otherSessionId, TenantId = account.TenantId, BranchId = account.BranchId, CourseOfferingId = otherOfferingId, InstructorId = Guid.NewGuid(), ClassroomId = Guid.NewGuid(), SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddDays(2), EndAt = DateTimeOffset.UtcNow.AddDays(2).AddHours(1) });
            await db.SaveChangesAsync();
        }
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var sessions = await client.GetStringAsync("/api/v1/sessions");
        Assert.Contains(assignedSessionId.ToString(), sessions, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(otherSessionId.ToString(), sessions, StringComparison.OrdinalIgnoreCase);
        var students = await client.GetStringAsync("/api/v1/students");
        Assert.Contains("Assigned Student", students, StringComparison.Ordinal);
        Assert.DoesNotContain("Other Instructor Student", students, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/v1/sessions/{otherSessionId}/attendance")).StatusCode);
    }

    [Fact]
    public async Task GuardianLink_OnlyExposesLinkedStudentAndConsumerMeWorks()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var manager = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var parent = await TestData.CreateConsumerAccountAsync(factory, staff.TenantId, "parent", "R08_PARENT");
        var linkedStudent = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Linked Child");
        var unlinkedStudent = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Unlinked Child");
        TestData.Authenticate(manager, await TestData.LoginAsync(manager, staff));
        var linkResponse = await manager.PostAsJsonAsync($"/api/v1/students/{linkedStudent}/guardians", new { userAccountId = parent.UserId, relationship = "Mother" });
        Assert.Equal(HttpStatusCode.OK, linkResponse.StatusCode);

        using var parentClient = factory.CreateClient();
        TestData.Authenticate(parentClient, await TestData.LoginAsync(parentClient, parent));
        var me = await parentClient.GetStringAsync("/api/v1/me");
        Assert.Contains("R08_PARENT", me, StringComparison.Ordinal);
        var children = await parentClient.GetStringAsync("/api/v1/consumer/me/students");
        Assert.Contains("Linked Child", children, StringComparison.Ordinal);
        Assert.DoesNotContain("Unlinked Child", children, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.NotFound, (await parentClient.GetAsync($"/api/v1/consumer/me/sessions?studentId={unlinkedStudent}")).StatusCode);
    }

    [Fact]
    public async Task StudentAccountLink_RejectsCrossTenantAndDoesNotExposeOtherStudent()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var manager = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var studentAccount = await TestData.CreateConsumerAccountAsync(factory, staff.TenantId, "student", "R09_STUDENT");
        var studentId = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Student Account Link");
        var otherTenantStudentId = await TestData.SeedStudentAsync(factory, Guid.NewGuid(), Guid.NewGuid(), "Foreign Student");
        TestData.Authenticate(manager, await TestData.LoginAsync(manager, staff));
        Assert.Equal(HttpStatusCode.OK, (await manager.PostAsJsonAsync($"/api/v1/students/{studentId}/student-account", new { userAccountId = studentAccount.UserId })).StatusCode);

        using var studentClient = factory.CreateClient();
        TestData.Authenticate(studentClient, await TestData.LoginAsync(studentClient, studentAccount));
        var children = await studentClient.GetStringAsync("/api/v1/consumer/me/students");
        Assert.Contains("Student Account Link", children, StringComparison.Ordinal);
        Assert.DoesNotContain("Foreign Student", children, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.NotFound, (await studentClient.GetAsync($"/api/v1/consumer/me/sessions?studentId={otherTenantStudentId}")).StatusCode);
    }

    [Fact]
    public async Task ConsumerAccountLookup_NormalizesArabicDigitsAndReturnsMaskedExactMatch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var manager = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var parent = await TestData.CreateConsumerAccountAsync(factory, staff.TenantId, "parent", "R08_PARENT", "+201012345678");
        var studentId = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Phone Lookup Student");
        TestData.Authenticate(manager, await TestData.LoginAsync(manager, staff));

        var response = await manager.GetAsync($"/api/v1/students/{studentId}/consumer-accounts?accountType=parent&phone={Uri.EscapeDataString("٠١٠١٢٣٤٥٦٧٨")}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(parent.UserId.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("•••• 5678", body, StringComparison.Ordinal);
        Assert.DoesNotContain("+201012345678", body, StringComparison.Ordinal);
        Assert.Contains("Consumer Test User", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ConsumerAccountLookup_HidesAccountsAssignedToAnotherAcademyAndRejectsUnauthorizedRoles()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var manager = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var parent = await TestData.CreateConsumerAccountAsync(factory, staff.TenantId, "parent", "R08_PARENT", "+201011112222");
        var studentId = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Scoped Lookup Student");
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var otherTenantId = Guid.NewGuid();
            db.Tenants.Add(new Tenant { Id = otherTenantId, Name = "Other Academy", Slug = $"other-{otherTenantId:N}" });
            db.Memberships.Add(new Membership { UserAccountId = parent.UserId, TenantId = otherTenantId, RoleCode = "R08_PARENT", ScopeLevel = "TENANT", Status = "ACTIVE" });
            await db.SaveChangesAsync();
        }
        TestData.Authenticate(manager, await TestData.LoginAsync(manager, staff));
        var response = await manager.GetAsync($"/api/v1/students/{studentId}/consumer-accounts?accountType=parent&phone=%2B201011112222");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("\"total\":0", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        using var instructor = factory.CreateClient();
        var instructorAccount = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", staff.TenantId, staff.BranchId);
        TestData.Authenticate(instructor, await TestData.LoginAsync(instructor, instructorAccount));
        var forbidden = await instructor.GetAsync($"/api/v1/students/{studentId}/consumer-accounts?accountType=parent&phone=%2B201011112222");
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }
}
