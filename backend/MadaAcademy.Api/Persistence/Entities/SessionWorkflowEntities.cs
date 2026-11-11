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
    public int BonusPoints { get; set; } = 0;
    public string? GamificationBadge { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? ReviewNote { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
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

public sealed class EvaluationRubric : EntityBase
{
    public Guid TenantId { get; set; }
    public required string TrackKey { get; set; }
    public required string TrackLabel { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int ScaleMax { get; set; } = 5;
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public required string CriteriaJson { get; set; }
    public string? AuthorName { get; set; }
    public Guid? UpdatedByUserId { get; set; }
}
