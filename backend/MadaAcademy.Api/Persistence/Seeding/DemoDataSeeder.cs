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
            await EnsureCoreSliceAsync(db, existingTenant.Id, cancellationToken);
            await EnsureFinanceSliceAsync(db, existingTenant.Id, cancellationToken);
            await EnsureCompetitionsSliceAsync(db, existingTenant.Id, cancellationToken);
            await EnsureFreezesSliceAsync(db, existingTenant.Id, cancellationToken);
            await EnsureSupportSliceAsync(db, existingTenant.Id, cancellationToken);
            await EnsureExtendedShowcaseSliceAsync(db, existingTenant.Id, cancellationToken);
            return;
        }

        var tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var heliopolisBranchId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var tenant = new Tenant { Id = tenantId, Name = "Mada Demo Academy", Slug = "mada-demo-academy", PlanCode = "GROWTH", FeatureOverridesJson = "{\"gamification\":true,\"leaderboardPodium\":true,\"instantSupportMeetings\":true}" };
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
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), Email = "accountant.helio@mada.demo", Phone = "+201000000009", DisplayName = "Heliopolis Accountant", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000010"), Email = "instructor@mada.demo", Phone = "+201000000010", DisplayName = "Main Instructor", AccountType = "staff", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000011"), Email = "parent@mada.demo", Phone = "+201000000011", DisplayName = "Youssef's Parent", AccountType = "parent", PasswordHash = demoPasswordHash, Status = "ACTIVE" },
            new UserAccount { Id = Guid.Parse("10000000-0000-0000-0000-000000000012"), Email = "student@mada.demo", Phone = "+201000000012", DisplayName = "Lina Omar", AccountType = "student", PasswordHash = demoPasswordHash, Status = "ACTIVE" }
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
            new Membership { UserAccountId = users[8].Id, TenantId = tenantId, BranchId = heliopolisBranchId, RoleCode = "R06_ACCOUNTANT", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[9].Id, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R04_INSTRUCTOR", ScopeLevel = "BRANCH" },
            new Membership { UserAccountId = users[10].Id, TenantId = tenantId, RoleCode = "R08_PARENT", ScopeLevel = "TENANT" },
            new Membership { UserAccountId = users[11].Id, TenantId = tenantId, RoleCode = "R09_STUDENT", ScopeLevel = "TENANT" }
        };

        var classroomMain = new Classroom { Id = Guid.Parse("20000000-0000-0000-0000-000000000001"), BranchId = mainBranchId, Name = "Robotics Lab A", Capacity = 14 };
        var classroomHelio = new Classroom { Id = Guid.Parse("20000000-0000-0000-0000-000000000002"), BranchId = heliopolisBranchId, Name = "Creative Lab", Capacity = 12 };
        var template = new CourseTemplate { Id = Guid.Parse("30000000-0000-0000-0000-000000000001"), TenantId = tenantId, Name = "Junior Robotics — Level 1", Track = "robotics", Type = "hard", AgeGroup = "8-12", Level = "beginner", TotalSessions = 8, SessionDurationHours = 1.5m, BasePricePiastres = 320000, Status = "PUBLISHED" };
        var offering = new CourseOffering { Id = Guid.Parse("40000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, CourseTemplateId = template.Id, InstructorId = users[9].Id, ClassroomId = classroomMain.Id, StartDate = new DateOnly(2026, 10, 1), EndDate = new DateOnly(2026, 11, 30), WeeklyScheduleJson = "{\"days\":[\"SATURDAY\"],\"start\":\"10:00\",\"end\":\"11:30\"}", Status = "ACTIVE", MaxStudents = 12 };

        var session1 = new AcademySession { Id = Guid.Parse("50000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, CourseOfferingId = offering.Id, SessionNumber = 1, StartAt = new DateTimeOffset(2026, 10, 3, 10, 0, 0, TimeSpan.Zero), EndAt = new DateTimeOffset(2026, 10, 3, 11, 30, 0, TimeSpan.Zero), InstructorId = users[9].Id, ClassroomId = classroomMain.Id, Type = "REGULAR", Status = "COMPLETED", CompletedAt = new DateTimeOffset(2026, 10, 3, 11, 45, 0, TimeSpan.Zero) };
        var session2 = new AcademySession { Id = Guid.Parse("50000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = mainBranchId, CourseOfferingId = offering.Id, SessionNumber = 2, StartAt = DateTimeOffset.UtcNow.AddDays(2), EndAt = DateTimeOffset.UtcNow.AddDays(2).AddMinutes(90), InstructorId = users[9].Id, ClassroomId = classroomMain.Id, Type = "REGULAR", Status = "SCHEDULED" };
        var session3 = new AcademySession { Id = Guid.Parse("50000000-0000-0000-0000-000000000003"), TenantId = tenantId, BranchId = mainBranchId, CourseOfferingId = offering.Id, SessionNumber = 3, StartAt = new DateTimeOffset(2026, 9, 26, 10, 0, 0, TimeSpan.Zero), EndAt = new DateTimeOffset(2026, 9, 26, 11, 30, 0, TimeSpan.Zero), InstructorId = users[9].Id, ClassroomId = classroomMain.Id, Type = "REGULAR", Status = "COMPLETED", CompletedAt = new DateTimeOffset(2026, 9, 26, 11, 45, 0, TimeSpan.Zero) };
        var kit = new Kit { Id = Guid.Parse("60000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, Name = "MRT Essential Kit", QuantityAvailable = 18, TrackIndividually = false };

        var students = Enumerable.Range(1, 6).Select(index => new Student { Id = Guid.Parse($"70000000-0000-0000-0000-00000000000{index}"), TenantId = tenantId, BranchId = mainBranchId, FullName = index switch { 1 => "Youssef Ahmed", 2 => "Lina Omar", 3 => "Adam Khaled", 4 => "Mariam Hany", 5 => "Omar Tarek", _ => "Nour Mostafa" }, DateOfBirth = new DateOnly(2014 + (index % 3), 3 + index, 5 + index), Status = "ACTIVE" }).ToArray();
        var enrollments = students.Take(4).Select(student => new StudentEnrollment { StudentId = student.Id, CourseOfferingId = offering.Id, FinalPricePiastres = 320000, Status = "ACTIVE" }).ToArray();
        var attendance = new[]
        {
            new SessionAttendance { SessionId = session3.Id, StudentId = students[0].Id, Status = "PRESENT" },
            new SessionAttendance { SessionId = session3.Id, StudentId = students[1].Id, Status = "LATE", LateMinutes = 12 },
            new SessionAttendance { SessionId = session3.Id, StudentId = students[2].Id, Status = "ABSENT" },
            new SessionAttendance { SessionId = session3.Id, StudentId = students[3].Id, Status = "PRESENT" }
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
        db.Add(new StudentAccountLink { Id = Guid.Parse("91000000-0000-0000-0000-000000000001"), TenantId = tenantId, StudentId = students[1].Id, UserAccountId = users[11].Id, CreatedByUserId = users[1].Id });
        db.Add(new GuardianStudentLink { Id = Guid.Parse("92000000-0000-0000-0000-000000000001"), TenantId = tenantId, StudentId = students[0].Id, UserAccountId = users[10].Id, CreatedByUserId = users[1].Id, Relationship = "ولي الأمر", Status = "ACTIVE" });
        db.Add(new GuardianStudentLink { Id = Guid.Parse("92000000-0000-0000-0000-000000000002"), TenantId = tenantId, StudentId = students[2].Id, UserAccountId = users[10].Id, CreatedByUserId = users[1].Id, Relationship = "ولي الأمر", Status = "ACTIVE" });
        db.Add(new SessionEvaluation { Id = Guid.Parse("93000000-0000-0000-0000-000000000001"), SessionId = session3.Id, StudentId = students[0].Id, InstructorId = users[9].Id, Score = 88, Notes = "تقدم واضح في التطبيق العملي وبناء الدائرة الكهربائية بنجاح", BonusPoints = 15, GamificationBadge = "CHALLENGE_HERO", Status = "PUBLISHED", SubmittedAt = new DateTimeOffset(2026, 9, 26, 12, 0, 0, TimeSpan.Zero), ReviewedByUserId = users[3].Id, ReviewedAt = new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero), PublishedAt = new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero) });
        db.Add(new StateTransitionEvent { Id = Guid.Parse("94000000-0000-0000-0000-000000000001"), AggregateType = "SESSION_EVALUATION", AggregateId = "93000000-0000-0000-0000-000000000001", FromState = "SUBMITTED", ToState = "PUBLISHED", ActorUserId = users[3].Id });
        if (!await db.Leads.AnyAsync(item => item.TenantId == tenantId, cancellationToken))
        {
            db.Leads.AddRange(
                new Lead
                {
                    Id = Guid.Parse("95000000-0000-0000-0000-000000000001"),
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    ChildName = "سليم أحمد كمال",
                    ParentName = "أحمد كمال",
                    Phone = "+201012345671",
                    Channel = "WALK_IN",
                    Notes = "مهتم بروبوتكس مستوى 1، يفضل موعد السبت صباحًا.",
                    Status = "NEW",
                    CourseOfferingId = offering.Id,
                    CreatedByUserId = users[4].Id
                },
                new Lead
                {
                    Id = Guid.Parse("95000000-0000-0000-0000-000000000002"),
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    ChildName = "حبيبة تامر فؤاد",
                    ParentName = "تامر فؤاد",
                    Phone = "+201012345672",
                    Channel = "WHATSAPP",
                    Notes = "تم التواصل هاتفياً وطلب إرسال تفاصيل الرسوم.",
                    Status = "CONTACTED",
                    CourseOfferingId = offering.Id,
                    CreatedByUserId = users[4].Id
                },
                new Lead
                {
                    Id = Guid.Parse("95000000-0000-0000-0000-000000000003"),
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    ChildName = "حمزة وائل عزمي",
                    ParentName = "وائل عزمي",
                    Phone = "+201012345673",
                    Channel = "PHONE",
                    Notes = "أبدى اهتماماً كبيراً وطلب تأكيد حجز المقعد.",
                    Status = "INTERESTED",
                    CourseOfferingId = offering.Id,
                    CreatedByUserId = users[4].Id
                }
            );
        }
        await db.SaveChangesAsync(cancellationToken);
        await EnsureCoreSliceAsync(db, tenantId, cancellationToken);
        await EnsureFinanceSliceAsync(db, tenantId, cancellationToken);
        await EnsureCompetitionsSliceAsync(db, tenantId, cancellationToken);
        await EnsureFreezesSliceAsync(db, tenantId, cancellationToken);
        await EnsureSupportSliceAsync(db, tenantId, cancellationToken);
        await EnsureExtendedShowcaseSliceAsync(db, tenantId, cancellationToken);
    }

    private static async Task EnsureCoreSliceAsync(MadaDbContext db, Guid tenantId, CancellationToken cancellationToken)
    {
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var mainInstructorId = Guid.Parse("10000000-0000-0000-0000-000000000010");
        var parentId = Guid.Parse("10000000-0000-0000-0000-000000000011");
        var studentAccountId = Guid.Parse("10000000-0000-0000-0000-000000000012");
        var firstStudentId = Guid.Parse("70000000-0000-0000-0000-000000000001");
        var secondStudentId = Guid.Parse("70000000-0000-0000-0000-000000000002");
        var sessionId = Guid.Parse("50000000-0000-0000-0000-000000000003");
        var offeringId = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var reviewerId = Guid.Parse("10000000-0000-0000-0000-000000000004");
        var passwordHash = new PasswordHashService().Hash("Mada@2026");

        if (!await db.UserAccounts.AnyAsync(item => item.Id == mainInstructorId, cancellationToken))
            db.UserAccounts.Add(new UserAccount { Id = mainInstructorId, Email = "instructor@mada.demo", Phone = "+201000000010", DisplayName = "Main Instructor", AccountType = "staff", PasswordHash = passwordHash, Status = "ACTIVE" });
        if (!await db.UserAccounts.AnyAsync(item => item.Id == parentId, cancellationToken))
            db.UserAccounts.Add(new UserAccount { Id = parentId, Email = "parent@mada.demo", Phone = "+201000000011", DisplayName = "Youssef's Parent", AccountType = "parent", PasswordHash = passwordHash, Status = "ACTIVE" });
        if (!await db.UserAccounts.AnyAsync(item => item.Id == studentAccountId, cancellationToken))
            db.UserAccounts.Add(new UserAccount { Id = studentAccountId, Email = "student@mada.demo", Phone = "+201000000012", DisplayName = "Lina Omar", AccountType = "student", PasswordHash = passwordHash, Status = "ACTIVE" });
        await db.SaveChangesAsync(cancellationToken);

        var offering = await db.CourseOfferings.SingleOrDefaultAsync(item => item.Id == offeringId && item.TenantId == tenantId && item.BranchId == mainBranchId, cancellationToken);
        if (offering is not null) offering.InstructorId = mainInstructorId;
        var sessions = await db.AcademySessions.Where(item => item.CourseOfferingId == offeringId && item.TenantId == tenantId && item.BranchId == mainBranchId).ToListAsync(cancellationToken);
        foreach (var sessionForOffering in sessions) sessionForOffering.InstructorId = mainInstructorId;

        if (!await db.Memberships.AnyAsync(item => item.UserAccountId == mainInstructorId && item.TenantId == tenantId && item.RoleCode == "R04_INSTRUCTOR" && item.Status == "ACTIVE", cancellationToken))
            db.Memberships.Add(new Membership { UserAccountId = mainInstructorId, TenantId = tenantId, BranchId = mainBranchId, RoleCode = "R04_INSTRUCTOR", ScopeLevel = "BRANCH", Status = "ACTIVE" });
        if (!await db.Memberships.AnyAsync(item => item.UserAccountId == parentId && item.TenantId == tenantId && item.RoleCode == "R08_PARENT" && item.Status == "ACTIVE", cancellationToken))
            db.Memberships.Add(new Membership { UserAccountId = parentId, TenantId = tenantId, RoleCode = "R08_PARENT", ScopeLevel = "TENANT", Status = "ACTIVE" });
        if (!await db.Memberships.AnyAsync(item => item.UserAccountId == studentAccountId && item.TenantId == tenantId && item.RoleCode == "R09_STUDENT" && item.Status == "ACTIVE", cancellationToken))
            db.Memberships.Add(new Membership { UserAccountId = studentAccountId, TenantId = tenantId, RoleCode = "R09_STUDENT", ScopeLevel = "TENANT", Status = "ACTIVE" });

        if (!await db.StudentAccountLinks.AnyAsync(item => item.StudentId == secondStudentId && item.UserAccountId == studentAccountId, cancellationToken))
            db.StudentAccountLinks.Add(new StudentAccountLink { Id = Guid.Parse("91000000-0000-0000-0000-000000000001"), TenantId = tenantId, StudentId = secondStudentId, UserAccountId = studentAccountId, CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000002") });
        if (!await db.GuardianStudentLinks.AnyAsync(item => item.StudentId == firstStudentId && item.UserAccountId == parentId, cancellationToken))
            db.GuardianStudentLinks.Add(new GuardianStudentLink { Id = Guid.Parse("92000000-0000-0000-0000-000000000001"), TenantId = tenantId, StudentId = firstStudentId, UserAccountId = parentId, CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000002"), Relationship = "ولي الأمر", Status = "ACTIVE" });
        var thirdStudentId = Guid.Parse("70000000-0000-0000-0000-000000000003");
        var fourthStudentId = Guid.Parse("70000000-0000-0000-0000-000000000004");
        if (!await db.GuardianStudentLinks.AnyAsync(item => item.StudentId == thirdStudentId && item.UserAccountId == parentId, cancellationToken))
            db.GuardianStudentLinks.Add(new GuardianStudentLink { Id = Guid.Parse("92000000-0000-0000-0000-000000000002"), TenantId = tenantId, StudentId = thirdStudentId, UserAccountId = parentId, CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000002"), Relationship = "ولي الأمر", Status = "ACTIVE" });
        var session1Id = Guid.Parse("50000000-0000-0000-0000-000000000001");
        var s1Entity = await db.AcademySessions.SingleOrDefaultAsync(x => x.Id == session1Id, cancellationToken);
        if (s1Entity is not null && s1Entity.Status != "COMPLETED")
        {
            s1Entity.Status = "COMPLETED";
            s1Entity.CompletedAt = new DateTimeOffset(2026, 10, 3, 11, 45, 0, TimeSpan.Zero);
        }
        var heliopolisBranchId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var helioClassroomId = Guid.Parse("20000000-0000-0000-0000-000000000002");
        var helioStudentId = Guid.Parse("70000000-0000-0000-0000-000000000007");

        // Additional attendances for session 1
        if (!await db.SessionAttendances.AnyAsync(item => item.SessionId == session1Id && item.StudentId == firstStudentId, cancellationToken))
            db.SessionAttendances.Add(new SessionAttendance { SessionId = session1Id, StudentId = firstStudentId, Status = "PRESENT" });
        if (!await db.SessionAttendances.AnyAsync(item => item.SessionId == session1Id && item.StudentId == secondStudentId, cancellationToken))
            db.SessionAttendances.Add(new SessionAttendance { SessionId = session1Id, StudentId = secondStudentId, Status = "PRESENT" });
        if (!await db.SessionAttendances.AnyAsync(item => item.SessionId == session1Id && item.StudentId == thirdStudentId, cancellationToken))
            db.SessionAttendances.Add(new SessionAttendance { SessionId = session1Id, StudentId = thirdStudentId, Status = "ABSENT" });
        if (!await db.SessionAttendances.AnyAsync(item => item.SessionId == session1Id && item.StudentId == fourthStudentId, cancellationToken))
            db.SessionAttendances.Add(new SessionAttendance { SessionId = session1Id, StudentId = fourthStudentId, Status = "PRESENT" });

        // Evaluations for students
        if (!await db.SessionEvaluations.AnyAsync(item => item.SessionId == sessionId && item.StudentId == firstStudentId, cancellationToken))
        {
            db.SessionEvaluations.Add(new SessionEvaluation { Id = Guid.Parse("93000000-0000-0000-0000-000000000001"), SessionId = sessionId, StudentId = firstStudentId, InstructorId = mainInstructorId, Score = 88, Notes = "تقدم واضح في التطبيق العملي", Status = "PUBLISHED", SubmittedAt = new DateTimeOffset(2026, 9, 26, 12, 0, 0, TimeSpan.Zero), ReviewedByUserId = reviewerId, ReviewedAt = new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero), PublishedAt = new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero) });
            db.StateTransitions.Add(new StateTransitionEvent { Id = Guid.Parse("94000000-0000-0000-0000-000000000001"), AggregateType = "SESSION_EVALUATION", AggregateId = "93000000-0000-0000-0000-000000000001", FromState = "SUBMITTED", ToState = "PUBLISHED", ActorUserId = reviewerId });
        }
        if (!await db.SessionEvaluations.AnyAsync(item => item.SessionId == sessionId && item.StudentId == secondStudentId, cancellationToken))
            db.SessionEvaluations.Add(new SessionEvaluation { Id = Guid.Parse("93000000-0000-0000-0000-000000000002"), SessionId = sessionId, StudentId = secondStudentId, InstructorId = mainInstructorId, Score = 96, Notes = "أداء استثنائي وابتكار فكرة جديدة في خوارزمية التحكم", BonusPoints = 20, GamificationBadge = "CREATIVE_THINKER", Status = "PUBLISHED", SubmittedAt = new DateTimeOffset(2026, 9, 26, 12, 10, 0, TimeSpan.Zero), PublishedAt = new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero) });
        if (!await db.SessionEvaluations.AnyAsync(item => item.SessionId == sessionId && item.StudentId == thirdStudentId, cancellationToken))
            db.SessionEvaluations.Add(new SessionEvaluation { Id = Guid.Parse("93000000-0000-0000-0000-000000000003"), SessionId = sessionId, StudentId = thirdStudentId, InstructorId = mainInstructorId, Score = 58, Notes = "صعوبة في متابعة الدرس بسبب الغياب المتكرر", Status = "PUBLISHED", SubmittedAt = new DateTimeOffset(2026, 9, 26, 12, 15, 0, TimeSpan.Zero), PublishedAt = new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero) });
        if (!await db.SessionEvaluations.AnyAsync(item => item.SessionId == sessionId && item.StudentId == fourthStudentId, cancellationToken))
            db.SessionEvaluations.Add(new SessionEvaluation { Id = Guid.Parse("93000000-0000-0000-0000-000000000004"), SessionId = sessionId, StudentId = fourthStudentId, InstructorId = mainInstructorId, Score = 85, Notes = "مستوى متميز وتفاعل إيجابي مع الفريق", BonusPoints = 10, GamificationBadge = "STAR_PERFORMANCE", Status = "PUBLISHED", SubmittedAt = new DateTimeOffset(2026, 9, 26, 12, 20, 0, TimeSpan.Zero), PublishedAt = new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero) });

        // Heliopolis Course Offering & Enrollment
        var helioTemplateId = Guid.Parse("30000000-0000-0000-0000-000000000002");
        if (!await db.CourseTemplates.AnyAsync(item => item.Id == helioTemplateId, cancellationToken))
            db.CourseTemplates.Add(new CourseTemplate { Id = helioTemplateId, TenantId = tenantId, Name = "Creative Lab — October", Track = "coding", Type = "soft", AgeGroup = "9-14", Level = "beginner", TotalSessions = 6, SessionDurationHours = 1.5m, BasePricePiastres = 260000, Status = "PUBLISHED" });

        var helioOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000002");
        if (!await db.CourseOfferings.AnyAsync(item => item.Id == helioOfferingId, cancellationToken))
            db.CourseOfferings.Add(new CourseOffering { Id = helioOfferingId, TenantId = tenantId, BranchId = heliopolisBranchId, CourseTemplateId = helioTemplateId, InstructorId = mainInstructorId, ClassroomId = helioClassroomId, StartDate = new DateOnly(2026, 10, 1), EndDate = new DateOnly(2026, 11, 15), WeeklyScheduleJson = "{\"days\":[\"SUNDAY\"],\"start\":\"16:00\",\"end\":\"17:30\"}", Status = "ACTIVE", MaxStudents = 10 });

        if (!await db.StudentEnrollments.AnyAsync(item => item.StudentId == helioStudentId && item.CourseOfferingId == helioOfferingId, cancellationToken))
            db.StudentEnrollments.Add(new StudentEnrollment { Id = Guid.Parse("71000000-0000-0000-0000-000000000007"), StudentId = helioStudentId, CourseOfferingId = helioOfferingId, FinalPricePiastres = 260000, Status = "ACTIVE" });

        var helioSessionId = Guid.Parse("50000000-0000-0000-0000-000000000004");
        if (!await db.AcademySessions.AnyAsync(item => item.Id == helioSessionId, cancellationToken))
        {
            db.AcademySessions.Add(new AcademySession { Id = helioSessionId, TenantId = tenantId, BranchId = heliopolisBranchId, CourseOfferingId = helioOfferingId, SessionNumber = 1, StartAt = new DateTimeOffset(2026, 10, 4, 16, 0, 0, TimeSpan.Zero), EndAt = new DateTimeOffset(2026, 10, 4, 17, 30, 0, TimeSpan.Zero), InstructorId = mainInstructorId, ClassroomId = helioClassroomId, Type = "REGULAR", Status = "COMPLETED", CompletedAt = new DateTimeOffset(2026, 10, 4, 17, 40, 0, TimeSpan.Zero) });
            db.SessionAttendances.Add(new SessionAttendance { SessionId = helioSessionId, StudentId = helioStudentId, Status = "PRESENT" });
            db.SessionEvaluations.Add(new SessionEvaluation { Id = Guid.Parse("93000000-0000-0000-0000-000000000005"), SessionId = helioSessionId, StudentId = helioStudentId, InstructorId = mainInstructorId, Score = 95, Notes = "استيعاب سريع وتطبيق احترافي", Status = "PUBLISHED", SubmittedAt = new DateTimeOffset(2026, 10, 4, 17, 45, 0, TimeSpan.Zero), PublishedAt = new DateTimeOffset(2026, 10, 4, 18, 0, 0, TimeSpan.Zero) });
        }

        await db.SaveChangesAsync(cancellationToken);
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
        var linaStudentId = Guid.Parse("70000000-0000-0000-0000-000000000002");
        var adamStudentId = Guid.Parse("70000000-0000-0000-0000-000000000003");
        var mariamStudentId = Guid.Parse("70000000-0000-0000-0000-000000000004");
        var heliopolisStudentId = Guid.Parse("70000000-0000-0000-0000-000000000007");

        if (!await db.Students.AnyAsync(student => student.Id == mainStudentId, cancellationToken))
            db.Students.Add(new Student { Id = mainStudentId, TenantId = tenantId, BranchId = mainBranchId, FullName = "Youssef Ahmed", DateOfBirth = new DateOnly(2015, 4, 12), Status = "ACTIVE" });
        if (!await db.Students.AnyAsync(student => student.Id == heliopolisStudentId, cancellationToken))
            db.Students.Add(new Student { Id = heliopolisStudentId, TenantId = tenantId, BranchId = heliopolisBranchId, FullName = "Salma Hossam", DateOfBirth = new DateOnly(2015, 4, 12), Status = "ACTIVE" });
        await db.SaveChangesAsync(cancellationToken);

        var offeringId = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var mainEnrollment = await db.StudentEnrollments.FirstOrDefaultAsync(e => e.StudentId == mainStudentId && e.CourseOfferingId == offeringId, cancellationToken);
        var helioOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000002");
        var helioEnrollment = await db.StudentEnrollments.FirstOrDefaultAsync(e => e.StudentId == heliopolisStudentId && e.CourseOfferingId == helioOfferingId, cancellationToken);

        if (!await db.Invoices.AnyAsync(invoice => invoice.InvoiceNumber == "MAD-MAIN-2026-0001", cancellationToken))
            db.Invoices.Add(new Invoice
            {
                Id = Guid.Parse("80000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId,
                StudentId = mainStudentId, EnrollmentId = mainEnrollment?.Id, InvoiceNumber = "MAD-MAIN-2026-0001", TotalPiastres = 320_000,
                IssueDate = new DateOnly(2026, 10, 1), DueDate = new DateOnly(2026, 10, 15), Status = "PARTIAL",
                CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000005"),
                Lines = [new InvoiceLine { Id = Guid.Parse("81000000-0000-0000-0000-000000000001"), LineNumber = 1, Description = "Junior Robotics — Level 1", AmountPiastres = 320_000 }],
                Payments = [new PaymentTransaction { Id = Guid.Parse("82000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, AmountPiastres = 125_000, Method = "CASH", ReceivedOn = new DateOnly(2026, 10, 2), RecordedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000006") }]
            });

        if (!await db.Invoices.AnyAsync(invoice => invoice.InvoiceNumber == "MAD-HELIO-2026-0001", cancellationToken))
            db.Invoices.Add(new Invoice
            {
                Id = Guid.Parse("80000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = heliopolisBranchId,
                StudentId = heliopolisStudentId, EnrollmentId = helioEnrollment?.Id, InvoiceNumber = "MAD-HELIO-2026-0001", TotalPiastres = 260_000,
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

        if (!await db.AuditEvents.AnyAsync(item => item.TenantId == tenantId && item.Action == "CASHIER_SAFE_DEPOSIT", cancellationToken))
        {
            db.AuditEvents.Add(new AuditEvent
            {
                TenantId = tenantId,
                BranchId = mainBranchId,
                ActorUserId = Guid.Parse("10000000-0000-0000-0000-000000000006"),
                Action = "CASHIER_SAFE_DEPOSIT",
                TargetType = "SAFE",
                TargetId = mainBranchId.ToString(),
                Reason = "توريد نقدية شفت الخزينة الصباحي إلى الخزينة الرئيسية بمبلغ 6400 جنيه",
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureCompetitionsSliceAsync(MadaDbContext db, Guid tenantId, CancellationToken cancellationToken)
    {
        var competitionId = Guid.Parse("c1000000-0000-0000-0000-000000000001");
        if (!await db.Competitions.AnyAsync(c => c.Id == competitionId, cancellationToken))
        {
            var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
            var classroomId = Guid.Parse("20000000-0000-0000-0000-000000000001");
            var kitId = Guid.Parse("60000000-0000-0000-0000-000000000001");
            var coachId = Guid.Parse("10000000-0000-0000-0000-000000000010");
            var student1Id = Guid.Parse("70000000-0000-0000-0000-000000000001");
            var student2Id = Guid.Parse("70000000-0000-0000-0000-000000000002");

            var competition = new Competition
            {
                Id = competitionId,
                TenantId = tenantId,
                Name = "بطولة الجمهورية للروبوتات WRO Egypt 2026",
                Organizer = "الاتحاد المصري للروبوتات",
                Season = "2026/2027",
                Track = "robotics",
                AgeMin = 8,
                AgeMax = 15,
                RegistrationDeadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
                EventDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                Location = "القرية الذكية - صالة المؤتمرات",
                Status = "ACTIVE",
                Notes = "تأهيل للبطولة العربية",
                CreatedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000002")
            };

            var team = new CompetitionTeam
            {
                Id = Guid.Parse("c2000000-0000-0000-0000-000000000001"),
                TenantId = tenantId,
                BranchId = mainBranchId,
                CompetitionId = competition.Id,
                Name = "Mada Robo Warriors",
                CoachInstructorId = coachId,
                ClassroomId = classroomId,
                KitId = kitId,
                ProjectTitle = "Autonomous Bot",
                Status = "CONFIRMED"
            };

            var award = new CompetitionAward
            {
                Id = Guid.Parse("c3000000-0000-0000-0000-000000000001"),
                TenantId = tenantId,
                BranchId = mainBranchId,
                CompetitionId = competition.Id,
                TeamId = team.Id,
                Title = "المركز الأول والكأس الذهبي في الفئة الهندسية",
                Rank = 1,
                AwardDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
                IsPublishedToHallOfFame = true
            };

            db.Add(competition);
            db.Add(team);
            db.Add(new CompetitionTeamMember { TeamId = team.Id, StudentId = student1Id, RoleInTeam = "CAPTAIN", Status = "ACTIVE" });
            db.Add(new CompetitionTeamMember { TeamId = team.Id, StudentId = student2Id, RoleInTeam = "PROGRAMMER", Status = "ACTIVE" });
            db.Add(award);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task EnsureFreezesSliceAsync(MadaDbContext db, Guid tenantId, CancellationToken cancellationToken)
    {
        var freezeId = Guid.Parse("f1000000-0000-0000-0000-000000000001");
        if (!await db.SubscriptionFreezeRequests.AnyAsync(f => f.Id == freezeId, cancellationToken))
        {
            var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
            var studentId = Guid.Parse("70000000-0000-0000-0000-000000000003");
            var offeringId = Guid.Parse("40000000-0000-0000-0000-000000000001");

            db.SubscriptionFreezeRequests.Add(new SubscriptionFreezeRequest
            {
                Id = freezeId,
                TenantId = tenantId,
                BranchId = mainBranchId,
                StudentId = studentId,
                CourseOfferingId = offeringId,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-7)),
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                Reason = "MEDICAL",
                ReasonText = "إجازة مرضية معتمدة وتقارير طبية",
                Status = "APPROVED",
                SubmittedByRole = "R08_PARENT",
                SubmittedByName = "ولي الأمر",
                AffectedSessionsCount = 2,
                MakeUpCreditsAwarded = 2,
                DecidedAt = DateTime.UtcNow.AddDays(-6),
                DecidedByName = "Main Branch Manager",
                DecisionNote = "معتمد وإضافة رصيد تعويض"
            });
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task EnsureSupportSliceAsync(MadaDbContext db, Guid tenantId, CancellationToken cancellationToken)
    {
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var ownerId = Guid.Parse("10000000-0000-0000-0000-000000000002");
        var secretaryId = Guid.Parse("10000000-0000-0000-0000-000000000005");

        var tenant = await db.Tenants.SingleOrDefaultAsync(t => t.Id == tenantId, cancellationToken);
        if (tenant is not null && string.IsNullOrWhiteSpace(tenant.FeatureOverridesJson))
        {
            tenant.FeatureOverridesJson = "{\"gamification\":true,\"leaderboardPodium\":true,\"instantSupportMeetings\":true}";
        }

        var ticket1Id = Guid.Parse("e1000000-0000-0000-0000-000000000001");
        if (!await db.PlatformSupportTickets.AnyAsync(t => t.Id == ticket1Id, cancellationToken))
        {
            db.PlatformSupportTickets.Add(new PlatformSupportTicket
            {
                Id = ticket1Id,
                TenantId = tenantId,
                BranchId = mainBranchId,
                RequesterUserId = ownerId,
                RequesterName = "د. أحمد البشبيشي",
                RequesterPhone = "+201000000002",
                RequesterRole = "R01_ACADEMY_OWNER",
                Subject = "طلب اجتماع لمناقشة تفعيل ميزات التوسع لفرع مصر الجديدة",
                Description = "نود الاجتماع مع فريق المنصة لمناقشة خطة تفعيل فرع مصر الجديدة وجدولة الورش التدريبية ونظام التنافسية.",
                Category = "MEETING_REQUEST",
                Priority = "HIGH",
                Status = "IN_PROGRESS",
                MeetingUrl = "https://meet.google.com/abc-mada-demo",
                MeetingScheduledAt = DateTimeOffset.UtcNow.AddDays(1),
                InternalAdminNotes = "تم التنسيق وتحديد رابط Google Meet وإشعار الأكاديمية بالموعد.",
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-18)
            });
        }

        var ticket2Id = Guid.Parse("e1000000-0000-0000-0000-000000000002");
        if (!await db.PlatformSupportTickets.AnyAsync(t => t.Id == ticket2Id, cancellationToken))
        {
            db.PlatformSupportTickets.Add(new PlatformSupportTicket
            {
                Id = ticket2Id,
                TenantId = tenantId,
                BranchId = mainBranchId,
                RequesterUserId = secretaryId,
                RequesterName = "أ. هبة محمود",
                RequesterPhone = "+201000000005",
                RequesterRole = "R05_SECRETARY",
                Subject = "استفسار بخصوص تسكين الطلاب من قائمة الانتظار",
                Description = "هل يتم إنشاء الفاتورة ومطالبتها تلقائياً عند ترقية الطالب من قائمة الانتظار إلى مجموعة فعالة؟",
                Category = "TECHNICAL",
                Priority = "MEDIUM",
                Status = "NEW",
                InternalAdminNotes = null,
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-4)
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public static async Task ResetAndSeedAsync(MadaDbContext db, CancellationToken cancellationToken = default)
    {
        if (db.Database.IsRelational())
        {
            await db.Database.ExecuteSqlRawAsync(@"
                DO $$ DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename NOT LIKE '__EF%') LOOP
                        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                END $$;
            ", cancellationToken);
        }
        else
        {
            db.PlatformSubscriptionPayments.RemoveRange(db.PlatformSubscriptionPayments);
            db.PlatformSupportTickets.RemoveRange(db.PlatformSupportTickets);
            db.EvaluationRubrics.RemoveRange(db.EvaluationRubrics);
            db.InstructorPayrollRecords.RemoveRange(db.InstructorPayrollRecords);
            db.InAppNotifications.RemoveRange(db.InAppNotifications);
            db.InvoiceCorrectionRequests.RemoveRange(db.InvoiceCorrectionRequests);
            db.SessionSubstitutionProposals.RemoveRange(db.SessionSubstitutionProposals);
            db.GroupSupervisionAssignments.RemoveRange(db.GroupSupervisionAssignments);
            db.MarketingContentItems.RemoveRange(db.MarketingContentItems);
            db.ClassroomResources.RemoveRange(db.ClassroomResources);
            db.PaymentEvidences.RemoveRange(db.PaymentEvidences);
            db.ExpenseEvidences.RemoveRange(db.ExpenseEvidences);
            db.Competitions.RemoveRange(db.Competitions);
            db.CompetitionTeams.RemoveRange(db.CompetitionTeams);
            db.CompetitionTeamMembers.RemoveRange(db.CompetitionTeamMembers);
            db.CompetitionAwards.RemoveRange(db.CompetitionAwards);
            db.SubscriptionFreezeRequests.RemoveRange(db.SubscriptionFreezeRequests);
            db.AuditEvents.RemoveRange(db.AuditEvents);
            db.StateTransitions.RemoveRange(db.StateTransitions);
            db.ApprovalRequests.RemoveRange(db.ApprovalRequests);
            db.Expenses.RemoveRange(db.Expenses);
            db.PaymentTransactions.RemoveRange(db.PaymentTransactions);
            db.InvoiceLines.RemoveRange(db.InvoiceLines);
            db.Invoices.RemoveRange(db.Invoices);
            db.SessionEvaluations.RemoveRange(db.SessionEvaluations);
            db.SessionAttendances.RemoveRange(db.SessionAttendances);
            db.KitAssignments.RemoveRange(db.KitAssignments);
            db.Kits.RemoveRange(db.Kits);
            db.AcademySessions.RemoveRange(db.AcademySessions);
            db.StudentEnrollments.RemoveRange(db.StudentEnrollments);
            db.CourseOfferings.RemoveRange(db.CourseOfferings);
            db.CourseTemplates.RemoveRange(db.CourseTemplates);
            db.Classrooms.RemoveRange(db.Classrooms);
            db.GuardianStudentLinks.RemoveRange(db.GuardianStudentLinks);
            db.StudentAccountLinks.RemoveRange(db.StudentAccountLinks);
            db.Students.RemoveRange(db.Students);
            db.Leads.RemoveRange(db.Leads);
            db.MarketingCampaigns.RemoveRange(db.MarketingCampaigns);
            db.Memberships.RemoveRange(db.Memberships);
            db.Branches.RemoveRange(db.Branches);
            db.Tenants.RemoveRange(db.Tenants);
            db.UserAccounts.RemoveRange(db.UserAccounts);
            await db.SaveChangesAsync(cancellationToken);
        }

        await SeedAsync(db, cancellationToken);
    }

    private static async Task EnsureExtendedShowcaseSliceAsync(MadaDbContext db, Guid tenantId, CancellationToken cancellationToken)
    {
        var mainBranchId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var heliopolisBranchId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var ownerId = Guid.Parse("10000000-0000-0000-0000-000000000002");
        var managerId = Guid.Parse("10000000-0000-0000-0000-000000000003");
        var headId = Guid.Parse("10000000-0000-0000-0000-000000000004");
        var secretaryId = Guid.Parse("10000000-0000-0000-0000-000000000005");
        var accountantId = Guid.Parse("10000000-0000-0000-0000-000000000006");
        var mediaId = Guid.Parse("10000000-0000-0000-0000-000000000007");
        var helioSecretaryId = Guid.Parse("10000000-0000-0000-0000-000000000008");
        var mainInstructorId = Guid.Parse("10000000-0000-0000-0000-000000000010");
        var parentId = Guid.Parse("10000000-0000-0000-0000-000000000011");

        var classroomMainId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var classroomHelioId = Guid.Parse("20000000-0000-0000-0000-000000000002");
        var classroomMain2Id = Guid.Parse("20000000-0000-0000-0000-000000000003");

        if (!await db.Classrooms.AnyAsync(c => c.Id == classroomMain2Id, cancellationToken))
        {
            db.Classrooms.Add(new Classroom
            {
                Id = classroomMain2Id,
                BranchId = mainBranchId,
                Name = "AI & Coding Lab B",
                Capacity = 16,
                Status = "AVAILABLE"
            });
        }

        // Classroom resources across rooms
        var res1Id = Guid.Parse("21000000-0000-0000-0000-000000000001");
        if (!await db.ClassroomResources.AnyAsync(r => r.Id == res1Id, cancellationToken))
        {
            db.ClassroomResources.AddRange(
                new ClassroomResource { Id = res1Id, ClassroomId = classroomMainId, Kind = "HARDWARE", Name = "شاشة عرض تفاعلية 65 بوصة", Quantity = 1, Status = "AVAILABLE", Notes = "مجهزة بنظام HDMI لاسلكي" },
                new ClassroomResource { Id = Guid.Parse("21000000-0000-0000-0000-000000000002"), ClassroomId = classroomMainId, Kind = "ROBOTICS_ARENA", Name = "ساحة تحدي الروبوت القياسية", Quantity = 2, Status = "AVAILABLE" },
                new ClassroomResource { Id = Guid.Parse("21000000-0000-0000-0000-000000000003"), ClassroomId = classroomMain2Id, Kind = "LAPTOPS", Name = "أجهزة لابتوب برمجة Core i5", Quantity = 16, Status = "AVAILABLE" },
                new ClassroomResource { Id = Guid.Parse("21000000-0000-0000-0000-000000000004"), ClassroomId = classroomHelioId, Kind = "PRINTER_3D", Name = "طابعة ثلاثية الأبعاد Prusa", Quantity = 1, Status = "AVAILABLE" }
            );
        }

        // Additional Kits across branches
        var kit2Id = Guid.Parse("60000000-0000-0000-0000-000000000002");
        if (!await db.Kits.AnyAsync(k => k.Id == kit2Id, cancellationToken))
        {
            db.Kits.AddRange(
                new Kit { Id = kit2Id, TenantId = tenantId, BranchId = mainBranchId, Name = "Arduino Uno Starter Kit", QuantityAvailable = 22, TrackIndividually = true },
                new Kit { Id = Guid.Parse("60000000-0000-0000-0000-000000000003"), TenantId = tenantId, BranchId = heliopolisBranchId, Name = "Micro:bit Coding Set", QuantityAvailable = 14, TrackIndividually = false }
            );
        }

        // Additional Course Templates + Offering in Heliopolis/Main
        var template3Id = Guid.Parse("30000000-0000-0000-0000-000000000003");
        if (!await db.CourseTemplates.AnyAsync(t => t.Id == template3Id, cancellationToken))
        {
            db.CourseTemplates.AddRange(
                new CourseTemplate { Id = template3Id, TenantId = tenantId, Name = "Python & AI Explorers", Track = "coding", Type = "hard", AgeGroup = "10-14", Level = "intermediate", TotalSessions = 10, SessionDurationHours = 2.0m, BasePricePiastres = 380000, Status = "PUBLISHED" },
                new CourseTemplate { Id = Guid.Parse("30000000-0000-0000-0000-000000000004"), TenantId = tenantId, Name = "Leadership & Presentation Skills", Track = "soft_skills", Type = "soft", AgeGroup = "8-12", Level = "beginner", TotalSessions = 6, SessionDurationHours = 1.5m, BasePricePiastres = 210000, Status = "DRAFT" }
            );
        }

        var helioOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000002");
        var codingOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000003");
        if (!await db.CourseOfferings.AnyAsync(o => o.Id == codingOfferingId, cancellationToken))
        {
            db.CourseOfferings.Add(new CourseOffering
            {
                Id = codingOfferingId,
                TenantId = tenantId,
                BranchId = mainBranchId,
                CourseTemplateId = template3Id,
                InstructorId = mainInstructorId,
                ClassroomId = classroomMain2Id,
                StartDate = new DateOnly(2026, 10, 15),
                EndDate = new DateOnly(2026, 12, 20),
                WeeklyScheduleJson = "{\"days\":[\"TUESDAY\"],\"start\":\"16:00\",\"end\":\"18:00\"}",
                Status = "ACTIVE",
                MaxStudents = 14
            });
        }

        // Upcoming sessions for Coding offering (does not alter 40000000-...-0001 sessions)
        var session5Id = Guid.Parse("50000000-0000-0000-0000-000000000005");
        var session6Id = Guid.Parse("50000000-0000-0000-0000-000000000006");
        if (!await db.AcademySessions.AnyAsync(s => s.Id == session5Id, cancellationToken))
        {
            var baseDay = DateTime.UtcNow.Date;
            db.AcademySessions.AddRange(
                new AcademySession
                {
                    Id = session5Id,
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    CourseOfferingId = codingOfferingId,
                    SessionNumber = 1,
                    StartAt = new DateTimeOffset(baseDay.AddHours(16), TimeSpan.Zero),
                    EndAt = new DateTimeOffset(baseDay.AddHours(18), TimeSpan.Zero),
                    InstructorId = mainInstructorId,
                    ClassroomId = classroomMain2Id,
                    Type = "REGULAR",
                    Status = "SCHEDULED",
                    Notes = "حصة تطبيقية على منطق الخوارزميات"
                },
                new AcademySession
                {
                    Id = session6Id,
                    TenantId = tenantId,
                    BranchId = heliopolisBranchId,
                    CourseOfferingId = helioOfferingId,
                    SessionNumber = 2,
                    StartAt = new DateTimeOffset(baseDay.AddDays(1).AddHours(17), TimeSpan.Zero),
                    EndAt = new DateTimeOffset(baseDay.AddDays(1).AddHours(18).AddMinutes(30), TimeSpan.Zero),
                    InstructorId = mainInstructorId,
                    ClassroomId = classroomHelioId,
                    Type = "REGULAR",
                    Status = "SCHEDULED",
                    Notes = "بناء نموذج تصميم 3D مبدئي"
                }
            );
        }

        // Enroll students 5 & 6 into Coding offering so they have active enrollments
        var enrollment5Id = Guid.Parse("71000000-0000-0000-0000-000000000005");
        if (!await db.StudentEnrollments.AnyAsync(e => e.Id == enrollment5Id, cancellationToken))
        {
            db.StudentEnrollments.AddRange(
                new StudentEnrollment { Id = enrollment5Id, StudentId = Guid.Parse("70000000-0000-0000-0000-000000000005"), CourseOfferingId = codingOfferingId, FinalPricePiastres = 380000, Status = "ACTIVE" },
                new StudentEnrollment { Id = Guid.Parse("71000000-0000-0000-0000-000000000006"), StudentId = Guid.Parse("70000000-0000-0000-0000-000000000006"), CourseOfferingId = codingOfferingId, FinalPricePiastres = 380000, Status = "ACTIVE" }
            );
        }

        // Kit assignment for Coding offering session
        var kitAssign2Id = Guid.Parse("61000000-0000-0000-0000-000000000002");
        if (!await db.KitAssignments.AnyAsync(ka => ka.Id == kitAssign2Id, cancellationToken))
        {
            db.KitAssignments.Add(new KitAssignment { Id = kitAssign2Id, SessionId = session5Id, KitId = kit2Id, QuantityUsed = 6 });
        }

        // Supervision assignment on helioOfferingId & codingOfferingId (safe: P1CoreJourneyApiTests uses offeringId 0001)
        var supervisionId = Guid.Parse("45000000-0000-0000-0000-000000000001");
        if (!await db.GroupSupervisionAssignments.AnyAsync(g => g.Id == supervisionId, cancellationToken))
        {
            db.GroupSupervisionAssignments.Add(new GroupSupervisionAssignment
            {
                Id = supervisionId,
                TenantId = tenantId,
                BranchId = heliopolisBranchId,
                SupervisorUserId = headId,
                CourseOfferingId = helioOfferingId,
                CanReadAttendance = true,
                CanReadEvaluations = true,
                CanDecideEvaluations = true,
                StartsAt = DateTimeOffset.UtcNow.AddDays(-7),
                EndsAt = DateTimeOffset.UtcNow.AddDays(60),
                Status = "ACTIVE",
                CreatedByUserId = ownerId
            });
        }

        var codingSupervisionId = Guid.Parse("45000000-0000-0000-0000-000000000002");
        if (!await db.GroupSupervisionAssignments.AnyAsync(g => g.Id == codingSupervisionId, cancellationToken))
        {
            db.GroupSupervisionAssignments.Add(new GroupSupervisionAssignment
            {
                Id = codingSupervisionId,
                TenantId = tenantId,
                BranchId = mainBranchId,
                SupervisorUserId = headId,
                CourseOfferingId = codingOfferingId,
                CanReadAttendance = true,
                CanReadEvaluations = true,
                CanDecideEvaluations = true,
                StartsAt = DateTimeOffset.UtcNow.AddDays(-7),
                EndsAt = DateTimeOffset.UtcNow.AddDays(60),
                Status = "ACTIVE",
                CreatedByUserId = ownerId
            });
        }

        // Pending submitted evaluations on session1 & session5 for Head Instructor review queue
        // Use Adam (0003), Mariam (0004), and Omar (0005) so P1CoreJourneyApiTests assertions on Youssef (0001) & Lina (0002) remain isolated
        var evalSubmittedId = Guid.Parse("93000000-0000-0000-0000-000000000006");
        if (!await db.SessionEvaluations.AnyAsync(e => e.Id == evalSubmittedId, cancellationToken))
        {
            var session1Id = Guid.Parse("50000000-0000-0000-0000-000000000001");
            db.SessionEvaluations.AddRange(
                new SessionEvaluation
                {
                    Id = evalSubmittedId,
                    SessionId = session1Id,
                    StudentId = Guid.Parse("70000000-0000-0000-0000-000000000003"),
                    InstructorId = mainInstructorId,
                    Score = 84,
                    Notes = "تحسن ملحوظ في توصيل الحساسات والعمل ضمن الفريق.",
                    BonusPoints = 10,
                    GamificationBadge = "PROBLEM_SOLVER",
                    Status = "SUBMITTED",
                    SubmittedAt = DateTimeOffset.UtcNow.AddDays(-1)
                },
                new SessionEvaluation
                {
                    Id = Guid.Parse("93000000-0000-0000-0000-000000000007"),
                    SessionId = session1Id,
                    StudentId = Guid.Parse("70000000-0000-0000-0000-000000000004"),
                    InstructorId = mainInstructorId,
                    Score = 89,
                    Notes = "تنظيم ممتاز للكود وشرح واضح لفكرة المشروع.",
                    BonusPoints = 15,
                    GamificationBadge = "TEAM_LEADER",
                    Status = "SUBMITTED",
                    SubmittedAt = DateTimeOffset.UtcNow.AddDays(-1)
                },
                new SessionEvaluation
                {
                    Id = Guid.Parse("93000000-0000-0000-0000-000000000008"),
                    SessionId = session5Id,
                    StudentId = Guid.Parse("70000000-0000-0000-0000-000000000005"),
                    InstructorId = mainInstructorId,
                    Score = 93,
                    Notes = "أداء مميز في منطق الحلقات التكرارية بلغة بايثون.",
                    BonusPoints = 20,
                    GamificationBadge = "CREATIVE_THINKER",
                    Status = "SUBMITTED",
                    SubmittedAt = DateTimeOffset.UtcNow.AddHours(-6)
                }
            );
        }

        // Marketing Campaigns + Content Items
        var campaign1Id = Guid.Parse("b1000000-0000-0000-0000-000000000001");
        var campaign2Id = Guid.Parse("b1000000-0000-0000-0000-000000000002");
        if (!await db.MarketingCampaigns.AnyAsync(c => c.Id == campaign2Id, cancellationToken))
        {
            if (!await db.MarketingCampaigns.AnyAsync(c => c.Id == campaign1Id, cancellationToken))
            {
                db.MarketingCampaigns.Add(new MarketingCampaign
                {
                    Id = campaign1Id,
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    Name = "حملة العودة للمدارس — روبوتكس",
                    Channel = "META_ADS",
                    Status = "ACTIVE",
                    BudgetPiastres = 450000,
                    Notes = "استهداف أولياء الأمور في نطاق مدينة نصر ومصر الجديدة",
                    CreatedByUserId = mediaId
                });
            }

            db.MarketingCampaigns.Add(new MarketingCampaign
            {
                Id = campaign2Id,
                TenantId = tenantId,
                BranchId = heliopolisBranchId,
                Name = "ورشة الذكاء الاصطناعي التمهيدية",
                Channel = "INSTAGRAM",
                Status = "ACTIVE",
                BudgetPiastres = 280000,
                Notes = "جلسات مجانية للتعريف بمسار البرمجة",
                CreatedByUserId = mediaId
            });

            db.MarketingContentItems.AddRange(
                new MarketingContentItem { Id = Guid.Parse("b2000000-0000-0000-0000-000000000001"), TenantId = tenantId, BranchId = mainBranchId, CampaignId = campaign1Id, Title = "ريلز استعراض مشروع السيارة الذكية وتفادي العوائق", ContentType = "REEL", Platform = "INSTAGRAM", Status = "PUBLISHED", DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)), CreatedByUserId = mediaId },
                new MarketingContentItem { Id = Guid.Parse("b2000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = heliopolisBranchId, CampaignId = campaign2Id, Title = "تصميم بوست مواعيد مجموعات نوفمبر الشتوية", ContentType = "POST", Platform = "FACEBOOK", Status = "IN_REVIEW", DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)), CreatedByUserId = mediaId },
                new MarketingContentItem { Id = Guid.Parse("b2000000-0000-0000-0000-000000000003"), TenantId = tenantId, BranchId = mainBranchId, CampaignId = campaign1Id, Title = "فيديو شهادة ولي أمر الطالب يوسف حسام", ContentType = "VIDEO", Platform = "TIKTOK", Status = "DRAFT", DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)), CreatedByUserId = mediaId },
                new MarketingContentItem { Id = Guid.Parse("b2000000-0000-0000-0000-000000000004"), TenantId = tenantId, BranchId = mainBranchId, CampaignId = campaign1Id, Title = "كواليس تدريب فريق مسابقة WRO للروبوتات", ContentType = "REEL", Platform = "INSTAGRAM", Status = "IN_REVIEW", DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)), CreatedByUserId = mediaId },
                new MarketingContentItem { Id = Guid.Parse("b2000000-0000-0000-0000-000000000005"), TenantId = tenantId, BranchId = mainBranchId, CampaignId = campaign1Id, Title = "بوست إعلان فتح باب التسجيل وخصم الإخوة 15%", ContentType = "POST", Platform = "FACEBOOK", Status = "PUBLISHED", DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)), CreatedByUserId = mediaId },
                new MarketingContentItem { Id = Guid.Parse("b2000000-0000-0000-0000-000000000006"), TenantId = tenantId, BranchId = heliopolisBranchId, CampaignId = campaign2Id, Title = "رسالة واتساب برودكاست للأمهات لورشة الذكاء الاصطناعي", ContentType = "BROADCAST", Platform = "WHATSAPP", Status = "SCHEDULED", DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)), CreatedByUserId = mediaId }
            );
        }

        // Additional Leads (NEW, CONTACTED, WAITLISTED) across branches
        var lead2Id = Guid.Parse("b3000000-0000-0000-0000-000000000002");
        if (!await db.Leads.AnyAsync(l => l.Id == lead2Id, cancellationToken))
        {
            db.Leads.AddRange(
                new Lead { Id = lead2Id, TenantId = tenantId, BranchId = mainBranchId, ChildName = "تيم طارق", ParentName = "أ. طارق حسام", Phone = "+201022334455", Channel = "INSTAGRAM", Notes = "مهتم بمسار Python & AI المسائي", Status = "NEW", CampaignId = campaign2Id, CourseOfferingId = codingOfferingId, CreatedByUserId = secretaryId },
                new Lead { Id = Guid.Parse("b3000000-0000-0000-0000-000000000003"), TenantId = tenantId, BranchId = mainBranchId, ChildName = "سلمى هشام", ParentName = "د. هشام عادل", Phone = "+201099887766", Channel = "REFERRAL", Notes = "في قائمة الانتظار لمجموعة السبت الصباحية (بانتظار مقعد)", Status = "WAITLISTED", CourseOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000001"), CreatedByUserId = secretaryId },
                new Lead { Id = Guid.Parse("b3000000-0000-0000-0000-000000000004"), TenantId = tenantId, BranchId = heliopolisBranchId, ChildName = "زينب كريم", ParentName = "أ. كريم سمير", Phone = "+201144556677", Channel = "WALK_IN", Notes = "تمت معاينة المعمل وطلب المتابعة غداً", Status = "CONTACTED", CourseOfferingId = helioOfferingId, CreatedByUserId = helioSecretaryId },
                new Lead { Id = Guid.Parse("b3000000-0000-0000-0000-000000000005"), TenantId = tenantId, BranchId = mainBranchId, ChildName = "يوسف حسام علي", ParentName = "أ. حسام علي", Phone = "+201012345678", Channel = "FACEBOOK", Notes = "مهتم بدبلومة الروبوتكس | [موعد المقابلة: السبت 4:00 مساءً]", Status = "INTERESTED", CampaignId = campaign1Id, CourseOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000001"), CreatedByUserId = mediaId },
                new Lead { Id = Guid.Parse("b3000000-0000-0000-0000-000000000006"), TenantId = tenantId, BranchId = mainBranchId, ChildName = "مريم حسام الدين", ParentName = "د. حسام الدين شريف", Phone = "+201011223344", Channel = "INSTAGRAM", Notes = "اجتازت المقابلة بنجاح | [محول للسكرتارية: جاهز للتسكين الفوري بالفرع · بواسطة التسويق]", Status = "REGISTERED", CampaignId = campaign1Id, CourseOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000001"), CreatedByUserId = mediaId },
                new Lead { Id = Guid.Parse("b3000000-0000-0000-0000-000000000007"), TenantId = tenantId, BranchId = heliopolisBranchId, ChildName = "ياسين رامي فريد", ParentName = "أ. رامي فريد", Phone = "+201055667788", Channel = "WHATSAPP", Notes = "مهتم بمسار بايثون والذكاء الاصطناعي | [محول للسكرتارية: جاهز للتسكين الفوري بالفرع · بواسطة التسويق]", Status = "REGISTERED", CampaignId = campaign2Id, CourseOfferingId = helioOfferingId, CreatedByUserId = mediaId }
            );
        }

        // Pending ApprovalRequests (EXTRA session & INSTRUCTOR_SUBSTITUTION + proposal)
        var extraSessionApprovalId = Guid.Parse("84000000-0000-0000-0000-000000000003");
        if (!await db.ApprovalRequests.AnyAsync(a => a.Id == extraSessionApprovalId, cancellationToken))
        {
            var subApprovalId = Guid.Parse("84000000-0000-0000-0000-000000000004");
            db.ApprovalRequests.AddRange(
                new ApprovalRequest
                {
                    Id = extraSessionApprovalId,
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    RequestType = "EXTRA",
                    TargetType = "SESSION",
                    TargetId = session5Id.ToString(),
                    SubmittedByRole = "R03_HEAD_INSTRUCTORS",
                    State = "PENDING",
                    Reason = "طلب حصة مراجعة إضافية قبل المسابقة الوطنية"
                },
                new ApprovalRequest
                {
                    Id = subApprovalId,
                    TenantId = tenantId,
                    BranchId = heliopolisBranchId,
                    RequestType = "INSTRUCTOR_SUBSTITUTION",
                    TargetType = "SESSION",
                    TargetId = session6Id.ToString(),
                    SubmittedByRole = "R04_INSTRUCTOR",
                    State = "PENDING",
                    Reason = "تعارض موعد امتحانات جامعية للمدرب"
                }
            );

            db.SessionSubstitutionProposals.Add(new SessionSubstitutionProposal
            {
                Id = Guid.Parse("85000000-0000-0000-0000-000000000001"),
                ApprovalRequestId = subApprovalId,
                SessionId = session6Id,
                ProposedInstructorId = headId,
                SubmittedByUserId = mainInstructorId,
                Message = "تم التنسيق مع رئيس المدربين لتغطية الحصة بالكامل",
                State = "PENDING"
            });
        }

        // Pending Invoice Correction Request (for Approval Center visibility)
        var invCorrectionId = Guid.Parse("86000000-0000-0000-0000-000000000001");
        if (!await db.InvoiceCorrectionRequests.AnyAsync(c => c.Id == invCorrectionId, cancellationToken))
        {
            var invoice1Id = Guid.Parse("80000000-0000-0000-0000-000000000001");
            var corrApprovalId = Guid.Parse("84000000-0000-0000-0000-000000000005");
            db.ApprovalRequests.Add(new ApprovalRequest
            {
                Id = corrApprovalId,
                TenantId = tenantId,
                BranchId = mainBranchId,
                RequestType = "INVOICE_CORRECTION",
                TargetType = "INVOICE",
                TargetId = invoice1Id.ToString(),
                SubmittedByRole = "R06_ACCOUNTANT",
                State = "PENDING",
                Reason = "تطبيق خصم الأشقاء 10% على فاتورة الطالب آدم خالد"
            });

            db.InvoiceCorrectionRequests.Add(new InvoiceCorrectionRequest
            {
                Id = invCorrectionId,
                TenantId = tenantId,
                BranchId = mainBranchId,
                InvoiceId = invoice1Id,
                ApprovalRequestId = corrApprovalId,
                RequestedByUserId = accountantId,
                CurrentTotalPiastres = 320000,
                CurrentDueDate = new DateOnly(2026, 10, 15),
                ProposedTotalPiastres = 288000,
                ProposedDueDate = new DateOnly(2026, 10, 20),
                ProposedLinesJson = "[{\"Description\":\"رسوم كورس الروبوتكس بعد خصم الأشقاء 10%\",\"AmountPiastres\":288000}]",
                Reason = "تطبيق خصم الأشقاء 10% بناءً على طلب ولي الأمر وموافقة الفرع",
                Status = "PENDING"
            });
        }

        // Pending Freeze Request for Main Branch Secretary/Manager queue
        var freeze2Id = Guid.Parse("f1000000-0000-0000-0000-000000000002");
        if (!await db.SubscriptionFreezeRequests.AnyAsync(f => f.Id == freeze2Id, cancellationToken))
        {
            db.SubscriptionFreezeRequests.Add(new SubscriptionFreezeRequest
            {
                Id = freeze2Id,
                TenantId = tenantId,
                BranchId = mainBranchId,
                StudentId = Guid.Parse("70000000-0000-0000-0000-000000000001"),
                CourseOfferingId = Guid.Parse("40000000-0000-0000-0000-000000000001"),
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(4)),
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(11)),
                Reason = "TRAVEL",
                ReasonText = "سفر عائلي لمدة أسبوع خلال الإجازة الدراسية",
                Status = "PENDING",
                SubmittedByRole = "R08_PARENT",
                SubmittedByName = "ولي أمر يوسف أحمد",
                AffectedSessionsCount = 1,
                MakeUpCreditsAwarded = 1
            });
        }

        // Seeded Cashier Shift Handover + Confirmation AuditEvents so Shift History & Accountant Queue are populated immediately
        var shiftTarget1 = $"{DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)):yyyyMMdd}-{mainBranchId}";
        var shiftClosedExists = await db.AuditEvents.AnyAsync(
            a => a.TenantId == tenantId && a.Action == "CASHIER_SHIFT_CLOSED" && a.TargetId == shiftTarget1,
            cancellationToken);
        if (!shiftClosedExists)
        {
            var yestDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
            var yestHelioTarget = $"{yestDate:yyyyMMdd}-{heliopolisBranchId}";
            var twoDaysAgo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2));
            var olderTarget = $"{twoDaysAgo:yyyyMMdd}-{mainBranchId}";

            db.AuditEvents.AddRange(
                new AuditEvent
                {
                    Id = Guid.Parse("96000000-0000-0000-0000-000000000001"),
                    ActorUserId = secretaryId,
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    Action = "CASHIER_SHIFT_CLOSED",
                    TargetType = "SHIFT_CLOSEOUT",
                    TargetId = shiftTarget1,
                    Reason = "إغلاق الوردية المسائية — الفرع الرئيسي",
                    MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        date = yestDate,
                        shiftName = "الوردية المسائية",
                        expectedCash = 320000L,
                        countedCash = 320000L,
                        electronicPiastres = 160000L,
                        totalReceiptsCount = 3,
                        discrepancy = 0L,
                        status = "MATCHED",
                        notes = "تمت مطابقة الدرج وتسليم الخزينة دون عجز"
                    })
                },
                new AuditEvent
                {
                    Id = Guid.Parse("96000000-0000-0000-0000-000000000002"),
                    ActorUserId = helioSecretaryId,
                    TenantId = tenantId,
                    BranchId = heliopolisBranchId,
                    Action = "CASHIER_SHIFT_CLOSED",
                    TargetType = "SHIFT_CLOSEOUT",
                    TargetId = yestHelioTarget,
                    Reason = "إغلاق وردية مصر الجديدة",
                    MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        date = yestDate,
                        shiftName = "الوردية الصباحية",
                        expectedCash = 260000L,
                        countedCash = 260000L,
                        electronicPiastres = 0L,
                        totalReceiptsCount = 2,
                        discrepancy = 0L,
                        status = "MATCHED",
                        notes = "تسليم نقدي جاهز لمراجعة المحاسب"
                    })
                },
                new AuditEvent
                {
                    Id = Guid.Parse("96000000-0000-0000-0000-000000000003"),
                    ActorUserId = secretaryId,
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    Action = "CASHIER_SHIFT_CLOSED",
                    TargetType = "SHIFT_CLOSEOUT",
                    TargetId = olderTarget,
                    Reason = "إغلاق وردية سابقة — مطابق",
                    MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        date = twoDaysAgo,
                        shiftName = "الوردية الصباحية",
                        expectedCash = 190000L,
                        countedCash = 190000L,
                        electronicPiastres = 95000L,
                        totalReceiptsCount = 2,
                        discrepancy = 0L,
                        status = "MATCHED",
                        notes = "وردية سابقة مؤكدة من المحاسب"
                    })
                },
                new AuditEvent
                {
                    Id = Guid.Parse("96000000-0000-0000-0000-000000000004"),
                    ActorUserId = accountantId,
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    Action = "CASHIER_SHIFT_CONFIRMED_BY_ACCOUNTANT",
                    TargetType = "SHIFT_CLOSEOUT",
                    TargetId = olderTarget,
                    Reason = "تم استلام النقدية ومطابقة الإيصالات",
                    MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        date = twoDaysAgo,
                        confirmedByUserId = accountantId,
                        notes = "تم الاستلام والمطابقة الدفترية"
                    })
                }
            );
        }

        // Second Competition + Resolved Support Ticket + Notifications
        var comp2Id = Guid.Parse("c1000000-0000-0000-0000-000000000002");
        if (!await db.Competitions.AnyAsync(c => c.Id == comp2Id, cancellationToken))
        {
            db.Competitions.Add(new Competition
            {
                Id = comp2Id,
                TenantId = tenantId,
                Name = "Cairo Young Coders Hackathon 2026",
                Organizer = "Egypt STEM Alliance",
                Season = "2026/2027",
                Track = "coding",
                AgeMin = 10,
                AgeMax = 15,
                RegistrationDeadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20)),
                EventDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(45)),
                Location = "القاهرة الجديدة — مركز الإبداع",
                Status = "OPEN",
                Notes = "مسابقة برمجة تطبيقات الذكاء الاصطناعي للناشئين",
                CreatedByUserId = ownerId
            });
        }

        var ticket3Id = Guid.Parse("e1000000-0000-0000-0000-000000000003");
        if (!await db.PlatformSupportTickets.AnyAsync(t => t.Id == ticket3Id, cancellationToken))
        {
            db.PlatformSupportTickets.Add(new PlatformSupportTicket
            {
                Id = ticket3Id,
                TenantId = tenantId,
                BranchId = heliopolisBranchId,
                RequesterUserId = managerId,
                RequesterName = "Main Branch Manager",
                RequesterPhone = "+201000000003",
                RequesterRole = "R02_BRANCH_MANAGER",
                Subject = "تفعيل إشعارات تذكير الحصص لأولياء الأمور",
                Description = "نحتاج تأكيد تفعيل قوالب إشعارات التذكير قبل الحصة بـ 24 ساعة.",
                Category = "GENERAL",
                Priority = "LOW",
                Status = "RESOLVED",
                ResolutionNotes = "تم التفعيل وتجربة الإشعار التجريبي بنجاح.",
                ResolvedAt = DateTimeOffset.UtcNow.AddDays(-2),
                ResolvedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000001")
            });
        }

        var notif1Id = Guid.Parse("97000000-0000-0000-0000-000000000001");
        if (!await db.InAppNotifications.AnyAsync(n => n.Id == notif1Id, cancellationToken))
        {
            db.InAppNotifications.AddRange(
                new InAppNotification { Id = notif1Id, TenantId = tenantId, BranchId = mainBranchId, RecipientUserId = ownerId, Type = "APPROVAL_PENDING", Title = "3 طلبات بانتظار الاعتماد", Body = "يوجد مصروف معلق وطلب تعديل فاتورة وحصة إضافية بانتظار المراجعة.", TargetType = "APPROVAL", TargetId = extraSessionApprovalId.ToString(), IsRead = false },
                new InAppNotification { Id = Guid.Parse("97000000-0000-0000-0000-000000000002"), TenantId = tenantId, BranchId = mainBranchId, RecipientUserId = headId, Type = "EVALUATION_SUBMITTED", Title = "تقييمات جاهزة للمراجعة", Body = "أرسل المدرب الرئيسي تقييمين جديدين على حصة الروبوتكس للمراجعة والاعتماد.", TargetType = "EVALUATION", TargetId = evalSubmittedId.ToString(), IsRead = false },
                new InAppNotification { Id = Guid.Parse("97000000-0000-0000-0000-000000000003"), TenantId = tenantId, BranchId = mainBranchId, RecipientUserId = accountantId, Type = "SHIFT_HANDOVER", Title = "وردية جاهزة للاستلام والمطابقة", Body = "تم إغلاق الوردية المسائية بالفرع الرئيسي بمبلغ 3,200 ج.م.", TargetType = "SHIFT_CLOSEOUT", TargetId = shiftTarget1, IsRead = false },
                new InAppNotification { Id = Guid.Parse("97000000-0000-0000-0000-000000000004"), TenantId = tenantId, BranchId = mainBranchId, RecipientUserId = parentId, Type = "FREEZE_SUBMITTED", Title = "تم استلام طلب التجميد", Body = "طلب تجميد اشتراك الطالب يوسف أحمد قيد المراجعة من الإدارة.", TargetType = "FREEZE", TargetId = freeze2Id.ToString(), IsRead = false }
            );
        }

        // Seeded Evaluation Rubrics for all tracks
        var roboticsRubricId = Guid.Parse("98000000-0000-0000-0000-000000000001");
        if (!await db.EvaluationRubrics.AnyAsync(r => r.Id == roboticsRubricId, cancellationToken))
        {
            db.EvaluationRubrics.AddRange(
                new EvaluationRubric
                {
                    Id = roboticsRubricId,
                    TenantId = tenantId,
                    TrackKey = "robotics",
                    TrackLabel = "روبوتكس وميكاترونكس",
                    Title = "نموذج تقييم مهارات الروبوتكس والمستشعرات",
                    Description = "معايير معتمدة لقياس الدقة الميكانيكية، ربط المستشعرات، والبرمجة الحركية للروبوت.",
                    ScaleMax = 5,
                    IsActive = true,
                    IsDefault = true,
                    AuthorName = "رئيس المدربين",
                    CriteriaJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { id = "crt-101", key = "mechanical_assembly", label = "دقة التركيب والتجميع الميكانيكي", category = "TECHNICAL", categoryLabel = "مهارة فنية", maxScore = 5, weightPercent = 25, hint = "ثبات الهيكل، سلامة التروس، وتركيب المحركات في مسارها الصحيح." },
                        new { id = "crt-102", key = "sensor_programming", label = "برمجة المستشعرات واتخاذ القرار", category = "PRACTICAL", categoryLabel = "تطبيق عملي", maxScore = 5, weightPercent = 30, hint = "قراءة الحساسات وتنفيذ ردود الفعل البرمجية." },
                        new { id = "crt-103", key = "troubleshooting", label = "استكشاف الأعطال وحل المشكلات (Debugging)", category = "CREATIVE", categoryLabel = "تفكير تحليلي", maxScore = 5, weightPercent = 25, hint = "القدرة على تشخيص الخلل وإعادة تجربة الحلول المستقلة." },
                        new { id = "crt-104", key = "lab_safety_teamwork", label = "السلامة المعملية والعمل الجماعي", category = "BEHAVIORAL", categoryLabel = "سلوك وانضباط", maxScore = 5, weightPercent = 20, hint = "المحافظة على المكونات وتنظيم مساحة العمل والمشاركة البناءة." }
                    })
                },
                new EvaluationRubric
                {
                    Id = Guid.Parse("98000000-0000-0000-0000-000000000002"),
                    TenantId = tenantId,
                    TrackKey = "coding",
                    TrackLabel = "برمجة وتطوير ألعاب",
                    Title = "نموذج تقييم التفكير البرمجي وبناء الألعاب",
                    Description = "معايير تقييم خوارزميات البرمجة، التعامل مع المتغيرات والدوال، وتصميم بيئة اللعبة.",
                    ScaleMax = 5,
                    IsActive = true,
                    IsDefault = true,
                    AuthorName = "رئيس المدربين",
                    CriteriaJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { id = "crt-201", key = "algorithmic_logic", label = "التفكير الخوارزمي والمنطقي", category = "TECHNICAL", categoryLabel = "مهارة فنية", maxScore = 5, weightPercent = 35, hint = "تقسيم المشكلة البرمجية وبناء الشروط والحلقات بفعالية." },
                        new { id = "crt-202", key = "clean_code", label = "تطبيق الأكواد وبناء الوظائف", category = "PRACTICAL", categoryLabel = "تطبيق عملي", maxScore = 5, weightPercent = 35, hint = "كتابة دوال واضحة وتسمية المتغيرات دون تكرار." },
                        new { id = "crt-203", key = "ui_creativity", label = "الابتكار وتجربة المستخدم", category = "CREATIVE", categoryLabel = "إبداع وتصميم", maxScore = 5, weightPercent = 30, hint = "جماليات التصميم وتفاعل المستخدم مع المشروع النهائي." }
                    })
                },
                new EvaluationRubric
                {
                    Id = Guid.Parse("98000000-0000-0000-0000-000000000003"),
                    TenantId = tenantId,
                    TrackKey = "circuits",
                    TrackLabel = "دوائر إلكترونية وأنظمة مدمجة",
                    Title = "نموذج تقييم الإلكترونيات واللوحات المدمجة",
                    Description = "تقييم توصيل اللوحات الإلكترونية، قراءة القياسات الكهربائية، وأمان التوصيلات.",
                    ScaleMax = 5,
                    IsActive = true,
                    IsDefault = true,
                    AuthorName = "رئيس المدربين",
                    CriteriaJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { id = "crt-301", key = "circuit_wiring", label = "سلامة توصيل الدائرة الإلكترونية", category = "TECHNICAL", categoryLabel = "مهارة فنية", maxScore = 5, weightPercent = 40, hint = "توصيل المقاومات والأسلاك في اللوحة بدقة دون قصر كهربائي." },
                        new { id = "crt-302", key = "mcu_upload", label = "ربط المتحكم الدقيق واختبار الأداء", category = "PRACTICAL", categoryLabel = "تطبيق عملي", maxScore = 5, weightPercent = 35, hint = "رفع الكود واختبار الاستجابة مع المكونات المادية." },
                        new { id = "crt-303", key = "lab_discipline", label = "الالتزام بقواعد السلامة", category = "BEHAVIORAL", categoryLabel = "سلوك وانضباط", maxScore = 5, weightPercent = 25, hint = "اتباع خطوات فحص الطاقة قبل التشغيل." }
                    })
                },
                new EvaluationRubric
                {
                    Id = Guid.Parse("98000000-0000-0000-0000-000000000004"),
                    TenantId = tenantId,
                    TrackKey = "sports_swimming",
                    TrackLabel = "سباحة ورياضات مائية",
                    Title = "نموذج التقييم الحركي والفني للسباحة",
                    Description = "تقييم التوافق العضلي، تقنية التنفس والطفو، والالتزام بأنظمة الأمان داخل المسبح.",
                    ScaleMax = 5,
                    IsActive = true,
                    IsDefault = true,
                    AuthorName = "رئيس المدربين",
                    CriteriaJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { id = "crt-401", key = "stroke_technique", label = "دقة أداء الضربة وحركة الساقين", category = "TECHNICAL", categoryLabel = "تكنيك رياضي", maxScore = 5, weightPercent = 40, hint = "انسيابية الذراعين وتوقيت ضربات الرجلين." },
                        new { id = "crt-402", key = "breathing_stamina", label = "التنفس والتحمل البدني", category = "PHYSICAL", categoryLabel = "لياقة بدنية", maxScore = 5, weightPercent = 35, hint = "انتظام التنفس الجانبي والقدرة على إكمال المسافة." },
                        new { id = "crt-403", key = "pool_safety", label = "الالتزام بتعليمات الأمان", category = "BEHAVIORAL", categoryLabel = "انضباط وأمان", maxScore = 5, weightPercent = 25, hint = "الاستجابة السريعة لإشارات المدرب." }
                    })
                },
                new EvaluationRubric
                {
                    Id = Guid.Parse("98000000-0000-0000-0000-000000000005"),
                    TenantId = tenantId,
                    TrackKey = "soft_skills",
                    TrackLabel = "مهارات قيادية وشخصية",
                    Title = "نموذج تقييم المهارات الشخصية والعرض",
                    Description = "قياس مهارات التواصل، القيادة ضمن الفريق، وجودة الإلقاء والعرض التقديمي.",
                    ScaleMax = 5,
                    IsActive = true,
                    IsDefault = true,
                    AuthorName = "رئيس المدربين",
                    CriteriaJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { id = "crt-501", key = "presentation", label = "الثقة وجودة العرض والتقديم", category = "CREATIVE", categoryLabel = "تواصل وإلقاء", maxScore = 5, weightPercent = 40, hint = "وضوح الصوت، التواصل البصري، وتنظيم الأفكار." },
                        new { id = "crt-502", key = "team_leadership", label = "المبادرة والقيادة التعاونية", category = "BEHAVIORAL", categoryLabel = "عمل جماعي", maxScore = 5, weightPercent = 35, hint = "الاستماع للآخرين وتوزيع الأدوار داخل الفريق." },
                        new { id = "crt-503", key = "task_delivery", label = "إنجاز المهام في الوقت المحدد", category = "PRACTICAL", categoryLabel = "التزام عملي", maxScore = 5, weightPercent = 25, hint = "تسليم المطلوب وفق الجدول الزمني المحدد." }
                    })
                }
            );
        }

        // Seeded current-month Instructor Payroll snapshots (no extra Expenses added to keep Expenses==2 intact)
        var currentMonth = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM");
        var payrollMainId = Guid.Parse("99000000-0000-0000-0000-000000000001");
        if (!await db.InstructorPayrollRecords.AnyAsync(p => p.Id == payrollMainId, cancellationToken))
        {
            var headApprovedExists = await db.InstructorPayrollRecords.AnyAsync(
                p => p.TenantId == tenantId && p.BranchId == mainBranchId && p.InstructorId == headId && p.Month == currentMonth,
                cancellationToken);

            db.InstructorPayrollRecords.Add(new InstructorPayrollRecord
            {
                Id = payrollMainId,
                TenantId = tenantId,
                BranchId = mainBranchId,
                InstructorId = mainInstructorId,
                Month = currentMonth,
                CompletedSessionsCountSnapshot = 3,
                SubstituteSessionsCountSnapshot = 0,
                RatePerSessionPiastresSnapshot = 20_000L,
                BaseSalaryPiastres = 0L,
                BonusPiastres = 25_000L,
                BonusReason = "مكافأة تجهيز فريق المسابقة الوطنية للروبوتكس",
                DeductionPiastres = 0L,
                NetPayablePiastres = 85_000L,
                Status = "SUBMITTED"
            });

            if (!headApprovedExists)
            {
                db.InstructorPayrollRecords.Add(new InstructorPayrollRecord
                {
                    Id = Guid.Parse("99000000-0000-0000-0000-000000000002"),
                    TenantId = tenantId,
                    BranchId = mainBranchId,
                    InstructorId = headId,
                    Month = currentMonth,
                    CompletedSessionsCountSnapshot = 2,
                    SubstituteSessionsCountSnapshot = 1,
                    RatePerSessionPiastresSnapshot = 25_000L,
                    BaseSalaryPiastres = 100_000L,
                    BonusPiastres = 0L,
                    DeductionPiastres = 0L,
                    NetPayablePiastres = 150_000L,
                    Status = "APPROVED",
                    ApprovedByUserId = ownerId,
                    ApprovedAt = DateTimeOffset.UtcNow.AddDays(-1)
                });
            }
        }

        // Seeded Platform Demo Leads (LANDING_DEMO channel, isolated from academy tenant leads)
        var demoLead1Id = Guid.Parse("9a000000-0000-0000-0000-000000000001");
        if (!await db.Leads.AnyAsync(l => l.Id == demoLead1Id, cancellationToken))
        {
            db.Leads.AddRange(
                new Lead
                {
                    Id = demoLead1Id,
                    TenantId = Guid.Empty,
                    BranchId = Guid.Empty,
                    ChildName = "أكاديمية الأبطال للسباحة والجمباز",
                    ParentName = "م. طارق السعيد",
                    Phone = "+201023456789",
                    Channel = "LANDING_DEMO",
                    Status = "NEW",
                    Notes = MadaAcademy.Api.Modules.Platform.PlatformAdminEndpoints.SerializeDemoLeadMeta(
                        "tarek@champion-academy.example",
                        "3",
                        "تشتت إدارة الفروع وتعدد الجداول وحساب رواتب المدربين",
                        "مهتمون بتفعيل فروع المعادي والتجمع ونظام حساب الحصص التلقائي")
                },
                new Lead
                {
                    Id = Guid.Parse("9a000000-0000-0000-0000-000000000002"),
                    TenantId = Guid.Empty,
                    BranchId = Guid.Empty,
                    ChildName = "نادي النجوم للرياضات التنافسية",
                    ParentName = "أ. ميادة بدر",
                    Phone = "+201278901234",
                    Channel = "LANDING_DEMO",
                    Status = "DEMO_SCHEDULED",
                    Notes = MadaAcademy.Api.Modules.Platform.PlatformAdminEndpoints.SerializeDemoLeadMeta(
                        "mayada@star-gymnastics.example",
                        "2",
                        "إدارة الخزينة ومسيرات الرواتب وبوابة ولي الأمر",
                        "طلب عرض توضيحي مباشر يوم الثلاثاء")
                }
            );
        }

        // Seeded Platform Subscription Payments
        var subPay1Id = Guid.Parse("9b000000-0000-0000-0000-000000000001");
        if (!await db.PlatformSubscriptionPayments.AnyAsync(p => p.Id == subPay1Id, cancellationToken))
        {
            db.PlatformSubscriptionPayments.AddRange(
                new PlatformSubscriptionPayment
                {
                    Id = subPay1Id,
                    TenantId = tenantId,
                    AmountEgp = 15000,
                    Method = "BANK_TRANSFER",
                    ReferenceNumber = "MADA-SUB-2026-091",
                    Notes = "تجديد اشتراك باقة Growth — الربع الرابع",
                    RecordedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                    RecordedByName = "أ. عبد الرحمن شريف",
                    ReceivedAt = DateTimeOffset.UtcNow.AddDays(-18)
                },
                new PlatformSubscriptionPayment
                {
                    Id = Guid.Parse("9b000000-0000-0000-0000-000000000002"),
                    TenantId = tenantId,
                    AmountEgp = 12000,
                    Method = "INSTAPAY",
                    ReferenceNumber = "INSTA-2026-8841",
                    Notes = "دفعة تفعيل باقة إضافية وبوابة المسابقات",
                    RecordedByUserId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                    RecordedByName = "أ. عبد الرحمن شريف",
                    ReceivedAt = DateTimeOffset.UtcNow.AddDays(-5)
                }
            );
        }

        // Seeded Retention Outreach AuditEvent for showcase continuity
        var retentionAuditId = Guid.Parse("9c000000-0000-0000-0000-000000000001");
        if (!await db.AuditEvents.AnyAsync(e => e.Id == retentionAuditId, cancellationToken))
        {
            db.AuditEvents.Add(new AuditEvent
            {
                Id = retentionAuditId,
                ActorUserId = ownerId,
                TenantId = tenantId,
                BranchId = mainBranchId,
                Action = "RETENTION_OUTREACH_RECORDED",
                TargetType = "STUDENT_RETENTION",
                TargetId = "70000000-0000-0000-0000-000000000003",
                Reason = "تم التواصل هاتفياً مع ولي أمر الطالب وتنسيق حصة تعويضية هذا الأسبوع.",
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    status = "contacted",
                    note = "تم التواصل هاتفياً مع ولي أمر الطالب وتنسيق حصة تعويضية هذا الأسبوع."
                })
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
