# Scheduling module

هذا أول business module بعد auth/tenancy، ومبني على Sequence Diagram رقم 1.

## Contract

`POST /api/v1/scheduling/check-conflict` يفحص داخل branch:

1. Instructor overlap.
2. Classroom overlap.
3. Kit quantities.
4. Student double booking.
5. Branch-hours hook (موجود في contract كـ`BranchHours` وسيُربط بعد إضافة operating-hours entity).

إنشاء Session الفعلي يجب أن يستخدم نفس `ConflictService` داخل transaction PostgreSQL بمستوى `Serializable`، ثم يحفظ Session وKitAssignments معًا أو يرجع `409 SCHEDULING_CONFLICT`.

الحالة الحالية هي check-only slice؛ لا يوجد create-session endpoint بعد.
