using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class StudentRegistrationApiTests
{
    [Fact]
    public async Task Secretary_CanCreateEditAndManageEnrollment_WithinBranchScope()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        var otherBranchId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var offeringId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranchId, TenantId = secretary.TenantId, Name = "Other Branch", Code = $"O-{Guid.NewGuid():N}"[..10] });
            db.CourseTemplates.Add(new CourseTemplate { Id = templateId, TenantId = secretary.TenantId, Name = "Robotics Group", Status = "ACTIVE", TotalSessions = 8, SessionDurationHours = 1.5m, BasePricePiastres = 40_000 });
            db.Classrooms.Add(new Classroom { Id = Guid.NewGuid(), BranchId = secretary.BranchId, Name = "Room A", Capacity = 10 });
            db.CourseOfferings.Add(new CourseOffering { Id = offeringId, TenantId = secretary.TenantId, BranchId = secretary.BranchId, CourseTemplateId = templateId, InstructorId = secretary.UserId, ClassroomId = Guid.NewGuid(), StartDate = DateOnly.FromDateTime(DateTime.UtcNow), EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), Status = "ACTIVE", MaxStudents = 1 });
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        using var createResponse = await client.PostAsJsonAsync("/api/v1/students", new { fullName = "New Branch Student", dateOfBirth = "2014-05-12" });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        using var createdJson = await createResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Create response is empty.");
        var studentId = createdJson.RootElement.GetProperty("data").GetProperty("id").GetGuid();

        using var updateResponse = await client.PutAsJsonAsync($"/api/v1/students/{studentId}", new { fullName = "Updated Branch Student", dateOfBirth = "2014-05-12" });
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Contains("Updated Branch Student", await updateResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        using var enrollmentResponse = await client.PostAsJsonAsync($"/api/v1/students/{studentId}/enrollments", new { courseOfferingId = offeringId, finalPricePiastres = 35_000 });
        Assert.Equal(HttpStatusCode.Created, enrollmentResponse.StatusCode);
        using var enrollmentJson = await enrollmentResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Enrollment response is empty.");
        var enrollmentId = enrollmentJson.RootElement.GetProperty("data").GetProperty("id").GetGuid();

        using var duplicateResponse = await client.PostAsJsonAsync($"/api/v1/students/{studentId}/enrollments", new { courseOfferingId = offeringId, finalPricePiastres = 35_000 });
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);

        using var listResponse = await client.GetAsync($"/api/v1/students/{studentId}/enrollments");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        Assert.Contains(enrollmentId.ToString(), await listResponse.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);

        using var cancelResponse = await client.DeleteAsync($"/api/v1/students/{studentId}/enrollments/{enrollmentId}");
        Assert.Equal(HttpStatusCode.NoContent, cancelResponse.StatusCode);

        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var enrollment = await verifyDb.StudentEnrollments.SingleAsync(item => item.Id == enrollmentId);
        Assert.Equal("CANCELLED", enrollment.Status);
        var studentAuditCount = await verifyDb.AuditEvents.CountAsync(item => item.TargetId == studentId.ToString() && (item.Action == "STUDENT_CREATED" || item.Action == "STUDENT_UPDATED"));
        Assert.Equal(2, studentAuditCount);
        Assert.True(await verifyDb.AuditEvents.AnyAsync(item => item.Action == "STUDENT_ENROLLED" && item.TargetId == enrollmentId.ToString() && item.BranchId == secretary.BranchId));
        Assert.True(await verifyDb.AuditEvents.AnyAsync(item => item.Action == "STUDENT_ENROLLMENT_CANCELLED" && item.TargetId == enrollmentId.ToString() && item.BranchId == secretary.BranchId));
    }

    [Fact]
    public async Task Secretary_CannotReadOrEditStudentFromAnotherBranch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        var otherBranchId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranchId, TenantId = secretary.TenantId, Name = "Other Branch", Code = $"O-{Guid.NewGuid():N}"[..10] });
            await db.SaveChangesAsync();
        }
        var hiddenStudentId = await TestData.SeedStudentAsync(factory, secretary.TenantId, otherBranchId, "Hidden Branch Student");
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        using var updateResponse = await client.PutAsJsonAsync($"/api/v1/students/{hiddenStudentId}", new { fullName = "Should Not Update", dateOfBirth = (string?)null });
        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);
        using var enrollmentResponse = await client.GetAsync($"/api/v1/students/{hiddenStudentId}/enrollments");
        Assert.Equal(HttpStatusCode.NotFound, enrollmentResponse.StatusCode);
    }
}
