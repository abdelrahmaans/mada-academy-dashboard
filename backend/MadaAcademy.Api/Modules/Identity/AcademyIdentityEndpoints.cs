using System.Net.Mail;
using System.Security.Claims;
using System.Text.RegularExpressions;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Identity;

public static class AcademyIdentityEndpoints
{
    public static IEndpointRouteBuilder MapMadaAcademyIdentityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1");

        api.MapPost("/platform/academies", BootstrapAcademyAsync)
            .RequireAuthorization("platform-admin");

        api.MapGet("/me", GetMeAsync)
            .RequireAuthorization();

        return endpoints;
    }

    private static async Task<IResult> BootstrapAcademyAsync(
        BootstrapAcademyRequest request,
        ClaimsPrincipal actor,
        MadaDbContext db,
        PasswordHashService passwords,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null) return validation;

        var slug = NormalizeSlug(request.Slug ?? request.Name);
        var phone = OtpChallengeStore.Normalize(request.Owner.Phone);
        var email = request.Owner.Email.Trim().ToLowerInvariant();
        var branchCode = request.PrimaryBranch.Code.Trim().ToUpperInvariant();
        var planCode = string.IsNullOrWhiteSpace(request.PlanCode) ? "STARTER" : request.PlanCode.Trim().ToUpperInvariant();

        if (await db.Tenants.AnyAsync(item => item.Slug == slug, cancellationToken))
            return Results.Conflict(new { error = new { code = "ACADEMY_SLUG_EXISTS", message = "An academy with this slug already exists." } });
        if (await db.UserAccounts.AnyAsync(item => item.Email == email, cancellationToken))
            return Results.Conflict(new { error = new { code = "OWNER_EMAIL_EXISTS", message = "The owner email is already registered." } });
        if (await db.UserAccounts.AnyAsync(item => item.Phone == phone && item.AccountType == "staff", cancellationToken))
            return Results.Conflict(new { error = new { code = "OWNER_PHONE_EXISTS", message = "The owner phone is already registered." } });

        var tenant = new Tenant { Name = request.Name.Trim(), Slug = slug, PlanCode = planCode };
        var branch = new Branch { TenantId = tenant.Id, Name = request.PrimaryBranch.Name.Trim(), Code = branchCode };
        var owner = new UserAccount
        {
            Email = email,
            Phone = phone,
            DisplayName = request.Owner.FullName.Trim(),
            AccountType = "staff",
            PasswordHash = passwords.Hash(request.Owner.Password),
            Status = "ACTIVE"
        };
        var membership = new Membership
        {
            UserAccountId = owner.Id,
            TenantId = tenant.Id,
            RoleCode = "R01_ACADEMY_OWNER",
            ScopeLevel = "TENANT",
            Status = "ACTIVE"
        };
        var actorId = Guid.TryParse(actor.FindFirstValue("sub"), out var parsedActorId) ? parsedActorId : (Guid?)null;
        var audit = new AuditEvent
        {
            ActorUserId = actorId,
            TenantId = tenant.Id,
            Action = "ACADEMY_BOOTSTRAPPED",
            TargetType = "TENANT",
            TargetId = tenant.Id.ToString(),
            MetadataJson = $"{{\"slug\":\"{slug}\",\"ownerUserId\":\"{owner.Id}\"}}"
        };

        db.Add(tenant);
        db.Add(branch);
        db.Add(owner);
        db.Add(membership);
        db.Add(audit);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/v1/academy/{tenant.Id}", new
        {
            data = new
            {
                academy = new { id = tenant.Id, tenant.Name, tenant.Slug, tenant.Status, tenant.PlanCode },
                primaryBranch = new { id = branch.Id, branch.TenantId, branch.Name, branch.Code, branch.Status },
                owner = new { id = owner.Id, owner.DisplayName, owner.Email, owner.Phone, role = membership.RoleCode },
                nextStep = "OWNER_LOGIN_REQUIRED"
            }
        });
    }

    private static async Task<IResult> GetMeAsync(
        ClaimsPrincipal principal,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal.FindFirstValue("sub"), out var userId) ||
            !Guid.TryParse(principal.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing identity scope", extensions: new Dictionary<string, object?> { ["code"] = "MISSING_IDENTITY_SCOPE" });

        var accountType = principal.FindFirstValue("accountType") ?? string.Empty;
        var role = principal.FindFirstValue("role") ?? string.Empty;
        if (accountType is not ("staff" or "parent" or "student") ||
            accountType == "parent" && role != "R08_PARENT" ||
            accountType == "student" && role != "R09_STUDENT")
            return Results.Problem(statusCode: 403, title: "Invalid account role", extensions: new Dictionary<string, object?> { ["code"] = "INVALID_ACCOUNT_ROLE" });
        var membership = await db.Memberships.AsNoTracking()
            .Include(item => item.UserAccount)
            .Include(item => item.Tenant)
            .Include(item => item.Branch)
            .Where(item => item.UserAccountId == userId && item.TenantId == tenantId && item.RoleCode == role && item.Status == "ACTIVE")
            .OrderBy(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (membership?.UserAccount is null || membership.Tenant is null)
            return Results.Problem(statusCode: 403, title: "Active membership not found", extensions: new Dictionary<string, object?> { ["code"] = "ACTIVE_MEMBERSHIP_NOT_FOUND" });

        var scopeLevel = membership.ScopeLevel;
        var branchesQuery = db.Branches.AsNoTracking().Where(item => item.TenantId == tenantId && item.Status == "ACTIVE");
        if (membership.BranchId.HasValue) branchesQuery = branchesQuery.Where(item => item.Id == membership.BranchId.Value);
        var branches = await branchesQuery.OrderBy(item => item.Name)
            .Select(item => new { item.Id, item.Name, item.Code, item.Status })
            .ToListAsync(cancellationToken);

        return Results.Ok(new
        {
            data = new
            {
                id = userId,
                accountType = membership.UserAccount.AccountType,
                role = membership.RoleCode,
                roleLabel = RoleLabels.TryGetValue(membership.RoleCode, out var roleLabel) ? roleLabel : membership.RoleCode,
                tenantId,
                branchId = membership.BranchId,
                scopeLevel,
                permissions = PermissionsFor(membership.RoleCode),
                user = new { membership.UserAccount.Id, membership.UserAccount.DisplayName, membership.UserAccount.Email, membership.UserAccount.Phone },
                academy = new { membership.Tenant.Id, membership.Tenant.Name, membership.Tenant.Slug, membership.Tenant.Status, membership.Tenant.PlanCode },
                branches = accountType == "staff" ? branches : []
            }
        });
    }

    private static IResult? Validate(BootstrapAcademyRequest request)
    {
        if (request is null || request.PrimaryBranch is null || request.Owner is null)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["request"] = ["Academy, primary branch, and owner details are required."] });
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length is < 2 or > 160)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Academy name must be between 2 and 160 characters."] });
        if (string.IsNullOrWhiteSpace(request.PrimaryBranch.Name) || request.PrimaryBranch.Name.Trim().Length is < 2 or > 160)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["primaryBranch.name"] = ["Primary branch name is required."] });
        if (string.IsNullOrWhiteSpace(request.PrimaryBranch.Code) || request.PrimaryBranch.Code.Trim().Length is < 2 or > 40)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["primaryBranch.code"] = ["Primary branch code must be between 2 and 40 characters."] });
        if (string.IsNullOrWhiteSpace(request.Owner.FullName) || request.Owner.FullName.Trim().Length is < 2 or > 160)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["owner.fullName"] = ["Owner full name is required."] });
        if (string.IsNullOrWhiteSpace(request.Owner.Password) || request.Owner.Password.Length < 8)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["owner.password"] = ["Owner password must be at least 8 characters."] });
        if (string.IsNullOrWhiteSpace(request.Owner.Phone) || OtpChallengeStore.Normalize(request.Owner.Phone).Length < 8)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["owner.phone"] = ["A valid owner phone is required."] });
        try { _ = new MailAddress(request.Owner.Email); }
        catch { return Results.ValidationProblem(new Dictionary<string, string[]> { ["owner.email"] = ["A valid owner email is required."] }); }
        if (!string.IsNullOrWhiteSpace(request.PlanCode) && request.PlanCode.Trim().ToUpperInvariant() is not ("STARTER" or "GROWTH" or "SCALE"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["planCode"] = ["Plan code must be STARTER, GROWTH, or SCALE."] });
        var slug = NormalizeSlug(request.Slug ?? request.Name);
        return slug.Length is < 2 or > 80
            ? Results.ValidationProblem(new Dictionary<string, string[]> { ["slug"] = ["Slug must contain at least 2 URL-safe characters."] })
            : null;
    }

    private static string NormalizeSlug(string value)
        => Regex.Replace(value.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');

    private static string[] PermissionsFor(string role) => role switch
    {
        "R00_PLATFORM_ADMIN" => ["platform.read", "academy.create", "academy.read", "academy.archive"],
        "R01_ACADEMY_OWNER" => ["academy.read", "academy.update", "branch.read", "branch.create", "classrooms.manage", "staff.read", "staff.invite", "roles.read", "roles.manage", "reports.read"],
        "R02_BRANCH_MANAGER" => ["branch.read", "students.read", "students.create", "sessions.read", "sessions.create", "attendance.read", "attendance.write"],
        "R03_HEAD_INSTRUCTORS" => ["branch.read", "sessions.read", "attendance.read", "attendance.write", "evaluations.write", "evaluations.review"],
        "R04_INSTRUCTOR" => ["sessions.assigned.read", "attendance.read", "attendance.write", "evaluations.write"],
        "R08_PARENT" => ["consumer.students.read", "consumer.sessions.read", "consumer.evaluations.read"],
        "R09_STUDENT" => ["consumer.self.read", "consumer.sessions.read", "consumer.evaluations.read"],
        _ => []
    };

    private static readonly Dictionary<string, string> RoleLabels = new()
    {
        ["R00_PLATFORM_ADMIN"] = "مسؤول المنصة",
        ["R01_ACADEMY_OWNER"] = "مسؤول الأكاديمية",
        ["R02_BRANCH_MANAGER"] = "مدير الفرع",
        ["R03_HEAD_INSTRUCTORS"] = "رئيس المدربين",
        ["R04_INSTRUCTOR"] = "المدرب"
        , ["R08_PARENT"] = "ولي الأمر",
        ["R09_STUDENT"] = "الطالب"
    };
}

public sealed record BootstrapAcademyRequest(
    string Name,
    string? Slug,
    string? PlanCode,
    BootstrapBranchInput PrimaryBranch,
    BootstrapOwnerInput Owner);

public sealed record BootstrapBranchInput(string Name, string Code);
public sealed record BootstrapOwnerInput(string FullName, string Phone, string Email, string Password);
