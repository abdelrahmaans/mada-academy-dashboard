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
    public DbSet<ConsumerInvitation> ConsumerInvitations => Set<ConsumerInvitation>();
    public DbSet<RefreshSession> RefreshSessions => Set<RefreshSession>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<StateTransitionEvent> StateTransitions => Set<StateTransitionEvent>();
    public DbSet<Classroom> Classrooms => Set<Classroom>();
    public DbSet<ClassroomResource> ClassroomResources => Set<ClassroomResource>();
    public DbSet<CourseTemplate> CourseTemplates => Set<CourseTemplate>();
    public DbSet<CourseOffering> CourseOfferings => Set<CourseOffering>();
    public DbSet<AcademySession> AcademySessions => Set<AcademySession>();
    public DbSet<Kit> Kits => Set<Kit>();
    public DbSet<KitAssignment> KitAssignments => Set<KitAssignment>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
    public DbSet<StudentAccountLink> StudentAccountLinks => Set<StudentAccountLink>();
    public DbSet<GuardianStudentLink> GuardianStudentLinks => Set<GuardianStudentLink>();
    public DbSet<SessionAttendance> SessionAttendances => Set<SessionAttendance>();
    public DbSet<SessionSubstitutionProposal> SessionSubstitutionProposals => Set<SessionSubstitutionProposal>();
    public DbSet<SessionEvaluation> SessionEvaluations => Set<SessionEvaluation>();
    public DbSet<InAppNotification> InAppNotifications => Set<InAppNotification>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<PaymentEvidence> PaymentEvidences => Set<PaymentEvidence>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ExpenseEvidence> ExpenseEvidences => Set<ExpenseEvidence>();

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
            entity.HasIndex(x => new { x.Phone, x.AccountType }).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(320).IsRequired(false);
            entity.Property(x => x.Phone).HasMaxLength(32).IsRequired();
            entity.Property(x => x.AccountType).HasMaxLength(16).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(256);
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

        modelBuilder.Entity<ConsumerInvitation>(entity =>
        {
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => new { x.Phone, x.AccountType, x.Status });
            entity.HasIndex(x => new { x.StudentId, x.AccountType, x.Status });
            entity.HasIndex(x => new { x.Phone, x.AccountType }).IsUnique().HasFilter("\"Status\" = 'PENDING'");
            entity.Property(x => x.Phone).HasMaxLength(32).IsRequired();
            entity.Property(x => x.AccountType).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Relationship).HasMaxLength(64);
            entity.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
            entity.Property(x => x.OtpHash).HasMaxLength(64).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
            entity.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Tenant>().WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.InvitedByUserId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.AcceptedByUserId).OnDelete(DeleteBehavior.SetNull);
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

        modelBuilder.Entity<Classroom>(entity =>
        {
            entity.HasIndex(x => new { x.BranchId, x.Name }).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
        });
        modelBuilder.Entity<ClassroomResource>(entity =>
        {
            entity.HasIndex(x => new { x.ClassroomId, x.Kind, x.Name }).IsUnique();
            entity.Property(x => x.Kind).HasMaxLength(24).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
        });
        modelBuilder.Entity<CourseTemplate>(entity =>
        {
            entity.HasIndex(x => new { x.TenantId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.SessionDurationHours).HasPrecision(6, 2);
        });
        modelBuilder.Entity<CourseOffering>(entity =>
        {
            entity.HasIndex(x => new { x.BranchId, x.Status });
            entity.Property(x => x.WeeklyScheduleJson).HasColumnType("jsonb");
        });
        modelBuilder.Entity<AcademySession>(entity =>
        {
            entity.HasIndex(x => new { x.BranchId, x.StartAt, x.EndAt });
            entity.HasIndex(x => new { x.InstructorId, x.StartAt, x.EndAt });
            entity.HasIndex(x => new { x.ClassroomId, x.StartAt, x.EndAt });
            entity.Property(x => x.Notes).HasMaxLength(2000);
        });
        modelBuilder.Entity<Kit>(entity =>
        {
            entity.HasIndex(x => new { x.BranchId, x.Name }).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
        });
        modelBuilder.Entity<KitAssignment>(entity =>
        {
            entity.HasIndex(x => new { x.SessionId, x.KitId }).IsUnique();
        });
        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasIndex(x => new { x.TenantId, x.BranchId, x.Status });
            entity.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        });
        modelBuilder.Entity<StudentEnrollment>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.CourseOfferingId }).IsUnique();
        });
        modelBuilder.Entity<StudentAccountLink>(entity =>
        {
            entity.HasIndex(x => x.StudentId).IsUnique();
            entity.HasIndex(x => new { x.UserAccountId, x.TenantId }).IsUnique();
            entity.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserAccountId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<GuardianStudentLink>(entity =>
        {
            entity.HasIndex(x => new { x.UserAccountId, x.StudentId }).IsUnique();
            entity.HasIndex(x => new { x.TenantId, x.StudentId, x.Status });
            entity.Property(x => x.Relationship).HasMaxLength(64).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
            entity.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserAccountId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<SessionAttendance>(entity =>
        {
            entity.HasIndex(x => new { x.SessionId, x.StudentId }).IsUnique();
        });
        modelBuilder.Entity<SessionSubstitutionProposal>(entity =>
        {
            entity.HasIndex(x => new { x.ApprovalRequestId, x.ProposedInstructorId }).IsUnique();
            entity.Property(x => x.State).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(1000);
        });
        modelBuilder.Entity<SessionEvaluation>(entity =>
        {
            entity.HasIndex(x => new { x.SessionId, x.StudentId }).IsUnique();
            entity.HasIndex(x => x.Status);
            entity.Property(x => x.Notes).HasMaxLength(2000);
            entity.Property(x => x.Status).HasMaxLength(32).HasDefaultValue("DRAFT").IsRequired();
            entity.Property(x => x.ReviewNote).HasMaxLength(1000);
        });
        modelBuilder.Entity<InAppNotification>(entity =>
        {
            entity.HasIndex(x => new { x.RecipientUserId, x.IsRead, x.CreatedAt });
            entity.Property(x => x.Type).HasMaxLength(64).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Body).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(64);
            entity.Property(x => x.TargetId).HasMaxLength(120);
        });
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(x => x.InvoiceNumber).IsUnique();
            entity.HasIndex(x => new { x.TenantId, x.BranchId, x.Status, x.DueDate });
            entity.HasIndex(x => new { x.StudentId, x.IssueDate });
            entity.Property(x => x.InvoiceNumber).HasMaxLength(48).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(24).IsRequired();
            entity.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<StudentEnrollment>().WithMany().HasForeignKey(x => x.EnrollmentId).OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<InvoiceLine>(entity =>
        {
            entity.HasIndex(x => new { x.InvoiceId, x.LineNumber }).IsUnique();
            entity.Property(x => x.Description).HasMaxLength(240).IsRequired();
            entity.HasOne(x => x.Invoice).WithMany(x => x.Lines).HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasIndex(x => new { x.InvoiceId, x.CreatedAt });
            entity.HasIndex(x => new { x.TenantId, x.BranchId, x.ReceivedOn });
            entity.Property(x => x.Method).HasMaxLength(24).IsRequired();
            entity.Property(x => x.ExternalReference).HasMaxLength(120);
            entity.Property(x => x.Note).HasMaxLength(500);
            entity.HasOne(x => x.Invoice).WithMany(x => x.Payments).HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<PaymentEvidence>(entity =>
        {
            entity.HasIndex(x => x.PaymentTransactionId).IsUnique();
            entity.Property(x => x.StorageKey).HasMaxLength(240).IsRequired();
            entity.Property(x => x.DisplayFileName).HasMaxLength(180).IsRequired();
            entity.Property(x => x.ContentType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Sha256).HasMaxLength(64).IsRequired();
            entity.HasOne(x => x.PaymentTransaction).WithOne(x => x.Evidence).HasForeignKey<PaymentEvidence>(x => x.PaymentTransactionId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasIndex(x => new { x.TenantId, x.BranchId, x.Status, x.SpentOn });
            entity.HasIndex(x => new { x.TenantId, x.ApprovalRequestId }).IsUnique().HasFilter("\"ApprovalRequestId\" IS NOT NULL");
            entity.Property(x => x.Description).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(64).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(24).IsRequired();
            entity.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ApprovalRequest).WithMany().HasForeignKey(x => x.ApprovalRequestId).OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<ExpenseEvidence>(entity =>
        {
            entity.HasIndex(x => x.ExpenseId).IsUnique();
            entity.Property(x => x.StorageKey).HasMaxLength(240).IsRequired();
            entity.Property(x => x.DisplayFileName).HasMaxLength(180).IsRequired();
            entity.Property(x => x.ContentType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Sha256).HasMaxLength(64).IsRequired();
            entity.HasOne(x => x.Expense).WithOne(x => x.Evidence).HasForeignKey<ExpenseEvidence>(x => x.ExpenseId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
