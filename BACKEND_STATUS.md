

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
