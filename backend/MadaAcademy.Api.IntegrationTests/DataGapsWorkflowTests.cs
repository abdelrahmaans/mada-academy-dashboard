using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Modules.Operations;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class DataGapsWorkflowTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task SubscriptionFreeze_SubmitAndApprove_UpdatesStatusAndLogsAudit()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var studentId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var offeringId = Guid.NewGuid();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate { Id = templateId, TenantId = manager.TenantId, Name = "Robotics Pro", Track = "robotics" };
            var offering = new CourseOffering { Id = offeringId, TenantId = manager.TenantId, BranchId = manager.BranchId, CourseTemplateId = templateId, InstructorId = manager.UserId, ClassroomId = Guid.NewGuid(), MaxStudents = 12, Status = "ACTIVE" };
            var student = new Student { Id = studentId, TenantId = manager.TenantId, BranchId = manager.BranchId, FullName = "Karim FreezeTest", Status = "ACTIVE" };
            var enrollment = new StudentEnrollment { Id = Guid.NewGuid(), StudentId = studentId, CourseOfferingId = offeringId, FinalPricePiastres = 250_000, Status = "ACTIVE" };

            db.CourseTemplates.Add(template);
            db.CourseOfferings.Add(offering);
            db.Students.Add(student);
            db.StudentEnrollments.Add(enrollment);
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, manager));

        // 1. Submit freeze request
        var req = new CreateFreezeRequestDto(
            StudentId: studentId,
            StartDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            EndDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
            Reason: "TRAVEL",
            ReasonText: "سفر عائلي لأداء مناسك العمرة",
            CourseOfferingId: offeringId
        );

        var submitRes = await client.PostAsJsonAsync("/api/v1/operations/freeze-requests", req);
        Assert.Equal(HttpStatusCode.OK, submitRes.StatusCode);
        var freeze = (await submitRes.Content.ReadFromJsonAsync<ApiEnvelope<FreezeRequestItem>>(JsonOptions))!.Data;
        Assert.Equal("PENDING", freeze.Status);
        Assert.Equal("Karim FreezeTest", freeze.StudentName);
        Assert.True(freeze.AffectedSessionsCount >= 2);

        // 2. Decide freeze request (Approve)
        var decideReq = new DecideFreezeRequestDto("APPROVED", "معتمد طبقا لجدول السفر");
        var decideRes = await client.PostAsJsonAsync($"/api/v1/operations/freeze-requests/{freeze.Id}/decision", decideReq);
        Assert.Equal(HttpStatusCode.OK, decideRes.StatusCode);
        var decided = (await decideRes.Content.ReadFromJsonAsync<ApiEnvelope<FreezeRequestItem>>(JsonOptions))!.Data;
        Assert.Equal("APPROVED", decided.Status);

        // 3. Verify Database Enrollment updated to FROZEN
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var enrollment = await db.StudentEnrollments.FirstAsync(e => e.StudentId == studentId && e.CourseOfferingId == offeringId);
            Assert.Equal("FROZEN", enrollment.Status);
        }
    }

    [Fact]
    public async Task InstructorPayroll_CalculatesCompletedSessionsAndCreditsSubstitute()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");
        var mainInstructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", owner.TenantId, owner.BranchId);
        var substituteInstructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", owner.TenantId, owner.BranchId);

        var now = DateTimeOffset.UtcNow;
        var startOfMonth = new DateTimeOffset(new DateTime(now.Year, now.Month, 1), TimeSpan.Zero);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();

            // Session 1: completed by mainInstructor
            db.AcademySessions.Add(new AcademySession
            {
                Id = Guid.NewGuid(),
                TenantId = owner.TenantId,
                BranchId = owner.BranchId,
                InstructorId = mainInstructor.UserId,
                ClassroomId = Guid.NewGuid(),
                SessionNumber = 1,
                StartAt = startOfMonth.AddDays(2),
                EndAt = startOfMonth.AddDays(2).AddHours(2),
                Status = "COMPLETED"
            });

            // Session 2: completed by substituteInstructor (substitution was approved!)
            db.AcademySessions.Add(new AcademySession
            {
                Id = Guid.NewGuid(),
                TenantId = owner.TenantId,
                BranchId = owner.BranchId,
                InstructorId = mainInstructor.UserId,
                SubstituteInstructorId = substituteInstructor.UserId,
                ClassroomId = Guid.NewGuid(),
                SessionNumber = 2,
                StartAt = startOfMonth.AddDays(4),
                EndAt = startOfMonth.AddDays(4).AddHours(2),
                Status = "COMPLETED"
            });

            // Session 3: SCHEDULED (not completed, should not count)
            db.AcademySessions.Add(new AcademySession
            {
                Id = Guid.NewGuid(),
                TenantId = owner.TenantId,
                BranchId = owner.BranchId,
                InstructorId = mainInstructor.UserId,
                ClassroomId = Guid.NewGuid(),
                SessionNumber = 3,
                StartAt = startOfMonth.AddDays(10),
                EndAt = startOfMonth.AddDays(10).AddHours(2),
                Status = "SCHEDULED"
            });

            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));

        var monthStr = $"{now.Year:D4}-{now.Month:D2}";
        var payrollRes = await client.GetAsync($"/api/v1/finance/instructor-payroll?month={monthStr}");
        Assert.Equal(HttpStatusCode.OK, payrollRes.StatusCode);

        var doc = await payrollRes.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var items = doc.GetProperty("data").GetProperty("items").EnumerateArray().ToList();

        var mainItem = items.First(x => x.GetProperty("instructorId").GetGuid() == mainInstructor.UserId);
        var subItem = items.First(x => x.GetProperty("instructorId").GetGuid() == substituteInstructor.UserId);

        // Main instructor completed 1 session
        Assert.Equal(1, mainItem.GetProperty("completedSessionsCount").GetInt32());
        // Substitute instructor who taught session 2 got credited for 1 session!
        Assert.Equal(1, subItem.GetProperty("completedSessionsCount").GetInt32());
    }

    [Fact]
    public async Task DirectRegistration_AndConvertLead_SavesReferredByStudentId()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        var ambassadorStudentId = Guid.NewGuid();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Students.Add(new Student
            {
                Id = ambassadorStudentId,
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                FullName = "Ambassador Student",
                Status = "ACTIVE"
            });
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        var regReq = new DirectStudentRegistrationRequest(
            FullName: "New Referred Student",
            Phone: "+201099998888",
            BranchId: secretary.BranchId,
            CourseOfferingId: null,
            DateOfBirth: new DateOnly(2014, 5, 10),
            DiscountPercent: 10,
            CreateInvoice: false,
            ReferredByStudentId: ambassadorStudentId
        );

        var regRes = await client.PostAsJsonAsync("/api/v1/students/register", regReq);
        Assert.Equal(HttpStatusCode.OK, regRes.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var newStudent = await db.Students.FirstAsync(s => s.FullName == "New Referred Student");
            Assert.Equal(ambassadorStudentId, newStudent.ReferredByStudentId);
        }
    }
}
