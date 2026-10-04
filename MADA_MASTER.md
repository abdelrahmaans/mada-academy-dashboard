
### 29 سبتمبر 2026 — Workspace Hub / Role Walkthrough Entry Point

تم إنشاء مدخل واحد للمعاينة حتى يستطيع المستخدم متابعة كل النظام من رابط واحد ثم فتح كل Role بالـURL فقط.

- أضيف route جديد: `/workspace`.
- أضيفت `client/src/pages/WorkspaceHub.tsx` كـHub مركزي يعرض شجرة `R00 → R09` في ثلاث طبقات:
  - طبقة الإدارة والمنصة: R00/R01/R02.
  - طبقة التشغيل الأكاديمي: R03/R04/R05/R06.
  - طبقة التسويق والمستهلك: R07/R08/R09.
- كل بطاقة Role تسحب label/scope/identity/navigation من `ROLE_DEFINITIONS` بدل تكرار metadata.
- كل بطاقة تحتوي زر فتح الـhome path وروابط كل navigation surfaces التابعة للدور.
- كل المسارات القديمة ظلت متاحة بدون تغيير.

#### URL الرئيسي للمتابعة

`https://4173-ijm6jc75l307tqg7lv96y-ec94301a.sg2.manus.computer/workspace`

طريقة الاستخدام: افتح `/workspace`، اختار role، ثم غيّر آخر جزء في الـURL أو استخدم روابط البطاقة. مثال: `/executive-dashboard` ثم `/academy-owner` ثم `/reports`.

#### التحقق

- `pnpm check`: نجح.
- `pnpm build`: نجح.
- `git diff --check`: نجح.
- `/workspace` و`/` وكل المسارات الرئيسية المختبرة أعادت HTTP 200 محليًا.
- تحذيرات build غير المانعة كما هي: analytics env/module وpnpm legacy configuration.


### 29 سبتمبر 2026 — Shared Mada Theme + Scroll System Pass

تم توحيد الطبقة البصرية لكل الـroles على مرجعية واجهة المدربين، بدون تغيير الـroutes أو الـpermissions أو الـbackend:

- إضافة `client/src/components/MadaTheme.css` كطبقة shared تُحمّل بعد `index.css`.
- اعتماد palette موحدة: `#14243a` للنص الأساسي، Teal Mada `#0d9488` للأفعال والـactive states، أسطح بيضاء، page background فاتح، borders هادئة وradius موحد.
- توحيد sidebar treatment لكل `app-shell` و`*-desk-shell` وportals على gradient الكحلي الخاص بواجهة المدربين.
- توحيد panels/cards والـinputs والـselects والـtextareas والـprimary/secondary actions والـfocus ring.
- توحيد active navigation على Teal Mada بدل اختلافات Marketing/Executive/Finance القديمة.
- إضافة scroll system عام: thin scrollbars، thumb متناسق مع الثيم، hover state، dark-sidebar scrollbar، و`scrollbar-gutter` و`overscroll-behavior` للقوائم والجداول الأفقية.
- احترام `prefers-reduced-motion` وإبقاء responsive paddings للشاشات الصغيرة.

#### التحقق

- `pnpm check`: نجح.
- `pnpm build`: نجح.
- `git diff --check`: نجح.
- Runtime smoke: `/`, `/instructor`, `/instructor-desk`, `/marketing-desk`, `/family-portal`, `/student-portal`, `/workspace` أعادت HTTP 200.
- التحذيرات الموجودة مسبقًا: analytics env variables وpnpm legacy configuration، بدون أخطاء TypeScript أو build.

#### المتبقي

- مراجعة بصرية تفاعلية على كل role في المتصفح بعد اختيار المستخدم للـscreens الأكثر أهمية.
- لا يوجد تغيير backend/API؛ هذه طبقة UI/UX فقط.


### 29 سبتمبر 2026 — Scrollbar Refinement Pass

تم تحسين scrollbar system ليكون ظاهرًا ومتسقًا عبر المشروع كله، بما في ذلك المناطق التي كانت تخفيه سابقًا مثل بعض filter tabs وقوائم البيانات. أصبح النظام يستخدم thin scrollbar موحدًا، track فاتحًا وهادئًا، thumb Teal Mada بدرجات hover/active، rounded corners، وcorner شفاف للجداول. أضيفت نسخة أغمق للـsidebars، مع تثبيت التمرير الأفقي للقوائم والجداول ودعم الشاشات الصغيرة. تم فرض `scrollbar-width: thin` وظهور WebKit scrollbar لضمان عدم اختلاف السلوك بين الشاشات.

التحقق: `pnpm check` و`pnpm build` و`git diff --check` نجحوا. التحذيرات الوحيدة هي analytics env variables وpnpm legacy configuration الموجودة مسبقًا.

## 13. Continuation Pack — مراجعة السورس والبلان

**تاريخ المراجعة:** 29 سبتمبر 2026
**آخر commit مفحوص:** `b7a7316` — `fix: refine shared mada scrollbars`
**حالة Git:** `main` متزامن مع `origin/main` ونظيف.

### الحكم التنفيذي

الريبو الحالي هو **Frontend UI/UX prototype متقدم**، وليس Backend جاهزًا. واجهات R00 إلى R09 موجودة، والـrouting والـrole metadata والـshared UX foundation موجودة، لكن البيانات كلها تقريبًا local/demo state. لا يوجد في السورس الحالي API client حقيقي أو database integration أو auth/session enforcement أو migrations أو server modules؛ `server/index.ts` وظيفته الحالية static serving وSPA fallback فقط. هذا متسق مع البلان: نُكمل من prototype المعتمد إلى Backend readiness، ولا نعتبر أي إخفاء زر في الواجهة حماية صلاحيات.

### الملفات المرجعية التي يجب أن يبدأ منها أي استكمال

| الأولوية | الملف | وظيفته | الحالة |
|---|---|---|---|
| 1 | `MADA_MASTER.md` داخل هذا الريبو | المرجع التشغيلي الوحيد للحالة الحالية، ما تم، الفجوات، والخطوة التالية | يتم تحديثه مع كل milestone |
| 2 | `/home/ubuntu/projects/mada-soft-52b76b15/Mada Academy — Role, Permission & State Dictionary.md` | المصدر المركزي للأدوار والصلاحيات والحالات والـworkflow transitions | UX contract معتمد |
| 3 | `/home/ubuntu/projects/mada-soft-52b76b15/Mada Academy — Final Permission Matrix & Shared UI Components.md` | permission matrix ومكونات الـshared UI وقواعد scope | مرجع policy قبل API |
| 4 | `/home/ubuntu/projects/mada-soft-52b76b15/Mada Academy — Master Brand, UX & Business Plan.md` | رؤية المنتج، business rules، ترتيب الـSprints، وقرار تأجيل الـbackend | المرجع التجاري والتشغيلي |
| 5 | `/home/ubuntu/projects/mada-soft-52b76b15/Academy Pro — Architecture Overview (v0.1).md` | Multi-tenancy، auth، layers، modules، والـbackend build order | قرار معماري أساسي |
| 6 | `/home/ubuntu/projects/mada-soft-52b76b15/Academy Pro — ERD & Entity Dictionary (v0.1).md` | العلاقات والكيانات ونطاقات tenant/branch | مرجع ERD |
| 7 | `/home/ubuntu/projects/mada-soft-52b76b15/03_Database_Schema.md` | تعريف الجداول والحقول والقيود والفهارس | مرجع database التفصيلي |
| 8 | `/home/ubuntu/projects/mada-soft-52b76b15/Academy Pro — API Contracts & Module Specs (v0.1).md` | الـendpoint contracts والـguards والـbusiness rules | المرجع الرسمي عند كتابة services |
| 9 | `/home/ubuntu/projects/mada-soft-52b76b15/Academy Pro — Sequence Diagrams for Critical Flows (v0.1).md` | الترتيب الزمني للتدفقات الحرجة والتعارضات والموافقات | مرجع service orchestration |
| 10 | `/home/ubuntu/projects/mada-soft-52b76b15/UX لكل الأدوار خطوة بخطوة.md` و`UX.md` | سياق قرارات UX وترتيب استكمال الأدوار | سياق تاريخي مفيد، وليس بديلًا عن هذا الملف |

### ملفات السورس الأساسية لفهم المنتج بسرعة

| المجموعة | الملفات | ما الذي توضحه |
|---|---|---|
| Entry/routing | `client/src/App.tsx`, `client/src/main.tsx`, `vite.config.ts`, `server/index.ts` | تحميل التطبيق، lazy routes، base path، وstatic serving |
| Role contract | `client/src/lib/roleNavigation.ts`, `client/src/contexts/RoleScopeContext.tsx`, `client/src/components/RoleDashboardShell.tsx` | R00–R09، identity، scope، home paths، وحدود أن metadata ليست authorization |
| Shared UI | `client/src/components/PageHeader.tsx`, `RoleScopeCard.tsx`, `StatusBadge.tsx`, `FeedbackStates.tsx`, `WorkflowStepper.tsx`, `DecisionDialog.tsx`, `AuditTimeline.tsx`, `NotificationCenter.tsx`, `MadaTheme.css` | shell، states، decisions، audit presentation، والثيم الموحد |
| Role surfaces | `client/src/pages/PlatformConsole.tsx`, `ExecutiveDashboard.tsx`, `AcademyOwner.tsx`, `Home.tsx`, `BranchOperations.tsx`, `HeadInstructors.tsx`, `AcademicPrograms.tsx`, `InstructorDesk.tsx`, `Instructor.tsx`, `SecretaryDesk.tsx`, `Secretary.tsx`, `FinanceDesk.tsx`, `Finance.tsx`, `MarketingDesk.tsx`, `FamilyPortal.tsx`, `StudentPortal.tsx` | الـworkflows الحالية والـlocal fixtures لكل role |
| Cross-role surfaces | `client/src/pages/Students.tsx`, `Classes.tsx`, `Schedule.tsx`, `Team.tsx`, `Approvals.tsx`, `Reports.tsx`, `WorkspaceHub.tsx` | الشاشات التشغيلية المشتركة ومسارات المتابعة |
| Current visual foundation | `client/src/index.css`, `client/src/components/RoleFoundation.css`, `client/src/components/RoleDashboardShell.css`, `client/src/components/MadaTheme.css` | ألوان Mada، responsive behavior، focus، scrollbars، وsurface patterns |

### خريطة الحالة الفعلية حسب الـRole

R00 إلى R09 مغطاة كواجهات prototype مع role code وscope labels ومسارات من خلال `ROLE_DEFINITIONS`. الـWorkspace Hub في `/workspace` هو نقطة الدخول البصرية لمراجعة كل الأدوار. لكن كل role ما زال يحتاج عند ربط backend إلى نقل local state إلى API مع الحفاظ على نفس الحالات: loading، empty، error، locked، pending، approved، rejected، وaudit feedback.

الفجوات ليست موزعة بالتساوي: R00 يحتاج tenants/plans/support APIs، R01 يحتاج academy rollup وbranch/team/ticket APIs، R02 يحتاج branch operations وapprovals، R03 يحتاج curriculum/progress review، R04 يحتاج attendance/evaluation، R05 يحتاج leads/enrollment وduplicate matching، R06 يحتاج payments/expenses/corrections، R07 يحتاج campaigns/content/leads/media، R08 يحتاج family-scoped read/support، وR09 يحتاج student-scoped learning/progress/achievements.

### الترتيب الصحيح للاستكمال من هنا

1. **Backend foundation:** إنشاء Backend modular monolith حسب الـArchitecture، مع `/api/v1`، config validation، Postgres/Prisma، migrations، وstructured error contract.
2. **Auth أولًا:** Phone OTP ثم JWT access/refresh/logout، مع payload يفرق بين staff وconsumer ويحمل tenant/branch scope، ثم `JwtAuthGuard` و`RolesGuard` و`TenantScopeGuard`.
3. **Tenancy وcore data:** `tenants`, `branches`, `users`, roles، account types، invitations، ثم query scoping تلقائي لكل Prisma query وعدم الاعتماد على UI filtering.
4. **Core operational modules:** students، courses/programs، classes/groups، scheduling/conflict engine، ثم attendance.
5. **Workflow modules:** leads/enrollment، approvals، finance/payment/expense/correction، مع server-side state transitions وreason fields.
6. **Cross-cutting modules:** audit log، notifications، storage، analytics/report exports، ثم marketing/family/student surfaces.
7. **Frontend integration تدريجيًا:** إضافة typed API client + query/mutation layer لكل module، واستبدال fixture واحدة في كل workflow مع إبقاء حالات UX الحالية وعدم ادعاء الحفظ قبل نجاح API.
8. **Production gates:** authorization tests لكل role/scope، tenant-isolation tests، state-transition tests، API contract tests، ثم E2E للرحلات الحرجة المذكورة في sequence diagrams.

### قواعد لا يجب كسرها أثناء الاستكمال

- لا نبدأ من أسماء الملفات فقط؛ نبدأ دائمًا من `MADA_MASTER.md` ثم State Dictionary ثم Permission Matrix ثم API/DB contract.
- `R08` و`R09` consumer identities منفصلة عن staff roles، ولا يتم وضعهما في نفس authorization model دون الرجوع للبلان.
- `R02` هو Branch Manager؛ `BA` alias قديم في بعض الوثائق فقط، ويجب استخدام `BM` في backend الجديد.
- كل query يجب أن يفرض tenant/branch scope على الخادم؛ إخفاء route أو button ليس حماية.
- لا نضيف frontend-only state يوحي بحفظ دائم. أي prototype behavior يظل معلّمًا بـ`DEMO` ورسالة واضحة.
- لا نغيّر ERD أو API contract أثناء التنفيذ بدون تسجيل decision واضح في هذا الملف.
- أي milestone جديد يحدّث هذا الـMaster File، ولا نحتاج إرسال ملفات تحديث منفصلة للمستخدم.

### نتيجة التدقيق

لا توجد حاليًا ملفات backend فعلية داخل الريبو يمكن البناء عليها مباشرة؛ الموجود هو `server/index.ts` الخاص بالتقديم فقط. لذلك **الخطوة التالية المنطقية ليست تعديل UI عشوائيًا**، بل بدء `Backend foundation + Auth + Tenancy` من العقود الموجودة في ملفات البلان، ثم ربط أول vertical slice كامل من `auth → tenant/branch scope → R00/R01` مع الحفاظ على الـUX الحالي.


### 29 سبتمبر 2026 — Preview Scrollbar Visibility Fix

كان الـscrollbar لا يظهر في Preview لأن بعض قواعد الـlegacy داخل `index.css` كانت تستخدم `scrollbar-width: none` و`::-webkit-scrollbar { display: none; }` على `student-filter-tabs` و`schedule-filter-tabs` و`approval-tabs` و`approval-queue-tabs`. تم إضافة override صريح في `MadaTheme.css` لإجبار هذه المناطق على scrollbar Teal ظاهر، مع track وthumb وارتفاع أفقي ثابت، مع الحفاظ على التمرير نفسه.

التحقق: `pnpm check` نجح، و`pnpm build` نجح، و`git diff --check` نجح، كما أعادت `/` و`/workspace` و`/students` و`/schedule` و`/approvals` حالة HTTP 200 محليًا.

### 29 سبتمبر 2026 — React Default + Angular Preview

تم تثبيت React كواجهة default على `/` وعدم تغييره في هذه المرحلة. أضيف رابط واضح إلى Angular Preview داخل `Workspace Hub`، وأضيف رابط رجوع إلى React default داخل Angular topbar. Backend/API work مؤجل مؤقتًا؛ الأولوية الحالية polish بصري ومقارنة أولية للـfrontendين والـrole tree والـsidebar والـresponsive behavior.

### 29 سبتمبر 2026 — Angular Host + Backend Persistence Foundation

تم إصلاح Angular preview بإضافة `allowedHosts` لنطاقات Manus إلى `client-angular/angular.json`. التحقق عبر localhost وHost header العام أعاد `200`.

بدأ هيكل Backend حقيقي بـASP.NET Core/.NET 10 داخل `backend/`: EF Core، PostgreSQL provider، `MadaDbContext`، tenant/branch/user/membership/invitation/refresh session entities، audit/approval/state transition entities، وmigration أولى باسم `InitialIdentityAndGovernance`. لم يتم تطبيق migration تلقائيًا ولم يتم ربط auth أو feature APIs بعد.

### 29 سبتمبر 2026 — JWT + Sequence-aligned Backend Slice

تم تفعيل JWT Bearer حقيقي في ASP.NET Core مع OTP challenge development adapter، access/refresh rotation، token hashing، role policies، وtenant/branch scope checks. تم توسيع EF Core/PostgreSQL model إلى scheduling/student core طبقًا لأول sequence diagram، وإضافة `ConflictService` وmigrations جديدة. Angular صار يستخدم نفس Mada React visual tokens وRTL shell مع بقاء React هو الـdefault. الخطوة التالية: provider OTP حقيقي، parent/student identities المنفصلة، Serializable create-session transaction، ثم attendance/evaluation workflow.

### 29 سبتمبر 2026 — PostgreSQL Applied + Demo Seed

تم تشغيل PostgreSQL 16.15 محليًا، إنشاء `mada_academy` و`mada_app`، وتطبيق migrations الثلاثة. أضيف `DemoDataSeeder` idempotent وبيانات اختبار للـtenant/branches/roles/scheduling/students/attendance. الـAPI تم اختباره ضد PostgreSQL الحقيقي؛ الخطوة التالية ربط Angular بـtyped API client ثم تنفيذ create-session transaction.

### 29 سبتمبر 2026 — React Connected to Real Backend

تم ربط React بالـASP.NET Core/PostgreSQL عبر typed API client وAuthContext. `/workspace` يدعم OTP/JWT login ويعرض dashboard summary حقيقي من الداتا، مع fallback واضح إلى DEMO MODE. تم إضافة CORS و`VITE_API_URL` للتشغيل المحلي أو public preview.

### 29 سبتمبر 2026 — Frontend First / Demo Role Mode

قرار مرحلي: لا login فعلي الآن. React يعمل افتراضيًا في Demo Role Mode حتى تكتمل كل Role surfaces والـscope tree والـUI interactions. بعد تثبيت الواجهة سيتم إعادة تفعيل API/Auth ثم الاختبار بالـdatabase data. تم توحيد الثيم والـscrollbar كجزء من التصميم.

### 29 سبتمبر 2026 — Students/Sessions/Attendance API Contract

تم تنفيذ أول API contract للـBranch Operations MVP داخل `backend/MadaAcademy.Api/Modules/Operations/OperationalEndpoints.cs`، ويشمل قراءة الطلاب والجلسات وتفاصيل الجلسة والحضور، بالإضافة إلى upsert للحضور للطلاب المسجلين فقط. كل الاستعلامات تفرض tenant/branch scope من JWT claims، وكتابة الحضور مقصورة على R02/R03/R04. تم توثيق الـpayloads وحالات الخطأ في `backend/OPERATIONS_API_CONTRACT.md`.

تمت إضافة typed methods إلى `client/src/lib/apiClient.ts` لـstudents/sessions/attendance، وربط `/students` و`/instructor-desk` بالـAPI الحقيقي عند وجود JWT. الصفحتان تعرضان loading/error/live feedback، وتعودان إلى Demo fixtures عند غياب الجلسة أو فشل الاتصال. قراءة الحضور live، و`PUT` الحضور يحفظ في PostgreSQL ثم يعيد القراءة للتحقق.

تم تنفيذ `POST /api/v1/platform/academies` لـR00، وينشئ Tenant + أول Branch + مستخدم ومس membership لـR01 + AuditEvent، مع validation وduplicate conflicts. تم توسيع `GET /api/v1/me` ليعيد user/academy/branches/roleLabel/permissions، وإضافة `AcademyBootstrap` screen وربطها بالـAPI عبر `/platform/academies/new`، مع AuthProvider global وsuccess/error states.

تم تنفيذ طبقة Login/OTP على `/login` مع session bootstrap وrole-based redirect، وإضافة `ProtectedRoute` لمسار Bootstrap ومسار `/academy/roles`. تم تنفيذ أدوار وصلاحيات الأكاديمية: `GET /academy/roles`، أعضاء الأكاديمية، إضافة عضو، تغيير الدور والنطاق، وتفعيل/إيقاف العضو، مع tenant scope وAudit Events ومنع R01 من منح R00. تمت إضافة شاشة `AcademyRoles` وربطها من Academy Owner navigation.

تم تعديل قرار الدخول في الـMVP: الـprimary auth أصبح `POST /api/v1/auth/login` برقم الهاتف وكلمة المرور، مع PBKDF2 hash وrefresh sessions وRoute Guard. تم إضافة كلمة مرور للـBootstrap owner ولأعضاء الأكاديمية الجدد، وترحيل `UserAccounts.PasswordHash`. OTP ما زال موجودًا في الـbackend كمرحلة لاحقة لكنه لم يعد مستخدمًا من شاشة الدخول الأساسية.

الخطوة التالية: تطبيق password reset/change flow، ثم اختبار auth وRoles API على PostgreSQL فعليًا وتحويل Academy Owner Dashboard من Demo إلى `/me` وبيانات الفروع والأعضاء الحقيقية.


### 30 سبتمبر 2026 — Current Agent Handoff / Session Lifecycle MVP Checkpoint

هذا القسم هو المرجع الأحدث ويتغلب على أي أقسام تاريخية أقدم تقول إن الـBackend غير موجود أو أن الـAPI مؤجل.

#### الحالة الحالية
- React هو الـdefault frontend، وAngular موجود كـpreview/reference منفصل داخل `client-angular/`.
- ASP.NET Core / .NET 10 backend فعلي داخل `backend/MadaAcademy.Api/` مع EF Core، JWT access/refresh، password login، tenant/branch scope، migrations، وdevelopment memory/PostgreSQL modes.
- تم تنفيذ bootstrap الأكاديمية، إدارة الأدوار والمستخدمين، الفروع، القاعات، موارد القاعات، الطلاب، الجلسات، الحضور، وفحص التعارض.
- تم تنفيذ `POST /api/v1/scheduling/sessions` للحفظ الفعلي بعد conflict check، و`POST /api/v1/scheduling/groups` لإنشاء الجروب وتوليد كل الجلسات.
- تم تنفيذ طلبات EXTRA/MAKEUP، substitution requests، عروض المدربين المتاحين، approvals، evaluations، وin-app notifications.

#### آخر ملفات التنفيذ المهمة
- `backend/MadaAcademy.Api/Modules/Scheduling/SessionWorkflowEndpoints.cs`
- `backend/MadaAcademy.Api/Persistence/Entities/SessionWorkflowEntities.cs`
- `backend/MadaAcademy.Api/Persistence/MadaDbContext.cs`
- `client/src/lib/apiClient.ts`
- `backend/SESSION_LIFECYCLE_API_CONTRACT.md`

#### ما تم التحقق منه
- Backend build ناجح.
- `pnpm check` ناجح.
- `pnpm test`: 3 tests passed.
- Live smoke: إنشاء Session وحفظها، ثم رفض الحجز المتداخل بـ`409 SCHEDULING_CONFLICT`.
- Live smoke: طلب MAKEUP ثم approval وتحويل السيشن إلى `SCHEDULED` وإنشاء notifications.

#### الخطوة التالية الإلزامية
1. استبدال local demo save في `client/src/pages/Schedule.tsx` بـ`apiClient.createSession`.
2. ربط شاشة `client/src/pages/Classes.tsx` بـ`apiClient.createGroup` مع multi-select للطلاب وتوليد preview لعدد الجلسات.
3. بناء شاشة approval queue حقيقية تربط `apiClient.listApprovals` و`apiClient.decideApproval`.
4. ربط Instructor Desk بالحضور والتقييمات وطلبات substitution.
5. إضافة consumer identity linking: `StudentAccount` / `GuardianStudentLink` حتى تصل الجلسات والحضور والتقييمات للطالب وولي الأمر، لأن Student الحالي لا يحتوي user/guardian relation.
6. إضافة integration/authorization tests لكل role وtenant/branch isolation، ثم تحديث migration snapshot الرسمي عند توفر `dotnet-ef`.

#### قاعدة الاستمرار
لا يتم حذف الـdemo fixtures دفعة واحدة. كل vertical slice يتحول من fixture إلى API مع الحفاظ على loading/empty/error/pending/approved/rejected/audit feedback، وتبقى أي surface غير موصولة موسومة DEMO بوضوح.


### 30 سبتمبر 2026 — Live Operations + Consumer Portals Checkpoint
هذا checkpoint سجّل تنفيذ فرع `feature/live-operations-workflows`؛ تم لاحقًا دمجه في PR #14. تفاصيل الحالة التالية تحدّث ذلك السجل.

#### التنفيذ الذي دُمج في PR #14
- ربط `Schedule`, `Classes`, `Approvals`, و`InstructorDesk` بعقود الـAPI الحية؛ الواجهات تميّز بين DEMO/LIVE ولا تدّعي حفظ عمليات غير مدعومة.
- تضييق قراءة جلسات/طلاب المدرب إلى الجلسات المسندة إليه، وإثراء استجابات الجدول/الموافقات بأسماء التشغيل.
- إضافة حسابات المستهلكين `R08_PARENT` و`R09_STUDENT` وروابط `StudentAccountLink` و`GuardianStudentLink` مع endpoints لإدارة الروابط وقراءة الطلاب والجلسات ذات الصلة فقط.
- إضافة لوحة في ملف الطالب لعرض/إدارة الحسابات المرتبطة، وتوصيل بوابتي الأسرة والطالب بالبيانات المقيدة بالحساب. فواتير الأسرة لا تعرض أرقامًا تجريبية في وضع LIVE.
- لا تُكشف درجات/ملاحظات المدرب لحساب المستهلك حتى وجود حالة نشر/مراجعة صريحة في النموذج.
- إضافة GitHub Actions للواجهة `.github/workflows/frontend-checks.yml` إلى جانب اختبارات backend/PostgreSQL.

#### التحقق المحلي
- `pnpm check` ناجح.
- `pnpm test`: 3/3 ناجحة.
- `pnpm build` ناجح؛ توجد تحذيرات سابقة للمشروع عن متغيرات Umami غير المضبوطة في بيئة البناء.
- `dotnet test backend/MadaAcademy.Api.IntegrationTests/...`: 19/19 ناجحة على PostgreSQL 16.15 (ومنها migrations وPostgreSQL-host checks).
- `git diff --check` ناجح.

#### المتبقي بعد PR #14
- دعم إنشاء حساب مستهلك/دعوة تفعيل برقم الهاتف ضمن onboarding آمن؛ البحث عن الحسابات الموجودة نُفذ في checkpoint رقم 17.
- تقييم/نشر تقييمات المستهلك يتطلب إضافة حالة مراجعة/نشر صريحة؛ تظل الدرجات مخفية عن المستهلكين حتى اكتمالها.
- بناء API للفواتير/المدفوعات وربط بوابة الأسرة بها؛ الوضع الحي لا يعرض أرقامًا مالية تجريبية.
- إضافة تدفقات تغيير/استعادة كلمة المرور ومزود OTP فعلي بدل adapter التطوير.
- مراجعة بقية شاشات الأدوار بحثًا عن إجراءات DEMO-only وترحيل الأولوية منها إلى API مع تغطية صلاحياتها.

### 30 سبتمبر 2026 — Consumer Account Phone Search Checkpoint
- أضيف `GET /api/v1/students/{studentId}/consumer-accounts?phone=...&accountType=parent|student` للبحث الدقيق فقط؛ يتطلب دورًا مخولًا ويحترم tenant/branch scope.
- تُطبّع أرقام E.164 والأرقام المصرية المكتوبة بالأرقام العربية/الفارسية، وتُعرض مطابقة نشطة مؤهلة من الأكاديمية نفسها بآخر أربعة أرقام فقط. لا تظهر UUIDs للمستخدم ولا تُكشف الحسابات ذات عضوية نشطة في أكاديمية أخرى.
- استُبدل حقل UUID في نافذة الطالب ببحث واختيار نتيجة ثم تنفيذ الربط بالـID الداخلي. لا يُنشأ حساب تلقائيًا عند عدم العثور عليه؛ إنشاء الحساب يحتاج مسار دعوة/تفعيل آمنًا.
- التحقق: `dotnet build ...Api.csproj -c Release` ناجح؛ backend integration suite **22/22** (15 InMemory و7 PostgreSQL 16)؛ `pnpm check` ناجح؛ `pnpm test` **3/3**؛ `pnpm build` ناجح مع تحذيرات إعداد Umami السابقة؛ `git diff --check` ناجح.


### 30 سبتمبر 2026 — Role Scope + Workspace Truth Alignment

- تم توحيد metadata الظاهرة لـR03 وR07 إلى نطاق الفرع في `roleNavigation` وصفحات HeadInstructors وAcademicPrograms وMarketingDesk، بما يطابق RoleCatalog والعقد الخلفي الحالي؛ ظل وصف فريق المدربين فرعيًا ضمن النطاق لا بديلًا عن scope الفرع.
- تم تصحيح نصوص Workspace Hub القديمة التي كانت تزعم أن Login وBackend مؤجلان؛ يوضح الـHub الآن أن اختيار الدور معاينة وتنقل فقط ولا يمنح صلاحيات، وأن الصفحات المتصلة تستخدم API عند وجود جلسة صالحة، بينما الباقي DEMO.
- أضيف اختبار regression للتحقق من أن R03 وR07 يظلان branch-scoped في سجل الواجهة.
- التحقق: `pnpm check` ناجح؛ `pnpm test` **5/5**؛ `pnpm build` ناجح؛ `git diff --check` ناجح. بقيت تحذيرات إعداد pnpm وUmami كما كانت قبل التغيير.
- ملاحظة متابعة: هذا يصحح عقد العرض ولا يوسع APIs المالية/التسويقية أو تغطية route guards. الشريحة الوظيفية التالية حسب الخطة هي onboarding ودعوة حسابات المستهلكين، مع تحديد طريقة تفعيل/إرسال الدعوة قبل اعتمادها إنتاجيًا.


### 30 سبتمبر 2026 — Consumer SMS OTP Onboarding (MVP بلا تكلفة)

- أضيف `ConsumerInvitation` وmigration `AddConsumerPhoneOnboarding`، مع جعل بريد حساب المستخدم اختيارياً للمستهلكين، وربط الدعوة بالأكاديمية والفرع والطالب وبالمستخدم الذي أنشأها/قبلها.
- أضيف endpoint موظفين `POST /api/v1/students/{studentId}/consumer-invitations`، ومسارات عامة لمعاينة الدعوة وإعادة إرسال OTP وقبولها. لا يُرسل UUID أو بيانات الطالب في الرسالة؛ رابط القبول يحمل token عشوائياً داخل URL fragment، ويُخزّن hash الرمز/الـOTP فقط.
- قبول الدعوة يثبت الهاتف عبر OTP عشوائي 6 أرقام، ثم ينشئ حساب parent/student وعضوية R08/R09 ورابط GuardianStudentLink/StudentAccountLink، ويصدر جلسة JWT. البريد اختياري. جميع عمليات إنشاء الدعوة والتحقق من الطالب تراعي tenant/branch scope؛ الأكواد صالحة 10 دقائق، حدها 5 محاولات، وإعادة الإرسال محدودة ومؤقتة.
- أضيفت صفحة RTL عربية `/accept-invitation` وربط شاشة الطالب بزر دعوة عند عدم وجود حساب نشط مطابق للهاتف.
- **قرار بلا رسوم في MVP:** لا يوجد مزود SMS فعلي الآن. `DevelopmentSmsMessageSender` يولّد OTP جديداً ويعيده لأغراض التطوير/الاختبار فقط؛ في بيئة الإنتاج لا يوجد adapter فعلي حالياً، لذلك يفشل الإرسال مغلقاً بـ503 ولا يُقبل كود ثابت أو وهمي. عند اختيار مزود لاحقاً يُضاف خلف `ISmsMessageSender` مع `MADA_FRONTEND_URL` للرابط، ويُرفض رابط HTTP خارج Development؛ لا توجد رسوم مزود في الوضع الحالي.
- التحقق: `pnpm check` ناجح؛ `pnpm test` **5/5**؛ `pnpm build` ناجح (مع تحذيرات Umami المعروفة لغياب إعدادات analytics محلياً)؛ backend integration tests **27/27** ناجحة على PostgreSQL 16.15 وInMemory، وتشمل migration وتدفق قبول دعوة PostgreSQL، عزل الفرع، قفل OTP بعد المحاولات الخاطئة، وفشل الإرسال المغلق عند غياب المزود؛ `git diff --check` ناجح.
- المتبقي في onboarding قبل الاستخدام الحي: اختيار وإعداد مزود SMS مدفوع، وإضافة الأسرار إلى بيئة الخادم. تظل الأولويات الأخرى: مراجعة/نشر التقييمات (تم تنفيذها في 1 أكتوبر 2026)، الفواتير/المدفوعات، واستعادة كلمة المرور.


### 1 أكتوبر 2026 — Evaluation Review & Publication Workflow

- أضيفت حالات `DRAFT` و`SUBMITTED` و`CHANGES_REQUESTED` و`PUBLISHED` إلى `SessionEvaluation` عبر migration `AddEvaluationReviewWorkflow`، مع ملاحظة المراجع، أوقات الإرسال/المراجعة/النشر وهوية المراجع، وفهرس للحالة. السجلات السابقة تتحول افتراضياً إلى `DRAFT` وتظل مخفية عن المستهلك.
- المدرب/R03 المسند للجلسة يستطيع قراءة تقييماته وحفظها كمسودات ثم إرسال طالب محدد للمراجعة. التعديل مرفوض بعد الإرسال أو النشر؛ بعد إرجاعها للمراجعة يستطيع المدرب تحديثها وإعادة إرسالها.
- دور R03 فقط يطّلع على queue ضمن tenant/branch claim الخاص به، وينشر أو يعيد التقييم مع ملاحظة إلزامية عند طلب التعديل. الانتقالات تسجل في `StateTransitionEvent` وتولد تنبيهات للطاقم.
- بوابة الأسرة/الطالب لا تعيد `score` أو `notes` إلا للحالة `PUBLISHED`. الواجهة العربية RTL في InstructorDesk تميز المسودة والحالة والإرسال؛ HeadInstructors يعرض queue حقيقية عند وجود جلسة API ولا يعرض بطاقات التقييم التجريبية في تبويب/ملخص التقييمات الحي. بوابة الأسرة في LIVE تعرض أن الفواتير غير متاحة ولا تعرض مبالغ DEMO.
- التحقق المحلي: `pnpm check` ناجح؛ Vitest **5/5**؛ `pnpm build` ناجح؛ backend integration tests **29/29** ناجحة على PostgreSQL 16 وInMemory، بما فيها migration، submit/review/publish، عزل R03 حسب الفرع، وظهور الدرجات للمستهلك بعد النشر فقط؛ `dotnet ef migrations has-pending-model-changes` لا يجد تغييرات؛ `git diff --check` ناجح.
- الخطوة الوظيفية التالية: بناء Invoices/Payments API وربط Family Portal. استعادة كلمة المرور وOTP SMS الفعلي تتطلبان قرار/إعداد خدمة، وتبقى نسخة MVP الحالية fail-closed بلا تكلفة.


### 1 أكتوبر 2026 — Current Handoff + Next Milestone

- دمج PR #18 (`feat: add evaluation review and publication workflow`) في `main`؛ merge commit `92bec875`. اجتازت CI على GitHub الفحوصات المطلوبة، وسجل التحقق المحلي 29/29 backend integration tests على PostgreSQL/InMemory، وVitest 5/5، و`pnpm check`, `pnpm build`, وEF pending-model check.
- المصدر التنفيذي يبقى React + Vite؛ Angular مرجع فقط. آخر ميزات LIVE المؤكدة تشمل التشغيل/الجداول/الموافقات/مكتب المدرب، روابط هوية المستهلك، الدعوات، ونشر التقييمات. راجع `PROJECT_STATUS.md` بدل الاستنتاج من صفحات العرض التجريبي.
- **المرحلة التالية:** فواتير داخلية وسجلات دفعات بالطرق cash/Visa/InstaPay/Vodafone Cash، وإثباتات خاصة، ثم ربط Family Portal؛ لا يوجد أي invoice/payment API أو upload حقيقي حتى الآن. تفاصيل التنفيذ والموانع ومعايير القبول في `NEXT_PHASE_PLAN.md` و`INVOICES_PAYMENTS_MVP_PLAN.md`.
- OTP/SMS الحقيقي غير مضبوط: Development فقط يولد رمزًا عشوائيًا لأغراض الاختبار، وما عدا Development يفشل مغلقًا. أعد `OTP_MVP_TEMPORARY_PLAN.md` مسار pilot مساعدًا يدويًا ومحدودًا خلف flag وallowlist؛ لم ينفذ بعد، وليس بديلًا دائمًا لمزود SMS.
- استعادة كلمة المرور، تخزين إثبات الدفع الخاص، صلاحيات R05 المالية الدقيقة، توصيل الماليات للمستهلك، وتدقيق صفحات demo/route guards ما زالت فجوات معلنة.
- نقطة البدء للوكيل التالي: `AGENT_START_HERE.md`، والحالة المفصلة: `PROJECT_STATUS.md`. الحزمة القديمة في مجلد ملفات المشروع المشتركة مؤرخة 30 سبتمبر 2026 ولا تعكس الدمج الأخير.


## 2026-10-03 — Finance Vertical Slice: Production Readiness & UI Contract Hardening

The current phase is **Finance/Operations production hardening**, not a new OTP, marketing, or dashboard feature. The repository `main` after PR #30/#31 is the source of truth.

This PR hardens `FinanceDesk` as the only operational finance route: payment method state now supports `CASH`, `VISA`, `INSTAPAY`, and `VODAFONE_CASH`; live payment requests carry `receivedOn` and require `externalReference` for digital-wallet methods; payment and evidence states are explicit; `/finance` redirects to `/finance-desk` and is not an operational surface.

Authorization remains server-side and narrow: R05 secretary can perform invoice/payment operations required by the secretary workflow; R06 accountant can perform the finance workflow; there is no broad `finance.write`; all financial queries and consumer invoice/evidence reads remain tenant/branch/link scoped. PostgreSQL migration, concurrency, method, evidence, role, and consumer isolation tests are release gates.

**Storage decision:** real production evidence uploads remain blocked until the hosting environment provides durable private storage with backup, preferably S3-compatible object storage. Local disk is acceptable only for development/test or an explicitly persistent, backed-up deployment; it is not a production default.

Storage runtime now defaults to fail-closed outside Development. An optional Supabase private Storage adapter is available through server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and `MADA_PRIVATE_STORAGE_MODE=supabase`; no Supabase project credentials are present in the repository.


Current state: Finance evidence storage is in testing on the private Supabase `private-evidence` bucket. Manual owner backups are accepted during testing. Production sign-off still requires a documented durable/off-site object backup policy.


## 2026-10-03 — P1 Core Journey Closed / Consumer Smoke Phase Started

تم دمج PR #35 (`1d13815`) بعد نجاح كل checks: backend PostgreSQL integration **70/70**، وفحوصات الـfrontend والـpreviews. أصبح `DemoDataSeeder` repairable/idempotent للـcore graph، بما يشمل حسابات R04/R08/R09 وروابطهم وبيانات enrollment وattendance والتقييم المنشور وانتقالات الحالة. أضيفت رحلة API من حفظ التقييم وإرساله للمراجعة ونشره حتى ظهوره للمستهلك، مع عزل parent/student والـbranch scope.

المرحلة النشطة التالية هي manual authenticated smoke test لـR08/R09. الحسابات والبيانات التجريبية جاهزة، لكن الاختبار اليدوي ينتظر API غير إنتاجي مضبوط؛ Finance deployment وSupabase secrets وevidence storage ما زالت مؤجلة. الـrunbook التنفيذي هو `CONSUMER_STAGING_SMOKE_TEST.md`.

## 2026-10-03 — Finance Local Acceptance + Browser E2E Closed

تم إغلاق شريحة Finance على مستوى الكود والقبول المحلي. اختبارات Finance وInvoice correction نجحت **11/11**، والواجهة نجحت في `pnpm check` وVitest و`pnpm build`، وأضاف الريبو Playwright E2E حقيقية باستخدام Chromium. النتيجة **3/3**: R06 FinanceDesk LIVE، R08 Family Portal بعزل الطفل المرتبط، وR09 Student Portal بعزل الطالب.

المتبقي ليس كودًا محليًا: حقن `SUPABASE_SERVICE_ROLE_KEY` في خادم غير الواجهة، تشغيل upload/download smoke على bucket `private-evidence`، توثيق backup/restore دائم للـobjects، ثم staging smoke بعد النشر. لذلك Finance أصبح **code/local-accepted** وليس **production-ready** بعد.

## 2026-10-03 — Production Preparation Pack + Expanded E2E

اكتملت كل الأعمال الداخلية المطلوبة قبل النشر: أضيفت دورة E2E موسعة ونجحت **4/4**، وتشمل إنشاء فاتورة، تسجيل دفعة، منع تجاوز الرصيد، رفع/تنزيل إثبات، إضافة إلى R06/R08/R09. أضيف `backend/Dockerfile`، و`backend/.env.production.example` بدون أسرار، و`scripts/staging-smoke.sh`، و`PRE_PRODUCTION_RUNBOOK.md`.

ما زال القرار/التشغيل الخارجي فقط: اختيار منصة API، إدخال secrets في secret manager، تشغيل PostgreSQL وprivate Supabase storage، تنفيذ backup/restore، ثم تشغيل staging smoke. لا توجد أسرار أو مفاتيح إنتاج في الريبو.

## 2026-10-04 — UI / Flow / Architecture Review Pack

تمت مراجعة R00–R09 على مستوى route/auth/role scope/flows/styling. الإصلاحات المنفذة: route guards صريحة في App، جلسة مطلوبة للـworkspace والأسطح التشغيلية، إزالة demo state من أغلفة LIVE، stylesheet مشترك للبوابات RTL/responsive، تصميم Academy Bootstrap، وE2E للـanonymous redirect والعزل والخروج. التحقق المحلي: typecheck و13/13 unit tests وbuild ناجحون؛ الجولة الأولى من E2E نجحت في 6/7، وتم جعل اختبار عزل parent يقبل الرفض الصريح أو العودة الآمنة إلى login. البنود المتبقية موثقة في `UI_FLOW_REVIEW_STATUS.md` ولا تشملها هذه الحزمة: Marketing API، production storage/secrets/staging، backup/restore، وpending states المالية.
