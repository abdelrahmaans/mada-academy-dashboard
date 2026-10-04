# Backend Status and Delivery History

> **Current truth — 4 October 2026:** This file is a chronological delivery log. For current state, use [PROJECT_STATUS.md](PROJECT_STATUS.md), [NEXT_PHASE_PLAN.md](NEXT_PHASE_PLAN.md), and [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md). Entries below are historical snapshots unless explicitly labeled as current.

---

## 10. JWT + Sequence-aligned Backend Slice — 29 سبتمبر 2026

تم تفعيل JWT Bearer حقيقي في ASP.NET Core مع access/refresh tokens، refresh rotation، hashing للـrefresh sessions، OTP challenge development adapter، claims للـaccount/role/tenant/branch، وauthorization policies/guards server-side. تم اختبار `me`, tenant scope allow/deny، refresh rotation، old refresh rejection، وunauthenticated access.

بدأ تنفيذ sequence-aligned operational schema بإضافة scheduling core (`Classroom`, `CourseTemplate`, `CourseOffering`, `AcademySession`, `Kit`, `KitAssignment`) وstudent core (`Student`, `StudentEnrollment`, `SessionAttendance`) مع migration `AddSchedulingAndStudentCore` و`ConflictService` لفحص instructor/classroom/student/kit conflicts. Branch-hours check وSerializable create-session transaction هما الخطوة التالية قبل endpoint إنشاء السيشن.

Angular shell تم توحيد ألوانه وRTL/topbar/sidebar spacing مع React Mada tokens مع إبقاء React هو default.

---

## 11. PostgreSQL + Demo Data — 29 سبتمبر 2026

تم تثبيت PostgreSQL 16.15 وتشغيله محليًا على port `5432`، وإنشاء database `mada_academy` وapplication role `mada_app`. تم تطبيق migrations الثلاثة فعليًا عبر `dotnet ef database update`.

تمت إضافة `DemoDataSeeder` idempotent وبيانات اختبار حقيقية: tenant واحد، فرعان، 7 staff accounts، memberships لكل الأدوار الحالية، classrooms، course offering، 3 sessions، kit، 6 students، 4 enrollments، وattendance records. تم اختبار OTP/JWT و`/me` وtenant scope وrefresh ضد PostgreSQL الحقيقي.

ملف التشغيل والتفاصيل: `backend/DATABASE_STATUS.md`.

---

## 12. React API Integration — 29 سبتمبر 2026

React أصبح متصلًا بالـASP.NET Core عبر `client/src/lib/apiClient.ts` و`AuthContext`. تمت إضافة OTP/JWT session handling، refresh retry، logout، وdashboard summary حقيقي من PostgreSQL. أضيفت بطاقة اتصال داخل `/workspace` تعرض DEMO MODE أو CONNECTED مع role/scope وأعداد الطلاب والجلسات القادمة والمكتملة. تم تفعيل CORS للـDevelopment، وإضافة `VITE_API_URL` في `.env.example`.

---

## 13. Frontend-first Demo Role Mode — 29 سبتمبر 2026

تم إيقاف تفعيل login/JWT داخل React مؤقتًا. الوضع الافتراضي الآن هو `Demo Role Mode`: اختيار R00–R09 من Workspace Hub وفتح الصفحة الخاصة بالدور مباشرة، مع scope وnavigation tree واضحين لكل Role. ملفات API/Auth محفوظة للتفعيل لاحقًا بعد اكتمال الشاشات والـworkflow interactions والاختبار ببيانات حقيقية.

تم تثبيت Mada shared theme والـcustom scrollbar على الأسطح الرئيسية والـcontent scroll containers بدل الشكل الافتراضي للمتصفح.

---

## 14. Students + Sessions + Attendance API Contract — 29 سبتمبر 2026

تمت إضافة أول operational vertical-slice endpoints داخل `backend/MadaAcademy.Api/Modules/Operations/OperationalEndpoints.cs`:

- `GET /api/v1/students`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/{sessionId}`
- `GET /api/v1/sessions/{sessionId}/attendance`
- `PUT /api/v1/sessions/{sessionId}/attendance`

كل endpoints محمية بـstaff JWT، وتستمد `tenantId` و`branchId` من الـclaims بدل body/query. القراءة scoped حسب tenant/branch، وكتابة الحضور متاحة فقط لـR02/R03/R04. تم تطبيق validation للـstatus، late minutes، duplicate students، enrollment، وعدم تعديل الجلسات `CANCELLED` أو `COMPLETED`. العقد الكامل موثق في `backend/OPERATIONS_API_CONTRACT.md`.


---

## 15. Backend Integration Tests + CI — 30 سبتمبر 2026

أضيف مشروع `backend/MadaAcademy.Api.IntegrationTests` مع 10 اختبارات API على EF InMemory و6 اختبارات PostgreSQL 16 حقيقية. تغطي التغطية الحالية المصادقة والصلاحيات، tenant/branch isolation، approval review، الحضور والتقييمات، refresh-token rotation/logout revocation، منع تكرار طلب substitution، وتطبيق migrations على schema اختبار منفصل `mada_integration_tests`.

اكتشف التحقق أن EF model snapshot كان متأخرًا عن `MadaDbContext`؛ تمت مزامنته وإضافة migration `AlignCurrentModel` بدل تعطيل تحذير pending model changes. workflow `.github/workflows/backend-integration-tests.yml` يعمل على Pull Request وتغييرات `main`، بصلاحيات `contents: read` فقط، ويشغل PostgreSQL 16، migrations والـtests ثم backend Release build. عند الفشل يحتفظ بـTRX وtest/migration log كـartifact.

التحقق المحلي: `dotnet build backend/MadaAcademy.sln --configuration Release` نجح، و`dotnet ef migrations has-pending-model-changes` أفاد بعدم وجود تغييرات معلقة، ونجحت الاختبارات **16/16** على PostgreSQL 16.15 وInMemory.


---
## 16. Live Operations + Consumer Identity — 30 سبتمبر 2026
على فرع `feature/live-operations-workflows` أضيفت روابط StudentAccount وGuardianStudentLink مع migrations وendpoints scoped لإدارتها وقراءة بيانات الطالب/ولي الأمر المرتبطة فقط. تم تضييق scope المدرب على الجلسات المسندة، وربط واجهات الجدول والكورسات والموافقات ومكتب المدرب وبوابتي الأسرة والطالب بالـAPI. درجات/ملاحظات المدرب لا تُعرض للمستهلكين حتى يُضاف مسار نشر ومراجعة صريح؛ والفواتير لا تعرض عينات في وضع LIVE. شاشة الطلاب تتيح إدارة الحسابات المرتبطة لحساب موجود باستخدام UUID.

التحقق وقتها: **19/19** backend integration tests نجحت على PostgreSQL 16.15؛ `pnpm check` و`pnpm test` (3/3) و`pnpm build` نجحت. أضيف `.github/workflows/frontend-checks.yml`؛ ثم دُمج هذا العمل في PR #14 بعد نجاح CI. ملاحظة: بناء الواجهة يظهر تحذيرات Umami لغياب `VITE_ANALYTICS_ENDPOINT` و`VITE_ANALYTICS_WEBSITE_ID` في بيئة البناء فقط؛ build ينتهي بنجاح.

---
## 17. Consumer Account Phone Search — 30 سبتمبر 2026
أضيف endpoint بحث دقيق داخل نطاق الطالب عن حساب parent/student النشط بواسطة رقم الهاتف. يقبل E.164 أو رقمًا مصريًا محليًا، ويحوّل الأرقام العربية/الفارسية، ويعيد الاسم ونوع الحساب وآخر أربعة أرقام فقط. النتائج مؤهلة للربط بنفس الأكاديمية، ويستبعد حسابات بعض الأكاديميات الأخرى أو حساب الطالب المرتبط أصلًا بطالب مختلف. يستبدل UI إدخال UUID بنموذج بحث ثم اختيار؛ UUID لا يظهر في الواجهة.
لا ينشئ البحث حسابًا جديدًا عند عدم وجود مطابقة؛ إنشاء الحساب/الدعوة وتعيين كلمة المرور يحتاج onboarding آمنًا وسيبقى بندًا مستقلًا.
التحقق: Backend Release build ناجح؛ backend integration suite **22/22** (15 InMemory API tests و7 PostgreSQL 16 tests)؛ `pnpm check` و`pnpm test` (3/3) و`pnpm build` ناجحة. ما زالت تحذيرات إعداد Umami تظهر في البيئة المحلية فقط.


---

## 18. Consumer SMS OTP Onboarding — 30 سبتمبر 2026

أضيفت دعوات حساب parent/student عبر الهاتف: staff-only إنشاء دعوة من طالب داخل نطاق الأكاديمية/الفرع، معاينة عامة محدودة، إعادة إرسال OTP بمعدل محدود، وقبول الدعوة لإنشاء الحساب والعضوية ورابط الطالب/ولي الأمر ثم إصدار JWT. الـOTP عشوائي، يُخزن HMAC فقط بمفتاح JWT، والرابط token عشوائي مخزن كـhash ويُنقل في URL fragment؛ البريد الإلكتروني أصبح اختيارياً لحساب المستهلك. تمت إضافة قيود/علاقات EF وmigration `AddConsumerPhoneOnboarding`.

الواجهة: شاشة طلاب تعرض زر دعوة إذا لم يوجد حساب مطابق، وصفحة `/accept-invitation` عربية RTL تستكمل OTP وكلمة المرور وتدخل المستهلك إلى بوابته.

**MVP بلا تكلفة:** لا يوجد provider SMS فعلي. الـDevelopment sender يعيد OTP عشوائياً للاختبار فقط؛ `UnconfiguredSmsMessageSender` في البيئات غير التطويرية يرفض الإرسال بـ503 ويسجل فشل التسليم، ولا توجد رموز ثابتة أو قبول وهمي. مزود لاحقاً يمكن ربطه دون تغيير API/UI عبر `ISmsMessageSender`؛ يجب ضبط `MADA_FRONTEND_URL` على أصل الواجهة الحي عبر HTTPS خارج Development.

التحقق: **27/27** backend integration tests ناجحة على PostgreSQL 16.15 وInMemory، بما فيها test قبول الدعوة فعلياً على PostgreSQL؛ `pnpm check`، `pnpm test` **5/5**، `pnpm build` و`git diff --check` ناجحة. ما زالت تحذيرات Umami في build محلية فقط.


---

## 19. Evaluation Review & Publication — 1 أكتوبر 2026

تمت إضافة دورة حالة لتقييم الجلسة: `DRAFT` → `SUBMITTED` → `PUBLISHED` أو `CHANGES_REQUESTED` → `SUBMITTED`. يوفر المدرب المسند:

- `GET /api/v1/scheduling/sessions/{sessionId}/evaluations` لقراءة سجلاته وحالات المراجعة وملاحظات الإرجاع.
- `PUT /api/v1/scheduling/sessions/{sessionId}/evaluations` لحفظ/تحديث المسودات؛ لا يمكن تعديل تقييم أُرسل أو نُشر.
- `POST /api/v1/scheduling/sessions/{sessionId}/evaluations/submit` لإرسال تقييمات محفوظة بعد اكتمال الدرجة والملاحظة.

دور `R03_HEAD_INSTRUCTORS` فقط يملك `evaluations.review`: `GET /api/v1/scheduling/evaluation-reviews` يعيد قائمة الفرع من claims، و`POST /api/v1/scheduling/evaluation-reviews/{evaluationId}/decision` يقبل `PUBLISH` أو `REQUEST_CHANGES`؛ يتطلب الإرجاع ملاحظة، ولا يمكن نشر تقييم خارج فرع المراجع. تسجل الانتقالات وتُرسل تنبيهات للطاقم. يتم تعيين الحالة الافتراضية في PostgreSQL إلى `DRAFT` لتظل السجلات السابقة مخفية بعد الترحيل.

`GET /api/v1/consumer/me/sessions` لا يعيد الدرجة أو الملاحظات إلا للتقييمات `PUBLISHED`. الاختبارات تغطي حجب المسودة وتحت المراجعة والمطلوب تعديلها، صلاحية R03 وعزل الفرع، ثم إتاحة النتيجة بعد النشر ورفض تعديلها بعدها.

الواجهة: InstructorDesk يدعم حفظ المسودة/الإرسال ويقرأ الحالة وملاحظة المراجع؛ HeadInstructors يحمّل queue حقيقية في LIVE ولا يعرض أمثلة التقييم في summary الحي؛ واجهة الأسرة لا تعرض مبالغ مالية تجريبية في LIVE حتى إضافة API الفواتير.

التحقق: **29/29** backend integration tests ناجحة على PostgreSQL 16 وInMemory؛ `pnpm check`، Vitest **5/5**، `pnpm build`، `dotnet ef migrations has-pending-model-changes` و`git diff --check` ناجحة.


---

## 20. Historical Backend Handoff — 1 October 2026

- Current merged base: PR #18, commit `92bec875` (`feature/evaluation-review-publish`). GitHub CI passed. Latest recorded local validation: **29/29** backend integration tests on PostgreSQL 16 + InMemory; frontend Vitest **5/5**, `pnpm check`, `pnpm build`, and `dotnet ef migrations has-pending-model-changes` passed.
- Current persisted slices include identity/JWT, tenant/branch-scoped operations and scheduling, consumer account links/invitations, and review/publication of session evaluations. Consumer sessions expose evaluation score/notes only after `PUBLISHED`.
- **Finance vertical slice is implemented:** invoice/payment/evidence entities, migrations, scoped APIs, and LIVE FinanceDesk/consumer invoice reads exist. Demo fixtures remain only outside an authenticated live session. Evidence storage remains private and fail-closed unless a durable backend is configured.
- **OTP:** `DevelopmentSmsMessageSender` is registered only in ASP.NET Development; non-Development uses `UnconfiguredSmsMessageSender` and returns a closed failure when no provider is configured. Never switch production to Development or add a shared code. The staff-assisted, allowlisted manual pilot is only a plan in `OTP_MVP_TEMPORARY_PLAN.md`, not a backend behavior.
- **Finance next gate:** configure private storage, run authenticated upload/download smoke, document durable object backup/restore, and run deployed staging acceptance. The financial contract and open blockers are in `NEXT_PHASE_PLAN.md` and `INVOICES_PAYMENTS_MVP_PLAN.md`.
- Still not implemented: password recovery, production SMS provider, payment processing/reconciliation, official tax invoicing, and automated object backup/restore. Do not represent these as supported.


## 21. Finance Vertical Slice — Production Readiness & UI Contract Hardening — 3 October 2026

The finance APIs and persistence are now the current hardening target. `FinanceDesk` is the operational UI; `/finance` redirects to it rather than exposing a second demo workflow.

- Payment methods are constrained to `CASH`, `VISA`, `INSTAPAY`, and `VODAFONE_CASH`.
- Payment records expose and persist `receivedOn`; InstaPay/Vodafone Cash require an external reference.
- Evidence responses distinguish `ATTACHED` from `NOT_ATTACHED`, and the UI distinguishes registered payment, evidence attached, and evidence not attached.
- R05/R06 access is tested against tenant/branch scope and narrow operations; no `finance.write` permission is granted.
- Release gate: PostgreSQL migration test, concurrent payment test, all payment methods, evidence upload/download, R05/R06 authorization, consumer-link isolation, frontend live/demo checks, and staging smoke test.

**Deployment/storage gate:** `LocalPrivateObjectStorage` must not be treated as production durability. Until a durable private backend and backup policy are configured, production must not accept real evidence uploads. The deployment handoff must document the selected private object storage, retention, backup, restore test, and secret/configuration requirements.

Storage runtime now defaults to fail-closed outside Development. An optional Supabase private Storage adapter is available through server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and `MADA_PRIVATE_STORAGE_MODE=supabase`; no Supabase project credentials are present in the repository.


### Current testing state — Supabase evidence storage

The `mada-software` Supabase project is the selected private evidence-storage target. The `private-evidence` bucket is private, limited to 10 MiB, and restricted to PDF/JPG/PNG. The system is currently in testing: the owner will perform manual backups temporarily, while the backend remains fail-closed unless `MADA_PRIVATE_STORAGE_MODE=supabase` and the server-only Supabase secret are configured. Automatic/off-site object backup remains a production gate, not a blocker for this testing phase.
