namespace MadaAcademy.Api.Persistence.Entities;

public sealed class SessionSubstitutionProposal : EntityBase
{
    public Guid ApprovalRequestId { get; set; }
    public Guid SessionId { get; set; }
    public Guid ProposedInstructorId { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public string? Message { get; set; }
    public string State { get; set; } = "PENDING";
}

public sealed class SessionEvaluation : EntityBase
{
    public Guid SessionId { get; set; }
    public Guid StudentId { get; set; }
    public Guid InstructorId { get; set; }
    public int? Score { get; set; }
    public string? Notes { get; set; }
}

public sealed class InAppNotification : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid? BranchId { get; set; }
    public Guid RecipientUserId { get; set; }
    public required string Type { get; set; }
    public required string Title { get; set; }
    public required string Body { get; set; }
    public string? TargetType { get; set; }
    public string? TargetId { get; set; }
    public bool IsRead { get; set; }
}
