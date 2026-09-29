namespace MadaAcademy.Api.Persistence.Entities;

public sealed class Classroom : EntityBase
{
    public Guid BranchId { get; set; }
    public required string Name { get; set; }
    public int Capacity { get; set; }
    public string Status { get; set; } = "AVAILABLE";
}

public sealed class CourseTemplate : EntityBase
{
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public string Track { get; set; } = "robotics";
    public string Type { get; set; } = "hard";
    public string AgeGroup { get; set; } = "all";
    public string Level { get; set; } = "beginner";
    public int TotalSessions { get; set; }
    public decimal SessionDurationHours { get; set; }
    public int BasePricePiastres { get; set; }
    public string Status { get; set; } = "DRAFT";
}

public sealed class CourseOffering : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid CourseTemplateId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid ClassroomId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string WeeklyScheduleJson { get; set; } = "{}";
    public string Status { get; set; } = "UPCOMING";
    public int MaxStudents { get; set; }
}

public sealed class AcademySession : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid? CourseOfferingId { get; set; }
    public int SessionNumber { get; set; }
    public DateTimeOffset StartAt { get; set; }
    public DateTimeOffset EndAt { get; set; }
    public Guid InstructorId { get; set; }
    public Guid? SubstituteInstructorId { get; set; }
    public Guid ClassroomId { get; set; }
    public string Type { get; set; } = "REGULAR";
    public string Status { get; set; } = "SCHEDULED";
    public DateTimeOffset? CompletedAt { get; set; }
    public string? Notes { get; set; }
}

public sealed class Kit : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public required string Name { get; set; }
    public int QuantityAvailable { get; set; }
    public bool TrackIndividually { get; set; }
}

public sealed class KitAssignment : EntityBase
{
    public Guid SessionId { get; set; }
    public Guid KitId { get; set; }
    public int QuantityUsed { get; set; }
}
