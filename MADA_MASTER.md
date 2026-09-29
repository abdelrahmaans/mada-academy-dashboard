
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
