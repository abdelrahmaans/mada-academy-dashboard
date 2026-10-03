using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Seeding;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.IntegrationTests;

public sealed class DemoDataSeederTests
{
    [Fact]
    public async Task DemoSeeder_CreatesAndUpgradesBranchScopedFinanceDataIdempotently()
    {
        var options = new DbContextOptionsBuilder<MadaDbContext>()
            .UseInMemoryDatabase($"demo-seed-{Guid.NewGuid():N}")
            .Options;
        await using var db = new MadaDbContext(options);
        var tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var heliopolisFinanceUserIds = new[]
        {
            Guid.Parse("10000000-0000-0000-0000-000000000008"),
            Guid.Parse("10000000-0000-0000-0000-000000000009"),
        };

        await DemoDataSeeder.SeedAsync(db);
        await AssertFinanceSliceAsync(db, tenantId);

        // Simulate a database seeded by the earlier demo version: core academy data remains,
        // but the second-branch finance accounts and all finance ledger records are absent.
        db.InvoiceLines.RemoveRange(await db.InvoiceLines.ToListAsync());
        db.PaymentTransactions.RemoveRange(await db.PaymentTransactions.ToListAsync());
        db.Invoices.RemoveRange(await db.Invoices.ToListAsync());
        db.Expenses.RemoveRange(await db.Expenses.ToListAsync());
        db.ApprovalRequests.RemoveRange(await db.ApprovalRequests.Where(item => item.RequestType == "EXPENSE_APPROVAL").ToListAsync());
        db.StateTransitions.RemoveRange(await db.StateTransitions.Where(item => item.AggregateType == "EXPENSE").ToListAsync());
        db.AuditEvents.RemoveRange(await db.AuditEvents.Where(item => item.Action == "EXPENSE_APPROVED").ToListAsync());
        db.Memberships.RemoveRange(await db.Memberships.Where(item => heliopolisFinanceUserIds.Contains(item.UserAccountId)).ToListAsync());
        db.UserAccounts.RemoveRange(await db.UserAccounts.Where(item => heliopolisFinanceUserIds.Contains(item.Id)).ToListAsync());
        await db.SaveChangesAsync();

        await DemoDataSeeder.SeedAsync(db);
        await AssertFinanceSliceAsync(db, tenantId);

        await DemoDataSeeder.SeedAsync(db);
        await AssertFinanceSliceAsync(db, tenantId);
    }

    private static async Task AssertFinanceSliceAsync(MadaDbContext db, Guid tenantId)
    {
        var branches = await db.Branches.Where(branch => branch.TenantId == tenantId).ToListAsync();
        Assert.Equal(2, branches.Count);

        var financeMemberships = await db.Memberships
            .Where(membership => membership.RoleCode == "R05_SECRETARY" || membership.RoleCode == "R06_ACCOUNTANT")
            .ToListAsync();
        Assert.Equal(4, financeMemberships.Count);
        foreach (var branch in branches)
        {
            Assert.Single(financeMemberships, item => item.BranchId == branch.Id && item.RoleCode == "R05_SECRETARY");
            Assert.Single(financeMemberships, item => item.BranchId == branch.Id && item.RoleCode == "R06_ACCOUNTANT");
        }

        var invoices = await db.Invoices
            .Include(invoice => invoice.Lines)
            .Include(invoice => invoice.Payments)
            .ToListAsync();
        Assert.Equal(2, invoices.Count);
        Assert.All(invoices, invoice =>
        {
            Assert.Single(invoice.Lines);
            Assert.Single(invoice.Payments);
        });
        Assert.Equal(2, await db.PaymentTransactions.CountAsync());
        Assert.Empty(await db.PaymentEvidences.ToListAsync());

        var expenses = await db.Expenses.Include(expense => expense.ApprovalRequest).ToListAsync();
        Assert.Equal(2, expenses.Count);
        Assert.Contains(expenses, expense => expense.Status == "PENDING" && expense.ApprovalRequest?.State == "PENDING");
        Assert.Contains(expenses, expense => expense.Status == "APPROVED" && expense.ApprovalRequest?.State == "APPROVED");
        Assert.Single(await db.StateTransitions.Where(item => item.AggregateType == "EXPENSE" && item.ToState == "APPROVED").ToListAsync());
        Assert.Single(await db.AuditEvents.Where(item => item.Action == "EXPENSE_APPROVED").ToListAsync());
    }
}
