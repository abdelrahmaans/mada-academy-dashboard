namespace MadaAcademy.Api.Persistence.Entities;

public sealed class Expense : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public int AmountPiastres { get; set; }
    public DateOnly SpentOn { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string Status { get; set; } = "PENDING";
    public Guid CreatedByUserId { get; set; }
    public Guid? ApprovalRequestId { get; set; }
    public Branch? Branch { get; set; }
    public ApprovalRequest? ApprovalRequest { get; set; }
    public ExpenseEvidence? Evidence { get; set; }
}

public sealed class ExpenseEvidence : EntityBase
{
    public Guid ExpenseId { get; set; }
    public required string StorageKey { get; set; }
    public required string DisplayFileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string Sha256 { get; set; }
    public Guid UploadedByUserId { get; set; }
    public Expense? Expense { get; set; }
}
