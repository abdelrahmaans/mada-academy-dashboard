using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class FinanceApiTests
{
    [Fact]
    public async Task InvoiceList_IsTenantAndBranchScoped()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var otherBranch = Guid.NewGuid();
        var otherTenant = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranch, TenantId = account.TenantId, Name = "Other Branch", Code = "OTHER" });
            db.Tenants.Add(new Tenant { Id = otherTenant, Name = "Other Academy", Slug = $"other-{otherTenant:N}" });
            db.Branches.Add(new Branch { Id = Guid.NewGuid(), TenantId = otherTenant, Name = "Foreign Branch", Code = "FOREIGN" });
            await db.SaveChangesAsync();
        }
        var visible = await SeedInvoiceAsync(factory, account.TenantId, account.BranchId, "Visible Finance Student", 10_000);
        await SeedInvoiceAsync(factory, account.TenantId, otherBranch, "Other Branch Invoice", 20_000);
        await SeedInvoiceAsync(factory, otherTenant, Guid.NewGuid(), "Other Tenant Invoice", 30_000, createBranch: true);
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));

        var response = await client.GetAsync("/api/v1/finance/invoices");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(visible.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Other Branch Invoice", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Other Tenant Invoice", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task FinancialReads_AreRoleRestrictedAndBranchManagerGetsOnlyAggregateReport()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var platformAdmin = await TestData.CreateAccountAsync(factory, "R00_PLATFORM_ADMIN", manager.TenantId, manager.BranchId);
        var instructor = await TestData.CreateAccountAsync(factory, "R04_INSTRUCTOR", manager.TenantId, manager.BranchId);
        var headInstructor = await TestData.CreateAccountAsync(factory, "R03_HEAD_INSTRUCTORS", manager.TenantId, manager.BranchId);
        var otherBranch = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranch, TenantId = manager.TenantId, Name = "Other Branch", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        var invoiceId = await SeedInvoiceAsync(factory, manager.TenantId, manager.BranchId, "Branch A student", 10_000);
        await SeedInvoiceAsync(factory, manager.TenantId, otherBranch, "Branch B student", 20_000);

        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        var report = await managerClient.GetAsync("/api/v1/finance/reports/summary");
        Assert.Equal(HttpStatusCode.OK, report.StatusCode);
        var reportJson = await report.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Report response missing.");
        var branches = reportJson.RootElement.GetProperty("data").GetProperty("branches");
        Assert.Equal(1, branches.GetArrayLength());
        Assert.Equal(manager.BranchId, branches[0].GetProperty("branchId").GetGuid());
        Assert.Equal(HttpStatusCode.NotFound, (await managerClient.GetAsync($"/api/v1/finance/reports/summary?branchId={otherBranch}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await managerClient.GetAsync("/api/v1/finance/invoices")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await managerClient.PostAsJsonAsync("/api/v1/finance/invoices", new { studentId = Guid.NewGuid(), dueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), lines = new[] { new { description = "Not allowed", amountPiastres = 1000 } } })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await managerClient.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/payments", new { amountPiastres = 1000, method = "CASH" })).StatusCode);

        foreach (var restrictedAccount in new[] { platformAdmin, instructor, headInstructor })
        {
            using var restrictedClient = factory.CreateClient();
            TestData.Authenticate(restrictedClient, await TestData.LoginAsync(restrictedClient, restrictedAccount));
            Assert.Equal(HttpStatusCode.Forbidden, (await restrictedClient.GetAsync("/api/v1/finance/invoices")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await restrictedClient.GetAsync($"/api/v1/finance/invoices/{invoiceId}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await restrictedClient.GetAsync("/api/v1/finance/reports/summary")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await restrictedClient.GetAsync("/api/v1/finance/reports/summary.csv")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await restrictedClient.GetAsync("/api/v1/finance/invoice-corrections")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await restrictedClient.GetAsync("/api/v1/finance/expenses")).StatusCode);
        }

        using var headClient = factory.CreateClient();
        TestData.Authenticate(headClient, await TestData.LoginAsync(headClient, headInstructor));
        Assert.Equal(HttpStatusCode.OK, (await headClient.GetAsync("/api/v1/scheduling/groups")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await headClient.GetAsync($"/api/v1/scheduling/instructors?branchId={manager.BranchId}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await headClient.GetAsync("/api/v1/scheduling/course-templates")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await headClient.PostAsJsonAsync("/api/v1/scheduling/groups", new
        {
            branchId = manager.BranchId,
            courseTemplateId = Guid.NewGuid(),
            instructorId = headInstructor.UserId,
            classroomId = Guid.NewGuid(),
            startDate = DateOnly.FromDateTime(DateTime.UtcNow),
            endDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            daysOfWeek = new[] { 1 },
            startTime = new TimeOnly(10, 0),
            durationMinutes = 60,
            maxStudents = 10,
            finalPricePiastres = 500_000
        })).StatusCode);
    }

    [Fact]
    public async Task InvoiceAndPaymentEndpoints_DenyCrossBranchAndCrossTenantAccess()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var otherBranch = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranch, TenantId = account.TenantId, Name = "Other Branch", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        var foreignInvoice = await SeedInvoiceAsync(factory, account.TenantId, otherBranch, "Foreign Branch Invoice", 10_000);
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));

        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/v1/finance/invoices/{foreignInvoice}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync($"/api/v1/finance/invoices/{foreignInvoice}/payments", new { amountPiastres = 1000, method = "CASH" })).StatusCode);
    }

    [Fact]
    public async Task PaymentLifecycle_IsAppendOnlyAndRejectsOverCollection()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var invoiceId = await SeedInvoiceAsync(factory, account.TenantId, account.BranchId, "Payment Lifecycle Student", 10_000);
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));

        var first = await client.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/payments", new { amountPiastres = 4_000, method = "CASH" });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var second = await client.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/payments", new { amountPiastres = 7_000, method = "INSTAPAY" });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        var final = await client.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/payments", new { amountPiastres = 6_000, method = "VISA" });
        Assert.Equal(HttpStatusCode.Created, final.StatusCode);

        var invoice = await client.GetStringAsync($"/api/v1/finance/invoices/{invoiceId}");
        Assert.Contains("\"status\":\"PAID\"", invoice, StringComparison.Ordinal);
        Assert.Contains("\"paidPiastres\":10000", invoice, StringComparison.Ordinal);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal(2, await db.PaymentTransactions.CountAsync(item => item.InvoiceId == invoiceId));
    }

    [Fact]
    public async Task PaymentEvidence_IsValidatedAndOnlyScopedUsersCanDownloadIt()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var invoiceId = await SeedInvoiceAsync(factory, account.TenantId, account.BranchId, "Evidence Student", 5_000);
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var paymentResponse = await client.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/payments", new { amountPiastres = 5_000, method = "VODAFONE_CASH" });
        var paymentJson = await paymentResponse.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Payment response missing.");
        var paymentId = paymentJson.RootElement.GetProperty("data").GetProperty("payment").GetProperty("id").GetGuid();

        using (var invalid = new MultipartFormDataContent())
        {
            var content = new ByteArrayContent("not allowed"u8.ToArray());
            content.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
            invalid.Add(content, "file", "receipt.txt");
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync($"/api/v1/finance/payments/{paymentId}/evidence", invalid)).StatusCode);
        }
        using (var upload = new MultipartFormDataContent())
        {
            var content = new ByteArrayContent("fake-png-content"u8.ToArray());
            content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            upload.Add(content, "file", "receipt.png");
            var response = await client.PostAsync($"/api/v1/finance/payments/{paymentId}/evidence", upload);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsync($"/api/v1/finance/payments/{paymentId}/evidence", new MultipartFormDataContent())).StatusCode);

        using var otherClient = factory.CreateClient();
        var otherAccount = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        TestData.Authenticate(otherClient, await TestData.LoginAsync(otherClient, otherAccount));
        Assert.Equal(HttpStatusCode.NotFound, (await otherClient.GetAsync($"/api/v1/finance/payments/{paymentId}/evidence")).StatusCode);
        var download = await client.GetAsync($"/api/v1/finance/payments/{paymentId}/evidence");
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal("image/png", download.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task ConsumerInvoices_OnlyExposeLinkedStudentsWithinTenant()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var staffClient = factory.CreateClient();
        var staff = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var parent = await TestData.CreateConsumerAccountAsync(factory, staff.TenantId, "parent", "R08_PARENT");
        var linkedStudent = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Linked Invoice Child");
        var unlinkedStudent = await TestData.SeedStudentAsync(factory, staff.TenantId, staff.BranchId, "Unlinked Invoice Child");
        var foreignStudent = await TestData.SeedStudentAsync(factory, Guid.NewGuid(), Guid.NewGuid(), "Foreign Invoice Child");
        await SeedInvoiceAsync(factory, staff.TenantId, staff.BranchId, "Linked Invoice Child", 8_000, linkedStudent);
        await SeedInvoiceAsync(factory, staff.TenantId, staff.BranchId, "Unlinked Invoice Child", 9_000, unlinkedStudent);
        await SeedInvoiceAsync(factory, Guid.NewGuid(), Guid.NewGuid(), "Foreign Invoice Child", 10_000, foreignStudent, createBranch: true);
        TestData.Authenticate(staffClient, await TestData.LoginAsync(staffClient, staff));
        Assert.Equal(HttpStatusCode.OK, (await staffClient.PostAsJsonAsync($"/api/v1/students/{linkedStudent}/guardians", new { userAccountId = parent.UserId, relationship = "Parent" })).StatusCode);
        using var parentClient = factory.CreateClient();
        TestData.Authenticate(parentClient, await TestData.LoginAsync(parentClient, parent));

        var response = await parentClient.GetAsync("/api/v1/consumer/invoices");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Linked Invoice Child", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Unlinked Invoice Child", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Foreign Invoice Child", body, StringComparison.Ordinal);
    }

    private static async Task<Guid> SeedInvoiceAsync(TestApiFactory factory, Guid tenantId, Guid branchId, string studentName, int totalPiastres, Guid? studentId = null, bool createBranch = false)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        if (createBranch && !await db.Branches.AnyAsync(item => item.Id == branchId))
        {
            if (!await db.Tenants.AnyAsync(item => item.Id == tenantId)) db.Tenants.Add(new Tenant { Id = tenantId, Name = "Seed Academy", Slug = $"seed-{tenantId:N}" });
            db.Branches.Add(new Branch { Id = branchId, TenantId = tenantId, Name = "Seed Branch", Code = $"S{Guid.NewGuid():N}"[..10] });
            await db.SaveChangesAsync();
        }
        var student = studentId.HasValue ? await db.Students.SingleAsync(item => item.Id == studentId.Value) : new Student { TenantId = tenantId, BranchId = branchId, FullName = studentName };
        if (!studentId.HasValue) db.Students.Add(student);
        var invoice = new Invoice { TenantId = tenantId, BranchId = branchId, StudentId = student.Id, InvoiceNumber = $"TEST-{Guid.NewGuid():N}", TotalPiastres = totalPiastres, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), CreatedByUserId = Guid.NewGuid(), Lines = [new InvoiceLine { LineNumber = 1, Description = "Monthly tuition", AmountPiastres = totalPiastres }] };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        return invoice.Id;
    }
}
