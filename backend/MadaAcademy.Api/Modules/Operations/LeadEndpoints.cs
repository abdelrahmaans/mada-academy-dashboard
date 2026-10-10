using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Operations;

public static class LeadEndpoints
{
    public static IEndpointRouteBuilder MapMadaLeadEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1").RequireAuthorization("staff");

        group.MapGet("/leads", async Task<Results<Ok<ApiEnvelope<LeadListResponse>>, ProblemHttpResult>> (
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;

            var query = db.Leads.AsNoTracking()
                .Where(lead => lead.TenantId == scope.TenantId)
                .Where(lead => scope.BranchId == null || lead.BranchId == scope.BranchId.Value);

            var items = await query
                .OrderByDescending(lead => lead.CreatedAt)
                .Select(lead => new LeadItem(
                    lead.Id,
                    lead.BranchId,
                    lead.ChildName,
                    lead.ParentName,
                    lead.Phone,
                    lead.Channel,
                    lead.CampaignId,
                    lead.Notes,
                    lead.Status,
                    lead.CourseOfferingId,
                    lead.CourseOfferingId == null ? null : db.CourseOfferings.Where(o => o.Id == lead.CourseOfferingId).Join(db.CourseTemplates, o => o.CourseTemplateId, t => t.Id, (_, t) => t.Name).FirstOrDefault(),
                    lead.ConvertedStudentId,
                    lead.CreatedAt))
                .ToListAsync(cancellationToken);

            var total = items.Count;
            var overdue = items.Count(i => i.Status == "NEW");
            var active = items.Count(i => i.Status == "NEW" || i.Status == "CONTACTED" || i.Status == "INTERESTED");

            return TypedResults.Ok(new ApiEnvelope<LeadListResponse>(new LeadListResponse(items, total, overdue, active)));
        });

        group.MapPost("/leads", async Task<Results<Ok<ApiEnvelope<LeadItem>>, ProblemHttpResult>> (
            CreateLeadRequest request,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            if (string.IsNullOrWhiteSpace(request.ChildName)) return Problem(400, "INVALID_CHILD_NAME", "Child name is required.");
            if (string.IsNullOrWhiteSpace(request.ParentName)) return Problem(400, "INVALID_PARENT_NAME", "Parent name is required.");
            if (string.IsNullOrWhiteSpace(request.Phone)) return Problem(400, "INVALID_PHONE", "Parent phone is required.");

            var branchId = request.BranchId ?? scope.BranchId;
            if (branchId == null)
            {
                var defaultBranch = await db.Branches.Where(b => b.TenantId == scope.TenantId).Select(b => b.Id).FirstOrDefaultAsync(cancellationToken);
                branchId = defaultBranch;
            }
            if (branchId == null) return Problem(400, "BRANCH_REQUIRED", "A valid branch is required.");
            if (request.CampaignId.HasValue && !await db.MarketingCampaigns.AnyAsync(x => x.Id == request.CampaignId.Value && x.TenantId == scope.TenantId && x.BranchId == branchId.Value, cancellationToken))
                return Problem(400, "CAMPAIGN_NOT_FOUND", "Campaign not found in the selected branch.");

            Guid.TryParse(user.FindFirstValue("sub"), out var actorId);

            var lead = new Lead
            {
                TenantId = scope.TenantId,
                BranchId = branchId.Value,
                ChildName = request.ChildName.Trim(),
                ParentName = request.ParentName.Trim(),
                Phone = request.Phone.Trim(),
                Channel = request.Channel?.Trim() ?? "WALK_IN",
                CampaignId = request.CampaignId,
                Notes = request.Notes?.Trim(),
                Status = "NEW",
                CourseOfferingId = request.CourseOfferingId,
                CreatedByUserId = actorId
            };

            db.Leads.Add(lead);
            await db.SaveChangesAsync(cancellationToken);

            string? courseName = null;
            if (lead.CourseOfferingId.HasValue)
            {
                courseName = await db.CourseOfferings.Where(o => o.Id == lead.CourseOfferingId)
                    .Join(db.CourseTemplates, o => o.CourseTemplateId, t => t.Id, (_, t) => t.Name)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            var item = new LeadItem(
                lead.Id,
                lead.BranchId,
                lead.ChildName,
                lead.ParentName,
                lead.Phone,
                lead.Channel,
                lead.CampaignId,
                lead.Notes,
                lead.Status,
                lead.CourseOfferingId,
                courseName,
                lead.ConvertedStudentId,
                lead.CreatedAt);

            return TypedResults.Ok(new ApiEnvelope<LeadItem>(item));
        });

        group.MapPatch("/leads/{id:guid}/status", async Task<Results<Ok<ApiEnvelope<LeadItem>>, ProblemHttpResult>> (
            Guid id,
            UpdateLeadStatusRequest request,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == scope.TenantId && (scope.BranchId == null || l.BranchId == scope.BranchId.Value), cancellationToken);
            if (lead is null) return Problem(404, "LEAD_NOT_FOUND", "Lead not found in current scope.");

            var allowedStatuses = new[] { "NEW", "CONTACTED", "INTERESTED", "REGISTERED", "ARCHIVED" };
            var newStatus = request.Status?.ToUpperInvariant();
            if (newStatus == null || !allowedStatuses.Contains(newStatus))
                return Problem(400, "INVALID_STATUS", "Status must be NEW, CONTACTED, INTERESTED, REGISTERED, or ARCHIVED.");

            lead.Status = newStatus;
            await db.SaveChangesAsync(cancellationToken);

            string? courseName = null;
            if (lead.CourseOfferingId.HasValue)
            {
                courseName = await db.CourseOfferings.Where(o => o.Id == lead.CourseOfferingId)
                    .Join(db.CourseTemplates, o => o.CourseTemplateId, t => t.Id, (_, t) => t.Name)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            return TypedResults.Ok(new ApiEnvelope<LeadItem>(new LeadItem(
                lead.Id,
                lead.BranchId,
                lead.ChildName,
                lead.ParentName,
                lead.Phone,
                lead.Channel,
                lead.CampaignId,
                lead.Notes,
                lead.Status,
                lead.CourseOfferingId,
                courseName,
                lead.ConvertedStudentId,
                lead.CreatedAt)));
        });

        group.MapPost("/leads/{id:guid}/convert", async Task<Results<Ok<ApiEnvelope<ConvertLeadResponse>>, ProblemHttpResult>> (
            Guid id,
            ConvertLeadRequest request,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == scope.TenantId && (scope.BranchId == null || l.BranchId == scope.BranchId.Value), cancellationToken);
            if (lead is null) return Problem(404, "LEAD_NOT_FOUND", "Lead not found in current scope.");

            var courseOfferingId = request.CourseOfferingId ?? lead.CourseOfferingId;
            CourseOffering? offering = null;
            CourseTemplate? template = null;

            if (courseOfferingId.HasValue)
            {
                offering = await db.CourseOfferings.FirstOrDefaultAsync(o => o.Id == courseOfferingId.Value && o.TenantId == scope.TenantId && (scope.BranchId == null || o.BranchId == scope.BranchId.Value), cancellationToken);
                if (offering is null) return Problem(400, "OFFERING_NOT_FOUND", "Selected course group was not found.");

                template = await db.CourseTemplates.FirstOrDefaultAsync(t => t.Id == offering.CourseTemplateId, cancellationToken);
                var enrolledCount = await db.StudentEnrollments.CountAsync(e => e.CourseOfferingId == offering.Id && e.Status == "ACTIVE", cancellationToken);
                if (enrolledCount >= offering.MaxStudents)
                    return Problem(400, "GROUP_FULL", "Selected course group has reached maximum capacity.");
            }

            var student = new Student
            {
                TenantId = scope.TenantId,
                BranchId = lead.BranchId,
                FullName = lead.ChildName.Trim(),
                DateOfBirth = request.DateOfBirth,
                Status = "ACTIVE"
            };
            db.Students.Add(student);

            StudentEnrollment? enrollment = null;
            Invoice? invoice = null;

            if (offering != null && template != null)
            {
                var basePrice = template.BasePricePiastres;
                var discountPercent = request.DiscountPercent ?? 0;
                var finalPrice = Math.Max(0, basePrice - (basePrice * discountPercent / 100));

                enrollment = new StudentEnrollment
                {
                    StudentId = student.Id,
                    CourseOfferingId = offering.Id,
                    FinalPricePiastres = finalPrice,
                    Status = "ACTIVE"
                };
                db.StudentEnrollments.Add(enrollment);

                if (request.CreateInvoice)
                {
                    var count = await db.Invoices.CountAsync(i => i.TenantId == scope.TenantId, cancellationToken);
                    var branch = await db.Branches.FindAsync([lead.BranchId], cancellationToken);
                    var branchCode = branch?.Code ?? "MAIN";
                    var invoiceNumber = $"MAD-{branchCode}-{DateTime.UtcNow.Year}-{(count + 1):D4}";

                    Guid.TryParse(user.FindFirstValue("sub"), out var actorId);
                    invoice = new Invoice
                    {
                        TenantId = scope.TenantId,
                        BranchId = lead.BranchId,
                        StudentId = student.Id,
                        EnrollmentId = enrollment.Id,
                        InvoiceNumber = invoiceNumber,
                        IssueDate = DateOnly.FromDateTime(DateTime.UtcNow),
                        DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
                        TotalPiastres = finalPrice,
                        Status = "UNPAID",
                        CreatedByUserId = actorId
                    };
                    invoice.Lines.Add(new InvoiceLine
                    {
                        LineNumber = 1,
                        Description = $"{template.Name} {(discountPercent > 0 ? $"(خصم {discountPercent}%)" : "")}".Trim(),
                        AmountPiastres = finalPrice
                    });
                    db.Invoices.Add(invoice);
                }
            }

            lead.Status = "REGISTERED";
            lead.ConvertedStudentId = student.Id;

            await db.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<ConvertLeadResponse>(new ConvertLeadResponse(
                student.Id,
                lead.Id,
                enrollment?.Id,
                invoice?.Id,
                invoice?.InvoiceNumber,
                student.FullName)));
        });

        group.MapPost("/students/register", async Task<Results<Ok<ApiEnvelope<ConvertLeadResponse>>, ProblemHttpResult>> (
            DirectStudentRegistrationRequest request,
            ClaimsPrincipal user,
            MadaDbContext db,
            CancellationToken cancellationToken) =>
        {
            if (!TryGetScope(user, out var scope, out var scopeError)) return scopeError;
            if (string.IsNullOrWhiteSpace(request.FullName)) return Problem(400, "INVALID_NAME", "Student full name is required.");

            var branchId = request.BranchId ?? scope.BranchId;
            if (branchId == null)
            {
                var defaultBranch = await db.Branches.Where(b => b.TenantId == scope.TenantId).Select(b => b.Id).FirstOrDefaultAsync(cancellationToken);
                branchId = defaultBranch;
            }
            if (branchId == null) return Problem(400, "BRANCH_REQUIRED", "A valid branch is required.");

            CourseOffering? offering = null;
            CourseTemplate? template = null;

            if (request.CourseOfferingId.HasValue)
            {
                offering = await db.CourseOfferings.FirstOrDefaultAsync(o => o.Id == request.CourseOfferingId.Value && o.TenantId == scope.TenantId && (scope.BranchId == null || o.BranchId == scope.BranchId.Value), cancellationToken);
                if (offering is null) return Problem(400, "OFFERING_NOT_FOUND", "Selected course group was not found.");

                template = await db.CourseTemplates.FirstOrDefaultAsync(t => t.Id == offering.CourseTemplateId, cancellationToken);
                var enrolledCount = await db.StudentEnrollments.CountAsync(e => e.CourseOfferingId == offering.Id && e.Status == "ACTIVE", cancellationToken);
                if (enrolledCount >= offering.MaxStudents)
                    return Problem(400, "GROUP_FULL", "Selected course group has reached maximum capacity.");
            }

            var student = new Student
            {
                TenantId = scope.TenantId,
                BranchId = branchId.Value,
                FullName = request.FullName.Trim(),
                DateOfBirth = request.DateOfBirth,
                Status = "ACTIVE"
            };
            db.Students.Add(student);

            StudentEnrollment? enrollment = null;
            Invoice? invoice = null;

            if (offering != null && template != null)
            {
                var basePrice = template.BasePricePiastres;
                var discountPercent = request.DiscountPercent ?? 0;
                var finalPrice = Math.Max(0, basePrice - (basePrice * discountPercent / 100));

                enrollment = new StudentEnrollment
                {
                    StudentId = student.Id,
                    CourseOfferingId = offering.Id,
                    FinalPricePiastres = finalPrice,
                    Status = "ACTIVE"
                };
                db.StudentEnrollments.Add(enrollment);

                if (request.CreateInvoice)
                {
                    var count = await db.Invoices.CountAsync(i => i.TenantId == scope.TenantId, cancellationToken);
                    var branch = await db.Branches.FindAsync([branchId.Value], cancellationToken);
                    var branchCode = branch?.Code ?? "MAIN";
                    var invoiceNumber = $"MAD-{branchCode}-{DateTime.UtcNow.Year}-{(count + 1):D4}";

                    Guid.TryParse(user.FindFirstValue("sub"), out var actorId);
                    invoice = new Invoice
                    {
                        TenantId = scope.TenantId,
                        BranchId = branchId.Value,
                        StudentId = student.Id,
                        EnrollmentId = enrollment.Id,
                        InvoiceNumber = invoiceNumber,
                        IssueDate = DateOnly.FromDateTime(DateTime.UtcNow),
                        DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
                        TotalPiastres = finalPrice,
                        Status = "UNPAID",
                        CreatedByUserId = actorId
                    };
                    invoice.Lines.Add(new InvoiceLine
                    {
                        LineNumber = 1,
                        Description = $"{template.Name} {(discountPercent > 0 ? $"(خصم {discountPercent}%)" : "")}".Trim(),
                        AmountPiastres = finalPrice
                    });
                    db.Invoices.Add(invoice);
                }
            }

            await db.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new ApiEnvelope<ConvertLeadResponse>(new ConvertLeadResponse(
                student.Id,
                null,
                enrollment?.Id,
                invoice?.Id,
                invoice?.InvoiceNumber,
                student.FullName)));
        });

        return endpoints;
    }

    private static bool TryGetScope(ClaimsPrincipal user, out Scope scope, out ProblemHttpResult error)
    {
        if (!Guid.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
        {
            scope = default;
            error = Problem(403, "TENANT_SCOPE_REQUIRED", "The authenticated account has no tenant scope.");
            return false;
        }
        var branchClaim = user.FindFirstValue("branchId");
        scope = new Scope(tenantId, Guid.TryParse(branchClaim, out var branchId) ? branchId : null, user.FindFirstValue("scopeLevel") ?? "unknown");
        error = default!;
        return true;
    }

    private static ProblemHttpResult Problem(int status, string code, string detail) =>
        TypedResults.Problem(statusCode: status, title: code, detail: detail,
            extensions: new Dictionary<string, object?> { ["code"] = code });

    private readonly record struct Scope(Guid TenantId, Guid? BranchId, string ScopeLevel);
}

public sealed record LeadListResponse(IReadOnlyList<LeadItem> Items, int Total, int Overdue, int Active);
public sealed record LeadItem(Guid Id, Guid BranchId, string ChildName, string ParentName, string Phone, string Channel, Guid? CampaignId, string? Notes, string Status, Guid? CourseOfferingId, string? CourseName, Guid? ConvertedStudentId, DateTimeOffset CreatedAt);
public sealed record CreateLeadRequest(string ChildName, string ParentName, string Phone, string? Channel, string? Notes, Guid? CourseOfferingId, Guid? BranchId, Guid? CampaignId);
public sealed record UpdateLeadStatusRequest(string Status);
public sealed record ConvertLeadRequest(Guid? CourseOfferingId, DateOnly? DateOfBirth, int? DiscountPercent, bool CreateInvoice = true);
public sealed record DirectStudentRegistrationRequest(string FullName, string? Phone, Guid? BranchId, Guid? CourseOfferingId, DateOnly? DateOfBirth, int? DiscountPercent, bool CreateInvoice = true);
public sealed record ConvertLeadResponse(Guid StudentId, Guid? LeadId, Guid? EnrollmentId, Guid? InvoiceId, string? InvoiceNumber, string StudentName);
