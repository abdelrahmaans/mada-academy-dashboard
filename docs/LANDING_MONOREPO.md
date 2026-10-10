# Landing Monorepo Integration

تم دمج Landing Mada Academy داخل ريبو الداشبورد كـ monorepo خفيف يحافظ على تطبيق الداشبورد الحالي دون نقل أو كسر مساراته:

- `client/`: تطبيق Dashboard الحالي، بما فيه `/marketing-desk` والـAdmin.
- `apps/landing/`: تطبيق Vite مستقل يعمل على port `3001`، ويحتوي على صفحة التموضع، الحركة، Demo form، وRegistration form.
- `packages/mada-tokens/`: المصدر المشترك لألوان Mada، typography، radius، والظلال؛ يستورده كل من Landing وDashboard.
- `backend/MadaAcademy.Api/`: نفس ASP.NET Backend. المسار العام `POST /api/v1/public/leads` يحفظ الطلبات في جدول `Leads` كـ `LANDING_DEMO` أو `LANDING_REGISTRATION`، لذلك تظهر مباشرة في Marketing Desk مع نفس قواعد النطاق.

## Configuration

المسار العام لا يفتح بيانات أو endpoints محمية. يكتب فقط إلى target مضبوط صراحة عبر:

- `MADA_PUBLIC_LEAD_TENANT_ID`
- `MADA_PUBLIC_LEAD_BRANCH_ID`
- `MADA_CORS_ORIGINS` لإضافة origin تطبيق اللاندينج

كما أن المسار مقيد بـ 10 طلبات لكل IP في الدقيقة. لا يتم قبول الطلب إذا كان target غير مضبوط أو غير موجود/غير نشط.

## Visual direction

اللاندينج تستخدم نفس هوية الداشبورد: Cairo للعربية، Inter للإنجليزية، Navy `#14243A`، Teal `#0D9488`، Amber `#D49A2D`، وsurface `#F4F7FA`. طبقة الحركة تشمل staged hero entrance، reveal-on-scroll، floating/orbit motion، hover feedback، و`prefers-reduced-motion`.
