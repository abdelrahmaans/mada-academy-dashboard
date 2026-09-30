

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

التحقق الحالي: **19/19** backend integration tests نجحت على PostgreSQL 16.15؛ `pnpm check` ناجح؛ `pnpm test` نجح **3/3**؛ و`pnpm build` ناجح. أضيف `.github/workflows/frontend-checks.yml` لتكرار فحوصات TypeScript والاختبارات والبناء على GitHub. بقي فتح PR لهذا الفرع وانتظار CI ثم دمجه بعد النجاح. ملاحظة: بناء الواجهة يظهر تحذيرات Umami لغياب `VITE_ANALYTICS_ENDPOINT` و`VITE_ANALYTICS_WEBSITE_ID` في بيئة البناء فقط؛ build ينتهي بنجاح.
