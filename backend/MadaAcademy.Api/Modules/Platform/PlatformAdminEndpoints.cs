using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Platform;

public static class PlatformAdminEndpoints
{
    public static IEndpointRouteBuilder MapMadaPlatformAdminEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1/platform").RequireAuthorization("platform-admin");
        api.MapGet("/overview", GetOverviewAsync);
        api.MapGet("/academies", GetAcademiesAsync);
        api.MapGet("/roles", () => GetPlatformRoles());
        api.MapPatch("/academies/{tenantId:guid}/status", ChangeTenantStatusAsync);
        api.MapPatch("/academies/{tenantId:guid}/plan", ChangeTenantPlanAsync);
        api.MapPost("/academies/{tenantId:guid}/trial/extend", ExtendTenantTrialAsync);
        api.MapPost("/academies/{tenantId:guid}/owner-reset", ResetTenantOwnerPasswordAsync);
        api.MapGet("/academies/{tenantId:guid}/features", GetAcademyFeaturesAsync);
        api.MapPatch("/academies/{tenantId:guid}/features", UpdateAcademyFeaturesAsync);
        api.MapGet("/academies/{tenantId:guid}/members", GetMembersAsync);
        api.MapPatch("/academies/{tenantId:guid}/members/{membershipId:guid}/status", ChangeMemberStatusAsync);
        api.MapPost("/academies/{tenantId:guid}/users/{userId:guid}/sessions/revoke", RevokeSessionsAsync);
        api.MapGet("/academies/{tenantId:guid}/activity", GetAcademyActivityAsync);
        api.MapGet("/activity", GetPlatformActivityAsync);
        api.MapGet("/payments", GetPlatformPaymentsAsync);
        api.MapPost("/academies/{tenantId:guid}/payments", RecordSubscriptionPaymentAsync);
        api.MapGet("/demo-leads", GetPlatformDemoLeadsAsync);
        api.MapPatch("/demo-leads/{leadId:guid}/status", UpdatePlatformDemoLeadStatusAsync);
        api.MapPost("/demo-leads/{leadId:guid}/convert", ConvertPlatformDemoLeadAsync);
        api.MapGet("/support-tickets", GetPlatformTicketsAsync);
        api.MapPatch("/support-tickets/{ticketId:guid}", UpdatePlatformTicketAsync);

        endpoints.MapPost("/api/v1/public/demo-requests", CreatePublicDemoRequestAsync)
            .AllowAnonymous()
            .RequireRateLimiting("public-lead");
        endpoints.MapGet("/api/v1/academy/my-features", GetMyFeaturesAsync).RequireAuthorization();
        endpoints.MapPost("/api/v1/academy/support-tickets", CreateTenantSupportTicketAsync).RequireAuthorization();
        endpoints.MapGet("/api/v1/academy/support-tickets", GetTenantSupportTicketsAsync).RequireAuthorization();
        return endpoints;
    }

    private static async Task<IResult> GetOverviewAsync(MadaDbContext db, CancellationToken cancellationToken)
    {
        var tenants = await db.Tenants.AsNoTracking().ToListAsync(cancellationToken);
        var users = await db.UserAccounts.AsNoTracking().CountAsync(x => x.AccountType == "staff", cancellationToken);
        var openSessions = await db.RefreshSessions.AsNoTracking().CountAsync(x => x.RevokedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken);
        var activity = await db.AuditEvents.AsNoTracking().CountAsync(cancellationToken);
        return Results.Ok(new { data = new
        {
            academies = tenants.Count,
            activeAcademies = tenants.Count(x => x.Status == "ACTIVE"),
            trialAcademies = tenants.Count(x => x.Status == "TRIAL"),
            attentionAcademies = tenants.Count(x => x.Status is "SETUP" or "PAUSED"),
            staffAccounts = users,
            activeSessions = openSessions,
            auditEvents = activity
        }});
    }

    private static async Task<IResult> GetAcademiesAsync(MadaDbContext db, CancellationToken cancellationToken)
    {
        var rawTenants = await db.Tenants.AsNoTracking().OrderBy(x => x.Name).Select(tenant => new
        {
            id = tenant.Id,
            name = tenant.Name,
            slug = tenant.Slug,
            status = tenant.Status,
            plan = tenant.PlanCode,
            createdAt = tenant.CreatedAt,
            branches = db.Branches.Count(branch => branch.TenantId == tenant.Id),
            users = db.Memberships.Count(member => member.TenantId == tenant.Id && member.Status == "ACTIVE"),
            owner = db.Memberships.Where(member => member.TenantId == tenant.Id && member.RoleCode == "R01_ACADEMY_OWNER" && member.Status == "ACTIVE").Select(member => member.UserAccount!.DisplayName).FirstOrDefault(),
            ownerPhone = db.Memberships.Where(member => member.TenantId == tenant.Id && member.RoleCode == "R01_ACADEMY_OWNER" && member.Status == "ACTIVE").Select(member => member.UserAccount!.Phone).FirstOrDefault(),
            ownerEmail = db.Memberships.Where(member => member.TenantId == tenant.Id && member.RoleCode == "R01_ACADEMY_OWNER" && member.Status == "ACTIVE").Select(member => member.UserAccount!.Email).FirstOrDefault()
        }).ToListAsync(cancellationToken);

        var paymentSums = await db.PlatformSubscriptionPayments.AsNoTracking()
            .GroupBy(p => p.TenantId)
            .Select(g => new { TenantId = g.Key, TotalPaid = g.Sum(x => x.AmountEgp) })
            .ToDictionaryAsync(x => x.TenantId, x => x.TotalPaid, cancellationToken);

        var tenantAuditMeta = await db.AuditEvents.AsNoTracking()
            .Where(e => e.TenantId != null && (e.Action == "PLATFORM_TENANT_TRIAL_EXTENDED" || e.Action == "PLATFORM_TENANT_PLAN_CHANGED"))
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new { TenantId = e.TenantId!.Value, e.Action, e.MetadataJson })
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var academies = rawTenants.Select(tenant =>
        {
            var latestPlanAudit = tenantAuditMeta.FirstOrDefault(a => a.TenantId == tenant.id && a.Action == "PLATFORM_TENANT_PLAN_CHANGED");
            int? overrideBranches = null;
            if (!string.IsNullOrWhiteSpace(latestPlanAudit?.MetadataJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(latestPlanAudit.MetadataJson);
                    if (doc.RootElement.TryGetProperty("allowedBranches", out var bProp) && bProp.TryGetInt32(out var bVal))
                        overrideBranches = bVal;
                }
                catch { /* ignore malformed metadata */ }
            }
            var defaultBranches = tenant.plan.ToUpperInvariant() switch
            {
                "STARTER" => 1,
                "GROWTH" => 3,
                "ENTERPRISE" or "SCALE" => 99,
                _ => 3
            };
            var trialAudits = tenantAuditMeta.Where(a => a.TenantId == tenant.id && a.Action == "PLATFORM_TENANT_TRIAL_EXTENDED").ToList();
            DateTimeOffset? trialEnd = tenant.status == "TRIAL" ? tenant.createdAt.AddDays(14) : null;
            if (trialAudits.Count > 0 && !string.IsNullOrWhiteSpace(trialAudits[0].MetadataJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(trialAudits[0].MetadataJson!);
                    if (doc.RootElement.TryGetProperty("newEndDate", out var endProp) && DateTimeOffset.TryParse(endProp.GetString(), out var parsedEnd))
                        trialEnd = parsedEnd;
                }
                catch { /* ignore malformed metadata */ }
            }
            int? remainingTrialDays = trialEnd.HasValue
                ? Math.Max(0, (int)Math.Ceiling((trialEnd.Value - now).TotalDays))
                : null;

            return new
            {
                tenant.id,
                tenant.name,
                tenant.slug,
                tenant.status,
                tenant.plan,
                planCode = tenant.plan,
                allowedBranches = overrideBranches ?? Math.Max(defaultBranches, tenant.branches),
                isTrialExtended = trialAudits.Count > 0,
                remainingTrialDays,
                totalPaidAmount = paymentSums.TryGetValue(tenant.id, out var paid) ? paid : 0L,
                tenant.createdAt,
                tenant.branches,
                tenant.users,
                tenant.owner,
                ownerPhone = tenant.ownerPhone,
                ownerEmail = tenant.ownerEmail
            };
        }).ToList();

        return Results.Ok(new { data = new { items = academies, total = academies.Count } });
    }

    private static async Task<IResult> ChangeTenantStatusAsync(Guid tenantId, TenantStatusRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (request.Status is not ("ACTIVE" or "TRIAL" or "SETUP" or "PAUSED")) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Status must be ACTIVE, TRIAL, SETUP, or PAUSED."] });
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4) return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for every support action."] });
        var tenant = await db.Tenants.SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        var previous = tenant.Status;
        tenant.Status = request.Status;
        var revokedSessions = 0;
        if (tenant.Status == "PAUSED" && previous != "PAUSED")
        {
            var tenantUserIds = db.Memberships.Where(item => item.TenantId == tenant.Id).Select(item => item.UserAccountId);
            var sessions = await db.RefreshSessions.Where(item => tenantUserIds.Contains(item.UserAccountId) && item.RevokedAt == null).ToListAsync(cancellationToken);
            var now = DateTimeOffset.UtcNow;
            foreach (var session in sessions) session.RevokedAt = now;
            revokedSessions = sessions.Count;
        }
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenant.Id, Action = "PLATFORM_TENANT_STATUS_CHANGED", TargetType = "TENANT", TargetId = tenant.Id.ToString(), Reason = request.Reason.Trim(), MetadataJson = JsonSerializer.Serialize(new { previous, next = tenant.Status, revokedSessions }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { id = tenant.Id, status = tenant.Status, revokedSessions } });
    }

    private static async Task<IResult> GetMembersAsync(Guid tenantId, MadaDbContext db, string? search, CancellationToken cancellationToken)
    {
        if (!await db.Tenants.AnyAsync(x => x.Id == tenantId, cancellationToken)) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        var normalizedSearch = search?.Trim();
        if (normalizedSearch?.Length > 120) return Results.ValidationProblem(new Dictionary<string, string[]> { ["search"] = ["Search text must be 120 characters or less."] });
        var now = DateTimeOffset.UtcNow;
        var members = await db.Memberships.AsNoTracking().Where(x => x.TenantId == tenantId)
            .Where(x => string.IsNullOrEmpty(normalizedSearch) ||
                (x.UserAccount!.DisplayName != null && x.UserAccount.DisplayName.Contains(normalizedSearch)) ||
                (x.UserAccount!.Email != null && x.UserAccount.Email.Contains(normalizedSearch)) ||
                x.UserAccount!.Phone.Contains(normalizedSearch))
            .OrderBy(x => x.RoleCode).Select(x => new
        {
            membershipId = x.Id,
            userId = x.UserAccountId,
            name = x.UserAccount!.DisplayName,
            email = x.UserAccount.Email,
            phone = x.UserAccount.Phone,
            roleCode = x.RoleCode,
            membershipStatus = x.Status,
            userStatus = x.UserAccount.Status,
            lastLoginAt = x.UserAccount.LastLoginAt,
            activeSessions = db.RefreshSessions.Count(session => session.UserAccountId == x.UserAccountId && session.RevokedAt == null && session.ExpiresAt > now),
            lastSessionAt = db.RefreshSessions.Where(session => session.UserAccountId == x.UserAccountId).OrderByDescending(session => session.CreatedAt).Select(session => (DateTimeOffset?)session.CreatedAt).FirstOrDefault(),
            branch = x.Branch == null ? null : new { x.Branch.Id, x.Branch.Name, x.Branch.Code }
        }).ToListAsync(cancellationToken);
        var items = members.Select(member => new
        {
            member.membershipId,
            member.userId,
            member.name,
            maskedEmail = MaskEmail(member.email),
            maskedPhone = MaskPhone(member.phone),
            member.roleCode,
            member.membershipStatus,
            member.userStatus,
            member.lastLoginAt,
            member.activeSessions,
            member.lastSessionAt,
            member.branch
        });
        return Results.Ok(new { data = new { items, total = members.Count, tenantId } });
    }

    private static async Task<IResult> ChangeMemberStatusAsync(Guid tenantId, Guid membershipId, MemberStatusRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (request.Status is not ("ACTIVE" or "REVOKED")) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Status must be ACTIVE or REVOKED."] });
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4) return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for every support action."] });
        var membership = await db.Memberships.Include(item => item.UserAccount).SingleOrDefaultAsync(item => item.Id == membershipId && item.TenantId == tenantId, cancellationToken);
        if (membership?.UserAccount is null) return Results.NotFound(new { error = new { code = "TENANT_MEMBER_NOT_FOUND", message = "Member was not found in the selected academy." } });
        if (membership.RoleCode == "R00_PLATFORM_ADMIN") return Results.Conflict(new { error = new { code = "PLATFORM_ROLE_PROTECTED", message = "Platform administrator assignments are managed outside tenant support." } });
        if (request.Status == "ACTIVE" && membership.UserAccount.Status != "ACTIVE") return Results.Conflict(new { error = new { code = "USER_ACCOUNT_NOT_ACTIVE", message = "The account is disabled globally and must be reviewed through the account recovery process." } });
        var previous = membership.Status;
        membership.Status = request.Status;
        var sessions = request.Status == "REVOKED"
            ? await db.RefreshSessions.Where(item => item.UserAccountId == membership.UserAccountId && item.RevokedAt == null).ToListAsync(cancellationToken)
            : [];
        var now = DateTimeOffset.UtcNow;
        foreach (var session in sessions) session.RevokedAt = now;
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "PLATFORM_MEMBER_STATUS_CHANGED", TargetType = "MEMBERSHIP", TargetId = membershipId.ToString(), Reason = request.Reason.Trim(), MetadataJson = JsonSerializer.Serialize(new { userId = membership.UserAccountId, previous, next = membership.Status, revokedSessions = sessions.Count }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { membershipId, userId = membership.UserAccountId, status = membership.Status, revokedSessions = sessions.Count } });
    }

    private static async Task<IResult> RevokeSessionsAsync(Guid tenantId, Guid userId, SupportReasonRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4) return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for every support action."] });
        var targetExists = await db.Memberships.AnyAsync(item => item.TenantId == tenantId && item.UserAccountId == userId, cancellationToken);
        if (!targetExists) return Results.NotFound(new { error = new { code = "TENANT_MEMBER_NOT_FOUND", message = "User was not found in the selected academy." } });
        var user = await db.UserAccounts.SingleOrDefaultAsync(item => item.Id == userId && item.AccountType == "staff", cancellationToken);
        if (user is null) return Results.NotFound(new { error = new { code = "STAFF_USER_NOT_FOUND", message = "Staff account was not found." } });
        var sessions = await db.RefreshSessions.Where(item => item.UserAccountId == userId && item.RevokedAt == null).ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        foreach (var session in sessions) session.RevokedAt = now;
        db.AuditEvents.Add(new AuditEvent { ActorUserId = ActorId(principal), TenantId = tenantId, Action = "PLATFORM_USER_SESSIONS_REVOKED", TargetType = "USER_ACCOUNT", TargetId = userId.ToString(), Reason = request.Reason.Trim(), MetadataJson = JsonSerializer.Serialize(new { revokedCount = sessions.Count }) });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { userId, tenantId, revokedCount = sessions.Count } });
    }

    private static IResult GetPlatformRoles() => Results.Ok(new { data = new
    {
        items = new[]
        {
            new
            {
                code = "R00_PLATFORM_ADMIN",
                label = "مسؤول المنصة",
                scope = "PLATFORM",
                permissions = new[] { "platform.read", "academy.create", "academy.read", "support.member.search", "support.sessions.revoke", "support.membership.disable", "audit.read" },
                assignmentMode = "CONTROLLED_OUT_OF_BAND",
                canSelfAssign = false
            }
        }
    }});

    private static async Task<IResult> GetAcademyActivityAsync(Guid tenantId, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!await db.Tenants.AnyAsync(item => item.Id == tenantId, cancellationToken)) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        return await GetActivityAsync(db, cancellationToken, tenantId);
    }

    private static async Task<IResult> GetPlatformActivityAsync(MadaDbContext db, CancellationToken cancellationToken) => await GetActivityAsync(db, cancellationToken, null);

    private static async Task<IResult> GetActivityAsync(MadaDbContext db, CancellationToken cancellationToken, Guid? tenantId)
    {
        var query = db.AuditEvents.AsNoTracking().AsQueryable();
        if (tenantId.HasValue) query = query.Where(item => item.TenantId == tenantId.Value);
        var events = await query.OrderByDescending(x => x.CreatedAt).Take(100).Select(x => new
        {
            id = x.Id,
            action = x.Action,
            targetType = x.TargetType,
            targetId = x.TargetId,
            tenantId = x.TenantId,
            actorUserId = x.ActorUserId,
            reason = x.Reason,
            createdAt = x.CreatedAt,
            tenantName = x.TenantId == null ? null : db.Tenants.Where(tenant => tenant.Id == x.TenantId).Select(tenant => tenant.Name).FirstOrDefault(),
            actorName = x.ActorUserId == null ? null : db.UserAccounts.Where(user => user.Id == x.ActorUserId).Select(user => user.DisplayName).FirstOrDefault()
        }).ToListAsync(cancellationToken);
        return Results.Ok(new { data = new { items = events, total = events.Count } });
    }

    private static string MaskPhone(string value) => value.Length <= 4 ? "••••" : $"•••• {value[^4..]}";
    private static string? MaskEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var separator = value.IndexOf('@');
        if (separator <= 0) return "••••";
        var visible = value[..Math.Min(1, separator)];
        return $"{visible}••••{value[separator..]}";
    }

    private static async Task<IResult> ChangeTenantPlanAsync(Guid tenantId, TenantPlanRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var normalizedPlan = request.PlanCode?.Trim().ToUpperInvariant();
        if (normalizedPlan is not ("STARTER" or "GROWTH" or "ENTERPRISE" or "SCALE"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["planCode"] = ["Plan code must be STARTER, GROWTH, or ENTERPRISE."] });
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for every plan change."] });

        var tenant = await db.Tenants.SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });

        var previous = tenant.PlanCode;
        tenant.PlanCode = normalizedPlan;
        var allowedBranches = request.BranchesLimit ?? (normalizedPlan == "STARTER" ? 1 : normalizedPlan == "GROWTH" ? 3 : 99);

        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenant.Id,
            Action = "PLATFORM_TENANT_PLAN_CHANGED",
            TargetType = "TENANT",
            TargetId = tenant.Id.ToString(),
            Reason = request.Reason.Trim(),
            MetadataJson = JsonSerializer.Serialize(new { previous, next = tenant.PlanCode, allowedBranches })
        });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { tenantId = tenant.Id, planCode = tenant.PlanCode, allowedBranches } });
    }

    private static async Task<IResult> GetAcademyFeaturesAsync(Guid tenantId, MadaDbContext db, CancellationToken cancellationToken)
    {
        var tenant = await db.Tenants.AsNoTracking().SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });

        var defaultFeatures = DefaultPlanFeatures(tenant.PlanCode);
        var effective = new Dictionary<string, bool>(defaultFeatures);
        Dictionary<string, bool> standardOverrides = [];
        List<CustomFeatureAddon> customAddons = [];

        if (!string.IsNullOrWhiteSpace(tenant.FeatureOverridesJson))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<TenantFeaturePayload>(tenant.FeatureOverridesJson, JsonOptions);
                if (parsed?.StandardOverrides is not null)
                {
                    foreach (var (k, v) in parsed.StandardOverrides)
                    {
                        standardOverrides[k] = v;
                        effective[k] = v;
                    }
                }
                if (parsed?.CustomAddons is not null)
                {
                    customAddons = parsed.CustomAddons;
                    foreach (var addon in customAddons)
                    {
                        effective[addon.Key] = addon.Enabled;
                    }
                }
            }
            catch { /* Ignore deserialization error */ }
        }

        return Results.Ok(new { data = new
        {
            tenantId = tenant.Id,
            planCode = tenant.PlanCode,
            effectiveFeatures = effective,
            standardOverrides,
            customAddons
        }});
    }

    private static async Task<IResult> UpdateAcademyFeaturesAsync(Guid tenantId, UpdateFeaturesRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least 4 characters is required for updating features."] });

        var tenant = await db.Tenants.SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });

        var payload = new TenantFeaturePayload(request.StandardOverrides ?? [], request.CustomAddons ?? []);
        var json = JsonSerializer.Serialize(payload, JsonOptions);
        var previousJson = tenant.FeatureOverridesJson;
        tenant.FeatureOverridesJson = json;

        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenant.Id,
            Action = "PLATFORM_TENANT_FEATURES_CHANGED",
            TargetType = "TENANT",
            TargetId = tenant.Id.ToString(),
            Reason = request.Reason.Trim(),
            MetadataJson = JsonSerializer.Serialize(new { previous = previousJson, next = json })
        });

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { tenantId = tenant.Id, planCode = tenant.PlanCode, updated = true } });
    }

    private static async Task<IResult> GetMyFeaturesAsync(ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "TENANT_SCOPE_REQUIRED");

        var tenant = await db.Tenants.AsNoTracking().SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND" } });

        var effective = new Dictionary<string, bool>(DefaultPlanFeatures(tenant.PlanCode));
        if (!string.IsNullOrWhiteSpace(tenant.FeatureOverridesJson))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<TenantFeaturePayload>(tenant.FeatureOverridesJson, JsonOptions);
                if (parsed?.StandardOverrides is not null)
                {
                    foreach (var (k, v) in parsed.StandardOverrides) effective[k] = v;
                }
                if (parsed?.CustomAddons is not null)
                {
                    foreach (var addon in parsed.CustomAddons) effective[addon.Key] = addon.Enabled;
                }
            }
            catch { }
        }

        return Results.Ok(new { data = new { tenantId = tenant.Id, planCode = tenant.PlanCode, features = effective } });
    }

    public static Dictionary<string, bool> DefaultPlanFeatures(string planCode)
    {
        var normalized = planCode.ToUpperInvariant();
        return normalized switch
        {
            "STARTER" => new Dictionary<string, bool>
            {
                ["gamification_enabled"] = true,
                ["guardian_portal"] = true,
                ["advanced_finance"] = false,
                ["supervision_quality"] = false,
                ["custom_whatsapp_notifications"] = false,
                ["beta_features_enabled"] = false,
            },
            "GROWTH" => new Dictionary<string, bool>
            {
                ["gamification_enabled"] = true,
                ["guardian_portal"] = true,
                ["advanced_finance"] = true,
                ["supervision_quality"] = true,
                ["custom_whatsapp_notifications"] = false,
                ["beta_features_enabled"] = false,
            },
            "ENTERPRISE" or "SCALE" => new Dictionary<string, bool>
            {
                ["gamification_enabled"] = true,
                ["guardian_portal"] = true,
                ["advanced_finance"] = true,
                ["supervision_quality"] = true,
                ["custom_whatsapp_notifications"] = true,
                ["beta_features_enabled"] = false,
            },
            _ => new Dictionary<string, bool>
            {
                ["gamification_enabled"] = true,
                ["guardian_portal"] = true,
                ["advanced_finance"] = false,
                ["supervision_quality"] = false,
                ["custom_whatsapp_notifications"] = false,
                ["beta_features_enabled"] = false,
            }
        };
    }

    private static async Task<IResult> CreateTenantSupportTicketAsync(CreateSupportTicketRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "TENANT_SCOPE_REQUIRED");
        if (string.IsNullOrWhiteSpace(request.Subject) || request.Subject.Trim().Length < 3)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["subject"] = ["Subject must be at least 3 characters."] });
        if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Trim().Length < 5)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["description"] = ["Description must be at least 5 characters."] });

        var userId = ActorId(user) ?? Guid.Empty;
        var userAccount = await db.UserAccounts.AsNoTracking().SingleOrDefaultAsync(x => x.Id == userId, cancellationToken);
        var role = user.FindFirstValue(ClaimTypes.Role) ?? "R01_ACADEMY_OWNER";
        Guid.TryParse(user.FindFirstValue("branchId"), out var branchId);

        var ticket = new PlatformSupportTicket
        {
            TenantId = tenantId,
            BranchId = branchId == Guid.Empty ? null : branchId,
            RequesterUserId = userId,
            RequesterName = userAccount?.DisplayName ?? user.Identity?.Name ?? "موظف الأكاديمية",
            RequesterPhone = userAccount?.Phone ?? "",
            RequesterRole = role,
            Subject = request.Subject.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category?.Trim().ToUpperInvariant() ?? "TECHNICAL",
            Priority = request.Priority?.Trim().ToUpperInvariant() ?? "MEDIUM",
            Status = "NEW",
        };

        db.PlatformSupportTickets.Add(ticket);
        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = userId,
            TenantId = tenantId,
            Action = "ACADEMY_SUPPORT_TICKET_CREATED",
            TargetType = "SUPPORT_TICKET",
            TargetId = ticket.Id.ToString(),
            Reason = "Academy created a platform support ticket.",
            MetadataJson = JsonSerializer.Serialize(new { ticket.Subject, ticket.Category, ticket.Priority })
        });

        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/academy/support-tickets/{ticket.Id}", new { data = new
        {
            ticket.Id,
            ticket.Subject,
            ticket.Category,
            ticket.Priority,
            ticket.Status,
            ticket.CreatedAt
        }});
    }

    private static async Task<IResult> GetTenantSupportTicketsAsync(ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "TENANT_SCOPE_REQUIRED");

        var tickets = await db.PlatformSupportTickets.AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.Subject,
                x.Description,
                x.Category,
                x.Priority,
                x.Status,
                x.MeetingUrl,
                x.MeetingScheduledAt,
                x.ResolutionNotes,
                x.CreatedAt,
                x.ResolvedAt
            })
            .ToListAsync(cancellationToken);

        return Results.Ok(new { data = new { items = tickets, total = tickets.Count } });
    }

    private static async Task<IResult> GetPlatformTicketsAsync(string? status, string? priority, string? category, Guid? tenantId, MadaDbContext db, CancellationToken cancellationToken)
    {
        var query = db.PlatformSupportTickets.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            query = query.Where(x => x.Status == status.ToUpperInvariant());
        if (!string.IsNullOrWhiteSpace(priority) && priority != "ALL")
            query = query.Where(x => x.Priority == priority.ToUpperInvariant());
        if (!string.IsNullOrWhiteSpace(category) && category != "ALL")
            query = query.Where(x => x.Category == category.ToUpperInvariant());
        if (tenantId.HasValue && tenantId.Value != Guid.Empty)
            query = query.Where(x => x.TenantId == tenantId.Value);

        var items = await query.OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.TenantId,
                tenantName = db.Tenants.Where(t => t.Id == x.TenantId).Select(t => t.Name).FirstOrDefault() ?? "الأكاديمية",
                tenantSlug = db.Tenants.Where(t => t.Id == x.TenantId).Select(t => t.Slug).FirstOrDefault() ?? "",
                x.RequesterUserId,
                x.RequesterName,
                x.RequesterPhone,
                x.RequesterRole,
                x.Subject,
                x.Description,
                x.Category,
                x.Priority,
                x.Status,
                x.MeetingUrl,
                x.MeetingScheduledAt,
                x.ResolutionNotes,
                x.InternalAdminNotes,
                x.CreatedAt,
                x.ResolvedAt
            })
            .ToListAsync(cancellationToken);

        return Results.Ok(new { data = new { items, total = items.Count } });
    }

    private static async Task<IResult> UpdatePlatformTicketAsync(Guid ticketId, UpdatePlatformTicketRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var ticket = await db.PlatformSupportTickets.SingleOrDefaultAsync(x => x.Id == ticketId, cancellationToken);
        if (ticket is null) return Results.NotFound(new { error = new { code = "TICKET_NOT_FOUND", message = "Support ticket was not found." } });

        var previousStatus = ticket.Status;
        if (!string.IsNullOrWhiteSpace(request.Status))
            ticket.Status = request.Status.Trim().ToUpperInvariant();
        if (request.MeetingUrl is not null)
            ticket.MeetingUrl = string.IsNullOrWhiteSpace(request.MeetingUrl) ? null : request.MeetingUrl.Trim();
        if (request.MeetingScheduledAt.HasValue)
            ticket.MeetingScheduledAt = request.MeetingScheduledAt.Value;
        if (request.ResolutionNotes is not null)
            ticket.ResolutionNotes = request.ResolutionNotes.Trim();
        if (request.InternalAdminNotes is not null)
            ticket.InternalAdminNotes = request.InternalAdminNotes.Trim();

        if (ticket.Status == "RESOLVED" && previousStatus != "RESOLVED")
        {
            ticket.ResolvedAt = DateTimeOffset.UtcNow;
            ticket.ResolvedByUserId = ActorId(principal);
        }

        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = ticket.TenantId,
            Action = "PLATFORM_SUPPORT_TICKET_UPDATED",
            TargetType = "SUPPORT_TICKET",
            TargetId = ticket.Id.ToString(),
            Reason = request.Reason ?? "Updated platform support ticket status or resolution.",
            MetadataJson = JsonSerializer.Serialize(new { previousStatus, nextStatus = ticket.Status, ticket.MeetingUrl })
        });

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { data = new { ticket.Id, ticket.Status, ticket.MeetingUrl, ticket.ResolvedAt } });
    }

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static async Task<IResult> ExtendTenantTrialAsync(Guid tenantId, ExtendTrialRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (request.DaysToAdd is < 1 or > 90)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["daysToAdd"] = ["Days to add must be between 1 and 90."] });
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required."] });

        var tenant = await db.Tenants.SingleOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });

        var now = DateTimeOffset.UtcNow;
        var baseEnd = tenant.Status == "TRIAL" ? tenant.CreatedAt.AddDays(14) : now;
        if (baseEnd < now) baseEnd = now;

        var latestTrialAudit = await db.AuditEvents.AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.Action == "PLATFORM_TENANT_TRIAL_EXTENDED")
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => e.MetadataJson)
            .FirstOrDefaultAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(latestTrialAudit))
        {
            try
            {
                using var doc = JsonDocument.Parse(latestTrialAudit);
                if (doc.RootElement.TryGetProperty("newEndDate", out var endProp) &&
                    DateTimeOffset.TryParse(endProp.GetString(), out var previousEnd) &&
                    previousEnd > baseEnd)
                    baseEnd = previousEnd;
            }
            catch { /* ignore malformed metadata */ }
        }

        var newEndDate = baseEnd.AddDays(request.DaysToAdd);
        if (tenant.Status is "SETUP" or "PAUSED") tenant.Status = "TRIAL";

        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenant.Id,
            Action = "PLATFORM_TENANT_TRIAL_EXTENDED",
            TargetType = "TENANT",
            TargetId = tenant.Id.ToString(),
            Reason = request.Reason.Trim(),
            MetadataJson = JsonSerializer.Serialize(new { daysToAdd = request.DaysToAdd, newEndDate = newEndDate.ToString("O") })
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { data = new { tenantId = tenant.Id, newEndDate = newEndDate.ToString("O"), isTrialExtended = true } });
    }

    private static async Task<IResult> ResetTenantOwnerPasswordAsync(Guid tenantId, SupportReasonRequest request, MadaDbContext db, PasswordHashService passwords, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 4)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["reason"] = ["A reason of at least four characters is required for owner recovery."] });

        var ownerMembership = await db.Memberships
            .Include(m => m.UserAccount)
            .Where(m => m.TenantId == tenantId && m.RoleCode == "R01_ACADEMY_OWNER" && m.Status == "ACTIVE")
            .OrderBy(m => m.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (ownerMembership?.UserAccount is null)
            return Results.NotFound(new { error = new { code = "OWNER_NOT_FOUND", message = "Active academy owner was not found." } });

        var owner = ownerMembership.UserAccount;
        var tempPassword = GenerateTempPassword();
        owner.PasswordHash = passwords.Hash(tempPassword);
        owner.FailedPasswordAttempts = 0;
        owner.PasswordLockedUntil = null;
        if (owner.Status == "INVITED") owner.Status = "ACTIVE";

        var sessions = await db.RefreshSessions
            .Where(s => s.UserAccountId == owner.Id && s.RevokedAt == null)
            .ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        foreach (var session in sessions) session.RevokedAt = now;

        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenantId,
            Action = "PLATFORM_OWNER_PASSWORD_RESET",
            TargetType = "USER_ACCOUNT",
            TargetId = owner.Id.ToString(),
            Reason = request.Reason.Trim(),
            MetadataJson = JsonSerializer.Serialize(new { ownerPhone = owner.Phone, revokedSessions = sessions.Count })
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new
        {
            data = new
            {
                tenantId,
                ownerName = owner.DisplayName ?? owner.Phone,
                ownerPhone = owner.Phone,
                tempPassword,
                generatedAt = now
            }
        });
    }

    private static async Task<IResult> GetPlatformPaymentsAsync(Guid? tenantId, MadaDbContext db, CancellationToken cancellationToken)
    {
        var query = db.PlatformSubscriptionPayments.AsNoTracking();
        if (tenantId.HasValue) query = query.Where(p => p.TenantId == tenantId.Value);

        var items = await (
            from p in query
            join t in db.Tenants.AsNoTracking() on p.TenantId equals t.Id
            orderby p.ReceivedAt descending
            select new
            {
                id = p.Id,
                tenantId = p.TenantId,
                tenantName = t.Name,
                amount = p.AmountEgp,
                method = p.Method,
                referenceNumber = p.ReferenceNumber,
                receivedAt = p.ReceivedAt,
                recordedByName = p.RecordedByName,
                notes = p.Notes
            }
        ).ToListAsync(cancellationToken);

        return Results.Ok(new { data = new { items, total = items.Count, totalRevenue = items.Sum(x => x.amount) } });
    }

    private static async Task<IResult> RecordSubscriptionPaymentAsync(Guid tenantId, RecordSubscriptionPaymentRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["amount"] = ["Payment amount must be greater than zero."] });
        var normalizedMethod = (request.Method ?? "BANK_TRANSFER").Trim().ToUpperInvariant();
        if (normalizedMethod is not ("BANK_TRANSFER" or "FAWRY" or "CREDIT_CARD" or "CASH" or "INSTAPAY" or "VODAFONE_CASH"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["method"] = ["Unsupported payment method."] });
        if (string.IsNullOrWhiteSpace(request.ReferenceNumber) || request.ReferenceNumber.Trim().Length < 2)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["referenceNumber"] = ["Reference number is required."] });

        var tenant = await db.Tenants.SingleOrDefaultAsync(t => t.Id == tenantId, cancellationToken);
        if (tenant is null)
            return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });

        var actorId = ActorId(principal);
        var recorderName = request.RecordedByName?.Trim();
        if (string.IsNullOrWhiteSpace(recorderName) && actorId.HasValue)
            recorderName = await db.UserAccounts.AsNoTracking().Where(u => u.Id == actorId.Value).Select(u => u.DisplayName).FirstOrDefaultAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(recorderName)) recorderName = "مسؤول المنصة";

        var payment = new PlatformSubscriptionPayment
        {
            TenantId = tenant.Id,
            AmountEgp = (long)Math.Round(request.Amount),
            Method = normalizedMethod,
            ReferenceNumber = request.ReferenceNumber.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            RecordedByUserId = actorId,
            RecordedByName = recorderName,
            ReceivedAt = DateTimeOffset.UtcNow
        };
        if (tenant.Status is "PAUSED" or "SETUP") tenant.Status = "ACTIVE";

        db.PlatformSubscriptionPayments.Add(payment);
        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = actorId,
            TenantId = tenant.Id,
            Action = "PLATFORM_SUBSCRIPTION_PAYMENT_RECORDED",
            TargetType = "PLATFORM_SUBSCRIPTION_PAYMENT",
            TargetId = payment.Id.ToString(),
            Reason = $"Recorded {payment.AmountEgp} EGP via {payment.Method} ({payment.ReferenceNumber})",
            MetadataJson = JsonSerializer.Serialize(new { payment.AmountEgp, payment.Method, payment.ReferenceNumber })
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/v1/platform/payments", new
        {
            data = new
            {
                id = payment.Id,
                tenantId = tenant.Id,
                tenantName = tenant.Name,
                amount = payment.AmountEgp,
                method = payment.Method,
                referenceNumber = payment.ReferenceNumber,
                receivedAt = payment.ReceivedAt,
                recordedByName = payment.RecordedByName,
                notes = payment.Notes
            }
        });
    }

    private static async Task<IResult> GetPlatformDemoLeadsAsync(MadaDbContext db, CancellationToken cancellationToken)
    {
        var leads = await db.Leads.AsNoTracking()
            .Where(l => l.Channel == "LANDING_DEMO")
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);

        var items = leads.Select(MapDemoLead).ToList();
        return Results.Ok(new { data = new { items, total = items.Count } });
    }

    private static async Task<IResult> UpdatePlatformDemoLeadStatusAsync(Guid leadId, UpdateDemoLeadStatusRequest request, MadaDbContext db, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var normalizedStatus = (request.Status ?? string.Empty).Trim().ToUpperInvariant();
        if (normalizedStatus is not ("NEW" or "CONTACTED" or "DEMO_SCHEDULED" or "CONVERTED" or "REJECTED"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Status must be NEW, CONTACTED, DEMO_SCHEDULED, CONVERTED, or REJECTED."] });

        var lead = await db.Leads.SingleOrDefaultAsync(l => l.Id == leadId && l.Channel == "LANDING_DEMO", cancellationToken);
        if (lead is null)
            return Results.NotFound(new { error = new { code = "DEMO_LEAD_NOT_FOUND", message = "Demo lead was not found." } });

        var previous = lead.Status;
        lead.Status = normalizedStatus;
        lead.UpdatedAt = DateTimeOffset.UtcNow;

        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = lead.TenantId == Guid.Empty ? null : lead.TenantId,
            Action = "PLATFORM_DEMO_LEAD_STATUS_CHANGED",
            TargetType = "LEAD",
            TargetId = lead.Id.ToString(),
            Reason = $"Lead status updated from {previous} to {normalizedStatus}"
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { data = MapDemoLead(lead) });
    }

    private static async Task<IResult> ConvertPlatformDemoLeadAsync(
        Guid leadId,
        ConvertDemoLeadRequest request,
        MadaDbContext db,
        PasswordHashService passwords,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var lead = await db.Leads.SingleOrDefaultAsync(l => l.Id == leadId && l.Channel == "LANDING_DEMO", cancellationToken);
        if (lead is null)
            return Results.NotFound(new { error = new { code = "DEMO_LEAD_NOT_FOUND", message = "Demo lead was not found." } });
        if (lead.Status == "CONVERTED")
            return Results.Conflict(new { error = new { code = "DEMO_LEAD_ALREADY_CONVERTED", message = "This demo lead has already been converted into an academy." } });

        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length < 2)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Academy name is required."] });
        if (string.IsNullOrWhiteSpace(request.BranchName) || string.IsNullOrWhiteSpace(request.BranchCode))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["branch"] = ["Primary branch name and code are required."] });
        if (string.IsNullOrWhiteSpace(request.OwnerName) || string.IsNullOrWhiteSpace(request.OwnerPhone) || OtpChallengeStore.Normalize(request.OwnerPhone).Length < 8)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["ownerPhone"] = ["Owner name and valid phone are required."] });
        if (string.IsNullOrWhiteSpace(request.OwnerPassword) || request.OwnerPassword.Length < 8)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["ownerPassword"] = ["Owner password must be at least 8 characters."] });
        try { _ = new MailAddress(request.OwnerEmail); }
        catch { return Results.ValidationProblem(new Dictionary<string, string[]> { ["ownerEmail"] = ["A valid owner email is required."] }); }

        var planCode = (request.PlanCode ?? "GROWTH").Trim().ToUpperInvariant();
        if (planCode is not ("STARTER" or "GROWTH" or "ENTERPRISE" or "SCALE"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["planCode"] = ["Unsupported plan code."] });

        var cleanedSlug = Regex.Replace((request.Slug ?? request.Name).Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        var slug = string.IsNullOrWhiteSpace(cleanedSlug) ? $"academy-{Guid.NewGuid().ToString("N")[..6]}" : cleanedSlug;
        var phone = OtpChallengeStore.Normalize(request.OwnerPhone);
        var email = request.OwnerEmail.Trim().ToLowerInvariant();
        var branchCode = request.BranchCode.Trim().ToUpperInvariant();

        if (await db.Tenants.AnyAsync(t => t.Slug == slug, cancellationToken))
            return Results.Conflict(new { error = new { code = "ACADEMY_SLUG_EXISTS", message = "An academy with this slug already exists." } });
        if (await db.UserAccounts.AnyAsync(u => u.Email == email, cancellationToken))
            return Results.Conflict(new { error = new { code = "OWNER_EMAIL_EXISTS", message = "The owner email is already registered." } });
        if (await db.UserAccounts.AnyAsync(u => u.Phone == phone && u.AccountType == "staff", cancellationToken))
            return Results.Conflict(new { error = new { code = "OWNER_PHONE_EXISTS", message = "The owner phone is already registered." } });

        var tenant = new Tenant { Name = request.Name.Trim(), Slug = slug, PlanCode = planCode, Status = "TRIAL" };
        var branch = new Branch { TenantId = tenant.Id, Name = request.BranchName.Trim(), Code = branchCode };
        var owner = new UserAccount
        {
            Email = email,
            Phone = phone,
            DisplayName = request.OwnerName.Trim(),
            AccountType = "staff",
            PasswordHash = passwords.Hash(request.OwnerPassword),
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

        lead.Status = "CONVERTED";
        lead.TenantId = tenant.Id;
        lead.BranchId = branch.Id;
        lead.UpdatedAt = DateTimeOffset.UtcNow;

        db.Tenants.Add(tenant);
        db.Branches.Add(branch);
        db.UserAccounts.Add(owner);
        db.Memberships.Add(membership);
        db.AuditEvents.Add(new AuditEvent
        {
            ActorUserId = ActorId(principal),
            TenantId = tenant.Id,
            Action = "PLATFORM_DEMO_LEAD_CONVERTED",
            TargetType = "LEAD",
            TargetId = lead.Id.ToString(),
            Reason = $"Converted landing demo lead {lead.ChildName} into academy {tenant.Slug}",
            MetadataJson = JsonSerializer.Serialize(new { tenantId = tenant.Id, slug = tenant.Slug, ownerId = owner.Id })
        });
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/v1/academy/{tenant.Id}", new
        {
            data = new
            {
                lead = MapDemoLead(lead),
                academy = new { id = tenant.Id, name = tenant.Name, slug = tenant.Slug, status = tenant.Status, planCode = tenant.PlanCode },
                primaryBranch = new { id = branch.Id, branch.Name, branch.Code },
                owner = new { id = owner.Id, displayName = owner.DisplayName ?? owner.Phone, phone = owner.Phone, email = owner.Email }
            }
        });
    }

    private static async Task<IResult> CreatePublicDemoRequestAsync(PublicDemoRequestInput request, MadaDbContext db, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.AcademyName) || string.IsNullOrWhiteSpace(request.Phone))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["request"] = ["Name, academy name, and phone are required."] });

        var lead = new Lead
        {
            TenantId = Guid.Empty,
            BranchId = Guid.Empty,
            ChildName = request.AcademyName.Trim(),
            ParentName = request.Name.Trim(),
            Phone = request.Phone.Trim(),
            Channel = "LANDING_DEMO",
            Status = "NEW",
            Notes = SerializeDemoLeadMeta(request.Email?.Trim() ?? "", request.BranchCount?.Trim() ?? "1", request.OperationalNeed?.Trim() ?? "", request.Notes?.Trim())
        };
        db.Leads.Add(lead);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/platform/demo-leads", new { data = MapDemoLead(lead) });
    }

    public static string SerializeDemoLeadMeta(string email, string branchCount, string operationalNeed, string? notes) =>
        JsonSerializer.Serialize(new DemoLeadMeta(email, branchCount, operationalNeed, notes));

    private static object MapDemoLead(Lead lead)
    {
        var meta = ParseDemoLeadMeta(lead.Notes);
        return new
        {
            id = lead.Id.ToString(),
            name = lead.ParentName,
            email = meta.Email,
            phone = lead.Phone,
            academyName = lead.ChildName,
            branchCount = meta.BranchCount,
            operationalNeed = meta.OperationalNeed,
            notes = meta.Notes,
            status = lead.Status,
            createdAt = lead.CreatedAt
        };
    }

    private static DemoLeadMeta ParseDemoLeadMeta(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return new DemoLeadMeta("", "1", "", null);
        if (raw.TrimStart().StartsWith('{'))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<DemoLeadMeta>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (parsed is not null) return parsed;
            }
            catch { /* fall back to plain text notes */ }
        }
        return new DemoLeadMeta("", "1", raw, null);
    }

    private static string GenerateTempPassword()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        var chars = new char[8];
        for (var i = 0; i < chars.Length; i++)
            chars[i] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
        return $"Mada#{new string(chars)}";
    }

    private static Guid? ActorId(ClaimsPrincipal principal) => Guid.TryParse(principal.FindFirstValue("sub"), out var id) ? id : null;
    private sealed record DemoLeadMeta(string Email, string BranchCount, string OperationalNeed, string? Notes);
    private sealed record ExtendTrialRequest(int DaysToAdd, string? Reason);
    private sealed record RecordSubscriptionPaymentRequest(decimal Amount, string? Method, string? ReferenceNumber, string? Notes, string? RecordedByName);
    private sealed record UpdateDemoLeadStatusRequest(string Status);
    private sealed record ConvertDemoLeadRequest(string Name, string? Slug, string? PlanCode, string BranchName, string BranchCode, string OwnerName, string OwnerPhone, string OwnerEmail, string OwnerPassword);
    private sealed record PublicDemoRequestInput(string Name, string? Email, string Phone, string AcademyName, string? BranchCount, string? OperationalNeed, string? Notes);
    private sealed record TenantStatusRequest(string Status, string? Reason);
    private sealed record TenantPlanRequest(string PlanCode, int? BranchesLimit, string? Reason);
    private sealed record MemberStatusRequest(string Status, string? Reason);
    private sealed record SupportReasonRequest(string? Reason);
    public sealed record UpdateFeaturesRequest(Dictionary<string, bool>? StandardOverrides, List<CustomFeatureAddon>? CustomAddons, string? Reason);
    public sealed record TenantFeaturePayload(Dictionary<string, bool>? StandardOverrides, List<CustomFeatureAddon>? CustomAddons);
    public sealed record CustomFeatureAddon(string Key, string Name, bool Enabled, string? Notes);
    public sealed record CreateSupportTicketRequest(string Subject, string Description, string? Category, string? Priority);
    public sealed record UpdatePlatformTicketRequest(string? Status, string? MeetingUrl, DateTimeOffset? MeetingScheduledAt, string? ResolutionNotes, string? InternalAdminNotes, string? Reason);
}
