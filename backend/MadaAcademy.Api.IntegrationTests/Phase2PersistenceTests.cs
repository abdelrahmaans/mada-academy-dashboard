using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Modules.Operations;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class Phase2PersistenceTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task WaitlistWorkflow_FullLifecycle_PersistsAcrossRegisterNotifyConvertAndDelete()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");

        Guid offeringId;
        Guid existingStudentId = Guid.NewGuid();
        Guid existingEnrollmentId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate { TenantId = secretary.TenantId, Name = "Waitlist Robotics", Track = "robotics", BasePricePiastres = 300_000, Status = "PUBLISHED" };
            var classroom = new Classroom { BranchId = secretary.BranchId, Name = "Lab W", Capacity = 2 };
            var offering = new CourseOffering
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                CourseTemplateId = template.Id,
                InstructorId = secretary.UserId,
                ClassroomId = classroom.Id,
                MaxStudents = 1,
                Status = "ACTIVE"
            };
            var existingStudent = new Student { Id = existingStudentId, TenantId = secretary.TenantId, BranchId = secretary.BranchId, FullName = "First Seat", Status = "ACTIVE" };
            var enrollment = new StudentEnrollment { Id = existingEnrollmentId, StudentId = existingStudentId, CourseOfferingId = offering.Id, FinalPricePiastres = 300_000, Status = "ACTIVE" };
            db.CourseTemplates.Add(template);
            db.Classrooms.Add(classroom);
            db.CourseOfferings.Add(offering);
            db.Students.Add(existingStudent);
            db.StudentEnrollments.Add(enrollment);
            await db.SaveChangesAsync();
            offeringId = offering.Id;
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        // 1. Direct registration when full creates WAITLISTED StudentEnrollment + WAITLISTED Lead
        var fullReg = await client.PostAsJsonAsync("/api/v1/students/register", new DirectStudentRegistrationRequest(
            FullName: "Omar Waitlisted",
            Phone: "+201055443322",
            BranchId: secretary.BranchId,
            CourseOfferingId: offeringId,
            DateOfBirth: null,
            DiscountPercent: 0,
            CreateInvoice: true,
            JoinWaitlistIfFull: true));
        Assert.Equal(HttpStatusCode.OK, fullReg.StatusCode);
        var regEnv = await fullReg.Content.ReadFromJsonAsync<ApiEnvelope<ConvertLeadResponse>>(JsonOptions);
        Assert.Equal("WAITLISTED", regEnv!.Data.EnrollmentStatus);

        // Verify lead exists in GET /leads with WAITLISTED
        var leadsRes = await client.GetAsync("/api/v1/leads");
        Assert.Equal(HttpStatusCode.OK, leadsRes.StatusCode);
        var leadsEnv = await leadsRes.Content.ReadFromJsonAsync<ApiEnvelope<LeadListResponse>>(JsonOptions);
        var autoWaitlistLead = leadsEnv!.Data.Items.Single(l => l.ChildName == "Omar Waitlisted");
        Assert.Equal("WAITLISTED", autoWaitlistLead.Status);
        Assert.Equal(regEnv.Data.StudentId, autoWaitlistLead.ConvertedStudentId);

        // 2. Notify waitlisted lead
        var notifyRes = await client.PatchAsJsonAsync($"/api/v1/leads/{autoWaitlistLead.Id}/status", new { status = "NOTIFIED" });
        Assert.Equal(HttpStatusCode.OK, notifyRes.StatusCode);
        var notifyEnv = await notifyRes.Content.ReadFromJsonAsync<ApiEnvelope<LeadItem>>(JsonOptions);
        Assert.Equal("NOTIFIED", notifyEnv!.Data.Status);

        // 3. Converting while seat is still full and joinWaitlistIfFull=false returns 400 GROUP_FULL
        var fullConvert = await client.PostAsJsonAsync($"/api/v1/leads/{autoWaitlistLead.Id}/convert", new ConvertLeadRequest(
            CourseOfferingId: offeringId, DateOfBirth: null, DiscountPercent: 0, CreateInvoice: true, JoinWaitlistIfFull: false));
        Assert.Equal(HttpStatusCode.BadRequest, fullConvert.StatusCode);

        // 4. Free up the seat (increase MaxStudents) and convert without duplicating Student!
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var offering = await db.CourseOfferings.FindAsync(offeringId);
            offering!.MaxStudents = 3;
            await db.SaveChangesAsync();
        }

        var okConvert = await client.PostAsJsonAsync($"/api/v1/leads/{autoWaitlistLead.Id}/convert", new ConvertLeadRequest(
            CourseOfferingId: offeringId, DateOfBirth: null, DiscountPercent: 0, CreateInvoice: true, JoinWaitlistIfFull: false));
        Assert.Equal(HttpStatusCode.OK, okConvert.StatusCode);
        var convertEnv = await okConvert.Content.ReadFromJsonAsync<ApiEnvelope<ConvertLeadResponse>>(JsonOptions);
        Assert.Equal("ACTIVE", convertEnv!.Data.EnrollmentStatus);
        Assert.Equal(regEnv.Data.StudentId, convertEnv.Data.StudentId);
        Assert.NotNull(convertEnv.Data.InvoiceId);

        // 5. Deleting a REGISTERED lead returns 409 Conflict; creating & deleting a new WAITLISTED lead succeeds
        var delRegistered = await client.DeleteAsync($"/api/v1/leads/{autoWaitlistLead.Id}");
        Assert.Equal(HttpStatusCode.Conflict, delRegistered.StatusCode);

        var addWaitlist = await client.PostAsJsonAsync("/api/v1/leads", new
        {
            childName = "Temp Waitlist",
            parentName = "Parent",
            phone = "+201011223344",
            courseOfferingId = offeringId,
            status = "WAITLISTED"
        });
        Assert.Equal(HttpStatusCode.OK, addWaitlist.StatusCode);
        var tempLead = (await addWaitlist.Content.ReadFromJsonAsync<ApiEnvelope<LeadItem>>(JsonOptions))!.Data;
        Assert.Equal("WAITLISTED", tempLead.Status);

        var delTemp = await client.DeleteAsync($"/api/v1/leads/{tempLead.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delTemp.StatusCode);
    }

    [Fact]
    public async Task InstructorPayroll_AdjustApproveAndPay_PersistsAndCreatesApprovedSalaryExpense()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var accountant = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", accountant.TenantId, accountant.BranchId);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY", accountant.TenantId, accountant.BranchId);

        var now = DateTimeOffset.UtcNow;
        var monthStr = $"{now.Year:D4}-{now.Month:D2}";
        var startOfMonth = new DateTimeOffset(new DateTime(now.Year, now.Month, 1), TimeSpan.Zero);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.AcademySessions.Add(new AcademySession
            {
                TenantId = accountant.TenantId,
                BranchId = accountant.BranchId,
                InstructorId = instructor.UserId,
                ClassroomId = Guid.NewGuid(),
                SessionNumber = 1,
                StartAt = startOfMonth.AddDays(1),
                EndAt = startOfMonth.AddDays(1).AddHours(2),
                Status = "COMPLETED"
            });
            await db.SaveChangesAsync();
        }

        using var secClient = factory.CreateClient();
        TestData.Authenticate(secClient, await TestData.LoginAsync(secClient, secretary));
        var secForbidden = await secClient.GetAsync($"/api/v1/finance/instructor-payroll?month={monthStr}");
        Assert.Equal(HttpStatusCode.Forbidden, secForbidden.StatusCode);

        using var accClient = factory.CreateClient();
        TestData.Authenticate(accClient, await TestData.LoginAsync(accClient, accountant));

        // 1. Adjust bonus & deduction
        var adjustRes = await accClient.PutAsJsonAsync($"/api/v1/finance/instructor-payroll/{instructor.UserId}/adjustments", new
        {
            month = monthStr,
            bonusPiastres = 15_000L,
            bonusReason = "Extra robotics demo",
            deductionPiastres = 5_000L,
            deductionReason = "Late report"
        });
        Assert.Equal(HttpStatusCode.OK, adjustRes.StatusCode);
        var adjustJson = await adjustRes.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        Assert.Equal(30_000L, adjustJson.GetProperty("data").GetProperty("netPayablePiastres").GetInt64()); // 20000 + 15000 - 5000

        // Paying before approve -> 409 Conflict
        var payBeforeApprove = await accClient.PostAsJsonAsync($"/api/v1/finance/instructor-payroll/{instructor.UserId}/pay", new
        {
            month = monthStr,
            paymentMethod = "INSTAPAY"
        });
        Assert.Equal(HttpStatusCode.Conflict, payBeforeApprove.StatusCode);

        // 2. Approve
        var approveRes = await accClient.PostAsJsonAsync($"/api/v1/finance/instructor-payroll/{instructor.UserId}/approve", new { month = monthStr });
        Assert.Equal(HttpStatusCode.OK, approveRes.StatusCode);
        var approveJson = await approveRes.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        Assert.Equal("APPROVED", approveJson.GetProperty("data").GetProperty("status").GetString());

        // Adjusting after approve -> 409 Conflict
        var adjustAfterApprove = await accClient.PutAsJsonAsync($"/api/v1/finance/instructor-payroll/{instructor.UserId}/adjustments", new
        {
            month = monthStr,
            bonusPiastres = 99_000L,
            deductionPiastres = 0L
        });
        Assert.Equal(HttpStatusCode.Conflict, adjustAfterApprove.StatusCode);

        // 3. Pay -> creates APPROVED SALARIES Expense + marks PAID
        var payRes = await accClient.PostAsJsonAsync($"/api/v1/finance/instructor-payroll/{instructor.UserId}/pay", new
        {
            month = monthStr,
            paymentMethod = "INSTAPAY",
            paymentReference = "IPN-998877"
        });
        Assert.Equal(HttpStatusCode.OK, payRes.StatusCode);
        var payJson = await payRes.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        Assert.Equal("PAID", payJson.GetProperty("data").GetProperty("status").GetString());
        var linkedExpenseId = payJson.GetProperty("data").GetProperty("linkedExpenseId").GetGuid();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var expense = await db.Expenses.FindAsync(linkedExpenseId);
            Assert.NotNull(expense);
            Assert.Equal("SALARIES", expense!.Category);
            Assert.Equal("APPROVED", expense.Status);
            Assert.Equal(30_000, expense.AmountPiastres);
        }
    }

    [Fact]
    public async Task EvaluationRubrics_CrudAndDefaultSwitching_RespectsRbacAndPersistence()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var head = await TestData.CreateAccountAsync(factory, "R03_HEAD_INSTRUCTORS");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", head.TenantId, head.BranchId);

        using var instrClient = factory.CreateClient();
        TestData.Authenticate(instrClient, await TestData.LoginAsync(instrClient, instructor));

        // Instructor can read, cannot create
        var instrGet = await instrClient.GetAsync("/api/v1/scheduling/rubrics");
        Assert.Equal(HttpStatusCode.OK, instrGet.StatusCode);

        var instrCreate = await instrClient.PostAsJsonAsync("/api/v1/scheduling/rubrics", new
        {
            trackKey = "robotics",
            trackLabel = "روبوتكس",
            title = "Unauthorized Rubric",
            scaleMax = 5,
            criteria = new[]
            {
                new { label = "Crit 1", category = "TECHNICAL", categoryLabel = "فني", maxScore = 5, hint = "" },
                new { label = "Crit 2", category = "PRACTICAL", categoryLabel = "عملي", maxScore = 5, hint = "" }
            }
        });
        Assert.Equal(HttpStatusCode.Forbidden, instrCreate.StatusCode);

        using var headClient = factory.CreateClient();
        TestData.Authenticate(headClient, await TestData.LoginAsync(headClient, head));

        // Head creates Rubric A (default) and Rubric B (non-default)
        var createA = await headClient.PostAsJsonAsync("/api/v1/scheduling/rubrics", new
        {
            trackKey = "robotics",
            trackLabel = "روبوتكس",
            title = "Robotics Standard",
            description = "Default robotics criteria",
            scaleMax = 5,
            isDefault = true,
            criteria = new[]
            {
                new { id = "c1", key = "c1", label = "Assembly", category = "TECHNICAL", categoryLabel = "فني", maxScore = 5, hint = "h1" },
                new { id = "c2", key = "c2", label = "Code", category = "PRACTICAL", categoryLabel = "عملي", maxScore = 5, hint = "h2" }
            }
        });
        Assert.Equal(HttpStatusCode.Created, createA.StatusCode);
        var rubricAId = (await createA.Content.ReadFromJsonAsync<JsonElement>(JsonOptions)).GetProperty("data").GetProperty("id").GetGuid();

        var createB = await headClient.PostAsJsonAsync("/api/v1/scheduling/rubrics", new
        {
            trackKey = "robotics",
            trackLabel = "روبوتكس",
            title = "Robotics Advanced",
            scaleMax = 10,
            isDefault = false,
            criteria = new[]
            {
                new { id = "c3", key = "c3", label = "PID", category = "TECHNICAL", categoryLabel = "فني", maxScore = 10, hint = "" },
                new { id = "c4", key = "c4", label = "Safety", category = "BEHAVIORAL", categoryLabel = "سلوك", maxScore = 10, hint = "" }
            }
        });
        Assert.Equal(HttpStatusCode.Created, createB.StatusCode);
        var rubricBId = (await createB.Content.ReadFromJsonAsync<JsonElement>(JsonOptions)).GetProperty("data").GetProperty("id").GetGuid();

        // Cannot delete default Rubric A while Rubric B exists
        var deleteDefaultBlocked = await headClient.DeleteAsync($"/api/v1/scheduling/rubrics/{rubricAId}");
        Assert.Equal(HttpStatusCode.Conflict, deleteDefaultBlocked.StatusCode);

        // Switch default to Rubric B
        var setDefaultB = await headClient.PostAsync($"/api/v1/scheduling/rubrics/{rubricBId}/default", null);
        Assert.Equal(HttpStatusCode.OK, setDefaultB.StatusCode);

        // Now Rubric A is non-default and can be deleted
        var deleteA = await headClient.DeleteAsync($"/api/v1/scheduling/rubrics/{rubricAId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteA.StatusCode);

        // Instructor reads updated default Rubric B
        var afterGet = await instrClient.GetAsync("/api/v1/scheduling/rubrics?track=robotics");
        Assert.Equal(HttpStatusCode.OK, afterGet.StatusCode);
        var listJson = await afterGet.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var items = listJson.GetProperty("data").GetProperty("items").EnumerateArray().ToList();
        Assert.Single(items);
        Assert.Equal(rubricBId, items[0].GetProperty("id").GetGuid());
        Assert.True(items[0].GetProperty("isDefault").GetBoolean());
    }
}

