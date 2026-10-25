using System.Text.Json;

namespace MadaAcademy.Api.Modules.Identity;

public sealed record PermissionItem(
    string Code,
    string Label,
    string Category,
    string Description);

public sealed record RoleDefinition(
    string Code,
    string Label,
    string ScopeLevel,
    string Description,
    string[] Permissions,
    bool AssignableByAcademyOwner);

public static class RoleCatalog
{
    public static readonly IReadOnlyList<PermissionItem> PermissionDetails =
    [
        // الطلاب والتسجيل
        new("students.read", "عرض الطلاب والتسجيلات", "الطلاب والتسجيل", "استعراض بيانات الطلاب وقوائم المسجلين في البرامج."),
        new("students.create", "إضافة وتعديل الطلاب", "الطلاب والتسجيل", "تسجيل طلاب جدد وتحديث ملفاتهم وحالاتهم."),

        // الجلسات والتدريب
        new("sessions.read", "عرض جميع جلسات الفرع", "الجلسات والتدريب", "الاطلاع على جدول وحصص الفرع بالكامل."),
        new("sessions.create", "إنشاء وجدولة الجلسات", "الجلسات والتدريب", "فتح مجموعات تدريبية جديدة وجدولة الجلسات والقاعات."),
        new("sessions.assigned.read", "عرض الجلسات المسندة فقط", "الجلسات والتدريب", "رؤية الجلسات الخاصة بالمدرب فقط دون بقية الجلسات."),

        // الحضور والغياب
        new("attendance.read", "عرض كشوف الحضور", "الحضور والغياب", "متابعة سجلات حضور وغياب الطلاب."),
        new("attendance.write", "تسجيل الحضور والغياب", "الحضور والغياب", "تسجيل حضور وتأخير الطلاب في الجلسات التدريبية."),

        // التقييمات والجودة
        new("evaluations.write", "رصد التقييمات", "التقييمات والجودة", "إدخال ملاحظات وتقييمات أداء الطلاب في الجلسات."),
        new("evaluations.review", "مراجعة واعتماد التقييمات", "التقييمات والجودة", "التدقيق في تقييمات المدربين ونشرها لأولياء الأمور."),

        // المالية والفواتير
        new("finance.read", "الاطلاع المالي العام", "المالية والفواتير", "عرض المؤشرات المالية العامة للفرع والأكاديمية."),
        new("finance.summary.read", "ملخص مالي سريع", "المالية والفواتير", "عرض مؤشرات الإيرادات والمصروفات الموجزة."),
        new("invoices.read", "عرض الفواتير والمستحقات", "المالية والفواتير", "استعراض فواتير الطلاب وحالة السداد."),
        new("invoices.create", "إنشاء الفواتير والخصومات", "المالية والفواتير", "إصدار فواتير اشتراك جديدة وتعديل بنودها."),
        new("payments.create", "تسجيل سندات القبض", "المالية والفواتير", "تسجيل عمليات الدفع والتحصيل من أولياء الأمور."),
        new("payments.evidence.read", "فحص إيصالات الدفع", "المالية والفواتير", "الاطلاع على مرفقات وإيصالات التحويل البنكي."),
        new("payments.evidence.write", "تأكيد إيصالات الدفع", "المالية والفواتير", "رفع واعتماد صحة التحويلات والمرفقات."),
        new("finance.expenses.read", "عرض المصروفات التشغيلية", "المالية والفواتير", "استعراض بنود الصرف ومصروفات الفروع."),
        new("finance.expenses.write", "تسجيل طلب صرف", "المالية والفواتير", "إدخال فواتير وطلبات المصروفات التشغيلية."),
        new("finance.expenses.approve", "اعتماد وصرف المصروفات", "المالية والفواتير", "الموافقة الرسمية على طلبات الصرف وتأكيدها."),

        // التسويق والمحتوى
        new("marketing.read", "عرض الليدز والحملات", "التسويق والمحتوى", "متابعة جهات الاتصال والمهتمين والحملات الإعلانية."),
        new("marketing.write", "إدارة التسويق والمحتوى", "التسويق والمحتوى", "تعديل الحملات وجداول النشر والتواصل مع العملاء."),

        // الإدارة والحوكمة
        new("academy.read", "عرض بيانات الأكاديمية", "الإدارة والحوكمة", "الاطلاع على الملف التعريفي وفروع الأكاديمية."),
        new("academy.update", "تعديل إعدادات الأكاديمية", "الإدارة والحوكمة", "تحديث هوية الأكاديمية وسياساتها العامة."),
        new("branch.read", "عرض الفروع", "الإدارة والحوكمة", "استعراض فروع الأكاديمية وتفاصيلها."),
        new("branch.create", "إنشاء الفروع", "الإدارة والحوكمة", "إضافة فروع ومراكز تدريب جديدة."),
        new("classrooms.manage", "إدارة القاعات والمقاعد", "الإدارة والحوكمة", "تخصيص القاعات التدريبية وتجهيزاتها ومعداتها."),
        new("staff.read", "عرض فريق العمل", "الإدارة والحوكمة", "استعراض أعضاء الفريق ومسمياتهم."),
        new("staff.invite", "إضافة أعضاء الفريق", "الإدارة والحوكمة", "إنشاء حسابات جديدة للمدربين والموظفين."),
        new("roles.read", "عرض الصلاحيات", "الإدارة والحوكمة", "استعراض مصفوفة الصلاحيات الممنوحة."),
        new("roles.manage", "تخصيص الصلاحيات", "الإدارة والحوكمة", "تعديل صلاحيات الأدوار والأفراد واستعادة الافتراضي."),
        new("reports.read", "التقارير التنفيذية", "الإدارة والحوكمة", "تحميل واستعراض التقارير الإحصائية والتحليلية.")
    ];

    public static readonly IReadOnlyList<RoleDefinition> All =
    [
        new("R01_ACADEMY_OWNER", "مسؤول الأكاديمية", "TENANT", "يرى الأكاديمية بكل فروعها ويدير الفريق والصلاحيات التشغيلية.", ["academy.read", "academy.update", "branch.read", "branch.create", "classrooms.manage", "staff.read", "staff.invite", "roles.read", "roles.manage", "finance.read", "finance.summary.read", "finance.expenses.read", "finance.expenses.approve", "reports.read"], false),
        new("R02_BRANCH_MANAGER", "مدير الفرع", "BRANCH", "يدير التشغيل اليومي لفرع محدد والطلاب والجلسات والحضور.", ["branch.read", "students.read", "students.create", "sessions.read", "sessions.create", "attendance.read", "attendance.write", "finance.summary.read", "finance.expenses.read", "finance.expenses.approve", "reports.read"], true),
        new("R03_HEAD_INSTRUCTORS", "رئيس المدربين", "BRANCH", "يشرف على المدربين والجلسات والتقييمات داخل مجموعات الإشراف المخصصة له للقراءة والمتابعة.", ["branch.read", "sessions.read", "attendance.read", "evaluations.review"], true),
        new("R04_INSTRUCTOR", "المدرب", "BRANCH", "يصل إلى الجلسات والطلاب المسندين إليه فقط.", ["students.read", "sessions.read", "sessions.assigned.read", "attendance.read", "attendance.write", "evaluations.write"], true),
        new("R05_SECRETARY", "السكرتير", "BRANCH", "يدير التسجيلات والبيانات التشغيلية الأساسية للفرع.", ["branch.read", "students.read", "students.create", "sessions.read", "staff.read", "invoices.read", "invoices.create", "payments.create", "payments.evidence.read", "payments.evidence.write"], true),
        new("R06_ACCOUNTANT", "المحاسب", "BRANCH", "يتابع التحصيل والتقارير المالية المصرح بها داخل الفرع.", ["branch.read", "students.read", "sessions.read", "finance.read", "finance.summary.read", "invoices.read", "invoices.create", "payments.create", "payments.evidence.read", "payments.evidence.write", "finance.expenses.read", "finance.expenses.write", "finance.expenses.approve", "reports.read"], true),
        new("R07_MEDIA_MANAGER", "مسؤول التسويق", "BRANCH", "يدير المحتوى والتسويق الخاص بالأكاديمية ضمن النطاق المصرح.", ["branch.read", "marketing.read", "marketing.write", "reports.read"], true)
    ];

    public static readonly IReadOnlyList<string> PermissionCatalog = PermissionDetails
        .Select(p => p.Code)
        .Concat(All.SelectMany(role => role.Permissions))
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

    public static string[] ResolveEffectivePermissions(string roleCode, string? customPermissionsJson, string? tenantRoleOverrideJson)
    {
        if (!string.IsNullOrWhiteSpace(customPermissionsJson))
        {
            try
            {
                var custom = JsonSerializer.Deserialize<string[]>(customPermissionsJson);
                if (custom is not null)
                {
                    return custom
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToArray();
                }
            }
            catch { }
        }

        if (!string.IsNullOrWhiteSpace(tenantRoleOverrideJson))
        {
            try
            {
                var overridden = JsonSerializer.Deserialize<string[]>(tenantRoleOverrideJson);
                if (overridden is not null)
                {
                    return overridden
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToArray();
                }
            }
            catch { }
        }

        return PermissionsFor(roleCode);
    }
}
