

## Auth milestone

JWT Bearer أصبح فعليًا داخل ASP.NET Core مع access token مدته 15 دقيقة، refresh token مدته 7 أيام مع rotation وhashing، OTP challenge محدود بثلاث محاولات، claims تشمل `sub`, `accountType`, `role`, `tenantId`, `branchId`, و`scopeLevel`، وpolicies للـstaff/platform owner/branch manager. `MADA_DATABASE_MODE=memory` متاح للاختبارات المحلية فقط؛ الإنتاج يظل PostgreSQL.

## Sequence milestone

تمت إضافة scheduling/student core entities وmigration باسم `AddSchedulingAndStudentCore`. `ConflictService` بدأ تنفيذ Sequence Diagram رقم 1 ويفحص instructor/classroom/student/kit overlaps. Branch operating hours وSerializable create-session transaction سيأتيان مع أول create-session slice.
