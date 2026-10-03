using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class ExpenseApiTests
{
    [Fact]
    public async Task ExpenseLifecycle_UsesMakerCheckerAndRecordsAudit()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var creatorClient = factory.CreateClient();
        var creator = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var approver = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER", creator.TenantId, creator.BranchId);
        TestData.Authenticate(creatorClient, await TestData.LoginAsync(creatorClient, creator));
        var created = await creatorClient.PostAsJsonAsync("/api/v1/finance/expenses", new { description = "Robot parts", category = "SUPPLIES", amountPiastres = 125_000 });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var json = await created.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Expense response missing.");
        var expenseId = json.RootElement.GetProperty("data").GetProperty("id").GetGuid();
        Assert.Equal("PENDING", json.RootElement.GetProperty("data").GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await creatorClient.PostAsJsonAsync($"/api/v1/finance/expenses/{expenseId}/approve", new { reason = "Attempted self-approval" })).StatusCode);
        using var approverClient = factory.CreateClient();
        TestData.Authenticate(approverClient, await TestData.LoginAsync(approverClient, approver));
        Assert.Equal(HttpStatusCode.BadRequest, (await approverClient.PostAsJsonAsync($"/api/v1/finance/expenses/{expenseId}/approve", new { reason = " " })).StatusCode);
        const string decisionReason = "Receipt checked against the branch budget.";
        var approved = await approverClient.PostAsJsonAsync($"/api/v1/finance/expenses/{expenseId}/approve", new { reason = decisionReason });
        Assert.Equal(HttpStatusCode.OK, approved.StatusCode);
        Assert.Contains("\"status\":\"APPROVED\"", await approved.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        Assert.Equal(1, await db.StateTransitions.CountAsync(x => x.AggregateType == "EXPENSE" && x.AggregateId == expenseId.ToString() && x.ToState == "APPROVED"));
        var audit = await db.AuditEvents.SingleAsync(x => x.TargetType == "EXPENSE" && x.Action == "EXPENSE_APPROVED");
        Assert.Equal(approver.UserId, audit.ActorUserId);
        Assert.Equal(approver.BranchId, audit.BranchId);
        Assert.Equal(decisionReason, audit.Reason);
    }

    [Fact]
    public async Task Expenses_AreTenantAndBranchScoped()
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
        var visible = await SeedExpenseAsync(factory, account.TenantId, account.BranchId, "Visible expense");
        await SeedExpenseAsync(factory, account.TenantId, otherBranch, "Other branch expense");
        await SeedExpenseAsync(factory, otherTenant, Guid.NewGuid(), "Foreign tenant expense", createBranch: true);
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        var response = await client.GetAsync("/api/v1/finance/expenses");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(visible.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Other branch expense", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Foreign tenant expense", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task BranchManager_CannotSeeOrApproveExpenseFromAnotherBranch()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        var manager = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER");
        var otherBranch = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
            db.Branches.Add(new Branch { Id = otherBranch, TenantId = manager.TenantId, Name = "Other Branch", Code = "OTHER" });
            await db.SaveChangesAsync();
        }
        var visibleExpenseId = await SeedExpenseAsync(factory, manager.TenantId, manager.BranchId, "Visible branch expense");
        var hiddenExpenseId = await SeedExpenseAsync(factory, manager.TenantId, otherBranch, "Hidden branch expense");
        using var client = factory.CreateClient();
        TestData.Authenticate(client, await TestData.LoginAsync(client, manager));

        using var response = await client.GetAsync("/api/v1/finance/expenses?status=ALL");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(visibleExpenseId.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(hiddenExpenseId.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Hidden branch expense", body, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync($"/api/v1/finance/expenses/{hiddenExpenseId}/approve", new { reason = "Not in this branch." })).StatusCode);
    }

    [Fact]
    public async Task RejectExpense_RequiresReasonAndDoesNotEnterApprovedState()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var creatorClient = factory.CreateClient();
        var creator = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var approver = await TestData.CreateAccountAsync(factory, "R02_BRANCH_MANAGER", creator.TenantId, creator.BranchId);
        TestData.Authenticate(creatorClient, await TestData.LoginAsync(creatorClient, creator));
        var response = await creatorClient.PostAsJsonAsync("/api/v1/finance/expenses", new { description = "Unclear subscription", category = "OTHER", amountPiastres = 90_000 });
        var json = await response.Content.ReadFromJsonAsync<JsonDocument>() ?? throw new InvalidOperationException("Expense response missing.");
        var expenseId = json.RootElement.GetProperty("data").GetProperty("id").GetGuid();
        using var approverClient = factory.CreateClient();
        TestData.Authenticate(approverClient, await TestData.LoginAsync(approverClient, approver));
        Assert.Equal(HttpStatusCode.BadRequest, (await approverClient.PostAsJsonAsync($"/api/v1/finance/expenses/{expenseId}/reject", new { reason = "" })).StatusCode);
        var rejected = await approverClient.PostAsJsonAsync($"/api/v1/finance/expenses/{expenseId}/reject", new { reason = "Receipt does not match the policy." });
        Assert.Equal(HttpStatusCode.OK, rejected.StatusCode);
        Assert.Contains("\"status\":\"REJECTED\"", await rejected.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        var expenses = await approverClient.GetStringAsync("/api/v1/finance/expenses?status=ALL");
        Assert.Contains("Receipt does not match the policy.", expenses, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ExpenseEvidence_IsValidatedAndScoped()
    {
        using var factory = new TestApiFactory(useInMemory: true);
        using var client = factory.CreateClient();
        var account = await TestData.CreateAccountAsync(factory, "R06_ACCOUNTANT");
        var expenseId = await SeedExpenseAsync(factory, account.TenantId, account.BranchId, "Evidence expense");
        TestData.Authenticate(client, await TestData.LoginAsync(client, account));
        using (var invalid = new MultipartFormDataContent())
        {
            var content = new ByteArrayContent("bad"u8.ToArray());
            content.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
            invalid.Add(content, "file", "receipt.txt");
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync($"/api/v1/finance/expenses/{expenseId}/evidence", invalid)).StatusCode);
        }
        using (var upload = new MultipartFormDataContent())
        {
            var content = new ByteArrayContent("fake-png"u8.ToArray());
            content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            upload.Add(content, "file", "receipt.png");
            Assert.Equal(HttpStatusCode.OK, (await client.PostAsync($"/api/v1/finance/expenses/{expenseId}/evidence", upload)).StatusCode);
        }
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsync($"/api/v1/finance/expenses/{expenseId}/evidence", new MultipartFormDataContent())).StatusCode);
        var download = await client.GetAsync($"/api/v1/finance/expenses/{expenseId}/evidence");
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal("image/png", download.Content.Headers.ContentType?.MediaType);
    }

    private static async Task<Guid> SeedExpenseAsync(TestApiFactory factory, Guid tenantId, Guid branchId, string description, bool createBranch = false)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MadaDbContext>();
        if (createBranch && !await db.Branches.AnyAsync(x => x.Id == branchId))
        {
            if (!await db.Tenants.AnyAsync(x => x.Id == tenantId)) db.Tenants.Add(new Tenant { Id = tenantId, Name = "Seed Academy", Slug = $"seed-{tenantId:N}" });
            db.Branches.Add(new Branch { Id = branchId, TenantId = tenantId, Name = "Seed Branch", Code = $"S{Guid.NewGuid():N}"[..10] });
            await db.SaveChangesAsync();
        }
        var approval = new ApprovalRequest { TenantId = tenantId, BranchId = branchId, RequestType = "EXPENSE_APPROVAL", TargetType = "EXPENSE", TargetId = Guid.NewGuid().ToString(), SubmittedByRole = "R06_ACCOUNTANT" };
        var expense = new Expense { TenantId = tenantId, BranchId = branchId, Description = description, Category = "OPERATIONS", AmountPiastres = 50_000, CreatedByUserId = Guid.NewGuid(), ApprovalRequest = approval };
        approval.TargetId = expense.Id.ToString();
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        return expense.Id;
    }
}
