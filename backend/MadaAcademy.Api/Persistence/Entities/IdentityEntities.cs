namespace MadaAcademy.Api.Persistence.Entities;

public abstract class EntityBase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Tenant : EntityBase
{
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public string PlanCode { get; set; } = "STARTER";
    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
}

public sealed class Branch : EntityBase
{
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public required string Code { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public Tenant? Tenant { get; set; }
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
}

public sealed class UserAccount : EntityBase
{
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public string AccountType { get; set; } = "staff";
    public string? DisplayName { get; set; }
    public string Status { get; set; } = "INVITED";
    public DateTimeOffset? LastLoginAt { get; set; }
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<Invitation> Invitations { get; set; } = new List<Invitation>();
    public ICollection<RefreshSession> RefreshSessions { get; set; } = new List<RefreshSession>();
}

public sealed class Membership : EntityBase
{
    public Guid UserAccountId { get; set; }
    public Guid TenantId { get; set; }
    public Guid? BranchId { get; set; }
    public required string RoleCode { get; set; }
    public string ScopeLevel { get; set; } = "TENANT";
    public string Status { get; set; } = "ACTIVE";
    public UserAccount? UserAccount { get; set; }
    public Tenant? Tenant { get; set; }
    public Branch? Branch { get; set; }
}

public sealed class Invitation : EntityBase
{
    public required string Email { get; set; }
    public Guid TenantId { get; set; }
    public Guid? BranchId { get; set; }
    public required string RoleCode { get; set; }
    public required string TokenHash { get; set; }
    public string Status { get; set; } = "PENDING";
    public DateTimeOffset ExpiresAt { get; set; }
    public Guid? AcceptedByUserId { get; set; }
    public UserAccount? AcceptedByUser { get; set; }
}

public sealed class RefreshSession : EntityBase
{
    public Guid UserAccountId { get; set; }
    public required string TokenHash { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? IpAddress { get; set; }
    public UserAccount? UserAccount { get; set; }
}
