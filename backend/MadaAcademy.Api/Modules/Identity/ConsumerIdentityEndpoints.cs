using System.Security.Claims;
using System.Text.RegularExpressions;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class ConsumerIdentityEndpoints
{
    public static IEndpointRouteBuilder MapMadaConsumerIdentityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var staff = endpoints.MapGroup("/api/v1").RequireAuthorization("staff");
        staff.MapGet("/students/{studentId:guid}/consumer-links", ListLinksAsync);
        staff.MapGet("/students/{studentId:guid}/consumer-accounts", SearchConsumerAccountsAsync);
        staff.MapPost("/students/{studentId:guid}/student-account", LinkStudentAccountAsync);
        staff.MapDelete("/students/{studentId:guid}/student-account", UnlinkStudentAccountAsync);
        staff.MapPost("/students/{studentId:guid}/guardians", LinkGuardianAsync);
        staff.MapDelete("/students/{studentId:guid}/guardians/{userAccountId:guid}", UnlinkGuardianAsync);

        var consumers = endpoints.MapGroup("/api/v1/consumer").RequireAuthorization("consumer");
        consumers.MapGet("/me/students", ListMyStudentsAsync);
        consumers.MapGet("/me/sessions", ListMySessionsAsync);
        return endpoints;
    }

    private static async Task<IResult> ListLinksAsync(Guid studentId, ClaimsPrincipal actor, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanManageLinks(actor) || !TryScope(actor, out var tenantId, out var branchId)) return Forbidden("CONSUMER_LINK_MANAGEMENT_FORBIDDEN");
        var student = await FindScopedStudentAsync(db, studentId, tenantId, branchId, cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");
        var studentAccount = await db.StudentAccountLinks.AsNoTracking().Where(item => item.StudentId == studentId && item.TenantId == tenantId)
            .Join(db.UserAccounts.AsNoTracking(), item => item.UserAccountId, account => account.Id, (item, account) => new { id = account.Id, name = account.DisplayName, account.Phone, account.Email })
            .SingleOrDefaultAsync(cancellationToken);
        var guardians = await db.GuardianStudentLinks.AsNoTracking().Where(item => item.StudentId == studentId && item.TenantId == tenantId && item.Status == "ACTIVE")
            .Join(db.UserAccounts.AsNoTracking(), item => item.UserAccountId, account => account.Id, (item, account) => new { id = account.Id, name = account.DisplayName, account.Phone, account.Email, item.Relationship, item.Status })
            .OrderBy(item => item.name).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { studentId, studentAccount, guardians, totalGuardians = guardians.Count } });
    }

    private static async Task<IResult> SearchConsumerAccountsAsync(Guid studentId, string? phone, string? accountType, ClaimsPrincipal actor, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanManageLinks(actor) || !TryScope(actor, out var tenantId, out var branchId)) return Forbidden("CONSUMER_LINK_MANAGEMENT_FORBIDDEN");
        if (string.IsNullOrWhiteSpace(accountType) || (accountType != "parent" && accountType != "student"))
            return Validation("accountType", "Account type must be parent or student.");
        if (string.IsNullOrWhiteSpace(phone)) return Validation("phone", "Phone is required.");

        var student = await FindScopedStudentAsync(db, studentId, tenantId, branchId, cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");
        var normalizedPhone = OtpChallengeStore.Normalize(ToLatinDigits(phone));
        if (!Regex.IsMatch(normalizedPhone, @"^\+[1-9][0-9]{7,14}$", RegexOptions.CultureInvariant))
            return Validation("phone", "Enter a valid international phone number.");

        var expectedRole = accountType == "parent" ? "R08_PARENT" : "R09_STUDENT";
        var accountsQuery = db.UserAccounts.AsNoTracking().Where(account =>
            account.Phone == normalizedPhone && account.AccountType == accountType && account.Status == "ACTIVE" &&
            !db.Memberships.Any(membership => membership.UserAccountId == account.Id && membership.Status == "ACTIVE" &&
                (membership.TenantId != tenantId || membership.RoleCode != expectedRole || membership.BranchId.HasValue || membership.ScopeLevel != "TENANT")));
        if (accountType == "student")
            accountsQuery = accountsQuery.Where(account => !db.StudentAccountLinks.Any(link => link.UserAccountId == account.Id && link.StudentId != studentId));

        var found = await accountsQuery.OrderBy(account => account.DisplayName).Take(5)
            .Select(account => new { id = account.Id, name = account.DisplayName, accountType = account.AccountType, phone = account.Phone })
            .ToListAsync(cancellationToken);
        var matches = found.Select(account => new { account.id, account.name, account.accountType, maskedPhone = MaskPhone(account.phone) }).ToArray();
        return Results.Ok(new { data = new { items = matches, total = matches.Length } });
    }

    private static string ToLatinDigits(string value) => new(value.Select(character => character switch
    {
        >= '\u0660' and <= '\u0669' => (char)('0' + character - '\u0660'),
        >= '\u06F0' and <= '\u06F9' => (char)('0' + character - '\u06F0'),
        _ => character
    }).ToArray());

    private static string MaskPhone(string phone) => phone.Length <= 4 ? "••••" : $"•••• {phone[^4..]}";

    private static async Task<IResult> LinkStudentAccountAsync(Guid studentId, LinkConsumerAccountRequest request, ClaimsPrincipal actor, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanManageLinks(actor) || !TryScope(actor, out var tenantId, out var branchId)) return Forbidden("CONSUMER_LINK_MANAGEMENT_FORBIDDEN");
        var student = await FindScopedStudentAsync(db, studentId, tenantId, branchId, cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");
        var account = await db.UserAccounts.SingleOrDefaultAsync(item => item.Id == request.UserAccountId && item.AccountType == "student" && item.Status == "ACTIVE", cancellationToken);
        if (account is null) return NotFound("ACTIVE_STUDENT_ACCOUNT_NOT_FOUND");
        var membershipResult = await EnsureConsumerMembershipAsync(db, account, tenantId, "R09_STUDENT", cancellationToken);
        if (membershipResult is not null) return membershipResult;
        var currentByStudent = await db.StudentAccountLinks.SingleOrDefaultAsync(item => item.StudentId == studentId, cancellationToken);
        var currentByAccount = await db.StudentAccountLinks.SingleOrDefaultAsync(item => item.UserAccountId == account.Id, cancellationToken);
        if (currentByStudent is not null && currentByStudent.UserAccountId != account.Id) return Conflict("STUDENT_ACCOUNT_ALREADY_LINKED", "This student already has a different student account.");
        if (currentByAccount is not null && currentByAccount.StudentId != studentId) return Conflict("ACCOUNT_ALREADY_LINKED", "This student account is already linked to another student.");
        if (currentByStudent is null) db.StudentAccountLinks.Add(new StudentAccountLink { TenantId = tenantId, StudentId = studentId, UserAccountId = account.Id, CreatedByUserId = ActorId(actor) });
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(actor), TenantId = tenantId, Action = "STUDENT_ACCOUNT_LINKED", TargetType = "STUDENT", TargetId = studentId.ToString(), MetadataJson = $"{{\"userAccountId\":\"{account.Id}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { studentId, userAccountId = account.Id, accountType = account.AccountType, linked = true } });
    }

    private static async Task<IResult> UnlinkStudentAccountAsync(Guid studentId, ClaimsPrincipal actor, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanManageLinks(actor) || !TryScope(actor, out var tenantId, out var branchId)) return Forbidden("CONSUMER_LINK_MANAGEMENT_FORBIDDEN");
        var student = await FindScopedStudentAsync(db, studentId, tenantId, branchId, cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");
        var link = await db.StudentAccountLinks.SingleOrDefaultAsync(item => item.StudentId == studentId && item.TenantId == tenantId, cancellationToken);
        if (link is null) return NotFound("STUDENT_ACCOUNT_LINK_NOT_FOUND");
        var accountId = link.UserAccountId;
        db.StudentAccountLinks.Remove(link);
        var membership = await db.Memberships.SingleOrDefaultAsync(item => item.UserAccountId == accountId && item.TenantId == tenantId && item.RoleCode == "R09_STUDENT", cancellationToken);
        if (membership is not null) membership.Status = "REVOKED";
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(actor), TenantId = tenantId, Action = "STUDENT_ACCOUNT_UNLINKED", TargetType = "STUDENT", TargetId = studentId.ToString(), MetadataJson = $"{{\"userAccountId\":\"{accountId}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> LinkGuardianAsync(Guid studentId, LinkGuardianRequest request, ClaimsPrincipal actor, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanManageLinks(actor) || !TryScope(actor, out var tenantId, out var branchId)) return Forbidden("CONSUMER_LINK_MANAGEMENT_FORBIDDEN");
        var student = await FindScopedStudentAsync(db, studentId, tenantId, branchId, cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");
        if (string.IsNullOrWhiteSpace(request.Relationship) || request.Relationship.Trim().Length > 64) return Validation("relationship", "Relationship is required and must be at most 64 characters.");
        var account = await db.UserAccounts.SingleOrDefaultAsync(item => item.Id == request.UserAccountId && item.AccountType == "parent" && item.Status == "ACTIVE", cancellationToken);
        if (account is null) return NotFound("ACTIVE_PARENT_ACCOUNT_NOT_FOUND");
        var membershipResult = await EnsureConsumerMembershipAsync(db, account, tenantId, "R08_PARENT", cancellationToken);
        if (membershipResult is not null) return membershipResult;
        var link = await db.GuardianStudentLinks.SingleOrDefaultAsync(item => item.StudentId == studentId && item.UserAccountId == account.Id, cancellationToken);
        if (link is null)
            db.GuardianStudentLinks.Add(new GuardianStudentLink { TenantId = tenantId, StudentId = studentId, UserAccountId = account.Id, CreatedByUserId = ActorId(actor), Relationship = request.Relationship.Trim(), Status = "ACTIVE" });
        else
        {
            if (link.TenantId != tenantId) return Conflict("CONSUMER_LINK_SCOPE_CONFLICT", "The existing link does not belong to this academy.");
            link.Relationship = request.Relationship.Trim();
            link.Status = "ACTIVE";
        }
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(actor), TenantId = tenantId, Action = "GUARDIAN_STUDENT_LINKED", TargetType = "STUDENT", TargetId = studentId.ToString(), MetadataJson = $"{{\"userAccountId\":\"{account.Id}\",\"relationship\":\"{request.Relationship.Trim()}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { studentId, userAccountId = account.Id, relationship = request.Relationship.Trim(), linked = true } });
    }

    private static async Task<IResult> UnlinkGuardianAsync(Guid studentId, Guid userAccountId, ClaimsPrincipal actor, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!CanManageLinks(actor) || !TryScope(actor, out var tenantId, out var branchId)) return Forbidden("CONSUMER_LINK_MANAGEMENT_FORBIDDEN");
        var student = await FindScopedStudentAsync(db, studentId, tenantId, branchId, cancellationToken);
        if (student is null) return NotFound("STUDENT_NOT_FOUND");
        var link = await db.GuardianStudentLinks.SingleOrDefaultAsync(item => item.StudentId == studentId && item.UserAccountId == userAccountId && item.TenantId == tenantId && item.Status == "ACTIVE", cancellationToken);
        if (link is null) return NotFound("GUARDIAN_LINK_NOT_FOUND");
        link.Status = "REVOKED";
        var stillLinked = await db.GuardianStudentLinks.AnyAsync(item => item.UserAccountId == userAccountId && item.TenantId == tenantId && item.Status == "ACTIVE" && item.StudentId != studentId, cancellationToken);
        if (!stillLinked)
        {
            var membership = await db.Memberships.SingleOrDefaultAsync(item => item.UserAccountId == userAccountId && item.TenantId == tenantId && item.RoleCode == "R08_PARENT", cancellationToken);
            if (membership is not null) membership.Status = "REVOKED";
        }
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(actor), TenantId = tenantId, Action = "GUARDIAN_STUDENT_UNLINKED", TargetType = "STUDENT", TargetId = studentId.ToString(), MetadataJson = $"{{\"userAccountId\":\"{userAccountId}\"}}" });
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ListMyStudentsAsync(ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!TryConsumer(user, out var accountId, out var tenantId, out var accountType)) return Forbidden("CONSUMER_IDENTITY_REQUIRED");
        var items = accountType == "parent"
            ? await db.GuardianStudentLinks.AsNoTracking().Where(link => link.UserAccountId == accountId && link.TenantId == tenantId && link.Status == "ACTIVE")
                .Join(db.Students.AsNoTracking(), link => link.StudentId, student => student.Id, (link, student) => new { student.Id, student.FullName, student.BranchId, Relationship = link.Relationship })
                .Where(item => item.FullName != null).OrderBy(item => item.FullName).ToListAsync(cancellationToken)
            : await db.StudentAccountLinks.AsNoTracking().Where(link => link.UserAccountId == accountId && link.TenantId == tenantId)
                .Join(db.Students.AsNoTracking(), link => link.StudentId, student => student.Id, (link, student) => new { student.Id, student.FullName, student.BranchId, Relationship = "SELF" })
                .Where(item => item.FullName != null).ToListAsync(cancellationToken);
        var branchIds = items.Select(item => item.BranchId).Distinct().ToArray();
        var branches = await db.Branches.AsNoTracking().Where(item => branchIds.Contains(item.Id)).ToDictionaryAsync(item => item.Id, item => item.Name, cancellationToken);
        return Results.Ok(new { data = new { items = items.Select(item => new { id = item.Id, name = item.FullName, branchId = item.BranchId, branchName = branches.GetValueOrDefault(item.BranchId), relationship = item.Relationship }), total = items.Count } });
    }

    private static async Task<IResult> ListMySessionsAsync(ClaimsPrincipal user, MadaDbContext db, Guid? studentId, CancellationToken cancellationToken)
    {
        if (!TryConsumer(user, out var accountId, out var tenantId, out var accountType)) return Forbidden("CONSUMER_IDENTITY_REQUIRED");
        var linkedStudents = accountType == "parent"
            ? await db.GuardianStudentLinks.AsNoTracking().Where(link => link.UserAccountId == accountId && link.TenantId == tenantId && link.Status == "ACTIVE").Select(link => link.StudentId).ToListAsync(cancellationToken)
            : await db.StudentAccountLinks.AsNoTracking().Where(link => link.UserAccountId == accountId && link.TenantId == tenantId).Select(link => link.StudentId).ToListAsync(cancellationToken);
        if (studentId.HasValue && !linkedStudents.Contains(studentId.Value)) return NotFound("STUDENT_NOT_FOUND");
        var scopedStudents = studentId.HasValue ? [studentId.Value] : linkedStudents;
        if (scopedStudents.Count == 0) return Results.Ok(new { data = new { items = Array.Empty<object>(), total = 0 } });
        var enrollmentRows = await db.StudentEnrollments.AsNoTracking().Where(item => scopedStudents.Contains(item.StudentId) && item.Status == "ACTIVE")
            .Select(item => new { item.StudentId, item.CourseOfferingId }).ToListAsync(cancellationToken);
        var offeringIds = enrollmentRows.Select(item => item.CourseOfferingId).Distinct().ToArray();
        if (offeringIds.Length == 0) return Results.Ok(new { data = new { items = Array.Empty<object>(), total = 0 } });
        var sessions = await (from session in db.AcademySessions.AsNoTracking()
                              join offering in db.CourseOfferings.AsNoTracking() on session.CourseOfferingId equals offering.Id
                              join template in db.CourseTemplates.AsNoTracking() on offering.CourseTemplateId equals template.Id
                              join branch in db.Branches.AsNoTracking() on session.BranchId equals branch.Id
                              join classroom in db.Classrooms.AsNoTracking() on session.ClassroomId equals classroom.Id
                              where session.TenantId == tenantId && offeringIds.Contains(offering.Id) && session.Status != "CANCELLED"
                                    && offering.TenantId == tenantId && offering.BranchId == session.BranchId
                                    && template.TenantId == tenantId && branch.TenantId == tenantId
                              orderby session.StartAt descending
                              select new { session.Id, session.CourseOfferingId, session.SessionNumber, session.StartAt, session.EndAt, session.Status, courseName = template.Name, branchName = branch.Name, classroomName = classroom.Name })
            .ToListAsync(cancellationToken);
        var sessionIds = sessions.Select(item => item.Id).ToArray();
        var enrollmentsByOffering = enrollmentRows.GroupBy(item => item.CourseOfferingId).ToDictionary(group => group.Key, group => group.Select(item => item.StudentId).ToArray());
        var attendance = await db.SessionAttendances.AsNoTracking().Where(item => sessionIds.Contains(item.SessionId) && scopedStudents.Contains(item.StudentId)).ToDictionaryAsync(item => new { item.SessionId, item.StudentId }, cancellationToken);
        var publishedEvaluations = await db.SessionEvaluations.AsNoTracking()
            .Where(item => sessionIds.Contains(item.SessionId) && scopedStudents.Contains(item.StudentId) && item.Status == "PUBLISHED")
            .Select(item => new { item.SessionId, item.StudentId, item.Score, item.Notes })
            .ToDictionaryAsync(item => (item.SessionId, item.StudentId), cancellationToken);
        var names = await db.Students.AsNoTracking().Where(item => scopedStudents.Contains(item.Id)).ToDictionaryAsync(item => item.Id, item => item.FullName, cancellationToken);
        var items = sessions.SelectMany(session => enrollmentsByOffering.GetValueOrDefault(session.CourseOfferingId!.Value, [])
            .Where(id => scopedStudents.Contains(id)).Select(id =>
            {
                publishedEvaluations.TryGetValue((session.Id, id), out var evaluation);
                return new
                {
                    sessionId = session.Id, studentId = id, studentName = names.GetValueOrDefault(id),
                    session.SessionNumber, session.StartAt, session.EndAt, session.Status, session.courseName, session.branchName, session.classroomName,
                    attendanceStatus = attendance.TryGetValue(new { SessionId = session.Id, StudentId = id }, out var mark) ? mark.Status : "UNMARKED",
                    score = evaluation?.Score,
                    notes = evaluation?.Notes
                };
            })).OrderByDescending(item => item.StartAt).ToList();
        return Results.Ok(new { data = new { items, total = items.Count } });
    }

    private static async Task<IResult?> EnsureConsumerMembershipAsync(MadaDbContext db, UserAccount account, Guid tenantId, string roleCode, CancellationToken cancellationToken)
    {
        var allMemberships = await db.Memberships.Where(item => item.UserAccountId == account.Id).ToListAsync(cancellationToken);
        var memberships = allMemberships.Where(item => item.Status == "ACTIVE").ToList();
        if (memberships.Any(item => item.TenantId != tenantId || item.RoleCode != roleCode))
            return Conflict("CONSUMER_ACCOUNT_SCOPE_CONFLICT", "The consumer account already has a different active academy or role.");
        var membership = allMemberships.FirstOrDefault(item => item.TenantId == tenantId && item.RoleCode == roleCode);
        if (membership is null)
            db.Memberships.Add(new Membership { UserAccountId = account.Id, TenantId = tenantId, RoleCode = roleCode, ScopeLevel = "TENANT", Status = "ACTIVE" });
        else if (membership.BranchId.HasValue || membership.ScopeLevel != "TENANT")
            return Conflict("CONSUMER_MEMBERSHIP_SCOPE_INVALID", "Consumer memberships must be tenant scoped; record-level links enforce access to individual students.");
        else membership.Status = "ACTIVE";
        return null;
    }

    private static async Task<Student?> FindScopedStudentAsync(MadaDbContext db, Guid studentId, Guid tenantId, Guid? branchId, CancellationToken cancellationToken) =>
        await db.Students.SingleOrDefaultAsync(item => item.Id == studentId && item.TenantId == tenantId && (!branchId.HasValue || item.BranchId == branchId.Value), cancellationToken);

    private static bool TryConsumer(ClaimsPrincipal user, out Guid accountId, out Guid tenantId, out string accountType)
    {
        accountId = Guid.Empty;
        tenantId = Guid.Empty;
        accountType = user.FindFirstValue("accountType") ?? string.Empty;
        var role = user.FindFirstValue("role");
        var validRole = (accountType == "parent" && role == "R08_PARENT") || (accountType == "student" && role == "R09_STUDENT");
        return validRole && Guid.TryParse(user.FindFirstValue("sub"), out accountId) && Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId);
    }

    private static bool TryScope(ClaimsPrincipal user, out Guid tenantId, out Guid? branchId)
    {
        branchId = Guid.TryParse(user.FindFirstValue("branchId"), out var parsed) ? parsed : null;
        tenantId = Guid.Empty;
        return Guid.TryParse(user.FindFirstValue("tenantId"), out tenantId);
    }

    private static bool CanManageLinks(ClaimsPrincipal user) => user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER") || user.IsInRole("R05_SECRETARY");
    private static Guid? ActorId(ClaimsPrincipal user) => Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;
    private static IResult Forbidden(string code) => Results.Problem(statusCode: 403, title: code, extensions: new Dictionary<string, object?> { ["code"] = code });
    private static IResult NotFound(string code) => Results.NotFound(new { error = new { code, message = code } });
    private static IResult Conflict(string code, string message) => Results.Conflict(new { error = new { code, message } });
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
}

public sealed record LinkConsumerAccountRequest(Guid UserAccountId);
public sealed record LinkGuardianRequest(Guid UserAccountId, string Relationship);
