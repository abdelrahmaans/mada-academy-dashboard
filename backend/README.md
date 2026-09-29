# Mada Academy Backend — ASP.NET Core

هذا هو مسار الـBackend المعتمد من الآن: **ASP.NET Core على .NET 10 LTS** داخل نفس الريبو.

## الحالة

المشروع حاليًا foundation مبكرة. يحتوي health endpoint، API prefix، ProblemDetails، Audit sink للتطوير، state-transition seed، وEF Core/PostgreSQL persistence model مع migration أولى منشأة. لا توجد OTP/JWT production أو feature APIs متصلة بقاعدة البيانات بعد.

## التشغيل

```bash
dotnet restore backend/MadaAcademy.Api/MadaAcademy.Api.csproj
dotnet run --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj
```

Endpoints الحالية:

- `GET /api/v1/health`
- `GET /api/v1/diagnostics/persistence` — provider/config/migration status بدون محاولة اتصال بقاعدة البيانات.
- `GET /api/v1/me` — contract placeholder محمي بوجود Bearer header فقط، وليس auth production.
- `POST /api/v1/audit/dev` — development-only، ولا يُسمح أن يبقى route إنتاجيًا.

## البنية القادمة

```text
backend/
  MadaAcademy.Api/
    Auth/             # OTP, JWT, refresh sessions
    Authorization/    # policies, scope handlers
    Audit/            # audit service + database sink
    Workflows/        # state machines
    Modules/          # tenants, users, students, finance, scheduling...
    Persistence/      # EF Core DbContext + migrations
```

سنستخدم **EF Core + PostgreSQL** بدل Prisma، وASP.NET Core Policies/Authorization Handlers بدل guards الخاصة بـExpress. الـFrontend يظل React/Vite، ويتصل بـtyped REST contracts تحت `/api/v1`.

## Express transition

المجلد `server/` هو foundation انتقالية قديمة تم إنشاؤها قبل تثبيت .NET. لن نضيف عليه business modules جديدة. عند اكتمال أول .NET API slice ونقل build/deployment، يتم تقليصه أو إزالته في commit مستقل مع تحديث `BACKEND_STATUS.md`.
