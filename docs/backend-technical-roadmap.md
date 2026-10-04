# Mada Academy Backend Technical Roadmap

> **Document status — 4 October 2026:** This is a target-architecture and deferred-roadmap document, not a file-by-file description of the implemented ASP.NET Core tree. For implemented backend truth, use [../BACKEND_STATUS.md](../BACKEND_STATUS.md) and [../backend/DATABASE_STATUS.md](../backend/DATABASE_STATUS.md). Historical examples such as `app.ts`, `index.ts`, Prisma and Zod describe the earlier target sketch and are not current implementation requirements.

## القرار المعماري

سنضع الـBackend داخل نفس الريبو كـ **Modular Monolith** بـC#/.NET 10 LTS وASP.NET Core، وليس Microservices مبكرة. السبب أن حدود الدومين واضحة، لكن المنتج ما زال في مرحلة تأسيس؛ فصل الـmodules داخل process واحد يعطينا سرعة، معاملات مشتركة، ووضوحًا في الصلاحيات دون تكلفة تشغيلية مبكرة.

الـFrontend الحالي يظل surface للمعاينة، بينما `/api/v1` يصبح العقد الوحيد للبيانات التشغيلية. `roleNavigation` و`RoleScopeContext` يظلان للعرض فقط؛ القرار الأمني لا يخرج من العميل.

## البنية داخل الريبو

```text
backend/MadaAcademy.Api/
  app.ts                 # composition root وmiddleware
  index.ts               # process entry
  config/                # env وfeature flags
  auth/                  # OTP، access/refresh sessions، principal
  authorization/         # roles، permissions، tenant/branch/assignment guards
  audit/                 # AuditService + Postgres sink
  workflows/             # canonical state machines
  http/                  # errors، request context، response contracts
  tenancy/               # tenant/branch membership وread-only lock
  modules/
    tenants/
    users/
    students/
    family-access/
    scheduling/
    attendance/
    finance/
    payroll/
    leads/
    marketing/
    notifications/
    storage/
  persistence/            # EF Core DbContext، migrations، repositories
shared/
  contracts/              # Zod DTOs مشتركة بين client/server
```

كل module يملك `routes -> service -> repository`. الـroute لا يحتوي business rules، والـservice لا يقرأ ASP.NET مباشرة. كل query يمرر `RequestScope` مشتقًا من session، وليس `tenant_id` اختياريًا من body.

## P0 — الترتيب التنفيذي

| المرحلة | الناتج | معيار الخروج |
|---|---|---|
| P0.1 Foundation | env، request id، API errors، token verification، guards، state machine، audit boundary | check/build/unit tests ناجحة، ولا route حساس بدون guard |
| P0.2 Persistence | PostgreSQL + EF Core، migrations للـTenant/Branch/User/Role/Membership/Invitation/AuditEvent/RefreshSession | CRUD خادمي، transaction، indexes، tenant_id إلزامي |
| P0.3 Auth | OTP provider abstraction، rate limit، refresh rotation، logout/revocation، staff/consumer separation | اختبارات 401/403/expired/replay/logout |
| P0.4 Tenancy & Accounts | onboarding Tenant→Branch→R01 invitation، plan limits، read-only lock، memberships | transaction واحدة وidempotency وaudit كامل |
| P0.5 Authorization | policy matrix ككود، tenant/branch/team/assignment/family scopes، field masking | IDOR وcross-tenant/branch tests كلها ناجحة |
| P0.6 Critical workflows | attendance/evaluation، finance/discount/correction، scheduling conflict، approvals | state transitions، segregation of duties، reason/evidence، 409/403 contracts |
| P0.7 Integration | ربط أول vertical slices للـR01/R02/R04/R05/R06/R08/R09 | لا mutation local في المسارات التي تم ربطها، وE2E عبر API |
| P0.8 Operations | structured logs، metrics، backups، migrations CI، secrets، rate limits | staging smoke وrollback plan وsecurity checklist |

## البنية التحتية المقترحة

- **Runtime:** .NET 10 LTS، C#، ASP.NET Core.
- **Database:** PostgreSQL managed، مع EF Core migrations وconnection pooling.
- **Cache/Jobs:** Redis + .NET BackgroundService/Quartz أو Hangfire للـOTP rate limiting، evaluation cards، notifications، payroll jobs.
- **Object storage:** S3-compatible bucket عبر `storage` facade، signed URLs، private-by-default.
- **Auth:** OTP provider abstraction، access token 15 دقيقة، refresh token rotation 7 أيام، revocation store، وhash للـOTP/refresh.
- **Observability:** structured JSON logs، request ID، error tracking، metrics لزمن API ورفض الصلاحيات والـjobs.
- **Delivery:** CI يشغل typecheck، unit، integration، migration check، build، وE2E authorization. Staging منفصل عن production.

## قواعد البيانات الأساسية

كل جدول تشغيلي يحتوي `tenant_id`، وكل ما هو تشغيلي على مستوى الفرع يحتوي `branch_id`. نحتاج indexes مركبة مثل `(tenant_id, branch_id, status)`، وunique constraints على slug وphone داخل policy، وforeign keys تمنع ربط سجل بفرع من Tenant آخر.

الكيانات الأولى هي: `SubscriptionPlan`, `Tenant`, `Branch`, `Role`, `User`, `StaffMembership`, `Invitation`, `RefreshSession`, `ParentAccount`, `StudentAccount`, `FamilyLink`, `AuditEvent`. بعد تثبيت هذه الطبقة نضيف `Student`, `CourseOffering`, `Session`, `Attendance`, `Evaluation`, `Invoice`, `Expense`, `ApprovalRequest`.

## قرارات أمان غير قابلة للتفاوض

R00 يرى metadata افتراضيًا، وأي support exception له سبب ومدة وانتهاء وتدقيق. R08 وR09 ليسا Staff roles. `Submit` لا يساوي `Approve`. لا اعتماد ذاتي. لا endpoint يثق في `tenant_id` أو `branch_id` من العميل. أي رفض أو تصحيح أو تصعيد يحتاج reason، وأي export يحتاج scope وmasking وAuditEvent.

## ما تم تأسيسه الآن

تم تثبيت مسار ASP.NET Core .NET 10 داخل `backend/MadaAcademy.Api` مع health endpoint وProblemDetails وAudit boundary وstate-transition seed. الـExpress foundation في `backend/MadaAcademy.Api/` أصبحت انتقالية ولن نضيف عليها business modules جديدة.

الـdevelopment audit sink مؤقت ومقصود للتطوير/الاختبار؛ لا يمثل persistence. الخطوة التالية هي EF Core/Postgres وRefreshSession/OTP repositories ثم نقل الـpolicies والـaudit إلى بيانات حقيقية.

## قرارات معلقة قبل تثبيت الـERD النهائي

- السن الفاصل لتفعيل StudentAccount.
- ترتيب خصومات `AppliedDiscount` قابل للتخصيص أم ثابت.
- تسلسل أرقام الفواتير على مستوى الفرع أم Tenant.
- Leaderboard real-time أم near-real-time.
- حسم R00 في بدء التسجيل وR08 في إنشاء الطالب كما ورد في تقرير التدقيق.
