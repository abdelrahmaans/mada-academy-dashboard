namespace MadaAcademy.Api.Persistence.Entities;

public sealed class Competition : EntityBase
{
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public required string Organizer { get; set; }
    public string Season { get; set; } = "2026/2027";
    public string Track { get; set; } = "robotics";
    public int AgeMin { get; set; } = 8;
    public int AgeMax { get; set; } = 16;
    public DateOnly? RegistrationDeadline { get; set; }
    public DateOnly? EventDate { get; set; }
    public string? Location { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public string? Notes { get; set; }
    public Guid? CreatedByUserId { get; set; }
}

public sealed class CompetitionTeam : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid CompetitionId { get; set; }
    public required string Name { get; set; }
    public Guid CoachInstructorId { get; set; }
    public Guid? ClassroomId { get; set; }
    public Guid? KitId { get; set; }
    public string? ProjectTitle { get; set; }
    public string? ProjectDescription { get; set; }
    public string Status { get; set; } = "FORMING";
    public Guid? CreatedByUserId { get; set; }
}

public sealed class CompetitionTeamMember : EntityBase
{
    public Guid TeamId { get; set; }
    public Guid StudentId { get; set; }
    public string RoleInTeam { get; set; } = "MEMBER";
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
    public string Status { get; set; } = "ACTIVE";
    public Guid? CreatedByUserId { get; set; }
}

public sealed class CompetitionAward : EntityBase
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid CompetitionId { get; set; }
    public Guid TeamId { get; set; }
    public required string Title { get; set; }
    public int? Rank { get; set; }
    public DateOnly AwardDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string? CertificateUrl { get; set; }
    public string? PhotosJson { get; set; }
    public bool IsPublishedToHallOfFame { get; set; } = true;
    public Guid? CreatedByUserId { get; set; }
}
