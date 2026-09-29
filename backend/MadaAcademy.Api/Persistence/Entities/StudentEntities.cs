namespace MadaAcademy.Api.Persistence.Entities;

public sealed class Student : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public required string FullName { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public Guid? ReferredByStudentId { get; set; }
}

public sealed class StudentEnrollment : EntityBase
{
    public Guid StudentId { get; set; }
    public Guid CourseOfferingId { get; set; }
    public int FinalPricePiastres { get; set; }
    public string Status { get; set; } = "ACTIVE";
}

public sealed class SessionAttendance : EntityBase
{
    public Guid SessionId { get; set; }
    public Guid StudentId { get; set; }
    public string Status { get; set; } = "PRESENT";
    public int? LateMinutes { get; set; }
}
