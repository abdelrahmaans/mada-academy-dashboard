namespace MadaAcademy.Api.Persistence.Entities;

public sealed class MarketingCampaign : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public required string Name { get; set; }
    public required string Channel { get; set; }
    public string Status { get; set; } = "DRAFT";
    public long BudgetPiastres { get; set; }
    public string? Notes { get; set; }
    public Guid? CreatedByUserId { get; set; }
}

public sealed class MarketingContentItem : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid? CampaignId { get; set; }
    public required string Title { get; set; }
    public required string ContentType { get; set; }
    public required string Platform { get; set; }
    public string Status { get; set; } = "DRAFT";
    public DateOnly? DueDate { get; set; }
    public string? Notes { get; set; }
    public Guid? CreatedByUserId { get; set; }
}
