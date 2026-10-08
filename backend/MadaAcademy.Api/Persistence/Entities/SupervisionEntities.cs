namespace MadaAcademy.Api.Persistence.Entities;

public sealed class GroupSupervisionAssignment : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid SupervisorUserId { get; set; }
    public Guid CourseOfferingId { get; set; }
    public bool CanReadAttendance { get; set; } = true;
    public bool CanReviewEvaluations { get; set; } = true;
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? EndsAt { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public Guid? RevokedByUserId { get; set; }
}
