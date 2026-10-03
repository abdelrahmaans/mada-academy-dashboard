using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Persistence.Seeding;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(MadaDbContext db, CancellationToken cancellationToken = default)
    {
        var existingTenant = await db.Tenants.SingleOrDefaultAsync(x => x.Slug == "mada-demo-academy", cancellationToken);
        if (existingTenant is not null)
        {
            await EnsureFinanceSliceAsync(db, existingTenant.Id, cancellationToken);
            return;
        }

        var tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var heliopolisBranchId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var tenant = new Tenant { Id = tenantId, Name = "Mada Demo Academy", Slug = "mada-demo-academy", PlanCode = "GROWTH" };
        var mainBranch = new Branch { Id = mainBranchId, TenantId = tenantId, Name = "Main Branch", Code = "MAIN" };
        var heliopolisBranch = new Branch { Id = heliopolisBranchId, TenantId = tenantId, Name = "Heliopolis Branch", Code = "HELIO" };

        var demoPasswordHash = new PasswordHashService().Hash("Mada@2026");
        var users = new[]
        {
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Email = "platform.admin@mada.demo", Phone = "+201000000001", DisplayName = "Platform Admin", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Email = "owner@mada.demo", Phone = "+201000000002", DisplayName = "Mada Owner", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Email = "manager@mada.demo", Phone = "+201000000003", DisplayName = "Main Branch Manager", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Email = "head@mada.demo", Phone = "+201000000004", DisplayName = "Head Instructor", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Email = "secretary@mada.demo", Phone = "+201000000005", DisplayName = "Academy Secretary", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Email = "accountant@mada.demo", Phone = "+201000000006", DisplayName = "Academy Accountant", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), Email = "media@mada.demo", Phone = "+201000000007", DisplayName = "Media Manager", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000008"), Email = "secretary.helio@mada.demo", Phone = "+201000000008", DisplayName = "Heliopolis Secretary", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), Email = "accountant.helio@mada.demo", Phone = "+201000000009", DisplayName = "Heliopolis Accountant", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" }
        };

        var memberships = new[]
        {
            new Membership { UserAccountId = users[0].Id, TenantId = tenantId, RoleCode = "R00_PLATFORM_ADMIN", ScopeLevel = "PLATFORM" },
            new Membership { UserAccountId = users[1].Id, TenantId = tenantId, RoleCode = "R01_ACADEMY_OWNER", ScopeLevel = "TENANT" },
            new Membership { UserAccountId = users[2].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R02_BRANCH_MANAGER", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[3].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R03_HEAD_INSTRUCTORS", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[4].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R05_SECRETARY", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[5].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R06_ACCOUNTANT", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[6].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R07_MEDIA_MANAGER", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[7].Id, TenantId = tenantId, BranchId = heliopolisBranchId, RoleCode = "R05_SECRETARY", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[8].Id, TenantId = tenantId, BranchId = heliopolisBranchId, RoleCode = "R06_ACCOUNTANT", ScopeLevel = "BRANCH" }
        };

        var classroomMain = new Classroom { Id = Guid.Parse("20000000-0000-0000-0000-000000000001"), BranchId = mainBranchId, Name = "Robotics Lab A", Capacity = 14 };
        var classroomHelio = new Classroom { Id = Guid.Parse("20000000-0000-0000-0000-000000000002"), BranchId = heliopolisBranchId, Name = "Creative Lab", Capacity = 12 };
        var template = new CourseTemplate { Id = Guid.Parse("30000000-0000-0000-0000-000000000001"), TenantId = tenantId, Name = "Junior Robotics — Level 1", Track = "robotics", Type = "hard", AgeGroup = "8-12", Level = "beginner", TotalSessions = 8, SessionDurationHours = 1.5m, BasePricePiastres = 320000, Status = "PUBLISHED" };
        var offering = new CourseOffering { Id = Guid.Parse("40000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, CourseTemplateId = template.Id, InstructorId = users[3].Id, ClassroomId = classroomMain.Id, StartDate = new DateOnly(2026, 10, 1), EndDate = new DateOnly(2026, 11, 30), WeeklyScheduleJson = "{\"days\":[\"SATURDAY\"],\"start\":\"10:00\",\"end\":\"11:30\"}", Status = "ACTIVE", MaxStudents = 12 };

        var session1 = new AcademySession { Id = Guid.Parse("50000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, CourseOfferingId = offering.Id, SessionNumber = 1, StartAt = new DateTimeOffset(2026, 10, 3, 10, 0, 0, TimeSpan.Zero), EndAt = new DateTimeOffset(2026, 10, 3, 11, 30, 0, TimeSpan.Zero), InstructorId = users[3].Id, ClassroomId = classroomMain.Id, Type = "REGULAR", Status = "SCHEDULED" };
        var session2 = new AcademySession { Id = Guid.Parse("50000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = mainBranchId, CourseOfferingId = offering.Id, SessionNumber = 2, StartAt = new DateTimeOffset(2026, 10, 10, 10, 0, 0, TimeSpan.Zero), EndAt = new DateTimeOffset(2026, 10, 10, 11, 30, 0, TimeSpan.Zero), InstructorId = users[3].Id, ClassroomId = classroomMain.Id, Type = "REGULAR", Status = "SCHEDULED" };
        var session3 = new AcademySession { Id = Guid.Parse("50000000-0000-0000-0000-000000000003"), TenantId = tenantId, BranchId = mainBranchId, CourseOfferingId = offering.Id, SessionNumber = 0, StartAt = new DateTimeOffset(2026, 9, 26, 10, 0, 0, TimeSpan.Zero), EndAt = new DateTimeOffset(2026, 9, 26, 11, 30, 0, TimeSpan.Zero), InstructorId = users[3].Id, ClassroomId = classroomMain.Id, Type = "REGULAR", Status = "COMPLETED", CompletedAt = new DateTimeOffset(2026, 9, 26, 11, 45, 0, TimeSpan.Zero) };
        var kit = new Kit { Id = Guid.Parse("60000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, Name = "MRT Essential Kit", QuantityAvailable = 18, TrackIndividually = false };

        var students = Enumerable.Range(1, 6).Select(index => new Student { Id = Guid.Parse($"70000000-0000-0000-0000-00000000000{index}"), TenantId = tenantId, BranchId = mainBranchId, FullName = index switch { 1 => "Youssef Ahmed", 2 => "Lina Omar", 3 => "Adam Khaled", 4 => "Mariam Hany", 5 => "Omar Tarek", _ => "Nour Mostafa" }, DateOfBirth = new DateOnly(2014 + (index % 3), 3 + index, 5 + index), Status = "ACTIVE" }).ToArray();
        var enrollments = students.Take(4).Select(student => new StudentEnrollment { StudentId = student.Id, CourseOfferingId = offering.Id, FinalPricePiastres = 320000, Status = "ACTIVE" }).ToArray();
        var attendance = new[]
        {
            new SessionAttendance { SessionId = session3.Id, StudentId = students[0].Id, Status = "PRESENT" },
            new SessionAttendance { SessionId = session3.Id, StudentId = students[1].Id, Status = "LATE", LateMinutes = 12 },
            new SessionAttendance { SessionId = session3.Id, StudentId = students[2].Id, Status = "ABSENT" }
        };
        db.Add(tenant);
        db.AddRange(mainBranch, heliopolisBranch);
        db.AddRange(users);
        db.AddRange(memberships);
        db.AddRange(classroomMain, classroomHelio, template, offering, session1, session2, session3, kit);
        db.Add(new KitAssignment { SessionId = session1.Id, KitId = kit.Id, QuantityUsed = 12 });
        db.AddRange(students);
        db.AddRange(enrollments);
        db.AddRange(attendance);
        await db.SaveChangesAsync(cancellationToken);
        await EnsureFinanceSliceAsync(db, tenantId, cancellationToken);
    }

    private static async Task EnsureFinanceSliceAsync(MadaDbContext db, Guid tenantId, CancellationToken cancellationToken)
    {
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var heliopolisBranchId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var userSpecs = new[]
        {
            (Guid.Parse("10000000-0000-0000-0000-000000000005"), "secretary@mada.demo", "+201000000005", "Academy Secretary"),
            (Guid.Parse("10000000-0000-0000-0000-000000000006"), "accountant@mada.demo", "+201000000006", "Academy Accountant"),
            (Guid.Parse("10000000-0000-0000-0000-000000000008"), "secretary.helio@mada.demo", "+201000000008", "Heliopolis Secretary"),
            (Guid.Parse("10000000-0000-0000-0000-000000000009"), "accountant.helio@mada.demo", "+201000000009", "Heliopolis Accountant")
        };
        var demoPasswordHash = new PasswordHashService().Hash("Mada@2026");
        foreach (var (id, email, phone, displayName) in userSpecs)
        {
            if (await db.UserAccounts.AnyAsync(user => user.Id == id, cancellationToken)) continue;
            db.UserAccounts.Add(new UserAccount { Id = id, Email = email, Phone = phone, DisplayName = displayName, AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" });
        }
        if (!await db.Branches.AnyAsync(branch => branch.Id == mainBranchId, cancellationToken))
            db.Branches.Add(new Branch { Id = mainBranchId, TenantId = tenantId, Name = "Main Branch", Code = "MAIN" });
        if (!await db.Branches.AnyAsync(branch => branch.Id == heliopolisBranchId, cancellationToken))
            db.Branches.Add(new Branch { Id = heliopolisBranchId, TenantId = tenantId, Name = "Heliopolis Branch", Code = "HELIO" });
        await db.SaveChangesAsync(cancellationToken);

        var membershipSpecs = new[]
        {
            (Guid.Parse("10000000-0000-0000-0000-000000000005"), mainBranchId, "R05_SECRETARY"),
            (Guid.Parse("10000000-0000-0000-0000-000000000006"), mainBranchId, "R06_ACCOUNTANT"),
            (Guid.Parse("10000000-0000-0000-0000-000000000008"), heliopolisBranchId, "R05_SECRETARY"),
            (Guid.Parse("10000000-0000-0000-0000-000000000009"), heliopolisBranchId, "R06_ACCOUNTANT")
        };
        foreach (var (userId, branchId, roleCode) in membershipSpecs)
        {
            if (await db.Memberships.AnyAsync(membership => membership.UserAccountId == userId && membership.TenantId == tenantId && membership.BranchId == branchId && membership.RoleCode == roleCode, cancellationToken)) continue;
            db.Memberships.Add(new Membership { UserAccountId = userId, TenantId = tenantId, BranchId = branchId, RoleCode = roleCode, ScopeLevel = "BRANCH" });
        }

        var mainStudentId = Guid.Parse("70000000-0000-0000-0000-000000000001");
        var heliopolisStudentId = Guid.Parse("70000000-0000-0000-0000-000000000007");
        if (!await db.Students.AnyAsync(student => student.Id == mainStudentId, cancellationToken))
            db.Students.Add(new Student { Id = mainStudentId, TenantId = tenantId, BranchId = mainBranchId, FullName = "Youssef Ahmed", DateOfBirth = new DateOnly(2015, 4, 12), Status = "ACTIVE" });
        if (!await db.Students.AnyAsync(student => student.Id == heliopolisStudentId, cancellationToken))
            db.Students.Add(new Student { Id = heliopolisStudentId, TenantId = tenantId, BranchId = heliopolisBranchId, FullName = "Salma Hossam", DateOfBirth = new DateOnly(2015, 4, 12), Status = "ACTIVE" });
        await db.SaveChangesAsync(cancellationToken);

        if (!await db.Invoices.AnyAsync(invoice => invoice.InvoiceNumber == "MAD-MAIN-2026-0001", cancellationToken))
            db.Invoices.Add(new Invoice
            {
                Id = Guid.Parse("80000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId,
                StudentId = mainStudentId, InvoiceNumber = "MAD-MAIN-2026-0001", TotalPiastres = 320_000,
                IssueDate = new DateOnly(2026, 10, 1), DueDate = new DateOnly(2026, 10, 15), Status = "PARTIAL",
                CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000005"),
                Lines = [new InvoiceLine { Id = Guid.Parse("81000000-0000-0000-0000-000000000001"), LineNumber = 1, Description = "Junior Robotics — Level 1", AmountPiastres = 320_000 }],
                Payments = [new PaymentTransaction { Id = Guid.Parse("82000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, AmountPiastres = 125_000, Method = "CASH", ReceivedOn = new DateOnly(2026, 10, 2), RecordedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000006") }]
            });
        if (!await db.Invoices.AnyAsync(invoice => invoice.InvoiceNumber == "MAD-HELIO-2026-0001", cancellationToken))
            db.Invoices.Add(new Invoice
            {
                Id = Guid.Parse("80000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = heliopolisBranchId,
                StudentId = heliopolisStudentId, InvoiceNumber = "MAD-HELIO-2026-0001", TotalPiastres = 260_000,
                IssueDate = new DateOnly(2026, 10, 1), DueDate = new DateOnly(2026, 10, 20), Status = "PAID",
                CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000008"),
                Lines = [new InvoiceLine { Id = Guid.Parse("81000000-0000-0000-0000-000000000002"), LineNumber = 1, Description = "Creative Lab — October", AmountPiastres = 260_000 }],
                Payments = [new PaymentTransaction { Id = Guid.Parse("82000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = heliopolisBranchId, AmountPiastres = 260_000, Method = "INSTAPAY", ReceivedOn = new DateOnly(2026, 10, 2), ExternalReference = "IP-DEMO-HELIO-001", RecordedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000009") }]
            });

        var mainExpenseId = Guid.Parse("83000000-0000-0000-0000-000000000001");
        var heliopolisExpenseId = Guid.Parse("83000000-0000-0000-0000-000000000002");
        if (!await db.Expenses.AnyAsync(expense => expense.Id == mainExpenseId, cancellationToken))
        {
            var approval = new ApprovalRequest { Id = Guid.Parse("84000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, RequestType = "EXPENSE_APPROVAL", TargetType = "EXPENSE", TargetId = mainExpenseId.ToString(), SubmittedByRole = "R02_BRANCH_MANAGER", State = "PENDING", Reason = "Pending demo purchase" };
            db.Expenses.Add(new Expense { Id = mainExpenseId, TenantId = tenantId, BranchId = mainBranchId, Description = "Robotics lab consumables", Category = "SUPPLIES", AmountPiastres = 45_000, SpentOn = new DateOnly(2026, 10, 2), Status = "PENDING", CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000003"), ApprovalRequestId = approval.Id, ApprovalRequest = approval });
        }
        if (!await db.Expenses.AnyAsync(expense => expense.Id == heliopolisExpenseId, cancellationToken))
        {
            var reason = "Approved for creative lab materials";
            var approval = new ApprovalRequest { Id = Guid.Parse("84000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = heliopolisBranchId, RequestType = "EXPENSE_APPROVAL", TargetType = "EXPENSE", TargetId = heliopolisExpenseId.ToString(), SubmittedByRole = "R06_ACCOUNTANT", State = "APPROVED", Reason = reason, DecidedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000002"), DecidedAt = new DateTimeOffset(2026, 10, 2, 12, 0, 0, TimeSpan.Zero) };
            db.Expenses.Add(new Expense { Id = heliopolisExpenseId, TenantId = tenantId, BranchId = heliopolisBranchId, Description = "Creative lab materials", Category = "SUPPLIES", AmountPiastres = 35_000, SpentOn = new DateOnly(2026, 10, 2), Status = "APPROVED", CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000009"), ApprovalRequestId = approval.Id, ApprovalRequest = approval });
            if (!await db.StateTransitions.AnyAsync(item => item.AggregateType == "EXPENSE" && item.AggregateId == heliopolisExpenseId.ToString() && item.ToState == "APPROVED", cancellationToken))
                db.StateTransitions.Add(new StateTransitionEvent { AggregateType = "EXPENSE", AggregateId = heliopolisExpenseId.ToString(), FromState = "PENDING", ToState = "APPROVED", ActorUserId = approval.DecidedByUserId!.Value, Reason = reason });
            if (!await db.AuditEvents.AnyAsync(item => item.TargetType == "EXPENSE" && item.TargetId == heliopolisExpenseId.ToString() && item.Action == "EXPENSE_APPROVED", cancellationToken))
                db.AuditEvents.Add(new AuditEvent { ActorUserId = approval.DecidedByUserId!.Value, TenantId = tenantId, BranchId = heliopolisBranchId, Action = "EXPENSE_APPROVED", TargetType = "EXPENSE", TargetId = heliopolisExpenseId.ToString(), Reason = reason });
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
