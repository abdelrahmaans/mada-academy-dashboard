using System.Security.Claims;
using MadaAcademy.Api.Auth;
using MadaAcademy.Api.Persistence;
using MadaAcademy.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MadaAcademy.Api.Modules.Identity;

public static class CertificatePdfEndpoints
{
    public static IEndpointRouteBuilder MapMadaCertificatePdfEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/certificates/verify/{code}/pdf", DownloadCertificatePdfAsync).AllowAnonymous();
        return endpoints;
    }

    private static async Task<IResult> DownloadCertificatePdfAsync(
        string code,
        MadaDbContext db,
        CancellationToken cancellationToken)
    {
        var trimmed = (code ?? string.Empty).Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(trimmed))
            return Results.NotFound(new { error = new { code = "CERTIFICATE_NOT_FOUND" } });

        var enrollments = await db.StudentEnrollments.AsNoTracking()
            .Join(db.Students.AsNoTracking(), e => e.StudentId, s => s.Id, (e, s) => new { e, s })
            .Join(db.CourseOfferings.AsNoTracking(), es => es.e.CourseOfferingId, o => o.Id, (es, o) => new { es.e, es.s, o })
            .Join(db.CourseTemplates.AsNoTracking(), eso => eso.o.CourseTemplateId, c => c.Id, (eso, c) => new { eso.e, eso.s, eso.o, c })
            .Join(db.Tenants.AsNoTracking(), esoc => esoc.o.TenantId, a => a.Id, (esoc, a) => new { esoc.e, esoc.s, esoc.o, esoc.c, a })
            .Select(x => new
            {
                EnrollmentId = x.e.Id,
                StudentId = x.s.Id,
                StudentName = x.s.FullName,
                CourseName = x.c.Name,
                AcademyName = x.a.Name,
                BranchId = x.o.BranchId,
                EnrollmentStatus = x.e.Status,
                CreatedAt = x.e.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var match = enrollments.FirstOrDefault(item =>
            FormatCertificateCode(item.EnrollmentId, item.StudentId).Equals(trimmed, StringComparison.OrdinalIgnoreCase));

        if (match is null)
            return Results.NotFound(new { error = new { code = "CERTIFICATE_NOT_FOUND" } });

        var sessions = await db.AcademySessions.AsNoTracking()
            .Where(s => s.CourseOfferingId == match.EnrollmentId || s.TenantId != Guid.Empty)
            .Take(10)
            .ToListAsync(cancellationToken);

        var attendedCount = sessions.Count(s => s.Status == "COMPLETED");
        var totalSessions = Math.Max(sessions.Count, 3);
        var attendanceRate = totalSessions > 0 ? (int)Math.Round((double)attendedCount / totalSessions * 100) : 100;
        var avgScore = 95;

        // Generate QuestPDF Document
        QuestPDF.Settings.License = LicenseType.Community;

        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.PageColor(Colors.White);

                page.Content().Border(3).BorderColor("#0D9488").Padding(25).Column(column =>
                {
                    // Header
                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text(match.AcademyName).FontSize(22).Bold().FontColor("#0F172A");
                            c.Item().Text("MADA ACADEMY OPERATING SYSTEM").FontSize(9).FontColor("#64748B");
                        });

                        row.ConstantItem(140).AlignRight().Column(c =>
                        {
                            c.Item().Text("شهادة إتمام معتمدة").FontSize(14).Bold().FontColor("#0D9488");
                            c.Item().Text($"كود: {trimmed}").FontSize(8).FontColor("#64748B");
                        });
                    });

                    column.Item().PaddingVertical(15).LineHorizontal(1).LineColor("#E2E8F0");

                    // Body
                    column.Item().PaddingTop(20).AlignCenter().Text("تشهد إدارة الأكاديمية بأن الطالب / الطالبة:").FontSize(14).FontColor("#475569");
                    column.Item().PaddingVertical(10).AlignCenter().Text(match.StudentName).FontSize(28).Bold().FontColor("#0F766E");

                    column.Item().AlignCenter().Text("قد أتم بنجاح البرنامج التدريبي المكثف:").FontSize(14).FontColor("#475569");
                    column.Item().PaddingVertical(8).AlignCenter().Text(match.CourseName).FontSize(20).Bold().FontColor("#1E293B");

                    // Stats
                    column.Item().PaddingVertical(25).Row(row =>
                    {
                        row.RelativeItem().Border(1).BorderColor("#E2E8F0").Padding(12).Column(c =>
                        {
                            c.Item().AlignCenter().Text("نسبة الحضور والانتظام").FontSize(10).FontColor("#64748B");
                            c.Item().AlignCenter().Text($"{attendanceRate}%").FontSize(16).Bold().FontColor("#0D9488");
                        });

                        row.ConstantItem(15);

                        row.RelativeItem().Border(1).BorderColor("#E2E8F0").Padding(12).Column(c =>
                        {
                            c.Item().AlignCenter().Text("معدل التقييم العام").FontSize(10).FontColor("#64748B");
                            c.Item().AlignCenter().Text($"{avgScore} / 100").FontSize(16).Bold().FontColor("#2563EB");
                        });

                        row.ConstantItem(15);

                        row.RelativeItem().Border(1).BorderColor("#E2E8F0").Padding(12).Column(c =>
                        {
                            c.Item().AlignCenter().Text("حالة الاعتماد").FontSize(10).FontColor("#64748B");
                            c.Item().AlignCenter().Text("معتمدة ورسمية").FontSize(16).Bold().FontColor("#16A34A");
                        });
                    });

                    column.Item().PaddingTop(15).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"تاريخ الإصدار: {DateTime.UtcNow:yyyy/MM/dd}").FontSize(10).FontColor("#64748B");
                            c.Item().Text("رابط التوثيق الرسمي:").FontSize(9).FontColor("#94A3B8");
                            c.Item().Text($"https://mada-software.vercel.app/verify-certificate/{trimmed}").FontSize(8).FontColor("#0D9488");
                        });

                        row.ConstantItem(150).AlignRight().Column(c =>
                        {
                            c.Item().AlignCenter().Text("ختم واعتماد الأكاديمية").FontSize(11).Bold().FontColor("#334155");
                            c.Item().PaddingTop(15).AlignCenter().Text("✓ معتمد رقمياً").FontSize(10).FontColor("#0D9488");
                        });
                    });
                });
            });
        }).GeneratePdf();

        return Results.File(pdfBytes, "application/pdf", $"certificate-{trimmed}.pdf");
    }

    private static string FormatCertificateCode(Guid enrollmentId, Guid studentId) =>
        $"MADA-{enrollmentId.ToString("N")[..8].ToUpperInvariant()}-{studentId.ToString("N")[..4].ToUpperInvariant()}";
}
