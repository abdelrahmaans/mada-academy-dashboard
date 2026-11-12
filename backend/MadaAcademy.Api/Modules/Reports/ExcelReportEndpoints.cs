using System.Security.Claims;
using ClosedXML.Excel;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadaAcademy.Api.Modules.Reports;

public static class ExcelReportEndpoints
{
    public static IEndpointRouteBuilder MapMadaExcelReportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var reports = endpoints.MapGroup("/api/v1/reports").RequireAuthorization("staff");
        reports.MapGet("/operational.xlsx", ExportOperationalExcelAsync).RequirePermission("reports.read");

        var finance = endpoints.MapGroup("/api/v1/finance").RequireAuthorization("staff");
        finance.MapGet("/reports/summary.xlsx", ExportFinanceSummaryExcelAsync).RequirePermission("finance.summary.read");
        finance.MapGet("/invoices.xlsx", ExportInvoicesExcelAsync).RequirePermission("invoices.read");

        return endpoints;
    }

    private static async Task<IResult> ExportOperationalExcelAsync(
        HttpContext context,
        MadaDbContext db,
        DateOnly? from,
        DateOnly? to,
        Guid? branchId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");

        var branchScope = Guid.TryParse(context.User.FindFirstValue("branchId"), out var userBranch) ? (Guid?)userBranch : branchId;

        var fromDate = from.HasValue ? new DateTimeOffset(from.Value.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero) : DateTimeOffset.UtcNow.AddDays(-30);
        var toDate = to.HasValue ? new DateTimeOffset(to.Value.ToDateTime(TimeOnly.MaxValue), TimeSpan.Zero) : DateTimeOffset.UtcNow;

        var sessions = await db.AcademySessions.AsNoTracking()
            .Where(s => s.TenantId == tenantId && (!branchScope.HasValue || s.BranchId == branchScope.Value) && s.StartAt >= fromDate && s.StartAt <= toDate)
            .OrderByDescending(s => s.StartAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Operational Report");
        worksheet.RightToLeft = true;

        worksheet.Cell(1, 1).Value = "تقرير العمليات والجلسات - أكاديمية مدى";
        worksheet.Range(1, 1, 1, 6).Merge().Style.Font.SetBold().Font.SetFontSize(14).Font.SetFontColor(XLColor.FromHtml("#0D9488"));

        var headers = new[] { "معرف الجلسة", "رقم الجلسة", "تاريخ البدء", "تاريخ الانتهاء", "الحالة", "القاعة" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(3, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.SetBold();
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F1F5F9"));
            cell.Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin);
        }

        int row = 4;
        foreach (var s in sessions)
        {
            worksheet.Cell(row, 1).Value = s.Id.ToString()[..8];
            worksheet.Cell(row, 2).Value = s.SessionNumber;
            worksheet.Cell(row, 3).Value = s.StartAt.ToString("yyyy-MM-dd HH:mm");
            worksheet.Cell(row, 4).Value = s.EndAt.ToString("yyyy-MM-dd HH:mm");
            worksheet.Cell(row, 5).Value = s.Status;
            worksheet.Cell(row, 6).Value = s.ClassroomId.ToString()[..8];
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var bytes = stream.ToArray();

        return Results.File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"operational-report-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    private static async Task<IResult> ExportFinanceSummaryExcelAsync(
        HttpContext context,
        MadaDbContext db,
        DateOnly? from,
        DateOnly? to,
        Guid? branchId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");

        var branchScope = Guid.TryParse(context.User.FindFirstValue("branchId"), out var userBranch) ? (Guid?)userBranch : branchId;

        var fromDate = from ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
        var toDate = to ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var payments = await db.PaymentTransactions.AsNoTracking()
            .Where(p => p.TenantId == tenantId && (!branchScope.HasValue || p.BranchId == branchScope.Value) && p.ReceivedOn >= fromDate && p.ReceivedOn <= toDate)
            .OrderByDescending(p => p.ReceivedOn)
            .ToListAsync(cancellationToken);

        var expenses = await db.Expenses.AsNoTracking()
            .Where(e => e.TenantId == tenantId && (!branchScope.HasValue || e.BranchId == branchScope.Value) && e.SpentOn >= fromDate && e.SpentOn <= toDate)
            .OrderByDescending(e => e.SpentOn)
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();
        var wsSummary = workbook.Worksheets.Add("Finance Summary");
        wsSummary.RightToLeft = true;

        wsSummary.Cell(1, 1).Value = "الملخص المالي - أكاديمية مدى";
        wsSummary.Range(1, 1, 1, 5).Merge().Style.Font.SetBold().Font.SetFontSize(14).Font.SetFontColor(XLColor.FromHtml("#0D9488"));

        var totalCollected = payments.Sum(p => p.AmountPiastres) / 100.0;
        var totalExpenses = expenses.Where(e => e.Status == "APPROVED").Sum(e => e.AmountPiastres) / 100.0;
        var net = totalCollected - totalExpenses;

        wsSummary.Cell(3, 1).Value = "إجمالي التحصيل (ج.م):";
        wsSummary.Cell(3, 2).Value = totalCollected;
        wsSummary.Cell(3, 1).Style.Font.SetBold();

        wsSummary.Cell(4, 1).Value = "إجمالي المصروفات المعتمدة (ج.م):";
        wsSummary.Cell(4, 2).Value = totalExpenses;
        wsSummary.Cell(4, 1).Style.Font.SetBold();

        wsSummary.Cell(5, 1).Value = "صافي الحركة النقدية (ج.م):";
        wsSummary.Cell(5, 2).Value = net;
        wsSummary.Cell(5, 1).Style.Font.SetBold().Font.SetFontColor(net >= 0 ? XLColor.Green : XLColor.Red);

        // Sheet 2: Payments
        var wsPayments = workbook.Worksheets.Add("Payments");
        wsPayments.RightToLeft = true;
        var pHeaders = new[] { "رقم الدفعة", "المبلغ (ج.م)", "طريقة الدفع", "تاريخ الدفع", "المرجع الخارجي" };
        for (int i = 0; i < pHeaders.Length; i++)
        {
            var cell = wsPayments.Cell(1, i + 1);
            cell.Value = pHeaders[i];
            cell.Style.Font.SetBold();
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#E0F2FE"));
        }
        int pRow = 2;
        foreach (var p in payments)
        {
            wsPayments.Cell(pRow, 1).Value = p.Id.ToString()[..8];
            wsPayments.Cell(pRow, 2).Value = p.AmountPiastres / 100.0;
            wsPayments.Cell(pRow, 3).Value = p.Method;
            wsPayments.Cell(pRow, 4).Value = p.ReceivedOn.ToString("yyyy-MM-dd");
            wsPayments.Cell(pRow, 5).Value = p.ExternalReference ?? "—";
            pRow++;
        }

        // Sheet 3: Expenses
        var wsExpenses = workbook.Worksheets.Add("Expenses");
        wsExpenses.RightToLeft = true;
        var eHeaders = new[] { "رقم المصروف", "الوصف", "المبلغ (ج.م)", "التصنيف", "الحالة", "التاريخ" };
        for (int i = 0; i < eHeaders.Length; i++)
        {
            var cell = wsExpenses.Cell(1, i + 1);
            cell.Value = eHeaders[i];
            cell.Style.Font.SetBold();
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#FEF3C7"));
        }
        int eRow = 2;
        foreach (var e in expenses)
        {
            wsExpenses.Cell(eRow, 1).Value = e.Id.ToString()[..8];
            wsExpenses.Cell(eRow, 2).Value = e.Description;
            wsExpenses.Cell(eRow, 3).Value = e.AmountPiastres / 100.0;
            wsExpenses.Cell(eRow, 4).Value = e.Category;
            wsExpenses.Cell(eRow, 5).Value = e.Status;
            wsExpenses.Cell(eRow, 6).Value = e.SpentOn.ToString("yyyy-MM-dd");
            eRow++;
        }

        wsSummary.Columns().AdjustToContents();
        wsPayments.Columns().AdjustToContents();
        wsExpenses.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var bytes = stream.ToArray();

        return Results.File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"finance-summary-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    private static async Task<IResult> ExportInvoicesExcelAsync(
        HttpContext context,
        MadaDbContext db,
        Guid? studentId,
        string? status,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(context.User.FindFirstValue("tenantId"), out var tenantId))
            return Results.Problem(statusCode: 403, title: "Missing academy scope");

        var invoicesQuery = db.Invoices.AsNoTracking().Where(i => i.TenantId == tenantId);
        if (studentId.HasValue) invoicesQuery = invoicesQuery.Where(i => i.StudentId == studentId.Value);
        if (!string.IsNullOrWhiteSpace(status)) invoicesQuery = invoicesQuery.Where(i => i.Status == status);

        var invoices = await invoicesQuery
            .Include(i => i.Student)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.IssueDate)
            .Take(500)
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Invoices");
        ws.RightToLeft = true;

        var headers = new[] { "رقم الفاتورة", "اسم الطالب", "المبلغ الكلي (ج.م)", "المدفوع (ج.م)", "المتبقي (ج.م)", "الحالة", "تاريخ الاستحقاق", "تاريخ الإصدار" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.SetBold();
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F1F5F9"));
        }

        int row = 2;
        foreach (var inv in invoices)
        {
            var total = inv.TotalPiastres / 100.0;
            var paid = inv.Payments.Sum(p => p.AmountPiastres) / 100.0;
            var balance = Math.Max(0, total - paid);

            ws.Cell(row, 1).Value = inv.InvoiceNumber;
            ws.Cell(row, 2).Value = inv.Student?.FullName ?? "—";
            ws.Cell(row, 3).Value = total;
            ws.Cell(row, 4).Value = paid;
            ws.Cell(row, 5).Value = balance;
            ws.Cell(row, 6).Value = inv.Status;
            ws.Cell(row, 7).Value = inv.DueDate.ToString("yyyy-MM-dd");
            ws.Cell(row, 8).Value = inv.IssueDate.ToString("yyyy-MM-dd");
            row++;
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var bytes = stream.ToArray();

        return Results.File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"invoices-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}
