using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class Phase3PersistenceTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task RetentionOutreach_PostUpdatesAuditAndPersistsInRetentionRadarGet()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var owner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");

        Guid studentId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate { TenantId = owner.TenantId, Name = "Robotics Radar Track", Track = "robotics", BasePricePiastres = 300_000, Status = "PUBLISHED" };
            var classroom = new Classroom { BranchId = owner.BranchId, Name = "Lab R", Capacity = 10 };
            var offering = new CourseOffering
            {
                TenantId = owner.TenantId,
                BranchId = owner.BranchId,
                CourseTemplateId = template.Id,
                InstructorId = owner.UserId,
                ClassroomId = classroom.Id,
                MaxStudents = 10,
                Status = "ACTIVE"
            };
            var student = new Student { TenantId = owner.TenantId, BranchId = owner.BranchId, FullName = "Ziad Retention", Status = "ACTIVE" };
            var enrollment = new StudentEnrollment { StudentId = student.Id, CourseOfferingId = offering.Id, FinalPricePiastres = 300_000, Status = "ACTIVE" };
            db.CourseTemplates.Add(template);
            db.Classrooms.Add(classroom);
            db.CourseOfferings.Add(offering);
            db.Students.Add(student);
            db.StudentEnrollments.Add(enrollment);
            await db.SaveChangesAsync();
            studentId = student.Id;
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, owner));

        var postFirst = await client.PostAsJsonAsync($"/api/v1/reports/analytics/retention-radar/{studentId}/outreach", new
        {
            status = "contacted",
            note = "تم الاتصال بولي الأمر للمتابعة"
        });
        Assert.Equal(HttpStatusCode.OK, postFirst.StatusCode);

        var postSecond = await client.PostAsJsonAsync($"/api/v1/reports/analytics/retention-radar/{studentId}/outreach", new
        {
            status = "retained",
            note = "تم تأكيد حضور الحصة القادمة"
        });
        Assert.Equal(HttpStatusCode.OK, postSecond.StatusCode);

        var radarRes = await client.GetAsync("/api/v1/reports/analytics/retention-radar");
        Assert.Equal(HttpStatusCode.OK, radarRes.StatusCode);

        using var doc = await JsonDocument.ParseAsync(await radarRes.Content.ReadAsStreamAsync());
        var items = doc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().ToList();
        var item = Assert.Single(items, x => x.GetProperty("studentId").GetGuid() == studentId);
        Assert.Equal("retained", item.GetProperty("outreachStatus").GetString());
        Assert.Equal("تم تأكيد حضور الحصة القادمة", item.GetProperty("lastContactNote").GetString());
    }

    [Fact]
    public async Task PlatformDemoLeads_CreateUpdateAndConvert_CreatesTenantBranchOwnerAndLoginWorks()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");

        using var anonClient = factory.CreateClient();
        var createLeadRes = await anonClient.PostAsJsonAsync("/api/v1/public/demo-requests", new
        {
            name = "م. خالد سامي",
            email = "khaled@future-stem.example",
            phone = "+201099887766",
            academyName = "أكاديمية المستقبل للبرمجة",
            branchCount = "2",
            operationalNeed = "تنظيم الحصص والفواتير",
            notes = "مهتمون بالخطة المتوسطة"
        });
        Assert.Equal(HttpStatusCode.Created, createLeadRes.StatusCode);

        using var leadDoc = await JsonDocument.ParseAsync(await createLeadRes.Content.ReadAsStreamAsync());
        var leadId = leadDoc.RootElement.GetProperty("data").GetProperty("id").GetString()!;

        using var adminClient = factory.CreateClient();
        TestData.Authenticate(adminClient, await TestData.LoginAsync(adminClient, platformAdmin));

        var listRes = await adminClient.GetAsync("/api/v1/platform/demo-leads");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        using var listDoc = await JsonDocument.ParseAsync(await listRes.Content.ReadAsStreamAsync());
        Assert.Contains(listDoc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray(),
            x => x.GetProperty("id").GetString() == leadId && x.GetProperty("status").GetString() == "NEW");

        var patchRes = await adminClient.PatchAsJsonAsync($"/api/v1/platform/demo-leads/{leadId}/status", new { status = "DEMO_SCHEDULED" });
        Assert.Equal(HttpStatusCode.OK, patchRes.StatusCode);

        var ownerPhone = "+201055112233";
        var ownerPass = "Mada#9988!";
        var convertRes = await adminClient.PostAsJsonAsync($"/api/v1/platform/demo-leads/{leadId}/convert", new
        {
            name = "أكاديمية المستقبل للبرمجة",
            slug = "future-stem-academy",
            planCode = "GROWTH",
            branchName = "فرع مدينة نصر",
            branchCode = "NASR",
            ownerName = "م. خالد سامي",
            ownerPhone,
            ownerEmail = "owner@future-stem.example",
            ownerPassword = ownerPass
        });
        Assert.Equal(HttpStatusCode.Created, convertRes.StatusCode);

        var afterConvertListRes = await adminClient.GetAsync("/api/v1/platform/demo-leads");
        using var afterDoc = await JsonDocument.ParseAsync(await afterConvertListRes.Content.ReadAsStreamAsync());
        var convertedLead = Assert.Single(afterDoc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray(),
            x => x.GetProperty("id").GetString() == leadId);
        Assert.Equal("CONVERTED", convertedLead.GetProperty("status").GetString());

        // New academy owner can immediately authenticate cleanly
        var ownerLogin = await anonClient.PostAsJsonAsync("/api/v1/auth/login", new
        {
            phone = ownerPhone,
            password = ownerPass,
            accountType = "staff"
        });
        Assert.Equal(HttpStatusCode.OK, ownerLogin.StatusCode);
    }

    [Fact]
    public async Task PlatformPaymentsTrialAndOwnerReset_PersistAcrossRequests()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN");
        var targetOwner = await TestData.CreateAccountAsync(factory, "R01_ACADEMY_OWNER");

        using var adminClient = factory.CreateClient();
        TestData.Authenticate(adminClient, await TestData.LoginAsync(adminClient, platformAdmin));

        // 1. Record subscription payment
        var payRes = await adminClient.PostAsJsonAsync($"/api/v1/platform/academies/{targetOwner.TenantId}/payments", new
        {
            amount = 18500,
            method = "INSTAPAY",
            referenceNumber = "INSTA-PHASE3-001",
            notes = "تجديد اشتراك سنوي"
        });
        Assert.Equal(HttpStatusCode.Created, payRes.StatusCode);

        // 2. Extend trial (+10 days)
        var trialRes = await adminClient.PostAsJsonAsync($"/api/v1/platform/academies/{targetOwner.TenantId}/trial/extend", new
        {
            daysToAdd = 10,
            reason = "تمديد فترة التقييم للفروع"
        });
        Assert.Equal(HttpStatusCode.OK, trialRes.StatusCode);

        // 3. Verify GET /platform/payments & GET /platform/academies reflect both persisted records
        var paymentsRes = await adminClient.GetAsync("/api/v1/platform/payments");
        Assert.Equal(HttpStatusCode.OK, paymentsRes.StatusCode);
        using var payDoc = await JsonDocument.ParseAsync(await paymentsRes.Content.ReadAsStreamAsync());
        var payItems = payDoc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().ToList();
        Assert.Contains(payItems, p => p.GetProperty("tenantId").GetGuid() == targetOwner.TenantId && p.GetProperty("amount").GetInt64() == 18500);

        var academiesRes = await adminClient.GetAsync("/api/v1/platform/academies");
        Assert.Equal(HttpStatusCode.OK, academiesRes.StatusCode);
        using var acDoc = await JsonDocument.ParseAsync(await academiesRes.Content.ReadAsStreamAsync());
        var targetAcademy = Assert.Single(acDoc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray(),
            a => a.GetProperty("id").GetGuid() == targetOwner.TenantId);
        Assert.True(targetAcademy.GetProperty("isTrialExtended").GetBoolean());
        Assert.Equal(18500, targetAcademy.GetProperty("totalPaidAmount").GetInt64());
        Assert.True(targetAcademy.GetProperty("remainingTrialDays").GetInt32() >= 9);

        // 4. Owner password reset generates temp password and allows owner login
        var resetRes = await adminClient.PostAsJsonAsync($"/api/v1/platform/academies/{targetOwner.TenantId}/owner-reset", new
        {
            reason = "طلب استعادة كلمة المرور عبر الدعم الفني"
        });
        Assert.Equal(HttpStatusCode.OK, resetRes.StatusCode);
        using var resetDoc = await JsonDocument.ParseAsync(await resetRes.Content.ReadAsStreamAsync());
        var tempPassword = resetDoc.RootElement.GetProperty("data").GetProperty("tempPassword").GetString()!;
        Assert.StartsWith("Mada#", tempPassword);

        using var anonClient = factory.CreateClient();
        var loginWithTemp = await anonClient.PostAsJsonAsync("/api/v1/auth/login", new
        {
            phone = targetOwner.Phone,
            password = tempPassword,
            accountType = "staff"
        });
        Assert.Equal(HttpStatusCode.OK, loginWithTemp.StatusCode);
    }
}

