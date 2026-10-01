using System.Text.Json.Serialization;

namespace MadaAcademy.Api.Persistence.Entities;

public sealed class InvoiceCorrectionRequest : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid InvoiceId { get; set; }
    public Guid ApprovalRequestId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public int CurrentTotalPiastres { get; set; }
    public DateOnly CurrentDueDate { get; set; }
    public int ProposedTotalPiastres { get; set; }
    public DateOnly ProposedDueDate { get; set; }
    public required string ProposedLinesJson { get; set; }
    public required string Reason { get; set; }
    public string Status { get; set; } = "PENDING";
    public Guid? DecidedByUserId { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }
    public Invoice? Invoice { get; set; }
    public ApprovalRequest? ApprovalRequest { get; set; }
}

public sealed record InvoiceCorrectionLine(string Description, int AmountPiastres);
