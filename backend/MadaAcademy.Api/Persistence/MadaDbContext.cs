using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Persistence;

public sealed class MadaDbContext(DbContextOptions<MadaDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<RefreshSession> RefreshSessions => Set<RefreshSession>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<StateTransitionEvent> StateTransitions => Set<StateTransitionEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
            entity.Property(x => x.PlanCode).HasMaxLength(32).IsRequired();
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasIndex(x => new { x.TenantId, x.Code }).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Code).HasMaxLength(40).IsRequired();
            entity.HasOne(x => x.Tenant).WithMany(x => x.Branches).HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(320).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
        });

        modelBuilder.Entity<Membership>(entity =>
        {
            entity.HasIndex(x => new { x.UserAccountId, x.TenantId, x.BranchId, x.RoleCode }).IsUnique();
            entity.Property(x => x.RoleCode).HasMaxLength(32).IsRequired();
            entity.Property(x => x.ScopeLevel).HasMaxLength(32).IsRequired();
            entity.HasOne(x => x.UserAccount).WithMany(x => x.Memberships).HasForeignKey(x => x.UserAccountId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Tenant).WithMany(x => x.Memberships).HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Branch).WithMany(x => x.Memberships).HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Invitation>(entity =>
        {
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => new { x.TenantId, x.Email, x.Status });
            entity.Property(x => x.Email).HasMaxLength(320).IsRequired();
            entity.Property(x => x.RoleCode).HasMaxLength(32).IsRequired();
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasOne(x => x.AcceptedByUser).WithMany(x => x.Invitations).HasForeignKey(x => x.AcceptedByUserId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RefreshSession>(entity =>
        {
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => new { x.UserAccountId, x.RevokedAt });
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasOne(x => x.UserAccount).WithMany(x => x.RefreshSessions).HasForeignKey(x => x.UserAccountId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditEvent>(entity =>
        {
            entity.HasIndex(x => new { x.TenantId, x.CreatedAt });
            entity.HasIndex(x => new { x.TargetType, x.TargetId });
            entity.Property(x => x.Action).HasMaxLength(80).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.TargetId).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<ApprovalRequest>(entity =>
        {
            entity.HasIndex(x => new { x.TenantId, x.BranchId, x.State });
            entity.Property(x => x.RequestType).HasMaxLength(64).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(64).IsRequired();
            entity.Property(x => x.TargetId).HasMaxLength(120).IsRequired();
            entity.Property(x => x.State).HasMaxLength(32).IsRequired();
        });

        modelBuilder.Entity<StateTransitionEvent>(entity =>
        {
            entity.HasIndex(x => new { x.AggregateType, x.AggregateId, x.CreatedAt });
            entity.Property(x => x.AggregateType).HasMaxLength(64).IsRequired();
            entity.Property(x => x.AggregateId).HasMaxLength(120).IsRequired();
            entity.Property(x => x.FromState).HasMaxLength(32).IsRequired();
            entity.Property(x => x.ToState).HasMaxLength(32).IsRequired();
        });
    }
}
