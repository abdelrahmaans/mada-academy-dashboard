using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Persistence.Seeding;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(MadaDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Tenants.AnyAsync(x => x.Slug == "mada-demo-academy", cancellationToken)) return;

        var tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var heliopolisBranchId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var tenant = new Tenant { Id = tenantId, Name = "Mada Demo Academy", Slug = "mada-demo-academy", PlanCode = "GROWTH" };
        var mainBranch = new Branch { Id = mainBranchId, TenantId = tenantId, Name = "Main Branch", Code = "MAIN" };
        var heliopolisBranch = new Branch { Id = heliopolisBranchId, TenantId = tenantId, Name = "Heliopolis Branch", Code = "HELIO" };

        var users = new[]
        {
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Email = "platform.admin@mada.demo", Phone = "+201000000001", DisplayName = "Platform Admin", AccountType = "staff", Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Email = "owner@mada.demo", Phone = "+201000000002", DisplayName = "Mada Owner", AccountType = "staff", Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Email = "manager@mada.demo", Phone = "+201000000003", DisplayName = "Main Branch Manager", AccountType = "staff", Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Email = "head@mada.demo", Phone = "+201000000004", DisplayName = "Head Instructor", AccountType = "staff", Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Email = "secretary@mada.demo", Phone = "+201000000005", DisplayName = "Academy Secretary", AccountType = "staff", Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Email = "accountant@mada.demo", Phone = "+201000000006", DisplayName = "Academy Accountant", AccountType = "staff", Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), Email = "media@mada.demo", Phone = "+201000000007", DisplayName = "Media Manager", AccountType = "staff", Status = "ACTIVE" }
        };

        var memberships = new[]
        {
            new Membership { UserAccountId = users[0].Id, TenantId = tenantId, RoleCode = "R00_PLATFORM_ADMIN", ScopeLevel = "PLATFORM" },
            new Membership { UserAccountId = users[1].Id, TenantId = tenantId, RoleCode = "R01_ACADEMY_OWNER", ScopeLevel = "TENANT" },
            new Membership { UserAccountId = users[2].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R02_BRANCH_MANAGER", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[3].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R03_HEAD_INSTRUCTORS", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[4].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R05_SECRETARY", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[5].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R06_ACCOUNTANT", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[6].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R07_MEDIA_MANAGER", ScopeLevel = "BRANCH" }
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
    }
}
