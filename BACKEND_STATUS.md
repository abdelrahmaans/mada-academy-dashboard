

---

## 10. JWT + Sequence-aligned Backend Slice — 29 سبتمبر 2026

تم تفعيل JWT Bearer حقيقي في ASP.NET Core مع access/refresh tokens، refresh rotation، hashing للـrefresh sessions، OTP challenge development adapter، claims للـaccount/role/tenant/branch، وauthorization policies/guards server-side. تم اختبار `me`, tenant scope allow/deny، refresh rotation، old refresh rejection، وunauthenticated access.

بدأ تنفيذ sequence-aligned operational schema بإضافة scheduling core (`Classroom`, `CourseTemplate`, `CourseOffering`, `AcademySession`, `Kit`, `KitAssignment`) وstudent core (`Student`, `StudentEnrollment`, `SessionAttendance`) مع migration `AddSchedulingAndStudentCore` و`ConflictService` لفحص instructor/classroom/student/kit conflicts. Branch-hours check وSerializable create-session transaction هما الخطوة التالية قبل endpoint إنشاء السيشن.

Angular shell تم توحيد ألوانه وRTL/topbar/sidebar spacing مع React Mada tokens مع إبقاء React هو default.
