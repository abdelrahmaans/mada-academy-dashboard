using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Operations;

public static class MarketingEndpoints
{
    public static IEndpointRouteBuilder MapMadaMarketingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/marketing").RequireAuthorization("staff");

        group.MapGet("/campaigns", async Task<Results<Ok<ApiEnvelope<IReadOnlyList<CampaignItem>>>, ProblemHttpResult>>(
            ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManage(user) || !TryGetScope(user, out var scope, out var error)) return error;
            var campaigns = await db.MarketingCampaigns.AsNoTracking()
                .Where(x => x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value))
                .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
            var ids = campaigns.Select(x => x.Id).ToArray();
            var leadStats = await db.Leads.AsNoTracking().Where(x => ids.Contains(x.CampaignId!.Value))
                .GroupBy(x => x.CampaignId!.Value)
                .Select(g => new { Id = g.Key, Leads = g.Count(), Conversions = g.Count(x => x.Status == "REGISTERED") })
                .ToDictionaryAsync(x => x.Id, cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<IReadOnlyList<CampaignItem>>(campaigns.Select(x => ToItem(x, leadStats.GetValueOrDefault(x.Id))).ToArray()));
        });

        group.MapPost("/campaigns", async Task<Results<Ok<ApiEnvelope<CampaignItem>>, ProblemHttpResult>>(
            CreateCampaignRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManage(user) || !TryGetScope(user, out var scope, out var error)) return error;
            if (string.IsNullOrWhiteSpace(request.Name)) return Problem(400, "INVALID_CAMPAIGN_NAME", "Campaign name is required.");
            var branchId = request.BranchId ?? scope.BranchId;
            if (!branchId.HasValue || !await db.Branches.AnyAsync(x => x.Id == branchId.Value && x.TenantId == scope.TenantId && x.Status == "ACTIVE", cancellationToken)) return Problem(400, "BRANCH_REQUIRED", "A valid branch is required.");
            var item = new MarketingCampaign { TenantId = scope.TenantId, BranchId = branchId.Value, Name = request.Name.Trim(), Channel = request.Channel.Trim().ToUpperInvariant(), Status = "DRAFT", BudgetPiastres = Math.Max(0, request.BudgetPiastres), Notes = request.Notes?.Trim(), CreatedByUserId = Actor(user) };
            db.MarketingCampaigns.Add(item); await db.SaveChangesAsync(cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<CampaignItem>(ToItem(item, null)));
        });

        group.MapPatch("/campaigns/{id:guid}/status", async Task<Results<Ok<ApiEnvelope<CampaignItem>>, ProblemHttpResult>>(
            Guid id, UpdateMarketingStatusRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManage(user) || !TryGetScope(user, out var scope, out var error)) return error;
            var item = await db.MarketingCampaigns.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
            if (item is null) return Problem(404, "CAMPAIGN_NOT_FOUND", "Campaign not found in current scope.");
            var allowed = new[] { "DRAFT", "IN_REVIEW", "ACTIVE", "PAUSED", "COMPLETED" };
            var status = request.Status?.Trim().ToUpperInvariant();
            if (status is null || !allowed.Contains(status)) return Problem(400, "INVALID_CAMPAIGN_STATUS", "Unsupported campaign status.");
            item.Status = status; await db.SaveChangesAsync(cancellationToken);
            var stats = await db.Leads.Where(x => x.CampaignId == item.Id).GroupBy(x => x.CampaignId).Select(g => new { Leads = g.Count(), Conversions = g.Count(x => x.Status == "REGISTERED") }).FirstOrDefaultAsync(cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<CampaignItem>(ToItem(item, stats)));
        });

        group.MapGet("/content", async Task<Results<Ok<ApiEnvelope<IReadOnlyList<ContentItem>>>, ProblemHttpResult>>(
            ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManage(user) || !TryGetScope(user, out var scope, out var error)) return error;
            var items = await db.MarketingContentItems.AsNoTracking().Where(x => x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value)).OrderBy(x => x.DueDate).ThenByDescending(x => x.CreatedAt).Select(x => new ContentItem(x.Id, x.BranchId, x.CampaignId, x.Title, x.ContentType, x.Platform, x.Status, x.DueDate, x.CreatedAt)).ToListAsync(cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<IReadOnlyList<ContentItem>>(items));
        });

        group.MapPost("/content", async Task<Results<Ok<ApiEnvelope<ContentItem>>, ProblemHttpResult>>(
            CreateContentRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManage(user) || !TryGetScope(user, out var scope, out var error)) return error;
            if (string.IsNullOrWhiteSpace(request.Title)) return Problem(400, "INVALID_CONTENT_TITLE", "Content title is required.");
            var branchId = request.BranchId ?? scope.BranchId;
            if (!branchId.HasValue || !await db.Branches.AnyAsync(x => x.Id == branchId.Value && x.TenantId == scope.TenantId && x.Status == "ACTIVE", cancellationToken)) return Problem(400, "BRANCH_REQUIRED", "A valid branch is required.");
            if (request.CampaignId.HasValue && !await db.MarketingCampaigns.AnyAsync(x => x.Id == request.CampaignId.Value && x.TenantId == scope.TenantId && x.BranchId == branchId.Value, cancellationToken)) return Problem(400, "CAMPAIGN_NOT_FOUND", "Campaign not found in the selected branch.");
            var item = new MarketingContentItem { TenantId = scope.TenantId, BranchId = branchId.Value, CampaignId = request.CampaignId, Title = request.Title.Trim(), ContentType = request.ContentType.Trim().ToUpperInvariant(), Platform = request.Platform.Trim().ToUpperInvariant(), Status = "DRAFT", DueDate = request.DueDate, Notes = request.Notes?.Trim(), CreatedByUserId = Actor(user) };
            db.MarketingContentItems.Add(item); await db.SaveChangesAsync(cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<ContentItem>(new ContentItem(item.Id, item.BranchId, item.CampaignId, item.Title, item.ContentType, item.Platform, item.Status, item.DueDate, item.CreatedAt)));
        });

        group.MapPatch("/content/{id:guid}/status", async Task<Results<Ok<ApiEnvelope<ContentItem>>, ProblemHttpResult>>(
            Guid id, UpdateMarketingStatusRequest request, ClaimsPrincipal user, MadaDbContext db, CancellationToken cancellationToken) =>
        {
            if (!CanManage(user) || !TryGetScope(user, out var scope, out var error)) return error;
            var item = await db.MarketingContentItems.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == scope.TenantId && (!scope.BranchId.HasValue || x.BranchId == scope.BranchId.Value), cancellationToken);
            if (item is null) return Problem(404, "CONTENT_NOT_FOUND", "Content item not found in current scope.");
            var allowed = new[] { "DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED" };
            var status = request.Status?.Trim().ToUpperInvariant();
            if (status is null || !allowed.Contains(status)) return Problem(400, "INVALID_CONTENT_STATUS", "Unsupported content status.");
            item.Status = status; await db.SaveChangesAsync(cancellationToken);
            return TypedResults.Ok(new ApiEnvelope<ContentItem>(new ContentItem(item.Id, item.BranchId, item.CampaignId, item.Title, item.ContentType, item.Platform, item.Status, item.DueDate, item.CreatedAt)));
        });

        return endpoints;
    }

    private static bool CanManage(ClaimsPrincipal user) => user.IsInRole("R07_MEDIA_MANAGER") || user.IsInRole("R01_ACADEMY_OWNER") || user.IsInRole("R02_BRANCH_MANAGER");
    private static Guid? Actor(ClaimsPrincipal user) => Guid.TryParse(user.FindFirstValue("sub"), out var id) ? id : null;
    private static CampaignItem ToItem(MarketingCampaign x, dynamic? stats) => new(x.Id, x.BranchId, x.Name, x.Channel, x.Status, x.BudgetPiastres, stats?.Leads ?? 0, stats?.Conversions ?? 0, x.CreatedAt);
    private static bool TryGetScope(ClaimsPrincipal user, out Scope scope, out ProblemHttpResult error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId)) { scope = default; error = Problem(403, "TENANT_SCOPE_REQUIRED", "The authenticated account has no tenant scope."); return false; }
        var branchClaim = user.FindFirstValue("branchId"); scope = new Scope(tenantId, Guid.TryParse(branchClaim, out var branchId) ? branchId : null); error = default!; return true;
    }
    private static ProblemHttpResult Problem(int status, string code, string detail) => TypedResults.Problem(statusCode: status, title: code, detail: detail, extensions: new Dictionary<string, object?> { ["code"] = code });
    private readonly record struct Scope(Guid TenantId, Guid? BranchId);
}

public sealed record CampaignItem(Guid Id, Guid BranchId, string Name, string Channel, string Status, long BudgetPiastres, int Leads, int Conversions, DateTimeOffset CreatedAt);
public sealed record ContentItem(Guid Id, Guid BranchId, Guid? CampaignId, string Title, string ContentType, string Platform, string Status, DateOnly? DueDate, DateTimeOffset CreatedAt);
public sealed record CreateCampaignRequest(string Name, string Channel, long BudgetPiastres = 0, Guid? BranchId = null, string? Notes = null);
public sealed record CreateContentRequest(string Title, string ContentType, string Platform, DateOnly? DueDate = null, Guid? CampaignId = null, Guid? BranchId = null, string? Notes = null);
public sealed record UpdateMarketingStatusRequest(string Status);
