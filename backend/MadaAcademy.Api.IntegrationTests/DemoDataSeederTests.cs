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
        await AssertCoreSliceAsync(db, tenantId);
        await AssertFinanceSliceAsync(db, tenantId);

        // Simulate a database seeded by earlier demo versions: the tenant and core graph remain,
        // but the P1 instructor/consumer links and published evaluation are absent.
        var coreAccountIds = new[]
        {
            Guid.Parse("10000000-0000-0000-0000-000000000010"),
            Guid.Parse("10000000-0000-0000-0000-000000000011"),
            Guid.Parse("10000000-0000-0000-0000-000000000012"),
        };
        db.StudentAccountLinks.RemoveRange(await db.StudentAccountLinks.ToListAsync());
        db.GuardianStudentLinks.RemoveRange(await db.GuardianStudentLinks.ToListAsync());
        db.SessionEvaluations.RemoveRange(await db.SessionEvaluations.ToListAsync());
        db.StateTransitions.RemoveRange(await db.StateTransitions.Where(item => item.AggregateType == "SESSION_EVALUATION").ToListAsync());
        db.Memberships.RemoveRange(await db.Memberships.Where(item => coreAccountIds.Contains(item.UserAccountId)).ToListAsync());
        db.UserAccounts.RemoveRange(await db.UserAccounts.Where(item => coreAccountIds.Contains(item.Id)).ToListAsync());
        var offering = await db.CourseOfferings.SingleAsync(item => item.Id == Guid.Parse("40000000-0000-0000-0000-000000000001"));
        offering.InstructorId = Guid.Parse("10000000-0000-0000-0000-000000000004");
        foreach (var session in await db.AcademySessions.Where(item => item.CourseOfferingId == offering.Id).ToListAsync())
            session.InstructorId = offering.InstructorId;
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
        await AssertCoreSliceAsync(db, tenantId);
        await AssertFinanceSliceAsync(db, tenantId);

        await DemoDataSeeder.SeedAsync(db);
        await AssertCoreSliceAsync(db, tenantId);
        await AssertFinanceSliceAsync(db, tenantId);
    }

    private static async Task AssertCoreSliceAsync(MadaDbContext db, Guid tenantId)
    {
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var instructorId = Guid.Parse("10000000-0000-0000-0000-000000000010");
        var parentId = Guid.Parse("10000000-0000-0000-0000-000000000011");
        var studentAccountId = Guid.Parse("10000000-0000-0000-0000-000000000012");
        var offeringId = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var sessionId = Guid.Parse("50000000-0000-0000-0000-000000000003");
        var firstStudentId = Guid.Parse("70000000-0000-0000-0000-000000000001");
        var secondStudentId = Guid.Parse("70000000-0000-0000-0000-000000000002");

        Assert.Equal(6, await db.Students.CountAsync(item => item.TenantId == tenantId && item.BranchId == mainBranchId));
        Assert.Equal(4, await db.StudentEnrollments.CountAsync(item => item.CourseOfferingId == offeringId && item.Status == "ACTIVE"));
        Assert.Equal(4, await db.SessionAttendances.CountAsync(item => item.SessionId == sessionId));
        Assert.Equal(instructorId, await db.CourseOfferings.Where(item => item.Id == offeringId).Select(item => item.InstructorId).SingleAsync());
        Assert.All(await db.AcademySessions.Where(item => item.CourseOfferingId == offeringId).ToListAsync(), item => Assert.Equal(instructorId, item.InstructorId));
        Assert.True(await db.Memberships.AnyAsync(item => item.UserAccountId == instructorId && item.TenantId == tenantId && item.BranchId == mainBranchId && item.RoleCode == "R04_INSTRUCTOR" && item.Status == "ACTIVE"));
        Assert.True(await db.Memberships.AnyAsync(item => item.UserAccountId == parentId && item.TenantId == tenantId && item.RoleCode == "R08_PARENT" && item.ScopeLevel == "TENANT" && item.Status == "ACTIVE"));
        Assert.True(await db.Memberships.AnyAsync(item => item.UserAccountId == studentAccountId && item.TenantId == tenantId && item.RoleCode == "R09_STUDENT" && item.ScopeLevel == "TENANT" && item.Status == "ACTIVE"));
        Assert.True(await db.GuardianStudentLinks.AnyAsync(item => item.UserAccountId == parentId && item.StudentId == firstStudentId && item.Status == "ACTIVE"));
        Assert.True(await db.StudentAccountLinks.AnyAsync(item => item.UserAccountId == studentAccountId && item.StudentId == secondStudentId));
        var published = await db.SessionEvaluations.SingleAsync(item => item.SessionId == sessionId && item.StudentId == firstStudentId);
        Assert.Equal("PUBLISHED", published.Status);
        Assert.Equal(88, published.Score);
        Assert.True(await db.StateTransitions.AnyAsync(item => item.AggregateType == "SESSION_EVALUATION" && item.AggregateId == published.Id.ToString() && item.ToState == "PUBLISHED"));
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
