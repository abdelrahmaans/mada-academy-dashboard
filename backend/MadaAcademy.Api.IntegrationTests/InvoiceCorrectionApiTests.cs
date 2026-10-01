using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class InvoiceCorrectionApiTests
{
    [Fact]
    public async Task Correction_IsMakerCheckerAndAppliesOnlyAfterManagerApproval()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var requesterClient = factory.CreateClient();
        var requester = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER", requester.TenantId, requester.BranchId);
        var invoiceId = await SeedInvoiceAsync(factory, requester.TenantId, requester.BranchId, 10_000);
        TestData.Authenticate(requesterClient, await TestData.LoginAsync(requesterClient, requester));
        Assert.Equal(HttpStatusCode.Created, (await requesterClient.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/payments", new { amountPiastres = 5_000, method = "CASH" })).StatusCode);
        var create = await requesterClient.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/correction-requests", new
        {
            proposedDueDate = "2026-10-20",
            lines = new[] { new { description = "Corrected tuition", amountPiastres = 12_000 } },
            reason = "تم تصحيح قيمة الاشتراك بناءً على المستند المعتمد"
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var json = await create.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Correction response missing.");
        var correctionId = json.RootElement.GetProperty("data").GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.Conflict, (await requesterClient.PostAsJsonAsync($"/api/v1/finance/invoice-corrections/{correctionId}/decision", new { decision = "APPROVED" })).StatusCode);
        var before = await requesterClient.GetStringAsync($"/api/v1/finance/invoices/{invoiceId}");
        Assert.Contains("\"totalPiastres\":10000", before, StringComparison.Ordinal);
        using var managerClient = factory.CreateClient();
        TestData.Authenticate(managerClient, await TestData.LoginAsync(managerClient, manager));
        Assert.Equal(HttpStatusCode.BadRequest, (await managerClient.PostAsJsonAsync($"/api/v1/finance/invoice-corrections/{correctionId}/decision", new { decision = "APPROVED", reason = " " })).StatusCode);
        const string decisionReason = "Reviewed supporting documents and confirmed the correction.";
        var decision = await managerClient.PostAsJsonAsync($"/api/v1/finance/invoice-corrections/{correctionId}/decision", new { decision = "APPROVED", reason = decisionReason });
        Assert.Equal(HttpStatusCode.OK, decision.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await managerClient.GetAsync($"/api/v1/finance/invoices/{invoiceId}")).StatusCode);
        var after = await requesterClient.GetStringAsync($"/api/v1/finance/invoices/{invoiceId}");
        Assert.Contains("\"totalPiastres\":12000", after, StringComparison.Ordinal);
        Assert.Contains("Corrected tuition", after, StringComparison.Ordinal);
        Assert.Contains("\"paidPiastres\":5000", after, StringComparison.Ordinal);
        using var auditScope = factory.Services.CreateScope();
        var auditDb = auditScope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var audit = await auditDb.AuditEvents.SingleAsync(x => x.TargetType == "INVOICE" && x.Action == "INVOICE_CORRECTION_APPROVED" && x.TargetId == invoiceId.ToString());
        Assert.Equal(manager.UserId, audit.ActorUserId);
        Assert.Equal(manager.BranchId, audit.BranchId);
        Assert.Equal(decisionReason, audit.Reason);
    }

    [Fact]
    public async Task Correction_RejectsBelowPaidAndKeepsInvoiceImmutable()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var requester = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var invoiceId = await SeedInvoiceAsync(factory, requester.TenantId, requester.BranchId, 10_000);
        TestData.Authenticate(client, await TestData.LoginAsync(client, requester));
        await client.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/payments", new { amountPiastres = 8_000, method = "VISA" });
        var response = await client.PostAsJsonAsync($"/api/v1/finance/invoices/{invoiceId}/correction-requests", new { proposedDueDate = "2026-10-20", lines = new[] { new { description = "Too low", amountPiastres = 7_000 } }, reason = "غير صالح" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Contains("CORRECTION_BELOW_PAID_AMOUNT", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Correction_List_IsTenantAndBranchScoped()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var requester = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var otherBranch = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranch, TenantId = requester.TenantId, Name = "Other", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        var visible = await SeedCorrectionAsync(factory, requester.TenantId, requester.BranchId, "Visible correction");
        await SeedCorrectionAsync(factory, requester.TenantId, otherBranch, "Hidden correction");
        TestData.Authenticate(client, await TestData.LoginAsync(client, requester));
        var response = await client.GetStringAsync("/api/v1/finance/invoice-corrections");
        Assert.Contains(visible.ToString(), response, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Hidden correction", response, StringComparison.Ordinal);
    }

    private static async Task<Guid> SeedInvoiceAsync(TestApiFactory factory, Guid tenantId, Guid branchId, int total)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var student = new Student { TenantId = tenantId, BranchId = branchId, FullName = $"Correction Student {Guid.NewGuid():N}" };
        var invoice = new Invoice { TenantId = tenantId, BranchId = branchId, Student = student, InvoiceNumber = $"CORR-{Guid.NewGuid():N}", TotalPiastres = total, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), CreatedByUserId = Guid.NewGuid(), Lines = [new InvoiceLine { LineNumber = 1, Description = "Original tuition", AmountPiastres = total }] };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        return invoice.Id;
    }

    private static async Task<Guid> SeedCorrectionAsync(TestApiFactory factory, Guid tenantId, Guid branchId, string reason)
    {
        var invoiceId = await SeedInvoiceAsync(factory, tenantId, branchId, 10_000);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        var approval = new ApprovalRequest { TenantId = tenantId, BranchId = branchId, RequestType = "INVOICE_CORRECTION", TargetType = "INVOICE_CORRECTION", TargetId = Guid.NewGuid().ToString(), SubmittedByRole = "R06_ACCOUNTANT", State = "PENDING", Reason = reason };
        var correction = new InvoiceCorrectionRequest { TenantId = tenantId, BranchId = branchId, InvoiceId = invoiceId, ApprovalRequestId = approval.Id, RequestedByUserId = Guid.NewGuid(), CurrentTotalPiastres = 10_000, CurrentDueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), ProposedTotalPiastres = 11_000, ProposedDueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)), ProposedLinesJson = "[{\"Description\":\"Corrected\",\"AmountPiastres\":11000}]", Reason = reason, ApprovalRequest = approval };
        approval.TargetId = correction.Id.ToString();
        db.InvoiceCorrectionRequests.Add(correction);
        await db.SaveChangesAsync();
        return correction.Id;
    }
}
