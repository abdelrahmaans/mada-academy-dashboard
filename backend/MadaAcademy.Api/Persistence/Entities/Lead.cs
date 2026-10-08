namespace MadaAcademy.Api.Persistence.Entities;

public sealed class Lead : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public required string ChildName { get; set; }
    public required string ParentName { get; set; }
    public required string Phone { get; set; }
    public string Channel { get; set; } = "WALK_IN";
    public string? Notes { get; set; }
    public string Status { get; set; } = "NEW";
    public Guid? CourseOfferingId { get; set; }
    public Guid? ConvertedStudentId { get; set; }
    public Guid? CreatedByUserId { get; set; }
}
