# Scheduling module

هذا أول business module بعد auth/tenancy، ومبني على Sequence Diagram رقم 1.

## Contract

`POST /api/v1/scheduling/check-conflict` يفحص داخل branch:

1. Instructor overlap.
2. Classroom overlap.
3. Kit quantities.
4. Student double booking.
5. Branch-hours hook (موجود في contract كـ`BranchHours` وسيُربط بعد إضافة operating-hours entity).

تم تنفيذ إنشاء Session الفعلي عبر `POST /api/v1/scheduling/sessions` باستخدام نفس `ConflictService` داخل transaction PostgreSQL بمستوى `Serializable`، ثم حفظ `AcademySession` و`KitAssignments` معًا أو إرجاع `409 SCHEDULING_CONFLICT`.

تم تنفيذ `POST /api/v1/scheduling/groups` لإنشاء الجروب، ربط الطلاب بالكورس، وتوليد كل الجلسات المنتظمة من نطاق التاريخ والأيام الأسبوعية.

تم تنفيذ دورة طلبات `EXTRA` و`MAKEUP`، وطلبات استبدال المدرب، عروض المدربين المتاحين، قرارات الإدارة، التقييمات، والإشعارات الداخلية. تفاصيل الـAPI في `backend/SESSION_LIFECYCLE_API_CONTRACT.md`.
