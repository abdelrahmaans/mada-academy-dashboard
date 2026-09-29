namespace MadaAcademy.Api.Persistence.Entities;

public sealed class AuditEvent : EntityBase
{
    public Guid? ActorUserId { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? BranchId { get; set; }
    public required string Action { get; set; }
    public required string TargetType { get; set; }
    public required string TargetId { get; set; }
    public string? Reason { get; set; }
    public string? MetadataJson { get; set; }
    public string? IpAddress { get; set; }
}

public sealed class ApprovalRequest : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid? BranchId { get; set; }
    public required string RequestType { get; set; }
    public required string TargetType { get; set; }
    public required string TargetId { get; set; }
    public required string SubmittedByRole { get; set; }
    public string State { get; set; } = "PENDING";
    public string? Reason { get; set; }
    public Guid? DecidedByUserId { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }
}

public sealed class StateTransitionEvent : EntityBase
{
    public required string AggregateType { get; set; }
    public required string AggregateId { get; set; }
    public required string FromState { get; set; }
    public required string ToState { get; set; }
    public Guid? ActorUserId { get; set; }
    public string? Reason { get; set; }
}
