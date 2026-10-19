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

public sealed class StudentAccountLink : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid StudentId { get; set; }
    public Guid UserAccountId { get; set; }
    public Guid? CreatedByUserId { get; set; }
}

public sealed class GuardianStudentLink : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid StudentId { get; set; }
    public Guid UserAccountId { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public required string Relationship { get; set; }
    public string Status { get; set; } = "ACTIVE";
}

public sealed class SubscriptionFreezeRequest : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid StudentId { get; set; }
    public Guid? CourseOfferingId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = "TRAVEL";
    public string? ReasonText { get; set; }
    public string Status { get; set; } = "PENDING";
    public string SubmittedByRole { get; set; } = "R08_PARENT";
    public string? SubmittedByName { get; set; }
    public int AffectedSessionsCount { get; set; } = 1;
    public int MakeUpCreditsAwarded { get; set; } = 1;
    public Guid? DecidedByUserId { get; set; }
    public string? DecidedByName { get; set; }
    public string? DecisionNote { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }
}
