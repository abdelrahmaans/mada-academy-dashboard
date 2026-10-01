namespace MadaAcademy.Api.Persistence.Entities;

public sealed class Invoice : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid StudentId { get; set; }
    public Guid? EnrollmentId { get; set; }
    public required string InvoiceNumber { get; set; }
    public int TotalPiastres { get; set; }
    public DateOnly IssueDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly DueDate { get; set; }
    public string Status { get; set; } = "UNPAID";
    public Guid CreatedByUserId { get; set; }
    public Tenant? Tenant { get; set; }
    public Branch? Branch { get; set; }
    public Student? Student { get; set; }
    public ICollection<InvoiceLine> Lines { get; set; } = new List<InvoiceLine>();
    public ICollection<PaymentTransaction> Payments { get; set; } = new List<PaymentTransaction>();
}

public sealed class InvoiceLine : EntityBase
{
    public Guid InvoiceId { get; set; }
    public int LineNumber { get; set; }
    public required string Description { get; set; }
    public int AmountPiastres { get; set; }
    public Invoice? Invoice { get; set; }
}

public sealed class PaymentTransaction : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid InvoiceId { get; set; }
    public int AmountPiastres { get; set; }
    public required string Method { get; set; }
    public DateOnly ReceivedOn { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string? ExternalReference { get; set; }
    public string? Note { get; set; }
    public Guid RecordedByUserId { get; set; }
    public Invoice? Invoice { get; set; }
    public PaymentEvidence? Evidence { get; set; }
}

public sealed class PaymentEvidence : EntityBase
{
    public Guid PaymentTransactionId { get; set; }
    public required string StorageKey { get; set; }
    public required string DisplayFileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string Sha256 { get; set; }
    public Guid UploadedByUserId { get; set; }
    public PaymentTransaction? PaymentTransaction { get; set; }
}
