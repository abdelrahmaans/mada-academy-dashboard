using System.Security.Claims;
using MadaAcademy.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Reports;

public static class BillingMeterEndpoints
{
    public static IEndpointRouteBuilder MapMadaBillingMeterEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/academy/billing-meter", GetBillingMeterAsync)
            .RequireAuthorization("academy-owner");

        return endpoints;
    }

    private static async Task<IResult> GetBillingMeterAsync(
        ClaimsPrincipal principal,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal.FindFirstValue("tenantId"), out var tenantId))
        {
            return Results.Problem(
                statusCode: 403,
                title: "Missing academy scope",
                extensions: new Dictionary<string, object?> { ["code"] = "MISSING_ACADEMY_SCOPE" });
        }

        var tenant = await db.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            return Results.NotFound(new { error = new { code = "TENANT_NOT_FOUND", message = "Academy was not found." } });
        }

        var normalizedPlan = (tenant.PlanCode ?? "STARTER").Trim().ToUpperInvariant() switch
        {
            "GROWTH" => "GROWTH",
            "ENTERPRISE" or "SCALE" => "ENTERPRISE",
            _ => "STARTER"
        };

        var (planName, studentLimit, branchLimit, staffLimit, recommendedPlan) = normalizedPlan switch
        {
            "GROWTH" => ("باقة النمو الاحترافية (Growth)", 500, 3, 25, "ENTERPRISE"),
            "ENTERPRISE" => ("باقة المؤسسات (Enterprise)", 10000, 99, 999, "ENTERPRISE"),
            _ => ("الباقة الأساسية (Starter)", 100, 1, 5, "GROWTH")
        };

        var activeStudents = await db.Students.AsNoTracking()
            .CountAsync(s => s.TenantId == tenantId && s.Status == "ACTIVE", cancellationToken);

        var activeBranches = await db.Branches.AsNoTracking()
            .CountAsync(b => b.TenantId == tenantId && b.Status == "ACTIVE", cancellationToken);

        var activeStaff = await db.Memberships.AsNoTracking()
            .CountAsync(m => m.TenantId == tenantId && m.Status == "ACTIVE" &&
                             m.RoleCode != "R08_PARENT" && m.RoleCode != "R09_STUDENT", cancellationToken);

        var studentUsagePct = studentLimit > 0 ? Math.Round((decimal)activeStudents * 100m / studentLimit, 1) : 0m;
        var branchUsagePct = branchLimit > 0 ? Math.Round((decimal)activeBranches * 100m / branchLimit, 1) : 0m;
        var staffUsagePct = staffLimit > 0 ? Math.Round((decimal)activeStaff * 100m / staffLimit, 1) : 0m;

        var isStudentLimitExceeded = activeStudents > studentLimit;
        var isBranchLimitExceeded = activeBranches > branchLimit;
        var isStaffLimitExceeded = activeStaff > staffLimit;
        var isNearStudentLimit = studentUsagePct >= 80m && !isStudentLimitExceeded;

        var warnings = new List<string>();

        if (tenant.Status == "TRIAL")
        {
            warnings.Add("الأكاديمية حالياً في الفترة التجريبية (Trial). جميع العمليات متاحة لعرض التجربة وتسهيل التجهيز.");
        }

        if (isStudentLimitExceeded)
        {
            warnings.Add($"تجاوزت الأكاديمية الحد الأقصى لسعة الطلاب في باقة {planName} ({studentLimit} طالب). يرجى الترقية إلى باقة أعلى لدعم التوسع.");
        }
        else if (isNearStudentLimit)
        {
            warnings.Add($"استهلكت الأكاديمية {studentUsagePct}% من السعة المتاحة للطلاب ({activeStudents} من {studentLimit}). ننصح بالترقية لتفادي قيود التسجيل القادمة.");
        }

        if (isBranchLimitExceeded)
        {
            warnings.Add($"عدد الفروع النشطة ({activeBranches}) تجاوز الحد المصرح به في الباقة ({branchLimit} فرع).");
        }

        if (isStaffLimitExceeded)
        {
            warnings.Add($"عدد الموظفين النشطين ({activeStaff}) تجاوز الحد المسموح به في الباقة ({staffLimit} موظف).");
        }

        var isTrial = tenant.Status == "TRIAL";
        var canUpgrade = normalizedPlan != "ENTERPRISE";

        return Results.Ok(new
        {
            data = new
            {
                tenantId = tenant.Id,
                tenantName = tenant.Name,
                tenantStatus = tenant.Status,
                isTrial,
                planCode = normalizedPlan,
                planName,
                students = new
                {
                    activeCount = activeStudents,
                    limit = studentLimit,
                    usagePercentage = studentUsagePct,
                    isNearLimit = isNearStudentLimit,
                    isLimitExceeded = isStudentLimitExceeded,
                    remainingSlots = Math.Max(0, studentLimit - activeStudents)
                },
                branches = new
                {
                    activeCount = activeBranches,
                    limit = branchLimit,
                    usagePercentage = branchUsagePct,
                    isLimitExceeded = isBranchLimitExceeded,
                    remainingSlots = Math.Max(0, branchLimit - activeBranches)
                },
                staff = new
                {
                    activeCount = activeStaff,
                    limit = staffLimit,
                    usagePercentage = staffUsagePct,
                    isLimitExceeded = isStaffLimitExceeded,
                    remainingSlots = Math.Max(0, staffLimit - activeStaff)
                },
                warnings,
                canUpgrade,
                recommendedPlan
            }
        });
    }
}
