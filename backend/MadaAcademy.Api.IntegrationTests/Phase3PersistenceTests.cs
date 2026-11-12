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

    [Fact]
    public async Task SessionWorkflow_UpdateAndCancelSession_PersistsAndChecksConflicts()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);

        Guid classroomId;
        Guid firstSessionId;
        Guid secondSessionId;
        var baseStart = DateTimeOffset.UtcNow.AddDays(2);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var template = new CourseTemplate { TenantId = manager.TenantId, Name = "Robotics Edit Track", Track = "robotics", BasePricePiastres = 250_000, Status = "PUBLISHED" };
            var classroom = new Classroom { BranchId = manager.BranchId, Name = "Lab Alpha", Capacity = 12 };
            var offering = new CourseOffering
            {
                TenantId = manager.TenantId,
                BranchId = manager.BranchId,
                CourseTemplateId = template.Id,
                InstructorId = instructor.UserId,
                ClassroomId = classroom.Id,
                MaxStudents = 12,
                Status = "ACTIVE"
            };
            var session1 = new AcademySession
            {
                TenantId = manager.TenantId,
                BranchId = manager.BranchId,
                CourseOfferingId = offering.Id,
                SessionNumber = 1,
                StartAt = baseStart,
                EndAt = baseStart.AddHours(2),
                InstructorId = instructor.UserId,
                ClassroomId = classroom.Id,
                Type = "REGULAR",
                Status = "SCHEDULED",
                Notes = "جلسة أولية"
            };
            var session2 = new AcademySession
            {
                TenantId = manager.TenantId,
                BranchId = manager.BranchId,
                CourseOfferingId = offering.Id,
                SessionNumber = 2,
                StartAt = baseStart.AddHours(4),
                EndAt = baseStart.AddHours(6),
                InstructorId = instructor.UserId,
                ClassroomId = classroom.Id,
                Type = "REGULAR",
                Status = "SCHEDULED",
                Notes = "جلسة ثانية"
            };

            db.CourseTemplates.Add(template);
            db.Classrooms.Add(classroom);
            db.CourseOfferings.Add(offering);
            db.AcademySessions.AddRange(session1, session2);
            await db.SaveChangesAsync();
            classroomId = classroom.Id;
            firstSessionId = session1.Id;
            secondSessionId = session2.Id;
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, manager));

        // 1. Overlapping another session's slot returns 409 Conflict
        var conflictRes = await client.PatchAsJsonAsync($"/api/v1/scheduling/sessions/{firstSessionId}", new
        {
            classroomId,
            instructorId = instructor.UserId,
            startAt = baseStart.AddHours(4).AddMinutes(30),
            endAt = baseStart.AddHours(6).AddMinutes(30),
            type = "REGULAR",
            notes = "تعارض متوقع"
        });
        Assert.Equal(HttpStatusCode.Conflict, conflictRes.StatusCode);

        // 2. Updating within its own overlapping time (self excluded) succeeds and updates notes/type
        var updateRes = await client.PatchAsJsonAsync($"/api/v1/scheduling/sessions/{firstSessionId}", new
        {
            classroomId,
            instructorId = instructor.UserId,
            startAt = baseStart.AddMinutes(15),
            endAt = baseStart.AddHours(2).AddMinutes(15),
            type = "MAKEUP",
            notes = "تم تعديل موعد الجلسة بنجاح"
        });
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

        // 3. Cancel the second session
        var cancelRes = await client.PostAsJsonAsync($"/api/v1/scheduling/sessions/{secondSessionId}/cancel", new
        {
            reason = "تأجيل لظروف صيانة المعمل"
        });
        Assert.Equal(HttpStatusCode.OK, cancelRes.StatusCode);
        using (var cancelDoc = await JsonDocument.ParseAsync(await cancelRes.Content.ReadAsStreamAsync()))
        {
            Assert.Equal("CANCELLED", cancelDoc.RootElement.GetProperty("data").GetProperty("status").GetString());
        }

        // 4. Verify GET /api/v1/sessions reflects both updates
        var listRes = await client.GetAsync("/api/v1/sessions");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        using var listDoc = await JsonDocument.ParseAsync(await listRes.Content.ReadAsStreamAsync());
        var sessions = listDoc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().ToList();
        var updatedFirst = Assert.Single(sessions, s => s.GetProperty("id").GetGuid() == firstSessionId);
        Assert.Equal("MAKEUP", updatedFirst.GetProperty("type").GetString());
        Assert.Equal("تم تعديل موعد الجلسة بنجاح", updatedFirst.GetProperty("notes").GetString());

        var cancelledSecond = Assert.Single(sessions, s => s.GetProperty("id").GetGuid() == secondSessionId);
        Assert.Equal("CANCELLED", cancelledSecond.GetProperty("status").GetString());
    }

    [Fact]
    public async Task StudentsList_IncludesLinkedGuardianInfo_WhenGuardianLinkExists()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        var parent = await TestData.CreateConsumerAccountAsync(factory, secretary.TenantId, "parent", "R08_PARENT", "+201099887766");

        Guid linkedStudentId;
        Guid unlinkedStudentId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var parentAccount = await db.UserAccounts.FindAsync(parent.UserId);
            if (parentAccount is not null)
                parentAccount.DisplayName = "م. خالد المنصور";

            var linkedStudent = new Student
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                FullName = "سلمى خالد المنصور",
                Status = "ACTIVE"
            };
            var unlinkedStudent = new Student
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                FullName = "آدم بدون ولي أمر",
                Status = "ACTIVE"
            };
            db.Students.AddRange(linkedStudent, unlinkedStudent);
            db.GuardianStudentLinks.Add(new GuardianStudentLink
            {
                TenantId = secretary.TenantId,
                StudentId = linkedStudent.Id,
                UserAccountId = parent.UserId,
                CreatedByUserId = secretary.UserId,
                Relationship = "الأب",
                Status = "ACTIVE"
            });
            await db.SaveChangesAsync();
            linkedStudentId = linkedStudent.Id;
            unlinkedStudentId = unlinkedStudent.Id;
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, secretary));

        var res = await client.GetAsync("/api/v1/students");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var items = doc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().ToList();

        var linked = Assert.Single(items, s => s.GetProperty("id").GetGuid() == linkedStudentId);
        Assert.Equal("م. خالد المنصور", linked.GetProperty("parentName").GetString());
        Assert.Equal("+201099887766", linked.GetProperty("parentPhone").GetString());
        Assert.Equal("الأب", linked.GetProperty("relationship").GetString());

        var unlinked = Assert.Single(items, s => s.GetProperty("id").GetGuid() == unlinkedStudentId);
        Assert.Equal(JsonValueKind.Null, unlinked.GetProperty("parentName").ValueKind);
        Assert.Equal(JsonValueKind.Null, unlinked.GetProperty("parentPhone").ValueKind);
        Assert.Equal(JsonValueKind.Null, unlinked.GetProperty("relationship").ValueKind);
    }

    [Fact]
    public async Task Consumer_Invoice_Online_Checkout_And_Confirm_Is_Idempotent_And_Updates_Status()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        var parent = await TestData.CreateConsumerAccountAsync(factory, secretary.TenantId, "parent", "R08_PARENT", "+201011223344");

        Guid invoiceId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var student = new Student
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                FullName = "عمر أحمد",
                Status = "ACTIVE"
            };
            db.Students.Add(student);
            db.GuardianStudentLinks.Add(new GuardianStudentLink
            {
                TenantId = secretary.TenantId,
                StudentId = student.Id,
                UserAccountId = parent.UserId,
                CreatedByUserId = secretary.UserId,
                Relationship = "الأب",
                Status = "ACTIVE"
            });
            db.Memberships.Add(new Membership
            {
                UserAccountId = parent.UserId,
                TenantId = secretary.TenantId,
                RoleCode = "R08_PARENT",
                ScopeLevel = "TENANT",
                Status = "ACTIVE"
            });
            var invoice = new Invoice
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                StudentId = student.Id,
                InvoiceNumber = "MAD-TEST-ONLINE-001",
                TotalPiastres = 100000,
                IssueDate = DateOnly.FromDateTime(DateTime.UtcNow),
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                CreatedByUserId = secretary.UserId,
                Lines = [new InvoiceLine { LineNumber = 1, Description = "رسوم الدورة", AmountPiastres = 100000 }]
            };
            db.Invoices.Add(invoice);
            await db.SaveChangesAsync();
            invoiceId = invoice.Id;
        }

        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, parent));

        var checkoutRes = await client.PostAsJsonAsync($"/api/v1/consumer/invoices/{invoiceId}/checkout", new { method = "CARD" });
        Assert.Equal(HttpStatusCode.OK, checkoutRes.StatusCode);
        using var checkoutDoc = await JsonDocument.ParseAsync(await checkoutRes.Content.ReadAsStreamAsync());
        var checkoutData = checkoutDoc.RootElement.GetProperty("data");
        var sessionId = checkoutData.GetProperty("checkoutSessionId").GetString()!;
        Assert.Equal(100000, checkoutData.GetProperty("amountPiastres").GetInt32());

        var confirmRes = await client.PostAsJsonAsync($"/api/v1/consumer/invoices/{invoiceId}/checkout/confirm", new
        {
            checkoutSessionId = sessionId,
            method = "CARD",
            gatewayReference = "GW-SANDBOX-001"
        });
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);
        using var confirmDoc = await JsonDocument.ParseAsync(await confirmRes.Content.ReadAsStreamAsync());
        var confirmData = confirmDoc.RootElement.GetProperty("data");
        Assert.False(confirmData.GetProperty("isDuplicate").GetBoolean());
        Assert.Equal("PAID", confirmData.GetProperty("invoice").GetProperty("status").GetString());
        Assert.Equal(0, confirmData.GetProperty("invoice").GetProperty("remainingPiastres").GetInt64());

        var duplicateRes = await client.PostAsJsonAsync($"/api/v1/consumer/invoices/{invoiceId}/checkout/confirm", new
        {
            checkoutSessionId = sessionId,
            method = "CARD"
        });
        Assert.Equal(HttpStatusCode.OK, duplicateRes.StatusCode);
        using var dupDoc = await JsonDocument.ParseAsync(await duplicateRes.Content.ReadAsStreamAsync());
        Assert.True(dupDoc.RootElement.GetProperty("data").GetProperty("isDuplicate").GetBoolean());
    }

    [Fact]
    public async Task Student_Certificates_And_Public_Verification_Return_Valid_Certificate()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var secretary = await TestData.CreateAccountAsync(factory, "R05_SECRETARY");
        var studentAccount = await TestData.CreateConsumerAccountAsync(factory, secretary.TenantId, "student", "R09_STUDENT", "+201055667788");

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var student = new Student
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                FullName = "نور الهدى محمد",
                Status = "ACTIVE"
            };
            db.Students.Add(student);
            db.StudentAccountLinks.Add(new StudentAccountLink
            {
                TenantId = secretary.TenantId,
                StudentId = student.Id,
                UserAccountId = studentAccount.UserId,
                CreatedByUserId = secretary.UserId
            });
            db.Memberships.Add(new Membership
            {
                UserAccountId = studentAccount.UserId,
                TenantId = secretary.TenantId,
                RoleCode = "R09_STUDENT",
                ScopeLevel = "TENANT",
                Status = "ACTIVE"
            });
            var template = new CourseTemplate
            {
                TenantId = secretary.TenantId,
                Name = "تطوير تطبيقات الويب الحديثة",
                BasePricePiastres = 150000
            };
            db.CourseTemplates.Add(template);
            var offering = new CourseOffering
            {
                TenantId = secretary.TenantId,
                BranchId = secretary.BranchId,
                CourseTemplateId = template.Id,
                Status = "ACTIVE"
            };
            db.CourseOfferings.Add(offering);
            db.StudentEnrollments.Add(new StudentEnrollment
            {
                StudentId = student.Id,
                CourseOfferingId = offering.Id,
                FinalPricePiastres = 150000,
                Status = "COMPLETED"
            });
            await db.SaveChangesAsync();
        }

        using var authClient = factory.CreateClient();
        TestData.Authenticate(authClient, await TestData.LoginAsync(authClient, studentAccount));

        var certRes = await authClient.GetAsync("/api/v1/consumer/me/certificates");
        Assert.Equal(HttpStatusCode.OK, certRes.StatusCode);
        using var certDoc = await JsonDocument.ParseAsync(await certRes.Content.ReadAsStreamAsync());
        var certItem = Assert.Single(certDoc.RootElement.GetProperty("data").GetProperty("items").EnumerateArray());
        var code = certItem.GetProperty("certificateCode").GetString()!;
        Assert.StartsWith("MADA-", code);
        Assert.True(certItem.GetProperty("eligible").GetBoolean());
        Assert.Equal("ISSUED", certItem.GetProperty("status").GetString());

        using var anonClient = factory.CreateClient();
        var verifyRes = await anonClient.GetAsync($"/api/v1/certificates/verify/{code}");
        Assert.Equal(HttpStatusCode.OK, verifyRes.StatusCode);
        using var verifyDoc = await JsonDocument.ParseAsync(await verifyRes.Content.ReadAsStreamAsync());
        var verifyData = verifyDoc.RootElement.GetProperty("data");
        Assert.True(verifyData.GetProperty("valid").GetBoolean());
        Assert.Equal("نور الهدى محمد", verifyData.GetProperty("studentName").GetString());
        Assert.Equal("تطوير تطبيقات الويب الحديثة", verifyData.GetProperty("courseName").GetString());

        var notFoundRes = await anonClient.GetAsync("/api/v1/certificates/verify/MADA-00000000-0000");
        Assert.Equal(HttpStatusCode.NotFound, notFoundRes.StatusCode);
    }

    [Fact]
    public async Task Full_Academic_And_Finance_Operation_Lifecycle_Propagates_Across_Roles()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var head = await TestData.CreateAccountAsync(factory, "R03_HEAD_INSTRUCTORS", tenantId: manager.TenantId, branchId: manager.BranchId);
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", tenantId: manager.TenantId, branchId: manager.BranchId);
        var accountant = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT", tenantId: manager.TenantId, branchId: manager.BranchId);
        var parent = await TestData.CreateConsumerAccountAsync(factory, manager.TenantId, "parent", "R08_PARENT", "+201022334455");
        var studentAcc = await TestData.CreateConsumerAccountAsync(factory, manager.TenantId, "student", "R09_STUDENT", "+201033445566");

        Guid studentId;
        Guid offeringId;
        Guid sessionId;
        Guid invoiceId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            var student = new Student { TenantId = manager.TenantId, BranchId = manager.BranchId, FullName = "طارق محمود", Status = "ACTIVE" };
            db.Students.Add(student);
            db.GuardianStudentLinks.Add(new GuardianStudentLink { TenantId = manager.TenantId, StudentId = student.Id, UserAccountId = parent.UserId, CreatedByUserId = manager.UserId, Relationship = "الأب", Status = "ACTIVE" });
            db.StudentAccountLinks.Add(new StudentAccountLink { TenantId = manager.TenantId, StudentId = student.Id, UserAccountId = studentAcc.UserId, CreatedByUserId = manager.UserId });
            db.Memberships.Add(new Membership { UserAccountId = parent.UserId, TenantId = manager.TenantId, RoleCode = "R08_PARENT", ScopeLevel = "TENANT", Status = "ACTIVE" });
            db.Memberships.Add(new Membership { UserAccountId = studentAcc.UserId, TenantId = manager.TenantId, RoleCode = "R09_STUDENT", ScopeLevel = "TENANT", Status = "ACTIVE" });

            var classroom = new Classroom { BranchId = manager.BranchId, Name = "قاعة 1", Capacity = 15 };
            db.Classrooms.Add(classroom);
            var template = new CourseTemplate { TenantId = manager.TenantId, Name = "برمجة بايثون المتقدمة", BasePricePiastres = 200000 };
            db.CourseTemplates.Add(template);
            var offering = new CourseOffering { TenantId = manager.TenantId, BranchId = manager.BranchId, CourseTemplateId = template.Id, InstructorId = instructor.UserId, ClassroomId = classroom.Id, Status = "ACTIVE" };
            db.CourseOfferings.Add(offering);
            db.GroupSupervisionAssignments.Add(new GroupSupervisionAssignment { TenantId = manager.TenantId, BranchId = manager.BranchId, CourseOfferingId = offering.Id, SupervisorUserId = head.UserId, CanDecideEvaluations = true, Status = "ACTIVE" });
            db.StudentEnrollments.Add(new StudentEnrollment { StudentId = student.Id, CourseOfferingId = offering.Id, FinalPricePiastres = 200000, Status = "ACTIVE" });
            var session = new AcademySession { TenantId = manager.TenantId, BranchId = manager.BranchId, CourseOfferingId = offering.Id, InstructorId = instructor.UserId, ClassroomId = classroom.Id, SessionNumber = 1, StartAt = DateTimeOffset.UtcNow.AddHours(-2), EndAt = DateTimeOffset.UtcNow.AddHours(-1), Status = "SCHEDULED" };
            db.AcademySessions.Add(session);
            var invoice = new Invoice { TenantId = manager.TenantId, BranchId = manager.BranchId, StudentId = student.Id, InvoiceNumber = "MAD-E2E-2026-01", TotalPiastres = 200000, IssueDate = DateOnly.FromDateTime(DateTime.UtcNow), DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)), CreatedByUserId = accountant.UserId, Lines = [new InvoiceLine { LineNumber = 1, Description = "رسوم بايثون", AmountPiastres = 200000 }] };
            db.Invoices.Add(invoice);
            await db.SaveChangesAsync();

            studentId = student.Id;
            offeringId = offering.Id;
            sessionId = session.Id;
            invoiceId = invoice.Id;
        }

        // 1. Instructor marks attendance & submits evaluation
        using var instClient = factory.CreateClient();
        TestData.Authenticate(instClient, await TestData.LoginAsync(instClient, instructor));
        var attRes = await instClient.PutAsJsonAsync($"/api/v1/sessions/{sessionId}/attendance", new
        {
            records = new[] { new { studentId, status = "PRESENT" } }
        });
        Assert.Equal(HttpStatusCode.OK, attRes.StatusCode);

        var evalSaveRes = await instClient.PutAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations", new
        {
            items = new[] { new { studentId, score = 95, bonusPoints = 10, gamificationBadge = "STAR", notes = "أداء ممتاز" } }
        });
        Assert.Equal(HttpStatusCode.OK, evalSaveRes.StatusCode);

        var evalSubmitRes = await instClient.PostAsJsonAsync($"/api/v1/scheduling/sessions/{sessionId}/evaluations/submit", new { studentIds = new[] { studentId } });
        Assert.Equal(HttpStatusCode.OK, evalSubmitRes.StatusCode);

        Guid evaluationId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            evaluationId = db.SessionEvaluations.Where(x => x.SessionId == sessionId && x.StudentId == studentId).Select(x => x.Id).ToList().Single();
        }

        // 2. Head of Instructors publishes the evaluation
        using var headClient = factory.CreateClient();
        TestData.Authenticate(headClient, await TestData.LoginAsync(headClient, head));
        var pubRes = await headClient.PostAsJsonAsync($"/api/v1/scheduling/evaluation-reviews/{evaluationId}/decision", new { decision = "PUBLISH" });
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 3. Parent & Student see published evaluation, leaderboard XP, and eligible certificate
        using var parentClient = factory.CreateClient();
        TestData.Authenticate(parentClient, await TestData.LoginAsync(parentClient, parent));
        var parentSessions = await parentClient.GetFromJsonAsync<JsonDocument>("/api/v1/consumer/me/sessions");
        var firstSession = Assert.Single(parentSessions!.RootElement.GetProperty("data").GetProperty("items").EnumerateArray());
        Assert.Equal("PRESENT", firstSession.GetProperty("attendanceStatus").GetString());
        Assert.Equal(95, firstSession.GetProperty("score").GetInt32());
        Assert.Equal(10, firstSession.GetProperty("bonusPoints").GetInt32());
        Assert.Equal("STAR", firstSession.GetProperty("badge").GetString());

        using var studentClient = factory.CreateClient();
        TestData.Authenticate(studentClient, await TestData.LoginAsync(studentClient, studentAcc));
        var certDoc = await studentClient.GetFromJsonAsync<JsonDocument>("/api/v1/consumer/me/certificates");
        var certItem = Assert.Single(certDoc!.RootElement.GetProperty("data").GetProperty("items").EnumerateArray());
        Assert.True(certItem.GetProperty("eligible").GetBoolean());
        var certCode = certItem.GetProperty("certificateCode").GetString()!;

        using var anonClient = factory.CreateClient();
        var verifyDoc = await anonClient.GetFromJsonAsync<JsonDocument>($"/api/v1/certificates/verify/{certCode}");
        Assert.True(verifyDoc!.RootElement.GetProperty("data").GetProperty("valid").GetBoolean());

        // 4. Parent pays invoice online -> Accountant financial report reflects collected amount
        var confirmRes = await parentClient.PostAsJsonAsync($"/api/v1/consumer/invoices/{invoiceId}/checkout/confirm", new { method = "CARD", checkoutSessionId = "chk_e2e_lifecycle" });
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);

        using var accClient = factory.CreateClient();
        TestData.Authenticate(accClient, await TestData.LoginAsync(accClient, accountant));
        var reportDoc = await accClient.GetFromJsonAsync<JsonDocument>("/api/v1/finance/reports/summary");
        Assert.Equal(200000, reportDoc!.RootElement.GetProperty("data").GetProperty("totalCollectedPiastres").GetInt64());
    }
}

