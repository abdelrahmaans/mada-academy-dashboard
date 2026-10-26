namespace MadaAcademy.Api.Persistence.Entities;

public sealed class PlatformSupportTicket : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid? BranchId { get; set; }
    public Guid RequesterUserId { get; set; }
    public required string RequesterName { get; set; }
    public required string RequesterPhone { get; set; }
    public required string RequesterRole { get; set; }
    public required string Subject { get; set; }
    public required string Description { get; set; }
    public string Category { get; set; } = "TECHNICAL"; // TECHNICAL, MEETING_REQUEST, FEATURE_SUGGESTION, BILLING, GENERAL
    public string Priority { get; set; } = "MEDIUM"; // URGENT, HIGH, MEDIUM, LOW
    public string Status { get; set; } = "NEW"; // NEW, IN_PROGRESS, WAITING_CLIENT, RESOLVED, CANCELLED
    public string? MeetingUrl { get; set; }
    public DateTimeOffset? MeetingScheduledAt { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? InternalAdminNotes { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public Guid? ResolvedByUserId { get; set; }

    public Tenant? Tenant { get; set; }
    public Branch? Branch { get; set; }
}
