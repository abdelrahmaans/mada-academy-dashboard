using System.Net;
using System.Net.Http.Json;
using MadaAcademy.Api.Modules.Operations;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class LeadWorkflowApiTests
{
    [Fact]
    public async Task Secretary_CanListCreateUpdateAndConvertLeads()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();

        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Leads.Add(new Lead
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                ChildName = "سليم أحمد كمال",
                ParentName = "أحمد كمال",
                Phone = "+201012345671",
                Channel = "WALK_IN",
                Status = "NEW"
            });
            await db.SaveChangesAsync();
        }

        // 1. GET /api/v1/leads
        var listResponse = await client.GetAsync("/api/v1/leads");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var listData = await listResponse.Content.ReadFromJsonAsync<ApiEnvelope<LeadListResponse>>();
        Assert.NotNull(listData);
        Assert.True(listData.Data.Total >= 1);
        Assert.True(listData.Data.Active >= 1);

        // 2. POST /api/v1/leads
        var createResponse = await client.PostAsJsonAsync("/api/v1/leads", new
        {
            childName = "مروان كريم إيهاب",
            parentName = "كريم إيهاب",
            phone = "+201099887766",
            channel = "WALK_IN",
            notes = "زيارة للاستفسار عن كورس الروبوتكس للمبتدئين"
        });
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var createdData = await createResponse.Content.ReadFromJsonAsync<ApiEnvelope<LeadItem>>();
        Assert.NotNull(createdData);
        Assert.Equal("مروان كريم إيهاب", createdData.Data.ChildName);
        Assert.Equal("NEW", createdData.Data.Status);
        var leadId = createdData.Data.Id;

        // 3. PATCH /api/v1/leads/{id}/status
        var updateResponse = await client.PatchAsJsonAsync($"/api/v1/leads/{leadId}/status", new
        {
            status = "INTERESTED"
        });
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updatedData = await updateResponse.Content.ReadFromJsonAsync<ApiEnvelope<LeadItem>>();
        Assert.NotNull(updatedData);
        Assert.Equal("INTERESTED", updatedData.Data.Status);

        // 4. Convert lead into student with enrollment & invoice
        Guid offeringId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate
            {
                TenantId = secretary.TenantId,
                Name = "Junior Robotics",
                Track = "robotics",
                Type = "hard",
                AgeGroup = "8-12",
                Level = "beginner",
                TotalSessions = 8,
                SessionDurationHours = 1.5m,
                BasePricePiastres = 320000,
                Status = "PUBLISHED"
            };
            db.CourseTemplates.Add(template);

            var classroom = new Classroom { BranchId = secretary.BranchId, Name = "Lab 1", Capacity = 10 };
            db.Classrooms.Add(classroom);

            var offering = new CourseOffering
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                CourseTemplateId = template.Id,
                InstructorId = secretary.UserId,
                ClassroomId = classroom.Id,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2)),
                WeeklyScheduleJson = "{}",
                Status = "ACTIVE",
                MaxStudents = 10
            };
            db.CourseOfferings.Add(offering);
            await db.SaveChangesAsync();
            offeringId = offering.Id;
        }

        var convertResponse = await client.PostAsJsonAsync($"/api/v1/leads/{leadId}/convert", new
        {
            courseOfferingId = offeringId,
            dateOfBirth = new DateOnly(2016, 5, 20),
            discountPercent = 10,
            createInvoice = true
        });
        Assert.Equal(HttpStatusCode.OK, convertResponse.StatusCode);
        var convertData = await convertResponse.Content.ReadFromJsonAsync<ApiEnvelope<ConvertLeadResponse>>();
        Assert.NotNull(convertData);
        Assert.Equal("مروان كريم إيهاب", convertData.Data.StudentName);
        Assert.NotNull(convertData.Data.EnrollmentId);
        Assert.NotNull(convertData.Data.InvoiceId);

        // Verify database state
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var verifiedLead = await db.Leads.FindAsync(leadId);
            Assert.NotNull(verifiedLead);
            Assert.Equal("REGISTERED", verifiedLead.Status);
            Assert.Equal(convertData.Data.StudentId, verifiedLead.ConvertedStudentId);

            var student = await db.Students.FindAsync(convertData.Data.StudentId);
            Assert.NotNull(student);
            Assert.Equal("مروان كريم إيهاب", student.FullName);

            var enrollment = await db.StudentEnrollments.FindAsync(convertData.Data.EnrollmentId);
            Assert.NotNull(enrollment);
            Assert.Equal("ACTIVE", enrollment.Status);

            var invoice = await db.Invoices.Include(i => i.Lines).FirstOrDefaultAsync(i => i.Id == convertData.Data.InvoiceId);
            Assert.NotNull(invoice);
            Assert.Equal("UNPAID", invoice.Status);
            Assert.Single(invoice.Lines);
        }
    }

    [Fact]
    public async Task Secretary_CanRegisterStudentDirectly()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();

        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        Guid offeringId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate
            {
                TenantId = secretary.TenantId,
                Name = "Programming",
                Track = "coding",
                Type = "hard",
                AgeGroup = "10-14",
                Level = "beginner",
                TotalSessions = 8,
                SessionDurationHours = 1.5m,
                BasePricePiastres = 250000,
                Status = "PUBLISHED"
            };
            db.CourseTemplates.Add(template);

            var classroom = new Classroom { BranchId = secretary.BranchId, Name = "Lab 2", Capacity = 12 };
            db.Classrooms.Add(classroom);

            var offering = new CourseOffering
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                CourseTemplateId = template.Id,
                InstructorId = secretary.UserId,
                ClassroomId = classroom.Id,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2)),
                WeeklyScheduleJson = "{}",
                Status = "ACTIVE",
                MaxStudents = 12
            };
            db.CourseOfferings.Add(offering);
            await db.SaveChangesAsync();
            offeringId = offering.Id;
        }

        var response = await client.PostAsJsonAsync("/api/v1/students/register", new
        {
            fullName = "زين الدين خالد",
            phone = "+201055443322",
            courseOfferingId = offeringId,
            dateOfBirth = new DateOnly(2015, 8, 14),
            discountPercent = 15,
            createInvoice = true
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var data = await response.Content.ReadFromJsonAsync<ApiEnvelope<ConvertLeadResponse>>();
        Assert.NotNull(data);
        Assert.Equal("زين الدين خالد", data.Data.StudentName);
        Assert.NotNull(data.Data.EnrollmentId);
        Assert.NotNull(data.Data.InvoiceId);
    }
}
