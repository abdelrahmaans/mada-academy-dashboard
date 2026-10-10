namespace MadaAcademy.Api.Modules.Identity;

public sealed record RoleDefinition(
    string Code,
    string Label,
    string ScopeLevel,
    string Description,
    string[] Permissions,
    bool AssignableByAcademyOwner);

public static class RoleCatalog
{
    public static readonly IReadOnlyList<RoleDefinition> All =
    [
        new("R01_ACADEMY_OWNER", "مسؤول الأكاديمية", "TENANT", "يرى الأكاديمية بكل فروعها ويدير الفريق والصلاحيات التشغيلية.", ["academy.read", "academy.update", "branch.read", "branch.create", "classrooms.manage", "staff.read", "staff.invite", "roles.read", "roles.manage", "finance.expenses.read", "finance.expenses.approve", "reports.read"], false),
        new("R02_BRANCH_MANAGER", "مدير الفرع", "BRANCH", "يدير التشغيل اليومي لفرع محدد والطلاب والجلسات والحضور.", ["branch.read", "students.read", "students.create", "sessions.read", "sessions.create", "attendance.read", "attendance.write", "finance.summary.read", "finance.expenses.read", "finance.expenses.approve"], true),
        new("R03_HEAD_INSTRUCTORS", "رئيس المدربين", "BRANCH", "يتابع المدربين والجلسات والتقييمات داخل الفرع.", ["branch.read", "sessions.read", "attendance.read", "attendance.write", "evaluations.write", "evaluations.review"], true),
        new("R04_INSTRUCTOR", "المدرب", "BRANCH", "يصل إلى الجلسات والطلاب المسندين إليه فقط.", ["sessions.assigned.read", "attendance.read", "attendance.write", "evaluations.write"], true),
        new("R05_SECRETARY", "السكرتير", "BRANCH", "يدير التسجيلات والبيانات التشغيلية الأساسية للفرع.", ["branch.read", "students.read", "students.create", "sessions.read", "staff.read", "invoices.read", "invoices.create", "payments.create", "payments.evidence.read", "payments.evidence.write"], true),
        new("R06_ACCOUNTANT", "المحاسب", "BRANCH", "يتابع التحصيل والتقارير المالية المصرح بها داخل الفرع.", ["branch.read", "students.read", "sessions.read", "finance.read", "invoices.read", "invoices.create", "payments.create", "payments.evidence.read", "payments.evidence.write", "finance.expenses.read", "finance.expenses.write", "finance.expenses.approve", "reports.read"], true),
        new("R07_MEDIA_MANAGER", "مسؤول التسويق", "BRANCH", "يدير المحتوى والتسويق الخاص بالأكاديمية ضمن النطاق المصرح.", ["branch.read", "marketing.read", "marketing.write", "reports.read"], true)
    ];

    public static readonly IReadOnlyList<string> PermissionCatalog = All
        .SelectMany(role => role.Permissions)
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .OrderBy(permission => permission)
        .ToArray();

    public static RoleDefinition? Find(string code) => All.FirstOrDefault(role => string.Equals(role.Code, code, StringComparison.OrdinalIgnoreCase));

    public static string[] PermissionsFor(string code) => Find(code)?.Permissions ?? code switch
    {
        "R00_PLATFORM_ADMIN" => ["platform.read", "academy.create", "academy.read"],
        "R08_PARENT" => ["consumer.students.read", "consumer.sessions.read", "consumer.evaluations.read"],
        "R09_STUDENT" => ["consumer.self.read", "consumer.sessions.read", "consumer.evaluations.read"],
        _ => []
    };
}
